// frontend/components/CommunityClauses.tsx
'use client';

import { useState, useEffect } from 'react';

interface CommunityClause {
  id: string;
  clauseText: string;
  riskLevel: 'high' | 'medium' | 'low';
  category: string;
  explanation: string;
  upvotes: number;
  downvotes: number;
  submittedBy: string;
  industry: string;
}

export default function CommunityClauses() {
  const [clauses, setClauses] = useState<CommunityClause[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCommunityClauses();
  }, [filter]);

  const fetchCommunityClauses = async () => {
    setLoading(true);
    try {
      // In production, this would fetch from your API
      const mockClauses: CommunityClause[] = [
        {
          id: '1',
          clauseText: 'The company may terminate this agreement at any time without cause.',
          riskLevel: 'high',
          category: 'termination',
          explanation: 'Unilateral termination gives company too much power.',
          upvotes: 42,
          downvotes: 3,
          submittedBy: 'Freelancer123',
          industry: 'technology'
        },
        {
          id: '2',
          clauseText: 'All intellectual property developed during engagement belongs to the company.',
          riskLevel: 'medium',
          category: 'intellectualProperty',
          explanation: 'Standard for work-for-hire, but verify scope.',
          upvotes: 28,
          downvotes: 5,
          submittedBy: 'DevExpert',
          industry: 'technology'
        }
      ];

      setClauses(mockClauses);
    } catch (error) {
      console.error('Failed to fetch clauses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (clauseId: string, voteType: 'up' | 'down') => {
    // Implement voting logic
    setClauses(prev => prev.map(clause =>
      clause.id === clauseId
        ? {
          ...clause,
          upvotes: voteType === 'up' ? clause.upvotes + 1 : clause.upvotes,
          downvotes: voteType === 'down' ? clause.downvotes + 1 : clause.downvotes
        }
        : clause
    ));
  };

  const categories = ['all', 'termination', 'liability', 'confidentiality', 'intellectualProperty', 'payment'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </span>
          Community Knowledge Base
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Crowdsourced insights on common contract clauses and risks.
        </p>
      </div>

      {/* Filter */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 overflow-x-auto">
        <div className="flex flex-nowrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${filter === category
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-indigo-600'
                }`}
            >
              {category === 'all' ? 'All Categories' : category.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Clauses List */}
      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-3 text-slate-500 text-sm">Loading community clauses...</p>
          </div>
        ) : clauses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📭</div>
            <p className="text-slate-900 font-medium">No clauses found</p>
            <p className="text-slate-500 text-sm mt-1">Be the first to contribute to this category!</p>
          </div>
        ) : (
          clauses.map(clause => (
            <div key={clause.id} className="p-6 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${clause.riskLevel === 'high' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                    clause.riskLevel === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                    {clause.riskLevel} Risk
                  </span>
                  <span className="text-xs text-slate-400">
                    {clause.industry} • by {clause.submittedBy}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4 mb-3 font-mono text-sm text-slate-700 leading-relaxed shadow-sm">
                &quot;{clause.clauseText}&quot;
              </div>

              <div className="flex items-start gap-3">
                <span className="text-indigo-500 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <p className="text-sm text-slate-600">{clause.explanation}</p>
              </div>

              <div className="flex items-center justify-between mt-4 pl-7">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleVote(clause.id, 'up')}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-600 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    <span>{clause.upvotes}</span>
                  </button>
                  <button
                    onClick={() => handleVote(clause.id, 'down')}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-rose-600 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                    </svg>
                    <span>{clause.downvotes}</span>
                  </button>
                </div>

                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group">
                  Add to Analysis
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Clause Button */}
      <div className="p-6 bg-slate-50 rounded-b-xl border-t border-slate-200">
        <button className="w-full py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 shadow-sm transition-all hover:shadow hover:border-indigo-300 flex items-center justify-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Contribute a New Clause
        </button>
      </div>
    </div>
  );
}