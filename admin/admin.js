// Calculate the available space for the table to get the maximum number of rows that can confortably fit without overflow
// Default when, page limit is not set by user in localstorage
function setCustomTableLimit(newLimit) {
    const innerHeight = window.innerHeight|| document.documentElement.clientHeight|| body.clientHeight;
    const availableSpace =  innerHeight - 200;             // total - header, table caption, table functions, table column names, footer * 40
    const rowHeight = 40;
    const rowNumber =  Math.floor(availableSpace / rowHeight);
    const limit = rowNumber <= 10 ? 10 : rowNumber;        // Prevent automatically setting limit less than 10    
    localStorage.setItem('custom-table-limit', newLimit || limit); 
    return newLimit ||  limit;
}



const app = {
    isMenuOpen: true,
    loading: true,
    token: localStorage.getItem('token'),
    //url: 'http://localhost:3000',
    url: 'https://coach-francesco-levo-backend.herokuapp.com',
    view: 'messages',
    views: {
        emails: { 
            sortBy: 'email', 
            desc: false, 
            limit: localStorage.getItem('custom-table-limit') || setCustomTableLimit(), 
            select: 'email active', 
            page: 0 
        },
        messages: { 
            sortBy: 'date', 
            desc: true, 
            limit: localStorage.getItem('custom-table-limit') || setCustomTableLimit(), 
            select: 'read date email firstName lastName message _id', 
            page: 0 
        },
        users: {
            sortBy: 'name', 
            desc: false, 
            limit: localStorage.getItem('custom-table-limit') || setCustomTableLimit(), 
            select: 'name email isAdmin _id', 
            page: 0 
        },
        login: { // url is login rather than logins
            sortBy: 'date', 
            desc: true, 
            limit: localStorage.getItem('custom-table-limit') || setCustomTableLimit(), 
            select: 'date email isAdmin isSuccessful _id', 
            page: 0 
        },
        subscriptions: {
            sortBy: 'date', 
            desc: true, 
            limit: localStorage.getItem('custom-table-limit') || setCustomTableLimit(), 
            select: 'date active email name _id', 
            page: 0 
        },
        logs: {
            sortBy: 'timestamp', 
            desc: true, 
            limit: localStorage.getItem('custom-table-limit') || setCustomTableLimit(), 
            select: 'timestamp name message stack _id', 
            page: 0             
        },
        visits: {
            sortBy: 'date', 
            desc: true, 
            limit: localStorage.getItem('custom-table-limit') || setCustomTableLimit(), 
            select: 'date page ip country city language _id', 
            page: 0             
        },
    },
    tableOptions: {
        emails: { 
            title: 'Active Subscriptions    ', 
            view: 'emails', 
            showId: false,
            selectableRows: true, 
            creatable: false, 
            upadateable: false, 
            deletable: false, 
            copyable: true, 
        },
        messages: { 
            title: 'Visitors Contact Messages', 
            view: 'messages', 
            showId: true,
            selectableRows: true, 
            creatable: false, 
            upadateable: false, 
            deletable: true, 
            copyable: true, 
        },
        users: {
            title: 'Users', 
            view: 'users', 
            showId: true,
            selectableRows: true, 
            creatable: true, 
            upadateable: true, 
            deletable: true, 
            copyable: true, 
        },
        login: {
            title: 'Login Attempts', 
            view: 'login', 
            showId: true,
            selectableRows: true, 
            creatable: false, 
            upadateable: false, 
            deletable: true, 
            copyable: true, 
        },
        subscriptions: {
            title: 'Subscriptions', 
            view: 'subscriptions', 
            showId: true,
            selectableRows: true, 
            creatable: false, 
            upadateable: true, 
            deletable: true, 
            copyable: true, 
        },
        logs: {
            title: 'Error Logs', 
            view: 'logs', 
            showId: true,
            selectableRows: true, 
            creatable: false, 
            upadateable: false, 
            deletable: true, 
            copyable: false, 
        },
        visits: {
            title: 'Websit Visitor Information', 
            view: 'visits', 
            showId: true,
            selectableRows: true, 
            creatable: false, 
            upadateable: false, 
            deletable: true, 
            copyable: false, 
        },
    },
    selectedIds: [],
    tableContent: [],
    settings: {
        showLogins: false,
    }
}



// Clear local storage and store jwt web token in the memory
// localStorage.setItem('token', undefined);



const remainingTimeSpan = document.getElementById('remaining-time');
setInterval(() => {
    if (app.remainingSeconds) {
        app.remainingSeconds -= 1;
        const remainingTime = moment(app.remainingSeconds * 1000).format('mm:ss');
        remainingTimeSpan.innerHTML = '<i class="far fa-clock"></i> Logout in: <span>' + remainingTime + '</span>';
        if (app.remainingSeconds < 0) logout();
    }
}, 1000);



const handleMenuOnClick = () => {
    app.isMenuOpen = !app.isMenuOpen;
    
    const menu = document.getElementById('main-menu');
    menu.style.display = app.isMenuOpen ? 'flex' : 'none';
    const viewContainer = document.getElementById('view-container');
    const footer = document.getElementsByTagName('footer')[0];

    if (app.isMenuOpen) {
        viewContainer.classList.remove('full-width');
        footer.classList.remove('full-width');
    }
    else {
        viewContainer.classList.add('full-width');
        footer.classList.add('full-width');
    }
}



async function DB(url, method, body) {
    displayLoadingSpinner(true);
    displayServerResponse(method, undefined, 'messages', url);

    const options = {
        method,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-auth-token': app.token
        },
        body: JSON.stringify(body)
    }

    let message, status;
    try {
        const response = await fetch(url, options);
        displayLoadingSpinner(false);
        message = response.statusText;
        status = response.status;
        const jsonResponse = await response.json();
        if (response.status >= 200 && response.status <= 299) {
            displayServerResponse(method, status, message, url);
            return jsonResponse;
        } else {
            if (!jsonResponse.success) {
                checkToken(status, jsonResponse.message);
            }
            displayServerResponse(method, response.status, response.message, url);
            return jsonResponse;
        }
    } catch (ex) { displayServerResponse(method, status || 'ERROR', ex, url); displayLoadingSpinner(false); }
}



function checkToken(status, message) {
    if (
        (status === 401 && message === 'Access denied: no JWT token is provided!') || 
        (status === 401 && message === 'Token expired!') ||
        (status === 400 && message === 'Invalid token!') ||
        status === 403 // NOT AN ADMIN
        ) logout(message);
}



async function run() {
    // Get remaining login time
    const { exp:expires } = await DB(app.url + '/api/remainingLoginTime', 'GET');
    const now = moment(new Date);
    const exp = moment(expires);
    app.remainingSeconds = moment.duration(exp.diff(now)).asSeconds();

    // As a default show message table
    const queryParams = Object.getOwnPropertyNames(app.views[app.view]).map(param => param + '=' + app.views[app.view][param]).join('&');
    const { table: messages, total, unopened } = await DB(app.url + `/api/${app.view}/` + '?' + queryParams, 'GET');

    app.tableOptions[app.view].total = total;
    app.tableOptions[app.view].unopened = unopened;
    const options = app.tableOptions[app.view];

    createTable(messages, options, document.getElementById('view-container'));
}
run();



function logout(message) { 
    function redirect() { window.location.replace('login.html'); }
    function redirectDelay() { setTimeout(() => { redirect(); }, 3000); }

    if (message) displayMessageOnWindow(message, ['OK'], [redirect], redirectDelay);
    else redirect();
}



function displayServerResponse(method, status, message, path) {
    const methodSpan = document.getElementById('request-method');
    const statusSpan = document.getElementById('response-status');
    const messageSpan = document.getElementById('response-message');
    const pathSpan = document.getElementById('request-path');
    
    methodSpan.innerHTML = method || "";
    statusSpan.innerHTML = status || "LOADING";
    messageSpan.innerHTML = message || "",
    pathSpan.innerHTML = path || "";

    if (status && (status >= 200 && status <= 299)) {
        statusSpan.className = 'ok'
    }
    else if (status) {
        statusSpan.className = 'error'
    }
    else {
        statusSpan.className = 'pending'
    }
}



