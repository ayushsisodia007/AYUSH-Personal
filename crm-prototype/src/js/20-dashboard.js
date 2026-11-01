/* ==========================================================================
   20-dashboard: four sections. A Revenue performance, B Sales execution, C Customer intelligence, D AI intelligence.
   Every KPI is a button that opens the relevant filtered view.
   ========================================================================== */
const period = () => tabOf('period', 'quarter');
let DOT = [];
function gaugeSvg(pct) {
  let s = ''; const n = 40;
  for (let i = 0; i <= n; i++) { const th = Math.PI - (i / n) * Math.PI, c = Math.cos(th), sn = Math.sin(th); s += '<line x1="' + (115 + 100 * c).toFixed(1) + '" y1="' + (112 - 100 * sn).toFixed(1) + '" x2="' + (115 + 82 * c).toFixed(1) + '" y2="' + (112 - 82 * sn).toFixed(1) + '" stroke="' + (i / n <= pct ? 'var(--ink)' : 'var(--muted)') + '" stroke-width="1.6" opacity="' + (i / n <= pct ? 1 : .45) + '"/>'; }
  return '<svg viewBox="0 0 230 120" width="100%" aria-hidden="true">' + s + '</svg>';
}
function kpiBtn(label, value, sub, filt, view, extra) { return '<button class="kpi" type="button" data-act="kpi" data-v="' + (view || 'deals') + '" data-f=\'' + esc(JSON.stringify(filt || {})) + '\'><div class="kt">' + label + (extra || '') + '</div><div class="kv"><b class="num">' + value + '</b><span class="muted sm">' + sub + '</span></div></button>'; }
ACT.kpi = t => { go(t.dataset.v, JSON.parse(t.dataset.f)); return false; };

function dotChart() {
  const R = 10, per = 2; DOT = []; let cols = '';
  const won = dbx().deals.filter(d => d.stage === 'Won'), open = openDeals();
  for (let b = 0; b < 30; b++) {
    const lo = -30 + 2 * b, hi = lo + 1;
    const w = won.filter(d => d.due >= lo && d.due <= hi), pr = open.filter(d => (d.due >= lo && d.due <= hi) || (b === 15 && d.due < 0));
    const a = sum(w, d => d.v), p = sum(pr, wval);
    DOT.push({ lo, a, p, w: w.map(d => dealAcc(d).n), pr: pr.map(d => dealAcc(d).n) });
    const na = Math.min(R, Math.ceil(a / per)), np = Math.min(R - na, Math.ceil((a + p) / per) - na);
    let dots = ''; for (let r = 0; r < na; r++) dots += '<i></i>'; for (let r = 0; r < np; r++) dots += '<i class="p"></i>';
    cols += '<div class="dcol" data-i="' + b + '">' + dots + '</div>';
  }
  return '<div class="dchart"><div class="dyax"><span>₹20L</span><span>₹14L</span><span>₹8L</span><span>₹2L</span></div><div class="dcols" id="dcols">' + cols + '<div class="tip" id="tip"></div></div><div class="dxax"><span>' + fmtD(-30) + '</span><span>' + fmtD(-16) + '</span><span>Today</span><span>' + fmtD(14) + '</span><span>' + fmtD(29) + '</span></div></div>';
}
function monthlyChart() {
  const m = monthly(), mx = Math.max.apply(null, m.map(x => x.actual + x.commit + x.best), 1);
  return '<div class="mchart">' + m.map(x => { const h = v => Math.round(v / mx * 120); return '<div class="mcol" title="' + x.m + ': won ' + fmtL(x.actual) + (x.future ? ', commit ' + fmtL(x.commit) + ', best case (weighted) ' + fmtL(x.best) : '') + '"><div class="mstack"><i class="mb" style="height:' + h(x.best) + 'px"></i><i class="mc" style="height:' + h(x.commit) + 'px"></i><i class="ma" style="height:' + h(x.actual) + 'px"></i></div><span>' + x.m + '</span></div>'; }).join('') + '</div><div class="row sm muted" style="gap:14px;margin-top:6px"><span><i class="sw ma"></i>Won</span><span><i class="sw mc"></i>Commit</span><span><i class="sw mb"></i>Best case, weighted</span></div>';
}
function revTile(label, val, sub, filt, tip) { return '<button class="tile" type="button" ' + (filt ? 'data-act="kpi" data-v="deals" data-f=\'' + esc(JSON.stringify(filt)) + '\'' : 'data-act="toast" data-id="' + esc(tip || '') + '"') + '><span class="muted sm">' + label + '</span><b class="num">' + val + '</b><span class="muted sm">' + sub + '</span></button>'; }

