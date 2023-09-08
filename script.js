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
    const Industry = Parse.Object.extend("Industry");
    const query = new Parse.Query(Industry);
    try {
        const industries = await query.find();
        const industryDropdown = document.getElementById('industry');
        industries.forEach(industry => {
            const option = document.createElement('option');
            option.value = industry.get('name');
            option.textContent = industry.get('name');
            industryDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching industries:', error);
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
    userData.projectTypes = [
        document.getElementById('projectType1').value,
        document.getElementById('projectType2').value,
        document.getElementById('projectType3').value
    ];
    userData.personas = [
        document.getElementById('persona1').value,
        document.getElementById('persona2').value,
        document.getElementById('persona3').value
    ];
}

function validateUserData() {
    for (let key in userData) {
        if (!userData[key] || (Array.isArray(userData[key]) && !userData[key].length)) {
            alert(`Please fill the ${key} field.`);
            return false;
        }
    }
    return true;
}

// 5. Data Submission
function submitData() {
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

// Attach event listeners
document.getElementById('contentForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    submitData();
});

document.getElementById('ideaType').addEventListener('change', toggleIdeaTypeFields);
