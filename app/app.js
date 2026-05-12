require('dotenv').config(); //needed for database connection with .env

const express = require('express');
const app = express();
const port = 3000;


const passport = require('passport'); //middleware library to handle oauth
const GoogleStrategy = require('passport-google-oauth20').Strategy; //oauth passport strategy
const session = require('express-session'); //session management
const rateLimit = require('express-rate-limit')
const ejs = require('ejs');

const limiter = rateLimit({
	windowMs: 3 * 60 * 1000, // 3 minutes
	limit: 10, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
	message: {error: 'Too many requests, please try again later.'}
})


const crypto = require('crypto'); //Node.js module for hashing / random number generating
const argon2 = require('argon2'); //for hashing

//Database connection
const { Pool } = require('pg');
const client = new Pool({ 
    user: process.env.user,
    host: process.env.host, 
    database: process.env.database, 
    password: process.env.password, 
    port: process.env.port
});

client.connect() .then(() => { console.log('Connected to PostgreSQL database!'); })
.catch((err) => { console.error('Error connecting to the database:', err); });

var bodyParser = require('body-parser');
const fs = require('fs');

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', __dirname + '/public/html');
app.engine('html', require('ejs').renderFile);

//Session middleware config
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false, //dont re-save session to store if no changes made
    saveUninitialized: false //don't create a session until something is stored
    //last 2 values are memory and performance things.
}))

//Passport config
app.use(passport.initialize());
app.use(passport.session());

//only storing userID (keeps cookie small)
passport.serializeUser((user,done) => {
    done(null, user.userID);
});

//takes userid stored in session and fetches full user obj from db
passport.deserializeUser(async(id,done) => {
    try{
        await client.query('SET SEARCH_PATH TO "gameBlog", public;');
        const result = await client.query(
            `SELECT * FROM "UsersTable" WHERE "userID" = $1`, [id]
        );
        if (result.rows.length === 0){
            return done(null,false);
        }
        done(null,result.rows[0]); //attach user row to req.user
    } catch (err) {
        done(err,null); //using passports error handler
    }
});

//google oAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID, //client id needs to be in .env
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, //also
    callbackURL: '/auth/google/callback'
}, async(accessToken, refreshToken, profile, done) =>{ //params needed for access and data
    try{
        await client.query('SET SEARCH_PATH TO "gameBlog", public;');

        const existing = await client.query(
            `SELECT * FROM "UsersTable" WHERE "userName" = $1 AND "oauthProvider" = 'google'`,
            [profile.id]
        );

        if(existing.rows.length > 0){
            //user already exists, log in
            return done(null, existing.rows[0]);
        }
        
        //checking if email is already registered as normal account
        const emailCheck = await client.query(
            `SELECT * FROM "UsersTable" WHERE "userEmail" = $1 AND "oauthProvider" IS NULL`,
            [profile.emails[0].value]
        );

        if (emailCheck.rows.length > 0){
            //deny ouath login as email alredy has an account with password
            console.log("OAuth login denied - email already registered as regular account:", profile.emails[0].value);
            return done(null, false, {message: "Email already registered with a standard account"}
            );
        }

        //new user (creating account)
        //finding lowest unused Uid
        const idResult = await client.query(`SELECT "userID" FROM "UsersTable";`);
        let newUserID = 0;
        const usedIDs = idResult.rows.map(r => parseInt(r.userID));
        while (usedIDs.includes(newUserID)) newUserID++;

        //inserting new user (no password hash as no password)
        //oauth provider set to 'google' so we know who is a google and who isnt a google
        await client.query(
            `INSERT INTO "UsersTable"("userID", "userName", "userEmail", "userType", "oauthProvider")
             VALUES ($1, $2, $3, 'Standard', 'google')`,
             [newUserID, profile.id, profile.emails[0].value]
        );

        //fetch new user and pass to passport
        const newUser = await client.query(
            `SELECT * FROM "UsersTable" WHERE "userID" = $1`,
            [newUserID]
        );
        return done (null, newUser.rows[0]);

    }catch (err){
        return done(err, null) //passport error handler
    }
}))

