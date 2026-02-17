// frontend/components/VerdictScore.tsx
'use client';

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  reason: string;
}

interface VerdictScoreProps {
  score: number;
  verdict: string;
  confidence: number;
  recommendations: Recommendation[];
}

export default function VerdictScore({ score, verdict, confidence, recommendations }: VerdictScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 6) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (score >= 4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 2) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Very High Risk';
    if (score >= 6) return 'High Risk';
    if (score >= 4) return 'Medium Risk';
    if (score >= 2) return 'Low Risk';
    return 'Very Low Risk';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">⚖️ Risk Verdict</h2>

      {/* Score Circle */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className={`w-40 h-40 rounded-full border-8 ${getScoreColor(score)} flex items-center justify-center`}>
            <div className="text-center">
              <div className="text-4xl font-bold">{score}/10</div>
              <div className="text-sm font-medium mt-1">{getScoreLabel(score)}</div>
            </div>
          </div>

          {/* Confidence Badge */}
          <div className="absolute -top-2 -right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            {confidence}% confidence
          </div>
        </div>

        <div className="mt-4 text-lg font-semibold text-gray-700">{verdict}</div>
      </div>

      {/* Risk Scale */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Low Risk</span>
          <span>High Risk</span>
        </div>
        <div className="h-3 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-800 bg-opacity-20 relative"
            style={{ width: `${score * 10}%` }}
          >
            <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-800 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900">📋 Recommendations</h3>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${rec.priority === 'high' ? 'border-red-200 bg-red-50' :
                    rec.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                      'border-blue-200 bg-blue-50'
                  }`}
              >
                <div className="flex items-start">
                  <span className={`mr-3 ${rec.priority === 'high' ? 'text-red-600' :
                      rec.priority === 'medium' ? 'text-yellow-600' :
                        'text-blue-600'
                    }`}>
                    {rec.priority === 'high' ? '🔴' :
                      rec.priority === 'medium' ? '🟡' : '🔵'}
                  </span>
                  <div>
                    <div className="font-medium">{rec.action}</div>
                    <div className="text-sm text-gray-600 mt-1">{rec.reason}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          ⚠️ <strong>Disclaimer:</strong> This is an AI-generated analysis and should not be considered legal advice.
          Always consult with a qualified attorney for important legal matters.
        </p>
      </div>
    </div>
  );
}