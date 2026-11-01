/* ==========================================================================
   02-seed: one connected sample dataset. All companies and people are fictional.
   ========================================================================== */
const ENRICH = { /* simulated enrichment source: a small built-in table, not a live data provider */
  'cirrus air': { ind: 'Aviation', emp: 4200, loc: 'Mumbai', site: 'cirrusair.example', intent: ['Visited the pricing page 3 times this week (simulated signal)', 'Compared with Vantage HR on a review site (simulated signal)', 'Three colleagues viewed the case study (simulated signal)'] },
  'deccan wings': { ind: 'Aviation', emp: 2600, loc: 'Hyderabad', site: 'deccanwings.example', intent: ['Downloaded the shift-scheduling guide (simulated signal)'] },
  'meghdoot airports': { ind: 'Aviation', emp: 3300, loc: 'Delhi', site: 'meghdoot.example', intent: [] },
  'arrow cargo air': { ind: 'Aviation', emp: 1500, loc: 'Chennai', site: 'arrowcargo.example', intent: ['Opened two outreach emails (simulated signal)'] },
  'lakshya aviation services': { ind: 'Aviation', emp: 900, loc: 'Bengaluru', site: 'lakshya.example', intent: [] },
  'skyline cargo': { ind: 'Logistics', emp: 800, loc: 'Mumbai', site: 'skylinecargo.example', intent: ['Attended the webinar live (simulated signal)', 'Asked about payroll sync in chat (simulated signal)'] },
  'fortis retail': { ind: 'Retail', emp: 5400, loc: 'Delhi', site: 'fortisretail.example', intent: ['Requested a pricing call (simulated signal)'] },
  'anand logistics': { ind: 'Logistics', emp: 1200, loc: 'Ahmedabad', site: 'anandlogistics.example', intent: [] },
  'greenleaf energy': { ind: 'Energy', emp: 650, loc: 'Pune', site: 'greenleaf.example', intent: ['Referred by Helio Solar (CRM record)'] }
};
const STAGE_DEFAULT_PROB = { Discovery: 10, Demo: 25, Proposal: 50, Negotiation: 75, Won: 100, Lost: 0 };

