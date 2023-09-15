Parse.initialize("yCVQ6n5s2B2UlAjGznIJy48ZGVqDqWvPkLDafztR", "onVLFcQX8q20jhSVlinFQS9194m5G3G5tc6Waxfi");
Parse.serverURL = 'https://parseapi.back4app.com/';

// 1. Initialization and Global Variables
const userData = {
    fullName: "",
    company: "",
    industry: "",
    timeFrame: "",
    frequency: 0,
    frequencyType: "",
    projectTypes: [],
    personas: [],
    ideas: []
};

// Global variables to store fetched data
let industryData = [];

// 2. Navigation Functions
function navigateToPage(pageId, event) {
    event.preventDefault(); // Prevent default behavior
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.style.display = 'none';
    });
    document.getElementById(pageId).style.display = 'block';
    if (pageId === 'ideaInputPage') {
        populateProjectTypes();
        populatePersonas();
    }
    if (pageId === 'summaryPage') {
        populateSummary();
    }
    if (pageId === 'finalPage') {
    document.getElementById('exportToCalendarButton').style.display = 'block';
    document.getElementById('calendar').style.display = 'block'; // Ensure the calendar is visible
    initializeCalendar();
    }
}

// 3. Dynamic Field Population
async function populateIndustries() {
    if (!industryData.length) { // Only fetch if not already fetched
        const IndustryKeywords = Parse.Object.extend("IndustryKeywords");
        const query = new Parse.Query(IndustryKeywords);
        try {
            industryData = await query.find();
        } catch (error) {
            console.error('Error fetching industries:', error);
        }
    }
    
    const industryDropdown = document.getElementById('industry');
    industryData.forEach(industryKeyword => {
        const option = document.createElement('option');
        option.value = industryKeyword.get('industry');
        option.textContent = industryKeyword.get('industry');
        industryDropdown.appendChild(option);
    });
}
function populateProjectTypes() {
    const ideaProjectTypeDropdown = document.getElementById('ideaProjectType');
    // Clear any existing options
    ideaProjectTypeDropdown.innerHTML = '';
    
    userData.projectTypes.forEach(projectType => {
        if (projectType) { // Check if the projectType is not an empty string
            const option = document.createElement('option');
            option.value = projectType;
            option.textContent = projectType;
            ideaProjectTypeDropdown.appendChild(option);
        }
    });
}

function populatePersonas() {
    const ideaPersonaDropdown = document.getElementById('ideaPersona');
    // Clear any existing options
    ideaPersonaDropdown.innerHTML = '';
    
    userData.personas.forEach(persona => {
        if (persona) { // Check if the persona is not an empty string
            const option = document.createElement('option');
            option.value = persona;
            option.textContent = persona;
            ideaPersonaDropdown.appendChild(option);
        }
    });
}


// 4. Data Collection and Validation
function collectUserData() {
    userData.fullName = document.getElementById('fullName').value;
    userData.company = document.getElementById('company').value;
    userData.industry = document.getElementById('industry').value;
    userData.timeFrame = document.getElementById('timeFrame').value;
    userData.frequency = parseInt(document.getElementById('frequency').value, 10);
    userData.frequencyType = document.getElementById('frequencyType').value;
    // Assuming you have multiple projectType and persona fields, you can adjust as needed
    userData.projectTypes = Array.from(document.querySelectorAll('.projectType')).map(el => el.value);
    userData.personas = Array.from(document.querySelectorAll('.persona')).map(el => el.value);
}

function validateUserData() {
    const currentPage = document.querySelector('.page[style*="block"]');
    if (!currentPage) return true; // If no page is detected, default to true.

    const pageId = currentPage.id;

    switch (pageId) {
        case 'userDetailsPage':
            // Validate fields specific to the User Details page
            if (!userData.fullName || !userData.company || !userData.industry) {
                alert('Please fill in all fields on this page.');
                return false;
            }
            break;

        case 'timeFrequencyPage':
            // Validate fields specific to the Time and Frequency page
            if (!userData.timeFrame || !userData.frequency || !userData.frequencyType) {
                alert('Please fill in all fields on this page.');
                return false;
            }
            break;

        case 'keyFactorsPage':
            // Validate fields specific to the Key Factors page
            if (userData.projectTypes.some(pt => !pt) || userData.personas.some(p => !p)) {
                alert('Please fill in all fields on this page.');
                return false;
            }
            break;

        case 'ideaInputPage':
            // Validate fields specific to the Idea Input page
            // If you have specific fields to validate here, add them.
            break;

        default:
            break;
    }

    return true;
}

