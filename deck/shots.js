/* Captures the prototype screens used in the deck. Run from /deck: node shots.js */
const { chromium } = require('playwright'); const sharp = require('sharp'); const fs = require('fs');
const URL = 'file:///home/user/AYUSH-Personal/crm-prototype/index.html';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 2 }); const p = await ctx.newPage(); p.setDefaultTimeout(6000);
  await p.goto(URL); await p.waitForTimeout(400);
  const step = async () => { await p.locator('.jstep.cur button.pri').click(); await p.waitForTimeout(250); };
  // dashboard (fresh data)
  await p.screenshot({ path: 'assets/dashboard.png', clip: { x: 262, y: 100, width: 1150, height: 640 } });
  // Journey 1: lead -> AI score
  await p.click('#jBtn'); await p.waitForTimeout(150); await step(); await step(); await step();
  await p.click('.x2'); await p.click('nav [data-id=leads]'); await p.fill('#q', 'Cirrus'); await p.waitForTimeout(150); await p.locator('#main tbody tr').first().click(); await p.waitForTimeout(300);
  const dr = await p.locator('.drawer').boundingBox();
  await p.screenshot({ path: 'assets/j1_lead.png', clip: { x: dr.x, y: dr.y, width: dr.width, height: 660 } });
  // Journey 2: meeting -> proposals (before approval)
  await p.click('.x2'); await p.fill('#q', ''); await p.click('#jBtn'); await p.waitForTimeout(150); for (let i = 0; i < 4; i++) await step();
  await p.click('.x2'); await p.click('nav [data-id=calls]'); await p.click('#main .citem:has-text("Cirrus")'); await p.waitForTimeout(300);
  const card = await p.locator('#main section.card').first().boundingBox();
  await p.screenshot({ path: 'assets/j2_meeting.png', clip: { x: card.x, y: card.y, width: card.width, height: Math.min(card.height, 640) } });
  // Journey 3: churn prevention cards
  await p.click('nav [data-id=agents]'); await p.waitForTimeout(250);
  const a1 = p.locator('#centre .acard:has-text("exec call with Cobalt")').first(), a2 = p.locator('#centre .acard.ext:has-text("Cobalt")').first();
  await a1.scrollIntoViewIfNeeded(); await a1.screenshot({ path: 'assets/j3a.png' }); await a2.scrollIntoViewIfNeeded(); await a2.screenshot({ path: 'assets/j3b.png' });
  const A = await sharp('assets/j3a.png').metadata(), B = await sharp('assets/j3b.png').metadata(); const W = Math.max(A.width, B.width), gap = 24;
  await sharp({ create: { width: W, height: A.height + B.height + gap, channels: 4, background: { r: 244, g: 243, b: 251, alpha: 1 } } }).composite([{ input: 'assets/j3a.png', top: 0, left: 0 }, { input: 'assets/j3b.png', top: A.height + gap, left: 0 }]).png().toFile('assets/j3_churn.png');
  fs.unlinkSync('assets/j3a.png'); fs.unlinkSync('assets/j3b.png');
  // facts used on slides, read from the live app state
  const facts = await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('kestrel.v3')).db; const lead = d.leads.find(l => l.company === 'Cirrus Air'); const sc = d.actions.find(a => a.kind === 'lead_score' && a.p.lead === lead.id); const call = d.calls.find(c => c.deal === lead.conv.deal); const ca = d.actions.filter(a => a.callId === call.id); const cob = d.actions.filter(a => a.acc === 'cobalt' && a.status === 'pending'); return { score: lead.score, evidence: sc ? sc.ev.length : 0, proposals: ca.length, conf: ca.map(a => Math.round(a.conf * 100)), cobalt: cob.map(a => a.kind + (a.external ? ':external' : '')) }; });
  console.log(JSON.stringify(facts)); fs.writeFileSync('assets/facts.json', JSON.stringify(facts));
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
