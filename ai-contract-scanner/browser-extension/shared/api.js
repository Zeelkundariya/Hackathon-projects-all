const API_BASE_URL = 'http://localhost:3001';

async function tryFetch(path, options = {}) {
    console.log(`📡 Attempting fetch to ${API_BASE_URL}${path}...`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeout);
        return response;
    } catch (error) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') {
            throw new Error('Connection timed out. The server is taking too long to respond.');
        }
        throw error;
    }
}

async function analyzeContract(contractText, userRole = 'individual', industry = 'general') {
    try {
        const response = await tryFetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contractText,
                userRole,
                industry,
                userId: 'extension-user'
            })
        });

        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Analysis failed');
        }

        return data.data;
    } catch (error) {
        console.error('API Error:', error);
        throw new Error(error.message || 'Failed to connect to backend. Ensure server is running on localhost:3001');
    }
}

async function analyzeFile(file, userRole = 'individual', industry = 'general') {
    try {
        const formData = new FormData();
        formData.append('contractFile', file);
        formData.append('userRole', userRole);
        formData.append('industry', industry);
        formData.append('userId', 'extension-user');

        const response = await tryFetch('/api/analyze/file', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`File analysis failed: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Analysis failed');
        }

        return data.data;
    } catch (error) {
        console.error('File API Error:', error);
        throw new Error(error.message || 'Failed to connect to backend for OCR. Ensure the server is running.');
    }
}

// Export for use in popup
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { analyzeContract, analyzeFile };
}
