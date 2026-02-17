const Jimp = require('jimp');

/**
 * Performs OCR and identifies signatures, dates, and handwriting.
 * @param {Buffer} buffer - The file buffer.
 * @param {string} mimeType - The file MIME type.
 * @returns {Promise<Object>} - Extracted text and detections.
 */
async function performOCR(buffer, mimeType) {
    console.log(`🧠 Starting Advanced OCR for ${mimeType}...`);
    let extractedText = '';
    let detections = {
        signaturesFound: false,
        dates: [],
        handwritingDetected: false,
        confidence: 0
    };

    let ocrBuffer = buffer;

    // Preprocessing for non-PDF images to improve accuracy
    if (mimeType.startsWith('image/')) {
        try {
            console.log('🖼️ Preprocessing image with Jimp...');
            const image = await Jimp.read(buffer);
            image.grayscale() // Better for OCR
                .contrast(0.2) // Sharpen characters
                .normalize(); // Expand color range

            ocrBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
            console.log('✅ Image preprocessed (Grayscale + Contrast).');
        } catch (err) {
            console.warn('⚠️ Jimp preprocessing failed, falling back to raw buffer:', err.message);
        }
    }

    if (mimeType === 'application/pdf') {
        try {
            const data = await pdf(buffer);
            if (data.text && data.text.trim().length > 50) {
                console.log('📄 Fast text extraction successful.');
                extractedText = data.text;
            }
        } catch (e) {
            console.error('Fast PDF extraction failed:', e);
        }
    }

    // Perform OCR via Tesseract.js for visual detection
    const result = await Tesseract.recognize(
        ocrBuffer,
        'eng',
        {
            logger: m => {
                if (m.status === 'recognizing text' && Math.round(m.progress * 100) % 25 === 0) {
                    console.log(`🔍 OCR: ${Math.round(m.progress * 100)}%`);
                }
            }
        }
    );

    const { data: { text, confidence, words } } = result;
    extractedText = extractedText || text;
    detections.confidence = confidence;

    // 1. Signature & Date Detection Logic
    const signatureKeywords = [/signature/i, /signed/i, /witness/i, /seal/i, /thumb/i, /affix/i];
    const dateRegex = /\b(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})|(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/gi;

    // Look for signatures (keywords in proximity to lines/whitespace/handwriting)
    detections.signaturesFound = signatureKeywords.some(regex => regex.test(extractedText));

    // Extract dates
    const foundDates = extractedText.match(dateRegex);
    if (foundDates) {
        detections.dates = [...new Set(foundDates)].slice(0, 5);
    }

    // 2. Handwriting Detection (Simplified)
    // Tesseract words with very low confidence but recognizable characters often indicate handwriting in standard 'eng' model
    const lowConfWords = words.filter(w => w.confidence < 60).length;
    if (lowConfWords / words.length > 0.3 && words.length > 20) {
        detections.handwritingDetected = true;
    }

    return {
        text: extractedText,
        detections
    };
}

module.exports = { performOCR };
