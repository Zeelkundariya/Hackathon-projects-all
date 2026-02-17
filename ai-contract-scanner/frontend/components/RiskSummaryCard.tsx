// frontend/components/RiskSummaryCard.tsx
'use client';

import { useState } from 'react';

interface RiskSummaryCardProps {
    smartFeatures: {
        worstCase: string;
        beneficiary: string;
        topRisks: string[];
        summary: string;
    };
}

export default function RiskSummaryCard({ smartFeatures }: RiskSummaryCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!smartFeatures) return null;

    return (
        <div className="mb-8">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-between group"
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🔮</span>
                        <div className="text-left">
                            <div className="font-bold text-lg">What should I worry about?</div>
                            <div className="text-indigo-100 text-sm">Click for valid AI prediction</div>
                        </div>
                    </div>
                    <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            ) : (
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-indigo-100 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <span className="text-2xl">🔮</span> AI Risk Forecast
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Left Column: Story Mode */}
                        <div className="space-y-6">
                            <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                                <div className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Worst Case Scenario</div>
                                <p className="text-rose-900 font-medium leading-relaxed">
                                    &quot;{smartFeatures.worstCase}&quot;
                                </p>
                            </div>

                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Who Benefits?</div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">⚖️</span>
                                    <p className="text-indigo-900 font-bold text-lg">
                                        {smartFeatures.beneficiary}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Top Risks */}
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Top 3 Dealbreakers</div>
                            <ul className="space-y-3">
                                {smartFeatures.topRisks.map((risk, i) => (
                                    <li key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <span className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center font-bold text-xs shadow-sm text-slate-600 border border-slate-200">
                                            {i + 1}
                                        </span>
                                        <span className="text-slate-700 font-medium capitalize">
                                            {risk.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                                <p className="text-sm text-slate-500 italic">
                                    &quot;{smartFeatures.summary}&quot;
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
