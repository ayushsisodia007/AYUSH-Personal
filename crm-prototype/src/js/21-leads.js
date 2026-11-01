/* ==========================================================================
   21-leads: lead list, AI Lead Intelligence, qualification (BANT), duplicate detection and conversion.
   ========================================================================== */
const LS_CLASS = s => 'ls-' + s;
const leadChip = s => '<span class="chip ' + LS_CLASS(s) + '">' + s + '</span>';
function scoreCell(l) { return l.score == null ? '<span class="muted sm">Not scored</span>' : '<div class="mini"><i style="width:' + l.score * 0.6 + 'px;background:' + (l.score >= 75 ? 'var(--g)' : l.score >= 50 ? 'var(--y)' : 'var(--muted)') + '"></i><b class="num">' + l.score + '</b></div>'; }
const prioChip = p => p ? '<span class="chip pr-' + p + '">' + p + '</span>' : '';
function filteredLeads() {
  const f = UI.f.leads, key = sortKey('leads');
  const list = dbx().leads.filter(l => {
    if (f.status && l.status !== f.status) return false; if (f.source && l.source !== f.source) return false; if (f.own && l.own !== f.own) return false; if (UI.mine && l.own !== dbx().me) return false; if (f.ind && l.ind !== f.ind) return false;
    if (f.score === 'unscored' && l.score != null) return false; if (f.score === '70' && !(l.score != null && l.score >= 70)) return false; if (f.score === '50' && !(l.score != null && l.score >= 50 && l.score < 70)) return false; if (f.score === 'low' && !(l.score != null && l.score < 50)) return false;
    return matchQ(l.name + ' ' + l.company + ' ' + l.email + ' ' + l.source + ' ' + l.ind);
  });
  return list.sort((a, b) => key === 'created' ? b.created - a.created : (b.score == null ? -1 : b.score) - (a.score == null ? -1 : a.score));
}
VIEWS.leads = () => {
  const f = UI.f.leads, list = filteredLeads(), all = dbx().leads;
  const sc = LEAD_STATUS.map(s => [s, s, all.filter(l => l.status === s).length]);
  const rows = list.map(l => { const d = dupes(l), nba = leadNBA(l); return '<tr class="rowbtn" role="button" tabindex="0" data-act="open" data-t="lead" data-id="' + l.id + '"><td><div class="who">' + avN(l.name, hashStr(l.name)) + '<div><b>' + esc(l.name) + '</b><span>' + esc(l.title) + '</span></div></div></td><td><b>' + esc(l.company) + '</b>' + (d.length ? ' <span class="chip warnchip" title="' + esc(d.map(x => x.why + ': ' + x.label).join('; ')) + '">' + ic('copy', 11) + 'Possible duplicate</span>' : '') + '<div class="muted sm">' + esc(l.ind || 'Industry unknown') + ' · ' + esc(l.size || '') + '</div></td><td class="muted">' + esc(l.source) + '</td><td>' + av(l.own, 's') + '</td><td>' + leadChip(l.status) + '</td><td>' + scoreCell(l) + '</td><td>' + prioChip(l.score != null ? (l.priority || leadScore(l).priority) : '') + '</td><td class="muted sm">' + esc(nba.text.split('.')[0]) + '</td><td class="num muted">' + (l.created === 0 ? 'Today' : Math.abs(l.created) + 'd ago') + '</td></tr>'; }).join('');
  const active = Object.keys(f).filter(k => f[k]);
  return phead('Leads', 'Capture, score, qualify and convert. Lead Intelligence explains every score and proposes the next step for you to approve.', '<div class="row"><button class="btn" type="button" data-act="runleadagent">' + ic('sparkle', 14) + 'Run Lead Intelligence</button><button class="btn pri" type="button" data-act="create" data-id="lead">' + ic('plus', 14) + 'New lead</button></div>') +
    '<div class="card"><div class="ch">' + tabs('leadstatus', [['', 'All', all.length]].concat(sc), f.status || '') + '</div>' +
    '<div class="filters"><label>Source ' + sel('', [['', 'Any source']].concat(LEAD_SOURCES), f.source || '', 'data-onchange="leadfilter" data-k="source"') + '</label><label>Owner ' + sel('', [['', 'Anyone']].concat(ownerOpts()), f.own || '', 'data-onchange="leadfilter" data-k="own"') + '</label><label>Score ' + sel('', [['', 'Any score'], ['70', '70 and above'], ['50', '50 to 69'], ['low', 'Below 50'], ['unscored', 'Not scored']], f.score || '', 'data-onchange="leadfilter" data-k="score"') + '</label><label>Industry ' + sel('', [['', 'Any industry']].concat(Array.from(new Set(all.map(l => l.ind).filter(Boolean))).sort()), f.ind || '', 'data-onchange="leadfilter" data-k="ind"') + '</label>' + (active.length || UI.q ? '<button class="btn xs" type="button" data-act="clearfilter" data-k="leads">Clear filters</button>' : '') + '</div>' +
    '<div class="twrap"><table><thead><tr><th>Lead</th><th>Company</th><th>Source</th><th>Owner</th><th>Status</th><th>Score</th><th>Priority</th><th>Next best action</th><th>Created</th></tr></thead><tbody>' + (rows || '<tr><td colspan="9">' + empty('leads', 'No leads match', 'Clear a filter or create a lead.', '<button class="btn pri" type="button" data-act="create" data-id="lead">New lead</button>') + '</td></tr>') + '</tbody></table></div></div>';
};
ACT.leadfilter = t => { UI.f.leads[t.dataset.k] = t.value; };
const baseTab = ACT.tab;
ACT.tab = t => { if (t.dataset.g === 'leadstatus') { UI.f.leads.status = t.dataset.id; return; } return baseTab(t); };
GATE.runleadagent = 'leads.edit';
ACT.runleadagent = t => { startAgentRun('lead', t.dataset.id ? { onlyLead: t.dataset.id } : {}); return false; };
function startAgentRun(id, opts, cb) {
  const ag = G.agent(id); if (!ag.active) { toast(ag.n + ' is paused. Activate it in AI Agents first.'); return; }
  if (UI.runningAgents[id]) return; UI.runningAgents[id] = true; ag.running = true; render();
  setTimeout(() => { const out = runAgent(id, opts); ag.running = false; delete UI.runningAgents[id]; toast(out.length ? ag.n + ' proposed ' + out.length + ' action' + (out.length > 1 ? 's' : '') + '. Review them before anything changes.' : ag.n + ' found nothing new to propose.'); if (cb) cb(out); render(); }, 900);
}

