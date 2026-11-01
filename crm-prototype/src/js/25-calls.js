/* ==========================================================================
   25-calls: call list, Meeting Intelligence review (transcript + proposed updates) and transcript processing.
   ========================================================================== */
const allCalls = () => dbx().calls.slice().sort((a, b) => b.when - a.when || String(b.time).localeCompare(String(a.time)));
function callsList() {
  return allCalls().map(c => {
    const pend = pendingForCall(c.id).length, unproc = c.transcript.length && !c.processed;
    return '<button class="citem" type="button" data-act="selcall" data-id="' + c.id + '" aria-pressed="' + (UI.selCall === c.id) + '"><div class="row" style="justify-content:space-between"><b>' + esc((G.acc(c.acc) || {}).n || '') + '</b>' + (pend ? '<span class="hp orange">' + pend + ' to review</span>' : unproc ? '<span class="hp yellow">Not processed</span>' : '<span class="hp green">Updated</span>') + '</div><span class="muted sm">' + esc(c.who) + ' · ' + relD(c.when) + ' ' + c.time + ' · ' + c.min + ' min</span></button>';
  }).join('');
}
function proposalCard(p) {
  const c = G.call(p.callId);
  let b;
  if (p.editing) b = '<div class="row">' + (p.kind === 'email_draft' ? '<textarea class="edit-in" id="edit-' + p.id + '" rows="4" aria-label="Edit">' + esc(actionEditValue(p)) + '</textarea>' : '<input class="edit-in" id="edit-' + p.id + '" value="' + esc(actionEditValue(p)) + '" aria-label="Edit value">') + '<button class="btn xs pri" type="button" data-act="saveedit" data-id="' + p.id + '">Save and approve</button><button class="btn xs" type="button" data-act="canceledit" data-id="' + p.id + '">Cancel</button></div>';
  else if (p.status === 'pending') b = '<div class="row"><button class="btn xs pri" type="button" data-act="approve" data-id="' + p.id + '">Approve</button>' + (KINDS[p.kind].edit ? '<button class="btn xs" type="button" data-act="editaction" data-id="' + p.id + '">Edit</button>' : '') + '<button class="btn xs" type="button" data-act="reject" data-id="' + p.id + '">Reject</button></div>';
  else b = '<div class="row"><span class="muted sm">' + (p.status === 'applied' ? 'Applied to the CRM' : p.status === 'rejected' ? 'Rejected' : 'Reversed') + '</span>' + (canUndo(p) ? '<button class="btn xs" type="button" data-act="undo" data-id="' + p.id + '">' + ic('undo', 12) + 'Undo</button>' : '') + '</div>';
  return '<div class="prop ' + (p.status === 'applied' ? 'accepted' : p.status === 'pending' ? '' : 'rejected') + '" data-line="' + p.line + '"><div class="ptop"><span class="field">' + esc(p.field) + '</span><span class="row">' + confChip(p.conf) + '<span class="chip src">line ' + p.line + '</span></span></div><div class="change"><span class="from">' + esc(p.from || 'None') + '</span><span class="arrow">→</span><span>' + esc(String(p.to)) + '</span></div><div class="evid">' + esc(p.ev[0] ? p.ev[0].t : '') + '</div>' + b + '</div>';
}
VIEWS.calls = () => {
  const c = G.call(UI.selCall) || allCalls()[0]; UI.selCall = c.id; const props = callActions(c.id), pend = props.filter(p => p.status === 'pending').length, a = G.acc(c.acc);
  let body;
  if (c.transcript.length) {
    const lines = c.transcript.map((l, i) => '<div class="tline" data-line="' + (i + 1) + '"><span class="n">' + (i + 1) + '</span><div><b>' + esc(l.who) + ':</b> ' + esc(l.t) + '</div></div>').join('');
    body = '<section class="card"><div class="ch"><div><h2>' + esc(a.n) + ' · ' + esc(c.who) + '</h2><span class="muted sm">' + relD(c.when) + ' ' + c.time + ', ' + c.min + ' min. Hover a proposal to see its source line.</span></div>' + (c.processed || props.length ? '<button class="btn pri" type="button" data-act="approveall" data-id="' + c.id + '"' + (pend ? '' : ' disabled') + '>Approve all ' + pend + '</button>' : '<button class="btn pri" type="button" data-act="processcall" data-id="' + c.id + '">' + ic('sparkle', 14) + 'Run Meeting Intelligence</button>') + '</div>' + (c.summary || c.sum ? '<p class="sm" style="margin-bottom:12px">' + esc(c.sum) + '</p>' : '') +
      (props.length ? '<div class="cgrid"><div class="transcript">' + lines + '</div><div class="props">' + props.map(proposalCard).join('') + '</div></div>' : '<div class="transcript">' + lines + '</div>' + (c.processed ? empty('check', 'No updates proposed', 'The agent found nothing to change from this transcript.') : '<p class="muted sm" style="margin-top:10px">This meeting has not been processed. Meeting Intelligence will read it and propose CRM updates for you to approve.</p>')) + '<p class="muted sm" style="margin-top:12px">Prototype note: the Harbor Bank and Cirrus Air extractions are scripted. Pasted transcripts use live Claude when available, otherwise a keyword fallback. Either way nothing is written without your approval.</p></section>';
  } else body = '<section class="card"><div class="ch"><div><h2>' + esc(a.n) + ' · ' + esc(c.who) + '</h2><span class="muted sm">' + relD(c.when) + ' ' + c.time + ', ' + c.min + ' min</span></div><span class="chip">' + c.tone + ' tone</span></div><h3>AI summary</h3><p style="margin:6px 0 14px">' + esc(c.sum) + '</p><h3>Updates applied after approval</h3><ul class="ul">' + c.items.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul><div class="row mt"><button class="btn" type="button" data-act="ask" data-q="Draft a follow-up email to ' + esc(c.who) + ' at ' + esc(a.n) + ' after our call">' + ic('sparkle', 14) + 'Draft follow-up email</button>' + lnk('deal', c.deal, 'Open opportunity') + '</div></section>';
  const form = '<section class="card"><div class="ch"><div><h2>Process a new transcript</h2><span class="muted sm">Paste a transcript, one line per turn, such as "Priya: We have a budget of 20 lakh."</span></div></div><div class="form2">' + field('Opportunity', sel('', dbx().deals.filter(isOpen).map(d => [d.id, dealAcc(d).n + ' (' + d.stage + ')']), UI.txDeal || 'd-sunrise', 'id="txDeal" data-onchange="txdeal"')) + '</div>' + field('Transcript', '<textarea id="txText" rows="5" placeholder="Priya: We have about 9 lakh set aside.&#10;Priya: We also looked at Plumeria.&#10;Priya: Please send the quote by Friday.">' + esc(UI.txText || '') + '</textarea>') + '<div class="row"><button class="btn pri" type="button" data-act="txprocess"' + (UI.callBusy ? ' disabled' : '') + '>' + ic('sparkle', 14) + (UI.callBusy ? 'Reading transcript…' : 'Extract updates') + '</button><button class="btn" type="button" data-act="txsample">Use a sample</button></div></section>';
  return phead('Calls and meetings', 'Every conversation becomes a summary and a set of proposed CRM updates with the exact quote behind each one. You approve, edit or reject.') + '<div class="calls"><div class="stack"><div class="clist">' + callsList() + '</div></div><div class="stack">' + body + form + '</div></div>';
};
ACT.selcall = t => { UI.selCall = t.dataset.id; };
ACT.txdeal = t => { UI.txDeal = t.value; };
ACT.txsample = () => { UI.txText = 'Pooja: We have about 9 lakh set aside this year.\nPooja: We also looked at Plumeria last month.\nPooja: Our CFO, Amit Patel, signs off on spend.\nPooja: Please send the quote by Friday and we will decide quickly.'; UI.txDeal = 'd-sunrise'; };
GATE.processcall = 'agents.approve';
ACT.processcall = t => { const out = processCall(t.dataset.id); toast('Meeting Intelligence proposed ' + out.length + ' update' + (out.length === 1 ? '' : 's') + '. Nothing changes until you approve.'); };
GATE.txprocess = 'agents.approve';
ACT.txprocess = () => {
  const text = ($('#txText') || {}).value || UI.txText || '', dealId = ($('#txDeal') || {}).value || UI.txDeal || 'd-sunrise'; UI.txText = text; UI.txDeal = dealId;
  const tr = text.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const m = l.match(/^([A-Za-z][A-Za-z .]{0,24}):\s*(.+)$/); return m ? { who: m[1], t: m[2] } : { who: 'Speaker', t: l }; });
  if (tr.length < 2) { toast('Paste at least two lines of transcript.'); return false; }
  const d = G.deal(dealId), c = createCall({ acc: d.acc, deal: d.id, con: (primaryContact(d) || {}).id, who: tr[0].who, transcript: tr, subj: 'pasted transcript', time: '15:30', min: tr.length * 2, sum: 'Transcript pasted by ' + me().n + '.' });
  UI.selCall = c.id; UI.callBusy = true; rerender();
  const finish = (script, live) => { UI.callBusy = false; const out = processCall(c.id, script); toast((live ? 'Claude' : 'Keyword fallback') + ' proposed ' + out.length + ' update' + (out.length === 1 ? '' : 's') + ' from ' + tr.length + ' lines. Review and approve.'); render(); };
  if (!sampleFn) { setTimeout(() => finish(extractHeuristic(c), false), 600); return false; }
  const prompt = 'Extract CRM updates from this sales meeting transcript. Return ONLY a JSON array, no prose. Each item: {"type":"stage"|"amount"|"competitor"|"contact"|"next_step","value":string or number,"title":string (contacts only),"role":string (contacts only),"line":number (1-based transcript line),"conf":number 0-1}. Allowed stages: ' + stageNames().concat(['Won']).join(', ') + '. Amount is in INR lakh as a number. Allowed contact roles: ' + CONTACT_ROLES.join(', ') + '. Only include facts stated in the transcript.\n\nTranscript:\n' + tr.map((l, i) => (i + 1) + '. ' + l.who + ': ' + l.t).join('\n');
  sampleFn(prompt, { cache: false, modelTier: 'quick' }).then(r => {
    const m = r.text.match(/\[[\s\S]*\]/); const arr = JSON.parse(m ? m[0] : r.text), script = [];
    arr.forEach(x => { const line = Math.min(Math.max(parseInt(x.line, 10) || 1, 1), tr.length), conf = Math.min(1, Math.max(0.3, Number(x.conf) || 0.7));
      if (x.type === 'stage' && allStages().indexOf(x.value) >= 0 && x.value !== d.stage) script.push({ kind: 'deal_stage', field: 'Deal stage', from: d.stage, to: x.value, line, conf, p: { deal: d.id, to: x.value } });
      else if (x.type === 'amount' && Number(x.value) > 0) script.push({ kind: 'deal_field', field: 'Deal value', from: money(d.v), to: money(Number(x.value)), line, conf, p: { deal: d.id, field: 'v', to: Number(x.value) } });
      else if (x.type === 'competitor' && x.value && d.comps.indexOf(x.value) < 0) script.push({ kind: 'deal_competitor', field: 'Competitor', from: 'None', to: String(x.value), line, conf, p: { deal: d.id, to: String(x.value) } });
      else if (x.type === 'contact' && x.value) script.push({ kind: 'contact_add', field: 'New contact', from: 'None', to: x.value + (x.title ? ' (' + x.title + ')' : ''), line, conf, p: { acc: d.acc, deal: d.id, name: String(x.value), title: x.title || '', role: CONTACT_ROLES.indexOf(x.role) >= 0 ? x.role : 'Influencer' } });
      else if (x.type === 'next_step' && x.value) script.push({ kind: 'deal_field', field: 'Next step', from: d.next || 'None', to: String(x.value), line, conf, p: { deal: d.id, field: 'next', to: String(x.value) } }); });
    finish(script, true);
  }).catch(() => finish(extractHeuristic(c), false));
  return false;
};
