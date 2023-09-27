function printCalendar() {
    gapi.client.init({
        'apiKey': APIKEY,
        'discoveryDocs': ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
    }).then(function () {
        return gapi.client.calendar.events.list({
            'calendarId': calendarID,
            'timeZone': userTimeZone,
            'singleEvents': true,
            'timeMin': (eventsFromDate).toISOString(), //gathers only events not happened yet
            'maxResults': maxResults,
            'orderBy': 'startTime'
        });
    }).then(function (response) {
        const loadingSpinner = document.getElementById('loading-spinner');
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        const loadingSpinner2 = document.getElementById('loading-spinner-2');
        if (loadingSpinner2) loadingSpinner2.style.display = 'none';

        if (response.result.items) {
            events = response.result;
            setCalendarView(events);
            displayEventList(events);
            scrollToDate(moment(daySelected).format(`YYYY-MM-DD ${moment().format('HH')}:00`));
        }
    }, function (reason) {
        console.log('Error: ' + reason.result.error.message);
    });
};
gapi.load('client', printCalendar);

const maxResults = 2500;
const eventsFromDate = new Date(moment().subtract(1, 'years'));
const APIKEY = 'AIzaSyBI8hdK-H77aHg58g2RXpFCsurAZNXpGHY';
const calendarID = 'v6mcklug5b672k3pn88d19gmjs@group.calendar.google.com';
const timeElem = document.getElementById('time');
const dateElem = document.getElementById('date');
const today = moment().subtract(0, 'months').format('YYYY-MM-DD');
const daysOfTheWeek = {'Monday': 0, 'Tuesday': 1, 'Wednesday': 2, 'Thursday': 3, 'Friday': 4, 'Saturday': 5, 'Sunday': 6};
let view = '';
let dateDropdownOpen = false;
let activeDate = today; // Calendar starts with the current date
let daySelected = today;
let displayDate = today;
let events;
let scrollYear = 0;
let scrollMonth = 0;
let weekCounter = 0;


// You can get a list of time zones from here: http://www.timezoneconverter.com/cgi-bin/zonehelp
const userTimeZone = "Europe/London";

function displayDateTime() {
    setInterval(() => {
        dateElem.innerHTML = moment().format('YYYY.MM.DD');
        timeElem.innerHTML = moment().format('HH:mm:ss');
    }, 1000);
}
displayDateTime();

function setTimeline() {
    const currentHour = moment().format('HH') + ":00";
    const currentHourMinus6Hours = moment().subtract(6, 'hours').format('HH') + ":00";
    const currentHourMinus12Hours = moment().subtract(12, 'hours').format('HH') + ":00";
    document.querySelector('#timeline__textbox > span:nth-child(1)').innerHTML = currentHourMinus12Hours;
    document.querySelector('#timeline__textbox > span:nth-child(2)').innerHTML = currentHourMinus6Hours;
    document.querySelector('#timeline__textbox > span:nth-child(3)').innerHTML = currentHour;
    document.querySelector('#timeline__textbox > span:nth-child(4)').innerHTML = currentHourMinus6Hours;
    document.querySelector('#timeline__textbox > span:nth-child(5)').innerHTML = currentHourMinus12Hours;
}
setTimeline();

function setView(newView) {
    if (!dateDropdownOpen) {
        view = newView;
        document.getElementById('set-view-btn--monthly').disabled = view === 'months';
        document.getElementById('set-view-btn--weekly').disabled = view === 'weeks';
        document.getElementById('timeline').style.display = view === 'months' ? 'flex' : 'none';
        setCalendarView(events);
    }
}
setView(view || 'months');

