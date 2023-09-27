window.scrollTo(0, 0);

const getViewportWidth = () => Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
const getViewportHeight = () => Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
let isHeaderVisible = true;
let isUnderAnimation = false; // Do not let multiple click/taps simultaniously

const setInitialMobileHeaderHidden = () => {
    const header = document.getElementById('header');
    const burger = document.getElementById('burger');

    if (getViewportWidth() < 768 && isHeaderVisible) {
        isHeaderVisible = false;
        header.style.display = 'none';
        burger.style.display = 'inline-flex';    
    }
    else if (getViewportWidth() >= 768 && !isHeaderVisible) {
        isHeaderVisible = true;
        header.style.display = 'flex';
        burger.style.display = 'none';    
    }
}



window.addEventListener('load', () => {
    setInitialMobileHeaderHidden();
    setLanguage(language);
});



window.addEventListener('resize', () => setInitialMobileHeaderHidden());



document.addEventListener('DOMContentLoaded', function() {
    const lazyloadImages = document.querySelectorAll('img.lazy');    
    let lazyloadThrottleTimeout;
    
    function lazyload () {
        if (lazyloadThrottleTimeout) {
            clearTimeout(lazyloadThrottleTimeout);
        }    
        
        lazyloadThrottleTimeout = setTimeout(function() {
            var scrollTop = window.pageYOffset;
            
            lazyloadImages.forEach(function(img) {
                if (img.offsetTop < (window.innerHeight + scrollTop)) {
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                }
            });

            if(lazyloadImages.length == 0) { 
                document.removeEventListener('scroll', lazyload);
                window.removeEventListener('resize', lazyload);
                window.removeEventListener('orientationChange', lazyload);
            }
        }, 5);
    }
    
    document.addEventListener('scroll', lazyload);
    window.addEventListener('resize', lazyload);
    window.addEventListener('orientationChange', lazyload);
});