function displayMessageOnWindow(message, buttons, callbacks, callAnyway) {
    document.getElementById('user-message-screen').style.display = 'flex';
    const userMessageDiv = document.getElementById('user-message');
    userMessageDiv.innerHTML = message;

    const buttonContainer = document.createElement('div');
    userMessageDiv.appendChild(buttonContainer);

    buttons.forEach((btn, index) => {
        const button = document.createElement('button');
        button.innerHTML = btn;
        buttonContainer.appendChild(button);
        const callBackFunction = function() {
            if (callbacks && callbacks[index]) callbacks[index]();
            document.getElementById('user-message-screen').style.display = 'none';
        }

        button.addEventListener('click', callBackFunction);
    });

    if (callAnyway) callAnyway();
}



const firstLetterUpperCase = str => str[0].toUpperCase() + str.substring(1);



function isAllRowsSelectedOnPage(content) {
    let totalLength = content.length;
    let selectedIdsOnPage = content.filter(row => app.selectedIds.includes(row._id)).map(row => row._id);
    return selectedIdsOnPage.length === totalLength;
}



function createTable(content, options, appendTo) {
    // Delete previous table
    const prevContent = document.querySelector(`#${appendTo.id} > *:not(#loading-spinner)`);
    if (prevContent) appendTo.removeChild(prevContent);

    app.tableContent = content; // Store table content for future referrals like select, read etc...
    // If we have content data to display
    if (content && content.length) {
        // Create table
        const table = document.createElement('table');
        const tHead = document.createElement('caption');
        const tNav = document.createElement('nav');
        const caption = document.createElement('div');
        const tHeaderRow = document.createElement('tr');
        const tBody = document.createElement('tbody');
        caption.innerHTML = options.title;
        tNav.id = 'table-navigation';
        tHeaderRow.id = 'table-header-titles';

        tHead.appendChild(caption);
        tHead.appendChild(tNav);
        table.appendChild(tHeaderRow);
        table.appendChild(tHead);
        table.appendChild(tBody);
        appendTo.appendChild(table);

        // Create table navigation / functionality
        // Pagination
        const pagination = document.createElement('nav');
        const prevBtn = document.createElement('button');
        const nextBtn = document.createElement('button');
        const currPage = document.createElement('span');
        const total = options.total;
        const limit = Number(app.views[options.view].limit || localStorage.getItem('custom-table-limit'));
        const page = app.views[options.view].page;
        const from = total - page * limit;
        const till = total - (page + 1) * limit + 1 > 1 ? total - (page + 1) * limit + 1 : 1;
        const lastPage = Math.ceil(total / limit);

        pagination.id = 'pagination';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        prevBtn.id = 'pagination__prev';
        nextBtn.id = 'pagination__next';
        prevBtn.title = 'Previous Page';
        nextBtn.title = 'Next Page';
        prevBtn.dataset.targetDB = options.view;
        nextBtn.dataset.targetDB = options.view;
        currPage.innerHTML = app.views[options.view].page + 1 + '&nbsp;OF&nbsp;' + lastPage; 

        if (page === 0) prevBtn.disabled = true;
        if (page >= lastPage - 1) nextBtn.disabled = true;
        
        pagination.appendChild(prevBtn);
        pagination.appendChild(currPage);
        pagination.appendChild(nextBtn);
        tNav.appendChild(pagination);

        // Custom limit
        const customLimit = document.createElement('div')
        customLimit.id = 'custom-limit';
        customLimit.innerHTML = `DISPLAYING ROWS ${from}-${till} BY `;
        
        const limitInput = document.createElement('input');
        limitInput.id = 'limit-input';
        limitInput.value = limit;
        
        customLimit.appendChild(limitInput);
        tNav.appendChild(customLimit);

        // Unopened messages
        if (app.view === 'messages' && options.unopened) {
            const unopenedInfo = document.createElement('span');
            unopenedInfo.id = 'unopened-info';
            unopenedInfo.innerHTML = '<i class="far fa-envelope"></i><span>' + options.unopened + '</span> OF ' + options.total + ' UNOPENED ';
            tNav.appendChild(unopenedInfo);
        }

        // CRUD operations and other functionalities
        const functionalities = document.createElement('div');
        const refreshBtn = document.createElement('button'); 
        const createBtn = document.createElement('button');
        const copyEmailBtn = document.createElement('button');
        const updateBtn = document.createElement('button');
        const deleteBtn = document.createElement('button');

        refreshBtn.id = 'func--refresh';
        createBtn.id = 'func--create';
        copyEmailBtn.id = 'func--copy';
        updateBtn.id = 'func--update';
        deleteBtn.id = 'func--delete';

        refreshBtn.innerHTML = '<i class="fas fa-redo-alt"></i>';
        createBtn.innerHTML = '<i class="fas fa-plus"></i>';
        copyEmailBtn.innerHTML = '<i class="fas fa-at"></i>';
        updateBtn.innerHTML = '<i class="fas fa-pen"></i>';
        deleteBtn.innerHTML = '<i class="far fa-trash-alt"></i>';

        functionalities.id = 'functionalities';

        refreshBtn.title = 'Refresh Table';
        createBtn.title = 'Create Row';
        copyEmailBtn.title = 'Copy Email to Clipboard';
        updateBtn.title = 'Modify Selected Row';
        deleteBtn.title = 'Delete Selected Row';

        const creatable = app.tableOptions[app.view].creatable;
        if (!creatable) createBtn.disabled = true;
        const updatable = app.tableOptions[app.view].upadateable;
        if (!updatable) updateBtn.disabled = true;
        const deletable = app.tableOptions[app.view].deletable;
        if (!deletable) deleteBtn.disabled = true;

        functionalities.appendChild(refreshBtn);
        functionalities.appendChild(createBtn);
        functionalities.appendChild(copyEmailBtn);
        functionalities.appendChild(updateBtn);
        functionalities.appendChild(deleteBtn);
        tNav.appendChild(functionalities);
        
        // Get table fieldnames
        const selectColumn = options.selectableRows ? 'select ': '';
        const selectParam = selectColumn + app.views[options.view].select;
        const titles = selectParam.split(' ');      

        const hasEmail = titles.includes('email');
        if (!hasEmail) copyEmailBtn.disabled = true;

        // Get indexes of particular column titles
        let _idFieldIndex; // column index of _id: _id is monospace
        let isReadIndex;   // column index of message read property (read/unread envelope)
        let selectedIndex; // column index of selection (default 0 (first column))
        let dateIndex;     // column index of date: dates are formatted
        let messageIndex;  // column index of message: message will take as much space as possible
        let firstNameIndex;// column index of First name
        let lastNameIndex; // column index of Last name
        let ipIndex;       // column index of IP
        let adminIndex;    // column index of isAdmin

        const { sortBy, desc:descending } = app.views[app.view];

        // Create header for table
        titles.forEach((tHeader, tHeaderIndex) => {
                const th = document.createElement('th');
                th.dataset.sortBy = tHeader;
                th.dataset.descending = descending;
                th.innerHTML = firstLetterUpperCase(tHeader);        // First character of header texts uppercase 

                if (tHeader === '_id') _idFieldIndex = tHeaderIndex; // find _id column index
                else if (tHeader === 'read') {
                    th.classList.add('envelope');
                    isReadIndex = tHeaderIndex;                      // find read column index
                    th.innerHTML = '';
                    delete th.dataset.sortBy;
                    delete th.dataset.descending;
                }
                else if (tHeader === 'select') {
                    const allSelected = isAllRowsSelectedOnPage(content);
                    th.innerHTML = allSelected ? '<i class="fas fa-check-square"></i>' : '<i class="fas fa-square"></i>'; // check column has no header text 
                    th.title = allSelected ? 'Deselect All' : 'Select All';
                    th.classList.add('select-all-icon');
                    th.id = 'select-all';
                    selectedIndex = tHeaderIndex;
                    delete th.dataset.sortBy;
                    delete th.dataset.descending;
                }
                else if (tHeader === 'date') dateIndex = tHeaderIndex;
                else if (tHeader === 'firstName') {
                    firstNameIndex = tHeaderIndex;
                    th.innerHTML = 'First&nbsp;Name'; // Beautify firstName
                }
                else if (tHeader === 'lastName') {
                    lastNameIndex = tHeaderIndex;
                    th.innerHTML = 'Last&nbsp;Name';   // Beautify lastName
                }
                else if (tHeader === 'message') messageIndex = tHeaderIndex;
                else if (tHeader === 'ip') ipIndex = tHeaderIndex;
                else if (tHeader === 'isAdmin') th.innerHTML = 'Admin';

                // Add sorting icon arrow
                if (tHeader === sortBy) th.innerHTML += descending ? '<i class="fas fa-chevron-down"></i>' : '<i class="fas fa-chevron-up"></i>';
                if (app.view === 'logs' && tHeader === 'name') th.innerHTML = tHeader; // Remove arrow as it is impossible to sort by certain properties in the database
                if (app.view === 'logs' && tHeader === 'stack') th.innerHTML = tHeader;// --''--
                          
                tHeaderRow.appendChild(th);
        });

        // Create table rows and cells
        content.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            
            if (app.view === 'messages' && !content[rowIndex].read) tr.classList.add('unread');  // Unread messages are bold
            if (app.view === 'logs') tr.classList.add('log-row');

            titles.forEach((prop, propIndex) => {
                const td = document.createElement('td');
                td.innerHTML = content[rowIndex][prop];
                td.dataset.index = rowIndex;

                if (propIndex === _idFieldIndex) td.classList.add('_id');
                else if (propIndex === isReadIndex) { 
                    td.classList.add('envelope'); // opened/closed envelope icon
                    td.innerHTML = content[rowIndex][prop] === true ? '<i class="far fa-envelope-open"></i>' : '<i class="far fa-envelope"></i>';
                }
                else if (propIndex === selectedIndex) {
                    td.classList.add('select');
                    const isSelected = app.selectedIds.includes(content[rowIndex]._id);
                    const contentHasId = content[rowIndex]._id;

                    if (contentHasId && isSelected) {
                        td.innerHTML = '<i class="far fa-dot-circle">';
                        td.classList.add('selected');
                        tr.classList.add('selected');
                    }
                    else td.innerHTML = '<i class="far fa-circle"></i>';
                }
                else if (propIndex === dateIndex) {
                    const date = moment(content[rowIndex][prop]).format('DD.MM.YY HH:mm');
                    td.innerHTML = date;
                }
                else if (propIndex === messageIndex) {
                    td.style.width = '100%'
                }
                else if (propIndex === firstNameIndex || propIndex === lastNameIndex) td.innerHTML = firstLetterUpperCase(content[rowIndex][prop]);
                else if (propIndex === ipIndex) td.classList.add('ip');
                else if (content[rowIndex][prop] === true || content[rowIndex][prop] === false) td.classList.add('boolean', content[rowIndex][prop]);
                else if (content[rowIndex][prop] === 'undefined' || typeof content[rowIndex][prop] === 'undefined') td.classList.add('undefined');
                
                tr.appendChild(td);
            });
            tBody.appendChild(tr);
        });
    } 
    else {
        displayMessageOnWindow('This database is empty!', ['ok']);
    }
}



