/* ==========================================================================
   90-main: Kestrel AI chat assistant, chart hover, and start-up.
   The assistant answers ONLY from a snapshot of your CRM data. With the Artifact runtime it calls Claude; without it,
   a small rule-based fallback answers from the same data and says so.
   ========================================================================== */
const chat = { open: false, msgs: [], busy: false };
const SUGG = ['Which deals are at risk this week?', 'What should I focus on today?', 'Where are competitors ahead of us?', 'Summarise Cobalt Logistics before my call', 'Which leads should I call first?', 'Draft a follow-up email to Priya at Harbor Bank'];
function fmtChat(t) {
  const s = esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return s.split('\n').map(l => /^\s*[-•*]\s+/.test(l) ? '&bull; ' + l.replace(/^\s*[-•*]\s+/, '') : l).join('<br>');
}
function paintChat() {
  const b = $('#cbody'); let h = '';
  if (!chat.msgs.length) h += '<div class="msg a">Hi ' + esc(me().n.split(' ')[0]) + '. I can see your deals, leads, accounts, agent proposals, workflows and forecast. Ask me anything, or pick one:</div><div class="sugs">' + SUGG.map(q => '<button class="sug" type="button" data-act="ask" data-q="' + esc(q) + '">' + ic('sparkle', 14) + esc(q) + '</button>').join('') + '</div>';
  chat.msgs.forEach(m => { h += '<div class="msg ' + (m.r === 'u' ? 'u' : 'a') + '">' + (m.text ? fmtChat(m.text) : '<span class="dots"><i></i><i></i><i></i></span>') + (m.tag ? '<span class="tag">' + esc(m.tag) + '</span>' : '') + '</div>'; });
  b.innerHTML = h; b.scrollTop = b.scrollHeight; $('#csend').disabled = chat.busy;
  $('#aiStatus').textContent = sampleFn ? 'Live AI, answers from your CRM data' : 'Demo mode, answers from your CRM data';
}
function snapshot() {
  const q = revenue('quarter'), t = x => x == null ? null : x;
  return JSON.stringify({
    today: '1 Nov 2026 (Sunday)', currency: 'INR lakh (L)', user: me().n + ' (' + myRole().n + ')',
    openDeals: openDeals().map(d => ({ account: dealAcc(d).n, stage: d.stage, valueL: d.v, probability: dprob(d), forecast: d.fc, owner: G.user(d.own).n, closeBy: fmtD(d.due), slips: d.slip, risks: dealRisks(d), competitors: d.comps, nextBestAction: (nextBest(d) || {}).text, next: d.next })),
    closedThisQuarter: dbx().deals.filter(d => !isOpen(d) && d.due >= -31).map(d => ({ account: dealAcc(d).n, result: d.stage, valueL: d.v, lostReason: d.lostReason || undefined })),
    customers: customers().map(a => ({ name: a.n, industry: a.ind, arrL: a.arr, health: LABEL[health(a)], renewsInDays: a.renew, owner: G.user(a.own).n })),
    leads: dbx().leads.map(l => ({ name: l.name, company: l.company, status: l.status, score: l.score, priority: l.priority, source: l.source, owner: G.user(l.own).n })),
    forecastQ4: { wonL: q.wonV, quotaL: q.quota, forecastL: Math.round(q.forecast), pipelineL: q.pipe, weightedL: Math.round(q.weighted), coverageX: q.coverage ? +q.coverage.toFixed(1) : null, winRatePct: Math.round(q.winRate * 100) },
    waitingForApproval: pendingActions().map(a => ({ agent: a.agentName, title: a.title, confidencePct: Math.round(a.conf * 100), external: a.external })),
    workflows: dbx().workflows.map(w => ({ name: w.n, active: w.active, runs: w.runs })),
    marketRadar: { gaps: industryTable().filter(r => r.gap).map(r => r.n), signals: RADAR_SIGNALS.slice(0, 5).map(s => s.d + ' ' + s.co + ': ' + s.txt) },
    openTasks: dbx().acts.filter(a => isTaskLike(a) && !taskDone(a)).slice(0, 12).map(a => a.subj + ' (' + relD(a.when) + ')')
  });
}
function localAnswer(q) {
  const s = q.toLowerCase(), risky = openDeals().filter(d => dealRisks(d).length);
  const dealByName = openDeals().filter(d => s.indexOf(dealAcc(d).n.toLowerCase().split(' ')[0]) >= 0)[0], accByName = dbx().accounts.filter(a => s.indexOf(a.n.toLowerCase().split(' ')[0]) >= 0)[0];
  if (/draft|email|write|pitch/.test(s)) return /aviation|pitch/.test(s) ? 'Draft (not sent):\n\nSubject: Cutting ground-crew scheduling time\n\nHi [name], airlines like yours juggle shifts across many stations. We help ground operations build rosters in minutes and sync them with payroll. Could we do a 15-minute walkthrough next week?' : 'Draft (not sent):\n\nSubject: Quote and SOC 2 report\n\nHi Priya, thanks for the time today. I will send the formal quote by Friday with our SOC 2 report and data residency details for Arjun. Happy to join the board discussion on the 12th if useful.';
  if (/lead|call first|qualif/.test(s)) { const l = dbx().leads.filter(x => x.status !== 'Converted' && x.status !== 'Disqualified').sort((a, b) => (b.score == null ? -1 : b.score) - (a.score == null ? -1 : a.score)).slice(0, 4); return 'Best leads to work now:\n' + l.map(x => '- **' + x.name + '** at ' + x.company + ' (' + (x.score == null ? 'not scored' : 'score ' + x.score) + ', ' + x.status + ')').join('\n') + '\nRun Lead Intelligence to score the unscored ones.'; }
  if (/approv|agent|waiting/.test(s)) return pendingActions().length + ' proposals are waiting for you. Examples:\n' + pendingActions().slice(0, 4).map(a => '- ' + a.title + ' (' + a.agentName + ', ' + Math.round(a.conf * 100) + '% confidence)').join('\n');
  if (/workflow|automation/.test(s)) return 'Workflows: ' + dbx().workflows.map(w => '**' + w.n + '** (' + (w.active ? 'active' : 'paused') + ', ' + w.runs + ' runs)').join(', ') + '. Open Workflow Studio to simulate any of them.';
  if (/plan to win|win /.test(s) && dealByName) { const n = nextBest(dealByName); return '**' + dealAcc(dealByName).n + '** (' + fmtL(dealByName.v) + ', ' + dealByName.stage + '):\n- Next: ' + n.text + '\n- Why: ' + n.why + (dealRisks(dealByName).length ? '\n- Risks: ' + dealRisks(dealByName).join('; ') : ''); }
  if (/summar|brief|before my call|account/.test(s) && accByName) return '**' + accByName.n + '**: ' + accByName.type + (accByName.type === 'Customer' ? ', ' + LABEL[health(accByName)] + ' health, ₹' + accByName.arr + 'L ARR, renews in ' + accByName.renew + ' days' : '') + '.\n' + accountInsights(accByName).slice(0, 3).map(i => '- ' + i.t).join('\n');
  if (/risk|slip|danger|worr/.test(s)) return 'Deals at risk:\n' + risky.slice(0, 5).map(d => '- **' + dealAcc(d).n + '** (' + fmtL(d.v) + ', ' + d.stage + '): ' + dealRisks(d)[0]).join('\n') + '\nBiggest exposure: Cobalt Logistics, ₹26L renewal in 47 days with Orange health.';
  if (/aviation|market|radar|gap|competitor|vantage|plumeria|orbit/.test(s)) return '**Aviation is your gap.** Competitors have signals there (Vantage HR: Skyway Airlines case study and Aerolink logo; Orbit People is hiring an aviation sales manager) and you have 0 customers.\n- Angle: ground-crew shift scheduling\n- 5 targets: ' + RADAR_TARGETS.map(t => t.n).join(', ') + '\n- Also watch BlueWave Shipping: Plumeria cut annual-plan prices by 12%.';
  if (/forecast|pipeline|quarter|revenue|quota|coverage/.test(s)) { const r = revenue('quarter'); return 'Q4: won **' + fmtL(r.wonV) + '** of ' + fmtL(r.quota) + ' quota, forecast **' + fmtL(r.forecast) + '** (' + Math.round(r.fAttain * 100) + '%). Open pipeline ' + fmtL(r.pipe) + ', coverage ' + (r.coverage ? r.coverage.toFixed(1) + 'x' : 'met') + ', win rate ' + Math.round(r.winRate * 100) + '%.'; }
  if (/focus|today|priority|next|do first/.test(s)) return 'Top of your list:\n' + dbx().acts.filter(a => isTaskLike(a) && !taskDone(a)).sort((a, b) => a.when - b.when).slice(0, 4).map((a, i) => (i + 1) + '. **' + a.subj + '** (' + relD(a.when) + ')').join('\n');
  return 'I can answer from your CRM data: deal risks, today’s priorities, leads, customer health, competitor moves, forecast, pending agent approvals and workflows. I can also draft emails. Try "Which deals are at risk?".';
}
function ask(q) {
  q = (q || '').trim(); if (!q || chat.busy) return;
  chat.open = true; $('#chat').classList.add('open'); chat.msgs.push({ r: 'u', text: q }); const m = { r: 'a', text: '' }; chat.msgs.push(m); chat.busy = true; paintChat();
  const hist = chat.msgs.slice(-9, -2).map(x => (x.r === 'u' ? 'User: ' : 'Assistant: ') + x.text).join('\n');
  const prompt = 'You are Kestrel, the AI sales copilot inside a CRM prototype. Answer ONLY from the CRM data below. If the data does not contain the answer, say so plainly. Be concise (under 130 words), plain text, short bullet lines starting with "- " are fine, use **bold** for names. Money is in INR lakh (L). Never invent customers, numbers or facts. You cannot take actions or send messages: when asked to write an email, write the draft and say it is a draft that has not been sent.\n\nCRM DATA:\n' + snapshot() + '\n\nCONVERSATION SO FAR:\n' + hist + '\n\nUSER QUESTION: ' + q;
  const fallback = note => { m.text = localAnswer(q); m.tag = note; chat.busy = false; paintChat(); };
  if (!sampleFn) return void setTimeout(() => fallback('Demo mode answer (live AI not connected)'), 500);
  sampleFn(prompt, { cache: false, modelTier: 'quick', onText: x => { m.text = x.text; paintChat(); } }).then(r => { m.text = r.text || m.text; m.tag = 'AI answer from your CRM data'; chat.busy = false; paintChat(); }).catch(() => fallback('Live AI unavailable, showing a demo answer'));
}
document.addEventListener('submit', e => { if (e.target.id === 'cform') { e.preventDefault(); const i = $('#cin'), v = i.value; i.value = ''; ask(v); } });
$('#chatX').addEventListener('click', () => { chat.open = false; $('#chat').classList.remove('open'); });
$('#chatX').innerHTML = ic('close', 18); $('#csend').innerHTML = ic('send', 18); $('#chat .mark').innerHTML = ic('sparkle', 16);

