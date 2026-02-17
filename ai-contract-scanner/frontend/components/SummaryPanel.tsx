// frontend/components/SummaryPanel.tsx
'use client';

import { useState } from 'react';

interface SummaryPanelProps {
  summary: string;
  redFlags?: string[];
  greenFlags?: string[];
}

export default function SummaryPanel({ summary, redFlags = [], greenFlags = [] }: SummaryPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <span className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          Executive Summary
        </h3>
        {summary.length > 300 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>

      {/* Summary Text */}
      <div className={`text-slate-600 text-sm leading-relaxed ${expanded ? '' : 'line-clamp-6'}`}>
        {summary || 'No summary available. Analyze a contract to generate insights.'}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {/* Red Flags */}
        {redFlags && redFlags.length > 0 && (
          <div className="bg-rose-50 border border-rose-100 rounded-lg p-4">
            <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wide mb-3 flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Critical Issues ({redFlags.length})
            </h4>
            <ul className="space-y-2">
              {redFlags.map((flag, index) => (
                <li key={index} className="flex items-start text-sm text-rose-800">
                  <span className="mr-2">•</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Green Flags */}
        {greenFlags && greenFlags.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-3 flex items-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Standard Provisions ({greenFlags.length})
            </h4>
            <ul className="space-y-2">
              {greenFlags.map((flag, index) => (
                <li key={index} className="flex items-start text-sm text-emerald-800">
                  <span className="mr-2">•</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}