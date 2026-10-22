import { useState } from 'react';
import { ArrowUpRight, CalendarDays, Check, Clock3, MapPin, Sparkles, Users, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest, getApiError } from '../lib/api';
import { formatDate } from '../lib/format';

const categoryStyles = {
  Symposium: 'border-violet-200/20 bg-violet-300/10 text-violet-100',
  Workshop: 'border-cyan-200/20 bg-cyan-200/10 text-cyan-100',
  Hackathon: 'border-rose-200/20 bg-rose-200/10 text-rose-100'
};

export default function EventCard({ event, onRefresh }) {
  const { user, isAuthenticated } = useAuth();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const filled = Number(event.attendeeCount || 0);
  const capacity = Number(event.capacity || 1);
  const percentage = Math.min(100, Math.round((filled / capacity) * 100));
  const full = filled >= capacity;
  const confirmed = event.registrationStatus === 'confirmed';
  const waitlisted = event.registrationStatus === 'waitlisted';

  async function reserve() {
    if (!isAuthenticated || user?.role !== 'student') return;
    setBusy(true);
    setNotice('');
    try {
      const response = await apiRequest(`/events/${event._id}/rsvp`, { method: 'POST' });
      setNotice(response.message);
      await onRefresh?.();
    } catch (error) {
      setNotice(getApiError(error));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    setNotice('');
    try {
      const response = await apiRequest(`/events/${event._id}/rsvp`, { method: 'DELETE' });
      setNotice(response.message);
      await onRefresh?.();
    } catch (error) {
      setNotice(getApiError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="glass-card group flex h-full flex-col overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.075] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wide ${categoryStyles[event.category] || categoryStyles.Symposium}`}>
          <Sparkles size={12} /> {event.category}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/10 px-2.5 py-1 text-[10px] font-semibold text-slate-400">
          <Users size={12} /> {event.departments?.includes('All') ? 'All branches' : (event.departments || []).join(' · ')}
        </span>
      </div>

      <h2 className="mb-2 text-xl font-extrabold leading-snug tracking-tight text-white sm:text-[22px]">{event.title}</h2>
      <p className="mb-5 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-400">{event.description}</p>

      <div className="mb-5 grid gap-3 border-b border-white/[0.09] pb-5 text-sm text-slate-300">
        <div className="flex items-start gap-2.5"><CalendarDays size={16} className="mt-0.5 shrink-0 text-violet-200" /><span>{formatDate(event.date)}</span></div>
        <div className="flex items-start gap-2.5"><MapPin size={16} className="mt-0.5 shrink-0 text-cyan-200" /><span>{event.venue}</span></div>
        <div className="flex items-start gap-2.5"><Clock3 size={16} className="mt-0.5 shrink-0 text-rose-200" /><span>{event.organizerClub || 'Campus community'}</span></div>
      </div>

      <div className="mb-5 mt-auto">
        <div className="mb-2 flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-slate-300">{filled} / {capacity} seats filled</span>
          <span className={full ? 'font-bold text-amber-200' : 'text-slate-500'}>{full ? 'At capacity' : `${capacity - filled} spots left`}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full transition-all ${full ? 'bg-gradient-to-r from-amber-300 to-rose-300' : 'bg-gradient-to-r from-violet-300 via-fuchsia-200 to-cyan-200'}`} style={{ width: `${percentage}%` }} />
        </div>
      </div>

      {notice && <p className="mb-3 rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-xs leading-5 text-slate-300" role="status">{notice}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {confirmed ? (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200/20 bg-emerald-300/10 px-3 py-2.5 text-xs font-bold text-emerald-100"><Check size={15} /> Attending</span>
            <button onClick={cancel} disabled={busy} className="button-danger ml-auto">{busy ? 'Updating…' : <><XCircle size={15} /> Cancel spot</>}</button>
          </>
        ) : waitlisted ? (
          <>
            <span className="rounded-xl border border-amber-200/20 bg-amber-200/10 px-3 py-2.5 text-xs font-bold text-amber-100">⏳ Waitlist · #{event.waitlistPosition || '—'}</span>
            <button onClick={cancel} disabled={busy} className="button-quiet ml-auto">{busy ? 'Updating…' : 'Leave waitlist'}</button>
          </>
        ) : !isAuthenticated ? (
          <Link to="/login" className="button-primary w-full">Sign in to reserve <ArrowUpRight size={16} /></Link>
        ) : user?.role !== 'student' ? (
          <span className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center text-xs text-slate-400">Admin preview · student registration only</span>
        ) : full ? (
          <button onClick={reserve} disabled={busy} className="button-waitlist w-full">{busy ? 'Joining…' : <>Join FIFO waitlist <span>⏳</span></>}</button>
        ) : (
          <button onClick={reserve} disabled={busy} className="button-primary w-full">{busy ? 'Reserving…' : <>Reserve spot <ArrowUpRight size={16} /></>}</button>
        )}
      </div>
      {event.createdBy?.name && <p className="mt-4 text-[10px] text-slate-600">Published by {event.createdBy.name}</p>}
    </article>
  );
}