function secRevenue() {
  const p = period(), r = revenue(p), name = periodName(p);
  const st = stageNames().map(s => ({ s, n: dbx().deals.filter(d => d.stage === s).length }));
  const mxn = Math.max.apply(null, st.map(x => x.n).concat(1));
  const bars = st.map((x, i) => '<button class="bar" type="button" data-act="kpi" data-v="deals" data-f=\'' + esc(JSON.stringify({ stage: x.s })) + '\' aria-label="' + x.n + ' deals in ' + esc(x.s) + '"><span>' + x.n + '</span><i class="' + (i % 2 ? 'h' : '') + '" style="height:' + (x.n / mxn * 80 + 6) + 'px"></i><span class="muted">' + esc(x.s.slice(0, 5)) + '</span></button>').join('');
  const ins = forecastInsight(p);
  const factors = ins.factors.length ? ins.factors.map(f => '<div class="factor"><div>' + ic('warn', 16) + '<b>' + esc(f.t) + '</b><div class="muted sm">Evidence: ' + esc(f.ev) + '</div></div>' + (f.ids ? '<button class="btn xs" type="button" data-act="kpi" data-v="deals" data-f=\'' + esc(JSON.stringify({ ids: f.ids })) + '\'>View deals</button>' : '<button class="btn xs" type="button" data-act="kpi" data-v="deals" data-f=\'{"open":true}\'>View pipeline</button>') + '</div>').join('') : '<p class="muted">No major forecast risks detected.</p>';
  const insight = UI.insight || 'Won revenue is lumpy: most of it lands on a few days. Commit deals that slip move the forecast the most, so check the risks below first.';
  return '<section id="sec-a" class="secwrap">' + sect(ic('deals', 18) + ' Revenue performance', '<div class="row">' + tabs('period', [['month', 'Month'], ['quarter', 'Quarter'], ['year', 'Year']], p) + '</div>') +
    '<div class="band"><div><h3>Pipeline by stage</h3><div class="bars">' + bars + '</div></div>' +
    '<button class="gauge as-btn" type="button" data-act="kpi" data-v="deals" data-f=\'{"result":"closed"}\' aria-label="Win rate ' + Math.round(r.winRate * 100) + ' percent. Open closed deals">' + gaugeSvg(r.winRate) + '<div class="gc"><b>' + Math.round(r.winRate * 100) + '%</b><span class="muted sm">Win rate, last 90 days</span></div></button>' +
    '<button class="bignum as-btn" type="button" data-act="kpi" data-v="deals" data-f=\'{"open":true}\'><b class="num">' + fmtL(r.pipe) + '</b><div class="lab"><span>Pipeline value</span>' + ic('arrow', 18) + '</div></button>' +
    '<button class="bignum as-btn" type="button" data-act="kpi" data-v="deals" data-f=\'{"fc":"forecast"}\'><b class="num">' + fmtL(r.forecast) + '</b><div class="lab"><span>Forecast revenue</span>' + ic('arrow', 18) + '</div></button></div>' +
    '<div class="kpis">' + kpiBtn('Revenue achieved', fmtL(r.wonV), 'of ' + fmtL(r.quota) + ' quota', { result: 'won' }, 'deals', '<span class="delta ' + (r.attain >= 0.5 ? 'up' : 'down') + '">' + Math.round(r.attain * 100) + '%</span>') +
    kpiBtn('Quota attainment', Math.round(r.attain * 100) + '%', 'forecast ' + Math.round(r.fAttain * 100) + '%', { fc: 'forecast' }, 'deals', '<span class="delta ' + (r.fAttain >= 1 ? 'up' : 'down') + '">' + (r.fAttain >= 1 ? 'on track' : 'short') + '</span>') +
    kpiBtn('Pipeline coverage', r.coverage == null ? 'Quota met' : r.coverage.toFixed(1) + 'x', 'guideline 3x', { open: true }, 'deals', '<span class="delta ' + (r.coverage == null || r.coverage >= 3 ? 'up' : 'down') + '">' + (r.coverage == null || r.coverage >= 3 ? 'healthy' : 'thin') + '</span>') + '</div>' +
    '<div class="card"><div class="ch"><h2>Revenue analytics</h2><span class="chip line">Won and AI-projected, ±30 days</span></div><div class="rev"><div><div class="legend"><span><i style="background:var(--mint)"></i>Actual won</span><span><i style="background:var(--mint-soft);outline:1px solid var(--mint)"></i>AI projected (probability-weighted)</span></div><div class="insight" id="insight">' + ic('sparkle', 18) + '<span>' + esc(insight) + '</span></div><div style="margin-top:12px"><button class="btn pri" type="button" data-act="analyze"' + (UI.insightBusy ? ' disabled' : '') + '>' + (UI.insightBusy ? 'Analyzing…' : 'Run analysis') + '</button></div></div>' + dotChart() + '</div></div>' +
    '<div class="card" id="revintel"><div class="ch"><div><h2>Revenue intelligence</h2><span class="muted sm">' + name + '. Forecast = won + Commit + Best Case × probability.</span></div></div>' +
    '<div class="tiles">' + revTile('Total pipeline', fmtL(r.pipe), r.open.length + ' open deals', { open: true }) + revTile('Weighted pipeline', fmtL(r.weighted), 'amount × probability', { open: true }) + revTile('Forecast revenue', fmtL(r.forecast), Math.round(r.fAttain * 100) + '% of quota', { fc: 'forecast' }) + revTile('Won revenue', fmtL(r.wonV), r.won.length + ' deals won' + (p === 'year' ? ' + earlier months' : ''), { result: 'won' }) + revTile('Quota attainment', Math.round(r.attain * 100) + '%', fmtL(r.quota) + ' quota', { result: 'won' }) +
    revTile('Pipeline coverage', r.coverage == null ? 'Met' : r.coverage.toFixed(1) + 'x', fmtL(r.remaining) + ' still to win', { open: true }) + revTile('Win rate', Math.round(r.winRate * 100) + '%', r.closedN + ' closed deals, 90 days', { result: 'closed' }) + revTile('Sales velocity', fmtL(r.velocity) + '/day', 'avg cycle ' + Math.round(r.avgCycle) + ' days', null, 'Velocity = open deals × average deal × win rate ÷ average sales cycle.') + revTile('Deals at risk', r.risky.length + ' (' + fmtL(r.riskV) + ')', 'open risks or slippage', { risk: true }) + revTile('Forecast accuracy', Math.round(r.accuracy * 100) + '%', 'average of last 3 quarters', null, 'Accuracy = 1 minus the gap between forecast and actual, averaged over Q1 to Q3.') + '</div>' +
    '<div class="g2 mt"><div><h3>Won and forecast by month</h3>' + monthlyChart() + '</div><div><h3>Stage conversion (last 180 days)</h3><div class="funnel">' + conversions().map(c => '<div class="fn"><span>' + esc(c.s) + '</span><div class="fbar"><i style="width:' + Math.max(6, c.n / 62 * 100) + '%"></i></div><b class="num">' + c.n + '</b><span class="muted sm">' + (c.rate == null ? '' : Math.round(c.rate * 100) + '%') + '</span></div>').join('') + '</div><p class="muted sm">Counts start from sample history and grow as you move deals.</p></div></div>' +
    '<div class="aibox mt"><div class="row" style="justify-content:space-between"><h3>' + ic('sparkle', 16) + ' AI forecast insight</h3><button class="btn xs" type="button" data-act="explain">' + (UI.explainBusy ? 'Thinking…' : 'Explain with AI') + '</button></div><p>' + esc(ins.head) + '</p>' + factors + (UI.explain ? '<div class="insight mt">' + ic('sparkle', 18) + '<span>' + esc(UI.explain) + '</span></div>' : '') + '<p class="muted sm">Rule-based from your pipeline data. Every factor links to the deals behind it.</p></div></div></section>';
}

