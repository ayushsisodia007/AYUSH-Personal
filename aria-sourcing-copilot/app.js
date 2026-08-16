'use strict';

/* ═══════════════════════════════════════════
   Aria — AI Sourcing Copilot  ·  app.js
   ═══════════════════════════════════════════ */

const STATE_KEY = 'aria_v11_state';
const LEGACY_STATE_KEYS = ['aria_v4_state', 'aria_v5_state', 'aria_v6_state', 'aria_v7_state', 'aria_v8_state', 'aria_v9_state'];

const EVENT_CATEGORY = 'Office Furniture';
const EVENT_SUBCATEGORY = 'Desks';
const EVENT_ITEM_NAME = 'Office Desk';
const EVENT_SUB_ITEMS = ['Office Desk'];
const EVENT_ITEM_DESC = 'Good-quality height-adjustable office desk with monitor arms. Delivery and installation included at Whitefield, Bangalore. Reasonable pricing with GST included.';
const DEFAULT_LOCATION = 'Whitefield, Bangalore';

const TARGET_PRICE = 18500;
const BENCHMARK_MIN = 16200;
const BENCHMARK_MAX = 21800;

const DEADLINE_DEFAULT = { date: '21 Aug 2026', time: '5:00 PM IST' };

const QUALIFIED_INCUMBENT_IDS = [1, 2];
const EXTERNAL_SUPPLIER_IDS = [5, 6];
const RECOMMENDED_SUPPLIER_IDS = [1, 2, 5, 6];

const SUPPLIER_DATA = [
  { id: 1, name: 'Featherlite Ergo', score: 92, contact: 'Anita Desai', email: 'anita.desai@featherlite.com', source: 'Internal', qualified: true,
    onTime: 96, pastPOs: 9, categoryRelevance: 'Office furniture — desks & workstations',
    ecoVadis: 'Gold · 72/100', dnB: 'AA · Low risk',
    priceSignal: 'Historically 4–6% below category average',
    rationale: 'Leading office furniture specialist with strongest track record for bulk workstation fit-outs in Bangalore.' },
  { id: 2, name: 'Godrej Interio', score: 89, contact: 'Rahul Mehta', email: 'rahul.mehta@godrejinterio.com', source: 'Internal', qualified: true,
    onTime: 94, pastPOs: 7, categoryRelevance: 'Workplace furniture — desks & storage',
    ecoVadis: 'Silver · 68/100', dnB: 'AA · Low risk',
    priceSignal: 'Fastest delivery — 8 working days to Whitefield',
    rationale: 'Premium build quality with pan-India service network. Consistently fastest campus delivery in Bangalore region.' },
  { id: 3, name: 'Durian Industries', score: 86, contact: 'Priya Nair', email: 'priya.nair@durian.in', source: 'Internal', qualified: false,
    onTime: 91, pastPOs: 5, categoryRelevance: 'Office furniture — general',
    ecoVadis: 'Silver · 61/100', dnB: 'A · Moderate risk',
    priceSignal: 'Value-oriented pricing',
    rationale: 'Cost-effective furniture with good certifications. Reliable for standard requirements but limited campus assembly experience.' },
  { id: 4, name: 'Nilkamal Furniture', score: 82, contact: 'Vikram Shah', email: 'vikram.shah@nilkamal.com', source: 'Internal', qualified: false,
    onTime: 88, pastPOs: 4, categoryRelevance: 'Office furniture — general',
    ecoVadis: 'Committed · 55/100', dnB: 'BBB · Moderate risk',
    priceSignal: 'Lowest historical unit prices',
    rationale: 'Value-oriented option with fast delivery. Less experience with height-adjustable desk specifications.' },
  { id: 5, name: 'Spacewood Solutions', score: 84, contact: 'Deepa Krishnan', email: 'deepa.krishnan@spacewood.in', source: 'AI Discovered',
    onTime: 90, pastPOs: 0, categoryRelevance: 'Office furniture — desks & workstations',
    ecoVadis: 'Silver · 64/100', dnB: 'A · Moderate risk',
    priceSignal: 'Competitive lead-time profile',
    rationale: 'Strong office-furniture category experience, Bangalore delivery coverage and competitive lead-time profile.' },
  { id: 6, name: 'Wipro Furniture', score: 81, contact: 'Arjun Reddy', email: 'arjun.reddy@wiprofurniture.com', source: 'AI Discovered',
    onTime: 87, pastPOs: 0, categoryRelevance: 'Enterprise workplace furniture',
    ecoVadis: 'Committed · 58/100', dnB: 'A · Moderate risk',
    priceSignal: 'Aggressive pricing on bulk orders',
    rationale: 'Enterprise furniture supplier with custom workstation configuration and GST-compliant billing for campus deliveries.' },
];

const BID_RESPONSES = {
  1: { up: 17800, model: 'Optima Sit-Stand Pro', del: '12 days', war: '3 yr onsite', gst: 'Yes', pay: 'Net 45', amc: '₹1,200/yr', score: 92, source: 'platform',
    specs: 'Height range 65–125 cm', monitorArm: 'Dual-arm compatible, 9 kg load', assembly: 'Included', hist: '96/100' },
  2: { up: 18200, model: 'Interio WorkPro Desk', del: '8 days', war: '3 yr onsite', gst: 'Yes', pay: 'Net 30', amc: '₹1,350/yr', score: 89, source: 'pdf',
    specs: 'Height range 68–120 cm', monitorArm: 'Single/dual arm, 8 kg load', assembly: 'Included', hist: '90/100' },
  3: { up: 18500, model: 'Durian FlexiDesk X', del: '16 days', war: '3 yr carry-in', gst: 'Yes', pay: 'Net 45', amc: '₹980/yr', score: 86, source: 'email',
    specs: 'Height range 70–118 cm', monitorArm: 'Single arm, 7 kg load', assembly: 'On request', hist: '85/100' },
  4: { up: 18800, model: 'Nilkamal Elevate', del: '13 days', war: '2 yr carry-in', gst: 'Yes', pay: 'Net 60', amc: '₹850/yr', score: 82, source: 'scanned',
    specs: 'Height range 72–115 cm', monitorArm: 'Single arm, 6 kg load', assembly: 'Extra charge', hist: '82/100' },
};

const SUBMISSION_SOURCE_LABELS = {
  platform: 'Platform',
  pdf: 'PDF',
  email: 'Email',
  scanned: 'Scanned proforma',
};

function submissionSourceBadge(source) {
  const label = SUBMISSION_SOURCE_LABELS[source] || source;
  return `<span class="submission-source submission-source-${source}">${label}</span>`;
}

const SUPPLIER_ALIASES = {
  featherlite: 1, godrej: 2, interio: 2, durian: 3, nilkamal: 4,
  spacewood: 5, wipro: 6,
};

