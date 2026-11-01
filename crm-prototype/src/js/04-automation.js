/* ==========================================================================
   04-automation: AI agents + agent actions (approval queue) and the workflow engine. No DOM access.
   Guardrails: agents only PROPOSE. Nothing changes until a person approves. Every change is audited and
   most are reversible. External messages are never sent in this prototype, approval only records intent.
   ========================================================================== */
const NOTICES = [];
const notice = m => NOTICES.push(m);

/* ---------- agent action kinds: apply / undo / edit ---------- */
const money = v => '₹' + v + 'L';
const KINDS = {
  deal_stage: {
    label: 'Deal stage', apply(a) { const d = G.deal(a.p.deal); a.undo = { stage: d.stage }; moveDeal(d.id, a.p.to, { who: WHO.agent(a.agent) }); },
    revert(a) { moveDeal(a.p.deal, a.undo.stage, { noFire: true }); }, edit(a, v) { if (allStages().indexOf(v) < 0 || v === 'Lost') return 'Use one of: ' + stageNames().concat(['Won']).join(', '); a.p.to = v; a.to = v; }
  },
  deal_field: {
    label: 'Opportunity field', apply(a) { const d = G.deal(a.p.deal); a.undo = { f: a.p.field, v: d[a.p.field] }; d[a.p.field] = a.p.to; },
    revert(a) { G.deal(a.p.deal)[a.undo.f] = a.undo.v; }, edit(a, v) { if (a.p.field === 'v') { const n = parseFloat(String(v).replace(/[^0-9.]/g, '')); if (!n) return 'Enter an amount in lakh.'; a.p.to = n; a.to = money(n); } else { a.p.to = v; a.to = v; } }
  },
  deal_competitor: {
    label: 'Competitor', apply(a) { const d = G.deal(a.p.deal); a.undo = { had: d.comps.indexOf(a.p.to) >= 0 }; if (!a.undo.had) d.comps.push(a.p.to); },
    revert(a) { const d = G.deal(a.p.deal); if (!a.undo.had) d.comps = d.comps.filter(x => x !== a.p.to); }, edit(a, v) { a.p.to = v.replace(/\s*\(.*\)/, ''); a.to = v; }
  },
  deal_product: {
    label: 'Products', apply(a) { const d = G.deal(a.p.deal); a.undo = { prods: d.prods.slice() }; a.p.prods.forEach(x => { if (d.prods.indexOf(x) < 0) d.prods.push(x); }); },
    revert(a) { G.deal(a.p.deal).prods = a.undo.prods; }
  },
  contact_add: {
    label: 'New contact', apply(a) { const c = addContact(Object.assign({ who: WHO.agent(a.agent) }, a.p)); a.undo = { con: c.id }; },
    revert(a) { const c = G.con(a.undo.con); if (!c) return; dbx().contacts = dbx().contacts.filter(x => x.id !== c.id); dbx().deals.forEach(d => { d.committee = d.committee.filter(x => x !== c.id); }); },
    edit(a, v) { const m = v.match(/^(.+?)\s*\((.+)\)\s*$/); if (m) { a.p.name = m[1].trim(); a.p.title = m[2].trim(); } else a.p.name = v.trim(); a.to = v; }
  },
  contact_role: {
    label: 'Stakeholder role', apply(a) { const c = G.con(a.p.con); a.undo = { role: c.role, committee: dbx().deals.filter(d => d.committee.indexOf(c.id) >= 0).map(d => d.id) }; setContactRole(c.id, a.p.to, WHO.agent(a.agent)); },
    revert(a) { const c = G.con(a.p.con); c.role = a.undo.role; dbx().deals.forEach(d => { if (a.undo.committee.indexOf(d.id) < 0) d.committee = d.committee.filter(x => x !== c.id); }); },
    edit(a, v) { if (CONTACT_ROLES.indexOf(v) < 0) return 'Use one of: ' + CONTACT_ROLES.join(', '); a.p.to = v; }
  },
  lead_score: {
    label: 'Lead score', apply(a) { const l = G.lead(a.p.lead); a.undo = { score: l.score, priority: l.priority, enriched: l.enriched, ind: l.ind, emp: l.emp, size: l.size, loc: l.loc, site: l.site, intent: l.intent.slice() }; Object.assign(l, a.p.fields || {}); if (a.p.fields && a.p.fields.emp) l.size = sizeLabel(l.emp); (a.p.intent || []).forEach(x => { if (l.intent.indexOf(x) < 0) l.intent.push(x); }); l.score = a.p.to; l.priority = a.p.priority; l.enriched = true; },
    revert(a) { Object.assign(G.lead(a.p.lead), a.undo); }, edit(a, v) { const n = parseInt(v, 10); if (isNaN(n) || n < 0 || n > 100) return 'Enter a score from 0 to 100.'; a.p.to = n; a.to = n; a.p.priority = n >= 75 ? 'High' : n >= 50 ? 'Medium' : 'Low'; }
  },
  task_create: {
    label: 'Task', apply(a) { const t = addActivity({ type: a.p.type || 'task', subj: a.p.title, when: a.p.days, own: a.p.own, link: a.p.link || {}, notes: a.p.notes || '', ai: true, agentTask: a.agent }); a.undo = { act: t.id }; },
    revert(a) { dbx().acts = dbx().acts.filter(x => x.id !== a.undo.act); }, edit(a, v) { a.p.title = v; a.to = v; }
  },
  email_draft: {
    label: 'Email (external)', ext: true, apply(a) { const t = addActivity({ type: 'email', subj: 'Approved draft: ' + a.p.subj, when: 0, done: true, own: dbx().me, link: a.p.link || {}, notes: a.p.body + '\n\n[Approved to send. Not actually sent: no email integration is connected in this prototype.]', sim: true }); a.undo = { act: t.id }; },
    revert(a) { dbx().acts = dbx().acts.filter(x => x.id !== a.undo.act); }, edit(a, v) { a.p.body = v; a.to = v.slice(0, 80) + '…'; }
  },
  risk_flag: {
    label: 'Risk flag', apply(a) { const d = G.deal(a.p.deal); a.undo = { risk: d.risk, fc: d.fc }; d.risk = a.p.risk; if (a.p.fc) d.fc = a.p.fc; },
    revert(a) { const d = G.deal(a.p.deal); d.risk = a.undo.risk; d.fc = a.undo.fc; }, edit(a, v) { a.p.risk = v; a.to = v; }
  },
  forecast_cat: {
    label: 'Forecast category', apply(a) { const d = G.deal(a.p.deal); a.undo = { fc: d.fc }; d.fc = a.p.to; },
    revert(a) { G.deal(a.p.deal).fc = a.undo.fc; }, edit(a, v) { if (FORECAST_CATS.indexOf(v) < 0) return 'Use one of: ' + FORECAST_CATS.join(', '); a.p.to = v; a.to = v; }
  },
  opp_create: {
    label: 'New opportunity', apply(a) { const d = createDeal(Object.assign({ who: WHO.agent(a.agent) }, a.p)); a.undo = { deal: d.id }; },
    revert(a) { dbx().deals = dbx().deals.filter(x => x.id !== a.undo.deal); }, edit(a, v) { a.p.desc = v; a.to = v; }
  },
  ack: { label: 'Recommendation', apply(a) { a.undo = {}; }, revert() { } }
};