function secExecution() {
  const ds = dbx().deals.filter(d => (!UI.mine || d.own === dbx().me) && matchQ(dealAcc(d).n + ' ' + d.desc));
  const tabSet = { Priority: ds.filter(d => isOpen(d) && (dealRisks(d).length || d.due <= 6)), Active: ds.filter(isOpen), Won: ds.filter(d => d.stage === 'Won'), Lost: ds.filter(d => d.stage === 'Lost'), Recommended: ds.filter(d => d.rec && isOpen(d)) };
  const cur = tabOf('dealtab', 'Priority'), rows = (tabSet[cur] || []).sort((a, b) => b.v - a.v).map(d => { const a = dealAcc(d), pc = primaryContact(d); return '<tr class="rowbtn" role="button" tabindex="0" data-act="open" data-t="deal" data-id="' + d.id + '"><td><div class="who">' + avN(pc ? pc.name : a.n, userIdx(d.own)) + '<div><b>' + esc(pc ? pc.name : '—') + '</b><span>' + esc(pc ? pc.title : '') + '</span></div></div></td><td><b>' + esc(a.n) + '</b><div class="muted sm">' + esc(d.desc) + '</div></td><td class="muted">' + esc(d.stage === 'Lost' ? 'Lost: ' + d.lostReason : d.next || '') + '</td><td class="num">' + fmtD(d.due) + (d.slip ? ' <span class="late" title="Slipped">↻' + d.slip + '</span>' : '') + '</td><td class="num"><b>' + fmtL(d.v) + '</b></td><td>' + stageChip(d.stage) + '</td><td>' + av(d.own, 's') + '</td></tr>'; }).join('') || '<tr><td colspan="7">' + empty('deals', 'Nothing here', 'No deals match this tab and search.') + '</td></tr>';
  const tb = ['Priority', 'Active', 'Won', 'Lost', 'Recommended'].map(t => [t, t, t === 'Won' || t === 'Lost' ? null : tabSet[t].length]);
  const up = dbx().acts.filter(a => !a.sys && !a.done && a.when >= 0).sort((a, b) => a.when - b.when || a.time.localeCompare(b.time)).slice(0, 5);
  const od = dbx().acts.filter(isOverdue).sort((a, b) => a.when - b.when).slice(0, 4), pr = dbx().acts.filter(a => isTaskLike(a) && !taskDone(a) && a.ai && a.when >= 0).sort((a, b) => a.when - b.when).slice(0, 4);
  const att = attentionDeals().slice(0, 4);
  return '<section id="sec-b" class="secwrap">' + sect(ic('activity', 18) + ' Sales execution', '<button class="btn xs" type="button" data-act="go" data-id="activities">All activities</button>') +
    '<div class="dash"><div class="stack"><section class="card"><div class="ch"><h2>Priority deals</h2>' + tabs('dealtab', tb, cur) + '</div><div class="twrap"><table><thead><tr><th>Contact</th><th>Deal</th><th>Next step</th><th>Close</th><th>Value</th><th>Stage</th><th>Owner</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>' +
    '<section class="card"><div class="ch"><h2>Upcoming activities</h2><button class="btn xs" type="button" data-act="go" data-id="activities">Calendar</button></div>' + (up.length ? up.map(actRow).join('') : empty('cal', 'Nothing scheduled', 'Create an activity to see it here.')) + '</section></div>' +
    '<div class="rail"><section class="card"><div class="ch"><h2>Priority tasks</h2><button class="btn xs" type="button" data-act="go" data-id="tasks">All</button></div>' + (pr.length ? pr.map((t, i) => '<div class="task' + (i === 0 ? ' first' : '') + '" role="button" tabindex="0" data-act="gotask" data-id="' + t.id + '"><span class="ring" style="--p:' + (t.p || 15) + '"></span><div><b>' + esc(t.subj) + '</b><span class="sub">' + esc(t.notes) + '</span></div></div>').join('') : '<p class="muted">All caught up.</p>') + '</section>' +
    '<section class="card"><div class="ch"><h2>Overdue follow-ups</h2>' + (od.length ? chip(od.length + ' overdue', 'late-chip') : '') + '</div>' + (od.length ? od.map(actRow).join('') : '<p class="muted">Nothing overdue.</p>') + '</section>' +
    '<section class="card"><div class="ch"><h2>Deals requiring attention</h2><button class="btn xs" type="button" data-act="kpi" data-v="deals" data-f=\'{"risk":true}\'>All</button></div>' + (att.length ? att.map(d => '<button class="att" type="button" data-act="open" data-t="deal" data-id="' + d.id + '"><b>' + esc(dealAcc(d).n) + '</b><span class="num">' + fmtL(d.v) + '</span><span class="risk">' + ic('warn', 13) + esc(dealRisks(d)[0]) + '</span></button>').join('') : '<p class="muted">No deal needs attention.</p>') + '</section></div></div></section>';
}
ACT.gotask = t => { const a = G.act(t.dataset.id); if (a.link.deal) openDrawer('deal', a.link.deal); else if (a.link.acc) openDrawer('account', a.link.acc); else go('tasks'); return false; };