function seedDb() {
  const slug = n => normCo(n).replace(/\s+/g, '');
  const acc = (id, n, ind, emp, loc, type, own, arr, life, renew, last, tk) => ({ id, n, ind, emp, size: sizeLabel(emp), loc, site: slug(n) + '.example', type, own, arr, life, renew, last, tk: tk || [], note: '', custom: {}, created: -200 });
  const accounts = [
    acc('harbor', 'Harbor Bank', 'Banking', 2400, 'Mumbai', 'Customer', 'AS', 42, 126, 118, 0, [{ id: 'SUP-4098', p: 'P3', d: 6, s: 'Report export is slow' }]),
    acc('meridian', 'Meridian Retail', 'Retail', 3100, 'Pune', 'Customer', 'AS', 18, 54, 74, -12, [{ id: 'SUP-4116', p: 'P2', d: 1, s: 'Shift sync failing at 3 stores' }, { id: 'SUP-4061', p: 'P3', d: 9, s: 'Wrong holiday calendar' }]),
    acc('cobalt', 'Cobalt Logistics', 'Logistics', 1500, 'Delhi', 'Customer', 'TN', 26, 78, 47, -3, [{ id: 'SUP-4102', p: 'P2', d: 3, s: 'Login errors for drivers' }, { id: 'SUP-4107', p: 'P2', d: 1, s: 'Payroll run delayed' }, { id: 'SUP-4109', p: 'P3', d: 5, s: 'Mobile app crash on Android 12' }]),
    acc('nimbus', 'Nimbus Telecom', 'Telecom', 5200, 'Bengaluru', 'Customer', 'AS', 31, 93, 201, -4),
    acc('lotus', 'Lotus Hospitals', 'Healthcare', 1800, 'Chennai', 'Customer', 'AS', 12, 24, 88, -2, [{ id: 'SUP-4113', p: 'P3', d: 2, s: 'Leave balance mismatch' }, { id: 'SUP-4118', p: 'P3', d: 0, s: 'Duty roster print layout' }]),
    acc('zenith', 'Zenith Pharma', 'Pharma', 650, 'Hyderabad', 'Customer', 'AS', 22, 44, 150, -5, [{ id: 'SUP-4104', p: 'P3', d: 3, s: 'Slow dashboard' }]),
    acc('atlas', 'Atlas Auto Parts', 'Manufacturing', 900, 'Pune', 'Customer', 'AS', 12, 12, 330, -8, [{ id: 'SUP-4099', p: 'P3', d: 4, s: 'Overtime rule needs update' }]),
    acc('helio', 'Helio Solar', 'Energy', 420, 'Jaipur', 'Customer', 'MI', 10, 10, 345, -13),
    acc('nova', 'Nova Education', 'Education', 260, 'Kolkata', 'Customer', 'DM', 5, 5, 360, -17, [{ id: 'SUP-4117', p: 'P3', d: 1, s: 'Attendance import error' }]),
    acc('kiran', 'Kiran Textiles', 'Manufacturing', 700, 'Surat', 'Customer', 'TN', 15, 30, 96, -6, [{ id: 'SUP-4091', p: 'P3', d: 5, s: 'Piece-rate report wrong' }, { id: 'SUP-4115', p: 'P3', d: 1, s: 'PF challan export fails' }]),
    acc('rudra', 'Rudra Steels', 'Manufacturing', 1100, 'Nagpur', 'Customer', 'AS', 15, 15, 340, -10),
    acc('kaveri', 'Kaveri Clinics', 'Healthcare', 380, 'Kochi', 'Customer', 'MI', 16, 16, 335, -14),
    acc('orion', 'Orion Steel', 'Manufacturing', 2200, 'Jamshedpur', 'Prospect', 'RK', 0, 0, null, -1),
    acc('vertex', 'Vertex Insurance', 'Banking', 1900, 'Mumbai', 'Prospect', 'MI', 0, 0, null, -9),
    acc('pinnacle', 'Pinnacle Foods', 'Manufacturing', 1300, 'Nashik', 'Prospect', 'DM', 0, 0, null, -4),
    acc('bluewave', 'BlueWave Shipping', 'Logistics', 950, 'Kochi', 'Prospect', 'MI', 0, 0, null, -3),
    acc('kavach', 'Kavach Security', 'Services', 2800, 'Gurugram', 'Prospect', 'DM', 0, 0, null, -11),
    acc('sunrise', 'Sunrise Dairy', 'Manufacturing', 600, 'Anand', 'Prospect', 'AS', 0, 0, null, -6),
    acc('tristar', 'Tri-Star Hotels', 'Hospitality', 1400, 'Goa', 'Prospect', 'AS', 0, 0, null, -12),
    acc('gamma', 'Gamma Textiles', 'Manufacturing', 240, 'Surat', 'Prospect', 'DM', 0, 0, null, -30),
    acc('metro', 'Metro Bakeries', 'Retail', 310, 'Delhi', 'Prospect', 'DM', 0, 0, null, -44)
  ];

  const ph = n => { const h = String(hashStr(n)).padStart(9, '0').slice(-9); return '+91 9' + h.slice(0, 4) + ' ' + h.slice(4, 9); };
  const ct = (id, a, name, title, role, sent, inf, extra) => { const ac = accounts.filter(x => x.id === a)[0]; const p = name.replace(/^(Dr\.|Prof\.|Capt\.)\s*/, '').toLowerCase().split(' '); return Object.assign({ id, acc: a, name, title, role, sent, inf, email: p[0] + '.' + p[p.length - 1] + '@' + ac.site, phone: ph(name), last: -5, reports: null, custom: {} }, extra || {}); };
  const contacts = [
    ct('priya', 'harbor', 'Priya Menon', 'CFO', 'Influencer', 'Neutral', 4, { last: 0 }), ct('rahul', 'harbor', 'Rahul Desai', 'VP Human Resources', 'Champion', 'Supportive', 3, { last: -5, reports: 'priya' }),
    ct('karan', 'meridian', 'Karan Bedi', 'COO', 'Economic buyer', 'Neutral', 5, { last: -20 }), ct('sunita', 'meridian', 'Sunita Rao', 'Head of Store Operations', 'Champion', 'Supportive', 3, { last: -12, reports: 'karan' }), ct('imran', 'meridian', 'Imran Qureshi', 'IT Manager', 'Technical evaluator', 'Neutral', 2, { last: -25, reports: 'karan' }),
    ct('farhan', 'cobalt', 'Farhan Sheikh', 'Operations Director', 'Decision maker', 'Neutral', 4, { last: -3 }), ct('neelam', 'cobalt', 'Neelam Gupta', 'CFO', 'Economic buyer', 'Neutral', 5, { last: -30 }), ct('dinesh', 'cobalt', 'Dinesh Pillai', 'Dispatch Lead', 'Champion', 'Supportive', 2, { last: -3, reports: 'farhan' }), ct('vijay', 'cobalt', 'Vijay Rane', 'IT Head', 'Blocker', 'Resistant', 3, { last: -4, reports: 'neelam' }),
    ct('leena', 'nimbus', 'Leena Pillai', 'VP Human Resources', 'Champion', 'Supportive', 4, { last: -5 }), ct('rohit', 'nimbus', 'Rohit Bansal', 'CFO', 'Economic buyer', 'Neutral', 5, { last: -40 }), ct('sanjay', 'nimbus', 'Sanjay Mehta', 'CTO', 'Technical evaluator', 'Neutral', 3, { last: -22 }),
    ct('neha', 'lotus', 'Dr. Neha Rao', 'Hospital Administrator', 'Decision maker', 'Neutral', 5, { last: -2 }), ct('anita', 'lotus', 'Anita Fernandes', 'HR Manager', 'Champion', 'Supportive', 3, { last: -2, reports: 'neha' }),
    ct('ishaan', 'zenith', 'Ishaan Verma', 'QA Head', 'Champion', 'Supportive', 3, { last: -5 }), ct('meenal', 'zenith', 'Dr. Meenal Shah', 'Managing Director', 'Economic buyer', 'Neutral', 5, { last: -60 }), ct('prakash', 'zenith', 'Prakash Iyer', 'IT Lead', 'Technical evaluator', 'Neutral', 2, { last: -15 }),
    ct('vivek', 'atlas', 'Vivek Kulkarni', 'CFO', 'Economic buyer', 'Supportive', 5, { last: -8 }), ct('smita', 'atlas', 'Smita Joshi', 'HR Head', 'Champion', 'Supportive', 3, { last: -8 }),
    ct('ritu', 'helio', 'Ritu Anand', 'COO', 'Decision maker', 'Supportive', 4, { last: -13 }), ct('ajay', 'helio', 'Ajay Nair', 'Finance Manager', 'Influencer', 'Neutral', 2, { last: -20 }),
    ct('anil', 'nova', 'Prof. Anil Das', 'Registrar', 'Decision maker', 'Neutral', 4, { last: -17 }),
    ct('hetal', 'kiran', 'Hetal Parekh', 'Owner', 'Economic buyer', 'Neutral', 5, { last: -6 }), ct('bhavin', 'kiran', 'Bhavin Shah', 'Payroll Lead', 'Champion', 'Neutral', 2, { last: -1 }),
    ct('mahesh', 'rudra', 'Mahesh Rudra', 'Managing Director', 'Economic buyer', 'Supportive', 5, { last: -10 }), ct('deepa', 'rudra', 'Deepa Menon', 'HR Manager', 'Champion', 'Supportive', 3, { last: -10 }),
    ct('suresh', 'kaveri', 'Dr. Suresh Kaveri', 'Founder', 'Economic buyer', 'Supportive', 5, { last: -14 }), ct('latha', 'kaveri', 'Latha Nair', 'Administrator', 'Champion', 'Supportive', 3, { last: -14 }),
    ct('kabir', 'orion', 'Kabir Rao', 'Finance Head', 'Economic buyer', 'Supportive', 5, { last: -1 }), ct('neeraj', 'orion', 'Neeraj Singh', 'HR Director', 'Champion', 'Supportive', 4, { last: -1 }), ct('pallavi', 'orion', 'Pallavi Das', 'IT Manager', 'Technical evaluator', 'Neutral', 2, { last: -8 }),
    ct('shalini', 'vertex', 'Shalini Joshi', 'CHRO', 'Decision maker', 'Neutral', 5, { last: -9 }),
    ct('sameer', 'pinnacle', 'Sameer Joshi', 'Plant Head', 'Decision maker', 'Supportive', 4, { last: -4 }), ct('kavita', 'pinnacle', 'Kavita More', 'HR Manager', 'Champion', 'Supportive', 3, { last: -4 }),
    ct('anitad', 'bluewave', 'Anita Dsouza', 'Crew Manager', 'Champion', 'Supportive', 3, { last: -3 }), ct('raman', 'bluewave', 'Capt. Raman Pillai', 'COO', 'Economic buyer', 'Neutral', 5, { last: -14 }), ct('tushar', 'bluewave', 'Tushar Gandhi', 'Procurement Head', 'Blocker', 'Resistant', 3, { last: -3 }),
    ct('rajat', 'kavach', 'Rajat Sethi', 'Director', 'Decision maker', 'Neutral', 4, { last: -11 }),
    ct('pooja', 'sunrise', 'Pooja Nambiar', 'HR Lead', 'Champion', 'Supportive', 3, { last: -6 }), ct('amit', 'sunrise', 'Amit Patel', 'CFO', 'Economic buyer', 'Neutral', 5, { last: -30 }),
    ct('gaurav', 'tristar', 'Gaurav Malik', 'General Manager', 'Decision maker', 'Resistant', 4, { last: -12 }), ct('mohan', 'gamma', 'Mohan Lal', 'Owner', 'Decision maker', 'Neutral', 4, { last: -30 }), ct('rekha', 'metro', 'Rekha Shetty', 'Owner', 'Decision maker', 'Neutral', 4, { last: -44 })
  ];
  const cm = a => contacts.filter(c => c.acc === a && c.role !== 'User').map(c => c.id);

  const products = [{ id: 'p-sched', n: 'Workforce Scheduling', price: 8, cat: 'Core' }, { id: 'p-pay', n: 'Payroll Sync', price: 6, cat: 'Core' }, { id: 'p-comp', n: 'Compliance Suite', price: 5, cat: 'Add-on' }, { id: 'p-crew', n: 'Crew Rostering', price: 9, cat: 'Core' }, { id: 'p-app', n: 'Mobile Crew App', price: 3, cat: 'Add-on' }, { id: 'p-ana', n: 'Analytics Pro', price: 4, cat: 'Add-on' }];

  const deal = (id, a, desc, stage, v, own, due, o) => Object.assign({ id: 'd-' + id, acc: a, desc, stage, v, own, due, origDue: due, slip: 0, prob: null, fc: null, comps: [], prods: [], decide: null, cm: 2, fl: 1, next: '', risk: '', type: 'New business', rec: false, cycle: null, created: -30, budget: '', lostReason: '', lostNote: '', lostTo: '', proposalSent: null, committee: cm(a), custom: {} }, o || {});
  const deals = [
    deal('harbor', 'harbor', 'HR and payroll platform for 2,400 employees', 'Demo', 20, 'AS', 5, { type: 'Expansion', fc: 'Best Case', prods: ['p-sched', 'p-pay'], decide: 11, cm: 6, fl: 3, next: '', created: -25 }),
    deal('meridian', 'meridian', 'Store staffing and shift planning across 140 stores', 'Proposal', 14, 'AS', 9, { fc: 'Best Case', prods: ['p-sched'], decide: 14, cm: 4, fl: 2, next: 'Follow up on proposal', risk: 'Champion silent for 12 days', slip: 1, proposalSent: -14, created: -45 }),
    deal('lotus', 'lotus', 'Expansion to three new hospital sites', 'Negotiation', 9, 'AS', 12, { type: 'Expansion', fc: 'Commit', prods: ['p-sched', 'p-ana'], decide: 10, cm: 7, fl: 4, next: 'Redline MSA with legal', created: -50 }),
    deal('nimbus', 'nimbus', 'New region rollout, 900 field staff', 'Discovery', 30, 'AS', 21, { type: 'Expansion', fc: 'Pipeline', prods: ['p-sched', 'p-app', 'p-pay'], decide: 40, rec: true, next: 'Discovery call 2', created: -12 }),
    deal('zenith', 'zenith', 'Compliance add-on for audit trails', 'Demo', 7, 'AS', 14, { type: 'Expansion', fc: 'Pipeline', prods: ['p-comp'], decide: 30, cm: 3, next: 'Find budget owner', created: -20 }),
    deal('cobalt', 'cobalt', 'Annual renewal and driver app upgrade', 'Negotiation', 26, 'TN', 47, { type: 'Renewal', fc: 'Commit', prods: ['p-sched', 'p-app'], decide: 40, cm: 9, fl: 5, next: 'Exec call on support issues', risk: 'Health Orange: 2 P2 tickets this week', created: -60 }),
    deal('orion', 'orion', 'Payroll migration from legacy system', 'Demo', 18, 'RK', 10, { fc: 'Best Case', prods: ['p-pay', 'p-comp'], decide: 20, rec: true, cm: 5, fl: 2, next: 'Pilot with 200 staff', created: -33 }),
    deal('vertex', 'vertex', 'Agent onboarding and licence tracking module', 'Discovery', 24, 'MI', 28, { fc: 'Pipeline', prods: ['p-sched', 'p-comp'], decide: 45, cm: 1, fl: 0, next: 'Book intro call', created: -9 }),
    deal('pinnacle', 'pinnacle', 'Shift scheduling for three plants', 'Proposal', 11, 'DM', 6, { fc: 'Commit', prods: ['p-sched'], decide: 8, rec: true, cm: 3, fl: 2, next: 'Send revised quote', proposalSent: -4, created: -28 }),
    deal('bluewave', 'bluewave', 'Crew rostering for 60 vessels', 'Negotiation', 16, 'MI', 8, { fc: 'Best Case', prods: ['p-crew', 'p-app'], decide: 14, comps: ['Plumeria'], cm: 8, fl: 3, next: 'Match pricing with Plumeria', risk: 'Competitor Plumeria is in the deal', slip: 2, proposalSent: -20, created: -55 }),
    deal('kavach', 'kavach', 'Guard roster and compliance tracking', 'Discovery', 6, 'DM', 18, { fc: 'Pipeline', prods: ['p-sched', 'p-comp'], decide: 30, cm: 1, fl: 0, next: 'Send case study', created: -6 }),
    deal('sunrise', 'sunrise', 'Route staff attendance and payroll', 'Demo', 8, 'AS', 11, { fc: 'Pipeline', prods: ['p-pay'], decide: 20, cm: 2, fl: 1, next: 'Demo recap email', created: -15 }),
    deal('atlas', 'atlas', 'Payroll and leave management', 'Won', 12, 'AS', -9, { prods: ['p-pay'], cm: 5, fl: 3, next: 'Onboarding kickoff', cycle: 38, created: -47, prob: 100 }),
    deal('helio', 'helio', 'Field crew scheduling', 'Won', 10, 'MI', -16, { prods: ['p-sched', 'p-app'], cm: 4, fl: 2, next: 'Onboarding kickoff', cycle: 41, created: -57 }),
    deal('nova', 'nova', 'Faculty payroll and attendance', 'Won', 5, 'DM', -21, { prods: ['p-pay'], cm: 2, fl: 1, next: 'Training session', cycle: 27, created: -48 }),
    deal('rudra', 'rudra', 'Payroll and shift scheduling for two plants', 'Won', 15, 'AS', -26, { prods: ['p-pay', 'p-sched'], cm: 6, fl: 2, next: 'Onboarding kickoff', cycle: 52, created: -78 }),
    deal('kaveri', 'kaveri', 'Clinic staff scheduling', 'Won', 16, 'MI', -28, { prods: ['p-sched'], cm: 5, fl: 2, next: 'Onboarding kickoff', cycle: 45, created: -73 }),
    deal('tristar', 'tristar', 'Housekeeping shift planning', 'Lost', 13, 'AS', -12, { lostReason: 'Lost to competitor', lostTo: 'Vantage HR', comps: ['Vantage HR'], prods: ['p-sched'], cm: 6, fl: 2, created: -70 }),
    deal('gamma', 'gamma', 'Piece-rate payroll', 'Lost', 7, 'DM', -30, { lostReason: 'No budget', lostNote: 'Budget freeze announced by the owner.', prods: ['p-pay'], cm: 3, fl: 1, created: -66 }),
    deal('metro', 'metro', 'Bakery shift scheduling', 'Lost', 6, 'DM', -44, { lostReason: 'Price too high', lostTo: 'Plumeria', comps: ['Plumeria'], prods: ['p-sched'], cm: 3, fl: 1, created: -85 })
  ];
  deals.forEach(d => { if (d.stage === 'Won' || d.stage === 'Lost') d.fc = null; });

  const X = (type, subj, when, time, own, link, done, notes, extra) => Object.assign({ type, subj, when, time, own, link: link || {}, done: !!done, notes: notes || '', dur: 30 }, extra || {});
  const acts = [
    X('call', 'Harbor Bank: pricing and rollout call', 0, '11:30', 'AS', { acc: 'harbor', con: 'priya', deal: 'd-harbor' }, true, 'Recorded and transcribed.', { dur: 28, callId: 'c1' }),
    X('meeting', 'Harbor Bank: shift scheduling demo', -7, '15:00', 'AS', { acc: 'harbor', con: 'rahul', deal: 'd-harbor' }, true, 'Demo covered shift scheduling and payroll sync.', { dur: 60 }),
    X('email', 'Sent: demo recap to Harbor Bank', -6, '10:20', 'AS', { acc: 'harbor', con: 'priya', deal: 'd-harbor' }, true, 'Recap and pricing outline.'),
    X('call', 'Orion Steel: SSO and pilot scope', -1, '16:00', 'RK', { acc: 'orion', con: 'kabir', deal: 'd-orion' }, true, 'Kabir wants SSO and a 200-person pilot.', { dur: 22, callId: 'c2' }),
    X('call', 'BlueWave Shipping: pricing comparison', -3, '14:30', 'MI', { acc: 'bluewave', con: 'anitad', deal: 'd-bluewave' }, true, 'Plumeria pricing is the open issue.', { dur: 35, callId: 'c3' }),
    X('call', 'Pinnacle Foods: scope sign-off', -4, '10:00', 'DM', { acc: 'pinnacle', con: 'sameer', deal: 'd-pinnacle' }, true, 'Approved scope for two plants.', { dur: 18, callId: 'c4' }),
    X('call', 'Nimbus Telecom: workforce discovery', -5, '12:15', 'AS', { acc: 'nimbus', con: 'leena', deal: 'd-nimbus' }, true, 'Field workforce across four states.', { dur: 41, callId: 'c5' }),
    X('email', 'Proposal sent to Meridian Retail', -14, '09:30', 'AS', { acc: 'meridian', con: 'karan', deal: 'd-meridian' }, true, 'Proposal for 140 stores.'),
    X('email', 'Reply from Sunita Rao (Meridian)', -12, '17:05', 'AS', { acc: 'meridian', con: 'sunita', deal: 'd-meridian' }, true, 'Asked for a store-level pilot. Last reply received.'),
    X('meeting', 'Meridian Retail: store ops walkthrough', -25, '11:00', 'AS', { acc: 'meridian', con: 'sunita', deal: 'd-meridian' }, true, 'Walked through 6 stores.', { dur: 90 }),
    X('call', 'Cobalt Logistics: payroll delay escalation', -1, '13:00', 'TN', { acc: 'cobalt', con: 'farhan' }, true, 'Farhan frustrated by the delayed payroll run. Fix promised by Tuesday.', { dur: 25 }),
    X('note', 'Cobalt Logistics: renewal strategy', -10, '09:00', 'TN', { acc: 'cobalt', deal: 'd-cobalt' }, true, 'Vijay Rane (IT) is resistant after the driver login errors. Neelam (CFO) owns renewal budget.'),
    X('email', 'Sent: SOC 2 report to Nimbus Telecom', -6, '14:00', 'AS', { acc: 'nimbus', con: 'leena' }, true, 'Security documents shared.'),
    X('meeting', 'Lotus Hospitals: MSA review', -9, '12:00', 'AS', { acc: 'lotus', con: 'neha', deal: 'd-lotus' }, true, 'Legal flagged 3 clauses.', { dur: 45 }),
    X('call', 'Zenith Pharma: audit trail requirements', -5, '15:30', 'AS', { acc: 'zenith', con: 'ishaan', deal: 'd-zenith' }, true, 'Ishaan is keen, but budget owner unknown.', { dur: 20 }),
    X('note', 'Kiran Textiles: payroll report issues', -5, '11:15', 'TN', { acc: 'kiran', con: 'bhavin' }, true, 'Two report bugs raised in the same week.'),
    X('meeting', 'Pipeline review with Meera', 1, '10:00', 'AS', {}, false, 'Weekly forecast review.', { dur: 45 }),
    X('meeting', 'Orion Steel: pilot planning', 3, '14:00', 'RK', { acc: 'orion', con: 'kabir', deal: 'd-orion' }, false, 'Agree pilot success criteria.', { dur: 60 }),
    X('meeting', 'Weekly forecast call', 5, '16:00', 'MI', {}, false, 'Team forecast call.', { dur: 45 }),
    X('reminder', 'Harbor Bank: Priya takes the quote to the board', 11, '09:00', 'AS', { acc: 'harbor', con: 'priya', deal: 'd-harbor' }, false, 'Board meeting on 12 Nov.'),
    X('task', 'Review proposed updates from the Harbor Bank call', 0, '12:00', 'AS', { acc: 'harbor', deal: 'd-harbor' }, false, 'Approving takes about 10 seconds.', { ai: true, auto: 'calls', p: 75 }),
    X('task', 'Send Priya the quote and SOC 2 report', 5, '17:00', 'AS', { acc: 'harbor', con: 'priya', deal: 'd-harbor' }, false, 'She takes it to the board on the 12th.', { ai: true, p: 50 }),
    X('task', 'Book an exec call with Cobalt Logistics', 3, '12:00', 'TN', { acc: 'cobalt', con: 'farhan', deal: 'd-cobalt' }, false, 'Health is Orange and renewal is in 47 days.', { ai: true, p: 25 }),
    X('task', 'Build the aviation target list', 4, '12:00', 'AS', {}, false, 'Competitors won 2 aviation accounts.', { ai: true, auto: 'targets', p: 10 }),
    X('task', 'Re-engage the Meridian Retail champion', 0, '15:00', 'AS', { acc: 'meridian', con: 'sunita', deal: 'd-meridian' }, false, 'No reply for 12 days. A P2 ticket is open too.', { ai: true, p: 40 }),
    X('task', 'Prepare a pricing response for BlueWave Shipping', 8, '12:00', 'MI', { acc: 'bluewave', deal: 'd-bluewave' }, false, 'Plumeria cut annual-plan prices by 12%.', { ai: true, p: 20 }),
    X('task', 'Send Orion Steel the pilot plan', 9, '12:00', 'RK', { acc: 'orion', con: 'kabir', deal: 'd-orion' }, false, 'Kabir asked for it by the 10th.'),
    X('task', 'Update stakeholder map for Zenith Pharma', 10, '12:00', 'AS', { acc: 'zenith', deal: 'd-zenith' }, false, 'No economic buyer engaged on record.'),
    X('task', 'Weekly pipeline review prep', 5, '09:00', 'AS', {}, false, 'Forecast call prep.'),
    X('followup', 'Send revised quote to Pinnacle Foods', -1, '12:00', 'DM', { acc: 'pinnacle', con: 'sameer', deal: 'd-pinnacle' }, false, 'Quote includes the third plant as phase two.'),
    X('followup', 'Reply to Lotus Hospitals legal redline', -3, '12:00', 'AS', { acc: 'lotus', con: 'neha', deal: 'd-lotus' }, false, 'Legal sent 3 clause changes.'),
    X('followup', 'Share SOC 2 summary with Nimbus CTO', -2, '12:00', 'AS', { acc: 'nimbus', con: 'sanjay', deal: 'd-nimbus' }, false, 'Sanjay asked for it on the last call.'),
    X('task', 'Log notes for Kiran Textiles check-in', -1, '12:00', 'TN', { acc: 'kiran' }, false, '')
  ].map((a, i) => Object.assign(a, { id: 'A-' + (i + 1) }));

  const call = (id, a, d, con, who, when, time, min, tone, sum, items, extra) => Object.assign({ id, acc: a, deal: d, con, who, when, time, min, tone, sum, items, transcript: [], processed: true }, extra || {});
  const calls = [
    call('c1', 'harbor', 'd-harbor', 'priya', 'Priya Menon', 0, '11:30', 28, 'Positive', 'Priya confirmed a budget of about ₹20 lakh, asked for a formal quote by Friday and will take it to the board on the 12th. Vantage HR has also sent a proposal. Arjun (IT) must clear the security review.', [], {
      transcript: [
        { who: 'You', t: "Thanks for making time, Priya. Last week's demo covered shift scheduling and payroll sync. Any questions?" }, { who: 'Priya', t: 'Mostly good. The payroll sync is what the team liked most.' },
        { who: 'Priya', t: "We've set aside about twenty lakh for this year, so anything around that works for us." }, { who: 'Priya', t: 'I sign off on spend, but Arjun from IT will need to clear the security review.' },
        { who: 'Priya', t: 'Honestly, we are also looking at Vantage HR. They sent us a proposal last week.' }, { who: 'Priya', t: "Send us a formal quote by Friday and I'll take it to the board on the 12th." },
        { who: 'Arjun', t: "(joined) I'll need your SOC 2 report and data residency details before then." }, { who: 'You', t: "Will do. I'll send both along with the quote." }]
    }),
    call('c2', 'orion', 'd-orion', 'kabir', 'Kabir Rao', -1, '16:00', 22, 'Positive', 'Kabir wants SSO and a pilot with 200 staff before committing. Payroll accuracy is the main worry.', ['Stage kept at Demo', 'Next step: pilot plan by 10 Nov', 'New requirement: SSO']),
    call('c3', 'bluewave', 'd-bluewave', 'anitad', 'Anita Dsouza', -3, '14:30', 35, 'Mixed', 'Anita compared us with Plumeria on crew rostering. Features match, price is the open issue. Decision by 15 Nov.', ['Competitor added: Plumeria', 'Risk flagged: price pressure', 'Next step: revised pricing']),
    call('c4', 'pinnacle', 'd-pinnacle', 'sameer', 'Sameer Joshi', -4, '10:00', 18, 'Positive', 'Sameer approved the scope for two plants and asked for a revised quote including the third plant as phase two.', ['Stage moved to Proposal', 'Budget confirmed: ₹11L', 'Next step: send quote']),
    call('c5', 'nimbus', 'd-nimbus', 'leena', 'Leena Pillai', -5, '12:15', 41, 'Positive', 'Leena described a 900-person field workforce across 4 states. Wants a security walkthrough and references from telecom.', ['Contact added: Leena Pillai', 'Reference request noted', 'Next step: discovery call 2'])
  ];

  const L = (id, name, title, company, ind, emp, loc, source, own, status, score, created, intent, extra) => Object.assign({ id, name, title, company, ind, emp, size: sizeLabel(emp), loc, source, own, status, score, created, email: name.toLowerCase().replace(/[^a-z ]/g, '').split(' ').filter(Boolean).filter((w, i, a) => i === 0 || i === a.length - 1).join('.') + '@' + slug(company) + '.example', phone: ph(name), site: slug(company) + '.example', intent: intent || [], bant: { b: false, a: false, n: false, t: false }, notes: '', enriched: false, dq: '', conv: null, priority: null, custom: {} }, extra || {});
  const leads = [
    L('L-1', 'Aarav Bhatia', 'Head of Operations', 'Skyline Cargo', 'Logistics', 800, 'Mumbai', 'Webinar', 'AS', 'New', null, -1, ['Attended the webinar live (simulated signal)', 'Asked about payroll sync in chat (simulated signal)']),
    L('L-2', 'Neha Kulkarni', 'HR Director', 'GreenLeaf Energy', 'Energy', 650, 'Pune', 'Referral', 'AS', 'Contacted', 74, -4, ['Referred by Helio Solar (CRM record)'], { enriched: true, priority: 'Medium' }),
    L('L-3', 'Divya Rao', 'Payroll Manager', 'Orion Steel Ltd', 'Manufacturing', 2200, 'Jamshedpur', 'Website demo request', 'DM', 'New', null, 0, ['Requested a demo on the website (CRM form)']),
    L('L-4', 'Sandeep Khanna', 'VP Finance', 'Fortis Retail Group', 'Retail', 5400, 'Delhi', 'Event', 'DM', 'Qualified', 82, -9, ['Requested a pricing call (simulated signal)', 'Visited the pricing page twice (simulated signal)'], { enriched: true, priority: 'High', bant: { b: true, a: true, n: true, t: false } }),
    L('L-5', 'Mitali Shah', 'CHRO', 'Zenith Pharma', 'Pharma', 650, 'Hyderabad', 'Inbound email', 'AS', 'Nurturing', 58, -15, [], { enriched: true, priority: 'Medium', notes: 'Asked about an extra module. Existing customer: route to the account owner.' }),
    L('L-6', 'Yash Agarwal', 'Administrator', 'Sagar Hospitals', 'Healthcare', 420, 'Nagpur', 'Cold outreach', 'DM', 'Contacted', 49, -6, [], { enriched: true, priority: 'Low' }),
    L('L-7', 'Pooja Iyer', 'COO', 'Anand Logistics', 'Logistics', 1200, 'Ahmedabad', 'Webinar', 'AS', 'New', null, -2, ['Asked a question during the webinar (simulated signal)']),
    L('L-8', 'Rakesh Nair', 'Operations Head', 'Coastal Shipping Co', 'Logistics', 1100, 'Kochi', 'Referral', 'MI', 'Contacted', 66, -7, ['Mentioned Plumeria in the first call'], { enriched: true, priority: 'Medium', notes: 'Same segment as BlueWave Shipping.' }),
    L('L-9', 'Tanya Bose', 'HR Lead', 'Tiny Bakes', 'Retail', 28, 'Delhi', 'Website demo request', 'DM', 'Disqualified', 22, -18, [], { enriched: true, priority: 'Low', dq: 'Company too small (28 employees)' }),
    L('L-10', 'Kavya Menon', 'People Operations', 'Skyline Cargo Pvt Ltd', 'Logistics', 800, 'Mumbai', 'Event', 'DM', 'New', null, 0, []),
    L('L-11', 'Dr. Suresh Kaveri', 'Founder', 'Kaveri Clinics', 'Healthcare', 380, 'Kochi', 'Referral', 'MI', 'Converted', 77, -80, [], { enriched: true, priority: 'High', conv: { acc: 'kaveri', con: 'suresh', deal: 'd-kaveri' }, bant: { b: true, a: true, n: true, t: true } })
  ];

  const users = [
    { id: 'AS', n: 'Ayush Sisodia', title: 'Account Executive', role: 'rep', email: 'ayush@kestrel.example', team: 't1', status: 'Active', last: 'Active now' },
    { id: 'MI', n: 'Meera Iyer', title: 'Sales Manager', role: 'manager', email: 'meera@kestrel.example', team: 't1', status: 'Active', last: '10 min ago' },
    { id: 'RK', n: 'Rohan Kapoor', title: 'Solutions Engineer', role: 'rep', email: 'rohan@kestrel.example', team: 't1', status: 'Active', last: '1 hour ago' },
    { id: 'TN', n: 'Tara Nair', title: 'Customer Success', role: 'cs', email: 'tara@kestrel.example', team: 't2', status: 'Active', last: 'Today' },
    { id: 'DM', n: 'Dev Malhotra', title: 'SDR', role: 'sdr', email: 'dev@kestrel.example', team: 't1', status: 'Active', last: 'Today' },
    { id: 'SA', n: 'Sneha Arora', title: 'RevOps Admin', role: 'admin', email: 'sneha@kestrel.example', team: 't3', status: 'Active', last: 'Yesterday' },
    { id: 'VK', n: 'Vikram Khanna', title: 'Finance Analyst', role: 'readonly', email: 'vikram@kestrel.example', team: 't3', status: 'Invited', last: 'Never' }
  ];
  const P = (...a) => a;
  const roles = [
    { id: 'admin', n: 'Admin', perms: P('leads.edit', 'deals.edit', 'accounts.edit', 'agents.approve', 'workflows.manage', 'settings.manage', 'data.export') },
    { id: 'manager', n: 'Sales Manager', perms: P('leads.edit', 'deals.edit', 'accounts.edit', 'agents.approve', 'workflows.manage', 'data.export') },
    { id: 'rep', n: 'Sales Rep', perms: P('leads.edit', 'deals.edit', 'accounts.edit', 'agents.approve', 'workflows.manage') },
    { id: 'sdr', n: 'SDR', perms: P('leads.edit', 'agents.approve') },
    { id: 'cs', n: 'Customer Success', perms: P('accounts.edit', 'agents.approve') },
    { id: 'readonly', n: 'Read only', perms: P() }
  ];
  const teams = [{ id: 't1', n: 'Enterprise Sales', mgr: 'MI', quota: 130 }, { id: 't2', n: 'Customer Success', mgr: 'TN', quota: 0 }, { id: 't3', n: 'Revenue Operations', mgr: 'SA', quota: 0 }];

  const T = (t, p) => ({ t, p: p || {} });
  const workflows = [
    { id: 'wf-lead', n: 'AI Lead Qualification', d: 'Scores every new lead, routes strong ones to the right rep and prepares outreach for approval.', active: true, trig: T('lead_created'), conds: [T('lead_score_gt', { v: 60 })], acts: [T('assign_owner', { own: 'territory' }), T('create_task', { title: 'Qualify {{name}} at {{company}} within 24 hours', days: 1, own: 'owner' }), T('gen_email', { tpl: 'Intro' }), T('notify', { ch: 'In-app', msg: 'High-fit lead {{name}} from {{company}} needs qualification' })], runs: 6, last: -1, log: [], seen: {} },
    { id: 'wf-follow', n: 'Deal Follow-up Automation', d: 'When a proposal has gone quiet, creates a follow-up task and drafts an email for approval.', active: true, trig: T('proposal_sent'), conds: [T('deal_value_gt', { v: 5 }), T('no_response', { days: 3 })], acts: [T('create_task', { title: 'Follow up on the proposal to {{company}}', days: 1, own: 'owner' }), T('gen_email', { tpl: 'Follow-up' }), T('notify', { ch: 'In-app', msg: '{{company}} has not replied to the proposal' })], runs: 9, last: -2, log: [], seen: {} },
    { id: 'wf-churn', n: 'Customer Churn Prevention', d: 'When a customer turns Orange or Red close to renewal, loops in the CSM and asks a human to approve a retention plan.', active: true, trig: T('ticket_escalated'), conds: [T('health_bad'), T('renewal_within', { days: 90 })], acts: [T('create_task', { title: 'Hold an exec call with {{company}} about open support issues', days: 2, own: 'csm' }), T('notify', { ch: 'Slack (simulated)', msg: '{{company}} turned {{health}} with renewal in {{renew}} days' }), T('request_approval', { what: 'Approve a retention plan for {{company}}' }), T('update_field', { field: 'Risk flag', value: 'Churn risk' })], runs: 3, last: -1, log: [], seen: {} },
    { id: 'wf-renew', n: 'Renewal Early Warning', d: 'Starts the renewal motion 60 days out and checks the account is healthy.', active: false, trig: T('renewal_approaching', { days: 60 }), conds: [], acts: [T('create_task', { title: 'Plan the renewal for {{company}}', days: 3, own: 'csm' }), T('notify', { ch: 'In-app', msg: '{{company}} renews in {{renew}} days' })], runs: 0, last: null, log: [], seen: {} }
  ];

  const agents = [
    { id: 'lead', n: 'Lead Intelligence Agent', purpose: 'Enriches and scores incoming leads, explains the score and recommends outreach.', active: true, last: -60, done: 14, runs: 22 },
    { id: 'deal', n: 'Deal Intelligence Agent', purpose: 'Watches opportunities for risk, stalled engagement and missing stakeholders, then recommends actions.', active: true, last: -45, done: 19, runs: 31 },
    { id: 'meeting', n: 'Meeting Intelligence Agent', purpose: 'Reads call and meeting transcripts, extracts facts and proposes CRM updates with the exact quote.', active: true, last: -12, done: 11, runs: 17 },
    { id: 'cs', n: 'Customer Success Agent', purpose: 'Monitors customer health, support tickets and renewals, and proposes retention and expansion actions.', active: true, last: -30, done: 8, runs: 15 },
    { id: 'rev', n: 'Revenue Intelligence Agent', purpose: 'Analyses pipeline and forecast data to flag forecast risks and propose category changes.', active: true, last: -90, done: 6, runs: 12 }
  ];

  const integrations = [
    { id: 'gmail', n: 'Gmail', g: 'Email', d: 'Capture email threads and log them to contacts.', sim: true, on: true, last: 'Simulated sync 4 min ago' },
    { id: 'outlook', n: 'Microsoft Outlook', g: 'Email', d: 'Email and calendar capture for Microsoft 365 teams.', sim: true, on: false },
    { id: 'gcal', n: 'Google Calendar', g: 'Calendar', d: 'Create meetings and sync them with activities.', sim: true, on: true, last: 'Simulated sync 9 min ago' },
    { id: 'teams', n: 'Microsoft Teams', g: 'Meetings', d: 'Pull meeting recordings and transcripts.', sim: true, on: false },
    { id: 'slack', n: 'Slack', g: 'Messaging', d: 'Send deal and health alerts to channels.', sim: true, on: true, last: 'Simulated alert 1 hour ago' },
    { id: 'tel', n: 'Telephony (Exotel-style)', g: 'Calls', d: 'Click-to-call, call recording and transcription.', sim: true, on: false },
    { id: 'erp', n: 'ERP (SAP-style)', g: 'Finance', d: 'Sync invoices, orders and renewal revenue.', sim: true, on: false },
    { id: 'support', n: 'Support platform (Zendesk-style)', g: 'Support', d: 'Import tickets that drive customer health.', sim: true, on: true, last: 'Simulated import 2 min ago' },
    { id: 'claude', n: 'Kestrel AI (Claude)', g: 'AI', d: 'Powers the assistant, Run analysis and transcript extraction through the Artifact runtime.', sim: false, on: true, last: '' }
  ];

  const db = {
    v: VERSION, seq: { lead: 20, deal: 30, acc: 30, con: 60, act: 80, action: 100, audit: 100, wf: 10, field: 5 }, clock: 0, me: 'AS',
    users, roles, teams, accounts, contacts, products, deals, acts, calls, leads, workflows, agents, actions: [], integrations, audit: [],
    pipeline: { stages: [{ n: 'Discovery', prob: 10 }, { n: 'Demo', prob: 25 }, { n: 'Proposal', prob: 50 }, { n: 'Negotiation', prob: 75 }] },
    quotas: { month: 45, quarter: 130, year: 360 },
    history: [14, 16, 21, 18, 20, 23, 19, 22, 22],
    fcHist: [{ q: 'Q1', f: 55, a: 51 }, { q: 'Q2', f: 58, a: 61 }, { q: 'Q3', f: 70, a: 63 }],
    funnel: { Discovery: 62, Demo: 41, Proposal: 26, Negotiation: 17, Won: 11 },
    customFields: [{ id: 'cf-1', ent: 'lead', n: 'Preferred language', t: 'Text', req: false }, { id: 'cf-2', ent: 'account', n: 'Number of sites', t: 'Number', req: false }, { id: 'cf-3', ent: 'deal', n: 'Procurement route', t: 'Text', req: false }],
    notif: { health: { app: true, email: true, slack: true }, approvals: { app: true, email: false, slack: false }, deals: { app: true, email: true, slack: false }, leads: { app: true, email: false, slack: false }, digest: { app: false, email: true, slack: false } },
    radarGap: { targetList: false, targetsAdded: false, cadence: 'daily' },
    journey: { started: false }
  };
  /* history of earlier actions and audit entries so the logs are not empty on first open */
  db.audit = [
    { id: 'AU-1', at: -3600, actor: 'Meera Iyer', type: 'user', action: 'Changed close date', ent: { t: 'deal', id: 'd-bluewave', l: 'BlueWave Shipping' }, detail: '3 Nov to 8 Nov (slipped 2 times)' },
    { id: 'AU-2', at: -2400, actor: 'Deal Intelligence Agent', type: 'agent', action: 'Flagged risk (approved)', ent: { t: 'deal', id: 'd-meridian', l: 'Meridian Retail' }, detail: 'Champion silent for 12 days' },
    { id: 'AU-3', at: -1800, actor: 'AI Lead Qualification', type: 'workflow', action: 'Created task', ent: { t: 'lead', id: 'L-2', l: 'GreenLeaf Energy' }, detail: 'Qualify Neha Kulkarni at GreenLeaf Energy within 24 hours' },
    { id: 'AU-4', at: -1500, actor: 'Lead Intelligence Agent', type: 'agent', action: 'Scored lead (approved)', ent: { t: 'lead', id: 'L-4', l: 'Fortis Retail Group' }, detail: 'Score 82, priority High' },
    { id: 'AU-5', at: -900, actor: 'Sneha Arora', type: 'user', action: 'Updated pipeline settings', ent: { t: 'settings', id: 'pipeline', l: 'Pipeline' }, detail: 'Negotiation probability 70% to 75%' },
    { id: 'AU-6', at: -600, actor: 'Customer Success Agent', type: 'agent', action: 'Proposed task (approved)', ent: { t: 'account', id: 'kiran', l: 'Kiran Textiles' }, detail: 'Review two payroll report tickets' },
    { id: 'AU-7', at: -240, actor: 'Customer Churn Prevention', type: 'workflow', action: 'Notified (simulated Slack)', ent: { t: 'account', id: 'cobalt', l: 'Cobalt Logistics' }, detail: 'Cobalt Logistics turned Orange with renewal in 47 days' },
    { id: 'AU-8', at: -120, actor: 'Ayush Sisodia', type: 'user', action: 'Won deal', ent: { t: 'deal', id: 'd-atlas', l: 'Atlas Auto Parts' }, detail: '₹12L closed won' }
  ];
  db.workflows.forEach(w => { w.log = w.runs ? [{ at: w.last * 1440, subj: 'Earlier run', ok: true, fx: ['Completed (history)'] }] : []; });
  return db;
}
