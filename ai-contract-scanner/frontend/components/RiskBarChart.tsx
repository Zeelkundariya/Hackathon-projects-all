// frontend/components/RiskBarChart.tsx
'use client';

interface CategoryRisk {
    score: number;
    explanation: string;
}

export default function RiskBarChart({ categoryRisks }: { categoryRisks: Record<string, CategoryRisk> }) {
    if (!categoryRisks) return null;

    const sortedCategories = Object.entries(categoryRisks)
        .sort((a, b) => b[1].score - a[1].score)
        .filter(([_, data]) => data.score >= 0);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 ring-1 ring-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-lg">📊</span> Risk Breakdown
            </h3>

            <div className="space-y-4">
                {sortedCategories.map(([category, data], i) => {
                    const percentage = (data.score / 10) * 100;
                    const getColor = (s: number) => {
                        if (s >= 7) return 'bg-rose-500';
                        if (s >= 4) return 'bg-amber-500';
                        return 'bg-emerald-500';
                    };

                    return (
                        <div key={category} className="space-y-1.5 group animate-in slide-in-from-right-2 duration-300" style={{ animationDelay: `${i * 0.05}s` }}>
                            <div className="flex justify-between items-center px-1">
                                <span className="text-xs font-bold text-slate-600 capitalize group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{category}</span>
                                <span className="text-xs font-mono font-bold text-slate-400">{data.score.toFixed(1)}/10</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-[1px]">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${getColor(data.score)}`}
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
