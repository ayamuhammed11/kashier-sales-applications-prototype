/* The case view: everything about one case (info, items to review, bank preparation, notes, logs, the status dropdown), shared by the case page
   and the Case drawer on the Cases list. mount(host, id, { embedded, onChange, onLeave }) draws it into any element. */
window.CaseView = (function () {
  const { icon, esc } = SA, C = Cases, U = UW;
  let id = null, host = null, opts = {};
  let me = C.user();
  const sc = st => { const m = U.STATUS[st]; return `<span class="sc ${m ? m.sc : 'neu'}">${esc(m ? m.label : st)}</span>`; };
  const tierName = k => k === 'local' ? 'Local rates' : k.indexOf('intl-') === 0 ? 'International · ' + k.slice(5) : k.replace(/-/g, ' ');
  const dl = rows => `<dl class="dl">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v && v.html ? v.html : v == null || v === '' ? '—' : esc(v)}</dd>`).join('')}</dl>`;
  const links = list => list && list.length ? { html: list.map(u => `<a class="linkb" href="${esc(/^https?:\/\//i.test(u) ? u : 'https://' + u)}" target="_blank" rel="noopener noreferrer">${esc(u)}</a>`).join(', ') } : '';
  const profile = () => `<button type="button" class="profile" aria-label="Account: ${esc(me.name)}"><span class="pav">${esc(me.initials)}</span><span class="pdata"><span class="pname">${esc(me.name)}</span><span class="pmail">${esc(me.label)}</span></span>${icon('chevron', 'ic-16')}</button>`;
  /* The application this case belongs to, opened in the sales app for the same business and service. */
  const appHref = c => 'sales-applications/application.html?state=ready&mid=' + encodeURIComponent(c.mid) + (c.type === 'service' ? '&cases=' + encodeURIComponent(String(c.id).split('::').pop() + '~' + c.status) : '') + '&as=sales';
  const crumb = last => `<nav class="crumb" aria-label="Breadcrumb"><a href="cases.html">Cases</a><svg class="ic-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${AGENT_ICONS['chevron-right']}</svg><span aria-current="page">${esc(last)}</span></nav>`;
  /* After the bank's answer the case leaves this view: the page goes back to the list, the drawer closes and refreshes the list. */
  const go = msg => { if (opts.onLeave) { opts.onLeave(msg); return; } location.href = 'cases.html'; try { sessionStorage.setItem('cases-toast', msg); } catch (e) { /* storage unavailable */ } };
  /* What the signed-in user may do with a case. Same rule as the list: a manager acts on every case, an agent only on the cases assigned to them. */
  const canAct = c => me.canReassign || c.assignee === me.name;

  /* The service as the application records it, then every rate type: what was requested, what is published, and its approval. */
  function mirror(c) { const S = SA.S; S.svc = S.svc || {}; S.svc[c.serviceId || c.sid] = Object.assign({ ops: [], notes: '', currencies: ['EGP'] }, c.svc); S.entity = c.entity; S.industry = c.industry; S.activities = [c.industry]; S.owner = ''; }
  function pricingDetail(c) {
    mirror(c);
    const sid = c.serviceId || c.sid, svc = SA.S.svc[sid], nm = sid.slice(sid.indexOf(' ') + 1), banks = [...new Set((svc.lines || []).map(l => l.bank).filter(Boolean))];
    const cur = svc.model === 'PF' ? ['EGP'] : (svc.currencies || ['EGP']);
    const rows = [['Service', nm + (SA.SVC_HINT[nm] ? ' · ' + SA.SVC_HINT[nm] : '')], ['Channel', c.channel], ['Model', svc.model + ' - ' + c.channel]];
    if (SA.needsBank(sid)) rows.push(['Financial institution', banks.length ? banks.join(', ') : 'Not chosen']);
    if (c.channel === 'POS') rows.push(['POS terminals', c.terminals || 'Not set']);
    if (SA.isCard(sid)) rows.push(['Currencies and operations', cur.join(', ') + ' · ' + (svc.ops.length ? svc.ops.join(', ') : 'No advanced operations')]);
    if (svc.notes && svc.notes.trim()) rows.push(['Notes', svc.notes]);
    if (c.submitComment) rows.push(['Submit comment', c.submitComment]);
    const body = (svc.lines || []).map(l => SA.tiersFor(sid, l).map(t => {
      const sel = l.rates[t.key] || {}, v = SA.verdict(sid, l, t), has = sel.rate !== undefined && sel.rate !== '';
      const appr = !has ? '<span class="f">Not entered</span>' : v.tier === 'auto' ? '<span class="f">No approval needed</span>' : `<span class="sc ok">Approved</span> <span class="f">${v.tier === 'head' ? 'Head of Sales' : 'Sales Manager'}</span>`;
      return `<tr><td>${l.bank ? `<div class="f">${esc(l.bank)}</div>` : ''}${esc(t.label)}</td><td class="num"><b>${has ? esc(SA.rateText(sel)) : '\u2014'}</b></td><td class="num">${esc(SA.pubText(v.p))}</td><td>${appr}</td></tr>`;
    }).join('')).join('');
    return `<dl class="dl">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
      <div class="rscroll" style="display:block"><table class="rtbl ro-svc"><thead><tr><th>Rate type</th><th>Requested</th><th>Published</th><th>Approval</th></tr></thead><tbody>${body}</tbody></table></div>`;
  }
  function rates(c) {
    const lines = c.svc.lines || [];
    if (!lines.length) return '<span class="f">No rates were entered for this service.</span>';
    return lines.map(l => `<div><b>${esc(l.bank || 'No bank')}</b> <span class="f">${esc(c.model)} · ${esc(c.channel)}</span>${Object.keys(l.rates || {}).map(k => `<div class="rate"><span>${esc(tierName(k))}</span><b>${esc(l.rates[k].rate)}% + ${esc(l.rates[k].fee)} EGP</b></div>`).join('')}</div>`).join('');
  }
  /* The decision sits with the item it belongs to. */
  function decision(x, c) {
    const open = c.status === 'Underwriting Review', d = `data-case="${esc(c.id)}"`;
    return x.missing ? '<span class="sc bad">Missing</span>' : '';
  }
  /* A payout method is written as "Bank account · bank · branch · holder · account" or "E-wallet · provider · mobile · holder" (optionally "name: " first). Shown in full, field by field. */
  function parsePay(s) {
    if (!s || s === 'None') return null;
    let name = ''; const m = String(s).match(/^(.*?): (Bank account|E-wallet) · /);
    if (m) { name = m[1]; s = s.slice(m[1].length + 2); }
    const p = String(s).split(' · '), o = {};
    if (name) o['Name'] = name;
    if (p[0] === 'Bank account') { o['Type'] = 'Bank account'; o['Bank name'] = p[1]; o['Branch'] = p[2]; o['Account holder'] = p[3]; o['Account number'] = p[4]; }
    else { o['Type'] = 'E-wallet'; o['Provider'] = p[1]; o['Mobile number'] = p[2]; o['Account holder'] = p[3]; }
    return o;
  }
  const isPay = l => /^(Payout method|Primary payout)/.test(l);
  /* Old and new side by side. Fields that changed are bold on the new side. */
  /* A new application has nothing earlier to compare with: just what was submitted, a payout method in full. */
  function submitted(x) {
    const o = isPay(x.label) ? parsePay(x.to) : null;
    return `<div class="cmp one"><div class="cc new"><span class="k">Submitted</span>${o ? `<dl>${Object.keys(o).map(k => `<dt>${esc(k)}</dt><dd>${esc(o[k] == null ? '\u2014' : o[k])}</dd>`).join('')}</dl>` : `<span>${esc(x.to)}</span>`}</div></div>`;
  }
  function compare(x) {
    if (x.isNew) return submitted(x);
    const a = isPay(x.label) ? parsePay(x.from) : null, b = isPay(x.label) ? parsePay(x.to) : null;
    const side = (cls, title, obj, raw, other) => `<div class="cc ${cls}"><span class="k">${title}</span>${isPay(x.label) ? (obj ? `<dl>${Object.keys(obj).map(k => `<dt>${esc(k)}</dt><dd class="${cls === 'new' && (!other || other[k] !== obj[k]) ? 'chg' : ''}">${esc(obj[k] == null ? '—' : obj[k])}</dd>`).join('')}</dl>` : '<span class="none">None</span>') : `<span class="${cls === 'new' ? '' : 'none'}" style="${cls === 'new' ? 'font-weight:700' : ''}">${esc(raw)}</span>`}</div>`;
    return `<div class="cmp">${side('old', 'Current', a, x.from, null)}${side('new', 'Requested', b, x.to, a)}</div>`;
  }
  const platform = u => { const h = String(u).toLowerCase(); return /facebook|fb\.com/.test(h) ? 'Facebook' : /instagram/.test(h) ? 'Instagram' : /(^|[./])x\.com|twitter/.test(h) ? 'X' : /linkedin/.test(h) ? 'LinkedIn' : /tiktok/.test(h) ? 'TikTok' : /youtube|youtu\.be/.test(h) ? 'YouTube' : 'Website'; };
  function row(x, c) {
    if (x.key === 'pricing') {
      return `<div class="row chg"><div class="ch"><span class="n">${esc(x.label)}</span><div class="a">${decision(x, c)}</div></div>${pricingDetail(c)}${x.state === 'flag' ? `<span class="f bad">${esc(x.reason)}</span>` : ''}</div>`;
    }
    if (x.links && x.links.length) {
      return `<div class="row web"><div class="wn"><span class="n">${esc(x.label)}</span></div><div class="a">${decision(x, c)}</div>${x.links.map(u => `<div class="wu"><span class="tag">${platform(u)}</span><span class="fnm">${esc(u)}</span></div><div class="wo"><a class="btn btn-outline btn-sm lnk" href="${esc(/^https?:\/\//i.test(u) ? u : 'https://' + u)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(u)} in a new tab">Open${icon('ext', 'ic')}</a></div>`).join('')}${x.state === 'flag' ? `<span class="f bad wfull">${esc(x.reason)}</span>` : ''}</div>`;
    }
    if (x.list && x.list.length) {
      // Files: View and Download sit in the right-hand column, right under Reject / Approve.
      return `<div class="row web"><div class="wn"><span class="n">${esc(x.label)}</span></div><div class="a">${decision(x, c)}</div>${x.list.map(f => `<div class="wu"><span class="fnm">${esc(f)}</span></div><div class="wo"><button class="btn btn-outline btn-sm" type="button" data-view="${esc(f)}" data-l="${esc(x.label)}">${icon('eye', 'ic')}View</button><button class="btn btn-outline btn-sm" type="button" data-dl="${esc(f)}">${icon('download', 'ic')}Download</button></div>`).join('')}${x.state === 'flag' ? `<span class="f bad wfull">${esc(x.reason)}</span>` : ''}</div>`;
    }
    if (x.from != null || x.isNew) {
      return `<div class="row chg"><div class="ch"><span class="n">${esc(x.label)}</span><div class="a">${decision(x, c)}</div></div>${compare(x)}${x.state === 'flag' ? `<span class="f bad">${esc(x.reason)}</span>` : ''}</div>`;
    }
    const detail = x.from != null ? `${esc(x.from)} &rarr; <b>${esc(x.to)}</b>` : x.key === 'pricing' ? pricingDetail(c) : x.files && x.files.length ? esc(x.files.join(' · ')) : '';
    const fl = (x.list || []).map(f => `<div class="fitem"><span class="fnm">${esc(f)}</span><button class="btn btn-outline btn-sm" type="button" data-view="${esc(f)}" data-l="${esc(x.label)}">${icon('eye', 'ic')}View</button><button class="btn btn-outline btn-sm" type="button" data-dl="${esc(f)}">${icon('download', 'ic')}Download</button></div>`).join('');
    const ll = (x.links || []).map(u => `<div class="fitem"><span class="tag">${platform(u)}</span><span class="fnm">${esc(u)}</span><a class="btn btn-outline btn-sm" href="${esc(/^https?:\/\//i.test(u) ? u : 'https://' + u)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(u)} in a new tab">${icon('ext', 'ic')}Open link</a></div>`).join('');
    return `<div class="row"><div class="i"><span class="n">${esc(x.label)}</span>${fl || ll ? `<div class="files">${fl}${ll}</div>` : detail ? `<span class="f">${detail}</span>` : ''}${x.state === 'flag' ? `<span class="f bad">${esc(x.reason)}</span>` : ''}</div><div class="a">${decision(x, c)}</div></div>`;
  }
  const nFiles = p => p.list.reduce((n, x) => n + (x.list ? x.list.length : 0), 0);
  /* The status of the case is one dropdown. Any status can be set at any time, forwards or backwards. */
  // The status button and its workflow menu are shared with the application's case drawer (SA.statusBtn / SA.statusMenu).
  function statusSel(c) { return SA.statusBtn(c, !canAct(c)); }
  /* Every action a user may take on the case sits in one place, at the end of the case header. The host adds its own role's actions
     (opts.actions, e.g. Sales: Cancel case, Review and resubmit); Underwriting adds Approve and Reject on a change request in review. */
  function actionBar(c, ro, sales) {
    const d = ro ? 'disabled' : '';
    const uw = !sales && c.ustatus === 'Underwriting Review'
      ? `<button type="button" class="btn btn-outline-danger" data-reject-case="${esc(c.id)}" ${d}>Reject</button><button type="button" class="btn btn-primary" data-approve-case="${esc(c.id)}" ${d}>Approve</button>` : '';
    const html = (opts.actions ? opts.actions(c) : '') + uw;
    return html ? `<div class="decide">${html}</div>` : '';
  }
  /* One block per case: the title, its status, and the items to decide. */
  function part(c, nested) {
    const p = U.progress(c), open = c.status === 'Underwriting Review', app = c.type !== 'service';
    const by = c.reject && c.reject.by ? esc(c.reject.by) : '', why = c.reject ? esc(c.reject.comment || '') : '', us = c.ustatus;
    const note = us === 'Pending Sales Action' ? (c.reject && c.reject.from === 'bank' ? `<div class="info bad"><b>${by || 'The bank'} needs more from the merchant.</b> ${why} The case is returned to Sales, who fix it on the application and resubmit.</div>` : `<div class="info bad"><b>Rejected${by ? ' by ' + by : ''}.</b> ${why} The case is returned to Sales, who fix it on the application and resubmit.</div>`)
      : us === 'Rejected by Bank' ? `<div class="info bad"><b>Merchant not qualified:</b> ${why}</div>`
      : us === 'UW Approved' ? `<div class="info ok"><b>Approved${c.decision ? ' by ' + esc(c.decision.by) : ''}.</b> The changes are now on the ${c.type === 'update' ? 'service' : 'application'}.</div>`
      : us === 'Sent to Bank' ? '<div class="info ok"><b>Approved by Underwriting and sent to the bank.</b> Change the status when the bank answers.</div>'
      : us === 'Pending Onboarding Configurations' ? '<div class="info ok"><b>The bank approved this case. The merchant is being configured.</b> Set the status to Active when the configurations are done.</div>'
      : us === 'Active' ? `<div class="info ok"><b>Active${c.liveSince ? ' since ' + esc(c.liveSince) : ''}.</b> The service is live for the merchant.</div>` : '';
    if (nested) {
      const what = c.changes.map(x => x.label).join(', ');
      return `<div class="sub" data-part="${esc(c.id)}"><div class="ptitle"><h3>${esc(what)}</h3>${sc(c.ustatus)}<span style="font-size:13px;color:var(--cadet-base)">${esc(c.caseId)}</span></div>${note}<div>${p.list.map(x => row(x, c)).join('')}</div></div>`;
    }
    const left = p.list.filter(x => x.state === 'todo').length, nOk = p.list.filter(x => x.state === 'ok').length, nBad = p.list.filter(x => x.state === 'flag').length;
    const submitBar = '';
    return `<section class="card sec" data-part="${esc(c.id)}"><div class="sec-h"><div class="ptitle"><h2>${app ? esc(c.caseType) : esc(c.service)}</h2><span style="font-size:13px;color:var(--cadet-base)">${esc(c.caseId)}</span></div>
      </div>
      ${app ? `<p style="margin:0;color:var(--cadet-base)">${esc(c.type === 'update' ? 'Changes to a service that is already active. Nothing changes until every item is approved.' : c.kind === 'payout' ? (c.isNew ? 'The payout method, submitted for the first time. There are no earlier values to compare with.' : 'A change to the payout method, with the current and the requested account side by side. Nothing is applied until every item is approved.') : (c.isNew ? 'The business details, submitted for the first time. There are no earlier values to compare with. Check them against the documents.' : 'A change to the business details (KYB/KYC). Nothing is applied until every item is approved. Check it against the supporting documents.'))}</p>` : ''}
      ${note}<div>${app ? p.list.map(x => row(x, c)).join('') : [['pricing', 'Services & pricing'], ['website', 'Website or social media'], ['documents', 'Documents'], ['contracts', 'Contract']].map(([t, h]) => { const xs = p.list.filter(x => x.tab === t); const n = xs.reduce((k, x) => k + (x.list ? x.list.length : 0), 0); return xs.length ? `<div class="sgrp"><div class="gh"><h3>${h}${xs.reduce((k, x) => k + (x.links ? x.links.length : 0), 0) > 1 ? ' \u00b7 ' + xs.reduce((k, x) => k + (x.links ? x.links.length : 0), 0) + ' links' : ''}</h3>${n ? `<button class="btn btn-outline btn-sm" type="button" data-dlall="${esc(c.id)}" data-sec="${t}">${icon('download', 'ic')}Download all (${n})</button>` : ''}</div>${xs.map(x => row(x, c)).join('')}</div>` : ''; }).join('')}</div>${submitBar}</section>`;
  }
  /* Bank preparation for NBE, as three steps: fill in what is missing, mark the case ready, download the forms. Only the missing fields are shown
     first; what is already filled in is folded away. */
  function readinessCard(c) {
    const r = U.readiness(c); if (!r) return '';
    if (r.unsupported) return `<section class="card sec"><div class="sec-h"><div class="tt"><h2>Bank preparation</h2></div></div><p style="margin:0;color:var(--cadet-base)">Preparing the data for ${esc(r.bank)} is not built yet.</p></section>`;
    const all = [].concat.apply([], r.groups.map(g => g.fields.map(f => Object.assign({ grp: g.key }, f))));
    const typed = all.filter(f => !f.auto), auto = all.filter(f => f.auto);
    const missing = typed.filter(f => f.required && !f.done), filled = typed.filter(f => !(f.required && !f.done)), autoMissing = auto.filter(f => f.required && !f.done);
    const WHO = { merchant: 'Merchant', service: 'This service' };
    const input = f => {
      const id = 'bf-' + f.k, cls = 'inp' + (f.required && !f.done ? ' bad' : '');
      const ctl = !f.editable ? `<div class="bv">${f.value ? esc(f.value) : '<span style="color:var(--cadet-base)">Not set</span>'}</div>`
        : f.type === 'select' ? `<select class="sel" id="${id}" data-bf="${f.k}"><option value="">Select</option>${f.options.map(o => `<option ${o === f.value ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`
        : `<input class="${cls}" id="${id}" data-bf="${f.k}" value="${esc(f.value)}">`;
      return `<div class="fld${f.wide ? ' wide' : ''}"><label for="${id}">${esc(f.label)}${f.required ? '' : ' <span class="opt">(optional)</span>'}${f.auto ? ' <span class="tag">Auto</span>' : f.grp ? ` <span class="tag">${WHO[f.grp] || ''}</span>` : ''}</label>${ctl}</div>`;
    };
    const exp = !!U.exported(c), done1 = !missing.length && !autoMissing.length, done2 = !!r.prepared, done3 = !!r.sent, waitM = !!(r.answer && r.answer.decision === 'Waiting for the merchant');
    const step = (n, title, state, hint) => `<li class="${state}"><span class="d">${state === 'done' ? icon('check', 'ic-14') : n}</span><div><b>${title}</b><span class="s">${hint}</span></div></li>`;
    const left = missing.length + autoMissing.length;
    const steps = `<ol class="steps">${step(1, 'Fill in what is missing', done1 ? 'done' : 'now', done1 ? 'Nothing is missing.' : left + ' field' + (left === 1 ? '' : 's') + ' to fill in below.')}
      ${step(2, 'Mark the case ready for the bank', done2 ? 'done' : done1 ? 'now' : 'later', done2 ? 'Marked ready.' : done1 ? 'Press the button at the bottom.' : 'Available once nothing is missing.')}
      ${step(3, r.bankKey === 'BM' ? 'Send it in the Bank Misr batch' : 'Download the NBE forms and send them to the bank', done3 ? 'done' : done2 ? 'now' : 'later', done3 ? 'Sent to the bank.' : done2 ? (r.bankKey === 'BM' ? 'Open the Bank Misr batch below and send it with the other ready cases.' : 'Download the forms below, send them to NBE, then press "Mark as sent".') : 'Available once the case is ready.')}
      ${step(4, 'Record the bank\'s answer', done3 ? 'now' : 'later', waitM ? 'The bank is waiting for the merchant.' : done3 ? 'Choose what ' + r.bank + ' answered.' : 'Available once the case is sent.')}</ol>`;
    const rest = filled.concat(auto.filter(f => !(f.required && !f.done)));
    const action = r.prepared ? `<span style="font-size:13px;color:var(--cadet-base)">Marked ready by ${esc(r.prepared.by)} on ${esc(r.prepared.at)}</span>${r.sent ? '' : `<button class="btn btn-outline btn-sm" type="button" data-unready="${esc(c.id)}">Reopen</button>`}`
      : `<button class="btn btn-primary" type="button" data-ready="${esc(c.id)}" ${r.complete ? '' : 'disabled'}>Mark ready for the bank</button>`;
    return `<section class="card sec"><div class="sec-h"><div class="tt"><h2>Prepare this case for the bank (${esc(r.bank)})</h2><p>${esc(r.bank)} needs some details about the business. Follow the four steps.</p></div></div>${steps}
      ${missing.length ? `<div class="rg"><h3>Fill in what is missing (${missing.length})</h3><p>These were not in the sales application. Type them here.</p><div class="fgrid">${missing.map(input).join('')}</div></div>` : ''}
      ${autoMissing.length ? `<div class="info bad"><b>Not set in Bank settings:</b> ${esc(autoMissing.map(f => f.label).join(', '))}. <a class="linkb" href="bank-settings.html">Open Bank settings</a></div>` : ''}
      ${rest.length ? `<details class="rg"><summary>Already filled in (${rest.length})</summary><div class="fgrid" style="margin-block-start:12px">${rest.map(input).join('')}</div></details>` : ''}
      <div class="bar">${action}</div></section>`;
  }
  /* The bank's own forms, filled from the case. Available once the case is ready for the bank; the forms themselves (and Kashier's fixed values)
     are kept out of the public prototype, so there the export is hidden instead of failing. */
  function formsCard(c) {
    const r = U.readiness(c); if (!r || r.unsupported || !r.prepared || r.bankKey !== 'NBE') return '';
    if (!window.NBEExport || !NBEExport.available()) return `<section class="card sec"><div class="sec-h"><div class="tt"><h2>NBE forms</h2></div></div><p style="margin:0;color:var(--cadet-base)">The bank's forms are not available on this site. They are kept out of the public prototype.</p></section>`;
    const inp = U.nbeInput(c), packs = inp ? NBEExport.review(inp.c, inp.saved) : [];
    if (!packs.length) return `<section class="card sec"><div class="sec-h"><div class="tt"><h2>NBE forms</h2></div></div><p style="margin:0;color:var(--cadet-base)">The NBE forms cover a Card service on PF. This service has none.</p></section>`;
    const files = [].concat.apply([], packs.map(p => p.files.map(f => Object.assign({ pack: p }, f))));
    const last = U.exported(c);
    return `<section class="card sec"><div class="sec-h"><div class="tt"><h2>NBE forms</h2><p>The bank's own forms, filled from this case. Download them to send to the bank.</p></div><button class="btn btn-primary btn-sm" type="button" data-nbeall="${esc(c.id)}">${icon('download', 'ic')}Download all (${files.length})</button></div>
      <div>${files.map(f => `<div class="row"><div class="i"><span class="n">${esc(f.name)}</span><span class="f">${esc(f.pack.title)} · ${f.filled} of ${f.rows.length} fields filled${f.missing.length ? '' : ''}</span>${f.missing.length ? `<span class="f bad">Missing: ${esc(f.missing.map(m => m.label).join(', '))}</span>` : ''}</div><div class="a"><button class="btn btn-outline btn-sm" type="button" data-nbe="${esc(f.id)}" data-case="${esc(c.id)}">${icon('download', 'ic')}Download</button></div></div>`).join('')}</div>
      ${last ? `<p style="margin:0;font-size:13px;color:var(--cadet-base)">Last exported by ${esc(last.by)} on ${esc(last.at)}: ${esc(last.files.join(', '))}</p>` : ''}</section>`;
  }
  /* Steps 3 and 4: the case was sent to NBE, and NBE answers. Approved completes the case; rejected returns it to Sales with the bank's reason;
     waiting for the merchant keeps it here with what the bank asked for. */
  function answerCard(c) {
    const r = U.readiness(c); if (!r || r.unsupported || !r.prepared || !U.BANK_RESPONSE) return '';
    if (!r.sent && r.bankKey === 'BM') return `<section class="card sec"><div class="sec-h"><div class="tt"><h2>Bank Misr batch</h2><p>Bank Misr takes the day's ready cases together, in one set of its sheets. This case goes out in the next batch.</p></div><button class="btn btn-primary" type="button" data-bmbatch>Open the Bank Misr batch (${U.bmReady().length})</button></div></section>`;
    if (!r.sent) return `<section class="card sec"><div class="sec-h"><div class="tt"><h2>Send to the bank</h2><p>Send the downloaded forms to ${esc(r.bank)}, then press "Mark as sent". The batch number and reference are optional.</p></div></div>
      <div class="fgrid"><div class="fld"><label for="sentBatch">Bank batch number <span class="opt">(optional)</span></label><input class="inp" id="sentBatch"></div><div class="fld"><label for="sentRef">Bank reference <span class="opt">(optional)</span></label><input class="inp" id="sentRef"></div></div>
      <div class="bar"><span></span><button class="btn btn-primary" type="button" data-sent="${esc(c.id)}">Mark as sent to the bank</button></div></section>`;
    const a = r.answer;
    return `<section class="card sec"><div class="sec-h"><div class="tt"><h2>The bank's answer</h2><p>Sent to ${esc(r.bank)} by ${esc(r.sent.by)} on ${esc(r.sent.at)}${r.sent.batch ? ' · batch ' + esc(r.sent.batch) : ''}${r.sent.ref ? ' · reference ' + esc(r.sent.ref) : ''}.</p></div></div>
      ${a ? `<div class="info"><b>${esc(a.decision)}</b>${a.comment ? ': ' + esc(a.comment) : ''}<br><span style="font-size:13px;color:var(--cadet-base)">Recorded by ${esc(a.by)} on ${esc(a.at)}</span></div>${r.waiting && r.waiting.notified && r.waiting.notified.length ? `<div class="info" style="margin-block-start:8px"><b>Sales was notified by email</b> on ${esc(r.waiting.at)}: ${esc(r.waiting.notified.join(', '))}. <a class="linkb" href="emails.html">Read the email</a></div>` : ''}` : '<p style="margin:0;color:var(--cadet-base)">No answer yet. Record it here when NBE replies.</p>'}
      <div class="fgrid"><div class="fld"><label for="ansSel">What did ${esc(r.bank)} answer?</label><select class="sel" id="ansSel"><option value="">Choose</option><option>Approved</option><option>Rejected</option><option>Waiting for the merchant</option></select></div>
        <div class="fld wide"><label for="ansComment">Bank's comment <span class="opt" id="ansHint">(needed for Rejected and Waiting for the merchant)</span></label><textarea class="inp" id="ansComment" rows="2" placeholder="What did the bank say?"></textarea></div></div>
      <div class="bar"><span style="font-size:13px;color:var(--cadet-base)">Approved completes the case. Rejected returns it to Sales.</span><button class="btn btn-primary" type="button" data-answer="${esc(c.id)}">Save the bank's answer</button></div></section>`;
  }
  /* An application can have both kinds of case: a change to the merchant's details and requested services. They stay separate cases;
     this only links to the other kind on the same application. */
  /* What to do now, in one line. */
  function todoLine(c) {
    const next = { 'Sent to Bank': 'Record the bank answer: Approved by bank, Rejected by bank (merchant not qualified) or Missing bank requirements (returns to Sales).', 'Pending Onboarding Configurations': 'Mark the case Active once the merchant configurations are done.',
      'UW Approved': 'Change the status to <b>Sent to Bank</b>.', 'Pending Sales Action': 'Nothing. The case is with Sales, and comes back to Underwriting Review when they resubmit it.', 'Missing Bank Requirements': 'Nothing. The case is with Sales, and comes back to Underwriting Review when they resubmit it.' }[c.ustatus];
    if (next && c.type === 'service') return `<div class="info" role="status"><b>What to do:</b> ${next}</div>`;
    if (c.status !== 'Underwriting Review') return '';
    const msg = 'Check the items below, then <b>Approve case</b>, or <b>Reject case</b> to return it to Sales (Pending Sales Action).';
    return `<div class="info" role="status"><b>What to do:</b> ${msg}</div>`;
  }
  function relatedCard(c) {
    const list = U.related(c); if (!list.length) return '';
    return `<section class="card sec"><div class="sec-h"><div class="tt"><h2>Other cases on this application</h2><p>Each case is reviewed on its own.</p></div></div><div>${list.map(r => `<div class="row"><div class="i"><span class="n">${esc(r.type === 'application' ? r.changes.map(x => x.label).join(', ') : r.service)}</span><span class="f">${esc(r.caseId)} · ${esc(r.caseType)}</span></div><div class="a">${sc(r.ustatus)}<a class="btn btn-outline btn-sm" href="sales-case.html?id=${encodeURIComponent(r.id)}">Open</a></div></div>`).join('')}</div></section>`;
  }
  /* The two phases of a service case. Phase 1 is the review below; phase 2, the bank preparation, comes later. */
  function phases(c, p) {
    const done = p.list.filter(x => x.state !== 'todo').length;
    const one = c.status === 'Underwriting Review' ? ['now', done + ' of ' + p.total + ' items reviewed'] : c.status === 'Rejected' ? ['bad', 'Rejected and returned to Sales'] : ['done', 'Complete'];
    const two = U.PHASE2 ? [c.status === 'Bank Submission' ? 'now' : c.status === 'Live' ? 'done' : 'later', c.status === 'Bank Submission' ? 'In progress' : c.status === 'Live' ? 'Complete' : 'Starts after the review'] : ['later', 'Coming later'];
    return `<ol class="phases" aria-label="Case phases"><li class="${one[0]}"><span class="d">${one[0] === 'done' ? icon('check', 'ic-14') : '1'}</span><div><b>Case review</b><span class="s">Case info, the service with its documents and contract</span><em>${esc(one[1])}</em></div></li>
      <li class="${two[0]}"><span class="d">2</span><div><b>Bank preparation</b><span class="s">The data and steps to send the case to the bank</span><em>${esc(two[1])}</em></div></li></ol>`;
  }
  function logsDrawer(c) {
    SA.drawer({ title: 'Activity logs', sub: esc(c.merchant.name) + ' · ' + esc(c.caseId), render(api) {
      const ev = U.activity(c);
      api.body.innerHTML = ev.length ? `<ul class="log">${ev.map(e => `<li><span class="li">${icon(e.ic || 'pencil', 'ic-16')}</span><div><div class="t num">${esc(e.t)}</div><div><b>${esc(e.who)}</b> ${esc(e.text)}</div>${e.detail ? `<div class="d">${esc(e.detail)}</div>` : ''}</div></li>`).join('')}</ul>` : '<p class="hint">No activity yet.</p>';
    } });
  }

  function render() {
    const c = U.get(id), page = host;
    if (!c) { page.innerHTML = `<div class="wrap"><div class="card empty"><h3>Case not found</h3><p class="hint">It may be assigned to another agent, or the sales application was reset.</p><a class="btn btn-outline" href="cases.html">Back to Cases</a></div></div>`; return; }
    if (!opts.embedded) document.title = 'Kashier | ' + c.caseId;
    const mgr = me.canReassign, app = c.type !== 'service', titleIsBusiness = c.type === 'application';
    // A case is one thing: one service (method) with its pricing, documents and contract, or one change request to the merchant's details.
    // The application as a whole is not handled here; the case only points back to it.
    const parts = [c];
    const notes = c.local.notes;
    const hl = t => ({ html: `<b class="hl">${esc(t)}</b>` });
    const info = (c.channel ? [['Channel', hl(c.channel)], ['Service', hl(c.service.replace(/ \(\w+\)$/, ''))]] : []).concat([['Business', { html: `${esc(c.merchant.name)}<span class="mid" title="Account MID">${esc(c.mid)}</span>` }], ['Contact', c.merchant.email + ' · ' + c.merchant.phone], ['Industry', c.industry + ' · ' + c.entity],  ['Application', c.appId + ' · submitted by ' + c.submittedBy + (c.submittedAt ? ' on ' + c.submittedAt : '')]])
      .concat(mgr ? [] : [['Assigned to', c.assignee]]).concat(c.sla ? [['Time in stage', U.wait(c.hours) + (c.late ? ' · Late' : '') + ' (target ' + c.sla / 24 + ' days)']] : []);
    // Sales roles see the case as it is in Underwriting: the status as a chip, and only their own actions.
    const sales = opts.role === 'sales', ro = sales || !canAct(c);
    page.innerHTML = `<div class="wrap uwcv${opts.embedded ? ' in-drawer' : ''}">
      <header class="hdr"><div>${opts.embedded ? '' : crumb(c.caseId)}<div class="ttl"><h1>${esc(c.caseId)}</h1>${sales ? sc(c.ustatus) : statusSel(c)}</div>
        <div class="meta"><span class="tag">${esc(c.caseType)}${c.isNew ? ' \u00b7 first submission' : ''}</span>${titleIsBusiness ? '' : `<span><b>${esc(c.merchant.name)}</b><span class="mid" title="Account MID">${esc(c.mid)}</span></span>`}<a class="linkb" href="${esc(appHref(c))}" title="Open the application">${esc(c.appId)}</a><button type="button" class="linkb" data-logs>View logs</button></div></div>${actionBar(c, ro, sales)}${opts.embedded ? '' : profile()}</header>
      ${ro && !sales ? `<div class="info" role="status"><b>View only.</b> This case is assigned to ${esc(c.assignee)}. Only the assignee or an Underwriting Manager can change it.</div>` : ''}
      ${app || !U.STEPPER ? '' : phases(c, U.progress(c))}
      <section class="card sec"><div class="sec-h"><div class="tt"><h2>Case info</h2></div></div>${dl(info)}
        ${mgr && !sales ? `<div class="fld" style="max-width:280px"><label for="assignSel">Assigned to</label><select class="sel" id="assignSel">${C.TEAM.map(n => `<option ${n === c.assignee ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>` : ''}</section>
      ${parts.map(x => part(x)).join('')}
      ${c.type === 'update' ? `<section class="card sec"><div class="sec-h"><div class="tt"><h2>The service as it is now</h2><p>For reference. This is what the changes above are applied to.</p></div></div>${pricingDetail(c)}</section>` : ''}
      ${U.PHASE2 && c.type === 'service' && c.status === 'Bank Submission' ? readinessCard(c) + formsCard(c) + answerCard(c) : ''}</div>`;
    bind(c);
    if (ro) host.querySelectorAll('select:not([data-keep]),textarea,[data-ready],[data-unready],[data-sent],[data-answer],[data-bf]').forEach(e => { e.disabled = true; });
  }

  /* The prototype keeps file names only, so a download is a small placeholder file under the real name. */
  function saveText(name, text) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  function save(name) { saveText(name, 'Prototype placeholder for ' + name + '. The prototype does not store real files.\n'); SA.toast('Downloading ' + name); }
  function flagModal(cid, key, label) {
    SA.modal({ title: 'Reject this item?', sub: esc(label), body: '<div class="fld"><label for="flC">Decision comment</label><textarea class="inp" id="flC" rows="2" placeholder="What does Sales need to fix?"></textarea></div>',
      foot: '<button type="button" class="btn btn-outline" data-n>Cancel</button><button type="button" class="btn btn-danger" data-y disabled>Reject</button>',
      bind(api) {
        const t = api.el.querySelector('#flC'), y = api.el.querySelector('[data-y]');
        t.oninput = () => { y.disabled = !t.value.trim(); }; api.el.querySelector('[data-n]').onclick = api.close;
        y.onclick = () => { U.setReview(U.get(cid), key, 'flag', t.value.trim()); api.close(); decided(cid); };
      } });
  }
  function decided() { render(); changed(); }
  const changed = () => { if (opts.onChange) opts.onChange(U.get(id)); };
  /* Moving to Pending Sales Action (back to Sales) or Rejected by Bank (merchant not qualified) asks for the reason. */
  function commentModal(cid, to) {
    const c = U.get(cid), sales = to === 'Pending Sales Action';
    SA.modal({ title: sales ? 'Return this case to Sales?' : 'Rejected by the bank?', sub: esc(c.caseId) + ' \u00b7 ' + esc(c.service || c.caseType),
      body: `<p style="margin:0">${sales ? 'The case moves to <b>Pending Sales Action</b> and returns to Sales.' : 'The case moves to <b>Rejected by Bank</b>: merchant not qualified.'}</p><div class="fld"><label for="trC">${sales ? 'Comment for Sales' : 'Rejection reason'}</label><textarea class="inp" id="trC" rows="3" placeholder="${sales ? 'What does Sales need to fix?' : 'Why did the bank reject the merchant?'}"></textarea></div>`,
      foot: `<button type="button" class="btn btn-outline" data-n>Cancel</button><button type="button" class="btn btn-danger" data-y ${sales ? 'disabled' : ''}>${sales ? 'Return to Sales' : 'Rejected by bank'}</button>`,
      bind(api) {
        const t = api.el.querySelector('#trC'), y = api.el.querySelector('[data-y]');
        t.oninput = () => { y.disabled = sales && !t.value.trim(); }; api.el.querySelector('[data-n]').onclick = api.close;
        y.onclick = () => { U.setStatus(U.get(cid), to, t.value.trim()); api.close(); render(); changed(); SA.toast(c.caseId + ' is now ' + to); };
      } });
    render();   // the dropdown shows the current status again until the change is confirmed
  }
  function bind(c) {
    const q = s => host.querySelectorAll(s), one = s => host.querySelector(s);
    q('[data-ok]').forEach(b => b.onclick = () => { U.setReview(U.get(b.dataset.case), b.dataset.ok, 'ok'); decided(b.dataset.case); });
    q('[data-clear]').forEach(b => b.onclick = () => { U.setReview(U.get(b.dataset.case), b.dataset.clear, 'todo'); render(); });
    q('[data-flag]').forEach(b => b.onclick = () => flagModal(b.dataset.case, b.dataset.flag, b.dataset.lbl));
    q('[data-logs]').forEach(b => b.onclick = () => logsDrawer(c));
    q('[data-stbtn]').forEach(b => b.onclick = () => SA.statusMenu(b, U.get(id), (t, cm) => {
      const cur = U.get(id); if (U.transition(cur, t, cm)) { render(); changed(); SA.toast(cur.caseId + ': ' + t.name + '. Now ' + t.to + '.'); }
    }));
    q('[data-x]').forEach(b => b.onclick = () => { if (opts.onAction) opts.onAction(b.dataset.x, U.get(id)); });
    q('[data-reject-case]').forEach(b => b.onclick = () => commentModal(b.dataset.rejectCase, 'Pending Sales Action'));
    q('[data-approve-case]').forEach(b => b.onclick = () => { const cur = U.get(b.dataset.approveCase); if (U.setStatus(cur, 'UW Approved')) { render(); changed(); SA.toast(cur.caseId + ' approved. The changes are applied.'); } else SA.toast('Could not approve this case'); });
    q('[data-bmbatch]').forEach(b => b.onclick = () => UWBM.open(() => render()));
    q('[data-sent]').forEach(b => b.onclick = () => { const v = i => (host.querySelector('#' + i) || {}).value; if (U.markSent(U.get(b.dataset.sent), v('sentBatch'), v('sentRef'))) { render(); SA.toast('Marked as sent to the bank'); } });
    q('[data-answer]').forEach(b => b.onclick = () => {
      const cc = U.get(b.dataset.answer), d = one('#ansSel').value, t = one('#ansComment').value.trim();
      if (!d) { SA.toast('Choose what NBE answered'); return; }
      if (d !== 'Approved' && !t) { SA.toast('Write the bank\'s comment first'); return; }
      const r = U.recordAnswer(cc, d, t);
      if (r === 'approved') go(cc.caseId + ' approved by ' + (U.readiness(cc) || {}).bank + '. It is now a completed case.');
      else if (r === 'rejected') go(cc.caseId + ' rejected by ' + (U.readiness(cc) || {}).bank + ' and returned to Sales');
      else if (r === 'waiting') { render(); SA.toast('Recorded: NBE is waiting for the merchant'); }
    });
    q('[data-nbe]').forEach(b => b.onclick = async () => {
      const cc = U.get(b.dataset.case), inp = U.nbeInput(cc);
      try {
        const pack = NBEExport.packsFor(inp.c).find(p => p.files.some(f => f.id === b.dataset.nbe)), f = pack.files.find(x => x.id === b.dataset.nbe), name = NBEExport.fileName(inp.c, f, pack);
        NBEExport.save(await NBEExport.build(inp.c, inp.saved, f.id), name); U.logExport(cc, [name]); SA.toast('Downloaded ' + f.name); render();
      } catch (e) { SA.toast(e.message || 'The form could not be built'); }
    });
    q('[data-nbeall]').forEach(b => b.onclick = async () => {
      const cc = U.get(b.dataset.nbeall), inp = U.nbeInput(cc), names = [];
      try {
        const zip = new JSZip();
        for (const p of NBEExport.packsFor(inp.c)) for (const f of p.files) { const n = NBEExport.fileName(inp.c, f, p); names.push(n); zip.file(n, await NBEExport.build(inp.c, inp.saved, f.id)); }
        NBEExport.save(await zip.generateAsync({ type: 'blob' }), 'NBE - ' + cc.merchant.name.replace(/[\\/:*?"<>|]+/g, ' ').trim() + ' - ' + cc.caseId + '.zip'); U.logExport(cc, names); SA.toast('Downloaded ' + names.length + ' forms'); render();
      } catch (e) { SA.toast(e.message || 'The forms could not be built'); }
    });
    q('[data-ready]').forEach(b => b.onclick = () => { if (U.markReady(U.get(b.dataset.ready))) { render(); SA.toast('Marked ready for the bank'); } });
    q('[data-unready]').forEach(b => b.onclick = () => { U.unmarkReady(U.get(b.dataset.unready)); render(); SA.toast('Bank preparation reopened'); });
    q('[data-bf]').forEach(e => e.onchange = () => { U.setField(c, e.dataset.bf, e.value); const r = U.settle(c.id); if (r === 'approved' || r === 'rejected') go(c.caseId + (r === 'approved' ? ' approved and sent to the bank' : ' rejected and returned to Sales')); else render(); });
    q('[data-view]').forEach(b => b.onclick = () => SA.drawer({ size: 'xl', title: esc(b.dataset.l), sub: esc(b.dataset.view), render(api) { api.body.innerHTML = `<div class="fprev fprev-lg">${icon('doc', 'ic-24')}<b>${esc(b.dataset.view)}</b><span class="hint">Preview of the uploaded file. The prototype does not store real files.</span></div>`; api.foot.innerHTML = `<span class="sp"></span><button type="button" class="btn btn-outline" data-dl-d="${esc(b.dataset.view)}">${icon('download', 'ic')}Download</button>`; api.foot.querySelector('[data-dl-d]').onclick = () => save(b.dataset.view); } }));
    q('[data-dl]').forEach(b => b.onclick = () => save(b.dataset.dl));
    q('[data-dlall]').forEach(b => b.onclick = () => { const cc = U.get(b.dataset.dlall), sec = b.dataset.sec, nm = sec === 'contracts' ? 'contracts' : 'documents', names = [].concat.apply([], U.progress(cc).list.filter(x => x.tab === sec).map(x => x.list || [])); saveText(cc.caseId + '-' + nm + '.txt', 'The ' + nm + ' uploaded for ' + cc.caseId + ' (' + cc.merchant.name + ')\n\n' + names.join('\n') + '\n'); SA.toast('Downloading ' + names.length + ' ' + nm.slice(0, -1) + (names.length === 1 ? '' : 's')); });
    q('[data-live]').forEach(b => b.onclick = () => { U.goLive(U.get(b.dataset.live)); render(); SA.toast('Marked live'); });
    const s = one('#assignSel'); if (s) s.onchange = () => { U.assign(c, s.value); SA.toast('Reassigned to ' + s.value); render(); changed(); };
  }
  window.addEventListener('nbe-ready', () => { try { if (host && id) render(); } catch (e) { /* not ready */ } });
  return { mount(h, caseId, o) { host = h; id = caseId; opts = o || {}; me = C.user(); render(); }, render() { if (host) render(); } };
})();