function toggleHeader() {
    if (isUnderAnimation) return;
    isUnderAnimation = true;

    isHeaderVisible = !isHeaderVisible;

    const header = document.getElementById('header');
    const burger = document.getElementById('burger');
    const viewportWidth = getViewportWidth();
    
    if (viewportWidth > 768) {
        if (!isHeaderVisible) {
            header.classList.add('header-up--desktop');
            const timer = setTimeout(() => {
                header.style.display = 'none';
                burger.style.display = 'inline-flex';
                header.classList.remove('header-up--desktop');

                isUnderAnimation = false;
                clearTimeout(timer);
            }, 1150);
        }
        else {
            // In order to reanimate element, it needs to be cloned, removed and reappended in the DOM
            burger.style.display = 'none';
            const headerClone = header.cloneNode(true);
            header.remove();
            
            document.getElementsByTagName('body')[0].appendChild(headerClone);
            const newHeader = document.getElementById('header');
            newHeader.style.display = 'flex';
            newHeader.classList.add('header-down--desktop');
            
            const timer = setTimeout(() => {
                newHeader.classList.remove('header-down--desktop');
                
                isUnderAnimation = false;
                clearTimeout(timer);
            }, 1150);
        }
    }
    else {
        // Elemnents to animate
        const navLinks = [...document.getElementsByClassName('nav__link')];
        const buttons = document.getElementById('nav__buttons');
        
        // If header is visible, animate header up
        if (!isHeaderVisible) {
            // Main timer
            let animationStep = 0;
            const headerUpTimer = setInterval(() => {
                // Get all nav links and animate their height
                const currentLink = navLinks[navLinks.length - 1 - animationStep];
                if (currentLink) {
                    let opacity = 1;
                    let height = 10;
                    const fadeTimer = setInterval(() => {
                        // Separate interval for smoother opacity and height animation on nav link
                        opacity = opacity === 0 ? 0 : opacity - 0.2;
                        currentLink.style.opacity = opacity;

                        height -= 2;
                        currentLink.style.height = height + 'vh';

                        // Stop animation if opacity reached 0
                        if (opacity <= 0) {
                            currentLink.style.display = 'none';
                            clearInterval(fadeTimer);
                        }
                    }, 10);
                }
                
                // Start shrink header when links are all animated
                if (animationStep === navLinks.length) {
                    let opacity = 1;
                    let height = 100;
                    const headerShrinkTimer = setInterval(() => {
                        opacity = opacity === 0 ? 0 : opacity - 0.1;
                        buttons.style.opacity = opacity;
                        
                        height -= 6;
                        header.style.height = height + 'vh';

                        if (opacity <= 0) buttons.style.display = 'none';

                        // Stop header animation when its height reached the branding size
                        if (height <= 12) {
                            header.style.height = '12vh';
                            clearTimeout(headerShrinkTimer);
                        }
                    }, 8);
                }

                // Skip an animation step and animate the left of header (move up)
                if (animationStep === navLinks.length + 2) {
                    const height = Number(header.style.height.match(/\d+/g)[0]);
                    let top = 0;
                    const brandingUpTimer = setInterval(() => {
                        top -= 0.5;
                        header.style.top = top + 'vh';

                        // If element top has reached element negative height stop animation
                        if (top === 0 - height) {
                            // Reset all style attributes, as resizing window can leave menu affected by inline stlyes
                            header.style = '';
                            buttons.style = '';
                            navLinks.forEach(navLink => navLink.style = '');

                            // Show burger and clear all timers
                            header.style.display = 'none';
                            burger.style.display = 'inline-flex';

                            isUnderAnimation = false;
                            
                            clearInterval(brandingUpTimer);
                            clearInterval(headerUpTimer);
                        }
                    }, 5);
                }
                
                animationStep++;
            }, 180);
        }
        else {
            // Set up header for animation
            header.style.display = 'flex';
            header.style.height = '12vh';
            header.style.top = '-12vh';
            burger.style.display = 'none';
            buttons.style.opacity = 0;
            buttons.style.height = 0;
            navLinks.forEach(navLink => {
                navLink.style.opacity = 0;
                navLink.style.height = 0;
                navLink.style.border = 'none';
            });

            // Move header down till 'branding' is visible
            let top = -12;
            const brandingDownTimer = setInterval(() => {
                top += 0.5;
                header.style.top = top + 'vh';
                
                if (top === 0) {
                    // Expand header full screen height and make buttons visible
                    let height = 12;
                    let opacity = 0;
                    const headerDownTimer = setInterval(() => {
                        opacity = opacity === 1 ? 1 : opacity + 0.1;
                        buttons.style.opacity = opacity;
                        
                        
                        height = height > 100 ? 100 : height + 6;
                        header.style.height = height + 'vh';

                        if (height === 100) {
                            // Expand navigation links one by one
                            let index = 0;
                            const navMenuTimer = setInterval(() => {
                                height = 0;
                                opacity = 0;
                                if (index === navLinks.length - 1) {
                                    header.style = '';
                                    buttons.style = '';
                                    isUnderAnimation = false;
                                    clearInterval(navMenuTimer);
                                }
                                
                                // Animate individual navigation links
                                const navLinkTimer = setInterval(() => {
                                    opacity = opacity === 1 ? 1 : opacity + 0.2;
                                    navLinks[index].style.opacity = opacity;
                                    
                                    height = height >= 10 ? 10 : height + 2;
                                    navLinks[index].style.height = height + 'vh'; 

                                    if (height === 10) {
                                        navLinks[index].style = '';
                                        index++;
                                        clearInterval(navLinkTimer);
                                    }
                                }, 10);
                            }, 180);
                            clearInterval(headerDownTimer);
                        }
                    }, 5);

                    clearInterval(brandingDownTimer);
                }
            }, 5);
        }
    }
}



const languages = ['english', 'italian'];
let language = 'english';
function setLanguage(lang = 'english') {
    const langElements = [...document.getElementsByClassName(lang)];
    const otherLanguages = languages.filter(l => l !== lang).map(l => '.' + l);
    const otherLangElements = [...document.querySelectorAll(otherLanguages.join(','))];
    const languageOptBtns = [...document.querySelectorAll('.language-options > div')];
    const activeLangBtn = document.querySelector('.language-options--' + lang);

    otherLangElements.forEach(el => el.classList.add('no-display'));
    langElements.forEach(el => el.classList.remove('no-display'));
    languageOptBtns.forEach(btn => btn.classList.remove('active'));
    activeLangBtn.classList.add('active');

    language = lang;
    // storeVisit('HOME', language);
}



