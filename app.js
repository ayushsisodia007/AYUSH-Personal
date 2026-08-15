'use strict';

/* ═══════════════════════════════════════════
   Aria — AI Sourcing Copilot  ·  app.js
   ═══════════════════════════════════════════ */

const STATE_KEY = 'aria_v4_state';

const SUPPLIER_DATA = [
  { id: 1, name: 'Dell Technologies', score: 94, contact: 'Rajesh Kumar', email: 'rajesh.kumar@dell.com', source: 'Internal', recommended: true,
    tags: ['Internal', 'RECOMMENDED'], meta: 'Onboarded 2019 · 12 POs · Avg delivery 8 days',
    rationale: 'Strongest price-performance ratio with proven delivery track record for enterprise laptops in India.' },
  { id: 2, name: 'HP Enterprise', score: 88, contact: 'Priya Nair', email: 'priya.nair@hpe.com', source: 'Internal',
    tags: ['Internal'], meta: 'Onboarded 2020 · 8 POs · Avg delivery 10 days',
    rationale: 'Competitive pricing with excellent warranty terms. Slightly higher unit cost but strong support network.' },
  { id: 3, name: 'Lenovo India', score: 85, contact: 'Amit Sharma', email: 'amit.sharma@lenovo.com', source: 'Internal',
    tags: ['Internal'], meta: 'Onboarded 2021 · 5 POs · Avg delivery 12 days',
    rationale: 'Good value for bulk orders. ThinkPad series aligns with enterprise security requirements.' },
  { id: 4, name: 'Acer Business', score: 79, contact: 'Sunita Rao', email: 'sunita.rao@acer.com', source: 'Internal',
    tags: ['Internal'], meta: 'Onboarded 2022 · 3 POs · Avg delivery 14 days',
    rationale: 'Budget-friendly option. Suitable for non-critical roles but limited enterprise support.' },
  { id: 5, name: 'Ingram Micro', score: 82, contact: 'Vikram Mehta', email: 'vikram.mehta@ingrammicro.com', source: 'AI Discovered',
    tags: ['AI Discovered'], meta: 'Discovered via market scan · Multi-brand distributor',
    rationale: 'Largest IT distributor in India. Can source multiple brands with consolidated billing.' },
  { id: 6, name: 'Redington India', score: 77, contact: 'Deepa Krishnan', email: 'deepa.krishnan@redington.in', source: 'AI Discovered',
    tags: ['AI Discovered'], meta: 'Discovered via market scan · Authorized reseller',
    rationale: 'Strong regional presence in South India. Competitive on Dell and Lenovo lines.' },
  { id: 7, name: 'Savex Technologies', score: 74, contact: 'Ravi Joshi', email: 'ravi.joshi@savex.co.in', source: 'AI Discovered',
    tags: ['AI Discovered'], meta: 'Discovered via market scan · Value reseller',
    rationale: 'Emerging player with aggressive pricing. Limited track record for large enterprise orders.' },
];

const LINE_ITEMS = [
  { item: 'Laptop — Dell Latitude 5540', desc: 'Intel i7-1365U, 16GB RAM, 512GB SSD, 14" FHD, Windows 11 Pro', uom: 'Units', qty: 50, category: 'IT Hardware', location: 'Bangalore' },
  { item: 'Laptop — HP EliteBook 840', desc: 'Intel i7-1355U, 16GB RAM, 512GB SSD, 14" FHD, Windows 11 Pro', uom: 'Units', qty: 30, category: 'IT Hardware', location: 'Mumbai' },
  { item: 'Docking Station — USB-C', desc: 'Universal USB-C dock, dual 4K display, 90W PD', uom: 'Units', qty: 80, category: 'IT Accessories', location: 'Bangalore' },
];

const RFQ_QUESTIONS = [
  'Please confirm the exact model number and configuration you are quoting for each line item.',
  'What is your proposed delivery schedule? Please provide week-wise delivery plan.',
  'Do you offer on-site installation and data migration services? If yes, please provide pricing.',
  'What is the standard warranty period? Is extended warranty / AMC available?',
  'Please confirm GST treatment and provide your GSTIN for invoicing.',
  'What are your payment terms? Do you accept 30/60/90 day credit?',
  'Please attach product datasheets and any relevant certifications (BIS, CE, etc.).',
];

const STEP_LABELS = [
  'Welcome', 'Requirement Captured', 'Metadata Confirmed', 'RFQ Preview',
  'Attachments', 'Price Benchmarks', 'Supplier Panel', 'Deadline Confirmation',
  'RFQ Published', 'Monitor Responses', 'Award',
];