// 5. Data Submission
async function submitData() {
    if (userData.ideas.length === 0) {
        alert('Please add at least one idea before submitting.');
        return;
    }
    collectUserData(); // Collect user data before validating
    if (!validateUserData()) return;

    submitProgress(); // Show submission progress

    const UserInput = Parse.Object.extend("UserInput");
    const userInput = new UserInput();

    for (let key in userData) {
        userInput.set(key, userData[key]);
    }

    // Separate Direct Titles and Topic Clusters
    const directTitles = userData.ideas.filter(idea => idea.type === 'directTitle').map(idea => idea.title);
    const topicClusters = userData.ideas.filter(idea => idea.type === 'topicCluster').map(idea => idea.topic);

    // Calculate the total number of ideas needed
    const totalIdeasNeeded = calculateTotalIdeasNeeded();
    const ideasToGenerate = totalIdeasNeeded - userData.ideas.length;

    Parse.Cloud.run('generateTitles', {
        topicClusters: topicClusters,
        directTitles: directTitles,
        ideasToGenerate: ideasToGenerate,
        projectTypes: userData.projectTypes,
        personas: userData.personas,
    }).then(async (generatedTitles) => {

        // Merge the initial directTitles with the generatedTitles
        const allDirectTitles = directTitles.concat(generatedTitles.map(title => ({
            title: title,
            projectType: title.projectType,  // Assuming generatedTitles have projectType and persona properties
            persona: title.persona
        })));

        const contentIdeas = await organizeContentIdeas(allDirectTitles); // Organize the merged ideas
        const datedIdeas = assignDatesToIdeas(contentIdeas); // Assign dates to the organized ideas
        addEventsToCalendar(datedIdeas); // Add the ideas to the calendar

        // Set the merged directTitles array to the 'ideas' column
        userInput.set('ideas', allDirectTitles);

        // Save the final user input data
        return userInput.save();
        
    }).then((response) => {
        console.log('Final data saved successfully:', response);
        document.getElementById('submissionMessage').style.display = 'block';
        document.getElementById('spinner').style.display = 'none'; // Hide spinner

        navigateToPage('finalPage', event);

        
    }).catch((error) => {
        console.error('Error:', error);
        switch (error.code) {
    case 100:
        errorMessage = 'Connection failed (e.g., the server is unreachable).';
        break;
    case 101:
        errorMessage = 'Object not found.';
        break;
    case 102:
        errorMessage = 'Invalid query.';
        break;
    case 103:
        errorMessage = 'Invalid class name.';
        break;
    case 104:
        errorMessage = 'Missing object ID.';
        break;
    case 105:
        errorMessage = 'Invalid key name.';
        break;
    case 106:
        errorMessage = 'Invalid pointer.';
        break;
    case 107:
        errorMessage = 'Invalid JSON.';
        break;
    case 108:
        errorMessage = 'Command unavailable.';
        break;
    case 109:
        errorMessage = 'Not initialized.';
        break;
    case 111:
        errorMessage = 'Incorrect type.';
        break;
    case 112:
        errorMessage = 'Invalid channel name.';
        break;
    case 114:
        errorMessage = 'Invalid device token.';
        break;
    case 115:
        errorMessage = 'Push misconfigured.';
        break;
    case 116:
        errorMessage = 'Object too large.';
        break;
    case 119:
        errorMessage = 'Operation forbidden.';
        break;
    case 120:
        errorMessage = 'Cache miss.';
        break;
    case 124:
        errorMessage = 'Request timeout.';
        break;
    case 125:
        errorMessage = 'Invalid email address.';
        break;
    case 137:
        errorMessage = 'Duplicate value.';
        break;
    case 139:
        errorMessage = 'Invalid role name.';
        break;
    case 140:
        errorMessage = 'Exceeded quota.';
        break;
    case 141:
        errorMessage = 'Cloud code error.';
        break;
    case 142:
        errorMessage = 'Cloud code validation failure.';
        break;
    case 153:
        errorMessage = 'File save error.';
        break;
    case 155:
        errorMessage = 'Request limit exceeded.';
        break;
    case 160:
        errorMessage = 'Invalid push time.';
        break;
    case 200:
        errorMessage = 'Username missing.';
        break;
    case 201:
        errorMessage = 'Password missing.';
        break;
    case 202:
        errorMessage = 'Username taken.';
        break;
    case 203:
        errorMessage = 'Email taken.';
        break;
    case 204:
        errorMessage = 'Email missing.';
        break;
    case 205:
        errorMessage = 'Email not found.';
        break;
    case 206:
        errorMessage = 'Session token missing.';
        break;
    case 207:
        errorMessage = 'Must create user through signup.';
        break;
    case 208:
        errorMessage = 'Account already linked.';
        break;
    case 209:
        errorMessage = 'Invalid session token.';
        break;
    case 250:
        errorMessage = 'Linked ID missing.';
        break;
    case 251:
        errorMessage = 'Invalid linked session.';
        break;
    case 252:
        errorMessage = 'Unsupported service.';
        break;
    default:
        errorMessage = 'There was an error submitting your data. Please try again.';
}

        alert(errorMessage);
        document.getElementById('spinner').style.display = 'none';
    });
}
// 6. Additional Utility Functions
function toggleIdeaTypeFields() {
    const ideaType = document.getElementById('ideaType').value;
    if (!ideaType) {
        document.getElementById('directTitleFields').style.display = 'none';
        document.getElementById('topicClusterField').style.display = 'none';
        return;
    }
    document.getElementById('directTitleFields').style.display = (ideaType === 'directTitle') ? 'block' : 'none';
    document.getElementById('topicClusterField').style.display = (ideaType === 'topicCluster') ? 'block' : 'none';
}
function populateSummary() {
    document.getElementById('summaryName').textContent = userData.fullName;
    document.getElementById('summaryCompany').textContent = userData.company;
    document.getElementById('summaryIndustry').textContent = userData.industry;
    document.getElementById('summaryTimeFrame').textContent = userData.timeFrame;
    document.getElementById('summaryFrequency').textContent = userData.frequency;
    document.getElementById('summaryFrequencyType').textContent = userData.frequencyType;
    document.getElementById('summaryProjectTypes').textContent = userData.projectTypes.join(', ');
    document.getElementById('summaryPersonas').textContent = userData.personas.join(', ');
    document.getElementById('summaryTotalIdeas').textContent = userData.ideas.length;

    // Calculate the required number of ideas
    let totalPeriods; // This will store the total number of weeks or months

    switch (userData.timeFrame) {
        case 'month':
            totalPeriods = 1;
            break;
        case 'quarter':
            totalPeriods = 3;
            break;
        case '6months':
            totalPeriods = 6;
            break;
        case 'year':
            totalPeriods = 12;
            break;
        default:
            totalPeriods = 0;
    }

    if (userData.frequencyType === 'week') {
        totalPeriods *= 4; // Convert months to weeks
    }

    const requiredIdeas = totalPeriods * userData.frequency;

    document.getElementById('requiredIdeasCount').textContent = requiredIdeas;
}

