/* Runs the CRM domain model (src/js/01..04) headlessly and walks the lead-to-revenue journey. Usage: node tests/model.test.js */
const fs = require('fs'), path = require('path'), assert = require('assert');
const dir = path.join(__dirname, '../src/js');
const src = ['01-core.js', '02-seed.js', '03-model.js', '04-automation.js'].map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const api = new Function(src + '\nreturn {S,G,initDb,resetDb,health,hcounts,revenue,monthly,forecastInsight,industryTable,createLead,convertLead,qualifyLead,leadScore,dupes,moveDeal,setDealDue,logTicket,runAgent,approveAction,rejectAction,undoAction,editAction,pendingActions,pendingForCall,createCall,processCall,cirrusScript,CIRRUS_TRANSCRIPT,fire,scan,wfRun,wfSubjects,newWorkflow,openDeals,dealRisks,nextBest,createRadarLeads,customers,atRiskAccounts,conversions,extractHeuristic,addActivity,committee,setContactRole,lastTouchDays,bantCount,dbx,seedDb,allStages,missingRoles,accountInsights,stageNames};')();
let pass = 0; const t = (name, fn) => { try { fn(); pass++; console.log('  ok  ' + name); } catch (e) { console.log('FAIL  ' + name + '\n      ' + e.message); process.exitCode = 1; } };
api.initDb(true);
const { G, dbx } = api;

t('seed is internally consistent', () => {
  const d = dbx();
  d.deals.forEach(x => assert(G.acc(x.acc), 'deal account missing ' + x.id));
  d.contacts.forEach(c => assert(G.acc(c.acc), 'contact account missing ' + c.id));
  d.acts.forEach(a => { ['acc', 'con', 'deal'].forEach(k => { if (a.link[k]) assert(G[k](a.link[k]), 'activity link ' + k + ' ' + a.link[k]); }); });
  d.deals.forEach(x => x.committee.forEach(c => assert(G.con(c), 'committee ' + c)));
  assert.strictEqual(api.health(G.acc('cobalt')), 'orange'); assert.strictEqual(api.health(G.acc('harbor')), 'green'); assert.strictEqual(api.health(G.acc('lotus')), 'yellow');
});
t('boot created pending agent actions incl. 6 Harbor call proposals', () => { assert.strictEqual(api.pendingForCall('c1').length, 6); assert(api.pendingActions().length >= 10, 'actions ' + api.pendingActions().length); });
t('revenue intelligence numbers add up', () => {
  const q = api.revenue('quarter'); assert.strictEqual(q.wonV, 58); assert(q.forecast > q.wonV); assert(q.coverage > 2 && q.coverage < 4, 'coverage ' + q.coverage);
  const y = api.revenue('year'); assert.strictEqual(y.wonV, 233); assert(api.revenue('month').wonV === 0);
  assert.strictEqual(api.monthly().length, 12); assert(api.forecastInsight('quarter').factors.length >= 2);
});
t('market radar gap derives from accounts', () => { const r = api.industryTable().filter(x => x.n === 'Aviation')[0]; assert(r.gap && r.you === 0 && r.a === 2); });
t('duplicate detection', () => { assert(api.dupes(G.lead('L-3')).some(x => x.kind === 'Account' && x.id === 'orion')); assert(api.dupes(G.lead('L-1')).some(x => x.kind === 'Lead' && x.id === 'L-10')); assert.strictEqual(api.dupes(G.lead('L-2')).length, 0); });
t('approve Harbor proposals changes stage, contacts, competitor', () => {
  api.pendingForCall('c1').forEach(a => assert(api.approveAction(a.id).ok));
  const d = G.deal('d-harbor'); assert.strictEqual(d.stage, 'Proposal'); assert(d.comps.indexOf('Vantage HR') >= 0); assert.strictEqual(G.con('priya').role, 'Economic buyer');
  assert(dbx().contacts.some(c => c.name === 'Arjun Rao')); assert.strictEqual(d.next, 'Send quote + SOC 2 by Fri 6 Nov');
});
t('undo restores previous values', () => {
  const a = dbx().actions.filter(x => x.callId === 'c1' && x.kind === 'deal_competitor')[0]; assert(api.undoAction(a.id)); assert.strictEqual(G.deal('d-harbor').comps.length, 0); assert.strictEqual(a.status, 'reversed');
  const c = dbx().actions.filter(x => x.callId === 'c1' && x.kind === 'contact_add')[0]; assert(api.undoAction(c.id)); assert(!dbx().contacts.some(x => x.name === 'Arjun Rao'));
});
t('reject leaves record untouched', () => { const a = api.pendingActions().filter(x => x.kind === 'forecast_cat')[0]; const d = G.deal(a.p.deal), before = d.fc; assert(api.rejectAction(a.id)); assert.strictEqual(d.fc, before); assert.strictEqual(a.status, 'rejected'); });
t('edit before approving', () => { const a = api.pendingActions().filter(x => x.kind === 'task_create')[0]; assert.strictEqual(api.editAction(a.id, 'Edited title'), null); api.approveAction(a.id); assert(dbx().acts.some(x => x.subj === 'Edited title')); });
t('external email drafts are never sent: approval only records intent', () => { const a = api.pendingActions().filter(x => x.kind === 'email_draft')[0]; assert(a.external); api.approveAction(a.id); assert(dbx().acts.some(x => x.sim && /Not actually sent/.test(x.notes))); });

