import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Teachers() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', initials: '', email: '' });
  const [loading, setLoading] = useState(true);

  const load = () => api.get('/teachers').then(r => setTeachers(r.data)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const openAdd = () => { setEditItem(null); setForm({ name: '', initials: '', email: '' }); setShowModal(true); };
  const openEdit = (t) => { setEditItem(t); setForm({ name: t.name, initials: t.initials, email: t.email }); setShowModal(true); };

  const save = async () => {
    try {
      if (editItem) await api.put(`/teachers/${editItem.id}`, form);
      else await api.post('/teachers', form);
      toast.success(editItem ? 'Teacher updated!' : 'Teacher added!');
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this teacher?')) return;
    await api.delete(`/teachers/${id}`).catch(() => {});
    toast.success('Deleted'); load();
  };

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    t.initials.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">👨‍🏫 Teachers</div><div className="page-subtitle">{teachers.length} total</div></div>
        {user?.role === 'admin' && <button className="btn btn-primary" onClick={openAdd}>+ Add Teacher</button>}
      </div>
      <div className="page-body">
        <div className="toolbar">
          <div className="search-input">
            <span className="search-icon">🔍</span>
            <input className="form-input" placeholder="Search teachers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="card">
          {filtered.length === 0 ? (
            <div className="empty-state"><div className="icon">👨‍🏫</div><h3>No teachers found</h3><p>Add a teacher to get started</p></div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>#</th><th>Name</th><th>Initials</th><th>Email</th>{user?.role === 'admin' && <th>Actions</th>}</tr></thead>
                <tbody>
                  {filtered.map((t, i) => (
                    <tr key={t.id}>
                      <td><span className="text-dim mono">{i + 1}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar sm">{t.name[0]}</div>
                          <strong>{t.name}</strong>
                        </div>
                      </td>
                      <td><span className="badge badge-teacher">{t.initials}</span></td>
                      <td><span className="mono" style={{ fontSize: 13, color: 'var(--text2)' }}>{t.email}</span></td>
                      {user?.role === 'admin' && <td>
                        <div className="btn-group">
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(t)}>✏️ Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => del(t.id)}>🗑️</button>
                        </div>
                      </td>}
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
            <div className="modal-header">
              <div className="modal-title">{editItem ? '✏️ Edit Teacher' : '+ Add Teacher'}</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" placeholder="Dr. John Smith" value={form.name} onChange={set('name')} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Initials *</label><input className="form-input" placeholder="JHS" value={form.initials} onChange={set('initials')} maxLength={5} /></div>
                <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" placeholder="email@school.com" value={form.email} onChange={set('email')} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>💾 Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
