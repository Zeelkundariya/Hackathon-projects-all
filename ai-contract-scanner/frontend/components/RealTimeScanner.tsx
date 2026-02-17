// frontend/components/RealTimeScanner.tsx
'use client';

import { useState, useCallback, useRef } from 'react';

interface RealTimeScannerProps {
  onDetection: (text: string, position: number) => void;
  text: string;
}

export default function RealTimeScanner({ onDetection, text }: RealTimeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleRealtimeScan = useCallback(() => {
    if (!textareaRef.current || isScanning) return;

    setIsScanning(true);
    const cursorPosition = textareaRef.current.selectionStart;

    // Trigger detection
    onDetection(text, cursorPosition);

    // Show scanning indicator
    setTimeout(() => {
      setIsScanning(false);
      setLastScan(new Date());
    }, 500);
  }, [text, onDetection, isScanning]);



  const formatTimeSince = (date: Date | null) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-sm">
      <div className="flex items-center gap-1.5">
        <div className={`relative flex h-2.5 w-2.5`}>
          {isScanning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isScanning ? 'bg-indigo-500' :
            lastScan ? 'bg-emerald-500' : 'bg-slate-300'
            }`}></span>
        </div>
        <span className="text-xs font-medium text-slate-600">
          {isScanning ? 'Scanning...' :
            lastScan ? `Scanned ${formatTimeSince(lastScan)}` :
              'Real-time Ready'}
        </span>
      </div>

      <div className="h-4 w-px bg-slate-200"></div>

      <button
        onClick={handleRealtimeScan}
        disabled={isScanning || text.length < 10}
        className={`text-xs font-semibold px-2 py-0.5 rounded transition-colors ${isScanning
          ? 'text-slate-400 cursor-not-allowed'
          : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
          }`}
      >
        Scan Cursor
      </button>
    </div>
  );
}