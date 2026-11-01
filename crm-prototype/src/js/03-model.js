/* ==========================================================================
   03-model: state, persistence and CRM business logic. No DOM access.
   Entities: Lead, Account, Contact, Opportunity (deal), Activity, Task (activity of a task type),
   Product, Forecast (derived), Workflow, Agent, Agent Action, Customer Health (derived), Integration, User, Audit Log.
   ========================================================================== */
const KEY = 'kestrel.v3';
const S = { db: null };
const dbx = () => S.db;
const find = (arr, id) => arr.find(x => x.id === id);
const G = {
  user: id => find(dbx().users, id), acc: id => find(dbx().accounts, id), con: id => find(dbx().contacts, id), lead: id => find(dbx().leads, id),
  deal: id => find(dbx().deals, id), act: id => find(dbx().acts, id), wf: id => find(dbx().workflows, id), agent: id => find(dbx().agents, id),
  call: id => find(dbx().calls, id), action: id => find(dbx().actions, id), prod: id => find(dbx().products, id), integ: id => find(dbx().integrations, id)
};
const me = () => G.user(dbx().me);
const myRole = () => find(dbx().roles, me().role);
const can = p => myRole().perms.indexOf(p) >= 0;
const seq = k => ++dbx().seq[k];
const stamp = () => (dbx().clock += 2);
const slugOf = n => normCo(n).replace(/\s+/g, '');

function loadDb() { try { const r = typeof localStorage !== 'undefined' && localStorage.getItem(KEY); if (r) { const o = JSON.parse(r); if (o && o.v === VERSION && o.db) return o.db; } } catch (e) { } return null; }
let saveTimer = null;
function persist() { if (typeof localStorage === 'undefined') return; clearTimeout(saveTimer); saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify({ v: VERSION, db: S.db })); } catch (e) { } }, 120); }
function initDb(fresh) { const db = fresh ? null : loadDb(); if (db) { S.db = db; return; } S.db = seedDb(); bootAgents(); }
function resetDb() { try { localStorage.removeItem(KEY); } catch (e) { } S.db = seedDb(); bootAgents(); }

/* ---------- audit ---------- */
const WHO = { me: () => ({ n: me().n, type: 'user' }), agent: id => ({ n: G.agent(id).n, type: 'agent' }), wf: w => ({ n: w.n, type: 'workflow' }), sys: () => ({ n: 'Kestrel', type: 'system' }) };
function audit(who, action, ent, detail, extra) { const e = Object.assign({ id: 'AU-' + seq('audit'), at: stamp(), actor: who.n, type: who.type, action, ent: ent || { t: 'system', id: '', l: '' }, detail: detail || '' }, extra || {}); dbx().audit.unshift(e); return e; }
const entOf = (t, o) => ({ t, id: o.id, l: o.n || o.name || o.company || o.subj || o.id });

/* ---------- pipeline ---------- */
const stageNames = () => dbx().pipeline.stages.map(s => s.n);
const allStages = () => stageNames().concat(['Won', 'Lost']);
const stageProb = n => n === 'Won' ? 100 : n === 'Lost' ? 0 : ((dbx().pipeline.stages.filter(s => s.n === n)[0]) || { prob: 10 }).prob;
const isOpen = d => d.stage !== 'Won' && d.stage !== 'Lost';
const dprob = d => d.stage === 'Won' ? 100 : d.stage === 'Lost' ? 0 : (d.prob != null ? d.prob : stageProb(d.stage));
const wval = d => d.v * dprob(d) / 100;
const openDeals = () => dbx().deals.filter(isOpen);
const dealAcc = d => G.acc(d.acc);
const committee = d => (d.committee || []).map(G.con).filter(Boolean);
const hasEB = d => committee(d).some(c => c.role === 'Economic buyer');
const ebEngaged = d => committee(d).some(c => (c.role === 'Economic buyer' || c.role === 'Decision maker') && c.last >= -30);
const primaryContact = d => committee(d).filter(c => c.role === 'Champion' || c.role === 'Decision maker' || c.role === 'Economic buyer')[0] || committee(d)[0] || null;

