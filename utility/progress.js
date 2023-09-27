/*****************************************************************************************
 *    Determinate Loading Progress Indicator with Percentages for Initial Pageloading    *
 *****************************************************************************************/



let imagesToLoad = [];                            // Every document with the class "initial-img"
let imagesFailedToLoad = [];                      // Save failed images 
let totalImages = 0;                              // The number of image elements defined with class "initial-img"
let nextImage = 0;                                // The index of the next image in the loading sequence
let successfullyLoaded = 0;                       // The number of images already successfully loaded (nextImage can be false when error thrown)
let percentage = 0;                               // Current loading percentage
let continuity = 0;                               // Amount of accumulated random percentage added for UX (user has the perception of image is loading continously)
let downloadTime = 0;                             // The time in sec that the current image is loading
let lastDownloadedImgSrc = "";                    // The source url of the last successfully downloaded image
let isConnected = true;                           // Assume connection estabilished


// These constants may be adjusted according to personal taste
const roundText = "WORK * BELIEVE * PROGRESS * "; // The text circling around the icon
const stopContinuityAtPercentage = 95;            // The maximum percentage when continuity can be applied
const continuityFrequency = 150;                  // The time frequency in ms that continuity is applied                          
const fallbackSource = "https://tschiboka.co.uk/projects/PT/images/image_not_available.png"; // Broken image png


// Helper functions
const getContinuityIncrementBy = (min, max) => Math.floor(Math.random() * max) + min;        // Random number between min and max values
const getPercentage = (totalImgs, successfullyLoaded) => Number((successfullyLoaded / totalImgs * 100)); // Calculate percentage



// Function create a perception that loading indicator progresses between loading two images by adding
// extra percentages. Therefore, it creates an illusion that the images are loading more continually.
const continuityInterval = setInterval(() => {
    if (!isConnected) return false;                                // Don't add extra percentage when lost connection

    const randomIncrement = getContinuityIncrementBy(1, 1) / 1000; // Create small percentage
    continuity += randomIncrement;                                 // Add to continuity coefficient
    percentage += continuity;                                      // Add it all to percentages

    if (percentage >= stopContinuityAtPercentage) return clearInterval(continuityInterval); // Do not add it over a certain percentage
    
    displayProgress(percentage);
}, continuityFrequency);



// When DOM elements are loaded start progress indicator
document.onreadystatechange = event => {    
    if (document.readyState = "interactive") {
        // Get all elements with the "initial-img" class
        imagesToLoad = [...document.getElementsByClassName("initial-img")];
        
        totalImages = imagesToLoad.length;

        createRoundBannerText();              // Add round circular text around the logo   
        loadImagesSequencially(imagesToLoad); // Start loading images
    }
}

const connectionStateChanged = newConnectionState => {
    isConnected = newConnectionState;
    document.getElementById("loading-text").innerHTML = isConnected ? "LOADING" : "NO CONNECTION";
}


window.addEventListener("offline", event => {
    connectionStateChanged(false);
});
  
window.addEventListener("online", () => {
    connectionStateChanged(true);
});



// Function receives an array of dom elements with dataset "data-src" attribute.
// Iterates images, use nextImage global variable to store current image index.
// All images are loaded sequentially, because asyncronous loading events are
// handled differently in browsers. For instance, Mozilla triggers onload event
// when all images have been loaded, making the loading indicator wait till the
// last image load. Chrome, Edge and Opera triggers onload circumstantially, eg:
// triggers simultaneously for a bunch of images [1,3,4], [2,5,7,8], [6,9,10]...
// For user experience, sequencial image loading is applied, which seems to be 
// working for all browsers. However, there may be a performance downside of 
// loading syncronously.
function loadImagesSequencially(images) {
    // End image loading if all images done (successful + failed >= total).
    if (successfullyLoaded + imagesFailedToLoad.length >= totalImages) {
        clearInterval(continuityInterval); // Stop continuity interval
        removeLoadingScreen();

        return;
    }

    images[nextImage].onload = function () { // Add an onload function for all images
        lastDownloadedImgSrc = images[nextImage].dataset.src;
    
        nextImage++;            
        successfullyLoaded++;

        percentage = getPercentage(totalImages, successfullyLoaded);
        displayProgress(percentage);
        
        loadImagesSequencially(images);
    }

    images[nextImage].onerror = function () { // Fail gracefully by implementing a fallback image
        this.onerror = null; // in case backup link is unavailable, some browsers call onerror continously, resulting in an infinite loop
        
        imagesFailedToLoad.push(images[nextImage]);
        
        //console.error("ERROR : Unable to load image: ", `${imagesFailedToLoad[imagesFailedToLoad.length - 1].src}`);
        
        percentage = getPercentage(totalImages, successfullyLoaded);
        displayProgress(percentage);
        
        images[nextImage].src = fallbackSource; // Add fallback source url    
        nextImage++;
        
        loadImagesSequencially(images);
    }
    
    // When adding onload events, the event must be added first
    // and the source url second, otherwise onload will not be triggered.
    // Cached images also trigger onload function this way.
    images[nextImage].src = images[nextImage].dataset.src;

    // Display the Current Loading Image src
    currentImageSpan = document.getElementById("current-loading-image");
    currentImageSpan.innerHTML = `  [ ${images[nextImage].src.toUpperCase()} ]`;
}



// Display the loading indicator and text
function displayProgress(percentage) {  
    const textPercentage = document.getElementById("percentage-completed");
    
    if (!textPercentage) return false;

    textPercentage.innerHTML = percentage.toFixed(2);

    const indicator = document.getElementById("progress-indicator");
    indicator.style.width = percentage + "%";
}



// Round banner around the icon in the centre of the page.
// Create span element for each letter and display them evenly.
function createRoundBannerText() {
    const textDiv = document.getElementById("round-text");

    [...roundText].forEach((letter, i) => {
        const letterSpan = document.createElement("span");

        letterSpan.innerHTML = letter === "*" ? "&bull;" : letter; // Display bulletpoint instead of "*"
        letterSpan.classList.add("round-text__letter");

        const rotate = `rotate(${360 / roundText.length * i}deg)`; // Rotate = 360 / total * current index
        letterSpan.style.transform = rotate;                       // Add vendor prefixes
        letterSpan.style.mozTransform = rotate;
        letterSpan.style.msTransform = rotate;
        letterSpan.style.oTransform = rotate;

        textDiv.appendChild(letterSpan);
    });
}



// Function removes elements from the loading screen.
// First display message: page is ready, remove the tree animated dots.
// After 1.5s remove the screen itself.
function removeLoadingScreen() {
    const loadingScreen = document.getElementById("progress-wrapper");
    const loadingText = document.getElementById("loading-text");
    const dots = [...document.querySelectorAll(".progress-dot")];
    const currentImage = document.getElementById("current-loading-image");
    const body = document.getElementsByTagName("body")[0];
    
    loadingText.innerHTML = "PAGE IS READY";
    currentImage.innerHTML = "( COMPLETE )";
    dots.forEach(dot => dot.remove());         // Remove dots

    const removeTimerDelay = 0;
    // After certain delay call timeout function
    const removeTimer = setTimeout(() => {
        loadingScreen.remove();         
        body.style.overflowY = "auto";   // set body overflow from hidden to auto

        clearTimeout(removeTimer);
    }, removeTimerDelay);
}