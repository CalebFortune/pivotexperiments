// Initialize Parse SDK
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

// 2. Navigation Functions
function navigateToPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.style.display = 'none';
    });
    document.getElementById(pageId).style.display = 'block';
}

// 3. Dynamic Field Population
async function populateIndustries() {
    const IndustryKeywords = Parse.Object.extend("IndustryKeywords");
    const query = new Parse.Query(IndustryKeywords);
    try {
        const industryKeywords = await query.find();
        const industryDropdown = document.getElementById('industry');
        industryKeywords.forEach(industryKeyword => {
            const option = document.createElement('option');
            option.value = industryKeyword.get('industry');
            option.textContent = industryKeyword.get('industry');
            industryDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching industries:', error);
    }
}

async function populateProjectTypes() {
    const ProjectType = Parse.Object.extend("ProjectType");
    const query = new Parse.Query(ProjectType);
    try {
        const projectTypes = await query.find();
        const projectTypeDropdown = document.getElementById('projectType');
        const ideaProjectTypeDropdown = document.getElementById('ideaProjectType');
        projectTypes.forEach(projectType => {
            const option = document.createElement('option');
            option.value = projectType.get('name');
            option.textContent = projectType.get('name');
            projectTypeDropdown.appendChild(option.cloneNode(true));
            ideaProjectTypeDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching project types:', error);
    }
}

async function populatePersonas() {
    const Persona = Parse.Object.extend("Persona");
    const query = new Parse.Query(Persona);
    try {
        const personas = await query.find();
        const personaDropdown = document.getElementById('persona');
        const ideaPersonaDropdown = document.getElementById('ideaPersona');
        personas.forEach(persona => {
            const option = document.createElement('option');
            option.value = persona.get('name');
            option.textContent = persona.get('name');
            personaDropdown.appendChild(option.cloneNode(true));
            ideaPersonaDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching personas:', error);
    }
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
    document.getElementById('directTitleFields').style.display = (ideaType === 'directTitle') ? 'block' : 'none';
    document.getElementById('topicClusterField').style.display = (ideaType === 'topicCluster') ? 'block' : 'none';
}

// Call initialization functions or any other setup tasks here
populateIndustries();
populateProjectTypes();
populatePersonas();

// Attach event listeners
document.getElementById('contentForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    submitData();
});

document.getElementById('ideaType').addEventListener('change', toggleIdeaTypeFields);