const INTERNAL_BENCHMARKS = [
  { po: 'PO-2025-112', date: 'Feb 2025', supplier: 'Featherlite Ergo', item: 'Sit-Stand Desk Pro', price: 17200, qty: 60, conf: 92 },
  { po: 'PO-2024-087', date: 'Oct 2024', supplier: 'Godrej Interio', item: 'WorkPro Height-Adjustable', price: 17800, qty: 40, conf: 88 },
  { po: 'PO-2024-044', date: 'Jun 2024', supplier: 'Durian Industries', item: 'FlexiDesk Standard', price: 17500, qty: 80, conf: 80 },
  { po: 'PO-2023-219', date: 'Mar 2023', supplier: 'Nilkamal Furniture', item: 'Elevate Desk', price: 16200, qty: 30, conf: 72 },
  { po: 'PO-2023-156', date: 'Jan 2023', supplier: 'Featherlite Ergo', item: 'Optima Desk Lite', price: 16800, qty: 25, conf: 68 },
];

const EXTERNAL_BENCHMARKS = [
  { source: 'Amazon Business', ref: 'Electric Height-Adjustable Desk', price: 19999, conf: 85, link: 'amazon.in' },
  { source: 'Flipkart B2B', ref: 'Sit-Stand Workstation Pro', price: 18950, conf: 78, link: 'flipkart.com' },
  { source: 'IndustryBuy', ref: 'Office Desk — Electric Adjust', price: 20400, conf: 82, link: 'industrybuy.com' },
  { source: 'Udaan Business', ref: 'Height-Adjustable Work Desk', price: 18190, conf: 70, link: 'udaan.com' },
];

const LINE_ITEMS = [
  { item: EVENT_ITEM_NAME, desc: EVENT_ITEM_DESC, uom: 'Units', qty: 50, category: EVENT_CATEGORY, location: DEFAULT_LOCATION },
];

function getRfqQuestions() {
  const location = getLocationsLabel();
  return [
    'Please confirm the exact desk model and specifications, including dimensions and height-adjustment range.',
    'Please confirm the monitor arm specifications, compatibility and maximum supported load.',
    `Please confirm the delivery timeline to the ${location} campus.`,
    'Please confirm whether delivery, assembly and installation are included in the quoted price.',
    'Please confirm the warranty period and coverage, including onsite vs carry-in support.',
    'Please provide the unit price, GST treatment/GSTIN and payment terms.',
  ];
}

const STEP_LABELS = [
  'Welcome', 'Category Intelligence', 'Requirement Summary', 'RFQ Questions',
  'RFQ Preview', 'Attachments', 'RFQ Created', 'Benchmark Overview', 'Price Benchmarks',
  'Incumbent Suppliers', 'External Search', 'External Suppliers', 'Supplier Panel',
  'Deadline Confirmation', 'RFQ Published', 'Monitor Responses', 'Award',
];

const CHIPS = {
  0: [],
  1: ['Add ergonomic chairs', 'Proceed with desks only'],
  2: ['Yes, looks good', 'Add more line items', 'Change quantity'],
  3: ['Yes, proceed', 'Edit event name', 'Change a question'],
  4: ['Upload attachments', 'Create without attachments'],
  5: [],
  6: ['What is benchmarking?', 'Yes, display benchmarks', 'Proceed to benchmarks'],
  7: ['Display benchmarks', 'Proceed to benchmarks'],
  8: ['Show suppliers', 'Yes, proceed'],
  9: [],
  10: ['Yes, search external suppliers', 'Proceed with these 2 suppliers'],
  11: [],
  12: ['Add all 4 suppliers', 'Review suppliers'],
  13: ['Yes, 21 Aug works', 'Change to 25 Aug'],
  14: [],
  15: ['Proceed to award'],
  16: ['Confirm award', 'Review bids again'],
};

let S = loadState();

function defaultState() {
  return {
    step: 0,
    chatStarted: false,
    messages: [],
    userPrompt: '',
    eventName: 'Office Desks Sourcing — Whitefield — Aug 2026',
    eventCategory: EVENT_CATEGORY,
    includeChairs: false,
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
    externalSearchDone: false,
    suppliersAdded: false,
    awaitingAwardConfirm: false,
  };
}

let responsesTimer = null;
const RESPONSES_MSG = '<p>🎉 4 supplier responses received.</p><p>I\'ve received responses in different formats. Would you like me to analyze and compare them??</p>';

function isStaleHardwareData(value) {
  const blob = JSON.stringify(value || '').toLowerCase();
  return /\b(laptop|laptops|dell|hp enterprise|intel|windows|512gb|16gb ram|it hardware|it equipment|latitude|thinkpad|elitebook|ingram micro|business laptop|ergonomic office chair|120 chairs|120 ergonomic)\b/.test(blob);
}

