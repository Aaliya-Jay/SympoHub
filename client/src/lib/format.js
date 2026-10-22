export function formatDate(date, options = {}) {
  if (!date) return 'Date to be announced';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Date to be announced';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', ...options
  }).format(parsed);
}

export function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('') || 'S';
}
