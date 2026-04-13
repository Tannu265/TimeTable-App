import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../utils/api';

const navItems = [
  { to: '/dashboard', icon: '⬡', label: 'Dashboard', roles: ['admin','teacher','student'] },
  { to: '/timetable', icon: '📅', label: 'Timetable', roles: ['admin','teacher','student'] },
  { to: '/teachers', icon: '👨‍🏫', label: 'Teachers', roles: ['admin','teacher'] },
  { to: '/students', icon: '🎓', label: 'Students', roles: ['admin','teacher'] },
  { to: '/subjects', icon: '📚', label: 'Subjects', roles: ['admin'] },
  { to: '/classrooms', icon: '🏫', label: 'Classrooms', roles: ['admin'] },
  { to: '/notifications', icon: '🔔', label: 'Notifications', roles: ['admin','teacher','student'], badge: true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.get('/notifications').then(r => setUnread(r.data.filter(n => !n.read).length)).catch(() => {});
    const iv = setInterval(() => {
      api.get('/notifications').then(r => setUnread(r.data.filter(n => !n.read).length)).catch(() => {});
    }, 30000);
    return () => clearInterval(iv);
  }, []);

  const allowed = navItems.filter(n => n.roles.includes(user?.role));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">📅</div>
        <div className="logo-text">Time<span>Table</span><br/>Management</div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-title">Menu</div>
        {allowed.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
            {item.badge && unread > 0 && <span className="badge">{unread}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="user-info">
            <div className="name">{user?.name}</div>
            <div className="role">{user?.role}</div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} title="Logout"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16 }}>⎋</button>
        </div>
      </div>
    </aside>
  );
}
