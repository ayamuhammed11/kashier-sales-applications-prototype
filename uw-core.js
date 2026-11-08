/* Cases — Underwriting's view of the Sales Applications prototype (sales-applications/).

   The sales application makes every SERVICE its own case (CASE-001 ... with its own status). This module reads those cases
   straight from the sales prototype's saved state ('sa-dir-final' in localStorage; both prototypes are served from the same
   origin, so they share it) and writes Underwriting's decisions back to the same place, so the salesperson sees them
   on the application:
     Underwriting Review  -> Approve for the bank  -> Bank Submission  -> Mark live -> Live
     Underwriting Review  -> Reject                -> Rejected (source 'uw', returned to the salesperson with the comment)
   Only what the sales app does not have — assignee, review checklist, internal notes — lives here, in 'kashierUwCases'. */
window.UW = (function () {
  const C = window.Cases, esc = C.esc;
  const SA_KEY = 'sa-dir-final', STORE = 'kashierUwCases';
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

  /* ── The sales prototype's saved state ── */
  function sa() { try { const s = JSON.parse(localStorage.getItem(SA_KEY) || 'null'); return s && s.appId && s.cases ? s : null; } catch (e) { return null; } }
  function saSave(s) { try { localStorage.setItem(SA_KEY, JSON.stringify(s)); } catch (e) { /* storage unavailable */ } }
  /* A ready-made submitted application, for a first visit: opens the sales prototype with two cases in Underwriting Review. */
  const DEMO_URL = 'sales-applications/application.html?state=ready&kyc=1&as=uw&cases=' + ['Online Card~Underwriting Review@30', 'Online Wallet~Underwriting Review@100', 'POS Card~Underwriting Review@5', 'Online Bank Installments~Rejected:uw'].map(encodeURIComponent).join('|');

  /* ── This module's own store ── */
  function readLocal() { try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { return {}; } }
  function writeLocal(o) { try { localStorage.setItem(STORE, JSON.stringify(o)); } catch (e) { /* storage unavailable */ } }
  const blank = () => ({ assignee: '', review: {}, notes: [] });
  const keyOf = (s, id) => s.appId + '|' + id;
  function local(k) { return Object.assign(blank(), readLocal()[k] || {}); }
  function saveLocal(k, patch) { const all = readLocal(); all[k] = Object.assign(local(k), patch); writeLocal(all); }

  /* Cases rotate between the underwriting agents (round robin) the first time they are seen. */
  function autoAssign(s) {
    const all = readLocal(); let n = all.__rr || 0, changed = false;
    s.order.forEach(id => {
      const c = s.cases[id], k = keyOf(s, id);
      if (!c || c.status !== 'Underwriting Review' || (all[k] && all[k].assignee)) return;
      all[k] = Object.assign(blank(), all[k] || {}, { assignee: C.TEAM[n++ % C.TEAM.length] }); changed = true;
    });
    (s.kyc || []).forEach(x => {
      const k = keyOf(s, x.key);
      if (x.status !== 'Underwriting Review' || (all[k] && all[k].assignee)) return;
      all[k] = Object.assign(blank(), all[k] || {}, { assignee: C.TEAM[n++ % C.TEAM.length] }); changed = true;
    });
    if (changed) { all.__rr = n; writeLocal(all); }
  }
  const canSee = c => !c.assignee || C.user().canReassign || c.assignee === C.user().name;

  function build(s, id) {
    const c = s.cases[id], svc = s.svc[id] || { lines: [] }, k = keyOf(s, id), l = local(k);
    const since = c.since ? Date.parse(c.since) : CLOCK, hours = Math.max(0, (CLOCK - since) / 36e5), sla = SLA[c.status];
    return { type: 'service', key: k, id: id, caseId: c.caseId, status: c.status, appId: s.appId, merchant: s.merchant, entity: s.entity, industry: s.industry,
      service: label(id), channel: chOf(id), model: svc.model || '', svc: svc, banks: [...new Set((svc.lines || []).map(x => x.bank).filter(Boolean))],
      submittedBy: s.submittedBy, submittedAt: s.submittedAt, since: new Date(since).toISOString(), hours: hours, sla: sla,
      late: !!sla && hours > sla, reject: c.reject || null, liveSince: c.liveSince || '', assignee: l.assignee, local: l };
  }
  /* An application case: the merchant's general information (business details, payout methods) changed after submission.
     It is applied to the application only when Underwriting approves it. */
  function buildKyc(s, x) {
    const k = keyOf(s, x.key), l = local(k), since = x.since ? Date.parse(x.since) : CLOCK, hours = Math.max(0, (CLOCK - since) / 36e5), open = x.status === 'Underwriting Review';
    return { type: 'application', key: k, id: x.key, caseId: x.caseId, status: x.status, appId: s.appId, merchant: s.merchant, entity: s.entity, industry: s.industry,
      service: 'Application details', changes: x.changes || [], proposed: x.proposed, banks: [], submittedBy: x.by || s.submittedBy, submittedAt: x.at || s.submittedAt,
      since: new Date(since).toISOString(), hours: hours, sla: open ? SLA['Underwriting Review'] : 0, late: open && hours > SLA['Underwriting Review'],
      reject: x.reject || null, decision: x.decision || null, assignee: l.assignee, local: l };
  }
  function all() {
    const s = sa(); if (!s) return [];
    autoAssign(s);
    return s.order.filter(id => s.cases[id] && SHOWN.indexOf(s.cases[id].status) > -1).map(id => build(s, id))
      .concat((s.kyc || []).filter(x => KYC_SHOWN.indexOf(x.status) > -1).map(x => buildKyc(s, x))).filter(canSee);
  }
  function get(id) {
    const s = sa(); if (!s) return null; autoAssign(s);
    let c = null;
    if (String(id).indexOf('kyc:') === 0) { const x = (s.kyc || []).filter(k => k.key === id)[0]; c = x && KYC_SHOWN.indexOf(x.status) > -1 ? buildKyc(s, x) : null; }
    else c = s.cases[id] && SHOWN.indexOf(s.cases[id].status) > -1 ? build(s, id) : null;
    return c && canSee(c) ? c : null;
  }
  const state = () => sa();

  /* ── Review checklist ── */
  /* What each type of case asks Underwriting to verify.
       Service case: the service's pricing, the documents only that service needs (its channel, the Bank Misr PSP annex) and its PF contract.
       Application case: each requested change to the business details and payout methods. */
  function checks(c) {
    const s = sa(), r = c.local.review, out = [];
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
    if (c.svc.model === 'PF') { const n = nmOf(c.id) + ' - PF Contract'; add('con:' + n, n, 'contracts', { files: [(s.reqContracts || {})[n]] }); }
    // A required document or contract that was never uploaded blocks approval: the case has to go back to Sales.
    out.forEach(x => { if (x.files) { x.files = x.files.filter(Boolean); if (!x.files.length) { x.state = 'flag'; x.missing = true; x.reason = 'Required item was not uploaded'; } } });
    return out;
  }
  function progress(c) {
    const list = checks(c), done = list.filter(x => x.state === 'ok').length;
    return { list: list, done: done, total: list.length, flagged: list.filter(x => x.state === 'flag'), ready: done === list.length };
  }
  function addLog(s, id, text, ic, detail) { s.log.unshift({ t: nowStr(), who: C.user().name, text: text, ic: ic || 'check', detail: detail || '', id: id }); }
  function setReview(c, key, state, reason, lbl) {
    const l = local(c.key);
    if (state === 'todo') delete l.review[key]; else l.review[key] = { state: state, reason: reason || '', by: C.user().name, ts: new Date().toISOString() };
    saveLocal(c.key, { review: l.review });
  }
  function addNote(c, text) { const l = local(c.key); l.notes.unshift({ by: C.user().name, ts: new Date().toISOString(), text: text }); saveLocal(c.key, { notes: l.notes }); }
  function assign(c, name) { saveLocal(c.key, { assignee: name }); }

  /* ── Decisions: written back to the sales prototype's state ── */
  function move(id, status, extra, text, detail) {
    const s = sa(); if (!s || !s.cases[id]) return false;
    Object.assign(s.cases[id], extra || {}, { status: status, since: new Date(CLOCK).toISOString() });
    addLog(s, id, text, status === 'Rejected' ? 'xcircle' : 'check', detail);
    saveSa(s); return true;
  }
  const saveSa = saSave;
  /* Application case: approving applies the requested changes to the application, as the sales prototype does. */
  function kycOf(s, c) { return (s.kyc || []).filter(x => x.key === c.id)[0]; }
  function approveKyc(c) {
    const s = sa(), k = s && kycOf(s, c); if (!k) return false; const P = k.proposed;
    s.merchant.name = P.name; s.merchant.email = P.email; s.merchant.phone = P.phone; s.industry = P.industry; s.owner = P.owner;
    s.websites = P.websites.length ? P.websites.slice() : ['']; s.storeImage = P.storeImage; s.payouts = P.payouts.map(p => Object.assign({}, p)); s.primary = P.primary; s.nextPayout = Math.max(s.nextPayout, P.nextPayout);
    k.status = 'Approved'; k.decision = { by: C.user().name, at: nowStr() }; k.since = new Date(CLOCK).toISOString();
    addLog(s, k.key, 'approved the KYC update', 'check', 'The changes are now on the application'); saveSa(s); return true;
  }
  function rejectKyc(c, comment) {
    const s = sa(), k = s && kycOf(s, c); if (!k) return false;
    k.status = 'Rejected'; k.reject = { source: 'uw', by: C.user().name, role: 'Underwriting', comment: comment, at: nowStr() }; k.since = new Date(CLOCK).toISOString();
    addLog(s, k.key, 'rejected the KYC update', 'xcircle', comment); saveSa(s); return true;
  }
  const approve = c => c.type === 'application' ? approveKyc(c) : move(c.id, 'Bank Submission', {}, 'approved the ' + c.service + ' case and sent it to the bank', 'Underwriting review completed.');
  function reject(c, comment) {
    if (c.type === 'application') return rejectKyc(c, comment);
    return move(c.id, 'Rejected', { reject: { source: 'uw', by: C.user().name, role: 'Underwriting', comment: comment, at: nowStr() } },
      'rejected the ' + c.service + ' case and returned it to the salesperson', comment);
  }
  const goLive = c => move(c.id, 'Live', { liveSince: new Date(CLOCK).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }, 'marked the ' + c.service + ' case live', 'The bank approved and the credentials arrived.');

  /* Each section carries its own decision. Once every section is decided the case settles: all approved moves it on
     (to the bank, or the changes are applied); any rejected section returns the whole case to Sales with the reasons. */
  function settle(id) {
    const c = get(id); if (!c || c.status !== 'Underwriting Review') return null;
    const p = progress(c); if (p.list.some(x => x.state === 'todo')) return null;
    if (p.flagged.length) { reject(c, p.flagged.map(f => f.label + ': ' + f.reason).join('. ')); return 'rejected'; }
    approve(c); return 'approved';
  }

  /* The other type of case open on the same application: a service case is shown with the application's open changes to
     business details / payout methods, and an application case with the application's services still in review. */
  function related(c) {
    const s = sa(); if (!s) return [];
    const rank = x => x.status === 'Underwriting Review' ? 0 : 1;
    const ids = c.type === 'service' ? (s.kyc || []).filter(k => KYC_SHOWN.indexOf(k.status) > -1).map(k => k.key)
      : s.order.filter(id => s.cases[id] && s.cases[id].status === 'Underwriting Review');
    return ids.map(get).filter(Boolean).sort((a, b) => rank(a) - rank(b));
  }

  /* Activity on one case: the sales application's log, filtered to it. */
  function activity(c) { const s = sa(); return (s ? s.log : []).filter(e => e.id === c.id); }
  const wait = h => h < 1 ? 'Under 1h' : h < 24 ? Math.floor(h) + 'h' : Math.floor(h / 24) + 'd ' + Math.floor(h % 24) + 'h';
  const salesUrl = (c) => 'sales-applications/application.html?as=sales';

  /* The Cases list shows these next to the application cases, in the same row shape. */
  const LIST_STATUS = { 'Underwriting Review': 'submitted', 'Bank Submission': 'pending-configurations', Rejected: 'rejected', Live: 'live', Approved: 'approved' };
  function asCases() {
    return all().map(c => ({ svcId: c.id, sales: true, kind: c.type, status: LIST_STATUS[c.status], salesStatus: c.status, no: c.caseId, mid: '', assignee: c.assignee, since: c.since, resubmission: '',
      app: { id: c.appId, biz: c.merchant.name, actor: c.submittedBy, summary: { email: c.merchant.email, serviceConfigs: c.type === 'service' ? [{ service: c.service, configs: c.banks.map(b => ({ bank: b })) }] : [] } },
      service: c.service, href: 'sales-case.html?id=' + encodeURIComponent(c.id) }));
  }

  return { C: C, STATUS: STATUS, SHOWN: SHOWN, DEMO_URL: DEMO_URL, chip: chip, all: all, get: get, state: state, checks: checks, progress: progress, setReview: setReview,
    addNote: addNote, assign: assign, approve: approve, reject: reject, settle: settle, related: related, goLive: goLive, activity: activity, wait: wait, salesUrl: salesUrl, asCases: asCases, label: label };
})();
