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
function submitData() {
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
    
    userInput.save().then((response) => {
        console.log('Data saved successfully:', response);
        document.getElementById('submissionMessage').style.display = 'block';
      
        // Generate content ideas based on user input
        generateContentIdeas();

        document.getElementById('spinner').style.display = 'none'; // Hide spinner
    }).catch((error) => {
        console.error('Error while saving data:', error);
        alert('There was an error submitting your data. Please try again.');
        document.getElementById('spinner').style.display = 'none'; // Hide spinner
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
function generateContentIdeas() {
    // Add Direct Titles to our list of content ideas
    const contentIdeas = [...userData.ideas];

    // If Topic Clusters are provided, use them to generate content ideas
    if (userData.topicClusters && userData.topicClusters.length) {
        userData.topicClusters.forEach(cluster => {
            // Use predefined templates or integrate with ChatGPT to generate ideas
            // For simplicity, we'll use a basic template here
            const idea = `A deep dive into ${cluster}`;
            contentIdeas.push(idea);
        });
    }

    // If no Topic Clusters but there are Direct Titles, use them to generate complementary content ideas
    // ... (similar logic as above)

    // Organize the content ideas
    organizeContentIdeas(contentIdeas);
}
function organizeContentIdeas(ideas) {
    // Sort ideas based on SEO, Project Type, Persona
    ideas.sort((a, b) => {
        // Add your sorting logic here
        // For simplicity, we're just using a basic alphabetical sort
        return a.localeCompare(b);
    });

    // Assign specific weekdays to each idea based on the user's frequency input
    const organizedIdeas = assignDatesToIdeas(ideas);

    displayIdeasInTaskView(organizedIdeas);
}
function displayIdeasInTaskView(ideas) {
    // Update the frontend to display the ideas in the described format
    // ...

    // Provide an option for users to toggle to the Calendar View
    // ...
}
function assignDatesToIdeas(ideas) {
    let currentDate = new Date();
    const organizedIdeasWithDates = [];

    ideas.forEach(idea => {
        // Skip weekends
        while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
            currentDate.setDate(currentDate.getDate() + 1);
        }

        organizedIdeasWithDates.push({
            date: new Date(currentDate),
            idea: idea
        });

        currentDate.setDate(currentDate.getDate() + 1);
    });

    return organizedIdeasWithDates;
}
function displayIdeasInTaskView(ideas) {
    const taskViewContainer = document.createElement('div');
    taskViewContainer.id = 'taskViewContainer';

    ideas.forEach(ideaObj => {
        const ideaElement = document.createElement('div');
        ideaElement.className = 'ideaElement';

        const dateElement = document.createElement('p');
        dateElement.textContent = ideaObj.date.toDateString();

        const ideaTextElement = document.createElement('p');
        ideaTextElement.textContent = ideaObj.idea;

        // Add more elements for project type, persona, etc.

        ideaElement.appendChild(dateElement);
        ideaElement.appendChild(ideaTextElement);
        taskViewContainer.appendChild(ideaElement);
    });

    document.body.appendChild(taskViewContainer);
}
function initializeCalendar() {
    $('#calendar').fullCalendar({
        defaultView: 'month',
        validRange: {
            start: '2023-09-01',  // You can dynamically set this based on user input
            end: '2023-09-30'    // You can dynamically set this based on user input
        },
        weekends: true, // this allows weekends. If you want to hide them set it to false
        events: [], // We'll populate this with our content ideas later
        eventClick: function(event) {
            alert(event.title + '\n' + event.description); // Show more details on click
        }
    });
}
function addEventsToCalendar(ideas) {
    const events = ideas.map(idea => ({
        title: idea.title,
        start: idea.date, // This should be a date string in the format 'YYYY-MM-DD'
        description: `${idea.projectType}, ${idea.persona}`
    }));
    $('#calendar').fullCalendar('addEventSource', events);
}
// For Calendar View
$('#calendar').fullCalendar('changeView', 'month');

// For Task View (List)
$('#calendar').fullCalendar('changeView', 'listMonth');
    
initializeCalendar();

// Call initialization functions or any other setup tasks here
populateIndustries();


// Attach event listeners
document.getElementById('contentForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    submitData();
    event.target.removeEventListener(event.type, arguments.callee); // Remove the event listener after submission
});

document.getElementById('ideaType').addEventListener('change', toggleIdeaTypeFields);
