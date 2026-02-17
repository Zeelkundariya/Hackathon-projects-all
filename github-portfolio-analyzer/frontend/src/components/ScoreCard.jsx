import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  OrganizationIcon,
  RepoIcon,
  GitCommitIcon,
  ZapIcon,
  TrophyIcon,
  StopIcon,
  PackageIcon,
  CodeIcon,
  HeartIcon,
  RocketIcon,
  StarIcon,
  RepoForkedIcon,
  IssueOpenedIcon,
  PulseIcon,
  ProjectIcon,
  ToolsIcon,
  CheckCircleIcon,
  XCircleIcon,
  FileCodeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  LawIcon,
  CpuIcon
} from "@primer/octicons-react";

export default function ScoreCard({ data }) {
  const reportRef = useRef();
  const [showAllRepos, setShowAllRepos] = useState(false);

  const getScoreColor = (score) => {
    if (score >= 85) return "#238636"; // Green
    if (score >= 65) return "#e3b341"; // Yellow
    if (score >= 40) return "#d29922"; // Orange
    return "#da3633"; // Red
  };

  const getTechIcon = (name) => {
    const techName = name.toLowerCase();
    if (techName.includes('react')) return <CpuIcon size={14} style={{ color: '#61dafb' }} />;
    if (techName.includes('js') || techName.includes('javascript')) return <FileCodeIcon size={14} style={{ color: '#f7df1e' }} />;
    if (techName.includes('ts') || techName.includes('typescript')) return <FileCodeIcon size={14} style={{ color: '#3178c6' }} />;
    if (techName.includes('html')) return <CodeIcon size={14} style={{ color: '#e34f26' }} />;
    if (techName.includes('css') || techName.includes('tailwind')) return <HeartIcon size={14} style={{ color: '#1572b6' }} />;
    if (techName.includes('python')) return <CpuIcon size={14} style={{ color: '#3776ab' }} />;
    if (techName.includes('node') || techName.includes('express')) return <ZapIcon size={14} style={{ color: '#339933' }} />;
    if (techName.includes('aws') || techName.includes('docker')) return <RocketIcon size={14} style={{ color: '#2496ed' }} />;
    return <PackageIcon size={14} style={{ color: 'var(--text-secondary)' }} />;
  };

  return (
    <div className="card animate-fade-in" ref={reportRef} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
      <div className="score-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '40px', marginBottom: '40px' }}>
        <div className="user-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <OrganizationIcon size={20} style={{ color: 'var(--accent-color)' }} />
            <span className="verdict" style={{ letterSpacing: '3px', fontSize: '0.8rem' }}>ENGINEERING AUDIT REPORT</span>
          </div>
          <h2 className="username" style={{ fontSize: '3.5rem', marginBottom: '12px' }}>{data.username}</h2>
          <div className="role-fit" style={{ fontSize: '0.9rem', padding: '8px 20px', letterSpacing: '0.5px' }}>
            {data.roleFit.toUpperCase()}
          </div>
        </div>

        <div className={`score-ring ${data.score >= 85 ? 'score-high' : data.score >= 65 ? 'score-good' : data.score >= 40 ? 'score-fair' : 'score-low'}`} style={{ width: '140px', height: '140px' }}>
          <div className="score-value" style={{ fontSize: '48px' }}>
            {data.score}
          </div>
          <span className="score-label" style={{ fontWeight: '800', opacity: 0.6 }}>RATING</span>
        </div>
      </div>

      <div className="stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div className="audit-stat-card" style={{
          background: 'rgba(255,255,255,0.02)',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(47, 129, 247, 0.1)', display: 'grid', placeItems: 'center', color: 'var(--accent-color)' }}>
            <RepoIcon size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Repositories</div>
            <strong style={{ fontSize: '1.4rem' }}>{data.totalRepos || 0}</strong>
          </div>
        </div>

        <div className="audit-stat-card" style={{
          background: 'rgba(255,255,255,0.02)',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(57, 211, 83, 0.1)', display: 'grid', placeItems: 'center', color: 'var(--success-color)' }}>
            <GitCommitIcon size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Signal Strength</div>
            <strong style={{ fontSize: '1.4rem' }}>{data.recentContributions}</strong>
          </div>
        </div>

        <div className="audit-stat-card" style={{
          background: 'rgba(255,255,255,0.02)',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(188, 140, 255, 0.1)', display: 'grid', placeItems: 'center', color: '#bc8cff' }}>
            <ZapIcon size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Consistency</div>
            <strong style={{ fontSize: '1.4rem' }}>{data.consistency || 'Stable'}</strong>
          </div>
        </div>
      </div>

      <div className="grid-layout" style={{ gap: '30px', marginBottom: '40px' }}>
        <div className="section" style={{ background: 'rgba(35, 134, 54, 0.03)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(57, 211, 83, 0.1)' }}>
          <h3 style={{ color: 'var(--success-color)', fontSize: '0.9rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrophyIcon size={18} /> PROJECT STRENGTHS
          </h3>
          {data.strengths.length > 0 ? (
            <ul className="list-check" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.strengths.map((s, i) => (
                <li key={i} style={{ fontSize: '0.95rem', color: 'var(--text-primary)', opacity: 0.9 }}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="empty-text">No clear strengths detected yet.</p>
          )}
        </div>

        <div className="section" style={{ background: 'rgba(248, 81, 73, 0.03)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(248, 81, 73, 0.1)' }}>
          <h3 style={{ color: 'var(--error-color)', fontSize: '0.9rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StopIcon size={18} /> ARCHITECTURAL GAPS
          </h3>
          {data.redFlags.length > 0 ? (
            <ul className="list-cross" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.redFlags.map((f, i) => (
                <li key={i} style={{ fontSize: '0.95rem', color: 'var(--text-primary)', opacity: 0.9 }}>{f}</li>
              ))}
            </ul>
          ) : (
            <p className="empty-text" style={{ color: 'var(--success-color)' }}>No critical gaps identified.</p>
          )}
        </div>
      </div>

      <div className="grid-layout" style={{ gap: '30px', marginBottom: '40px' }}>
        <div className="section">
          <h3 style={{ fontSize: '0.85rem', marginBottom: '20px', letterSpacing: '1px' }}>
            <CodeIcon size={18} style={{ marginRight: '8px', color: 'var(--accent-color)' }} /> TECH STACK DISTRIBUTION
          </h3>
          {data.techStack && data.techStack.length > 0 ? (
            <div className="lang-bars" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {data.techStack.map((t, i) => (
                <div key={i} className="lang-row" style={{ display: 'grid', gridTemplateColumns: '120px 1fr 40px', alignItems: 'center', gap: '15px' }}>
                  <div className="lang-name-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getTechIcon(t.name)}
                    <span className="lang-name" style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{t.name}</span>
                  </div>
                  <div className="lang-bar-bg" style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                    <div className="lang-bar-fill" style={{
                      width: `${Math.min(t.count * 20, 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--accent-color), #bc8cff)',
                      boxShadow: '0 0 10px var(--accent-glow)'
                    }}></div>
                  </div>
                  <span className="lang-pct" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>x{t.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-text">No technical markers found.</p>
          )}
        </div>

        <div className="section" style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '0.85rem', marginBottom: '20px', letterSpacing: '1px' }}>
            <PulseIcon size={18} style={{ marginRight: '8px', color: 'var(--success-color)' }} /> ECOSYSTEM VITALITY
          </h3>
          {data.communityHealth ? (
            <div className="health-stats" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div className="health-score" style={{
                padding: '20px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <span className="health-val" style={{ fontSize: '2rem', display: 'block' }}>
                  {data.communityHealth.healthScore}
                </span>
                <span className="health-lbl" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>VITALITY INDEX</span>
              </div>
              <div className="health-metrics" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}><LawIcon size={12} style={{ marginRight: '6px' }} /> {data.communityHealth.licenseCount} Licenses</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}><RepoForkedIcon size={12} style={{ marginRight: '6px' }} /> {data.communityHealth.totalForks} Forks</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}><IssueOpenedIcon size={12} style={{ marginRight: '6px' }} /> {data.communityHealth.openIssues} Issues</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}><PulseIcon size={12} style={{ marginRight: '6px' }} /> {data.communityHealth.avgActivity} Avg/Repo</div>
              </div>
            </div>
          ) : <p className="empty-text">Ecosystem data unavailable.</p>}
        </div>
      </div>

      {/* NEW: Live Demos Section */}
      {data.demoRepos && data.demoRepos.length > 0 && (
        <div className="section full-width">
          <h3><RocketIcon size={20} style={{ marginRight: '8px', color: '#f0f6fc' }} /> Live Project Showcase</h3>
          <div className="demo-grid">
            {data.demoRepos.map((repo, i) => (
              <div key={i} className="demo-card">
                <a href={repo.demo} target="_blank" rel="noreferrer" className="demo-link-btn">
                  View Live Demo ↗
                </a>
                <div className="demo-details">
                  <strong>{repo.name}</strong>
                  <span className="demo-host" style={{ fontSize: '0.8rem', color: '#8b949e', display: 'block', marginBottom: 5 }}>
                    Deployed on {repo.host}
                  </span>
                  <span className="demo-desc">
                    {repo.desc.length > 60 ? repo.desc.substring(0, 60) + "..." : repo.desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.repoFeedback && data.repoFeedback.length > 0 && (
        <div className="section full-width">
          <h3><ProjectIcon size={20} style={{ marginRight: '8px', color: '#58a6ff' }} /> Project Analysis (Showcase)</h3>
          <div className="repo-grid">
            {data.repoFeedback.map((repo, i) => (
              <div key={i} className="repo-card-detail">
                <div className="repo-header">
                  <a href={repo.url} target="_blank" rel="noreferrer" className="repo-link">{repo.name}</a>
                  <span className={`repo-grade grade-${repo.grade.replace('+', '-plus')}`}>{repo.grade}</span>
                </div>
                <div className="repo-stats-row">
                  <span><StarIcon size={12} /> {repo.stars}</span>
                  <span><RepoForkedIcon size={12} /> {repo.forks}</span>
                  <span><CodeIcon size={12} /> {repo.language}</span>
                </div>
                <p className="repo-tip"><ZapIcon size={14} style={{ color: '#d29922' }} /> <strong>Tip:</strong> {repo.tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="priority-fixes">
        <h3><ToolsIcon size={20} style={{ marginRight: '8px', color: '#f85149' }} /> Priority Fixes (High Impact)</h3>
        {data.priorityFixes.length > 0 ? (
          <div className="fix-cards">
            {data.priorityFixes.map((repo, i) => (
              <div key={i} className="fix-card">
                <strong>{repo.name}</strong>
                <p>{repo.issues.join(", ")}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-text">No urgent fixes needed!</p>
        )}
      </div>

      <div className="all-repos-section" style={{ marginBottom: '32px' }}>
        <button
          onClick={() => setShowAllRepos(!showAllRepos)}
          className="dropdown-toggle"
          style={{
            width: '100%',
            background: 'rgba(56, 139, 253, 0.1)',
            border: '1px solid rgba(56, 139, 253, 0.2)',
            color: '#58a6ff',
            padding: '12px',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
        >
          <span>
            <RepoIcon size={16} /> Full Project Analysis
            {data.allRepos === undefined ? " (Server Restart Required)" : ` (${data.allRepos?.length || 0} Repos)`}
            {data.generatedAt && <span style={{ fontSize: '9px', opacity: 0.6, marginLeft: '10px' }}>• Live</span>}
          </span>
          <span>{showAllRepos ? <ChevronUpIcon /> : <ChevronDownIcon />}</span>
        </button>

        {showAllRepos && data.allRepos && (
          <div className="dropdown-content animate-fade-in" style={{ marginTop: '16px' }}>
            <div className="repo-grid">
              {data.allRepos.length > 0 ? (
                data.allRepos.map((repo, i) => (
                  <div key={i} className="repo-card-detail" style={{ opacity: repo.isFork ? 0.7 : 1, position: 'relative' }}>
                    <div className="repo-header" style={{ marginBottom: '8px', border: 'none', padding: 0 }}>
                      <a href={repo.url} target="_blank" rel="noreferrer" className="repo-link" style={{ fontSize: '14px' }}>
                        {repo.name} {repo.isFork && <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>(Fork)</span>}
                      </a>
                      {i < 3 && repo.activityScore > 0 && (
                        <span style={{ fontSize: '10px', background: 'rgba(56, 139, 253, 0.2)', color: '#58a6ff', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>TOP ACTIVITY</span>
                      )}
                    </div>
                    <div className="repo-stats-row" style={{ fontSize: '11px', marginBottom: '8px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      <span className="stat-badge" style={{ background: 'rgba(56, 139, 253, 0.1)', padding: '2px 8px', borderRadius: '12px' }}><StarIcon size={10} /> {repo.stars}</span>
                      <span className="stat-badge" style={{ background: 'rgba(56, 139, 253, 0.1)', padding: '2px 8px', borderRadius: '12px' }}><RepoForkedIcon size={10} /> {repo.forks}</span>
                      <span className="stat-badge" style={{ background: 'rgba(56, 139, 253, 0.1)', padding: '2px 8px', borderRadius: '12px' }}><CodeIcon size={10} /> {repo.language}</span>
                      <span className="stat-badge" style={{ background: 'rgba(46, 160, 67, 0.1)', color: '#3fb950', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}><GitCommitIcon size={10} /> {repo.recentCommits} Commits</span>
                      <span className="stat-badge" style={{ background: 'rgba(56, 139, 253, 0.1)', padding: '2px 8px', borderRadius: '12px' }}><CpuIcon size={10} /> {(repo.size / 1024).toFixed(1)} MB</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0', lineHeight: '1.4' }}>
                      {repo.description}
                    </p>
                    <p style={{ fontSize: '10px', opacity: 0.5, margin: 0 }}>
                      Last update: {new Date(repo.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="empty-text" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px' }}>
                  No repositories found for this user.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="potential-score-container animate-fade-in" style={{ marginTop: '40px' }}>
        <div className="projection-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <RocketIcon size={18} style={{ color: 'var(--accent-color)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1.5px', color: 'var(--text-secondary)' }}>ENGINEERING SIGNAL PROJECTION</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', opacity: 0.8 }}>Projected growth corridor after technical optimizations.</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--accent-color)', fontWeight: '800', letterSpacing: '1px', marginBottom: '4px' }}>PROJECTED TARGET</div>
            <div style={{ fontSize: '2rem', fontWeight: '950', color: 'var(--text-primary)', lineHeight: 1 }}>{data.potentialScore}<span style={{ fontSize: '1rem', opacity: 0.5 }}>%</span></div>
          </div>
        </div>

        <div className="projection-track" style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', position: 'relative', marginBottom: '20px' }}>
          <div className="projection-bar-baseline" style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${data.score}%`, background: 'var(--accent-color)', borderRadius: '6px', zIndex: 2 }}></div>
          <div className="projection-bar-corridor" style={{ position: 'absolute', top: 0, left: `${data.score}%`, height: '100%', width: `${Math.max(0, data.potentialScore - data.score)}%`, background: 'rgba(47, 129, 247, 0.3)', zIndex: 1 }}></div>
        </div>

        <div className="projection-legend" style={{ display: 'flex', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-color)' }}></div>
            <span>BASELINE: {data.score}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(47, 129, 247, 0.4)', border: '1px solid var(--accent-color)' }}></div>
            <span>OPTIMIZATION CORRIDOR: +{Math.max(0, data.potentialScore - data.score)}%</span>
          </div>
        </div>
      </div>

      {data.aiFeedback && (
        <div className="section full-width ai-verdict-container" style={{
          marginTop: '40px',
          padding: '30px',
          background: 'rgba(56, 139, 253, 0.03)',
          borderRadius: '16px',
          border: '1px solid rgba(56, 139, 253, 0.15)',
          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <CpuIcon size={24} style={{ color: '#58a6ff' }} />
            <h3 style={{ margin: 0, color: '#58a6ff' }}>AI Recruiter Verdict: Technical Audit</h3>
          </div>
          <div className="prose markdown-feedback" style={{
            fontSize: '14px',
            lineHeight: '1.7',
            color: '#c9d1d9',
            maxHeight: 'none'
          }}>
            <ReactMarkdown>{data.aiFeedback}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