function setCalendarView(events) {
    checkDateMinAndMaxAndDisable();
    const startOfMonth = moment(activeDate).startOf('month').format('YYYY-MM-DD');
    const monthStartsOnDay = daysOfTheWeek[moment(startOfMonth).format('dddd')];
    const calendarFirstDay = moment(startOfMonth).subtract(monthStartsOnDay, 'days').format('YYYY-MM-DD');
    const calendar = createCalendarObjects(calendarFirstDay, events);
    
    if (events && view === 'months') {
        const timeline = document.getElementById('line');
        timeline.style.display = 'flex';
        timeline.innerHTML = ""; 

        events.items.forEach(event => {
            const now = moment(daySelected)
                .set('hour', moment().format('HH'))
                .startOf('hour');
            const eventTime = moment(event.start.dateTime).startOf('hour');
            const diff = now.diff(eventTime, 'hours');

            if (Math.abs(diff) <= 12) {
                
                const eventPoint = document.createElement('div');
                eventPoint.classList.add('event-point');
                let percent;
                if (diff > 0) percent = (12 - diff) * 4;
                else if (diff === 0) percent = 50;
                else if (diff < 0) percent = 50 + Math.abs(diff) * 4;
                
                eventPoint.style.left = `${percent}%`;
                timeline.appendChild(eventPoint);
            }
        });
    }

    document.getElementById('calendar--monthly').style.display = view === 'months' ? 'block' : 'none';
    document.getElementById('calendar--weekly').style.display = view === 'weeks' ? 'block' : 'none';
    
    const currentYear = moment(today).format('YYYY');
    const activeYear = moment(activeDate).format('YYYY');
    const currentMonth = moment(today).format('MM');
    const activeMonth = moment(activeDate).format('MM');
    const currentDay = moment(today).format('D');
    const activeDay = moment(daySelected).format('D');
    
    if (view === 'months') {
        const selectionElem = document.querySelector('#calendar-month--selected > span');
        selectionElem.innerHTML = moment(activeDate).format('MMMM') + ' ' + moment(activeDate).format('YYYY');

        if (currentMonth === activeMonth && currentYear === activeYear) {
            const currentDay = moment(today).format('dddd').toLowerCase();
            const dayText = document.getElementById(`${currentDay}-text`);
            dayText.className = '';
            dayText.classList.add('day-text--active');
        }
        
        calendar.map((slot, i) => {
            const slotElement = document.getElementById(`slot-${i + 1}`);
            slotElement.dataset.date = slot.date;
            
            slotElement.className = '';
            slotElement.classList.add('day-slot');
            slotElement.innerHTML = moment(slot.date).format('D');

            if (moment(slot.date).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')) slotElement.classList.add('today');
            if (moment(slot.date).format('YYYY-MM-DD') === moment(daySelected).format('YYYY-MM-DD')) slotElement.classList.add('selected-day');

            if (slot.isCurrentMonth) slotElement.classList.add('current-month') 
            else {
                if (slot.isBefore) slotElement.classList.add('before'); 
                if (slot.isAfter) slotElement.classList.add('after'); 
            }
            
            if (slot.isPast) slotElement.classList.add('past'); 

            if (slot.events.length) {
                slotElement.classList.add('eventful-day');
                const eventIndicator = document.createElement('div'); 
                eventIndicator.classList.add('event-indicator');
                slotElement.appendChild(eventIndicator);
            }
        });
    }
    if (view === 'weeks') {
        const days = { 'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6 };
        const todayIsNthDayOfWeek = days[moment(daySelected).format('ddd')];
        const firstDayOfWeek = moment(daySelected).subtract(todayIsNthDayOfWeek, 'days').format('YYYY-MM-DD 00:00');
        const selectionElem = document.querySelector('#calendar-month--selected > span');
        selectionElem.innerHTML = moment(firstDayOfWeek).format('\'YY MM.DD.') + ' - ' + moment(firstDayOfWeek).add(6 ,'days').format('MM.DD.');

        [...document.querySelectorAll('.hour-slot')].forEach((slot, index) => {
            if (moment().format('YYYY-MM-DD HH:00') === moment(calendar[index].date).format('YYYY-MM-DD HH:00')) slot.classList.add('now');
            else slot.classList.remove('now');
            
            const hour = moment(calendar[index].date).format('HH');
            slot.dataset.date = moment(calendar[index].date).format('YYYY-MM-DD HH:00');
            slot.innerHTML = hour;
            if (calendar[index].event) {
                slot.classList.add('has-event');
            }
            else {
                slot.classList.remove('has-event');
            }
            
            
        });
    }
}
setCalendarView();

function createCalendarObjects(calendarStartDate, events) {  
    let calendarEvents;
    if (events) {
        calendarEvents = events.items.map(event => {
            return ({
                created: event.created,
                creator: event.creator.email,
                end: moment(event.end.dateTime).format('YYYY-MM-DD HH:mm:ss'),
                eventType: event.eventType,
                start: moment(event.start.dateTime).format('YYYY-MM-DD HH:mm:ss'),
                status: event.status,
                summary: event.summary,
                updated:moment(event.updated).format('YYYY-MM-DD HH:mm:ss'),
            });
        });
    }
    else calendarEvents = [];

    if (view === 'months') {
        let dayCounter = 0;
        const calendarObjects = [...Array(42)].map(slot => {
            const date = moment(calendarStartDate).add(dayCounter, 'days').format('YYYY-MM-DD');
            const time = moment(calendarStartDate).add(dayCounter, 'days').format('HH:mm');
            const isBefore = moment(date).isBefore(activeDate);
            const isAfter = moment(date).isAfter(activeDate);
            const isCurrentMonth = moment(date).format('MMMM') === moment(activeDate).format('MMMM');
            const isPast = moment(moment(date).format('YYYY-MM-DD')).isBefore(moment().format('YYYY-MM-DD'));
            
            dayCounter++;
    
            // Find events for the respective day
            const eventsOnDate = calendarEvents.filter(event => {
                return moment(date).format('YYYY-MM-DD') === moment(event.start).format('YYYY-MM-DD');
            });
    
    
            return ({
                date,
                time,
                isBefore,
                isAfter,
                isCurrentMonth,
                isPast,
                events: eventsOnDate
            });
        });
        return calendarObjects;
    }
    else {
        let hourCounter = 0;
        const days = { 'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6 };
        const todayIsNthDayOfWeek = days[moment(daySelected).format('ddd')];
        const firstDayOfWeek = moment(daySelected).subtract(todayIsNthDayOfWeek, 'days').format('YYYY-MM-DD 00:00');
        const calendarObjects = [...Array(168)].map(slot => {
            const date = moment(firstDayOfWeek).add(hourCounter, 'hours').format('YYYY-MM-DD HH:mm');
            
            hourCounter++;
            return { date: date }
        });

        calendarEvents.forEach(event => {
            const calendarHour = calendarObjects.find(hourSlot => moment(event.start).format('YYYY-MM-DD HH:mm') === hourSlot.date);
            if (calendarHour) calendarHour.event = event;
        });
        
        return calendarObjects;
    }

}

function checkDateMinAndMaxAndDisable() {
    const nextMonthBtn = document.getElementById('next-month-btn');
    const previousMonthBtn = document.getElementById('previous-month-btn');
    const selectPrevYear = document.getElementById('select-prev-year-btn');
    const selectNextYear = document.getElementById('select-next-year-btn');

    if (moment('2012 February 01').isAfter(activeDate)) {
        previousMonthBtn.disabled = true;
        selectPrevYear.disabled = true;
        return;
    }
    if (moment('2069 December 01').isBefore(activeDate)) {
        nextMonthBtn.disabled = true;
        selectNextYear.disabled = true;
        return;
    }
    if (moment(activeDate).add(scrollYear, 'years').isAfter(moment('2069 December 01'))) {
        selectNextYear.disabled = true;
        return
    }
    if (moment(activeDate).add(scrollYear, 'years').isBefore(moment('2013 February 01'))) {
        selectPrevYear.disabled = true;
        return
    }

    previousMonthBtn.disabled = false;
    selectPrevYear.disabled = false;
    nextMonthBtn.disabled = false;
    selectNextYear.disabled = false;    
}

function stepCalendar(stepAmount) {
    if (view === 'months') {
        if (stepAmount < 0) {
            daySelected = moment(daySelected).subtract(Math.abs(stepAmount), 'months'); 
            activeDate = daySelected.format('YYYY-MM-DD');
        }
        if (stepAmount > 0) {
            daySelected = moment(daySelected).add(stepAmount, 'months')
            activeDate = daySelected.format('YYYY-MM-DD');
        } 
    }

    if (view === 'weeks') {
        if (stepAmount < 0) {
            daySelected = moment(daySelected).subtract(Math.abs(stepAmount), 'weeks'); 
            activeDate = daySelected.format('YYYY-MM-DD');
        }
        if (stepAmount > 0) {
            daySelected = moment(daySelected).add(stepAmount, 'weeks')
            activeDate = daySelected.format('YYYY-MM-DD');
        } 
    }

    dateDropdownSelection();
    setCalendarView(events);
}

document.getElementById('calendar--monthly').addEventListener('click', event => {
    daySelected = event.target.dataset.date;
    setCalendarView(events);
    scrollToDate(daySelected);
    const offset = window.scrollTo(0, document.getElementById('event-list').offsetTop);

    console.log(offset);

});

document.getElementById('calendar--weekly').addEventListener('click', event => {
    daySelected = moment(event.target.dataset.date).format('YYYY-MM-DD');   

    setCalendarView(events);
    scrollToDate(moment(event.target.dataset.date).format('YYYY-MM-DD HH:00'));
});

function scrollToDate(date) {
    const findDate = moment(date).format('YYYY-MM-DD HH:00');
    const eventContainers = [...document.querySelectorAll('.event-item')];
    let lastDateBefore;
    let firstDateAfter;
    let firstEventOnDate;

    eventContainers.forEach(div => {
        const eventDate = moment(div.dataset.date).format('YYYY-MM-DD HH:00');
        const listItemDate = moment(findDate).format('YYYY-MM-DD HH:00');
        const isBefore = moment(eventDate).isBefore(moment(findDate));
        const isAfter = moment(eventDate).isAfter(moment(findDate));
        lastDateBefore = isBefore ? div : lastDateBefore;
        firstDateAfter = isAfter && !firstDateAfter ? div : firstDateAfter; 
        firstEventOnDate = (eventDate === listItemDate) && !firstEventOnDate ? div : firstEventOnDate;
    });

    let scrollToContainer;
    if (firstEventOnDate) scrollToContainer = firstEventOnDate;
    else if (firstDateAfter) scrollToContainer = firstDateAfter;
    else if (lastDateBefore) scrollToContainer = lastDateBefore;
    else return;
    
    eventContainers.forEach(div => div.classList.remove('selected'));
    scrollToContainer.classList.add('selected');
    const offset = scrollToContainer.offsetTop - 57;
    
    document.getElementById('event-items').scrollTop = offset;
}

function toggleDateDropdown() {
    dateDropdownOpen =! dateDropdownOpen;
    dateDropdownSelection();
}

function dateDropdownSelection(year, month) {
    const calendar = view === 'months' ? document.getElementById('calendar--monthly') : document.getElementById('calendar--weekly');
    const timeline = document.getElementById('timeline');
    
    if (dateDropdownOpen) {
        calendar.style.display = 'none';
        timeline.style.display = 'none';
        const showYear = Number(moment(year || daySelected).format('YY'));
        const showMonth = Number(moment(month || daySelected).format('M'));
        const arrow = document.querySelector('#calendar-month--selected i');
        arrow.className = 'fas fa-chevron-up';

        const calendarMonths = document.getElementById('calendar-month--options');
        calendarMonths.style.display = 'flex';

        const calendarMonthsText = document.getElementById('calendar-month--selected__text');
        calendarMonthsText.classList.add('active');

        const yearButtons = document.querySelectorAll('.year');
        yearButtons[0].innerHTML = `${showYear - 2 + scrollYear }`;
        yearButtons[1].innerHTML = `${showYear - 1 + scrollYear }`;
        yearButtons[2].innerHTML = `${showYear + scrollYear }`;
        yearButtons[3].innerHTML = `${showYear + 1 + scrollYear }`;
        yearButtons[4].innerHTML = `${showYear + 2 + scrollYear }`;

        yearButtons.forEach((btn, i) => {
            const index = i - 2;
            const btnYear = Number(moment(daySelected).add(index + scrollYear, 'years').format('YYYY'));
            const btnYear2Digits = ('' + btnYear)[2] + ('' + btnYear)[3];
            if ('' + showYear === btnYear2Digits) btn.classList.add('active');
            else btn.classList.remove('active');
            
            if (btnYear < 2012 || btnYear > 2070) btn.disabled = true;
            else btn.disabled = false;
            btn.dataset.year = btnYear;
        });
        
        const monthsShorthands = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formatMonth = month => monthsShorthands[(month < 1 ? 12 - Math.abs(month) : month > 12 ? month - 12 : month) - 1];
        
        const monthButtons = document.querySelectorAll('.month');
        monthButtons[0].innerHTML = formatMonth(showMonth - 2 + scrollMonth);
        monthButtons[1].innerHTML = formatMonth(showMonth - 1 + scrollMonth);
        monthButtons[2].innerHTML = formatMonth(showMonth + scrollMonth);
        monthButtons[3].innerHTML = formatMonth(showMonth + 1 + scrollMonth);
        monthButtons[4].innerHTML = formatMonth(showMonth + 2 + scrollMonth);

        monthButtons.forEach((btn, i) => {
            const index = i - 2;
            const btnMonth = Number(moment(daySelected).add(index + scrollMonth, 'month').format('M'));
            if (showMonth === btnMonth) btn.classList.add('active');
            else btn.classList.remove('active');

            btn.dataset.month = btnMonth;
        });
    } else {
        const arrow = document.querySelector('#calendar-month--selected i');
        arrow.className = 'fas fa-chevron-down';

        const calendarMonths = document.getElementById('calendar-month--options');
        calendarMonths.style.display = 'none';

        const calendarMonthsText = document.getElementById('calendar-month--selected__text');
        calendarMonthsText.classList.remove('active');

        calendar.style.display = 'block';
        timeline.style.display = view === 'months' ? 'flex' : 'none';
    }
}

document.getElementById('calendar-month--options').addEventListener('click', event => {
    if (event.target.dataset.year) {
        const newYear = event.target.dataset.year;
        const yearsDiff = Number(newYear) - Number(moment(daySelected).format('YYYY'));
        const newselectedDate = moment(daySelected).add(yearsDiff, 'years');

        daySelected = newselectedDate;
        activeDate = daySelected.format('YYYY-MM-DD');
        scrollYear = Number(event.target.dataset.index);
        setCalendarView(events);
        dateDropdownSelection();
        scrollToDate(daySelected);
    }
    if (event.target.dataset.month) {
        const newMonth = event.target.dataset.month;
        const monthsShorthands = { '1': 'January', '2': 'February', '3': 'March', '4': 'April', '5': 'May', '6': 'Jun', '7': 'July', '8': 'August', '9': 'September', '10': 'October', '11': 'November', '12': 'December' };
        const newselectedDate = moment(daySelected).set('month', monthsShorthands[newMonth]);
        
        daySelected = newselectedDate;
        activeDate = daySelected.format('YYYY-MM-DD');
        scrollMonth = Number(event.target.dataset.index);
        setCalendarView(events);
        dateDropdownSelection();
        scrollToDate(daySelected);
    }
});

function scrollSelectView(scroll) {
    checkDateMinAndMaxAndDisable();
    if (scroll.year) scrollYear += scroll.year;
    if (scroll.month) scrollMonth += scroll.month;
    if (scrollMonth >= 12) scrollMonth = 0;
    if (scrollMonth < 0) scrollMonth = 11;
    
    checkDateMinAndMaxAndDisable();
    dateDropdownSelection();
}

function displayEventList(events) {
    function createElement(className, appendTo, DOMType = 'div') {
        const element = document.createElement(DOMType);
        if (className) element.className = className;
        if (appendTo) appendTo.append(element);
        return element;
    }
    
    
    const eventItems = document.getElementById('event-items');
    sortedEvents = events.items.sort((a,b) => moment(a.date).format('YYYYMMDDhhmmss') - moment(b.date).format('YYYYMMDDhhmmss'));
    let prevDate;
    
    sortedEvents.forEach(event => {
        const nextDate = moment(event.start.dateTime).format('YYYY-MM-DD');
        const startDate = moment(event.start.dateTime).format('ddd DD, MMM');
        const startTime = moment(event.start.dateTime).format('HH:mm');
        const endTime = moment(event.end.dateTime).format('HH:mm');
                
        // DATE SEPARATOR LINE
        if (prevDate !== nextDate) {
            const dateSeparator = createElement('event__date-separator', eventItems);
            dateSeparator.innerHTML = moment(nextDate).format('dddd DD, MMMM YYYY');
        }
        prevDate = nextDate;
        
        // EVENT ITEM
        const eventItem = createElement('event-item', eventItems);
        eventItem.dataset.date = event.start.dateTime;
        
        // EVENT MAIN -- visible part that when not selected
        const eventItemMain = createElement('event-item__main', eventItem);
        
        // EVENT DATE AND TIME
        const dateTime = createElement('event__date-time', eventItemMain);
        const date = createElement('event__date-container', dateTime);
        date.innerHTML = startDate.toUpperCase();
        const time = createElement('event__time-container', dateTime);
        time.innerHTML = startTime + "-" + endTime;
        
        // EVENT DESCRIPTION: SUMMARY, DETAILS TEXT
        const description = createElement('event__description', eventItemMain);
        const summaryContainer = createElement('event__summary', description);
        summaryContainer.innerHTML = event.summary;
        const formatDetailsText = (text, maxChars, fallback) => !text ? fallback : text.length <= maxChars ? text : `${text.substring(0, 40)}...`; 
        const details = createElement('event__details', description);
        
        details.innerHTML = formatDetailsText(event.description, 30, "");
        if (!event.description) {
            details.classList.add('no-description');
            if (!event.location) {
                eventItem.classList.add('no-information')
                return;
            }
        }

        // EXPANDED: visible when date or item is selected
        const expandedContainer = createElement('event__expanded', eventItem);
        const expandedDescription = createElement('expanded-description', expandedContainer);
        expandedDescription.innerHTML = `<span>Description:</span><span>${formatDetailsText(event.description, 1000, "N/A")}</span>`;
        const location = createElement('expanded-location', expandedContainer);
        location.innerHTML = `<span>Location:</span><span>${event.location || 'N/A'}</span>`;
    });
}

document.getElementById('event-items').addEventListener('click', event => {
    const date = event.target.dataset.date;
    
    if (date) {
        const eventContainers = [...document.querySelectorAll('.event-item')];
        eventContainers.forEach(div => div.classList.remove('selected'));
        event.target.classList.add('selected');

        activeDate = moment(date).format('YYYY-MM-DD');
        daySelected = moment(date);
        setCalendarView(events);
        
    }
});