function normalizeLineItems(items) {
  if (!items || !items.length || isStaleHardwareData(items)) return LINE_ITEMS.map(li => ({ ...li }));
  return items.map(li => ({
    item: EVENT_ITEM_NAME,
    desc: li.desc && !isStaleHardwareData(li.desc) ? li.desc : EVENT_ITEM_DESC,
    uom: li.uom || 'Units',
    qty: li.qty || 50,
    category: EVENT_CATEGORY,
    location: li.location || DEFAULT_LOCATION,
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
      state.eventName = `Office Desks Sourcing — Whitefield — Aug 2026`;
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
  S.step = 6;
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
  const qtyMatch = t.match(/(\d+)\s+(?:good[- ]quality\s+)?(?:office\s+)?desks?/i)
    || t.match(/(\d+)\s+(?:height[- ]adjustable\s+)?desks?/i)
    || t.match(/(\d+)\s+(?:workstations?|units?)/i);
  const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 50;

  let location = DEFAULT_LOCATION;
  if (/\bwhitefield\b/i.test(t)) location = 'Whitefield, Bangalore';
  else if (/\bbangalore\b/i.test(t)) location = 'Whitefield, Bangalore';
  else if (/\bmumbai\b/i.test(t)) location = 'Mumbai';
  else if (/\bdelhi\b/i.test(t)) location = 'Delhi';

  const desc = `${qty} good-quality height-adjustable office desks with monitor arms for ${location}. Delivery and installation included. Reasonable pricing with GST included.`;

  const lineItems = [{
    item: EVENT_ITEM_NAME,
    desc,
    uom: 'Units',
    qty,
    category: EVENT_CATEGORY,
    location,
  }];

  const locations = [location];
  return { lineItems, locations, qty };
}

function getLineItems() {
  return normalizeLineItems(S.lineItems && S.lineItems.length ? S.lineItems : LINE_ITEMS);
}

function getEventCategory() {
  return S.eventCategory || EVENT_CATEGORY;
}

function getLocationsLabel() {
  if (S.locations && S.locations.length) return S.locations.join(', ');
  return DEFAULT_LOCATION;
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
  S.eventName = `Office Desks Sourcing — Whitefield — Aug 2026`;
  document.getElementById('chatTitle').textContent = S.eventName;
  showChat();
  addMsg('user', prompt);
  S.step = 1;
  saveState();
  updateUI();
  await ariaSay(categoryIntelligenceCard());
}

/* ── NLP Parser ── */
function nlp(text) {
  const t = text.toLowerCase().trim();

  if (/\b(confirm award|issue po|proceed with award)\b/.test(t))
    return { type: 'confirmAward' };

  if (/\b(award|proceed to award|select featherlite|go with featherlite)\b/.test(t))
    return { type: 'award' };

  if (/\b(what is benchmarking|explain benchmarking|benchmarking mean)\b/.test(t))
    return { type: 'whatBenchmark' };

  if (/\b(display benchmark|show benchmark|proceed to benchmark|yes, display)\b/.test(t))
    return { type: 'showBenchmark' };

  if (/\b(yes|looks good|correct|sounds good|proceed|go ahead|sure|okay|ok|confirm|yep|great|perfect|done|approved)\b/.test(t))
    return { type: 'confirm' };

  if (/\b(attach|upload|document|file|spec sheet|sow|quote)\b/.test(t))
    return { type: 'upload' };

  if (/\b(skip|no attach|without|no attachment|without attachments|create without)\b/.test(t))
    return { type: 'skip' };

  if (/\b(benchmark|price benchmark)\b/.test(t))
    return { type: 'benchmark' };

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

  if (/\b(add all 4|add all four|invite all 4|all 4 supplier)\b/.test(t))
    return { type: 'addAll' };

  if (/\b(search external|external supplier|yes, search)\b/.test(t))
    return { type: 'searchExternal' };

  if (/\b(proceed with these 2|proceed with 2 supplier|these 2 supplier)\b/.test(t))
    return { type: 'proceedIncumbent' };

  if (/\b(proceed with desks only|desks only|proceed with desks)\b/.test(t))
    return { type: 'proceedDesks' };

  if (/\b(add ergonomic chairs|add chairs|include chairs)\b/.test(t))
    return { type: 'addChairs' };

  if (/\b(review supplier)\b/.test(t))
    return { type: 'reviewSuppliers' };

  if (/\b(add all|select all|all supplier|all vendor|invite all)\b/.test(t))
    return { type: 'addAll' };

  if (/\b(supplier|show supplier|vendor)\b/.test(t))
    return { type: 'suppliers' };

  if (/\b(publish|send rfq|go live)\b/.test(t))
    return { type: 'publish' };

  if (/\b(chair|furniture|ergonomic|office|desk|source|rfq|procure|buy|purchase)\b/.test(t))
    return { type: 'requirement' };

  if (/\b(25 aug|august 25|25th)\b/.test(t))
    return { type: 'deadline', date: '25 Aug 2026', time: '5:00 PM IST' };

  if (/\b(21 aug|august 21|21st)\b/.test(t))
    return { type: 'deadline', date: '21 Aug 2026', time: '5:00 PM IST' };

  const nums = [...t.matchAll(/\b([1-6])\b/g)].map(m => parseInt(m[1], 10));
  if (nums.length > 0 && /\b(add|select|invite|pick|choose|include)\b/.test(t))
    return { type: 'numbered', nums: [...new Set(nums)] };

  const names = { featherlite: 1, godrej: 2, interio: 2, durian: 3, nilkamal: 4, spacewood: 5, wipro: 6 };
  for (const [key, id] of Object.entries(names)) {
    if (t.includes(key)) return { type: 'named', id };
  }

  if (/^([1-3])\b/.test(t)) {
    const n = parseInt(t[0], 10);
    if (S.step === 14) {
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
function categoryIntelligenceCard() {
  return `<p>I've identified this as an <strong>Office Furniture / Workplace Furniture</strong> requirement. Since desks are commonly sourced together with ergonomic chairs for a new office setup, I would recommend considering chairs as well.</p>
  <p>Would you like me to add ergonomic chairs, or should I proceed with desks and monitor arms only?</p>`;
}

function requirementSummaryCard() {
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

  return `<p>Based on the details you've provided, I've structured your sourcing requirement as follows:</p>
  <div class="card">
    <div class="card-header">📋 Requirement Summary</div>
    <div class="card-body">
      <div class="card-meta">
        <div class="meta-item"><label>Category</label><span>${EVENT_CATEGORY} → ${EVENT_SUBCATEGORY}</span></div>
        <div class="meta-item"><label>Item</label><span>${EVENT_ITEM_NAME}</span></div>
        <div class="meta-item"><label>Total Quantity</label><span>${totalQty} units</span></div>
        <div class="meta-item"><label>Event Currency</label><span>INR (₹)</span></div>
        <div class="meta-item"><label>Delivery Location</label><span>${getLocationsLabel()}</span></div>
        <div class="meta-item"><label>Commercial Preference</label><span>Reasonable pricing with GST included</span></div>
      </div>
      <table class="data-table">
        <thead><tr><th>Item</th><th>Description</th><th>UOM</th><th>Qty</th><th>Category</th><th>Delivery Location</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>
  <p>Does this look correct?</p>`;
}

function metadataCard() {
  return requirementSummaryCard();
}

function eventDetailsCard() {
  const totalQty = getTotalQty();
  const questions = getRfqQuestions().map((q, i) => `
    <div class="rfq-question">
      <div class="q-num">${i + 1}</div>
      <div class="q-text">${q}</div>
    </div>`).join('');

  return `<p>Because this is an <strong>Office Furniture</strong> requirement, I recommend making the following supplier questions mandatory. Furniture can involve delivery damage, installation, warranty and specification gaps, so these details should be standardized across supplier responses.</p>
  <div class="card">
    <div class="card-header">📝 Event Details</div>
    <div class="card-body">
      <div class="card-meta">
        <div class="meta-item meta-item-wide"><label>Event Name</label><input type="text" value="${esc(S.eventName)}" id="eventNameInput" class="event-name-input"></div>
        <div class="meta-item"><label>Category</label><span>${getEventCategory()} → ${EVENT_SUBCATEGORY}</span></div>
        <div class="meta-item"><label>Items</label><span>${EVENT_SUB_ITEMS.join(', ')}</span></div>
        <div class="meta-item"><label>Quantity</label><span>${totalQty} units</span></div>
        <div class="meta-item"><label>Delivery</label><span>${getLocationsLabel()} campus</span></div>
      </div>
      <h4 style="font-size:13px;font-weight:600;margin:16px 0 8px;">6 mandatory questions recommended by Aria</h4>
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
    <div class="rfq-question"><div class="q-num">${i + 1}</div><div class="q-text">${q}</div></div>`).join('');

  return `<p>Here's your RFQ document preview for <strong>${totalQty} height-adjustable office desks with monitor arms</strong>:</p>
  <p>Invited suppliers will be asked to submit <strong>unit pricing for each line item</strong> in the pricing table below, and provide written responses to the <strong>mandatory questions</strong> listed in this RFQ. This ensures every bid is comparable on price, specifications, delivery, and commercial terms.</p>
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
          <div class="rfq-field"><label>Item</label><span>${EVENT_ITEM_NAME} + Monitor arms</span></div>
          <div class="rfq-field"><label>Currency</label><span>INR (₹)</span></div>
          <div class="rfq-field"><label>Delivery Locations</label><span>${getLocationsLabel()} campus</span></div>
          <div class="rfq-field"><label>Total Items</label><span>${items.length} line item${items.length > 1 ? 's' : ''}</span></div>
          <div class="rfq-field"><label>Total Quantity</label><span>${totalQty} units</span></div>
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
        <h3>6 mandatory questions recommended by Aria</h3>
        ${qRows}
      </div>
    </div>
  </div>
  <p>Would you like to upload any attachments for suppliers to review, or shall we create the RFQ without attachments?</p>
  <p class="rfq-attach-hint">Adding spec sheets, site layouts, or evaluation criteria helps suppliers quote accurately and reduces back-and-forth on technical details.</p>`;
}

function uploadCard() {
  const files = S.uploadedFiles || [];
  const done = files.length > 0;
  const fileList = files.map((f, i) => `
    <div class="upload-file-item" data-idx="${i}">
      <div class="file-info">📄 <strong>${esc(f.name)}</strong> <span style="color:#64748B">(${formatFileSize(f.size)})</span></div>
      <button class="file-remove" data-remove="${i}">Remove</button>
    </div>`).join('');

  return `<p>${done ? `${files.length} file${files.length > 1 ? 's' : ''} attached successfully.` : 'Upload supporting documents for this RFQ — spec sheets, site layouts, or evaluation criteria.'}</p>
  ${done ? '' : '<p class="rfq-attach-hint">These files will be shared with invited suppliers so they can review technical requirements, site constraints, and evaluation expectations before submitting their bids.</p>'}
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
  ${done ? '' : '<p>Attach your files and I\'ll incorporate them automatically.</p>'}`;
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
  <p>Shall we review price benchmarks before moving to supplier discovery?</p>`;
}

function benchmarkExplanationCard() {
  return `<p><strong>Price benchmarking</strong> compares your requirement against historical purchase orders and current market prices to set a fair target price.</p>
  <p>For <strong>office furniture</strong> like height-adjustable desks, benchmarking is especially useful because:</p>
  <ul class="key-insights-list">
    <li>Specifications vary widely (desk dimensions, motor type, monitor arm load) — benchmarks help validate whether quotes are reasonable</li>
    <li>Delivery and installation costs differ significantly across suppliers in Bangalore</li>
    <li>It gives you a data-backed negotiation anchor before inviting suppliers and reviewing bids</li>
  </ul>
  <p>Would you like me to display the benchmarks for this requirement?</p>`;
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

  return `<p>Here are the price benchmarks for <strong>height-adjustable office desks</strong> — internal PO history and live external market data for workstation furniture.</p>
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
          Based on <strong>5 internal desk POs</strong> and <strong>4 market references</strong> for height-adjustable office desks, I recommend a target benchmark of <strong>${formatPrice(S.targetPrice)}/unit</strong> — this gives you room to negotiate while remaining competitive. This target will be used to analyse supplier responses during bid monitoring.
        </div>
      </div>
    </div>
  </div>
  <p>Based on this, I recommend a target of <strong>${formatPrice(S.targetPrice)}/unit</strong> for ${getTotalQty()} height-adjustable office desks. Say "proceed" when you are ready to move to supplier discovery.</p>`;
}

function supplierTableRow(s, options = {}) {
  const { highlight = false } = options;
  const rec = highlight ? ' recommended-row' : '';
  const badges = highlight ? ' <span class="tag recommended">★ Qualified</span>' : '';
  const srcTag = s.source === 'Internal'
    ? '<span class="tag internal">Existing / Incumbent</span>'
    : '<span class="tag ai">AI-discovered / External</span>';
  return `<tr class="${rec}">
    <td><strong>${s.id}</strong></td>
    <td><div class="sup-name">${s.name}${badges}</div></td>
    <td>${srcTag}</td>
    <td>${s.categoryRelevance || '—'}</td>
    <td>${s.onTime}%</td>
    <td>${s.pastPOs || '—'}</td>
    <td>${s.ecoVadis || '—'}</td>
    <td>${s.dnB || '—'}</td>
    <td><div class="sup-rationale">💡 ${s.rationale}</div></td>
    <td><div class="sup-contact">👤 ${s.contact}<br>✉️ ${s.email}</div></td>
    <td><strong style="color:var(--primary)">${s.score}</strong>/100</td>
  </tr>`;
}

function supplierTableHeader() {
  return `<thead><tr><th>#</th><th>Supplier</th><th>Source</th><th>Category Relevance</th><th>On-time</th><th>Past POs</th><th>EcoVadis</th><th>D&amp;B</th><th>Rationale</th><th>Contact</th><th>Score</th></tr></thead>`;
}

function incumbentSuppliersCard() {
  const internal = SUPPLIER_DATA.filter(s => s.source === 'Internal');

  return `<p>I found <strong>4 incumbent suppliers</strong> in your existing supplier base for this category.</p>
  <p>Based on their historical pricing, delivery performance and category experience, <strong>2 of them look good to go</strong> for this RFQ — highlighted below.</p>
  <div class="card">
    <div class="card-header bench-card-header">
      <span>🏢 Incumbent Suppliers</span>
      <span class="bench-badge">4 found · 2 qualified</span>
    </div>
    <div class="card-body">
      <div class="supplier-table-wrap">
        <table class="supplier-table">
          ${supplierTableHeader()}
          <tbody>${internal.map(s => supplierTableRow(s, { highlight: s.qualified })).join('')}</tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function externalSearchRecommendationCard() {
  return `<p>I'd also recommend looking beyond your incumbent suppliers.</p>
  <p>Although 2 incumbent suppliers have strong historical performance, expanding the supplier pool could increase price competition and give you additional options on lead time and commercial terms.</p>
  <p>Would you like me to search for external suppliers as well?</p>`;
}

function externalSuppliersCard() {
  const external = SUPPLIER_DATA.filter(s => EXTERNAL_SUPPLIER_IDS.includes(s.id));

  return `<p>I found <strong>2 additional suppliers</strong> that match the category and delivery requirements.</p>
  <p>I've combined them with the 2 qualified incumbent suppliers so you can review the complete recommended supplier panel.</p>
  <div class="card">
    <div class="card-header bench-card-header">
      <span>🤖 External Suppliers</span>
      <span class="bench-badge">2 discovered</span>
    </div>
    <div class="card-body">
      <div class="supplier-table-wrap">
        <table class="supplier-table">
          ${supplierTableHeader()}
          <tbody>${external.map(s => supplierTableRow(s, { highlight: true })).join('')}</tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function combinedSupplierPanelCard() {
  const internal = SUPPLIER_DATA.filter(s => QUALIFIED_INCUMBENT_IDS.includes(s.id));
  const external = SUPPLIER_DATA.filter(s => EXTERNAL_SUPPLIER_IDS.includes(s.id));

  return `<div class="card">
    <div class="card-header">Recommended Supplier Panel</div>
    <div class="card-body">
      <div class="section-divider">📁 2 Existing Suppliers</div>
      <div class="supplier-table-wrap">
        <table class="supplier-table">
          ${supplierTableHeader()}
          <tbody>${internal.map(s => supplierTableRow(s, { highlight: true })).join('')}</tbody>
        </table>
      </div>
      <div class="section-divider">🤖 2 External Suppliers</div>
      <div class="supplier-table-wrap">
        <table class="supplier-table">
          ${supplierTableHeader()}
          <tbody>${external.map(s => supplierTableRow(s, { highlight: true })).join('')}</tbody>
        </table>
      </div>
    </div>
  </div>
  <p>I recommend inviting all 4 suppliers to the RFQ — 2 proven incumbents and 2 qualified external suppliers.</p>
  <p>This gives us a balance of historical supplier performance and new market competition.</p>
  <p>Would you like me to add these 4 suppliers to the RFQ?</p>`;
}

function supplierCard() {
  return combinedSupplierPanelCard();
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
        <div class="deadline-reason" style="margin-top:12px;color:var(--text);font-weight:500;">Once published, all ${S.selectedNums.length || 4} added suppliers will receive an RFQ invitation email immediately.</div>
      </div>
    </div>
  </div>
  <p>Shall I publish the RFQ with this deadline?</p>`;
}

function publishCard() {
  const count = S.selectedNums.length || 4;
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
    return { id, name: sup.name, rec: id === 1, ...bid };
  });
}

function keyInsightsList(items) {
  return `<ul class="key-insights-list">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
}

function buildBidKeyInsights(bids, lowest, qty, savingsStr, savingsPct) {
  const highest = bids.reduce((a, b) => a.up > b.up ? a : b);
  const spread = highest.up - lowest.up;
  const spreadPct = ((spread / lowest.up) * 100).toFixed(1);
  const belowTarget = bids.filter(b => b.up < S.targetPrice).length;
  const fastest = bids.reduce((a, b) => parseInt(a.del, 10) < parseInt(b.del, 10) ? a : b);
  const slowest = bids.reduce((a, b) => parseInt(a.del, 10) > parseInt(b.del, 10) ? a : b);
  const topScore = bids.reduce((a, b) => a.score > b.score ? a : b);

  return keyInsightsList([
    `<strong>Price leader:</strong> ${lowest.name} at ${formatPrice(lowest.up)}/unit — lowest of 4 responses and ${formatPrice(S.targetPrice - lowest.up)}/unit below your ${formatPrice(S.targetPrice)} target`,
    `<strong>Competitive spread:</strong> All bids fall within ${formatPrice(spread)}/unit (${spreadPct}%) — ${belowTarget} of 4 suppliers bid below target, giving you room to negotiate`,
    `<strong>Delivery:</strong> ${fastest.name} offers the fastest delivery at ${fastest.del}; longest quoted lead time is ${slowest.del}`,
    `<strong>Requirement fit:</strong> ${topScore.name} leads on match score (${topScore.score}/100); estimated savings of <strong>${savingsStr}</strong> (${savingsPct}%) if you award to ${lowest.name} for ${qty} units`,
  ]);
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
    <td>${submissionSourceBadge(r.source)}</td>
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
      <div class="insight-chip">Responses: <span class="chip-value">4 of ${S.selectedNums.length || 4}</span></div>
    </div>`;

  const keyInsights = `
    <div class="key-insights-card">
      <div class="key-insights-title">💡 Key Insights</div>
      ${buildBidKeyInsights(bids, lowest, qty, savingsStr, savingsPct)}
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

  const featherBars = [{ l: 'Price', v: 95 }, { l: 'Delivery', v: 82 }, { l: 'Warranty', v: 92 }, { l: 'Hist. Perf', v: 96 }, { l: 'Specs Match', v: 94 }];
  const godrejBars = [{ l: 'Price', v: 88 }, { l: 'Delivery', v: 98 }, { l: 'Warranty', v: 90 }, { l: 'Hist. Perf', v: 90 }, { l: 'Specs Match', v: 91 }];
  const durianBars = [{ l: 'Price', v: 82 }, { l: 'Delivery', v: 80 }, { l: 'Warranty', v: 84 }, { l: 'Hist. Perf', v: 85 }, { l: 'Specs Match', v: 86 }];

  return `<p>4 supplier responses analysed against your target benchmark of <strong>${formatPrice(S.targetPrice)}/unit</strong>:</p>
  ${insights}
  ${keyInsights}
  <div class="card">
    <div class="card-header">📊 Bid Comparison <span class="benchmark-ref">Target: ${formatPrice(S.targetPrice)}/unit</span></div>
    <div class="card-body" style="overflow-x:auto;">
      <table class="data-table comparison-table">
        <thead><tr><th>Supplier</th><th>Source</th><th>Unit Price</th><th>Total Value</th><th>Model Offered</th><th>Delivery</th><th>Warranty</th><th>GST Incl.</th><th>Payment</th><th>AMC/yr</th><th>Score</th></tr></thead>
        <tbody>${compRows}</tbody>
      </table>
      <div class="scorecards">
        ${scorecard('Featherlite Ergo', featherBars)}
        ${scorecard('Godrej Interio', godrejBars)}
        ${scorecard('Durian Industries', durianBars)}
      </div>
      <div class="rec-banner">
        <strong>Recommendation: Award to ${lowest.name}</strong> — ${lowest.name} bids <strong>${formatPrice(lowest.up)}/unit</strong> (${formatLakhs(lowest.total)} total), which is <strong>${formatPrice(S.targetPrice - lowest.up)}/unit below</strong> your ${formatPrice(S.targetPrice)} target. Estimated savings of <strong>${savingsStr}</strong> (${savingsPct}%) against the target benchmark of ${formatLakhs(targetTotal)} for ${qty} units. <em>Note: Godrej Interio quotes faster delivery at 8 days vs ${lowest.del} — worth considering if lead time is a priority.</em>
      </div>
    </div>
  </div>
  <p>Ask me to compare any two suppliers (e.g. <em>"Compare Featherlite vs Godrej"</em>), or type <strong>Proceed to award</strong>.</p>`;
}

function scheduleResponsesNotification() {
  if (responsesTimer) clearTimeout(responsesTimer);
  responsesTimer = setTimeout(() => {
    if (S.step !== 14 || S.responsesNotified) return;
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
        S.step = 15;
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

  const rows = [
    { c: 'Unit Price', v1: formatPrice(b1.up), v2: formatPrice(b2.up), edge: edge(b1.up, b2.up, false) },
    { c: `Total Value (${qty} units)`, v1: formatLakhs(b1.up * qty), v2: formatLakhs(b2.up * qty), edge: edge(b1.up, b2.up, false) },
    { c: 'Model', v1: b1.model, v2: b2.model, edge: '—' },
    { c: 'Delivery', v1: b1.del, v2: b2.del, edge: edge(parseInt(b1.del, 10), parseInt(b2.del, 10), false) },
    { c: 'Warranty', v1: b1.war, v2: b2.war, edge: b1.war === b2.war ? 'Tie' : '—' },
    { c: 'Desk Specs', v1: b1.specs, v2: b2.specs, edge: '—' },
    { c: 'Monitor Arm', v1: b1.monitorArm, v2: b2.monitorArm, edge: '—' },
    { c: 'Payment Terms', v1: b1.pay, v2: b2.pay, edge: '—' },
    { c: 'AMC/yr', v1: b1.amc, v2: b2.amc, edge: edge(parseInt(b1.amc.replace(/\D/g, ''), 10), parseInt(b2.amc.replace(/\D/g, ''), 10), false) },
    { c: 'Match Score', v1: `${b1.score}/100`, v2: `${b2.score}/100`, edge: edge(b1.score, b2.score, true) },
    { c: `vs Target (${formatPrice(S.targetPrice)})`, v1: s1 >= 0 ? `${formatSavingsAmount(s1)} saved` : `${formatSavingsAmount(s1)} over`, v2: s2 >= 0 ? `${formatSavingsAmount(s2)} saved` : `${formatSavingsAmount(s2)} over`, edge: edge(s1, s2, true) },
  ];

  const criteria = rows.map(r => `<tr><td>${r.c}</td><td>${r.v1}</td><td>${r.v2}</td><td style="font-weight:600;color:#2563EB">${r.edge}</td></tr>`).join('');

  const wins = { [n1]: 0, [n2]: 0 };
  rows.forEach(r => {
    if (r.edge === n1) wins[n1]++;
    else if (r.edge === n2) wins[n2]++;
  });

  const verdictName = cheaper.bid.score >= other.bid.score - 3 ? cheaper.name : other.name;
  const verdictBid = verdictName === cheaper.name ? cheaper.bid : other.bid;
  const verdictOther = verdictName === cheaper.name ? other.bid : cheaper.bid;
  const verdictOtherName = verdictName === cheaper.name ? other.name : cheaper.name;

  const rationale = [
    `<strong>Price:</strong> ${cheaper.name} bids ${formatPrice(diff)}/unit lower — ${formatLakhs(diffTotal)} less on ${qty} units`,
    `<strong>Delivery:</strong> ${edge(parseInt(b1.del, 10), parseInt(b2.del, 10), false) === 'Tie' ? 'Both quote similar lead times' : `${edge(parseInt(b1.del, 10), parseInt(b2.del, 10), false)} offers faster delivery`} (${b1.del} vs ${b2.del})`,
    `<strong>Commercial terms:</strong> ${b1.war === b2.war ? 'Warranty is comparable' : 'Warranty terms differ'}; AMC is ${b1.amc} (${n1}) vs ${b2.amc} (${n2})`,
    `<strong>Overall:</strong> ${verdictName} wins on ${wins[verdictName]} of ${rows.filter(r => r.edge !== '—' && r.edge !== 'Tie').length} scored criteria with a ${verdictBid.score}/100 requirement match${verdictName === cheaper.name ? ` and the lowest unit price` : `, despite ${cheaper.name} being ${formatPrice(diff)}/unit cheaper`}${id2 === 2 && id1 === 1 ? `. <strong>Why not Godrej?</strong> Godrej delivers in <strong>8 days</strong> vs Featherlite's <strong>12 days</strong> — 4 days faster to Whitefield — but at a <strong>${formatPrice(diff)}/unit premium</strong> (${formatLakhs(diffTotal)} more on ${qty} units). If lead time is critical, Godrej is the stronger choice; if cost savings matter more, Featherlite remains the recommendation.` : ''}`,
  ];

  return `<p>Here's a detailed comparison of <strong>${n1}</strong> vs <strong>${n2}</strong>:</p>
  <div class="card">
    <div class="card-header">🔍 ${n1} vs ${n2}</div>
    <div class="card-body">
      <table class="data-table">
        <thead><tr><th>Criteria</th><th>${n1}</th><th>${n2}</th><th>Edge</th></tr></thead>
        <tbody>${criteria}</tbody>
      </table>
      <div class="compare-verdict-banner">
        <div class="verdict-label">Verdict</div>
        <div class="verdict-winner">Recommend <strong>${verdictName}</strong> for award</div>
        <p class="verdict-summary">${verdictName} offers stronger overall value with a ${verdictBid.score}/100 match score${verdictName === cheaper.name ? ` and the lowest price at ${formatPrice(verdictBid.up)}/unit` : `, scoring ${verdictBid.score - verdictOther.score} points higher than ${verdictOtherName} despite a ${formatPrice(diff)}/unit premium`}.</p>
      </div>
      <div class="compare-rationale">
        <div class="key-insights-title">Rationale</div>
        ${keyInsightsList(rationale)}
      </div>
    </div>
  </div>
  <p>Would you like to compare another pair, or type <strong>Proceed to award</strong>?</p>`;
}

function awardSummaryCard() {
  const qty = getTotalQty();
  const awardUnit = BID_RESPONSES[1].up;
  const awardTotal = formatLakhs(awardUnit * qty);
  const savings = formatSavingsAmount(calcSavingsVsTarget(awardUnit));
  const supplier = SUPPLIER_DATA.find(s => s.id === 1);

  return `<p>Before I issue the award, here's a summary of what will be awarded:</p>
  <div class="card">
    <div class="card-header">🏆 Award Summary</div>
    <div class="card-body">
      <div class="card-meta">
        <div class="meta-item meta-item-wide"><label>Event</label><span>${esc(S.eventName)}</span></div>
        <div class="meta-item"><label>Category</label><span>${EVENT_CATEGORY} → ${EVENT_SUBCATEGORY}</span></div>
        <div class="meta-item"><label>Item</label><span>${EVENT_ITEM_NAME}</span></div>
        <div class="meta-item"><label>Quantity</label><span>${qty} units</span></div>
        <div class="meta-item"><label>Unit Price</label><span>${formatPrice(awardUnit)}</span></div>
        <div class="meta-item"><label>Total Value</label><span>${awardTotal}</span></div>
        <div class="meta-item"><label>Delivery Location</label><span>${getLocationsLabel()}</span></div>
        <div class="meta-item"><label>Model</label><span>${BID_RESPONSES[1].model}</span></div>
        <div class="meta-item meta-item-wide"><label>Awarded To</label><span><strong>${supplier.name}</strong> · ${supplier.contact} · ${supplier.email}</span></div>
        <div class="meta-item"><label>Est. Savings vs Target</label><span>${savings}</span></div>
      </div>
    </div>
  </div>
  <p>Shall I confirm the award and issue PO-2026-112 to <strong>${supplier.name}</strong>?</p>`;
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
    case 8: return handleStep8(intent);
    case 9: return handleStep9(intent);
    case 10: return handleStep10(intent);
    case 11: return handleStep11(intent);
    case 12: return handleStep12(intent);
    case 13: return handleStep13(intent);
    case 14: return handleStep14(intent);
    case 15: return handleStep15(intent, text);
    case 16: return handleStep16(intent);
  }
}

async function handleStep0(intent, text) {
  if (!S.chatStarted) return;
}

async function handleStep1(intent) {
  if (intent.type === 'addChairs') {
    S.includeChairs = true;
    S.step = 2;
    saveState();
    updateUI();
    await ariaSay(`<p>Got it — I've added ergonomic chairs to your requirement scope.</p>`);
    await ariaSay(requirementSummaryCard());
    return;
  }
  if (intent.type === 'proceedDesks' || intent.type === 'confirm' || intent.type === 'unknown') {
    S.includeChairs = false;
    S.step = 2;
    saveState();
    updateUI();
    await ariaSay(requirementSummaryCard());
  }
}

async function handleStep2(intent) {
  if (intent.type === 'confirm' || intent.type === 'unknown') {
    S.step = 3;
    saveState();
    updateUI();
    await ariaSay(eventDetailsCard());
  }
}

async function handleStep3(intent) {
  const input = document.getElementById('eventNameInput');
  if (input) S.eventName = input.value;
  if (intent.type === 'confirm' || intent.type === 'unknown') {
    S.step = 4;
    saveState();
    updateUI();
    await ariaSay(rfqPreviewCard());
  }
}

async function handleStep4(intent) {
  if (intent.type === 'upload' || intent.type === 'confirm') {
    S.step = 5;
    saveState();
    updateUI();
    await ariaSay(uploadCard());
  } else if (intent.type === 'skip' || intent.type === 'benchmark') {
    S.uploadDone = false;
    S.uploadedFiles = [];
    await showRfqCreated();
  }
}

async function handleStep5(intent) {
  if (intent.type === 'upload') {
    document.getElementById('fileInput').click();
    return;
  }
  if (intent.type === 'skip' || intent.type === 'benchmark') {
    S.uploadDone = false;
    S.uploadedFiles = [];
    await showRfqCreated();
  }
}

async function handleStep6(intent) {
  if (intent.type === 'whatBenchmark') {
    S.step = 7;
    saveState();
    updateUI();
    await ariaSay(benchmarkExplanationCard());
    return;
  }
  if (intent.type === 'showBenchmark' || intent.type === 'benchmark' || intent.type === 'confirm' || intent.type === 'unknown') {
    S.step = 7;
    saveState();
    updateUI();
    await ariaSay(benchmarkExplanationCard());
  }
}

async function handleStep7(intent) {
  if (intent.type === 'showBenchmark' || intent.type === 'benchmark' || intent.type === 'confirm' || intent.type === 'unknown') {
    S.step = 8;
    saveState();
    updateUI();
    await ariaSay(benchmarkCard());
  }
}

async function handleStep8(intent) {
  if (intent.type === 'confirm' || intent.type === 'suppliers' || intent.type === 'unknown') {
    S.step = 9;
    saveState();
    updateUI();
    await ariaSay(incumbentSuppliersCard());
    await ariaSay(externalSearchRecommendationCard());
    S.step = 10;
    saveState();
    updateUI();
  }
}

async function handleStep9(intent) {
  // Transitional — auto-advances to step 10
}

async function handleStep10(intent) {
  if (intent.type === 'searchExternal' || intent.type === 'confirm' || intent.type === 'unknown') {
    S.externalSearchDone = true;
    S.step = 11;
    saveState();
    updateUI();
    await ariaSay(externalSuppliersCard());
    await ariaSay(combinedSupplierPanelCard());
    S.step = 12;
    saveState();
    updateUI();
    return;
  }
  if (intent.type === 'proceedIncumbent') {
    S.selectedNums = [...QUALIFIED_INCUMBENT_IDS];
    S.step = 13;
    saveState();
    updateUI();
    const names = S.selectedNums.map(n => SUPPLIER_DATA.find(s => s.id === n)?.name).filter(Boolean);
    await ariaSay(`Understood — I'll proceed with <strong>${names.join(' and ')}</strong> as your supplier panel.`);
    await ariaSay(deadlineCard());
  }
}

async function handleStep11(intent) {
  // Transitional — auto-advances to step 12
}

async function handleStep12(intent) {
  if (intent.type === 'addAll' || intent.type === 'confirm' || intent.type === 'publish') {
    S.selectedNums = [...RECOMMENDED_SUPPLIER_IDS];
    S.suppliersAdded = true;
    const names = S.selectedNums.map(n => SUPPLIER_DATA.find(s => s.id === n)?.name).filter(Boolean);
    S.step = 13;
    saveState();
    updateUI();
    await ariaSay(`Done — I've added <strong>${names.join(', ')}</strong> to the RFQ.`);
    await ariaSay(deadlineCard());
    return;
  }
  if (intent.type === 'reviewSuppliers') {
    await ariaSay(combinedSupplierPanelCard());
  }
}

async function handleStep13(intent) {
  if (intent.type === 'deadline') {
    S.deadlineDate = intent.date;
    S.deadlineTime = intent.time || DEADLINE_DEFAULT.time;
    saveState();
    await ariaSay(deadlineCard());
    return;
  }
  if (intent.type === 'confirm' || intent.type === 'unknown' || intent.type === 'publish') {
    S.step = 14;
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
    S.step = 15;
    saveState();
    updateUI();
    await ariaSay(monitorCard());
    return;
  }
  runAnalysisStream(async () => {
    await ariaSay(monitorCard());
  });
}

async function handleStep14(intent) {
  if (intent.type === 'remind') {
    await ariaSay(`Reminder emails sent to suppliers who haven't responded yet. I'll notify you when they submit their bids.`);
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
    S.step = 15;
    saveState();
    updateUI();
    await ariaSay(monitorCard());
  }
}

async function handleStep15(intent, text) {
  if (S.awaitingAwardConfirm) {
    if (intent.type === 'confirmAward' || intent.type === 'confirm' || intent.type === 'award') {
      S.awaitingAwardConfirm = false;
      S.step = 16;
      S.awardDone = true;
      saveState();
      updateUI();
      document.getElementById('awardModal').classList.add('open');
      await ariaSay(awardBanner());
      return;
    }
    if (/\b(review|cancel|back|compare)\b/i.test(text)) {
      S.awaitingAwardConfirm = false;
      saveState();
      updateUI();
      await ariaSay(monitorCard());
      return;
    }
  }

  if (intent.type === 'award' || (intent.type === 'confirm' && /\baward\b/i.test(text) && !S.awaitingAwardConfirm)) {
    S.awaitingAwardConfirm = true;
    saveState();
    updateUI();
    await ariaSay(awardSummaryCard());
    return;
  }

  const pair = extractCompareSuppliers(text);
  if (pair || intent.type === 'compare' || intent.type === 'why' || /\bwhy not godrej\b/i.test(text)) {
    const ids = pair || [1, 2];
    const card = dynamicCompareCard(ids[0], ids[1]);
    if (card) await ariaSay(card);
  }
}

async function handleStep16(intent) {
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

  if (S.uploadDone && S.step === 5) {
    autoProgressAfterUpload();
  }
}

async function autoProgressAfterUpload() {
  await ariaSay(`<p>Attachment received. I've incorporated the relevant information and am moving to the next step.</p>`);
  S.uploadDone = true;
  saveState();
  await showRfqCreated();
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
  let chips = CHIPS[S.step] || [];
  if (S.step === 15 && S.awaitingAwardConfirm) {
    chips = CHIPS[16];
  }
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
  if (S.step === 14 && S.rfqPublished && !S.responsesNotified) {
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
  S.userPrompt = 'I need 50 good-quality office desks for our Bangalore office. They should be height adjustable and come with monitor arms. Please include delivery and installation, and keep the pricing reasonable with GST included.';
  S.eventName = 'Office Desks Sourcing — Whitefield — Aug 2026';
  S.eventCategory = EVENT_CATEGORY;
  S.lineItems = LINE_ITEMS;
  S.locations = [DEFAULT_LOCATION];
  S.uploadedFiles = [{ name: 'Desk_Spec_Sheet.pdf', size: 2457600, type: 'application/pdf' }];

  if (target >= 1) {
    S.messages.push({ role: 'user', html: S.userPrompt, t: now() });
    S.messages.push({ role: 'aria', html: categoryIntelligenceCard(), t: now() });
  }
  if (target >= 2) {
    S.messages.push({ role: 'user', html: 'Proceed with desks only', t: now() });
    S.messages.push({ role: 'aria', html: requirementSummaryCard(), t: now() });
  }
  if (target >= 3) {
    S.messages.push({ role: 'user', html: 'Yes, looks good', t: now() });
    S.messages.push({ role: 'aria', html: eventDetailsCard(), t: now() });
  }
  if (target >= 4) {
    S.messages.push({ role: 'user', html: 'Yes, proceed', t: now() });
    S.messages.push({ role: 'aria', html: rfqPreviewCard(), t: now() });
  }
  if (target >= 5) {
    S.uploadDone = true;
    S.uploadedFiles = [
      { name: 'Desk_Spec_Sheet.pdf', size: 2457600, type: 'application/pdf' },
      { name: 'Vendor_Evaluation_Criteria.pdf', size: 1100000, type: 'application/pdf' },
    ];
    S.messages.push({ role: 'user', html: 'Upload attachments', t: now() });
    S.messages.push({ role: 'aria', html: uploadCard(), t: now() });
  }
  if (target >= 6) {
    S.rfqCreated = true;
    S.uploadDone = true;
    S.messages.push({ role: 'user', html: 'Upload attachments', t: now() });
    S.messages.push({ role: 'aria', html: `<p>Attachment received. I've incorporated the relevant information and am moving to the next step.</p>`, t: now() });
    S.messages.push({ role: 'aria', html: rfqCreatedCard(), t: now() });
  }
  if (target >= 7) {
    S.messages.push({ role: 'user', html: 'What is benchmarking?', t: now() });
    S.messages.push({ role: 'aria', html: benchmarkExplanationCard(), t: now() });
  }
  if (target >= 8) {
    S.messages.push({ role: 'user', html: 'Display benchmarks', t: now() });
    S.messages.push({ role: 'aria', html: benchmarkCard(), t: now() });
  }
  if (target >= 9) {
    S.messages.push({ role: 'user', html: 'Show suppliers', t: now() });
    S.messages.push({ role: 'aria', html: incumbentSuppliersCard(), t: now() });
    S.messages.push({ role: 'aria', html: externalSearchRecommendationCard(), t: now() });
  }
  if (target >= 10) {
    S.messages.push({ role: 'user', html: 'Yes, search external suppliers', t: now() });
    S.messages.push({ role: 'aria', html: externalSuppliersCard(), t: now() });
  }
  if (target >= 11) {
    S.messages.push({ role: 'aria', html: combinedSupplierPanelCard(), t: now() });
  }
  if (target >= 12) {
    S.selectedNums = [...RECOMMENDED_SUPPLIER_IDS];
    S.suppliersAdded = true;
    S.externalSearchDone = true;
    S.messages.push({ role: 'user', html: 'Add all 4 suppliers', t: now() });
    S.messages.push({ role: 'aria', html: `Done — I've added <strong>Featherlite Ergo, Godrej Interio, Spacewood Solutions, Wipro Furniture</strong> to the RFQ.`, t: now() });
    S.messages.push({ role: 'aria', html: deadlineCard(), t: now() });
  }
  if (target >= 13) {
    S.messages.push({ role: 'user', html: 'Yes, 21 Aug works', t: now() });
    S.messages.push({ role: 'aria', html: publishCard(), t: now() });
  }
  if (target >= 14) {
    S.rfqPublished = true;
  }
  if (target >= 15) {
    S.responsesNotified = true;
    S.analysisComplete = true;
    S.messages.push({ role: 'aria', html: RESPONSES_MSG, t: now() });
    S.messages.push({ role: 'user', html: 'yes', t: now() });
    S.messages.push({ role: 'aria', html: monitorCard(), t: now() });
  }
  if (target >= 16) {
    S.awardDone = true;
    S.messages.push({ role: 'user', html: 'Proceed to award', t: now() });
    S.messages.push({ role: 'aria', html: awardSummaryCard(), t: now() });
    S.messages.push({ role: 'user', html: 'Confirm award', t: now() });
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

  initDemoNav();
  render();
});
