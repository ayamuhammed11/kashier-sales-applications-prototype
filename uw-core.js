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
      submittedBy: m.by, submittedAt: m.at, svc: {}, order: [], cases: {}, docs: {}, websites: m.web ? [m.web] : [''], storeImage: m.store || '', reqContracts: {},
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
      app.svc[id] = { model: sv.model, currencies: ['EGP'], lines: [{ bank: sv.bank || '', rates: sv.rates || PRICE[nm] || { selling: rate(sv.sell || 1.1, 1.5) }, custom: !!sv.custom }] };
      app.cases[id] = { status: sv.st, caseId: 'CASE-' + (++c), since: iso(sv.h || 20) };
      if (sv.st === 'Rejected') app.cases[id].reject = { source: 'uw', by: 'Underwriting team', role: 'Underwriting', comment: sv.why, at: '10/19/2026, 02:30:00 PM' };
      if (sv.st === 'Live') app.cases[id].liveSince = '12 Oct 2026';
      if (sv.contract !== false && sv.model === 'PF') app.reqContracts[nm + ' - PF Contract'] = nm.toLowerCase().replace(/\s+/g, '-') + '-pf-contract-signed.pdf';
      app.log.unshift({ t: '10/0' + (1 + (n % 8)) + '/2026, 10:00:00 AM', who: 'System', text: 'moved the ' + label(id) + ' case to Underwriting Review', ic: 'check', id: id });
      app.log.unshift({ t: '09/3' + (n % 2) + '/2026, 05:20:01 PM', who: m.by, text: 'submitted the ' + label(id) + ' case', ic: 'send', detail: app.cases[id].caseId + ' · Underwriting Review', id: id });
    });
    (m.kyc || []).forEach((k, i) => {
      const P = { name: m.name, email: m.email, phone: m.phone, industry: m.industry, owner: '', websites: m.web ? [m.web] : [], storeImage: m.store || '', payouts: app.payouts.map(p => Object.assign({}, p)), primary: 1, nextPayout: 2 };
      const changes = k.changes.map(x => { if (x.set) x.set(P); return { label: x.label, from: x.from, to: x.to }; });
      const key = 'kyc:' + (i + 1);
      app.kyc.push({ n: i + 1, key: key, caseId: 'CASE-' + (++c), status: k.st, changes: changes, proposed: P, by: m.by, role: 'Salesperson', at: '10/19/2026, 10:00:00 AM', since: iso(k.h || 20),
        reject: k.st === 'Rejected' ? { source: 'uw', by: 'Underwriting team', role: 'Underwriting', comment: k.why, at: '10/20/2026, 11:30:00 AM' } : undefined, decision: k.st === 'Approved' ? { by: 'Rana Adel', at: '10/20/2026, 09:10:00 AM' } : undefined });
      app.log.unshift({ t: '10/19/2026, 10:00:00 AM', who: m.by, text: 'sent a KYC update to Underwriting', ic: 'send', detail: changes.map(x => x.label).join(', '), id: key });
    });
    app.nextCase = c + 1;
    return app;
  }
  const bank = (b, f, t) => ({ label: 'Payout method changed', from: 'Bank account · ' + b + ' · Main Branch', to: 'Bank account · ' + t, set: P => { P.payouts[0].bank = f; P.payouts[0].branch = 'Smart Village'; } });
  const DOCS_ON = ['Brand Authorization Letter'], DOCS_POS = ['Store Lease / Location Proof'], DOCS_BM = ['BM PSP Agreement Annex'];
  const DEMO = [
    { name: 'Cairo Fresh Market', industry: 'Retail & E-commerce', email: 'youssef@cairofresh.com', phone: '+20 100 123 4567', by: 'Mostafa Khaled', at: '28 Sept 2026', web: 'www.cairofresh.com', store: 'storefront-cairo.jpg', docs: DOCS_ON.concat(DOCS_POS),
      svc: [{ id: 'Online Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Underwriting Review', h: 30 }, { id: 'Online Wallet', model: 'PF', st: 'Underwriting Review', h: 100, sell: 0.9 }, { id: 'POS Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Bank Submission', h: 40 }] },
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
      kyc: [{ st: 'Underwriting Review', h: 15, changes: [bank('NBE', 'CIB', 'CIB · Smart Village')] }] },
    { name: 'Garden City Florist', industry: 'Retail & E-commerce', email: 'heba@gcflorist.com', phone: '+20 100 612 9090', by: 'Nour Hamdy', at: '22 Sept 2026', web: 'www.gcflorist.com', docs: DOCS_ON,
      svc: [{ id: 'Online Wallet', model: 'PF', st: 'Underwriting Review', h: 140, sell: 0.8 }, { id: 'Online Instapay', model: 'PF', st: 'Underwriting Review', h: 33, sell: 0.5, contract: false }] },
    { name: 'Ismailia Kids Academy', industry: 'Education', email: 'rasha@ismailiakids.edu', phone: '+20 122 777 0101', by: 'Aya Muhammed', at: '05 Oct 2026', web: 'www.ismailiakids.edu', docs: DOCS_ON,
      svc: [{ id: 'Online Card', model: 'PF', bank: 'QNB Alahli', st: 'Bank Submission', h: 90 }],
      kyc: [{ st: 'Approved', h: 50, changes: [{ label: 'Website / social media', from: 'www.ismailiakids.edu', to: 'www.ismailiakids.edu, www.ismailiakids.net', set: P => { P.websites = ['www.ismailiakids.edu', 'www.ismailiakids.net']; } }] }] },
    { name: 'Matrouh Beach Resort', industry: 'Travel & Tourism', email: 'khaled@matrouhresort.com', phone: '+20 100 330 4455', by: 'Karim Zaki', at: '18 Sept 2026', web: 'www.matrouhresort.com', docs: DOCS_ON,
      svc: [{ id: 'Online Souhoola', model: 'PF', st: 'Underwriting Review', h: 20, sell: 3.2 }, { id: 'Online Valu', model: 'PF', st: 'Rejected', h: 110, sell: 2.0, why: 'Commercial Registration does not list the resort as the merchant.' }] },
    { name: 'Aswan Spice Bazaar', industry: 'Food & Beverage', email: 'nadia@aswanspice.com', phone: '+20 111 556 6677', by: 'Mostafa Khaled', at: '12 Oct 2026', web: 'www.aswanspice.com', store: 'aswan-shop.jpg', docs: DOCS_POS,
      svc: [{ id: 'POS Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Underwriting Review', h: 8 }],
      kyc: [{ st: 'Underwriting Review', h: 6, changes: [{ label: 'Contact email', from: 'nadia@aswanspice.com', to: 'accounts@aswanspice.com', set: P => { P.email = 'accounts@aswanspice.com'; } }, { label: 'Contact phone', from: '+20 111 556 6677', to: '+20 111 556 0000', set: P => { P.phone = '+20 111 556 0000'; } }] },
        { st: 'Rejected', h: 70, why: 'Business name does not match the Commercial Registration.', changes: [{ label: 'Business name', from: 'Aswan Spice Bazaar', to: 'Aswan Spices LLC', set: P => { P.name = 'Aswan Spices LLC'; } }] }] },
    { name: 'Luxor Heritage Tours', industry: 'Travel & Tourism', email: 'mostafa@luxortours.com', phone: '+20 100 220 1212', by: 'Nour Hamdy', at: '08 Oct 2026', web: 'www.luxortours.com', docs: DOCS_ON,
      svc: [{ id: 'Online Card', model: 'PF', bank: 'Bank Misr', st: 'Underwriting Review', h: 75 }, { id: 'Online Basata', model: 'PF', st: 'Bank Submission', h: 30, sell: 2.5 }] },
    { name: 'Maadi Home Decor', industry: 'Retail & E-commerce', email: 'rania@maadidecor.com', phone: '+20 122 404 5050', by: 'Aya Muhammed', at: '20 Oct 2026', web: 'www.maadidecor.com', store: 'maadi-store.jpg', docs: DOCS_ON.concat(DOCS_POS),
      svc: [{ id: 'Online Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Underwriting Review', h: 2 }, { id: 'POS Card', model: 'PF', bank: 'National Bank of Egypt', st: 'Underwriting Review', h: 3 }],
      kyc: [{ st: 'Underwriting Review', h: 1, changes: [{ label: 'Industry', from: 'Retail & E-commerce', to: 'Fashion & Beauty', set: P => { P.industry = 'Fashion & Beauty'; } }] }] },
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
      service: label(id), channel: chOf(id), model: svc.model || '', svc: svc, banks: [...new Set((svc.lines || []).map(x => x.bank).filter(Boolean))],
      submittedBy: s.submittedBy, submittedAt: s.submittedAt, since: new Date(since).toISOString(), hours: hours, sla: sla,
      late: !!sla && hours > sla, reject: c.reject || null, liveSince: c.liveSince || '', assignee: l.assignee, local: l };
  }
  /* An application case: the merchant's general information (business details, payout methods) changed after submission.
     It is applied to the application only when Underwriting approves it. */
  function buildKyc(s, x) {
    const k = keyOf(s, x.key), l = local(k), since = x.since ? Date.parse(x.since) : CLOCK, hours = Math.max(0, (CLOCK - since) / 36e5), open = x.status === 'Underwriting Review';
    return { type: 'application', key: k, id: gid(s, x.key), sid: x.key, caseId: x.caseId, status: x.status, appId: s.appId, merchant: s.merchant, entity: s.entity, industry: s.industry,
      service: 'Application details', changes: x.changes || [], proposed: x.proposed, banks: [], submittedBy: x.by || s.submittedBy, submittedAt: x.at || s.submittedAt,
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
      c.changes.forEach((x, i) => add('chg:' + i, x.label, 'changes', { from: x.from, to: x.to }));
      return out;
    }
    const files = d => Object.keys(s.docs[d] || {}).map(f => s.docs[d][f]).filter(Boolean).join(', ');
    add('pricing', 'Services & pricing', 'pricing');
    if (c.channel === 'Online') { add('doc:Brand Authorization Letter', 'Brand Authorization Letter', 'documents', { files: [files('Brand Authorization Letter')] }); add('web', 'Website or social media link', 'documents', { files: [(s.websites || []).filter(Boolean).join(', ')] }); }
    if (c.channel === 'POS') { add('doc:Store Lease / Location Proof', 'Store Lease / Location Proof', 'documents', { files: [files('Store Lease / Location Proof')] }); add('store', 'Store image', 'documents', { files: [s.storeImage] }); }
    if (c.svc.model === 'PSP' && (c.svc.lines || []).some(l => l.bank === 'Bank Misr')) add('doc:BM PSP Agreement Annex', 'BM PSP Agreement Annex', 'documents', { files: [files('BM PSP Agreement Annex')] });
    if (c.svc.model === 'PF') { const n = nmOf(c.sid) + ' - PF Contract'; add('con:' + n, n, 'contracts', { files: [(s.reqContracts || {})[n]] }); }
    // A required document or contract that was never uploaded blocks approval: the case has to go back to Sales.
    out.forEach(x => { if (x.files) { x.files = x.files.filter(Boolean); if (!x.files.length) { x.state = 'flag'; x.missing = true; x.reason = 'Required item was not uploaded'; } } });
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
    s.merchant.name = P.name; s.merchant.email = P.email; s.merchant.phone = P.phone; s.industry = P.industry; s.owner = P.owner;
    s.websites = P.websites.length ? P.websites.slice() : ['']; s.storeImage = P.storeImage; s.payouts = P.payouts.map(p => Object.assign({}, p)); s.primary = P.primary; s.nextPayout = Math.max(s.nextPayout, P.nextPayout);
    k.status = 'Approved'; k.decision = { by: C.user().name, at: nowStr() }; k.since = new Date(CLOCK).toISOString();
    addLog(s, k.key, 'approved the KYC update', 'check', 'The changes are now on the application'); save(s); return true;
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

  /* Each section carries its own decision. Once every section is decided the case settles: all approved moves it on
     (to the bank, or the changes are applied); any rejected section returns the whole case to Sales with the reasons. */
  function settle(id) {
    const c = get(id); if (!c || c.status !== 'Underwriting Review') return null;
    const p = progress(c); if (p.list.some(x => x.state === 'todo')) return null;
    if (p.flagged.length) { reject(c, p.flagged.map(f => f.label + ': ' + f.reason).join('. ')); return 'rejected'; }
    approve(c); return 'approved';
  }

  /* The other type of case on the same application: a service case is shown with the application's changes to
     business details / payout methods, and an application case with the application's services still in review. */
  function related(c) {
    const s = stateFor(c.appId); if (!s) return [];
    const rank = x => x.status === 'Underwriting Review' ? 0 : 1;
    const ids = c.type === 'service' ? (s.kyc || []).filter(k => KYC_SHOWN.indexOf(k.status) > -1).map(k => k.key)
      : s.order.filter(id => s.cases[id] && s.cases[id].status === 'Underwriting Review');
    return ids.map(id => get(gid(s, id))).filter(Boolean).sort((a, b) => rank(a) - rank(b));
  }

  /* Activity on one case: the application's log, filtered to it. */
  function activity(c) { const s = stateFor(c.appId); return (s ? s.log : []).filter(e => e.id === c.sid); }
  const wait = h => h < 1 ? 'Under 1h' : h < 24 ? Math.floor(h) + 'h' : Math.floor(h / 24) + 'd ' + Math.floor(h % 24) + 'h';
  const salesUrl = () => 'sales-applications/application.html?as=sales';

  /* The Cases list shows these next to the application cases, in the same row shape. */
  const LIST_STATUS = { 'Underwriting Review': 'submitted', 'Bank Submission': 'pending-configurations', Rejected: 'rejected', Live: 'live', Approved: 'approved' };
  function asCases() {
    return all().map(c => ({ svcId: c.id, sales: true, kind: c.type, status: LIST_STATUS[c.status], salesStatus: c.status, no: c.caseId, mid: '', assignee: c.assignee, since: c.since, resubmission: '',
      app: { id: c.appId, biz: c.merchant.name, actor: c.submittedBy, summary: { email: c.merchant.email, serviceConfigs: c.type === 'service' ? [{ service: c.service, configs: c.banks.map(b => ({ bank: b })) }] : [] } },
      service: c.service, href: 'sales-case.html?id=' + encodeURIComponent(c.id) }));
  }

  return { C: C, STATUS: STATUS, SHOWN: SHOWN, DEMO_URL: DEMO_URL, chip: chip, all: all, get: get, state: state, checks: checks, progress: progress, setReview: setReview,
    addNote: addNote, assign: assign, approve: approve, reject: reject, settle: settle, related: related, goLive: goLive, activity: activity, wait: wait, salesUrl: salesUrl, asCases: asCases, label: label,
    resetDemo: resetDemo };
})();
