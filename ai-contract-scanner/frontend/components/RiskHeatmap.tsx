// frontend/components/RiskHeatmap.tsx
'use client';

interface HeatmapData {
  category: string;
  score: number;
  color: string;
  intensity: number;
  explanation?: string;
}

interface RiskHeatmapProps {
  data: HeatmapData[];
}

export default function RiskHeatmap({ data }: RiskHeatmapProps) {
  const getRiskLabel = (score: number) => {
    if (score >= 8) return 'Critical';
    if (score >= 7) return 'High';
    if (score >= 3) return 'Medium'; // Expanded definition of Medium
    return 'Low';
  };

  const formatCategory = (category: string) => {
    return category.replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">🌋 Risk Heatmap</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {data.map((item, index) => (
          <div
            key={index}
            className="relative group cursor-pointer"
            style={{
              backgroundColor: item.color,
              opacity: 0.7 + (item.intensity * 0.3)
            }}
          >
            <div className="aspect-square rounded-lg p-4 flex flex-col justify-center items-center text-white">
              <div className="text-2xl font-bold">{item.score}/10</div>
              <div className="text-sm font-medium mt-1">{formatCategory(item.category)}</div>
              <div className="text-xs opacity-90 mt-1">{getRiskLabel(item.score)}</div>
            </div>

            {/* Tooltip */}
            <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white p-3 rounded-lg text-sm bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48">
              <div className="font-semibold mb-1">{formatCategory(item.category)} Risk</div>
              <div className="opacity-90">{item.explanation}</div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span>Low Risk (1-3)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
            <span>Medium Risk (4-6)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span>High Risk (7-10)</span>
          </div>
        </div>

        <div className="h-2 w-full rounded-full overflow-hidden flex">
          {[...Array(10)].map((_, i) => {
            const intensity = (i + 1) / 10;
            let color;
            if (i < 3) color = '#10b981';
            else if (i < 6) color = '#f59e0b';
            else color = '#ef4444';

            return (
              <div
                key={i}
                className="flex-1"
                style={{
                  backgroundColor: color,
                  opacity: 0.7 + (intensity * 0.3)
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}