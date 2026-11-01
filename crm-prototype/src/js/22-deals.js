/* ==========================================================================
   22-deals: opportunity board and list, opportunity drawer, loss-reason capture, win flow.
   ========================================================================== */
function filteredDeals() {
  const f = UI.f.deals, key = sortKey('deals');
  const list = dbx().deals.filter(d => {
    const a = dealAcc(d);
    if (UI.mine && d.own !== dbx().me) return false;
    if (f.stage && d.stage !== f.stage) return false; if (f.open && !isOpen(d)) return false; if (f.own && d.own !== f.own) return false;
    if (f.result === 'won' && d.stage !== 'Won') return false; if (f.result === 'lost' && d.stage !== 'Lost') return false; if (f.result === 'closed' && isOpen(d)) return false;
    if (f.fc === 'forecast' && !(isOpen(d) && (d.fc === 'Commit' || d.fc === 'Best Case'))) return false; if (f.fc && f.fc !== 'forecast' && d.fc !== f.fc) return false;
    if (f.comp && d.comps.indexOf(f.comp) < 0) return false; if (f.risk && !dealRisks(d).length) return false; if (f.ids && f.ids.indexOf(d.id) < 0) return false;
    return matchQ(a.n + ' ' + d.desc + ' ' + (primaryContact(d) || {}).name + ' ' + d.comps.join(' ') + ' ' + a.loc);
  });
  return list.sort((a, b) => key === 'due' ? a.due - b.due : b.v - a.v);
}
function filterBar(k, f, labels) {
  const act = Object.keys(f).filter(x => f[x] && f[x] !== true || f[x] === true);
  if (!act.length) return '';
  return '<div class="row fbar">' + act.map(x => '<span class="chip src">' + esc(labels(x, f[x])) + '</span>').join('') + '<button class="btn xs" type="button" data-act="clearfilter" data-k="' + k + '">Clear filters</button></div>';
}
const dealLabels = (k, v) => ({ stage: 'Stage: ' + v, open: 'Open deals', own: 'Owner: ' + (G.user(v) || {}).n, result: v === 'won' ? 'Won deals' : v === 'lost' ? 'Lost deals' : 'Closed deals', fc: v === 'forecast' ? 'In forecast (Commit and Best Case)' : 'Forecast: ' + v, comp: 'Competitor: ' + v, risk: 'Needs attention', ids: 'Selected deals' })[k] || k;
function dealCard(d) {
  const a = dealAcc(d), sel = d.id === UI.selDeal, pc = primaryContact(d), r = dealRisks(d);
  const det = sel ? '<div class="kdet">' + (pc ? '<div>' + ic('user', 14) + '<span>' + esc(pc.name) + ' (' + esc(pc.role) + ')</span></div><div>' + ic('mail', 14) + '<span>' + esc(pc.email) + '</span></div>' : '') + '<div>' + ic('pin', 14) + '<span>' + esc(a.loc) + '</span></div>' + (d.budget ? '<div>' + ic('deals', 14) + '<span>Budget ' + esc(d.budget) + '</span></div>' : '') + (d.next ? '<div>' + ic('check', 14) + '<span>Next: ' + esc(d.next) + '</span></div>' : '') + (d.comps.length ? '<div>' + ic('warn', 14) + '<span>Competitor: ' + esc(d.comps.join(', ')) + '</span></div>' : '') + '<div class="row">' + av(d.own, 's') + '<span>' + esc(G.user(d.own).n) + '</span></div><div class="row"><button class="btn xs" type="button" data-act="open" data-t="deal" data-id="' + d.id + '">Open details</button></div></div>' : '';
  return '<div class="kcard' + (sel ? ' sel' : '') + (UI.flash === d.id ? ' flash' : '') + '" draggable="true" tabindex="0" role="button" data-act="seldeal" data-id="' + d.id + '" aria-label="' + esc(a.n) + ', ' + fmtL(d.v) + ', ' + d.stage + '"><div class="kt1"><span>' + esc(a.n) + '</span><span class="num">' + fmtL(d.v) + '</span></div><div class="kd">' + esc(d.desc) + '</div>' + det + (r.length && !sel ? '<div class="risk">' + ic('warn', 14) + esc(r[0]) + '</div>' : '') +
    '<div class="kfoot"><span class="chip">' + ic('cal', 14) + fmtD(d.due) + (d.slip ? ' ↻' + d.slip : '') + '</span>' + (isOpen(d) ? '<span class="chip">' + dprob(d) + '%</span>' : '') + (d.fc && isOpen(d) ? '<span class="chip fc-' + d.fc.replace(' ', '') + '">' + d.fc + '</span>' : '') + '</div></div>';
}
function dealBoard(list) {
  const f = UI.f.deals, cols = allStages().filter(s => !(f.open && (s === 'Won' || s === 'Lost')) && !(f.stage && f.stage !== s));
  return '<div class="board" style="grid-template-columns:repeat(' + cols.length + ',minmax(200px,1fr))">' + cols.map(s => {
    const ds = list.filter(d => d.stage === s), tot = sum(ds, d => d.v);
    return '<div class="kcol" data-stage="' + esc(s) + '"><div class="kh"><span>' + esc(s) + '</span><span class="cnt num">' + ds.length + '</span></div><div class="muted sm" style="margin-top:-6px">' + fmtL(tot) + (isOpen({ stage: s }) ? ' · ' + stageProb(s) + '%' : '') + '</div><div class="kbody">' + (ds.map(dealCard).join('') || '<div class="kempty muted sm">Drop a deal here</div>') + '</div></div>';
  }).join('') + '</div>';
}
function dealList(list) {
  const rows = list.map(d => {
    const a = dealAcc(d), n = nextBest(d), open = isOpen(d), r = dealRisks(d);
    return '<tr class="rowbtn" role="button" tabindex="0" data-act="open" data-t="deal" data-id="' + d.id + '"><td><b>' + esc(a.n) + '</b><div class="muted sm">' + esc(d.desc) + '</div></td><td>' + (open ? bsel('deal:' + d.id + ':stage', allStages(), d.stage) : stageChip(d.stage)) + '</td><td class="num"><b>' + fmtL(d.v) + '</b></td><td class="num">' + (open ? dprob(d) + '%' : '—') + '</td><td class="num">' + (open ? fmtL(wval(d)) : '—') + '</td><td>' + (open ? bsel('deal:' + d.id + ':fc', FORECAST_CATS, d.fc || 'Pipeline') : '<span class="muted">—</span>') + '</td><td class="num">' + fmtD(d.due) + (d.slip ? ' <span class="late" title="Close date slipped">↻' + d.slip + '</span>' : '') + '</td><td>' + av(d.own, 's') + '</td><td class="sm">' + (open && n ? esc(n.text.split('.')[0]) : d.stage === 'Lost' ? '<span class="muted">' + esc(d.lostReason) + (d.lostTo ? ' (' + esc(d.lostTo) + ')' : '') + '</span>' : '') + '</td><td>' + (r.length ? '<span class="risk">' + ic('warn', 13) + esc(r[0]) + (r.length > 1 ? ' +' + (r.length - 1) : '') + '</span>' : '') + '</td></tr>';
  }).join('');
  return '<div class="card"><div class="twrap"><table style="min-width:1100px"><thead><tr><th>Opportunity</th><th>Stage</th><th>Amount</th><th>Prob.</th><th>Weighted</th><th>Forecast</th><th>Close date</th><th>Owner</th><th>Next best action</th><th>Risk</th></tr></thead><tbody>' + (rows || '<tr><td colspan="10">' + empty('deals', 'No deals match', 'Clear a filter or create an opportunity.', '<button class="btn pri" type="button" data-act="create" data-id="deal">New opportunity</button>') + '</td></tr>') + '</tbody></table></div></div>';
}
VIEWS.deals = () => {
  const list = filteredDeals(), f = UI.f.deals, view = tabOf('dealview', UI.dealView), op = list.filter(isOpen);
  const sm = [['Open pipeline', fmtL(sum(op, d => d.v)), op.length + ' deals'], ['Weighted', fmtL(sum(op, wval)), 'amount × probability'], ['Commit', fmtL(sum(op.filter(d => d.fc === 'Commit'), d => d.v)), op.filter(d => d.fc === 'Commit').length + ' deals'], ['Best case', fmtL(sum(op.filter(d => d.fc === 'Best Case'), d => d.v)), op.filter(d => d.fc === 'Best Case').length + ' deals']];
  return phead('Deals', 'Drag a card to change its stage, or switch to the list to edit stage and forecast category inline. Open a deal for the full opportunity view.', '<div class="row">' + tabs('dealview', [['board', 'Board'], ['list', 'List']], view) + '<button class="btn" type="button" data-act="go" data-id="calls">' + pendingForCall('c1').length + ' updates waiting from calls</button><button class="btn pri" type="button" data-act="create" data-id="deal">' + ic('plus', 14) + 'New opportunity</button></div>') +
    '<div class="sumstrip">' + sm.map(s => '<div><span class="muted sm">' + s[0] + '</span><b class="num">' + s[1] + '</b><span class="muted sm">' + s[2] + '</span></div>').join('') + '</div>' + filterBar('deals', f, dealLabels) + (view === 'board' ? dealBoard(list) : dealList(list));
};
ACT.seldeal = t => { UI.selDeal = UI.selDeal === t.dataset.id ? null : t.dataset.id; };
GATE.stageto = 'deals.edit';
ACT.stageto = t => { const id = t.dataset.id, s = t.dataset.s; if (s === 'Lost') { openModal('lose', { id }); return false; } if (s === 'Won') { openModal('win', { id }); return false; } if (moveDeal(id, s)) toast(dealAcc(G.deal(id)).n + ' moved to ' + s); };
GATE.reopen = 'deals.edit'; ACT.reopen = t => { moveDeal(t.dataset.id, stageNames()[0]); toast('Opportunity reopened in ' + stageNames()[0]); };
GATE.winmodal = 'deals.edit'; ACT.winmodal = t => { openModal('win', { id: t.dataset.id }); return false; };
GATE.losemodal = 'deals.edit'; ACT.losemodal = t => { openModal('lose', { id: t.dataset.id }); return false; };
GATE.rmprod = 'deals.edit'; ACT.rmprod = t => { const d = G.deal(t.dataset.id); d.prods = d.prods.filter(x => x !== t.dataset.p); };
GATE.rmcomp = 'deals.edit'; ACT.rmcomp = t => { const d = G.deal(t.dataset.id); d.comps = d.comps.filter(x => x !== t.dataset.p); };
GATE.addprod = 'deals.edit'; ACT.addprod = t => { const d = G.deal(t.dataset.id); if (t.value && d.prods.indexOf(t.value) < 0) d.prods.push(t.value); };
GATE.addcomp = 'deals.edit'; ACT.addcomp = t => { const d = G.deal(t.dataset.id); if (t.value && d.comps.indexOf(t.value) < 0) d.comps.push(t.value); };
GATE.dealtask = 'deals.edit'; ACT.dealtask = t => { const d = G.deal(t.dataset.id), n = nextBest(d); addActivity({ type: 'task', subj: n.text.split('.')[0] + ' (' + dealAcc(d).n + ')', when: 1, own: d.own, link: { acc: d.acc, deal: d.id }, notes: n.why, ai: true }); audit(WHO.me(), 'Created task', entOf('deal', Object.assign({}, d, { n: dealAcc(d).n })), n.text); toast('Task created for tomorrow'); };
GATE.cmtremove = 'deals.edit'; ACT.cmtremove = t => { const d = G.deal(t.dataset.id); d.committee = d.committee.filter(x => x !== t.dataset.c); };
GATE.cmtadd = 'deals.edit'; ACT.cmtadd = t => { const d = G.deal(t.dataset.id); if (t.value && d.committee.indexOf(t.value) < 0) d.committee.push(t.value); };

