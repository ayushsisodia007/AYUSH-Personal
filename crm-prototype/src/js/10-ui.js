/* ==========================================================================
   10-ui: DOM helpers, UI state, router, event delegation, drawers, modals and shared components.
   Views register themselves in VIEWS, click handlers in ACT, form handlers in FORM.
   ========================================================================== */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const VIEWS = {}, ACT = {}, FORM = {}, DRAWERS = {}, MODALS = {}, BIND = {}, GATE = {};
let sampleFn = null;
const UI = { view: 'dashboard', q: '', mine: false, sort: 'value', period: 'quarter', f: { deals: {}, leads: {}, cust: {}, acts: {}, contacts: {} }, drawer: null, modal: null, menu: false, tabs: {}, dealView: 'board', selDeal: 'd-harbor', selCust: 'cobalt', selCall: 'c1', selAgent: 'deal', selWf: 'wf-lead', calOff: 0, calDay: 0, wfSim: null, flash: '', insight: null, insightBusy: false, simCust: 'cobalt', lastScan: null, runningAgents: {}, callBusy: false };
const tabOf = (g, d) => UI.tabs[g] || d;

const NAV = [
  { g: 'Sell', items: [['dashboard', 'Dashboard', 'home'], ['leads', 'Leads', 'leads'], ['deals', 'Deals', 'deals'], ['customers', 'Customers', 'users'], ['activities', 'Activities', 'activity'], ['calls', 'Calls', 'phone'], ['tasks', 'Tasks', 'tasks']] },
  { g: 'Intelligence', items: [['radar', 'Market Radar', 'radar'], ['agents', 'AI Agents', 'agent'], ['workflows', 'Workflow Studio', 'flow']] },
  { g: 'Admin', items: [['settings', 'Settings', 'gear']] }
];

