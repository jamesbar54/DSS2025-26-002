// Update error message based on login attempt
async function checkSignupResult() {

    const username = document.getElementById("username_input").value;
    const email = document.getElementById("email_input").value;
    const password = document.getElementById("password_input").value;
    const passwordC = document.getElementById("passwordConfirm_input").value;
    fetch("/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            email: email,
            password: password,
            passwordC: passwordC
        })
    })
    
    .then(async response => {
        const resp = await response.text();
        if (!response.ok) {
            document.getElementById("errortext").textContent = resp;
            throw new Error(err);
        }
        else
        {
            window.location.href = `/html/index.html`;
        }
    response.json()})
    .then(data => {
        console.log("it work yippee")
    })
    .catch(error => {
        console.error("Error:", error);
    });
    // const response = await fetch("../json/signup_result.json");
    // const form_data = await response.json();

    // //Remove any pre-existing error message, if present
    // if(document.getElementById("signup_error") !== null) {
    //     document.getElementById("signup_error").parentNode.removeChild(document.getElementById("signup_error"));
    // }

    // //Only creates a new error message if an error is returned (not null)
    // if (form_data.result !== "null")
    // {
    //     let error_msg = document.createElement("p");
    //     error_msg.id = "signup_error";
    //     error_msg.classList.add("error");

    //     const err = form_data.result;
    //     switch (err)
    //     {
    //         case "nullFields":
    //             error_msg.textContent = "Please fill out all fields.";
    //             break;
    //         case "mismatchPasswords":
    //             error_msg.textContent = "Passwords do not match.";
    //             break;
    //         case "serverError":
    //             error_msg.textContent = "There was an error with the server.";
    //             break;
    //         case "badInputs":
    //             error_msg.textContent = "Invalid username/email.";
    //             break;
    //         case "badPassword":
    //             error_msg.textContent = "Password is too weak.";
    //     }
        
    //     document.querySelector("#login_btn").parentNode.insertBefore(error_msg, document.querySelector("#login_btn"));
    // }






    // Inform user they need to fill out the fields on the login form
    // if(form_data.username === "null" || form_data.password === "null") {
    //     document.getElementById("login_error").parentNode.removeChild(document.getElementById("login_error"));
    // }
    // if(form_data.username === "" || form_data.password === "") {
    //     if(document.getElementById("login_error") !== null) {
    //         document.getElementById("login_error").parentNode.removeChild(document.getElementById("login_error"));
    //     }

    //     let error_msg = document.createElement("p");
    //     error_msg.id = "login_error";
    //     error_msg.textContent = "Please fill out the login fields.";
    //     error_msg.classList.add("error");
    //     document.querySelector("#login_btn").parentNode.insertBefore(error_msg, document.querySelector("#login_btn"));

    // } else if(form_data.success == false) { // Inform user they have entered the incorrect password

    //     if(document.getElementById("login_error") !== null) {
    //         document.getElementById("login_error").parentNode.removeChild(document.getElementById("login_error"));
    //     }

    //     let error_msg = document.createElement("p");
    //     error_msg.id = "login_error";
    //     error_msg.textContent = "Incorrect username or password.";
    //     error_msg.classList.add("error");
    //     document.querySelector("#login_btn").parentNode.insertBefore(error_msg, document.querySelector("#login_btn"));

    // } else {
    //     if(document.getElementById("login_error") !== null) {
    //         document.getElementById("login_error").parentNode.removeChild(document.getElementById("login_error"));
    //     }
    // }
}

//checkSignupResult();
loginbtn = document.getElementById("login_btn")

loginbtn.addEventListener("click", (event) => {
    event.preventDefault();
    checkSignupResult();
})