/* ---------- customer health (derived from tickets) ---------- */
function hcounts(a) { const r = { P1: 0, P2: 0, P3: 0 }; a.tk.forEach(t => { if (t.d <= 6) r[t.p]++; }); return r; }
function health(a) {
  const k = hcounts(a);
  if (k.P1 >= 1 || k.P2 >= 3) return 'red';
  if (k.P2 >= 2 || (k.P2 >= 1 && k.P3 >= 2)) return 'orange';
  if (k.P2 === 1 || k.P3 >= 2) return 'yellow';
  return 'green';
}
const customers = () => dbx().accounts.filter(a => a.type === 'Customer');
const atRiskAccounts = () => customers().filter(a => RANK[health(a)] >= 1);
function logTicket(accId, p, summary) {
  const a = G.acc(accId), before = health(a);
  const id = 'SUP-' + (4120 + seq('act'));
  a.tk.push({ id, p, d: 0, s: summary || { P1: 'Service down for all users', P2: 'Feature broken for a team', P3: 'Minor issue reported' }[p] });
  const after = health(a);
  audit(WHO.sys(), 'Support ticket logged', entOf('account', a), p + ' ' + id);
  let alert = null;
  if (RANK[after] > RANK[before]) {
    const k = hcounts(a);
    alert = { cust: a.n, acc: a.id, from: before, to: after, when: 'Just now', why: k.P1 + ' P1, ' + k.P2 + ' P2, ' + k.P3 + ' P3 in 7 days (latest ' + id + ')', act: { yellow: 'Ask the CSM to review these tickets before the next check-in.', orange: 'Book an exec call this week and flag the renewal (' + a.renew + ' days, ₹' + a.arr + 'L).', red: 'Escalate to leadership today. ₹' + a.arr + 'L ARR is at stake.' }[after] };
    dbx().alerts = dbx().alerts || [];
    dbx().alerts.unshift(alert);
    audit(WHO.sys(), 'Health changed ' + LABEL[before] + ' to ' + LABEL[after], entOf('account', a), alert.why);
    fire('ticket_escalated', { acc: a, from: before, to: after });
    runAgent('cs', { quiet: true, onlyAcc: a.id });
  }
  return { before, after, alert };
}
function seedAlerts() {
  return [
    { cust: 'Lotus Hospitals', acc: 'lotus', from: 'green', to: 'yellow', when: 'Today', why: '2 P3 tickets in 7 days (SUP-4113, SUP-4118)', act: 'Ask the CSM to review both tickets before the next check-in.' },
    { cust: 'Kiran Textiles', acc: 'kiran', from: 'green', to: 'yellow', when: 'Yesterday', why: '2 P3 tickets in 7 days (SUP-4091, SUP-4115)', act: 'Ask the CSM to review both tickets before the next check-in.' },
    { cust: 'Cobalt Logistics', acc: 'cobalt', from: 'yellow', to: 'orange', when: 'Yesterday', why: '2 P2 tickets in 7 days (SUP-4102, SUP-4107)', act: 'Book an exec call this week. Renewal is in 47 days and ₹26L is at stake.' }
  ];
}
const healthAlerts = () => { if (!dbx().alerts) dbx().alerts = seedAlerts(); return dbx().alerts; };

/* ---------- activities ---------- */
function addActivity(o) {
  const a = Object.assign({ id: 'A-' + seq('act'), type: 'task', subj: '', when: 0, time: '12:00', own: dbx().me, link: {}, done: false, notes: '', dur: 30 }, o);
  dbx().acts.push(a); return a;
}
function sysEvent(subj, link, notes) { return addActivity({ type: 'update', subj, when: 0, time: String(11 + Math.floor(dbx().clock / 60)).padStart(2, '0') + ':' + String(42 + (dbx().clock % 60)).padStart(2, '0'), done: true, sys: true, link: link || {}, notes: notes || '' }); }
function setDone(id, done) { const a = G.act(id); a.done = done; audit(WHO.me(), done ? 'Completed activity' : 'Reopened activity', entOf('activity', a), a.subj); return a; }
const actDay = a => a.when;
const isOverdue = a => !a.done && !a.sys && a.when < 0;
const isTaskLike = a => TASK_TYPES.indexOf(a.type) >= 0;
function taskDone(a) {
  if (a.done) return true;
  if (a.auto === 'calls') return pendingForCall('c1').length === 0;
  if (a.auto === 'targets') return !!dbx().radarGap.targetList;
  return false;
}
function lastTouchDays(kind, id, ahead) {
  let days = 999;
  const mine = x => !x.sys && x.done && x.when <= 0 && (kind === 'deal' ? (x.link.deal === id) : kind === 'lead' ? x.link.lead === id : x.link.acc === id);
  const list = dbx().acts.filter(mine);
  if (list.length) days = -Math.max.apply(null, list.map(x => x.when)); else if (kind === 'lead') days = -G.lead(id).created; else if (kind === 'deal') days = -G.deal(id).created;
  return Math.max(0, days) + (ahead || 0);
}

