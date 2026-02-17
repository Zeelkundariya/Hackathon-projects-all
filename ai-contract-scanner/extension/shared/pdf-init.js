// Initialize PDF.js worker locally for the extension
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '../shared/pdf.worker.min.js';
}