function secCustomers() {
  const hc = { green: 0, yellow: 0, orange: 0, red: 0 }; customers().forEach(a => { hc[health(a)]++; });
  const risk = atRiskAccounts().sort((a, b) => RANK[health(b)] - RANK[health(a)] || b.arr - a.arr).slice(0, 4);
  const ren = customers().filter(a => a.renew != null).sort((a, b) => a.renew - b.renew).slice(0, 4);
  return '<section id="sec-c" class="secwrap">' + sect(ic('users', 18) + ' Customer intelligence', '<button class="btn xs" type="button" data-act="go" data-id="customers">All customers</button>') +
    '<div class="g3"><section class="card"><div class="ch"><h2>Health distribution</h2><span class="chip line">' + customers().length + ' customers</span></div><div class="hbar" role="img" aria-label="Customer health split">' + ['green', 'yellow', 'orange', 'red'].map(k => hc[k] ? '<i class="' + k[0] + '" style="flex:' + hc[k] + '"></i>' : '').join('') + '</div><div class="hlegend">' + ['green', 'yellow', 'orange', 'red'].map(k => '<button type="button" data-act="kpi" data-v="customers" data-f=\'{"health":"' + k + '"}\'>' + pill(k) + '<b class="num">' + hc[k] + '</b></button>').join('') + '</div></section>' +
    '<section class="card"><div class="ch"><h2>At-risk accounts</h2></div>' + (risk.length ? risk.map(a => '<button class="att" type="button" data-act="open" data-t="account" data-id="' + a.id + '"><b>' + esc(a.n) + '</b>' + pill(health(a)) + '<span class="muted sm">₹' + a.arr + 'L ARR · renews in ' + a.renew + ' days</span></button>').join('') : '<p class="muted">All customers are Green.</p>') + '</section>' +
    '<section class="card"><div class="ch"><h2>Upcoming renewals</h2><button class="btn xs" type="button" data-act="kpi" data-v="customers" data-f=\'{"renew":120}\'>Within 120 days</button></div>' + ren.map(a => '<button class="att" type="button" data-act="open" data-t="account" data-id="' + a.id + '"><b>' + esc(a.n) + '</b><span class="num">₹' + a.arr + 'L</span><span class="muted sm">' + fmtD(a.renew) + ' · in ' + a.renew + ' days · ' + LABEL[health(a)] + '</span></button>').join('') + '</section></div></section>';
}

