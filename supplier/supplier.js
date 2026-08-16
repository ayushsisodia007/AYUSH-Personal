'use strict';

const EVENT = {
  id: 'RFQ-2026-0815-DSK',
  name: 'Office Desks Sourcing — Whitefield — Aug 2026',
  category: 'Office Furniture → Desks',
  location: 'Whitefield, Bangalore',
  deadline: '21 Aug 2026 · 5:00 PM IST',
  currency: 'INR (₹)',
  qty: 50,
  item: 'Office Desk',
  specs: 'Good-quality height-adjustable office desk with monitor arms. Delivery and installation included. Reasonable pricing with GST included.',
  questions: [
    { key: 'model', label: 'Please confirm the exact desk model and specifications, including dimensions and height-adjustment range.' },
    { key: 'monitorArm', label: 'Please confirm the monitor arm specifications, compatibility and maximum supported load.' },
    { key: 'delivery', label: 'Please confirm the delivery timeline to the Whitefield, Bangalore campus.' },
    { key: 'assembly', label: 'Please confirm whether delivery, assembly and installation are included in the quoted price.' },
    { key: 'warranty', label: 'Please confirm the warranty period and coverage, including onsite vs carry-in support.' },
    { key: 'gstPayment', label: 'Please provide GST treatment/GSTIN and payment terms.' },
  ],
};

const SUPPLIERS = {
  1: { name: 'Featherlite Ergo', contact: 'Anita Desai' },
  2: { name: 'Godrej Interio', contact: 'Rahul Mehta' },
  3: { name: 'Durian Industries', contact: 'Priya Nair' },
  4: { name: 'Nilkamal Furniture', contact: 'Vikram Shah' },
  5: { name: 'Spacewood Solutions', contact: 'Deepa Krishnan' },
  6: { name: 'Wipro Furniture', contact: 'Arjun Reddy' },
};

const ACCEPTED_UPLOAD_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const ACCEPTED_UPLOAD_EXT = /\.(pdf|doc|docx|xls|xlsx|jpg|jpeg|png|webp)$/i;

