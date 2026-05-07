// Function to load posts made by user who is currently logged in
async function loadPosts() {
    fetch(`/getmyposts`)
    .then(response => {
            if (!response.ok) {
                console.error('Server returned an error:', response.statusText);
                throw new Error('Failed to fetch search results');
            }
            return response.json();
        })
    .then(data => {
        console.log("ghrsgjawrseghjweaghijk")
        let postList = document.getElementById('myPosts');
        for(let i = 0; i < data.length; i++) {
            let author = data[i].userName;
            let time = data[i].timestamp;
            let date = new Date(time)
            let timestamp = date.toLocaleString("en-gb")
            let title = data[i].postTitle;
            let content = data[i].postContent;
            let postID = data[i].postID;
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

            postList.insertBefore(postContainer, document.querySelectorAll("article")[0]);
    }
        
    })
    .catch(error => console.error('Error fetching search results:', error));
}

async function loadReviews(){
    fetch(`/getmyreviews`)
    .then(response => {
        if (!response.ok) {
            console.error('Server returned an error:', response.statusText);
            throw new Error('Failed to fetch search results');
        }
        return response.json();
        })
    .then(data => {
        let postList = document.getElementById('myReviews');
        for(let i = 0; i < data.length; i++) {
            let time = data[i].timestamp;
            let date = new Date(time)
            let timestamp = date.toLocaleString("en-gb")
            let title = data[i].postTitle;
            let content = data[i].postContent;
            let postID = data[i].postID;
            let score = data[i].postReviewScore;
            let rating = "Your Rating: " + score;
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

            let timeContainer = document.createElement('h5');
            timeContainer.textContent = timestamp;
            figcap.appendChild(timeContainer);

            let contentContainer = document.createElement('p');
            contentContainer.textContent = content;
            figcap.appendChild(contentContainer);

            let ratingContainer = document.createElement('p');
            ratingContainer.textContent = rating;
            figcap.appendChild(ratingContainer);

            postList.insertBefore(postContainer, document.querySelectorAll("article")[0]);
    }
        
    })
    .catch(error => console.error('Error fetching search results:', error));
}

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
    let gameSelect = document.getElementById("title_field");
        data.forEach(game => {
            let option = document.createElement("option");
            option.value = game.gameName;
            option.textContent = game.gameName;
            gameSelect.appendChild(option);
        });
    })
    .catch(error => console.error('Error fetching search results:', error));
}

if(document.getElementById('myPosts') != null){
    loadPosts();
} else if(document.getElementById('myReviews') != null){
    fetchGames();
    loadReviews();
}


// Function to remove a post from the page after clicking delete - this is also reflected on the server side
function deletePost(e) {

    // Put post in object to be the body of fetch request
    const post = {
        postId:document.getElementsByTagName('h6')[0].textContent, 
    };

    const requestHeaders = {
        "Content-Type": "application/json"
    };

    // Delete post
  fetch('/deletepost', {
    method: 'POST',
    headers: requestHeaders,
    body:JSON.stringify(post)
  });

  // Hide element on button click so deletion appears immediate
  e.target.parentNode.hidden = true;
}

// Function to edit post
function editPost(e) {

    // Get post that the user clicked on
    let post = e.target.parentNode;
   
    // Fill out form fields with data grabbed from post
    document.getElementById("title_field").value = post.getElementsByTagName('h3')[0].textContent;
    document.getElementById("content_field").value = post.getElementsByTagName('p')[0].textContent;
    document.getElementById("postId").value = post.getElementsByTagName('h6')[0].textContent;

    // Scroll user to post form
    document.getElementById("postForm").scrollIntoView({behavior: "smooth"});

}

// Function to filter posts on page using search bar
function searchPosts() {

    let searchBar = document.getElementById('search');

    // Get contents of search bar
    let filter = searchBar.value.toUpperCase();

    let postList = document.getElementById('myPosts');
    let posts = postList.getElementsByTagName('article');

    // Loop through all posts, and hide ones that don't match the search
    for (i = 0; i < posts.length; i++) {

        // Search body of post
        let content = posts[i].getElementsByTagName('p')[0];
        let postContent = content.textContent || content.innerText;

        // Search title of post
        let title = posts[i].getElementsByTagName("h3")[0];
        let titleContent = title.textContent || title.innerText;

        // Search username
        let username = posts[i].getElementsByTagName("h5")[0];
        let usernameContent = username.textContent || username.innerText;

        // Change display property of posts depending on whether it matches the search or not
        if (postContent.toUpperCase().indexOf(filter) > -1 || titleContent.toUpperCase().indexOf(filter) > - 1 ||
             usernameContent.toUpperCase().indexOf(filter) > - 1) {
            posts[i].style.display = "";
        } else {
            posts[i].style.display = "none";
        }
    }
}

document.getElementById("search").addEventListener("keyup", searchPosts);