DRAWERS.deal = id => {
  const d = G.deal(id); if (!d) return null; const a = dealAcc(d), tab = UI.drawer.tab || 'overview', open = isOpen(d), r = dealRisks(d), n = nextBest(d);
  const steps = '<div class="steps" role="group" aria-label="Pipeline stage">' + stageNames().map(s => '<button type="button" class="step' + (d.stage === s ? ' cur' : stageNames().indexOf(s) < stageNames().indexOf(d.stage) && open ? ' done' : '') + '" data-act="stageto" data-id="' + d.id + '" data-s="' + esc(s) + '"' + (!open ? ' disabled' : '') + '>' + esc(s) + '</button>').join('') + '</div>';
  let body = '';
  if (tab === 'overview') {
    const P = x => 'deal:' + d.id + ':' + x;
    body = (r.length ? '<div class="banner warn">' + ic('warn', 16) + '<div><b>Needs attention</b>' + r.map(x => '<div class="sm">' + esc(x) + '</div>').join('') + '</div></div>' : '') +
      (d.slip ? '<div class="banner">' + ic('clock', 16) + ' Close date slipped <b>' + d.slip + (d.slip > 1 ? ' times' : ' time') + '</b>. Originally ' + fmtD(d.origDue) + ', now ' + fmtD(d.due) + '. Deals that slip twice close less often.</div>' : '') +
      (d.stage === 'Lost' ? '<div class="banner warn"><div><b>Lost: ' + esc(d.lostReason) + '</b>' + (d.lostTo ? '<div class="sm">To ' + esc(d.lostTo) + '</div>' : '') + (d.lostNote ? '<div class="sm">' + esc(d.lostNote) + '</div>' : '') + '</div></div>' : '') +
      (n ? '<div class="nba"><span class="chip src">' + ic('sparkle', 12) + 'Next best action</span><b>' + esc(n.text) + '</b><div class="muted sm">Why: ' + esc(n.why) + '</div><div class="row mt"><button class="btn xs" type="button" data-act="dealtask" data-id="' + d.id + '">' + ic('tasks', 12) + 'Create task</button><button class="btn xs" type="button" data-act="ask" data-q="Give me a plan to win ' + esc(a.n) + '">' + ic('sparkle', 12) + 'Ask Kestrel AI</button></div></div>' : '') +
      '<div class="form2">' + field('Amount (₹ lakh)', binp(P('v'), d.v, 'number', 'min="1" step="0.5"')) + field('Expected close date', binp(P('due'), isoOf(d.due), 'date')) + field('Probability %', binp(P('prob'), d.prob == null ? '' : d.prob, 'number', 'min="0" max="100" placeholder="Stage default ' + stageProb(d.stage) + '"'), 'Weighted value: ' + fmtL(wval(d))) + field('Forecast category', bsel(P('fc'), FORECAST_CATS, d.fc || 'Pipeline')) + field('Type', bsel(P('type'), ['New business', 'Expansion', 'Renewal'], d.type)) + field('Owner', bsel(P('own'), ownerOpts(), d.own)) + field('Decision date', binp(P('decide'), d.decide == null ? '' : isoOf(d.decide), 'date'), 'Decision timeline') + field('Budget', binp(P('budget'), d.budget)) + field('Next step', binp(P('next'), d.next)) + field('Description', binp(P('desc'), d.desc)) + dbx().customFields.filter(c => c.ent === 'deal').map(c => field(esc(c.n), binp(P('custom.' + c.id), d.custom[c.id]))).join('') + '</div>' +
      '<h3>Products</h3><div class="chips">' + d.prods.map(p => '<span class="chip">' + esc(G.prod(p).n) + ' <button class="x" type="button" data-act="rmprod" data-id="' + d.id + '" data-p="' + p + '" aria-label="Remove ' + esc(G.prod(p).n) + '">' + ic('close', 11) + '</button></span>').join('') + '<select data-onchange="addprod" data-id="' + d.id + '" aria-label="Add product"><option value="">+ Add product</option>' + dbx().products.filter(p => d.prods.indexOf(p.id) < 0).map(p => '<option value="' + p.id + '">' + esc(p.n) + ' (₹' + p.price + 'L/yr)</option>').join('') + '</select></div>' +
      '<h3>Competitors</h3><div class="chips">' + d.comps.map(p => '<span class="chip warnchip">' + esc(p) + ' <button class="x" type="button" data-act="rmcomp" data-id="' + d.id + '" data-p="' + esc(p) + '" aria-label="Remove ' + esc(p) + '">' + ic('close', 11) + '</button></span>').join('') + '<select data-onchange="addcomp" data-id="' + d.id + '" aria-label="Add competitor"><option value="">+ Add competitor</option>' + COMPETITORS.filter(p => d.comps.indexOf(p) < 0).map(p => '<option>' + p + '</option>').join('') + '</select></div>';
  }
  if (tab === 'committee') {
    const cs = committee(d), miss = ['Economic buyer', 'Decision maker', 'Champion', 'Technical evaluator'].filter(x => !cs.some(c => c.role === x)), others = dbx().contacts.filter(c => c.acc === d.acc && d.committee.indexOf(c.id) < 0);
    body = (miss.length ? '<div class="banner warn">' + ic('warn', 16) + ' <span>Missing from the buying committee: <b>' + miss.join(', ') + '</b>. ' + (miss.indexOf('Economic buyer') >= 0 ? 'Ask your champion for an introduction.' : '') + '</span></div>' : '<div class="banner ok">' + ic('check', 16) + ' All four key roles are covered.</div>') +
      '<div class="twrap"><table style="min-width:520px"><thead><tr><th>Contact</th><th>Role</th><th>Sentiment</th><th>Last touch</th><th></th></tr></thead><tbody>' + cs.map(c => '<tr><td><div class="who">' + avN(c.name, hashStr(c.name)) + '<div><b>' + esc(c.name) + '</b><span>' + esc(c.title) + '</span></div></div></td><td>' + bsel('con:' + c.id + ':role', CONTACT_ROLES, c.role) + '</td><td>' + chip(c.sent, 'sent-' + c.sent) + '</td><td class="muted sm">' + (c.last === 0 ? 'Today' : Math.abs(c.last) + 'd ago') + '</td><td><button class="btn xs" type="button" data-act="cmtremove" data-id="' + d.id + '" data-c="' + c.id + '" aria-label="Remove from committee">' + ic('close', 12) + '</button></td></tr>').join('') + '</tbody></table></div><div class="row mt"><select data-onchange="cmtadd" data-id="' + d.id + '" aria-label="Add existing contact"><option value="">+ Add existing contact</option>' + others.map(c => '<option value="' + c.id + '">' + esc(c.name) + ' (' + esc(c.role) + ')</option>').join('') + '</select><button class="btn xs" type="button" data-act="newcontact" data-acc="' + d.acc + '" data-deal="' + d.id + '">' + ic('plus', 12) + 'New contact</button></div>';
  }
  if (tab === 'timeline') {
    const ev = dbx().acts.filter(x => x.link.deal === d.id).sort((p, q) => q.when - p.when || String(q.time).localeCompare(String(p.time)));
    body = '<div class="row"><button class="btn xs pri" type="button" data-act="logact" data-deal="' + d.id + '" data-acc="' + d.acc + '">' + ic('plus', 12) + 'Log activity</button></div>' + (ev.length ? '<div class="tl">' + ev.map(tlItem).join('') + '</div>' : empty('activity', 'No interactions yet', 'Log a call, meeting or email for this opportunity.'));
  }
  return {
    title: a.n, wide: true, head: '<div class="who"><div><h2>' + esc(a.n) + '</h2><span class="muted sm">' + esc(d.desc) + '</span></div></div><div class="row mt"><b class="big num">' + fmtL(d.v) + '</b>' + stageChip(d.stage) + (open ? chip(dprob(d) + '% · weighted ' + fmtL(wval(d))) : '') + (d.fc && open ? '<span class="chip fc-' + d.fc.replace(' ', '') + '">' + d.fc + '</span>' : '') + lnk('account', a.id, 'Account 360') + '</div>' + (open ? steps : ''),
    tabs: tabs('drawertab', [['overview', 'Overview'], ['committee', 'Buying committee', committee(d).length], ['timeline', 'Timeline']], tab), body,
    foot: open ? '<button class="btn" type="button" data-act="losemodal" data-id="' + d.id + '">Mark lost</button><button class="btn pri" type="button" data-act="winmodal" data-id="' + d.id + '">' + ic('check', 14) + 'Mark won</button>' : '<button class="btn" type="button" data-act="reopen" data-id="' + d.id + '">Reopen opportunity</button>'
  };
};
GATE.newcontact = 'accounts.edit'; ACT.newcontact = t => { openModal('contact', { acc: t.dataset.acc, deal: t.dataset.deal }); return false; };

