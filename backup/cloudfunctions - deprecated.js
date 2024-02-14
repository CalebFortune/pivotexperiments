// Global calendar variable
var calendar;

function toggleView(viewType) {
    if (viewType === 'calendar') {
        calendar.changeView('dayGridMonth');
        document.getElementById('taskViewContainer').style.display = 'none'; // Hide the task view container
        document.getElementById('calendar').style.display = 'block'; // Show the calendar
    } else if (viewType === 'task') {
        calendar.changeView('listMonth');
        document.getElementById('calendar').style.display = 'none'; // Hide the calendar
        document.getElementById('taskViewContainer').style.display = 'block'; // Show the task view container
    }
}

function displayIdeasInTaskView(ideas) {
    let taskViewContainer = document.getElementById('taskViewContainer');
    
    // If the taskViewContainer doesn't exist, create one
    if (!taskViewContainer) {
        taskViewContainer = document.createElement('div');
        taskViewContainer.id = 'taskViewContainer';
        document.body.appendChild(taskViewContainer);
    } else {
        taskViewContainer.innerHTML = ''; // Clear existing content if the container already exists
    }

    ideas.forEach(ideaObj => {
        const ideaElement = document.createElement('div');
        ideaElement.className = 'ideaElement';

        const dateElement = document.createElement('p');
        dateElement.textContent = ideaObj.date.toDateString();

        const ideaTextElement = document.createElement('p');
        ideaTextElement.textContent = ideaObj.idea;

        const projectTypeElement = document.createElement('p');
        projectTypeElement.textContent = `Project Type: ${ideaObj.projectType}`;

        const personaElement = document.createElement('p');
        personaElement.textContent = `Persona: ${ideaObj.persona}`;

        ideaElement.appendChild(dateElement);
        ideaElement.appendChild(ideaTextElement);
        ideaElement.appendChild(projectTypeElement);
        ideaElement.appendChild(personaElement);
        
        taskViewContainer.appendChild(ideaElement);
    });
}

function addEventsToCalendar(ideas) {
  const events = ideas.map(ideaObj => ({
    title: ideaObj.idea,
    start: ideaObj.date.toISOString().split('T')[0], // Convert the Date object to a 'YYYY-MM-DD' format
    description: `${ideaObj.projectType}, ${ideaObj.persona}`
  }));
  calendar.addEventSource(events);
}
function initializeCalendar() {
  calendar.render();
}
function assignDatesToIdeas(ideas) {
    let currentDate = new Date();
    const organizedIdeasWithDates = [];
    const incrementDays = (userData.frequencyType === 'week') ? 7 / userData.frequency : 30 / userData.frequency;

    ideas.forEach(idea => {
        // Skip weekends
        while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
            currentDate.setDate(currentDate.getDate() + 1);
        }

        organizedIdeasWithDates.push({
            date: new Date(currentDate),
            idea: idea
        });

        currentDate.setDate(currentDate.getDate() + incrementDays);
    });

    return organizedIdeasWithDates;
}
function exportToICS() {
    // Create an ICS content string
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//YourAppName//EN\n";

    userData.ideas.forEach(ideaObj => {
        const eventDate = new Date(ideaObj.date);
        const endDate = new Date(eventDate);
        endDate.setHours(endDate.getHours() + 1); // Assuming each idea is an hour-long event

        icsContent += "BEGIN:VEVENT\n";
        icsContent += "UID:" + eventDate.getTime() + "@yourappname.com\n"; // Unique identifier
        icsContent += "DTSTAMP:" + formatICSDate(new Date()) + "\n"; // Current timestamp
        icsContent += "DTSTART:" + formatICSDate(eventDate) + "\n";
        icsContent += "DTEND:" + formatICSDate(endDate) + "\n";
        icsContent += "SUMMARY:" + ideaObj.idea + "\n";
        icsContent += "END:VEVENT\n";
    });

    icsContent += "END:VCALENDAR";

    // Create a blob link to download the ICS
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'content_ideas.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function formatICSDate(date) {
    const pad = num => (num < 10 ? '0' : '') + num;
    return date.getUTCFullYear() +
           pad(date.getUTCMonth() + 1) +
           pad(date.getUTCDate()) + 'T' +
           pad(date.getUTCHours()) +
           pad(date.getUTCMinutes()) +
           pad(date.getUTCSeconds()) + 'Z';
}
function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Idea\n"; // Header

    userData.ideas.forEach(ideaObj => {
        csvContent += ideaObj.date + "," + ideaObj.idea + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "content_ideas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportToJSON() {
    const jsonContent = JSON.stringify(userData.ideas, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'content_ideas.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
function handleExport(format) {
    switch (format) {
        case 'ics':
            exportToICS();
            break;
        case 'csv':
            exportToCSV();
            break;
        case 'json':
            exportToJSON();
            break;
        default:
            alert('Invalid export format selected.');
    }
    // Close the modal after export
    document.getElementById('exportOptionsModal').style.display = 'none';
}
document.getElementById('exportToCalendarButton').addEventListener('click', function() {
    document.getElementById('exportOptionsModal').style.display = 'block';
});

function initializeCalendar() {
  var calendarEl = document.getElementById('calendar');
  if (!calendar) { // Check if calendar is already initialized
    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      validRange: {
          start: '2023-09-01',
          end: '2023-09-30'
      },
      weekends: true,
      events: [], // We'll populate this with our content ideas later
      eventClick: function(info) {
          alert(info.event.title + '\n' + info.event.extendedProps.description); // Show more details on click
      }
    });
    calendar.render();
  }
}

