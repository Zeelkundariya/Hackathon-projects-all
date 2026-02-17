export default function Footer() {
    return (
        <footer className="bg-white border-t border-slate-200 py-10 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="flex justify-center items-center gap-2 mb-4">
                    <div className="bg-indigo-600 text-white p-1 rounded-md shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="font-bold text-slate-900 text-lg tracking-tight">AI Contract Scanner</span>
                </div>

                <p className="text-sm text-slate-500 font-medium">
                    © {new Date().getFullYear()} All rights reserved.
                </p>

                <p className="text-xs text-slate-400 mt-4 max-w-2xl mx-auto leading-relaxed">
                    <span className="font-semibold text-slate-500">Disclaimer:</span> This tool uses artificial intelligence to analyze contracts. It is not a law firm and does not provide legal advice.
                    Results should be used for informational purposes only and verified by a qualified attorney. The analysis score is an estimation based on common patterns and does not guarantee legal validity.
                </p>

                <div className="mt-8 flex justify-center gap-6">
                    <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors text-sm">Privacy Policy</a>
                    <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors text-sm">Terms of Service</a>
                    <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors text-sm">Contact Support</a>
                </div>
            </div>
        </footer>
    );
}
