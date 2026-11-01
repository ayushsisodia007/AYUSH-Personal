/* ==========================================================================
   24-activities: activity timeline, calendar, create/edit activity, and the Tasks view.
   ========================================================================== */
function linkChips(a) {
  const l = a.link, out = [];
  if (l.acc && G.acc(l.acc)) out.push(lnk('account', l.acc, G.acc(l.acc).n)); if (l.deal && G.deal(l.deal)) out.push(lnk('deal', l.deal, 'Opportunity')); if (l.con && G.con(l.con)) out.push(lnk('contact', l.con, G.con(l.con).name)); if (l.lead && G.lead(l.lead)) out.push(lnk('lead', l.lead, G.lead(l.lead).name));
  return out.join('');
}
const TYPE_IC = { call: 'phone', meeting: 'users', email: 'mail', note: 'note', task: 'tasks', followup: 'clock', reminder: 'clock', update: 'bolt' };
function actRow(a) {
  const done = taskDone(a) || (a.done), late = isOverdue(a);
  return '<div class="arow' + (done ? ' done' : '') + (late ? ' overdue' : '') + '"><button class="cbx' + (done ? ' on' : '') + '" type="button" data-act="complete" data-id="' + a.id + '" role="checkbox" aria-checked="' + done + '" aria-label="Mark ' + esc(a.subj) + ' as ' + (done ? 'not done' : 'done') + '">' + (done ? ic('check', 12) : '') + '</button><span class="tic ' + a.type + '">' + ic(TYPE_IC[a.type] || 'activity', 14) + '</span><div class="grow"><b>' + esc(a.subj) + '</b><div class="chips">' + linkChips(a) + (a.ai ? '<span class="chip src">' + ic('sparkle', 11) + 'AI suggested</span>' : '') + (a.wf ? '<span class="chip src">' + ic('flow', 11) + 'Workflow</span>' : '') + '</div></div><div class="when sm">' + dueLabel(a) + '<div class="muted">' + esc(a.time) + '</div></div>' + av(a.own, 's') + '<button class="btn xs" type="button" data-act="open" data-t="activity" data-id="' + a.id + '" aria-label="Edit activity">' + ic('edit', 12) + '</button></div>';
}
function filteredActs() {
  const f = UI.f.acts, ty = tabOf('acttype', 'all');
  return dbx().acts.filter(a => !a.sys && (ty === 'all' || (ty === 'task' ? isTaskLike(a) : a.type === ty)) && (!f.own || a.own === f.own) && (!UI.mine || a.own === dbx().me) && (!f.overdue || isOverdue(a)) && matchQ(a.subj + ' ' + a.notes + ' ' + (a.link.acc ? (G.acc(a.link.acc) || {}).n : '')));
}
function calendarView() {
  const first = new Date(2026, 10 + UI.calOff, 1), start = Math.round((first - new Date(2026, 10, 1)) / 864e5), dim = new Date(2026, 11 + UI.calOff, 0).getDate(), lead = first.getDay();
  const acts = filteredActs(), by = {}; acts.forEach(a => { (by[a.when] = by[a.when] || []).push(a); });
  let cells = DOW.map(d => '<div class="dow">' + d + '</div>').join('');
  for (let i = 0; i < lead; i++) cells += '<div class="cday blank"></div>';
  for (let d = 0; d < dim; d++) {
    const off = start + d, list = (by[off] || []).sort((a, b) => a.time.localeCompare(b.time));
    cells += '<button type="button" class="cday' + (off === 0 ? ' today' : '') + (off === UI.calDay ? ' sel' : '') + '" data-act="calday" data-d="' + off + '" aria-label="' + fmtDW(off) + ', ' + list.length + ' activities"><b>' + (d + 1) + '</b>' + list.slice(0, 3).map(a => '<span class="cev ' + a.type + (isOverdue(a) ? ' od' : '') + (a.done ? ' dn' : '') + '">' + esc(a.subj) + '</span>').join('') + (list.length > 3 ? '<span class="muted sm">+' + (list.length - 3) + ' more</span>' : '') + '</button>';
  }
  const dayActs = (by[UI.calDay] || []).sort((a, b) => a.time.localeCompare(b.time));
  return '<div class="calwrap"><div class="card"><div class="ch"><h2>' + MONTHS[first.getMonth()] + ' ' + first.getFullYear() + '</h2><div class="row"><button class="btn xs" type="button" data-act="calnav" data-d="-1" aria-label="Previous month">' + ic('chevL', 14) + '</button><button class="btn xs" type="button" data-act="calnav" data-d="0">Today</button><button class="btn xs" type="button" data-act="calnav" data-d="1" aria-label="Next month">' + ic('chevR', 14) + '</button></div></div><div class="cal">' + cells + '</div></div>' +
    '<div class="card"><div class="ch"><h2>' + relD(UI.calDay) + '</h2><button class="btn xs pri" type="button" data-act="newactday" data-d="' + UI.calDay + '">' + ic('plus', 12) + 'Add</button></div>' + (dayActs.length ? dayActs.map(actRow).join('') : empty('cal', 'Nothing on this day', 'Pick another day or add an activity.')) + '</div></div>';
}
VIEWS.activities = () => {
  const all = dbx().acts.filter(a => !a.sys), od = all.filter(isOverdue), td = all.filter(a => !a.done && a.when === 0), wk = all.filter(a => !a.done && a.when > 0 && a.when <= 7), dn = all.filter(a => a.done && a.when >= -30);
  const view = tabOf('actview', 'timeline'), ty = tabOf('acttype', 'all'), list = filteredActs();
  const groups = [['Overdue', list.filter(isOverdue).sort((a, b) => a.when - b.when)], ['Today', list.filter(a => !a.done && a.when === 0).sort((a, b) => a.time.localeCompare(b.time))], ['Upcoming', list.filter(a => !a.done && a.when > 0).sort((a, b) => a.when - b.when)], ['Completed', list.filter(a => a.done).sort((a, b) => b.when - a.when).slice(0, 12)]];
  const kp = [['Overdue', od.length, 'late', { overdue: true }], ['Due today', td.length], ['Next 7 days', wk.length], ['Completed, 30 days', dn.length]];
  return phead('Activities', 'Calls, meetings, emails, notes, tasks, follow-ups and reminders, linked to leads, accounts, contacts and deals.', '<div class="row">' + tabs('actview', [['timeline', 'Timeline'], ['calendar', 'Calendar']], view) + '<button class="btn pri" type="button" data-act="create" data-id="activity">' + ic('plus', 14) + 'New activity</button></div>') +
    '<div class="sumstrip">' + kp.map(k => '<div><span class="muted sm">' + k[0] + '</span><b class="num ' + (k[2] && k[1] ? k[2] : '') + '">' + k[1] + '</b></div>').join('') + '</div>' +
    '<div class="card"><div class="ch">' + tabs('acttype', [['all', 'All']].concat(Object.keys(ACT_TYPES).map(k => [k, ACT_TYPES[k] + 's'])), ty) + '<div class="row"><label class="muted sm">Owner ' + sel('', [['', 'Anyone']].concat(ownerOpts()), UI.f.acts.own || '', 'data-onchange="actown"') + '</label><button class="btn xs' + (UI.f.acts.overdue ? ' pri' : '') + '" type="button" data-act="actoverdue">' + (UI.f.acts.overdue ? 'Showing overdue only' : 'Overdue only') + '</button></div></div>' +
    (view === 'calendar' ? calendarView() : groups.map(g => g[1].length ? '<h3 class="grp ' + (g[0] === 'Overdue' ? 'late' : '') + '">' + g[0] + ' <span class="muted sm">' + g[1].length + '</span></h3>' + g[1].map(actRow).join('') : '').join('') || empty('activity', 'No activities match', 'Change a filter or create an activity.')) + '</div>';
};
ACT.actown = t => { UI.f.acts.own = t.value; };
ACT.actoverdue = () => { UI.f.acts.overdue = !UI.f.acts.overdue; };
ACT.calday = t => { UI.calDay = parseInt(t.dataset.d, 10); };
ACT.calnav = t => { const d = parseInt(t.dataset.d, 10); UI.calOff = d === 0 ? 0 : UI.calOff + d; if (d === 0) UI.calDay = 0; };
ACT.newactday = t => { openModal('activity', { when: parseInt(t.dataset.d, 10) }); return false; };
ACT.logact = t => { const l = {}; ['lead', 'acc', 'deal', 'con'].forEach(k => { if (t.dataset[k]) l[k] = t.dataset[k]; }); openModal('activity', { link: l }); return false; };

