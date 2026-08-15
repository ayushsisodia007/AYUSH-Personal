'use strict';

/* ═══════════════════════════════════════════
   Aria — AI Sourcing Copilot  ·  app.js
   ═══════════════════════════════════════════ */

const STATE_KEY = 'aria_v8_state';
const LEGACY_STATE_KEYS = ['aria_v4_state', 'aria_v5_state', 'aria_v6_state', 'aria_v7_state'];

const EVENT_CATEGORY = 'Office Furniture';
const EVENT_ITEM_NAME = 'Ergonomic Office Chair';
const EVENT_ITEM_DESC = 'Adjustable lumbar support, 3D armrests, breathable mesh back, adjustable seat height, minimum 3-year warranty';

const TARGET_PRICE = 14500;
const BENCHMARK_MIN = 12800;
const BENCHMARK_MAX = 16200;

const DEADLINE_DEFAULT = { date: '21 Aug 2026', time: '5:00 PM IST' };

const SUPPLIER_DATA = [
  { id: 1, name: 'Featherlite Ergo', score: 92, contact: 'Anita Desai', email: 'anita.desai@featherlite.com', source: 'Internal', recommended: true,
    onTime: 96, pastPOs: 9,
    rationale: 'Leading ergonomic chair specialist. Strongest track record for bulk office fit-outs in Bangalore.' },
  { id: 2, name: 'Godrej Interio', score: 89, contact: 'Rahul Mehta', email: 'rahul.mehta@godrejinterio.com', source: 'Internal',
    onTime: 94, pastPOs: 7,
    rationale: 'Premium build quality with pan-India service network. Competitive on warranty and assembly.' },
  { id: 3, name: 'Durian Industries', score: 86, contact: 'Priya Nair', email: 'priya.nair@durian.in', source: 'Internal',
    onTime: 91, pastPOs: 5,
    rationale: 'Cost-effective mesh chairs with good ergonomic certifications. Reliable for large-volume orders.' },
  { id: 4, name: 'Nilkamal Furniture', score: 82, contact: 'Vikram Shah', email: 'vikram.shah@nilkamal.com', source: 'Internal',
    onTime: 88, pastPOs: 4,
    rationale: 'Value-oriented option with fast delivery. Suitable for standard ergonomic requirements.' },
  { id: 5, name: 'Spacewood Solutions', score: 80, contact: 'Deepa Krishnan', email: 'deepa.krishnan@spacewood.in', source: 'AI Discovered',
    onTime: 87, pastPOs: 0,
    rationale: 'AI-discovered vendor with competitive mesh chair portfolio and GST-compliant billing.' },
  { id: 6, name: 'Wipro Furniture', score: 78, contact: 'Arjun Reddy', email: 'arjun.reddy@wiprofurniture.com', source: 'AI Discovered',
    onTime: 85, pastPOs: 0,
    rationale: 'Enterprise furniture supplier with custom configuration options for ergonomic seating.' },
  { id: 7, name: 'Urban Ladder Business', score: 75, contact: 'Sneha Rao', email: 'sneha.rao@urbanladder.com', source: 'AI Discovered',
    onTime: 83, pastPOs: 0,
    rationale: 'Emerging B2B player with modern designs. Aggressive pricing on bulk chair orders.' },
];

const BID_RESPONSES = {
  1: { up: 13800, model: 'Optima Max Mesh', del: '10 days', war: '3 yr onsite', gst: 'Yes', pay: 'Net 45', amc: '₹850/yr', score: 92,
    lumbar: 'Adjustable lumbar', armrests: '3D adjustable', mesh: 'Breathable mesh', assembly: 'Included', hist: '96/100' },
  2: { up: 14200, model: 'Interio ErgoPro', del: '12 days', war: '3 yr onsite', gst: 'Yes', pay: 'Net 30', amc: '₹920/yr', score: 89,
    lumbar: 'Adjustable lumbar', armrests: '3D adjustable', mesh: 'Breathable mesh', assembly: 'Included', hist: '90/100' },
  3: { up: 14500, model: 'Durian FlexiMesh X', del: '14 days', war: '3 yr carry-in', gst: 'Yes', pay: 'Net 45', amc: '₹780/yr', score: 86,
    lumbar: 'Adjustable lumbar', armrests: '2D adjustable', mesh: 'Breathable mesh', assembly: 'On request', hist: '85/100' },
  4: { up: 14800, model: 'Nilkamal Thames', del: '11 days', war: '3 yr carry-in', gst: 'Yes', pay: 'Net 60', amc: '₹700/yr', score: 82,
    lumbar: 'Fixed lumbar', armrests: 'Adjustable', mesh: 'Mesh back', assembly: 'Extra charge', hist: '82/100' },
};

const SUPPLIER_ALIASES = {
  featherlite: 1, godrej: 2, interio: 2, durian: 3, nilkamal: 4,
  spacewood: 5, wipro: 6, urban: 7, ladder: 7,
};

const INTERNAL_BENCHMARKS = [
  { po: 'PO-2025-112', date: 'Feb 2025', supplier: 'Featherlite Ergo', item: 'Ergonomic Mesh Chair', price: 13600, qty: 80, conf: 92 },
  { po: 'PO-2024-087', date: 'Oct 2024', supplier: 'Godrej Interio', item: 'ErgoPro Executive', price: 14100, qty: 60, conf: 88 },
  { po: 'PO-2024-044', date: 'Jun 2024', supplier: 'Durian Industries', item: 'FlexiMesh Standard', price: 13900, qty: 100, conf: 80 },
  { po: 'PO-2023-219', date: 'Mar 2023', supplier: 'Nilkamal Furniture', item: 'Thames Mesh Chair', price: 12800, qty: 50, conf: 72 },
  { po: 'PO-2023-156', date: 'Jan 2023', supplier: 'Featherlite Ergo', item: 'Optima Lite Mesh', price: 13200, qty: 40, conf: 68 },
];

const EXTERNAL_BENCHMARKS = [
  { source: 'Amazon Business', ref: 'Ergonomic Mesh Chair (3D arms)', price: 14999, conf: 85, link: 'amazon.in' },
  { source: 'Flipkart B2B', ref: 'Executive Mesh Chair Pro', price: 14250, conf: 78, link: 'flipkart.com' },
  { source: 'IndustryBuy', ref: 'Office Ergo Chair — Lumbar', price: 15100, conf: 82, link: 'industrybuy.com' },
  { source: 'Udaan Business', ref: 'Mesh Back Task Chair', price: 13890, conf: 70, link: 'udaan.com' },
];

const LINE_ITEMS = [
  { item: EVENT_ITEM_NAME, desc: EVENT_ITEM_DESC, uom: 'Units', qty: 120, category: EVENT_CATEGORY, location: 'Bangalore' },
];

function getRfqQuestions() {
  const location = getLocationsLabel();
  return [
    'Please confirm the exact ergonomic chair model and specifications you are quoting (lumbar support, armrests, mesh back, seat height).',
    `What is your delivery timeline to ${location}?`,
    `Do you include on-site assembly and installation at our ${location} office? If yes, please provide pricing.`,
    'What is the warranty period? Please confirm minimum 3-year warranty with coverage details (onsite vs carry-in).',
    'Please confirm GST treatment and provide your GSTIN for invoicing.',
    'What are your payment terms? Do you accept 30/60/90 day credit?',
  ];
}

