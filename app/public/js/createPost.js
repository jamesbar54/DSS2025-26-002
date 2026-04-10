function createPost(){
    const title = document.getElementById("title_field").value;
    const content = document.getElementById("content_field").value;
    const postType = document.getElementById("postType").value;
    let rating = null;
    if(document.getElementById("rating_field") != null){
        rating = document.getElementById("rating_field").value;
    }
    fetch("/makepost", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: title,
            content: content,
            postType: postType,
            rating: rating
        })
    })
    .then(response => {
    if(response.status == '201'){
       setTimeout(() => {
            location.reload();
        }, 2000);
        
    }
    response.json()})
    .then(data => {
        console.log("it work yippee")
    })
    .catch(error => {
        console.error("Error:", error);
    });

    console.log(postType);
    console.log(title)
    console.log(rating)
    console.log(content)
    
}

createbtn = document.getElementById("post_button")

createbtn.addEventListener("click", (event) => {
    event.preventDefault();
    createPost();
})