/* ---------- proposing, approving, rejecting, reversing ---------- */
function proposeAction(agentId, o) {
  const key = o.key || (o.kind + ':' + o.title);
  if (dbx().actions.some(x => x.key === key && (x.status === 'pending' || x.status === 'applied'))) return null;
  const ag = agentId === 'workflow' ? { n: o.agentName } : G.agent(agentId);
  const a = Object.assign({ id: 'AC-' + seq('action'), agent: agentId, agentName: ag.n, status: 'pending', conf: 0.8, ev: [], at: stamp(), p: {}, from: '', to: '', field: KINDS[o.kind].label, external: !!KINDS[o.kind].ext, key }, o);
  dbx().actions.unshift(a); return a;
}
function approveAction(id) {
  const a = G.action(id); if (!a || a.status !== 'pending') return { ok: false };
  try { KINDS[a.kind].apply(a); } catch (e) { return { ok: false, msg: 'Could not apply: ' + e.message }; }
  a.status = 'applied'; a.by = me().n; a.decidedAt = stamp();
  if (a.agent !== 'workflow') G.agent(a.agent).done++;
  audit(WHO.me(), 'Approved ' + a.agentName + ' action', a.ent || { t: 'agent', id: a.agent, l: a.agentName }, a.title + (a.external ? ' (approved to send, simulated)' : ''), { undoable: !!KINDS[a.kind].revert && a.kind !== 'ack' });
  return { ok: true, a };
}
function rejectAction(id, why) {
  const a = G.action(id); if (!a || a.status !== 'pending') return false;
  a.status = 'rejected'; a.by = me().n; a.decidedAt = stamp(); a.why = why || '';
  audit(WHO.me(), 'Rejected ' + a.agentName + ' action', a.ent || { t: 'agent', id: a.agent, l: a.agentName }, a.title); return true;
}
const canUndo = a => a.status === 'applied' && a.kind !== 'ack' && !!a.undo;
function undoAction(id) {
  const a = G.action(id); if (!a || !canUndo(a)) return false;
  KINDS[a.kind].revert(a); a.status = 'reversed'; a.decidedAt = stamp();
  audit(WHO.me(), 'Reversed ' + a.agentName + ' action', a.ent || { t: 'agent', id: a.agent, l: a.agentName }, a.title); return true;
}
function editAction(id, v) {
  const a = G.action(id); const k = KINDS[a.kind]; if (!k.edit) return 'This action cannot be edited.';
  const err = k.edit(a, v); if (err) return err;
  a.edited = true; audit(WHO.me(), 'Edited proposed action', a.ent || { t: 'agent', id: a.agent, l: a.agentName }, a.title); return null;
}
const actionEditValue = a => a.kind === 'email_draft' ? a.p.body : a.kind === 'task_create' ? a.p.title : a.kind === 'deal_field' && a.p.field === 'v' ? String(a.p.to) : a.kind === 'contact_add' ? a.to : a.to;
const pendingActions = agentId => dbx().actions.filter(a => a.status === 'pending' && (!agentId || a.agent === agentId));
const callActions = callId => dbx().actions.filter(a => a.callId === callId).sort((x, y) => x.line - y.line);
const pendingForCall = callId => callActions(callId).filter(a => a.status === 'pending');
function agentStatus(ag) { if (!ag.active) return 'Paused'; if (ag.running) return 'Running'; return pendingActions(ag.id).length ? 'Awaiting approval' : 'Idle'; }