/* drag and drop between stages */
let dragId = null;
document.addEventListener('dragstart', e => { const c = e.target.closest && e.target.closest('.kcard'); if (!c) return; dragId = c.dataset.id; try { e.dataTransfer.setData('text/plain', dragId); e.dataTransfer.effectAllowed = 'move'; } catch (x) { } });
document.addEventListener('dragover', e => { const col = e.target.closest && e.target.closest('.kcol'); if (!col || !dragId) return; e.preventDefault(); $$('.kcol.over').forEach(n => { if (n !== col) n.classList.remove('over'); }); col.classList.add('over'); });
document.addEventListener('drop', e => {
  const col = e.target.closest && e.target.closest('.kcol'); if (!col || !dragId) return; e.preventDefault();
  const id = dragId; dragId = null; $$('.kcol.over').forEach(n => n.classList.remove('over'));
  const d = G.deal(id), s = col.dataset.stage; if (!d || d.stage === s) return;
  if (!can('deals.edit')) { toast(myRole().n + ' role cannot move deals.'); return; }
  if (s === 'Lost') return openModal('lose', { id }); if (s === 'Won') return openModal('win', { id });
  moveDeal(id, s); UI.flash = id; UI.selDeal = id; toast(dealAcc(d).n + ' moved to ' + s); rerender(); UI.flash = '';
});
document.addEventListener('dragend', () => { dragId = null; $$('.kcol.over').forEach(n => n.classList.remove('over')); });

