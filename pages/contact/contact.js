function validateFormInputs(display) {
    const firstName = document.getElementById('first-name');
    const lastName = document.getElementById('last-name');
    const email = document.getElementById('email');
    const message = document.getElementById('message');

    let firstNameError = validate(firstName, firstName.value);
    let lastNameError = validate(lastName, lastName.value);
    let emailError = validate(email, email.value);
    let messageError = validate(message, message.value);    

    if (display) {
        handleInputOnFocus(firstName);
        handleInputOnFocus(lastName);
        handleInputOnFocus(email);
        handleInputOnFocus(message);

        handleInputOnBlur(firstName);
        handleInputOnBlur(lastName);
        handleInputOnBlur(email);
        handleInputOnBlur(message);
    }

    const isValid = (firstNameError + lastNameError + emailError + messageError).length === 0;
    return isValid;
}
validateFormInputs();


function hidePlaceholder(inputElem, hide) {
    if (hide) inputElem.classList.add("no-placeholder");
    else inputElem.classList.remove("no-placeholder");
}



function handleInputOnChange(inputElem) {
    const value = inputElem.value;
    hidePlaceholder(inputElem, !value);

    const error = validate(inputElem, value);
    displayError(inputElem, error);

    countCharacters();
}



function handleInputOnFocus(inputElem) {
    // Hide submit message (for retrying unsuccessful submits, it might be disturbing)
    const submitMessage = document.getElementById('submit-message');
    submitMessage.className = '';
    submitMessage.innerHTML = 'Submitting message...';
    submitMessage.style.display = 'none';
    const label = document.getElementById(inputElem.id + "-label");
    const labelText = document.querySelector("#" + inputElem.id + "-label span.label-text");
    const errorText = document.querySelector("#" + inputElem.id + "-label span.error-msg");
    label.style.display = "flex";
    labelText.style.display = "inline";
    errorText.style.display = "inline";
    
    const value = inputElem.value;
    hidePlaceholder(inputElem, !inputElem.value);

    const error = validate(inputElem, value);
    displayError(inputElem, error);
    countCharacters();
}



function handleInputOnBlur(inputElem) {
    const labelText = document.querySelector("#" + inputElem.id + "-label span.label-text");
    const errorText = document.querySelector("#" + inputElem.id + "-label span.error-msg");
    labelText.style.display = "none";
    errorText.style.display = "none";

    hidePlaceholder(inputElem, false);
}



function validate(input, value) {
    if (!value.length) return "Required field!"

    let inputType;
    if (input.name === "first-name" || input.name === "last-name") inputType = "name";
    if (input.name === "email") error = inputType = "email";
    if (input.name === "message") error = inputType = "message";
    
    switch (inputType) {
        case "name": {
            if ((/^\s/).test(value)) return "No starting space!";
            if ((/\s$/).test(value)) return "No ending space!";
            const invalidChar = value.match(/[^a-z\s'/-]/gi);
            if (invalidChar) return `Invalid character: ${invalidChar[0]}!`;
            const multiSpace = /\s\s/g.test(value);
            if (multiSpace) return "No multiple spaces!";
            break;
        }
        case "email": {
            const valid = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(value);
            if (!valid) return "Invalid email format!"
        }
        case "message": {
            if (value.length < 10) return "Min length 10!"
        }
    }
    return "";
}



function displayError(inputElem, error) {
    const errorElem = document.querySelector(`#${inputElem.id}-label > span.error-msg`);

    const errorCircle = document.querySelector(`#${inputElem.id}-label > span.circle`);
    errorCircle.classList = "circle";
    errorCircle.classList.add(error ? "error" : "OK");

    errorElem.innerHTML = error ? error : "OK";
}



function countCharacters() {
    const text = document.getElementById("message");
    const counter = document.getElementById("character-counter");
    counter.innerHTML = `${text.value.length} / 3000`;
}

async function submitMessage(event) {
    // Final validation of all input elements
    const isValid = validateFormInputs(true);
    if (!isValid) return;

    const submitBtn = document.getElementById('submit-btn');
    const submitMsg = document.getElementById('submit-message');
    submitBtn.disabled = true; // prevent accidentally submitting form multiple times
    submitMsg.style.display = 'inline';
    
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;

    const messageData = { firstName, lastName, email, message };
    
    // Send message
    const options = {
        method: 'POST',
        //mode: 'no-cors',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
    }

    try {
        console.log('HERE V1');
        //const response = await fetch('http://localhost:3000/api/messages', options);
        const response = await fetch('https://coach-francesco-levo-backend.herokuapp.com/api/messages', options);
        console.log(response);
        const jsonResponse = await response.json();
        console.log(jsonResponse);
        if (response.status >= 200 && response.status <= 299) {
            submitMsg.classList.add('success');
            submitMsg.innerHTML = 'Successful submittion!';

            const firstNameInput = document.getElementById('first-name');
            const lastNameInput = document.getElementById('last-name');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');
                
            firstNameInput.value = '';
            lastNameInput.value = '';
            emailInput.value = '';
            messageInput.value = '';
        } else {
            // Handle errors
            submitMsg.classList.add('error');
            submitMsg.innerHTML = 'Submittion failed!';
            console.log(response, response.status, response.statusText);
          }
    } catch (ex) { 
        console.error(ex); 
        submitMsg.classList.add('error');
        submitMsg.innerHTML = 'Submittion failed!';
    }

    submitBtn.disabled = false;
    
    const labels = [...document.getElementsByTagName('label')];
    labels.forEach(label => label.style.display = 'none');
}