const STEP_LABELS = [
  'Welcome', 'Requirement Captured', 'Metadata Confirmed', 'RFQ Preview',
  'Attachments', 'RFQ Created', 'Price Benchmarks', 'Supplier Panel', 'Deadline Confirmation',
  'RFQ Published', 'Monitor Responses', 'Award',
];

const CHIPS = {
  0: [],
  1: ['Yes, looks good', 'Add more line items', 'Change quantity'],
  2: ['Yes, proceed', 'Edit event name', 'Change a question'],
  3: ['Upload attachments', 'Create without attachments'],
  4: ['Done uploading'],
  5: ['Proceed to benchmarks', 'Yes, proceed'],
  6: ['Show suppliers', 'Yes, proceed'],
  7: ['Add 1, 2, 3', 'Add all', 'Show more details'],
  8: ['Yes, 21 Aug works', 'Change to 25 Aug'],
  9: [],
  10: ['Proceed to award'],
  11: [],
};

let S = loadState();

function defaultState() {
  return {
    step: 0,
    chatStarted: false,
    messages: [],
    userPrompt: '',
    eventName: 'Office Chairs Sourcing — Bangalore — Aug 2026',
    eventCategory: EVENT_CATEGORY,
    suppliers: {},
    selectedNums: [],
    awardDone: false,
    rfqPublished: false,
    uploadDone: false,
    rfqCreated: false,
    deadlineDate: DEADLINE_DEFAULT.date,
    deadlineTime: DEADLINE_DEFAULT.time,
    uploadedFiles: [],
    lineItems: [],
    locations: [],
    targetPrice: TARGET_PRICE,
    benchmarkMin: BENCHMARK_MIN,
    benchmarkMax: BENCHMARK_MAX,
    responsesNotified: false,
    awaitingAnalysisConsent: false,
    analysisComplete: false,
  };
}

let responsesTimer = null;
const RESPONSES_MSG = '<p>🎉 4 supplier responses received.</p><p>I\'ve received responses in different formats. Would you like me to analyze and compare them??</p>';

function isStaleHardwareData(value) {
  const blob = JSON.stringify(value || '').toLowerCase();
  return /\b(laptop|laptops|dell|hp enterprise|intel|windows|512gb|16gb ram|it hardware|it equipment|latitude|thinkpad|elitebook|ingram micro|business laptop)\b/.test(blob);
}

function normalizeLineItems(items) {
  if (!items || !items.length || isStaleHardwareData(items)) return LINE_ITEMS.map(li => ({ ...li }));
  return items.map(li => ({
    item: EVENT_ITEM_NAME,
    desc: li.desc && !isStaleHardwareData(li.desc) ? li.desc : EVENT_ITEM_DESC,
    uom: li.uom || 'Units',
    qty: li.qty || 120,
    category: EVENT_CATEGORY,
    location: li.location || 'Bangalore',
  }));
}

function loadState() {
  LEGACY_STATE_KEYS.forEach(key => localStorage.removeItem(key));
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return defaultState();
    const state = JSON.parse(raw);
    if (isStaleHardwareData(state)) return defaultState();
    state.lineItems = normalizeLineItems(state.lineItems);
    state.eventCategory = EVENT_CATEGORY;
    if (!state.eventName || isStaleHardwareData(state.eventName)) {
      const loc = (state.locations && state.locations[0]) || 'Bangalore';
      state.eventName = `Office Chairs Sourcing — ${loc} — Aug 2026`;
    }
    state.targetPrice = TARGET_PRICE;
    state.benchmarkMin = BENCHMARK_MIN;
    state.benchmarkMax = BENCHMARK_MAX;
    return state;
  } catch (_) { /* ignore */ }
  return defaultState();
}

function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify(S));
}

function hardReset() {
  if (responsesTimer) clearTimeout(responsesTimer);
  responsesTimer = null;
  LEGACY_STATE_KEYS.forEach(key => localStorage.removeItem(key));
  localStorage.removeItem(STATE_KEY);
  S = defaultState();
  showLanding();
  render();
}

window.hardReset = hardReset;

function formatPrice(n) {
  return '₹' + n.toLocaleString('en-IN');
}

function getTotalQty() {
  return getLineItems().reduce((s, l) => s + l.qty, 0);
}

function formatLakhs(amount) {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  return formatPrice(amount);
}

function calcSavingsVsTarget(unitPrice) {
  return (S.targetPrice - unitPrice) * getTotalQty();
}

function formatSavingsAmount(amount) {
  const abs = Math.abs(amount);
  if (abs >= 100000) return `₹${(abs / 100000).toFixed(2)}L`;
  return formatPrice(abs);
}

function getDeadlineLabel() {
  return `${S.deadlineDate}, ${S.deadlineTime}`;
}

async function showRfqCreated() {
  S.rfqCreated = true;
  S.step = 5;
  saveState();
  updateUI();
  await ariaSay(rfqCreatedCard());
}

function confClass(c) {
  if (c >= 80) return 'high';
  if (c >= 65) return 'mid';
  return 'low';
}

function validatePrompt(text) {
  const trimmed = text.trim();
  if (trimmed.length < 40) return { ok: false, msg: 'Please describe your requirement in more detail.' };
  const newlineLines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
  const sentences = trimmed.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 8);
  if (newlineLines.length < 2 && sentences.length < 2) {
    return { ok: false, msg: 'Please include quantity, delivery location(s), and specs (2–3 sentences is fine).' };
  }
  if (!/\b(bangalore|mumbai|delhi|hyderabad|chennai|pune|india)\b/i.test(trimmed)) {
    return { ok: false, msg: 'Please mention at least one delivery location.' };
  }
  return { ok: true };
}

function parseRequirement(text) {
  const t = text;
  const specs = [];
  if (/lumbar|adjustable\s+lumbar/i.test(t)) specs.push('Adjustable lumbar support');
  if (/3d\s*armrest|3-d\s*armrest/i.test(t)) specs.push('3D armrests');
  if (/mesh|breathable/i.test(t)) specs.push('Breathable mesh back');
  if (/seat\s*height|height\s*adjust/i.test(t)) specs.push('Adjustable seat height');
  if (/3\s*year|three\s*year|minimum\s*3/i.test(t)) specs.push('Minimum 3-year warranty');
  if (/ergonomic/i.test(t)) specs.push('Ergonomic design');
  const desc = specs.length ? specs.join(', ') : EVENT_ITEM_DESC;

  const lineItems = [];
  const locRegex = /(\d+)\s+(?:should be (?:delivered )?to|to be delivered to|to|for)\s+(\w+)(?:\s*\(([^)]+)\))?/gi;
  let match;
  while ((match = locRegex.exec(t)) !== null) {
    const city = match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase();
    const office = match[3] ? ` (${match[3]})` : '';
    lineItems.push({
      item: EVENT_ITEM_NAME,
      desc,
      uom: 'Units',
      qty: parseInt(match[1], 10),
      category: EVENT_CATEGORY,
      location: city + office,
    });
  }

  if (lineItems.length === 0) {
    const segments = t.split(/\band\b/i);
    for (const seg of segments) {
      const m = seg.match(/(\d+).*?(bangalore|mumbai|delhi|hyderabad|chennai|pune)/i);
      if (m) {
        const office = seg.match(/\(([^)]+)\)/);
        const city = m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase();
        lineItems.push({
          item: EVENT_ITEM_NAME,
          desc,
          uom: 'Units',
          qty: parseInt(m[1], 10),
          category: EVENT_CATEGORY,
          location: office ? `${city} (${office[1]})` : city,
        });
      }
    }
  }

  if (lineItems.length === 0) {
    const qtyMatch = t.match(/(\d+)\s*(?:ergonomic\s+)?(?:office\s+)?chairs?/i);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 120;
    let location = 'Bangalore';
    if (/\bmumbai\b/i.test(t)) location = 'Mumbai';
    else if (/\bbangalore\b/i.test(t)) location = 'Bangalore';
    lineItems.push({ item: EVENT_ITEM_NAME, desc, uom: 'Units', qty, category: EVENT_CATEGORY, location });
  }

  const locations = [...new Set(lineItems.map(li => li.location))];
  return { lineItems, locations };
}

