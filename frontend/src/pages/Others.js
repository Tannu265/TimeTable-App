import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ── Students ─────────────────────────────────────────────────────────────────
export function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', roll: '', section: '' });

  const load = () => api.get('/students').then(r => setStudents(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const openAdd = () => { setEditItem(null); setForm({ name: '', roll: '', section: '' }); setShowModal(true); };
  const openEdit = t => { setEditItem(t); setForm({ name: t.name, roll: t.roll, section: t.section }); setShowModal(true); };
  const save = async () => {
    try {
      if (editItem) await api.put(`/students/${editItem.id}`, form);
      else await api.post('/students', form);
      toast.success(editItem ? 'Updated!' : 'Student added!'); setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };
  const del = async id => { if (!window.confirm('Delete?')) return; await api.delete(`/students/${id}`); toast.success('Deleted'); load(); };
  const sections = [...new Set(students.map(s => s.section))].sort();
  const filtered = students.filter(s =>
    (sectionFilter === '' || s.section === sectionFilter) &&
    (search === '' || s.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">🎓 Students</div><div className="page-subtitle">{students.length} enrolled</div></div>
        {user?.role === 'admin' && <button className="btn btn-primary" onClick={openAdd}>+ Add Student</button>}
      </div>
      <div className="page-body">
        <div className="toolbar">
          <div className="search-input"><span className="search-icon">🔍</span><input className="form-input" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className="form-select" style={{ width: 160 }} value={sectionFilter} onChange={e => setSectionFilter(e.target.value)}>
            <option value="">All Sections</option>
            {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
          </select>
        </div>
        <div className="card">
          {filtered.length === 0 ? <div className="empty-state"><div className="icon">🎓</div><h3>No students found</h3></div> : (
            <div className="table-container">
              <table>
                <thead><tr><th>#</th><th>Name</th><th>Roll No.</th><th>Section</th>{user?.role === 'admin' && <th>Actions</th>}</tr></thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.id}>
                      <td><span className="text-dim mono">{i + 1}</span></td>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="avatar sm" style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)' }}>{s.name[0]}</div><strong>{s.name}</strong></div></td>
                      <td><span className="mono badge badge-info">{s.roll}</span></td>
                      <td><span className="badge badge-student">Section {s.section}</span></td>
                      {user?.role === 'admin' && <td><div className="btn-group"><button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>✏️</button><button className="btn btn-danger btn-sm" onClick={() => del(s.id)}>🗑️</button></div></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header"><div className="modal-title">{editItem ? '✏️ Edit Student' : '+ Add Student'}</div><button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 20 }}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.name} onChange={set('name')} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Roll No. *</label><input className="form-input" type="number" value={form.roll} onChange={set('roll')} /></div>
                <div className="form-group"><label className="form-label">Section *</label><input className="form-input" placeholder="A" value={form.section} onChange={set('section')} maxLength={5} /></div>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>💾 Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subjects ─────────────────────────────────────────────────────────────────
export function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ subject_name: '', subject_code: '', teacher_id: '' });

  const load = () => Promise.all([api.get('/subjects'), api.get('/teachers')]).then(([s, t]) => { setSubjects(s.data); setTeachers(t.data); });
  useEffect(() => { load(); }, []);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const openAdd = () => { setEditItem(null); setForm({ subject_name: '', subject_code: '', teacher_id: '' }); setShowModal(true); };
  const openEdit = s => { setEditItem(s); setForm({ subject_name: s.subject_name, subject_code: s.subject_code, teacher_id: s.teacher_id || '' }); setShowModal(true); };
  const save = async () => {
    try {
      if (editItem) await api.put(`/subjects/${editItem.id}`, form);
      else await api.post('/subjects', form);
      toast.success('Saved!'); setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };
  const del = async id => { if (!window.confirm('Delete?')) return; await api.delete(`/subjects/${id}`); toast.success('Deleted'); load(); };
  const filtered = subjects.filter(s => s.subject_name.toLowerCase().includes(search.toLowerCase()) || s.subject_code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">📚 Subjects</div><div className="page-subtitle">{subjects.length} subjects</div></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Subject</button>
      </div>
      <div className="page-body">
        <div className="toolbar"><div className="search-input"><span className="search-icon">🔍</span><input className="form-input" placeholder="Search subjects..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
        <div className="card">
          {filtered.length === 0 ? <div className="empty-state"><div className="icon">📚</div><h3>No subjects</h3></div> : (
            <div className="table-container">
              <table>
                <thead><tr><th>#</th><th>Subject Name</th><th>Code</th><th>Assigned Teacher</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.id}>
                      <td className="text-dim mono">{i + 1}</td>
                      <td><strong>{s.subject_name}</strong></td>
                      <td><span className="badge badge-info mono">{s.subject_code}</span></td>
                      <td>{s.teacher_name ? <span className="badge badge-teacher">{s.teacher_name}</span> : <span className="text-dim">—</span>}</td>
                      <td><div className="btn-group"><button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>✏️</button><button className="btn btn-danger btn-sm" onClick={() => del(s.id)}>🗑️</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header"><div className="modal-title">{editItem ? '✏️ Edit Subject' : '+ Add Subject'}</div><button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 20 }}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Subject Name *</label><input className="form-input" value={form.subject_name} onChange={set('subject_name')} /></div>
              <div className="form-group"><label className="form-label">Subject Code *</label><input className="form-input" placeholder="MATH101" value={form.subject_code} onChange={set('subject_code')} /></div>
              <div className="form-group"><label className="form-label">Assign Teacher</label>
                <select className="form-select" value={form.teacher_id} onChange={set('teacher_id')}>
                  <option value="">None</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>💾 Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Classrooms ────────────────────────────────────────────────────────────────
export function Classrooms() {
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ room_number: '', capacity: 40 });

  const load = () => api.get('/classrooms').then(r => setRooms(r.data));
  useEffect(() => { load(); }, []);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const save = async () => {
    try { await api.post('/classrooms', form); toast.success('Room added!'); setShowModal(false); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };
  const del = async id => { if (!window.confirm('Delete?')) return; await api.delete(`/classrooms/${id}`); toast.success('Deleted'); load(); };

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">🏫 Classrooms</div><div className="page-subtitle">{rooms.length} rooms</div></div>
        <button className="btn btn-primary" onClick={() => { setForm({ room_number: '', capacity: 40 }); setShowModal(true); }}>+ Add Room</button>
      </div>
      <div className="page-body">
        <div className="grid-4">
          {rooms.map(r => (
            <div key={r.id} className="card" style={{ position: 'relative' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏫</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{r.room_number}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Capacity: <strong>{r.capacity}</strong> students</div>
              <button className="btn btn-danger btn-sm" style={{ marginTop: 12 }} onClick={() => del(r.id)}>🗑️ Remove</button>
            </div>
          ))}
          {rooms.length === 0 && <div className="empty-state" style={{ gridColumn: '1/-1' }}><div className="icon">🏫</div><h3>No classrooms</h3></div>}
        </div>
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header"><div className="modal-title">+ Add Classroom</div><button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 20 }}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Room Number *</label><input className="form-input" placeholder="Room-101" value={form.room_number} onChange={set('room_number')} /></div>
              <div className="form-group"><label className="form-label">Capacity</label><input className="form-input" type="number" value={form.capacity} onChange={set('capacity')} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>💾 Save</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────
export function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/notifications').then(r => setNotifs(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const markRead = id => api.patch(`/notifications/${id}/read`).then(load);
  const markAllRead = () => api.patch('/notifications/read-all').then(load);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">🔔 Notifications</div><div className="page-subtitle">{notifs.filter(n => !n.read).length} unread</div></div>
        {notifs.some(n => !n.read) && <button className="btn btn-secondary" onClick={markAllRead}>✓ Mark All Read</button>}
      </div>
      <div className="page-body">
        <div className="card" style={{ padding: 0 }}>
          {notifs.length === 0 ? (
            <div className="empty-state"><div className="icon">🔕</div><h3>No notifications</h3><p>You're all caught up!</p></div>
          ) : (
            notifs.map(n => (
              <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`} style={{ cursor: !n.read ? 'pointer' : 'default' }} onClick={() => !n.read && markRead(n.id)}>
                <div className={`notif-dot ${n.read ? 'read' : ''}`} />
                <div style={{ flex: 1 }}>
                  <div className="notif-msg">{n.message}</div>
                  <div className="notif-time">{new Date(n.date).toLocaleString()}</div>
                </div>
                {!n.read && <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); markRead(n.id); }}>Mark Read</button>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
