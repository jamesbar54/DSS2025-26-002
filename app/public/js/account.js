async function onLoadDisplayUsername() 
{
    fetch(`/getusername`)
    .then(response => {
        if(!response.ok){
            console.error('Server returned an error:', response.statusText);
            throw new Error('Failed to fetch username results');
        }

        return response.json();
    })
    .then(data =>{
        console.log(data[0].userName);

        document.querySelector("#account_text").textContent = data[0].userName;
    })
}

onLoadDisplayUsername();

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
}


deleteAccount = document.getElementById("dlt_btn");

deleteAccount.addEventListener("click", (event) => {
    event.preventDefault();
    DeleteAccount();
})