/* ---------- opportunities ---------- */
function dealRisks(d) {
  const r = [], a = dealAcc(d);
  if (!isOpen(d)) return r;
  if (d.risk) r.push(d.risk);
  if (d.slip > 0) r.push('Close date slipped ' + d.slip + (d.slip > 1 ? ' times' : ' time'));
  if (d.due < 0) r.push('Past its close date');
  const lt = lastTouchDays('deal', d.id); if (lt >= 10 && lt < 999) r.push('No activity for ' + lt + ' days');
  if (a && a.type === 'Customer' && RANK[health(a)] >= 2 && !d.risk) r.push('Account health is ' + LABEL[health(a)]);
  if (stageNames().indexOf(d.stage) >= 1 && !ebEngaged(d)) r.push('No economic buyer engaged');
  return r;
}
const attentionDeals = () => openDeals().filter(d => dealRisks(d).length).sort((a, b) => b.v - a.v);
function nextBest(d) {
  if (!isOpen(d)) return null;
  const a = dealAcc(d), lt = lastTouchDays('deal', d.id), idx = stageNames().indexOf(d.stage);
  if (d.comps.length && idx >= 2) return { text: 'Send a competitive comparison against ' + d.comps.join(' and ') + ' and book a call with the economic buyer.', why: 'Competitor in the deal at ' + d.stage + ' stage.' };
  if (d.proposalSent != null && d.stage === 'Proposal' && lt >= 3) return { text: 'Follow up on the proposal today. Offer a 20-minute walkthrough.', why: 'Proposal sent ' + (0 - d.proposalSent) + ' days ago, last touch ' + lt + ' days ago.' };
  if (lt >= 10 && lt < 999) return { text: 'Re-engage ' + (primaryContact(d) ? primaryContact(d).name : 'your champion') + ' with something new, such as a customer story.', why: 'No logged activity for ' + lt + ' days.' };
  if (idx >= 1 && !ebEngaged(d)) return { text: 'Identify and meet the economic buyer before sending a proposal.', why: 'No economic buyer or decision maker contacted in the last 30 days.' };
  if (a && a.type === 'Customer' && RANK[health(a)] >= 2) return { text: 'Resolve the open support issues before negotiating.', why: 'Account health is ' + LABEL[health(a)] + '.' };
  if (d.due < 0) return { text: 'Update the close date or push the deal forward. It is past due.', why: 'Close date was ' + fmtD(d.due) + '.' };
  return { text: { Discovery: 'Book a second discovery call and map the stakeholders.', Demo: 'Send a tailored demo recap and agree success criteria.', Proposal: 'Follow up on the proposal within 2 days.', Negotiation: 'Get legal and procurement moving and confirm the decision date.' }[d.stage] || 'Review the next step with your manager.', why: 'Standard next step for ' + d.stage + '.' };
}
function moveDeal(id, to, opt) {
  opt = opt || {};
  const d = G.deal(id); if (!d || d.stage === to) return false;
  const from = d.stage, a = dealAcc(d), who = opt.who || WHO.me();
  d.stage = to; d.prob = null;
  if (to === 'Won') {
    d.due = 0; d.fc = null; d.cycle = Math.max(1, 0 - d.created);
    if (opt.amount) d.v = opt.amount;
    if (a) { if (a.type !== 'Customer') { a.type = 'Customer'; a.renew = 365; } a.arr += d.type === 'Renewal' ? 0 : d.v; a.life += d.v; }
    dbx().funnel.Won++;
  } else if (to === 'Lost') {
    d.due = 0; d.fc = null; d.lostReason = opt.reason || 'Other'; d.lostTo = opt.to || ''; d.lostNote = opt.note || '';
    if (opt.to && d.comps.indexOf(opt.to) < 0) d.comps.push(opt.to);
  } else {
    if (from === 'Won' || from === 'Lost') { d.lostReason = ''; d.lostTo = ''; d.lostNote = ''; }
    dbx().funnel[to] = (dbx().funnel[to] || 0) + 1;
    if (to === 'Proposal') d.proposalSent = 0;
    if (!d.fc) d.fc = 'Pipeline';
  }
  sysEvent('Stage changed: ' + from + ' to ' + to, { acc: d.acc, deal: d.id }, to === 'Lost' ? d.lostReason : '');
  audit(who, to === 'Won' ? 'Won deal' : to === 'Lost' ? 'Lost deal' : 'Moved stage', entOf('deal', Object.assign({}, d, { n: a ? a.n : d.id })), from + ' to ' + to + (to === 'Lost' ? ' (' + d.lostReason + ')' : ''));
  if (!opt.noFire) { fire('deal_stage_changed', { deal: d, from, to }); if (to === 'Proposal') fire('proposal_sent', { deal: d }); }
  return true;
}
function setDealDue(id, off) {
  const d = G.deal(id), old = d.due; if (off === old) return;
  if (off > old && isOpen(d)) d.slip++;
  d.due = off; if (d.slip === 0 && isOpen(d)) d.origDue = off;
  audit(WHO.me(), 'Changed close date', entOf('deal', Object.assign({}, d, { n: dealAcc(d).n })), fmtD(old) + ' to ' + fmtD(off) + (off > old ? ' (slipped ' + d.slip + (d.slip > 1 ? ' times' : ' time') + ')' : ''));
}
function createDeal(o) {
  const a = G.acc(o.acc);
  let id = 'd-' + a.id, n = 1; while (G.deal(id)) id = 'd-' + a.id + '-' + (++n);
  const d = Object.assign({ id, acc: a.id, desc: '', stage: 'Discovery', v: 10, own: a.own, due: 30, origDue: 30, slip: 0, prob: null, fc: 'Pipeline', comps: [], prods: [], decide: null, cm: 0, fl: 0, next: 'Discovery meeting', risk: '', type: 'New business', rec: false, cycle: null, created: 0, budget: '', lostReason: '', lostNote: '', lostTo: '', proposalSent: null, committee: [], custom: {} }, o);
  d.origDue = d.due; dbx().deals.push(d); dbx().funnel[d.stage] = (dbx().funnel[d.stage] || 0) + 1;
  audit(o.who || WHO.me(), 'Created opportunity', entOf('deal', Object.assign({}, d, { n: a.n })), fmtL(d.v) + ' in ' + d.stage);
  return d;
}