function aiInsights() {
  const out = [], gap = industryTable().filter(r => r.gap)[0], risk = atRiskAccounts().sort((a, b) => RANK[health(b)] - RANK[health(a)])[0], f = forecastInsight('quarter'), newL = dbx().leads.filter(l => l.status === 'New').length;
  if (gap) out.push({ ic: 'radar', t: gap.n + ' is a market gap: competitors have ' + (gap.a + gap.b + gap.c) + ' customers there and you have none.', ev: 'Vantage HR case study and customer logo, Orbit People job post (27 to 30 Oct)', go: ['radar'], b: 'Open Market Radar' });
  if (risk) out.push({ ic: 'warn', t: risk.n + ' is ' + LABEL[health(risk)] + ' and renews in ' + risk.renew + ' days (' + money(risk.arr) + ').', ev: risk.tk.filter(t => t.d <= 6).map(t => t.id).join(', '), go: ['open', 'account', risk.id], b: 'Open account' });
  out.push({ ic: 'bolt', t: f.head, ev: f.factors.length ? f.factors[0].ev : 'No risk factors', go: ['go', 'deals'], b: 'See deals' });
  if (newL) out.push({ ic: 'leads', t: newL + ' new lead' + (newL > 1 ? 's are' : ' is') + ' waiting for qualification.', ev: 'Lead Intelligence has scored them and drafted outreach for approval.', go: ['kpi', 'leads', { status: 'New' }], b: 'Open leads' });
  return out;
}
function actionCard(a, compact) {
  const target = a.ent ? (a.ent.t === 'deal' ? lnk('deal', a.ent.id, a.ent.l) : a.ent.t === 'account' ? lnk('account', a.ent.id, a.ent.l) : a.ent.t === 'lead' ? lnk('lead', a.ent.id, a.ent.l) : chip(esc(a.ent.l))) : '';
  return '<div class="acard' + (a.external ? ' ext' : '') + '" id="ac-' + a.id + '"><div class="row" style="justify-content:space-between"><span class="chip src">' + ic('agent', 12) + esc(a.agentName) + '</span><span class="row">' + (a.external ? chip('External message', 'warnchip') : '') + confChip(a.conf) + '</span></div><b class="atitle">' + esc(a.title) + '</b>' + (a.from || a.to ? '<div class="change"><span class="from">' + esc(a.from || 'None') + '</span><span class="arrow">→</span><span>' + esc(String(a.to)) + '</span></div>' : '') +
    (compact ? '' : '<ul class="evl">' + a.ev.map(e => '<li><span class="muted sm">' + esc(e.src) + '</span> ' + esc(e.t) + '</li>').join('') + '</ul>') + (a.external && !compact ? '<p class="note">Approving records that you accept this draft. Nothing is sent, because no email integration is connected.</p>' : '') +
    (a.editing ? '<div class="row">' + (a.kind === 'email_draft' ? '<textarea class="edit-in" id="edit-' + a.id + '" rows="4" aria-label="Edit">' + esc(actionEditValue(a)) + '</textarea>' : '<input class="edit-in" id="edit-' + a.id + '" value="' + esc(actionEditValue(a)) + '" aria-label="Edit value">') + '<button class="btn xs pri" type="button" data-act="saveedit" data-id="' + a.id + '">Save and approve</button><button class="btn xs" type="button" data-act="canceledit" data-id="' + a.id + '">Cancel</button></div>' : '') + '<div class="row">' + target + '<span class="grow"></span>' + (a.editing ? '' : a.status === 'pending' ? '<button class="btn xs pri" type="button" data-act="approve" data-id="' + a.id + '">' + (a.external ? 'Approve draft' : 'Approve') + '</button>' + (KINDS[a.kind].edit ? '<button class="btn xs" type="button" data-act="editaction" data-id="' + a.id + '">Edit</button>' : '') + '<button class="btn xs" type="button" data-act="reject" data-id="' + a.id + '">Reject</button>' : chip(a.status === 'applied' ? 'Approved' : a.status === 'rejected' ? 'Rejected' : 'Reversed', 'st-' + a.status) + (canUndo(a) ? '<button class="btn xs" type="button" data-act="undo" data-id="' + a.id + '">' + ic('undo', 12) + 'Undo</button>' : '')) + '</div></div>';
}
function secAI() {
  const ins = aiInsights(), pend = pendingActions().slice(0, 4);
  const recent = dbx().audit.filter(e => e.type === 'agent' || e.type === 'workflow' || /agent action|Reversed/.test(e.action)).slice(0, 5);
  const q = forecastInsight('quarter');
  return '<section id="sec-d" class="secwrap">' + sect(ic('sparkle', 18) + ' AI intelligence', '<button class="btn xs" type="button" data-act="go" data-id="agents">Open AI Agents</button>') +
    '<div class="g2"><div class="stack"><section class="card"><div class="ch"><h2>AI-generated insights</h2></div>' + ins.map(i => '<div class="insrow">' + ic(i.ic, 18) + '<div><b>' + esc(i.t) + '</b><div class="muted sm">Evidence: ' + esc(i.ev) + '</div></div><button class="btn xs" type="button" data-act="insgo" data-a=\'' + esc(JSON.stringify(i.go)) + '\'>' + esc(i.b) + '</button></div>').join('') + '</section>' +
    '<section class="card"><div class="ch"><h2>Revenue risks</h2><span class="chip line">Q4 2026</span></div>' + (q.factors.length ? q.factors.map(f => '<div class="insrow">' + ic('warn', 18) + '<div><b>' + esc(f.t) + '</b><div class="muted sm">' + esc(f.ev) + '</div></div></div>').join('') : '<p class="muted">No revenue risks right now.</p>') + '</section></div>' +
    '<div class="stack"><section class="card"><div class="ch"><h2>Recommended actions</h2>' + chip(pendingActions().length + ' waiting', 'src') + '</div>' + (pend.length ? pend.map(a => actionCard(a, true)).join('') : empty('check', 'Nothing waiting', 'Agents have no proposals right now.')) + (pendingActions().length > 4 ? '<button class="btn xs" type="button" data-act="go" data-id="agents">See all ' + pendingActions().length + '</button>' : '') + '</section>' +
    '<section class="card"><div class="ch"><h2>Agent activity</h2></div>' + (recent.length ? recent.map(e => '<div class="logrow"><span class="chip ' + (e.type === 'agent' ? 'src' : '') + '">' + esc(e.type) + '</span><div><b>' + esc(e.action) + '</b><div class="muted sm">' + esc(e.ent.l) + (e.detail ? ' · ' + esc(e.detail) : '') + '</div></div><span class="muted sm">' + fmtStamp(e.at) + '</span></div>').join('') : '<p class="muted">No agent activity yet.</p>') + '</section>' +
    '<section class="aicard"><h2>Hi ' + esc(me().n.split(' ')[0]) + ', how can I help?</h2>' + ['Which deals are at risk?', 'What should I focus on today?', 'Where are competitors beating us?'].map(q => '<button class="ask" type="button" data-act="ask" data-q="' + esc(q) + '">' + ic('sparkle', 16) + esc(q) + '</button>').join('') + '<button class="ask" type="button" data-act="chat">' + ic('chat', 16) + 'Ask anything…</button></section></div></div></section>';
}
ACT.insgo = t => { const a = JSON.parse(t.dataset.a); if (a[0] === 'radar') go('radar'); else if (a[0] === 'open') openDrawer(a[1], a[2]); else if (a[0] === 'go') go(a[1]); else go(a[1], a[2]); return false; };

