
function DeleteAccount()
{
    console.log("Run");

    fetch("/deleteuser", {
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
            throw new Error('Failed to delete account');
        }
    })

    window.location = "../html/login.html"
}


deleteAccount = document.getElementById("dlt_btn");

deleteAccount.addEventListener("click", (event) => {
    event.preventDefault();
    DeleteAccount();
})