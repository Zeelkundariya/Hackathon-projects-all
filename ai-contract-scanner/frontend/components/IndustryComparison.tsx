// frontend/components/IndustryComparison.tsx
'use client';

interface IndustryComparisonProps {
  categoryRisks: Record<string, { score: number; explanation: string }>;
  industry: string;
}

export default function IndustryComparison({ categoryRisks, industry }: IndustryComparisonProps) {
  const industryStandards = {
    technology: {
      liability: { max: 6, average: 4 },
      termination: { max: 5, average: 3 },
      intellectualProperty: { max: 7, average: 5 },
      confidentiality: { max: 8, average: 6 },
      payment: { max: 4, average: 2 }
    },
    healthcare: {
      liability: { max: 8, average: 6 },
      confidentiality: { max: 9, average: 8 },
      termination: { max: 6, average: 4 }
    },
    finance: {
      liability: { max: 9, average: 7 },
      confidentiality: { max: 8, average: 6 },
      payment: { max: 7, average: 5 }
    },
    general: {
      liability: { max: 7, average: 5 },
      termination: { max: 6, average: 4 },
      confidentiality: { max: 7, average: 5 }
    }
  };

  const currentStandards = industryStandards[industry as keyof typeof industryStandards] || industryStandards.general;

  const getComparisonStatus = (category: string, score: number) => {
    const standard = currentStandards[category as keyof typeof currentStandards];
    if (!standard) return 'unknown';

    if (score > standard.max) return 'above';
    if (score > standard.average) return 'high';
    if (score <= standard.average) return 'normal';
    return 'unknown';
  };

  const formatCategory = (category: string) => {
    return category.replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <span className="p-1 bg-indigo-50 text-indigo-600 rounded-md">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </span>
        Industry Benchmarking
        <span className="ml-auto text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wide">
          {industry} Sector
        </span>
      </h3>

      <div className="space-y-6">
        {Object.entries(categoryRisks).map(([category, data]) => {
          const status = getComparisonStatus(category, data.score);
          const standard = currentStandards[category as keyof typeof currentStandards];

          return (
            <div key={category} className="bg-slate-50 rounded-lg p-5 border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-slate-800 text-sm">{formatCategory(category)}</h4>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded border ${status === 'above' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                      status === 'high' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}>
                    {status === 'above' ? 'Critical Outlier' :
                      status === 'high' ? 'Above Average' :
                        'Standard'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Score Comparison */}
                <div className="relative pt-6 pb-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                    <span>Low Risk</span>
                    <span>High Risk</span>
                  </div>
                  <div className="h-2.5 bg-slate-200 rounded-full w-full relative">
                    {/* Zones */}
                    <div className="absolute inset-0 rounded-full opacity-20 bg-gradient-to-r from-emerald-500 via-yellow-500 to-rose-500" />

                    {/* Contract Marker */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-4 border-slate-800 rounded-full shadow-sm z-20 transition-all duration-500"
                      style={{ left: `${data.score * 10}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
                        Your Score: {data.score}/10
                      </div>
                    </div>

                    {/* Industry Average Marker */}
                    {standard && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-indigo-500 z-10"
                        style={{ left: `${standard.average * 10}%` }}
                      >
                        <div className="absolute top-5 left-1/2 -translate-x-1/2 text-[10px] text-indigo-600 font-semibold whitespace-nowrap">
                          Avg: {standard.average}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs mt-2">
                  {standard && (
                    <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                      <span className="text-slate-500">Industry Avg</span>
                      <span className="font-semibold text-slate-700">{standard.average}/10</span>
                    </div>
                  )}
                  <div className={`flex justify-between p-2 rounded border ${data.score > 7 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'
                    }`}>
                    <span className={data.score > 7 ? 'text-rose-700' : 'text-emerald-700'}>Your Contract</span>
                    <span className={`font-bold ${data.score > 7 ? 'text-rose-800' : 'text-emerald-800'}`}>{data.score}/10</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-500 leading-relaxed border-t border-slate-200 pt-3">
                {data.explanation}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-start gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
        <span className="text-indigo-500 text-lg">💡</span>
        <p className="text-xs text-indigo-900 leading-relaxed">
          <strong>Context Matters:</strong> Scores significantly above the industry average ({industry}) typically indicate non-standard terms that may be difficult to enforce or negotiate.
        </p>
      </div>
    </div>
  );
}