const CHIPS = {
  0: ['Source 80 laptops for Bangalore & Mumbai', 'Office furniture for new floor', 'Cloud hosting services'],
  1: ['Yes, looks good', 'Change delivery location', 'Add more line items'],
  2: ['Yes, proceed', 'Edit event name', 'Change a question'],
  3: ['Upload attachments', 'Show price benchmarks', 'Skip to suppliers'],
  4: ['Done uploading', 'Skip attachments', 'Show benchmarks'],
  5: ['Show suppliers', 'Adjust benchmark', 'Yes, proceed'],
  6: ['Add 1, 2, 5', 'Add all', 'Show more details'],
  7: ['Yes, 21 Aug works', 'Change to 25 Aug'],
  8: ['1 — Send reminders', '2 — Extend event', '3 — Monitor responses'],
  9: ['Why Dell and not HP?', 'Proceed to award'],
  10: [],
};

let S = loadState();

function defaultState() {
  return {
    step: 0,
    messages: [],
    eventName: 'IT Equipment Sourcing — Aug 2026',
    suppliers: {},
    selectedNums: [],
    awardDone: false,
    rfqPublished: false,
    uploadDone: false,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) { /* ignore */ }
  return defaultState();
}

function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(S));
}

function hardReset() {
  localStorage.removeItem(STATE_KEY);
  S = defaultState();
  render();
  if (S.step === 0 && S.messages.length === 0) showWelcome();
}

window.hardReset = hardReset;

/* ── NLP Parser ── */
function nlp(text) {
  const t = text.toLowerCase().trim();

  if (/\b(yes|looks good|correct|sounds good|proceed|go ahead|sure|okay|ok|confirm|yep|great|perfect|done|approved)\b/.test(t))
    return { type: 'confirm' };

  if (/\b(attach|upload|document|file|spec sheet|sow|quote)\b/.test(t))
    return { type: 'upload' };

  if (/\b(benchmark|price benchmark|show benchmark)\b/.test(t))
    return { type: 'benchmark' };

  if (/\b(skip|no attach|without|no attachment)\b/.test(t))
    return { type: 'skip' };

  if (/\b(monitor|response|view response|analyse|analysis|analyz)\b/.test(t))
    return { type: 'monitor' };

  if (/\b(remind|send reminder)\b/.test(t))
    return { type: 'remind' };

  if (/\b(extend|extension|more time)\b/.test(t))
    return { type: 'extend' };

  if (/\b(why|reason|why not|explain|compare|difference)\b/.test(t))
    return { type: 'why' };

  if (/\b(award|proceed to award|confirm award|select dell|go with dell)\b/.test(t))
    return { type: 'award' };

  if (/\b(add all|select all|all supplier|all vendor|invite all)\b/.test(t))
    return { type: 'addAll' };

  if (/\b(supplier|show supplier|vendor)\b/.test(t))
    return { type: 'suppliers' };

  if (/\b(publish|send rfq|go live)\b/.test(t))
    return { type: 'publish' };

  if (/\b(laptop|equipment|source|rfq|procure|buy|purchase|it)\b/.test(t))
    return { type: 'requirement' };

  if (/\b(25 aug|august 25|25th)\b/.test(t))
    return { type: 'deadline', date: '25 Aug 2026' };

  if (/\b(21 aug|august 21|21st)\b/.test(t))
    return { type: 'deadline', date: '21 Aug 2026' };

  const nums = [...t.matchAll(/\b([1-7])\b/g)].map(m => parseInt(m[1], 10));
  if (nums.length > 0 && /\b(add|select|invite|pick|choose|include)\b/.test(t))
    return { type: 'numbered', nums: [...new Set(nums)] };

  const names = { dell: 1, hp: 2, hewlett: 2, lenovo: 3, acer: 4, ingram: 5, redington: 6, savex: 7 };
  for (const [key, id] of Object.entries(names)) {
    if (t.includes(key)) return { type: 'named', id };
  }

  if (/^([1-3])\b/.test(t)) {
    const n = parseInt(t[0], 10);
    if (S.step === 8) {
      if (n === 1) return { type: 'remind' };
      if (n === 2) return { type: 'extend' };
      if (n === 3) return { type: 'monitor' };
    }
  }

  return { type: 'unknown' };
}

/* ── Message Helpers ── */
function now() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function addMsg(role, html) {
  S.messages.push({ role, html, t: now() });
  saveState();
  appendMessage(role, html);
  scrollBottom();
}

