import { useState } from 'react';
import { ArrowRight, AtSign, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../lib/api';

const DEPARTMENTS = ['AI & DS', 'CSE', 'ECE', 'IT', 'Mech'];

export default function AuthModal() {
  const isRegister = useLocation().pathname === '/register';
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', department: 'AI & DS' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function update(event) {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  function fillDemo(role) {
    setForm(current => ({
      ...current,
      name: role === 'student' ? 'Demo Student' : 'SympoHub Admin',
      email: role === 'student' ? 'student@sympohub.edu' : 'admin@sympohub.edu',
      password: role === 'student' ? 'Student@12345' : 'Admin@12345',
      department: 'AI & DS'
    }));
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = isRegister ? await register(form) : await login({ email: form.email, password: form.password });
      navigate(user.role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (err) {
      setError(getApiError(err, 'Could not authenticate. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-[calc(100vh-68px)] max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute left-[10%] top-[15%] h-56 w-56 rounded-full bg-violet-300/[.08] blur-3xl" />
      <div className="absolute bottom-[12%] right-[8%] h-64 w-64 rounded-full bg-cyan-200/[.07] blur-3xl" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#151a37]/75 shadow-glass backdrop-blur-2xl lg:grid-cols-[.95fr_1.05fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-300/[.16] via-white/[.02] to-cyan-200/[.10] p-10 lg:flex">
          <div className="absolute -left-20 top-1/3 h-64 w-64 rounded-full bg-violet-300/10 blur-3xl" />
          <div className="relative">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/[.08] text-violet-100"><Sparkles size={22}/></span>
            <p className="mt-10 text-xs font-bold uppercase tracking-[.24em] text-violet-200">Welcome to SympoHub</p>
            <h1 className="mt-4 max-w-sm text-4xl font-black leading-tight tracking-[-.04em] text-white">Make room for <span className="gradient-text">what’s next.</span></h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">Your campus event calendar, registration desk, and digital admission pass — all in one place.</p>
          </div>
          <div className="relative rounded-2xl border border-white/10 bg-black/10 p-4">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-200/10 text-emerald-100"><ShieldCheck size={19}/></span><div><p className="text-sm font-bold text-white">One account. Your campus.</p><p className="mt-1 text-xs text-slate-400">RSVPs, waitlists, tickets, and check-in.</p></div></div>
          </div>
        </section>

        <section className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8 lg:hidden"><span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-violet-200/10 text-violet-100"><Sparkles size={20}/></span></div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-200">{isRegister ? 'Create your account' : 'Good to see you again'}</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{isRegister ? 'Join the community.' : 'Welcome back.'}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">{isRegister ? 'Get your campus plans in one place.' : 'Sign in to manage your event journey.'}</p>

          {!isRegister && <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => fillDemo('student')} className="demo-credential"><UserRound size={15}/><span><b>Student demo</b><small>Fill sample login</small></span></button>
            <button type="button" onClick={() => fillDemo('admin')} className="demo-credential"><ShieldCheck size={15}/><span><b>Admin demo</b><small>Fill sample login</small></span></button>
          </div>}

          {error && <div role="alert" className="mt-5 rounded-xl border border-rose-200/20 bg-rose-200/[.08] px-4 py-3 text-sm text-rose-100">{error}</div>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            {isRegister && <label className="block"><span className="field-label">Full name</span><span className="relative block"><UserRound size={16} className="input-icon"/><input className="glass-input !pl-10" name="name" value={form.name} onChange={update} placeholder="Your name" autoComplete="name" required maxLength={100}/></span></label>}
            <label className="block"><span className="field-label">College email</span><span className="relative block"><AtSign size={16} className="input-icon"/><input className="glass-input !pl-10" name="email" type="email" value={form.email} onChange={update} placeholder="you@college.edu" autoComplete="email" required maxLength={254}/></span></label>
            <label className="block"><span className="field-label">Password</span><span className="relative block"><LockKeyhole size={16} className="input-icon"/><input className="glass-input !pl-10 !pr-11" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={update} placeholder="At least 8 characters" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} required/><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></span></label>
            {isRegister && <label className="block"><span className="field-label">Department</span><select className="glass-input" name="department" value={form.department} onChange={update} required>{DEPARTMENTS.map(department => <option key={department} value={department} className="bg-[#171c3a]">{department}</option>)}</select></label>}
            <button type="submit" disabled={busy} className="button-primary mt-2 w-full !py-3.5">{busy ? 'Please wait…' : <>{isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={16}/></>}</button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">{isRegister ? 'Already have an account?' : 'New around here?'}{' '}
            <Link to={isRegister ? '/login' : '/register'} className="font-bold text-violet-200 transition hover:text-white">{isRegister ? 'Sign in' : 'Create an account'}</Link>
          </p>
          {!isRegister && <p className="mt-5 text-center text-[10px] leading-5 text-slate-600">Demo sign-in works after the server seed script has been run.</p>}
        </section>
      </div>
    </main>
  );
}