/* ---------- small components ---------- */
const userIdx = id => Math.max(0, dbx().users.findIndex(u => u.id === id));
const initials = n => n.replace(/^(Dr\.|Prof\.|Capt\.)\s*/, '').split(' ').slice(0, 2).map(x => x[0]).join('').toUpperCase();
const av = (id, cls) => { const u = G.user(id); return u ? '<span class="av ' + (cls || '') + '" style="background:var(--av' + (userIdx(id) % 5) + ')" title="' + esc(u.n) + '">' + initials(u.n) + '</span>' : ''; };
const avN = (name, i, cls) => '<span class="av ' + (cls || '') + '" style="background:var(--av' + ((i || hashStr(name)) % 5) + ')">' + esc(initials(name)) + '</span>';
const pill = s => '<span class="hp ' + s + '">' + LABEL[s] + '</span>';
const chip = (t, c) => '<span class="chip ' + (c || '') + '">' + t + '</span>';
const stageChip = s => '<span class="chip s-' + esc(s.replace(/\s+/g, '')) + '">' + esc(s) + '</span>';
const lnk = (t, id, label, tab) => '<button class="chip lnk" type="button" data-act="open" data-t="' + t + '" data-id="' + esc(id) + '"' + (tab ? ' data-tab="' + tab + '"' : '') + '>' + esc(label) + '</button>';
const confChip = c => '<span class="chip" title="How sure the agent is. Check the evidence before approving.">' + Math.round(c * 100) + '% confidence</span>';
const meter = (v, max, cls) => '<span class="meter ' + (cls || '') + '"><i style="width:' + Math.max(2, Math.min(100, v / max * 100)) + '%"></i></span>';
const empty = (icon, title, text, btn) => '<div class="empty">' + ic(icon, 28) + '<b>' + title + '</b><p class="muted">' + text + '</p>' + (btn || '') + '</div>';
const tabs = (g, items, cur) => '<div class="pills" role="group" aria-label="' + g + '">' + items.map(i => '<button class="pillbtn" type="button" data-act="tab" data-g="' + g + '" data-id="' + i[0] + '" aria-pressed="' + (cur === i[0]) + '">' + i[1] + (i[2] != null ? '<span class="badge">' + i[2] + '</span>' : '') + '</button>').join('') + '</div>';
const field = (label, inner, hint) => '<label class="fld"><span>' + label + '</span>' + inner + (hint ? '<small class="muted">' + hint + '</small>' : '') + '</label>';
const sel = (name, opts, cur, extra) => '<select name="' + name + '" ' + (extra || '') + '>' + opts.map(o => { const a = Array.isArray(o) ? o : [o, o]; return '<option value="' + esc(a[0]) + '"' + (String(a[0]) === String(cur) ? ' selected' : '') + '>' + esc(a[1]) + '</option>'; }).join('') + '</select>';
const bsel = (bind, opts, cur) => sel('', opts, cur, 'data-bind="' + bind + '"');
const binp = (bind, val, type, extra) => '<input data-bind="' + bind + '" type="' + (type || 'text') + '" value="' + esc(val == null ? '' : val) + '" ' + (extra || '') + '>';
const ownerOpts = () => dbx().users.filter(u => u.status === 'Active' && u.role !== 'readonly').map(u => [u.id, u.n]);
const toggle = (act, id, on, label) => '<button class="tgl" type="button" role="switch" aria-checked="' + !!on + '" aria-label="' + esc(label || 'Toggle') + '" data-act="' + act + '" data-id="' + esc(id) + '"><i></i></button>';
const sect = (t, right) => '<div class="sect"><h2>' + t + '</h2>' + (right || '') + '</div>';
const phead = (t, p, right) => '<div class="phead"><div><h1>' + esc(t) + '</h1>' + (p ? '<p>' + esc(p) + '</p>' : '') + '</div>' + (right || '') + '</div>';
const matchQ = s => { const q = UI.q.trim().toLowerCase(); return !q || String(s).toLowerCase().indexOf(q) >= 0; };
const filterChip = (label, act) => '<span class="chip src">' + esc(label) + ' <button class="x" type="button" aria-label="Clear filter" data-act="' + act + '">' + ic('close', 12) + '</button></span>';
const sortKey = v => v === 'leads' ? (UI.sort === 'created' ? 'created' : 'score') : (UI.sort === 'due' ? 'due' : 'value');
const sortLabel = () => ({ value: 'value', due: 'close date', score: 'score', created: 'newest' })[sortKey(UI.view)];
const dueLabel = a => a.when < 0 ? '<span class="late">' + Math.abs(a.when) + ' day' + (a.when < -1 ? 's' : '') + ' overdue</span>' : relD(a.when);

/* ---------- toast, notices ---------- */
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 3200); }
function need(perm) { if (can(perm)) return true; toast(myRole().n + ' role cannot do this. Switch role in Settings, Users.'); return false; }