/* ---- the end-to-end journey ---- */
let lead, conv, call, deal;
t('1 radar target list creates Cirrus Air lead (unscored)', () => { api.createRadarLeads(); lead = dbx().leads.filter(l => l.company === 'Cirrus Air')[0]; assert(lead && lead.score == null && lead.source === 'Market Radar'); assert.strictEqual(dbx().leads.filter(l => l.source === 'Market Radar').length, 5); });
t('2 Lead agent proposes enrichment+score; approving applies them', () => {
  const out = api.runAgent('lead', { onlyLead: lead.id }); assert(out.length >= 1, 'no proposals');
  const a = dbx().actions.filter(x => x.kind === 'lead_score' && x.p.lead === lead.id)[0]; assert(a && a.ev.length >= 4); api.approveAction(a.id);
  assert(lead.score >= 75 && lead.enriched && lead.ind === 'Aviation' && lead.emp > 0, 'score ' + lead.score);
});
t('3 qualify requires BANT', () => { assert(!api.qualifyLead(lead.id).ok); lead.bant = { b: true, a: true, n: true, t: false }; assert(api.qualifyLead(lead.id).ok); assert.strictEqual(lead.status, 'Qualified'); });
t('4 convert creates account, contact, opportunity and relinks', () => {
  const before = dbx().accounts.length; conv = api.convertLead(lead.id, { accMode: 'new', conRole: 'Champion', amount: 10, prods: ['p-crew'], closeDays: 40, desc: 'Ground-crew rostering' });
  assert.strictEqual(dbx().accounts.length, before + 1); assert(conv.c.acc === conv.a.id && conv.d.acc === conv.a.id && conv.d.committee.indexOf(conv.c.id) >= 0); assert.strictEqual(lead.status, 'Converted'); deal = conv.d;
  assert.strictEqual(api.convertLead(lead.id, {}), null, 'double convert must be blocked');
});
t('5-7 meeting logged, Meeting Intelligence extracts, approval updates the opportunity', () => {
  call = api.createCall({ acc: conv.a.id, deal: deal.id, con: conv.c.id, who: 'Rhea Malhotra', transcript: api.CIRRUS_TRANSCRIPT, script: api.cirrusScript(deal.id, conv.a.id), subj: 'discovery meeting' });
  const out = api.processCall(call.id); assert.strictEqual(out.length, 7); out.forEach(a => assert(api.approveAction(a.id).ok));
  assert.strictEqual(deal.stage, 'Demo'); assert.strictEqual(deal.v, 28); assert(deal.comps.indexOf('Vantage HR') >= 0 && deal.prods.length >= 3);
  assert(dbx().contacts.filter(c => c.acc === conv.a.id).length === 3); assert(api.committee(deal).some(c => c.role === 'Economic buyer'));
});
t('8 stage change to Proposal fires workflows and funnel', () => { const f = dbx().funnel.Proposal; api.moveDeal(deal.id, 'Proposal'); assert.strictEqual(deal.stage, 'Proposal'); assert.strictEqual(deal.proposalSent, 0); assert.strictEqual(dbx().funnel.Proposal, f + 1); });
t('9 Deal Intelligence flags competitor risk with radar evidence', () => {
  api.runAgent('deal', { onlyDeal: deal.id }); const a = dbx().actions.filter(x => x.kind === 'risk_flag' && x.p.deal === deal.id)[0]; assert(a, 'no risk action'); assert(a.ev.some(e => e.src === 'Market Radar'), 'no radar evidence'); api.approveAction(a.id); assert(/Vantage HR/.test(deal.risk));
});
t('10 scheduled scan (+4 days quiet) creates a follow-up task and email draft via Workflow Studio', () => {
  const before = dbx().acts.length; const ran = api.scan(4); assert(ran.some(r => r.w.id === 'wf-follow' && /Cirrus/.test(r.r.subj)), 'follow-up workflow did not run for Cirrus');
  assert(dbx().acts.some(x => x.wf === 'wf-follow' && x.link.deal === deal.id)); assert(dbx().actions.some(x => x.agent === 'workflow' && x.kind === 'email_draft' && x.status === 'pending')); assert(dbx().acts.length > before);
  assert.strictEqual(api.scan(4).filter(r => /Cirrus/.test(r.r.subj)).length, 0, 'must not fire twice');
});
t('11 win converts prospect into customer with ARR and renewal', () => { const w = dbx().acts.length; api.moveDeal(deal.id, 'Won'); const a = conv.a; assert.strictEqual(a.type, 'Customer'); assert.strictEqual(a.arr, 28); assert.strictEqual(a.renew, 365); assert(api.revenue('month').wonV === 28); });
t('12 Customer Success agent starts monitoring (onboarding task)', () => { api.runAgent('cs', { onlyAcc: conv.a.id }); assert(dbx().actions.some(x => x.key === 'onboard:' + conv.a.id && x.status === 'pending')); assert.strictEqual(api.health(conv.a), 'green'); });
t('audit trail recorded the journey', () => { const a = dbx().audit; assert(a.some(x => x.action === 'Converted lead') && a.some(x => x.action === 'Won deal') && a.some(x => x.type === 'workflow') && a.some(x => x.type === 'agent')); });

