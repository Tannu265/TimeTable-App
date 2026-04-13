import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [
  { n: 1, start: '09:00', end: '09:50' },
  { n: 2, start: '09:50', end: '10:40' },
  { n: 3, start: '10:40', end: '11:30' },
  { n: 4, start: '12:10', end: '13:00' },
  { n: 5, start: '13:00', end: '13:50' },
  { n: 6, start: '13:50', end: '14:40' },
];
const RECESS_AFTER = 3;

export default function TimetablePage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [section, setSection] = useState('A');
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [form, setForm] = useState({ section: 'A', subject_id: '', teacher_id: '', room_id: '', day: 'Monday', period: 1, start_time: '09:00', end_time: '09:50' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      api.get('/timetable'),
      api.get('/timetable/sections'),
      api.get('/subjects'),
      api.get('/teachers'),
      api.get('/classrooms'),
    ]).then(([tt, sec, sub, tea, cls]) => {
      setEntries(tt.data);
      setSections(sec.data.length ? sec.data : ['A', 'B']);
      setSubjects(sub.data);
      setTeachers(tea.data);
      setClassrooms(cls.data);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const getCell = (day, period) => entries.find(e => e.section === section && e.day === day && e.period === period);

  const openAdd = (day, period) => {
    if (user?.role !== 'admin') return;
    const p = PERIODS.find(p => p.n === period);
    setEditEntry(null);
    setForm({ section, subject_id: subjects[0]?.id || '', teacher_id: teachers[0]?.id || '', room_id: classrooms[0]?.id || '', day, period, start_time: p?.start || '', end_time: p?.end || '' });
    setShowModal(true);
  };

  const openEdit = (entry) => {
    if (user?.role !== 'admin') return;
    setEditEntry(entry);
    setForm({ section: entry.section, subject_id: entry.subject_id, teacher_id: entry.teacher_id, room_id: entry.room_id || '', day: entry.day, period: entry.period, start_time: entry.start_time, end_time: entry.end_time });
    setShowModal(true);
  };

  const save = async () => {
    try {
      if (editEntry) await api.put(`/timetable/${editEntry.id}`, form);
      else await api.post('/timetable', form);
      toast.success(editEntry ? 'Updated!' : 'Added!');
      setShowModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error saving'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    await api.delete(`/timetable/${id}`);
    toast.success('Deleted');
    load();
  };

  const exportCSV = () => {
    const filtered = entries.filter(e => e.section === section);
    const rows = [['Day', 'Period', 'Subject', 'Teacher', 'Room', 'Start', 'End'],
      ...filtered.map(e => [e.day, e.period, e.subject_name, e.teacher_name, e.room_number || '', e.start_time, e.end_time])];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `timetable-section-${section}.csv`;
    a.click();
    toast.success('CSV exported!');
  };

  const exportPDF = async () => {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text(`Timetable - Section ${section}`, 14, 15);
    const filtered = entries.filter(e => e.section === section);
    const rows = filtered.map(e => [e.day, `Period ${e.period}`, e.subject_name, e.teacher_name, e.room_number || '-', `${e.start_time} - ${e.end_time}`]);
    autoTable(doc, {
      head: [['Day', 'Period', 'Subject', 'Teacher', 'Room', 'Time']],
      body: rows,
      startY: 20,
      styles: { fontSize: 10 },
    });
    doc.save(`timetable-section-${section}.pdf`);
    toast.success('PDF exported!');
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const filteredEntries = entries.filter(e =>
    e.section === section &&
    (search === '' || e.subject_name?.toLowerCase().includes(search.toLowerCase()) || e.teacher_name?.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📅 Timetable</div>
          <div className="page-subtitle">Weekly schedule grid</div>
        </div>
        <div className="btn-group">
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}>📄 CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={exportPDF}>📑 PDF</button>
          {user?.role === 'admin' && <button className="btn btn-primary btn-sm" onClick={() => openAdd('Monday', 1)}>+ Add Entry</button>}
        </div>
      </div>
      <div className="page-body">
        <div className="toolbar">
          <div className="search-input">
            <span className="search-icon">🔍</span>
            <input className="form-input" placeholder="Search subject or teacher..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Section:</span>
            {sections.map(s => (
              <button key={s} className={`btn btn-sm ${section === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSection(s)}>{s}</button>
            ))}
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="card">
          <div className="tt-grid">
            <table className="tt-table">
              <thead>
                <tr>
                  <th className="day-header">Day \ Period</th>
                  {PERIODS.map((p, i) => (
                    <>
                      {i === RECESS_AFTER && <th key="recess" style={{ background: 'rgba(245,158,11,0.08)', color: 'var(--yellow)', width: 60 }}>☕<br/>Break</th>}
                      <th key={p.n}>
                        Period {p.n}<br/>
                        <span style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'JetBrains Mono' }}>{p.start}</span>
                      </th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map(day => (
                  <tr key={day}>
                    <td className="tt-table day-header" style={{ border: '1px solid var(--border)', padding: '8px 12px' }}>{day}</td>
                    {PERIODS.map((p, i) => {
                      const cell = getCell(day, p.n);
                      const matchSearch = !search || (cell && (cell.subject_name?.toLowerCase().includes(search.toLowerCase()) || cell.teacher_name?.toLowerCase().includes(search.toLowerCase())));
                      return (
                        <>
                          {i === RECESS_AFTER && <td key={`${day}-recess`} className="tt-recess"><div className="tt-recess-label">☕</div></td>}
                          <td key={p.n} className="tt-cell" style={{ opacity: search && !matchSearch ? 0.3 : 1 }}>
                            {cell ? (
                              <div className="tt-cell-inner has-class" onClick={() => openEdit(cell)}>
                                <div className="tt-subject">{cell.subject_name}</div>
                                <div className="tt-teacher">👤 {cell.teacher_initials}</div>
                                <div className="tt-room">🏫 {cell.room_number || '—'}</div>
                                <div className="tt-time">{cell.start_time}–{cell.end_time}</div>
                              </div>
                            ) : (
                              <div className="tt-cell-inner empty" onClick={() => openAdd(day, p.n)}>
                                {user?.role === 'admin' ? <span>+ Add</span> : <span>Free</span>}
                              </div>
                            )}
                          </td>
                        </>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* List View */}
        {search && (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header"><div className="card-title">Search Results</div></div>
            {filteredEntries.length === 0 ? <div className="empty-state" style={{ padding: '20px 0' }}><p>No results found</p></div> : (
              <div className="table-container">
                <table>
                  <thead><tr><th>Day</th><th>Period</th><th>Subject</th><th>Teacher</th><th>Room</th><th>Time</th>{user?.role === 'admin' && <th>Actions</th>}</tr></thead>
                  <tbody>
                    {filteredEntries.map(e => (
                      <tr key={e.id}>
                        <td>{e.day}</td>
                        <td><span className="badge badge-info">P{e.period}</span></td>
                        <td><strong>{e.subject_name}</strong></td>
                        <td>{e.teacher_name}</td>
                        <td><span className="mono" style={{ fontSize: 12, color: 'var(--text3)' }}>{e.room_number || '—'}</span></td>
                        <td><span className="mono" style={{ fontSize: 12 }}>{e.start_time}–{e.end_time}</span></td>
                        {user?.role === 'admin' && <td>
                          <div className="btn-group">
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(e)}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={() => del(e.id)}>🗑️</button>
                          </div>
                        </td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{editEntry ? '✏️ Edit Entry' : '+ New Entry'}</div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <input className="form-input" value={form.section} onChange={set('section')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Day</label>
                  <select className="form-select" value={form.day} onChange={set('day')}>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Period</label>
                  <select className="form-select" value={form.period} onChange={e => {
                    const p = PERIODS.find(p => p.n === +e.target.value);
                    setForm(f => ({ ...f, period: +e.target.value, start_time: p?.start || '', end_time: p?.end || '' }));
                  }}>
                    {PERIODS.map(p => <option key={p.n} value={p.n}>Period {p.n} ({p.start})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Room</label>
                  <select className="form-select" value={form.room_id} onChange={set('room_id')}>
                    <option value="">None</option>
                    {classrooms.map(c => <option key={c.id} value={c.id}>{c.room_number}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="form-select" value={form.subject_id} onChange={set('subject_id')}>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name} ({s.subject_code})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Teacher</label>
                <select className="form-select" value={form.teacher_id} onChange={set('teacher_id')}>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.initials})</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input className="form-input" type="time" value={form.start_time} onChange={set('start_time')} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input className="form-input" type="time" value={form.end_time} onChange={set('end_time')} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {editEntry && <button className="btn btn-danger" onClick={async () => { await del(editEntry.id); setShowModal(false); }}>🗑️ Delete</button>}
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>💾 Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
