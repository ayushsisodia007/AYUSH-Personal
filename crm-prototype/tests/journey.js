/* Drives the 12-step lead-to-revenue demo through the UI, then checks that every module shows the result. */
const { chromium } = require('playwright'); const assert = require('assert'); const OUT = process.env.OUT || '/tmp';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } }); p.setDefaultTimeout(5000);
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/fonts|net::|ERR_/.test(m.text())) errs.push(m.text()); });
  await p.goto('file://' + process.cwd() + '/index.html'); await p.waitForTimeout(300);
  await p.click('#jBtn'); await p.waitForTimeout(150);
  const done = async () => p.locator('.jstep.done').count();
  const log = [];
  for (let i = 0; i < 14 && (await done()) < 12; i++) {
    const before = await done(), btn = p.locator('.jstep.cur button.pri'); const label = (await btn.innerText()).trim();
    await btn.click(); await p.waitForTimeout(250); log.push(label + ' => ' + (await done()) + '/12');
  }
  console.log(log.join('\n'));
  assert.strictEqual(await done(), 12, 'all 12 steps should complete');
  await p.screenshot({ path: OUT + '/journey_drawer.png' });
  await p.click('.x2'); await p.waitForTimeout(100);
  const st = await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('kestrel.v3')).db; const l = d.leads.find(x => x.company === 'Cirrus Air'), a = d.accounts.find(x => x.id === l.conv.acc), dl = d.deals.find(x => x.id === l.conv.deal); return { lead: l.status, score: l.score, acc: a.type + ' ARR ' + a.arr + ' renew ' + a.renew, deal: dl.stage + ' ' + dl.v + ' risk=' + dl.risk, contacts: d.contacts.filter(c => c.acc === a.id).map(c => c.name + ':' + c.role), wfTask: d.acts.filter(x => x.wf === 'wf-follow' && x.link.deal === dl.id).length, audit: d.audit.length }; });
  console.log(JSON.stringify(st, null, 1));
  assert.strictEqual(st.lead, 'Converted'); assert(/Customer ARR 28 renew 365/.test(st.acc)); assert(/^Won 28/.test(st.deal)); assert(st.contacts.length === 3 && st.wfTask >= 1);
  // other modules reflect the same records
  await p.click('nav [data-id=customers]'); await p.click('[data-act=tab][data-g=custtab][data-id=customers]'); await p.waitForTimeout(100);
  assert(/Cirrus Air/.test(await p.innerText('#main')), 'Cirrus Air appears under Customers');
  await p.click('nav [data-id=dashboard]'); await p.click('[data-act=tab][data-g=period][data-id=month]'); await p.waitForTimeout(150);
  assert(/₹28L/.test(await p.innerText('#sec-a')), 'November revenue shows the ₹28L win');
  await p.click('nav [data-id=tasks]'); await p.waitForTimeout(100); assert(/Cirrus/.test(await p.innerText('#main')), 'workflow + CS tasks in Tasks');
  await p.click('nav [data-id=activities]'); await p.waitForTimeout(100); await p.fill('#q', 'Cirrus'); await p.waitForTimeout(100); assert((await p.locator('#main .arow').count()) >= 2, 'activities for Cirrus');
  await p.fill('#q', ''); await p.click('nav [data-id=settings]'); await p.click('.setnav button:has-text("Audit log")'); await p.waitForTimeout(100);
  const au = await p.innerText('#main'); assert(/Converted lead/.test(au) && /Won deal/.test(au) && /Lead Intelligence Agent|Deal Intelligence Agent/.test(au), 'audit trail has the journey');
  await p.click('nav [data-id=customers]'); await p.waitForTimeout(100); await p.click('#main button:has-text("Cirrus Air")'); await p.waitForTimeout(150); await p.screenshot({ path: OUT + '/account360_cirrus.png' });
  assert(/Cirrus Air/.test(await p.innerText('.drawer .dhead')) && /Customer/.test(await p.innerText('.drawer .dhead')));
  console.log(errs.length ? 'JS ERRORS ' + errs.join(' | ') : 'JOURNEY OK, no JavaScript errors'); await b.close(); process.exitCode = errs.length ? 1 : 0;
})().catch(e => { console.log('JOURNEY FAIL', e.message); process.exit(1); });
