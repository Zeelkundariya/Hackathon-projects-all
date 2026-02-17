// Popup JavaScript - v2.0 Advanced Version
document.addEventListener('DOMContentLoaded', async () => {
    // Elements
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const contractTextArea = document.getElementById('contractText');
    const userRoleSelect = document.getElementById('userRole');
    const industrySelect = document.getElementById('industry');
    const eli15Toggle = document.getElementById('eli15Toggle');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const charCount = document.getElementById('charCount');
    const resultsDiv = document.getElementById('results');
    const errorDiv = document.getElementById('errorMsg');
    const btnText = document.getElementById('btnText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistory');
    const openWebAppLink = document.getElementById('openWebApp');
    const openSettingsBtn = document.getElementById('openSettings');
    const resultActions = document.getElementById('resultActions');
    const exportTxtBtn = document.getElementById('exportTxt');
    const exportJsonBtn = document.getElementById('exportJson');

    // v4.0 Elements
    const audioDashboard = document.getElementById('audioDashboard');
    const readAllBtn = document.getElementById('readAllBtn');
    const stopBtn = document.getElementById('stopBtn');
    const voiceSelect = document.getElementById('voiceSelect');
    const speedSelect = document.getElementById('speedSelect');
    const audioVisualizer = document.getElementById('audioVisualizer');
    const autocompleteBox = document.getElementById('autocompleteBox');
    const suggestionText = document.getElementById('suggestionText');
    const replaceBtn = document.getElementById('replaceBtn');
    const closeSuggest = document.getElementById('closeSuggest');

    // v5.0 Elements
    const uploadBtn = document.getElementById('uploadBtn');
    const fileInput = document.getElementById('fileInput');
    const fileStatus = document.getElementById('fileStatus');

    let currentAnalysis = null;
    let synth = window.speechSynthesis;
    let voices = [];
    let isSpeaking = false;
    let suggestionTimeout = null;
    let activeSuggestion = null;

    // Load voices
    function populateVoiceList() {
        voices = synth.getVoices();
        voiceSelect.innerHTML = '';
        voices.forEach((voice, i) => {
            const option = document.createElement('option');
            option.textContent = voice.name + ' (' + voice.lang + ')';
            if (voice.default) option.textContent += ' -- DEFAULT';
            option.setAttribute('data-lang', voice.lang);
            option.setAttribute('data-name', voice.name);
            voiceSelect.appendChild(option);
        });
    }

    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }

    // Load Initial Settings
    chrome.storage.sync.get(['userRole', 'industry', 'eli15Enabled', 'contractText', 'darkMode'], (saved) => {
        if (saved.userRole) userRoleSelect.value = saved.userRole;
        if (saved.industry) industrySelect.value = saved.industry;
        if (saved.eli15Enabled !== undefined) eli15Toggle.checked = saved.eli15Enabled;
        if (saved.contractText) contractTextArea.value = saved.contractText;
        if (saved.darkMode) document.body.classList.add('dark');
        updateCharCount();
    });

    // Tab Switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');
            if (!target) return; // For settings btn

            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${target}Tab`).classList.add('active');

            if (target === 'history') loadHistory();
        });
    });

    // Open Settings
    openSettingsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    openWebAppLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'http://localhost:3000' });
    });

    // Tracking Changes
    contractTextArea.addEventListener('input', () => {
        updateCharCount();
        chrome.storage.sync.set({ contractText: contractTextArea.value });
        handleAutocomplete();
    });

    function handleAutocomplete() {
        clearTimeout(suggestionTimeout);
        suggestionTimeout = setTimeout(async () => {
            const text = contractTextArea.value.trim();
            const lastWords = text.split(/\s+/).slice(-5).join(' ').toLowerCase();

            const triggers = ['indemnity', 'termination', 'liability', 'confidential'];
            const foundKey = triggers.find(key => lastWords.includes(key));

            if (foundKey) {
                try {
                    const response = await fetch('http://127.0.0.1:3001/api/suggest', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ clauseType: foundKey === 'confidential' ? 'confidentiality' : foundKey })
                    });
                    const resData = await response.json();
                    if (resData.success) {
                        activeSuggestion = resData.suggestions;
                        updateSuggestionUI();
                    }
                } catch (e) { console.error('Suggestion API failed', e); }
            } else {
                hideSuggestion();
            }
        }, 1000);
    }

    function updateSuggestionUI() {
        if (!activeSuggestion) return;
        const level = document.querySelector('input[name="riskLevel"]:checked').value;
        suggestionText.textContent = activeSuggestion[level];
        autocompleteBox.classList.remove('hidden');
    }

    // Toggle risk level updates UI instantly
    document.getElementsByName('riskLevel').forEach(radio => {
        radio.onchange = updateSuggestionUI;
    });

    function hideSuggestion() {
        autocompleteBox.classList.add('hidden');
    }

    replaceBtn.onclick = () => {
        const level = document.querySelector('input[name="riskLevel"]:checked').value;
        if (activeSuggestion && activeSuggestion[level]) {
            contractTextArea.value += "\n\n" + activeSuggestion[level];
            updateCharCount();
            hideSuggestion();
        }
    };

    closeSuggest.onclick = hideSuggestion;

    userRoleSelect.addEventListener('change', () => chrome.storage.sync.set({ userRole: userRoleSelect.value }));
    industrySelect.addEventListener('change', () => chrome.storage.sync.set({ industry: industrySelect.value }));
    eli15Toggle.addEventListener('change', () => chrome.storage.sync.set({ eli15Enabled: eli15Toggle.checked }));

    // File Upload Handling
    uploadBtn.onclick = () => fileInput.click();

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showFileStatus(`Reading ${file.name}...`, false);

        try {
            // Clear previous state
            contractTextArea.value = '';
            updateCharCount();

            let text = '';
            if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                text = await readFileAsText(file);
            } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                text = await extractTextFromPDF(file);
            } else {
                throw new Error('Unsupported file type. Please use .txt or .pdf');
            }

            if (!text || text.trim().length < 10) {
                // If text extraction fails, offer to use backend OCR
                const useOCR = confirm('This document appears to be a scanned image (no selectable text found). Would you like to use AI OCR to extract text? This will take a few extra seconds.');

                if (useOCR) {
                    performOCRUpload(file);
                    return; // Stop local processing
                } else {
                    throw new Error('Could not extract text. Please use a text-based document or enable OCR.');
                }
            }

            contractTextArea.value = text;
            updateCharCount();
            showFileStatus(`✅ ${file.name} loaded`, false);

            // Auto-trigger analysis
            analyzeBtn.click();
        } catch (err) {
            showFileStatus(`❌ ${err.message}`, true);
            console.error('File error:', err);
        }

        // Reset input for same file selection
        fileInput.value = '';
    };

    async function performOCRUpload(file) {
        showFileStatus(`📤 Uploading for AI OCR...`, false);
        setLoading(true);

        try {
            const data = await analyzeFile(file, userRoleSelect.value, industrySelect.value);

            // Populate text area with extracted snippet if available
            if (data.extractedText) {
                contractTextArea.value = data.extractedText + (data.extractedText.length === 1000 ? '...' : '');
                updateCharCount();
            }

            showFileStatus(`✅ OCR Analysis complete`, false);
            displayResults(data);
        } catch (err) {
            showFileStatus(`❌ OCR Error: ${err.message}`, true);
        } finally {
            setLoading(false);
        }
    }

    function showFileStatus(msg, isError) {
        fileStatus.textContent = msg;
        fileStatus.classList.remove('hidden');
        fileStatus.classList.toggle('error', isError);
        setTimeout(() => {
            if (!isError) fileStatus.classList.add('hidden');
        }, 3000);
    }

    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read text file'));
            reader.readAsText(file);
        });
    }

    async function extractTextFromPDF(file) {
        // We'll use pdf.js from CDN (added in HTML)
        const arrayBuffer = await file.arrayBuffer();
        try {
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const strings = content.items.map(item => item.str);
                fullText += strings.join(' ') + '\n';
            }
            return fullText;
        } catch (e) {
            console.error(e);
            throw new Error('Failed to parse PDF. Is it a scanned image?');
        }
    }

    function updateCharCount() {
        const count = contractTextArea.value.length;
        charCount.textContent = `${count} characters`;
        charCount.style.color = count < 50 ? '#e53e3e' : '#38a169';
    }

    // Analyze Action
    analyzeBtn.addEventListener('click', async () => {
        const contractText = contractTextArea.value.trim();
        if (contractText.length < 50) {
            showError('Please enter at least 50 characters');
            return;
        }

        setLoading(true);
        try {
            const data = await analyzeContract(contractText, userRoleSelect.value, industrySelect.value);
            currentAnalysis = data;
            displayResults(data);

            // Notify background to update badge and save history
            chrome.runtime.sendMessage({
                type: 'ANALYSIS_COMPLETE',
                data: {
                    riskScore: data.riskScore,
                    riskCount: data.riskyClauses.length,
                    verdict: data.verdict,
                    summary: data.summary,
                    smartFeatures: data.smartFeatures,
                    riskyClauses: data.riskyClauses,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (err) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    });

    function setLoading(loading) {
        analyzeBtn.disabled = loading;
        btnText.classList.toggle('hidden', loading);
        loadingSpinner.classList.toggle('hidden', !loading);
        if (loading) {
            hideError();
            resultsDiv.classList.add('hidden');
        }
    }

    function displayResults(data) {
        resultsDiv.classList.remove('hidden');
        resultActions.classList.remove('hidden');

        // Ultimate Features
        document.getElementById('summaryText').textContent = data.summary || "Summary not available.";
        generateActionPlan(data);

        document.getElementById('riskScore').textContent = data.riskScore.toFixed(1);
        const verdictEl = document.getElementById('verdict');
        verdictEl.textContent = data.verdict;
        verdictEl.className = `verdict ${getRiskClass(data.riskScore)}`;

        if (data.smartFeatures) {
            document.getElementById('smartFeatures').classList.remove('hidden');
            document.getElementById('worstCase').textContent = data.smartFeatures.worstCase;
            document.getElementById('beneficiary').textContent = data.smartFeatures.beneficiary;
            document.getElementById('topRisks').textContent = data.smartFeatures.topRisks.join(', ');
        }

        displayRiskBreakdown(data.categoryRisks);
        displayRiskyClauses(data.riskyClauses);
        displayDetections(data.detections);

        // Show audio dashboard
        audioDashboard.classList.remove('hidden');
    }

    function displayDetections(detections) {
        const ocrDiv = document.getElementById('ocrDetections');
        if (!detections) {
            ocrDiv.classList.add('hidden');
            return;
        }

        ocrDiv.classList.remove('hidden');

        const sigValue = document.getElementById('sigValue');
        sigValue.textContent = detections.signaturesFound ? '✅ Found (Signatures/Seals Detected)' : '❓ None detected';
        sigValue.className = detections.signaturesFound ? 'status-ok' : 'status-warn';

        const hwValue = document.getElementById('hwValue');
        hwValue.textContent = detections.handwritingDetected ? '✍️ Detected (Signed/Annotated)' : '🖨️ None found (Printed text only)';
        hwValue.className = detections.handwritingDetected ? 'status-ok' : '';

        const dateValues = document.getElementById('dateValues');
        if (detections.dates && detections.dates.length > 0) {
            dateValues.innerHTML = detections.dates.map(d => `<span class="date-tag">📅 ${d}</span>`).join(' ');
        } else {
            dateValues.textContent = 'No dates identified';
        }
    }

    // TTS Logic
    function speak(text, elementToHighlight = null) {
        if (synth.speaking) {
            synth.cancel();
        }

        const utter = new SpeechSynthesisUtterance(text);
        const selectedVoiceName = voiceSelect.selectedOptions[0]?.getAttribute('data-name');
        utter.voice = voices.find(v => v.name === selectedVoiceName);
        utter.rate = parseFloat(speedSelect.value);

        utter.onstart = () => {
            if (elementToHighlight) {
                elementToHighlight.classList.add('speaking');
                elementToHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            audioDashboard.classList.add('playing');
            stopBtn.classList.remove('hidden');
            isSpeaking = true;
        };

        utter.onend = () => {
            if (elementToHighlight) elementToHighlight.classList.remove('speaking');
            audioDashboard.classList.remove('playing');
            stopBtn.classList.add('hidden');
            isSpeaking = false;
        };

        synth.speak(utter);
    }

    stopBtn.onclick = () => {
        synth.cancel();
        audioDashboard.classList.remove('playing');
        stopBtn.classList.add('hidden');
        document.querySelectorAll('.clause-item').forEach(el => el.classList.remove('speaking'));
    };

    readAllBtn.onclick = () => {
        if (!currentAnalysis) return;
        const fullText = `Total risk score is ${currentAnalysis.riskScore.toFixed(1)}. Verdict is ${currentAnalysis.verdict}. ` +
            currentAnalysis.riskyClauses.map(c => `Risk in ${c.category}: ${c.reason}`).join('. ');
        speak(fullText);
    };

    function generateActionPlan(data) {
        const actionItems = document.getElementById('actionItems');
        actionItems.innerHTML = '';
        const steps = [];

        if (data.riskScore >= 7) {
            steps.push("🚨 **Immediate Attention Required**: Major revisions needed.");
            steps.push("⚖️ **Consult Counsel**: Significant legal risks detected.");
        } else if (data.riskScore >= 4) {
            steps.push("⚠️ **Negotiate Key Terms**: Address highlighted risks.");
        } else {
            steps.push("✅ **Good to Go**: Standard and balanced.");
        }

        steps.forEach(step => {
            const p = document.createElement('p');
            p.style.fontSize = '11px';
            p.style.marginBottom = '4px';
            p.innerHTML = step;
            actionItems.appendChild(p);
        });
    }

    function displayRiskBreakdown(categoryRisks) {
        const breakdownDiv = document.getElementById('riskBreakdown');
        const barsContainer = document.getElementById('categoryBars');
        breakdownDiv.classList.remove('hidden');
        barsContainer.innerHTML = '';
        if (!categoryRisks) return;

        Object.entries(categoryRisks)
            .sort((a, b) => b[1].score - a[1].score)
            .filter(([cat, data]) => data.score > 0.5)
            .forEach(([cat, data]) => {
                const bar = document.createElement('div');
                bar.className = 'category-bar';
                const pct = (data.score / 10) * 100;
                bar.innerHTML = `
                    <div class="bar-label" title="${cat}">${cat}</div>
                    <div class="bar-container"><div class="bar-fill" style="width: ${pct}%"></div></div>
                    <div class="bar-count">${data.score.toFixed(1)}</div>
                `;
                barsContainer.appendChild(bar);
            });
    }

    function getRiskLabel(score) {
        if (score >= 8) return 'Critical';
        if (score >= 6) return 'Significant';
        if (score >= 4) return 'Moderate';
        return 'Minor';
    }

    function getCategoryIcon(cat) {
        const icons = {
            'liability': '⚖️',
            'termination': '🚪',
            'payment': '💰',
            'jurisdiction': '🌍',
            'confidentiality': '🤫',
            'intellectual property': '💡',
            'warranties': '🛡️',
            'indemnification': '🛡️',
            'auto-renewal': '🔄',
            'hidden fees': '⚠️',
            'data privacy': '🔒'
        };
        return icons[cat.toLowerCase()] || '🚩';
    }

    function displayRiskyClauses(clauses) {
        const container = document.getElementById('riskyClauses');
        document.getElementById('riskyClausesSection').classList.remove('hidden');
        document.getElementById('clauseCount').textContent = clauses.length;
        container.innerHTML = '';

        // Sort by score descending and DEDUPLICATE
        const uniqueClauses = [];
        const seenKeys = new Set();

        [...clauses].sort((a, b) => b.score - a.score).forEach(clause => {
            const key = `${clause.category}-${clause.reason}-${clause.matches.substring(0, 50)}`.toLowerCase();
            if (!seenKeys.has(key)) {
                seenKeys.add(key);
                uniqueClauses.push(clause);
            }
        });

        uniqueClauses.forEach((clause, index) => {
            const div = document.createElement('div');
            const riskClass = getRiskClass(clause.score);
            div.className = `clause-item ${riskClass}`;
            div.style.animationDelay = `${index * 0.05}s`;

            div.innerHTML = `
                <div class="clause-card-header">
                    <span class="risk-badge ${riskClass}">${getRiskLabel(clause.score)}</span>
                    <span class="clause-category">${getCategoryIcon(clause.category)} ${clause.category}</span>
                    <span class="score-tag">${clause.score}/10</span>
                </div>
                <div class="clause-card-body">
                    <p class="reason-text">${clause.reason}</p>
                    <div class="source-extract" title="Click to copy source text">
                        <span class="extract-label">Contract Extract:</span>
                        "${clause.matches}"
                    </div>
                    ${eli15Toggle.checked && clause.eli15 ? `
                        <div class="clause-eli15">
                            <strong>Simple Explanation:</strong><br>
                            ${clause.eli15}
                        </div>
                    ` : ''}
                </div>
                <div class="card-footer">
                    <span class="mini-action-btn read-btn" title="Read Aloud">🔊</span>
                    <span class="mini-action-btn copy-btn" title="Copy Text">📋</span>
                </div>
            `;

            // Read button logic
            div.querySelector('.read-btn').onclick = (e) => {
                e.stopPropagation();
                const text = `Risk level ${getRiskLabel(clause.score)}. Category: ${clause.category}. ${clause.reason}. ${eli15Toggle.checked ? 'Simple explanation: ' + clause.eli15 : ''}`;
                speak(text, div);
            };

            // Copy logic
            const copyBtn = div.querySelector('.copy-btn');
            const sourceExtract = div.querySelector('.source-extract');

            const handleCopy = (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(clause.matches);
                const originalText = copyBtn.textContent;
                copyBtn.textContent = '✅';
                setTimeout(() => copyBtn.textContent = originalText, 1500);
            };

            copyBtn.onclick = handleCopy;
            sourceExtract.onclick = handleCopy;

            container.appendChild(div);
        });
    }

    // History Functionality
    async function loadHistory() {
        const { history = [] } = await chrome.storage.local.get(['history']);
        historyList.innerHTML = '';

        if (history.length === 0) {
            historyList.innerHTML = '<div class="empty-state">No history yet.</div>';
            clearHistoryBtn.classList.add('hidden');
            return;
        }

        clearHistoryBtn.classList.remove('hidden');
        history.forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item';
            const date = new Date(item.timestamp).toLocaleDateString();
            el.innerHTML = `
        <div class="history-info">
            <div class="history-title">${item.summary.substring(0, 30)}...</div>
            <div class="history-date">${date} • ${item.verdict}</div>
        </div>
        <div class="history-score">${item.riskScore}</div>
      `;
            el.onclick = () => {
                currentAnalysis = item;
                tabs[0].click(); // Go to analyze
                displayResults(item);
            };
            historyList.appendChild(el);
        });
    }

    clearHistoryBtn.onclick = async () => {
        if (confirm('Clear all analysis history?')) {
            await chrome.storage.local.set({ history: [] });
            loadHistory();
        }
    };

    // Export
    exportTxtBtn.onclick = () => {
        if (!currentAnalysis) return;
        const content = `Contract Risk Report\nVerdict: ${currentAnalysis.verdict}\nScore: ${currentAnalysis.riskScore}\nSummary: ${currentAnalysis.summary}\n\nRisks:\n` +
            currentAnalysis.riskyClauses.map(c => `- [${c.category}] ${c.reason}\n  Text: ${c.matches}`).join('\n\n');
        downloadFile(content, 'report.txt', 'text/plain');
    };

    exportJsonBtn.onclick = () => {
        if (!currentAnalysis) return;
        downloadFile(JSON.stringify(currentAnalysis, null, 2), 'analysis.json', 'application/json');
    };

    function downloadFile(content, fileName, contentType) {
        const a = document.createElement('a');
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    }

    // Utils
    function getRiskClass(score) {
        if (score >= 7) return 'high';
        if (score >= 4) return 'medium';
        return 'low';
    }

    function showError(msg) {
        errorDiv.textContent = msg;
        errorDiv.classList.remove('hidden');
    }

    function hideError() {
        errorDiv.classList.add('hidden');
    }

    // v7.0 Chat Elements
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatMessages = document.getElementById('chatMessages');

    async function sendChatMessage() {
        const msg = chatInput.value.trim();
        const contractText = contractTextArea.value.trim();

        if (!msg) return;
        if (!contractText) {
            addChatMessage('ai', 'Please analyze a contract or paste text first so I have context to answer your questions!');
            chatInput.value = '';
            return;
        }

        addChatMessage('user', msg);
        chatInput.value = '';

        const typingId = addChatMessage('ai', 'Thinking...', true);

        try {
            const response = await fetch('http://127.0.0.1:3001/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: msg,
                    contractText: contractText,
                    role: userRoleSelect.value
                })
            });

            document.getElementById(typingId).remove();

            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try { errorData = JSON.parse(errorText); } catch (e) { }

                const errorToShow = errorData?.message || errorData?.error || 'Server Error (' + response.status + ')';
                addChatMessage('ai', '❌ ' + errorToShow);
                return;
            }

            const data = await response.json();

            if (data.success) {
                addChatMessage('ai', data.response);
            } else {
                addChatMessage('ai', 'Sorry, I encountered an error: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            if (document.getElementById(typingId)) document.getElementById(typingId).remove();
            addChatMessage('ai', '🔴 Connection Error: Could not reach the AI server. Is the backend running?');
            console.error('Chat error:', err);
        }
    }

    function addChatMessage(sender, text, isTyping = false) {
        const msgDiv = document.createElement('div');
        const id = 'msg-' + Date.now();
        msgDiv.id = id;
        msgDiv.className = `message ${sender}-message ${isTyping ? 'typing-indicator' : ''}`;
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return id;
    }

    sendChatBtn.onclick = sendChatMessage;
    chatInput.onkeypress = (e) => { if (e.key === 'Enter') sendChatMessage(); };

    // Listen for auto-detection message from content script
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'SCAN_PAGE_CONTRACT') {
            contractTextArea.value = message.contractText;
            updateCharCount();
            tabs[0].click();
            analyzeBtn.click();
        }
    });
});