MODALS.activity = c => {
  const x = c.id ? G.act(c.id) : null, l = x ? x.link : (c.link || {}), when = x ? x.when : (c.when != null ? c.when : 1);
  const opt = (arr, empty_) => [['', empty_]].concat(arr);
  return { title: x ? 'Edit activity' : 'New activity', wide: true, submit: x ? 'Save activity' : 'Create activity', body: '<input type="hidden" name="id" value="' + (x ? x.id : '') + '"><div class="form2">' + field('Type', sel('type', Object.keys(ACT_TYPES).map(k => [k, ACT_TYPES[k]]), x ? x.type : (c.type || 'task'))) + field('Subject *', '<input name="subj" required value="' + esc(x ? x.subj : '') + '" placeholder="e.g. Call Priya about the quote">') + field('Date', '<input name="date" type="date" value="' + isoOf(when) + '">') + field('Time', '<input name="time" type="time" value="' + (x ? x.time : '10:00') + '">') + field('Owner', sel('own', ownerOpts(), x ? x.own : dbx().me)) + field('Duration (min)', '<input name="dur" type="number" min="0" value="' + (x ? x.dur : 30) + '">') +
    field('Account', sel('acc', opt(dbx().accounts.map(a => [a.id, a.n]), 'None'), l.acc || '')) + field('Opportunity', sel('deal', opt(dbx().deals.map(d => [d.id, dealAcc(d).n + ' (' + d.stage + ')']), 'None'), l.deal || '')) + field('Contact', sel('con', opt(dbx().contacts.map(k => [k.id, k.name + ', ' + G.acc(k.acc).n]), 'None'), l.con || '')) + field('Lead', sel('lead', opt(dbx().leads.map(k => [k.id, k.name + ', ' + k.company]), 'None'), l.lead || '')) + '</div>' + field('Notes', '<textarea name="notes" rows="3">' + esc(x ? x.notes : '') + '</textarea>') + '<label class="rad"><input type="checkbox" name="done" value="1"' + (x && x.done ? ' checked' : '') + '> Already done</label>' };
};
FORM.activity = f => {
  if (!f.subj.trim()) { toast('Add a subject.'); return false; }
  const link = {}; ['acc', 'deal', 'con', 'lead'].forEach(k => { if (f[k]) link[k] = f[k]; });
  if (link.deal && !link.acc) link.acc = G.deal(link.deal).acc; if (link.con && !link.acc) link.acc = G.con(link.con).acc;
  const o = { type: f.type, subj: f.subj.trim(), when: offOf(f.date), time: f.time || '10:00', own: f.own, dur: parseInt(f.dur, 10) || 0, notes: f.notes, link, done: !!f.done };
  if (f.id) { Object.assign(G.act(f.id), o); audit(WHO.me(), 'Edited activity', entOf('activity', o), o.subj); toast('Activity saved'); }
  else { const a = addActivity(o); audit(WHO.me(), 'Created activity', entOf('activity', a), ACT_TYPES[a.type] + ' on ' + fmtD(a.when)); toast(ACT_TYPES[a.type] + ' created for ' + fmtDW(a.when)); }
};
GATE.activity = null;

