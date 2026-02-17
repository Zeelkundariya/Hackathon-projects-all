'use client';


interface UserProfile {
    riskTolerance: string;
    role: string;
    industry: string;
    experience: string;
    [key: string]: string;
}

interface HeaderProps {
    activeTab: 'analysis' | 'history' | 'community' | 'chat';
    setActiveTab: (tab: 'analysis' | 'history' | 'community' | 'chat') => void;
    userProfile: UserProfile;
    setUserProfile: (profile: UserProfile) => void;
    generateReport: () => void;
    hasAnalysis: boolean;
}

export default function Header({
    activeTab,
    setActiveTab,
    userProfile,
    setUserProfile,
    generateReport,
    hasAnalysis
}: HeaderProps) {
    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-md bg-white/90 shadow-sm transition-all duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-indigo-200 shadow-md transform transition-transform hover:scale-105 duration-200">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">AI Contract Scanner</h1>
                            <p className="text-xs text-slate-500 font-medium tracking-wide">Professional Legal Risk Assessment</p>
                        </div>
                    </div>

                    {/* Navigation & Actions */}
                    <div className="flex items-center gap-4">
                        {/* Desktop Tabs */}
                        <div className="hidden md:flex items-center bg-slate-100/80 p-1 rounded-lg border border-slate-200/50">
                            {(['analysis', 'chat', 'history', 'community'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === tab
                                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5 scale-[1.02]'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                        }`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

                        <div className="flex items-center gap-3">
                            {/* Industry Selector */}
                            <div className="relative hidden sm:block">
                                <select
                                    value={userProfile.industry}
                                    onChange={(e) => setUserProfile({ ...userProfile, industry: e.target.value })}
                                    className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-8 py-2 transition-colors cursor-pointer"
                                >
                                    <option value="technology">Technology</option>
                                    <option value="finance">Finance</option>
                                    <option value="healthcare">Healthcare</option>
                                    <option value="realestate">Real Estate</option>
                                    <option value="legal">Legal</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>

                            {/* Export Button */}
                            <button
                                onClick={generateReport}
                                disabled={!hasAnalysis}
                                className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${hasAnalysis
                                    ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 shadow-sm'
                                    : 'bg-slate-50 text-slate-400 cursor-not-allowed border border-transparent'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
