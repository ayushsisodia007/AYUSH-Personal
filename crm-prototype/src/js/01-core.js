/* ==========================================================================
   01-core: constants, formatting, icons. No DOM access in this file.
   ========================================================================== */
const VERSION = 3;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/* Demo "today" is fixed so the sample data stays consistent: 1 Nov 2026. Dates are day offsets from it. */
const dateOf = o => new Date(2026, 10, 1 + o);
const fmtD = o => { const d = dateOf(o); return d.getDate() + ' ' + MONTHS[d.getMonth()]; };
const fmtDW = o => DOW[dateOf(o).getDay()] + ' ' + fmtD(o);
const relD = o => o === 0 ? 'Today' : o === -1 ? 'Yesterday' : o === 1 ? 'Tomorrow' : fmtDW(o);
const isoOf = o => { const d = dateOf(o); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const offOf = iso => { const p = String(iso).split('-').map(Number); return Math.round((new Date(p[0], p[1] - 1, p[2]) - new Date(2026, 10, 1)) / 864e5); };
const fmtStamp = m => { const d = new Date(2026, 10, 1, 11, 42 + m); return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const fmtL = v => { v = Math.round(v * 10) / 10; return v >= 100 ? '₹' + (v / 100).toFixed(2).replace(/\.?0+$/, '') + ' Cr' : '₹' + v + 'L'; };
const sum = (a, f) => a.reduce((s, x) => s + (f ? f(x) : x), 0);
const hashStr = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sizeLabel = n => n < 50 ? '1-49' : n < 200 ? '50-199' : n < 1000 ? '200-999' : n < 5000 ? '1,000-4,999' : '5,000+';
const normCo = s => String(s).toLowerCase().replace(/\b(ltd|limited|pvt|private|inc|group|co|company|corp|llp)\b\.?/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const LABEL = { green: 'Green', yellow: 'Yellow', orange: 'Orange', red: 'Red' };
const RANK = { green: 0, yellow: 1, orange: 2, red: 3 };
const LEAD_STATUS = ['New', 'Contacted', 'Qualified', 'Nurturing', 'Converted', 'Disqualified'];
const LEAD_SOURCES = ['Website demo request', 'Webinar', 'Event', 'Referral', 'Inbound email', 'Cold outreach', 'Market Radar'];
const CONTACT_ROLES = ['Economic buyer', 'Decision maker', 'Champion', 'Influencer', 'Technical evaluator', 'Blocker', 'User'];
const FORECAST_CATS = ['Commit', 'Best Case', 'Pipeline'];
const LOSS_REASONS = ['Lost to competitor', 'Price too high', 'No budget', 'No decision made', 'Bad timing', 'Product gap', 'Champion left', 'Other'];
const ACT_TYPES = { call: 'Call', meeting: 'Meeting', email: 'Email', note: 'Note', task: 'Task', followup: 'Follow-up', reminder: 'Reminder' };
const TASK_TYPES = ['task', 'followup', 'reminder'];
const COMPETITORS = ['Vantage HR', 'Orbit People', 'Plumeria'];
const PERMS = [['leads.edit', 'Create and edit leads'], ['deals.edit', 'Edit opportunities and move stages'], ['accounts.edit', 'Edit accounts and contacts'], ['agents.approve', 'Approve or reject AI agent actions'], ['workflows.manage', 'Create and activate workflows'], ['settings.manage', 'Change settings and administration'], ['data.export', 'Export data']];

/* ---------- icons ---------- */
const I = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  deals: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.5c2 .8 3 2.8 3 5.5"/>',
  radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12 19 6"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  tasks: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="m8 12 3 3 5-6"/>',
  leads: '<path d="M3 4h18l-7 8.5V19l-4 2v-8.5z"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  flow: '<rect x="3" y="3" width="7" height="6" rx="1.5"/><rect x="14" y="15" width="7" height="6" rx="1.5"/><path d="M6.5 9v3.5a2 2 0 0 0 2 2H14M10 18h4"/>',
  agent: '<rect x="4" y="7" width="16" height="12" rx="3.5"/><path d="M12 3v4M9 13v1.5M15 13v1.5M2 12v3M22 12v3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.8M12 18.7v2.8M2.5 12h2.8M18.7 12h2.8M5.3 5.3l2 2M16.7 16.7l2 2M5.3 18.7l2-2M16.7 7.3l2-2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>', chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  clip: '<path d="m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7"/>',
  sort: '<path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/>', send: '<path d="M4 12 20 4l-5 16-3-7z"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>', pin: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  check: '<path d="m5 12 5 5 9-10"/>', warn: '<path d="M12 4 2.5 20h19zM12 10v4.5M12 17v.5"/>', play: '<path d="M7 5v14l11-7z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', undo: '<path d="M9 7 4 12l5 5M4 12h10a6 6 0 0 1 0 12"/>',
  note: '<path d="M5 3h10l4 4v14H5zM14 3v5h5M8 13h8M8 17h6"/>', bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6z"/>',
  plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/>', link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
  chevL: '<path d="m15 5-7 7 7 7"/>', chevR: '<path d="m9 5 7 7-7 7"/>', filter: '<path d="M4 5h16M7 12h10M10 19h4"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  building: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>'
};
const ic = (n, s) => '<svg class="ic" width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[n] || '') + '</svg>';