document.getElementById('view-container').addEventListener('click', async event => {
    const rowIndex = event.target.dataset.index;    
    const selectPressed = event.target.classList.contains('select');
 
    // Row Selection
    if (rowIndex && selectPressed) {
        const _id = app.tableContent[rowIndex]._id;
        const selectAllBtn = document.getElementById('select-all');

        // if _id is already selected, take it off from selectedIds array
        if (app.selectedIds.includes(_id)) {
            app.selectedIds = app.selectedIds.filter(selectedId => selectedId !== _id); // Modify array
            event.target.innerHTML = '<i class="far fa-circle">';
            event.target.classList.remove('selected');
            event.target.closest("tr").classList.remove('selected');
            if (isAllRowsSelectedOnPage(app.tableContent)) selectAllBtn.innerHTML = '<i class="fas fa-square"></i>';
        }
        else {
            app.selectedIds.push(_id);
            event.target.innerHTML = '<i class="far fa-dot-circle">';
            event.target.classList.add('selected');
            event.target.closest("tr").classList.add('selected');
            if (isAllRowsSelectedOnPage(app.tableContent)) selectAllBtn.innerHTML = '<i class="fas fa-check-square"></i>';
        }
    }

    // Select all
    if (event.target.id === 'select-all') {
        const allSelected = isAllRowsSelectedOnPage(app.tableContent);
        const rowIds = app.tableContent.map(row => row._id);
        if (allSelected) {
            app.selectedIds = app.selectedIds.filter(id => !rowIds.includes(id));
        } else {
            app.selectedIds = [...new Set(app.selectedIds.concat(rowIds))];
        }
        createTable(app.tableContent, app.tableOptions[app.view], document.getElementById('view-container'));
    }

    // Read rows
    if (app.view === 'messages' && !selectPressed && rowIndex) {
        const rowContent = app.tableContent[rowIndex];

        const message = `
            From: ${rowContent.email}<br />
            Name: ${firstLetterUpperCase(rowContent.firstName) + ' ' + firstLetterUpperCase(rowContent.lastName)}<br />
            ${moment(rowContent.date).format('DD.MM.YYYY HH:mm')}<br />
            <br /><hr style="width: 100%; color: #333; background-color: #333, border-color: #333">   
            ${rowContent.message}
        `;

        // Mark messages as read
        async function markMessageAsRead() {
            if (rowContent.read) return;
            const url = app.url + '/api/messages/' + rowContent._id;
            const method = 'PUT';
            displayLoadingSpinner(true);
            displayServerResponse(method, undefined, 'messages [read=true]', url);

            const options = {
                method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'x-auth-token': app.token
                },       
                body: JSON.stringify({ read: true }),
            }

            try {
                const response = await fetch(url, options);
                const jsonResponse = await response.json();
                displayLoadingSpinner(false);
                
                if (response.status >= 200 && response.status <= 299) {
                    displayServerResponse(method, response.status, jsonResponse.message, url);
                    
                    app.tableContent[rowIndex].read = true;
                    const options = app.tableOptions.messages;

                    createTable(app.tableContent, options, document.getElementById('view-container'));
                    return jsonResponse;
                } else {
                    if (!jsonResponse.success) checkToken(response.status, jsonResponse.message);

                    displayServerResponse(method, response.status, jsonResponse.message, url);
                    return jsonResponse;
                }
            } catch (ex) { displayMessageOnWindow(ex); }
        }
        displayMessageOnWindow(message, ['OK'], [ markMessageAsRead ]);
    }

    // Read Logs
    if (app.view === 'logs' && !selectPressed && rowIndex) {
        const rowContent = app.tableContent[rowIndex];

        const message = `
            Timestamp: ${rowContent.timestamp}<br />
            Error Name: ${rowContent.name}<br />
            Error Message: ${rowContent.message}</br>
            <hr style="width: 100%; color: #333; background-color: #333, border-color: #333"></br>   
            Stack ${rowContent.stack.split(' at ').join('<br /> at ')}
        `;
        displayMessageOnWindow(message, ['OK']);
        document.getElementById('user-message').style.fontFamily = 'Fira';
    }

    // Manage table pagination
    if (event.target.id === 'pagination__prev' || event.target.id === 'pagination__next') {
        const targetDB = event.target.dataset.targetDB;
        const currentPage = app.views[app.view].page;
        app.views[app.view].page = event.target.id === 'pagination__prev' ? currentPage - 1 : currentPage + 1;

        // Load new page of the table
        const queryParams = Object.getOwnPropertyNames(app.views[app.view]).map(param => param + '=' + app.views[targetDB][param]).join('&');
        const { table, total } = await DB(app.url + '/api/' + targetDB + '/?' + queryParams, 'GET');
        
        app.tableOptions[app.view].total = total;
        const options = app.tableOptions[app.view];


        createTable(table, options, document.getElementById('view-container'));        
    } 

    // Table functions
    // REFRESH
    if (event.target.id == 'func--refresh') {
        if (app.view === 'emails') {
            const subscriptionsParams = Object.getOwnPropertyNames(app.views.subscriptions).map(param => param + '=' + app.views.subscriptions[param]).join('&');
            let { table: subscriptions, total:totalSubscriptions } = await DB(app.url + `/api/subscriptions/` + '?' + subscriptionsParams, 'GET');
            subscriptions = subscriptions.filter(sub => sub.active);    

            app.tableOptions[app.view].total = totalSubscriptions;
            const options = app.tableOptions[app.view];

            createTable(subscriptions, options, document.getElementById('view-container'));
        }
        else {
            refreshTable();
        }
    }

    // CREATE
    if (event.target.id == 'func--create') {
        if (app.view === 'users') {
            const createUserContainer = document.createElement('div');
            const createUserForm = document.createElement('form');

            createUserContainer.id = 'create-user-container';
            createUserContainer.style.display = 'flex';
            createUserForm.id = 'create-user-form';

            const h1 = document.createElement('h1');
            h1.innerHTML = '<i class="far fa-user"></i> Create User';

            const userNameDiv = document.createElement('div');
            const userNameLabel = document.createElement('label');
            userNameLabel.innerHTML = 'Name';
            
            const userNameInput = document.createElement('input');
            userNameInput.id = 'user-name-input';
            userNameInput.type = 'text';

            userNameDiv.appendChild(userNameLabel);
            userNameDiv.appendChild(userNameInput);

            const userEmailDiv = document.createElement('div');
            const userEmailLabel = document.createElement('label');
            userEmailLabel.innerHTML = 'Email';

            const userEmailInput = document.createElement('input');
            userEmailInput.id = 'user-email-input';
            userEmailInput.type = 'email';

            userEmailDiv.appendChild(userEmailLabel);
            userEmailDiv.appendChild(userEmailInput);

            const passwordDiv = document.createElement('div');
            const passwordLabel = document.createElement('label');
            passwordLabel.innerHTML = 'Password';

            const passwordInput = document.createElement('input');
            passwordInput.id = 'password-input';
            passwordInput.type = 'password';

            passwordDiv.appendChild(passwordLabel);
            passwordDiv.appendChild(passwordInput);

            const confirmPasswordDiv = document.createElement('div');
            const confirmPasswordLabel = document.createElement('label');
            confirmPasswordLabel.innerHTML = 'Confirm Password';

            const confirmPasswordInput = document.createElement('input');
            confirmPasswordInput.id = 'confirm-password-input';
            confirmPasswordInput.type = 'password';

            confirmPasswordDiv.appendChild(confirmPasswordLabel);
            confirmPasswordDiv.appendChild(confirmPasswordInput);

            const isAdminDiv = document.createElement('div');
            const isAdminLabel = document.createElement('label');
            isAdminLabel.innerHTML = 'Admin';
            const isAdminCheckBox = document.createElement('input');
            isAdminCheckBox.type = 'checkbox';
            isAdminCheckBox.id = 'user-admin-checkbox';
            isAdminDiv.appendChild(isAdminLabel);
            isAdminDiv.appendChild(isAdminCheckBox);

            const errorMessage = document.createElement('span');
            errorMessage.id = 'create-user-error-msg';

            const buttonContainer = document.createElement('div');
            const submitBtn = document.createElement('button');
            submitBtn.addEventListener('click', event => submitNewUser(event));

            submitBtn.innerHTML = 'Submit';
            const cancelBtn = document.createElement('button');
            cancelBtn.innerHTML = 'Cancel';
            cancelBtn.addEventListener('click', () => document.getElementsByTagName('body')[0].removeChild(createUserContainer));

            buttonContainer.appendChild(submitBtn);
            buttonContainer.appendChild(cancelBtn);

            createUserForm.appendChild(h1);
            createUserForm.appendChild(userNameDiv);
            createUserForm.appendChild(userEmailDiv);
            createUserForm.appendChild(passwordDiv);
            createUserForm.appendChild(confirmPasswordDiv);
            createUserForm.appendChild(isAdminDiv);
            createUserForm.appendChild(errorMessage);
            createUserForm.appendChild(buttonContainer);
            createUserContainer.appendChild(createUserForm);
            document.getElementsByTagName('body')[0].appendChild(createUserContainer);

            function submitNewUser(event) {
                event.preventDefault();
                const name = document.getElementById('user-name-input').value;
                const email = document.getElementById('user-email-input').value;
                const password = document.getElementById('password-input').value;
                const confirm = document.getElementById('confirm-password-input').value;
                const isAdmin = document.getElementById('user-admin-checkbox').checked;

                function validateInputs() {
                    // Validate name
                    if (!name) return 'Name is required!';
                    if (name.length < 5) return 'Name must be min 5 chars!';
                    if (name.length > 50) return 'Name max length is 50!';
                    const invalidCharInName = name.match(/[^a-z \-']/gi);
                    if (invalidCharInName) return 'Invalid character in name! ' + invalidCharInName[0];
    
                    // Validate email
                    if (!email) return 'Email is required!';
                    const emailRegExp = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
                    if (!emailRegExp.test(email)) return 'Invalid email format!';

                    // Validate Password
                    if (!password) return 'Password is required!';
                    if (password.length < 8) return 'Password must be at least 8 char long!'
                    if (password.length > 50) return 'Password max length is 50!';
                    const invalidCharInPassword = password.match(/[^A-Z0-9&%$£@\-_+=#?><.|]/gi);
                    if (invalidCharInPassword) return 'Invalid character in password! ' + invalidCharInPassword[0];
                    const hasLowerCase = /[a-z]/g.test(password);
                    if (!hasLowerCase) return 'Password must have lowercase letter!';
                    const hasUpperCase = /[A-Z]/g.test(password);
                    if (!hasUpperCase) return 'Password must have uppercase letter!';
                    const hasNumberCase = /[0-9]/g.test(password);
                    if (!hasNumberCase) return 'Password must have number!';

                    // Validate Confirm Password
                    if (!confirm) return 'Please confirm pasword!';
                    if (password !== confirm) return 'Password doesn\'t match!';                  
                    
                    return undefined;
                }

                async function submitNewUserToDB() {
                    const body = { name, email, password, isAdmin };
                    const result = await DB(app.url + '/api/users/', 'POST', body);

                    if (!result.success) errorMessage.innerHTML = result.error;
                    if (!result) errorMessage.innerHTML = 'Something went wrong!';

                    if (result.success) {
                        displayMessageOnWindow(`New user (${ name }) added!`, ['OK']);

                        const queryParams = Object.getOwnPropertyNames(app.views[app.view]).map(param => param + '=' + app.views[app.view][param]).join('&');
                        const { table: users, total } = await DB(app.url + `/api/${app.view}/` + '?' + queryParams, 'GET');

                        app.tableOptions[app.view].total = total;
                        const options = app.tableOptions[app.view];

                        createTable(users, options, document.getElementById('view-container'));
                        document.getElementsByTagName('body')[0].removeChild(createUserContainer);
                    }
                }

                const errorMessageText = validateInputs();
                errorMessage.innerHTML = errorMessageText ? errorMessageText : '';

                if (!errorMessageText) submitNewUserToDB();
            }
        }
    }

    // COPY EMAIL
    if (event.target.id == 'func--copy') {
        if (!app.selectedIds.length) displayMessageOnWindow('You need to select at least one table row in order to copy its email address to the clipboard!', ['OK']);
        else {
            let emailArr;
            if (app.view === 'emails') {
                const subscriptionsParams = Object.getOwnPropertyNames(app.views.subscriptions).map(param => param + '=' + app.views.subscriptions[param]).join('&');
                let { table: subscriptions } = await DB(app.url + `/api/subscriptions/` + '?' + subscriptionsParams, 'GET');
                subscriptions = subscriptions.filter(sub => sub.active);
                emailArr = subscriptions.map(sub => sub.email);    
            }
            else {
                const { table } = await DB(app.url + `/api/${app.view}/`, 'GET');
                emailArr = [...new Set(table.filter(row => app.selectedIds.includes(row._id)).map(row => row.email))];
            }
            const copyText = document.createElement('input');
            copyText.value = emailArr.join(', ');        
            copyText.select(); // Select the text field 
            copyText.setSelectionRange(0, 99999); // For mobile devices
            navigator.clipboard.writeText(copyText.value);
            displayMessageOnWindow('Copied on clipboard:<br />' + copyText.value, ['OK']);
        }
    }

    // UDATE / MODIFY
    if (event.target.id == 'func--update') {
        if (app.view === 'users') {
            if (!app.selectedIds.length) displayMessageOnWindow('You need to select at least one user in order to update it!', ['OK']);
            else if (app.selectedIds.length > 1) displayMessageOnWindow('Only one user can be selected for update!', ['OK']);
            else {
                const { user, success, message } = await DB(app.url + `/api/users/` + app.selectedIds[0], 'GET');
                if (!success) displayMessageOnWindow(message, ['OK']);
                else {
                    displayMessageOnWindow(`Do you want to ${user.isAdmin ? 'remove' : 'add'} admin rights for ${user.name}?`, ['Change Admin Rights', 'Cancel'], [() => changeAdminRights(user._id, !user.isAdmin)]);
                    async function changeAdminRights(id, updatedAdminRights) {
                        const { user, success, message } = await DB(app.url + `/api/users/` + id, 'PUT', { isAdmin: updatedAdminRights });
                        if (!success) displayMessageOnWindow(message, ['OK']);
                        else refreshTable();
                    }
                }
            }
        }

        if (app.view === 'subscriptions') {
            if (!app.selectedIds.length) displayMessageOnWindow('You need to select at least one subscription in order to update it!', ['OK']);
            else if (app.selectedIds.length > 1) displayMessageOnWindow('Only one subscription can be selected for update!', ['OK']);
            else {
                const { subscription, success, message } = await DB(app.url + `/api/subscriptions/` + app.selectedIds[0], 'GET');
                if (!success) displayMessageOnWindow(message, ['OK']);
                else {
                    displayMessageOnWindow(`Do you want to ${subscription.active ? 'deactivate' : 'activate'} subsctiption of ${subscription.email}?`, ['Change Active Status', 'Cancel'], [() => updateActiveStatus(subscription._id, !subscription.active)]);
                    async function updateActiveStatus(id, active) {
                        const { subscription, success, message } = await DB(app.url + `/api/subscriptions/` + id, 'PUT', { active });
                        if (!success) displayMessageOnWindow(message, ['OK']);
                        else refreshTable();
                    }
                }
            }
        }
    }

    // DELETE
    if (event.target.id == 'func--delete') {
        if (!app.selectedIds.length) displayMessageOnWindow('You need to select at least one table row in order to delete items from the table!', ['OK']);
        else {
            displayMessageOnWindow(`You are about to delete ${app.selectedIds.length} item(s) from your database.<br/> Select OK to continue!`, ['OK', 'Cancel'], [deleteItems, () => {}]);
            async function deleteItems() {
                const result = await DB(app.url + `/api/${app.view}/${app.selectedIds.join(',')}`, 'DELETE');
                if (!result) return;
                
                const queryParams = Object.getOwnPropertyNames(app.views[app.view]).map(param => param + '=' + app.views[app.view][param]).join('&');
                const { table, total } = await DB(app.url + `/api/${app.view}/` + '?' + queryParams, 'GET');

                app.tableOptions[app.view].total = total;
                const options = app.tableOptions[app.view];

                app.selectedIds = [];
                createTable(table, options, document.getElementById('view-container'));
            }
        }
    }

    // Set custom table page limit
    if (event.target.id === 'limit-input') {
        const limitInput = document.getElementById('limit-input');
        limitInput.addEventListener('change', handleInputOnchange);
        
        async function handleInputOnchange(event) {
            const maxLimit = 99;
            let newLimit = Number(limitInput.value);
            
            if (newLimit > maxLimit) displayMessageOnWindow(`Limit cannot be greater than ${maxLimit}!`, ['OK'], [() => setCustomTableLimit()]);
            if (newLimit < 10) displayMessageOnWindow(`Limit cannot be smaller than 10!`, ['OK'], [() => setCustomTableLimit()]);
            else setCustomTableLimit(newLimit);
            
            newLimit = newLimit < 10 ? setCustomTableLimit() : newLimit > maxLimit ? setCustomTableLimit() : newLimit; 
            localStorage.setItem('custom-table-limit', newLimit || limit);
            app.views[app.view].limit = newLimit;
            limitInput.value = newLimit;
            limitInput.blur();
            
            const queryParams = Object.getOwnPropertyNames(app.views[app.view]).map(param => param + '=' + app.views[app.view][param]).join('&');
            const { table: messages, total } = await DB(app.url + `/api/${app.view}/` + '?' + queryParams, 'GET');
    
            app.tableOptions[app.view].total = total;
            const options = app.tableOptions[app.view];
    
            createTable(messages, options, document.getElementById('view-container'));           
        }
    }

    // Sort tables
    if (event.target.dataset.sortBy) {
        if (app.view === 'logs') {
            if (event.target.dataset.sortBy === 'name') return;
            if (event.target.dataset.sortBy === 'stack') return;
        }
        const oldSortBy = app.views[app.view].sortBy;
        const newSortBy = event.target.dataset.sortBy;
        let newDescending = event.target.dataset.descending === 'true';
        
        // Toggle descending / ascending
        if (oldSortBy === newSortBy) newDescending = !newDescending;
        app.views[app.view].sortBy = newSortBy;
        app.views[app.view].desc = newDescending;

        const queryParams = Object.getOwnPropertyNames(app.views[app.view]).map(param => param + '=' + app.views[app.view][param]).join('&');
        const { table: messages, total } = await DB(app.url + `/api/${app.view}/` + '?' + queryParams, 'GET');

        app.tableOptions[app.view].total = total;
        const options = app.tableOptions[app.view];

        createTable(messages, options, document.getElementById('view-container'));           
    }
});

document.getElementById('main-menu').addEventListener('click', async event => {
    const targetId = event.target.id;
    app.selectedIds = [];
    function selectMenuItem(menuItem) {
        // Remove dots from all circles
        document.querySelectorAll('#table-list > li > i:last-child').forEach(circle => circle.classList = 'far fa-circle');
        // Remove selected from all menu list items
        document.querySelectorAll('#main-menu .selected').forEach(listItem => listItem.classList.remove('selected'));

        // If sublist of tables
        if (['messages', 'users', 'logins', 'subscriptions', 'logs', 'visits'].includes(menuItem)) {
            // Replace dot in circle
            document.querySelector(`#${menuItem} > i:last-child`).className = 'far fa-dot-circle';
            // Select TableList
            document.querySelector(`#tables`).className = 'selected';
        }
        document.querySelector(`#${menuItem}`).className = 'selected';
    }

    switch (targetId) {
        case 'emails': { 
            app.view = 'emails';
            selectMenuItem('emails');
            const subscriptionsParams = Object.getOwnPropertyNames(app.views.subscriptions).map(param => param + '=' + app.views.subscriptions[param]).join('&');
            let { table: subscriptions, totalActive } = await DB(app.url + `/api/subscriptions/` + '?' + subscriptionsParams, 'GET');
            subscriptions = subscriptions.filter(sub => sub.active);    

            app.tableOptions[app.view].total = totalActive;
            const options = app.tableOptions[app.view];

            createTable(subscriptions, options, document.getElementById('view-container'));
            break; 
        }
        //case 'tables': { 
        //    app.view = 'tables';
        //    selectMenuItem('tables');
        //    break; 
        //}
        case 'messages': { 
            app.view = 'messages';
            selectMenuItem('messages');
            const queryParams = Object.getOwnPropertyNames(app.views[app.view]).map(param => param + '=' + app.views[app.view][param]).join('&');
            const { table: messages, total } = await DB(app.url + `/api/${app.view}/` + '?' + queryParams, 'GET');

            app.tableOptions[app.view].total = total;
            const options = app.tableOptions[app.view];

            createTable(messages, options, document.getElementById('view-container'));
            break; 
        }
        case 'users': { 
            app.view = 'users';
            selectMenuItem('users');
            const queryParams = Object.getOwnPropertyNames(app.views[app.view]).map(param => param + '=' + app.views[app.view][param]).join('&');
            const { table: users, total } = await DB(app.url + `/api/${app.view}/` + '?' + queryParams, 'GET');

            app.tableOptions[app.view].total = total;
            const options = app.tableOptions[app.view];

            createTable(users, options, document.getElementById('view-container'));
            break; 
        }
        case 'logins': { 
            app.view = 'login';
            selectMenuItem('logins');
            const queryParams = Object.getOwnPropertyNames(app.views[app.view]).map(param => param + '=' + app.views[app.view][param]).join('&');
            const { table: logins, total } = await DB(app.url + `/api/${app.view}/` + '?' + queryParams, 'GET');

            app.tableOptions[app.view].total = total;
            const options = app.tableOptions[app.view];

            createTable(logins, options, document.getElementById('view-container'));
            break; 
        }
        case 'subscriptions': { 
            app.view = 'subscriptions';
            selectMenuItem('subscriptions');
            const queryParams = Object.getOwnPropertyNames(app.views[app.view]).map(param => param + '=' + app.views[app.view][param]).join('&');
            const { table: subscriptions, total } = await DB(app.url + `/api/${app.view}/` + '?' + queryParams, 'GET');
 
            app.tableOptions[app.view].total = total;
            const options = app.tableOptions[app.view];
            createTable(subscriptions, options, document.getElementById('view-container'));
            break; 
        }
        case 'logs': { 
            app.view = 'logs';
            selectMenuItem('logs');
            const queryParams = Object.getOwnPropertyNames(app.views[app.view]).map(param => param + '=' + app.views[app.view][param]).join('&');
            const { table: logs, total } = await DB(app.url + `/api/${app.view}/` + '?' + queryParams, 'GET');
 
            app.tableOptions[app.view].total = total;
            const options = app.tableOptions[app.view];
            createTable(logs, options, document.getElementById('view-container'));
            break; 
        }
        case 'visits': { 
            app.view = 'visits';
            selectMenuItem('visits');
            const queryParams = Object.getOwnPropertyNames(app.views[app.view]).map(param => param + '=' + app.views[app.view][param]).join('&');
            const { table: visits, total } = await DB(app.url + `/api/${app.view}/` + '?' + queryParams, 'GET');
 
            app.tableOptions[app.view].total = total;
            const options = app.tableOptions[app.view];
            createTable(visits, options, document.getElementById('view-container'));
            break; 
        }
        case 'stats': { 
            app.view = 'stats';
            selectMenuItem('stats');
            createStatistics();
            break; 
        }
        case 'settings': { 
            app.view = 'settings';
            selectMenuItem('settings');
            displaySettings();
            break; 
        }
        case 'logout': { logout(); break; }
    }
});



async function refreshTable() {
    const queryParams = Object.getOwnPropertyNames(app.views[app.view]).map(param => param + '=' + app.views[app.view][param]).join('&');
        const { table, total } = await DB(app.url + `/api/${app.view}/` + '?' + queryParams, 'GET');

        app.tableOptions[app.view].total = total;
        const options = app.tableOptions[app.view];

        createTable(table, options, document.getElementById('view-container'));
}



function displayLoadingSpinner(on) {
    const loadingSpinner = document.getElementById('loading-spinner');
    loadingSpinner.style.display = on ? 'block' : 'none';
}

async function createStatistics() {
    const { table: subscriptions } = await DB(app.url + '/api/subscriptions/', 'GET');
    const { table: messages } = await DB(app.url + '/api/messages/', 'GET');
    const { table: visits } = await DB(app.url + '/api/visits/', 'GET');
    const { table: logs } = await DB(app.url + '/api/logs/', 'GET');
    const { table: tokens } = await DB(app.url + '/api/tokens', 'GET');
    const { dbStats } = await DB(app.url + '/api/stats/', 'GET');
    const totalBytes = Object.values(dbStats).reduce((prev, curr) => prev + curr, 0);
    const byteToMb = bytes => Number(bytes) / (1024 * 1024);
    const totalMb = byteToMb(totalBytes);
    const totalPercentage = (totalMb / 500) * 100;
    app.statTables = { subscriptions, messages, visits, logs };
    
    const viewContainer = document.getElementById('view-container');
    const prevContent = document.querySelector(`#view-container > *:not(#loading-spinner)`);
    if (prevContent) viewContainer.removeChild(prevContent);

    const statsDiv = document.createElement('div');
    statsDiv.id = 'stats';
    
    // Database storage space
    const dbStorageDiv = document.createElement('div');
    const dbStorageH1 = document.createElement('h1');
    dbStorageH1.innerHTML = 'Database storage' ;

    let p = document.createElement('p');
    p.innerHTML = `Physical size: ${totalMb.toFixed(2)}Mb of 500Mb [ ${totalPercentage.toFixed(2)}% ]`;
    
    const dbStoragePercentOuter = document.createElement('div');
    dbStoragePercentOuter.id = 'db-storage-outer';
    const dbStoragePercentInner = document.createElement('div');
    dbStoragePercentInner.id = 'db-storage-inner';
    dbStoragePercentInner.style.width = totalPercentage.toFixed(2) + '%';

    // Database storage distribution
    const dbDistributionDiv = document.createElement('div');
    dbDistributionDiv.id = 'db-distribution';
    Object.keys(dbStats).forEach(key => {
        const collectionStorageDiv = document.createElement('div');
        collectionStorageDiv.classList.add('db-collection');
        const collectionStorageOuter = document.createElement('div');
        collectionStorageOuter.classList.add('db-collection-outer');
        const collectionStorageInner = document.createElement('div');
        collectionStorageInner.classList.add('db-collection-inner');
        const p = document.createElement('p');
        const p2 = document.createElement('p');

        const percent = dbStats[key] / totalBytes * 100;
        collectionStorageInner.style.height = percent + '%';
        p.innerHTML = percent.toFixed(2) + '%';
        p2.innerHTML = key;

        collectionStorageOuter.appendChild(collectionStorageInner);
        collectionStorageDiv.appendChild(collectionStorageOuter);
        collectionStorageDiv.appendChild(p);
        collectionStorageDiv.appendChild(p2);
        dbDistributionDiv.appendChild(collectionStorageDiv);
    });

    // Site Activity Graph (github style)
    const siteActivityDiv = document.createElement('div');
    siteActivityDiv.classList.add('site-activity-container');
    siteActivityDiv.id = 'site-activity';
    const h1SiteActivity = document.createElement('h1');
    h1SiteActivity.innerHTML = 'Site Activity';
    siteActivityDiv.appendChild(h1SiteActivity);

    const getToggleState = () => app.settings.showLogins;
    const includeLoginsToggle = createToggle(
        'show-successful-login-toggle', 
        getToggleState,
        "Show Login Activities",
        handleToggleSwitch
    );
    siteActivityDiv.appendChild(includeLoginsToggle);

    const totalActivityGraph = createGraph({ subscriptions, visits, messages, logs });
    totalActivityGraph.id = 'site-activity-graph';
    siteActivityDiv.appendChild(totalActivityGraph);

    // Visits Graph
    const visitsDiv = document.createElement('div');
    visitsDiv.classList.add('site-activity-container');
    visitsDiv.id = 'visits-container';
    const h1Visits = document.createElement('h1');
    h1Visits.innerHTML = 'Website Visitors';
    visitsDiv.appendChild(h1Visits);

    const totalVisits = visits.length;
    const uniqueVisits = new Set(visits.map(visit => visit.ip)).size;
    const pVisitNumberTotal = document.createElement('p');
    const pVisitNumberUnique = document.createElement('p');
    pVisitNumberTotal.innerHTML = `Total number of visits: <span>${totalVisits}</span>.`;
    pVisitNumberUnique.innerHTML = `Number of unique visitors (by IP): <span>${uniqueVisits}</span>.`;
    visitsDiv.appendChild(pVisitNumberTotal);
    visitsDiv.appendChild(pVisitNumberUnique);

    const visitsGraph = createGraph({ visits });
    visitsGraph.id = 'visits-graph';
    visitsDiv.appendChild(visitsGraph);

    // Visits Distribution Graph
    const visitDistribution = {};
    visits.forEach(visit => {
        if (!visitDistribution[visit.page]) visitDistribution[visit.page] = 1; 
        else visitDistribution[visit.page] = visitDistribution[visit.page] + 1;
    });
    
    const visitDistributionDiv = document.createElement('div');
    visitDistributionDiv.id = 'visit-distribution-container';
    visitDistributionDiv.classList.add('site-activity-container');

    const visitDistributionH1 = document.createElement('h1');
    visitDistributionH1.innerHTML = 'Visit Distribution';
    visitDistributionDiv.appendChild(visitDistributionH1);

    const visitDistributionGraph = createVisitDistributionGraph(visitDistribution, visits);
    visitDistributionDiv.appendChild(visitDistributionGraph);
    
    // Messages Graph
    const messagesDiv = document.createElement('div');
    messagesDiv.classList.add('site-activity-container');
    const h1Messages = document.createElement('h1');
    h1Messages.innerHTML = 'Contact Messages';
    messagesDiv.appendChild(h1Messages);

    const messagesGraph = createGraph({ messages });
    messagesDiv.appendChild(messagesGraph);

    // Subscriptions Graph
    const subscriptionsDiv = document.createElement('div');
    subscriptionsDiv.classList.add('site-activity-container');
    const h1Subscriptions = document.createElement('h1');
    h1Subscriptions.innerHTML = 'New Subscriptions';
    subscriptionsDiv.appendChild(h1Subscriptions);

    const subscriptionsGraph = createGraph({ subscriptions });
    subscriptionsDiv.appendChild(subscriptionsGraph);

    // Logs Graph
    const logsDiv = document.createElement('div');
    logsDiv.classList.add('site-activity-container');
    const h1Logs = document.createElement('h1');
    h1Logs.innerHTML = 'Error Logs';
    logsDiv.appendChild(h1Logs);

    const logsGraph = createGraph({ logs }, 'red');
    logsDiv.appendChild(logsGraph);

    // Tokens
    const tokensDiv = document.createElement('div');
    tokensDiv.classList.add('site-activity-container');
    const tokensH1 = document.createElement('h1');
    tokensH1.innerHTML = `JWT TOKENS IN DATABASE [<span>${tokens.length}</span>]`;
    tokensDiv.appendChild(tokensH1);
    if (tokens.length) {
        const tokensBtn = document.createElement('button');
        tokensBtn.innerHTML = 'Clear Expired Tokens';
        tokensBtn.addEventListener('click', async () => {
            const { table:tokens } = await DB(app.url + '/api/tokens', 'DELETE');
            createStatistics();
        });
        tokensDiv.appendChild(tokensBtn);
    }
    
    const tokensP = document.createElement('p');
    tokensDiv.appendChild(tokensP);

    // Append DIV-s
    dbStoragePercentOuter.appendChild(dbStoragePercentInner);
    dbStorageDiv.appendChild(dbStorageH1);
    dbStorageDiv.appendChild(p);
    dbStorageDiv.appendChild(dbStoragePercentOuter);
    statsDiv.appendChild(dbStorageDiv);
    statsDiv.appendChild(dbDistributionDiv);
    statsDiv.appendChild(siteActivityDiv);
    statsDiv.appendChild(visitsDiv);
    statsDiv.appendChild(visitDistributionDiv);
    statsDiv.appendChild(messagesDiv);
    statsDiv.appendChild(subscriptionsDiv);
    statsDiv.appendChild(logsDiv);
    statsDiv.appendChild(tokensDiv);
    viewContainer.appendChild(statsDiv);
}



function createVisitDistributionGraph(visitDistribution, visits) {
    const distribution = {...visitDistribution};
    const totalVisits = app.settings.showLogins ? visits.length : visits.length - distribution['LOGIN'];
    if (!app.settings.showLogins) delete distribution['LOGIN'];
    
    const visitDistributionGraph = document.createElement('div');
    visitDistributionGraph.id = 'visit-distribution';
    Object.keys(distribution).forEach(key => {
        const collectionStorageDiv = document.createElement('div');
        collectionStorageDiv.classList.add('db-collection');
        const collectionStorageOuter = document.createElement('div');
        collectionStorageOuter.classList.add('db-collection-outer');
        const collectionStorageInner = document.createElement('div');
        collectionStorageInner.classList.add('db-collection-inner');
        const p = document.createElement('p');
        const p2 = document.createElement('p');
        const p3 = document.createElement('p');

        const percent = distribution[key] / totalVisits * 100;
        collectionStorageInner.style.height = percent + '%';
        p.innerHTML = percent.toFixed(2) + '%';
        p2.innerHTML = distribution[key];
        p3.innerHTML = key;

        collectionStorageOuter.appendChild(collectionStorageInner);
        collectionStorageDiv.appendChild(collectionStorageOuter);
        collectionStorageDiv.appendChild(p);
        collectionStorageDiv.appendChild(p2);
        collectionStorageDiv.appendChild(p3);
        visitDistributionGraph.appendChild(collectionStorageDiv);
    });
    return visitDistributionGraph;
}



function handleToggleSwitch(getToggleState, toggleWrapper) {
    app.settings.showLogins = !getToggleState();

    if (getToggleState()) toggleWrapper.classList.add('on');
    else toggleWrapper.classList.remove('on');

    // Refresh Site Activity Graph
    const siteActivityContainer = document.getElementById('site-activity');
    const oldSiteActivityGraph = document.getElementById('site-activity-graph');
    
    if (oldSiteActivityGraph) {
        siteActivityContainer.removeChild(oldSiteActivityGraph);
        const newSiteActivityGraph = createGraph(app.statTables);
        newSiteActivityGraph.id = 'site-activity-graph';
        siteActivityContainer.appendChild(newSiteActivityGraph);
    }

    // Refresh Visits Graph
    const visitsContainer = document.getElementById('visits-container');
    const oldVisitsGraph = document.getElementById('visits-graph');

    if (oldVisitsGraph) {
        visitsContainer.removeChild(oldVisitsGraph);
        const visits = app.statTables.visits;
        const newVisitsGraph = createGraph({ visits });
        newVisitsGraph.id = 'visits-graph';
        visitsContainer.appendChild(newVisitsGraph);
    }

    // Refresh Visit Distribution Graph
    const visitDistributionContainer = document.getElementById('visit-distribution-container');
    const oldVisitDistributionGraph = document.getElementById('visit-distribution');

    if (oldVisitDistributionGraph) {
        const visits = app.statTables.visits;
        const visitDistribution = {};
        visits.forEach(visit => {
            if (!visitDistribution[visit.page]) visitDistribution[visit.page] = 1; 
            else visitDistribution[visit.page] = visitDistribution[visit.page] + 1;
        });
    
        visitDistributionContainer.removeChild(oldVisitDistributionGraph);
        const visitDistributionGraph = createVisitDistributionGraph(visitDistribution, visits);
        visitDistributionContainer.appendChild(visitDistributionGraph);
    }
}



function createGraph(tables, color='aquamarine') {
    const today = moment(new Date);
    const day = Number(moment(today).format('DD'));
    const dayName = moment(today).format('ddd');
    const month = Number(moment(today).format('M'));
    const year = Number(moment(today).format('YYYY'));

    const graph = document.createElement('div');
    const monthsDiv = document.createElement('div');
    
    graph.classList.add('activity-graph');
    monthsDiv.classList.add('calendar-months');
    graph.appendChild(monthsDiv);

    const calendarContainer = document.createElement('div');
    calendarContainer.classList.add('calendar-container');
    graph.appendChild(calendarContainer);

    // Month header
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let m = 0; m < 12; m++) {
        const monthDiv = document.createElement('span');
        monthsDiv.appendChild(monthDiv);
        monthTextIndex = m + month < 12 ? m + month : m + month - 12;
        monthDiv.innerHTML = months[monthTextIndex];
        if (m === 11) monthDiv.classList.add('active');
    }

    // Day names side div
    const dayNamesContainer = document.createElement('div');
    dayNamesContainer.classList.add('calendar-daynames');
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days.forEach(d => {
        const daySpan = document.createElement('span');
        daySpan.innerHTML = d;
        dayNamesContainer.appendChild(daySpan);

        if (dayName === d) daySpan.classList.add('active');
    });
    calendarContainer.appendChild(dayNamesContainer);

    // Organise tables from arguments by combining them into { $date: { visits: num, logs: num, subscriptions: num, messages: num } }
    let cummulatedTables = {};
    let totalDailyActivity = 0;                                                                                 // Count total activities to calculate average
    Object
        .keys(tables)
        .forEach(key => tables[key]                                                                             // Iterate keys (visit, log, subscription, message)
            .forEach(entry => {                                                                                 // Iterate individual entries
                let date = entry.date || new Date(entry.timestamp);                                             // Get date as the key of entry 
                if (!app.settings.showLogins && key === 'visits' && entry.page === 'LOGIN') return;              // Don't show logins if toggle is not selected               
                if (date) date = moment(date).format('$DD_MM_YYYY');                                            // Format date as $day_month_year
                if (!cummulatedTables[date]) cummulatedTables[date] = {};                                       // If no key with date create one
                cummulatedTables[date][key] = cummulatedTables[date][key]++ ? cummulatedTables[date][key] : 1;  // Increment key on date
                totalDailyActivity++;                                                                           // Increment total entries
            })
        );

    // Calendar first entry, average
    const futureDays = days.findIndex(d => d === dayName); // Current week's days that won't show
    const arrintFirstActivityDate = Object
        .keys(cummulatedTables)
        .sort((prevKey, currKey) => {
            const convertDateToValue = date => {
                const d = date.match(/\d+/g).map(Number); 
        
                return d[0] + d[1] * 31 + d[2] * 365;
        }
        
        return convertDateToValue(prevKey) > convertDateToValue(currKey);
    })[0]
        .match(/\d+/g)
        .reverse()
        .map(Number);
    const firstActivityDate = moment({ year: arrintFirstActivityDate[0], month: arrintFirstActivityDate[1] - 1, day: arrintFirstActivityDate[2] });
    const daysGoneFromFirstActivity = Math.floor(moment.duration(today.diff(firstActivityDate)).asDays()) - 1;
    const averageDailyActivity = totalDailyActivity / daysGoneFromFirstActivity > 0 ? daysGoneFromFirstActivity : totalDailyActivity;
    const levels = { 
        low: averageDailyActivity / 2, 
        medium: averageDailyActivity, 
        high: averageDailyActivity + averageDailyActivity / 2
    };

    // Calendar days squares
    const calendarSquares = document.createElement('div');
    const firstDay = moment([year, month - 1, day]).subtract(364, 'days').add(6 - days.findIndex(d => d === dayName) + 1, 'days');
    calendarSquares.classList.add('calendar-squares');

    for (let week = 0; week < 52; week++) {
        const calendarWeekDev = document.createElement('div');
        calendarWeekDev.classList.add('calendar-week');

        for (let day = 0; day < 7; day++) {
            const entryDay = moment(firstDay).add(week * 7 + day, 'days');
            const calendarDay = document.createElement('div');
            calendarDay.classList.add('calendar-day');
            
            // Count total activity
            const activityOnDay = cummulatedTables[entryDay.format('$DD_MM_YYYY')];
            let totalActivityCount = 0;
            if (activityOnDay) {
                Object.keys(activityOnDay).forEach(key => {
                    totalActivityCount += activityOnDay[key];
                });
            }
            calendarDay.dataset.count = totalActivityCount;

            // Set activity level
            let level = 'no';
            if (totalDailyActivity === 0) level = 'no';
            if (totalActivityCount > 0) level = 'low';
            if (totalActivityCount >= levels.low) level = 'medium';
            if (totalActivityCount >= levels.medium) level = 'high';
            if (totalActivityCount >= levels.high) level = 'extreme';
            calendarDay.dataset.level = level;
            calendarDay.classList.add(level + '-activity', color);
            calendarDay.title = `${entryDay.format('dddd DD. MM. YYYY')}\n${level.toUpperCase()} LEVEL OF ACTIVITY`;

            // Count activity by categories
            if (activityOnDay) {
                Object.keys(activityOnDay).forEach(key => {
                    if (activityOnDay[key]) {
                        calendarDay.title = calendarDay.title += `\n${key.toLocaleUpperCase()}: ${activityOnDay[key]}`;
                        calendarDay.dataset[key] = activityOnDay[key];
                    }
                });
            }
            
            // Categorise day
            if (days[day] === dayName) calendarDay.classList.add('active-weekday');
            if (week === 51) calendarDay.classList.add('active-weekday');
            if (week === 51 && day === futureDays) calendarDay.classList.add('day-highlight');
            if (week === 51 && day > futureDays) calendarDay.classList.add('future');
            
            calendarWeekDev.appendChild(calendarDay);
        }
        calendarSquares.appendChild(calendarWeekDev);
    }
    calendarContainer.appendChild(calendarSquares);

    return graph;
}

function createToggle(id, getToggleState, toggleLabelText, toggleOnchange) {
    const toggleWrapper = document.createElement('div');
    toggleWrapper.id = id;
    toggleWrapper.classList.add('toggle__wrapper');

    const toggleTrack = document.createElement('div');
    toggleTrack.classList.add('toggle__track');
    toggleWrapper.appendChild(toggleTrack);

    const toggleThumb = document.createElement('div');
    toggleThumb.classList.add('toggle__thumb');
    toggleWrapper.appendChild(toggleThumb);

    const toggleLabel = document.createElement('label');
    toggleLabel.innerHTML = toggleLabelText;
    toggleWrapper.appendChild(toggleLabel);

    toggleThumb.addEventListener('click', () => toggleOnchange(getToggleState, toggleWrapper));
    toggleTrack.addEventListener('click', () => toggleOnchange(getToggleState, toggleWrapper));

    return toggleWrapper;
}



async function displaySettings() {
    const { table:notificationEmails, success: notificationEmailsLoaded } = await DB(app.url + '/api/notificationEmails/', 'GET');
    const viewContainer = document.getElementById('view-container');
    const prevContent = document.querySelector(`#view-container > *:not(#loading-spinner)`);
    if (prevContent) viewContainer.removeChild(prevContent);
    
    // Notification settings
    if (notificationEmailsLoaded) {
        const notificationsSection = document.createElement('section');

        const h1NotifyWhenUnsuccessfulLogin = document.createElement('h1');
        h1NotifyWhenUnsuccessfulLogin.innerHTML = 'Notifications';
        notificationsSection.appendChild(h1NotifyWhenUnsuccessfulLogin);
    
        const notificationSettings = {};
        notificationEmails.forEach(notification => {
            if (!notificationSettings[notification.eventName]) notificationSettings[notification.eventName] = [{...notification}];
            else notificationSettings[notification.eventName].push({...notification});
        });

        app.settings.notifications = notificationSettings;
    
        const notificationEvents = Object.keys(notificationSettings);
     
        notificationEvents.forEach(notificationEvent => {
            const p = document.createElement('p');
            let pText = '';

            switch(notificationEvent) {
                case 'onError': { pText = 'an error:'; break; };
                case 'onSubscription': { pText = 'a subscription:'; break; };
                case 'onMessage': { pText = 'receiving a message:'; break; };
                case 'onUnsuccessfulLogin': { pText = 'unsuccessful admin login:'; break; };
            }

            p.innerHTML = 'Send email in case of ' + pText;
            notificationsSection.appendChild(p);

            const table = document.createElement('table');
            notificationSettings[notificationEvent].forEach(notificationSetting => {
                const tr = document.createElement('tr');

                // Email
                const emailTd = document.createElement('td');
                emailTd.innerHTML = notificationSetting.email;

                // Toggle active
                async function handleToggleSwitch() {
                    const active = !notificationSetting.active;
                    const body = { active }
                    const newState = await DB(app.url + '/api/notificationEmails/' + notificationSetting._id, 'PUT', body);
                    if (newState.success) displaySettings();
                }

                const toggleTd = createToggle('toggle-for--' + notificationSetting._id, notificationSetting.active, notificationSetting.active ? 'On' : 'Off', handleToggleSwitch.bind({notificationSetting}));
                if (notificationSetting.active) toggleTd.classList.add('on');

                // Delete email
                const deleteTd = document.createElement('td');
                deleteTd.innerHTML = '<i class="far fa-trash-alt"></i>';

                function deleteEmail() {
                    const { email, _id, eventName } = notificationSetting;
                    const warningMsg = `Are you sure that you want to delete ${email} from the notification email list of the event of ${eventName}?`;
                    displayMessageOnWindow(warningMsg, ['OK', 'Cancel'], [deleteEmailFromDB, () => {}]);
                    async function deleteEmailFromDB() {
                        const { success } = await DB(app.url + '/api/notificationEmails/' + _id, 'DELETE');
                        if (success) displaySettings();
                    }
                }

                deleteTd.addEventListener('click', deleteEmail.bind(notificationSetting));
                
                tr.appendChild(emailTd);
                tr.appendChild(deleteTd);
                tr.appendChild(toggleTd);
                table.appendChild(tr);
            });

            // Create new notification email
            const tr = document.createElement('tr');
            const emailTd = document.createElement('td');
            emailTd.classList.add('td--input');
            
            const createInput = document.createElement('input');
            createInput.type = 'email';
            createInput.placeholder = 'New email';
            createInput.id = 'create' + notificationEvent;
            emailTd.appendChild(createInput);

            const createTd = document.createElement('td');
            createTd.innerHTML = '<i class="far fa-plus-square"></i>';

            async function createNewNotificationEmail() {
                const input = document.getElementById('create' + notificationEvent)
                const email = input.value;

                if (!email) {
                    displayMessageOnWindow('Cannot leave email empty!', ['OK']);
                    return;
                }

                const isValid = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test(email);
                if (!isValid) {
                    displayMessageOnWindow('Not valid email format!', ['OK']);
                    return;
                }

                // Check if email already exists on the notification event
                const notifications = app.settings.notifications;
                const notificationEmails = notifications[notificationEvent].map(not => not.email);
                
                if (notificationEmails.includes(email)) {
                    displayMessageOnWindow('Email already assigned to event: ' + notificationEvent, ['OK']);
                }
                else {
                    // Create new notification email
                    const body = {
                        email,
                        active: true,
                        eventName: notificationEvent
                    };
                    const { success } = await DB(app.url + '/api/notificationEmails/', 'POST', body);
                    if (success) displaySettings();
                }
            }
            createTd.addEventListener('click', createNewNotificationEmail.bind(notificationEvent));   
            
            tr.appendChild(emailTd);
            tr.appendChild(createTd);
            table.appendChild(tr);
            
            notificationsSection.appendChild(table);
        });
     
        viewContainer.appendChild(notificationsSection);
    }
}