function scrollAwayWelcome() {
    window.scrollBy(0, getViewportHeight());
}



function setGoalOption(event) {
    const target = event.target;

    if (target.classList.contains('active')) return;
    else {
        const allBtns = document.querySelectorAll('#goal-options__wrapper button');
        allBtns.forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');

        const allParagraphs = document.querySelectorAll('.goal-options > p');
        const showParagraph = [...document.getElementsByClassName(target.dataset.paragraph)];
        
        allParagraphs.forEach(p => p.classList.add('no-display'));
        showParagraph.forEach(p => p.classList.remove('no-display')); // There will be multiple results because of the language options
    }
}



const carouselImagesPcs = 8;
let currentCarouselImgIndex = 0;
let carouselLoop = true;

function carouselMove(index) {
    if (index > carouselImagesPcs) index = carouselImagesPcs;
    if (index < 1) index = 1;
    currentCarouselImgIndex = index;

    document.getElementById('carousel__navigation__previous-btn').disabled = index === 1;
    document.getElementById('carousel__navigation__next-btn').disabled = index === carouselImagesPcs;
    
    const id = `gallery-img_${index}`;
    const image = document.getElementById(id);
    const gallery = document.querySelector('.carousel__gallery');
    const galleryWidth = gallery.getBoundingClientRect().width;
    const rect = image.getBoundingClientRect();
    const width = rect.width;
    const left = rect.left;
    const margins = Math.floor(galleryWidth / width);
    const distance = (left + width / 2) - (galleryWidth / 2) - (margins * 50);

    gallery.scrollLeft += distance;
    
    const imgIndicators = document.querySelectorAll('.carousel__navigation__indicator-list__item');
    const imgIndicator = document.getElementById('gallery-img-indicator_' + index);

    imgIndicators.forEach(ind => ind.classList.remove('active'));
    imgIndicator.classList.add('active');
}



document.querySelector('#gallery-img_1').addEventListener('load', galleryFirstImageLoaded);



function galleryFirstImageLoaded() {
    const image = document.querySelector('#gallery-img_1');
    const gallery = document.querySelector('.carousel__gallery');
    gallery.scrollLeft = 0;
    carouselMove(1);
    
    image.removeEventListener('load', galleryFirstImageLoaded);

    carouselLoop = true;
    const carouselLoopInterval = setInterval(() => {
        if (!carouselLoop) {
            clearInterval(carouselLoopInterval);
            return;
        }
        
        if (currentCarouselImgIndex >= carouselImagesPcs) {
            currentCarouselImgIndex = 0;
        }

        carouselMove(++currentCarouselImgIndex);
    }, 2000);
}



