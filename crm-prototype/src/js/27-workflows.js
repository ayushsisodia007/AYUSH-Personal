/* ==========================================================================
   27-workflows: Workflow Studio. Trigger → conditions → actions, with dry-run and real-run simulation.
   ========================================================================== */
const wfParamHtml = (g, i, def, p) => (def.params || []).map(x => {
  const base = 'data-onchange="wfparam" data-g="' + g + '" data-i="' + i + '" data-k="' + x.k + '" aria-label="' + esc(x.l) + '"';
  if (x.t === 'num') return '<label class="wp"><span>' + esc(x.l) + '</span><input type="number" value="' + esc(p[x.k]) + '" ' + base + '></label>';
  if (x.t === 'select') return '<label class="wp"><span>' + esc(x.l) + '</span>' + sel('', x.opts, p[x.k], base) + '</label>';
  if (x.t === 'stage') return '<label class="wp"><span>' + esc(x.l) + '</span>' + sel('', ['Any'].concat(allStages()), p[x.k] || 'Any', base) + '</label>';
  if (x.t === 'owner') return '<label class="wp"><span>' + esc(x.l) + '</span>' + sel('', [['owner', 'Record owner'], ['csm', 'Customer success manager'], ['territory', 'By territory']].concat(ownerOpts()), p[x.k], base) + '</label>';
  return '<label class="wp wide"><span>' + esc(x.l) + '</span><input type="text" value="' + esc(p[x.k]) + '" ' + base + '></label>';
}).join('');
const wfNode = (kind, ico, title, params, rm) => '<div class="wnode ' + kind + '"><div class="wh"><span class="wi">' + ic(ico, 16) + '</span><b>' + title + '</b>' + (rm || '') + '</div>' + (params ? '<div class="wps">' + params + '</div>' : '') + '</div>';
function wfBuilder(w) {
  const rm = (g, i) => '<button class="x2 sm" type="button" data-act="wfremove" data-g="' + g + '" data-i="' + i + '" aria-label="Remove">' + ic('close', 14) + '</button>';
  const trigSel = sel('', Object.keys(TRIGGERS).map(k => [k, TRIGGERS[k].n]), w.trig.t, 'data-onchange="wftrig" aria-label="Trigger"');
  const subs = wfSubjects(w), cur = UI.wfSim && UI.wfSim.w === w.id ? UI.wfSim : { subj: subs[0] ? subs[0].id : '', ahead: 0, result: null };
  const res = cur.result;
  const sim = '<div class="card"><div class="ch"><div><h2>' + ic('play', 16) + ' Simulate</h2><span class="muted sm">Pick a record and see what this workflow would do. Dry run changes nothing.</span></div></div><div class="form2">' + field('Test on', sel('', subs.map(s => [s.id, s.label]), cur.subj, 'id="wfSubj" data-onchange="wfsubj"')) + field('Days later (for no-response and renewal checks)', '<input id="wfAhead" type="number" min="0" max="120" value="' + cur.ahead + '" data-onchange="wfahead">') + '</div><div class="row"><button class="btn" type="button" data-act="wfsim" data-real="0">Dry run</button><button class="btn pri" type="button" data-act="wfsim" data-real="1">Run for real (demo)</button></div>' +
    (res ? '<div class="simres"><div class="row"><b>' + (res.real ? 'Ran for real' : 'Dry run') + ': ' + esc(res.r.subj) + '</b>' + chip(res.r.pass ? 'All conditions met' : 'Stopped: a condition failed', res.r.pass ? 'src' : 'warnchip') + '</div>' + res.r.steps.map(s => '<div class="sstep ' + (s.ok === true ? 'ok' : s.ok === false ? 'no' : 'na') + '"><span class="si">' + (s.ok === true ? ic('check', 13) : s.ok === false ? ic('close', 13) : '–') + '</span><div><b>' + esc(s.text) + '</b>' + (s.detail ? '<div class="muted sm">' + esc(s.detail) + '</div>' : '') + '</div></div>').join('') + (res.real ? '<p class="muted sm">Records were created and the audit log updated. Emails stay drafts until you approve them in AI Agents, and Slack or email notifications are simulated.</p>' : '<p class="muted sm">Nothing was changed.</p>') + '</div>' : '') + '</div>';
  return '<div class="card"><div class="ch"><div class="grow"><input class="wfname" value="' + esc(w.n) + '" data-onchange="wfname" aria-label="Workflow name"><input class="wfdesc" value="' + esc(w.d) + '" data-onchange="wfdesc" aria-label="Description"></div><div class="row"><span class="muted sm">' + (w.active ? 'Active' : 'Inactive') + '</span>' + toggle('wftoggle', w.id, w.active, 'Activate workflow') + '<button class="btn xs" type="button" data-act="wfdelete" data-id="' + w.id + '" aria-label="Delete workflow">' + ic('trash', 13) + '</button></div></div>' +
    '<div class="flow">' + wfNode('trig', 'bolt', 'When', '<label class="wp wide"><span>Trigger</span>' + trigSel + '</label>' + wfParamHtml('trig', 0, TRIGGERS[w.trig.t], w.trig.p)) +
    '<div class="wline"></div><div class="wlab">If all of these are true</div>' + (w.conds.length ? w.conds.map((c, i) => wfNode('cond', 'filter', CONDS[c.t].n, wfParamHtml('cond', i, CONDS[c.t], c.p), rm('cond', i))).join('<div class="wand">and</div>') : '<div class="wnode empty">No conditions: it always runs</div>') +
    '<div class="row" style="margin:8px 0">' + sel('', [['', '+ Add condition']].concat(Object.keys(CONDS).map(k => [k, CONDS[k].n])), '', 'data-onchange="wfaddcond" aria-label="Add condition"') + '</div><div class="wline"></div><div class="wlab">Then do</div>' +
    w.acts.map((a, i) => wfNode('act', 'bolt', (i + 1) + '. ' + WF_ACTS[a.t].n, wfParamHtml('act', i, WF_ACTS[a.t], a.p), rm('act', i))).join('<div class="wline short"></div>') + '<div class="row" style="margin-top:8px">' + sel('', [['', '+ Add action']].concat(Object.keys(WF_ACTS).map(k => [k, WF_ACTS[k].n])), '', 'data-onchange="wfaddact" aria-label="Add action"') + '</div></div><p class="muted sm">Use {{name}}, {{company}}, {{value}}, {{health}} and {{renew}} in text. Emails and approvals never send anything by themselves.</p></div>' + sim +
    '<div class="card"><div class="ch"><h2>Run history</h2><span class="chip">' + w.runs + ' runs</span></div>' + (w.log.length ? w.log.map(l => '<div class="logrow"><span class="chip ' + (l.ok ? 'src' : '') + '">' + (l.ok ? 'Ran' : 'Skipped') + '</span><div><b>' + esc(l.subj) + '</b>' + (l.fx.length ? '<div class="muted sm">' + l.fx.map(esc).join(' · ') + '</div>' : '') + '</div><span class="muted sm">' + (l.at < -1000 ? '' : fmtStamp(l.at)) + '</span></div>').join('') : '<p class="muted">Not run yet.</p>') + '</div>';
}
VIEWS.workflows = () => {
  const w = G.wf(UI.selWf) || dbx().workflows[0]; UI.selWf = w.id;
  const list = dbx().workflows.map(x => '<button class="wfitem" type="button" data-act="selwf" data-id="' + x.id + '" aria-pressed="' + (x.id === w.id) + '"><div class="row" style="justify-content:space-between"><b>' + esc(x.n) + '</b><span class="hp ' + (x.active ? 'green' : 'yellow') + '">' + (x.active ? 'Active' : 'Inactive') + '</span></div><span class="muted sm">When: ' + TRIGGERS[x.trig.t].n + ' · ' + x.acts.length + ' action' + (x.acts.length > 1 ? 's' : '') + ' · ' + x.runs + ' runs</span></button>').join('');
  const scan_ = UI.lastScan ? '<div class="simres"><b>Scan result (+' + UI.lastScan.ahead + ' days)</b>' + (UI.lastScan.ran.length ? UI.lastScan.ran.map(x => '<div class="sstep ok"><span class="si">' + ic('check', 13) + '</span><div><b>' + esc(x.w.n) + '</b><div class="muted sm">' + esc(x.r.subj) + ': ' + x.r.steps.filter(s => s.k === 'act' && s.ok).map(s => esc(s.text)).join('; ') + '</div></div></div>').join('') : '<p class="muted sm">No active workflow had anything to do.</p>') + '</div>' : '';
  return phead('Workflow Studio', 'Automate the routine so reps spend time selling. Triggers start a workflow, conditions decide if it should run, and actions do the work. Anything external waits for a human.', '<div class="row"><button class="btn pri" type="button" data-act="wfnew">' + ic('plus', 14) + 'New workflow</button></div>') +
    '<div class="wfgrid"><div class="stack"><div class="stack" style="gap:8px">' + list + '</div><section class="card"><div class="ch"><h2>Scheduled scan</h2></div><p class="muted sm">Time-based triggers (proposal went quiet, customer inactive, renewal approaching) are checked by a nightly job. Simulate it here.</p><div class="row mt"><label class="muted sm" for="scanDays">Days ahead</label><input id="scanDays" type="number" min="0" max="120" value="' + (UI.scanDays != null ? UI.scanDays : 4) + '" data-onchange="scandays"><button class="btn xs pri" type="button" data-act="runscan">Run scan</button></div>' + scan_ + '</section></div><div class="stack">' + wfBuilder(w) + '</div></div>';
};
GATE.wftoggle = 'workflows.manage'; ACT.wftoggle = t => { const w = G.wf(t.dataset.id); w.active = !w.active; audit(WHO.me(), w.active ? 'Activated workflow' : 'Deactivated workflow', { t: 'workflow', id: w.id, l: w.n }, ''); toast(w.n + (w.active ? ' is now active' : ' is paused')); };
ACT.selwf = t => { UI.selWf = t.dataset.id; UI.wfSim = null; };
GATE.wfnew = 'workflows.manage'; ACT.wfnew = () => { UI.selWf = newWorkflow().id; UI.wfSim = null; toast('New workflow created. Add conditions and actions.'); };
GATE.wfdelete = 'workflows.manage'; ACT.wfdelete = t => { const w = G.wf(t.dataset.id); if (dbx().workflows.length < 2) { toast('Keep at least one workflow.'); return; } dbx().workflows = dbx().workflows.filter(x => x.id !== w.id); audit(WHO.me(), 'Deleted workflow', { t: 'workflow', id: w.id, l: w.n }, ''); UI.selWf = dbx().workflows[0].id; toast('Workflow deleted'); };
const wfCur = () => G.wf(UI.selWf);
GATE.wfname = 'workflows.manage'; ACT.wfname = t => { wfCur().n = t.value || 'Untitled workflow'; };
GATE.wfdesc = 'workflows.manage'; ACT.wfdesc = t => { wfCur().d = t.value; };
GATE.wftrig = 'workflows.manage'; ACT.wftrig = t => { const w = wfCur(); w.trig = { t: t.value, p: defaultParams('trig', t.value) }; w.seen = {}; UI.wfSim = null; };
GATE.wfaddcond = 'workflows.manage'; ACT.wfaddcond = t => { if (t.value) wfCur().conds.push({ t: t.value, p: defaultParams('cond', t.value) }); };
GATE.wfaddact = 'workflows.manage'; ACT.wfaddact = t => { if (t.value) wfCur().acts.push({ t: t.value, p: defaultParams('act', t.value) }); };
GATE.wfremove = 'workflows.manage'; ACT.wfremove = t => { const w = wfCur(), i = +t.dataset.i; if (t.dataset.g === 'cond') w.conds.splice(i, 1); else if (w.acts.length > 1) w.acts.splice(i, 1); else toast('A workflow needs at least one action.'); };
GATE.wfparam = 'workflows.manage';
ACT.wfparam = t => { const w = wfCur(), g = t.dataset.g, i = +t.dataset.i, k = t.dataset.k, tgt = g === 'trig' ? w.trig : g === 'cond' ? w.conds[i] : w.acts[i]; tgt.p[k] = t.type === 'number' ? (parseFloat(t.value) || 0) : t.value; w.seen = {}; };
ACT.wfsubj = t => { UI.wfSim = Object.assign(UI.wfSim && UI.wfSim.w === UI.selWf ? UI.wfSim : { w: UI.selWf, ahead: 0 }, { subj: t.value, result: null }); };
ACT.wfahead = t => { UI.wfSim = Object.assign(UI.wfSim && UI.wfSim.w === UI.selWf ? UI.wfSim : { w: UI.selWf, subj: ($('#wfSubj') || {}).value }, { ahead: Math.max(0, parseInt(t.value, 10) || 0), result: null }); };
ACT.wfsim = t => {
  const w = wfCur(), real = t.dataset.real === '1'; if (real && !need('workflows.manage')) return false;
  const subjId = ($('#wfSubj') || {}).value, ahead = Math.max(0, parseInt(($('#wfAhead') || {}).value, 10) || 0), s = wfSubjects(w).filter(x => x.id === subjId)[0];
  if (!s) { toast('Pick a record to test on.'); return false; }
  const r = wfRun(w, s.ctx, { dry: !real, ahead });
  if (real && r.pass) { wfLog(w, r.subj, r); audit(WHO.me(), 'Ran workflow manually', { t: 'workflow', id: w.id, l: w.n }, r.subj); }
  UI.wfSim = { w: w.id, subj: subjId, ahead, result: { r, real } };
};
ACT.scandays = t => { UI.scanDays = Math.max(0, parseInt(t.value, 10) || 0); };
GATE.runscan = 'workflows.manage';
ACT.runscan = () => { const ahead = UI.scanDays != null ? UI.scanDays : 4, ran = scan(ahead); UI.lastScan = { ahead, ran }; toast(ran.length ? ran.length + ' workflow run' + (ran.length > 1 ? 's' : '') + ' created follow-ups. Review emails in AI Agents.' : 'Scan finished: nothing new to do.'); };
