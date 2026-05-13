// Function to add username in top right corner of every page after user has logged in
async function onLoadDisplayUsername() 
{
    fetch(`/getusername`)
    .then(async response => {
        const resp = await response.json();
        if(!response.ok){
            console.error('Server returned an error:', response.statusText);
            throw new Error('Failed to fetch username results');
        }

        return resp;
    })
    .then(data =>{
        username = data.userName;
        if(username != null && username != ''){
             document.querySelector("#login_link").textContent = username;
        } else{
            document.querySelector("#login_link").textContent = "Logged Out";

            document.getElementById("account_btn").remove();
            document.getElementById("logout_btn").textContent = "Log In";
        }

        if(document.querySelector("#account_text")){
            document.querySelector("#account_text").textContent = username;
        }
       
    })
}

onLoadDisplayUsername();

function logoutAccount(){
    fetch("/logout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
        })
    })
    .then(response => {
        if(!response.ok){
            console.error('Server returned an error:', response.statusText);
            throw new Error('Failed to logout');
        }
    })

    window.location = "../html/login.html"
}


logoutButton = document.getElementById("logout_btn");

logoutButton.addEventListener("click", (event) => {
    event.preventDefault();
    logoutAccount();
})