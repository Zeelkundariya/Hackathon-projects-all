// frontend/components/DetectionsSection.tsx
'use client';

interface Detections {
    signaturesFound: boolean;
    handwritingDetected: boolean;
    dates: string[];
}

export default function DetectionsSection({ detections }: { detections?: Detections }) {
    if (!detections) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 ring-1 ring-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-lg">📑</span> OCR & Document Detections
            </h3>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Signatures / Seals:</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${detections.signaturesFound ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                        {detections.signaturesFound ? '✅ Found' : '❓ Not Detected'}
                    </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-sm font-medium text-slate-600">Handwriting:</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${detections.handwritingDetected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                        {detections.handwritingDetected ? '✍️ Detected' : '🖨️ Printed Only'}
                    </span>
                </div>

                <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Identified Dates:</span>
                    <div className="flex flex-wrap gap-2">
                        {detections.dates && detections.dates.length > 0 ? (
                            detections.dates.map((date, i) => (
                                <span key={i} className="text-xs bg-white border border-slate-200 px-2.5 py-1 rounded-md text-slate-700 shadow-sm">
                                    📅 {date}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-slate-400 italic">No dates identified</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