//google oauth routing
app.get('/auth/google',
    passport.authenticate('google', {scope: ['profile', 'email']}) //scope is what info we want(profile is name and picture)
);

//callback that google redirects to after user login
//redirects to either /login if fail, or sets user to current user and redirects to home
app.get('/auth/google/callback',
    passport.authenticate('google', {failureRedirect: '/'}),
    (req, res) => {
        currentUser = req.user.userName;
        let login_attempt = {"username": req.user.userEmail, "password": "null", "success": true };
        fs.writeFileSync(__dirname + '/public/json/login_attempt.json', JSON.stringify(login_attempt));
       res.redirect('/html/index.html');
    }
);



// Landing page
// app.get('/', (req, res) => {
//     if(req.user?.userID == null){
//          /// send the static file
//         res.sendFile(__dirname + '/public/html/login.html', (err) => {
//             if (err){
//                 console.log(err);
//             }
//         })
//     }  else{
//         res.sendFile(__dirname + '/public/html/index.html', (err) => {
//             if (err){
//                 console.log(err);
//             }
//         })
//     } 
// });

app.get('/game', (req, res) => {

    client.query('SET SEARCH_PATH TO "gameBlog", public;', (err) => {
        if (err) {
            console.error("Error setting search path:", err);
            return res;
        }

        const queryString = `SELECT * FROM "GamesTable";`;
        client.query(queryString, (err, resp) => {
            if (err) {
                console.error("Database query error:", err);
                return res;
            }
            return res.status(200).json(resp.rows);
        })
    })
})

//game review page to grab the data of the game
app.get('/gamereview', async (req, res) => {
    const gameID = req.query.g;
    console.log(gameID)
    try{
        await client.query('SET SEARCH_PATH TO "gameBlog", public;')
        const gameDetails = await client.query(`SELECT "PostsTable".*, "UsersTable"."userName" FROM "PostsTable" JOIN "UsersTable" ON "PostsTable"."userID" = "UsersTable"."userID" WHERE "PostsTable"."gameID" = $1`, [gameID]) 
        res.status(200).json(gameDetails.rows);  
    } catch(err){
        console.error(err);
        res.status(500).json({ error: "There was an error with the server" });
    }

})

app.get('/gamereviewname', async (req, res) => {
    const gameID = req.query.g;
    try{
        await client.query('SET SEARCH_PATH TO "gameBlog", public;')
        const gameName = await client.query(`SELECT "gameName" FROM "GamesTable" WHERE "gameID" = $1`, [gameID])
        res.status(200).json(gameName.rows);
    }catch(err){
        console.error(err);
        res.status(500).json({error: "There was an error with the server"})
    }
}) 
    
app.get('/gamescoreaverage', async (req,res) => {
    try{
        await client.query('SET SEARCH_PATH TO "gameBlog", public;')
        const gameScore = await client.query(`SELECT "PostsTable"."gameID", AVG("postReviewScore") AS "averageScore" FROM "PostsTable" JOIN "GamesTable" ON "PostsTable"."gameID" = "GamesTable"."gameID" WHERE "postType" = 'Review' GROUP BY "PostsTable"."gameID"`)
        res.status(200).json(gameScore.rows)
    }catch(err){
        console.error(err);
        res.status(500).json({error: "There was an error with the server"})
    }
})

app.get('/getmyposts', async (req, res) => {
    const userID = req.user?.userID;
    console.log(userID)
    if(userID == null){
        return res.status(401).json({ error: "Not logged in" });
    }
    try{
        
        await client.query('SET SEARCH_PATH TO "gameBlog", public;')
        const getMyPosts = await client.query(`SELECT * FROM "PostsTable" WHERE "postType" = 'Standard' AND "userID" = $1`, [userID])
        res.status(200).json(getMyPosts.rows)
    }catch(err){
        console.error(err);
        res.status(500).json({error: "There was an error with the server"})
    }
})

