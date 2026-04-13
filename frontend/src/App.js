import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Chatbot from './components/Chatbot';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import TimetablePage from './pages/Timetable';
import Teachers from './pages/Teachers';
import { Students, Subjects, Classrooms, Notifications } from './pages/Others';

function ProtectedLayout({ children, adminOnly = false, adminOrTeacher = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (adminOrTeacher && !['admin', 'teacher'].includes(user.role)) return <Navigate to="/dashboard" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-wrapper main-content">{children}</div>
      <Chatbot />
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Auth mode="login" />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Auth mode="register" />} />
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/timetable" element={<ProtectedLayout><TimetablePage /></ProtectedLayout>} />
      <Route path="/teachers" element={<ProtectedLayout adminOrTeacher><Teachers /></ProtectedLayout>} />
      <Route path="/students" element={<ProtectedLayout adminOrTeacher><Students /></ProtectedLayout>} />
      <Route path="/subjects" element={<ProtectedLayout adminOnly><Subjects /></ProtectedLayout>} />
      <Route path="/classrooms" element={<ProtectedLayout adminOnly><Classrooms /></ProtectedLayout>} />
      <Route path="/notifications" element={<ProtectedLayout><Notifications /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)', fontFamily: 'Sora, sans-serif', fontSize: 13 },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
