// frontend/app/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ContractInput from '../components/ContractInput';
import RiskHeatmap from '../components/RiskHeatmap';
import ClauseHighlighter from '../components/ClauseHighlighter';
import SummaryPanel from '../components/SummaryPanel';
import VerdictScore from '../components/VerdictScore';
import AlertSystem from '../components/AlertSystem';
import CommunityClauses from '../components/CommunityClauses';
import IndustryComparison from '../components/IndustryComparison';
import RealTimeScanner from '../components/RealTimeScanner';
import HistoryPanel from '../components/HistoryPanel';
import RoleSelector from '@/components/RoleSelector';
import RiskSummaryCard from '@/components/RiskSummaryCard';
import ChatAssistant from '../components/ChatAssistant';
import AudioDashboard from '../components/AudioDashboard';
import ClauseSuggestions from '../components/ClauseSuggestions';
import DetectionsSection from '../components/DetectionsSection';
import ActionPlan from '../components/ActionPlan';
import RiskBarChart from '../components/RiskBarChart';
import FileUpload from '../components/FileUpload';

interface Clause {
  id: string;
  clauseText: string;
  riskLevel: 'high' | 'medium' | 'low';
  category: string;
  explanation: string;
  suggestion: string;
  severity: number;
}

interface ContractAnalysis {
  summary: string;
  riskScore: number;
  verdict: string;
  confidence: number;
  redFlags: string[];
  greenFlags: string[];
  riskyClauses: Clause[];
  categoryRisks: Record<string, { score: number; explanation: string }>;
  recommendations: Array<{ priority: 'high' | 'medium' | 'low'; action: string; reason: string }>;
  heatmap: Array<{ category: string; score: number; color: string; intensity: number }>;
  analysisId: string;
  timestamp: string;
  smartFeatures?: {
    worstCase: string;
    beneficiary: string;
    topRisks: string[];
    summary: string;
  };
  detections?: {
    signaturesFound: boolean;
    handwritingDetected: boolean;
    dates: string[];
  };
}

