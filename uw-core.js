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
/* nbe-export.js reads the payout through the Merchant module's currentPayout(app); for a case from here it is the case's own payout. */
(function () { const K = window.KashierRates; if (!K || !K.currentPayout || K.__uwPatched) return; const orig = K.currentPayout; K.currentPayout = function (app) { return app && app.__uw ? app.payout : orig.apply(this, arguments); }; K.__uwPatched = true; })();
window.UW = (function () {
  const C = window.Cases, esc = C.esc;
  /* A case has two phases. Phase 1 is the review: the case info, the service with its pricing, documents and contract.
     Phase 2 is the bank preparation (bank readiness, batch, bank decision). It is postponed: the code stays, switched off here. */
  const PHASE2 = false;                // phase 2: bank preparation (NBE and Bank Misr), switched off for now
  const STEPPER = false;               // the two-phase tracker on the case page, hidden for now
  const BANK_RESPONSE = true;          // the bank's answer: approved completes the case, rejected returns it to Sales
  const SA_KEY = 'sa-dir-final', DEMO_KEY = 'kashierUwDemoApps', STORE = 'kashierUwCases';
  const CLOCK = new Date('2026-10-21T12:00:00').getTime();        // the sales prototype's "now", so waiting times agree
  const SLA = { 'Underwriting Review': 72, 'Bank Submission': 120 };
  /* The case statuses, moved by hand by Underwriting:
       Underwriting Review -> UW Approved (a service case goes on: Sent to Bank) | UW rejected: Pending Sales Action (returned to Sales)
       Sent to Bank -> Pending Onboarding Configurations (bank approved) | Rejected by Bank (merchant not qualified) | Pending Sales Action (bank needs more, returned to Sales)
       Pending Onboarding Configurations -> Active
     Underwriting can set any status at any time, forwards or backwards (setStatus).
     They sit on top of the sales application's own status (Underwriting Review, Bank Submission, Rejected, Live), which the salesperson still sees. */
  const STATUS = {
    'Underwriting Review': { tone: 'warning', sc: 'warn', label: 'Underwriting Review' },
    'UW Approved': { tone: 'positive', sc: 'ok', label: 'UW Approved' },
    'Pending Sales Action': { tone: 'warning', sc: 'warn', label: 'Pending Sales Action' },
    'Sent to Bank': { tone: 'neutral', sc: 'info', label: 'Sent to Bank' },
    'Pending Onboarding Configurations': { tone: 'neutral', sc: 'info', label: 'Pending Onboarding Configurations' },
    Active: { tone: 'positive', sc: 'ok', label: 'Active' },
    'Rejected by Bank': { tone: 'negative', sc: 'bad', label: 'Rejected by Bank' },
  };
  const ORDER = Object.keys(STATUS);
  /* The status a case shows, from the sales application's status and the little Underwriting adds (stage, and who rejected it). */
  const ustatus = (raw, x) => raw === 'Underwriting Review' ? 'Underwriting Review' : raw === 'Live' ? 'Active' : raw === 'Approved' ? 'UW Approved'
    : raw === 'Rejected' ? (x.reject && x.reject.from === 'bank' ? (x.reject.final ? 'Rejected by Bank' : 'Pending Sales Action') : 'Pending Sales Action')
    : raw === 'Bank Submission' ? ({ uwOk: 'UW Approved', bankOk: 'Pending Onboarding Configurations', config: 'Pending Onboarding Configurations' }[x.stage] || 'Sent to Bank') : raw;
  const SHOWN = ['Underwriting Review', 'Bank Submission', 'Rejected', 'Live'], KYC_SHOWN = ['Underwriting Review', 'Approved', 'Rejected'];
  /* The four case types. Service Activation Request: a newly requested service (pricing, website, documents, contract). Service Update: a change to
     a service that is already active. Change KYB/KYC: the business details (name, industry, contact...), with their supporting documents. Add Payout
     Method: the payout methods entered with the first submission (they can't be changed afterwards). A first submission of the business details
     is shown without old values. */
  const TYPE = { activation: 'Service Activation Request', update: 'Service Update', kyb: 'Change KYB/KYC', payout: 'Add Payout Method' };
  const isPayLabel = l => /^(Payout method|Primary payout)/.test(l);
  const kycKind = x => (x.changes || []).length && x.changes.every(ch => isPayLabel(ch.label)) ? 'payout' : 'kyb';
  const docsForKyb = c => { const set = [], add = d => { if (set.indexOf(d) < 0) set.push(d); };
    if (c.isNew) { add('Commercial Registration (CR)'); add('National ID'); }
    (c.changes || []).forEach(x => { if (/^(Business name|Industry|Merchant type)/.test(x.label)) add('Commercial Registration (CR)'); if (/^Owner nationality/.test(x.label)) add('National ID'); });
    return set; };
  const chip = st => { const m = STATUS[st] || { tone: 'neutral', label: st }; return '<span class="chip ' + m.tone + '">' + esc(m.label) + '</span>'; };
  const chOf = id => id.split(' ')[0], nmOf = id => id.slice(id.indexOf(' ') + 1), label = id => nmOf(id) + ' (' + chOf(id) + ')';
  const nowStr = () => new Date().toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const iso = hoursAgo => new Date(CLOCK - hoursAgo * 36e5).toISOString();

  /* ── Demo applications ── */
  /* MIDs follow the sales application's list: the merchant at position i has MID-(10200 + 37 i)-(100 + 113 i mod 900), so a merchant that is in
     My Applications has the same MID here (Cairo Fresh Market MID-10200-100, Giza Learning Hub MID-10311-439 ...). Others continue the sequence. */
  const SALES_BIZ = ['Cairo Fresh Market', 'Delta Pharma Group', 'Nile Bites Restaurants', 'Giza Learning Hub', 'Zamalek Boutique Hotel', 'Alex Auto Parts', 'Heliopolis Fitness Club', 'Maadi Home Decor', 'Sinai Dive Center', 'Nasr City Bookstore', 'Pyramids Logistics', '6th October Auto Care', 'Dokki Dental Clinic', 'Tanta Textiles', 'Mansoura Smart Tech', 'Aswan Spice Bazaar', 'Luxor Heritage Tours', 'Port Said Marine', 'Zayed Real Estate', 'Shorouk Insurance Brokers', 'Garden City Florist', 'Ismailia Kids Academy', 'Fayoum Organic Farms', 'Hurghada Surf School', 'New Cairo Pet Clinic', 'Bab El Louq Coffee', 'Siwa Crafts Co.', 'Matrouh Beach Resort', 'Obour Wholesale', 'Tahrir Legal Partners', 'Damietta Furniture House', 'Rehab Mall Kiosks'];
  const midAt = i => 'MID-' + (10200 + i * 37) + '-' + (100 + (i * 113) % 900);
  const midFor = (name, n) => { const i = SALES_BIZ.indexOf(name); return midAt(i < 0 ? SALES_BIZ.length + n : i); };
  const j = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } };
  const rate = (r, f) => ({ rate: String(r), fee: String(f) });
  const PRICE = { Card: { local: rate(1.72, 1.96), 'intl-EGP': rate(2.45, 2.94) } };
  function demoApp(n, m) {
    const app = {
      appId: 'APP-2408' + (1400 + n), mid: m.mid || midFor(m.name, n), merchant: { name: m.name, email: m.email, phone: m.phone }, entity: m.entity || 'Registered Business', industry: m.industry, owner: '',
      submittedBy: m.by, submittedAt: m.at, svc: {}, order: [], cases: {}, docs: {}, websites: m.web ? [].concat(m.web) : [''], storeImage: m.store || '', reqContracts: {},
      payouts: [{ id: 1, type: 'bank', name: '', bank: m.bank || 'National Bank of Egypt', branch: 'Main Branch', holder: m.name, acct: '10' + (20000000000 + n * 3917) }], primary: 1, nextPayout: 2,
      kyc: [], updates: [], log: [], nextCase: 1, _src: 'demo'
    };
    app.docs['National ID'] = { 'Front side': 'national-id-front.jpg', 'Back side': 'national-id-back.jpg' };
    app.docs['Commercial Registration (CR)'] = { File: 'cr-' + n + '.pdf' };
    if (m.name !== 'Zayed Real Estate') app.docs['Bank Account Letter / IBAN proof'] = { File: 'iban-proof-' + n + '.pdf' };
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
      if (sv.prep) app.cases[id].prepDemo = sv.prep;
      if (sv.st === 'Rejected') app.cases[id].reject = { source: 'uw', from: sv.from, final: !!sv.final, by: sv.from === 'bank' ? (sv.bank || 'The bank') : 'Underwriting team', role: sv.from === 'bank' ? 'Bank' : 'Underwriting', comment: sv.why, at: '10/19/2026, 02:30:00 PM' };
      if (sv.stage) app.cases[id].stage = sv.stage;
      if (sv.st === 'Live') app.cases[id].liveSince = '12 Oct 2026';
      if (sv.contract !== false && sv.model === 'PF') app.reqContracts[nm + ' - PF Contract'] = nm.toLowerCase().replace(/\s+/g, '-') + '-pf-contract-signed.pdf';
      app.log.unshift({ t: '10/0' + (1 + (n % 8)) + '/2026, 10:00:00 AM', who: 'System', text: 'moved the ' + label(id) + ' case to Underwriting Review', ic: 'check', id: id });
      app.log.unshift({ t: '09/3' + (n % 2) + '/2026, 05:20:01 PM', who: m.by, text: 'submitted the ' + label(id) + ' case', ic: 'send', detail: app.cases[id].caseId + ' · Underwriting Review', id: id });
    });
    // Service updates: changes to a service that is already active, each as patches that are applied when approved.
    const tierName = k => k === 'local' ? 'Local rates' : k.indexOf('intl-') === 0 ? 'International rate (' + k.slice(5) + ')' : k === 'selling' ? 'Selling rate' : k;
    const txt = r => r ? r.rate + '% + ' + r.fee + ' EGP' : 'Not set';
    (m.upd || []).forEach((u, i) => {
      const sv = app.svc[u.svc], key = 'upd:' + (i + 1);
      const changes = u.ch.map(p => p.type === 'rate' ? { label: tierName(p.key), from: txt(sv.lines[p.li || 0].rates[p.key]), to: p.rate + '% + ' + p.fee + ' EGP' }
        : p.type === 'ops' ? { label: 'Advanced operations', from: (sv.ops || []).length ? sv.ops.join(', ') : 'None', to: p.ops.length ? p.ops.join(', ') : 'None' }
        : p.type === 'notes' ? { label: 'Notes', from: sv.notes || 'None', to: p.notes } : { label: 'Currencies', from: (sv.currencies || []).join(', '), to: p.list.join(', ') });
      app.updates.push({ n: i + 1, key: key, caseId: 'CASE-' + (++c), status: u.st, service: u.svc, patches: u.ch, changes: changes, by: m.by, role: 'Salesperson', at: '10/19/2026, 10:00:00 AM', since: iso(u.h || 20),
        reject: u.st === 'Rejected' ? { source: 'uw', by: 'Underwriting team', role: 'Underwriting', comment: u.why, at: '10/20/2026, 11:30:00 AM' } : undefined, decision: u.st === 'Approved' ? { by: 'Rana Adel', at: '10/20/2026, 09:10:00 AM' } : undefined });
      app.log.unshift({ t: '10/19/2026, 10:00:00 AM', who: m.by, text: 'requested an update of the ' + label(u.svc) + ' service', ic: 'send', detail: changes.map(x => x.label + ': ' + (x.from == null || x.from === '' ? 'Not set' : x.from) + ' → ' + (x.to == null || x.to === '' ? 'Not set' : x.to)).join('; '), id: key });
    });
    (m.kyc || []).forEach((k, i) => {
      const P = { name: m.name, email: m.email, phone: m.phone, industry: m.industry, owner: '', websites: m.web ? [].concat(m.web) : [], storeImage: m.store || '', payouts: app.payouts.map(p => Object.assign({}, p)), primary: 1, nextPayout: 2 };
      const changes = k.isNew ? (k.part === 'payout' ? [{ label: 'Payout method', to: pay(app.payouts[0]) }] : [{ label: 'Business name', to: m.name }, { label: 'Merchant type', to: app.entity }, { label: 'Industry', to: m.industry }, { label: 'Contact', to: m.email + ' \u00b7 ' + m.phone }]) : k.changes.map(x => { if (x.set) x.set(P); return { label: x.label, from: typeof x.from === 'function' ? x.from(app) : x.from, to: typeof x.to === 'function' ? x.to(app) : x.to }; });
      const key = 'kyc:' + (i + 1);
      app.kyc.push({ n: i + 1, key: key, caseId: 'CASE-' + (++c), status: k.st, isNew: !!k.isNew, changes: changes, proposed: P, by: m.by, role: 'Salesperson', at: '10/19/2026, 10:00:00 AM', since: iso(k.h || 20),
        reject: k.st === 'Rejected' ? { source: 'uw', by: 'Underwriting team', role: 'Underwriting', comment: k.why, at: '10/20/2026, 11:30:00 AM' } : undefined, decision: k.st === 'Approved' ? { by: 'Rana Adel', at: '10/20/2026, 09:10:00 AM' } : undefined });
      app.log.unshift({ t: '10/19/2026, 10:00:00 AM', who: m.by, text: 'sent a KYC update to Underwriting', ic: 'send', detail: changes.map(x => x.label + ': ' + (x.from == null || x.from === '' ? 'Not set' : x.from) + ' → ' + (x.to == null || x.to === '' ? 'Not set' : x.to)).join('; '), id: key });
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
    if (level === 'full') Object.assign(app.legal, { activityAr: '\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u062a\u062c\u0632\u0626\u0629 \u0648\u0627\u0644\u0645\u0633\u062a\u0644\u0632\u0645\u0627\u062a', legalForm: 'LLC', crNo: '10' + pad(n * 104729, 7), ownerIdType: 'National ID', ownerIdNo: '290' + pad(n * 9973, 11), ownerNat: 'Egyptian', activity: m.industry + ' merchant, sells to retail customers', addr1: n + ' Main Street', gov: 'Cairo', city: 'Nasr City', country: 'Egypt' });
    if (level !== 'full') return;
    app.order.forEach(id => {
      const cs = app.cases[id], b = cs.bank = { avgTicket: '1500', intModel: 'Merchant website', intType: '3P', signatory: app.legal.ownerName, bmCity: 'CAIRO', bmDiscountCode: 'M17', posTid: 'KA00' + pad(n * 211, 4), ownerTitle: 'MR', nbeBranch: 'Zamalek', outlet: m.name + ' main outlet', outletCity: 'Cairo', outletAddr: app.legal.addr1 + ', Cairo', delName: app.legal.ownerName, delIdNo: app.legal.ownerIdNo, delNat: 'Egyptian' };
      if (cs.prepDemo === 'ready') { cs.bankPrepared = { by: 'Rana Adel', at: '11/11/2026, 10:00:00 AM', bank: 'Bank Misr' }; }
      if (cs.prepDemo && cs.prepDemo !== 'ready') {
        const who = 'Rana Adel', at = '11/10/2026, 10:00:00 AM';
        cs.bankPrepared = { by: who, at: at, bank: 'National Bank of Egypt' }; cs.bankExported = { by: who, at: at, files: ['NBE Online - ' + m.name + ' - E-Commerce application form.docx'] };
        cs.bankSent = { by: who, at: '11/10/2026, 11:30:00 AM', batch: 'NBE-2026-11-' + pad(n, 2), ref: 'HPS-' + pad(n * 417, 6) };
        if (cs.prepDemo === 'merchant') cs.waiting = { bank: 'National Bank of Egypt', comment: 'NBE asked for a recent utility bill for the business address.', by: who, at: '11/11/2026, 09:15:00 AM', notified: ['Aya Muhammed (Salesperson)', 'Nadia Salah (Sales Manager)'] };
        if (cs.prepDemo === 'merchant') cs.bankAnswer = { decision: 'Waiting for the merchant', comment: 'NBE asked for a recent utility bill for the business address.', by: who, at: '11/11/2026, 09:15:00 AM' };
        delete cs.prepDemo;
      }
      if (cs.status === 'Bank Submission' || cs.status === 'Live') Object.assign(b, { docsStatus: 'Sent', batch: 'BM-2026-10-' + pad(n + 5, 2), ref: 'HPS-' + pad(n * 311, 6), decision: cs.status === 'Live' ? 'Approved' : 'Pending' });
    });
  }
  const pay = p => (p.name ? p.name + ': ' : '') + 'Bank account · ' + p.bank + ' · ' + p.branch + ' · ' + p.holder + ' · ' + p.acct;
  const DOCS_ON = ['Brand Authorization Letter'], DOCS_POS = ['Store Lease / Location Proof'], DOCS_BM = ['BM PSP Agreement Annex'];
  const DEMO = [
    { name: 'Cairo Fresh Market', industry: 'Retail & E-commerce', email: 'youssef@cairofresh.com', phone: '+20 100 123 4567', by: 'Mostafa Khaled', at: '28 Sept 2026', web: ['www.cairofresh.com', 'instagram.com/cairofresh', 'facebook.com/cairofreshmarket'], store: 'storefront-cairo.jpg', docs: DOCS_ON.concat(DOCS_POS),
      svc: [{ id: 'Online Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Underwriting Review', h: 30, ops: ['Recurring'], notes: 'Subscription billing for monthly produce boxes.' }, { id: 'Online Wallet', model: 'PF', st: 'Underwriting Review', h: 100, sell: 0.9 }, { id: 'POS Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Bank Submission', h: 40 }] },
    { name: 'Giza Learning Hub', industry: 'Education', email: 'omar@gizalearning.edu', phone: '+20 111 765 4321', by: 'Nour Hamdy', at: '30 Sept 2026', web: 'www.gizalearning.edu', docs: [],
      svc: [{ id: 'Online Card', model: 'PSP', bank: 'Bank Misr', st: 'Underwriting Review', h: 12 }, { id: 'Online Valu', model: 'PF', st: 'Underwriting Review', h: 52, sell: 2.2 }] },
    { name: 'Heliopolis Fitness Club', industry: 'Entertainment & Media', email: 'salma@heliofit.com', phone: '+20 122 300 1100', by: 'Aya Muhammed', at: '02 Oct 2026', web: 'www.heliofit.com', store: 'heliofit-front.jpg', docs: DOCS_POS.concat(DOCS_ON),
      svc: [{ id: 'POS Card', model: 'PF', bank: 'CIB', st: 'Underwriting Review', h: 60 }, { id: 'POS Wallet', model: 'PF', st: 'Underwriting Review', h: 26, sell: 1.0 }, { id: 'Online Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Bank Submission', h: 150, stage: 'bankOk' }] },
    { name: 'Nasr City Bookstore', industry: 'Education', email: 'mona@nasrbooks.com', phone: '+20 109 888 2200', by: 'Karim Zaki', at: '25 Sept 2026', web: 'www.nasrbooks.com', docs: DOCS_ON,
      svc: [{ id: 'Online Card', model: 'PF', bank: 'Bank Misr', st: 'Rejected', h: 70, why: 'Tax Identification Card is expired. Upload a valid copy.' }] },
    { name: 'Dokki Dental Clinic', industry: 'Healthcare / Pharmacy', email: 'laila@dokkidental.com', phone: '+20 100 450 7788', by: 'Aya Muhammed', at: '10 Sept 2026', web: 'www.dokkidental.com', docs: DOCS_ON.concat(DOCS_BM),
      upd: [{ svc: 'Online Card', st: 'Underwriting Review', h: 22, ch: [{ type: 'rate', li: 0, key: 'local', rate: '1.65', fee: '1.90' }, { type: 'ops', ops: ['Recurring'] }] }, { svc: 'Online Card', st: 'Approved', h: 120, ch: [{ type: 'notes', notes: 'Lower rates agreed for the pharmacy chain.' }] }],
      svc: [{ id: 'Online Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Live', h: 300 }, { id: 'Online Bank Installments', model: 'PSP', bank: 'Bank Misr', st: 'Bank Submission', h: 80, stage: 'config', rates: { selling: rate(1.4, 1.5) } }] },
    { name: 'Zayed Real Estate', industry: 'Real Estate', email: 'yasmin@zayedre.com', phone: '+20 111 909 3030', by: 'Mostafa Khaled', at: '15 Oct 2026', web: 'www.zayedre.com', docs: DOCS_ON,
      svc: [{ id: 'Online Card', model: 'PSP', bank: 'CIB', st: 'Underwriting Review', h: 4 }, { id: 'POS Card', model: 'PF', bank: 'Bank Misr', st: 'Bank Submission', h: 40 }],
    },
    { name: 'Garden City Florist', industry: 'Retail & E-commerce', email: 'heba@gcflorist.com', phone: '+20 100 612 9090', by: 'Nour Hamdy', at: '22 Sept 2026', web: 'www.gcflorist.com', docs: DOCS_ON,
      svc: [{ id: 'Online Wallet', model: 'PF', st: 'Underwriting Review', h: 140, sell: 0.8 }, { id: 'Online Instapay', model: 'PF', st: 'Underwriting Review', h: 33, sell: 0.5, contract: false }, { id: 'Online Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Rejected', from: 'bank', h: 200, why: 'NBE asked for a recent utility bill for the business address.' }, { id: 'POS Card', model: 'PF', bank: 'Bank Misr', st: 'Bank Submission', h: 90 }],
    },
    { name: 'Ismailia Kids Academy', industry: 'Education', email: 'rasha@ismailiakids.edu', phone: '+20 122 777 0101', by: 'Aya Muhammed', at: '05 Oct 2026', web: 'www.ismailiakids.edu', docs: DOCS_ON,
      upd: [{ svc: 'Online Card', st: 'Underwriting Review', h: 70, ch: [{ type: 'rate', li: 0, key: 'intl-EGP', rate: '2.30', fee: '2.80' }, { type: 'notes', notes: 'Seasonal campaign for school fees in September.' }] }],
      svc: [{ id: 'Online Card', model: 'PF', bank: 'QNB Alahli', st: 'Live', h: 180 }, { id: 'POS Card', model: 'PF', bank: 'Bank Misr', st: 'Bank Submission', h: 70, prep: 'ready' }],
      kyc: [{ st: 'Approved', h: 50, changes: [{ label: 'Contact phone', from: '+20 122 777 0101', to: '+20 122 777 0202', set: P => { P.phone = '+20 122 777 0202'; } }] }] },
    { name: 'Matrouh Beach Resort', industry: 'Travel & Tourism', email: 'khaled@matrouhresort.com', phone: '+20 100 330 4455', by: 'Karim Zaki', at: '18 Sept 2026', web: 'www.matrouhresort.com', docs: DOCS_ON,
      svc: [{ id: 'Online Souhoola', model: 'PF', st: 'Underwriting Review', h: 20, sell: 3.2 }, { id: 'Online Valu', model: 'PF', st: 'Rejected', h: 110, sell: 2.0, why: 'Commercial Registration does not list the resort as the merchant.' }] },
    { name: 'Aswan Spice Bazaar', industry: 'Food & Beverage', email: 'nadia@aswanspice.com', phone: '+20 111 556 6677', by: 'Mostafa Khaled', at: '12 Oct 2026', web: 'www.aswanspice.com', store: 'aswan-shop.jpg', docs: DOCS_POS,
      svc: [{ id: 'POS Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Rejected', from: 'bank', final: true, h: 60, why: 'The business activity is outside the bank policy.' }],
      kyc: [{ st: 'Underwriting Review', h: 6, changes: [{ label: 'Contact email', from: 'nadia@aswanspice.com', to: 'accounts@aswanspice.com', set: P => { P.email = 'accounts@aswanspice.com'; } }, { label: 'Contact phone', from: '+20 111 556 6677', to: '+20 111 556 0000', set: P => { P.phone = '+20 111 556 0000'; } }] },
        { st: 'Rejected', h: 70, why: 'Business name does not match the Commercial Registration.', changes: [{ label: 'Business name', from: 'Aswan Spice Bazaar', to: 'Aswan Spices LLC', set: P => { P.name = 'Aswan Spices LLC'; } }] }] },
    { name: 'Luxor Heritage Tours', industry: 'Travel & Tourism', email: 'mostafa@luxortours.com', phone: '+20 100 220 1212', by: 'Nour Hamdy', at: '08 Oct 2026', docs: DOCS_ON,
      svc: [{ id: 'Online Card', model: 'PF', bank: 'Bank Misr', st: 'Underwriting Review', h: 75 }, { id: 'Online Basata', model: 'PF', st: 'Live', h: 150, sell: 2.5 }],
      upd: [{ svc: 'Online Basata', st: 'Underwriting Review', h: 35, ch: [{ type: 'rate', li: 0, key: 'selling', rate: '2.30', fee: '1.50' }] }] },
    { name: 'Maadi Home Decor', industry: 'Retail & E-commerce', email: 'rania@maadidecor.com', phone: '+20 122 404 5050', by: 'Aya Muhammed', at: '20 Oct 2026', web: 'www.maadidecor.com', store: 'maadi-store.jpg', docs: DOCS_ON.concat(DOCS_POS),
      svc: [{ id: 'Online Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Underwriting Review', h: 2 }, { id: 'POS Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Bank Submission', h: 20 }],
      kyc: [{ st: 'Underwriting Review', h: 1, changes: [{ label: 'Industry', from: 'Retail & E-commerce', to: 'Fashion & Beauty', set: P => { P.industry = 'Fashion & Beauty'; } }] }] },
    { name: 'Nile Delta Pharmacy', industry: 'Healthcare / Pharmacy', email: 'ahmed@niledeltapharmacy.com', phone: '+20 100 818 2020', by: 'Aya Muhammed', at: '20 Oct 2026', web: ['www.niledeltapharmacy.com', 'instagram.com/niledeltapharmacy'], docs: DOCS_ON,
      svc: [{ id: 'Online Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Underwriting Review', h: 3 }], kyc: [{ st: 'Underwriting Review', h: 3, isNew: true, part: 'kyb' }, { st: 'Underwriting Review', h: 3, isNew: true, part: 'payout' }] },
    { name: 'Tanta Sports Club', industry: 'Entertainment & Media', email: 'karim@tantasports.com', phone: '+20 111 303 4040', by: 'Mostafa Khaled', at: '20 Oct 2026', web: 'www.tantasports.com', store: 'tanta-club.jpg', docs: DOCS_POS.concat(DOCS_ON),
      svc: [{ id: 'POS Card', model: 'PF', bank: 'CIB', st: 'Underwriting Review', h: 2 }, { id: 'Online Wallet', model: 'PF', st: 'Underwriting Review', h: 2, sell: 1.0 }], kyc: [{ st: 'Underwriting Review', h: 2, isNew: true, part: 'kyb' }, { st: 'Underwriting Review', h: 2, isNew: true, part: 'payout' }] },
    { name: 'Beni Suef Bakery', industry: 'Food & Beverage', email: 'sara@benisuefbakery.com', phone: '+20 122 505 6060', by: 'Nour Hamdy', at: '21 Oct 2026', web: 'facebook.com/benisuefbakery', docs: DOCS_ON.concat(DOCS_BM),
      svc: [{ id: 'Online Card', model: 'PSP', bank: 'Bank Misr', st: 'Underwriting Review', h: 1 }], kyc: [{ st: 'Underwriting Review', h: 1, isNew: true, part: 'kyb' }, { st: 'Underwriting Review', h: 1, isNew: true, part: 'payout' }] },
    { name: 'Alexandria Seafood House', industry: 'Food & Beverage', email: 'mahmoud@alexseafood.com', phone: '+20 100 701 1010', by: 'Aya Muhammed', at: '23 Oct 2026', web: 'www.alexseafood.com', store: 'alexandria.jpg', docs: DOCS_POS.concat(DOCS_ON),
      svc: [{ id: 'Online Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Underwriting Review', h: 5 }, { id: 'POS Card', model: 'PF', bank: 'CIB', st: 'Underwriting Review', h: 9 }] },
    { name: 'Sharm Diving Center', industry: 'Travel & Tourism', email: 'hana@sharmdiving.com', phone: '+20 111 702 2020', by: 'Nour Hamdy', at: '23 Oct 2026', web: 'www.sharmdiving.com', docs: DOCS_ON,
      svc: [{ id: 'Online Card', model: 'PF', bank: 'Bank Misr', st: 'Underwriting Review', h: 14 }, { id: 'Online Wallet', model: 'PF', st: 'Underwriting Review', h: 28, sell: 1.0 }] },
    { name: 'Port Said Electronics', industry: 'Retail & E-commerce', email: 'tarek@pselectronics.com', phone: '+20 122 703 3030', by: 'Mostafa Khaled', at: '24 Oct 2026', web: 'www.pselectronics.com', store: 'port.jpg', docs: DOCS_POS.concat(DOCS_ON).concat(DOCS_BM),
      svc: [{ id: 'Online Card', model: 'PSP', bank: 'Bank Misr', st: 'Underwriting Review', h: 3 }, { id: 'POS Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Underwriting Review', h: 46 }] },
    { name: 'Mansoura Medical Supplies', industry: 'Healthcare / Pharmacy', email: 'dina@mansouramed.com', phone: '+20 100 704 4040', by: 'Karim Zaki', at: '24 Oct 2026', web: 'www.mansouramed.com', docs: DOCS_ON,
      svc: [{ id: 'Online Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Underwriting Review', h: 8 }, { id: 'Online Souhoola', model: 'PF', st: 'Underwriting Review', h: 60, sell: 1.0 }] },
    { name: 'Fayoum Organic Farms', industry: 'Food & Beverage', email: 'ali@fayoumorganic.com', phone: '+20 111 705 5050', by: 'Aya Muhammed', at: '25 Oct 2026', web: 'instagram.com/fayoumorganic', docs: DOCS_ON,
      svc: [{ id: 'Online Card', model: 'PF', bank: 'CIB', st: 'Underwriting Review', h: 11 }, { id: 'Online Valu', model: 'PF', st: 'Underwriting Review', h: 72, sell: 1.0 }] },
    { name: 'Hurghada Water Sports', industry: 'Entertainment & Media', email: 'nada@hurghadawater.com', phone: '+20 122 706 6060', by: 'Nour Hamdy', at: '25 Oct 2026', web: 'www.hurghadawater.com', store: 'hurghada.jpg', docs: DOCS_POS.concat(DOCS_ON),
      svc: [{ id: 'POS Card', model: 'PF', bank: 'Bank Misr', st: 'Underwriting Review', h: 1 }, { id: 'Online Card', model: 'PF', bank: 'Bank Misr', st: 'Underwriting Review', h: 18 }] },
    { name: 'Suez Auto Parts', industry: 'Retail & E-commerce', email: 'sameh@suezauto.com', phone: '+20 100 707 7070', by: 'Mostafa Khaled', at: '26 Oct 2026', web: 'www.suezauto.com', docs: DOCS_ON,
      svc: [{ id: 'Online Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Underwriting Review', h: 26 }, { id: 'Online Basata', model: 'PF', st: 'Underwriting Review', h: 5, sell: 1.0 }] },
    { name: 'Qena Textile Trading', industry: 'Retail & E-commerce', email: 'hoda@qenatextile.com', phone: '+20 111 708 8080', by: 'Karim Zaki', at: '26 Oct 2026', web: 'facebook.com/qenatextile', docs: DOCS_ON.concat(DOCS_BM),
      svc: [{ id: 'Online Card', model: 'PSP', bank: 'Bank Misr', st: 'Underwriting Review', h: 33 }, { id: 'Online Wallet', model: 'PF', st: 'Underwriting Review', h: 7, sell: 1.0 }] },
    { name: 'Damietta Furniture Mall', industry: 'Retail & E-commerce', email: 'amr@damiettafurniture.com', phone: '+20 122 709 9090', by: 'Aya Muhammed', at: '27 Oct 2026', web: 'www.damiettafurniture.com', store: 'damietta.jpg', docs: DOCS_POS.concat(DOCS_ON),
      svc: [{ id: 'POS Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Underwriting Review', h: 4 }, { id: 'POS Wallet', model: 'PF', st: 'Underwriting Review', h: 12, sell: 1.0 }] },
    { name: 'Sohag Language School', industry: 'Education', email: 'mervat@sohagschool.edu', phone: '+20 100 710 1111', by: 'Nour Hamdy', at: '27 Oct 2026', web: 'www.sohagschool.edu', docs: DOCS_ON,
      svc: [{ id: 'Online Card', model: 'PF', bank: 'CIB', st: 'Underwriting Review', h: 2 }, { id: 'Online Instapay', model: 'PF', st: 'Underwriting Review', h: 38, sell: 1.0 }] },
  ];
  /* Demo data saved in a visitor's browser by an older version lacks newer fields (MID, pricing detail, new applications), so it is
     reseeded when the version changes. Decisions made on the demo applications are lost when that happens. */
  const DEMO_VER = 19;
  function seedDemo(force) {
    const cur = j(DEMO_KEY);
    if (!force && cur && cur.__v === DEMO_VER) return;
    const out = { __v: DEMO_VER }; DEMO.forEach((m, i) => { const a = demoApp(i + 1, m); out[a.appId] = a; });
    put(DEMO_KEY, out);
  }
  function resetDemo() { try { localStorage.removeItem(STORE); } catch (e) { /* storage unavailable */ } seedDemo(true); }

  /* ── Saved states: the sales prototype's application, plus the demo applications ── */
  function states() {
    const out = [], main = j(SA_KEY);
    if (main && main.appId && main.cases) out.push(main);
    const demo = j(DEMO_KEY) || {};
    Object.keys(demo).filter(k => k.indexOf('__') !== 0).forEach(k => { demo[k]._src = 'demo'; out.push(demo[k]); });
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
    states().forEach(s => { s.order.forEach(id => s.cases[id] && give(s, id, s.cases[id].status)); (s.kyc || []).forEach(x => give(s, x.key, x.status)); (s.updates || []).forEach(x => give(s, x.key, x.status)); });
    if (changed) { all.__rr = n; writeLocal(all); }
  }
  const canSee = c => !c.assignee || C.user().canReassign || c.assignee === C.user().name;

  /* The MID of the business a case belongs to. The sales prototype's own application is Delta Pharma Group, MID-10200-100. */
  // A demo application always has a MID (derived from its number if an older save lacks it); only a real one can be pending.
  const midOf = s => s.mid || (s._src === 'demo' ? midFor(s.merchant.name, (parseInt(String(s.appId).slice(-4), 10) || 1400) - 1400) : 'MID-10200-100');
  function build(s, id) {
    const c = s.cases[id], svc = s.svc[id] || { lines: [] }, k = keyOf(s, id), l = local(k);
    const since = c.since ? Date.parse(c.since) : CLOCK, hours = Math.max(0, (CLOCK - since) / 36e5), sla = SLA[c.status];
    return { type: 'service', kind: 'activation', caseType: TYPE.activation, key: k, id: gid(s, id), sid: id, mid: midOf(s), caseId: c.caseId, status: c.status, ustatus: ustatus(c.status, c), stage: c.stage || '', appId: s.appId, merchant: s.merchant, entity: s.entity, industry: s.industry,
      website: (s.websites || []).filter(Boolean).join(', '), websites: (s.websites || []).filter(Boolean), service: label(id), channel: chOf(id), model: svc.model || '', svc: svc, banks: [...new Set((svc.lines || []).map(x => x.bank).filter(Boolean))],
      submittedBy: s.submittedBy, submittedAt: s.submittedAt, terminals: s.terminals || '', submitComment: s.submitComment || '', since: new Date(since).toISOString(), hours: hours, sla: sla,
      late: !!sla && hours > sla, reject: c.reject || null, liveSince: c.liveSince || '', assignee: l.assignee, local: l };
  }
  /* An application case: the merchant's general information (business details, payout methods) changed after submission.
     It is applied to the application only when Underwriting approves it. */
  function buildKyc(s, x) {
    const k = keyOf(s, x.key), l = local(k), since = x.since ? Date.parse(x.since) : CLOCK, hours = Math.max(0, (CLOCK - since) / 36e5), open = x.status === 'Underwriting Review';
    const kind = kycKind(x);
    return { type: 'application', kind: kind, caseType: TYPE[kind], key: k, id: gid(s, x.key), sid: x.key, mid: midOf(s), caseId: x.caseId, status: x.status, ustatus: ustatus(x.status, x), appId: s.appId, merchant: s.merchant, entity: s.entity, industry: s.industry,
      service: TYPE[kind], isNew: !!x.isNew, changes: x.changes || [], proposed: x.proposed, banks: [], submittedBy: x.by || s.submittedBy, submittedAt: x.at || s.submittedAt,
      since: new Date(since).toISOString(), hours: hours, sla: open ? SLA['Underwriting Review'] : 0, late: open && hours > SLA['Underwriting Review'],
      reject: x.reject || null, decision: x.decision || null, assignee: l.assignee, local: l };
  }
  /* A service update: a change to a service that is already active. Approving applies its changes to the service. */
  function buildUpdate(s, x) {
    const sid = x.service, svc = s.svc[sid] || { lines: [] }, k = keyOf(s, x.key), l = local(k), since = x.since ? Date.parse(x.since) : CLOCK, hours = Math.max(0, (CLOCK - since) / 36e5), open = x.status === 'Underwriting Review';
    return { type: 'update', kind: 'update', caseType: TYPE.update, key: k, id: gid(s, x.key), sid: x.key, serviceId: sid, mid: midOf(s), caseId: x.caseId, status: x.status, ustatus: ustatus(x.status, x), appId: s.appId, merchant: s.merchant, entity: s.entity, industry: s.industry,
      website: (s.websites || []).filter(Boolean).join(', '), websites: (s.websites || []).filter(Boolean), service: label(sid), channel: chOf(sid), model: svc.model || '', svc: svc, banks: [...new Set((svc.lines || []).map(y => y.bank).filter(Boolean))],
      changes: x.changes || [], submittedBy: x.by || s.submittedBy, submittedAt: x.at || s.submittedAt, terminals: s.terminals || '', submitComment: '', since: new Date(since).toISOString(), hours: hours,
      sla: open ? SLA['Underwriting Review'] : 0, late: open && hours > SLA['Underwriting Review'], reject: x.reject || null, decision: x.decision || null, assignee: l.assignee, local: l };
  }
  function all() {
    seedDemo(); autoAssign();
    return [].concat.apply([], states().map(s => s.order.filter(id => s.cases[id] && SHOWN.indexOf(s.cases[id].status) > -1).map(id => build(s, id))
      .concat((s.kyc || []).filter(x => KYC_SHOWN.indexOf(x.status) > -1).map(x => buildKyc(s, x)))
      .concat((s.updates || []).filter(x => KYC_SHOWN.indexOf(x.status) > -1).map(x => buildUpdate(s, x))))).filter(canSee);
  }
  /* any: the application's own case drawer for Underwriting, which acts on every case of the application that is with Underwriting,
     including one still missing information and one assigned to another agent. */
  function get(cid, any) {
    seedDemo(); autoAssign();
    const p = split(cid), s = p[0] ? stateFor(p[0]) : states()[0]; if (!s) return null;
    const id = p[1]; let c = null;
    if (String(id).indexOf('upd:') === 0) { const x = (s.updates || []).filter(k => k.key === id)[0]; c = x && KYC_SHOWN.indexOf(x.status) > -1 ? buildUpdate(s, x) : null; }
    else if (String(id).indexOf('kyc:') === 0) { const x = (s.kyc || []).filter(k => k.key === id)[0]; c = x && KYC_SHOWN.indexOf(x.status) > -1 ? buildKyc(s, x) : null; }
    else c = s.cases[id] && SHOWN.indexOf(s.cases[id].status) > -1 ? build(s, id) : null;
    return c && (any || canSee(c)) ? c : null;
  }
  /* Every submitted case reaches Underwriting, each on its own. A required document or link that is missing shows as a flagged item in the case,
     so Underwriting can return it to Sales. */
  const state = () => states().length > 0;

  /* ── Review checklist ── */
  /* What each type of case asks Underwriting to verify.
       Service case: the service's pricing, the documents only that service needs (its channel, the Bank Misr PSP annex) and its PF contract.
       Application case: each requested change to the business details and payout methods. */
  function checks(c) {
    const s = stateFor(c.appId), r = c.local.review, out = [];
    const add = (key, lbl, tab, extra) => out.push(Object.assign({ key: key, label: lbl, tab: tab, state: (r[key] || {}).state || 'todo', reason: (r[key] || {}).reason || '' }, extra || {}));
    const names = d => Object.keys(s.docs[d] || {}).map(f => s.docs[d][f]).filter(Boolean), files = d => names(d).join(', ');
    // A required document that was never uploaded blocks approval: the case has to go back to Sales.
    const flagMissing = () => out.forEach(x => { if (x.files) { x.files = x.files.filter(Boolean); if (!x.files.length) { x.state = 'flag'; x.missing = true; x.reason = x.key === 'web' ? 'No website or social media link was provided' : 'Required item was not uploaded'; } } });
    if (c.type === 'update') {                       // Service Update: every change to the service, current beside requested
      c.changes.forEach((x, i) => add('chg:' + i, x.label, 'changes', { from: x.from, to: x.to }));
      return out;
    }
    if (c.type === 'application') {                  // Change KYB/KYC or Change Payout Method: each change, then the documents that support it
      c.changes.forEach((x, i) => { if (!/^Website/.test(x.label)) add('chg:' + i, x.label, 'changes', { from: c.isNew ? undefined : x.from, to: x.to, isNew: !!c.isNew }); });
      // A payout method change is not linked to documents; a KYB/KYC change is checked against the documents that support it.
      (c.kind === 'payout' ? [] : docsForKyb(c)).forEach(d => add('doc:' + d, d, 'documents', { files: [files(d)], list: names(d) }));
      flagMissing();
      return out;
    }
    add('pricing', 'Services & pricing', 'pricing');
    if (c.channel === 'Online') { add('web', 'Website or social media link', 'website', { files: [(s.websites || []).filter(Boolean).join(', ')], links: (s.websites || []).filter(Boolean) }); add('doc:Brand Authorization Letter', 'Brand Authorization Letter', 'documents', { files: [files('Brand Authorization Letter')], list: names('Brand Authorization Letter') }); }
    if (c.channel === 'POS') { add('doc:Store Lease / Location Proof', 'Store Lease / Location Proof', 'documents', { files: [files('Store Lease / Location Proof')], list: names('Store Lease / Location Proof') }); add('store', 'Store image', 'documents', { files: [s.storeImage], list: [s.storeImage].filter(Boolean) }); }
    if (c.svc.model === 'PSP' && (c.svc.lines || []).some(l => l.bank === 'Bank Misr')) add('doc:BM PSP Agreement Annex', 'BM PSP Agreement Annex', 'documents', { files: [files('BM PSP Agreement Annex')], list: names('BM PSP Agreement Annex') });
    if (c.svc.model === 'PF') { const n = nmOf(c.sid) + ' - PF Contract'; add('con:' + n, n, 'contracts', { files: [(s.reqContracts || {})[n]], list: [(s.reqContracts || {})[n]].filter(Boolean) }); }
    flagMissing();
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
    delete s.cases[c.sid].stage;
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
      s.storeImage = P.storeImage; s.payouts = P.payouts.map(p => Object.assign({}, p)); s.primary = P.primary; s.nextPayout = Math.max(s.nextPayout, P.nextPayout); if (P.legal) s.legal = Object.assign({}, s.legal || {}, P.legal); }
    k.status = 'Approved'; k.decision = { by: C.user().name, at: nowStr() }; k.since = new Date(CLOCK).toISOString();
    addLog(s, k.key, k.isNew ? 'approved the application details' : 'approved the KYC update', 'check', k.isNew ? 'The submitted business details and payout method are confirmed' : 'The changes are now on the application'); save(s); return true;
  }
  function rejectKyc(c, comment) {
    const s = stateFor(c.appId), k = s && kycOf(s, c); if (!k) return false;
    k.status = 'Rejected'; k.reject = { source: 'uw', by: C.user().name, role: 'Underwriting', comment: comment, at: nowStr() }; k.since = new Date(CLOCK).toISOString();
    addLog(s, k.key, 'rejected the KYC update', 'xcircle', comment); save(s); return true;
  }
  const updOf = (s, c) => (s.updates || []).filter(x => x.key === c.sid)[0];
  function applyPatch(s, sid, p) {
    const sv = s.svc[sid]; if (!sv) return;
    if (p.type === 'rate') { const ln = sv.lines[p.li || 0]; if (ln) { ln.rates = ln.rates || {}; ln.rates[p.key] = { rate: String(p.rate), fee: String(p.fee) }; } }
    else if (p.type === 'ops') sv.ops = p.ops.slice();
    else if (p.type === 'notes') sv.notes = p.notes;
    else if (p.type === 'currencies') sv.currencies = p.list.slice();
  }
  function approveUpdate(c) {
    const s = stateFor(c.appId), u = s && updOf(s, c); if (!u) return false;
    (u.patches || []).forEach(p => applyPatch(s, u.service, p));
    u.status = 'Approved'; u.decision = { by: C.user().name, at: nowStr() }; u.since = new Date(CLOCK).toISOString();
    addLog(s, u.key, 'approved the service update', 'check', 'The changes are now on the ' + label(u.service) + ' service'); save(s); return true;
  }
  function rejectUpdate(c, comment) {
    const s = stateFor(c.appId), u = s && updOf(s, c); if (!u) return false;
    u.status = 'Rejected'; u.reject = { source: 'uw', by: C.user().name, role: 'Underwriting', comment: comment, at: nowStr() }; u.since = new Date(CLOCK).toISOString();
    addLog(s, u.key, 'rejected the service update', 'xcircle', comment); save(s); return true;
  }
  const approve = c => c.type === 'update' ? approveUpdate(c) : c.type === 'application' ? approveKyc(c)
    : move(c, 'Bank Submission', { stage: 'uwOk' }, 'approved the ' + c.service + ' case', 'Underwriting review completed.');
  const toBank = c => c.ustatus === 'UW Approved' && c.type === 'service' && move(c, 'Bank Submission', {}, 'sent the ' + c.service + ' case to the bank', 'The case is waiting for the bank answer.');
  function reject(c, comment) {
    if (c.type === 'update') return rejectUpdate(c, comment);
    if (c.type === 'application') return rejectKyc(c, comment);
    return move(c, 'Rejected', { reject: { source: 'uw', by: C.user().name, role: 'Underwriting', comment: comment, at: nowStr() } },
      'rejected the ' + c.service + ' case and returned it to the salesperson', comment);
  }
  const goLive = c => move(c, 'Live', { liveSince: new Date(CLOCK).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }, 'marked the ' + c.service + ' case Active', 'The onboarding configurations are done. The service is active.');
  /* The bank answer and what follows, each a manual step: Approved by Bank | Rejected by Bank | Missing Bank Requirements, then Pending Onboarding Configurations, then Active. */
  function bankReply(c, outcome, comment) {
    if (c.ustatus !== 'Sent to Bank') return false;
    const bank = (c.banks || [])[0] || 'The bank', why = String(comment || '').trim();
    const rej = final => ({ reject: { source: 'uw', from: 'bank', final: final, by: bank, role: 'Bank', comment: why, at: nowStr() } });
    if (outcome === 'approved') return move(c, 'Bank Submission', { stage: 'config' }, 'recorded that ' + bank + ' approved the ' + c.service + ' case', why || 'Approved by the bank. The merchant configurations are being set up.');
    if (outcome === 'rejected') return move(c, 'Rejected', rej(true), 'recorded that ' + bank + ' rejected the ' + c.service + ' case', 'Merchant not qualified' + (why ? ': ' + why : '') + '.');
    return move(c, 'Rejected', rej(false), 'returned the ' + c.service + ' case to Sales: missing bank requirements', why);
  }
  /* The case workflow. From each status, only the moves that make sense are offered, each with its own name (a transition), the way a
     workflow tool does it: the status button opens "transition name -> target status". Forwards and backwards both have a named step. */
  /* The case workflow, as designed: each status offers only the moves that follow it. A status with no moves is waiting on someone
     else (Sales) or is final. */
  const FLOW = {
    service: {
      'Underwriting Review': [['Approve', 'UW Approved'], ['Reject', 'Pending Sales Action']],
      'UW Approved': [['Send to bank', 'Sent to Bank']],
      'Sent to Bank': [['Missing bank requirements', 'Pending Sales Action', 'missing'], ['Approved by bank', 'Pending Onboarding Configurations', 'approved'], ['Rejected by bank', 'Rejected by Bank', 'rejected']],
      'Pending Onboarding Configurations': [['Configurations done', 'Active']],
      'Pending Sales Action': [],
      'Rejected by Bank': [],
      Active: []
    },
    change: {
      'Underwriting Review': [['Approve', 'UW Approved'], ['Reject', 'Pending Sales Action']],
      'UW Approved': [],
      'Pending Sales Action': []
    }
  };
  /* Why a status has no moves. */
  const END = { 'Pending Sales Action': 'Waiting for Sales to fix the case and resubmit it. It comes back to Underwriting Review.', 'Rejected by Bank': 'Final status: the bank rejected the merchant.',
    Active: 'Final status: the service is live.', 'UW Approved': 'Final status: the changes are applied.' };
  const flowOf = c => FLOW[c.type === 'service' ? 'service' : 'change'];
  /* Only the moves the workflow allows from the case's current status. */
  const transitions = c => (flowOf(c)[c.ustatus] || []).map(([name, to, bank]) => ({ name: name, to: to, bank: bank || '' }));
  const endNote = c => transitions(c).length ? '' : (END[c.ustatus] || 'No moves from this status.');
  /* Returning to Sales, a missing bank requirement and a bank rejection always say why. */
  const needsComment = t => t.to === 'Pending Sales Action' || t.to === 'Rejected by Bank';
  function transition(c, t, comment) { return t.bank && c.ustatus === 'Sent to Bank' ? bankReply(c, t.bank, comment) : setStatus(c, t.to, comment); }
  /* Any status, at any time, in either direction. A status written here replaces the earlier decision (rejection, go-live date) rather than stacking on it. */
  function setStatus(c, to, comment) {
    const why = String(comment || '').trim(), svc = c.service || c.caseType, bank = (c.banks || [])[0] || 'The bank', back = 'moved the ' + svc + ' case to ' + to;
    if (to === c.ustatus) return false;
    if (c.type !== 'service') {
      const s = stateFor(c.appId), k = s && (c.type === 'update' ? updOf(s, c) : kycOf(s, c)); if (!k) return false;
      if (to === 'Pending Sales Action') return c.type === 'update' ? rejectUpdate(c, why) : rejectKyc(c, why);
      if (to === 'UW Approved') return c.type === 'update' ? approveUpdate(c) : approveKyc(c);
      if (to !== 'Underwriting Review') return false;
      k.status = 'Underwriting Review'; delete k.reject; delete k.decision; k.since = new Date(CLOCK).toISOString();
      addLog(s, k.key, back, 'check', ''); save(s); return true;
    }
    const clear = { reject: undefined, liveSince: undefined };
    if (to === 'Underwriting Review') return move(c, 'Underwriting Review', clear, back, '');
    if (to === 'UW Approved') return move(c, 'Bank Submission', Object.assign(clear, { stage: 'uwOk' }), back, '');
    if (to === 'Sent to Bank') return move(c, 'Bank Submission', clear, back, '');
    if (to === 'Pending Onboarding Configurations') return move(c, 'Bank Submission', Object.assign(clear, { stage: 'config' }), back, '');
    if (to === 'Active') return move(c, 'Live', Object.assign(clear, { liveSince: new Date(CLOCK).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }), back, '');
    if (to === 'Rejected by Bank') return move(c, 'Rejected', { reject: { source: 'uw', from: 'bank', final: true, by: bank, role: 'Bank', comment: why, at: nowStr() }, liveSince: undefined }, back, 'Merchant not qualified' + (why ? ': ' + why : '') + '.');
    if (to === 'Pending Sales Action') return move(c, 'Rejected', { reject: { source: 'uw', by: C.user().name, role: 'Underwriting', comment: why, at: nowStr() }, liveSince: undefined }, back, why);
    return false;
  }
  const toConfig = c => c.ustatus === 'Pending Onboarding Configurations' && move(c, 'Bank Submission', { stage: 'config' }, 'moved the ' + c.service + ' case to Pending Onboarding Configurations', 'The bank approved. The merchant configurations are being set up.');
  const activate = c => c.ustatus === 'Pending Onboarding Configurations' && goLive(c);


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
  /* The cities in Bank Misr's dropdown; the bank maps each to a city code. */
  const BM_CITIES = ['CAIRO', 'GIZA', 'ALEXANDRIA', 'PORT SAID', 'ISMAILIA', 'BANHA', 'LUXOR', 'ASWAN', 'ARISH', 'SHARM ELSHEKH', 'HURGHADA', 'MARSA MATROH', 'TABA', 'RAAS ELBAR', 'TANTA', 'MANSOURA',
    'EL MAHALA', 'EL MENIA', 'BANI SWIEF', 'ASSUIT', 'SUHAG', 'SUEZ', 'EL FAYOUM', 'DOMYAT', 'SHEBEN EL KOUM', 'EL ZAGAZEG', 'KAFR ELSHEIKH', 'EL KHARGA', 'DAMANHOU'];
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
    { k: 'avgTicket', bk: 'NBE', l: 'Average ticket size (EGP)', g: 'service', req: online }, { k: 'intModel', bk: 'NBE', l: 'Integration model', g: 'service', t: 'select', o: ['Payment link', 'Merchant website', 'Merchant app'], req: online },
    { k: 'intType', bk: 'NBE', l: 'Integration type', g: 'service', t: 'select', o: ['2P', '2.5P', '3P'], req: online },
    { k: 'signatory', l: 'Authorized signatory name', g: 'service', req: c => c.model === 'PF' },
    { k: 'outlet', l: 'Outlet name', g: 'service', req: pos }, { k: 'outletCity', l: 'Outlet city', g: 'service', req: pos }, { k: 'outletAddr', l: 'Outlet address', g: 'service', req: pos, wide: true },
    { k: 'ownerTitle', bk: 'NBE', l: 'Owner title', g: 'service', t: 'select', o: ['MR', 'MRS'], req: pos },
    { k: 'nbeBranch', bk: 'NBE', l: 'Merchant NBE branch', g: 'service', req: c => c.banks.indexOf('National Bank of Egypt') > -1 },
    { k: 'delName', bk: 'NBE', l: 'Delegate full name', g: 'service', req: c => pos(c) && reg(c) }, { k: 'delIdNo', bk: 'NBE', l: 'Delegate ID number', g: 'service', req: c => pos(c) && reg(c) }, { k: 'delNat', bk: 'NBE', l: 'Delegate nationality', g: 'service', req: c => pos(c) && reg(c) },
    { k: 'activityAr', l: 'Business activity (Arabic)', g: 'merchant', bk: 'BM', wide: true },
    { k: 'bmCity', l: 'City (Bank Misr list)', g: 'service', bk: 'BM', t: 'select', o: BM_CITIES },
    { k: 'bmDiscountCode', l: 'Bank Misr discount code', g: 'service', bk: 'BM' },
    { k: 'posTid', l: 'POS terminal ID (TID)', g: 'service', bk: 'BM', req: pos },
    { k: 'posName', l: 'POS name', g: 'service', bk: 'BM', opt: true }, { k: 'pinPadSerial', l: 'PIN pad serial', g: 'service', bk: 'BM', opt: true }, { k: 'bmHps', l: 'HPS merchant number', g: 'service', bk: 'BM', opt: true },
    { k: 'mcc', l: 'MCC', g: 'auto', calc: (c, s) => mapOf(c.industry).mcc }, { k: 'discount', bk: 'NBE', l: 'Bank discount code', g: 'auto', calc: (c, s) => mapOf(c.industry).discount },
    { k: 'descriptor', bk: 'NBE', l: 'Bank descriptor', g: 'auto', calc: (c, s) => ('KASHIER*' + c.merchant.name).toUpperCase().slice(0, 25) }, { k: 'agCode', bk: 'NBE', l: 'NBE AG code', g: 'auto', calc: (c, s) => mapOf(c.industry).ag, req: pos },
    { k: 'settleAcct', bk: 'NBE', l: 'Settlement account number', g: 'auto', calc: () => fixed().settleAcct, set: true }, { k: 'profile', bk: 'NBE', l: 'Profile code', g: 'auto', calc: () => fixed().profile, req: online, set: true }, { k: 'cid', bk: 'NBE', l: 'CID', g: 'auto', calc: () => fixed().cid, req: online, set: true },
    { k: 'settleCcy', bk: 'NBE', l: 'Settlement currency', g: 'auto', calc: () => fixed().settleCcy, req: pos, set: true }, { k: 'settleName', bk: 'NBE', l: 'Settlement account name', g: 'auto', calc: () => fixed().settleName, req: pos, set: true }, { k: 'dba', bk: 'NBE', l: 'DBA merchant name code', g: 'auto', calc: () => fixed().dba, req: pos, set: true },
    { k: 'mtype', bk: 'NBE', l: 'MType', g: 'auto', calc: () => fixed().mtype, req: pos, set: true }, { k: 'structId', bk: 'NBE', l: 'Structure ID', g: 'auto', calc: () => fixed().structId, req: pos, set: true }, { k: 'structPos', bk: 'NBE', l: 'Structure position', g: 'auto', calc: () => fixed().structPos, req: pos, set: true }, { k: 'parent', bk: 'NBE', l: 'Parent merchant', g: 'auto', calc: () => fixed().parent, req: pos, set: true },
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
    if (f.k === 'bmCity') { const ct = String((s.legal || {}).city || '').toUpperCase().trim(); if (BM_CITIES.indexOf(ct) > -1) return ct; }
    if (f.k === 'bankAcct') return '';
    return f.def || '';
  }
  /* The fields that apply to this case, with their values, and which required ones are still empty. */
  const NBE = 'National Bank of Egypt', BM = 'Bank Misr';
  const BANK_NAME = { NBE: NBE, BM: BM };
  /* NBE takes the case on its own; Bank Misr takes a Card service on PF, and sends the day's cases together as a batch. Anything else is not built. */
  function bankOf(c) {
    if (c.type !== 'service') return null;
    if (c.banks.indexOf(NBE) > -1) return 'NBE';
    if (c.banks.indexOf(BM) > -1 && /Card$/.test(c.sid) && c.model === 'PF') return 'BM';
    return null;
  }
  const bn = c => BANK_NAME[bankOf(c)] || NBE;
  function readiness(c) {
    if (!PHASE2 || c.type !== 'service') return null;
    const st = stateFor(c.appId), cs = st && st.cases[c.sid], prepared = (cs && cs.bankPrepared) || null, sentInfo = (cs && cs.bankSent) || null, answer = (cs && cs.bankAnswer) || null;
    const bk = bankOf(c);   // NBE and Bank Misr are built; other banks and services without a bank show a notice
    if (!bk) return { unsupported: true, bank: c.banks.join(', ') || 'No financial institution', groups: [], total: 0, done: 0, missing: [], complete: false, prepared: null };
    const applies = f => (!f.bk || f.bk === bk) && (f.opt || !f.req || f.req(c));     // a conditional field shows only where it applies (POS, Online, companies...)
    const groups = ['merchant', 'service', 'auto'].map(g => ({ key: g, title: GROUP[g][0], note: GROUP[g][1], fields: FIELDS.filter(f => f.g === g && applies(f)).map(f => {
      const required = !f.opt, v = valueOf(c, f);
      return { k: f.k, label: f.l, type: f.t || 'text', options: f.o || null, wide: !!f.wide, value: v, required: required, auto: !!f.calc, editable: !f.calc && !sentInfo, done: !required || String(v).trim() !== '' };
    }) }));
    const req = [].concat.apply([], groups.map(g => g.fields)).filter(f => f.required);
    return { groups: groups, total: req.length, done: req.filter(f => f.done).length, missing: req.filter(f => !f.done).map(f => f.label), complete: req.every(f => f.done), prepared: prepared, sent: sentInfo, answer: answer, waiting: (cs && cs.waiting) || null, bank: BANK_NAME[bk], bankKey: bk };
  }
  /* Slice 4: the forms go to the bank, and the bank answers. Sending is recorded with an optional batch number and reference; the answer is
     Approved (the case is completed), Rejected (it returns to the salesperson with the bank's reason) or Waiting for the merchant (the bank asked
     the merchant for something; the case stays here). */
  function markSent(c, batch, ref) {
    const st = stateFor(c.appId), cs = st && st.cases[c.sid]; if (!cs || !cs.bankPrepared || cs.bankSent || bankOf(c) === 'BM') return false;
    cs.bankSent = { by: C.user().name, at: nowStr(), batch: String(batch || '').trim(), ref: String(ref || '').trim() };
    addLog(st, c.sid, 'marked the ' + c.service + ' case sent to ' + bn(c), 'send', [cs.bankSent.batch && 'Batch ' + cs.bankSent.batch, cs.bankSent.ref && 'Reference ' + cs.bankSent.ref].filter(Boolean).join(' \u00b7 ')); save(st); return true;
  }
  /* Sales is told by email (the portal's notifications are emails; they can be read on emails.html): the salesperson and their manager get an
     "action required" email with what the bank asked for. Returns who was emailed. */
  function notifySales(c, comment) {
    const K = window.KashierRates; if (!K || !K.sendMail) return [];
    const to = ['sales', 'manager'];
    K.sendMail({ to: to, kind: 'action', by: C.user().name, byRole: 'Underwriting', biz: c.merchant.name, appId: c.appId,
      subject: 'Action needed: ' + bn(c) + ' is waiting for ' + c.merchant.name + ' (' + c.caseId + ')',
      lines: ['The ' + c.service + ' case of ' + c.merchant.name + ' (' + c.mid + ') is with ' + bn(c) + ', and the bank is waiting for the merchant.',
        bn(c) + ' asked for: ' + comment, 'Please get this from the merchant and send it to the Underwriting team.', 'Submitted by ' + c.submittedBy + ' \u00b7 ' + c.caseId + ' \u00b7 ' + c.appId] });
    return to.map(r => K.ROLES[r].name + ' (' + K.ROLES[r].label + ')');
  }
  function recordAnswer(c, decision, comment) {
    const st = stateFor(c.appId), cs = st && st.cases[c.sid]; if (!cs || !cs.bankSent) return null;
    comment = String(comment || '').trim();
    if (decision !== 'Approved' && !comment) return null;                      // a rejection and a request to the merchant both need the bank's words
    cs.bankAnswer = { decision: decision, comment: comment, by: C.user().name, at: nowStr() };
    // Waiting for the merchant: Sales is told and sees what the bank asked for; any other answer closes the request.
    if (decision === 'Waiting for the merchant') { cs.waiting = { bank: bn(c), comment: comment, by: C.user().name, at: nowStr(), notified: notifySales(c, comment) }; } else { delete cs.waiting; }
    if (decision === 'Waiting for the merchant') { addLog(st, c.sid, bn(c) + ' is waiting for the merchant', 'clock', comment); save(st); return 'waiting'; }
    addLog(st, c.sid, bn(c) + ' ' + (decision === 'Approved' ? 'approved' : 'rejected') + ' the ' + c.service + ' case', decision === 'Approved' ? 'check' : 'xcircle', comment); save(st);
    if (decision === 'Approved') { move(c, 'Live', { liveSince: new Date(CLOCK).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }, 'completed the ' + c.service + ' case', bn(c) + ' approved it.'); return 'approved'; }
    move(c, 'Rejected', { reject: { source: 'uw', by: 'Underwriting team', role: 'Underwriting', comment: 'Rejected by ' + bn(c) + ': ' + comment, at: nowStr() } }, 'returned the ' + c.service + ' case to the salesperson', 'Rejected by ' + bn(c) + ': ' + comment);
    return 'rejected';
  }

  /* Bank Misr: the cases that are ready go out together, in one set of sheets (bm-export.js). The case in that exporter's shapes, and the batch. */
  function bmInput(c) {
    const s = stateFor(c.appId); if (!s || c.type !== 'service' || bankOf(c) !== 'BM') return null;
    const val = k => { const f = FIELDS.filter(x => x.k === k)[0]; const v = f ? valueOf(c, f) : ''; return v == null ? '' : String(v); };
    const FORM = { LLC: 'Limited liability company (LLC)', 'Joint stock company': 'Joint stock company (JSC)', Partnership: 'General partnership', 'Sole proprietorship': 'Sole proprietorship', Other: 'Other' };
    const saved = { legalName: val('legalName'), legalForm: FORM[val('legalForm')] || val('legalForm'), taxNumber: val('taxNo'), crNumber: val('crNo'), ownerName: val('ownerName'), ownerIdType: val('ownerIdType'),
      ownerId: val('ownerIdNo'), bmLegalId: val('taxNo') || val('crNo') || val('ownerIdNo'), activityAr: val('activityAr'), activity: val('activity'), address1: val('addr1'), address2: val('addr2'), city: val('bmCity'), bmCity: val('bmCity'),
      mcc: val('mcc'), bmDiscountCode: val('bmDiscountCode'), outletName: val('outlet'), outletAddress: val('outletAddr'), outletCity: val('outletCity'), posTid: val('posTid'), posName: val('posName'), pinPadSerial: val('pinPadSerial'), bmHps: val('bmHps') };
    const app = { id: c.appId, biz: s.merchant.name, summary: { email: s.merchant.email, phone: s.merchant.phone, entity: s.entity, serviceConfigs: [{ service: c.sid, configs: [{ bank: BM, module: c.model }] }] } };
    return { c: { app: app, mid: c.mid }, saved: saved };
  }
  const bmReady = () => all().filter(c => bankOf(c) === 'BM' && c.status === 'Bank Submission' && (readiness(c) || {}).prepared && !(readiness(c) || {}).sent);
  function logBatchExport(cases, names) {
    cases.forEach(c => { const st = stateFor(c.appId); if (!st || !st.cases[c.sid]) return; st.cases[c.sid].bankExported = { by: C.user().name, at: nowStr(), files: names }; addLog(st, c.sid, 'exported the Bank Misr batch', 'download', names.join(', ')); save(st); });
    return cases.length;
  }
  function sendBatch(cases, batchNo) {
    let n = 0; const no = String(batchNo || '').trim();
    cases.forEach(c => { const st = stateFor(c.appId), cs = st && st.cases[c.sid]; if (!cs || !cs.bankPrepared || cs.bankSent) return;
      cs.bankSent = { by: C.user().name, at: nowStr(), batch: no, ref: '' }; addLog(st, c.sid, 'sent the ' + c.service + ' case to Bank Misr', 'send', no ? 'Batch ' + no : ''); save(st); n++; });
    return n;
  }

  /* The case in the shapes nbe-export.js fills the bank's own forms from: an application with the one service on NBE, and the data
     Underwriting prepared, under that exporter's field names. */
  function nbeInput(c) {
    const s = stateFor(c.appId); if (!s || c.type !== 'service') return null;
    const val = k => { const f = FIELDS.filter(x => x.k === k)[0]; const v = f ? valueOf(c, f) : ''; return v == null ? '' : String(v); };
    const FORM = { LLC: 'Limited liability company (LLC)', 'Joint stock company': 'Joint stock company (JSC)', Partnership: 'General partnership', 'Sole proprietorship': 'Sole proprietorship', Other: 'Other' };
    const del = val('delName').trim().split(/\s+/).filter(Boolean), pay = (s.payouts || []).filter(p => p.type === 'bank')[0];
    const saved = { legalName: val('legalName'), legalForm: FORM[val('legalForm')] || val('legalForm'), taxNumber: val('taxNo'), crNumber: val('crNo'), ownerName: val('ownerName'), ownerIdType: val('ownerIdType'),
      ownerId: val('ownerIdNo'), ownerNationality: val('ownerNat'), activity: val('activity'), address1: val('addr1'), address2: val('addr2'), governorate: val('gov'), city: val('city'), country: val('country'),
      postalCode: val('postal'), altPhone: val('altPhone'), avgTicket: val('avgTicket'), integrationModel: val('intModel'), integrationType: val('intType'), signatory: val('signatory'), outletName: val('outlet'),
      outletAddress: val('outletAddr'), outletCity: val('outletCity'), delegateFirst: del[0] || '', delegateSurname: del.slice(1).join(' '), delegateIdType: val('delIdNo') ? 'National ID' : '', delegateId: val('delIdNo'),
      delegateNationality: val('delNat'), nbeBranch: val('nbeBranch'), ownerTitle: val('ownerTitle'), mcc: val('mcc'), discountCode: val('discount'), nbeAgCode: val('agCode'), bankAccount: pay ? pay.acct : '' };
    const app = { __uw: true, biz: s.merchant.name, websites: (s.websites || []).filter(Boolean), payout: pay ? { method: 'bank', account: pay.acct } : null,
      summary: { email: s.merchant.email, phone: s.merchant.phone, entity: s.entity, industry: s.industry, serviceConfigs: [{ service: c.sid, configs: [{ bank: NBE, module: c.model }] }] } };
    return { c: { app: app, mid: c.mid }, saved: saved };
  }
  /* What was sent to the bank: kept on the case and in the application's log. */
  function logExport(c, names) {
    const st = stateFor(c.appId); if (!st || !st.cases[c.sid]) return false;
    st.cases[c.sid].bankExported = { by: C.user().name, at: nowStr(), files: names };
    addLog(st, c.sid, 'exported the NBE forms', 'download', names.join(', ')); save(st); return true;
  }
  function exported(c) { const st = stateFor(c.appId); return (st && st.cases[c.sid] && st.cases[c.sid].bankExported) || null; }

  /* "Ready for the bank": allowed only when every required field is complete. Changing a field afterwards reopens it. */
  function markReady(c) {
    const st = stateFor(c.appId), r = readiness(c); if (!st || !r || !r.complete || !st.cases[c.sid]) return false;
    st.cases[c.sid].bankPrepared = { by: C.user().name, at: nowStr(), bank: bn(c) };
    addLog(st, c.sid, 'marked the ' + c.service + ' case ready for the bank', 'check', bn(c) + ': every required field is complete'); save(st); return true;
  }
  function unmarkReady(c) {
    const st = stateFor(c.appId); if (!st || !st.cases[c.sid] || !st.cases[c.sid].bankPrepared || st.cases[c.sid].bankSent) return false;
    delete st.cases[c.sid].bankPrepared; addLog(st, c.sid, 'reopened the bank preparation', 'pencil', ''); save(st); return true;
  }
  function setField(c, k, v) {
    const s = stateFor(c.appId), f = FIELDS.filter(x => x.k === k)[0]; if (!s || !f || f.calc) return false;
    const holder = f.g === 'merchant' ? (s.legal = s.legal || {}) : ((s.cases[c.sid].bank = s.cases[c.sid].bank || {}));
    const old = holder[k] == null ? '' : String(holder[k]), nv = String(v == null ? '' : v).trim();
    if (old === nv) return false;
    holder[k] = nv;
    if (s.cases[c.sid] && s.cases[c.sid].bankPrepared) { delete s.cases[c.sid].bankPrepared; addLog(s, c.sid, 'reopened the bank preparation', 'pencil', 'A field changed after it was marked ready'); }
    addLog(s, c.sid, 'updated ' + f.l.charAt(0).toLowerCase() + f.l.slice(1), 'pencil', (old || 'Not set') + ' → ' + (nv || 'Not set')); save(s); return true;
  }

  /* Each section carries its own decision. Once every section is decided the case settles: all approved moves it on
     (to the bank, or the changes are applied); any rejected section returns the whole case to Sales with the reasons. */
  function settle(id) {
    const c = get(id); if (!c || c.status !== 'Underwriting Review') return null;
    const p = progress(c); if (p.list.some(x => x.state === 'todo')) return null;
    if (p.flagged.length) { reject(c, p.flagged.map(f => f.label + ': ' + f.reason).join('. ')); return 'rejected'; }
    approve(c); return 'approved';
  }

  /* The other cases on the same application, whatever their type (only a link; a case is never reviewed together with another). */
  function related(c) {
    const s = stateFor(c.appId); if (!s) return [];
    const rank = x => x.status === 'Underwriting Review' ? 0 : 1;
    const ids = s.order.filter(id => s.cases[id] && SHOWN.indexOf(s.cases[id].status) > -1)
      .concat((s.kyc || []).filter(k => KYC_SHOWN.indexOf(k.status) > -1).map(k => k.key)).concat((s.updates || []).filter(k => KYC_SHOWN.indexOf(k.status) > -1).map(k => k.key));
    return ids.map(id => get(gid(s, id))).filter(x => x && x.id !== c.id).sort((a, b) => rank(a) - rank(b));
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
    return all().map(c => ({ svcId: c.id, sales: true, kind: c.kind, caseType: c.caseType, summary: (c.type === 'service' ? '' : (c.changes || []).map(x => x.label).join(', ')), isNew: c.isNew, channel: c.channel || '', ustatus: c.ustatus, stage: PHASE2 && c.status === 'Bank Submission' ? 'bank' : 'review',
      prep: PHASE2 && c.type === 'service' && c.status === 'Bank Submission' ? (r => r ? { unsupported: !!r.unsupported, bank: r.bank, done: r.done, total: r.total, complete: r.complete, prepared: !!r.prepared, exported: !!exported(c), bank: r.bank, bankKey: r.bankKey, sent: !!r.sent, waitingMerchant: !!(r.answer && r.answer.decision === 'Waiting for the merchant') } : null)(readiness(c)) : null,
      status: LIST_STATUS[c.status], salesStatus: c.status, no: c.caseId, mid: c.mid, industry: c.industry, assignee: c.assignee, since: c.since, resubmission: '',
      app: { id: c.appId, biz: c.merchant.name, actor: c.submittedBy, summary: { email: c.merchant.email, serviceConfigs: c.type === 'application' ? [] : [{ service: c.service, configs: c.banks.map(b => ({ bank: b })) }] } },
      service: c.service, href: 'sales-case.html?id=' + encodeURIComponent(c.id) }))
      // Bank preparation lists only the cases it can prepare (NBE for now); a case for another bank is not listed until its bank is built.
      .filter(r => !(r.stage === 'bank' && r.prep && r.prep.unsupported));
  }

  return { C: C, STATUS: STATUS, SHOWN: SHOWN, DEMO_URL: DEMO_URL, chip: chip, all: all, get: get, state: state, checks: checks, progress: progress, setReview: setReview,
    addNote: addNote, assign: assign, approve: approve, reject: reject, settle: settle, related: related, goLive: goLive, bankReply: bankReply, setStatus: setStatus, FLOW: FLOW, flowOf: flowOf, transitions: transitions, endNote: endNote, transition: transition, needsComment: needsComment, stateFor: stateFor, saveState: save, toBank: toBank, toConfig: toConfig, activate: activate, ORDER: ORDER, ustatus: ustatus, activity: activity, wait: wait, salesUrl: salesUrl, asCases: asCases, label: label,
    resetDemo: resetDemo, TYPE: TYPE, PHASE2: PHASE2, STEPPER: STEPPER, BANK_RESPONSE: BANK_RESPONSE, markReady: markReady, unmarkReady: unmarkReady, nbeInput: nbeInput, logExport: logExport, exported: exported, markSent: markSent, recordAnswer: recordAnswer, bmInput: bmInput, bmReady: bmReady, logBatchExport: logBatchExport, sendBatch: sendBatch, siblings: siblings, readiness: readiness, setField: setField, settings: settings, saveSettings: saveSettings, FIXED_LABEL: FIXED_LABEL, FIXED_HINT: FIXED_HINT, INDUSTRIES: Object.keys(MCC) };
})();
