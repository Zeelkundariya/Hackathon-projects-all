// frontend/components/ClauseSuggestions.tsx
'use client';

import { useState, useEffect } from 'react';

interface ClauseSuggestionsProps {
    text: string;
    onReplace: (newText: string) => void;
}

export default function ClauseSuggestions({ text, onReplace }: ClauseSuggestionsProps) {
    const [suggestion, setSuggestion] = useState<Record<string, string> | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [riskLevel, setRiskLevel] = useState<'conservative' | 'aggressive'>('conservative');

    useEffect(() => {
        const timer = setTimeout(async () => {
            const lastWords = text.split(/\s+/).slice(-5).join(' ').toLowerCase();
            const triggers = ['indemnity', 'termination', 'liability', 'confidential'];
            const foundKey = triggers.find(key => lastWords.includes(key));

            if (foundKey) {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                    const response = await fetch(`${apiUrl}/api/suggest`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ clauseType: foundKey === 'confidential' ? 'confidentiality' : foundKey })
                    });
                    const data = await response.json();
                    if (data.success) {
                        setSuggestion(data.suggestions);
                        setIsVisible(true);
                    }
                } catch (e) {
                    console.error('Suggestion API failed', e);
                }
            } else {
                setIsVisible(false);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [text]);

    if (!isVisible || !suggestion) return null;

    return (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">💡</span>
                    <h4 className="text-sm font-bold text-indigo-900">AI Legal Suggestion</h4>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="bg-white border border-indigo-100 rounded-lg p-3 text-sm text-slate-700 italic leading-relaxed mb-4">
                "{suggestion[riskLevel]}"
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex bg-indigo-100/50 p-1 rounded-lg">
                    <button
                        onClick={() => setRiskLevel('conservative')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${riskLevel === 'conservative' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-600 hover:bg-white/50'
                            }`}
                    >
                        🛡️ Conservative
                    </button>
                    <button
                        onClick={() => setRiskLevel('aggressive')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${riskLevel === 'aggressive' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-600 hover:bg-white/50'
                            }`}
                    >
                        ⚡ Aggressive
                    </button>
                </div>

                <button
                    onClick={() => {
                        onReplace(text + "\n\n" + suggestion[riskLevel]);
                        setIsVisible(false);
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-100"
                >
                    Insert Clause
                </button>
            </div>
        </div>
    );
}
