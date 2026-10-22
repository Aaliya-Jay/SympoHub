import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import EventFeed from './components/EventFeed';
import AuthModal from './components/AuthModal';
import MySchedule from './components/MySchedule';
import AdminDashboard from './components/AdminDashboard';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ role, children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  return children;
}

function AuthRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  return children;
}

function Footer() {
  return <footer className="border-t border-white/[.06] px-4 py-6 text-center text-[10px] tracking-wide text-slate-600"><span className="font-bold text-slate-500">SympoHub</span> · Campus, connected. <span className="mx-1">✦</span> Made for the next big idea.</footer>;
}

export default function App() {
  return (
    <div className="app-shell min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<EventFeed />} />
        <Route path="/login" element={<AuthRoute><AuthModal /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><AuthModal /></AuthRoute>} />
        <Route path="/my-schedule" element={<ProtectedRoute role="student"><MyScheduleWrapper /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </div>
  );
}

function MyScheduleWrapper() {
  const { user } = useAuth();
  return <MySchedule student={user} />;
}

function NotFound() {
  return <main className="mx-auto max-w-xl px-4 py-24 text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-violet-200">404 · Out of orbit</p><h1 className="mt-4 text-4xl font-black text-white">This page took a detour.</h1><p className="mt-3 text-sm text-slate-400">The page you’re looking for isn’t here.</p><a href="/" className="button-primary mt-7 inline-flex">Back to discovery</a></main>;
}