function appendMessage(role, html) {
  const el = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  if (role === 'user') {
    div.innerHTML = `
      <div class="msg-avatar">U</div>
      <div class="msg-body">
        <div class="msg-text">${esc(html)}</div>
        <div class="msg-time">${now()}</div>
      </div>`;
  } else {
    div.innerHTML = `
      <div class="msg-avatar">A</div>
      <div class="msg-body">
        <div class="aria-content">${html}</div>
        <div class="msg-time">${now()}</div>
      </div>`;
  }
  el.appendChild(div);
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function scrollBottom() {
  const el = document.getElementById('messages');
  requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
}

function showTyping() {
  const el = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'msg aria';
  div.id = 'typing';
  div.innerHTML = `<div class="msg-avatar">A</div><div class="msg-body"><div class="typing"><span></span><span></span><span></span></div></div>`;
  el.appendChild(div);
  scrollBottom();
}

function hideTyping() {
  const t = document.getElementById('typing');
  if (t) t.remove();
}

function ariaSay(html, delay) {
  return new Promise(resolve => {
    showTyping();
    setTimeout(() => {
      hideTyping();
      addMsg('aria', html);
      resolve();
    }, delay || 600);
  });
}

/* ── Card Builders ── */
function metadataCard() {
  const rows = LINE_ITEMS.map(li => `
    <tr>
      <td>${li.item}</td>
      <td><div class="editable" contenteditable="true">${li.desc}</div></td>
      <td>${li.uom}</td>
      <td>${li.qty}</td>
      <td>${li.category}</td>
      <td>${li.location}</td>
    </tr>`).join('');

  return `<p>I've captured your requirement. Here's what I understood:</p>
  <div class="card">
    <div class="card-header">📋 Requirement Summary</div>
    <div class="card-body">
      <div class="card-meta">
        <div class="meta-item"><label>Event Currency</label><span>INR (₹)</span></div>
        <div class="meta-item"><label>Delivery Locations</label><span>Bangalore, Mumbai</span></div>
        <div class="meta-item"><label>Total Line Items</label><span>${LINE_ITEMS.length}</span></div>
      </div>
      <table class="data-table">
        <thead><tr><th>Item</th><th>Description</th><th>UOM</th><th>Qty</th><th>Category</th><th>Delivery Location</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>
  <p>Does this look correct? You can edit descriptions directly in the table.</p>`;
}

function eventDetailsCard() {
  const questions = RFQ_QUESTIONS.map((q, i) => `
    <div class="rfq-question">
      <div class="q-num">Q${i + 1}</div>
      <div class="q-text">${q}</div>
    </div>`).join('');

  return `<p>Great! Let me set up the event details and RFQ questions.</p>
  <div class="card">
    <div class="card-header">📝 Event Details</div>
    <div class="card-body">
      <div class="card-meta">
        <div class="meta-item"><label>Event Name</label><input type="text" value="${S.eventName}" id="eventNameInput"></div>
      </div>
      <h4 style="font-size:13px;font-weight:600;margin:16px 0 8px;">RFQ Questions</h4>
      ${questions}
    </div>
  </div>
  <p>Shall I proceed to generate the RFQ preview?</p>`;
}

function rfqPreviewCard() {
  const itemRows = LINE_ITEMS.map((li, i) => `
    <tr><td>${i + 1}</td><td>${li.item}</td><td>${li.desc}</td><td>${li.uom}</td><td>${li.qty}</td><td>${li.location}</td></tr>`).join('');

  const qRows = RFQ_QUESTIONS.map((q, i) => `
    <div class="rfq-question"><div class="q-num">Q${i + 1}</div><div class="q-text">${q}</div></div>`).join('');

  return `<p>Here's your RFQ document preview:</p>
  <div class="rfq-doc">
    <div class="rfq-header">
      <h2>${S.eventName}</h2>
      <p>Request for Quotation · Issued ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
    <div class="rfq-body">
      <div class="rfq-section">
        <h3>Event Details</h3>
        <div class="rfq-grid">
          <div class="rfq-field"><label>Event Name</label><span>${S.eventName}</span></div>
          <div class="rfq-field"><label>Currency</label><span>INR (₹)</span></div>
          <div class="rfq-field"><label>Delivery Locations</label><span>Bangalore, Mumbai</span></div>
          <div class="rfq-field"><label>Total Items</label><span>${LINE_ITEMS.length} line items</span></div>
          <div class="rfq-field"><label>Total Quantity</label><span>${LINE_ITEMS.reduce((s, l) => s + l.qty, 0)} units</span></div>
          <div class="rfq-field"><label>Category</label><span>IT Hardware & Accessories</span></div>
        </div>
      </div>
      <div class="rfq-section">
        <h3>Line Items</h3>
        <table class="data-table">
          <thead><tr><th>#</th><th>Item</th><th>Full Specs</th><th>UOM</th><th>Qty</th><th>Location</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>
      <div class="rfq-section">
        <h3>RFQ Questions</h3>
        ${qRows}
      </div>
    </div>
  </div>
  <p>Would you like to upload any attachments, or shall I pull price benchmarks?</p>`;
}

function uploadCard() {
  const done = S.uploadDone;
  return `<p>${done ? 'Attachments uploaded successfully!' : 'You can upload supporting documents for this RFQ.'}</p>
  <div class="card">
    <div class="card-header">📎 Attachments</div>
    <div class="card-body">
      <div class="upload-zone ${done ? 'done' : ''}">
        <div class="upload-icon">${done ? '✅' : '📁'}</div>
        ${done ? '<strong>2 files uploaded</strong>' : '<p>Drag & drop files here, or type "upload" to simulate</p>'}
        ${done ? `<div class="upload-files">
          <div class="upload-file">📄 IT_Equipment_Spec_Sheet.pdf <span>(2.4 MB)</span></div>
          <div class="upload-file">📄 Vendor_Evaluation_Criteria.pdf <span>(1.1 MB)</span></div>
        </div>` : ''}
      </div>
    </div>
  </div>
  <p>${done ? 'Shall I pull price benchmarks next?' : 'Let me know when you are done, or say "skip" to move on.'}</p>`;
}

function benchmarkCard() {
  const internal = [
    { src: 'PO-2025-0847 · Dell Latitude', price: '₹72,500', conf: 92 },
    { src: 'PO-2025-0612 · HP EliteBook', price: '₹74,200', conf: 88 },
    { src: 'PO-2024-1203 · Dell Latitude', price: '₹69,800', conf: 85 },
    { src: 'PO-2024-0891 · Lenovo ThinkPad', price: '₹71,000', conf: 82 },
    { src: 'PO-2024-0445 · HP ProBook', price: '₹73,500', conf: 78 },
  ];
  const external = [
    { src: 'Dell India Website', price: '₹78,900', conf: 70 },
    { src: 'Amazon Business', price: '₹76,400', conf: 65 },
    { src: 'Lenovo India Store', price: '₹75,200', conf: 68 },
    { src: 'Flipkart Business', price: '₹77,800', conf: 60 },
  ];

  const benchRow = (b) => `
    <div class="bench-row">
      <span class="bench-source">${b.src}</span>
      <div class="confidence-bar"><div class="confidence-fill" style="width:${b.conf}%"></div></div>
      <span class="confidence-pct">${b.conf}%</span>
      <span class="bench-price">${b.price}</span>
    </div>`;

  return `<p>I've analysed internal PO history and external market data for comparable laptops:</p>
  <div class="card">
    <div class="card-header">📊 Price Benchmarks</div>
    <div class="card-body">
      <div class="bench-section">
        <h4>Internal PO History (5 records)</h4>
        ${internal.map(benchRow).join('')}
      </div>
      <div class="bench-section">
        <h4>External Market Sources</h4>
        ${external.map(benchRow).join('')}
      </div>
      <div class="price-scale">
        <span style="font-size:11px;color:#64748B;">₹65K</span>
        <div class="scale-bar"><div class="scale-marker" style="left:62%"></div></div>
        <span style="font-size:11px;color:#64748B;">₹85K</span>
      </div>
      <div class="bench-recommend">
        <strong>Recommended benchmark: ₹70,000/unit</strong> — based on weighted analysis of internal POs (60% weight) and external sources (40% weight). This gives you a fair baseline for supplier evaluation.
      </div>
    </div>
  </div>
  <p>Ready to identify suppliers for this RFQ?</p>`;
}

function supplierCard() {
  const rows = SUPPLIER_DATA.map(s => `
    <div class="supplier-row ${s.recommended ? 'recommended' : ''}">
      <div class="supplier-num">${s.id}</div>
      <div class="supplier-info">
        <div class="supplier-name">${s.name} ${s.recommended ? '<span class="tag recommended">RECOMMENDED</span>' : ''}</div>
        <div class="supplier-tags">${s.tags.map(t => `<span class="tag ${t === 'Internal' ? 'internal' : 'ai'}">${t}</span>`).join('')}</div>
        <div class="supplier-meta">${s.meta}</div>
        <div class="supplier-rationale">${s.rationale}</div>
        <div class="supplier-contact">${s.contact} · ${s.email}</div>
      </div>
      <div class="supplier-score">
        <div class="score-value">${s.score}</div>
        <div class="score-label">Score</div>
      </div>
    </div>`).join('');

  return `<p>Based on your requirements, I've identified 7 suppliers. Say "add 1, 2, 5" or "add all" to invite them:</p>
  <div class="card">
    <div class="card-header">🏢 Supplier Recommendations</div>
    <div class="card-body">
      <div class="supplier-list">${rows}</div>
    </div>
  </div>
  <p>Which suppliers would you like to invite? Reference by number (e.g. "add 1, 2, 5") or say "add all".</p>`;
}

function deadlineCard(date) {
  const d = date || '21 Aug 2026';
  return `<p>Before I publish, let me confirm the submission deadline:</p>
  <div class="card">
    <div class="card-header">📅 Submission Deadline</div>
    <div class="card-body">
      <div class="deadline-card">
        <div style="font-size:13px;color:#64748B;">Proposed Deadline</div>
        <div class="deadline-date">${d}</div>
        <div class="deadline-reason">This gives suppliers 6 working days to respond — standard for IT hardware RFQs of this size. Industry average response time is 5–7 days for 80-unit orders.</div>
      </div>
    </div>
  </div>
  <p>Shall I publish the RFQ with this deadline?</p>`;
}

function publishCard() {
  const count = S.selectedNums.length || 7;
  return `<p>Your RFQ is now live!</p>
  <div class="card">
    <div class="card-body">
      <div class="publish-card">
        <div class="publish-icon">🚀</div>
        <div class="publish-status">RFQ Published Successfully</div>
        <p style="font-size:13px;color:#64748B;">${S.eventName} · Deadline: 21 Aug 2026 · ${count} suppliers invited</p>
        <ul class="publish-options">
          <li data-num="1">Send Reminders — nudge suppliers who haven't responded</li>
          <li data-num="2">Extend Event — push the deadline</li>
          <li data-num="3">Monitor Responses — view and analyse bids</li>
        </ul>
      </div>
    </div>
  </div>
  <p>What would you like to do? Say "1", "2", or "3", or use the quick-reply chips below.</p>`;
}

function monitorCard() {
  const insights = `
    <div class="insight-chips">
      <div class="insight-chip">Lowest Bid: <span class="chip-value">Dell · ₹68,200/unit</span></div>
      <div class="insight-chip">Est. Savings: <span class="chip-value">₹1.5L (2.1%)</span></div>
      <div class="insight-chip">Fastest Delivery: <span class="chip-value">Dell · 7 days</span></div>
      <div class="insight-chip">Responses: <span class="chip-value">4 of 7</span></div>
    </div>`;

  const compRows = [
    { s: 'Dell Technologies', up: '₹68,200', tv: '₹68.5L', model: 'Latitude 5540', del: '7 days', war: '3 yr onsite', gst: 'Yes', pay: 'Net 45', amc: '₹4,200', score: 94 },
    { s: 'HP Enterprise', up: '₹69,800', tv: '₹69.8L', model: 'EliteBook 840 G10', del: '10 days', war: '3 yr onsite', gst: 'Yes', pay: 'Net 30', amc: '₹4,800', score: 88 },
    { s: 'Lenovo India', up: '₹70,500', tv: '₹70.5L', model: 'ThinkPad T14 Gen 4', del: '12 days', war: '3 yr carry-in', gst: 'Yes', pay: 'Net 45', amc: '₹3,900', score: 85 },
    { s: 'Ingram Micro', up: '₹71,200', tv: '₹71.2L', model: 'Dell Latitude 5540', del: '9 days', war: '3 yr onsite', gst: 'Yes', pay: 'Net 60', amc: '₹4,500', score: 82 },
  ].map(r => `<tr><td>${r.s}</td><td>${r.up}</td><td>${r.tv}</td><td>${r.model}</td><td>${r.del}</td><td>${r.war}</td><td>${r.gst}</td><td>${r.pay}</td><td>${r.amc}</td><td>${r.score}</td></tr>`).join('');

  const scorecard = (name, bars) => `
    <div class="scorecard">
      <h4>${name}</h4>
      ${bars.map(b => `
        <div class="score-bar-row">
          <span class="score-bar-label">${b.l}</span>
          <div class="score-bar-track"><div class="score-bar-fill" style="width:${b.v}%"></div></div>
          <span class="score-bar-val">${b.v}</span>
        </div>`).join('')}
    </div>`;

  const dellBars = [{ l: 'Price', v: 95 }, { l: 'Delivery', v: 92 }, { l: 'Warranty', v: 88 }, { l: 'Hist. Perf', v: 96 }, { l: 'Compliance', v: 94 }];
  const hpBars = [{ l: 'Price', v: 82 }, { l: 'Delivery', v: 78 }, { l: 'Warranty', v: 90 }, { l: 'Hist. Perf', v: 85 }, { l: 'Compliance', v: 88 }];
  const lenovoBars = [{ l: 'Price', v: 78 }, { l: 'Delivery', v: 72 }, { l: 'Warranty', v: 80 }, { l: 'Hist. Perf', v: 82 }, { l: 'Compliance', v: 86 }];

  return `<p>4 of 7 suppliers have responded. Here's the analysis:</p>
  ${insights}
  <div class="card">
    <div class="card-header">📊 Bid Comparison</div>
    <div class="card-body" style="overflow-x:auto;">
      <table class="data-table comparison-table">
        <thead><tr><th>Supplier</th><th>Unit Price</th><th>Total Value</th><th>Model Offered</th><th>Delivery</th><th>Warranty</th><th>GST Incl.</th><th>Payment</th><th>AMC/yr</th><th>Score</th></tr></thead>
        <tbody>${compRows}</tbody>
      </table>
      <div class="scorecards">
        ${scorecard('Dell Technologies', dellBars)}
        ${scorecard('HP Enterprise', hpBars)}
        ${scorecard('Lenovo India', lenovoBars)}
      </div>
      <div class="rec-banner">
        <strong>Recommendation: Award to Dell Technologies</strong> — Dell offers the lowest unit price (₹68,200 vs HP's ₹69,800), fastest delivery (7 days), and highest composite score (94). Estimated savings of <strong>₹1.5L</strong> against benchmark. HP is a strong alternative if warranty terms are prioritised.
      </div>
    </div>
  </div>
  <p>Would you like me to explain the Dell vs HP comparison, or proceed to award?</p>`;
}

function reasoningCard() {
  const criteria = [
    { c: 'Unit Price', dell: '₹68,200', hp: '₹69,800', edge: 'Dell' },
    { c: 'Total Value (100 units)', dell: '₹68.5L', hp: '₹69.8L', edge: 'Dell' },
    { c: 'Delivery Time', dell: '7 days', hp: '10 days', edge: 'Dell' },
    { c: 'Warranty', dell: '3 yr onsite', hp: '3 yr onsite', edge: 'Tie' },
    { c: 'Historical Performance', dell: '96/100', hp: '85/100', edge: 'Dell' },
    { c: 'Payment Terms', dell: 'Net 45', hp: 'Net 30', edge: 'HP' },
    { c: 'AMC Cost/yr', dell: '₹4,200', hp: '₹4,800', edge: 'Dell' },
  ].map(r => `<tr><td>${r.c}</td><td>${r.dell}</td><td>${r.hp}</td><td style="font-weight:600;color:${r.edge === 'Dell' ? '#2563EB' : r.edge === 'HP' ? '#059669' : '#64748B'}">${r.edge}</td></tr>`).join('');

  return `<p>Here's a detailed 7-criteria comparison of Dell vs HP:</p>
  <div class="card">
    <div class="card-header">🔍 Dell vs HP — Detailed Comparison</div>
    <div class="card-body">
      <table class="data-table">
        <thead><tr><th>Criteria</th><th>Dell Technologies</th><th>HP Enterprise</th><th>Edge</th></tr></thead>
        <tbody>${criteria}</tbody>
      </table>
    </div>
  </div>
  <p>Dell wins on 5 of 7 criteria. HP's only advantage is Net 30 payment terms. Shall I proceed to award Dell?</p>`;
}

function awardBanner() {
  return `<div class="award-banner">
    <h3>🏆 Award Confirmed</h3>
    <div class="award-po">PO-2026-112 · Dell Technologies</div>
    <div class="award-value">₹68.5L</div>
    <div class="award-savings">Estimated savings: ₹1.5L vs benchmark</div>
  </div>`;
}

/* ── Flow Handlers ── */
async function handleInput(text) {
  const intent = nlp(text);
  addMsg('user', text);

  switch (S.step) {
    case 0: return handleStep0(intent, text);
    case 1: return handleStep1(intent);
    case 2: return handleStep2(intent);
    case 3: return handleStep3(intent);
    case 4: return handleStep4(intent);
    case 5: return handleStep5(intent);
    case 6: return handleStep6(intent);
    case 7: return handleStep7(intent, text);
    case 8: return handleStep8(intent);
    case 9: return handleStep9(intent);
    case 10: return handleStep10(intent);
  }
}

async function handleStep0(intent) {
  if (intent.type === 'requirement' || intent.type === 'unknown' || intent.type === 'confirm') {
    S.step = 1;
    saveState();
    updateUI();
    await ariaSay(metadataCard());
  }
}

async function handleStep1(intent) {
  if (intent.type === 'confirm' || intent.type === 'unknown') {
    S.step = 2;
    saveState();
    updateUI();
    await ariaSay(eventDetailsCard());
  }
}

async function handleStep2(intent) {
  const input = document.getElementById('eventNameInput');
  if (input) S.eventName = input.value;
  if (intent.type === 'confirm' || intent.type === 'unknown') {
    S.step = 3;
    saveState();
    updateUI();
    await ariaSay(rfqPreviewCard());
  }
}

async function handleStep3(intent) {
  if (intent.type === 'upload') {
    S.step = 4;
    saveState();
    updateUI();
    await ariaSay(uploadCard());
  } else if (intent.type === 'benchmark' || intent.type === 'skip' || intent.type === 'suppliers') {
    if (intent.type === 'skip') { S.uploadDone = false; }
    S.step = 5;
    saveState();
    updateUI();
    await ariaSay(benchmarkCard());
  } else if (intent.type === 'confirm') {
    S.step = 4;
    saveState();
    updateUI();
    await ariaSay(uploadCard());
  }
}

async function handleStep4(intent) {
  if (intent.type === 'upload' || intent.type === 'confirm') {
    S.uploadDone = true;
    saveState();
    await ariaSay(uploadCard());
    S.step = 5;
    saveState();
    updateUI();
    await ariaSay(benchmarkCard());
  } else if (intent.type === 'benchmark' || intent.type === 'skip') {
    S.step = 5;
    saveState();
    updateUI();
    await ariaSay(benchmarkCard());
  }
}

async function handleStep5(intent) {
  if (intent.type === 'confirm' || intent.type === 'suppliers' || intent.type === 'unknown') {
    S.step = 6;
    saveState();
    updateUI();
    await ariaSay(supplierCard());
  }
}

async function handleStep6(intent) {
  if (intent.type === 'addAll') {
    S.selectedNums = SUPPLIER_DATA.map(s => s.id);
  } else if (intent.type === 'numbered') {
    S.selectedNums = intent.nums;
  } else if (intent.type === 'named') {
    S.selectedNums = [...new Set([...S.selectedNums, intent.id])];
  } else if (intent.type === 'confirm' || intent.type === 'publish') {
    S.selectedNums = S.selectedNums.length ? S.selectedNums : [1, 2, 3];
  }

  if (S.selectedNums.length > 0 || intent.type === 'confirm' || intent.type === 'publish') {
    if (!S.selectedNums.length) S.selectedNums = [1, 2, 3];
    const names = S.selectedNums.map(n => SUPPLIER_DATA.find(s => s.id === n)?.name).filter(Boolean);
    S.step = 7;
    saveState();
    updateUI();
    await ariaSay(`Got it — I'll invite <strong>${names.join(', ')}</strong> (${S.selectedNums.length} supplier${S.selectedNums.length > 1 ? 's' : ''}).`);
    await ariaSay(deadlineCard());
  } else {
    await ariaSay(`Please specify which suppliers to invite. Say "add 1, 2, 5" or "add all".`);
  }
}

async function handleStep7(intent, text) {
  let date = '21 Aug 2026';
  if (intent.type === 'deadline') date = intent.date;
  if (intent.type === 'confirm' || intent.type === 'deadline' || intent.type === 'unknown' || intent.type === 'publish') {
    S.step = 8;
    S.rfqPublished = true;
    saveState();
    updateUI();
    await ariaSay(publishCard());
  }
}

async function handleStep8(intent) {
  if (intent.type === 'monitor') {
    S.step = 9;
    saveState();
    updateUI();
    await ariaSay(monitorCard());
  } else if (intent.type === 'remind') {
    await ariaSay(`Reminder emails sent to 3 suppliers who haven't responded yet. I'll notify you when they submit their bids.`);
  } else if (intent.type === 'extend') {
    await ariaSay(`Deadline extended to <strong>28 Aug 2026</strong>. All invited suppliers have been notified of the extension.`);
  } else {
    S.step = 9;
    saveState();
    updateUI();
    await ariaSay(monitorCard());
  }
}

async function handleStep9(intent) {
  if (intent.type === 'why') {
    await ariaSay(reasoningCard());
  } else if (intent.type === 'award' || intent.type === 'confirm' || intent.type === 'named') {
    S.step = 10;
    S.awardDone = true;
    saveState();
    updateUI();
    document.getElementById('awardModal').classList.add('open');
    await ariaSay(awardBanner());
  }
}

async function handleStep10(intent) {
  await ariaSay(`The award has been completed. PO-2026-112 is being processed. Is there anything else I can help with?`);
}

window.closeAwardModal = function () {
  document.getElementById('awardModal').classList.remove('open');
};

/* ── Welcome ── */
async function showWelcome() {
  await ariaSay(`Hi, I'm <strong>Aria</strong> — your AI sourcing copilot. What would you like to source today?`);
}

/* ── UI Updates ── */
function updateChips() {
  const el = document.getElementById('chips');
  const chips = CHIPS[S.step] || [];
  el.innerHTML = chips.map(c => `<button class="chip" data-chip="${esc(c)}">${esc(c)}</button>`).join('');
  el.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('userInput').value = btn.dataset.chip;
      send();
    });
  });
}

