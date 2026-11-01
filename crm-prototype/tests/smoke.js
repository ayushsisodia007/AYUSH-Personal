const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|net::|ERR_/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await p.goto('file://' + process.cwd() + '/index.html'); await p.waitForTimeout(400);
  for (const v of ['dashboard', 'leads', 'deals', 'customers', 'activities', 'calls', 'tasks', 'radar', 'agents', 'workflows', 'settings']) {
    await p.click('nav [data-id=' + v + ']'); await p.waitForTimeout(150);
    const len = await p.evaluate(() => document.querySelector('#main').innerText.length);
    console.log(v.padEnd(12), 'main text', len, errs.length ? 'ERRORS ' + errs.length : 'ok');
    await p.screenshot({ path: process.env.OUT + '/s_' + v + '.png', fullPage: true });
  }
  console.log(errs.join('\n') || 'no errors'); await b.close();
})();
