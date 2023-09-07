// Initialize Parse SDK
Parse.initialize("yCVQ6n5s2B2UlAjGznIJy48ZGVqDqWvPkLDafztR", "onVLFcQX8q20jhSVlinFQS9194m5G3G5tc6Waxfi");
Parse.serverURL = 'https://parseapi.back4app.com/';

document.getElementById('contentForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    // Capture form data
    const name = document.getElementById('name').value;
    const company = document.getElementById('company').value;
    const industry = document.getElementById('industry').value;
    const timeFrame = document.getElementById('timeFrame').value;
    const frequency = parseInt(document.getElementById('frequency').value, 10);
    const frequencyType = document.getElementById('frequencyType').value;
    const projectTypes = document.getElementById('projectTypes').value.split(',').map(item => item.trim());
    const personas = document.getElementById('personas').value.split(',').map(item => item.trim());
    const ideas = document.getElementById('ideas').value.split('\n').map(item => ({
        type: item.includes('-') ? 'Direct Title' : 'Topic Cluster',
        value: item.trim()
    }));

    try {
        // Call the cloud function to generate the content calendar
        const result = await Parse.Cloud.run('generateContentCalendar', {
            name,
            company,
            industry,
            timeFrame,
            frequency,
            frequencyType,
            projectTypes,
            personas,
            ideas
        });

        // Display the results in the calendarOutput div
        const calendarOutput = document.getElementById('calendarOutput');
        calendarOutput.innerHTML = '';
        for (const month in result) {
            const monthDiv = document.createElement('div');
            monthDiv.className = 'month';
            monthDiv.innerHTML = `<h2>Month: ${month}</h2>`;
            result[month].forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'item';
                itemDiv.textContent = item;
                monthDiv.appendChild(itemDiv);
            });
            calendarOutput.appendChild(monthDiv);
        }
    } catch (error) {
        console.error('Error generating content calendar:', error);
    }
});
