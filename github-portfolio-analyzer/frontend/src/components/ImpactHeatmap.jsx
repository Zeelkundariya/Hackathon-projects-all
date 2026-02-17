import { useState, useEffect } from 'react';
import {
    FlameIcon,
    AlertIcon,
    TrophyIcon,
    FileCodeIcon,
    GitCommitIcon,
    DotIcon
} from "@primer/octicons-react";

const ImpactHeatmap = ({ username, events }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchImpact = async () => {
            try {
                setError(null);
                const res = await fetch(`http://localhost:5000/impact/${username}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ events })
                });
                if (!res.ok) throw new Error("Failed to classify engineering impact.");
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error("Impact Analysis Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (events && events.length > 0) fetchImpact();
    }, [username, events]);

    if (error) return (
        <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '3rem', color: '#f85149', background: 'rgba(248, 81, 73, 0.05)', borderRadius: '12px', border: '1px solid rgba(248, 81, 73, 0.2)', marginTop: '2rem' }}>
            <AlertIcon size={32} style={{ marginBottom: '1rem' }} />
            <strong>Impact Error:</strong> {error}
        </div>
    );

    if (loading) return (
        <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '5rem', background: 'rgba(13, 17, 23, 0.8)', border: '1px solid var(--border-color)' }}>
            <div className="loading-spinner" style={{ width: 40, height: 40, border: "4px solid var(--border-color)", borderTopColor: "#58a6ff", borderRadius: "50%", margin: "0 auto 20px", animation: "spin 1s linear infinite" }}></div>
            <p style={{ color: '#58a6ff', fontWeight: 'bold' }}>Classifying engineering impact across your commits...</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Moving beyond generic quantity to measure technical complexity and architectural contribution.</p>
        </div>
    );

    if (!data) return null;

    const getLevelColor = (level) => {
        const colors = [
            'rgba(255,255,255,0.05)', // 0
            '#0e4429', // 1: Routine
            '#006d32', // 2: Minor Feature
            '#26a641', // 3: Major Feature
            '#39d353', // 4: Refactor
            '#ffd700'  // 5: Architecture/System Impact (Gold)
        ];
        return colors[level] || colors[0];
    };

    const getLevelName = (level) => {
        const names = ["None", "Routine", "Support", "Feature", "Refactor", "Architecture"];
        return names[level] || "Routine";
    };

    return (
        <div className="card animate-fade-in" style={{ marginTop: '2rem', padding: '40px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(47, 129, 247, 0.1)', display: 'grid', placeItems: 'center', color: 'var(--accent-color)' }}>
                    <FlameIcon size={24} />
                </div>
                <div>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem', letterSpacing: '-0.5px' }}>Signal Density Heatmap</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Recursive classification of engineering impact across project timelines.</p>
                </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '32px', borderRadius: '20px', border: '1px solid var(--border-color)', marginBottom: '40px', boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
                    {data.impactDays.map((day, i) => (
                        <div
                            key={i}
                            title={`${day.date}: ${getLevelName(day.level)} [${day.type}] - ${day.summary}`}
                            style={{
                                width: '18px',
                                height: '18px',
                                background: getLevelColor(day.level),
                                borderRadius: '4px',
                                cursor: 'help',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                border: day.level === 5 ? '1px solid #ffd70066' : '1px solid transparent',
                                boxShadow: day.level === 5 ? '0 0 15px rgba(255, 215, 0, 0.3)' : 'none'
                            }}
                            className="heatmap-cell"
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.4)';
                                e.currentTarget.style.zIndex = '10';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.zIndex = '1';
                            }}
                        ></div>
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '0.7rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {[1, 3, 5].map(lvl => (
                        <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '10px', height: '10px', background: getLevelColor(lvl), borderRadius: '2px' }}></div>
                            <span style={{ fontWeight: '700', color: lvl === 5 ? '#ffd700' : 'inherit' }}>{getLevelName(lvl)}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, rgba(47, 129, 247, 0.05) 0%, rgba(188, 140, 255, 0.05) 100%)', padding: '32px', borderRadius: '20px', border: '1px solid rgba(47, 129, 247, 0.15)', marginBottom: '40px', position: 'relative', overflow: 'hidden' }}>
                <TrophyIcon size={140} style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.03, transform: 'rotate(15deg)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    <TrophyIcon size={14} style={{ color: '#ffd700' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-color)', letterSpacing: '2px' }}>CLASSIFIED ACHIEVEMENT</span>
                </div>
                <p style={{ fontSize: '1.6rem', margin: 0, color: '#f0f6fc', fontWeight: '800', lineHeight: '1.3', letterSpacing: '-0.5px' }}>{data.topAchievement}</p>
            </div>

            <div>
                <h4 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', letterSpacing: '1px' }}>
                    <FileCodeIcon size={20} style={{ color: 'var(--accent-color)' }} /> HIGH-IMPACT SYSTEM LOG
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {data.impactDays.filter(d => d.level >= 3).slice(0, 10).map((day, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            padding: '24px',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '16px',
                            border: '1px solid var(--border-color)',
                            transition: 'all 0.3s'
                        }} className="log-item">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: day.level === 5 ? 'rgba(255, 215, 0, 0.1)' : 'rgba(47, 129, 247, 0.1)',
                                        color: day.level === 5 ? '#ffd700' : 'var(--accent-color)',
                                        border: '1px solid currentColor',
                                        fontWeight: '800',
                                        fontFamily: '"JetBrains Mono", monospace'
                                    }}>
                                        {day.type.toUpperCase()}
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontFamily: '"JetBrains Mono", monospace', opacity: 0.6 }}>[{day.date}]</span>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {day.repos?.map((repo, idx) => (
                                        <span key={idx} style={{
                                            fontSize: '0.65rem',
                                            color: 'var(--text-secondary)',
                                            background: 'rgba(255,255,255,0.03)',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            border: '1px solid var(--border-color)',
                                            fontFamily: '"JetBrains Mono", monospace'
                                        }}>
                                            {repo}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: '700', display: 'block', marginBottom: '12px', lineHeight: '1.4' }}>
                                    {day.summary}
                                </span>
                                {day.highlights && day.highlights.length > 0 && (
                                    <div style={{ paddingLeft: '16px', borderLeft: '2px solid rgba(47, 129, 247, 0.2)', fontFamily: '"JetBrains Mono", monospace' }}>
                                        {day.highlights
                                            .filter(h => h.split('\n')[0] !== day.summary)
                                            .map((h, hi) => (
                                                <div key={hi} style={{
                                                    fontSize: '0.8rem',
                                                    color: 'var(--text-secondary)',
                                                    marginBottom: '8px',
                                                    display: 'flex',
                                                    gap: '10px',
                                                    alignItems: 'flex-start'
                                                }}>
                                                    <span style={{ color: 'var(--accent-color)', opacity: 0.5 }}>→</span>
                                                    <span>{h.split('\n')[0]}</span>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {data.impactDays.filter(d => d.level >= 3).length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)', borderRadius: '16px' }}>
                            No critical impact events detected. Sustained technical contribution required to generate log telemetry.
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .log-item:hover {
          background: rgba(255,255,255,0.02) !important;
          border-color: var(--accent-color) !important;
          transform: translateX(4px);
        }
      `}</style>
        </div>
    );
};

export default ImpactHeatmap;