function getLineItems() {
  return normalizeLineItems(S.lineItems && S.lineItems.length ? S.lineItems : LINE_ITEMS);
}

function getEventCategory() {
  return S.eventCategory || EVENT_CATEGORY;
}

function getLocationsLabel() {
  if (S.locations && S.locations.length) return S.locations.join(', ');
  return 'Bangalore';
}

function showLanding() {
  document.getElementById('landing').classList.remove('hidden');
  document.getElementById('messages').classList.add('hidden');
  document.getElementById('inputArea').classList.add('hidden');
  document.getElementById('chatTitle').textContent = 'New Sourcing Event';
  document.getElementById('stepIndicator').textContent = 'Welcome';
}

function showChat() {
  document.getElementById('landing').classList.add('hidden');
  document.getElementById('messages').classList.remove('hidden');
  document.getElementById('inputArea').classList.remove('hidden');
}

async function startChat(prompt) {
  const parsed = parseRequirement(prompt);
  S.chatStarted = true;
  S.userPrompt = prompt;
  S.lineItems = parsed.lineItems;
  S.locations = parsed.locations;
  S.eventCategory = EVENT_CATEGORY;
  const locLabel = parsed.locations.join(' & ');
  S.eventName = `Office Chairs Sourcing — ${locLabel} — Aug 2026`;
  document.getElementById('chatTitle').textContent = S.eventName;
  showChat();
  addMsg('user', prompt);
  S.step = 1;
  saveState();
  updateUI();
  await ariaSay(`Thanks! I've parsed your requirement for <strong>${esc(locLabel)}</strong>. Here's what I understood:`);
  await ariaSay(metadataCard());
}

