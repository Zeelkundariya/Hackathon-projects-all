// frontend/components/AudioDashboard.tsx
'use client';

import { useState, useEffect, useRef } from 'react';

interface AudioDashboardProps {
    summary: string;
    risks: Array<{ category: string; reason: string }>;
}

export default function AudioDashboard({ summary, risks }: AudioDashboardProps) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<string>('');
    const [speed, setSpeed] = useState(1);
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    const visualizerActive = useRef(false);

    useEffect(() => {
        if (!synth) return;

        const loadVoices = () => {
            const v = synth.getVoices();
            setVoices(v);
            if (v.length > 0 && !selectedVoice) setSelectedVoice(v[0].name);
        };

        loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, [synth, selectedVoice]);

    const speakAll = () => {
        if (!synth) return;
        if (synth.speaking) synth.cancel();

        const fullText = `Contract Analysis Summary. ${summary}. Detected Risks. ` +
            risks.map(r => `${r.category}: ${r.reason}`).join('. ');

        const utter = new SpeechSynthesisUtterance(fullText);
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) utter.voice = voice;
        utter.rate = speed;

        utter.onstart = () => setIsSpeaking(true);
        utter.onend = () => setIsSpeaking(false);
        utter.onerror = () => setIsSpeaking(false);

        synth.speak(utter);
    };

    const stop = () => {
        if (synth) synth.cancel();
        setIsSpeaking(false);
    };

    return (
        <div className="bg-slate-900 rounded-xl p-6 shadow-xl border border-slate-800 ring-1 ring-white/10 relative overflow-hidden group">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                <div className="flex items-center gap-4">
                    {!isSpeaking ? (
                        <button
                            onClick={speakAll}
                            className="w-14 h-14 flex items-center justify-center rounded-full bg-white text-slate-900 hover:bg-slate-200 transition-all shadow-lg hover:scale-105 active:scale-95"
                            title="Play Analysis"
                        >
                            <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            onClick={stop}
                            className="w-14 h-14 flex items-center justify-center rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-lg hover:scale-105 active:scale-95 animate-pulse"
                            title="Stop Playing"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 6h12v12H6z" />
                            </svg>
                        </button>
                    )}

                    <div className="flex flex-col">
                        <h4 className="text-white font-bold tracking-tight">Audio Explanation</h4>
                        <p className="text-slate-400 text-xs">AI narration of risks and summary</p>
                    </div>
                </div>

                {/* Visualizer */}
                <div className="flex-1 flex items-center gap-1 h-8 justify-center">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div
                            key={i}
                            className={`w-1 rounded-full bg-indigo-500 transition-all duration-300 ${isSpeaking ? 'animate-vibrate' : 'h-1.5 opacity-30'
                                }`}
                            style={{
                                height: isSpeaking ? `${Math.random() * 24 + 4}px` : '4px',
                                animationDelay: `${i * 0.1}s`
                            }}
                        ></div>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="bg-slate-800 text-slate-300 text-[10px] px-3 py-2 rounded-lg border-none focus:ring-1 focus:ring-indigo-500 outline-none w-40"
                    >
                        {voices.map((v) => (
                            <option key={v.name} value={v.name}>
                                {v.name.split(' ')[0]} ({v.lang})
                            </option>
                        ))}
                    </select>

                    <select
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        className="bg-slate-800 text-slate-300 text-[10px] px-3 py-2 rounded-lg border-none focus:ring-1 focus:ring-indigo-500 outline-none"
                    >
                        <option value="0.75">0.75x</option>
                        <option value="1">1.0x</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                    </select>
                </div>
            </div>

            <style jsx>{`
        @keyframes vibrate {
          0%, 100% { height: 4px; }
          50% { height: 24px; }
        }
        .animate-vibrate {
          animation: vibrate 0.5s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
}