export default function Home() {
  const [contractText, setContractText] = useState<string>('');
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState({
    riskTolerance: 'medium',
    industry: 'technology',
    role: 'individual',
    experience: 'intermediate'
  });
  const [eli15Enabled, setEli15Enabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'analysis' | 'history' | 'community' | 'chat'>('analysis');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [realtimeResults, setRealtimeResults] = useState<any>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load sample contract
  useEffect(() => {
    const sampleContract = `CONFIDENTIALITY AGREEMENT

This Confidentiality Agreement ("Agreement") is made effective as of ${new Date().getFullYear()}, by and between:

Company Name ("Disclosing Party")
And
Recipient Name ("Receiving Party")

1. CONFIDENTIAL INFORMATION
The term "Confidential Information" means any information disclosed by either party to the other party, either directly or indirectly, in writing, orally or by inspection of tangible objects.

2. NON-USE AND NON-DISCLOSURE
Receiving Party agrees not to use any Confidential Information for any purpose except to evaluate and engage in discussions concerning a potential business relationship between the parties.

3. UNILATERAL TERMINATION
The Disclosing Party may terminate this Agreement at any time, for any reason, without notice or liability to the Receiving Party.

4. LIMITATION OF LIABILITY
IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES OF ANY KIND, WHETHER IN CONTRACT, TORT, OR OTHERWISE.

5. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of laws principles.

6. PERPETUAL LICENSE
The Receiving Party hereby grants the Disclosing Party a perpetual, irrevocable, worldwide, royalty-free license to use any ideas, concepts, know-how, or techniques contained in any communication provided hereunder.

7. INDEMNIFICATION
Receiving Party agrees to indemnify and hold harmless Disclosing Party from and against any and all claims, losses, liabilities, and expenses arising out of or in connection with any breach of this Agreement.

8. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the parties concerning the subject matter hereof.`;

    setContractText(sampleContract);
  }, []);

  const analyzeContract = async (textToSearch?: any) => {
    // If called with an event (onClick), ignore it. Only use string input or state.
    const text = typeof textToSearch === 'string' ? textToSearch : contractText;

    if (!text || typeof text !== 'string' || !text.trim() || text.length < 50) {
      toast.error('Please enter a valid contract (minimum 50 characters)');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Analyzing contract...');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractText: text,
          industry: userProfile.industry,
          userRole: userProfile.role,
          userId: 'demo-user'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.data);
        toast.success('Analysis complete!', { id: toastId });

        // Scroll to results using standard animation frame for better parity logic
        requestAnimationFrame(() => {
          setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        });

        // Save to localStorage
        if (typeof window !== 'undefined') {
          const history = JSON.parse(localStorage.getItem('contract_history') || '[]');
          history.unshift({
            id: data.data.analysisId,
            text: text.substring(0, 100) + '...',
            score: data.data.riskScore,
            verdict: data.data.verdict,
            timestamp: new Date().toISOString()
          });
          localStorage.setItem('contract_history', JSON.stringify(history.slice(0, 10)));
        }
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.message || 'Failed to analyze contract', { id: toastId });
    } finally {
      setLoading(false);
      if (toastId) toast.dismiss(toastId);
    }
  };

  const saveToHistory = (analysisData: ContractAnalysis) => {
    try {
      const history = JSON.parse(localStorage.getItem('contractHistory') || '[]');
      history.unshift({
        id: analysisData.analysisId || Date.now().toString(),
        contract: contractText.substring(0, 150) + '...',
        riskScore: analysisData.riskScore,
        verdict: analysisData.verdict,
        timestamp: analysisData.timestamp || new Date().toISOString()
      });
      localStorage.setItem('contractHistory', JSON.stringify(history.slice(0, 20)));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  };

  const handleRealtimeDetection = async (text: string, position: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/detect/realtime`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, cursorPosition: position })
      });

      if (response.ok) {
        const data = await response.json();
        setRealtimeResults(data);
      }
    } catch (error) {
      console.error('Realtime detection failed:', error);
    }
  };

  const generateReport = async () => {
    if (!analysis) {
      toast.error('No analysis to generate report from');
      return;
    }

    toast.loading('Generating report...');

    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 1000));

      const reportContent = {
        title: `Contract Risk Analysis - ${analysis.timestamp}`,
        riskScore: analysis.riskScore,
        verdict: analysis.verdict,
        riskyClauses: analysis.riskyClauses.length,
        summary: analysis.summary.substring(0, 200) + '...'
      };

      // Create download
      const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-analysis-${analysis.analysisId || 'report'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Report downloaded!');
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error('Failed to generate report');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Toaster position="top-right" toastOptions={{
        className: 'text-sm font-medium shadow-md',
        style: { borderRadius: '8px', background: '#334155', color: '#fff' },
      }} />

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        setUserProfile={(profile) => setUserProfile(profile)}
        generateReport={generateReport}
        hasAnalysis={!!analysis}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">

        {/* Mobile Tabs */}
        <div className="md:hidden flex mb-6 bg-white p-1 rounded-lg border border-slate-200 overflow-x-auto shadow-sm">
          {['analysis', 'chat', 'history', 'community'].map((tab) => (
            <button
              key={tab}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab
                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Left Column: Input */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ring-1 ring-slate-200">
                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-between items-center backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-slate-900 tracking-tight">Contract Document</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600 font-medium font-mono">
                      {contractText.length} chars
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <RealTimeScanner
                      onDetection={handleRealtimeDetection}
                      text={contractText}
                    />
                    <div className="h-4 w-px bg-slate-200"></div>
                    <FileUpload
                      userRole={userProfile.role}
                      industry={userProfile.industry}
                      onTextExtracted={(text, analysisData) => {
                        setContractText(text);
                        if (analysisData) {
                          setAnalysis(analysisData);
                          // Delay scroll to let DOM update
                          setTimeout(() => {
                            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 100);
                        } else if (text.length >= 50) {
                          // Auto-trigger analysis for local text extraction
                          analyzeContract(text);
                        }
                      }}
                    />
                    <div className="h-4 w-px bg-slate-300"></div>
                    <button
                      onClick={() => setContractText('')}
                      className="text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors px-2 py-1 hover:bg-rose-50 rounded"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-slate-50/30">
                  <RoleSelector
                    selectedRole={userProfile.role}
                    onSelect={(role) => setUserProfile(prev => ({ ...prev, role }))}
                  />

                  {/* ELI15 Toggle */}
                  <div className="mb-4 flex items-center gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={eli15Enabled}
                        onChange={() => setEli15Enabled(!eli15Enabled)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      <span className="ml-3 text-sm font-semibold text-indigo-900 flex items-center gap-1.5">
                        📚 Show ELI15 Explanations
                      </span>
                    </label>
                  </div>

                  <div className="mt-4 space-y-4">
                    <ClauseSuggestions
                      text={contractText}
                      onReplace={(newText) => setContractText(newText)}
                    />

                    <ContractInput
                      value={contractText}
                      onChange={setContractText}
                      placeholder="Paste your legal contract here for analysis..."
                      rows={22}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
                  <button
                    onClick={() => analyzeContract()}
                    disabled={loading || contractText.length < 50}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-semibold text-white transition-all shadow-sm ${loading || contractText.length < 50
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 shadow-indigo-200'
                      }`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Analyzing Document...</span>
                      </>
                    ) : (
                      <>
                        <span>Run AI Risk Analysis</span>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Real-time Alerts */}
              {realtimeResults?.immediateRisks?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm animate-fade-in">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-semibold text-amber-900">Real-time Detection</h3>
                      <ul className="mt-2 space-y-2">
                        {realtimeResults.immediateRisks.slice(0, 3).map((risk: { warning: string; suggestion: string }, i: number) => (
                          <li key={i} className="text-sm text-amber-800">
                            <span className="font-medium">• {risk.warning}:</span> {risk.suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Clause Highlighter - shown after analysis */}
              {analysis && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ring-1 ring-slate-200">
                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <h2 className="font-semibold text-slate-900 tracking-tight">Detected Risks in Context</h2>
                  </div>
                  <div className="p-6">
                    <ClauseHighlighter
                      contractText={contractText}
                      riskyClauses={analysis.riskyClauses}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Analysis Results */}
            <div className="lg:col-span-5 space-y-6">
              {analysis ? (
                <div ref={resultsRef} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Audio Dashboard */}
                  <AudioDashboard
                    summary={analysis.summary}
                    risks={analysis.riskyClauses.map(c => ({ category: c.category, reason: eli15Enabled ? c.explanation : c.suggestion }))}
                  />

                  {/* Legal Action Plan */}
                  <ActionPlan score={analysis.riskScore} />

                  {/* Risk Breakdown Bars */}
                  <RiskBarChart categoryRisks={analysis.categoryRisks} />

                  {/* Document Detections */}
                  <DetectionsSection detections={analysis.detections} />

                  {/* AI Smart Summary Card */}
                  {analysis.smartFeatures && (
                    <RiskSummaryCard smartFeatures={analysis.smartFeatures} />
                  )}

                  <VerdictScore
                    score={analysis.riskScore}
                    verdict={analysis.verdict}
                    confidence={analysis.confidence}
                    recommendations={analysis.recommendations || []}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                    <SummaryPanel
                      summary={analysis.summary}
                      redFlags={analysis.redFlags || []}
                      greenFlags={analysis.greenFlags || []}
                    />

                    {analysis.heatmap && (
                      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 ring-1 ring-slate-200">
                        <h3 className="font-semibold text-slate-900 mb-4 tracking-tight">Risk Distribution</h3>
                        <RiskHeatmap data={analysis.heatmap} />
                      </div>
                    )}
                  </div>

                  <AlertSystem
                    risks={analysis.riskyClauses || []}
                    userProfile={userProfile}
                  />

                  {analysis.categoryRisks && (
                    <IndustryComparison
                      categoryRisks={analysis.categoryRisks}
                      industry={userProfile.industry}
                    />
                  )}

                  {/* Export Actions */}
                  <div className="flex gap-4 p-4 mt-6 bg-slate-900 border-t border-slate-800 rounded-xl shadow-lg ring-1 ring-white/5">
                    <button
                      onClick={generateReport}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-all border border-white/10"
                    >
                      📄 Export TXT
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `contract-analysis-${analysis.analysisId}.json`;
                        a.click();
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
                    >
                      💻 Export JSON
                    </button>
                  </div>
                </div>
              ) : (
                // Empty State
                <div className="h-full flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-slate-200 rounded-xl text-center hover:border-slate-300 transition-colors">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Analyze</h3>
                  <p className="text-slate-500 mt-2 max-w-sm leading-relaxed">
                    Paste your contract on the left and select your industry. Our AI will identify risks, red flags, and missing terms in seconds.
                  </p>

                  <div className="grid grid-cols-3 gap-4 mt-8 w-full max-w-xs">
                    <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-indigo-600 font-bold text-lg mb-1">AI</div>
                      <div className="text-xs text-slate-500 font-medium">Analysis</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-indigo-600 font-bold text-lg mb-1">Instant</div>
                      <div className="text-xs text-slate-500 font-medium">Results</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-indigo-600 font-bold text-lg mb-1">Secure</div>
                      <div className="text-xs text-slate-500 font-medium">Privacy</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="h-full">
            <HistoryPanel />
          </div>
        )}

        {activeTab === 'community' && (
          <div className="h-full">
            <CommunityClauses />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto h-full">
            <ChatAssistant
              contractText={contractText}
              userRole={userProfile.role}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}