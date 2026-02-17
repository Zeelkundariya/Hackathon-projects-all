import { useState, useEffect, useMemo, useRef } from 'react';
import {
    RepoIcon,
    FileDirectoryIcon,
    FileIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    AlertIcon,
    ProjectIcon
} from "@primer/octicons-react";

/**
 * VisualMap Component
 * Overhauled with a premium 'Engineering Platform' aesthetic.
 * Features advanced glassmorphism, refined typography, and a technical file explorer.
 */
const VisualMap = ({ username, repos }) => {
    const [selectedRepo, setSelectedRepo] = useState('');
    const [tree, setTree] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedFolders, setExpandedFolders] = useState(new Set(['']));
    const [showSelector, setShowSelector] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (selectedRepo) fetchTree();
        else setTree(null);
    }, [selectedRepo]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowSelector(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchTree = async () => {
        setLoading(true);
        try {
            setError(null);
            const res = await fetch(`http://localhost:5000/xray/${username}/${selectedRepo}`);
            if (!res.ok) throw new Error("Failed to fetch repository structure.");
            const data = await res.json();
            setTree(data);
            setExpandedFolders(new Set(['']));
        } catch (err) {
            console.error("X-Ray Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleFolder = (path) => {
        const next = new Set(expandedFolders);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        setExpandedFolders(next);
    };

    const sortedTree = useMemo(() => {
        if (!tree) return [];
        return [...tree].sort((a, b) => {
            if (a.type === b.type) return a.path.localeCompare(b.path);
            return a.type === 'tree' ? -1 : 1;
        });
    }, [tree]);

    const renderTreeContent = () => {
        if (!sortedTree.length) return null;
        const filtered = sortedTree.filter(item => {
            const parts = item.path.split('/');
            if (parts.length === 1) return true;
            const parentPath = parts.slice(0, -1).join('/');
            return expandedFolders.has(parentPath);
        });
        const displayed = filtered.slice(0, 100);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: '"JetBrains Mono", monospace' }}>
                {displayed.map((item, i) => {
                    const depth = item.path.split('/').length - 1;
                    const isFolder = item.type === 'tree';
                    const isExpanded = expandedFolders.has(item.path);

                    return (
                        <div
                            key={i}
                            onClick={() => isFolder && toggleFolder(item.path)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '8px 16px',
                                background: 'transparent',
                                cursor: isFolder ? 'pointer' : 'default',
                                fontSize: '0.85rem',
                                marginLeft: depth * 24,
                                borderRadius: '8px',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                borderLeft: `2px solid ${isFolder ? (isExpanded ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)') : 'transparent'}`
                            }}
                            className="explorer-item"
                        >
                            <span style={{ width: '24px', textAlign: 'center', display: 'flex', justifyContent: 'center', color: isFolder ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                                {isFolder ? <FileDirectoryIcon size={16} /> : <FileIcon size={16} />}
                            </span>
                            <span style={{
                                color: isFolder ? 'var(--text-primary)' : 'var(--text-secondary)',
                                fontWeight: isFolder ? '700' : '400'
                            }}>
                                {item.path.split('/').pop()}
                            </span>
                            {isFolder && (
                                <span style={{ color: 'var(--text-secondary)', marginLeft: 'auto', opacity: 0.4 }}>
                                    {isExpanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
                                </span>
                            )}
                        </div>
                    );
                })}
                {filtered.length > 100 && (
                    <div style={{ padding: '24px', color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.75rem', textAlign: 'center', opacity: 0.6 }}>
                        -- BUFFER LIMIT REACHED: 100 ASSETS DISPLAYED --
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="card animate-fade-in" style={{ marginTop: '2rem', padding: '40px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(47, 129, 247, 0.1)', display: 'grid', placeItems: 'center', color: 'var(--accent-color)' }}>
                        <ProjectIcon size={24} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem', letterSpacing: '-0.5px' }}>Codebase Architecture</h3>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Recursive structural analysis of selected repository assets.</p>
                    </div>
                </div>

                <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <button
                        onClick={() => setShowSelector(!showSelector)}
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                        }}
                        className="repo-selector-btn"
                    >
                        {selectedRepo ? selectedRepo : "Select Intelligence Asset..."}
                        <ChevronDownIcon size={16} />
                    </button>

                    {showSelector && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 12px)',
                            right: 0,
                            width: '320px',
                            maxHeight: '400px',
                            background: 'var(--obsidian-deep)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '16px',
                            zIndex: 100,
                            overflowY: 'auto',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                            animation: 'messageSlide 0.2s ease-out'
                        }}>
                            {repos.map(r => (
                                <div
                                    key={r.name}
                                    onClick={() => { setSelectedRepo(r.name); setShowSelector(false); }}
                                    style={{
                                        padding: '16px 24px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid var(--border-color)',
                                        color: selectedRepo === r.name ? 'var(--accent-color)' : 'var(--text-secondary)',
                                        fontSize: '0.9rem',
                                        transition: 'all 0.2s',
                                        background: selectedRepo === r.name ? 'rgba(47, 129, 247, 0.05)' : 'transparent'
                                    }}
                                    className="repo-option"
                                >
                                    <RepoIcon size={14} style={{ marginRight: '10px' }} />
                                    {r.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {loading && (
                <div style={{ padding: '80px', textAlign: 'center' }}>
                    <div className="loading-spinner" style={{ width: 48, height: 48, border: "4px solid rgba(255,255,255,0.1)", borderTopColor: "var(--accent-color)", borderRadius: "50%", margin: "0 auto 24px", animation: "spin 1s linear infinite" }}></div>
                    <p style={{ color: 'var(--accent-color)', fontWeight: '700', letterSpacing: '1px' }}>DECONSTRUCTING ARCHITECTURE...</p>
                </div>
            )}

            {error && (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--error-color)', background: 'rgba(248, 81, 73, 0.05)', borderRadius: '16px', border: '1px solid rgba(248, 81, 73, 0.1)' }}>
                    <AlertIcon size={32} style={{ marginBottom: '16px' }} />
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{error}</p>
                </div>
            )}

            {!loading && !error && tree && (
                <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '40px',
                    borderRadius: '24px',
                    border: '1px solid var(--border-color)',
                    maxHeight: '600px',
                    overflow: 'auto',
                    boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.4)'
                }} className="file-tree-container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', color: 'var(--accent-color)', fontSize: '0.8rem', fontWeight: '800', letterSpacing: '2px' }}>
                        <FileDirectoryIcon size={16} /> ROOT_EXPLORER
                    </div>
                    {renderTreeContent()}
                </div>
            )}

            {!loading && !error && !tree && (
                <div style={{
                    textAlign: 'center',
                    padding: '80px 40px',
                    color: 'var(--text-secondary)',
                    border: '2px dashed var(--border-color)',
                    borderRadius: '24px',
                    background: 'rgba(255,255,255,0.01)'
                }}>
                    <div style={{ marginBottom: '24px', opacity: 0.1 }}>
                        <ProjectIcon size={80} />
                    </div>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1.2rem' }}>Awaiting Target Signal</h4>
                    <p style={{ fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>Select a repository from the telemetry selector to initiate architectural deconstruction.</p>
                </div>
            )}

            <style>{`
                .explorer-item:hover {
                    background: rgba(255,255,255,0.03) !important;
                    transform: translateX(4px);
                }
                .repo-selector-btn:hover { background: rgba(255,255,255,0.06); border-color: var(--accent-color); }
                .repo-option:hover { background: rgba(255,255,255,0.03); color: var(--text-primary); }
                .file-tree-container::-webkit-scrollbar { width: 4px; }
                .file-tree-container::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes messageSlide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default VisualMap;