/* ---------- lead drawer ---------- */
function leadIntelHtml(l) {
  const live = leadScore(l), pend = dbx().actions.filter(a => a.status === 'pending' && a.lead === l.id), nba = leadNBA(l), d = dupes(l);
  const sc = l.score != null ? l.score : null, shown = sc != null ? sc : live.score;
  const ring = '<div class="sring" style="--p:' + shown + '"><b>' + shown + '</b><span class="muted sm">' + (sc != null ? 'score' : 'preview') + '</span></div>';
  const bar = (n, v, mx) => '<div class="brow"><span>' + n + '</span><span class="meter"><i style="width:' + Math.max(2, v / mx * 100) + '%"></i></span><b class="num">' + v + '/' + mx + '</b></div>';
  return (sc == null ? '<div class="banner">' + ic('sparkle', 16) + ' This lead has not been scored. The numbers below are a preview. Run Lead Intelligence to enrich the record and propose a score for your approval.</div>' : '') +
    '<div class="sgrid">' + ring + '<div class="stack" style="gap:6px"><div class="row">' + prioChip(sc != null ? (l.priority || live.priority) : live.priority) + chip('Buying intent: ' + live.intent) + confChip(live.conf) + '</div><p class="sm">' + (live.score >= 75 ? 'Strong fit with clear buying signals. Prioritise this lead.' : live.score >= 50 ? 'Decent fit. Worth a short qualification call.' : 'Weak fit or little intent. Nurture instead of calling.') + '</p>' + (sc != null && sc !== live.score ? '<button class="btn xs" type="button" data-act="rescore" data-id="' + l.id + '">Score changed to ' + live.score + '. Update</button>' : '') + '</div></div>' +
    '<h3>Why this score</h3><div class="brows">' + bar('Fit', live.parts.fit, 55) + bar('Intent', live.parts.intent, 39) + bar('Engagement', live.parts.engagement, 9) + '</div><ul class="evl">' + live.why.map(w => '<li><b class="num">+' + w.pts + '</b> ' + esc(w.t) + '</li>').join('') + '</ul>' +
    '<h3>Buying intent signals</h3>' + (l.intent.length ? '<ul class="evl">' + l.intent.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '<p class="muted sm">No signals yet. ' + (l.enriched ? '' : 'Enrichment may find some.') + '</p>') +
    (d.length ? '<div class="banner warn">' + ic('copy', 16) + '<div><b>Possible duplicate</b>' + d.map(x => '<div class="sm">' + esc(x.why) + ': ' + (x.kind === 'Account' ? lnk('account', x.id, x.label) : esc(x.label)) + '</div>').join('') + '</div></div>' : '') +
    '<h3>Recommended next best action</h3><div class="nba"><b>' + esc(nba.text) + '</b><div class="muted sm">Why: ' + esc(nba.why) + '</div><div class="row mt">' + (l.status !== 'Converted' && l.status !== 'Disqualified' ? '<button class="btn xs" type="button" data-act="leadtask" data-id="' + l.id + '">' + ic('tasks', 12) + 'Create follow-up task</button><button class="btn xs" type="button" data-act="leadmail" data-id="' + l.id + '">' + ic('mail', 12) + 'Draft intro email</button>' : '') + (l.score == null ? '<button class="btn xs pri" type="button" data-act="runleadagent" data-id="' + l.id + '">' + ic('sparkle', 12) + 'Run Lead Intelligence</button>' : '') + '</div></div>' +
    (pend.length ? '<h3>Waiting for your approval</h3>' + pend.map(a => actionCard(a)).join('') : '');
}
DRAWERS.lead = id => {
  const l = G.lead(id); if (!l) return null; const tab = UI.drawer.tab || 'intel';
  const qn = [['b', 'Budget', 'Is there budget, or a clear budget owner?'], ['a', 'Authority', 'Are we talking to someone who can decide, or can we reach them?'], ['n', 'Need', 'Is there a real problem we solve, in their words?'], ['t', 'Timeline', 'Is there a date or event driving a decision?']];
  let body = '';
  if (tab === 'intel') body = leadIntelHtml(l);
  if (tab === 'details') body = '<div class="form2">' + field('Name', binp('lead:' + l.id + ':name', l.name)) + field('Job title', binp('lead:' + l.id + ':title', l.title)) + field('Company', binp('lead:' + l.id + ':company', l.company)) + field('Email', binp('lead:' + l.id + ':email', l.email, 'email')) + field('Phone', binp('lead:' + l.id + ':phone', l.phone)) + field('Source', bsel('lead:' + l.id + ':source', LEAD_SOURCES, l.source)) + field('Owner', bsel('lead:' + l.id + ':own', ownerOpts(), l.own), 'Assigning logs an audit entry') + field('Status', bsel('lead:' + l.id + ':status', LEAD_STATUS, l.status)) + field('Industry', binp('lead:' + l.id + ':ind', l.ind)) + field('Employees', binp('lead:' + l.id + ':emp', l.emp, 'number')) + field('Location', binp('lead:' + l.id + ':loc', l.loc)) + field('Website', binp('lead:' + l.id + ':site', l.site)) + dbx().customFields.filter(c => c.ent === 'lead').map(c => field(esc(c.n), binp('lead:' + l.id + ':custom.' + c.id, l.custom[c.id], c.t === 'Number' ? 'number' : 'text'))).join('') + '</div>' + field('Notes', '<textarea data-bind="lead:' + l.id + ':notes" rows="3">' + esc(l.notes) + '</textarea>') + (l.dq ? '<p class="muted sm">Disqualified: ' + esc(l.dq) + '</p>' : '');
  if (tab === 'qualify') body = '<p class="muted sm">Confirm what you learned in conversation. At least 3 of 4 are needed to qualify.</p><div class="bant">' + qn.map(q => '<div class="bq"><div><b>' + q[1] + '</b><div class="muted sm">' + q[2] + '</div></div>' + toggle('bant', l.id + '|' + q[0], l.bant[q[0]], q[1]) + '</div>').join('') + '</div><div class="row mt"><span class="chip ' + (bantCount(l) >= 3 ? 'src' : '') + '">' + bantCount(l) + ' of 4 confirmed</span></div><div class="row mt"><button class="btn pri" type="button" data-act="qualify" data-id="' + l.id + '"' + (l.status === 'Converted' || l.status === 'Qualified' ? ' disabled' : '') + '>Mark as qualified</button><button class="btn" type="button" data-act="nurture" data-id="' + l.id + '"' + (l.status === 'Converted' ? ' disabled' : '') + '>Move to nurturing</button><button class="btn" type="button" data-act="dqmodal" data-id="' + l.id + '"' + (l.status === 'Converted' ? ' disabled' : '') + '>Disqualify</button></div>' + (l.status === 'Qualified' ? '<div class="banner ok mt">' + ic('check', 16) + ' Qualified. Convert it into an account, contact and opportunity.</div>' : '');
  if (tab === 'activity') { const ev = dbx().acts.filter(a => a.link.lead === l.id).sort((a, b) => b.when - a.when); body = '<div class="row"><button class="btn xs pri" type="button" data-act="logact" data-lead="' + l.id + '">' + ic('plus', 12) + 'Log activity</button></div>' + (ev.length ? '<div class="tl">' + ev.map(tlItem).join('') + '</div>' : empty('activity', 'No activity yet', 'Log a call, email or note so engagement counts toward the score.')); }
  const done = l.status === 'Converted';
  return {
    title: l.name, wide: true, head: '<div class="who">' + avN(l.name, hashStr(l.name)) + '<div><h2>' + esc(l.name) + '</h2><span class="muted sm">' + esc(l.title) + ' at ' + esc(l.company) + '</span></div></div><div class="row mt">' + leadChip(l.status) + (l.score != null ? chip('Score ' + l.score) : chip('Not scored')) + prioChip(l.priority) + '<span class="muted sm">Owner</span>' + bsel('lead:' + l.id + ':own', ownerOpts(), l.own) + '</div>',
    tabs: tabs('drawertab', [['intel', 'AI Lead Intelligence'], ['details', 'Details'], ['qualify', 'Qualification'], ['activity', 'Activity']], tab), body,
    foot: done ? '<span class="muted">Converted to ' + lnk('account', l.conv.acc, G.acc(l.conv.acc).n) + ' ' + lnk('deal', l.conv.deal, 'the opportunity') + '</span>' : l.status === 'Disqualified' ? '<span class="muted">Disqualified: ' + esc(l.dq) + '</span>' : '<button class="btn pri" type="button" data-act="convertmodal" data-id="' + l.id + '">' + ic('arrow', 14) + 'Convert to account, contact and opportunity</button>'
  };
};
const baseTab2 = ACT.tab; ACT.tab = t => { if (t.dataset.g === 'drawertab') { UI.drawer.tab = t.dataset.id; return; } return baseTab2(t); };
GATE.bant = 'leads.edit'; ACT.bant = t => { const p = t.dataset.id.split('|'), l = G.lead(p[0]); l.bant[p[1]] = !l.bant[p[1]]; };
GATE.qualify = 'leads.edit'; ACT.qualify = t => { const r = qualifyLead(t.dataset.id); toast(r.ok ? 'Lead qualified. Next: convert it.' : r.msg); };
GATE.nurture = 'leads.edit'; ACT.nurture = t => { setLeadStatus(t.dataset.id, 'Nurturing'); toast('Moved to nurturing'); };
GATE.dqmodal = 'leads.edit'; ACT.dqmodal = t => { openModal('dq', { id: t.dataset.id }); return false; };
GATE.convertmodal = 'leads.edit'; ACT.convertmodal = t => { openModal('convert', { id: t.dataset.id }); return false; };
GATE.rescore = 'leads.edit'; ACT.rescore = t => { const l = G.lead(t.dataset.id), s = leadScore(l); audit(WHO.me(), 'Recalculated lead score', entOf('lead', Object.assign({}, l, { n: l.company })), l.score + ' to ' + s.score); l.score = s.score; l.priority = s.priority; };
GATE.leadtask = 'leads.edit'; ACT.leadtask = t => { const l = G.lead(t.dataset.id), n = leadNBA(l); addActivity({ type: 'task', subj: n.text.split('.')[0] + ': ' + l.name, when: 1, own: l.own, link: { lead: l.id }, notes: n.why, ai: true }); audit(WHO.me(), 'Created task', entOf('lead', Object.assign({}, l, { n: l.company })), n.text); toast('Task created for tomorrow'); };
GATE.leadmail = 'leads.edit'; ACT.leadmail = t => {
  const l = G.lead(t.dataset.id), first = l.name.split(' ')[0];
  const a = proposeAction('lead', { key: 'intro:' + l.id, kind: 'email_draft', title: 'Intro email to ' + l.name, field: 'Email (external)', to: 'Draft intro email', p: { subj: 'Scheduling at ' + l.company, body: 'Hi ' + first + ',\n\nI would like to introduce Kestrel and how we help teams like ' + l.company + ' plan shifts faster. Could we speak for 15 minutes this week?\n\nBest,\n' + me().n, link: { lead: l.id } }, conf: 0.7, ev: [{ t: 'Requested by ' + me().n + ' from the lead panel', src: 'User' }], lead: l.id, ent: { t: 'lead', id: l.id, l: l.company } });
  toast(a ? 'Draft created. Approve it below before anything is sent.' : 'A draft already exists for this lead.');
};
GATE.logact = null; ACT.logact = t => { openModal('activity', { link: { lead: t.dataset.lead } }); return false; };
function tlItem(e) {
  const a = e.act || e; const type = a.sys ? 'update' : a.type, icn = { call: 'phone', meeting: 'users', email: 'mail', note: 'note', task: 'tasks', followup: 'clock', reminder: 'clock', update: 'bolt', ticket: 'warn', ai: 'sparkle' }[type] || 'activity';
  return '<div class="tli"><span class="tic ' + type + '">' + ic(icn, 14) + '</span><div><b>' + esc(a.subj) + '</b>' + (a.notes ? '<div class="muted sm">' + esc(a.notes) + '</div>' : '') + '</div><span class="muted sm">' + fmtD(a.when) + (a.time ? ' · ' + a.time : '') + '</span></div>';
}

