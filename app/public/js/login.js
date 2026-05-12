// Update error message based on login attempt
async function checkLoginAttempts() {
    // const response = await fetch("../json/login_attempt.json");
    // const form_data = await response.json();

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
    const username = document.getElementById("username_input").value;
    const password = document.getElementById("password_input").value;
    fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
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
}

//checkLoginAttempts();
loginbtn = document.getElementById("login_btn")

loginbtn.addEventListener("click", (event) => {
    event.preventDefault();
    checkLoginAttempts();
})