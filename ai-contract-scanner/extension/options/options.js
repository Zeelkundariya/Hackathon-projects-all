// Options Page JavaScript

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('settingsForm');
    const successMsg = document.getElementById('successMsg');

    // Load current settings
    const settings = await chrome.storage.sync.get([
        'apiUrl',
        'userRole',
        'industry',
        'eli15Enabled',
        'autoDetect',
        'darkMode'
    ]);

    // Populate form
    document.getElementById('apiUrl').value = settings.apiUrl || 'http://localhost:3001';
    document.getElementById('userRole').value = settings.userRole || 'individual';
    document.getElementById('industry').value = settings.industry || 'general';
    document.getElementById('eli15Enabled').checked = settings.eli15Enabled !== false;
    document.getElementById('autoDetect').checked = settings.autoDetect !== false;

    const darkModeCheckbox = document.getElementById('darkMode');
    darkModeCheckbox.checked = settings.darkMode || false;
    if (settings.darkMode) document.body.classList.add('dark');

    // Live theme switching
    darkModeCheckbox.addEventListener('change', () => {
        if (darkModeCheckbox.checked) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    });

    // Save settings
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newSettings = {
            apiUrl: document.getElementById('apiUrl').value,
            userRole: document.getElementById('userRole').value,
            industry: document.getElementById('industry').value,
            eli15Enabled: document.getElementById('eli15Enabled').checked,
            autoDetect: document.getElementById('autoDetect').checked,
            darkMode: document.getElementById('darkMode').checked
        };

        await chrome.storage.sync.set(newSettings);

        // Show success message
        successMsg.classList.add('show');
        setTimeout(() => {
            successMsg.classList.remove('show');
        }, 3000);
    });
});
