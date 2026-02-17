import { useState, useEffect, useRef } from 'react';
import {
    SearchIcon,
    PaperAirplaneIcon
} from "@primer/octicons-react";

const RecruiterChat = ({ username, context }) => {
    const [messages, setMessages] = useState([
        { role: 'model', content: "Hello! I'm the Lead Technical Recruiter here. I've analyzed your GitHub portfolio. Ready for a quick technical deep-dive into your work?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch(`http://localhost:5000/chat/${username}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages, context })
            });

            const data = await res.json();
            if (data.reply) {
                setMessages([...newMessages, { role: 'model', content: data.reply }]);
            }
        } catch (err) {
            console.error("Chat Error:", err);
            setMessages([...newMessages, { role: 'model', content: "Sorry, I lost my connection to the server. Let's try again in a moment." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card animate-fade-in" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', height: '600px', padding: '0', overflow: 'hidden', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(47, 129, 247, 0.1)', display: 'grid', placeItems: 'center', color: 'var(--accent-color)' }}>
                    <SearchIcon size={20} />
                </div>
                <div>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '800', letterSpacing: '0.5px' }}>RECRUITER SIMULATOR</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>AI-driven technical audit interview module.</p>
                </div>
            </div>

            <div
                ref={scrollRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    background: 'rgba(0,0,0,0.2)'
                }}
                className="chat-scroll-area"
            >
                {messages.map((m, i) => (
                    <div
                        key={i}
                        style={{
                            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                            padding: '16px 24px',
                            borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                            background: m.role === 'user' ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${m.role === 'user' ? 'rgba(255,255,255,0.2)' : 'var(--border-color)'}`,
                            fontSize: '0.95rem',
                            lineHeight: '1.6',
                            color: 'white',
                            boxShadow: m.role === 'user' ? '0 4px 15px var(--accent-glow)' : 'none',
                            animation: 'messageSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        {m.content}
                    </div>
                ))}
                {loading && (
                    <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '6px', padding: '16px 24px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                        <div className="dot" style={{ width: '8px', height: '8px', background: 'var(--accent-color)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></div>
                        <div className="dot" style={{ width: '8px', height: '8px', background: 'var(--accent-color)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.16s' }}></div>
                        <div className="dot" style={{ width: '8px', height: '8px', background: 'var(--accent-color)', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.32s' }}></div>
                    </div>
                )}
            </div>

            <form onSubmit={sendMessage} style={{ padding: '24px 32px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your command or question..."
                        style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            padding: '16px 24px',
                            color: 'white',
                            outline: 'none',
                            fontSize: '1rem',
                            fontFamily: '"JetBrains Mono", monospace',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = 'var(--accent-color)';
                            e.target.style.boxShadow = '0 0 15px var(--accent-glow)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'var(--border-color)';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    style={{
                        background: input.trim() ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.05)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '0 32px',
                        cursor: input.trim() ? 'pointer' : 'not-allowed',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        color: 'white'
                    }}
                    className="btn-chat-send"
                >
                    <PaperAirplaneIcon size={20} />
                </button>
            </form>

            <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
        @keyframes messageSlide {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chat-scroll-area::-webkit-scrollbar { width: 4px; }
        .chat-scroll-area::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 10px; }
        .btn-chat-send:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px var(--accent-glow);
        }
      `}</style>
        </div>
    );
};

export default RecruiterChat;
