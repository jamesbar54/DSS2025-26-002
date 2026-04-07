function test(){
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
            let gameNum = i + 1;
            let rating = "Rating: " + Math.floor(Math.random() * 10)

            let gameContainer = document.createElement('article');
            gameContainer.classList.add("post");
            let fig = document.createElement('figure');
            gameContainer.appendChild(fig);

            let img = document.createElement('img');
            let figcap = document.createElement('figcaption');
            fig.appendChild(img);
            fig.appendChild(figcap);
            
            let nameContainer = document.createElement('h3');
            nameContainer.textContent = name;
            figcap.appendChild(nameContainer);
            
            let usernameContainer = document.createElement('h5');
            usernameContainer.textContent = gameNum;
            figcap.appendChild(usernameContainer);

            let contentContainer = document.createElement('p');
            contentContainer.textContent = rating;
            figcap.appendChild(contentContainer);

            gameList.insertBefore(gameContainer, document.getElementById("br")[0]);
        }
        
    })
    .catch(error => console.error('Error fetching search results:', error));

    
}

test();