/* ---------- meeting intelligence ---------- */
const CALL_SCRIPTS = {
  c1: [
    { kind: 'deal_stage', field: 'Deal stage', from: 'Demo', to: 'Proposal', line: 6, conf: 0.93, p: { deal: 'd-harbor', to: 'Proposal' } },
    { kind: 'deal_field', field: 'Budget', from: 'Not set', to: '₹20 lakh', line: 3, conf: 0.9, p: { deal: 'd-harbor', field: 'budget', to: '₹20 lakh' } },
    { kind: 'contact_role', field: 'Economic buyer', from: 'Not identified', to: 'Priya Menon (CFO)', line: 4, conf: 0.88, p: { con: 'priya', to: 'Economic buyer' } },
    { kind: 'contact_add', field: 'New contact', from: 'None', to: 'Arjun Rao (IT, security review)', line: 7, conf: 0.84, p: { acc: 'harbor', deal: 'd-harbor', name: 'Arjun Rao', title: 'IT (security review)', role: 'Technical evaluator' } },
    { kind: 'deal_field', field: 'Next step', from: 'None', to: 'Send quote + SOC 2 by Fri 6 Nov', line: 6, conf: 0.9, p: { deal: 'd-harbor', field: 'next', to: 'Send quote + SOC 2 by Fri 6 Nov' } },
    { kind: 'deal_competitor', field: 'Competitor', from: 'None', to: 'Vantage HR (proposal sent)', line: 5, conf: 0.95, p: { deal: 'd-harbor', to: 'Vantage HR' } }
  ]
};
const CIRRUS_TRANSCRIPT = [
  { who: 'You', t: 'Thanks for the time, Rhea. Last time we spoke about ground-crew scheduling across your stations.' },
  { who: 'Rhea', t: 'Yes. We run 14 stations with about 1,800 ground crew, and rosters are still built in spreadsheets.' },
  { who: 'Rhea', t: 'Our budget for this is around twenty-eight lakh a year.' },
  { who: 'Rhea', t: 'Vantage HR demoed to us last month, so we are comparing.' },
  { who: 'Rhea', t: 'Our CFO, Anil Bhatt, signs off on spend. Our CTO, Vikram Sethi, will review security and integrations.' },
  { who: 'Rhea', t: 'We need crew rostering that syncs with payroll and works on mobile.' },
  { who: 'Rhea', t: 'Can you demo rostering to our station managers next week? Then send a proposal by the 12th.' },
  { who: 'You', t: 'Yes. I will set up the demo and send the proposal with the integration details by the 12th.' }
];
function cirrusScript(dealId, accId) {
  return [
    { kind: 'deal_stage', field: 'Deal stage', from: 'Discovery', to: 'Demo', line: 7, conf: 0.9, p: { deal: dealId, to: 'Demo' } },
    { kind: 'deal_field', field: 'Deal value', from: '₹10L', to: '₹28L', line: 3, conf: 0.88, p: { deal: dealId, field: 'v', to: 28 } },
    { kind: 'contact_add', field: 'New contact', from: 'None', to: 'Anil Bhatt (CFO)', line: 5, conf: 0.9, p: { acc: accId, deal: dealId, name: 'Anil Bhatt', title: 'CFO', role: 'Economic buyer' } },
    { kind: 'contact_add', field: 'New contact', from: 'None', to: 'Vikram Sethi (CTO)', line: 5, conf: 0.9, p: { acc: accId, deal: dealId, name: 'Vikram Sethi', title: 'CTO', role: 'Technical evaluator' } },
    { kind: 'deal_competitor', field: 'Competitor', from: 'None', to: 'Vantage HR', line: 4, conf: 0.95, p: { deal: dealId, to: 'Vantage HR' } },
    { kind: 'deal_product', field: 'Products', from: 'None', to: 'Crew Rostering, Payroll Sync, Mobile Crew App', line: 6, conf: 0.85, p: { deal: dealId, prods: ['p-crew', 'p-pay', 'p-app'] } },
    { kind: 'deal_field', field: 'Next step', from: 'Discovery meeting', to: 'Demo for station managers, proposal by 12 Nov', line: 7, conf: 0.9, p: { deal: dealId, field: 'next', to: 'Demo for station managers, proposal by 12 Nov' } }
  ];
}
function proposeFromScript(call, script) {
  const out = [];
  script.forEach(s => {
    const a = proposeAction('meeting', { key: 'call:' + call.id + ':' + s.kind + ':' + s.to, kind: s.kind, title: s.field + ': ' + s.to, field: s.field, from: s.from, to: s.to, p: s.p, conf: s.conf, callId: call.id, line: s.line, acc: call.acc, ent: { t: 'deal', id: call.deal, l: (G.acc(call.acc) || {}).n }, ev: [{ t: '"' + call.transcript[s.line - 1].t + '"', src: 'Transcript line ' + s.line }] });
    if (a) out.push(a);
  });
  return out;
}
function createCall(o) {
  const c = Object.assign({ id: 'c-' + seq('act'), when: 0, time: '15:00', min: 30, tone: 'Positive', sum: '', items: [], transcript: [], processed: false }, o);
  dbx().calls.unshift(c);
  addActivity({ type: o.kind || 'meeting', subj: (G.acc(c.acc) || {}).n + ': ' + (o.subj || 'meeting'), when: 0, time: c.time, own: dbx().me, done: true, link: { acc: c.acc, con: c.con, deal: c.deal }, notes: 'Recorded and transcribed (simulated).', dur: c.min, callId: c.id });
  audit(WHO.me(), 'Logged meeting', { t: 'call', id: c.id, l: (G.acc(c.acc) || {}).n }, c.min + ' min with ' + c.who);
  return c;
}
function extractHeuristic(call) {
  const d = G.deal(call.deal), out = [], T = call.transcript;
  T.forEach((l, i) => {
    const line = i + 1, t = l.t;
    let m = t.match(/(\d+(?:\.\d+)?)\s*(lakh|lac|crore|cr)\b/i);
    if (m && /budget|spend|set aside|approved/i.test(t)) { const v = /cr/i.test(m[2]) ? parseFloat(m[1]) * 100 : parseFloat(m[1]); out.push({ kind: 'deal_field', field: 'Deal value', from: money(d.v), to: money(v), line, conf: 0.7, p: { deal: d.id, field: 'v', to: v } }); }
    COMPETITORS.forEach(c => { if (new RegExp(c, 'i').test(t) && d.comps.indexOf(c) < 0) out.push({ kind: 'deal_competitor', field: 'Competitor', from: 'None', to: c, line, conf: 0.8, p: { deal: d.id, to: c } }); });
    m = t.match(/(?:our |the )?(CFO|CTO|CEO|COO|CHRO|VP [A-Z]\w+|Head of [A-Z]\w+),?\s+([A-Z][a-z]+ [A-Z][a-z]+)/);
    if (m && !G.acc(call.acc) === false && !dbx().contacts.some(c => c.name === m[2])) out.push({ kind: 'contact_add', field: 'New contact', from: 'None', to: m[2] + ' (' + m[1] + ')', line, conf: 0.7, p: { acc: call.acc, deal: d.id, name: m[2], title: m[1], role: /CFO|CEO/.test(m[1]) ? 'Economic buyer' : /CTO/.test(m[1]) ? 'Technical evaluator' : 'Influencer' } });
    m = t.match(/(send|share|submit)[^.]*?\b(by|before)\s+([^.,;]+)/i);
    if (m) out.push({ kind: 'deal_field', field: 'Next step', from: d.next || 'None', to: (m[0].charAt(0).toUpperCase() + m[0].slice(1)).trim(), line, conf: 0.65, p: { deal: d.id, field: 'next', to: (m[0].charAt(0).toUpperCase() + m[0].slice(1)).trim() } });
    if (/\b(proposal|quote)\b/i.test(t) && stageNames().indexOf(d.stage) < stageNames().indexOf('Proposal') && !out.some(o => o.kind === 'deal_stage')) out.push({ kind: 'deal_stage', field: 'Deal stage', from: d.stage, to: 'Proposal', line, conf: 0.6, p: { deal: d.id, to: 'Proposal' } });
  });
  return out;
}
function processCall(callId, proposals) {
  const c = G.call(callId); if (!c) return [];
  const script = proposals || (callId === 'c1' ? CALL_SCRIPTS.c1 : c.script || extractHeuristic(c));
  c.processed = true;
  const out = proposeFromScript(c, script);
  const ag = G.agent('meeting'); ag.runs++; ag.last = dbx().clock;
  audit(WHO.agent('meeting'), 'Processed meeting transcript', { t: 'call', id: c.id, l: (G.acc(c.acc) || {}).n }, out.length + ' updates proposed');
  return out;
}

