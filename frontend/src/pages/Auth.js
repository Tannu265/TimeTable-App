import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Auth({ mode = 'login' }) {
  const [tab, setTab] = useState(mode);
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ name: '', email: '', password: '', section: '', roll: '', initials: '' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.email || !form.password) return toast.error('Please fill all required fields');
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      } else {
        if (!form.name) return toast.error('Name is required');
        await register({ ...form, role });
        toast.success('Account created!');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card">
        <div className="auth-logo">
          <div className="icon">📅</div>
          <h1>TimetableMS</h1>
          <p>School Timetable Management System</p>
        </div>
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Sign Up</button>
        </div>

        {tab === 'register' && (
          <>
            <div className="form-group">
              <div className="form-label">Role</div>
              <div className="role-select">
                {['student', 'teacher', 'admin'].map(r => (
                  <button key={r} className={`role-btn ${role === r ? 'active' : ''}`} onClick={() => setRole(r)}>
                    {r === 'admin' ? '👑' : r === 'teacher' ? '👨‍🏫' : '🎓'} {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" placeholder="Your full name" value={form.name} onChange={set('name')} />
            </div>
          </>
        )}

        <div className="form-group">
          <label className="form-label">Email *</label>
          <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        <div className="form-group">
          <label className="form-label">Password *</label>
          <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        {tab === 'register' && role === 'student' && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Section</label>
              <input className="form-input" placeholder="A" value={form.section} onChange={set('section')} />
            </div>
            <div className="form-group">
              <label className="form-label">Roll No.</label>
              <input className="form-input" type="number" placeholder="1" value={form.roll} onChange={set('roll')} />
            </div>
          </div>
        )}

        {tab === 'register' && role === 'teacher' && (
          <div className="form-group">
            <label className="form-label">Initials</label>
            <input className="form-input" placeholder="e.g. ANR" value={form.initials} onChange={set('initials')} maxLength={5} />
          </div>
        )}

        <button className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: 8 }} onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="spinner" /> : tab === 'login' ? '→ Sign In' : '✓ Create Account'}
        </button>

        {tab === 'login' && (
          <div style={{ marginTop: 16, padding: '12px', background: 'var(--bg3)', borderRadius: 8, fontSize: 12, color: 'var(--text3)' }}>
            <strong style={{ color: 'var(--text2)' }}>Demo accounts:</strong><br />
            Admin: admin@school.com / admin123<br />
            Teacher: ananya@school.com / teacher123<br />
            Student: student1@school.com / student123
          </div>
        )}
      </div>
    </div>
  );
}
