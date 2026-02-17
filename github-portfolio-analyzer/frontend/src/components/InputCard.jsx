import { useState } from "react";
import { MarkGithubIcon } from "@primer/octicons-react";

export default function InputCard({ onAnalyze, loading }) {
  const [input, setInput] = useState("");

  const handleAnalyze = () => {
    if (!input.trim()) return;

    let username = input.trim();
    // Simple logic to extract username if a URL is pasted
    // Handles: https://github.com/username, github.com/username, https://github.com/username/repo
    if (username.includes("github.com")) {
      try {
        const urlObj = new URL(username.startsWith("http") ? username : `https://${username}`);
        const pathParts = urlObj.pathname.split("/").filter(p => p);
        if (pathParts.length > 0) {
          username = pathParts[0];
        }
      } catch (e) {
        // Fallback or ignore invalid URL
        console.error("Invalid URL format", e);
      }
    }

    onAnalyze(username);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleAnalyze();
    }
  };

  return (
    <div className="card input-group animate-fade-in" style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
      <input
        className="input-field"
        placeholder="Enter GitHub username or profile URL..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{ fontSize: '1.1rem' }}
      />
      <button
        className="btn-primary"
        onClick={handleAnalyze}
        disabled={loading || !input.trim()}
      >
        {loading ? (
          <>
            <div className="mini-spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></div>
            Analyzing...
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MarkGithubIcon size={20} />
            <span style={{ fontWeight: '700', letterSpacing: '0.5px' }}>ANALYZE PROFILE</span>
          </div>
        )}
      </button>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
