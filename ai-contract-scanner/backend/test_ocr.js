const { performOCR } = require('./utils/ocr');
const fs = require('fs');

async function test() {
    console.log('🧪 Testing OCR Utility...');
    // Create a dummy text image or just check if it loads
    try {
        // We'll just check if the module loads and function is defined
        if (typeof performOCR === 'function') {
            console.log('✅ OCR Module loaded successfully.');
        } else {
            console.error('❌ OCR Module failed to load.');
        }
    } catch (e) {
        console.error('❌ OCR Test error:', e);
    }
}

test();
