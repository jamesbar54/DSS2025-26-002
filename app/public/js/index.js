// Function to add the latest 2 posts to the home page
async function loadLatestPosts() {
    // Remove current posts from page
    let postList = document.getElementById('postsList');

    for(let i = 0; i < postList.children.length; i++) {
        if(postList.children[i].nodeName == "article") {
            postList.removeChild(postList.children[i]);
        }
    }

    // Load latest 2 posts
    fetch(`/getposts`)
    .then(response => {
            if (!response.ok) {
                console.error('Server returned an error:', response.statusText);
                throw new Error('Failed to fetch search results');
            }
            return response.json();
        })
    .then(data => {
        console.log(data)
        let postList = document.getElementById('postsList');
        for(let i = data.length - 1; i > data.length - 3; i--) {
            let author = data[i].userName;
            let time = data[i].timestamp;
            let date = new Date(time)
            let timestamp = date.toLocaleString("en-gb")
            let title = data[i].postTitle;
            let content = data[i].postContent;
            let postID = data[i].postID;
            console.log(timestamp)
            console.log(title)
            console.log(content)
            console.log(postID)
            let postContainer = document.createElement('article');
            postContainer.classList.add("post");
            let fig = document.createElement('figure');
            postContainer.appendChild(fig);

            let postIdContainer = document.createElement("p");
            postIdContainer.textContent = postID;
            postIdContainer.hidden = true;
            postID.id = "postId";
            postContainer.appendChild(postIdContainer);

            let img = document.createElement('img');
            let figcap = document.createElement('figcaption');
            fig.appendChild(img);
            fig.appendChild(figcap);
            
            let titleContainer = document.createElement('h3');
            titleContainer.textContent = title;
            figcap.appendChild(titleContainer);
            
            let usernameContainer = document.createElement('h5');
            usernameContainer.textContent = author;
            figcap.appendChild(usernameContainer);

            let timeContainer = document.createElement('h5');
            timeContainer.textContent = timestamp;
            figcap.appendChild(timeContainer);

            let contentContainer = document.createElement('p');
            contentContainer.textContent = content;
            figcap.appendChild(contentContainer);

            postList.insertBefore(postContainer, postList.querySelectorAll("section > p")[1]);
    }
        
    })
    .catch(error => console.error('Error fetching search results:', error));
}

loadLatestPosts();

