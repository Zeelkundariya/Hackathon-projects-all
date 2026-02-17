// backend/server.js - COMPLETE FIXED VERSION
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { performOCR } = require('./utils/ocr');
require('dotenv').config();

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

console.log('🚀 Starting server initialization...');
const app = express();
const PORT = process.env.PORT || 3001;
console.log('📦 Dependencies loaded...');

// Initialize OpenAI if key exists
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Middleware (Bulletproof CORS & Request Logger)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log(`[REQUEST] ${req.method} ${req.url} - Origin: ${origin || 'No Origin'}`);

  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Private-Network');
  res.header('Access-Control-Allow-Private-Network', 'true');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json({ limit: '10mb' }));

console.log('🛠️ Middleware configured (Logging + Nuclear CORS)...');

console.log('🛠️ Middleware configured (with Private Network Support)...');
// In-memory storage
const contractHistory = [];
console.log('📁 Storage initialized...');

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    backend: 'running',
    ai: openai ? 'enabled' : 'mock mode',
    timestamp: new Date().toISOString()
  });
});

// Main analysis endpoint
app.post('/api/analyze', async (req, res) => {
  const startTime = Date.now();
  try {
    const { contractText, industry = 'general', userRole = 'individual', userId } = req.body;
    console.log(`[ANALYSIS] Request received. Role: ${userRole}, Industry: ${industry}`);

    if (!contractText || contractText.length < 50) {
      return res.status(400).json({
        error: 'Contract text too short (minimum 50 characters)',
        length: contractText?.length || 0
      });
    }

    let analysisResult = performSmartMockAnalysis(contractText, industry, userRole);
    const { risks, summary } = analysisResult;
    const analysisId = uuidv4();

    const maxScore = risks.length > 0 ? Math.max(...risks.map(r => r.score)) : 0;
    const avgScore = risks.length > 0 ? risks.reduce((acc, r) => acc + r.score, 0) / risks.length : 0;
    let riskScore = (maxScore * 0.9) + (avgScore * 0.1);
    riskScore = Math.min(10, Math.max(1, Math.round(riskScore * 10) / 10));

    const responseData = {
      analysisId,
      riskScore: riskScore,
      verdict: getVerdict(riskScore),
      summary: summary.summary,
      smartFeatures: summary,
      riskyClauses: risks,
      categoryRisks: analysisResult.analysis.categoryRisks,
      detections: {
        signaturesFound: contractText.toLowerCase().includes('signature') || contractText.toLowerCase().includes('signed by'),
        handwritingDetected: false,
        dates: contractText.match(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/g) || []
      },
      timestamp: new Date().toISOString()
    };

    console.log(`[ANALYSIS] Completed in ${Date.now() - startTime}ms. Score: ${riskScore}`);
    res.json({ success: true, data: responseData });

  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({ success: false, error: 'Analysis failed', message: error.message });
  }
});

// File analysis endpoint (OCR)
app.post('/api/analyze/file', upload.single('contractFile'), async (req, res) => {
  try {
    const { industry = 'general', userRole = 'individual', userId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`📎 Received manual file upload: ${file.originalname} (${file.mimetype})`);

    // Perform OCR
    const ocrResult = await performOCR(file.buffer, file.mimetype);
    const extractedText = ocrResult.text;
    const detections = ocrResult.detections;

    if (!extractedText || extractedText.trim().length < 20) {
      return res.status(422).json({
        success: false,
        error: 'Extracted text too short. Is the file blank or extremely poor quality?'
      });
    }

    // Reuse existing analysis logic (performSmartMockAnalysis)
    console.log(`🔍 Analyzing OCR-extracted text (${extractedText.length} chars)...`);

    let analysisResult = performSmartMockAnalysis(extractedText, industry, userRole);
    const { risks, summary } = analysisResult;
    const analysisId = uuidv4();

    const totalScore = risks.reduce((acc, r) => acc + r.score, 0);
    const avgScore = risks.length > 0 ? totalScore / risks.length : 0;
    const riskScore = Math.min(10, Math.max(1, avgScore));

    const responseData = {
      analysisId,
      extractedText: extractedText.substring(0, 1000), // Return snippet
      riskScore: Math.round(riskScore * 10) / 10,
      verdict: getVerdict(riskScore),
      summary: summary.summary,
      smartFeatures: summary,
      riskyClauses: risks,
      detections: detections, // Include signature/handwriting detections
      timestamp: new Date().toISOString()
    };

    if (userId) {
      contractHistory.unshift({
        analysisId,
        userId,
        contractText: extractedText.substring(0, 200) + '...',
        riskScore: responseData.riskScore,
        verdict: responseData.verdict,
        timestamp: responseData.timestamp
      });
      if (contractHistory.length > 50) contractHistory.pop();
    }

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ File Analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'OCR/Analysis failed',
      message: error.message
    });
  }
});

