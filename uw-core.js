/* Cases — Underwriting's view of the Sales Applications prototype (sales-applications/).

   The sales application makes every SERVICE its own case (CASE-001 ... with its own status), and a change to the merchant's
   business details or payout methods its own application-details case. This module reads those cases straight from the sales
   prototype's saved state ('sa-dir-final' in localStorage; both prototypes are served from the same origin, so they share it)
   and writes Underwriting's decisions back to the same place, so the salesperson sees them on the application:
     Underwriting Review  -> Approve for the bank  -> Bank Submission  -> Mark live -> Live
     Underwriting Review  -> Reject                -> Rejected (source 'uw', returned to the salesperson with the comment)
   Besides that application, Cases is seeded with a set of demo applications in the same shape ('kashierUwDemoApps'), so the
   list has many cases of every kind on a first visit. Only what the sales app does not have — assignee, review checklist,
   internal notes — lives in 'kashierUwCases'. */
window.UW = (function () {
  const C = window.Cases, esc = C.esc;
  /* A case has two phases. Phase 1 is the review: the case info, the service with its pricing, documents and contract.
     Phase 2 is the bank preparation (bank readiness, batch, bank decision). It is postponed: the code stays, switched off here. */
  const PHASE2 = false;
  const SA_KEY = 'sa-dir-final', DEMO_KEY = 'kashierUwDemoApps', STORE = 'kashierUwCases';
  const CLOCK = new Date('2026-10-21T12:00:00').getTime();        // the sales prototype's "now", so waiting times agree
  const SLA = { 'Underwriting Review': 72, 'Bank Submission': 120 };
  const STATUS = {
    'Underwriting Review': { tone: 'warning', label: 'Underwriting Review' },
    'Bank Submission': { tone: 'neutral', label: 'Bank Submission' },
    Rejected: { tone: 'negative', label: 'Rejected' },
    Live: { tone: 'positive', label: 'Live' },
    Approved: { tone: 'positive', label: 'Approved' },
  };
  const SHOWN = ['Underwriting Review', 'Bank Submission', 'Rejected', 'Live'], KYC_SHOWN = ['Underwriting Review', 'Approved', 'Rejected'];
  const chip = st => { const m = STATUS[st] || { tone: 'neutral', label: st }; return '<span class="chip ' + m.tone + '">' + esc(m.label) + '</span>'; };
  const chOf = id => id.split(' ')[0], nmOf = id => id.slice(id.indexOf(' ') + 1), label = id => nmOf(id) + ' (' + chOf(id) + ')';
  const nowStr = () => new Date().toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const iso = hoursAgo => new Date(CLOCK - hoursAgo * 36e5).toISOString();

  /* ── Demo applications ── */
  const j = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } };
  const rate = (r, f) => ({ rate: String(r), fee: String(f) });
  const PRICE = { Card: { local: rate(1.72, 1.96), 'intl-EGP': rate(2.45, 2.94) } };
  function demoApp(n, m) {
    const app = {
      appId: 'APP-2408' + (1400 + n), merchant: { name: m.name, email: m.email, phone: m.phone }, entity: m.entity || 'Registered Business', industry: m.industry, owner: '',
      submittedBy: m.by, submittedAt: m.at, svc: {}, order: [], cases: {}, docs: {}, websites: m.web ? [].concat(m.web) : [''], storeImage: m.store || '', reqContracts: {},
      payouts: [{ id: 1, type: 'bank', name: '', bank: m.bank || 'National Bank of Egypt', branch: 'Main Branch', holder: m.name, acct: '10' + (20000000000 + n * 3917) }], primary: 1, nextPayout: 2,
      kyc: [], log: [], nextCase: 1, _src: 'demo'
    };
    app.docs['National ID'] = { 'Front side': 'national-id-front.jpg', 'Back side': 'national-id-back.jpg' };
    app.docs['Commercial Registration (CR)'] = { File: 'cr-' + n + '.pdf' };
    (m.docs || []).forEach(d => { app.docs[d] = { File: d.toLowerCase().replace(/[^a-z]+/g, '-') + '-' + n + '.pdf' }; });
    let c = 100 + n * 10;
    (m.svc || []).forEach(sv => {
      const id = sv.id, nm = nmOf(id);
      app.order.push(id);
      app.svc[id] = { model: sv.model, currencies: ['EGP'], ops: sv.ops || [], notes: sv.notes || '', lines: [{ bank: sv.bank || '', rates: sv.rates || PRICE[nm] || { selling: rate(sv.sell || 1.1, 1.5) }, custom: !!sv.custom }] };
      // One rate for every rate type of the service, as the application records them (local and international, or each card scheme).
      if (!sv.rates && window.SA && SA.tiersFor && SA.S) {
        try { SA.S.svc = SA.S.svc || {}; SA.S.svc[id] = app.svc[id]; const ln = app.svc[id].lines[0]; ln.rates = {};
          SA.tiersFor(id, ln).forEach(t => { ln.rates[t.key] = rate(SA.isCard(id) ? t.std : (sv.sell || t.std), t.fee); }); } catch (e) { /* keep the simple rates */ }
      }
      if (chOf(id) === 'POS') app.terminals = app.terminals || '2';
      app.cases[id] = { status: sv.st, caseId: 'CASE-' + (++c), since: iso(sv.h || 20) };
      if (sv.st === 'Rejected') app.cases[id].reject = { source: 'uw', by: 'Underwriting team', role: 'Underwriting', comment: sv.why, at: '10/19/2026, 02:30:00 PM' };
      if (sv.st === 'Live') app.cases[id].liveSince = '12 Oct 2026';
      if (sv.contract !== false && sv.model === 'PF') app.reqContracts[nm + ' - PF Contract'] = nm.toLowerCase().replace(/\s+/g, '-') + '-pf-contract-signed.pdf';
      app.log.unshift({ t: '10/0' + (1 + (n % 8)) + '/2026, 10:00:00 AM', who: 'System', text: 'moved the ' + label(id) + ' case to Underwriting Review', ic: 'check', id: id });
      app.log.unshift({ t: '09/3' + (n % 2) + '/2026, 05:20:01 PM', who: m.by, text: 'submitted the ' + label(id) + ' case', ic: 'send', detail: app.cases[id].caseId + ' · Underwriting Review', id: id });
    });
    (m.kyc || []).forEach((k, i) => {
      const P = { name: m.name, email: m.email, phone: m.phone, industry: m.industry, owner: '', websites: m.web ? [].concat(m.web) : [], storeImage: m.store || '', payouts: app.payouts.map(p => Object.assign({}, p)), primary: 1, nextPayout: 2 };
      const changes = k.isNew ? [{ label: 'Business name', to: m.name }, { label: 'Merchant type', to: app.entity }, { label: 'Industry', to: m.industry }, { label: 'Contact', to: m.email + ' \u00b7 ' + m.phone }, { label: 'Payout method', to: pay(app.payouts[0]) }] : k.changes.map(x => { if (x.set) x.set(P); return { label: x.label, from: typeof x.from === 'function' ? x.from(app) : x.from, to: typeof x.to === 'function' ? x.to(app) : x.to }; });
      const key = 'kyc:' + (i + 1);
      app.kyc.push({ n: i + 1, key: key, caseId: 'CASE-' + (++c), status: k.st, isNew: !!k.isNew, changes: changes, proposed: P, by: m.by, role: 'Salesperson', at: '10/19/2026, 10:00:00 AM', since: iso(k.h || 20),
        reject: k.st === 'Rejected' ? { source: 'uw', by: 'Underwriting team', role: 'Underwriting', comment: k.why, at: '10/20/2026, 11:30:00 AM' } : undefined, decision: k.st === 'Approved' ? { by: 'Rana Adel', at: '10/20/2026, 09:10:00 AM' } : undefined });
      app.log.unshift({ t: '10/19/2026, 10:00:00 AM', who: m.by, text: 'sent a KYC update to Underwriting', ic: 'send', detail: changes.map(x => x.label).join(', '), id: key });
    });
    app.nextCase = c + 1;
    fillDemo(app, m, READY[m.name]);
    return app;
  }
  /* Demo: 'full' applications have everything the banks need; 'partial' ones only a few merchant details, so the gate has something to block. */
  const READY = { 'Cairo Fresh Market': 'full', 'Heliopolis Fitness Club': 'full', 'Garden City Florist': 'full', 'Dokki Dental Clinic': 'full', 'Ismailia Kids Academy': 'full', 'Luxor Heritage Tours': 'full',
    'Giza Learning Hub': 'partial', 'Zayed Real Estate': 'partial', 'Maadi Home Decor': 'partial', 'Matrouh Beach Resort': 'partial', 'Aswan Spice Bazaar': 'partial' };
  function fillDemo(app, m, level) {
    if (!level) return;
    const n = parseInt(app.appId.slice(-2), 10), pad = (x, len) => String(x).padStart(len, '0');
    app.legal = { legalName: m.name + ' Co.', taxNo: '2' + pad(n * 7919, 8), ownerName: ['Youssef Adel', 'Omar Khalil', 'Salma Hany', 'Mona Adel', 'Laila Mansour', 'Yasmin Farouk'][n % 6] };
    if (level === 'full') Object.assign(app.legal, { legalForm: 'LLC', crNo: '10' + pad(n * 104729, 7), ownerIdType: 'National ID', ownerIdNo: '290' + pad(n * 9973, 11), ownerNat: 'Egyptian', activity: m.industry + ' merchant, sells to retail customers', addr1: n + ' Main Street', gov: 'Cairo', city: 'Nasr City', country: 'Egypt' });
    if (level !== 'full') return;
    app.order.forEach(id => {
      const cs = app.cases[id], b = cs.bank = { avgTicket: '1500', intModel: 'Merchant website', intType: '3P', signatory: app.legal.ownerName, outlet: m.name + ' main outlet', outletCity: 'Cairo', outletAddr: app.legal.addr1 + ', Cairo', delName: app.legal.ownerName, delIdNo: app.legal.ownerIdNo, delNat: 'Egyptian' };
      if (cs.status === 'Bank Submission' || cs.status === 'Live') Object.assign(b, { docsStatus: 'Sent', batch: 'BM-2026-10-' + pad(n + 5, 2), ref: 'HPS-' + pad(n * 311, 6), decision: cs.status === 'Live' ? 'Approved' : 'Pending' });
    });
  }
  const pay = p => (p.name ? p.name + ': ' : '') + 'Bank account · ' + p.bank + ' · ' + p.branch + ' · ' + p.holder + ' · ' + p.acct;
  const bankChange = (bk, br, acct) => ({ label: 'Payout method changed', from: a => pay(a.payouts[0]), to: a => pay(Object.assign({}, a.payouts[0], { bank: bk, branch: br, acct: acct })), set: P => { P.payouts[0].bank = bk; P.payouts[0].branch = br; P.payouts[0].acct = acct; } });
  const walletAdd = { label: 'Payout method added', from: 'None', to: a => 'E-wallet · Vodafone Cash · 01012345678 · ' + a.merchant.name, set: P => { P.payouts.push({ id: 2, type: 'wallet', name: '', provider: 'Vodafone Cash', mobile: '01012345678', wholder: P.name }); P.nextPayout = 3; } };
  const DOCS_ON = ['Brand Authorization Letter'], DOCS_POS = ['Store Lease / Location Proof'], DOCS_BM = ['BM PSP Agreement Annex'];
  const DEMO = [
    { name: 'Cairo Fresh Market', industry: 'Retail & E-commerce', email: 'youssef@cairofresh.com', phone: '+20 100 123 4567', by: 'Mostafa Khaled', at: '28 Sept 2026', web: ['www.cairofresh.com', 'instagram.com/cairofresh', 'facebook.com/cairofreshmarket'], store: 'storefront-cairo.jpg', docs: DOCS_ON.concat(DOCS_POS),
      svc: [{ id: 'Online Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Underwriting Review', h: 30, ops: ['Recurring'], notes: 'Subscription billing for monthly produce boxes.' }, { id: 'Online Wallet', model: 'PF', st: 'Underwriting Review', h: 100, sell: 0.9 }, { id: 'POS Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Bank Submission', h: 40 }] },
    { name: 'Giza Learning Hub', industry: 'Education', email: 'omar@gizalearning.edu', phone: '+20 111 765 4321', by: 'Nour Hamdy', at: '30 Sept 2026', web: 'www.gizalearning.edu', docs: [],
      svc: [{ id: 'Online Card', model: 'PSP', bank: 'Bank Misr', st: 'Underwriting Review', h: 12 }, { id: 'Online Valu', model: 'PF', st: 'Underwriting Review', h: 52, sell: 2.2 }] },
    { name: 'Heliopolis Fitness Club', industry: 'Entertainment & Media', email: 'salma@heliofit.com', phone: '+20 122 300 1100', by: 'Aya Muhammed', at: '02 Oct 2026', web: 'www.heliofit.com', store: 'heliofit-front.jpg', docs: DOCS_POS.concat(DOCS_ON),
      svc: [{ id: 'POS Card', model: 'PF', bank: 'CIB', st: 'Underwriting Review', h: 60 }, { id: 'POS Wallet', model: 'PF', st: 'Underwriting Review', h: 26, sell: 1.0 }] },
    { name: 'Nasr City Bookstore', industry: 'Education', email: 'mona@nasrbooks.com', phone: '+20 109 888 2200', by: 'Karim Zaki', at: '25 Sept 2026', web: 'www.nasrbooks.com', docs: DOCS_ON,
      svc: [{ id: 'Online Card', model: 'PF', bank: 'Bank Misr', st: 'Rejected', h: 70, why: 'Tax Identification Card is expired. Upload a valid copy.' }] },
    { name: 'Dokki Dental Clinic', industry: 'Healthcare / Pharmacy', email: 'laila@dokkidental.com', phone: '+20 100 450 7788', by: 'Aya Muhammed', at: '10 Sept 2026', web: 'www.dokkidental.com', docs: DOCS_ON.concat(DOCS_BM),
      svc: [{ id: 'Online Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Live', h: 300 }, { id: 'Online Bank Installments', model: 'PSP', bank: 'Bank Misr', st: 'Bank Submission', h: 80, rates: { selling: rate(1.4, 1.5) } }] },
    { name: 'Zayed Real Estate', industry: 'Real Estate', email: 'yasmin@zayedre.com', phone: '+20 111 909 3030', by: 'Mostafa Khaled', at: '15 Oct 2026', web: 'www.zayedre.com', docs: DOCS_ON,
      svc: [{ id: 'Online Card', model: 'PSP', bank: 'CIB', st: 'Underwriting Review', h: 4 }],
      kyc: [{ st: 'Underwriting Review', h: 15, changes: [bankChange('CIB', 'Smart Village', '1003998877665')] }] },
    { name: 'Garden City Florist', industry: 'Retail & E-commerce', email: 'heba@gcflorist.com', phone: '+20 100 612 9090', by: 'Nour Hamdy', at: '22 Sept 2026', web: 'www.gcflorist.com', docs: DOCS_ON,
      svc: [{ id: 'Online Wallet', model: 'PF', st: 'Underwriting Review', h: 140, sell: 0.8 }, { id: 'Online Instapay', model: 'PF', st: 'Underwriting Review', h: 33, sell: 0.5, contract: false }],
      kyc: [{ st: 'Underwriting Review', h: 10, changes: [walletAdd] }] },
    { name: 'Ismailia Kids Academy', industry: 'Education', email: 'rasha@ismailiakids.edu', phone: '+20 122 777 0101', by: 'Aya Muhammed', at: '05 Oct 2026', web: 'www.ismailiakids.edu', docs: DOCS_ON,
      svc: [{ id: 'Online Card', model: 'PF', bank: 'QNB Alahli', st: 'Bank Submission', h: 90 }],
      kyc: [{ st: 'Approved', h: 50, changes: [{ label: 'Contact phone', from: '+20 122 777 0101', to: '+20 122 777 0202', set: P => { P.phone = '+20 122 777 0202'; } }] }] },
    { name: 'Matrouh Beach Resort', industry: 'Travel & Tourism', email: 'khaled@matrouhresort.com', phone: '+20 100 330 4455', by: 'Karim Zaki', at: '18 Sept 2026', web: 'www.matrouhresort.com', docs: DOCS_ON,
      svc: [{ id: 'Online Souhoola', model: 'PF', st: 'Underwriting Review', h: 20, sell: 3.2 }, { id: 'Online Valu', model: 'PF', st: 'Rejected', h: 110, sell: 2.0, why: 'Commercial Registration does not list the resort as the merchant.' }] },
    { name: 'Aswan Spice Bazaar', industry: 'Food & Beverage', email: 'nadia@aswanspice.com', phone: '+20 111 556 6677', by: 'Mostafa Khaled', at: '12 Oct 2026', web: 'www.aswanspice.com', store: 'aswan-shop.jpg', docs: DOCS_POS,
      svc: [{ id: 'POS Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Underwriting Review', h: 8 }],
      kyc: [{ st: 'Underwriting Review', h: 6, changes: [{ label: 'Contact email', from: 'nadia@aswanspice.com', to: 'accounts@aswanspice.com', set: P => { P.email = 'accounts@aswanspice.com'; } }, { label: 'Contact phone', from: '+20 111 556 6677', to: '+20 111 556 0000', set: P => { P.phone = '+20 111 556 0000'; } }] },
        { st: 'Rejected', h: 70, why: 'Business name does not match the Commercial Registration.', changes: [{ label: 'Business name', from: 'Aswan Spice Bazaar', to: 'Aswan Spices LLC', set: P => { P.name = 'Aswan Spices LLC'; } }] }] },
    { name: 'Luxor Heritage Tours', industry: 'Travel & Tourism', email: 'mostafa@luxortours.com', phone: '+20 100 220 1212', by: 'Nour Hamdy', at: '08 Oct 2026', docs: DOCS_ON,
      svc: [{ id: 'Online Card', model: 'PF', bank: 'Bank Misr', st: 'Underwriting Review', h: 75 }, { id: 'Online Basata', model: 'PF', st: 'Bank Submission', h: 30, sell: 2.5 }] },
    { name: 'Maadi Home Decor', industry: 'Retail & E-commerce', email: 'rania@maadidecor.com', phone: '+20 122 404 5050', by: 'Aya Muhammed', at: '20 Oct 2026', web: 'www.maadidecor.com', store: 'maadi-store.jpg', docs: DOCS_ON.concat(DOCS_POS),
      svc: [{ id: 'Online Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Underwriting Review', h: 2 }, { id: 'POS Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Underwriting Review', h: 3 }],
      kyc: [{ st: 'Underwriting Review', h: 1, changes: [{ label: 'Industry', from: 'Retail & E-commerce', to: 'Fashion & Beauty', set: P => { P.industry = 'Fashion & Beauty'; } }] }] },
    { name: 'Nile Delta Pharmacy', industry: 'Healthcare / Pharmacy', email: 'ahmed@niledeltapharmacy.com', phone: '+20 100 818 2020', by: 'Aya Muhammed', at: '20 Oct 2026', web: ['www.niledeltapharmacy.com', 'instagram.com/niledeltapharmacy'], docs: DOCS_ON,
      svc: [{ id: 'Online Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Underwriting Review', h: 3 }], kyc: [{ st: 'Underwriting Review', h: 3, isNew: true }] },
    { name: 'Tanta Sports Club', industry: 'Entertainment & Media', email: 'karim@tantasports.com', phone: '+20 111 303 4040', by: 'Mostafa Khaled', at: '20 Oct 2026', web: 'www.tantasports.com', store: 'tanta-club.jpg', docs: DOCS_POS.concat(DOCS_ON),
      svc: [{ id: 'POS Card', model: 'PF', bank: 'CIB', st: 'Underwriting Review', h: 2 }, { id: 'Online Wallet', model: 'PF', st: 'Underwriting Review', h: 2, sell: 1.0 }], kyc: [{ st: 'Underwriting Review', h: 2, isNew: true }] },
    { name: 'Beni Suef Bakery', industry: 'Food & Beverage', email: 'sara@benisuefbakery.com', phone: '+20 122 505 6060', by: 'Nour Hamdy', at: '21 Oct 2026', web: 'facebook.com/benisuefbakery', docs: DOCS_ON.concat(DOCS_BM),
      svc: [{ id: 'Online Card', model: 'PSP', bank: 'Bank Misr', st: 'Underwriting Review', h: 1 }], kyc: [{ st: 'Underwriting Review', h: 1, isNew: true }] },
  ];
  function seedDemo(force) {
    if (!force && j(DEMO_KEY)) return;
    const out = {}; DEMO.forEach((m, i) => { const a = demoApp(i + 1, m); out[a.appId] = a; });
    put(DEMO_KEY, out);
  }
  function resetDemo() { try { localStorage.removeItem(STORE); } catch (e) { /* storage unavailable */ } seedDemo(true); }

  /* ── Saved states: the sales prototype's application, plus the demo applications ── */
  function states() {
    const out = [], main = j(SA_KEY);
    if (main && main.appId && main.cases) out.push(main);
    const demo = j(DEMO_KEY) || {};
    Object.keys(demo).forEach(k => { demo[k]._src = 'demo'; out.push(demo[k]); });
    return out;
  }
  const stateFor = appId => states().filter(s => s.appId === appId)[0] || null;
  function save(s) {
    if (s._src === 'demo') { const demo = j(DEMO_KEY) || {}; demo[s.appId] = s; put(DEMO_KEY, demo); }
    else { const c = Object.assign({}, s); delete c._src; put(SA_KEY, c); }
  }
  const gid = (s, id) => s.appId + '::' + id;
  const split = cid => { const i = String(cid).indexOf('::'); return i < 0 ? [null, cid] : [cid.slice(0, i), cid.slice(i + 2)]; };
  /* A ready-made application in the sales prototype itself, with the same cases as live, linked sales data: opens the sales prototype. */
  const DEMO_URL = 'sales-applications/application.html?state=ready&kyc=1&as=uw&cases=' + ['Online Card~Underwriting Review@30', 'Online Wallet~Underwriting Review@100', 'POS Card~Underwriting Review@5', 'Online Bank Installments~Rejected:uw'].map(encodeURIComponent).join('|');

  /* ── This module's own store ── */
  function readLocal() { try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { return {}; } }
  function writeLocal(o) { try { localStorage.setItem(STORE, JSON.stringify(o)); } catch (e) { /* storage unavailable */ } }
  const blank = () => ({ assignee: '', review: {}, notes: [] });
  const keyOf = (s, id) => s.appId + '|' + id;
  function local(k) { return Object.assign(blank(), readLocal()[k] || {}); }
  function saveLocal(k, patch) { const all = readLocal(); all[k] = Object.assign(local(k), patch); writeLocal(all); }

  /* Cases rotate between the underwriting agents (round robin) the first time they are seen. */
  function autoAssign() {
    const all = readLocal(); let n = all.__rr || 0, changed = false;
    const give = (s, id, status) => { const k = keyOf(s, id); if (status !== 'Underwriting Review' || (all[k] && all[k].assignee)) return; all[k] = Object.assign(blank(), all[k] || {}, { assignee: C.TEAM[n++ % C.TEAM.length] }); changed = true; };
    states().forEach(s => { s.order.forEach(id => s.cases[id] && give(s, id, s.cases[id].status)); (s.kyc || []).forEach(x => give(s, x.key, x.status)); });
    if (changed) { all.__rr = n; writeLocal(all); }
  }
  const canSee = c => !c.assignee || C.user().canReassign || c.assignee === C.user().name;

  function build(s, id) {
    const c = s.cases[id], svc = s.svc[id] || { lines: [] }, k = keyOf(s, id), l = local(k);
    const since = c.since ? Date.parse(c.since) : CLOCK, hours = Math.max(0, (CLOCK - since) / 36e5), sla = SLA[c.status];
    return { type: 'service', key: k, id: gid(s, id), sid: id, caseId: c.caseId, status: c.status, appId: s.appId, merchant: s.merchant, entity: s.entity, industry: s.industry,
      website: (s.websites || []).filter(Boolean).join(', '), websites: (s.websites || []).filter(Boolean), service: label(id), channel: chOf(id), model: svc.model || '', svc: svc, banks: [...new Set((svc.lines || []).map(x => x.bank).filter(Boolean))],
      submittedBy: s.submittedBy, submittedAt: s.submittedAt, terminals: s.terminals || '', submitComment: s.submitComment || '', since: new Date(since).toISOString(), hours: hours, sla: sla,
      late: !!sla && hours > sla, reject: c.reject || null, liveSince: c.liveSince || '', assignee: l.assignee, local: l };
  }
  /* An application case: the merchant's general information (business details, payout methods) changed after submission.
     It is applied to the application only when Underwriting approves it. */
  function buildKyc(s, x) {
    const k = keyOf(s, x.key), l = local(k), since = x.since ? Date.parse(x.since) : CLOCK, hours = Math.max(0, (CLOCK - since) / 36e5), open = x.status === 'Underwriting Review';
    return { type: 'application', key: k, id: gid(s, x.key), sid: x.key, caseId: x.caseId, status: x.status, appId: s.appId, merchant: s.merchant, entity: s.entity, industry: s.industry,
      service: 'Application details', isNew: !!x.isNew, changes: x.changes || [], proposed: x.proposed, banks: [], submittedBy: x.by || s.submittedBy, submittedAt: x.at || s.submittedAt,
      since: new Date(since).toISOString(), hours: hours, sla: open ? SLA['Underwriting Review'] : 0, late: open && hours > SLA['Underwriting Review'],
      reject: x.reject || null, decision: x.decision || null, assignee: l.assignee, local: l };
  }
  function all() {
    seedDemo(); autoAssign();
    return [].concat.apply([], states().map(s => s.order.filter(id => s.cases[id] && SHOWN.indexOf(s.cases[id].status) > -1).map(id => build(s, id))
      .concat((s.kyc || []).filter(x => KYC_SHOWN.indexOf(x.status) > -1).map(x => buildKyc(s, x))))).filter(canSee);
  }
  function get(cid) {
    seedDemo(); autoAssign();
    const p = split(cid), s = p[0] ? stateFor(p[0]) : states()[0]; if (!s) return null;
    const id = p[1]; let c = null;
    if (String(id).indexOf('kyc:') === 0) { const x = (s.kyc || []).filter(k => k.key === id)[0]; c = x && KYC_SHOWN.indexOf(x.status) > -1 ? buildKyc(s, x) : null; }
    else c = s.cases[id] && SHOWN.indexOf(s.cases[id].status) > -1 ? build(s, id) : null;
    return c && canSee(c) ? c : null;
  }
  const state = () => states().length > 0;

  /* ── Review checklist ── */
  /* What each type of case asks Underwriting to verify.
       Service case: the service's pricing, the documents only that service needs (its channel, the Bank Misr PSP annex) and its PF contract.
       Application case: each requested change to the business details and payout methods. */
  function checks(c) {
    const s = stateFor(c.appId), r = c.local.review, out = [];
    const add = (key, lbl, tab, extra) => out.push(Object.assign({ key: key, label: lbl, tab: tab, state: (r[key] || {}).state || 'todo', reason: (r[key] || {}).reason || '' }, extra || {}));
    if (c.type === 'application') {
      // The website / social media link belongs to a requested Online service, not to a change of the application data.
      c.changes.forEach((x, i) => { if (!/^Website/.test(x.label)) add('chg:' + i, x.label, 'changes', { from: c.isNew ? undefined : x.from, to: x.to, isNew: !!c.isNew }); });
      return out;
    }
    const names = d => Object.keys(s.docs[d] || {}).map(f => s.docs[d][f]).filter(Boolean), files = d => names(d).join(', ');
    add('pricing', 'Services & pricing', 'pricing');
    if (c.channel === 'Online') { add('web', 'Website or social media link', 'website', { files: [(s.websites || []).filter(Boolean).join(', ')], links: (s.websites || []).filter(Boolean) }); add('doc:Brand Authorization Letter', 'Brand Authorization Letter', 'documents', { files: [files('Brand Authorization Letter')], list: names('Brand Authorization Letter') }); }
    if (c.channel === 'POS') { add('doc:Store Lease / Location Proof', 'Store Lease / Location Proof', 'documents', { files: [files('Store Lease / Location Proof')], list: names('Store Lease / Location Proof') }); add('store', 'Store image', 'documents', { files: [s.storeImage], list: [s.storeImage].filter(Boolean) }); }
    if (c.svc.model === 'PSP' && (c.svc.lines || []).some(l => l.bank === 'Bank Misr')) add('doc:BM PSP Agreement Annex', 'BM PSP Agreement Annex', 'documents', { files: [files('BM PSP Agreement Annex')], list: names('BM PSP Agreement Annex') });
    if (c.svc.model === 'PF') { const n = nmOf(c.sid) + ' - PF Contract'; add('con:' + n, n, 'contracts', { files: [(s.reqContracts || {})[n]], list: [(s.reqContracts || {})[n]].filter(Boolean) }); }
    // A required document or contract that was never uploaded blocks approval: the case has to go back to Sales.
    out.forEach(x => { if (x.files) { x.files = x.files.filter(Boolean); if (!x.files.length) { x.state = 'flag'; x.missing = true; x.reason = x.key === 'web' ? 'No website or social media link was provided' : 'Required item was not uploaded'; } } });
    return out;
  }
  function progress(c) {
    const list = checks(c), done = list.filter(x => x.state === 'ok').length;
    return { list: list, done: done, total: list.length, flagged: list.filter(x => x.state === 'flag'), ready: done === list.length };
  }
  function addLog(s, id, text, ic, detail) { s.log.unshift({ t: nowStr(), who: C.user().name, text: text, ic: ic || 'check', detail: detail || '', id: id }); }
  function setReview(c, key, state, reason) {
    const l = local(c.key);
    if (state === 'todo') delete l.review[key]; else l.review[key] = { state: state, reason: reason || '', by: C.user().name, ts: new Date().toISOString() };
    saveLocal(c.key, { review: l.review });
  }
  function addNote(c, text) { const l = local(c.key); l.notes.unshift({ by: C.user().name, ts: new Date().toISOString(), text: text }); saveLocal(c.key, { notes: l.notes }); }
  function assign(c, name) { saveLocal(c.key, { assignee: name }); }

  /* ── Decisions: written back to the application's saved state ── */
  function move(c, status, extra, text, detail) {
    const s = stateFor(c.appId); if (!s || !s.cases[c.sid]) return false;
    Object.assign(s.cases[c.sid], extra || {}, { status: status, since: new Date(CLOCK).toISOString() });
    addLog(s, c.sid, text, status === 'Rejected' ? 'xcircle' : 'check', detail);
    save(s); return true;
  }
  /* Application case: approving applies the requested changes to the application, as the sales prototype does. */
  const kycOf = (s, c) => (s.kyc || []).filter(x => x.key === c.sid)[0];
  function approveKyc(c) {
    const s = stateFor(c.appId), k = s && kycOf(s, c); if (!k) return false; const P = k.proposed;
    // A new application's details are already on the application; only a change has anything to apply.
    if (!k.isNew) { s.merchant.name = P.name; s.merchant.email = P.email; s.merchant.phone = P.phone; s.industry = P.industry; s.owner = P.owner;
      s.storeImage = P.storeImage; s.payouts = P.payouts.map(p => Object.assign({}, p)); s.primary = P.primary; s.nextPayout = Math.max(s.nextPayout, P.nextPayout); }
    k.status = 'Approved'; k.decision = { by: C.user().name, at: nowStr() }; k.since = new Date(CLOCK).toISOString();
    addLog(s, k.key, k.isNew ? 'approved the application details' : 'approved the KYC update', 'check', k.isNew ? 'The submitted business details and payout method are confirmed' : 'The changes are now on the application'); save(s); return true;
  }
  function rejectKyc(c, comment) {
    const s = stateFor(c.appId), k = s && kycOf(s, c); if (!k) return false;
    k.status = 'Rejected'; k.reject = { source: 'uw', by: C.user().name, role: 'Underwriting', comment: comment, at: nowStr() }; k.since = new Date(CLOCK).toISOString();
    addLog(s, k.key, 'rejected the KYC update', 'xcircle', comment); save(s); return true;
  }
  const approve = c => c.type === 'application' ? approveKyc(c) : move(c, 'Bank Submission', {}, 'approved the ' + c.service + ' case and sent it to the bank', 'Underwriting review completed.');
  function reject(c, comment) {
    if (c.type === 'application') return rejectKyc(c, comment);
    return move(c, 'Rejected', { reject: { source: 'uw', by: C.user().name, role: 'Underwriting', comment: comment, at: nowStr() } },
      'rejected the ' + c.service + ' case and returned it to the salesperson', comment);
  }
  const goLive = c => move(c, 'Live', { liveSince: new Date(CLOCK).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }, 'marked the ' + c.service + ' case live', 'The bank approved and the credentials arrived.');


  /* ── Bank readiness ──
     The data the banks' KYC forms need, grouped by who supplies it (KYC Workbook vs Sales Application, field gap analysis):
       merchant  - facts about the merchant that Sales should collect; Underwriting can fill a gap and every change is logged
       service   - facts about this one service (integration, outlet, delegate, signatory)
       auto      - calculated from the application (MCC, discount code, descriptor), never typed
       bank      - filled once the case is with the bank (batch number, reference, bank decision and comment)
     A case cannot be sent to the bank until every required merchant, service and calculated field is complete. */
  const GOV = ['Alexandria', 'Aswan', 'Assiut', 'Beheira', 'Beni Suef', 'Cairo', 'Dakahlia', 'Damietta', 'Fayoum', 'Gharbia', 'Giza', 'Ismailia', 'Kafr El Sheikh', 'Luxor', 'Matrouh', 'Menofia', 'Minya', 'New Valley', 'North Sinai', 'Port Said', 'Qalyubia', 'Qena', 'Red Sea', 'Sharkia', 'Sohag', 'South Sinai', 'Suez'];
  const MCC = { 'Retail & E-commerce': '5399', Education: '8299', 'Food & Beverage': '5812', 'Healthcare / Pharmacy': '5912', 'Travel & Tourism': '4722', 'Real Estate': '6513', 'Entertainment & Media': '7999', Automotive: '5511', 'Professional Services': '8999', 'Technology / SaaS': '7372', 'Fashion & Beauty': '5651', 'Logistics & Delivery': '4215', Marketplace: '5399', 'Non-profit / NGO': '8398' };
  /* ── Bank settings: fixed Kashier values and the sector mapping (edited on bank-settings.html) ── */
  const SET_KEY = 'kashierUwSettings';
  const FIXED_LABEL = { settleAcct: 'Settlement account number', settleCcy: 'Settlement account currency', settleName: 'Settlement account name', profile: 'Profile code', cid: 'CID', dba: 'DBA merchant name code', mtype: 'MType', structId: 'Structure ID', structPos: 'Structure position', parent: 'Parent merchant' };
  const FIXED_HINT = { settleAcct: 'Kashier\'s account at the bank, not the merchant\'s. Demo value: replace it.', cid: 'Kashier\'s ID at the bank. Demo value: replace it.', settleCcy: 'ISO number, 818 = EGP', profile: 'Used by the Online and recurring forms', dba: 'POS forms', mtype: 'POS forms', structId: 'POS forms', structPos: 'POS forms', parent: 'POS forms', settleName: 'POS forms' };
  const SET_DEF = { fixed: { settleAcct: '100-DEMO-000001', settleCcy: '818', settleName: 'KASHIER', profile: '930', cid: 'DEMO-CID-001', dba: 'K', mtype: '01GM', structId: '0084', structPos: 'BOTT', parent: 'Kashier' }, map: {} };
  Object.keys(MCC).forEach(k => { SET_DEF.map[k] = { mcc: MCC[k], discount: 'DC-' + MCC[k], ag: 'AG-' + MCC[k] }; });
  function settings() { const v = j(SET_KEY) || {}; return { fixed: Object.assign({}, SET_DEF.fixed, v.fixed || {}), map: Object.assign({}, SET_DEF.map, v.map || {}) }; }
  function saveSettings(v) { put(SET_KEY, v); }
  const fixed = () => settings().fixed, mapOf = ind => Object.assign({ mcc: '', discount: '', ag: '' }, settings().map[ind] || {});
  const ind = c => c.entity === 'Individual Seller', reg = c => c.entity === 'Registered Business', online = c => c.channel === 'Online', pos = c => c.channel === 'POS';
  const FIELDS = [
    { k: 'legalName', l: 'Legal name', g: 'merchant' }, { k: 'legalForm', l: 'Legal form', g: 'merchant', t: 'select', o: ['Sole proprietorship', 'LLC', 'Joint stock company', 'Partnership', 'Other'], req: c => !ind(c) },
    { k: 'taxNo', l: 'Tax card number', g: 'merchant', req: c => !ind(c) }, { k: 'crNo', l: 'Commercial registration number', g: 'merchant', req: reg },
    { k: 'ownerName', l: 'Owner full name', g: 'merchant' }, { k: 'ownerIdType', l: 'Owner ID type', g: 'merchant', t: 'select', o: ['National ID', 'Passport'] },
    { k: 'ownerIdNo', l: 'Owner ID number', g: 'merchant' }, { k: 'ownerNat', l: 'Owner nationality', g: 'merchant' },
    { k: 'activity', l: 'Business activity description', g: 'merchant', wide: true },
    { k: 'addr1', l: 'Business address line 1', g: 'merchant', wide: true }, { k: 'addr2', l: 'Business address line 2', g: 'merchant', opt: true, wide: true },
    { k: 'gov', l: 'Governorate', g: 'merchant', t: 'select', o: GOV }, { k: 'city', l: 'City', g: 'merchant' }, { k: 'country', l: 'Country', g: 'merchant', def: 'Egypt' },
    { k: 'postal', l: 'Postal code', g: 'merchant', opt: true }, { k: 'altPhone', l: 'Alternate phone', g: 'merchant', opt: true },
    { k: 'avgTicket', l: 'Average ticket size (EGP)', g: 'service', req: online }, { k: 'intModel', l: 'Integration model', g: 'service', t: 'select', o: ['Payment link', 'Merchant website', 'Merchant app'], req: online },
    { k: 'intType', l: 'Integration type', g: 'service', t: 'select', o: ['2P', '2.5P', '3P'], req: online },
    { k: 'signatory', l: 'Authorized signatory name', g: 'service', req: c => c.model === 'PF' },
    { k: 'outlet', l: 'Outlet name', g: 'service', req: pos }, { k: 'outletCity', l: 'Outlet city', g: 'service', req: pos }, { k: 'outletAddr', l: 'Outlet address', g: 'service', req: pos, wide: true },
    { k: 'delName', l: 'Delegate full name', g: 'service', req: c => pos(c) && reg(c) }, { k: 'delIdNo', l: 'Delegate ID number', g: 'service', req: c => pos(c) && reg(c) }, { k: 'delNat', l: 'Delegate nationality', g: 'service', req: c => pos(c) && reg(c) },
    { k: 'mcc', l: 'MCC', g: 'auto', calc: (c, s) => mapOf(c.industry).mcc }, { k: 'discount', l: 'Bank discount code', g: 'auto', calc: (c, s) => mapOf(c.industry).discount },
    { k: 'descriptor', l: 'Bank descriptor', g: 'auto', calc: (c, s) => ('KASHIER*' + c.merchant.name).toUpperCase().slice(0, 25) }, { k: 'agCode', l: 'NBE AG code', g: 'auto', calc: (c, s) => mapOf(c.industry).ag, req: pos },
    { k: 'settleAcct', l: 'Settlement account number', g: 'auto', calc: () => fixed().settleAcct, set: true }, { k: 'profile', l: 'Profile code', g: 'auto', calc: () => fixed().profile, req: online, set: true }, { k: 'cid', l: 'CID', g: 'auto', calc: () => fixed().cid, req: online, set: true },
    { k: 'settleCcy', l: 'Settlement currency', g: 'auto', calc: () => fixed().settleCcy, req: pos, set: true }, { k: 'settleName', l: 'Settlement account name', g: 'auto', calc: () => fixed().settleName, req: pos, set: true }, { k: 'dba', l: 'DBA merchant name code', g: 'auto', calc: () => fixed().dba, req: pos, set: true },
    { k: 'mtype', l: 'MType', g: 'auto', calc: () => fixed().mtype, req: pos, set: true }, { k: 'structId', l: 'Structure ID', g: 'auto', calc: () => fixed().structId, req: pos, set: true }, { k: 'structPos', l: 'Structure position', g: 'auto', calc: () => fixed().structPos, req: pos, set: true }, { k: 'parent', l: 'Parent merchant', g: 'auto', calc: () => fixed().parent, req: pos, set: true },
    { k: 'docsStatus', l: 'Documents sent to the bank', g: 'bank', t: 'select', o: ['Not sent', 'Sent', 'Sent, issues found'] }, { k: 'docsNote', l: 'Document issues', g: 'bank', opt: true, wide: true },
    { k: 'batch', l: 'Bank batch number', g: 'bank', opt: true }, { k: 'ref', l: 'Bank notes / HPS reference', g: 'bank', opt: true }, { k: 'cbe', l: 'CBE initiative', g: 'bank', opt: true }, { k: 'caseNo', l: 'Case #', g: 'bank', opt: true },
    { k: 'decision', l: 'Bank decision', g: 'bank', t: 'select', o: ['Pending', 'Approved', 'Rejected', 'Waiting merchant reply'] }, { k: 'bankComment', l: 'Bank comment', g: 'bank', opt: true, wide: true },
  ];
  const GROUP = { merchant: ['Merchant details', 'Collected by Sales. Fill any gap here; every change is logged.'], service: ['This service', 'Specific to this service.'], auto: ['Calculated', 'Worked out from the application. Nothing to type.'], bank: ['After sending to the bank', 'Filled once the case is with the bank.'] };
  function valueOf(c, f) {
    const s = stateFor(c.appId); if (!s) return '';
    if (f.calc) return f.calc(c, s);
    const store = f.g === 'merchant' ? (s.legal || {}) : ((s.cases[c.sid] || {}).bank || {});
    const v = store[f.k];
    if (v != null && v !== '') return v;
    if (f.k === 'bankAcct') return '';
    return f.def || '';
  }
  /* The fields that apply to this case, with their values, and which required ones are still empty. */
  function readiness(c) {
    if (!PHASE2 || c.type !== 'service') return null;
    const sent = c.status === 'Bank Submission' || c.status === 'Live';
    const applies = f => f.opt || !f.req || f.req(c);     // a conditional field shows only where it applies (POS, Online, companies...)
    const groups = ['merchant', 'service', 'auto', 'bank'].map(g => ({ key: g, title: GROUP[g][0], note: GROUP[g][1], fields: FIELDS.filter(f => f.g === g && applies(f)).map(f => {
      const required = !f.opt && g !== 'bank', v = valueOf(c, f);
      return { k: f.k, label: f.l, type: f.t || 'text', options: f.o || null, wide: !!f.wide, value: v, required: required, auto: !!f.calc, editable: !f.calc && (g !== 'bank' || sent), done: !required || String(v).trim() !== '' };
    }) }));
    const req = [].concat.apply([], groups.map(g => g.fields)).filter(f => f.required);
    return { groups: groups, total: req.length, done: req.filter(f => f.done).length, missing: req.filter(f => !f.done).map(f => f.label), complete: req.every(f => f.done), sent: sent };
  }
  function setField(c, k, v) {
    const s = stateFor(c.appId), f = FIELDS.filter(x => x.k === k)[0]; if (!s || !f || f.calc) return false;
    const holder = f.g === 'merchant' ? (s.legal = s.legal || {}) : ((s.cases[c.sid].bank = s.cases[c.sid].bank || {}));
    const old = holder[k] == null ? '' : String(holder[k]), nv = String(v == null ? '' : v).trim();
    if (old === nv) return false;
    holder[k] = nv;
    addLog(s, c.sid, 'updated ' + f.l.charAt(0).toLowerCase() + f.l.slice(1), 'pencil', (old || 'Not set') + ' → ' + (nv || 'Not set')); save(s); return true;
  }

  /* Each section carries its own decision. Once every section is decided the case settles: all approved moves it on
     (to the bank, or the changes are applied); any rejected section returns the whole case to Sales with the reasons. */
  function settle(id) {
    const c = get(id); if (!c || c.status !== 'Underwriting Review') return null;
    const p = progress(c); if (p.list.some(x => x.state === 'todo')) return null;
    if (p.flagged.length) { reject(c, p.flagged.map(f => f.label + ': ' + f.reason).join('. ')); return 'rejected'; }
    const r = readiness(c); if (r && !r.complete) return 'blocked';   // approved, but the bank needs more data first
    approve(c); return 'approved';
  }

  /* The other type of case on the same application: a service case is shown with the application's changes to
     business details / payout methods, and an application case with the application's services still in review. */
  function related(c) {
    const s = stateFor(c.appId); if (!s) return [];
    const rank = x => x.status === 'Underwriting Review' ? 0 : 1;
    const ids = c.type === 'service' ? (s.kyc || []).filter(k => KYC_SHOWN.indexOf(k.status) > -1).map(k => k.key)
      : s.order.filter(id => s.cases[id] && SHOWN.indexOf(s.cases[id].status) > -1);
    return ids.map(id => get(gid(s, id))).filter(Boolean).sort((a, b) => rank(a) - rank(b));
  }

  /* The services on the same application, so the case info shows where this one sits. */
  function siblings(c) { const s = stateFor(c.appId); return s ? s.order.filter(id => s.cases[id]).map(id => ({ id: gid(s, id), service: label(id), status: s.cases[id].status, caseId: s.cases[id].caseId, self: id === c.sid })) : []; }

  /* Activity on one case: the application's log, filtered to it. */
  function activity(c) { const s = stateFor(c.appId); return (s ? s.log : []).filter(e => e.id === c.sid); }
  const wait = h => h < 1 ? 'Under 1h' : h < 24 ? Math.floor(h) + 'h' : Math.floor(h / 24) + 'd ' + Math.floor(h % 24) + 'h';
  const salesUrl = () => 'sales-applications/application.html?as=sales';

  /* The Cases list shows these next to the application cases, in the same row shape. */
  const LIST_STATUS = { 'Underwriting Review': 'submitted', 'Bank Submission': 'pending-configurations', Rejected: 'rejected', Live: 'live', Approved: 'approved' };
  function asCases() {
    return all().map(c => ({ svcId: c.id, sales: true, kind: c.type, isNew: c.isNew, status: LIST_STATUS[c.status], salesStatus: c.status, no: c.caseId, mid: '', assignee: c.assignee, since: c.since, resubmission: '',
      app: { id: c.appId, biz: c.merchant.name, actor: c.submittedBy, summary: { email: c.merchant.email, serviceConfigs: c.type === 'service' ? [{ service: c.service, configs: c.banks.map(b => ({ bank: b })) }] : [] } },
      service: c.service, href: 'sales-case.html?id=' + encodeURIComponent(c.id) }));
  }

  return { C: C, STATUS: STATUS, SHOWN: SHOWN, DEMO_URL: DEMO_URL, chip: chip, all: all, get: get, state: state, checks: checks, progress: progress, setReview: setReview,
    addNote: addNote, assign: assign, approve: approve, reject: reject, settle: settle, related: related, goLive: goLive, activity: activity, wait: wait, salesUrl: salesUrl, asCases: asCases, label: label,
    resetDemo: resetDemo, PHASE2: PHASE2, siblings: siblings, readiness: readiness, setField: setField, settings: settings, saveSettings: saveSettings, FIXED_LABEL: FIXED_LABEL, FIXED_HINT: FIXED_HINT, INDUSTRIES: Object.keys(MCC) };
})();
