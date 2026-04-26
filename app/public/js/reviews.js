const params = new URLSearchParams(window.location.search);

const gameID = params.get("g");

console.log(gameID);

function fetchGame(){
    fetch(`/gamereview?g=${gameID}`)
    .then(response => {
            if (!response.ok) {
                console.error('Server returned an error:', response.statusText);
                throw new Error('Failed to fetch search results');
            }
            return response.json();
        })
    .then(data => {
        console.log(data)
        
        let gameList = document.getElementById('gameList');
        for(let i = 0; i < data.length; i++) {
            
            let title = data[i].postTitle;
            let name = data[i].userName;
            let content = data[i].postContent;
            let score = data[i].postReviewScore;
            let time = data[i].timestamp;
            let date = new Date(time)
            let timestamp = date.toLocaleString("en-gb")
            let rating = "User Rating: " + score;

            let gameContainer = document.createElement('article');
            gameContainer.classList.add("games");
            let fig = document.createElement('figure');
            fig.className = "gameFig";
            gameContainer.appendChild(fig);



            let figcap = document.createElement('figcaption');
            figcap.className = "gameFigCap"
            fig.appendChild(figcap);


            let nameContainer = document.createElement('h3');
            nameContainer.textContent = name;
            figcap.appendChild(nameContainer);

            let timeContainer = document.createElement('h5');
            timeContainer.textContent = timestamp;
            figcap.appendChild(timeContainer);

            let contentContainer = document.createElement('h4');
            contentContainer.textContent = content;
            figcap.appendChild(contentContainer);

            let ratingContainer = document.createElement('p');
            ratingContainer.textContent = rating;
            figcap.appendChild(ratingContainer);
            //go to game reviews page when pressing "view reviews"

            gameList.insertBefore(gameContainer, document.getElementById("br")[0]);
        }
        
    })
    .catch(error => console.error('Error fetching search results:', error));

}
function fetchGameName(){
    fetch(`/gamereviewname?g=${gameID}`)
    .then(response => {
            if (!response.ok) {
                console.error('Server returned an error:', response.statusText);
                throw new Error('Failed to fetch search results');
            }
            return response.json();
        })
    .then(data => {
        document.getElementById("reviewGameName").textContent = data[0].gameName;
        
        
    })
    .catch(error => console.error('Error fetching search results:', error));

}
fetchGameName();
fetchGame();