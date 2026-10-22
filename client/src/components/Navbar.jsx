import { CalendarDays, LogOut, Sparkles, Ticket, UserRound, ShieldCheck } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials } from '../lib/format';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#10152d]/70 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="group flex shrink-0 items-center gap-3" aria-label="SympoHub home">
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-gradient-to-br from-violet-300/30 to-cyan-200/20 text-violet-100 shadow-glow transition group-hover:rotate-6">
            <Sparkles size={20} />
          </span>
          <span>
            <span className="block text-lg font-black tracking-tight text-white">Sympo<span className="text-violet-200">Hub</span></span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[.25em] text-slate-400 sm:block">Campus, connected</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
            <CalendarDays size={16} /><span className="hidden sm:inline">Discover</span>
          </NavLink>
          {isAuthenticated && user.role === 'student' && (
            <NavLink to="/my-schedule" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
              <Ticket size={16} /><span className="hidden sm:inline">My schedule</span>
            </NavLink>
          )}
          {isAuthenticated && user.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
              <ShieldCheck size={16} /><span className="hidden sm:inline">Admin</span>
            </NavLink>
          )}
        </nav>

        {isAuthenticated ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] py-1.5 pl-1.5 pr-3 sm:flex">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-200 to-cyan-100 text-xs font-black text-slate-900">{initials(user.name)}</span>
              <span className="max-w-28">
                <span className="block truncate text-xs font-bold text-white">{user.name}</span>
                <span className="block text-[10px] capitalize text-slate-400">{user.role} · {user.department}</span>
              </span>
            </div>
            <button onClick={handleLogout} className="icon-button" title="Log out" aria-label="Log out">
              <LogOut size={17} /><span className="hidden md:inline">Log out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden px-3 py-2 text-sm font-semibold text-slate-300 transition hover:text-white sm:inline">Log in</Link>
            <Link to="/register" className="button-primary !px-4 !py-2.5 text-xs sm:text-sm"><UserRound size={15} /> Get started</Link>
          </div>
        )}
      </div>
    </header>
  );
}