/* ---------- contacts and accounts ---------- */
function addContact(o) {
  const a = G.acc(o.acc), nm = o.name.trim();
  const p = nm.replace(/^(Dr\.|Prof\.|Capt\.)\s*/, '').toLowerCase().split(' ');
  const c = Object.assign({ id: 'ct-' + seq('con'), acc: a.id, name: nm, title: '', role: 'Influencer', sent: 'Neutral', inf: 3, email: p[0] + '.' + p[p.length - 1] + '@' + a.site, phone: '+91 9' + String(hashStr(nm)).padStart(9, '0').slice(-9, -5) + ' ' + String(hashStr(nm)).padStart(9, '0').slice(-5), last: 0, reports: null, custom: {} }, o);
  dbx().contacts.push(c);
  if (o.deal) { const d = G.deal(o.deal); if (d && d.committee.indexOf(c.id) < 0) d.committee.push(c.id); }
  audit(o.who || WHO.me(), 'Added contact', entOf('contact', c), c.name + ' (' + c.role + ') at ' + a.n);
  return c;
}
function setContactRole(id, role, who) {
  const c = G.con(id), old = c.role; c.role = role;
  openDeals().filter(d => d.acc === c.acc && d.committee.indexOf(c.id) < 0 && role !== 'User').forEach(d => d.committee.push(c.id));
  audit(who || WHO.me(), 'Changed stakeholder role', entOf('contact', c), c.name + ': ' + old + ' to ' + role);
}
function missingRoles(a) { const have = {}; dbx().contacts.filter(c => c.acc === a.id).forEach(c => { have[c.role] = true; }); return ['Economic buyer', 'Decision maker', 'Champion', 'Technical evaluator'].filter(r => !have[r]); }
function accountTimeline(a) {
  const ev = [];
  dbx().acts.filter(x => x.link.acc === a.id).forEach(x => ev.push({ when: x.when, time: x.time, type: x.sys ? 'update' : x.type, subj: x.subj, notes: x.notes, act: x }));
  a.tk.forEach(t => ev.push({ when: -t.d, time: '09:00', type: 'ticket', subj: t.id + ' ' + t.p + ': ' + t.s, notes: '' }));
  dbx().actions.filter(x => x.status === 'applied' && x.acc === a.id).forEach(x => ev.push({ when: 0, time: '12:00', type: 'ai', subj: x.agentName + ': ' + x.title, notes: 'Approved by ' + (x.by || 'you') }));
  return ev.sort((p, q) => q.when - p.when || String(q.time).localeCompare(String(p.time)));
}
function accountInsights(a) {
  const out = [], h = health(a), k = hcounts(a), deals = dbx().deals.filter(d => d.acc === a.id && isOpen(d));
  if (a.type === 'Customer') {
    if (RANK[h] >= 2) out.push({ t: a.n + ' is ' + LABEL[h] + ': ' + k.P2 + ' P2 and ' + k.P3 + ' P3 tickets in 7 days.', ev: a.tk.filter(t => t.d <= 6).map(t => t.id).join(', '), conf: 0.92, level: 'risk' });
    else if (h === 'yellow') out.push({ t: 'Health slipped to Yellow. Review the open tickets before the next check-in.', ev: a.tk.filter(t => t.d <= 6).map(t => t.id).join(', '), conf: 0.88, level: 'watch' });
    if (a.renew != null && a.renew <= 120) out.push({ t: 'Renewal in ' + a.renew + ' days (' + fmtD(a.renew) + ') worth ₹' + a.arr + 'L ARR.' + (RANK[h] >= 1 ? ' Health must recover before then.' : ''), ev: 'Contract end date', conf: 0.99, level: RANK[h] >= 1 ? 'risk' : 'info' });
  }
  const blk = dbx().contacts.filter(c => c.acc === a.id && (c.role === 'Blocker' || c.sent === 'Resistant'));
  blk.forEach(c => out.push({ t: c.name + ' (' + c.title + ') is ' + (c.role === 'Blocker' ? 'a blocker' : 'resistant') + '. Plan a one-to-one before the next decision step.', ev: 'Stakeholder map', conf: 0.8, level: 'risk' }));
  const mr = missingRoles(a); if (mr.length && (deals.length || a.type === 'Prospect')) out.push({ t: 'No ' + mr.join(', ').toLowerCase() + ' on record. Ask your champion for an introduction.', ev: 'Stakeholder coverage', conf: 0.85, level: 'watch' });
  deals.forEach(d => { const n = nextBest(d); if (n) out.push({ t: 'Opportunity (' + fmtL(d.v) + ', ' + d.stage + '): ' + n.text, ev: n.why, conf: 0.8, level: dealRisks(d).length ? 'watch' : 'info' }); });
  if (a.type === 'Customer' && !deals.length && RANK[h] === 0) out.push({ t: 'Healthy account with no open opportunity. Consider an expansion conversation.', ev: 'No open deals, health Green', conf: 0.7, level: 'info' });
  return out;
}

