// frontend/components/HistoryPanel.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface HistoryItem {
  id: string;
  contract: string;
  riskScore: number;
  verdict: string;
  timestamp: string;
}

export default function HistoryPanel() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('contractHistory');
      const parsed = stored ? JSON.parse(stored) : [];
      setHistory(parsed);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all analysis history? This action cannot be undone.')) {
      localStorage.removeItem('contractHistory');
      setHistory([]);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 8) return 'text-rose-600 bg-rose-50 border-rose-100';
    if (score >= 6) return 'text-amber-600 bg-amber-50 border-amber-100';
    if (score >= 4) return 'text-yellow-600 bg-yellow-50 border-yellow-100';
    return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          Recent Analyses
        </h3>

        <div className="flex gap-2">
          <button
            onClick={loadHistory}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="Refresh History"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
              title="Clear History"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[600px] p-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-3xl opacity-50">
              📝
            </div>
            <h4 className="text-slate-900 font-medium mb-1">No history yet</h4>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Your analyzed contracts will appear here for quick access.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((item, index) => (
              <div
                key={item.id || index}
                className="group relative bg-white border border-slate-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => router.push(`/analysis/${item.id}`)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className={`text-xs font-bold px-2 py-0.5 rounded border ${getScoreColorClass(item.riskScore)}`}>
                    Risk Score: {item.riskScore}/10
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                    {formatDate(item.timestamp)}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-800 line-clamp-2 mb-3 font-mono leading-relaxed">
                  {item.contract}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.verdict.toLowerCase().includes('safe') ? 'bg-emerald-500' :
                        item.verdict.toLowerCase().includes('caution') ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                    {item.verdict}
                  </span>

                  <span className="text-indigo-600 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                    View Report
                    <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl text-xs text-center text-slate-400">
        History stored locally • <button onClick={clearHistory} className="hover:text-slate-600 underline decoration-slate-300">Clear</button>
      </div>
    </div>
  );
}