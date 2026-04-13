import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const statCards = [
  { key: 'teachers', label: 'Teachers', icon: '👨‍🏫', color: '#6366f1' },
  { key: 'students', label: 'Students', icon: '🎓', color: '#10b981' },
  { key: 'subjects', label: 'Subjects', icon: '📚', color: '#f59e0b' },
  { key: 'timetable_entries', label: 'Scheduled', icon: '📅', color: '#06b6d4' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/stats'),
      api.get('/notifications'),
      api.get('/timetable'),
    ]).then(([s, n, t]) => {
      setStats(s.data);
      setNotifications(n.data.slice(0, 5));
      setTimetable(t.data.slice(0, 5));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">{greeting()}, {user?.name?.split(' ')[0]} 👋</div>
          <div className="page-subtitle">Here's what's happening today</div>
        </div>
        <span className={`badge badge-${user?.role}`}>{user?.role}</span>
      </div>
      <div className="page-body">
        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {statCards.map(s => (
            <div key={s.key} className="stat-card">
              <div className="stat-icon" style={{ background: s.color + '22' }}>
                <span style={{ fontSize: 22 }}>{s.icon}</span>
              </div>
              <div className="stat-info">
                <div className="label">{s.label}</div>
                <div className="value" style={{ color: s.color }}>{stats[s.key] ?? 0}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid-2">
          {/* Recent Timetable */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📅 Recent Schedule</div>
              <div className="card-subtitle">Latest timetable entries</div>
            </div>
            {timetable.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <div className="icon">📭</div>
                <p>No timetable entries yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {timetable.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ width: 36, height: 36, background: 'rgba(99,102,241,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📘</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.day} • Period {t.period} • Sec {t.section}</div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--accent2)', fontFamily: 'JetBrains Mono', flexShrink: 0 }}>{t.start_time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">🔔 Notifications</div>
              <div className="card-subtitle">Recent alerts</div>
            </div>
            {notifications.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <div className="icon">🔕</div>
                <p>No notifications</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {notifications.map(n => (
                  <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                    <div className={`notif-dot ${n.read ? 'read' : ''}`} />
                    <div>
                      <div className="notif-msg">{n.message}</div>
                      <div className="notif-time">{new Date(n.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Info */}
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <div className="card-title">📊 System Overview</div>
          </div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ padding: '12px 20px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)', minWidth: 120 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>SECTIONS</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--cyan)', fontFamily: 'JetBrains Mono' }}>{stats.sections ?? 0}</div>
            </div>
            <div style={{ padding: '12px 20px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)', minWidth: 120 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>CLASSROOMS</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green)', fontFamily: 'JetBrains Mono' }}>{stats.classrooms ?? 0}</div>
            </div>
            <div style={{ padding: '12px 20px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)', flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>YOUR ROLE CAPABILITIES</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {user?.role === 'admin' && ['Manage Teachers','Manage Students','Edit Timetable','Manage Subjects','Manage Classrooms'].map(c => (
                  <span key={c} className="badge badge-info">{c}</span>
                ))}
                {user?.role === 'teacher' && ['View Timetable','View Students','View Schedule'].map(c => (
                  <span key={c} className="badge badge-teacher">{c}</span>
                ))}
                {user?.role === 'student' && ['View Timetable','View Notifications','Chat Assistant'].map(c => (
                  <span key={c} className="badge badge-student">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