/* ── NLP Parser ── */
function nlp(text) {
  const t = text.toLowerCase().trim();

  if (/\b(yes|looks good|correct|sounds good|proceed|go ahead|sure|okay|ok|confirm|yep|great|perfect|done|approved)\b/.test(t))
    return { type: 'confirm' };

  if (/\b(attach|upload|document|file|spec sheet|sow|quote)\b/.test(t))
    return { type: 'upload' };

  if (/\b(benchmark|price benchmark|show benchmark)\b/.test(t))
    return { type: 'benchmark' };

  if (/\b(skip|no attach|without|no attachment|without attachments|create without)\b/.test(t))
    return { type: 'skip' };

  if (/\b(monitor|response|view response|analyse|analysis|analyz)\b/.test(t))
    return { type: 'monitor' };

  if (/\b(remind|send reminder)\b/.test(t))
    return { type: 'remind' };

  if (/\b(extend|extension|more time)\b/.test(t))
    return { type: 'extend' };

  if (/\b(why|reason|why not|explain|difference)\b/.test(t) && !/\b(compare|vs\.?|versus)\b/.test(t))
    return { type: 'why' };

  if (/\b(compare|vs\.?|versus)\b/.test(t) || (Object.keys(SUPPLIER_ALIASES).filter(a => t.includes(a)).length >= 2))
    return { type: 'compare' };

  if (/\b(award|proceed to award|confirm award|select featherlite|go with featherlite)\b/.test(t))
    return { type: 'award' };

  if (/\b(add all|select all|all supplier|all vendor|invite all)\b/.test(t))
    return { type: 'addAll' };

  if (/\b(supplier|show supplier|vendor)\b/.test(t))
    return { type: 'suppliers' };

  if (/\b(publish|send rfq|go live)\b/.test(t))
    return { type: 'publish' };

  if (/\b(chair|furniture|ergonomic|office|source|rfq|procure|buy|purchase)\b/.test(t))
    return { type: 'requirement' };

  if (/\b(25 aug|august 25|25th)\b/.test(t))
    return { type: 'deadline', date: '25 Aug 2026', time: '5:00 PM IST' };

  if (/\b(21 aug|august 21|21st)\b/.test(t))
    return { type: 'deadline', date: '21 Aug 2026', time: '5:00 PM IST' };

  const nums = [...t.matchAll(/\b([1-7])\b/g)].map(m => parseInt(m[1], 10));
  if (nums.length > 0 && /\b(add|select|invite|pick|choose|include)\b/.test(t))
    return { type: 'numbered', nums: [...new Set(nums)] };

  const names = { featherlite: 1, godrej: 2, interio: 2, durian: 3, nilkamal: 4, spacewood: 5, wipro: 6, urban: 7, ladder: 7 };
  for (const [key, id] of Object.entries(names)) {
    if (t.includes(key)) return { type: 'named', id };
  }

  if (/^([1-3])\b/.test(t)) {
    const n = parseInt(t[0], 10);
    if (S.step === 9) {
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
  if (role === 'aria') bindMessageEvents();
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
  const items = getLineItems();
  const totalQty = getTotalQty();
  const rows = items.map(li => `
    <tr>
      <td>${li.item}</td>
      <td>${li.desc}</td>
      <td>${li.uom}</td>
      <td>${li.qty}</td>
      <td>${li.category}</td>
      <td>${li.location}</td>
    </tr>`).join('');

  return `<div class="card">
    <div class="card-header">📋 Requirement Summary</div>
    <div class="card-body">
      <div class="card-meta">
        <div class="meta-item"><label>Category</label><span>${getEventCategory()}</span></div>
        <div class="meta-item"><label>Item</label><span>${EVENT_ITEM_NAME}</span></div>
        <div class="meta-item"><label>Total Quantity</label><span>${totalQty} chairs</span></div>
        <div class="meta-item"><label>Event Currency</label><span>INR (₹)</span></div>
        <div class="meta-item"><label>Delivery Locations</label><span>${getLocationsLabel()}</span></div>
        <div class="meta-item"><label>Total Line Items</label><span>${items.length}</span></div>
      </div>
      <table class="data-table">
        <thead><tr><th>Item</th><th>Description</th><th>UOM</th><th>Qty</th><th>Category</th><th>Delivery Location</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>
  <p>Does this look correct?</p>`;
}

function eventDetailsCard() {
  const items = getLineItems();
  const totalQty = getTotalQty();
  const questions = getRfqQuestions().map((q, i) => `
    <div class="rfq-question">
      <div class="q-num">Q${i + 1}</div>
      <div class="q-text">${q}</div>
    </div>`).join('');

  return `<p>Great! Let me set up the event details and RFQ questions for your <strong>${getEventCategory()}</strong> requirement.</p>
  <div class="card">
    <div class="card-header">📝 Event Details</div>
    <div class="card-body">
      <div class="card-meta">
        <div class="meta-item meta-item-wide"><label>Event Name</label><input type="text" value="${esc(S.eventName)}" id="eventNameInput" class="event-name-input"></div>
        <div class="meta-item"><label>Category</label><span>${getEventCategory()}</span></div>
        <div class="meta-item"><label>Item</label><span>${EVENT_ITEM_NAME}</span></div>
        <div class="meta-item"><label>Quantity</label><span>${totalQty} chairs</span></div>
        <div class="meta-item"><label>Delivery</label><span>${getLocationsLabel()}</span></div>
      </div>
      <h4 style="font-size:13px;font-weight:600;margin:16px 0 8px;">RFQ Questions</h4>
      ${questions}
    </div>
  </div>
  <p>Shall I proceed to generate the RFQ preview?</p>`;
}

function rfqPreviewCard() {
  const items = getLineItems();
  const totalQty = getTotalQty();
  const itemRows = items.map((li, i) => `
    <tr><td>${i + 1}</td><td>${li.item}</td><td>${li.desc}</td><td>${li.uom}</td><td>${li.qty}</td><td>${li.location}</td></tr>`).join('');

  const qRows = getRfqQuestions().map((q, i) => `
    <div class="rfq-question"><div class="q-num">Q${i + 1}</div><div class="q-text">${q}</div></div>`).join('');

  return `<p>Here's your RFQ document preview for <strong>${totalQty} ergonomic office chairs</strong>:</p>
  <div class="rfq-doc">
    <div class="rfq-header">
      <h2>${S.eventName}</h2>
      <p>Request for Quotation · ${getEventCategory()} · Issued ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
    <div class="rfq-body">
      <div class="rfq-section">
        <h3>Event Details</h3>
        <div class="rfq-grid">
          <div class="rfq-field"><label>Event Name</label><span>${S.eventName}</span></div>
          <div class="rfq-field"><label>Category</label><span>${getEventCategory()}</span></div>
          <div class="rfq-field"><label>Item</label><span>${EVENT_ITEM_NAME}</span></div>
          <div class="rfq-field"><label>Currency</label><span>INR (₹)</span></div>
          <div class="rfq-field"><label>Delivery Locations</label><span>${getLocationsLabel()}</span></div>
          <div class="rfq-field"><label>Total Items</label><span>${items.length} line item${items.length > 1 ? 's' : ''}</span></div>
          <div class="rfq-field"><label>Total Quantity</label><span>${totalQty} chairs</span></div>
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
  <p>Would you like to upload any attachments, or shall we create the RFQ without attachments?</p>`;
}

function uploadCard() {
  const files = S.uploadedFiles || [];
  const done = files.length > 0;
  const fileList = files.map((f, i) => `
    <div class="upload-file-item" data-idx="${i}">
      <div class="file-info">📄 <strong>${esc(f.name)}</strong> <span style="color:#64748B">(${formatFileSize(f.size)})</span></div>
      <button class="file-remove" data-remove="${i}">Remove</button>
    </div>`).join('');

  return `<p>${done ? `${files.length} file${files.length > 1 ? 's' : ''} attached successfully.` : 'Upload supporting documents for this RFQ — spec sheets, SOWs, or evaluation criteria.'}</p>
  <div class="card">
    <div class="card-header">📎 Attachments</div>
    <div class="card-body">
      <div class="upload-wizard ${done ? 'done' : ''}" id="uploadZone" data-upload-zone>
        <div class="upload-wizard-icon">${done ? '✅' : '📁'}</div>
        <div class="upload-wizard-text">${done ? 'Files attached — click to add more' : 'Drag & drop files here, or click to browse'}</div>
        <div class="upload-wizard-text" style="font-size:12px;margin-top:4px;">PDF, DOC, XLS, PPT, images up to 10 MB each</div>
        <span class="upload-wizard-btn">Choose files</span>
      </div>
      ${done ? `<div class="upload-file-list" id="uploadFileList">${fileList}</div>` : ''}
    </div>
  </div>
  <p>${done ? 'Click "Done uploading" when finished, or add more files.' : 'Attach your files, then click "Done uploading" when ready.'}</p>`;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function rfqCreatedCard() {
  const attachNote = S.uploadedFiles.length
    ? `${S.uploadedFiles.length} attachment${S.uploadedFiles.length > 1 ? 's' : ''} included in the RFQ.`
    : 'RFQ created without attachments.';
  return `<p>Your RFQ has been created successfully!</p>
  <div class="card">
    <div class="card-body">
      <div class="publish-card">
        <div class="publish-icon">✅</div>
        <div class="publish-status">RFQ Created Successfully</div>
        <p style="font-size:14px;font-weight:500;margin:8px 0;">${esc(S.eventName)}</p>
        <p style="font-size:13px;color:#64748B;">${attachNote}</p>
      </div>
    </div>
  </div>
  <p>Shall we proceed to price benchmarks?</p>`;
}

function benchmarkCard() {
  const internalRows = INTERNAL_BENCHMARKS.map(b => `
    <tr>
      <td><span class="po-badge">${b.po}</span></td>
      <td>${b.date}</td>
      <td>${b.supplier}</td>
      <td>${b.item}</td>
      <td>${formatPrice(b.price)}</td>
      <td>${b.qty}</td>
      <td><div class="conf-bar-cell"><div class="conf-bar-mini"><div class="fill ${confClass(b.conf)}" style="width:${b.conf}%"></div></div><span>${b.conf}%</span></div></td>
    </tr>`).join('');

  const externalRows = EXTERNAL_BENCHMARKS.map(b => `
    <tr>
      <td>${b.source}</td>
      <td>${b.ref}</td>
      <td>${formatPrice(b.price)}</td>
      <td><div class="conf-bar-cell"><div class="conf-bar-mini"><div class="fill ${confClass(b.conf)}" style="width:${b.conf}%"></div></div><span>${b.conf}%</span></div></td>
      <td><a href="https://${b.link}" target="_blank" rel="noopener" style="color:var(--primary);font-size:12px;">${b.link}</a></td>
    </tr>`).join('');

  const minPct = 0;
  const targetPct = ((S.targetPrice - BENCHMARK_MIN) / (BENCHMARK_MAX - BENCHMARK_MIN)) * 100;
  const maxPct = 100;

  return `<p>Here are the price benchmarks for <strong>ergonomic office chairs</strong> — internal PO history and live external market data for mesh executive seating.</p>
  <div class="card">
    <div class="card-header bench-card-header">
      <span>📊 PRICE BENCHMARKING — ${getEventCategory()}</span>
      <span class="bench-badge">AI Analysed</span>
    </div>
    <div class="card-body">
      <div class="bench-section-title">📁 Internal — Historical PO References</div>
      <table class="data-table">
        <thead><tr><th>PO Number</th><th>Date</th><th>Supplier</th><th>Item</th><th>Unit Price (₹)</th><th>Qty</th><th>Confidence</th></tr></thead>
        <tbody>${internalRows}</tbody>
      </table>

      <div class="bench-section-title">🌐 External — Market References</div>
      <table class="data-table">
        <thead><tr><th>Source</th><th>Reference</th><th>Unit Price (₹)</th><th>Confidence</th><th>Link</th></tr></thead>
        <tbody>${externalRows}</tbody>
      </table>

      <div class="bench-target-section">
        <div class="bench-section-title">🎯 Recommended Target Price</div>
        <div class="bench-scale-labels">
          <span>Min: ${formatPrice(BENCHMARK_MIN)}</span>
          <span>Target: ${formatPrice(S.targetPrice)}</span>
          <span>Max: ${formatPrice(BENCHMARK_MAX)}</span>
        </div>
        <div class="bench-target-scale">
          <div class="bench-scale-line"></div>
          <div class="bench-scale-dot min" style="left:${minPct}%"></div>
          <div class="bench-scale-dot target" style="left:${targetPct}%"></div>
          <div class="bench-scale-dot max" style="left:${maxPct}%"></div>
        </div>
        <div class="bench-target-text">
          Based on <strong>5 internal chair POs</strong> and <strong>4 market references</strong> for ergonomic mesh chairs, I recommend a target benchmark of <strong>${formatPrice(S.targetPrice)}/chair</strong> — this gives you room to negotiate while remaining competitive. This target will be used to analyse supplier responses during bid monitoring.
        </div>
      </div>
    </div>
  </div>
  <p>Based on this, I recommend a target of <strong>${formatPrice(S.targetPrice)}/chair</strong> for ${getTotalQty()} ergonomic office chairs. Say "proceed" when you are ready to move to supplier discovery.</p>`;
}

function supplierTableRow(s) {
  const rec = s.recommended ? ' recommended-row' : '';
  const badges = s.recommended ? ' <span class="tag recommended">★ Aria Recommends</span>' : '';
  const srcTag = s.source === 'Internal'
    ? '<span class="tag internal">Internal</span>'
    : '<span class="tag ai">AI Discovered</span>';
  return `<tr class="${rec}">
    <td><strong>${s.id}</strong></td>
    <td><div class="sup-name">${s.name}${badges}</div></td>
    <td>${srcTag}</td>
    <td>${s.onTime}%</td>
    <td>${s.pastPOs || '—'}</td>
    <td><div class="sup-rationale">💡 ${s.rationale}</div></td>
    <td><div class="sup-contact">👤 ${s.contact}<br>✉️ ${s.email}</div></td>
    <td><strong style="color:var(--primary)">${s.score}</strong>/100</td>
  </tr>`;
}

function supplierCard() {
  const internal = SUPPLIER_DATA.filter(s => s.source === 'Internal');
  const ai = SUPPLIER_DATA.filter(s => s.source === 'AI Discovered');
  const locLabel = getLocationsLabel();
  const totalQty = getTotalQty();

  return `<p>I've identified <strong>7 furniture suppliers</strong> for your <strong>${totalQty} ergonomic office chairs</strong> in ${esc(locLabel)}. Say "add 1, 2, 3" or "add all" to invite them:</p>
  <div class="card">
    <div class="card-header bench-card-header">
      <span>🏢 SUPPLIER DISCOVERY</span>
      <span class="bench-badge">7 suppliers found</span>
    </div>
    <div class="card-body">
      <div class="section-divider">📁 Internal Database Vendors (1–4)</div>
      <div class="supplier-table-wrap">
        <table class="supplier-table">
          <thead><tr><th>#</th><th>Supplier</th><th>Source</th><th>On-time</th><th>Past POs</th><th>Rationale</th><th>Contact</th><th>Score</th></tr></thead>
          <tbody>${internal.map(supplierTableRow).join('')}</tbody>
        </table>
      </div>
      <div class="section-divider">🤖 AI Recommended — New Suppliers (5–7)</div>
      <div class="supplier-table-wrap">
        <table class="supplier-table">
          <thead><tr><th>#</th><th>Supplier</th><th>Source</th><th>On-time</th><th>Past POs</th><th>Rationale</th><th>Contact</th><th>Score</th></tr></thead>
          <tbody>${ai.map(supplierTableRow).join('')}</tbody>
        </table>
      </div>
    </div>
  </div>
  <p>Which suppliers would you like to invite? Reference by number (e.g. "add 1, 2, 5") or say "add all".</p>`;
}

function deadlineCard() {
  const d = S.deadlineDate || DEADLINE_DEFAULT.date;
  const t = S.deadlineTime || DEADLINE_DEFAULT.time;
  return `<p>Before I publish, let me confirm the submission deadline:</p>
  <div class="card">
    <div class="card-header">📅 Submission Deadline</div>
    <div class="card-body">
      <div class="deadline-card">
        <div style="font-size:13px;color:#64748B;">Proposed Deadline</div>
        <div class="deadline-date">${d}</div>
        <div class="deadline-time">${t}</div>
        <div class="deadline-reason">This gives suppliers 6 working days to respond — standard for office furniture RFQs of this size. Industry average response time is 5–7 days.</div>
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
        <p style="font-size:13px;color:#64748B;">${esc(S.eventName)} · Deadline: ${getDeadlineLabel()} · ${count} suppliers invited</p>
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

function vsBenchmark(price) {
  const diff = price - S.targetPrice;
  const pct = ((diff / S.targetPrice) * 100).toFixed(1);
  if (diff < -100) return `<span class="vs-benchmark below">${formatPrice(Math.abs(diff))} below target (${pct}%)</span>`;
  if (diff > 100) return `<span class="vs-benchmark above">${formatPrice(diff)} above target (+${pct}%)</span>`;
  return `<span class="vs-benchmark at">At target (${pct}%)</span>`;
}

function getBidRows() {
  return [1, 2, 3, 4].map(id => {
    const sup = SUPPLIER_DATA.find(s => s.id === id);
    const bid = BID_RESPONSES[id];
    return { id, name: sup.name, rec: sup.recommended, ...bid };
  });
}

function monitorCard() {
  const qty = getTotalQty();
  const bids = getBidRows().map(b => ({
    ...b,
    tv: formatLakhs(b.up * qty),
    total: b.up * qty,
  }));

  const lowest = bids.reduce((a, b) => a.up < b.up ? a : b);
  const targetTotal = S.targetPrice * qty;
  const savingsTotal = calcSavingsVsTarget(lowest.up);
  const savingsStr = formatSavingsAmount(savingsTotal);
  const savingsPct = ((savingsTotal / targetTotal) * 100).toFixed(1);

  const compRows = bids.map(r => `<tr class="${r.rec ? 'recommended-row' : ''}">
    <td><strong>${r.name}</strong>${r.rec ? ' <span class="rec-badge">★ Recommended</span>' : ''}</td>
    <td>${formatPrice(r.up)}<br>${vsBenchmark(r.up)}</td>
    <td>${r.tv}</td>
    <td>${r.model}</td>
    <td>${r.del}</td>
    <td>${r.war}</td>
    <td>${r.gst}</td>
    <td>${r.pay}</td>
    <td>${r.amc}</td>
    <td>${r.score}</td>
  </tr>`).join('');

  const insights = `
    <div class="insight-chips">
      <div class="insight-chip">Target Benchmark: <span class="chip-value">${formatPrice(S.targetPrice)}/unit · ${formatLakhs(targetTotal)} total</span></div>
      <div class="insight-chip">Lowest Bid: <span class="chip-value">${lowest.name} · ${formatPrice(lowest.up)}/unit</span></div>
      <div class="insight-chip">Est. Savings: <span class="chip-value">${savingsStr} (${savingsPct}% vs target)</span></div>
      <div class="insight-chip">Responses: <span class="chip-value">4 of ${S.selectedNums.length || 7}</span></div>
    </div>`;

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

  const featherBars = [{ l: 'Price', v: 95 }, { l: 'Delivery', v: 90 }, { l: 'Warranty', v: 92 }, { l: 'Hist. Perf', v: 96 }, { l: 'Ergonomics', v: 94 }];
  const godrejBars = [{ l: 'Price', v: 88 }, { l: 'Delivery', v: 86 }, { l: 'Warranty', v: 90 }, { l: 'Hist. Perf', v: 90 }, { l: 'Ergonomics', v: 91 }];
  const durianBars = [{ l: 'Price', v: 82 }, { l: 'Delivery', v: 80 }, { l: 'Warranty', v: 84 }, { l: 'Hist. Perf', v: 85 }, { l: 'Ergonomics', v: 86 }];

  return `<p>4 supplier responses analysed against your target benchmark of <strong>${formatPrice(S.targetPrice)}/unit</strong>:</p>
  ${insights}
  <div class="card">
    <div class="card-header">📊 Bid Comparison <span class="benchmark-ref">Target: ${formatPrice(S.targetPrice)}/unit</span></div>
    <div class="card-body" style="overflow-x:auto;">
      <table class="data-table comparison-table">
        <thead><tr><th>Supplier</th><th>Unit Price</th><th>Total Value</th><th>Model Offered</th><th>Delivery</th><th>Warranty</th><th>GST Incl.</th><th>Payment</th><th>AMC/yr</th><th>Score</th></tr></thead>
        <tbody>${compRows}</tbody>
      </table>
      <div class="scorecards">
        ${scorecard('Featherlite Ergo', featherBars)}
        ${scorecard('Godrej Interio', godrejBars)}
        ${scorecard('Durian Industries', durianBars)}
      </div>
      <div class="rec-banner">
        <strong>Recommendation: Award to ${lowest.name}</strong> — ${lowest.name} bids <strong>${formatPrice(lowest.up)}/unit</strong> (${formatLakhs(lowest.total)} total), which is <strong>${formatPrice(S.targetPrice - lowest.up)}/unit below</strong> your ${formatPrice(S.targetPrice)} target. Estimated savings of <strong>${savingsStr}</strong> (${savingsPct}%) against the target benchmark of ${formatLakhs(targetTotal)} for ${qty} chairs.
      </div>
    </div>
  </div>
  <p>Ask me to compare any two suppliers (e.g. <em>"Compare Featherlite vs Godrej"</em>), or type <strong>Proceed to award</strong>.</p>`;
}

function scheduleResponsesNotification() {
  if (responsesTimer) clearTimeout(responsesTimer);
  responsesTimer = setTimeout(() => {
    if (S.step !== 9 || S.responsesNotified) return;
    S.responsesNotified = true;
    S.awaitingAnalysisConsent = true;
    saveState();
    addMsg('aria', RESPONSES_MSG);
    scrollBottom();
  }, 15000);
}

function runAnalysisStream(onDone) {
  const lines = [
    'Analyzing 4 responses...',
    '✓ Reading supplier submissions',
    '✓ Extracting pricing & commercial terms',
    '✓ Validating against RFQ requirements',
    '✓ Normalizing responses',
    '4/4 responses analyzed',
  ];
  const wrap = document.createElement('div');
  wrap.className = 'msg aria';
  wrap.innerHTML = `
    <div class="msg-avatar">A</div>
    <div class="msg-body">
      <div class="aria-content"><div class="analysis-stream"></div></div>
    </div>`;
  const stream = wrap.querySelector('.analysis-stream');
  document.getElementById('messages').appendChild(wrap);
  scrollBottom();

  let i = 0;
  function next() {
    if (i >= lines.length) {
      setTimeout(() => {
        wrap.remove();
        S.analysisComplete = true;
        S.awaitingAnalysisConsent = false;
        S.step = 10;
        saveState();
        updateUI();
        onDone();
      }, 400);
      return;
    }
    const el = document.createElement('div');
    el.className = 'analysis-line' + (lines[i].startsWith('✓') ? ' done' : '');
    el.textContent = lines[i];
    stream.appendChild(el);
    scrollBottom();
    i++;
    const delay = i === 1 ? 900 : (i === lines.length ? 1200 : 1100);
    setTimeout(next, delay);
  }
  next();
}

function extractCompareSuppliers(text) {
  const t = text.toLowerCase();
  const found = [];
  for (const [alias, id] of Object.entries(SUPPLIER_ALIASES)) {
    if (t.includes(alias) && !found.includes(id)) found.push(id);
  }
  if (found.length >= 2) return [found[0], found[1]];
  const vs = t.match(/([\w\s]+?)\s+(?:vs\.?|versus|and|&)\s+([\w\s]+)/i);
  if (vs) {
    const a = resolveSupplierId(vs[1].trim());
    const b = resolveSupplierId(vs[2].trim());
    if (a && b && a !== b) return [a, b];
  }
  return null;
}

function resolveSupplierId(fragment) {
  const f = fragment.toLowerCase().trim();
  for (const [alias, id] of Object.entries(SUPPLIER_ALIASES)) {
    if (f.includes(alias) || alias.includes(f)) return id;
  }
  return null;
}

function dynamicCompareCard(id1, id2) {
  const b1 = BID_RESPONSES[id1];
  const b2 = BID_RESPONSES[id2];
  const n1 = SUPPLIER_DATA.find(s => s.id === id1)?.name || 'Supplier A';
  const n2 = SUPPLIER_DATA.find(s => s.id === id2)?.name || 'Supplier B';
  if (!b1 || !b2) return null;

  const qty = getTotalQty();
  const cheaper = b1.up <= b2.up ? { id: id1, name: n1, bid: b1 } : { id: id2, name: n2, bid: b2 };
  const other = cheaper.id === id1 ? { id: id2, name: n2, bid: b2 } : { id: id1, name: n1, bid: b1 };
  const diff = Math.abs(b1.up - b2.up);
  const diffTotal = diff * qty;
  const s1 = calcSavingsVsTarget(b1.up);
  const s2 = calcSavingsVsTarget(b2.up);

  const edge = (v1, v2, higherBetter) => {
    if (v1 === v2) return 'Tie';
    const better = higherBetter ? (v1 > v2 ? n1 : n2) : (v1 < v2 ? n1 : n2);
    return better;
  };

  const criteria = [
    { c: 'Unit Price', v1: formatPrice(b1.up), v2: formatPrice(b2.up), edge: edge(b1.up, b2.up, false) },
    { c: `Total Value (${qty} chairs)`, v1: formatLakhs(b1.up * qty), v2: formatLakhs(b2.up * qty), edge: edge(b1.up, b2.up, false) },
    { c: 'Model', v1: b1.model, v2: b2.model, edge: '—' },
    { c: 'Delivery', v1: b1.del, v2: b2.del, edge: edge(parseInt(b1.del), parseInt(b2.del), false) },
    { c: 'Warranty', v1: b1.war, v2: b2.war, edge: b1.war === b2.war ? 'Tie' : '—' },
    { c: 'Lumbar Support', v1: b1.lumbar, v2: b2.lumbar, edge: '—' },
    { c: 'Armrests', v1: b1.armrests, v2: b2.armrests, edge: '—' },
    { c: 'Payment Terms', v1: b1.pay, v2: b2.pay, edge: '—' },
    { c: 'AMC/yr', v1: b1.amc, v2: b2.amc, edge: edge(parseInt(b1.amc.replace(/\D/g, '')), parseInt(b2.amc.replace(/\D/g, '')), false) },
    { c: 'Match Score', v1: `${b1.score}/100`, v2: `${b2.score}/100`, edge: edge(b1.score, b2.score, true) },
    { c: `vs Target (${formatPrice(S.targetPrice)})`, v1: s1 >= 0 ? `${formatSavingsAmount(s1)} saved` : `${formatSavingsAmount(s1)} over`, v2: s2 >= 0 ? `${formatSavingsAmount(s2)} saved` : `${formatSavingsAmount(s2)} over`, edge: edge(s1, s2, true) },
  ].map(r => `<tr><td>${r.c}</td><td>${r.v1}</td><td>${r.v2}</td><td style="font-weight:600;color:#2563EB">${r.edge}</td></tr>`).join('');

  return `<p>Here's a detailed comparison of <strong>${n1}</strong> vs <strong>${n2}</strong>:</p>
  <div class="card">
    <div class="card-header">🔍 ${n1} vs ${n2}</div>
    <div class="card-body">
      <table class="data-table">
        <thead><tr><th>Criteria</th><th>${n1}</th><th>${n2}</th><th>Edge</th></tr></thead>
        <tbody>${criteria}</tbody>
      </table>
      <div class="compare-verdict">
        <strong>Summary:</strong> ${cheaper.name} is ${formatPrice(diff)}/unit lower (${formatLakhs(diffTotal)} on ${qty} chairs).
        ${cheaper.bid.score >= other.bid.score - 3
    ? ` With a ${cheaper.bid.score}/100 requirement match, ${cheaper.name} offers stronger overall value.`
    : ` However, ${other.name} scores higher on requirement fit (${other.bid.score} vs ${cheaper.bid.score}).`}
      </div>
    </div>
  </div>
  <p>Would you like to compare another pair, or type <strong>Proceed to award</strong>?</p>`;
}

function awardBanner() {
  const qty = getTotalQty();
  const awardUnit = BID_RESPONSES[1].up;
  const awardTotal = formatLakhs(awardUnit * qty);
  const savings = formatSavingsAmount(calcSavingsVsTarget(awardUnit));
  return `<div class="award-banner">
    <h3>🏆 Award Confirmed</h3>
    <div class="award-po">PO-2026-112 · Featherlite Ergo</div>
    <div class="award-value">${awardTotal}</div>
    <div class="award-savings">Estimated savings: ${savings} vs target benchmark</div>
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
    case 7: return handleStep7(intent);
    case 8: return handleStep8(intent, text);
    case 9: return handleStep9(intent);
    case 10: return handleStep10(intent, text);
    case 11: return handleStep11(intent);
  }
}

async function handleStep0(intent, text) {
  if (!S.chatStarted) return;
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
  if (intent.type === 'upload' || intent.type === 'confirm') {
    S.step = 4;
    saveState();
    updateUI();
    await ariaSay(uploadCard());
  } else if (intent.type === 'skip' || intent.type === 'benchmark') {
    S.uploadDone = false;
    S.uploadedFiles = [];
    await showRfqCreated();
  }
}

async function handleStep4(intent) {
  if (intent.type === 'upload') {
    document.getElementById('fileInput').click();
    return;
  }
  if ((intent.type === 'confirm' || intent.type === 'unknown') && S.uploadedFiles.length > 0) {
    S.uploadDone = true;
    saveState();
    await showRfqCreated();
  } else if (intent.type === 'confirm' || intent.type === 'unknown') {
    await ariaSay(`No files attached yet. Click the upload area to browse, then click "Done uploading".`);
  }
}

async function handleStep5(intent) {
  if (intent.type === 'confirm' || intent.type === 'benchmark' || intent.type === 'unknown') {
    S.step = 6;
    saveState();
    updateUI();
    await ariaSay(benchmarkCard());
  }
}

async function handleStep6(intent) {
  if (intent.type === 'confirm' || intent.type === 'suppliers' || intent.type === 'unknown') {
    S.step = 7;
    saveState();
    updateUI();
    await ariaSay(supplierCard());
  }
}

async function handleStep7(intent) {
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
    S.step = 8;
    saveState();
    updateUI();
    await ariaSay(`Got it — I'll invite <strong>${names.join(', ')}</strong> (${S.selectedNums.length} supplier${S.selectedNums.length > 1 ? 's' : ''}).`);
    await ariaSay(deadlineCard());
  } else {
    await ariaSay(`Please specify which suppliers to invite. Say "add 1, 2, 3" or "add all".`);
  }
}

async function handleStep8(intent) {
  if (intent.type === 'deadline') {
    S.deadlineDate = intent.date;
    S.deadlineTime = intent.time || DEADLINE_DEFAULT.time;
    saveState();
    await ariaSay(deadlineCard());
    return;
  }
  if (intent.type === 'confirm' || intent.type === 'unknown' || intent.type === 'publish') {
    S.step = 9;
    S.rfqPublished = true;
    saveState();
    updateUI();
    await ariaSay(publishCard());
    scheduleResponsesNotification();
  }
}

function triggerResponsesNotification() {
  if (S.responsesNotified) return;
  if (responsesTimer) clearTimeout(responsesTimer);
  S.responsesNotified = true;
  S.awaitingAnalysisConsent = true;
  saveState();
  addMsg('aria', RESPONSES_MSG);
}

async function startBidAnalysis() {
  if (S.analysisComplete) {
    S.step = 10;
    saveState();
    updateUI();
    await ariaSay(monitorCard());
    return;
  }
  runAnalysisStream(async () => {
    await ariaSay(monitorCard());
  });
}

async function handleStep9(intent) {
  if (intent.type === 'remind') {
    await ariaSay(`Reminder emails sent to 3 suppliers who haven't responded yet. I'll notify you when they submit their bids.`);
    return;
  }
  if (intent.type === 'extend') {
    S.deadlineDate = '28 Aug 2026';
    S.deadlineTime = '5:00 PM IST';
    saveState();
    await ariaSay(`Deadline extended to <strong>${getDeadlineLabel()}</strong>. All invited suppliers have been notified of the extension.`);
    return;
  }
  if (intent.type === 'monitor') {
    triggerResponsesNotification();
    return;
  }
  if (S.awaitingAnalysisConsent && (intent.type === 'confirm' || intent.type === 'unknown')) {
    await startBidAnalysis();
    return;
  }
  if (S.analysisComplete) {
    S.step = 10;
    saveState();
    updateUI();
    await ariaSay(monitorCard());
  }
}

async function handleStep10(intent, text) {
  if (intent.type === 'award' || (intent.type === 'confirm' && !extractCompareSuppliers(text))) {
    S.step = 11;
    S.awardDone = true;
    saveState();
    updateUI();
    document.getElementById('awardModal').classList.add('open');
    await ariaSay(awardBanner());
    return;
  }
  const pair = extractCompareSuppliers(text);
  if (pair || intent.type === 'compare' || intent.type === 'why') {
    const ids = pair || [1, 2];
    const card = dynamicCompareCard(ids[0], ids[1]);
    if (card) await ariaSay(card);
  }
}

async function handleStep11(intent) {
  await ariaSay(`The award has been completed. PO-2026-112 is being processed. Is there anything else I can help with?`);
}

window.closeAwardModal = function () {
  document.getElementById('awardModal').classList.remove('open');
};

/* ── File Upload ── */
function handleFiles(fileList) {
  const maxSize = 10 * 1024 * 1024;
  for (const file of fileList) {
    if (file.size > maxSize) continue;
    if (!S.uploadedFiles.find(f => f.name === file.name && f.size === file.size)) {
      S.uploadedFiles.push({ name: file.name, size: file.size, type: file.type });
    }
  }
  S.uploadDone = S.uploadedFiles.length > 0;
  saveState();
  refreshUploadCard();
}

function refreshUploadCard() {
  const msgs = document.getElementById('messages');
  const cards = msgs.querySelectorAll('.aria-content');
  for (const card of cards) {
    if (card.querySelector('[data-upload-zone]')) {
      card.innerHTML = uploadCard();
      bindUploadEvents();
      return;
    }
  }
}

function bindUploadEvents() {
  const zone = document.querySelector('[data-upload-zone]');
  if (!zone) return;
  zone.addEventListener('click', () => document.getElementById('fileInput').click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  document.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.remove, 10);
      S.uploadedFiles.splice(idx, 1);
      S.uploadDone = S.uploadedFiles.length > 0;
      saveState();
      refreshUploadCard();
    });
  });
}