function saveIdea() {
    // Collect data from the Idea Input section
    const ideaType = document.getElementById('ideaType').value;
    let ideaData = {};

    if (ideaType === 'directTitle') {
        ideaData = {
            type: 'directTitle',
            title: document.getElementById('title').value,
            projectType: document.getElementById('ideaProjectType').value,
            persona: document.getElementById('ideaPersona').value
        };
    } else if (ideaType === 'topicCluster') {
        ideaData = {
            type: 'topicCluster',
            topic: document.getElementById('topic').value
        };
    }

    // Store the idea data in the userData.ideas array
    userData.ideas.push(ideaData);

    // Clear the input fields
    document.getElementById('ideaType').selectedIndex = 0; // Reset to "Select Idea Type"
    document.getElementById('title').value = '';
    document.getElementById('ideaProjectType').selectedIndex = 0;
    document.getElementById('ideaPersona').selectedIndex = 0;
    document.getElementById('topic').value = '';

    // Hide the directTitleFields and topicClusterField sections
    document.getElementById('directTitleFields').style.display = 'none';
    document.getElementById('topicClusterField').style.display = 'none';

    // Provide feedback to the user (optional)
    alert('Idea saved! You can now enter another idea.');
}
function submitProgress() {
    document.getElementById('spinner').style.display = 'block';
}
function calculateTotalIdeasNeeded() {
    let totalPeriods; // This will store the total number of weeks or months

    switch (userData.timeFrame) {
        case 'month':
            totalPeriods = 1;
            break;
        case 'quarter':
            totalPeriods = 3;
            break;
        case '6months':
            totalPeriods = 6;
            break;
        case 'year':
            totalPeriods = 12;
            break;
        default:
            totalPeriods = 0;
    }

    if (userData.frequencyType === 'week') {
        totalPeriods *= 4; // Convert months to weeks
    }

    return totalPeriods * userData.frequency;
}

