import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, CalendarDays, CheckCircle2, Download, Layers3, Plus, RefreshCw, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { apiRequest, downloadAttendeesCsv, getApiError } from '../lib/api';
import { formatDate } from '../lib/format';

const DEPARTMENTS = ['All', 'AI & DS', 'CSE', 'ECE', 'IT', 'Mech'];
const EMPTY_FORM = {
  title: '', description: '', category: 'Symposium', organizerClub: '', venue: '', date: '', capacity: 50,
  departments: ['All']
};

export default function AdminDashboard() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [exporting, setExporting] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      setEvents(await apiRequest('/events'));
    } catch (err) {
      setError(getApiError(err, 'Could not load event registrations.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  function update(event) {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
  }

  function toggleDepartment(department) {
    setForm(current => {
      if (department === 'All') return { ...current, departments: ['All'] };
      const withoutAll = current.departments.filter(item => item !== 'All');
      const next = withoutAll.includes(department)
        ? withoutAll.filter(item => item !== department)
        : [...withoutAll, department];
      return { ...current, departments: next.length ? next : ['All'] };
    });
  }

  async function submit(event) {
    event.preventDefault();
    setPublishing(true);
    setError('');
    setNotice('');
    try {
      const payload = { ...form, capacity: Number(form.capacity), date: new Date(form.date).toISOString() };
      await apiRequest('/events', { method: 'POST', data: payload });
      setNotice('Your event is published and visible on the discovery feed.');
      setForm(EMPTY_FORM);
      await loadEvents();
    } catch (err) {
      setError(getApiError(err, 'Could not publish this event. Check the required fields.'));
    } finally {
      setPublishing(false);
    }
  }

  async function exportEvent(event) {
    setExporting(event._id);
    setError('');
    try {
      await downloadAttendeesCsv(event._id);
    } catch (err) {
      setError(getApiError(err, 'CSV export failed.'));
    } finally {
      setExporting('');
    }
  }

  const totalAttendees = events.reduce((sum, event) => sum + Number(event.attendeeCount || 0), 0);
  const totalCapacity = events.reduce((sum, event) => sum + Number(event.capacity || 0), 0);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
      <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="mb-2 text-[11px] font-bold uppercase tracking-[.2em] text-violet-200">Control room</p><h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Admin dashboard<span className="text-violet-200">.</span></h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Publish an experience, monitor registrations, and export your attendee roster in one place.</p></div>
        <span className="inline-flex items-center gap-2 self-start rounded-full border border-violet-200/15 bg-violet-200/[.07] px-3 py-2 text-xs font-semibold text-violet-100 sm:self-auto"><ShieldCheck size={15}/> Administrator access</span>
      </div>

      <div className="mb-7 grid gap-3 sm:grid-cols-3">
        <div className="stat-card"><span className="stat-icon violet"><Layers3 size={17}/></span><div><p className="stat-label">Published events</p><p className="stat-number">{events.length}</p></div></div>
        <div className="stat-card"><span className="stat-icon cyan"><Users size={17}/></span><div><p className="stat-label">Confirmed attendees</p><p className="stat-number">{totalAttendees}</p></div></div>
        <div className="stat-card"><span className="stat-icon coral"><CalendarDays size={17}/></span><div><p className="stat-label">Total seat capacity</p><p className="stat-number">{totalCapacity.toLocaleString('en-IN')}</p></div></div>
      </div>

      {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200/20 bg-rose-200/[.07] px-4 py-3 text-sm text-rose-100">{error}</div>}
      {notice && <div role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200/15 bg-emerald-200/[.06] px-4 py-3 text-sm text-emerald-100"><CheckCircle2 size={16}/>{notice}</div>}

      <div className="grid items-start gap-6 xl:grid-cols-[.86fr_1.14fr]">
        <section className="glass-card p-5 sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-3"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-violet-200"><Sparkles size={13}/> Create & publish</div><h2 className="text-xl font-extrabold text-white">Publish new event</h2><p className="mt-1 text-xs leading-5 text-slate-500">Fields marked with * are required.</p></div><span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[.04] text-violet-100"><Plus size={19}/></span></div>
          <form onSubmit={submit} className="space-y-4">
            <label className="block"><span className="field-label">Event title *</span><input className="glass-input" name="title" value={form.title} onChange={update} placeholder="e.g. Nexus Technical Symposium" maxLength={160} required/></label>
            <label className="block"><span className="field-label">Description *</span><textarea className="glass-input min-h-24 resize-y" name="description" value={form.description} onChange={update} placeholder="What will attendees learn or experience?" maxLength={5000} rows={3} required/></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="field-label">Category *</span><select className="glass-input" name="category" value={form.category} onChange={update} required>{['Symposium', 'Workshop', 'Hackathon'].map(item => <option key={item} value={item} className="bg-[#171c3a]">{item}</option>)}</select></label>
              <label className="block"><span className="field-label">Organizer club *</span><input className="glass-input" name="organizerClub" value={form.organizerClub} onChange={update} placeholder="AI & DS Association" maxLength={160} required/></label>
            </div>
            <label className="block"><span className="field-label">Venue *</span><input className="glass-input" name="venue" value={form.venue} onChange={update} placeholder="Auditorium / lab / room" maxLength={240} required/></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block"><span className="field-label">Date & time *</span><input className="glass-input" type="datetime-local" name="date" value={form.date} onChange={update} required/></label>
              <label className="block"><span className="field-label">Seat quota *</span><input className="glass-input" type="number" name="capacity" value={form.capacity} onChange={update} min="1" max="100000" step="1" required/></label>
            </div>
            <fieldset><legend className="field-label">Eligible departments *</legend><div className="mt-2 flex flex-wrap gap-2">{DEPARTMENTS.map(department => <label key={department} className={`checkbox-chip ${form.departments.includes(department) ? 'checkbox-chip-active' : ''}`}><input className="sr-only" type="checkbox" checked={form.departments.includes(department)} onChange={() => toggleDepartment(department)}/>{department}</label>)}</div><p className="mt-2 text-[10px] leading-4 text-slate-600">Choosing “All” opens registration to every branch.</p></fieldset>
            <button type="submit" disabled={publishing || !form.departments.length} className="button-primary mt-2 w-full !py-3.5">{publishing ? 'Publishing…' : <>Publish event <ArrowUpRight size={16}/></>}</button>
          </form>
        </section>

        <section className="glass-card min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.08] px-5 py-5 sm:px-6"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.18em] text-cyan-100">Registration overview</p><h2 className="text-xl font-extrabold text-white">Active events & registrations</h2></div><button onClick={loadEvents} disabled={loading} className="icon-button !px-3" title="Refresh event list"><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/><span className="hidden sm:inline">Refresh</span></button></div>
          {loading ? <div className="space-y-3 p-5">{[1,2,3].map(item => <div key={item} className="h-20 animate-pulse rounded-xl bg-white/[.04]"/>)}</div> : events.length ? (
            <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left"><thead><tr className="border-b border-white/[.07] text-[10px] uppercase tracking-[.12em] text-slate-500"><th className="px-5 py-3 font-bold sm:px-6">Event</th><th className="px-4 py-3 font-bold">Quota</th><th className="px-4 py-3 font-bold">Date</th><th className="px-5 py-3 text-right font-bold sm:px-6">Roster</th></tr></thead><tbody>{events.map(event => { const filled = event.attendeeCount || 0; const percent = Math.min(100, Math.round((filled / event.capacity) * 100)); return <tr key={event._id} className="border-b border-white/[.055] last:border-0 transition hover:bg-white/[.025]"><td className="px-5 py-4 sm:px-6"><p className="max-w-56 truncate text-sm font-bold text-white" title={event.title}>{event.title}</p><p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500"><span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-200/70"/>{event.venue}</p></td><td className="px-4 py-4"><p className="whitespace-nowrap text-xs font-bold text-slate-200">{filled} / {event.capacity} Filled</p><div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${percent >= 100 ? 'bg-amber-200' : 'bg-gradient-to-r from-violet-300 to-cyan-200'}`} style={{width:`${percent}%`}}/></div><p className="mt-1 text-[9px] text-slate-600">{event.waitlistCount || 0} waitlisted</p></td><td className="whitespace-nowrap px-4 py-4 text-xs text-slate-400">{formatDate(event.date, { year: undefined, hour: undefined, minute: undefined })}</td><td className="px-5 py-4 text-right sm:px-6"><button onClick={() => exportEvent(event)} disabled={exporting === event._id} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-cyan-200/15 bg-cyan-200/[.06] px-2.5 py-2 text-[10px] font-bold text-cyan-100 transition hover:bg-cyan-200/[.12] disabled:opacity-50">{exporting === event._id ? <RefreshCw size={12} className="animate-spin"/> : <Download size={12}/>} CSV</button></td></tr>; })}</tbody></table></div>
          ) : <div className="px-6 py-16 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[.04] text-violet-100"><CalendarDays size={20}/></span><h3 className="mt-4 font-bold text-white">Nothing published yet.</h3><p className="mt-2 text-xs leading-5 text-slate-500">Your events will appear here after you publish them.</p></div>}
          <div className="flex items-center gap-2 border-t border-white/[.07] px-5 py-4 text-[10px] leading-5 text-slate-500 sm:px-6"><Download size={13} className="shrink-0 text-cyan-100"/>Exports include confirmed attendees only, as CSV.</div>
        </section>
      </div>
    </main>
  );
}
