/**
 * utils.js
 * -----------------------------------------------------------------------
 * Small, dependency-free helper functions shared across the whole app.
 * Nothing here touches the DOM or LocalStorage directly — keep it pure.
 * -----------------------------------------------------------------------
 */

/** Generate a reasonably-unique id for a new task. */
export function generateId() {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Escape user-entered text before it is ever inserted as innerHTML. */
export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Return a YYYY-MM-DD string for "today" in the local timezone. */
export function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

/**
 * Turn a YYYY-MM-DD date string into a friendly label:
 * "Today", "Tomorrow", or "Mon, Jul 6".
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'No date';
  const today = todayISO();
  const target = new Date(`${dateStr}T00:00:00`);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().slice(0, 10);

  if (dateStr === today) return 'Today';
  if (dateStr === tomorrowISO) return 'Tomorrow';

  return target.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** Turn a 24h "HH:MM" string into "11:30 AM" style 12h formatting. */
export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hRaw, mRaw] = timeStr.split(':');
  let h = parseInt(hRaw, 10);
  const m = mRaw ?? '00';
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.padStart(2, '0')} ${suffix}`;
}

/**
 * Build the current week (Mon–Sun) as an array of chip descriptors
 * used by the date strip on the dashboard.
 */
export function getWeekStrip() {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const now = new Date();
  // JS getDay(): 0=Sun..6=Sat. Convert to Monday-first index (0=Mon..6=Sun).
  const todayIdx = (now.getDay() + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - todayIdx);

  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      label,
      dayNum: d.getDate(),
      isToday: i === todayIdx,
    };
  });
}

/** Debounce helper — used to keep the search input snappy. */
export function debounce(fn, delay = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Human label + color-safe class suffix for a priority level. */
export const PRIORITY_META = {
  high:   { label: 'High',   cssVar: '--priority-high' },
  medium: { label: 'Medium', cssVar: '--priority-medium' },
  low:    { label: 'Low',    cssVar: '--priority-low' },
};

// ADD to the very bottom of js/components/utils.js
/** Cute vector cat holding mint leaves — used on empty states. */
export function catIllustration() {
  return `
  <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="80" cy="150" rx="46" ry="8" fill="#88A38B" opacity="0.15"/>
    <path d="M50 60 L40 30 L62 48 Z" fill="#E9EDE3"/>
    <path d="M110 60 L120 30 L98 48 Z" fill="#E9EDE3"/>
    <path d="M52 58 L45 38 L60 50 Z" fill="#F6BFC0"/>
    <path d="M108 58 L115 38 L100 50 Z" fill="#F6BFC0"/>
    <circle cx="80" cy="90" r="46" fill="#F4F0E6"/>
    <circle cx="63" cy="88" r="4.5" fill="#333333"/>
    <circle cx="97" cy="88" r="4.5" fill="#333333"/>
    <path d="M63 84C63 84 60 80 57 82" stroke="#333333" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M97 84C97 84 100 80 103 82" stroke="#333333" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M70 100C74 106 86 106 90 100" stroke="#333333" stroke-width="2" stroke-linecap="round"/>
    <path d="M60 96H50M60 100H48M60 104H50" stroke="#C9C2AF" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M100 96H110M100 100H112M100 104H110" stroke="#C9C2AF" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M55 116C50 130 45 138 50 142C57 132 62 122 62 122" fill="#88A38B"/>
    <path d="M105 116C110 130 115 138 110 142C103 132 98 122 98 122" fill="#88A38B"/>
    <path d="M45 138C45 138 48 128 55 122" stroke="#4C7A5A" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M115 138C115 138 112 128 105 122" stroke="#4C7A5A" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`;
}