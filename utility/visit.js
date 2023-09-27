async function storeVisit(page, language) {
    const options = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ page, language })
    }

    try {
        const response = await fetch('https://coach-francesco-levo-backend.herokuapp.com/api/visits', options);
        const jsonResponse = await response.json();

        if (response.status >= 200 && response.status <= 299) console.log(jsonResponse.message);
        else console.log(jsonResponse);
    } catch (ex) { console.log(ex) }
}
