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
    }
    if (pageId === 'finalPage') {
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

    // Calculate the total number of ideas needed
    const totalIdeasNeeded = calculateTotalIdeasNeeded();
    const ideasToGenerate = totalIdeasNeeded - userData.ideas.length;

    // Generate content ideas based on user input
    Parse.Cloud.run('generateTitles', {
        topicClusters: userData.topicClusters,
        directTitles: userData.ideas,
        ideasToGenerate: ideasToGenerate
    }).then(async (generatedTitles) => {
        const contentIdeas = await Parse.Cloud.run('generateContentCalendar', { titles: generatedTitles });

        // Organize the content ideas
        const organizedIdeas = await organizeContentIdeas(contentIdeas);

        // Save the final user input data
        return userInput.save();

    }).then((response) => {
        console.log('Final data saved successfully:', response);
        document.getElementById('submissionMessage').style.display = 'block';
        document.getElementById('spinner').style.display = 'none'; // Hide spinner

    }).catch((error) => {
        console.error('Error:', error);
        
        let errorMessage = 'There was an error submitting your data. Please try again.';
        if (error.code === SOME_SPECIFIC_ERROR_CODE) {
            errorMessage = 'Specific error message for this error code.';
        }
        // Add more conditions as needed

        alert(errorMessage);
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

async function generateContentIdeaWithOpenAI() {
    const response = await fetch('https://parseapi.back4app.com/functions/generateContentIdeas', {
        method: 'POST',
        headers: {
            'X-Parse-Application-Id': 'yCVQ6n5s2B2UlAjGznIJy48ZGVqDqWvPkLDafztR', // Replace with your App ID
            'X-Parse-REST-API-Key': 'UKY7AffhQFkREuy3XBarGcTAash2vMpmuuLy1cgC', // Replace with your REST API Key
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userData: userData
        })
    });

    const result = await response.json();
    return result.result;
}

async function fetchOpenAI(prompt) {
    try {
        const response = await Parse.Cloud.run('generateContentWithOpenAI', { prompt: prompt });
        return response;
    } catch (error) {
        console.error("Error fetching from OpenAI:", error);
        return null;
    }
}

    // If no Topic Clusters but there are Direct Titles, use them to generate complementary content ideas
    // ... (similar logic as above)


async function organizeContentIdeas(ideas) {
    // Fetch industry keywords based on the user's selected industry
    const industryKeywords = await getIndustryKeywords(userData.industry);

    // Sort based on SEO
    ideas.sort((a, b) => {
        const aContainsKeyword = industryKeywords.some(keyword => a.title.includes(keyword));
        const bContainsKeyword = industryKeywords.some(keyword => b.title.includes(keyword));
        if (aContainsKeyword && !bContainsKeyword) return -1;
        if (!aContainsKeyword && bContainsKeyword) return 1;
        return 0;
    });

    // Sort based on Project Type and Persona
    ideas.sort((a, b) => {
        const aPriority = getIdeaPriority(a);
        const bPriority = getIdeaPriority(b);
        return aPriority - bPriority;
    });

    return ideas;
}

function getIdeaPriority(idea) {
    const projectTypePriority = userData.projectTypes.indexOf(idea.projectType);
    const personaPriority = userData.personas.indexOf(idea.persona);

    // Calculate a combined priority score. This can be adjusted based on how you want to weigh each factor.
    return projectTypePriority * 10 + personaPriority;
}

async function getIndustryKeywords(industry) {
    try {
        const response = await Parse.Cloud.run('getIndustryKeywords', { industryName: industry });
        return response;
    } catch (error) {
        console.error("Error fetching industry keywords:", error);
        return [];
    }
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
