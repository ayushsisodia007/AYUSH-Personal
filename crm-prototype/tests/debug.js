const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1500 } }); p.setDefaultTimeout(4000);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/index.html'); await p.waitForTimeout(300);
  await p.click('nav [data-id=deals]'); await p.waitForTimeout(150);
  await p.evaluate(() => { window.__ev = []; ['dragstart', 'dragover', 'drop', 'dragend', 'click'].forEach(n => document.addEventListener(n, e => window.__ev.push(n + ':' + (e.target.className || e.target.tagName).toString().slice(0, 20)), true)); });
  const card = p.locator('.kcard[data-id="d-sunrise"]'), target = p.locator('.kcol[data-stage="Proposal"] .kbody');
  const bb = await card.boundingBox(), tb = await target.boundingBox(); console.log('card', JSON.stringify(bb), 'target', JSON.stringify(tb));
  await p.mouse.move(bb.x + bb.width / 2, bb.y + 20); await p.mouse.down(); await p.mouse.move(bb.x + bb.width / 2 + 10, bb.y + 30, { steps: 3 }); await p.mouse.move(tb.x + tb.width / 2, tb.y + 30, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(300);
  console.log('events', JSON.stringify(await p.evaluate(() => window.__ev.slice(0, 12))));
  console.log('Proposal has Sunrise:', await p.evaluate(() => /Sunrise/.test(document.querySelector('.kcol[data-stage="Proposal"]').innerText)));
  console.log('errs', errs); await b.close();
})();