// Real-time Chat Assistant
app.post('/api/chat', async (req, res) => {
  try {
    const { message, contractText, role = 'individual' } = req.body;

    if (!message || !contractText) {
      return res.status(400).json({ error: 'Message and contract text are required' });
    }

    console.log(`💬 AI Chat requested (Message length: ${message.length})`);

    if (!openai) {
      console.warn('⚠️ OpenAI not initialized. Using fallback mock chat.');
      return res.json({
        success: true,
        response: "I'm currently running in 'Offline Mode' (no OpenAI key). To enable full chat, please ensure your API key is in the .env file and restart me. However, I can tell you that sudden eviction is a serious risk and you should check the Notice Period clause!"
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert Legal Contract Assistant. 
          Your goal is to help users understand their contract risks and answer specific questions.
          Be professional, concise, and clear. 
          If you don't know something based on the text provided, say so.
          Do not provide formal legal advice, but offer practical insights.
          The user's role is: ${role}.`
        },
        {
          role: "user",
          content: `Here is the contract text:
          ---
          ${contractText.substring(0, 5000)}
          ---
          User's Question: ${message}`
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    res.json({
      success: true,
      response: completion.choices[0].message.content
    });

  } catch (error) {
    console.error('❌ Chat API error:', error);

    // Explicit handle for quota/api errors
    if (error.status === 429 || error.code === 'insufficient_quota') {
      return res.status(429).json({
        success: false,
        error: 'OpenAI Quota Exceeded',
        message: 'The AI assistant has reached its usage limit (insufficient quota). Please check your OpenAI billing or usage limits.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Chat assistant error',
      message: error.message
    });
  }
});

// Real-time detection
app.post('/api/detect/realtime', async (req, res) => {
  try {
    const { text, cursorPosition } = req.body;

    if (!text || text.length < 20) {
      return res.json({
        immediateRisks: [],
        overallRisk: 'low',
        suggestions: ['Add more text for analysis']
      });
    }

    // Analyze text around cursor
    const risks = analyzeTextForRisks(text);

    res.json({
      immediateRisks: risks.slice(0, 3),
      overallRisk: getOverallRiskLevel(risks),
      suggestions: getSuggestions(risks)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clause Suggestion API (v4.0)
app.post('/api/suggest', async (req, res) => {
  const { clauseType, currentText } = req.body;

  const suggestionMap = {
    indemnity: {
      conservative: "The Consultant shall indemnify the Client only for losses arising directly from Consultant's gross negligence or willful misconduct.",
      balanced: "Each party shall indemnify the other for third-party claims arising from their respective negligent acts or omissions under this Agreement.",
      aggressive: "The Company shall indemnify the Vendor for any and all claims, damages, and expenses arising from the use of the Deliverables.",
      reason: "Indemnity should be mutual and capped to avoid unlimited financial exposure."
    },
    termination: {
      conservative: "Either party may terminate this Agreement for cause upon 30 days written notice and a right to cure.",
      balanced: "Either party may terminate this Agreement for convenience upon 60 days prior written notice.",
      aggressive: "The Client may terminate this Agreement immediately at any time without cause or notice.",
      reason: "Longer notice periods provide business continuity and stability."
    },
    liability: {
      conservative: "The total liability of either party shall be limited to the total amount paid under this Agreement in the 6 months prior to the claim.",
      balanced: "Neither party shall be liable for indirect, incidental, or consequential damages.",
      aggressive: "The Vendor's liability is strictly limited to \$500, regardless of the nature of the claim.",
      reason: "Liability caps prevent single contract failures from bankrupting a project."
    },
    confidentiality: {
      conservative: "Confidential information shall be protected for a period of 2 years following the termination of this Agreement.",
      balanced: "Standard confidentiality terms apply to all non-public business information exchanged between the parties.",
      aggressive: "Anything discussed, even verbally, is considered a trade secret and protected forever.",
      reason: "Time-limited confidentiality is easier to manage and enforce."
    }
  };

  const suggestions = suggestionMap[clauseType] || {
    conservative: "This clause should be reviewed by legal counsel.",
    balanced: "Consider a more balanced approach to this provision.",
    aggressive: "Ensure maximum protection for your interests here.",
    reason: "Generic suggestion provided for unknown clause type."
  };

  res.json({
    success: true,
    suggestions
  });
});

// Common history handler
const handleGetHistory = (req, res) => {
  const { userId } = req.params;
  const { limit = 10 } = req.query;

  let history = contractHistory;
  if (userId && userId !== 'undefined') {
    history = history.filter(item => item.userId === userId);
  }

  const simplified = history
    .slice(0, parseInt(limit))
    .map(item => ({
      id: item.analysisId,
      contract: item.contractText,
      riskScore: item.riskScore,
      verdict: item.verdict,
      timestamp: item.timestamp
    }));

  res.json({ history: simplified });
};

// Get history (all or user specific)
// app.get('/api/history', handleGetHistory);
// app.get('/api/history/:userId', handleGetHistory);
app.get('/api/history/:userId', handleGetHistory);

// Industry standards
app.get('/api/standards/:industry', (req, res) => {
  const { industry } = req.params;

  const standards = {
    technology: {
      liability: { maxScore: 6, average: 4, note: 'Limited liability up to contract value' },
      termination: { maxScore: 5, average: 3, note: '30-60 day notice period typical' },
      intellectualProperty: { maxScore: 7, average: 5, note: 'IP often remains with creator' },
      confidentiality: { maxScore: 8, average: 6, note: 'Standard NDA terms' },
      payment: { maxScore: 4, average: 2, note: 'Net 30 payment terms common' }
    },
    healthcare: {
      liability: { maxScore: 9, average: 7, note: 'Higher liability thresholds due to regulations' },
      confidentiality: { maxScore: 10, average: 9, note: 'HIPAA compliance required' },
      termination: { maxScore: 7, average: 5, note: '60-180 day notice for continuity of care' }
    },
    finance: {
      liability: { maxScore: 9, average: 8, note: 'Full recourse liability common' },
      confidentiality: { maxScore: 9, average: 7, note: 'Financial data protection critical' },
      jurisdiction: { maxScore: 7, average: 5, note: 'Specific financial districts preferred' }
    },
    freelancer: {
      payment: { maxScore: 5, average: 2, note: 'Net 15 or milestone payments recommended' },
      termination: { maxScore: 4, average: 2, note: 'Mutual termination with short notice' },
      intellectualProperty: { maxScore: 6, average: 4, note: 'Retain rights to pre-existing work' }
    },
    general: {
      liability: { maxScore: 7, average: 5 },
      termination: { maxScore: 6, average: 4 },
      confidentiality: { maxScore: 7, average: 5 }
    }
  };

  res.json({
    standards: standards[industry] || standards.general,
    industry
  });
});

/**
 * Extracts a smart context window around a match index, ensuring no words are cut off.
 * @param {string} text - Full contract text.
 * @param {number} index - Index of the keyword match.
 * @param {number} length - Length of the keyword match.
 * @returns {string} - Clean extract with whole words.
 */
function extractSmartContext(text, index, length) {
  const margin = 60;
  let start = Math.max(0, index - margin);
  let end = Math.min(text.length, index + length + margin);

  // Expanded word boundaries: spaces, newlines, punctuation, brackets, quotes
  const boundaryRegex = /[\s,.;:()"\[\]\-{}]/;

  // Expand start to nearest boundary
  while (start > 0 && !boundaryRegex.test(text[start - 1])) {
    start--;
  }

  // Expand end to nearest boundary
  while (end < text.length && !boundaryRegex.test(text[end])) {
    end++;
  }

  let context = text.substring(start, end).trim();

  // Add ellipses if we hit a boundary that isn't the start/end of the doc
  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';

  // Clean up repeated spaces/newlines
  return context.replace(/\s+/g, ' ');
}

// Smart mock analysis
function performSmartMockAnalysis(contractText, industry, userRole = 'individual') {
  const detectedRisks = [];
  const lowerText = contractText.toLowerCase();

  console.log(`🤖 Using smart mock analysis for role: ${userRole}`);

  // Role Weights Definition
  const roleWeights = {
    individual: { liability: 1.0, termination: 1.0, intellectualProperty: 1.0, payment: 1.0, confidentiality: 1.0 },
    freelancer: { liability: 1.2, termination: 1.5, intellectualProperty: 1.5, payment: 2.0, confidentiality: 0.8 },
    founder: { liability: 1.5, termination: 1.2, intellectualProperty: 2.0, payment: 1.0, confidentiality: 1.5 },
    student: { liability: 0.8, termination: 0.5, intellectualProperty: 2.0, payment: 0.5, confidentiality: 0.5 },
    consumer: { liability: 0.5, termination: 0.5, intellectualProperty: 0.1, payment: 1.5, confidentiality: 0.2 },
    tenant: { liability: 1.8, termination: 2.0, intellectualProperty: 0.1, payment: 1.5, confidentiality: 0.5 }
  };

  const weights = roleWeights[userRole.toLowerCase()] || roleWeights.individual;

  // Keyword dictionary
  const riskPatterns = {
    liability: {
      keywords: ['indemnify', 'hold harmless', 'unlimited liability', 'liable for all', 'consequential damages', 'structural repairs', 'maintenance responsibility', 'painting charges', 'natural wear and tear', 'damage to the premises'],
      baseScore: 7,
      category: 'liability'
    },
    termination: {
      keywords: ['terminate at any time', 'termination for convenience', 'without cause', 'immediate termination', 'eviction', 'vacate', 'lock-in period', 'forfeiture of notice', 'termination notice', 'hand over possession', 're-entry'],
      baseScore: 6,
      category: 'termination'
    },
    intellectualProperty: {
      keywords: ['work for hire', 'assigns all rights', 'irrevocable license', 'perpetual license', 'moral rights'],
      baseScore: 6,
      category: 'intellectualProperty'
    },
    payment: {
      keywords: ['net 60', 'net 90', 'paid upon receipt', 'withhold payment', 'set-off', 'security deposit', 'non-refundable deposit', 'late fee', 'maintenance charges', 'utility arrears', 'electricity charges', 'society charges', 'annual escalation', 'rent increase'],
      baseScore: 5,
      category: 'payment'
    },
    confidentiality: {
      keywords: ['perpetual confidentiality', 'trade secrets', 'residuals', 'all information', 'disclosure of terms'],
      baseScore: 4,
      category: 'confidentiality'
    },
    lease_specific: {
      keywords: ['sub-let', 'sub-lease', 'alterations', 'additions to the premises', 'commercial use', 'residential use', 'peaceful possession', 'stamp duty', 'registration charges'],
      baseScore: 5,
      category: 'jurisdiction'
    }
  };

  // 1. Scan for risks
  const seenMatches = new Set();
  const categoryHighlights = {}; // category -> [index positions]

  Object.keys(riskPatterns).forEach(key => {
    const pattern = riskPatterns[key];
    const categoryWeight = weights[key] || 1.0;

    pattern.keywords.forEach(keyword => {
      let currentIdx = lowerText.indexOf(keyword.toLowerCase());
      while (currentIdx !== -1) {
        const matchPos = currentIdx;
        currentIdx = lowerText.indexOf(keyword.toLowerCase(), currentIdx + 1);

        // DEDUPLICATION LOGIC
        // Proximity check (Don't alert for the same category within 100 chars)
        if (!categoryHighlights[pattern.category]) categoryHighlights[pattern.category] = [];
        const tooClose = categoryHighlights[pattern.category].some(pos => Math.abs(pos - matchPos) < 100);
        if (tooClose) continue;

        const smartExtract = extractSmartContext(contractText, matchPos, keyword.length);
        const extractClean = smartExtract.toLowerCase();

        if (!seenMatches.has(extractClean)) {
          const finalScore = Math.min(10, Math.round(pattern.baseScore * categoryWeight * 10) / 10);
          seenMatches.add(extractClean);
          categoryHighlights[pattern.category].push(matchPos);

          detectedRisks.push({
            id: uuidv4(),
            clauseText: smartExtract,
            riskLevel: finalScore >= 7 ? 'high' : finalScore >= 4 ? 'medium' : 'low',
            severity: finalScore,
            category: pattern.category,
            explanation: `ELI15: This means ${pattern.category === 'indemnify' ? 'you have to pay for their mistakes' : 'check this carefully'}.`,
            suggestion: `Consider negotiating this ${pattern.category} clause to be more balanced.`,
            matches: smartExtract, // for backward compatibility
            score: finalScore      // for backward compatibility
          });
        }
      }
    });
  });

  // Calculate base risk score from average
  let totalScore = 0;
  detectedRisks.forEach(r => totalScore += r.score);
  // Use direct average instead of inflated formula
  let riskScore = detectedRisks.length > 0 ? (totalScore / detectedRisks.length) : 0;

  // Adjust for industry
  if (industry === 'freelancer') {
    const freelancerRisks = detectedRisks.filter(r => ['payment', 'termination'].includes(r.category));
    if (freelancerRisks.length > 0) riskScore = Math.min(10, riskScore + 1);
  }

  // Generate artifacts
  const smartFeatures = generateSmartFeatures(detectedRisks, userRole, contractText);
  const analysis = generateAnalysis(riskScore, detectedRisks, contractText, industry);

  return {
    risks: detectedRisks,
    summary: {
      ...smartFeatures,
      summary: analysis.summary
    },
    analysis // Include full analysis if needed
  };
}
function generateAnalysis(riskScore, detectedRisks, contractText, industry) {
  const wordCount = contractText.split(/\s+/).length;
  const charCount = contractText.length;

  // Determine verdict
  let verdict, confidence;
  if (riskScore >= 8) {
    verdict = 'HIGH RISK';
    confidence = 90;
  } else if (riskScore >= 5) {
    verdict = 'MEDIUM RISK';
    confidence = 85;
  } else {
    verdict = 'LOW RISK';
    confidence = 80;
  }

  // Generate summary based on risk level
  let summary;
  if (riskScore >= 8) {
    summary = `⚠️ CRITICAL RISK DETECTED: This ${wordCount}-word contract contains ${detectedRisks.length} high-risk clauses requiring immediate attention. Key issues include ${detectedRisks.slice(0, 2).map(r => r.reason).join(' and ')}. Significant revisions recommended before signing.`;
  } else if (riskScore >= 5) {
    summary = `⚠️ MODERATE RISK: This ${wordCount}-word contract has ${detectedRisks.length} areas needing review. While some terms are standard for ${industry} agreements, several clauses could be improved through negotiation.`;
  } else {
    summary = `✅ LOW RISK: This ${wordCount}-word contract appears reasonable for ${industry} engagements. Most terms follow standard practices with balanced protections for both parties.`;
  }

  // Generate risky clauses from detected risks
  const riskyClauses = detectedRisks
    .filter(r => r.score > 0) // Only positive scores (actual risks)
    .map((risk, index) => {
      let riskLevel = 'medium';
      if (risk.score >= 7) riskLevel = 'high'; // Lowered from 8 to catch more high risks
      if (risk.score < 2) riskLevel = 'low';   // Lowered from <=2 to make 2.0 Medium

      return {
        id: `risk-${index + 1}`,
        clauseText: risk.matches.substring(0, 200) + '...',
        fullText: risk.matches, // Restored for clickable highlights
        riskLevel: riskLevel,
        category: risk.category,
        explanation: risk.reason,
        suggestion: getSuggestion(risk.category, risk.score),
        severity: Math.min(10, Math.abs(risk.score))
      };
    });

  // Category scores
  const categories = ['liability', 'termination', 'intellectualProperty', 'payment', 'confidentiality', 'jurisdiction'];
  const categoryRisks = {};

  categories.forEach(cat => {
    const categoryRisksList = detectedRisks.filter(r => r.category === cat);
    let catScore = 0.5; // Default safe baseline

    if (categoryRisksList.length > 0) {
      // Use Max risk in category specifically to avoid hiding high risks
      const catMax = Math.max(...categoryRisksList.map(r => r.score));
      const catAvg = categoryRisksList.reduce((sum, r) => sum + r.score, 0) / categoryRisksList.length;
      catScore = (catMax * 0.8) + (catAvg * 0.2); // Weighted heavily towards worst clause
    }

    categoryRisks[cat] = {
      score: Math.min(10, Math.round(catScore * 10) / 10),
      explanation: getCategoryExplanation(cat, catScore, industry)
    };
  });

  // Heatmap data
  const heatmap = Object.entries(categoryRisks).map(([category, data]) => ({
    category,
    score: data.score,
    intensity: data.score / 10,
    color: getRiskColor(data.score)
  }));

  return {
    summary,
    riskScore,
    verdict,
    confidence,
    redFlags: detectedRisks.filter(r => r.score >= 5).map(r => r.reason),
    greenFlags: detectedRisks.filter(r => r.score < 0).map(r => `Good: ${r.reason}`),
    riskyClauses,
    categoryRisks,
    recommendations: getRecommendations(riskScore, detectedRisks, industry),
    heatmap,
    detectedRisksCount: detectedRisks.length,
    wordCount,
    charCount
  };
}

// Helper functions
function getRiskColor(score) {
  if (score >= 8) return '#ef4444'; // red
  if (score >= 5) return '#f59e0b'; // yellow
  return '#10b981'; // green
}

function generateSmartFeatures(risks, role, fullText = '') {
  // Sort risks to find top issues
  const sortedRisks = [...risks].sort((a, b) => b.score - a.score);
  const topRisks = sortedRisks.slice(0, 3);

  let worstCase = "Unforeseen legal disputes arising from ambiguous contract language.";
  let beneficiary = "Neutral / Balanced";

  const lowerText = fullText.toLowerCase();
  const isRentalContext = /rent|lease|tenant|landlord|premise|accommodation|residential|agreement of lease/.test(lowerText) ||
    /rent|lease|tenant|landlord/.test(risks.map(r => r.matches).join(' ').toLowerCase());

  // Determine Worst Case based on top category
  if (topRisks.length > 0) {
    const topCat = topRisks[0].category;

    if (topCat === 'liability') {
      worstCase = isRentalContext ? "Being forced to pay for major structural building damages you didn't cause." : "Bankruptcy due to unlimited lawsuit capability.";
    } else if (topCat === 'termination') {
      worstCase = isRentalContext ? "Sudden eviction and homelessness without legal notice." : "Project cancellation without pay or notice.";
    } else if (topCat === 'intellectualProperty') {
      worstCase = "Loss of ownership of your creations/data recorded during the term.";
    } else if (topCat === 'payment') {
      worstCase = isRentalContext ? "Total loss of your security deposit and accumulated late penalties." : "Working for free or delayed payment for months.";
    }
  } else if (isRentalContext) {
    worstCase = "Hidden maintenance liabilities or unexpected eviction due to notice period technicalities.";
    beneficiary = "Landlord (Likely favored by default)";
  }

  // Determine Beneficiary (User vs Company)
  const companyFavoredCount = risks.filter(r => r.score > 5).length;
  if (isRentalContext && companyFavoredCount === 0) beneficiary = "Balanced / Landlord Favored";

  if (companyFavoredCount > 5) {
    beneficiary = "Counterparty (Extremely One-Sided)";
  } else if (companyFavoredCount > 2) {
    beneficiary = "Company / Landlord (Heavily weighted)";
  } else if (companyFavoredCount > 0 && !beneficiary.includes('Landlord')) {
    beneficiary = "Counterparty (Slightly favored)";
  }

  return {
    topRisks: topRisks.map(r => r.category),
    worstCase: worstCase,
    beneficiary: beneficiary,
    summary: `This contract contains ${risks.length} potential issues. The biggest risk is ${topRisks[0]?.category || 'none'} (${worstCase}).`
  };
}
function getSuggestion(category, score) {
  const suggestions = {
    termination: score >= 8
      ? 'Request mutual termination with 30-day notice and specific causes'
      : 'Ensure reasonable notice period (15-30 days)',
    liability: score >= 8
      ? 'Add liability cap (e.g., limited to contract value)'
      : 'Review liability limits for fairness',
    intellectualProperty: score >= 7
      ? 'Carve out pre-existing IP and specify deliverables only'
      : 'Clarify IP ownership scope',
    payment: score >= 5
      ? 'Request shorter payment terms (Net 15 or milestone-based)'
      : 'Ensure clear payment schedule',
    jurisdiction: 'Consider local jurisdiction if more convenient'
  };
  return suggestions[category] || 'Review this clause for fairness';
}

function getCategoryExplanation(category, score, industry) {
  const explanations = {
    liability: score >= 8
      ? 'Extremely high liability exposure'
      : score >= 5
        ? 'Moderate liability terms'
        : 'Reasonable liability limits',
    termination: score >= 8
      ? 'Unfair termination rights'
      : score >= 5
        ? 'Standard termination terms'
        : 'Balanced termination provisions',
    intellectualProperty: score >= 7
      ? 'Overly broad IP assignment'
      : 'Standard IP terms for ' + industry,
    payment: score >= 6
      ? 'Extended payment terms unfavorable to cash flow'
      : 'Reasonable payment schedule'
  };
  return explanations[category] || 'Standard terms';
}

function getRecommendations(riskScore, detectedRisks, industry) {
  const recommendations = [];

  if (riskScore >= 8) {
    recommendations.push({
      priority: 'critical',
      action: 'DO NOT SIGN without major revisions',
      reason: 'Multiple high-risk clauses detected'
    });
  }

  // Add specific recommendations
  detectedRisks
    .filter(r => r.score >= 5)
    .forEach(risk => {
      recommendations.push({
        priority: risk.score >= 8 ? 'high' : 'medium',
        action: `Review ${risk.category} clause`,
        reason: risk.reason
      });
    });

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      action: 'Proceed with signing',
      reason: 'Contract appears reasonable'
    });
  }

  return recommendations.slice(0, 3);
}

// Real-time analysis helpers
function analyzeTextForRisks(text) {
  const risks = [];
  const lowerText = text.toLowerCase();

  // Check for common risk phrases
  const riskPhrases = [
    { phrase: 'without cause', risk: 'high', type: 'termination' },
    { phrase: 'unlimited liability', risk: 'high', type: 'liability' },
    { phrase: 'indemnify', risk: 'medium', type: 'liability' },
    { phrase: 'perpetual license', risk: 'high', type: 'ip' },
    { phrase: 'non-compete', risk: 'medium', type: 'employment' },
    { phrase: 'net 60', risk: 'medium', type: 'payment' },
    { phrase: 'net 90', risk: 'high', type: 'payment' },
    { phrase: 'auto-renew', risk: 'medium', type: 'termination' }
  ];

  const seen = new Set();
  riskPhrases.forEach(({ phrase, risk, type }) => {
    if (lowerText.includes(phrase)) {
      const matchIndex = lowerText.indexOf(phrase);
      // Deduplicate overlapping or identical phrases in same area
      const key = `${type}-${matchIndex}`;
      if (seen.has(key)) return;
      seen.add(key);

      const context = extractSmartContext(text, matchIndex, phrase.length);

      risks.push({
        text: context,
        risk,
        type,
        warning: `Found "${phrase}" - may be risky`,
        suggestion: getRealtimeSuggestion(phrase, type)
      });
    }
  });

  return risks;
}

function getRealtimeSuggestion(phrase, type) {
  const suggestions = {
    'without cause': 'Request specific termination causes',
    'unlimited liability': 'Add liability cap',
    'indemnify': 'Review indemnification scope',
    'perpetual license': 'Consider term-limited license',
    'non-compete': 'Ensure reasonable scope and duration',
    'net 60': 'Request shorter payment terms',
    'net 90': 'Payment terms too long - negotiate',
    'auto-renew': 'Add notice period before renewal'
  };
  return suggestions[phrase] || 'Review this clause';
}

function getOverallRiskLevel(risks) {
  if (risks.some(r => r.risk === 'high')) return 'high';
  if (risks.some(r => r.risk === 'medium')) return 'medium';
  return 'low';
}

function getSuggestions(risks) {
  const uniqueSuggestions = [...new Set(risks.map(r => r.suggestion))];
  return uniqueSuggestions.slice(0, 3);
}

// AI analysis function (if OpenAI available)
async function performAIAnalysis(contractText, industry) {
  try {
    const prompt = `
      Analyze this contract for risks. Return JSON with:
      {
        "summary": "200-word plain English summary",
        "riskScore": 1-10,
        "verdict": "High/Medium/Low Risk",
        "confidence": 1-100,
        "redFlags": ["array of issues"],
        "greenFlags": ["array of good points"],
        "riskyClauses": [{"clauseText": "text", "riskLevel": "high/medium/low", "category": "type", "explanation": "why risky", "suggestion": "improvement"}],
        "categoryRisks": {"liability": {"score": 1-10, "explanation": "..."}, ...},
        "recommendations": [{"priority": "high/medium/low", "action": "what to do", "reason": "why"}]
      }
      
      Contract: ${contractText.substring(0, 3000)}
      Industry: ${industry}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;

    try {
      const parsed = JSON.parse(content);

      // DEDUPLICATION: Ensure AI hasn't returned redundant risks
      if (parsed.riskyClauses) {
        const seen = new Set();
        parsed.riskyClauses = parsed.riskyClauses.filter(clause => {
          const key = `${clause.category}-${clause.explanation}-${(clause.clauseText || '').substring(0, 30)}`.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }

      // Add heatmap
      if (parsed.categoryRisks && !parsed.heatmap) {
        parsed.heatmap = Object.entries(parsed.categoryRisks).map(([cat, data]) => ({
          category: cat,
          score: data.score || 5,
          intensity: (data.score || 5) / 10,
          color: getRiskColor(data.score || 5)
        }));
      }
      return parsed;
    } catch (e) {
      console.error('Failed to parse AI response, using mock:', e);
      return performSmartMockAnalysis(contractText, industry);
    }
  } catch (error) {
    console.error('OpenAI error:', error);
    return performSmartMockAnalysis(contractText, industry);
  }
}

// Startup Health Check for OpenAI
async function checkOpenAiStatus() {
  if (!openai) {
    console.log('⚠️ OpenAI Mode: DISABLED (No valid key in .env)');
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 5
    }, { signal: controller.signal });

    clearTimeout(timeout);
    console.log('✅ OpenAI Mode: ACTIVE (Connection Successful)');
  } catch (error) {
    console.error('❌ OpenAI Status Error:', error.message);
  }
}

console.log(`📡 Attempting to listen on 127.0.0.1:${PORT}...`);
// Start server
app.listen(PORT, '127.0.0.1', async () => {
  console.log(`\n🎯 AI Contract Risk Scanner Backend`);
  console.log(`✅ Server running on http://localhost:${PORT}`);

  await checkOpenAiStatus();

  console.log(`\n📊 Available Endpoints:`);
  console.log(`   POST /api/analyze      - Analyze contract
   POST /api/analyze/file - AI OCR Analysis
   POST /api/detect/realtime - Real-time scanning
   GET  /api/health       - Health check
   GET  /api/history      - Analysis history
   GET  /api/standards/:industry - Industry standards`);
  console.log(`\n💡 Tip: To use real AI, add your OpenAI API key to .env file`);
});

function getVerdict(score) {
  if (score >= 8) return 'HIGH RISK';
  if (score >= 5) return 'MEDIUM RISK';
  return 'LOW RISK';
}