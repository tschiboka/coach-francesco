const input = document.getElementById('unsubscribe-input');
const errorMessage = document.getElementById('error-message');
const submitBtn = document.getElementById('submit-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const submitMessage = document.getElementById('submit-message');
let isSubmitting = false;

function validateInput() {
    const value = input.value;
    
    let message = "";
    errorMessage.style.display = 'none';
    
    const isValid = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(value);
    if (!isValid) message = "Invalid email format!"
    
    if (value === "") message = 'Cannot send empty form!';

    errorMessage.innerHTML = message;
    errorMessage.style.display = 'inline';

    return message === "";
}

input.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.keyCode === 13) {
        event.preventDefault();
        submit(event);
    }
});

submitBtn.addEventListener('click', event => { submit(event) })

async function submit(event) {
    event.preventDefault();
    if (isSubmitting) return false;

    const isValid = validateInput();
    if (isValid) {
        isSubmitting = true;
        submitBtn.disabled = true;
        loadingSpinner.style.display = "block";
        submitMessage.innerHTML = "Submitting your email verification...";
        
        try {
            const options = {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email: input.value })
            }

            const response = await fetch('https://coach-francesco-levo-backend.herokuapp.com/api/unsubscribe', options);
            //const response = await fetch('http://localhost:3000/api/unsubscribe', options);
            const jsonResponse = await response.json();

            if (response.status >= 200 && response.status <= 299) submitMessage.innerHTML = jsonResponse.message;
            else submitMessage.innerHTML = 'Error while submitting: ' + response.status;
        } catch(ex) {
            submitMessage.innerHTML = ex;
        }

        isSubmitting = false;
        submitBtn.disabled = false;
        loadingSpinner.style.display = "none";
    }
    return false;
}