/* ---------- shell ---------- */
function badges() {
  return { leads: dbx().leads.filter(l => l.status === 'New').length, customers: atRiskAccounts().length, calls: pendingForCall('c1').length + dbx().calls.filter(c => c.transcript.length && !c.processed).length, tasks: dbx().acts.filter(a => isTaskLike(a) && !taskDone(a)).length, radar: dbx().radarGap.targetsAdded ? 0 : 1, agents: pendingActions().length };
}
function renderShell() {
  const b = badges();
  $('#nav').innerHTML = NAV.map(g => '<div class="sec">' + g.g + '</div>' + g.items.map(v => '<button type="button" data-act="go" data-id="' + v[0] + '"' + (v[0] === UI.view ? ' aria-current="page"' : '') + '>' + ic(v[2]) + '<span class="lab">' + v[1] + '</span>' + (b[v[0]] ? '<span class="badge' + (v[0] === 'customers' ? ' alert' : v[0] === 'agents' ? ' acc' : '') + '">' + b[v[0]] + '</span>' : '') + '</button>').join('')).join('');
  const av_ = dbx().leads.filter(l => l.ind === 'Aviation' || l.source === 'Market Radar').length, ren = customers().filter(a => a.renew != null && a.renew <= 120).length, vh = dbx().deals.filter(d => isOpen(d) && d.comps.indexOf('Vantage HR') >= 0).length;
  $('#plays').innerHTML = [['leads', 'Aviation push', av_, { ind: 'Aviation' }], ['customers', 'Q4 renewals', ren, { renew: 120 }], ['deals', 'Beat Vantage HR', vh, { comp: 'Vantage HR' }]].map((p, i) => '<button type="button" data-act="play" data-id="' + p[0] + '" data-i="' + i + '"><span class="lab">' + p[1] + '</span><span class="badge">' + p[2] + '</span></button>').join('');
  $('#members').innerHTML = dbx().users.filter(u => u.status === 'Active' && u.id !== dbx().me).slice(0, 5).map(u => '<span class="av" style="background:var(--av' + (userIdx(u.id) % 5) + ')" title="' + esc(u.n + ', ' + u.title) + '">' + initials(u.n) + '<i class="on"></i></span>').join('');
  const m = me();
  $('#me').innerHTML = av(m.id) + '<div><b>' + esc(m.n) + '</b><span class="muted sm">' + esc(myRole().n) + '</span></div><button class="tbtn" id="themeBtn" type="button">Theme</button>';
  $('#sortBtn').innerHTML = ic('sort', 16) + '<span>Sort: ' + sortLabel() + '</span>';
  $('#meBtn').innerHTML = ic('user', 16) + '<span>Mine</span>'; $('#meBtn').setAttribute('aria-pressed', UI.mine);
  $('#jBtn').innerHTML = ic('route', 16) + '<span>Demo journey</span>'; $('#aiBtn').innerHTML = ic('sparkle', 16) + '<span>Ask Kestrel AI</span>'; $('#addBtn').innerHTML = ic('plus', 16) + '<span>Create</span>';
  $('#q').placeholder = { leads: 'Search leads…', deals: 'Search deals…', customers: 'Search accounts and contacts…', activities: 'Search activities…', tasks: 'Search tasks…' }[UI.view] || 'Search deals, customers, contacts…';
  const menu = $('#createMenu'); menu.hidden = !UI.menu;
  menu.innerHTML = [['lead', 'New lead', 'leads'], ['deal', 'New opportunity', 'deals'], ['account', 'New account', 'building'], ['contact', 'New contact', 'user'], ['activity', 'New activity', 'cal']].map(x => '<button type="button" data-act="create" data-id="' + x[0] + '">' + ic(x[2], 16) + x[1] + '</button>').join('');
}
function renderMain() { const v = VIEWS[UI.view]; $('#main').innerHTML = v ? v() : ''; }
function renderDrawer() {
  const host = $('#drawerHost'), old = $('.drawer .dbody', host), sc = old ? old.scrollTop : 0;
  if (!UI.drawer) { host.innerHTML = ''; document.body.classList.remove('lock'); return; }
  const d = DRAWERS[UI.drawer.t](UI.drawer.id, UI.drawer.tab);
  if (!d) { UI.drawer = null; host.innerHTML = ''; return; }
  host.innerHTML = '<div class="dov" data-act="closedrawer"></div><aside class="drawer ' + (d.wide ? 'wide' : '') + '" role="dialog" aria-label="' + esc(d.title) + '"><div class="dhead"><div class="dt">' + d.head + '</div><button class="x2" type="button" data-act="closedrawer" aria-label="Close">' + ic('close', 18) + '</button></div>' + (d.tabs ? '<div class="dtabs">' + d.tabs + '</div>' : '') + '<div class="dbody">' + d.body + '</div>' + (d.foot ? '<div class="dfoot">' + d.foot + '</div>' : '') + '</aside>';
  const nb = $('.drawer .dbody', host); if (nb) nb.scrollTop = sc;
}
function render() {
  renderShell(); renderMain(); renderDrawer(); persist(); drainNotices();
}
function rerender() { const sc = window.scrollY; render(); window.scrollTo(0, sc); }
function drainNotices() { if (NOTICES.length) { toast(NOTICES.length > 1 ? NOTICES[NOTICES.length - 1] + ' (+' + (NOTICES.length - 1) + ' more)' : NOTICES[0]); NOTICES.length = 0; } }
function go(v, filt) {
  UI.view = v; UI.drawer = null; UI.menu = false; if (v === 'deals' && filt && !filt.stage) UI.tabs.dealview = 'list';
  if (filt) { const k = { deals: 'deals', leads: 'leads', customers: 'cust', activities: 'acts', tasks: 'acts' }[v]; if (k) UI.f[k] = Object.assign({}, filt); }
  try { history.replaceState(null, '', '#' + v); } catch (e) { }
  render(); window.scrollTo(0, 0);
}
const openDrawer = (t, id, tab) => { UI.drawer = { t, id, tab: tab || null }; render(); };
const closeDrawer = () => { UI.drawer = null; render(); };
function openModal(t, ctx) {
  UI.modal = { t, ctx: ctx || {} }; const m = MODALS[t](UI.modal.ctx);
  $('#modalHost').innerHTML = '<div class="ov" data-act="closemodal"><form class="modal ' + (m.wide ? 'wide' : '') + '" data-form="' + t + '" role="dialog" aria-label="' + esc(m.title) + '"><h2>' + m.title + '</h2>' + (m.sub ? '<p class="muted sm">' + m.sub + '</p>' : '') + '<div class="mbody">' + m.body + '</div><div class="row end"><button class="btn" type="button" data-act="closemodal">Cancel</button><button class="btn pri" type="submit">' + (m.submit || 'Save') + '</button></div></form></div>';
  setTimeout(() => { const i = $('#modalHost input:not([type=hidden]),#modalHost select,#modalHost textarea'); if (i) i.focus(); }, 0);
}
function closeModal() { UI.modal = null; $('#modalHost').innerHTML = ''; }
const formData = f => { const o = {}; new FormData(f).forEach((v, k) => { o[k] = o[k] != null ? [].concat(o[k], v) : v; }); return o; };

