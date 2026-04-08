require('dotenv').config(); //needed for database connection with .env

const express = require('express')
const app = express();
const port = 3000;

//Database connection
const { Client } = require('pg');
const client = new Client({ 
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

// Landing page
app.get('/', (req, res) => {
    /// send the static file
    res.sendFile(__dirname + '/public/html/login.html', (err) => {
        if (err){
            console.log(err);
        }
    })
});

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

// Reset login_attempt.json when server restarts
let login_attempt = {"username" : "null", "password" : "null", "success":false};
let data = JSON.stringify(login_attempt);
fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

// Store who is currently logged in
let currentUser = null;

// Login POST request
app.post('/login',function(req, res){

    // Get username and password entered from user
    var username = req.body.username_input;
    console.log(username);
    var password = req.body.password_input;
    console.log(password);

    client.query('SET SEARCH_PATH TO "gameBlog", public;', (err) => {
        if (err) {
            console.error("Error setting search path:", err);
            return res;
        }

        client.query(`SELECT * FROM "UsersTable" WHERE "userName" = '${username}' and "userPassHash" = '${password}';`, (err, resp) => {
            if (err) {
                console.error("Database query error:", err);
                return res;
            } else {
                console.log(resp.rowCount)

                if(resp.rowCount == 1){
                    // Update login_attempt with credentials
                    let login_attempt = {"username" : username, "password" : password, "success":true};
                    let data = JSON.stringify(login_attempt);
                    fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

                    // Update current user upon successful login
                    currentUser = req.body.username_input;

                    // Redirect to home page
                    res.sendFile(__dirname + '/public/html/index.html', (err) => {
                        if (err){
                            console.log(err);
                        }
                    })
                }else if(resp.rowCount == 0){
                    // Update login_attempt with credentials used to log in
                    let login_attempt = {"username" : username, "password" : password, "success":false};
                    let data = JSON.stringify(login_attempt);
                    fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

                    // Redirect back to login page
                    res.sendFile(__dirname + '/public/html/login.html', (err) => {
                        if (err){
                            console.log(err);
                        }
                    });
                }
            }
        })
    })
});

// signup POST request
app.post('/signup', async function(req, res){

    //gets inputted fields
    var username = req.body.username_input;
    var email = req.body.email_input;
    var password = req.body.password_input;
    var passwordC = req.body.passwordConfirm_input;

    //check if any null fields
    if (username === "" || email === "" || password === "" || passwordC === "")
    {
        // Send error message to signup.js (NOT ALL FIELDS FILLED IN)
        console.log("NULL FIELDS");
        // Redirect to signup
        res.sendFile(__dirname + '/public/html/signup.html', (err) => {
            if (err){
                console.log(err);
            }
        });
    }

    //The next 4 checks should all have the same error message (invalid inputs) to avoid account enumeration
    //(the console.logs are temporary and for debugging)

    //check if username is valid (length)
    else if(username.length > 32)
    {
        // Send error message to signup.js
        console.log("TOO LONG USERNAME");
        res.sendFile(__dirname + '/public/html/signup.html', (err) => {
            if (err){
                console.log(err);
            }
        });
    }
    //check if email is valid (length, contains 1 @)

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
            // Send error message to signup.js (SERVER ERROR)
            console.log("DATABASE ERROR");
            res.sendFile(__dirname + '/public/html/signup.html', (err) => {
                if (err){
                    console.log(err);
                }
            });
        }
        else if (numberOfMatches !== 0) // other users with the same name/email
        {
            // Send error message to signup.js (BAD INPUTS)
            console.log("EXISTING NAME OR EMAIL");
            res.sendFile(__dirname + '/public/html/signup.html', (err) => {
                if (err){
                    console.log(err);
                }
            });
        }
    
        //check if password is valid (length, check against common passwords)

        //check if passwords don't match
        else if(password !== passwordC) {

            // Send error message to signup.js (PASSWORDS DONT MATCH)
            console.log("MISMATCHING PASSWORDS");
            res.sendFile(__dirname + '/public/html/signup.html', (err) => {
                if (err){
                    console.log(err);
                }
            });
        }
    }
});

// Make a post POST request
app.post('/makepost', function(req, res) {

    // Read in current posts
    const json = fs.readFileSync(__dirname + '/public/json/posts.json');
    var posts = JSON.parse(json);

    // Get the current date
    let curDate = new Date();
    curDate = curDate.toLocaleString("en-GB");

    // Find post with the highest ID
    let maxId = 0;
    for (let i = 0; i < posts.length; i++) {
        if (posts[i].postId > maxId) {
            maxId = posts[i].postId;
        }
    }

    // Initialise ID for a new post
    let newId = 0;

    // If postId is empty, user is making a new post
    if(req.body.postId == "") {
        newId = maxId + 1;
    } else { // If postID != empty, user is editing a post
        newId = req.body.postId;

        // Find post with the matching ID, delete it from posts so user can submit their new version
        let index = posts.findIndex(item => item.postId == newId);
        posts.splice(index, 1);
    }

    // Add post to posts.json
    posts.push({"username": currentUser , "timestamp": curDate, "postId": newId, "title": req.body.title_field, "content": req.body.content_field});

    fs.writeFileSync(__dirname + '/public/json/posts.json', JSON.stringify(posts));

    // Redirect back to my_posts.html
    res.sendFile(__dirname + "/public/html/my_posts.html");
 });

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