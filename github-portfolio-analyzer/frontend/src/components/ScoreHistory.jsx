import { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts';
import { GraphIcon } from "@primer/octicons-react";

const ScoreHistory = ({ username, lastUpdated }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`http://localhost:5000/history/${username}`);
                if (res.ok) {
                    const data = await res.json();
                    // Format data for the chart - ensure uniqueness in labels if needed
                    const formattedData = data.map((item, index) => {
                        // Handle potential date string from SQLite vs new integer timestamp
                        const timestamp = isNaN(item.timestamp) ? item.timestamp + " Z" : parseInt(item.timestamp);
                        const dateObj = new Date(timestamp);

                        return {
                            score: item.score,
                            timeLabel: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            date: dateObj.toLocaleDateString(),
                            fullDate: dateObj.toLocaleString(),
                            timestamp: dateObj.getTime()
                        };
                    }).sort((a, b) => a.timestamp - b.timestamp);
                    setHistory(formattedData);
                }
            } catch (err) {
                console.error("Failed to fetch history:", err);
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchHistory();
        }
    }, [username, lastUpdated]);

    if (loading) return null;

    return (
        <div className="card animate-fade-in" style={{ marginTop: '2rem', padding: '40px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(47, 129, 247, 0.1)', display: 'grid', placeItems: 'center', color: 'var(--accent-color)' }}>
                    <GraphIcon size={24} />
                </div>
                <div>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem', letterSpacing: '-0.5px' }}>Score Analytics History</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Longitudinal tracking of engineering signal evolution.</p>
                </div>
            </div>

            {history.length >= 2 ? (
                <>
                    <div style={{ width: '100%', height: 350, background: 'rgba(0,0,0,0.2)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.4)' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis
                                    dataKey="timeLabel"
                                    stroke="var(--text-secondary)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                    fontFamily='"JetBrains Mono", monospace'
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    stroke="var(--text-secondary)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                    fontFamily='"JetBrains Mono", monospace'
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--obsidian-deep)',
                                        borderColor: 'var(--glass-border)',
                                        borderRadius: '12px',
                                        color: 'var(--text-primary)',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                        padding: '16px',
                                        fontSize: '0.9rem',
                                        fontFamily: '"JetBrains Mono", monospace'
                                    }}
                                    itemStyle={{ color: 'var(--accent-color)', fontWeight: '800' }}
                                    labelStyle={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.7rem' }}
                                    labelFormatter={(value, payload) => payload[0]?.payload.fullDate || value}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="var(--accent-color)"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorScore)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: '24px', padding: '16px 24px', background: 'rgba(47, 129, 247, 0.05)', borderRadius: '12px', border: '1px solid rgba(47, 129, 247, 0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-color)', boxShadow: '0 0 10px var(--accent-glow)' }}></div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                            Systematic tracking enabled. Your engineering signal is being mapped across time-series data to identify long-term growth vectors.
                        </p>
                    </div>
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '60px 40px', border: '2px dashed var(--border-color)', borderRadius: '24px', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ marginBottom: '24px', opacity: 0.1 }}>
                        <GraphIcon size={64} />
                    </div>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1.2rem' }}>Awaiting Analytical History</h4>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
                        Initial capture complete. Subsequent audits will generate the time-series markers required for architectural trend analysis.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ScoreHistory;