/* ---------- agent generators ---------- */
function runAgent(id, opts) {
  opts = opts || {}; const ag = G.agent(id); if (!ag.active) return [];
  const out = [];
  const push = a => { if (a) out.push(a); };
  if (id === 'lead') {
    dbx().leads.filter(l => (!opts.onlyLead || l.id === opts.onlyLead) && ['New', 'Contacted', 'Nurturing'].indexOf(l.status) >= 0 && l.score == null).forEach(l => {
      const co = ENRICH[normCo(l.company)] || null, fields = {};
      if (co) { if (!l.ind) fields.ind = co.ind; if (!l.emp) fields.emp = co.emp; if (!l.loc) fields.loc = co.loc; if (!l.site) fields.site = co.site; }
      const tmp = Object.assign({}, l, fields, { intent: l.intent.concat(co ? co.intent.filter(x => l.intent.indexOf(x) < 0) : []), enriched: true }); if (fields.emp) tmp.size = sizeLabel(tmp.emp);
      const sc = leadScore(tmp), ev = sc.why.map(w => ({ t: '+' + w.pts + ' ' + w.t, src: w.g === 'fit' ? 'Fit' : w.g === 'intent' ? 'Intent' : 'Engagement' }));
      ev.push({ t: co ? 'Matched "' + l.company + '" in the built-in demo company table (simulated enrichment, no live data provider is connected)' : 'No match in the demo company table: score uses the data you entered only', src: 'Enrichment' });
      push(proposeAction('lead', { key: 'score:' + l.id, kind: 'lead_score', title: 'Enrich and score ' + l.name + ' at ' + l.company, field: 'Lead score', from: 'Not scored', to: sc.score, p: { lead: l.id, to: sc.score, priority: sc.priority, fields, intent: co ? co.intent : [] }, conf: sc.conf, ev, lead: l.id, ent: { t: 'lead', id: l.id, l: l.company } }));
      if (sc.score >= 70) { const first = l.name.split(' ')[0]; push(proposeAction('lead', { key: 'intro:' + l.id, kind: 'email_draft', title: 'Intro email to ' + l.name, field: 'Email (external)', from: '', to: 'Draft intro email', p: { subj: 'Ground-crew scheduling at ' + l.company, body: 'Hi ' + first + ',\n\nI noticed ' + l.company + ' is growing its ' + (l.ind || '').toLowerCase() + ' operations. We help teams like yours build shift rosters in minutes and sync them to payroll. Would a 15-minute call next week be useful?\n\nBest,\n' + me().n, link: { lead: l.id } }, conf: 0.75, ev: [{ t: 'Score ' + sc.score + ' (' + sc.priority + ' priority) and buying signals present', src: 'Lead score' }], lead: l.id, ent: { t: 'lead', id: l.id, l: l.company } })); }
    });
  }
  if (id === 'deal') {
    openDeals().forEach(d => {
      const a = dealAcc(d), lt = lastTouchDays('deal', d.id), idx = stageNames().indexOf(d.stage), nm = a.n, base = { deal: d.id, acc: d.acc, ent: { t: 'deal', id: d.id, l: nm } };
      const flag = (key, risk, ev, fc) => { if (!d.risk || d.risk !== risk) push(proposeAction('deal', Object.assign({ key: key + ':' + d.id, kind: 'risk_flag', title: 'Flag risk on ' + nm + ': ' + risk, field: 'Risk flag', from: d.risk || 'None', to: risk, p: { deal: d.id, risk, fc: fc || null }, conf: 0.84, ev }, base))); };
      if (d.proposalSent != null && d.stage === 'Proposal' && lt >= 3 && lt < 999 && (!opts.onlyDeal || opts.onlyDeal === d.id)) flag('quiet', 'No reply to the proposal for ' + lt + ' days', [{ t: 'Proposal sent ' + fmtD(d.proposalSent), src: 'Opportunity' }, { t: 'Last logged activity ' + lt + ' days ago', src: 'Activity timeline' }].concat(d.comps.length ? [{ t: d.comps[0] + ' is also in the deal', src: 'Competitors' }] : []), d.fc === 'Commit' ? 'Best Case' : null);
      else if (d.comps.length && idx >= 1 && !d.risk && (!opts.onlyDeal || opts.onlyDeal === d.id)) {
        const sig = RADAR_SIGNALS.filter(s => s.co === d.comps[0] && (s.ind === a.ind || s.ind === 'Aviation' && a.ind === 'Aviation')).map(s => ({ t: s.co + ' ' + s.type.toLowerCase() + ' (' + s.d + '): ' + s.txt, src: 'Market Radar' }));
        flag('comp', d.comps[0] + ' is competing for this deal', [{ t: d.comps[0] + ' named on the opportunity at ' + d.stage + ' stage', src: 'Opportunity' }].concat(sig));
      }
      else if (lt >= 10 && lt < 999 && !d.risk) flag('stall', 'No activity for ' + lt + ' days', [{ t: 'Last logged activity ' + lt + ' days ago', src: 'Activity timeline' }]);
      if (d.fc === 'Commit' && d.slip >= 1) push(proposeAction('deal', Object.assign({ key: 'slipfc:' + d.id, kind: 'forecast_cat', title: 'Move ' + nm + ' from Commit to Best Case', field: 'Forecast category', from: 'Commit', to: 'Best Case', p: { deal: d.id, to: 'Best Case' }, conf: 0.78, ev: [{ t: 'Close date slipped ' + d.slip + ' time(s)', src: 'Opportunity' }] }, base)));
      if (idx >= 1 && !ebEngaged(d) && !dbx().actions.some(x => x.status === 'pending' && x.acc === d.acc && (x.kind === 'contact_role' || x.kind === 'contact_add')))
        push(proposeAction('deal', Object.assign({ key: 'eb:' + d.id, kind: 'task_create', title: 'Identify the economic buyer at ' + nm, field: 'Task', from: '', to: 'Identify the economic buyer at ' + nm, p: { title: 'Identify the economic buyer at ' + nm, days: 2, own: d.own, link: { acc: d.acc, deal: d.id }, notes: 'Ask the champion for an introduction.' }, conf: 0.82, ev: [{ t: 'Committee has no economic buyer or decision maker contacted in the last 30 days', src: 'Stakeholder map' }] }, base)));
    });
  }
  if (id === 'cs') {
    customers().filter(a => !opts.onlyAcc || a.id === opts.onlyAcc).forEach(a => {
      const h = health(a), k = hcounts(a), tix = a.tk.filter(t => t.d <= 6), tev = tix.map(t => ({ t: t.id + ' ' + t.p + ': ' + t.s + ' (' + (t.d ? t.d + 'd ago' : 'today') + ')', src: 'Support' }));
      const eb = dbx().contacts.filter(c => c.acc === a.id && (c.role === 'Economic buyer' || c.role === 'Decision maker'))[0], ch = dbx().contacts.filter(c => c.acc === a.id && c.role === 'Champion')[0];
      const base = { acc: a.id, ent: { t: 'account', id: a.id, l: a.n } };
      if (RANK[h] >= 2) {
        push(proposeAction('cs', Object.assign({ key: 'exec:' + a.id, kind: 'task_create', title: 'Hold an exec call with ' + a.n + ' about open support issues', field: 'Task', from: '', to: 'Hold an exec call with ' + a.n, p: { title: 'Hold an exec call with ' + a.n + ' about open support issues', days: 2, own: a.own, link: { acc: a.id, con: eb && eb.id }, notes: 'Bring a fix timeline.' }, conf: 0.9, ev: tev.concat([{ t: 'Renewal in ' + a.renew + ' days, ' + money(a.arr) + ' ARR', src: 'Renewal' }]) }, base)));
        if (eb) push(proposeAction('cs', Object.assign({ key: 'ret:' + a.id, kind: 'email_draft', title: 'Retention email to ' + eb.name, field: 'Email (external)', from: '', to: 'Draft retention email', p: { subj: 'Our plan for the issues at ' + a.n, body: 'Hi ' + eb.name.split(' ').slice(-2)[0] + ',\n\nI wanted to follow up personally on the recent support issues (' + tix.map(t => t.s.toLowerCase()).join('; ') + '). Our team has prioritised them and I would like to share a fix timeline. Could we speak this week?\n\nBest,\n' + me().n, link: { acc: a.id, con: eb.id } }, conf: 0.78, ev: tev }, base)));
      } else if (h === 'yellow') {
        push(proposeAction('cs', Object.assign({ key: 'rev:' + a.id, kind: 'task_create', title: 'Review open tickets with ' + a.n, field: 'Task', from: '', to: 'Review open tickets with ' + a.n, p: { title: 'Review open tickets with ' + (ch ? ch.name : a.n), days: 3, own: a.own, link: { acc: a.id, con: ch && ch.id }, notes: 'Health is Yellow.' }, conf: 0.85, ev: tev }, base)));
      }
      if (a.renew != null && a.renew <= 90 && !dbx().deals.some(d => d.acc === a.id && d.type === 'Renewal' && isOpen(d)) && !opts.onlyAcc)
        push(proposeAction('cs', Object.assign({ key: 'renewopp:' + a.id, kind: 'opp_create', title: 'Create the renewal opportunity for ' + a.n, field: 'New opportunity', from: 'None', to: 'Renewal, ' + money(a.arr) + ', closes ' + fmtD(a.renew), p: { acc: a.id, desc: 'Annual renewal', v: a.arr, due: a.renew, type: 'Renewal', stage: stageNames()[0], fc: RANK[h] >= 1 ? 'Best Case' : 'Commit', own: a.own, next: 'Renewal check-in' }, conf: 0.95, ev: [{ t: 'Contract ends ' + fmtD(a.renew) + ' (' + a.renew + ' days)', src: 'Renewal' }, { t: 'Health is ' + LABEL[h], src: 'Customer health' }] }, base)));
      const won = dbx().deals.filter(d => d.acc === a.id && d.stage === 'Won' && d.due >= -2 && d.created > -200)[0];
      if (won && a.renew > 300) push(proposeAction('cs', Object.assign({ key: 'onboard:' + a.id, kind: 'task_create', title: 'Plan onboarding and a 90-day health check for ' + a.n, field: 'Task', from: '', to: 'Onboarding and 90-day health check', p: { title: 'Plan onboarding and a 90-day health check for ' + a.n, days: 2, own: 'TN', link: { acc: a.id, deal: won.id }, notes: 'Health is Green. Renewal on ' + fmtD(a.renew) + '.' }, conf: 0.9, ev: [{ t: 'Deal won today for ' + money(won.v), src: 'Opportunity' }, { t: 'Renewal on ' + fmtD(a.renew) + ' (' + a.renew + ' days). Health monitoring starts now.', src: 'Renewal' }] }, base)));
    });
  }
  if (id === 'rev') {
    const q = revenue('quarter');
    if (q.coverage != null && q.coverage < 3) push(proposeAction('rev', { key: 'cov:' + Math.round(q.coverage * 10), kind: 'ack', title: 'Pipeline coverage is ' + q.coverage.toFixed(1) + 'x for Q4, below the 3x guideline', field: 'Recommendation', from: '', to: 'Build ' + fmtL(Math.max(0, q.remaining * 3 - q.pipe)) + ' of new pipeline', p: {}, conf: 0.9, ev: [{ t: fmtL(q.pipe) + ' open pipeline for ' + fmtL(q.remaining) + ' remaining quota', src: 'Forecast' }, { t: 'Aviation target list (5 companies) is not yet in the pipeline', src: 'Market Radar' }], ent: { t: 'forecast', id: 'q4', l: 'Q4 forecast' } }));
    openDeals().filter(d => d.fc === 'Commit' && (dealRisks(d).length >= 1)).forEach(d => push(proposeAction('rev', { key: 'commit:' + d.id, kind: 'forecast_cat', title: 'Move ' + dealAcc(d).n + ' from Commit to Best Case', field: 'Forecast category', from: 'Commit', to: 'Best Case', p: { deal: d.id, to: 'Best Case' }, conf: 0.76, acc: d.acc, ev: dealRisks(d).map(r => ({ t: r, src: 'Deal risk' })).concat([{ t: fmtL(d.v) + ' counted at 100% in the Commit forecast', src: 'Forecast' }]), ent: { t: 'deal', id: d.id, l: dealAcc(d).n } })));
  }
  ag.runs++; ag.last = dbx().clock;
  if (!opts.boot) audit(WHO.agent(id), 'Ran analysis', { t: 'agent', id, l: ag.n }, out.length + ' new proposal' + (out.length === 1 ? '' : 's'));
  return out;
}
function bootAgents() {
  const db = dbx(); db.clock = -150;
  db.leads.forEach(l => { if (l.score != null) { const s = leadScore(l); l.score = s.score; l.priority = s.priority; } }); /* seeded scores always match the scoring formula */
  proposeFromScript(G.call('c1'), CALL_SCRIPTS.c1); G.agent('meeting').runs--;
  ['lead', 'deal', 'cs', 'rev'].forEach(id => { const r = G.agent(id).runs; runAgent(id, { boot: true }); G.agent(id).runs = r; });
  db.clock = 0; db.alerts = seedAlerts();
  const hist = [['lead', 'lead_score', 'Enrich and score Neha Kulkarni at GreenLeaf Energy', 'applied'], ['deal', 'risk_flag', 'Flag risk on Meridian Retail: Champion silent for 12 days', 'applied'], ['cs', 'task_create', 'Review two payroll report tickets at Kiran Textiles', 'applied'], ['rev', 'forecast_cat', 'Move BlueWave Shipping from Commit to Best Case', 'applied'], ['meeting', 'deal_stage', 'Deal stage: Proposal (Pinnacle Foods)', 'applied'], ['deal', 'deal_competitor', 'Competitor: Plumeria (BlueWave Shipping)', 'rejected']];
  hist.forEach((h, i) => db.actions.push({ id: 'AC-h' + i, agent: h[0], agentName: G.agent(h[0]).n, kind: h[1], title: h[2], field: KINDS[h[1]].label, status: h[3], conf: 0.85, ev: [], at: -2000 + i * 100, decidedAt: -1990 + i * 100, by: 'Ayush Sisodia', p: {}, from: '', to: '', key: 'hist' + i, hist: true }));
}

