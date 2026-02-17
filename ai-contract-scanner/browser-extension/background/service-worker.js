// Background Service Worker - Handles extension events and badge updates

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "scanSelectedText",
        title: "Scan selection with AI Risk Scanner",
        contexts: ["selection"]
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "scanSelectedText") {
        // Open side panel and scan
        chrome.sidePanel.open({ tabId: tab.id });

        // Send text to side panel (wait a bit for it to open)
        setTimeout(() => {
            chrome.runtime.sendMessage({
                type: 'SCAN_SELECTION',
                contractText: info.selectionText
            });
        }, 500);
    }
});

// Listen for analysis completions to update badge
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ANALYSIS_COMPLETE') {
        const { riskScore, riskCount } = message.data;

        // Update badge with risk count
        chrome.action.setBadgeText({ text: riskCount > 0 ? String(riskCount) : '' });

        // Set badge color based on risk level
        let badgeColor = '#48bb78'; // green (low)
        if (riskScore >= 7) {
            badgeColor = '#f56565'; // red (high)
        } else if (riskScore >= 4) {
            badgeColor = '#ed8936'; // orange (medium)
        }

        chrome.action.setBadgeBackgroundColor({ color: badgeColor });

        // Save to history and respond when done
        saveToHistory(message.data).then(() => {
            sendResponse({ success: true, saved: true });
        });

        return true; // Keep channel open for the async saveToHistory
    }

    if (message.type === 'CLEAR_BADGE') {
        chrome.action.setBadgeText({ text: '' });
        sendResponse({ success: true });
        return false;
    }

    return false; // Don't keep channel open for unknown messages
});

// Save analysis to history
async function saveToHistory(analysisData) {
    try {
        const { history = [] } = await chrome.storage.local.get(['history']);

        // Add new analysis to beginning of array
        history.unshift({
            ...analysisData,
            timestamp: Date.now(),
            id: generateId()
        });

        // Keep only last 50 analyses
        if (history.length > 50) {
            history.splice(50);
        }

        await chrome.storage.local.set({ history });
    } catch (error) {
        console.error('Failed to save to history:', error);
    }
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Clear badge when extension icon is clicked
chrome.action.onClicked.addListener(() => {
    chrome.action.setBadgeText({ text: '' });
});

// Install/Update listener
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Set default settings
        chrome.storage.sync.set({
            apiUrl: 'http://localhost:3001',
            userRole: 'individual',
            industry: 'general',
            eli15Enabled: true,
            darkMode: false,
            autoDetect: true
        });

        // Open welcome page
        chrome.tabs.create({ url: 'options/options.html' });
    }
});
