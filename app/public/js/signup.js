// Update error message based on login attempt
async function checkSignupResult() {
    const response = await fetch("../json/signup_result.json");
    const form_data = await response.json();

    //Remove any pre-existing error message, if present
    if(document.getElementById("signup_error") !== null) {
        document.getElementById("signup_error").parentNode.removeChild(document.getElementById("signup_error"));
    }

    //Only creates a new error message if an error is returned (not null)
    if (form_data.result !== "null")
    {
        let error_msg = document.createElement("p");
        error_msg.id = "signup_error";
        error_msg.classList.add("error");

        const err = form_data.result;
        switch (err)
        {
            case "nullFields":
                error_msg.textContent = "Please fill out all fields.";
                break;
            case "mismatchPasswords":
                error_msg.textContent = "Password and Confirm Password do not match.";
                break;
            case "serverError":
                error_msg.textContent = "There was an error with the server.";
                break;
            case "badInputs":
                error_msg.textContent = "Invalid username/email/password.";
                break;
        }
        
        document.querySelector("#login_btn").parentNode.insertBefore(error_msg, document.querySelector("#login_btn"));
    }






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

checkSignupResult();
