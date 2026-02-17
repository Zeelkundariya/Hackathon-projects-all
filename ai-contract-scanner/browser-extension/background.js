// browser-extension/background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Contract Risk Scanner Extension installed');
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getAnalysis') {
    // Handle analysis request
    sendResponse({ status: 'received' });
  }
});