/* ---------- event delegation ---------- */
document.addEventListener('click', e => {
  if (UI.menu && !e.target.closest('#createMenu,#addBtn')) { UI.menu = false; renderShell(); }
  const t = e.target.closest('[data-act]'); if (!t) return;
  if (e.target.closest('select,input,textarea,option') && !t.matches('select,input,textarea')) return;
  const name = t.dataset.act, fn = ACT[name]; if (!fn) return;
  if (GATE[name] && !need(GATE[name])) return;
  if (fn(t, e) !== false) rerender();
});
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault();
  const name = f.dataset.form; if (GATE[name] && !need(GATE[name])) return;
  const r = FORM[name](formData(f), f);
  if (r !== false) { closeModal(); rerender(); }
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-bind]'); if (el) { const p = el.dataset.bind.split(':'); const perm = { deal: 'deals.edit', lead: 'leads.edit', acc: 'accounts.edit', con: 'accounts.edit', act: null, set: 'settings.manage' }[p[0]]; if (perm && !need(perm)) { rerender(); return; } const r = BIND[p[0]](p[1], p[2], el.type === 'checkbox' ? el.checked : el.value, el); if (r !== false) rerender(); return; }
  const o = e.target.closest('[data-onchange]'); if (o && ACT[o.dataset.onchange]) { const nm = o.dataset.onchange; if (GATE[nm] && !need(GATE[nm])) { rerender(); return; } if (ACT[nm](o, e) !== false) rerender(); }
});
document.addEventListener('input', e => { if (e.target.id === 'q') { UI.q = e.target.value; renderMain(); } });
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role=button][tabindex],tr[tabindex],.kcard[tabindex],.task[tabindex],.trow[tabindex],.smnode') && !e.target.closest('input,select,textarea,button')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  if (e.key === 'Escape') { if (UI.modal) closeModal(); else if (UI.drawer) closeDrawer(); else if (chat.open) { chat.open = false; $('#chat').classList.remove('open'); } else if (UI.menu) { UI.menu = false; renderShell(); } }
});