VIEWS.dashboard = () => '<div class="phead"><div><h1>Good morning, ' + esc(me().n.split(' ')[0]) + '</h1><p>Revenue, execution, customers and AI in one place. Every number opens the records behind it.</p></div><div class="row"><button class="btn pri" type="button" data-act="journey">' + ic('route', 16) + 'Run the lead-to-revenue demo</button></div></div>' +
  '<nav class="snav" aria-label="Dashboard sections">' + [['sec-a', 'Revenue performance'], ['sec-b', 'Sales execution'], ['sec-c', 'Customer intelligence'], ['sec-d', 'AI intelligence']].map(s => '<button class="pillbtn" type="button" data-act="scrollto" data-id="' + s[0] + '">' + s[1] + '</button>').join('') + '</nav>' + secRevenue() + secExecution() + secCustomers() + secAI();
ACT.journey = () => { openDrawer('journey', 'j'); return false; };
ACT.analyze = () => {
  UI.insightBusy = true; rerender();
  const data = DOT.map((d, i) => fmtD(d.lo) + '-' + fmtD(d.lo + 1) + ': won ₹' + d.a + 'L, projected ₹' + Math.round(d.p * 10) / 10 + 'L').join('; ');
  const done = t => { UI.insight = t; UI.insightBusy = false; if (UI.view === 'dashboard') rerender(); };
  const r = revenue('quarter');
  if (!sampleFn) return setTimeout(() => done('Won revenue arrives in bursts, with ' + fmtL(r.wonV) + ' closed this quarter. Projected revenue depends on ' + r.commit.length + ' Commit deals worth ' + fmtL(sum(r.commit, d => d.v)) + '. Suggested action: follow up the Proposal-stage deals first.'), 700), false;
  sampleFn('You are a sales analyst. In under 60 words, give 2 or 3 plain-text insights from this two-day bucketed won and projected revenue data (INR lakh) and one suggested action. Do not invent causes you cannot see in the data.\n' + data, { cache: false, modelTier: 'quick' }).then(r2 => done(r2.text)).catch(() => done('Live analysis is unavailable right now. The rule-based insight below still applies.'));
  return false;
};
ACT.explain = () => {
  if (UI.explainBusy) return false; const ins = forecastInsight(period()); UI.explainBusy = true; rerender();
  const done = t => { UI.explain = t; UI.explainBusy = false; if (UI.view === 'dashboard') rerender(); };
  const txt = ins.head + ' Risk factors: ' + ins.factors.map(f => f.t + ' Evidence: ' + f.ev).join(' ');
  if (!sampleFn) return setTimeout(() => done('In plain terms: the forecast counts Commit deals at full value, so any Commit deal that slips or loses its sponsor lowers it directly. Fix the risks listed above in value order, starting with the largest Commit deal. (Demo-mode explanation.)'), 600), false;
  sampleFn('You are a revenue operations analyst. Explain this forecast to a sales manager in under 90 words, plain text, name the single biggest lever, and do not invent numbers.\n' + txt, { cache: false, modelTier: 'quick' }).then(r => done(r.text)).catch(() => done('Live explanation unavailable. The risk factors above are calculated directly from your data.'));
  return false;
};
