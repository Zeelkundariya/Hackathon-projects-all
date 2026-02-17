import { useState, useEffect } from 'react';
import {
    RocketIcon,
    AlertIcon,
    ToolsIcon,
    ZapIcon,
    TrophyIcon
} from "@primer/octicons-react";

const RevivalEngine = ({ username, repos }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                setError(null);
                const res = await fetch(`http://localhost:5000/revival/${username}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ repos })
                });
                if (!res.ok) throw new Error("Failed to generate revival plans.");
                const json = await res.json();
                setPlans(json.plans || []);
            } catch (err) {
                console.error("Revival Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (repos && repos.length > 0) fetchPlans();
    }, [username, repos]);

    if (error) return (
        <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '3rem', color: '#f85149', background: 'rgba(248, 81, 73, 0.05)', borderRadius: '12px', border: '1px solid rgba(248, 81, 73, 0.2)', marginTop: '2rem' }}>
            <AlertIcon size={32} style={{ marginBottom: '1rem' }} />
            <strong>Revival Error:</strong> {error}
        </div>
    );

    if (loading) return (
        <div className="card animate-fade-in" style={{ textAlign: 'center', padding: '5rem', background: 'rgba(13, 17, 23, 0.8)', border: '1px solid var(--border-color)' }}>
            <div className="loading-spinner" style={{ width: 40, height: 40, border: "4px solid var(--border-color)", borderTopColor: "#58a6ff", borderRadius: "50%", margin: "0 auto 20px", animation: "spin 1s linear infinite" }}></div>
            <p style={{ color: '#58a6ff', fontWeight: 'bold' }}>Identifying high-potential projects for revival...</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Scanning for projects that can become Tier-1 Portfolio Pieces with minor polish.</p>
        </div>
    );

    return (
        <div className="card animate-fade-in" style={{ marginTop: '2rem', padding: '40px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(47, 129, 247, 0.1)', display: 'grid', placeItems: 'center', color: 'var(--accent-color)' }}>
                    <RocketIcon size={24} />
                </div>
                <div>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem', letterSpacing: '-0.5px' }}>Repository Revival Engine</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Identifying architectural polish opportunities for Tier-1 signaling.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
                {plans.map((plan, i) => (
                    <div key={i} style={{
                        background: 'rgba(0,0,0,0.2)',
                        padding: '32px',
                        borderRadius: '24px',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative'
                    }} className="revival-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h4 style={{ color: 'var(--accent-color)', margin: 0, fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px' }}>{plan.repo}</h4>
                            <span style={{ fontSize: '0.65rem', background: 'rgba(255, 215, 0, 0.1)', color: '#ffd700', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255, 215, 0, 0.2)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                <TrophyIcon size={12} style={{ marginRight: '6px' }} /> TIER-1 POTENTIAL
                            </span>
                        </div>

                        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', borderLeft: '4px solid var(--accent-color)', fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                            "{plan.why}"
                        </div>

                        <div style={{ flex: 1 }}>
                            <h5 style={{ marginBottom: '16px', fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', letterSpacing: '1px' }}>
                                <ToolsIcon size={16} /> WEEKEND MISSION LOG:
                            </h5>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {plan.tasks.map((task, j) => (
                                    <li key={j} style={{ display: 'flex', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-color)', opacity: 0.5 }}></div>
                                        {task}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div style={{ marginTop: 'auto', background: 'rgba(57, 211, 83, 0.03)', padding: '24px', borderRadius: '16px', border: '1px dashed rgba(57, 211, 83, 0.2)' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--success-color)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                <ZapIcon size={14} /> IMPACT UPGRADE
                            </span>
                            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.5', opacity: 0.9 }}>{plan.bonus}</p>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
        .revival-card:hover {
          background: rgba(255,255,255,0.03) !important;
          border-color: var(--accent-color) !important;
          transform: translateY(-4px);
        }
      `}</style>
        </div>
    );
};

export default RevivalEngine;