function updateUI() {
  document.getElementById('stepIndicator').textContent = `Step ${S.step} · ${STEP_LABELS[S.step]}`;
  updateChips();
  document.querySelectorAll('.demo-nav-step').forEach((btn, i) => {
    btn.classList.toggle('active', i === S.step);
  });
}

function render() {
  const el = document.getElementById('messages');
  el.innerHTML = '';
  S.messages.forEach(m => appendMessage(m.role, m.html));
  updateUI();
  scrollBottom();
}

/* ── Demo Navigator ── */
function initDemoNav() {
  const stepsEl = document.getElementById('demoNavSteps');
  stepsEl.innerHTML = STEP_LABELS.map((label, i) =>
    `<button class="demo-nav-step" data-step="${i}">${i}. ${label}</button>`
  ).join('');

  document.getElementById('demoNavToggle').addEventListener('click', () => {
    document.getElementById('demoNavPanel').classList.toggle('open');
  });

  stepsEl.addEventListener('click', e => {
    const btn = e.target.closest('.demo-nav-step');
    if (!btn) return;
    jumpToStep(parseInt(btn.dataset.step, 10));
    document.getElementById('demoNavPanel').classList.remove('open');
  });
}

async function jumpToStep(target) {
  S = defaultState();
  S.step = target;

  if (target >= 1) {
    S.messages.push({ role: 'user', html: 'Source 80 laptops for Bangalore & Mumbai', t: now() });
    S.messages.push({ role: 'aria', html: metadataCard(), t: now() });
  }
  if (target >= 2) {
    S.messages.push({ role: 'user', html: 'Yes, looks good', t: now() });
    S.messages.push({ role: 'aria', html: eventDetailsCard(), t: now() });
  }
  if (target >= 3) {
    S.messages.push({ role: 'user', html: 'Yes, proceed', t: now() });
    S.messages.push({ role: 'aria', html: rfqPreviewCard(), t: now() });
  }
  if (target >= 4) {
    S.messages.push({ role: 'user', html: 'Upload attachments', t: now() });
    S.messages.push({ role: 'aria', html: uploadCard(), t: now() });
  }
  if (target >= 5) {
    S.uploadDone = true;
    S.messages.push({ role: 'user', html: 'Show price benchmarks', t: now() });
    S.messages.push({ role: 'aria', html: benchmarkCard(), t: now() });
  }
  if (target >= 6) {
    S.messages.push({ role: 'user', html: 'Show suppliers', t: now() });
    S.messages.push({ role: 'aria', html: supplierCard(), t: now() });
  }
  if (target >= 7) {
    S.selectedNums = [1, 2, 5];
    S.messages.push({ role: 'user', html: 'Add 1, 2, 5', t: now() });
    S.messages.push({ role: 'aria', html: `Got it — I'll invite <strong>Dell Technologies, HP Enterprise, Ingram Micro</strong> (3 suppliers).`, t: now() });
    S.messages.push({ role: 'aria', html: deadlineCard(), t: now() });
  }
  if (target >= 8) {
    S.rfqPublished = true;
    S.messages.push({ role: 'user', html: 'Yes, 21 Aug works', t: now() });
    S.messages.push({ role: 'aria', html: publishCard(), t: now() });
  }
  if (target >= 9) {
    S.messages.push({ role: 'user', html: '3 — Monitor responses', t: now() });
    S.messages.push({ role: 'aria', html: monitorCard(), t: now() });
  }
  if (target >= 10) {
    S.awardDone = true;
    S.messages.push({ role: 'user', html: 'Proceed to award', t: now() });
    S.messages.push({ role: 'aria', html: awardBanner(), t: now() });
  }

  saveState();
  render();
}

/* ── Send ── */
function send() {
  const input = document.getElementById('userInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  handleInput(text);
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sendBtn').addEventListener('click', send);
  document.getElementById('userInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') send();
  });

  initDemoNav();
  render();

  if (S.messages.length === 0) showWelcome();
});
