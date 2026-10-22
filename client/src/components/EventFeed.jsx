import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, CalendarCheck2, Search, SlidersHorizontal, Sparkles, Ticket, X } from 'lucide-react';
import EventCard from './EventCard';
import { apiRequest, getApiError } from '../lib/api';

const DEPARTMENTS = ['All', 'AI & DS', 'CSE', 'ECE', 'IT', 'Mech'];

export default function EventFeed() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [timeline, setTimeline] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (timeline !== 'all') params.set('timeline', timeline);
      const data = await apiRequest(`/events${params.size ? `?${params.toString()}` : ''}`);
      setEvents(data);
    } catch (err) {
      setError(getApiError(err, 'Could not load events. Is the API server running?'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, timeline]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const visibleEvents = useMemo(() => department === 'All'
    ? events
    : events.filter(event => event.departments?.includes('All') || event.departments?.includes(department)), [events, department]);

  const counts = useMemo(() => Object.fromEntries(DEPARTMENTS.map(item => [
    item,
    item === 'All' ? events.length : events.filter(event => event.departments?.includes('All') || event.departments?.includes(item)).length
  ])), [events]);

  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12 lg:px-8">
      <section className="relative mb-10 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-300/[0.14] via-white/[0.04] to-cyan-200/[0.09] px-6 py-8 shadow-glass sm:px-10 sm:py-12">
        <div className="absolute -right-8 -top-24 h-64 w-64 rounded-full bg-violet-300/10 blur-3xl" />
        <div className="absolute -bottom-24 right-1/3 h-52 w-52 rounded-full bg-cyan-200/10 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_.6fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.15em] text-violet-100"><Sparkles size={13} /> Your campus, in sync</div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-[-.045em] text-white sm:text-5xl lg:text-6xl">Good ideas deserve a <span className="gradient-text">live audience.</span></h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Find your next symposium, hands-on workshop, or all-night build sprint. Save a seat, keep your ticket close, and show up curious.</p>
            <a href="#event-list" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-white transition hover:text-violet-100">Explore campus events <ArrowDownRight size={17} /></a>
          </div>
          <div className="hidden justify-end lg:flex">
            <div className="relative w-64 rotate-2 rounded-[1.75rem] border border-white/20 bg-[#171c3a]/80 p-5 shadow-glow backdrop-blur-xl">
              <div className="mb-10 flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-200/15 text-violet-100"><Ticket size={19} /></span><span className="rounded-full bg-emerald-200/10 px-2.5 py-1 text-[10px] font-bold text-emerald-100">LIVE PASS</span></div>
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">Your next chapter</p>
              <p className="mt-2 text-xl font-black text-white">Starts here.</p>
              <div className="mt-6 flex items-end justify-between"><div className="space-y-1"><div className="h-1.5 w-28 rounded bg-white/20"/><div className="h-1.5 w-20 rounded bg-white/10"/></div><CalendarCheck2 size={30} className="text-cyan-100"/></div>
            </div>
          </div>
        </div>
      </section>

      <section id="event-list" className="scroll-mt-24">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[.2em] text-violet-200">The campus calendar</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Find your next thing.</h2>
            <p className="mt-2 text-sm text-slate-400">A good room, a great idea, and people to build with.</p>
          </div>
          <label className="relative block w-full md:max-w-sm">
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="glass-input !pl-11 !pr-11" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search events, clubs, topics…" aria-label="Search events" />
            {search && <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-white" onClick={() => setSearch('')} aria-label="Clear search"><X size={15}/></button>}
          </label>
        </div>

        <div className="mb-7 flex flex-col gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <SlidersHorizontal size={15} className="mr-1 shrink-0 text-slate-500" />
            {DEPARTMENTS.map(item => <button key={item} onClick={() => setDepartment(item)} className={`filter-chip ${department === item ? 'filter-chip-active' : ''}`}>
              {item}<span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] ${department === item ? 'bg-white/15 text-white' : 'bg-white/[.06] text-slate-500'}`}>{counts[item] ?? 0}</span>
            </button>)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-[.15em] text-slate-600">Timeline</span>
            {[['upcoming', 'Upcoming'], ['all', 'All events'], ['past', 'Past']].map(([value, label]) => <button key={value} onClick={() => setTimeline(value)} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${timeline === value ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/[.05] hover:text-slate-300'}`}>{label}</button>)}
          </div>
        </div>

        {error && <div className="mb-5 rounded-2xl border border-rose-200/20 bg-rose-200/[.07] p-4 text-sm text-rose-100">{error}</div>}
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map(item => <div key={item} className="glass-card h-96 animate-pulse bg-white/[.035]" />)}</div>
        ) : visibleEvents.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visibleEvents.map(event => <EventCard key={event._id} event={event} onRefresh={loadEvents} />)}</div>
        ) : (
          <div className="glass-card flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[.05] text-violet-100"><Search size={22} /></span>
            <h3 className="text-lg font-bold text-white">No events in this orbit.</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Try a different keyword or department, or switch the timeline filter.</p>
            <button onClick={() => { setSearch(''); setDepartment('All'); setTimeline('all'); }} className="button-quiet mt-5">Clear filters</button>
          </div>
        )}
      </section>
    </main>
  );
}
