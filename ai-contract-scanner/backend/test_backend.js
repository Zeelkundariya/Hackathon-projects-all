const http = require('http');

// Simple script to test the backend API response
const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/analyze',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
};

const data = JSON.stringify({
    contractText: "The Provider shall indemnify the Client against all claims. This agreement may be terminated at any time without cause. Intellectual property shall be owned by the Company in perpetuity. Payment shall be made Net 60 days.",
    industry: "technology",
    userRole: "freelancer", // Test specific role
    userId: "test-user"
});

console.log('Sending request to backend...');
const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(body);
            console.log('--- BACKEND RESPONSE ---');
            if (parsed.success) {
                console.log('Smart Features:', parsed.data.smartFeatures ? 'PRESENT' : 'MISSING');
                if (parsed.data.smartFeatures) {
                    console.log('Worst Case:', parsed.data.smartFeatures.worstCase);
                    console.log('Beneficiary:', parsed.data.smartFeatures.beneficiary);
                }
                console.log('Risk Level:', parsed.data.riskyClauses[0]?.riskLevel?.toUpperCase());
            } else {
                console.log('Error:', parsed.error);
                console.log('Message:', parsed.message);
            }
            console.log('-------------------------');
        } catch (e) {
            console.log('Invalid JSON:', body);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

// Send the request
req.write(data);
req.end();
