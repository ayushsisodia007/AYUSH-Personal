const { chromium } = require('playwright'); const OUT = process.env.OUT || '/tmp';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } }); p.setDefaultTimeout(4000);
  await p.goto('file://' + process.cwd() + '/index.html'); await p.waitForTimeout(300);
  await p.click('nav [data-id=deals]'); await p.waitForTimeout(200); await p.screenshot({ path: OUT + '/z_deals.png' });
  await p.click('.kcard[data-id="d-harbor"] button:has-text("Open details")').catch(async () => { await p.click('.kcard[data-id="d-harbor"]'); await p.click('.kcard[data-id="d-harbor"] button:has-text("Open details")'); }); await p.waitForTimeout(200); await p.screenshot({ path: OUT + '/z_dealdrawer.png' });
  await p.click('.x2'); await p.click('nav [data-id=activities]'); await p.click('[data-act=tab][data-g=actview][data-id=calendar]'); await p.waitForTimeout(200); await p.screenshot({ path: OUT + '/z_calendar.png' });
  await p.click('nav [data-id=leads]'); await p.locator('#main tbody tr:has-text("Fortis")').click(); await p.waitForTimeout(200); await p.screenshot({ path: OUT + '/z_lead.png' });
  await b.close();
})();