t('loss capture requires reason and keeps competitor', () => { const d = G.deal('d-bluewave'); api.moveDeal(d.id, 'Lost', { reason: 'Price too high', to: 'Plumeria', note: 'Matched price elsewhere' }); assert.strictEqual(d.stage, 'Lost'); assert.strictEqual(d.lostReason, 'Price too high'); });
t('close date slippage is counted', () => { const d = G.deal('d-orion'); api.setDealDue(d.id, d.due + 10); assert.strictEqual(d.slip, 1); });
t('ticket escalation changes health and raises an alert', () => { const r = api.logTicket('kiran', 'P2'); assert.strictEqual(r.after, 'orange'); assert(r.alert); });
t('churn workflow respects its conditions (Kiran renews in 96 days: no task; Lotus in 88 days: task)', () => {
  assert(!dbx().acts.some(x => x.wf === 'wf-churn' && x.link.acc === 'kiran'), 'must not fire outside the 90-day window');
  const r = api.logTicket('lotus', 'P2'); assert.strictEqual(r.after, 'orange'); assert(dbx().acts.some(x => x.wf === 'wf-churn' && x.link.acc === 'lotus'), 'churn workflow should have created a task');
  assert(dbx().actions.some(x => x.agent === 'workflow' && x.kind === 'ack' && x.status === 'pending'), 'approval request expected');
});
t('workflow dry-run does not write', () => { const w = G.wf('wf-lead'), subj = api.wfSubjects(w)[0], n = dbx().acts.length; const r = api.wfRun(w, subj.ctx, { dry: true }); assert(r.steps.length > 3); assert.strictEqual(dbx().acts.length, n); });
t('transcript heuristic extracts budget, competitor, contact and next step', () => {
  const c = { id: 'x', deal: 'd-sunrise', acc: 'sunrise', transcript: [{ who: 'A', t: 'Our budget is about 9 lakh this year.' }, { who: 'A', t: 'We also evaluated Plumeria.' }, { who: 'A', t: 'Our CTO, Mohit Verma, will review it.' }, { who: 'A', t: 'Please send the quote by Friday.' }] };
  const r = api.extractHeuristic(c); assert(r.some(x => x.kind === 'deal_field' && x.p.field === 'v') && r.some(x => x.kind === 'deal_competitor') && r.some(x => x.kind === 'contact_add') && r.some(x => x.p.field === 'next'), JSON.stringify(r.map(x => x.kind)));
});
t('persistence round-trips', () => { const s = JSON.stringify(dbx()); const o = JSON.parse(s); assert.strictEqual(o.deals.length, dbx().deals.length); });
console.log('\n' + pass + ' passed' + (process.exitCode ? ', some FAILED' : ''));
