const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 400, height: 860 } }); p.setDefaultTimeout(4000);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/index.html'); await p.waitForTimeout(300);
  const wide = async name => { const w = await p.evaluate(() => { const el = document.documentElement; const bad = []; document.querySelectorAll('body *').forEach(n => { if (n.closest('.twrap,.board,.nav,.dtabs,.cal,.smap,svg,.dbody .tl')) return; const r = n.getBoundingClientRect(); if (r.width > 0 && r.right > innerWidth + 2 && getComputedStyle(n).position !== 'fixed') bad.push((n.className || n.tagName).toString().slice(0, 30)); }); return { sw: el.scrollWidth, bad: bad.slice(0, 4) }; }); console.log(name.padEnd(22), 'scrollWidth', w.sw, w.sw > 402 || w.bad.length ? 'OVERFLOW ' + w.bad.join(',') : 'ok'); };
  for (const v of ['dashboard', 'leads', 'deals', 'customers', 'activities', 'calls', 'tasks', 'radar', 'agents', 'workflows', 'settings']) { await p.click('nav [data-id=' + v + ']'); await p.waitForTimeout(150); await wide(v); if (['dashboard', 'deals', 'agents'].includes(v)) await p.screenshot({ path: OUT + '/m_' + v + '.png' }); }
  await p.click('nav [data-id=leads]'); await p.locator('#main tbody tr').first().click(); await p.waitForTimeout(150); await wide('lead drawer'); await p.screenshot({ path: OUT + '/m_leaddrawer.png' }); await p.click('.x2');
  await p.click('nav [data-id=customers]'); await p.click('#main button.linkbtn >> nth=0'); await p.waitForTimeout(150); await p.click('.drawer .pillbtn:has-text("Stakeholders")'); await p.waitForTimeout(100); await wide('account 360'); await p.screenshot({ path: OUT + '/m_acc360.png' }); await p.click('.x2');
  await p.click('#jBtn'); await p.waitForTimeout(150); await wide('journey drawer'); await p.click('.x2');
  await p.click('#aiBtn'); await p.waitForTimeout(100); await wide('chat'); await p.click('#chatX');
  await p.click('#addBtn'); await p.click('#createMenu button >> nth=0'); await p.waitForTimeout(100); await wide('modal'); await p.screenshot({ path: OUT + '/m_modal.png' });
  console.log(errs.length ? 'ERRORS ' + errs : 'no errors'); await b.close();
})();
