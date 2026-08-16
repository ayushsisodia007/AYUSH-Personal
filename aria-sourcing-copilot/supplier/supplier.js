'use strict';

const EVENT = {
  id: 'RFQ-2026-0815-CHR',
  name: 'Office Chairs Sourcing — Bangalore — Aug 2026',
  category: 'Office Furniture',
  location: 'Bangalore',
  deadline: '21 Aug 2026 · 5:00 PM IST',
  currency: 'INR (₹)',
  qty: 50,
  item: 'Ergonomic Office Chair',
  specs: 'Adjustable lumbar support, 3D armrests, breathable mesh back, adjustable seat height, minimum 3-year warranty',
  questions: [
    { key: 'model', label: 'Please confirm the exact ergonomic chair model and specifications you are quoting (lumbar support, armrests, mesh back, seat height).' },
    { key: 'delivery', label: 'What is your delivery timeline to Bangalore?' },
    { key: 'assembly', label: 'Do you include on-site assembly and installation at our Bangalore office? If yes, please provide pricing.' },
    { key: 'warranty', label: 'What is the warranty period? Please confirm minimum 3-year warranty with coverage details (onsite vs carry-in).' },
    { key: 'gstin', label: 'Please confirm GST treatment and provide your GSTIN for invoicing.' },
    { key: 'payment', label: 'What are your payment terms? Do you accept 30/60/90 day credit?' },
  ],
};

const SUPPLIERS = {
  1: { name: 'Featherlite Ergo', contact: 'Anita Desai' },
  2: { name: 'Godrej Interio', contact: 'Rahul Mehta' },
  3: { name: 'Durian Industries', contact: 'Priya Nair' },
  4: { name: 'Nilkamal Furniture', contact: 'Vikram Shah' },
  5: { name: 'Spacewood Solutions', contact: 'Deepa Krishnan' },
  6: { name: 'Wipro Furniture', contact: 'Arjun Reddy' },
  7: { name: 'Urban Ladder Business', contact: 'Sneha Rao' },
};

const DEMO_EXTRACT = {
  1: { model: 'Optima Max Mesh — adjustable lumbar, 3D armrests, breathable mesh back, adjustable seat height', unitPrice: 13800, delivery: '10 working days to Bangalore', assembly: 'Included — on-site assembly at Bangalore office', warranty: '3 years onsite', gstin: '29AABCF1234F1Z5', payment: 'Net 45', amc: '₹850/yr' },
  2: { model: 'Interio ErgoPro — adjustable lumbar, 3D armrests, breathable mesh back', unitPrice: 14200, delivery: '12 working days to Bangalore', assembly: 'Included — on-site assembly', warranty: '3 years onsite', gstin: '27AABCG5678H1Z2', payment: 'Net 30', amc: '₹920/yr' },
  3: { model: 'Durian FlexiMesh X — adjustable lumbar, 2D armrests, breathable mesh back', unitPrice: 14500, delivery: '14 working days to Bangalore', assembly: 'On request — quoted separately', warranty: '3 years carry-in', gstin: '29AABCD9012K1Z8', payment: 'Net 45', amc: '₹780/yr' },
  4: { model: 'Nilkamal Thames — mesh back, adjustable armrests', unitPrice: 14800, delivery: '11 working days to Bangalore', assembly: 'Extra charge — ₹150/chair', warranty: '3 years carry-in', gstin: '29AABCN3456L1Z1', payment: 'Net 60', amc: '₹700/yr' },
  5: { model: 'Spacewood Ergo Mesh Pro — lumbar support, 3D armrests', unitPrice: 14600, delivery: '13 working days to Bangalore', assembly: 'Included', warranty: '3 years onsite', gstin: '29AABCS7890M1Z3', payment: 'Net 45', amc: '₹800/yr' },
  6: { model: 'Wipro ErgoSeat 360 — mesh back, adjustable lumbar', unitPrice: 14700, delivery: '15 working days to Bangalore', assembly: 'Included for orders above 100 units', warranty: '3 years onsite', gstin: '29AABCW2345N1Z4', payment: 'Net 45', amc: '₹820/yr' },
  7: { model: 'Urban Ladder Business Ergo — mesh back, 2D armrests', unitPrice: 14900, delivery: '16 working days to Bangalore', assembly: 'Optional — ₹200/chair', warranty: '3 years carry-in', gstin: '29AABCU6789P1Z5', payment: 'Net 30', amc: '₹750/yr' },
};

