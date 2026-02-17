const fs = require('fs');
const path = require('path');

try {
    const logPath = path.join(__dirname, 'backend_error.log');
    if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf8');
        console.log('--- LOG CONTENT START ---');
        console.log(content.slice(-2000)); // Last 2000 chars
        console.log('--- LOG CONTENT END ---');
    } else {
        console.log('Log file not found.');
    }
} catch (e) {
    console.error('Error reading log:', e);
}