/* ---------- leads ---------- */
const SRC_PTS = { 'Referral': 15, 'Market Radar': 14, 'Website demo request': 14, 'Event': 10, 'Inbound email': 10, 'Webinar': 8, 'Cold outreach': 4 };
function leadScore(l) {
  const parts = { fit: 0, intent: 0, engagement: 0 }, why = [];
  const custInd = customers().filter(a => a.ind === l.ind).length;
  let p;
  if (l.ind === 'Aviation') { p = 18; why.push({ g: 'fit', pts: p, t: 'Aviation is a market gap: competitors have customers there and you have none' }); }
  else if (custInd >= 2) { p = 20; why.push({ g: 'fit', pts: p, t: 'You already serve ' + custInd + ' ' + l.ind.toLowerCase() + ' customers' }); }
  else if (custInd === 1) { p = 14; why.push({ g: 'fit', pts: p, t: 'You have one ' + l.ind.toLowerCase() + ' customer to use as a reference' }); }
  else { p = 6; why.push({ g: 'fit', pts: p, t: 'No existing customers in ' + (l.ind || 'this industry') }); }
  parts.fit += p;
  p = l.emp >= 1000 ? 20 : l.emp >= 200 ? 14 : l.emp >= 50 ? 8 : 0; parts.fit += p; why.push({ g: 'fit', pts: p, t: (l.emp || 0).toLocaleString('en-IN') + ' employees' + (p >= 14 ? ' fits the target size' : p ? ' is a small account' : ' is below the minimum size') });
  p = /(chief|ceo|coo|cfo|chro|cto|vp|head|director|founder|owner)/i.test(l.title) ? 15 : /(manager|lead)/i.test(l.title) ? 8 : 3; parts.fit += p; why.push({ g: 'fit', pts: p, t: l.title + (p >= 15 ? ' can influence the decision' : ' is not a decision maker') });
  p = SRC_PTS[l.source] || 5; parts.intent += p; why.push({ g: 'intent', pts: p, t: 'Source: ' + l.source });
  p = Math.min(24, l.intent.length * 6); parts.intent += p; if (l.intent.length) why.push({ g: 'intent', pts: p, t: l.intent.length + ' buying signal' + (l.intent.length > 1 ? 's' : '') });
  const eng = dbx().acts.filter(x => x.link.lead === l.id && x.done && !x.sys).length;
  p = Math.min(9, eng * 3); parts.engagement += p; if (eng) why.push({ g: 'engagement', pts: p, t: eng + ' logged conversation' + (eng > 1 ? 's' : '') });
  const score = Math.max(0, Math.min(100, parts.fit + parts.intent + parts.engagement));
  const sig = l.intent.length + (l.source === 'Website demo request' ? 1 : 0);
  const filled = ['ind', 'emp', 'loc', 'title', 'email', 'phone', 'site'].filter(k => l[k]).length;
  return { score, parts, why, priority: score >= 75 ? 'High' : score >= 50 ? 'Medium' : 'Low', intent: sig >= 3 ? 'High' : sig >= 1 ? 'Medium' : 'Low', conf: Math.min(0.95, 0.45 + filled * 0.07 + (l.enriched ? 0.1 : 0)) };
}
function leadNBA(l) {
  const s = l.score != null ? l.score : leadScore(l).score, last = lastTouchDays('lead', l.id);
  if (l.status === 'Converted') return { text: 'Converted. Prepare for the first meeting with the new contact.', why: 'Lead is now an account and opportunity.' };
  if (l.status === 'Disqualified') return { text: 'No action. Revisit only if the company grows.', why: l.dq || 'Disqualified.' };
  if (l.score == null) return { text: 'Run Lead Intelligence to enrich the record and score it.', why: 'This lead has not been scored yet.' };
  if (l.status === 'Qualified') return { text: 'Convert to an account, contact and opportunity and book the first meeting.', why: 'Qualified with score ' + l.score + '.' };
  if (l.status === 'New' && s >= 70) return { text: 'Call within 24 hours. Open with the buying signal that brought them in.', why: 'High score and still untouched (' + last + ' days).' };
  if (l.status === 'New') return { text: 'Send a short intro email and check fit before investing a call.', why: 'Medium score with no contact yet.' };
  if (l.status === 'Contacted') return { text: 'Qualify with the four BANT questions on the next conversation.', why: 'Contacted but not yet qualified.' };
  return { text: 'Add to a nurture sequence and revisit in 30 days.', why: 'Not ready to buy now.' };
}
function dupes(l) {
  const out = [], n = normCo(l.company);
  dbx().accounts.forEach(a => {
    if (l.conv && l.conv.acc === a.id) return;
    const an = normCo(a.n);
    if (an && n && (an === n || an.startsWith(n + ' ') || n.startsWith(an + ' '))) out.push({ kind: 'Account', id: a.id, label: a.n, why: 'Company name matches an existing account' });
    else if (l.site && a.site === l.site) out.push({ kind: 'Account', id: a.id, label: a.n, why: 'Same website domain' });
  });
  dbx().contacts.forEach(c => { if (l.email && c.email === l.email) out.push({ kind: 'Contact', id: c.id, label: c.name, why: 'Same email address' }); });
  dbx().leads.forEach(o => { if (o.id !== l.id && o.status !== 'Converted') { if (o.email === l.email) out.push({ kind: 'Lead', id: o.id, label: o.name + ' (' + o.company + ')', why: 'Same email address' }); else if (normCo(o.company) === n) out.push({ kind: 'Lead', id: o.id, label: o.name + ' (' + o.company + ')', why: 'Another lead at the same company' }); } });
  return out;
}
function createLead(o) {
  const co = ENRICH[normCo(o.company)] || {};
  const l = Object.assign({ id: 'L-' + seq('lead'), name: '', title: '', company: '', ind: o.ind || co.ind || '', emp: o.emp || co.emp || 0, loc: o.loc || co.loc || '', source: 'Website demo request', own: dbx().me, status: 'New', score: null, created: 0, email: '', phone: '', site: o.site || co.site || '', intent: [], bant: { b: false, a: false, n: false, t: false }, notes: '', enriched: false, dq: '', conv: null, priority: null, custom: {} }, o);
  if (!l.email) l.email = l.name.toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter(Boolean).filter((w, i, a) => i === 0 || i === a.length - 1).join('.') + '@' + (l.site || slugOf(l.company) + '.example');
  if (!l.phone) l.phone = '+91 9' + String(hashStr(l.name)).padStart(9, '0').slice(-9, -5) + ' ' + String(hashStr(l.name)).padStart(9, '0').slice(-5);
  l.size = sizeLabel(l.emp || 0);
  dbx().leads.unshift(l);
  audit(o.who || WHO.me(), 'Created lead', entOf('lead', Object.assign({}, l, { n: l.company })), l.name + ' from ' + l.source);
  fire('lead_created', { lead: l });
  if (G.agent('lead').active && !o.noAgent) runAgent('lead', { quiet: true, onlyLead: l.id });
  return l;
}
function setLeadStatus(id, status, reason) {
  const l = G.lead(id), old = l.status; l.status = status; if (status === 'Disqualified') l.dq = reason || 'Not a fit';
  audit(WHO.me(), 'Lead status: ' + old + ' to ' + status, entOf('lead', Object.assign({}, l, { n: l.company })), reason || '');
}
const bantCount = l => ['b', 'a', 'n', 't'].filter(k => l.bant[k]).length;
function qualifyLead(id) {
  const l = G.lead(id);
  if (bantCount(l) < 3) return { ok: false, msg: 'Confirm at least 3 of the 4 BANT criteria to qualify this lead.' };
  setLeadStatus(id, 'Qualified'); return { ok: true };
}
function convertLead(id, o) {
  const l = G.lead(id); if (!l || l.status === 'Converted') return null;
  let a;
  if (o.accMode === 'existing' && G.acc(o.accId)) a = G.acc(o.accId);
  else {
    let aid = 'a-' + slugOf(l.company), n = 1; while (G.acc(aid)) aid = 'a-' + slugOf(l.company) + (++n);
    a = { id: aid, n: o.accName || l.company, ind: l.ind, emp: l.emp, size: sizeLabel(l.emp), loc: l.loc, site: l.site, type: 'Prospect', own: l.own, arr: 0, life: 0, renew: null, last: 0, tk: [], note: '', custom: {}, created: 0 };
    dbx().accounts.push(a); audit(WHO.me(), 'Created account', entOf('account', a), 'From lead ' + l.id);
  }
  const c = addContact({ acc: a.id, name: l.name, title: l.title, role: o.conRole || 'Champion', sent: 'Supportive', inf: 3, email: l.email, phone: l.phone });
  const d = createDeal({ acc: a.id, desc: o.desc || 'New opportunity from ' + l.source, stage: 'Discovery', v: o.amount || 10, own: l.own, due: o.closeDays || 45, prods: (o.prods || []).slice(), committee: [c.id], next: 'Discovery meeting', comps: [], created: 0 });
  l.status = 'Converted'; l.conv = { acc: a.id, con: c.id, deal: d.id }; l.score = l.score == null ? leadScore(l).score : l.score;
  dbx().acts.forEach(x => { if (x.link.lead === l.id) { x.link.acc = a.id; x.link.con = c.id; x.link.deal = d.id; } });
  sysEvent('Lead ' + l.name + ' converted to account, contact and opportunity', { acc: a.id, deal: d.id, con: c.id });
  audit(WHO.me(), 'Converted lead', entOf('lead', Object.assign({}, l, { n: l.company })), 'Account ' + a.n + ', contact ' + c.name + ', opportunity ' + fmtL(d.v));
  return { a, c, d };
}

