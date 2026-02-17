// frontend/components/FileUpload.tsx
'use client';

import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface FileUploadProps {
    onTextExtracted: (text: string, analysisData?: any) => void;
    userRole: string;
    industry: string;
}

export default function FileUpload({ onTextExtracted, userRole, industry }: FileUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await processFile(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const processFile = async (file: File) => {
        setIsUploading(true);
        const toastId = toast.loading(`Processing ${file.name}...`);

        try {
            let text = '';
            if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                text = await readFileAsText(file);
            } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                text = await extractTextFromPDF(file);
            } else {
                throw new Error('Unsupported file type. Please use .txt or .pdf');
            }

            if (!text || text.trim().length < 20) {
                const useOCR = confirm('This PDF appears to be a scanned image. Would you like to use AI OCR to extract text?');
                if (useOCR) {
                    await performOCRUpload(file, toastId);
                    return;
                } else {
                    throw new Error('Could not extract text from document.');
                }
            }

            onTextExtracted(text);
            toast.success('File loaded successfully!', { id: toastId });
        } catch (err: any) {
            toast.error(err.message || 'Failed to process file', { id: toastId });
        } finally {
            setIsUploading(false);
        }
    };

    const readFileAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read text file'));
            reader.readAsText(file);
        });
    };

    const extractTextFromPDF = async (file: File): Promise<string> => {
        try {
            // Robust library detection with dynamic wait
            let pdfjsLib = (window as any).pdfjsLib;

            if (!pdfjsLib) {
                // Wait up to 2 seconds for script to be ready
                for (let i = 0; i < 20; i++) {
                    await new Promise(r => setTimeout(r, 100));
                    pdfjsLib = (window as any).pdfjsLib;
                    if (pdfjsLib) break;
                }
            }

            if (!pdfjsLib) throw new Error('PDF library engine is still initializing. Please try again in a moment.');

            // Essential worker configuration for PDF.js
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const strings = content.items.map((item: any) => item.str);
                fullText += strings.join(' ') + '\n';
            }
            return fullText;
        } catch (e: any) {
            console.error('PDF Extraction Error:', e);
            throw new Error(e.message || 'Local PDF parsing failed. Is this a scanned image?');
        }
    };

    const performOCRUpload = async (file: File, toastId: string) => {
        toast.loading('Uploading for AI OCR...', { id: toastId });

        const formData = new FormData();
        formData.append('contractFile', file);
        formData.append('userRole', userRole);
        formData.append('industry', industry);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/api/analyze/file`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('OCR upload failed');
            const data = await response.json();

            if (data.success) {
                onTextExtracted(data.data.extractedText || '', data.data);
                toast.success('OCR Analysis complete!', { id: toastId });
            } else {
                throw new Error(data.error || 'OCR failed');
            }
        } catch (err: any) {
            toast.error(err.message || 'OCR failed', { id: toastId });
        }
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.txt"
                className="hidden"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all border border-indigo-200/50 shadow-sm"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                </svg>
                <span>Upload File</span>
            </button>
        </>
    );
}
