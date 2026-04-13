import { useState, useRef, useEffect } from 'react';
import api from '../utils/api';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', message: '👋 Hi! I\'m your timetable assistant. Ask me anything about schedules, teachers, or subjects!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    if (open && messages.length === 1) {
      api.get('/chat/history').then(r => {
        if (r.data.length > 0) setMessages(prev => [...prev, ...r.data]);
      }).catch(() => {});
    }
  }, [open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', message: msg }]);
    setLoading(true);
    try {
      const r = await api.post('/chat', { message: msg });
      setMessages(prev => [...prev, { role: 'assistant', message: r.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', message: '❌ Sorry, I encountered an error. Please try again.' }]);
    } finally { setLoading(false); }
  };

  const clearHistory = async () => {
    await api.delete('/chat/history').catch(() => {});
    setMessages([{ role: 'assistant', message: '👋 Chat cleared! How can I help you?' }]);
  };

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(v => !v)} title="Open chatbot">
        {open ? '✕' : '🤖'}
      </button>
      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <div>
              <div className="chat-header-title">🤖 Timetable Assistant</div>
              <div className="chat-header-sub">Powered by Gemini AI</div>
            </div>
            <button onClick={clearHistory} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>Clear</button>
          </div>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>{m.message}</div>
            ))}
            {loading && (
              <div className="chat-msg assistant">
                <div className="chat-typing"><span/><span/><span/></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="chat-input-area">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about the timetable..."
              disabled={loading}
            />
            <button className="chat-send-btn" onClick={send} disabled={loading}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}