app.get('/getmyreviews', async (req, res) => {
    const userID = req.user?.userID;
    if(userID == null){
        return res.status(401).json({ error: "Not logged in" });
    }
    try{
        await client.query('SET SEARCH_PATH TO "gameBlog", public;')
        const getMyPosts = await client.query(`SELECT * FROM "PostsTable" WHERE "postType" = 'Review' AND "userID" = $1`, [userID])
        res.status(200).json(getMyPosts.rows)
    }catch(err){
        console.error(err);
        res.status(500).json({error: "There was an error with the server"})
    }
})

app.get('/getusername', async (req, res) => {
    try{
        var userID = req.user?.userID;

        await client.query('SET SEARCH_PATH TO "gameBlog", public;')

        const getUsename = await client.query(`select "userName" from "UsersTable" WHERE "userID" = $1`, [userID]);

        if(getUsename.rowCount == 1){
            res.status(200).json(getUsename.rows[0]);
        }else(
            res.status(200).json("Logged out")
        )
    }catch(err){
        console.error(err);
        res.status(500).json({error: "There was an error with the server"})
    }
});

app.post(`/deleteuser`, async function(req, res){
    try{
        var userID = req.user?.userID;

        req.session.destroy((err) =>{
            if(err) console.error(err);
            res.clearCookie('connect.sid', {path: '/'});
            res.redirect('/')
        });

        

        await client.query('SET SEARCH_PATH TO "gameBlog", public;')

        await client.query('BEGIN');

        await client.query(`UPDATE "PostsTable" SET "userID" = null WHERE "userID" = $1;`, [userID]);

        await client.query(`DELETE FROM "UserPassSaltsTable" WHERE "userID" = $1;`, [userID]);

        await client.query(`DELETE FROM "UsersTable" WHERE "userID" = $1;`, [userID]);

        await client.query(`COMMIT`);

    }catch(err){
        await client.query('ROLLBACK');

        console.error(err);
        res.status(500).json({error: "There was an error with the server"})
    }
})


// Reset login_attempt.json when server restarts
let login_attempt = {"username" : "null", "password" : "null", "success":false};
let data = JSON.stringify(login_attempt);
fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

//does the same thing for signup info
fs.writeFileSync(__dirname + '/public/json/signup_result.json', JSON.stringify({"result":"null"}));

// Store who is currently logged in
let currentUser = null;

//Function for hashing an input string
//currently does literally nothing
async function HashString(input)
{
    const hashOut = await argon2.hash(input);
    return hashOut;
}

//For account enumeration - calculates how much time has passed, forces wait until the nearest second
async function ExtraWait(input)
{
    //console.timeLog("a");
    var delay = performance.now() - input;
    delay = delay % 1000;
    delay = 1000 - delay;

    // while (true)
    // {
    //     if (performance.now() >= input + delay)
    //     {
    //         return;
    //     }
    // }

    await new Promise(resolve => setTimeout(resolve, delay));
    //console.timeEnd("a");
}

