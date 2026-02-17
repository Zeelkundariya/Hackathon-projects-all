import { useState, useEffect } from 'react';
import {
    PulseIcon,
    AlertIcon,
    SearchIcon,
    CheckCircleIcon,
    ProjectIcon,
    ShieldCheckIcon
} from "@primer/octicons-react";

const ShadowProfile = ({ username, data }) => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTrait, setActiveTrait] = useState(null);

    const traitDetails = {
        "High Velocity": "Measured by commit frequency and consistent PR activity across multiple months.",
        "Massive Repository Footprint": "Based on the total number of non-forked repositories and significant code volume.",
        "Deep Implementation Depth": "Calculated from individual repository sizing (>500KB) and codebase complexity markers.",
        "Modular Patterns": "Detected usage of advanced folder structures (src/lib, components/ui) and SoC principles.",
        "Scalability Focus": "Presence of infrastructure-as-code or optimized backend service structures.",
        "System Design Driven": "Evidence of intentional design patterns like MVC, Hooks, or Service layers.",
        "Refinement Focused": "High density of refactoring-type commits and high code documentation grades.",
        "Complex Problem Solver": "Detected usage of advanced algorithms, state management, or complex API integrations.",
        "Language Specialist": "Demonstrated mastery with >70% density in a primary professional language.",
        "Growth Oriented": "Consistent project creation and introduction of new technologies over time.",
        "Tech-Explorer": "Diverse tech stack representation with successful multi-language project implementations.",
        "Consistent Learner": "Steady stream of activity and experimental 'learning' repositories detected."
    };

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                setError(null);
                const res = await fetch(`http://localhost:5000/shadow/${username}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ context: data })
                });
                if (!res.ok) throw new Error("Failed to benchmark against standards.");
                const json = await res.json();
                setAnalysis(json);
            } catch (err) {
                console.error("Shadow Analysis Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (data) fetchAnalysis();
    }, [username, data]);

    if (loading) return (
        <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '5rem', background: 'rgba(13, 17, 23, 0.8)', border: '1px solid var(--border-color)' }}>
            <div className="loading-spinner" style={{ width: 40, height: 40, border: "4px solid var(--border-color)", borderTopColor: "#58a6ff", borderRadius: "50%", margin: "0 auto 20px", animation: "spin 1s linear infinite" }}></div>
            <p style={{ color: '#58a6ff', fontWeight: 'bold' }}>Benchmarking against Silicon Valley standards...</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Analyzing architectural depth, testing coverage, and documentation maturity.</p>
        </div>
    );

    if (error) return (
        <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '3rem', color: '#f85149', background: 'rgba(248, 81, 73, 0.05)', borderRadius: '12px', border: '1px solid rgba(248, 81, 73, 0.2)', marginTop: '2rem' }}>
            <AlertIcon size={32} style={{ marginBottom: '1rem' }} />
            <strong>Analysis Failed:</strong> {error}
        </div>
    );

    if (!analysis) return null;

    return (
        <div className="card animate-fade-in" style={{ marginTop: '2rem', padding: '40px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, padding: '12px 24px', background: 'rgba(47, 129, 247, 0.1)', color: 'var(--accent-color)', borderRadius: '0 0 0 16px', fontSize: '0.7rem', fontWeight: '800', borderLeft: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '2px' }}>
                <ShieldCheckIcon size={14} /> BIG TECH ALIGNMENT AUDIT
            </div>

            <div style={{ marginBottom: '48px', maxWidth: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', color: 'var(--accent-color)' }}>
                    <PulseIcon size={24} />
                    <span style={{ fontWeight: '800', letterSpacing: '2px', fontSize: '0.8rem' }}>SIGNAL DECONSTRUCTION</span>
                </div>
                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.8rem', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>The Shadow Profile</h3>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem', lineHeight: '1.6' }}>
                    Benchmarking architectural depth and technical signaling against Senior Engineering standards at <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>Tier-1 Tech Firms</span>.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginBottom: '48px' }}>
                {analysis.benchmarks.map((b, i) => (
                    <div key={i} style={{
                        background: 'rgba(0,0,0,0.2)',
                        padding: '32px',
                        borderRadius: '20px',
                        border: '1px solid var(--border-color)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} className="benchmark-card">
                        <h4 style={{ margin: '0 0 24px 0', fontSize: '0.9rem', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>{b.category.toUpperCase()}</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: '800', letterSpacing: '1px', marginBottom: '4px' }}>YOUR SIGNAL</span>
                                <span style={{ fontSize: '1.4rem', fontWeight: '900', color: b.score > 70 ? 'var(--success-color)' : (b.score > 40 ? '#ffd700' : 'var(--error-color)'), lineHeight: 1 }}>
                                    {b.score}<span style={{ fontSize: '0.8rem', opacity: 0.5 }}>%</span>
                                </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.6rem', color: 'var(--accent-color)', fontWeight: '800', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>SNR BENCHMARK</span>
                                <span style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--accent-color)', opacity: 0.8, lineHeight: 1 }}>
                                    {b.topTier}%
                                </span>
                            </div>
                        </div>

                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative', marginBottom: '32px' }}>
                            <div style={{
                                width: `${b.score}%`,
                                height: '100%',
                                background: b.score > 70 ? 'var(--success-color)' : (b.score > 40 ? '#ffd700' : 'var(--error-color)'),
                                borderRadius: '4px',
                                boxShadow: `0 0 20px ${b.score > 70 ? 'rgba(57, 211, 83, 0.3)' : (b.score > 40 ? 'rgba(255, 215, 0, 0.3)' : 'rgba(248, 81, 73, 0.3)')}`,
                                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}></div>
                            <div style={{ position: 'absolute', left: `${b.topTier}%`, top: '-4px', width: '2px', height: '16px', background: 'var(--accent-color)', zIndex: 2, boxShadow: '0 0 10px var(--accent-glow)' }}>
                            </div>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--accent-color)' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--accent-color)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Gap Analysis:</span>
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{b.gap}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'stretch' }}>
                <div style={{ background: 'rgba(248, 81, 73, 0.02)', padding: '32px', borderRadius: '24px', border: '1px solid rgba(248, 81, 73, 0.1)', display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ color: 'var(--error-color)', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', letterSpacing: '1px' }}>
                        <AlertIcon size={20} /> STRATEGIC GROWTH TARGETS
                    </h4>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
                        {analysis.top3Gaps.map((gap, i) => (
                            <li key={i} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(248, 81, 73, 0.1)', color: 'var(--error-color)', display: 'grid', placeItems: 'center', fontSize: '0.8rem', fontWeight: '900', flexShrink: 0, border: '1px solid rgba(248, 81, 73, 0.2)' }}>
                                    {i + 1}
                                </span>
                                <div>
                                    <span style={{ fontWeight: '700', fontSize: '1rem', display: 'block', marginBottom: '6px', color: 'var(--text-primary)' }}>{gap.title || gap}</span>
                                    {gap.desc && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{gap.desc}</p>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(47, 129, 247, 0.1) 0%, rgba(188, 140, 255, 0.05) 100%)', padding: '48px 32px', borderRadius: '24px', border: '1px solid rgba(47, 129, 247, 0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    <SearchIcon size={200} style={{ position: 'absolute', top: '-40px', right: '-40px', opacity: 0.03, transform: 'rotate(-15deg)' }} />

                    <div style={{ marginBottom: '24px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: '800', opacity: 0.8 }}>AI PERSONA CLASSIFICATION</span>
                    </div>

                    <h2 style={{ color: '#f0f6fc', margin: '0 0 24px 0', textShadow: '0 0 40px rgba(47, 129, 247, 0.4)', fontSize: '2.2rem', lineHeight: '1.1', fontWeight: '900', letterSpacing: '-1px' }}>
                        {analysis.shadowPersona}
                    </h2>

                    <div style={{ position: 'relative' }}>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', opacity: 0.8, lineHeight: '1.6', margin: '0 0 24px 0', fontFamily: '"JetBrains Mono", monospace' }}>
                            {analysis.personaDetails?.desc}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                            {analysis.personaDetails?.traits.map((trait, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveTrait(activeTrait === trait ? null : trait)}
                                    style={{
                                        fontSize: '0.7rem',
                                        background: activeTrait === trait ? 'var(--accent-color)' : 'rgba(255,255,255,0.03)',
                                        color: activeTrait === trait ? 'white' : 'var(--accent-color)',
                                        padding: '6px 16px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(47, 129, 247, 0.3)',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        letterSpacing: '1px'
                                    }}
                                >
                                    {trait.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {activeTrait && (
                            <div style={{
                                marginTop: '16px',
                                padding: '16px',
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: '12px',
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-color)',
                                textAlign: 'left',
                                lineHeight: '1.5',
                                animation: 'messageSlide 0.3s ease-out'
                            }}>
                                <span style={{ color: 'var(--accent-color)', fontWeight: '800' }}>{activeTrait}:</span> {traitDetails[activeTrait] || "Direct inference from code structure patterns."}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
        .benchmark-card:hover {
          background: rgba(255,255,255,0.03) !important;
          border-color: var(--accent-color) !important;
          transform: translateY(-4px);
        }
        @keyframes messageSlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
};

export default ShadowProfile;