function validateEmail(email) {
    const regExp = /^(([^<>()[\]\\.,;:\s@']+(\.[^<>()[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const valid = regExp.test(String(email).toLowerCase());
    const exclamationMark = '<span><i class="fas fa-star"></i></span>';
    const message = exclamationMark + (
        !email 
            ? 'Cannot leave email empty!' 
            : 'Invalid email format!'
    );

    return valid 
        ? { valid } 
        : { valid: false, message };
}



function setCaptchaDisplay(event) { 
    event.stopPropagation();

    const targetId = event.target.id;
    const closeCaptcha =  targetId === 'captcha' || targetId === 'close-captcha-btn';
    const captchaForm = document.getElementById('captcha');
    const email = document.getElementById('signup-email').value;
    const { valid:isValid, message } = { ...validateEmail(email) };
    const messageElem = document.getElementById('signup__input__email--invalid');
    
    if (isValid) {
        messageElem.style.display = 'none';

        // Dinamically load Google-s reCAPTCHA script
        let captchaScript = document.createElement('script');
        captchaScript.setAttribute('src', 'https://www.google.com/recaptcha/api.js?render=reCAPTCHA_site_key');
        document.body.appendChild(captchaScript);
    }
    else {
        messageElem.style.display = 'inline';
        messageElem.innerHTML = message;
    }

    if (!closeCaptcha && isValid) captchaForm.style.display = 'flex';
    else {
        captchaForm.style.display = 'none';
    }

    return false;
}



function handleEmailInputOnFocus(event) { 
    const messageElem = document.getElementById('signup__input__email--invalid');
    messageElem.style.display = 'none'; 
}



function handleEmailInputKeyDown(event) {
    if (event.key === 'Enter' || event.keyCode == 13) {   
        event.preventDefault();
        setCaptchaDisplay(event);
        return false;
    }
}



function validateName(name) {
    const regExp = /^[a-zA-Z'\- ]+$/;
    const valid = regExp.test(name);
    const invalidCharacters = name.match(/[^a-zA-Z'\- ]/g) || '';
    const exclamationMark = '<span>&#9888; </span>';

    const message = exclamationMark + (
        !name 
            ? 'Set anonymity?' 
            : `Invalid character: ${invalidCharacters[0]}!`
    );

    return valid 
        ? { valid } 
        : { valid: false, message };
}



function handleNameInputOnFocus(event) {
    const messageElem = document.getElementById('signup__input__name--invalid');
    messageElem.style.display = 'none'; 
}



function handleNameInputKeyDown(event) {
    if (event.key === 'Enter' || event.keyCode == 13) {   
        event.preventDefault();
        const name = document.getElementById('signup-name').value;
        const {valid: isValid, message} = {...validateName(name)};
        const messageElem = document.getElementById('signup__input__name--invalid');
    
        if (isValid) {
            messageElem.style.display = 'none';
        }
        else {
            messageElem.style.display = 'inline';
            messageElem.innerHTML = message;
        }

        return false;
    }
}



function handleAnonymiseOnChange(event) {
    const isAnonym = event.target.checked;
    const nameInput = document.getElementById('signup-name');
    
    if (isAnonym) {
        nameInput.style.display = 'none';
        nameInput.value = '';
    }
    else {
        nameInput.style.display = 'inline';
    }
}

function setFormMessage(visible, messageText, className) {
    const formMessage = document.getElementById('form-message');
    formMessage.innerHTML = messageText;
    formMessage.className = '';
    if (className) formMessage.classList.add(className);
    formMessage.style.display = visible ? 'inline': 'none';
}

/* Preventing ENTER keypress on checkbox submitting the form */
function handleAnonymiseOnKeyDown(event) {
    if (event.key === 'Enter' || event.keyCode == 13) {   
        event.preventDefault();
        return false;
    }
}

let captchaSelected = false;
function verifyCaptcha(token) { 
    captchaSelected = true;
    // Warn user for verifying reCaptcha
    const formMessage = document.getElementById('form-message');
    formMessage.style.display = 'none';
}

async function submitSignup() {
    setFormMessage(true, 'Submitting subscription...', "");

    if (!captchaSelected) {
        // Warn user for verifying reCaptcha
        setFormMessage(true, 'Verify reCaptcha!', 'error');
        return;
    }

    document.getElementById('form-submit-btn').disabled = true;

    const email = document.getElementById('signup-email').value;
    const name = document.getElementById('signup-name').value;
    const recaptcha = document.getElementById('g-recaptcha-response').value;
    const body = JSON.stringify({ name, email, recaptcha })

    const options = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: body
    }

    try {
        const response = await fetch('https://coach-francesco-levo-backend.herokuapp.com/api/subscribe', options);
        const jsonResponse = await response.json();
        if (response.status >= 200 && response.status <= 299) {
            console.log(jsonResponse.message);
            setFormMessage(true, jsonResponse.message, "success");

            // After 2 seconds remove form and show download pdf
            const autoCloseFormDelay = setTimeout(() => {
                document.getElementById('captcha').style.display = 'none';
                
                // Download
                const link = document.createElement('a');
                link.href = './documents/10_rules_to_build_muscle.pdf';
                link.download = '10_rules_to_build_muscle.pdf';
                link.dispatchEvent(new MouseEvent('click'));

                clearTimeout(autoCloseFormDelay);
            }, 2000);
        } else {
            setFormMessage(true, jsonResponse.message, "error");
            document.getElementById('form-submit-btn').disabled = false;
        }
    } catch (ex) { 
        setFormMessage(true, 'Unsuccessful subscription!', "error");
        console.error(ex); 
    }
}