// Login POST request
app.post('/login', limiter, async function(req, res){

    //csrf check
    if(req.body.csrf_token !== req.session.csrfToken) {
        return res.status(403).send('Invalid CSRF token');
    }

    //console.time("a");
    var startTime = performance.now();

    // Get username and password entered from user
    var username = req.body.username_input;
    //console.log(username);
    var password = req.body.password_input;

    //console.log(password);

    client.query('SET SEARCH_PATH TO "gameBlog", public;', async (err) => {
        if (err) {
            console.error("Error setting search path:", err);
            return res;
        }
        
        try
        {
            var id;
            var salt;
            var passHash;
            
            //get ID - also filters out Oauth accounts by checking if provider is null
            const idQuery = `SELECT "userID" FROM "UsersTable" WHERE ("userName" = $1 OR "userEmail" = $1) AND "oauthProvider" IS NULL;`;
            const idQueryVal = [username];
            client.query(idQuery, idQueryVal, async (err, resp) => {
                //console.log("rowCount: " + resp.rowCount);
                if (resp.rowCount == 0)
                {
                    //Username/email not found (or its an Oauth)
                    //console.log("No username/email, or Oauth");

                    await ExtraWait(startTime);

                    //Update login_attempt with credentials used to log in
                    let login_attempt = {"username" : username, "password" : password, "success":false};
                    let data = JSON.stringify(login_attempt);
                    fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

                    // Redirect back to login page
                    const token = crypto.randomBytes(32).toString('hex');
                    req.session.csrfToken = token;
                    req.session.save((err) => {
                        if(err) console.error(err);
                        res.render('login.html', { token });
                    });
                }
                else
                {
                    id = resp.rows[0].userID;
                    //console.log("id: " + id);


                    //get passSalt and passHash, from id
                    const saltHashQuery = `SELECT "passSalt", "userPassHash" FROM "UsersTable" JOIN "UserPassSaltsTable" ON "UsersTable"."userID" = "UserPassSaltsTable"."userID" WHERE "UsersTable"."userID" = $1;`;
                    const saltHashQueryVal = [id];
                    client.query(saltHashQuery, saltHashQueryVal, async (err, resp) => {
                        //console.log("rowCount: " + resp.rowCount);
                        if (resp.rowCount == 0)
                        {
                            //Missing a password and/or salt - if this happens, something's gone very wrong
                            //console.log("No password/salt");

                            await ExtraWait(startTime);

                            // Update login_attempt with credentials used to log in
                            let login_attempt = {"username" : username, "password" : password, "success":false};
                            let data = JSON.stringify(login_attempt);
                            fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

                            // Redirect back to login page
                            const token = crypto.randomBytes(32).toString('hex');
                            req.session.csrfToken = token;
                            req.session.save((err) => {
                                if(err) console.error(err);
                                res.render('login.html', { token });
                            });
                        }
                        else
                        {
                            salt = resp.rows[0].passSalt;
                            passHash = resp.rows[0].userPassHash;

                            //console.log("sale: " + salt);
                            //console.log("hash: " + passHash);


                            //Use argon2's function to check if the hash is correct
                            if (await argon2.verify(passHash, (password + salt)))
                            {
                                // password match
                                //console.log("correct password");

                                await ExtraWait(startTime);

                                // Update login_attempt with credentials
                                let login_attempt = {"username" : username, "password" : password, "success":true};
                                let data = JSON.stringify(login_attempt);
                                fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);


                                //fetch full user row
                                const userResult = await client.query(
                                    `SELECT * FROM "UsersTable" WHERE "userID" = $1`, [id]
                                );
                                const user = userResult.rows[0];

                                //null check
                                if(!user) {
                                    const token = crypto.randomBytes(32).toString('hex');
                                    req.session.csrfToken = token;
                                    req.session.save((err) => {
                                        if(err) console.error(err);
                                        res.render('login.html', { token });
                                    });
                                    return;
                                }


                                // Update current user upon successful login
                                currentUser = req.body.username_input;

                                req.login(user,(err) =>{
                                    if(err){
                                        console.error(err);
                                        return res.status(500).send('Login error');
                                    }
                                    res.redirect('/html/index.html');
                                }); 

                                

                                
                            }
                            else
                            {
                                // password did not match
                                //console.log("incorrect password");

                                await ExtraWait(startTime);

                                // Update login_attempt with credentials used to log in
                                let login_attempt = {"username" : username, "password" : password, "success":false};
                                let data = JSON.stringify(login_attempt);
                                fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

                                // Redirect back to login page
                                const token = crypto.randomBytes(32).toString('hex');
                                req.session.csrfToken = token;
                                req.session.save((err) => {
                                    if(err) console.error(err);
                                    res.render('login.html', { token });
                                });
                            }
                        }
                    });
                }
            });

  


        }
        catch (error)
        {
            console.error(error);
            return;
        }


        // ------ JAMES's method (pre-hash) ------

        // const saltQuery = `SELECT "passSalt" FROM "UserPassSaltsTable" s, "UsersTable" u WHERE s."userID" = u."userID" and u."userName" = $1;`
        // const saltValue = [username]
        // var salt
        // client.query(saltQuery, saltValue, (err, resp) => {
        //     console.log(resp.rows[0].passSalt)

        //     salt = resp.rows[0].passSalt

        //     console.log(salt)

        //     const signIn = `SELECT * FROM "UsersTable" WHERE "userName" = $1 and "userPassHash" = $2;`
        //     const signInValues = [username, HashString(password + salt)];

        //     client.query(signIn, signInValues, (err, resp) => {
        //     if (err) {
        //         console.error("Database query error:", err);
        //         return res;
        //     } else {
        //         console.log(resp.rowCount)

        //         if(resp.rowCount == 1){
        //             // Update login_attempt with credentials
        //             let login_attempt = {"username" : username, "password" : password, "success":true};
        //             let data = JSON.stringify(login_attempt);
        //             fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

        //             // Update current user upon successful login
        //             currentUser = req.body.username_input;

        //             // Redirect to home page
        //             res.sendFile(__dirname + '/public/html/index.html', (err) => {
        //                 if (err){
        //                     console.log(err);
        //                 }
        //             })
        //         }else if(resp.rowCount == 0){
        //             // Update login_attempt with credentials used to log in
        //             let login_attempt = {"username" : username, "password" : password, "success":false};
        //             let data = JSON.stringify(login_attempt);
        //             fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

        //             // Redirect back to login page
        //             res.sendFile(__dirname + '/public/html/login.html', (err) => {
        //                 if (err){
        //                     console.log(err);
        //                 }
        //             });
        //         }
        //     }
        // })
        // })


        // client.query(signIn, signInValues, (err, resp) => {
        //     if (err) {
        //         console.error("Database query error:", err);
        //         return res;
        //     } else {
        //         console.log(resp.rowCount)

        //         if(resp.rowCount == 1){
        //             // Update login_attempt with credentials
        //             let login_attempt = {"username" : username, "password" : password, "success":true};
        //             let data = JSON.stringify(login_attempt);
        //             fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

        //             // Update current user upon successful login
        //             currentUser = req.body.username_input;

        //             // Redirect to home page
        //             res.sendFile(__dirname + '/public/html/index.html', (err) => {
        //                 if (err){
        //                     console.log(err);
        //                 }
        //             })
        //         }else if(resp.rowCount == 0){
        //             // Update login_attempt with credentials used to log in
        //             let login_attempt = {"username" : username, "password" : password, "success":false};
        //             let data = JSON.stringify(login_attempt);
        //             fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

        //             // Redirect back to login page
        //             res.sendFile(__dirname + '/public/html/login.html', (err) => {
        //                 if (err){
        //                     console.log(err);
        //                 }
        //             });
        //         }
        //     }
        // })
    })
});

