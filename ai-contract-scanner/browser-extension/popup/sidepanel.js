// Side Panel JavaScript - v3.0 Ultimate Edition
document.addEventListener('DOMContentLoaded', async () => {
    // Elements
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const contractTextArea = document.getElementById('contractText');
    const userRoleSelect = document.getElementById('userRole');
    const industrySelect = document.getElementById('industry');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const charCount = document.getElementById('charCount');
    const resultsDiv = document.getElementById('results');
    const errorDiv = document.getElementById('errorMsg');
    const btnText = document.getElementById('btnText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const clearHistoryBtn = document.getElementById('clearHistory');
    const openSettingsBtn = document.getElementById('openSettings');

    // v4.0 Elements
    const audioDashboard = document.getElementById('audioDashboard');
    const readAllBtn = document.getElementById('readAllBtn');
    const stopBtn = document.getElementById('stopBtn');
    const voiceSelect = document.getElementById('voiceSelect');
    const speedSelect = document.getElementById('speedSelect');
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
        voices.forEach((voice) => {
            const option = document.createElement('option');
            option.textContent = voice.name + ' (' + voice.lang + ')';
            option.setAttribute('data-name', voice.name);
            voiceSelect.appendChild(option);
        });
    }

    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }

    // UI Elements for Features
    const summaryText = document.getElementById('summaryText');
    const actionItems = document.getElementById('actionItems');

    // Theme Support
    chrome.storage.sync.get(['darkMode'], (saved) => {
        if (saved.darkMode) document.body.classList.add('dark');
    });

    // Load Initial Settings
    chrome.storage.sync.get(['userRole', 'industry', 'contractText'], (saved) => {
        if (saved.userRole) userRoleSelect.value = saved.userRole;
        if (saved.industry) industrySelect.value = saved.industry;
        if (saved.contractText) contractTextArea.value = saved.contractText;
        updateCharCount();
    });

    // Handle context menu text
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'SCAN_SELECTION' || message.type === 'SCAN_PAGE_CONTRACT') {
            contractTextArea.value = message.contractText;
            updateCharCount();
            analyzeBtn.click();
        }
    });

    // Tab Switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');
            if (!target) return;
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${target}Tab`).classList.add('active');
            if (target === 'history') loadHistory();
        });
    });

    // Open Settings
    openSettingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());

    function updateCharCount() {
        const count = contractTextArea.value.length;
        charCount.textContent = `${count} characters`;
        charCount.style.color = count < 50 ? '#e53e3e' : '#38a169';
    }

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
                autocompleteBox.classList.add('hidden');
            }
        }, 1000);
    }

    function updateSuggestionUI() {
        if (!activeSuggestion) return;
        const level = document.querySelector('input[name="riskLevel"]:checked').value;
        suggestionText.textContent = activeSuggestion[level];
        autocompleteBox.classList.remove('hidden');
    }

    // Toggle risk level updates UI
    document.getElementsByName('riskLevel').forEach(radio => {
        radio.onchange = updateSuggestionUI;
    });

    replaceBtn.onclick = () => {
        const level = document.querySelector('input[name="riskLevel"]:checked').value;
        if (activeSuggestion && activeSuggestion[level]) {
            contractTextArea.value += "\n\n" + activeSuggestion[level];
            updateCharCount();
            autocompleteBox.classList.add('hidden');
        }
    };

    closeSuggest.onclick = () => autocompleteBox.classList.add('hidden');

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
                const useOCR = confirm('This document appears to be a scanned image. Use AI OCR to analyze? (Takes ~10s)');
                if (useOCR) {
                    performOCRUpload(file);
                    return;
                } else {
                    throw new Error('Could not extract text. Use a text-based file or OCR.');
                }
            }

            contractTextArea.value = text;
            updateCharCount();
            showFileStatus(`✅ ${file.name} loaded`, false);

            // Auto-trigger analysis
            analyzeBtn.click();
        } catch (err) {
            showFileStatus(`❌ ${err.message}`, true);
        }

        fileInput.value = '';
    };

    async function performOCRUpload(file) {
        showFileStatus(`📤 Running OCR Analysis...`, false);
        setLoading(true);

        try {
            const data = await analyzeFile(file, userRoleSelect.value, industrySelect.value);
            if (data.extractedText) {
                contractTextArea.value = data.extractedText + '...';
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
        // Needs pdf.js in HTML
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
            throw new Error('Failed to parse PDF');
        }
    }

    // Analyze Action
    analyzeBtn.addEventListener('click', async () => {
        const contractText = contractTextArea.value.trim();
        if (contractText.length < 50) {
            showError('Please select or paste at least 50 characters');
            return;
        }

        setLoading(true);
        try {
            const data = await analyzeContract(contractText, userRoleSelect.value, industrySelect.value);
            displayResults(data);

            // Save to history via background
            chrome.runtime.sendMessage({
                type: 'ANALYSIS_COMPLETE',
                data: {
                    ...data,
                    riskCount: data.riskyClauses.length,
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

        // Detailed summary
        summaryText.textContent = data.summary || "This contract has been analyzed for potential risks based on your role.";

        // Action Plan
        generateActionPlan(data);

        // Core stats
        document.getElementById('riskScore').textContent = data.riskScore.toFixed(1);
        const verdictEl = document.getElementById('verdict');
        verdictEl.textContent = data.verdict;
        verdictEl.className = `verdict ${getRiskClass(data.riskScore)}`;

        // Smart Features
        if (data.smartFeatures) {
            document.getElementById('worstCase').textContent = data.smartFeatures.worstCase;
            document.getElementById('beneficiary').textContent = data.smartFeatures.beneficiary;
            document.getElementById('topRisks').textContent = data.smartFeatures.topRisks.join(', ');
        }

        displayRiskBreakdown(data.categoryRisks);
        displayRiskyClauses(data.riskyClauses);
        displayDetections(data.detections);

        // Show audio dashboard
        audioDashboard.classList.remove('hidden');
        currentAnalysis = data;
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
        if (synth.speaking) synth.cancel();
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
        const fullText = `Risk level is ${currentAnalysis.riskScore.toFixed(1)}. Verdict: ${currentAnalysis.verdict}. ` +
            currentAnalysis.riskyClauses.map(c => `Risk in ${c.category}: ${c.reason}`).join('. ');
        speak(fullText);
    };

    function generateActionPlan(data) {
        actionItems.innerHTML = '';
        const steps = [];

        if (data.riskScore >= 7) {
            steps.push("🚨 **Immediate Attention Required**: Do not sign this contract without major revisions.");
            steps.push("⚖️ **Consult Counsel**: These risks are legally significant and require professional review.");
        } else if (data.riskScore >= 4) {
            steps.push("⚠️ **Negotiate Key Terms**: Address the highlighted medium-risk clauses before proceeding.");
            steps.push("🔍 **Deep Dive**: Pay close attention to the '" + (data.smartFeatures?.topRisks[0] || "Termination") + "' category.");
        } else {
            steps.push("✅ **Good to Go**: This contract appears balanced and standard.");
        }

        // Add category specific advice
        const highRiskCats = [...new Set(data.riskyClauses.filter(c => c.score >= 7).map(c => c.category))];
        highRiskCats.forEach(cat => {
            steps.push(`🛠️ **Fix ${cat}**: Propose standard language to mitigate these specific risks.`);
        });

        steps.forEach(step => {
            const p = document.createElement('p');
            p.style.marginBottom = '8px';
            p.innerHTML = step;
            actionItems.appendChild(p);
        });
    }

    function displayRiskBreakdown(categoryRisks) {
        const barsContainer = document.getElementById('categoryBars');
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

    function displayRiskyClauses(clauses) {
        const container = document.getElementById('riskyClauses');
        document.getElementById('clauseCount').textContent = clauses.length;
        container.innerHTML = '';

        clauses.forEach((clause, index) => {
            const div = document.createElement('div');
            div.className = `clause-item ${getRiskClass(clause.score)}`;
            div.style.cursor = 'pointer';
            div.innerHTML = `
                <div class="clause-header">
                    <strong>${clause.category}</strong>
                    <span>${clause.score}/10</span>
                    <button class="read-mini-btn" title="Read explanation">🔊</button>
                </div>
                <p class="clause-text">"${clause.matches}"</p>
                <div class="clause-reason">Reason: ${clause.reason}</div>
            `;

            // Read button logic
            div.querySelector('.read-mini-btn').onclick = (e) => {
                e.stopPropagation();
                const text = `Clause in ${clause.category}. Risk level ${clause.score}. ${clause.reason}.`;
                speak(text, div);
            };

            div.onclick = () => {
                navigator.clipboard.writeText(clause.matches);
                const originalBg = div.style.background;
                div.style.background = '#e6fffa';
                setTimeout(() => div.style.background = originalBg, 500);
            };
            container.appendChild(div);
        });
    }

    async function loadHistory() {
        const { history = [] } = await chrome.storage.local.get(['history']);
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = '<div class="empty-state">No analysis history.</div>';
            return;
        }
        history.forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <div class="history-info">
                    <div class="history-title">${item.summary ? item.summary.substring(0, 40) + '...' : 'Quick Scan'}</div>
                    <div class="history-date">${new Date(item.timestamp).toLocaleString()}</div>
                </div>
                <div class="history-score">${item.riskScore.toFixed(1)}</div>
            `;
            el.onclick = () => {
                displayResults(item);
                tabs[0].click();
            };
            historyList.appendChild(el);
        });
    }

    function getRiskClass(score) {
        if (score >= 7) return 'high';
        if (score >= 4) return 'medium';
        return 'low';
    }

    // v7.0 Chat Assistant Logic
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
            addChatMessage('ai', '🔴 Connection Error: Could not reach the AI server.');
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

    if (sendChatBtn) sendChatBtn.onclick = sendChatMessage;
    if (chatInput) chatInput.onkeypress = (e) => { if (e.key === 'Enter') sendChatMessage(); };

    // Final end of file
});