/* ---------- Tasks ---------- */
VIEWS.tasks = () => {
  const f = tabOf('taskf', 'open'), all = dbx().acts.filter(a => isTaskLike(a) && (!UI.mine || a.own === dbx().me) && matchQ(a.subj + ' ' + a.notes));
  const buckets = { open: all.filter(a => !taskDone(a)), overdue: all.filter(isOverdue), done: all.filter(taskDone), ai: all.filter(a => a.ai && !taskDone(a)) };
  const list = (buckets[f] || []).sort((a, b) => a.when - b.when);
  return phead('Tasks', 'Kestrel and your workflows write most of these from calls, email, tickets and Market Radar. Tick one to clear it.', '<div class="row">' + tabs('taskf', [['open', 'Open', buckets.open.length], ['overdue', 'Overdue', buckets.overdue.length], ['ai', 'AI suggested', buckets.ai.length], ['done', 'Done', buckets.done.length]], f) + '<button class="btn pri" type="button" data-act="newtask">' + ic('plus', 14) + 'New task</button></div>') + '<section class="card">' + (list.length ? list.map(actRow).join('') : empty('tasks', f === 'done' ? 'Nothing completed yet' : 'Nothing here', f === 'overdue' ? 'No overdue tasks. Nice.' : 'Create a task or ask an agent to find one.')) + '</section>';
};
ACT.newtask = () => { openModal('activity', { type: 'task', when: 1 }); return false; };