//Function for checking if an email is valid
//Currently only checks if theres exactly 1 @ symbol
function CheckValidEmail(input)
{
    if ((String(input).split("@").length - 1) === 1)
    {
        return true;
    }
    else { return false; }
}

//Function for checking password against a list of common passwords
//also checks for whitespaces
//Common password list obtained from:
//https://github.com/danielmiessler/SecLists/blob/master/Passwords/Common-Credentials/10k-most-common.txt
function CheckCommonPassword(input)
{
    if (/\s/.test(input))
    {
        return true;
    }
    else
    {
        const wholeText = fs.readFileSync("10k-most-common.txt", "utf-8");
        const lines = wholeText.split("\n");

        for (let i=0;i<lines.length;i++)
        {
            if (lines[i] === input)
            {
                return true;
                break
            }
        }
    }
    return false;
}

//function for randomly generating a 16-character string for the Salt
function GenerateSalt()
{
    return crypto.randomBytes(8).toString('hex');
}

app.post(`/logout`, async function(req, res){
    try{
        var userID = req.user?.userID;

        req.session.destroy((err) =>{
            if(err) console.error(err);
            res.clearCookie('connect.sid', {path: '/'});
            res.redirect('/');

        });

        
    }catch(err){
        console.error(err);
        res.status(500).json({error: "There was an error with the server"})
    }
})


