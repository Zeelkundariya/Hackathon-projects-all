// browser-extension/content.js
class ContractRiskScanner {
  constructor() {
    this.isActive = false;
    this.riskyClauses = [];
    this.currentText = '';
    this.init();
  }

  init() {
    console.log('Contract Risk Scanner Extension Loaded');
    
    // Inject styles
    this.injectStyles();
    
    // Create UI
    this.createUI();
    
    // Start observing
    this.startObserving();
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'scanPage') {
        this.scanCurrentPage();
      } else if (message.action === 'toggleScanner') {
        this.toggleScanner();
      }
      sendResponse({ success: true });
    });
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .contract-risk-highlight {
        position: relative;
        background-color: rgba(239, 68, 68, 0.2) !important;
        border-radius: 2px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .contract-risk-highlight:hover {
        background-color: rgba(239, 68, 68, 0.3) !important;
      }
      
      .contract-risk-tooltip {
        position: absolute;
        background: #1f2937;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        display: none;
      }
      
      .contract-risk-tooltip.show {
        display: block;
      }
      
      #contract-scanner-overlay {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        padding: 16px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        border: 1px solid #e5e7eb;
        min-width: 320px;
      }
      
      .risk-badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 8px;
        border-radius: 9999px;
        font-size: 12px;
        font-weight: 600;
        margin-right: 8px;
        margin-bottom: 8px;
      }
      
      .risk-high {
        background-color: #fee2e2;
        color: #dc2626;
      }
      
      .risk-medium {
        background-color: #fef3c7;
        color: #d97706;
      }
      
      .risk-low {
        background-color: #d1fae5;
        color: #059669;
      }
    `;
    document.head.appendChild(style);
  }

  createUI() {
    // Remove existing overlay if any
    const existingOverlay = document.getElementById('contract-scanner-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'contract-scanner-overlay';
    this.overlay.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center">
          <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            <span class="text-blue-600 font-bold">⚖️</span>
          </div>
          <div>
            <h3 class="font-bold text-gray-900">Contract Risk Scanner</h3>
            <p class="text-xs text-gray-600">AI-powered risk detection</p>
          </div>
        </div>
        <button id="scanner-toggle" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          Enable Scanner
        </button>
      </div>
      
      <div id="scanner-results" class="hidden">
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">Risk Level</span>
            <span id="risk-score" class="text-lg font-bold text-gray-900">-</span>
          </div>
          <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div id="risk-bar" class="h-full bg-green-500 w-0"></div>
          </div>
        </div>
        
        <div id="risk-breakdown" class="space-y-3"></div>
        
        <div class="mt-4 pt-4 border-t border-gray-200">
          <button id="full-analysis-btn" class="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-lg font-medium hover:opacity-90">
            🔍 Full Analysis
          </button>
          <p class="text-xs text-gray-500 mt-2 text-center">
            Click to analyze entire document
          </p>
        </div>
      </div>
      
      <div id="scanner-disabled" class="text-center py-8">
        <div class="text-gray-400 mb-4">
          <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p class="text-gray-600 mb-4">Scanner is disabled</p>
        <p class="text-sm text-gray-500">Click "Enable Scanner" to start real-time contract analysis</p>
      </div>
    `;

    document.body.appendChild(this.overlay);

    // Add event listeners
    document.getElementById('scanner-toggle').addEventListener('click', () => this.toggleScanner());
    document.getElementById('full-analysis-btn').addEventListener('click', () => this.openFullAnalysis());
  }

  toggleScanner() {
    this.isActive = !this.isActive;
    const toggleBtn = document.getElementById('scanner-toggle');
    const resultsDiv = document.getElementById('scanner-results');
    const disabledDiv = document.getElementById('scanner-disabled');
    
    if (this.isActive) {
      toggleBtn.textContent = 'Disable Scanner';
      toggleBtn.classList.remove('bg-blue-600');
      toggleBtn.classList.add('bg-gray-600');
      resultsDiv.classList.remove('hidden');
      disabledDiv.classList.add('hidden');
      
      // Initial scan
      this.scanCurrentPage();
    } else {
      toggleBtn.textContent = 'Enable Scanner';
      toggleBtn.classList.remove('bg-gray-600');
      toggleBtn.classList.add('bg-blue-600');
      resultsDiv.classList.add('hidden');
      disabledDiv.classList.remove('hidden');
      
      // Remove highlights
      this.removeHighlights();
    }
  }

  startObserving() {
    // Observe text inputs
    const observer = new MutationObserver((mutations) => {
      if (!this.isActive) return;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData' || mutation.type === 'childList') {
          // Debounce scanning
          clearTimeout(this.scanTimeout);
          this.scanTimeout = setTimeout(() => {
            this.scanCurrentPage();
          }, 1000);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  async scanCurrentPage() {
    if (!this.isActive) return;

    // Get text from common contract fields
    const textAreas = document.querySelectorAll('textarea, [contenteditable="true"]');
    let allText = '';
    
    textAreas.forEach(element => {
      const text = element.value || element.textContent;
      if (text && text.length > 50) {
        allText += text + '\n\n';
      }
    });

    // Also check for contract-like text in the page
    if (allText.length < 100) {
      const bodyText = document.body.innerText;
      // Look for contract indicators
      if (bodyText.includes('agreement') || 
          bodyText.includes('contract') || 
          bodyText.includes('terms') ||
          bodyText.includes('clause')) {
        allText = bodyText.substring(0, 2000);
      }
    }

    if (allText.length < 100) return;

    this.currentText = allText;
    
    try {
      // Send to backend for analysis
      const response = await fetch('http://localhost:3001/api/detect/realtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: allText,
          cursorPosition: 0
        })
      });

      const data = await response.json();
      this.riskyClauses = data.immediateRisks || [];
      this.updateUI(data);
      this.highlightText(data.immediateRisks);
    } catch (error) {
      console.error('Scan failed:', error);
    }
  }

  updateUI(data) {
    const riskScore = document.getElementById('risk-score');
    const riskBar = document.getElementById('risk-bar');
    const riskBreakdown = document.getElementById('risk-breakdown');
    
    // Calculate overall risk
    const highRisk = data.immediateRisks.filter(r => r.risk === 'high').length;
    const mediumRisk = data.immediateRisks.filter(r => r.risk === 'medium').length;
    const lowRisk = data.immediateRisks.filter(r => r.risk === 'low').length;
    
    let overallRisk = 'Low';
    let riskPercentage = 20;
    let barColor = 'bg-green-500';
    
    if (highRisk > 0) {
      overallRisk = 'High';
      riskPercentage = 80;
      barColor = 'bg-red-500';
    } else if (mediumRisk > 0) {
      overallRisk = 'Medium';
      riskPercentage = 50;
      barColor = 'bg-yellow-500';
    }
    
    riskScore.textContent = overallRisk;
    riskBar.className = `h-full ${barColor}`;
    riskBar.style.width = `${riskPercentage}%`;
    
    // Update risk breakdown
    riskBreakdown.innerHTML = '';
    
    if (data.immediateRisks.length === 0) {
      riskBreakdown.innerHTML = `
        <div class="text-center py-4">
          <span class="text-green-600">✓</span>
          <p class="text-sm text-gray-600 mt-2">No immediate risks detected</p>
        </div>
      `;
    } else {
      data.immediateRisks.forEach((risk, index) => {
        const riskDiv = document.createElement('div');
        riskDiv.className = 'p-3 bg-gray-50 rounded-lg';
        riskDiv.innerHTML = `
          <div class="flex items-center justify-between mb-2">
            <span class="risk-badge ${
              risk.risk === 'high' ? 'risk-high' :
              risk.risk === 'medium' ? 'risk-medium' : 'risk-low'
            }">
              ${risk.risk.toUpperCase()}
            </span>
            <span class="text-xs text-gray-500">${risk.type}</span>
          </div>
          <p class="text-sm text-gray-700 mb-2">${risk.text.substring(0, 100)}...</p>
          <p class="text-xs text-blue-600">💡 ${risk.suggestion}</p>
        `;
        riskBreakdown.appendChild(riskDiv);
      });
    }
  }

  highlightText(risks) {
    // Remove existing highlights
    this.removeHighlights();
    
    // Add new highlights
    risks.forEach(risk => {
      // Simple text search and highlight
      // Note: In production, use more sophisticated text matching
      const regex = new RegExp(risk.text.substring(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      document.body.innerHTML = document.body.innerHTML.replace(
        regex,
        match => `<span class="contract-risk-highlight" title="${risk.warning}">${match}</span>`
      );
    });
  }

  removeHighlights() {
    const highlights = document.querySelectorAll('.contract-risk-highlight');
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    });
  }

  openFullAnalysis() {
    // Open analysis in new tab
    const encodedText = encodeURIComponent(this.currentText.substring(0, 5000));
    window.open(`http://localhost:3000/analyze?text=${encodedText}`, '_blank');
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ContractRiskScanner());
} else {
  new ContractRiskScanner();
}