async function organizeContentIdeas(ideas) {
    // Fetch industry keywords based on the user's selected industry
    const industryKeywords = await fetchIndustryKeywordsFromServer(userData.industry);
    if (!Array.isArray(industryKeywords)) {
        console.error("Industry keywords are not defined or not an array.");
        return ideas; // Return the original ideas without sorting
    }

    // Score each idea
    ideas.forEach(idea => {
        idea.score = getIdeaScore(idea, industryKeywords);
    });

    // Sort ideas based on their scores
    ideas.sort((a, b) => b.score - a.score); // Sort in descending order of scores

    return ideas;
}

function getIdeaScore(idea, industryKeywords) {
    let score = 0;

    // SEO relevance
    if (idea.title && industryKeywords.some(keyword => idea.title.includes(keyword))) {
        score += 1000; // A large score for SEO relevance
    }

    // Persona and Project Type combinations
    const personaIndex = userData.personas.indexOf(idea.persona);
    const projectTypeIndex = userData.projectTypes.indexOf(idea.projectType);
    score += (3 - personaIndex) * 10 + (3 - projectTypeIndex); // This scoring gives priority to earlier personas and project types

    return score;
}

// Call initialization functions or any other setup tasks here
populateIndustries();

// Global calendar variable
var calendar;

function initializeCalendar() {
    var calendarEl = document.getElementById('calendar');
    if (calendarEl && !calendar) { // Check if calendar element exists and if calendar is already initialized
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
    if (!calendar) {
        initializeCalendar();
    }
    const events = ideas.map(ideaObj => ({
        title: ideaObj.idea,
        start: ideaObj.date.toISOString().split('T')[0], // Convert the Date object to a 'YYYY-MM-DD' format
        description: `${ideaObj.projectType}, ${ideaObj.persona}`
    }));
    calendar.addEventSource(events);
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

async function fetchIndustryKeywordsFromServer() {
    try {
        const response = await Parse.Cloud.run('getIndustryKeywords', { industryName: userData.industry });
        return response;
    } catch (error) {
        console.error("Error fetching industry keywords:", error);
        return [];
    }
}
// Attach event listeners
document.getElementById('contentForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const currentPage = document.querySelector('.page[style*="block"]');
    if (currentPage) {
        if (currentPage.id === 'summaryPage') {
            // If the user is on the Summary page, submit the data
            submitData();
        } else {
            // Otherwise, click the 'Next' button to navigate to the next page
            const nextPageButton = currentPage.querySelector('.next-button'); // Assuming you have a class "next-button" for the next buttons
            if (nextPageButton) {
                nextPageButton.click();
            }
        }
    }
});
document.getElementById('contentForm').addEventListener('keydown', function(event) {
    if (event.key === 'Enter' || event.keyCode === 13) {
        event.preventDefault(); // Prevent the default 'enter' key behavior

        const currentPage = document.querySelector('.page[style*="block"]');
        if (currentPage) {
            if (currentPage.id === 'summaryPage') {
                // If the user is on the Summary page, submit the data
                submitData();
            } else {
                // Otherwise, click the 'Next' button to navigate to the next page
                const nextPageButton = currentPage.querySelector('.next-button');
                if (nextPageButton) {
                    nextPageButton.click();
                }
            }
        }
    }
});

document.getElementById('ideaInputNextButton').addEventListener('click', function(event) {
    event.preventDefault();
    
    // Save the idea if there's any input
    const ideaType = document.getElementById('ideaType').value;
    if (ideaType) {
        saveIdea();
    }
    
    // Navigate to the Summary Page
    navigateToPage('summaryPage', event);
});

document.getElementById('ideaType').addEventListener('change', toggleIdeaTypeFields);
