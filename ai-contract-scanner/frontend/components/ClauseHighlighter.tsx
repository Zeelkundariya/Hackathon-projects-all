// frontend/components/ClauseHighlighter.tsx
'use client';

import { useState } from 'react';

interface Clause {
  id: string;
  clauseText: string;
  fullText?: string; // Restored
  riskLevel: 'high' | 'medium' | 'low';
  category: string;
  explanation: string;
  suggestion: string;
}

interface ClauseHighlighterProps {
  contractText: string;
  riskyClauses: Clause[];
}

export default function ClauseHighlighter({ contractText, riskyClauses }: ClauseHighlighterProps) {
  const [selectedClause, setSelectedClause] = useState<Clause | null>(null);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'bg-red-100 border-l-4 border-red-500';
      case 'medium': return 'bg-yellow-100 border-l-4 border-yellow-500';
      case 'low': return 'bg-green-100 border-l-4 border-green-500';
      default: return 'bg-gray-100';
    }
  };

  const highlightText = () => {
    let highlightedText = contractText;

    // Sort by risk level to highlight highest risks last (so they're on top)
    const sortedClauses = [...riskyClauses].sort((a, b) => {
      const riskOrder = { high: 3, medium: 2, low: 1 };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    });

    sortedClauses.forEach((clause, index) => {
      const color = clause.riskLevel === 'high' ? '#fecaca' :
        clause.riskLevel === 'medium' ? '#fef3c7' : '#d1fae5';

      const marker = `<mark class="clause-highlight cursor-pointer" 
                           data-index="${index}" 
                           style="background-color: ${color}; padding: 2px 0; border-radius: 3px;"
                           onmouseover="this.style.backgroundColor='${color}88'"
                           onmouseout="this.style.backgroundColor='${color}'">
                     </mark>`;

      // Use fullText if available, fallback to clauseText
      const textToMatch = clause.fullText || clause.clauseText;

      // Skip if no text to match
      if (!textToMatch || textToMatch.trim().length === 0) {
        console.warn('Skipping clause with no text:', clause);
        return;
      }

      // Create a flexible regex that matches the text regardless of whitespace/newline differences
      const flexiblePattern = textToMatch
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex chars
        .replace(/\s+/g, '[\\s\\n]+');          // Allow flexible whitespace

      try {
        highlightedText = highlightedText.replace(
          new RegExp(flexiblePattern, 'gi'),
          marker
        );
      } catch (e) {
        console.error("Highlight regex error", e);
      }
    });

    return { __html: highlightedText };
  };

  return (
    <div className="space-y-6">
      {/* Contract Text with Highlights */}
      <div className="bg-gray-50 rounded-lg p-6 max-h-[400px] overflow-y-auto">
        <div
          className="font-mono text-sm leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={highlightText()}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('clause-highlight')) {
              const index = parseInt(target.getAttribute('data-index') || '0');
              setSelectedClause(riskyClauses[index]);
            }
          }}
        />
      </div>

      {/* Selected Clause Details */}
      {selectedClause && (
        <div className={`p-4 rounded-lg ${getRiskColor(selectedClause.riskLevel)}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedClause.riskLevel === 'high' ? 'bg-red-500 text-white' :
                selectedClause.riskLevel === 'medium' ? 'bg-yellow-500 text-white' :
                  'bg-green-500 text-white'
                }`}>
                {selectedClause.riskLevel.toUpperCase()} RISK
              </span>
              <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded">
                {selectedClause.category}
              </span>
            </div>
            <button
              onClick={() => setSelectedClause(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">📝 Clause Text</h4>
              <p className="text-gray-700 italic">{selectedClause.clauseText}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-1">⚠️ Why This is Risky</h4>
              <p className="text-gray-700">{selectedClause.explanation}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-1">💡 Suggestion</h4>
              <p className="text-gray-700">{selectedClause.suggestion}</p>
            </div>
          </div>
        </div>
      )}

      {/* Risk Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-red-700">High Risk</span>
            <span className="text-2xl font-bold text-red-700">
              {riskyClauses.filter(c => c.riskLevel === 'high').length}
            </span>
          </div>
          <p className="text-sm text-red-600 mt-2">Immediate attention needed</p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-yellow-700">Medium Risk</span>
            <span className="text-2xl font-bold text-yellow-700">
              {riskyClauses.filter(c => c.riskLevel === 'medium').length}
            </span>
          </div>
          <p className="text-sm text-yellow-600 mt-2">Review and consider changes</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-green-700">Low Risk</span>
            <span className="text-2xl font-bold text-green-700">
              {riskyClauses.filter(c => c.riskLevel === 'low').length}
            </span>
          </div>
          <p className="text-sm text-green-600 mt-2">Generally acceptable</p>
        </div>
      </div>
    </div>
  );
}