/* chart hover and transcript highlight */
document.addEventListener('mouseover', e => {
  const el = e.target.closest('.prop[data-line]');
  if (el) { const ln = $('.tline[data-line="' + el.dataset.line + '"]'); if (ln) { ln.classList.add('hl'); ln.scrollIntoView({ block: 'nearest' }); } }
  const col = e.target.closest('.dcol');
  if (col && DOT.length) {
    $$('.dcol.on').forEach(n => n.classList.remove('on')); col.classList.add('on');
    const d = DOT[+col.dataset.i], tip = $('#tip');
    tip.innerHTML = '<b>' + fmtD(d.lo) + (d.lo >= 0 ? ' to ' + fmtD(d.lo + 1) : '') + '</b><div><span class="muted">Won</span><span>' + (d.a ? fmtL(d.a) : '—') + '</span></div><div><span class="muted">AI projected</span><span>' + (d.p ? fmtL(d.p) : '—') + '</span></div>' + (d.w.length ? '<div class="muted sm">' + esc(d.w.join(', ')) + '</div>' : '') + (d.pr.length ? '<div class="muted sm">Expected: ' + esc(d.pr.slice(0, 3).join(', ')) + (d.pr.length > 3 ? '…' : '') + '</div>' : '');
    tip.style.display = 'block'; let left = col.offsetLeft + col.offsetWidth + 8; if (left + 180 > col.parentNode.clientWidth) left = col.offsetLeft - 190; tip.style.left = Math.max(0, left) + 'px';
  }
});
document.addEventListener('mouseout', e => {
  if (e.target.closest('.prop[data-line]')) $$('.tline.hl').forEach(n => n.classList.remove('hl'));
  const dc = e.target.closest('#dcols');
  if (dc && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('#dcols'))) { $$('.dcol.on').forEach(n => n.classList.remove('on')); const tip = $('#tip'); if (tip) tip.style.display = 'none'; }
});
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (VIEWS[h] && h !== UI.view) { UI.view = h; UI.drawer = null; render(); } });

/* start-up */
initDb(false);
dbx().agents.forEach(a => { a.running = false; });
const h0 = location.hash.slice(1); if (VIEWS[h0]) UI.view = h0;
render(); paintChat();
try { if (window.claude && window.claude.use) window.claude.use('sample').then(s => { sampleFn = s || null; paintChat(); if (UI.view === 'settings') rerender(); }).catch(() => { }); } catch (e) { }