/* ---------- modals ---------- */
MODALS.deal = c => ({ title: 'New opportunity', submit: 'Create opportunity', body: '<div class="form2">' + field('Account', sel('acc', dbx().accounts.map(a => [a.id, a.n]), c.acc || 'harbor'), 'Create the account first if it does not exist') + field('Description', '<input name="desc" required placeholder="What are they buying?">') + field('Amount (₹ lakh)', '<input name="v" type="number" min="1" value="10">') + field('Stage', sel('stage', stageNames(), stageNames()[0])) + field('Expected close', sel('days', [['30', 'In 30 days'], ['45', 'In 45 days'], ['60', 'In 60 days'], ['90', 'In 90 days']], '45')) + field('Forecast category', sel('fc', FORECAST_CATS, 'Pipeline')) + field('Type', sel('type', ['New business', 'Expansion', 'Renewal'], 'New business')) + field('Owner', sel('own', ownerOpts(), dbx().me)) + '</div><div class="fld"><span>Products</span><div class="chk">' + dbx().products.map(p => '<label><input type="checkbox" name="prods" value="' + p.id + '"> ' + esc(p.n) + '</label>').join('') + '</div></div>' });
GATE.deal = 'deals.edit';
FORM.deal = f => { const d = createDeal({ acc: f.acc, desc: f.desc, v: parseFloat(f.v) || 1, stage: f.stage, due: parseInt(f.days, 10), fc: f.fc, type: f.type, own: f.own, prods: [].concat(f.prods || []), committee: dbx().contacts.filter(c => c.acc === f.acc && c.role !== 'User').map(c => c.id) }); UI.selDeal = d.id; UI.flash = d.id; toast('Opportunity created for ' + dealAcc(d).n); };
MODALS.lose = c => { const d = G.deal(c.id); return { title: 'Why was this deal lost?', sub: dealAcc(d).n + ', ' + fmtL(d.v) + '. A reason is required so the team can learn from it.', submit: 'Mark as lost', body: '<input type="hidden" name="id" value="' + d.id + '">' + field('Primary reason *', sel('reason', LOSS_REASONS, d.comps.length ? 'Lost to competitor' : 'Price too high')) + field('Lost to (if a competitor)', sel('to', [['', 'Not applicable']].concat(COMPETITORS).concat([['Other', 'Other competitor']]), d.comps[0] || '')) + field('What happened?', '<textarea name="note" rows="3" placeholder="e.g. Matched our price and offered a free pilot"></textarea>') }; };
GATE.lose = 'deals.edit'; FORM.lose = f => { if (!f.reason) { toast('Choose a reason.'); return false; } moveDeal(f.id, 'Lost', { reason: f.reason, to: f.to, note: f.note }); toast('Marked lost: ' + f.reason); };
MODALS.win = c => { const d = G.deal(c.id), a = dealAcc(d); return { title: 'Mark as won', sub: a.n + (a.type === 'Customer' ? ' is already a customer.' : ' will become a customer, with its ARR and renewal date set.'), submit: 'Mark as won', body: '<input type="hidden" name="id" value="' + d.id + '">' + field('Final amount (₹ lakh)', '<input name="amount" type="number" min="1" step="0.5" value="' + d.v + '">') }; };
GATE.win = 'deals.edit';
FORM.win = f => { const d = G.deal(f.id); moveDeal(f.id, 'Won', { amount: parseFloat(f.amount) || d.v }); const out = runAgent('cs', { onlyAcc: d.acc }); toast(dealAcc(d).n + ' won! Now a customer.' + (out.length ? ' Customer Success proposed ' + out.length + ' onboarding action' + (out.length > 1 ? 's' : '') + '.' : '')); };
