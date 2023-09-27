let isPasswordVisible = false;
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const eyeBtn = document.getElementById('show-password');
const emailLabel = document.getElementById('email-label');
const passwordLabel = document.getElementById('password-label');
const emailCircle = document.getElementById('email-circle');
const passwordCircle = document.getElementById('password-circle');
const emailLabelText = document.getElementById('email-label-text');
const passwordLabelText = document.getElementById('password-label-text');
const emailErrorMsg = document.getElementById('email-error-msg');
const passwordErrorMsg = document.getElementById('password-error-msg');
const submitButton = document.getElementById('sign-in');
const submitErrorText = document.getElementById('submit-error-text');

emailInput.value = '';
passwordInput.value = '';
emailInput.focus();

function showPassword() {
    isPasswordVisible = !isPasswordVisible;

    if (isPasswordVisible) {
        passwordInput.type = 'text';
        console.log(passwordInput)
        eyeBtn.className = 'far fa-eye-slash';
    }
    else {
        passwordInput.type = 'password';
        eyeBtn.className = 'far fa-eye';
    }
}

function handleInputOnBlur(inputType) { 
    validate(inputType);

    if (inputType === 'email') {
        emailLabelText.style.display = 'none';
        emailErrorMsg.style.display = 'none';
    }
    if (inputType === 'password') {
        passwordLabelText.style.display = 'none';
        passwordErrorMsg.style.display = 'none';
    }
}

emailInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.keyCode === 13) passwordInput.focus();
});

passwordInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.keyCode === 13) submitButton.click();
});


function validate(inputType) {   
    if (inputType === 'email') {
        emailLabel.style.display = 'flex';
        emailCircle.style.display = 'block';
        emailLabelText.style.display = 'block';
        emailErrorMsg.style.display = 'block';

        const email = emailInput.value;
        const isValid = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(email);

        if (!isValid) {
            emailCircle.className = 'circle error';
            if (!email.length) emailErrorMsg.innerHTML = 'Required field!';
            else if (email.length >= 255) emailErrorMsg.innerHTML = 'Max 255 characters!';
            else emailErrorMsg.innerHTML = 'Invalid format!';
        }
        else {
            emailCircle.className = 'circle';
            emailErrorMsg.innerHTML = 'OK';
        }
        return isValid;
    }
    if (inputType === 'password') {
        passwordLabel.style.display = 'flex';
        passwordCircle.style.display = 'block';
        passwordLabelText.style.display = 'block';
        passwordErrorMsg.style.display = 'block';

        const password = passwordInput.value;
        const getErrormessate = password => {
            const invalidChars = password.match(/[^0-9A-Z0-9\.!$%&\*@\[\]\(\)_-]$/gi);
        
            if (!password.length) return 'Required field!';
            else if (password.length < 8) return 'Min 8 characters!';
            else if (password.length >= 50) return 'Max 50 characters!';
            else if (!/.*[a-z]+.*/g.test(password)) return 'Min 1 lowercase letter!';
            else if (!/.*[A-Z]+.*/g.test(password)) return 'Min 1 uppercase letter!';
            else if (!/.*[0-9]+.*/g.test(password)) return 'Min 1 numeric character!';
            else if (invalidChars) return 'Invalid character ' + invalidChars[0];
            return undefined;
        }
        const errorMessage = getErrormessate(password);

        if (errorMessage) {
            passwordCircle.className = 'circle error';
            passwordErrorMsg.innerHTML = errorMessage;
        }
        else {
            passwordCircle.className = 'circle';
            passwordErrorMsg.innerHTML = 'OK';
        }
        return !Boolean(errorMessage);    
    }
}

async function onSubmit() {
    const emailValid = validate('email');
    const passwordValid = validate('password');
    handleInputOnBlur('email');
    handleInputOnBlur('password');
    if (!emailValid || !passwordValid) return;

    submitButton.disabled = true;
    const email = emailInput.value;
    const password = passwordInput.value;

    const options = {
        method: 'POST',
        //mode: 'no-cors',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    }

    try {
        //const response = await fetch('http://localhost:3000/api/login', options);
        const response = await fetch('https://coach-francesco-levo-backend.herokuapp.com/api/login', options);
        const responseJson = await response.json();
        
        if (response.status >= 200 && response.status <= 299) {
            submitErrorText.innerHTML = 'Successful Login';
            submitErrorText.style.display = 'block';
            submitErrorText.className = '';
            redirect(responseJson.token);
        }
        else {
            submitErrorText.innerHTML = responseJson.error;
            submitErrorText.style.display = 'block';
            submitErrorText.className = 'error';
            submitButton.disabled = false;
        }
    }
    catch (ex) {
        console.log(ex);
    }
}

function redirect(token) {
    localStorage.setItem('token', token);
    window.location.replace('admin.html');
}