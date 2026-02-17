// Content Script - Auto-detect contracts on web pages and add scan button

let scanButton = null;
let settings = {};

// Load settings
chrome.storage.sync.get(['autoDetect'], (result) => {
    settings = result;
    if (settings.autoDetect !== false) {
        initializeDetection();
    }
});

function initializeDetection() {
    // Detect if page likely contains a contract
    if (isLikelyContractPage()) {
        addScanButton();
    }
}

function isLikelyContractPage() {
    const text = document.body.innerText.toLowerCase();
    const contractKeywords = [
        'agreement', 'contract', 'terms and conditions', 'terms of service',
        'license agreement', 'employment agreement', 'non-disclosure',
        'whereas', 'party', 'parties', 'covenant', 'indemnify',
        'intellectual property', 'confidentiality', 'termination clause'
    ];

    let keywordCount = 0;
    contractKeywords.forEach(keyword => {
        if (text.includes(keyword)) keywordCount++;
    });

    // If 3+ contract keywords found, likely a contract
    return keywordCount >= 3;
}

function addScanButton() {
    // Don't add button if it already exists
    if (scanButton) return;

    // Create floating scan button
    scanButton = document.createElement('div');
    scanButton.id = 'contract-scanner-button';
    scanButton.innerHTML = `
    <button id="scan-contract-btn">
      <span class="icon">⚖️</span>
      <span class="text">Scan Contract</span>
    </button>
  `;

    document.body.appendChild(scanButton);

    // Add click listener
    document.getElementById('scan-contract-btn').addEventListener('click', extractAndScan);
}

function extractAndScan() {
    // Get all text from page
    const contractText = document.body.innerText;

    // Send to extension popup
    chrome.runtime.sendMessage({
        type: 'SCAN_PAGE_CONTRACT',
        contractText: contractText
    });

    // Show feedback
    const btn = document.getElementById('scan-contract-btn');
    btn.classList.add('scanning');
    btn.querySelector('.text').textContent = 'Opening Scanner...';

    setTimeout(() => {
        btn.classList.remove('scanning');
        btn.querySelector('.text').textContent = 'Scan Contract';
    }, 2000);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_PAGE_TEXT') {
        sendResponse({ text: document.body.innerText });
    }
    return true;
});