/* ---------- core actions ---------- */
ACT.go = t => { const v = t.dataset.id, k = { deals: 'deals', leads: 'leads', customers: 'cust', activities: 'acts', tasks: 'acts' }[v]; if (k && UI.view !== v) UI.f[k] = {}; if (v === 'deals') UI.tabs.dealview = 'board'; go(v); return false; };
ACT.tab = t => { UI.tabs[t.dataset.g] = t.dataset.id; };
ACT.play = t => { const i = Number(t.dataset.i); const f = [{ ind: 'Aviation' }, { renew: 120 }, { comp: 'Vantage HR' }][i]; UI.q = ''; $('#q').value = ''; go(t.dataset.id, f); return false; };
ACT.open = t => { const ty = t.dataset.t, id = t.dataset.id; if (ty === 'account') return openDrawer('account', id, t.dataset.tab), false; if (ty === 'deal') return openDrawer('deal', id, t.dataset.tab), false; if (ty === 'lead') return openDrawer('lead', id, t.dataset.tab), false; if (ty === 'contact') { const c = G.con(id); UI.drawer = { t: 'account', id: c.acc, tab: 'people' }; render(); return false; } if (ty === 'call') { UI.selCall = id; go('calls'); return false; } if (ty === 'workflow') { UI.selWf = id; go('workflows'); return false; } if (ty === 'agent') { UI.selAgent = id; go('agents'); return false; } if (ty === 'activity') { openModal('activity', { id }); return false; } return false; };
ACT.closedrawer = (t, e) => { if (e.target.classList.contains('dov') || t.classList.contains('x2') || t.closest('.x2')) { UI.drawer = null; } else return false; };
ACT.closemodal = (t, e) => { if (e.target.classList.contains('ov') || t.tagName === 'BUTTON') { closeModal(); return false; } return false; };
ACT.togglemenu = () => { UI.menu = !UI.menu; };
ACT.create = t => { UI.menu = false; const id = t.dataset.id; if (!need({ lead: 'leads.edit', deal: 'deals.edit', account: 'accounts.edit', contact: 'accounts.edit', activity: null }[id] || 'leads.edit') && id !== 'activity') return false; openModal(id === 'lead' ? 'lead' : id === 'deal' ? 'deal' : id === 'account' ? 'account' : id === 'contact' ? 'contact' : 'activity', {}); return false; };
ACT.clearfilter = t => { const k = t.dataset.k; UI.f[k] = {}; };
ACT.scrollto = t => { const el = document.getElementById(t.dataset.id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return false; };
ACT.toast = t => { toast(t.dataset.id); return false; };
ACT.theme = () => { const r = document.documentElement, dark = r.dataset.theme === 'dark' || (!r.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches); r.dataset.theme = dark ? 'light' : 'dark'; return false; };
ACT.complete = t => { const a = G.act(t.dataset.id); if (a.auto) { toast('This one completes itself when you finish the work.'); return false; } setDone(a.id, !a.done); };
ACT.ask = t => { ask(t.dataset.q); return false; };
ACT.chat = () => { chat.open = true; $('#chat').classList.add('open'); paintChat(); $('#cin').focus(); return false; };
$('#sortBtn').addEventListener('click', () => { const order = UI.view === 'leads' ? ['score', 'created'] : ['value', 'due']; UI.sort = order[(order.indexOf(sortKey(UI.view)) + 1) % order.length]; rerender(); });
$('#meBtn').addEventListener('click', () => { UI.mine = !UI.mine; rerender(); });
$('#aiBtn').addEventListener('click', () => { chat.open = !chat.open; $('#chat').classList.toggle('open', chat.open); paintChat(); if (chat.open) $('#cin').focus(); });
$('#addBtn').addEventListener('click', e => { e.stopPropagation(); UI.menu = !UI.menu; renderShell(); });
$('#jBtn').addEventListener('click', () => openDrawer('journey', 'j'));
document.addEventListener('click', e => { if (e.target.id === 'themeBtn') ACT.theme(); });

/* generic field binding: data-bind="entity:id:field" */
BIND.deal = (id, f, v) => {
  const d = G.deal(id), a = dealAcc(d);
  if (f === 'stage') { if (v === 'Lost') { openModal('lose', { id }); return false; } if (v === 'Won') { openModal('win', { id }); return false; } moveDeal(id, v); toast(a.n + ' moved to ' + v); return; }
  if (f === 'due') { setDealDue(id, offOf(v)); return; }
  if (f === 'decide') { d.decide = offOf(v); return; }
  if (f === 'v') { const n = parseFloat(v); if (n > 0) { audit(WHO.me(), 'Changed amount', entOf('deal', Object.assign({}, d, { n: a.n })), fmtL(d.v) + ' to ' + fmtL(n)); d.v = n; } return; }
  if (f === 'prob') { d.prob = v === '' ? null : Math.max(0, Math.min(100, parseFloat(v))); audit(WHO.me(), 'Changed probability', entOf('deal', Object.assign({}, d, { n: a.n })), d.prob == null ? 'Back to stage default' : d.prob + '%'); return; }
  if (f === 'own') { const o = d.own; d.own = v; audit(WHO.me(), 'Reassigned opportunity', entOf('deal', Object.assign({}, d, { n: a.n })), G.user(o).n + ' to ' + G.user(v).n); return; }
  if (f.indexOf('custom.') === 0) { d.custom[f.slice(7)] = v; return; }
  const old = d[f]; d[f] = v; audit(WHO.me(), 'Edited opportunity', entOf('deal', Object.assign({}, d, { n: a.n })), f + ': ' + old + ' to ' + v);
};
BIND.lead = (id, f, v) => {
  const l = G.lead(id);
  if (f === 'own') { const o = l.own; l.own = v; audit(WHO.me(), 'Assigned lead', entOf('lead', Object.assign({}, l, { n: l.company })), G.user(o).n + ' to ' + G.user(v).n); toast('Lead assigned to ' + G.user(v).n); return; }
  if (f === 'status') { if (v === 'Disqualified') { openModal('dq', { id }); return false; } if (v === 'Qualified' && bantCount(l) < 3) { toast('Confirm at least 3 of the 4 BANT criteria first.'); return; } setLeadStatus(id, v); return; }
  if (f === 'emp') { l.emp = parseInt(v, 10) || 0; l.size = sizeLabel(l.emp); return; }
  if (f.indexOf('bant.') === 0) { l.bant[f.slice(5)] = !!v; return; }
  if (f.indexOf('custom.') === 0) { l.custom[f.slice(7)] = v; return; }
  l[f] = v; audit(WHO.me(), 'Edited lead', entOf('lead', Object.assign({}, l, { n: l.company })), f);
};
BIND.acc = (id, f, v) => { const a = G.acc(id); if (f === 'own') { const o = a.own; a.own = v; audit(WHO.me(), 'Reassigned account', entOf('account', a), G.user(o).n + ' to ' + G.user(v).n); return; } if (f.indexOf('custom.') === 0) { a.custom[f.slice(7)] = v; return; } a[f] = v; audit(WHO.me(), 'Edited account', entOf('account', a), f); };
BIND.con = (id, f, v) => { if (f === 'role') { setContactRole(id, v); return; } const c = G.con(id); c[f] = v; audit(WHO.me(), 'Edited contact', entOf('contact', c), f); };
BIND.act = (id, f, v) => { const a = G.act(id); if (f === 'when') a.when = offOf(v); else a[f] = v; };
BIND.set = (id, f, v, el) => BIND.settings(id, f, v, el);
