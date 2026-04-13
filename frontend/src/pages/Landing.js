import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const features = [
  { icon: '📅', title: 'Smart Scheduling', desc: 'Manage complex timetables with ease. Conflict detection built in.' },
  { icon: '👥', title: 'Multi-Role Access', desc: 'Different views for admins, teachers, and students.' },
  { icon: '🤖', title: 'AI Chatbot', desc: 'Ask questions about schedules in natural language via Gemini AI.' },
  { icon: '🔔', title: 'Notifications', desc: 'Real-time alerts when timetable changes occur.' },
  { icon: '📊', title: 'Export Reports', desc: 'Download timetables as PDF or CSV with one click.' },
  { icon: '🔍', title: 'Search & Filter', desc: 'Find any class, teacher, or subject instantly.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  return (
    <div className="landing">
      <div className="landing-bg" />
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>📅</span>
          <span style={{ fontWeight: 800, fontSize: 18 }}>TimetableMS</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/login')}>Sign In</button>
          <button className="btn btn-primary" onClick={() => navigate('/register')}>Get Started</button>
        </div>
      </nav>
      <div className="landing-hero">
        <div className="hero-badge">✨ Modern Timetable Management</div>
        <h1 className="hero-title">
          Organize Every<br/>
          <span className="gradient">Class. Period. Day.</span>
        </h1>
        <p className="hero-sub">
          A powerful, AI-enhanced school timetable management system for admins, teachers, and students — all in one place.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={() => navigate('/register')}>
            🚀 Get Started Free
          </button>
          <button className="btn btn-secondary" style={{ padding: '14px 32px', fontSize: 16 }} onClick={() => navigate('/login')}>
            Sign In →
          </button>
        </div>
        <div style={{ marginTop: 24, fontSize: 13, color: 'var(--text3)' }}>
          Demo: <span style={{ fontFamily: 'JetBrains Mono' }}>admin@school.com</span> / <span style={{ fontFamily: 'JetBrains Mono' }}>admin123</span>
        </div>
      </div>
      <div className="landing-features">
        {features.map((f, i) => (
          <div key={i} className="feature-card">
            <div className="feature-icon">{f.icon}</div>
            <div className="feature-title">{f.title}</div>
            <div className="feature-desc">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