// signup POST request
app.post('/signup', limiter, async function(req, res){

    //csrf check
    if (req.body.csrf_token !== req.session.csrfToken) {
        return res.status(403).send('Invalid CSRF token');
    }

    var startTime = performance.now();

    //gets inputted fields
    var username = req.body.username_input;
    var email = req.body.email_input;
    var password = req.body.password_input;
    var passwordC = req.body.passwordConfirm_input;

    //check if any null fields
    if (username === "" || email === "" || password === "" || passwordC === "")
    {
        await ExtraWait(startTime);

        fs.writeFileSync(__dirname + '/public/json/signup_result.json', JSON.stringify({"result":"nullFields"}));

        //console.log("NULL FIELDS"); //These console.logs are temporary and for debugging
        // Redirect to signup
        const token = crypto.randomBytes(32).toString('hex');
        req.session.csrfToken = token;
        req.session.save((err) => {
            if(err) console.error(err);
            res.render('signup.html', { token });
        });
    }

    //The next 4 checks should all have the same error message (invalid inputs) to avoid account enumeration


    //check if username is valid (length, NOT A VALID EMAIL)
    else if((username.length > 32) || CheckValidEmail(username))
    {
        await ExtraWait(startTime);

        fs.writeFileSync(__dirname + '/public/json/signup_result.json', JSON.stringify({"result":"badInputs"}));

        //console.log("BAD USERNAME");

        const token = crypto.randomBytes(32).toString('hex');
        req.session.csrfToken = token;
        req.session.save((err) => {
            if(err) console.error(err);
            res.render('signup.html', { token });
        });
    }
    //check if email is valid (length, VALID EMAIL)
    else if((email.length > 320) || !CheckValidEmail(email))
    {
        await ExtraWait(startTime);

        fs.writeFileSync(__dirname + '/public/json/signup_result.json', JSON.stringify({"result":"badInputs"}));

        //console.log("BAD EMAIL");

        const token = crypto.randomBytes(32).toString('hex');
        req.session.csrfToken = token;
        req.session.save((err) => {
                if(err) console.error(err);
                res.render('signup.html', { token });
            });
    }

    //check if username or email is already taken
    else
    {
        let numberOfMatches = -1;
        try {
            await client.query('SET SEARCH_PATH TO "gameBlog", public;');
            
            const usernameEmailTakenCheck = `SELECT COUNT (*) FROM "UsersTable" WHERE ("userName" = $1 OR "userEmail" = $2);`;

            const values = [username, email];
        
            const result = await client.query(usernameEmailTakenCheck, values);
            numberOfMatches = parseInt(result.rows[0].count);

        } catch (error) {
            console.error(error);
            numberOfMatches = -1;
        }
        if (numberOfMatches === -1) // database error
        {
            await ExtraWait(startTime);

            fs.writeFileSync(__dirname + '/public/json/signup_result.json', JSON.stringify({"result":"serverError"}));

            //console.log("DATABASE ERROR");

            const token = crypto.randomBytes(32).toString('hex');
            req.session.csrfToken = token;
            req.session.save((err) => {
                if(err) console.error(err);
                res.render('signup.html', { token });
            });
        }
        else if (numberOfMatches !== 0) // other users with the same name/email
        {
            await ExtraWait(startTime);
            
            fs.writeFileSync(__dirname + '/public/json/signup_result.json', JSON.stringify({"result":"badInputs"}));

            //console.log("EXISTING NAME OR EMAIL");

            const token = crypto.randomBytes(32).toString('hex');
            req.session.csrfToken = token;
           req.session.save((err) => {
                if(err) console.error(err);
                res.render('signup.html', { token });
            });
        }
    
        //check if password is valid (length, check against common passwords)
        else if((password.length < 12) || CheckCommonPassword(password))
        {
            await ExtraWait(startTime);

            fs.writeFileSync(__dirname + '/public/json/signup_result.json', JSON.stringify({"result":"badPassword"}));

            //console.log("SHORT PASSWORD");

            const token = crypto.randomBytes(32).toString('hex');
            req.session.csrfToken = token;
            req.session.save((err) => {
                if(err) console.error(err);
                res.render('signup.html', { token });
            });
        }

        //check if passwords don't match
        else if(password !== passwordC)
        {
            await ExtraWait(startTime);

            fs.writeFileSync(__dirname + '/public/json/signup_result.json', JSON.stringify({"result":"mismatchPasswords"}));

            //console.log("MISMATCHING PASSWORDS");

            const token = crypto.randomBytes(32).toString('hex');
            req.session.csrfToken = token;
            req.session.save((err) => {
                if(err) console.error(err);
                res.render('signup.html', { token });
            });
        }

        else
        {
            //Currently no 2FA, need to change that

            try {
                await client.query('SET SEARCH_PATH TO "gameBlog", public;');
                
                //find an unused ID - OLD VERSION
                // let newUserID = 0;

                // const idCheck = `SELECT "userID" FROM "UsersTable";`;
                // const idResult = await client.query(idCheck);

                // let usedIDFlag = false;
                // let unfoundID = true;

                // while (unfoundID)
                // {
                //     console.log(newUserID);
                //     usedIDFlag = false;
                //     for (let i=0;i<idResult.rows.length;i++)
                //     {
                //         console.log("Comparing "+newUserID+" to database's "+parseInt(idResult.rows[i].userID));
                //         if (parseInt(idResult.rows[i].userID) === newUserID)
                //         {
                //             console.log("THEYRE THE SAME");
                //             usedIDFlag = true;
                //             break;
                //         }
                //     }
                //     if (!usedIDFlag)
                //     {
                //         unfoundID = false;
                //     }
                //     else
                //     {
                //         newUserID = newUserID + 1;
                //     }
                // }
                
                //find an unused ID - NEW VERSION
                const idResult = await client.query(`SELECT "userID" FROM "UsersTable";`);
                let newUserID = 0;
                const usedIDs = idResult.rows.map(r => parseInt(r.userID));
                while (usedIDs.includes(newUserID)) newUserID++;

                const newSalt = GenerateSalt();


                const newUser = `INSERT INTO "UsersTable"("userID", "userName", "userEmail", "userPassHash", "userType")
                    VALUES ($1, $2, $3, $4, 'Standard');`;

                const newUserValues = [newUserID, username, email, await HashString(password + newSalt)];
                await client.query(newUser, newUserValues);

                const newUserSalt = `INSERT INTO "UserPassSaltsTable"("userID", "passSalt")
                    VALUES ($1, $2);`;
                const newUserSaltValues = [newUserID, newSalt];
                await client.query(newUserSalt, newUserSaltValues);
                


                await ExtraWait(startTime);

                fs.writeFileSync(__dirname + '/public/json/signup_result.json', JSON.stringify({"result":"null"}));

                //console.log("GREAT SUCCESS");

                //TEMPORARY - send you to login page to login to your new account
                const token = crypto.randomBytes(32).toString('hex');
                req.session.csrfToken = token;
                req.session.save((err) => {
                    if(err) console.error(err);
                    res.render('login.html', { token });
                });

            } catch (error) {
                await ExtraWait(startTime);

                console.error(error);
                fs.writeFileSync(__dirname + '/public/json/signup_result.json', JSON.stringify({"result":"serverError"}));

                //console.log("DATABASE ERROR BUT VALID INFO");

                const token = crypto.randomBytes(32).toString('hex');
                req.session.csrfToken = token;
                req.session.save((err) => {
                    if(err) console.error(err);
                    res.render('signup.html', { token });
                });
                
            }  
        }
    }
});

