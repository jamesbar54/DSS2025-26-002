// Function to add username in top right corner of every page after user has logged in
async function displayUsername() {
    // const response = await fetch("app/getuserdetails");
    // const user_data = await response.json();

    // document.querySelector("#login_link").textContent = user_data.username;

    fetch(`/getusername`)
    .then(response => {
        if(!response.ok){
            console.error('Server returned an error:', response.statusText);
            throw new Error('Failed to fetch username results');
        }

        return response.json();
    })
    .then(data => {
        console.log(data[0].userName);

        document.querySelector("#login_link").textContent = data[0].userName;
    });
}

displayUsername();