const DEMO_EXTRACT = {
  1: {
    model: 'Optima Sit-Stand Pro — height range 65–125 cm, electric adjust, 140×70 cm desktop',
    monitorArm: 'Dual-arm compatible, 9 kg max load per arm, VESA 75/100',
    unitPrice: 17800,
    delivery: '12 working days to Whitefield, Bangalore campus',
    assembly: 'Included — delivery, assembly and installation in quoted price',
    warranty: '3 years onsite',
    gstPayment: 'GST included · GSTIN 29AABCF1234F1Z5 · Net 45',
    amc: '₹1,200/yr',
  },
  2: {
    model: 'Interio WorkPro Desk — height range 68–120 cm, electric sit-stand',
    monitorArm: 'Single/dual arm, 8 kg max load, clamp and grommet mount',
    unitPrice: 18200,
    delivery: '8 working days to Whitefield, Bangalore campus',
    assembly: 'Included — delivery, assembly and installation in quoted price',
    warranty: '3 years onsite',
    gstPayment: 'GST included · GSTIN 27AABCG5678H1Z2 · Net 30',
    amc: '₹1,350/yr',
  },
  3: {
    model: 'Durian FlexiDesk X — height range 70–118 cm, manual crank adjust',
    monitorArm: 'Single arm, 7 kg max load',
    unitPrice: 18500,
    delivery: '16 working days to Whitefield, Bangalore campus',
    assembly: 'On request — assembly quoted separately',
    warranty: '3 years carry-in',
    gstPayment: 'GST extra at 18% · GSTIN 29AABCD9012K1Z8 · Net 45',
    amc: '₹980/yr',
  },
  4: {
    model: 'Nilkamal Elevate — height range 72–115 cm, electric adjust',
    monitorArm: 'Single arm, 6 kg max load',
    unitPrice: 18800,
    delivery: '13 working days to Whitefield, Bangalore campus',
    assembly: 'Extra charge — ₹350/desk for installation',
    warranty: '2 years carry-in',
    gstPayment: 'GST included · GSTIN 29AABCN3456L1Z1 · Net 60',
    amc: '₹850/yr',
  },
  5: {
    model: 'Spacewood SitPro Electric — height range 66–122 cm',
    monitorArm: 'Dual-arm option, 8 kg max load',
    unitPrice: 18100,
    delivery: '14 working days to Whitefield, Bangalore campus',
    assembly: 'Included — delivery and installation',
    warranty: '3 years onsite',
    gstPayment: 'GST included · GSTIN 29AABCS7890M1Z3 · Net 45',
    amc: '₹1,100/yr',
  },
  6: {
    model: 'Wipro WorkStation Pro — height range 70–120 cm, electric adjust',
    monitorArm: 'Single/dual arm, 7 kg max load',
    unitPrice: 17950,
    delivery: '15 working days to Whitefield, Bangalore campus',
    assembly: 'Included for bulk campus orders',
    warranty: '3 years onsite',
    gstPayment: 'GST included · GSTIN 29AABCW2345N1Z4 · Net 45',
    amc: '₹1,050/yr',
  },
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

function isAcceptedFile(file) {
  if (!file) return false;
  return ACCEPTED_UPLOAD_TYPES.includes(file.type) || ACCEPTED_UPLOAD_EXT.test(file.name);
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
    <div class="meta-item"><label>Delivery Location</label><span>${EVENT.location}</span></div>
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
  document.getElementById('panelUpload').classList.toggle('active', method === 'upload');
}

function bidFields(data) {
  return [
    { label: 'Desk model & specifications', value: data.model, span: true },
    { label: 'Monitor arm', value: data.monitorArm, span: true },
    { label: 'Unit price', value: formatPrice(data.unitPrice) },
    { label: 'Delivery timeline', value: data.delivery },
    { label: 'Delivery, assembly & installation', value: data.assembly, span: true },
    { label: 'Warranty', value: data.warranty },
    { label: 'GST & payment terms', value: data.gstPayment, span: true },
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

function sourceLabel(source) {
  if (source === 'upload') return uploadedFileName || 'Uploaded document';
  return 'Online form';
}

function showSuccess(data, source) {
  const total = data.unitPrice * EVENT.qty;
  const ref = `BID-${eventId}-${supplierId}-${Date.now().toString(36).toUpperCase()}`;

  document.getElementById('successMessage').textContent =
    `Aria has understood your ${source === 'upload' ? 'uploaded document' : 'form submission'} and mapped all responses to the RFQ requirements.`;

  const questionRows = source === 'form'
    ? EVENT.questions.map((q, i) => `<dt>Q${i + 1}</dt><dd>${data[q.key]}</dd>`).join('')
    : '';

  document.getElementById('successSummary').innerHTML = `
    <dl>
      <dt>Unit price</dt><dd>${formatPrice(data.unitPrice)}</dd>
      <dt>Quantity</dt><dd>${EVENT.qty} units</dd>
      <dt>Total bid value</dt><dd>${formatPrice(total)}</dd>
      ${source === 'form' ? questionRows : bidFields(data).map(f => `<dt>${f.label}</dt><dd>${f.value}</dd>`).join('')}
      <dt>Source</dt><dd>${sourceLabel(source)}</dd>
    </dl>`;

  document.getElementById('successRef').textContent =
    `Submission reference: ${ref} · Supplier token: ${token}`;

  document.getElementById('successCard').classList.remove('hidden');
  document.getElementById('successCard').scrollIntoView({ behavior: 'smooth' });
}

function formToBid(form) {
  const bid = { unitPrice: parseInt(form.unitPrice.value, 10) };
  EVENT.questions.forEach(q => { bid[q.key] = form[q.key].value.trim(); });
  return bid;
}

function handleUpload(file) {
  if (!isAcceptedFile(file)) {
    alert('Please upload a supported file — PDF, Word, Excel, or image (JPG, PNG).');
    return;
  }
  uploadedFileName = file.name;
  document.getElementById('uploadZone').classList.add('hidden');
  document.getElementById('extractPreview').classList.add('hidden');
  document.getElementById('aiStatus').classList.remove('hidden');
  document.querySelector('#aiStatus p').textContent =
    'Aria is reading your document and extracting bid details…';

  setTimeout(() => {
    extractedBid = getDemoExtract();
    document.getElementById('aiStatus').classList.add('hidden');
    renderExtractPreview(extractedBid);
    document.getElementById('extractPreview').classList.remove('hidden');
  }, 1800);
}

function resetUpload() {
  extractedBid = null;
  uploadedFileName = '';
  document.getElementById('uploadInput').value = '';
  document.getElementById('uploadZone').classList.remove('hidden');
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

  const uploadInput = document.getElementById('uploadInput');
  const uploadZone = document.getElementById('uploadZone');

  uploadInput.addEventListener('change', e => {
    if (e.target.files[0]) handleUpload(e.target.files[0]);
  });

  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]);
  });

  document.getElementById('uploadReupload').addEventListener('click', resetUpload);

  document.getElementById('uploadConfirm').addEventListener('click', () => {
    if (extractedBid) showSuccess(extractedBid, 'upload');
  });
});
