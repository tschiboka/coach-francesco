storeVisit('EMAIL');
console.log(urlParams);

const error = urlParams.error;
const h1 = document.getElementById('main-message');
const p = document.getElementById('explanation-message');

if (error) {
    h1.classList.add('error');
    // message[0] = h1 text, message[1] = paragraph text
    const messages = [];

    switch(error) {
        case 'no-token': {
            message = [
                'Could not find the verification token!',
                `Don\'t worry, that means you might have already been subscribed. You can check your subscription status by sending your email address in my home page\'s subscription form again.`
            ];
            break;
        }
        case 'no-subscription': {
            message = [
                'Your email is not in my subscription list!',
                'There have been a technical issue, please try subscribing again.'
            ];
            break;
        }
        case 'expired-token': {
            message = [
                'Your verification link has expired!',
                'For security reasons, email verification links are only valid for two hours. Don\'t worry, you can solve this issue by resubmitting your email again.'
            ];
            break;
        }
    }

    if (urlParams.unsubscription) {
        message = [
            'Technical issue while unsubscribing!',
            'Please try again!'
        ]
    }

    h1.innerHTML = '<i class="fas fa-exclamation-triangle"></i>' + message[0];
    p.innerHTML = message[1];
}
else {
    if (urlParams.unsubscription) {
        h1.innerHTML = 'Successful unsubscription!';
        p.innerHTML = 'If you accidentally clicked on this link or just changed your mind, you can reset your subscription on my homepage!';
    }
    else {
        h1.innerHTML = 'Successful subscription!';
    }
    console.log(urlParams.unsubscription, h1, p);
}

