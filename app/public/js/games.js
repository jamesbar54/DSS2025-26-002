function fetchGames(){
    fetch(`/game`)
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
            let name = data[i].gameName;
            let gameDesc = data[i].gameDesc;
            let gameImg = data[i].gameImgUrl
            //random for now, until I fetch data for ratings 
            let rating = "User Rating: " + Math.floor(Math.random() * 10)

            let gameContainer = document.createElement('article');
            gameContainer.classList.add("games");
            let fig = document.createElement('figure');
            fig.className = "gameFig";
            gameContainer.appendChild(fig);

            let img = document.createElement('img');
            img.src = gameImg;
            img.className = "gameImage"

            let figcap = document.createElement('figcaption');
            figcap.className = "gameFigCap"
            fig.appendChild(img);
            fig.appendChild(figcap);
            
            let nameContainer = document.createElement('h3');
            nameContainer.textContent = name;
            figcap.appendChild(nameContainer);

            let usernameContainer = document.createElement('h5');
            usernameContainer.textContent = gameDesc;
            figcap.appendChild(usernameContainer);

            let contentContainer = document.createElement('p');
            contentContainer.textContent = rating;
            figcap.appendChild(contentContainer);

            let reviewsbtnwrapper = document.createElement('p')
            let reviewsbtn = document.createElement('a')

            reviewsbtnwrapper.className = 'reviewbtnwrapper'
            reviewsbtn.className = 'review_btn'
            reviewsbtn.textContent = 'View Reviews'

            reviewsbtnwrapper.appendChild(reviewsbtn)
            gameContainer.appendChild(reviewsbtnwrapper)

            gameList.insertBefore(gameContainer, document.getElementById("br")[0]);
        }
        
    })
    .catch(error => console.error('Error fetching search results:', error));

    
}

fetchGames();

// Function to filter posts on page using search bar
function searchPosts() {

    let searchBar = document.getElementById('search');

    // Get contents of search bar
    let filter = searchBar.value.toUpperCase();

    let postList = document.getElementById('gameList');
    let posts = postList.getElementsByTagName('article');

    // Loop through all posts, and hide ones that don't match the search
    for (i = 0; i < posts.length; i++) {


        // Search title of post
        let title = posts[i].getElementsByTagName("h3")[0];
        let titleContent = title.textContent || title.innerText;

        // Change display property of post depending on if it matches search query
        if (titleContent.toUpperCase().indexOf(filter) > - 1) {
            posts[i].style.display = "";
        } else {
            posts[i].style.display = "none";
        }
    }
}

// Search posts whenever the user types
if(document.getElementById("search")) {
    document.getElementById("search").addEventListener("keyup", searchPosts);
}