function bindMessageEvents() {
  bindUploadEvents();
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
  if (S.chatStarted) {
    showChat();
    document.getElementById('chatTitle').textContent = S.eventName;
  } else {
    showLanding();
  }
  const el = document.getElementById('messages');
  el.innerHTML = '';
  S.messages.forEach(m => appendMessage(m.role, m.html));
  updateUI();
  scrollBottom();
  bindMessageEvents();
  if (S.step === 9 && S.rfqPublished && !S.responsesNotified) {
    scheduleResponsesNotification();
  }
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
  if (responsesTimer) clearTimeout(responsesTimer);
  responsesTimer = null;
  S = defaultState();
  S.step = target;
  S.chatStarted = true;
  S.userPrompt = 'We need 120 ergonomic office chairs for our new office in Bangalore. Chairs should have adjustable lumbar support, 3D armrests, breathable mesh back, adjustable seat height, and a minimum 3-year warranty.';
  S.eventName = 'Office Chairs Sourcing — Bangalore — Aug 2026';
  S.eventCategory = EVENT_CATEGORY;
  S.lineItems = LINE_ITEMS;
  S.locations = ['Bangalore'];
  S.uploadedFiles = [{ name: 'Ergonomic_Chair_Spec_Sheet.pdf', size: 2457600, type: 'application/pdf' }];

  if (target >= 1) {
    S.messages.push({ role: 'user', html: S.userPrompt, t: now() });
    S.messages.push({ role: 'aria', html: `<p>Thanks! I've parsed your requirement for <strong>Bangalore</strong>. Here's what I understood:</p>${metadataCard()}`, t: now() });
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
    S.uploadDone = true;
    S.uploadedFiles = [
      { name: 'Ergonomic_Chair_Spec_Sheet.pdf', size: 2457600, type: 'application/pdf' },
      { name: 'Vendor_Evaluation_Criteria.pdf', size: 1100000, type: 'application/pdf' },
    ];
    S.messages.push({ role: 'user', html: 'Upload attachments', t: now() });
    S.messages.push({ role: 'aria', html: uploadCard(), t: now() });
  }
  if (target >= 5) {
    S.rfqCreated = true;
    S.uploadDone = true;
    S.messages.push({ role: 'user', html: 'Done uploading', t: now() });
    S.messages.push({ role: 'aria', html: rfqCreatedCard(), t: now() });
  }
  if (target >= 6) {
    S.messages.push({ role: 'user', html: 'Proceed to benchmarks', t: now() });
    S.messages.push({ role: 'aria', html: benchmarkCard(), t: now() });
  }
  if (target >= 7) {
    S.messages.push({ role: 'user', html: 'Show suppliers', t: now() });
    S.messages.push({ role: 'aria', html: supplierCard(), t: now() });
  }
  if (target >= 8) {
    S.selectedNums = [1, 2, 3];
    S.messages.push({ role: 'user', html: 'Add 1, 2, 3', t: now() });
    S.messages.push({ role: 'aria', html: `Got it — I'll invite <strong>Featherlite Ergo, Godrej Interio, Durian Industries</strong> (3 suppliers).`, t: now() });
    S.messages.push({ role: 'aria', html: deadlineCard(), t: now() });
  }
  if (target >= 9) {
    S.rfqPublished = true;
    S.messages.push({ role: 'user', html: 'Yes, 21 Aug works', t: now() });
    S.messages.push({ role: 'aria', html: publishCard(), t: now() });
  }
  if (target >= 10) {
    S.responsesNotified = true;
    S.analysisComplete = true;
    S.messages.push({ role: 'aria', html: RESPONSES_MSG, t: now() });
    S.messages.push({ role: 'user', html: 'yes', t: now() });
    S.messages.push({ role: 'aria', html: monitorCard(), t: now() });
  }
  if (target >= 11) {
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

  document.getElementById('fileInput').addEventListener('change', e => {
    handleFiles(e.target.files);
    e.target.value = '';
  });

  document.getElementById('landingSubmit').addEventListener('click', submitLanding);
  document.getElementById('landingPrompt').addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      submitLanding();
    }
  });

  function submitLanding() {
    const prompt = document.getElementById('landingPrompt').value;
    const hint = document.getElementById('landingHint');
    const v = validatePrompt(prompt);
    if (!v.ok) {
      hint.textContent = v.msg;
      hint.classList.add('error');
      return;
    }
    hint.classList.remove('error');
    startChat(prompt);
  }

  document.querySelectorAll('.landing-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.dataset.prompt.replace(/\\n/g, '\n');
      document.getElementById('landingPrompt').value = text;
      document.getElementById('landingHint').classList.remove('error');
    });
  });

  initDemoNav();
  render();
});