const params = new URLSearchParams(location.search);
const supplierId = parseInt(params.get('supplier') || '1', 10);
const eventId = params.get('event') || EVENT.id;
const token = params.get('token') || 'demo';

let extractedBid = null;
let uploadedFileName = '';

function formatPrice(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function getSupplier() {
  return SUPPLIERS[supplierId] || SUPPLIERS[1];
}

function getDemoExtract() {
  return { ...(DEMO_EXTRACT[supplierId] || DEMO_EXTRACT[1]) };
}

function renderEvent() {
  const sup = getSupplier();
  document.getElementById('supplierMeta').innerHTML = `
    <strong>${sup.name}</strong>
    ${sup.contact} · Event ${eventId}`;

  document.getElementById('supplierGreeting').textContent =
    `Hi ${sup.contact}, you have been invited to submit your quotation for ${EVENT.name} — please review the details below and respond before ${EVENT.deadline}.`;

  document.getElementById('eventMeta').innerHTML = `
    <div class="meta-item"><label>Event</label><span>${EVENT.name}</span></div>
    <div class="meta-item"><label>Event ID</label><span>${eventId}</span></div>
    <div class="meta-item"><label>Category</label><span>${EVENT.category}</span></div>
    <div class="meta-item"><label>Delivery</label><span>${EVENT.location}</span></div>
    <div class="meta-item"><label>Deadline</label><span class="highlight">${EVENT.deadline}</span></div>
    <div class="meta-item"><label>Currency</label><span>${EVENT.currency}</span></div>`;

  document.getElementById('pricingBody').innerHTML = `
    <tr>
      <td><strong>${EVENT.item}</strong></td>
      <td>${EVENT.specs}</td>
      <td class="qty-cell">${EVENT.qty}</td>
      <td class="price-cell">
        <input type="number" name="unitPrice" form="bidForm" required min="1" class="price-input" placeholder="Enter price" id="unitPriceInput">
      </td>
      <td>${EVENT.location}</td>
    </tr>`;

  document.getElementById('rfqAnswers').innerHTML = EVENT.questions.map((q, i) => `
    <div class="rfq-answer-block">
      <label class="rfq-q" for="answer-${q.key}">
        <span class="q-num">Q${i + 1}</span>
        ${q.label}
      </label>
      <textarea id="answer-${q.key}" name="${q.key}" rows="2" required placeholder="Your answer…"></textarea>
    </div>`).join('');
}

function switchMethod(method) {
  document.querySelectorAll('.method-tab').forEach(tab => {
    const active = tab.dataset.method === method;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', active);
  });
  document.getElementById('panelForm').classList.toggle('active', method === 'form');
  document.getElementById('panelPdf').classList.toggle('active', method === 'pdf');
}

function bidFields(data) {
  return [
    { label: 'Model & specifications', value: data.model, span: true },
    { label: 'Unit price', value: formatPrice(data.unitPrice) },
    { label: 'Delivery timeline', value: data.delivery },
    { label: 'Assembly & installation', value: data.assembly, span: true },
    { label: 'Warranty', value: data.warranty },
    { label: 'GSTIN', value: data.gstin },
    { label: 'Payment terms', value: data.payment },
    { label: 'AMC / year', value: data.amc || '—' },
  ];
}

function renderExtractPreview(data) {
  document.getElementById('extractGrid').innerHTML = bidFields(data).map(f => `
    <div class="preview-item${f.span ? ' span-2' : ''}">
      <label>${f.label}</label>
      <span>${f.value}</span>
    </div>`).join('');
}

function showSuccess(data, source) {
  const total = data.unitPrice * EVENT.qty;
  const ref = `BID-${eventId}-${supplierId}-${Date.now().toString(36).toUpperCase()}`;

  document.getElementById('successMessage').textContent =
    `Aria has understood your ${source === 'pdf' ? 'PDF quotation' : 'form submission'} and mapped all responses to the RFQ requirements.`;

  const questionRows = source === 'form'
    ? EVENT.questions.map((q, i) => `<dt>Q${i + 1}</dt><dd>${data[q.key]}</dd>`).join('')
    : '';

  document.getElementById('successSummary').innerHTML = `
    <dl>
      <dt>Unit price</dt><dd>${formatPrice(data.unitPrice)}</dd>
      <dt>Quantity</dt><dd>${EVENT.qty} chairs</dd>
      <dt>Total bid value</dt><dd>${formatPrice(total)}</dd>
      ${source === 'form' ? questionRows : bidFields(data).map(f => `<dt>${f.label}</dt><dd>${f.value}</dd>`).join('')}
      <dt>Source</dt><dd>${source === 'pdf' ? uploadedFileName : 'Online form'}</dd>
    </dl>`;

  document.getElementById('successRef').textContent =
    `Submission reference: ${ref} · Supplier token: ${token}`;

  document.getElementById('successCard').classList.remove('hidden');
  document.getElementById('successCard').scrollIntoView({ behavior: 'smooth' });
}

function formToBid(form) {
  const bid = { unitPrice: parseInt(form.unitPrice.value, 10) };
  EVENT.questions.forEach(q => { bid[q.key] = form[q.key].value.trim(); });
  bid.model = bid.model;
  return bid;
}

function handlePdf(file) {
  if (!file || file.type !== 'application/pdf') {
    alert('Please upload a PDF file.');
    return;
  }
  uploadedFileName = file.name;
  document.getElementById('pdfZone').classList.add('hidden');
  document.getElementById('extractPreview').classList.add('hidden');
  document.getElementById('aiStatus').classList.remove('hidden');

  setTimeout(() => {
    extractedBid = getDemoExtract();
    document.getElementById('aiStatus').classList.add('hidden');
    renderExtractPreview(extractedBid);
    document.getElementById('extractPreview').classList.remove('hidden');
  }, 1800);
}

function resetPdf() {
  extractedBid = null;
  uploadedFileName = '';
  document.getElementById('pdfInput').value = '';
  document.getElementById('pdfZone').classList.remove('hidden');
  document.getElementById('aiStatus').classList.add('hidden');
  document.getElementById('extractPreview').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  renderEvent();

  document.querySelectorAll('.method-tab').forEach(tab => {
    tab.addEventListener('click', () => switchMethod(tab.dataset.method));
  });

  document.getElementById('bidForm').addEventListener('submit', e => {
    e.preventDefault();
    showSuccess(formToBid(e.target), 'form');
  });

  const pdfInput = document.getElementById('pdfInput');
  const pdfZone = document.getElementById('pdfZone');

  pdfInput.addEventListener('change', e => {
    if (e.target.files[0]) handlePdf(e.target.files[0]);
  });

  pdfZone.addEventListener('dragover', e => { e.preventDefault(); pdfZone.classList.add('dragover'); });
  pdfZone.addEventListener('dragleave', () => pdfZone.classList.remove('dragover'));
  pdfZone.addEventListener('drop', e => {
    e.preventDefault();
    pdfZone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handlePdf(e.dataTransfer.files[0]);
  });

  document.getElementById('pdfReupload').addEventListener('click', resetPdf);

  document.getElementById('pdfConfirm').addEventListener('click', () => {
    if (extractedBid) showSuccess(extractedBid, 'pdf');
  });
});