/* ---------- revenue intelligence ---------- */
const periodRange = p => p === 'month' ? [0, 29] : p === 'quarter' ? [-31, 60] : [-304, 60];
const periodName = p => p === 'month' ? 'November' : p === 'quarter' ? 'Q4 2026' : 'FY 2026';
function revenue(p) {
  const r = periodRange(p), D = dbx().deals;
  const won = D.filter(d => d.stage === 'Won' && d.due >= r[0] && d.due <= r[1]);
  const wonV = sum(won, d => d.v) + (p === 'year' ? sum(dbx().history) : 0);
  const open = D.filter(d => isOpen(d) && d.due <= r[1]);
  const pipe = sum(open, d => d.v), weighted = sum(open, wval);
  const commit = open.filter(d => d.fc === 'Commit'), best = open.filter(d => d.fc === 'Best Case');
  const forecast = wonV + sum(commit, d => d.v) + sum(best, wval);
  const quota = dbx().quotas[p], remaining = Math.max(quota - wonV, 0);
  const closed = D.filter(d => (d.stage === 'Won' || d.stage === 'Lost') && d.due >= -90), winRate = closed.length ? closed.filter(d => d.stage === 'Won').length / closed.length : 0;
  const cyc = D.filter(d => d.stage === 'Won' && d.cycle), avgCycle = cyc.length ? sum(cyc, d => d.cycle) / cyc.length : 40;
  const velocity = open.length ? open.length * (pipe / open.length) * winRate / avgCycle : 0;
  const risky = open.filter(d => dealRisks(d).length);
  const fh = dbx().fcHist, accuracy = sum(fh, x => 1 - Math.abs(x.f - x.a) / x.a) / fh.length;
  return { p, range: r, won, wonV, open, pipe, weighted, commit, best, forecast, quota, remaining, coverage: remaining > 0 ? pipe / remaining : null, attain: wonV / quota, fAttain: forecast / quota, winRate, avgCycle, velocity, risky, riskV: sum(risky, d => d.v), accuracy, closedN: closed.length };
}
function monthly() {
  const D = dbx().deals, out = [];
  for (let m = 0; m < 12; m++) {
    let actual = 0, commit = 0, best = 0;
    if (m < 9) actual = dbx().history[m];
    else {
      const lo = m === 9 ? -31 : m === 10 ? 0 : 30, hi = m === 9 ? -1 : m === 10 ? 29 : 60;
      actual = sum(D.filter(d => d.stage === 'Won' && d.due >= lo && d.due <= hi), d => d.v);
      if (m >= 10) { const op = D.filter(d => isOpen(d) && (m === 10 ? d.due <= 29 : d.due >= 30 && d.due <= 60)); commit = sum(op.filter(d => d.fc === 'Commit'), d => d.v); best = sum(op.filter(d => d.fc === 'Best Case'), wval); }
    }
    out.push({ m: MONTHS[m], actual, commit, best, future: m >= 10 });
  }
  return out;
}
const conversions = () => { const f = dbx().funnel, n = stageNames().concat(['Won']); return n.map((s, i) => ({ s, n: f[s] || 0, rate: i ? ((f[s] || 0) / Math.max(1, f[n[i - 1]] || 1)) : null })); };
function forecastInsight(p) {
  const r = revenue(p), f = [];
  if (r.coverage != null && r.coverage < 3) f.push({ t: 'Pipeline coverage is ' + r.coverage.toFixed(1) + 'x against a 3x guideline.', ev: fmtL(r.pipe) + ' open pipeline for ' + fmtL(r.remaining) + ' of quota still to win.', k: 'coverage' });
  const rc = r.commit.filter(d => dealRisks(d).length);
  if (rc.length) f.push({ t: rc.length + ' Commit deal' + (rc.length > 1 ? 's' : '') + ' (' + fmtL(sum(rc, d => d.v)) + ') carry open risks: ' + rc.map(d => dealAcc(d).n).join(', ') + '.', ev: rc.map(d => dealAcc(d).n + ': ' + dealRisks(d)[0]).join('; '), k: 'commit', ids: rc.map(d => d.id) });
  const sl = r.open.filter(d => d.slip >= 2); if (sl.length) f.push({ t: sl.map(d => dealAcc(d).n).join(', ') + ' slipped 2 or more times, which lowers their chance of closing in period.', ev: sl.map(d => dealAcc(d).n + ' slipped ' + d.slip + 'x').join('; '), k: 'slip', ids: sl.map(d => d.id) });
  const cp = r.open.filter(d => d.comps.length); if (cp.length) f.push({ t: fmtL(sum(cp, d => d.v)) + ' of open pipeline has a named competitor.', ev: cp.map(d => dealAcc(d).n + ' vs ' + d.comps.join(', ')).join('; '), k: 'comp', ids: cp.map(d => d.id) });
  const bh = r.open.filter(d => { const a = dealAcc(d); return a.type === 'Customer' && RANK[health(a)] >= 2; }); if (bh.length) f.push({ t: 'Renewal or expansion at ' + bh.map(d => dealAcc(d).n).join(', ') + ' depends on recovering customer health.', ev: bh.map(d => dealAcc(d).n + ' is ' + LABEL[health(dealAcc(d))]).join('; '), k: 'health', ids: bh.map(d => d.id) });
  const head = periodName(p) + ' forecast is ' + fmtL(r.forecast) + ' (' + Math.round(r.fAttain * 100) + '% of the ' + fmtL(r.quota) + ' quota). ' + (r.fAttain >= 1 ? 'You are on track, but ' : 'You are short, and ') + (f.length ? f.length + ' risk factor' + (f.length > 1 ? 's' : '') + ' could move it.' : 'no major risks are visible.');
  return { head, factors: f.slice(0, 4), r };
}
function industryTable() {
  const you = {}; customers().forEach(a => { you[a.ind] = (you[a.ind] || 0) + 1; });
  const comp = { Banking: [3, 2, 1], Retail: [2, 3, 1], Healthcare: [1, 1, 3], Logistics: [2, 1, 2], Manufacturing: [2, 2, 1], Energy: [0, 2, 1], Aviation: [2, 1, 0], Hospitality: [2, 0, 1], Telecom: [1, 0, 0], Pharma: [0, 1, 1], Education: [0, 0, 1] };
  const rows = Object.keys(comp).map(n => ({ n, you: you[n] || 0, a: comp[n][0], b: comp[n][1], c: comp[n][2] }));
  rows.forEach(r => { r.gap = r.you === 0 && (r.a + r.b + r.c) > 0; r.isNew = r.n === 'Aviation'; });
  return rows.sort((x, y) => (y.gap - x.gap) || (y.you + y.a + y.b + y.c) - (x.you + x.a + x.b + x.c));
}
const RADAR_SIGNALS = [
  { d: '30 Oct', co: 'Orbit People', type: 'Job post', ind: 'Aviation', txt: 'Hiring an "Aviation Sales Manager" in Mumbai.', src: 'orbitpeople.example/careers' },
  { d: '29 Oct', co: 'Vantage HR', type: 'Customer logo', ind: 'Aviation', txt: 'Listed Aerolink Ground Services among new customers.', src: 'vantagehr.example/customers' },
  { d: '27 Oct', co: 'Vantage HR', type: 'Case study', ind: 'Aviation', txt: 'Published a case study with Skyway Airlines on ground-crew shift scheduling.', src: 'vantagehr.example/stories' },
  { d: '25 Oct', co: 'Plumeria', type: 'Pricing', ind: 'Logistics', txt: 'Introduced a 12% discount for annual plans above 500 seats.', src: 'plumeria.example/pricing' },
  { d: '23 Oct', co: 'Orbit People', type: 'Press release', ind: 'Energy', txt: 'Announced a partnership with a regional power utility.', src: 'orbitpeople.example/news' },
  { d: '21 Oct', co: 'Vantage HR', type: 'Product', ind: 'Banking', txt: 'Launched a branch-level scheduling feature aimed at banks.', src: 'vantagehr.example/changelog' },
  { d: '18 Oct', co: 'Plumeria', type: 'Review site', ind: 'Healthcare', txt: 'Three new 5-star reviews from hospital customers.', src: 'reviews.example/plumeria' }
];
const RADAR_COMPS = [
  { n: 'Vantage HR', strong: 'Banking, Aviation (new)', wins: 4, move: 'Won 2 aviation accounts and launched bank branch scheduling.' },
  { n: 'Orbit People', strong: 'Retail, Energy', wins: 2, move: 'Hiring aviation sales and signed an energy utility partnership.' },
  { n: 'Plumeria', strong: 'Healthcare, Logistics', wins: 3, move: 'Cut prices for annual plans. Expect pressure in BlueWave Shipping.' }
];
const RADAR_TARGETS = [
  { n: 'Cirrus Air', fit: 91, why: 'Large ground crew, shift-heavy', who: 'Rhea Malhotra', title: 'Head of Ground Operations' }, { n: 'Deccan Wings', fit: 88, why: 'Similar size to Skyway Airlines', who: 'Imran Pathan', title: 'VP Operations' },
  { n: 'Meghdoot Airports', fit: 84, why: 'Multi-site payroll', who: 'Shweta Rane', title: 'Director HR' }, { n: 'Arrow Cargo Air', fit: 79, why: 'Cargo handling shifts', who: 'Naveen Pillai', title: 'Head of Ground Handling' }, { n: 'Lakshya Aviation Services', fit: 76, why: 'Outsourced ground staff', who: 'Farah Ali', title: 'Operations Manager' }
];
function createRadarLeads() {
  const g = dbx().radarGap; if (g.targetsAdded) return [];
  const out = RADAR_TARGETS.map(t => createLead({ name: t.who, title: t.title, company: t.n, source: 'Market Radar', own: 'AS', intent: ENRICH[normCo(t.n)] ? ENRICH[normCo(t.n)].intent.slice() : [], noAgent: true }));
  g.targetsAdded = true; g.targetList = true;
  audit(WHO.me(), 'Created leads from Market Radar', { t: 'radar', id: 'aviation', l: 'Aviation target list' }, out.length + ' aviation leads');
  return out;
}
