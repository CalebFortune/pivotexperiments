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
let projectTypeData = [];
let personaData = [];

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
    userData.projectTypes.forEach(projectType => {
        const option = document.createElement('option');
        option.value = projectType;
        option.textContent = projectType;
        ideaProjectTypeDropdown.appendChild(option);
    });
}

function populatePersonas() {
    const ideaPersonaDropdown = document.getElementById('ideaPersona');
    userData.personas.forEach(persona => {
        const option = document.createElement('option');
        option.value = persona;
        option.textContent = persona;
        ideaPersonaDropdown.appendChild(option);
    });
}

    const ideaPersonaDropdown = document.getElementById('ideaPersona');
    personaData.forEach(persona => {
        const option = document.createElement('option');
        option.value = persona.get('name');
        option.textContent = persona.get('name');
        ideaPersonaDropdown.appendChild(option.cloneNode(true)); // Use cloneNode to ensure a fresh copy for each dropdown
    });
}

// 4. Data Collection and Validation
function collectUserData() {
    userData.fullName = document.getElementById('fullName').value;
    userData.company = document.getElementById('company').value;
    userData.industry = document.getElementById('industry').value;
    userData.timeFrame = document.getElementById('timeFrame').value;
    userData.frequency = document.getElementById('frequency').value;
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
        alert('Data submitted successfully!');
    }).catch((error) => {
        console.error('Error while saving data:', error);
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
    // This function can show a progress indicator after the summary page when a user submits.
    // For simplicity, we'll just show an alert, but you can replace this with a more sophisticated progress indicator.
    alert('Submitting your data, please wait...');
}

// Call initialization functions or any other setup tasks here
populateIndustries();


// Attach event listeners
document.getElementById('contentForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    submitData();
    event.target.removeEventListener(event.type, arguments.callee); // Remove the event listener after submission
});

document.getElementById('ideaType').addEventListener('change', toggleIdeaTypeFields);