/* ---------- workflow engine ---------- */
const TRIGGERS = {
  lead_created: { n: 'Lead created', subj: 'lead' }, deal_stage_changed: { n: 'Deal stage changed', subj: 'deal', params: [{ k: 'to', t: 'stage', l: 'To stage' }] },
  customer_inactive: { n: 'Customer inactive for N days', subj: 'account', params: [{ k: 'days', t: 'num', l: 'Days' }] }, proposal_sent: { n: 'Proposal sent', subj: 'deal' },
  renewal_approaching: { n: 'Renewal approaching', subj: 'account', params: [{ k: 'days', t: 'num', l: 'Within days' }] }, ticket_escalated: { n: 'Support ticket escalated', subj: 'account' }
};
const CONDS = {
  deal_value_gt: { n: 'Deal value exceeds', params: [{ k: 'v', t: 'num', l: '₹ lakh' }] }, lead_score_gt: { n: 'Lead score exceeds', params: [{ k: 'v', t: 'num', l: 'Score' }] },
  no_response: { n: 'No response received for', params: [{ k: 'days', t: 'num', l: 'Days' }] }, health_bad: { n: 'Customer health is Orange or Red' }, renewal_within: { n: 'Renewal is within', params: [{ k: 'days', t: 'num', l: 'Days' }] }
};
const WF_ACTS = {
  create_task: { n: 'Create task', params: [{ k: 'title', t: 'text', l: 'Title' }, { k: 'days', t: 'num', l: 'Due in days' }, { k: 'own', t: 'owner', l: 'Owner' }] },
  assign_owner: { n: 'Assign owner', params: [{ k: 'own', t: 'owner', l: 'Owner' }] },
  gen_email: { n: 'Generate follow-up email', params: [{ k: 'tpl', t: 'select', opts: ['Intro', 'Follow-up', 'Retention'], l: 'Template' }] },
  notify: { n: 'Send notification', params: [{ k: 'ch', t: 'select', opts: ['In-app', 'Slack (simulated)', 'Email (simulated)'], l: 'Channel' }, { k: 'msg', t: 'text', l: 'Message' }] },
  update_field: { n: 'Update CRM field', params: [{ k: 'field', t: 'select', opts: ['Forecast category', 'Risk flag', 'Lead status'], l: 'Field' }, { k: 'value', t: 'text', l: 'Value' }] },
  request_approval: { n: 'Request human approval', params: [{ k: 'what', t: 'text', l: 'What needs approval' }] }
};
function ctxOf(ctx) { const a = ctx.acc || (ctx.deal ? dealAcc(ctx.deal) : null); return Object.assign({}, ctx, { acc: a }); }
function fillTpl(s, ctx) {
  const c = ctxOf(ctx), name = ctx.lead ? ctx.lead.name : c.acc ? (primaryContact(ctx.deal || { committee: dbx().contacts.filter(x => x.acc === c.acc.id).map(x => x.id) }) || { name: c.acc.n }).name : '';
  return String(s || '').replace(/\{\{(\w+)\}\}/g, (m, k) => ({ name, company: ctx.lead ? ctx.lead.company : c.acc ? c.acc.n : '', value: ctx.deal ? fmtL(ctx.deal.v) : '', health: c.acc && c.acc.type === 'Customer' ? LABEL[health(c.acc)] : '', renew: c.acc && c.acc.renew != null ? c.acc.renew : '' }[k] || ''));
}
const subjOwner = ctx => (ctx.lead && ctx.lead.own) || (ctx.deal && ctx.deal.own) || (ctx.acc && ctx.acc.own) || dbx().me;
function ownerFor(v, ctx) { if (v === 'owner') return subjOwner(ctx); if (v === 'csm') return 'TN'; if (v === 'territory') return ctx.lead && (ctx.lead.ind === 'Aviation' || ctx.lead.ind === 'Logistics') ? 'AS' : subjOwner(ctx); return v || subjOwner(ctx); }
function evalCond(c, ctx, ahead) {
  const cx = ctxOf(ctx), p = c.p, n = CONDS[c.t].n;
  if (c.t === 'deal_value_gt') { if (!ctx.deal) return { ok: null, text: n + ' ' + p.v + 'L', detail: 'Not applicable: no deal in this event' }; return { ok: ctx.deal.v > p.v, text: n + ' ' + money(p.v), detail: 'Deal is ' + fmtL(ctx.deal.v) }; }
  if (c.t === 'lead_score_gt') { if (!ctx.lead) return { ok: null, text: n + ' ' + p.v, detail: 'Not applicable: no lead in this event' }; const s = ctx.lead.score != null ? ctx.lead.score : leadScore(ctx.lead).score; return { ok: s > p.v, text: n + ' ' + p.v, detail: 'Score is ' + s + (ctx.lead.score == null ? ' (calculated on the fly)' : '') }; }
  if (c.t === 'no_response') { const k = ctx.deal ? 'deal' : ctx.lead ? 'lead' : 'acc', id = ctx.deal ? ctx.deal.id : ctx.lead ? ctx.lead.id : cx.acc.id, d = lastTouchDays(k, id, ahead); return { ok: d >= p.days, text: n + ' ' + p.days + ' days', detail: 'Last activity ' + (d >= 999 ? 'never' : d + ' days ago' + (ahead ? ' (simulating ' + ahead + ' days ahead)' : '')) }; }
  if (c.t === 'health_bad') { if (!cx.acc || cx.acc.type !== 'Customer') return { ok: null, text: n, detail: 'Not applicable: not a customer account' }; const h = health(cx.acc); return { ok: RANK[h] >= 2, text: n, detail: cx.acc.n + ' is ' + LABEL[h] }; }
  if (c.t === 'renewal_within') { if (!cx.acc || cx.acc.renew == null) return { ok: null, text: n + ' ' + p.days + ' days', detail: 'Not applicable: no renewal date' }; const r = cx.acc.renew - (ahead || 0); return { ok: r <= p.days, text: n + ' ' + p.days + ' days', detail: 'Renewal in ' + r + ' days' }; }
  return { ok: true, text: n, detail: '' };
}
function emailBody(tpl, ctx) {
  const c = ctxOf(ctx), first = (fillTpl('{{name}}', ctx) || 'there').split(' ').filter(x => !/^(Dr\.|Prof\.|Capt\.)$/.test(x))[0] || 'there', co = fillTpl('{{company}}', ctx);
  const subj = { Intro: 'Quick intro: scheduling at ' + co, 'Follow-up': 'Following up on our proposal', Retention: 'Our plan for your open issues' }[tpl];
  const body = { Intro: 'Hi ' + first + ',\n\nI would like to introduce Kestrel and how we help teams like ' + co + ' plan shifts faster. Could we speak for 15 minutes this week?', 'Follow-up': 'Hi ' + first + ',\n\nI wanted to follow up on the proposal I sent. Happy to walk your team through it or adjust anything. Is there a good time this week?', Retention: 'Hi ' + first + ',\n\nI know there have been some issues recently and I want to share a clear plan to resolve them. Could we speak this week?' }[tpl];
  return { subj, body: body + '\n\nBest,\n' + me().n };
}
function wfRun(w, ctx, o) {
  o = o || {}; const dry = !!o.dry, ahead = o.ahead || 0, steps = [], fx = [];
  const subj = ctx.lead ? ctx.lead.name + ' at ' + ctx.lead.company : ctx.deal ? dealAcc(ctx.deal).n + ' (' + fmtL(ctx.deal.v) + ')' : ctxOf(ctx).acc.n;
  steps.push({ k: 'trigger', ok: true, text: TRIGGERS[w.trig.t].n + ': ' + subj });
  let pass = true;
  w.conds.forEach(c => { const r = evalCond(c, ctx, ahead); steps.push({ k: 'cond', ok: r.ok, text: r.text, detail: r.detail }); if (r.ok === false) pass = false; });
  const cx = ctxOf(ctx), link = { lead: ctx.lead && ctx.lead.id, acc: cx.acc && cx.acc.id, deal: ctx.deal && ctx.deal.id }; Object.keys(link).forEach(k => { if (!link[k]) delete link[k]; });
  const who = WHO.wf(w), ent = ctx.lead ? entOf('lead', Object.assign({}, ctx.lead, { n: ctx.lead.company })) : ctx.deal ? entOf('deal', Object.assign({}, ctx.deal, { n: cx.acc.n })) : entOf('account', cx.acc);
  w.acts.forEach(a => {
    const p = a.p; let text = '';
    if (!pass) { steps.push({ k: 'act', ok: null, text: 'Skipped: ' + WF_ACTS[a.t].n }); return; }
    if (a.t === 'create_task') {
      const own = ownerFor(p.own, ctx), title = fillTpl(p.title, ctx); text = (dry ? 'Would create' : 'Created') + ' task "' + title + '" for ' + G.user(own).n + ', due ' + fmtD(p.days);
      if (!dry) { const t = addActivity({ type: 'task', subj: title, when: p.days, own, link, notes: 'Created by workflow: ' + w.n, ai: true, wf: w.id }); fx.push({ t: 'task', id: t.id }); audit(who, 'Created task', ent, title); }
    } else if (a.t === 'assign_owner') {
      const own = ownerFor(p.own, ctx); text = (dry ? 'Would assign' : 'Assigned') + ' owner: ' + G.user(own).n;
      if (!dry) { const s = ctx.lead || ctx.deal || cx.acc, old = s.own; s.own = own; audit(who, 'Assigned owner', ent, G.user(old).n + ' to ' + G.user(own).n); }
    } else if (a.t === 'gen_email') {
      const e = emailBody(p.tpl, ctx); text = (dry ? 'Would draft' : 'Drafted') + ' a ' + p.tpl.toLowerCase() + ' email for approval (nothing is sent)';
      if (!dry) { const ac = proposeAction('workflow', { agentName: w.n, key: 'wfmail:' + w.id + ':' + (ctx.lead || ctx.deal || cx.acc).id + ':' + p.tpl, kind: 'email_draft', title: e.subj, field: 'Email (external)', to: 'Draft ' + p.tpl.toLowerCase() + ' email', p: { subj: e.subj, body: e.body, link }, conf: 0.72, ev: [{ t: 'Generated by workflow "' + w.n + '"', src: 'Workflow' }], ent, acc: link.acc }); if (ac) { fx.push({ t: 'approval', id: ac.id }); audit(who, 'Drafted email (awaiting approval)', ent, e.subj); } }
    } else if (a.t === 'notify') {
      const m = fillTpl(p.msg, ctx); text = (dry ? 'Would send ' : 'Sent ') + p.ch + ' notification: "' + m + '"' + (p.ch === 'In-app' ? '' : ' (simulated, no integration connected)');
      if (!dry) { audit(who, 'Notified (' + p.ch + ')', ent, m); notice(m); }
    } else if (a.t === 'update_field') {
      const v = fillTpl(p.value, ctx); text = (dry ? 'Would set ' : 'Set ') + p.field + ' to "' + v + '"';
      if (!dry) {
        if (p.field === 'Forecast category' && ctx.deal && FORECAST_CATS.indexOf(v) >= 0) ctx.deal.fc = v;
        else if (p.field === 'Risk flag') { if (ctx.deal) ctx.deal.risk = v; else if (cx.acc) cx.acc.flag = v; }
        else if (p.field === 'Lead status' && ctx.lead && LEAD_STATUS.indexOf(v) >= 0) ctx.lead.status = v;
        else text = 'Could not set ' + p.field + ' for this record';
        audit(who, 'Updated field', ent, p.field + ': ' + v);
      }
    } else if (a.t === 'request_approval') {
      const m = fillTpl(p.what, ctx); text = (dry ? 'Would request' : 'Requested') + ' human approval: "' + m + '"';
      if (!dry) { const ac = proposeAction('workflow', { agentName: w.n, key: 'wfappr:' + w.id + ':' + (ctx.lead || ctx.deal || cx.acc).id, kind: 'ack', title: m, field: 'Approval request', to: 'Needs a decision', p: {}, conf: 0.8, ev: [{ t: 'Raised by workflow "' + w.n + '"', src: 'Workflow' }], ent, acc: link.acc }); if (ac) { fx.push({ t: 'approval', id: ac.id }); audit(who, 'Requested approval', ent, m); } }
    }
    steps.push({ k: 'act', ok: true, text });
  });
  return { steps, pass, fx, subj };
}
function wfLog(w, subj, r) { w.runs++; w.last = 0; w.log.unshift({ at: dbx().clock, subj, ok: r.pass, fx: r.steps.filter(s => s.k === 'act' && s.ok).map(s => s.text) }); w.log = w.log.slice(0, 15); }
function fire(trigger, ctx, opts) {
  if (!dbx().workflows) return [];
  const ran = [];
  dbx().workflows.filter(w => w.active && w.trig.t === trigger).forEach(w => {
    if (trigger === 'deal_stage_changed' && w.trig.p.to && w.trig.p.to !== 'Any' && w.trig.p.to !== ctx.to) return;
    const sid = (ctx.lead || ctx.deal || ctxOf(ctx).acc).id, key = trigger + ':' + sid + ':' + (ctx.to || ctx.from || '');
    if (w.seen[key] && !(opts && opts.force)) return;
    const r = wfRun(w, ctx, { ahead: (opts && opts.ahead) || 0 });
    if (r.pass) { w.seen[key] = true; wfLog(w, r.subj, r); ran.push({ w, r }); }
  });
  return ran;
}
function scan(ahead) {
  const ran = [];
  dbx().workflows.filter(w => w.active).forEach(w => {
    const t = w.trig.t, tryRun = (ctx, key) => { const k = t + ':' + key; if (w.seen[k]) return; const r = wfRun(w, ctx, { ahead }); if (r.pass) { w.seen[k] = true; wfLog(w, r.subj, r); ran.push({ w, r }); } };
    if (t === 'customer_inactive') customers().forEach(a => { if (lastTouchDays('acc', a.id, ahead) >= w.trig.p.days) tryRun({ acc: a }, a.id); });
    if (t === 'renewal_approaching') customers().forEach(a => { if (a.renew != null && a.renew - ahead <= w.trig.p.days) tryRun({ acc: a }, a.id); });
    if (t === 'proposal_sent') openDeals().filter(d => d.stage === 'Proposal' && d.proposalSent != null).forEach(d => tryRun({ deal: d }, d.id + ':' + d.proposalSent));
  });
  if (ran.length) audit(WHO.sys(), 'Scheduled scan (simulating ' + ahead + ' days ahead)', { t: 'workflow', id: 'scan', l: 'Workflow scan' }, ran.length + ' workflow run' + (ran.length > 1 ? 's' : ''));
  return ran;
}
function wfSubjects(w) {
  const s = TRIGGERS[w.trig.t].subj;
  if (s === 'lead') return dbx().leads.filter(l => l.status !== 'Converted').map(l => ({ id: l.id, label: l.name + ' at ' + l.company, ctx: { lead: l } }));
  if (s === 'deal') return openDeals().map(d => ({ id: d.id, label: dealAcc(d).n + ' (' + fmtL(d.v) + ', ' + d.stage + ')', ctx: { deal: d, to: d.stage, from: '' } }));
  return customers().map(a => ({ id: a.id, label: a.n + ' (' + LABEL[health(a)] + ', renews in ' + a.renew + ' days)', ctx: { acc: a } }));
}
function newWorkflow() { const id = 'wf-' + seq('wf'); const w = { id, n: 'New workflow', d: 'Describe what this automation does.', active: false, trig: { t: 'lead_created', p: {} }, conds: [], acts: [{ t: 'create_task', p: { title: 'Follow up with {{name}}', days: 1, own: 'owner' } }], runs: 0, last: null, log: [], seen: {} }; dbx().workflows.push(w); audit(WHO.me(), 'Created workflow', { t: 'workflow', id, l: w.n }, ''); return w; }
function defaultParams(group, t) { const def = (group === 'trig' ? TRIGGERS : group === 'cond' ? CONDS : WF_ACTS)[t], p = {}; (def.params || []).forEach(x => { p[x.k] = x.t === 'num' ? (x.k === 'days' ? 3 : 10) : x.t === 'select' ? x.opts[0] : x.t === 'stage' ? 'Any' : x.t === 'owner' ? 'owner' : ''; }); if (t === 'create_task') p.title = 'Follow up with {{name}}'; if (t === 'notify') p.msg = 'Update on {{company}}'; if (t === 'request_approval') p.what = 'Approve the next step for {{company}}'; return p; }
