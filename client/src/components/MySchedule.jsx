import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CalendarDays, CheckCircle2, Clock3, MapPin, QrCode, TicketCheck, Users, XCircle } from 'lucide-react';
import { apiRequest, getApiError } from '../lib/api';
import { formatDate } from '../lib/format';

function TicketPass({ event, student, onCancel, busyId }) {
  const ticketId = `SH-${String(event._id).slice(-6).toUpperCase()}-${String(student.id).slice(-6).toUpperCase()}`;
  const [issuedAt] = useState(() => new Date().toISOString());
  const payload = JSON.stringify({
    ticketId,
    eventId: event._id,
    studentId: student.id,
    studentName: student.name,
    timestamp: issuedAt
  });

  return (
    <article className="ticket-card overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#171d3b]/80 shadow-glass">
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-300/[.18] via-white/[.025] to-cyan-200/[.12] p-5 sm:p-6">
        <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-violet-300/[.12] blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/20 bg-emerald-200/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-emerald-100"><CheckCircle2 size={12}/> Verified registration</div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-violet-200">SympoHub admission pass</p>
            <h2 className="mt-2 max-w-xl text-xl font-black leading-snug text-white sm:text-2xl">{event.title}</h2>
            <p className="mt-2 text-xs text-slate-400">Organised by {event.organizerClub}</p>
          </div>
          <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[.06] text-violet-100 sm:grid"><TicketCheck size={22}/></span>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2.5 text-xs leading-5 text-slate-300"><CalendarDays size={15} className="mt-0.5 shrink-0 text-violet-200"/><span>{formatDate(event.date)}</span></div>
          <div className="flex items-start gap-2.5 text-xs leading-5 text-slate-300"><MapPin size={15} className="mt-0.5 shrink-0 text-cyan-100"/><span>{event.venue}</span></div>
        </div>
      </div>

      <div className="ticket-notch flex items-center gap-4 px-5 sm:px-6"><span className="notch-circle -ml-8"/><div className="flex-1 border-t border-dashed border-white/20"/><span className="notch-circle -mr-8"/></div>

      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Admit one</p>
          <p className="mt-1 truncate text-lg font-extrabold text-white">{student.name}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{student.email}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-slate-500"><span className="rounded-md border border-white/10 bg-white/[.04] px-2 py-1">{student.department}</span><span className="rounded-md border border-white/10 bg-white/[.04] px-2 py-1">ID · {ticketId}</span></div>
        </div>
        <div className="flex items-center gap-4 sm:block sm:text-center">
          <div className="rounded-xl bg-white p-2.5"><QRCodeSVG value={payload} size={116} level="M" includeMargin={false} bgColor="#ffffff" fgColor="#11162e"/></div>
          <p className="mt-2 hidden items-center justify-center gap-1 text-[10px] font-semibold text-emerald-100 sm:flex"><QrCode size={12}/> Scan at check-in</p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/[.07] px-5 py-3 sm:px-6">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-100"><CheckCircle2 size={12}/> Confirmed · Entry pass</span>
        <button onClick={() => onCancel(event)} disabled={busyId === event._id} className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-200/80 transition hover:text-rose-100 disabled:opacity-40"><XCircle size={14}/>{busyId === event._id ? 'Cancelling…' : 'Cancel spot'}</button>
      </div>
    </article>
  );
}

export default function MySchedule({ student, onCountChange }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/events/my');
      setEvents(data);
      onCountChange?.(data.length);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => { load(); }, [load]);

  async function cancel(event) {
    setBusyId(event._id);
    setNotice('');
    try {
      const result = await apiRequest(`/events/${event._id}/rsvp`, { method: 'DELETE' });
      setNotice(result.message);
      await load();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setBusyId('');
    }
  }

  const confirmed = events.filter(event => event.registrationStatus === 'confirmed');
  const waitlisted = events.filter(event => event.registrationStatus === 'waitlisted');

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="mb-2 text-[11px] font-bold uppercase tracking-[.2em] text-violet-200">Your event passport</p><h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">My schedule<span className="text-violet-200">.</span></h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Your confirmed passes and waitlist places, all together. Keep the QR pass ready when you arrive.</p></div>
        <div className="flex gap-2"><span className="stat-pill"><TicketCheck size={15}/>{confirmed.length} confirmed</span><span className="stat-pill amber"><Clock3 size={15}/>{waitlisted.length} waitlisted</span></div>
      </div>
      {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-200/15 bg-emerald-200/[.06] px-4 py-3 text-sm text-emerald-100">{notice}</p>}
      {error && <p role="alert" className="mb-5 rounded-xl border border-rose-200/20 bg-rose-200/[.07] px-4 py-3 text-sm text-rose-100">{error}</p>}
      {loading ? <div className="grid gap-5 lg:grid-cols-2"><div className="glass-card h-80 animate-pulse"/><div className="glass-card h-80 animate-pulse"/></div> : (
        <>
          {confirmed.length > 0 && <section><div className="mb-4 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-200/10 text-emerald-100"><TicketCheck size={16}/></span><h2 className="text-lg font-extrabold text-white">Confirmed passes</h2></div><div className="grid gap-5 lg:grid-cols-2">{confirmed.map(event => <TicketPass key={event._id} event={event} student={student} onCancel={cancel} busyId={busyId}/>)}</div></section>}
          {waitlisted.length > 0 && <section className="mt-10"><div className="mb-4 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-200/10 text-amber-100"><Clock3 size={16}/></span><h2 className="text-lg font-extrabold text-white">Waiting for a spot</h2></div><div className="grid gap-4 md:grid-cols-2">{waitlisted.map(event => <article key={event._id} className="glass-card p-5"><div className="mb-3 flex items-center justify-between"><span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-[10px] font-bold text-amber-100">FIFO waitlist · #{event.waitlistPosition || '—'}</span><span className="text-[10px] text-slate-500">{event.waitlistCount || 0} in queue</span></div><h3 className="text-lg font-extrabold text-white">{event.title}</h3><p className="mt-3 flex items-center gap-2 text-xs text-slate-400"><CalendarDays size={14}/>{formatDate(event.date)}</p><p className="mt-2 flex items-center gap-2 text-xs text-slate-400"><MapPin size={14}/>{event.venue}</p><p className="mt-4 text-xs leading-5 text-slate-500">Your place is held in order. If a confirmed attendee cancels, the first person in line is promoted automatically.</p><button onClick={() => cancel(event)} disabled={busyId === event._id} className="button-quiet mt-4 w-full">{busyId === event._id ? 'Leaving…' : 'Leave waitlist'}</button></article>)}</div></section>}
          {!confirmed.length && !waitlisted.length && <div className="glass-card flex flex-col items-center px-6 py-16 text-center"><span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[.05] text-violet-100"><CalendarDays size={22}/></span><h2 className="text-xl font-extrabold text-white">Your next event is waiting.</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-400">You haven’t reserved anything yet. Discover campus events and book your first spot.</p><a href="/" className="button-primary mt-5">Explore events <Users size={15}/></a></div>}
        </>
      )}
    </main>
  );
}