/* ---------- lead modals ---------- */
MODALS.lead = () => ({ title: 'New lead', sub: 'Kestrel checks for duplicates and the Lead Intelligence agent proposes a score for your approval.', submit: 'Create lead', body: '<div class="form2">' + field('Name *', '<input name="name" required placeholder="e.g. Rhea Malhotra">') + field('Job title', '<input name="title" placeholder="Head of Operations">') + field('Company *', '<input name="company" required placeholder="e.g. Cirrus Air" list="coList">') + field('Email', '<input name="email" type="email">') + field('Phone', '<input name="phone">') + field('Source', sel('source', LEAD_SOURCES, 'Website demo request')) + field('Owner', sel('own', ownerOpts(), dbx().me)) + field('Industry', '<input name="ind" placeholder="Filled by enrichment if known">') + field('Employees', '<input name="emp" type="number" min="0">') + field('Location', '<input name="loc">') + '</div><datalist id="coList">' + Object.keys(ENRICH).map(k => '<option value="' + esc(k.replace(/\b\w/g, c => c.toUpperCase())) + '">').join('') + '</datalist>' });
GATE.lead = 'leads.edit';
FORM.lead = f => {
  if (!f.name.trim() || !f.company.trim()) { toast('Name and company are required.'); return false; }
  const l = createLead({ name: f.name.trim(), title: f.title, company: f.company.trim(), email: f.email, phone: f.phone, source: f.source, own: f.own, ind: f.ind, emp: parseInt(f.emp, 10) || 0, loc: f.loc, intent: [] });
  const d = dupes(l), pend = dbx().actions.filter(a => a.status === 'pending' && a.lead === l.id).length;
  UI.view = 'leads'; UI.drawer = { t: 'lead', id: l.id, tab: 'intel' };
  toast('Lead created.' + (d.length ? ' Possible duplicate: ' + d[0].label + '.' : '') + (pend ? ' Lead Intelligence proposed a score for approval.' : ''));
};
MODALS.dq = c => ({ title: 'Disqualify lead', sub: 'Record why, so the team learns what is not a fit.', submit: 'Disqualify', body: '<input type="hidden" name="id" value="' + c.id + '">' + field('Reason', sel('reason', ['Company too small', 'No budget', 'Not a decision maker', 'Already using a competitor', 'Duplicate record', 'No response', 'Other'], 'Company too small')) });
GATE.dq = 'leads.edit'; FORM.dq = f => { setLeadStatus(f.id, 'Disqualified', f.reason); toast('Lead disqualified: ' + f.reason); };
MODALS.convert = c => {
  const l = G.lead(c.id), d = dupes(l).filter(x => x.kind === 'Account')[0];
  return { title: 'Convert lead', wide: true, sub: 'This creates three linked records and moves the activity history across.', submit: 'Convert lead', body: '<input type="hidden" name="id" value="' + l.id + '">' +
    '<div class="conv"><div class="cbox2"><h3>' + ic('building', 16) + ' Account</h3><label class="rad"><input type="radio" name="accMode" value="new"' + (d ? '' : ' checked') + '> Create new account</label>' + field('Account name', '<input name="accName" value="' + esc(l.company.replace(/\s+(Ltd|Pvt Ltd|Group)\.?$/i, '')) + '">') + '<label class="rad"><input type="radio" name="accMode" value="existing"' + (d ? ' checked' : '') + '> Attach to existing account</label>' + field('Existing account', sel('accId', dbx().accounts.map(a => [a.id, a.n]), d ? d.id : dbx().accounts[0].id), d ? 'Duplicate detected: ' + esc(d.label) : '') + '</div>' +
    '<div class="cbox2"><h3>' + ic('user', 16) + ' Contact</h3><p class="sm"><b>' + esc(l.name) + '</b><br>' + esc(l.title) + '<br>' + esc(l.email) + '</p>' + field('Role in the deal', sel('conRole', CONTACT_ROLES, 'Champion')) + '</div>' +
    '<div class="cbox2"><h3>' + ic('deals', 16) + ' Opportunity</h3>' + field('Description', '<input name="desc" value="' + esc((l.ind || 'New') + ' scheduling and payroll') + '">') + field('Amount (₹ lakh)', '<input name="amount" type="number" min="1" value="' + (l.emp >= 3000 ? 28 : l.emp >= 1000 ? 18 : 10) + '">') + field('Expected close', sel('closeDays', [['30', 'In 30 days'], ['45', 'In 45 days'], ['60', 'In 60 days'], ['90', 'In 90 days']], '45')) + '<div class="fld"><span>Products</span><div class="chk">' + dbx().products.map(p => '<label><input type="checkbox" name="prods" value="' + p.id + '"' + (p.id === 'p-sched' ? ' checked' : '') + '> ' + esc(p.n) + '</label>').join('') + '</div></div></div></div>' };
};
FORM.convert = f => {
  const r = convertLead(f.id, { accMode: f.accMode, accId: f.accId, accName: f.accName, conRole: f.conRole, desc: f.desc, amount: parseFloat(f.amount) || 10, closeDays: parseInt(f.closeDays, 10), prods: [].concat(f.prods || []) });
  if (!r) { toast('This lead was already converted.'); return false; }
  UI.view = 'leads'; UI.drawer = { t: 'account', id: r.a.id, tab: 'overview' };
  toast('Converted: account ' + r.a.n + ', contact ' + r.c.name + ' and a ' + fmtL(r.d.v) + ' opportunity.');
};