//csrf token generation and page addition
app.get('/',(req, res) => {
    if (req.user?.userID == null){
        const token = crypto.randomBytes(32).toString('hex');
        req.session.csrfToken = token;
        req.session.save((err) => {
            if (err) console.error(err);
            res.render('login.html', { token });
        });
    } else {
        res.sendFile(__dirname + '/public/html/index.html');
    }
});
//signup page route
app.get('/signup', (req, res) => {
    const token = crypto.randomBytes(32).toString('hex');
    req.session.csrfToken = token;
    req.session.save((err) => {
        if (err) console.error(err);
        res.render('signup.html', { token });
    });
});

// Make a post POST request
app.post('/makepost', limiter, async function(req, res) {

    let curDate = new Date();
    curDate = curDate.toLocaleString("en-GB");
    const {title, content, postType, rating} = req.body
    try{
        await client.query('SET SEARCH_PATH TO "gameBlog", public;')
        const userID = req.user?.userID;
        if(userID == null){
            return res.status(401).json({ error: "Not logged in" });
        }
        const postID = await client.query(`SELECT MAX("postID") AS "maxPostID" FROM "PostsTable";`);

        if(postType == 'Review'){
            const gameID = await client.query(`SELECT "gameID" FROM "GamesTable" WHERE "gameName" = $1`, [title]);
            const duplicateReview = await client.query(`SELECT * FROM "PostsTable"  WHERE "userID" = $1 AND "gameID" = $2`, [userID, gameID.rows[0].gameID]);

            if (duplicateReview.rowCount > 0) {
                return res.status(400).send("You have already reviewed this game.");
            }
            const createReview = `INSERT INTO "PostsTable"("postID", "userID", "gameID", "postType", "postTitle", "postContent", "postReviewScore", timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;
            reviewVals = [postID.rows[0].maxPostID + 1, userID, gameID.rows[0].gameID, postType, title, content, rating, curDate]
            await client.query(createReview, reviewVals);

        }else if(postType == 'Standard'){
            const createPost = `INSERT INTO "PostsTable"("postID", "userID", "postType", "postTitle", "postContent", timestamp) VALUES ($1, $2, $3, $4, $5, $6)`;
            postVals = [postID.rows[0].maxPostID + 1, userID, postType, title, content, curDate]
            await client.query(createPost, postVals);
        }
        res.status(201).send("Posted successfully")
    }catch(error){
        console.error(error);
        res.status(500).json({ error: "There was an error with the server" });
    }
 });

 app.get('/getposts', (req, res) => {

    client.query('SET SEARCH_PATH TO "gameBlog", public;', (err) => {
        if (err) {
            console.error("Error setting search path:", err);
            return res.status(500).json({ error: "Database query error" });
        }
        // Selects everything from postsTable, username ONLY from userstable and does it with the userID from the poststable
        // It joins the 2 tables to get the username from userstable since posts only store userID
        const getPosts = `SELECT "PostsTable".*, "UsersTable"."userName" FROM "PostsTable" JOIN "UsersTable" ON "PostsTable"."userID" = "UsersTable"."userID" WHERE "PostsTable"."postType" = 'Standard';`;
        
        client.query(getPosts, async (err, resp) => {
            if (err) {
                console.error("Database query error:", err);
                return res;
            }
            // const postUser = await client.query(`SELECT "userName" FROM "UsersTable" WHERE "userID" = $1`, [resp.rows[0].postID])
            // console.table(resp.rows)
            return res.status(200).json(resp.rows);
        })
    })

 })

 // Delete a post POST request
 app.post('/deletepost', (req, res) => {

    // Read in current posts
    const json = fs.readFileSync(__dirname + '/public/json/posts.json');
    var posts = JSON.parse(json);

    // Find post with matching ID and delete it
    let index = posts.findIndex(item => item.postId == req.body.postId);
    posts.splice(index, 1);

    // Update posts.json
    fs.writeFileSync(__dirname + '/public/json/posts.json', JSON.stringify(posts));

    res.sendFile(__dirname + "/public/html/my_posts.html");
 });

app.listen(port, () => {
    console.log(`My app listening on port ${port}!`)
});