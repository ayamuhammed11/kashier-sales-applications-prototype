/* WebhooksPage (components/webhooks-page.js): the Webhooks tab, direction C ("health first"), chosen 2026-10-19.
   A 24-hour summary, one row per endpoint with a 30-delivery timeline, recent failures in the aside,
   and the "use case first" add flow (cards → URL + events + channels + headers), in a drawer or inline when empty.
   The add flow is pluggable: mount(host, { openAdd }) — webhooks-proposals/add-flows.html swaps it.
   Needs (backend): delivery records by webhookId + 24-hour / 7-day totals per webhook. */
(function () {
  const { tr, esc, icon, fmt } = WH;
  const recsOf = {};
  const recs = (h) => recsOf[h.id] || (recsOf[h.id] = WH.deliveries(h, 30));
  const live = () => tr('Webhook is live. Kashier will send events as they happen.', 'الويب هوك يعمل. سيرسل كاشير الأحداث فور حدوثها.');
  const newHook = (o = {}) => Object.assign({ id: 'wh_' + Math.random().toString(16).slice(2, 6), name: '', url: '', events: [], headers: [], channels: {}, active: true, created: '2026-10-19', stats: { ok: 0, fail: 0, retrying: 0, last: null, lastCode: null, rate: null } }, o);
  const modeSub = () => WH.mode === 'live' ? tr('Live mode · receives real payments and transfers', 'الوضع المباشر · يستقبل المدفوعات والتحويلات الحقيقية') : tr('Test mode · receives test payments only', 'وضع الاختبار · يستقبل مدفوعات الاختبار فقط');

  /* ---------- Guided setup: Endpoint → Events → Test ---------- */
  function setup(container, { inDrawer, api, onDone } = {}) {
    const m = newHook();
    let step = 0;
    const names = [tr('Endpoint', 'نقطة الاستقبال'), tr('Events', 'الأحداث'), tr('Test', 'اختبار')];
    container.innerHTML = `<div class="gcard"><div class="gcard-h"><h3>${tr('Connect your server', 'اربط خادمك')}</h3><p>${tr('Three steps. Kashier will start sending events as soon as you finish.', 'ثلاث خطوات. سيبدأ كاشير بإرسال الأحداث فور الانتهاء.')}</p></div><ol class="steps"></ol><div class="gbody"></div><div class="gfoot"></div></div>`;
    const stepsEl = container.querySelector('.steps'), body = container.querySelector('.gbody');
    const foot = inDrawer ? api.foot : container.querySelector('.gfoot');
    const check = () => { const u = body.querySelector('#sUrl'), e = WH.validateUrl(m.url); u.classList.toggle('err', !!e); u.setAttribute('aria-invalid', !!e); body.querySelector('#eUrl').innerHTML = e ? icon('warn') + e : ''; return !e; };
    const draw = () => {
      stepsEl.innerHTML = names.map((n, i) => `<li class="${i === step ? 'on' : i < step ? 'done' : ''}" ${i === step ? 'aria-current="step"' : ''}>${tr(`Step ${i + 1}`, `الخطوة ${fmt(i + 1)}`)} · ${n}</li>`).join('');
      if (step === 0) {
        body.innerHTML = `<div class="fld"><label for="sUrl">${tr('Where should Kashier send events?', 'أين يرسل كاشير الأحداث؟')}</label><input id="sUrl" class="inp" dir="ltr" inputmode="url" value="${esc(m.url)}" placeholder="https://shop.com/kashier/webhook" aria-describedby="sUrlH eUrl"><span class="hint" id="sUrlH">${tr('A public https URL on your server that accepts POST requests.', 'رابط https عام على خادمك يقبل طلبات POST.')}</span><span class="ferr" id="eUrl" role="alert"></span></div>
          <div class="fld"><label for="sName">${tr('Name', 'الاسم')} <span class="opt">${tr('optional', 'اختياري')}</span></label><input id="sName" class="inp" value="${esc(m.name)}" placeholder="${tr('e.g. Orders production', 'مثال: طلبات الإنتاج')}" aria-describedby="sNameH"><span class="hint" id="sNameH">${tr('Leave empty to use the address.', 'اتركه فارغًا لاستخدام العنوان.')}</span></div>
          <details ${m.headers.length ? 'open' : ''}><summary style="cursor:pointer;color:var(--link);font-weight:600">${tr('Custom headers', 'ترويسات مخصصة')} <span class="muted" style="font-weight:400">${tr('optional', 'اختياري')}</span></summary><div id="sHd" style="margin-block-start:12px"></div></details>`;
        body.querySelector('#sHd').append(WH.headersEditor(m.headers, (v) => m.headers = v));
        const u = body.querySelector('#sUrl');
        u.oninput = () => { m.url = u.value.trim(); if (u.classList.contains('err')) check(); };
        u.onkeydown = (e) => { if (e.key === 'Enter') next(); };
        body.querySelector('#sName').oninput = (e) => m.name = e.target.value;
        setTimeout(() => u.focus());
      } else if (step === 1) {
        body.innerHTML = `<p style="margin:0;color:var(--cadet-base)">${tr('Pick only what your server handles. You can change this later.', 'اختر ما يعالجه خادمك فقط. يمكنك التغيير لاحقًا.')}</p><div id="sEv"></div><span class="ferr" id="eEv" role="alert"></span>`;
        body.querySelector('#sEv').append(WH.eventPicker(m.events, (v) => { m.events = v; body.querySelector('#eEv').textContent = ''; }, { channels: m.channels }));
        setTimeout(() => body.querySelector('#sEv .tg[aria-expanded="true"]')?.focus());
      } else {
        body.innerHTML = `<div class="recap"><div><span>${tr('URL', 'الرابط')}</span><b class="mono ell" dir="ltr">${esc(m.url)}</b></div><div><span>${tr('Events', 'الأحداث')}</span><b>${WH.evSummary(m.events)}</b></div></div>
          <p style="margin:0;color:var(--cadet-base)">${tr('Send a signed sample payment to check your server answers with 200 and verifies the signature. You can skip this and test later.', 'أرسل دفعة نموذجية موقّعة للتحقق من أن خادمك يجيب بـ 200 ويتحقق من التوقيع. يمكنك التخطي والاختبار لاحقًا.')}</p>
          <div><button type="button" class="btn btn-outline" id="sTest">${icon('send', 'ic')}${tr('Send test event', 'إرسال حدث تجريبي')}</button></div><div id="sRes"></div>`;
        body.querySelector('#sTest').onclick = (e) => { WH.sendTest(m, body.querySelector('#sRes')); e.currentTarget.innerHTML = icon('retry', 'ic') + tr('Send again', 'إرسال مرة أخرى'); };
        setTimeout(() => body.querySelector('#sTest').focus());
      }
      foot.innerHTML = `${step > 0 && step < 2 ? `<button type="button" class="btn btn-ghost" data-back>${icon('left', 'ic mirror')}${tr('Back', 'رجوع')}</button>` : ''}<span class="sp"></span>${inDrawer && step < 2 ? `<button type="button" class="btn btn-outline" data-cancel>${tr('Cancel', 'إلغاء')}</button>` : ''}<button type="button" class="btn btn-primary" data-next>${step === 0 ? tr('Continue', 'متابعة') : step === 1 ? tr('Create webhook', 'إنشاء الويب هوك') : tr('Done', 'تم')}</button>`;
      foot.querySelector('[data-back]')?.addEventListener('click', () => { step--; draw(); });
      foot.querySelector('[data-cancel]')?.addEventListener('click', () => api.close());
      foot.querySelector('[data-next]').onclick = next;
    };
    const next = () => {
      if (step === 0) { if (!check()) return body.querySelector('#sUrl').focus(); if (!m.name.trim()) m.name = WH.host(m.url); }
      if (step === 1) {
        if (!m.events.length) { body.querySelector('#eEv').innerHTML = icon('warn') + tr('Choose at least one event.', 'اختر حدثًا واحدًا على الأقل.'); return body.querySelector('#sEv .tg').focus(); }
        WH.hooks.push(m); WH.save(); WH.toast(tr('Webhook created', 'تم إنشاء الويب هوك'));
      }
      if (step < 2) { step++; draw(); return; }
      onDone && onDone(m);
    };
    draw();
  }

  /* ---------- Use case first (chosen 2026-10-19): cards → URL + Name + pre-ticked events (accordion, channel per
     payment event) + custom headers. Runs in the add drawer and inline in the empty state. ---------- */
  const CASES = [
    { k: 'orders', ic: 'store', l: tr('Confirm orders', 'تأكيد الطلبات'), d: tr('Mark orders paid, refunded or cancelled in your store.', 'حدّث حالة الطلبات في متجرك: مدفوع، مسترد، ملغى.'), ev: ['pay', 'refund', 'void'] },
    { k: 'holds', ic: 'key', l: tr('Card holds', 'حجز المبالغ'), d: tr('Authorize now, capture later: hotels, rentals, pre-orders.', 'فوّض الآن وحصّل لاحقًا: الفنادق، التأجير، الطلبات المسبقة.'), ev: ['authorize', 'capture', 'void'] },
    { k: 'payouts', ic: 'wallet', l: tr('Track payouts', 'تتبع التحويلات'), d: tr('Follow each transfer from created to arrived or failed.', 'تابع كل تحويل من الإنشاء حتى الوصول أو الفشل.'), ev: ['INITIATED', 'IN_TRANSIT', 'TRANSFERRED', 'FAILED'] },
    { k: 'ledger', ic: 'book', l: tr('Accounting sync', 'مزامنة المحاسبة'), d: tr('Every money movement, for your ERP or ledger.', 'كل حركة مالية لنظام ERP أو دفتر الحسابات.'), ev: WH.ALL.slice() }
  ];
  // ui: { body, foot, setTitle(title, sub), cancel?() } — the drawer passes its parts; inline builds a card
  function usecase(ui, { onDone }) {
    const m = newHook(); let pick = null, custom = false;
    const { body, foot } = ui;
    const step1 = () => {
      ui.setTitle(tr('What will this webhook do?', 'ما وظيفة هذا الويب هوك؟'), ui.inline ? tr('Pick one to start. You can change the events on the next screen.', 'اختر واحدًا للبدء. يمكنك تغيير الأحداث في الشاشة التالية.') : modeSub());
      body.style.gap = '';
      body.innerHTML = `<div class="ucs" role="radiogroup" aria-label="${tr('Use case', 'حالة الاستخدام')}">${CASES.map(c => `<button type="button" class="uc" role="radio" aria-checked="${pick === c.k}" tabindex="${pick === c.k || (!pick && !custom && c === CASES[0]) ? 0 : -1}" data-k="${c.k}"><span class="hd"><span class="ico">${icon(c.ic, 'ic')}</span><b>${c.l}</b></span><p>${c.d}</p><span class="ev">${c.ev.length === WH.ALL.length ? `<code class="k">${tr('all 10 events', 'كل الأحداث العشرة')}</code>` : c.ev.map(e => `<code class="k" dir="ltr">${e}</code>`).join('')}</span></button>`).join('')}
        <button type="button" class="uc custom" role="radio" aria-checked="${custom}" tabindex="${custom ? 0 : -1}" data-k="custom"><span class="hd"><span class="ico">${icon('pencil', 'ic')}</span><span><b>${tr('Choose events myself', 'اختيار الأحداث بنفسي')}</b><p>${tr('Any mix of the 10 events.', 'أي مزيج من الأحداث العشرة.')}</p></span></span></button></div>`;
      const rs = [...body.querySelectorAll('.uc')];
      rs.forEach((r, i) => {
        r.onclick = () => { if (r.dataset.k === 'custom') { custom = true; pick = null; m.events = []; } else { custom = false; pick = r.dataset.k; m.events = CASES.find(c => c.k === pick).ev.slice(); } step2(); };
        r.onkeydown = (e) => { const d = { ArrowDown: 1, ArrowRight: document.dir === 'rtl' ? -1 : 1, ArrowUp: -1, ArrowLeft: document.dir === 'rtl' ? 1 : -1 }[e.key]; if (d) { e.preventDefault(); const n = rs[(i + d + rs.length) % rs.length]; rs.forEach(x => x.tabIndex = -1); n.tabIndex = 0; n.focus(); } };
      });
      foot.innerHTML = ui.cancel ? `<span class="sp"></span><button type="button" class="btn btn-outline" data-c>${tr('Cancel', 'إلغاء')}</button>` : '';
      foot.hidden = !ui.cancel;
      foot.querySelector('[data-c]')?.addEventListener('click', ui.cancel);
      if (ui.focus !== false) setTimeout(() => (body.querySelector('.uc[tabindex="0"]') || rs[0]).focus());
      ui.focus = true;
    };
    const step2 = () => {
      const c = CASES.find(x => x.k === pick);
      ui.setTitle(c ? c.l : tr('Choose your events', 'اختر الأحداث'), ui.inline ? tr('Where to send them, and what to send.', 'أين تُرسل الأحداث، وما الذي يُرسل.') : modeSub());
      body.style.gap = '20px';
      const grp = m.events.length && m.events.every(k => WH.EV[k].g === 'tr') ? 'tr' : 'tx';
      body.innerHTML = `<div class="frow2"><div class="fld"><label for="uUrl">${tr('Where should Kashier send events?', 'أين يرسل كاشير الأحداث؟')}</label><input id="uUrl" class="inp" dir="ltr" inputmode="url" value="${esc(m.url)}" placeholder="https://shop.com/kashier/webhook" aria-describedby="uUrlE"><span class="ferr" id="uUrlE" role="alert"></span></div>
          <div class="fld"><label for="uName">${tr('Name', 'الاسم')} <span class="opt">${tr('optional', 'اختياري')}</span></label><input id="uName" class="inp" value="${esc(m.name || (c ? c.l : ''))}"></div></div>
        <div class="fld"><div class="lblrow"><span class="lbl" id="uEvL">${tr('Events', 'الأحداث')}</span><span class="hint" id="uEvH"></span></div><div id="uEv"></div><span class="ferr" id="uEvE" role="alert"></span>
        <details class="xhd"><summary>${tr('Custom headers', 'ترويسات مخصصة')} <span class="opt">${tr('optional', 'اختياري')}</span> <span class="cntb" id="uHdC"></span></summary><p>${tr('Sent with every request, for example a token your server checks.', 'تُرسل مع كل طلب، مثل رمز يتحقق منه خادمك.')}</p><div id="uHd"></div></details></div>`;
      const hint = () => {
        const same = c && m.events.length === c.ev.length && c.ev.every(k => m.events.includes(k));
        body.querySelector('#uEvH').textContent = c ? (same ? tr(`Picked for “${c.l}”. Change anything.`, `مختارة لـ «${c.l}». غيّر ما تريد.`) : tr(`Started from “${c.l}”, now your own mix.`, `بدأت من «${c.l}»، والآن مزيجك الخاص.`)) : tr('Pick the events your server handles.', 'اختر الأحداث التي يعالجها خادمك.');
      };
      body.querySelector('#uEv').append(WH.eventPicker(m.events, (v) => { m.events = v; body.querySelector('#uEvE').textContent = ''; hint(); }, { channels: m.channels, open: grp }));
      hint();
      const hc = () => { const n = m.headers.length; body.querySelector('#uHdC').textContent = n ? tr(`${n} added`, `${fmt(n)} مضافة`) : ''; };
      body.querySelector('#uHd').append(WH.headersEditor(m.headers, (v) => { m.headers = v; hc(); })); hc();
      if (m.headers.length) body.querySelector('.xhd').open = true;
      const u = body.querySelector('#uUrl');
      const chk = () => { const e = WH.validateUrl(m.url); u.classList.toggle('err', !!e); u.setAttribute('aria-invalid', !!e); body.querySelector('#uUrlE').innerHTML = e ? icon('warn') + e : ''; return !e; };
      u.oninput = () => { m.url = u.value.trim(); if (u.classList.contains('err')) chk(); };
      u.onkeydown = (e) => { if (e.key === 'Enter') save(); };
      const save = () => {
        if (!chk()) return u.focus();
        if (!m.events.length) { body.querySelector('#uEvE').innerHTML = icon('warn') + tr('Choose at least one event.', 'اختر حدثًا واحدًا على الأقل.'); return body.querySelector('#uEv .tg').focus(); }
        m.name = body.querySelector('#uName').value.trim() || WH.host(m.url);
        WH.hooks.push(m); WH.save();
        onDone(m);
      };
      foot.hidden = false;
      foot.innerHTML = `<button type="button" class="btn btn-ghost" data-b>${icon('left', 'ic mirror')}${tr('Back', 'رجوع')}</button><span class="sp"></span>${ui.cancel ? `<button type="button" class="btn btn-outline" data-c>${tr('Cancel', 'إلغاء')}</button>` : ''}<button type="button" class="btn btn-primary" data-s>${tr('Create webhook', 'إنشاء الويب هوك')}</button>`;
      foot.querySelector('[data-b]').onclick = step1;
      foot.querySelector('[data-c]')?.addEventListener('click', ui.cancel);
      foot.querySelector('[data-s]').onclick = save;
      setTimeout(() => u.focus());
    };
    step1();
  }
  // add drawer (default add flow)
  function usecaseDrawer({ done }) {
    WH.drawer({ title: tr('Add webhook', 'إضافة ويب هوك'), sub: modeSub(), onClose: () => page.render(), render(api) {
      usecase({ body: api.body, foot: api.foot, setTitle: api.setTitle, cancel: api.close }, { onDone: (m) => { api.close(); done(); setTimeout(() => openTest(m), 250); } });
    } });
  }
  // inline in the empty state: same flow inside a card
  function usecaseInline(container, { onDone }) {
    container.innerHTML = `<div class="gcard"><div class="gcard-h"><h3 id="ucT"></h3><p id="ucS"></p></div><div class="gbody"></div><div class="gfoot"></div></div>`;
    usecase({ inline: true, focus: false, body: container.querySelector('.gbody'), foot: container.querySelector('.gfoot'),
      setTitle: (t, s) => { container.querySelector('#ucT').innerHTML = t; container.querySelector('#ucS').innerHTML = s || ''; } }, { onDone });
  }

  /* the earlier default: guided steps in a drawer (kept for webhooks-proposals/add-flows.html) */
  function guidedDrawer({ done }) {
    WH.drawer({ title: tr('Add webhook', 'إضافة ويب هوك'), sub: modeSub(),
      onClose: () => page.render(), render(api) { setup(api.body, { inDrawer: true, api, onDone: () => { api.close(); done(); } }); } });
  }

  /* ---------- Page ---------- */
  const page = { host: null, openAdd: usecaseDrawer };
  function render() {
    const host = page.host;
    const full = WH.hooks.length >= WH.LIMIT;
    host.innerHTML = `<div class="stack"><div class="whead"><div class="tt"><h2>${tr('Webhooks', 'الويب هوك')}</h2><p>${tr('Kashier sends a signed POST request to your URL when a payment or transfer changes.', 'يرسل كاشير طلب POST موقّعًا إلى رابطك عند تغيّر دفعة أو تحويل.')}</p></div>
      ${WH.hooks.length || WH.state === 'loading' || WH.state === 'error' ? `<div class="acts">${WH.state === 'loaded' ? WH.usage() : ''}<button type="button" class="btn btn-primary" id="addBtn" ${full || WH.state !== 'loaded' ? 'disabled' : ''} ${full ? 'aria-describedby="limitHint"' : ''}>${icon('plus', 'ic')}${tr('Add webhook', 'إضافة ويب هوك')}</button></div>` : ''}</div>
      ${full ? `<p id="limitHint" class="muted" style="margin:-16px 0 0;font-size:12px;text-align:end">${tr(`You've reached ${WH.LIMIT} webhooks in this mode. Delete one to add another.`, `وصلت إلى ${fmt(WH.LIMIT)} ويب هوك في هذا الوضع. احذف واحدًا لإضافة آخر.`)}</p>` : ''}<div id="body"></div></div>`;
    host.querySelector('#addBtn')?.addEventListener('click', () => page.openAdd({ done: () => { WH.toast(live()); render(); } }));
    const body = host.querySelector('#body');
    if (WH.state === 'error') { body.innerHTML = `<div class="tcard">${WH.errorBlock()}</div>`; return; }
    if (WH.state === 'loading') { body.innerHTML = `<div class="stack" aria-busy="true"><section class="kpis">${'<div class="kpi"><div class="l">&nbsp;</div><div class="v">&nbsp;</div></div>'.repeat(4)}</section><div class="tcard"><table class="dt" style="min-width:0"><tbody>${WH.skeletonRows(3, 3)}</tbody></table></div></div>`; return; }
    if (!WH.hooks.length) { renderEmpty(body); return; }

    const all = WH.hooks.filter(h => h.active).flatMap(h => recs(h).map(r => ({ ...r, h })));
    const day = all.filter(r => WH.NOW - r.at < 864e5);
    const nFail = day.filter(r => r.status === 'failed').length, nRetry = all.filter(r => r.status === 'retrying').length;
    body.innerHTML = `<div class="stack"><section class="kpis" aria-label="${tr('Last 24 hours', 'آخر 24 ساعة')}">
        <div class="kpi"><div class="l">${tr('Delivered', 'تم التسليم')}</div><div class="v">${fmt(day.filter(r => r.status === 'delivered').length)}</div><div class="s">${tr('Last 24 hours', 'آخر 24 ساعة')}</div></div>
        <div class="kpi"><div class="l">${tr('Failed', 'فشل')}</div><div class="v" style="${nFail ? 'color:var(--destructive)' : ''}">${fmt(nFail)}</div><div class="s">${tr('Last 24 hours, after all retries', 'آخر 24 ساعة، بعد كل المحاولات')}</div></div>
        <div class="kpi"><div class="l">${tr('Retrying now', 'قيد إعادة المحاولة')}</div><div class="v">${fmt(nRetry)}</div><div class="s">${tr('Kashier will try again', 'سيحاول كاشير مجددًا')}</div></div>
        <div class="kpi"><div class="l">${tr('Active endpoints', 'نقاط نشطة')}</div><div class="v">${fmt(WH.hooks.filter(h => h.active).length)}<span style="font-size:16px;color:var(--muted-fg);font-weight:400"> / ${fmt(WH.LIMIT)}</span></div><div class="s">${WH.mode === 'live' ? tr('Live mode', 'الوضع المباشر') : tr('Test mode', 'وضع الاختبار')}</div></div></section>
      <div class="lay"><section class="eps" aria-labelledby="epsT"><div class="eps-h"><h3 id="epsT">${tr('Endpoints', 'نقاط الاستقبال')}</h3><span class="lg" aria-hidden="true"><span><span class="dot ok"></span>${tr('Delivered', 'تم')}</span><span><span class="dot warn"></span>${tr('Retrying', 'محاولة')}</span><span><span class="dot bad"></span>${tr('Failed', 'فشل')}</span></span></div>
        ${WH.hooks.map(rowHtml).join('')}</section>
        <aside class="feed" aria-labelledby="feedT"><div class="feed-h"><h3 id="feedT">${tr('Recent failures', 'آخر الإخفاقات')}</h3><p>${tr('Across all endpoints, newest first', 'عبر كل النقاط، الأحدث أولًا')}</p></div><div id="feed"></div></aside></div></div>`;
    const fails = all.filter(r => r.status !== 'delivered').sort((a, b) => b.at - a.at).slice(0, 7);
    const feed = body.querySelector('#feed');
    feed.innerHTML = fails.length ? fails.map((r, i) => `<button type="button" class="fi" data-i="${i}"><span class="dot ${WH.STATUS[r.status].cls === 'warn' ? 'warn' : 'bad'}"></span><span class="t"><span>${esc(r.h.name)} · ${WH.EV[r.event].label}</span><span class="mono" dir="ltr">${esc(r.resource)} · ${r.code === 0 ? 'timeout' : r.code}</span></span><span class="w">${WH.when(r.at)}</span></button>`).join('') : `<div class="none">${icon('check', 'ic-24')}<p style="margin:8px 0 0">${tr('No failures. Everything was delivered.', 'لا إخفاقات. تم تسليم كل شيء.')}</p></div>`;
    feed.querySelectorAll('[data-i]').forEach(b => b.onclick = () => openRec(fails[+b.dataset.i], fails[+b.dataset.i].h));
    body.querySelectorAll('.er').forEach(wireRow);
  }
  function rowHtml(h) {
    const rr = recs(h).slice().reverse(), bad = h.active && h.stats.failing;
    return `<div class="er${h.active ? '' : ' off'}${bad ? ' bad' : ''}" data-id="${h.id}">
      <div class="t"><b><span class="ell">${esc(h.name)}</span>${h.active ? '' : `<span class="sc neu">${tr('Off', 'متوقف')}</span>`}${h.legacy ? `<span class="sc neu" title="${tr('Moved over from the old single webhook URL', 'منقول من رابط الويب هوك القديم')}">${tr('Migrated', 'مُرحّل')}</span>` : ''}</b><span class="u mono ell" dir="ltr">${esc(h.url)}</span><span class="e">${WH.evSummary(h.events)}${WH.chSummary(h) ? ` · ${esc(WH.chSummary(h))}` : ''}</span></div>
      ${!h.active ? `<div class="tl none">${tr('Paused. No events are sent.', 'متوقف. لا تُرسل أحداث.')}</div>` : rr.length && h.stats.last != null ? `<div class="tl" role="toolbar" aria-label="${tr(`Last ${rr.length} deliveries, oldest first. Use arrow keys.`, `آخر ${fmt(rr.length)} عملية تسليم، الأقدم أولًا. استخدم الأسهم.`)}">${rr.map((r, i) => `<button type="button" tabindex="${i === rr.length - 1 ? 0 : -1}" class="${WH.STATUS[r.status].cls === 'ok' ? '' : WH.STATUS[r.status].cls}" data-r="${r.id}" aria-label="${WH.STATUS[r.status].l}, ${WH.EV[r.event].label}, ${WH.when(r.at)}" title="${WH.STATUS[r.status].l} · ${WH.EV[r.event].label} · ${WH.when(r.at)}"></button>`).join('')}</div>` : `<div class="tl none">${tr('Waiting for the first event', 'في انتظار أول حدث')}</div>`}
      <div class="rt"><b style="${bad ? 'color:var(--destructive)' : ''}">${h.stats.rate == null ? '—' : fmt(h.stats.rate) + '%'}</b><span>${tr('7-day success', 'نجاح 7 أيام')}</span></div>
      <div class="ctl"><span data-sw></span><button type="button" class="icon-btn" data-more aria-haspopup="menu" aria-expanded="false" aria-label="${tr('More actions for', 'إجراءات أخرى لـ')} ${esc(h.name)}">${icon('dots', 'ic-20')}</button></div>
      ${bad ? `<div class="fixbar">${icon('warn', 'ic-20')}<span class="t">${tr('Returning 500 since 14:06. 6 failed, 2 retrying.', 'يعيد 500 منذ 14:06. فشل 6، و2 قيد المحاولة.')}</span><button type="button" class="btn btn-outline btn-sm" data-test>${icon('send', 'ic')}${tr('Send test', 'إرسال اختبار')}</button><button type="button" class="btn btn-outline btn-sm" data-resend>${icon('retry', 'ic')}${tr('Resend 6 failed', 'إعادة إرسال 6 فاشلة')}</button></div>` : ''}</div>`;
  }
  function wireRow(row) {
    const h = WH.hooks.find(x => x.id === row.dataset.id);
    row.querySelector('[data-sw]').append(WH.switchBtn(h.active, `${tr('Active', 'مفعّل')}: ${h.name}`, (v) => { WH.setActive(h, v); render(); page.host.querySelector(`[data-id="${h.id}"] .sw`)?.focus(); }));
    const bars = [...row.querySelectorAll('.tl [data-r]')];
    bars.forEach((b, i) => {
      b.onclick = () => openRec(recs(h).find(r => r.id === b.dataset.r), h);
      b.onkeydown = (e) => {
        const rtl = document.dir === 'rtl', k = e.key;
        let j = i;
        if (k === (rtl ? 'ArrowLeft' : 'ArrowRight')) j = Math.min(i + 1, bars.length - 1);
        else if (k === (rtl ? 'ArrowRight' : 'ArrowLeft')) j = Math.max(i - 1, 0);
        else if (k === 'Home') j = 0; else if (k === 'End') j = bars.length - 1; else return;
        e.preventDefault(); b.tabIndex = -1; bars[j].tabIndex = 0; bars[j].focus();
      };
    });
    row.querySelector('[data-more]').onclick = (e) => WH.menu(e.currentTarget, [
      { icon: 'pencil', label: tr('Edit', 'تعديل'), run: () => WH.drawer({ title: tr('Edit webhook', 'تعديل الويب هوك'), sub: esc(h.name), render: (api) => WH.webhookForm(api, h, { onSaved: render }) }) },
      { icon: 'send', label: tr('Send test event', 'إرسال حدث تجريبي'), run: () => openTest(h), disabled: !h.active },
      { icon: 'copy', label: tr('Copy URL', 'نسخ الرابط'), run: () => WH.copyText(h.url, tr('URL copied', 'تم نسخ الرابط')) }, '-',
      { icon: 'trash', label: tr('Delete', 'حذف'), danger: true, run: () => WH.askDelete(h) }]);
    row.querySelector('[data-test]')?.addEventListener('click', () => openTest(h));
    row.querySelector('[data-resend]')?.addEventListener('click', (e) => { const b = e.currentTarget; b.disabled = true; b.innerHTML = icon('clock', 'ic') + tr('Resending…', 'جارٍ الإرسال…'); setTimeout(() => { WH.toast(tr('Resent 6 events. Your endpoint still returns 500.', 'أُعيد إرسال 6 أحداث. ما زال خادمك يعيد 500.'), false); b.innerHTML = icon('retry', 'ic') + tr('Resend 6 failed', 'إعادة إرسال 6 فاشلة'); setTimeout(() => b.disabled = false, 30000); }, 900); });
  }
  function renderEmpty(body) {
    body.innerHTML = `<div class="setup"><div id="g"></div><aside class="side-note" aria-label="${tr('How webhooks work', 'كيف تعمل الويب هوك')}">
      <div class="note"><h3>${icon('code', 'ic')}${tr('What your server receives', 'ما يستقبله خادمك')}</h3><p>${tr('A JSON body with the event and its data, plus an x-kashier-signature header.', 'محتوى JSON بالحدث وبياناته، مع ترويسة x-kashier-signature.')}</p><pre class="code" tabindex="0" aria-label="${tr('Sample request body', 'نموذج محتوى الطلب')}">${WH.payloadFor({ event: 'pay', resource: 'TX-249893963', code: 200 })}</pre></div>
      <div class="note"><h3>${icon('key', 'ic')}${tr('Verify every request', 'تحقق من كل طلب')}</h3><ul><li>${tr('Payment events are signed with your', 'أحداث الدفع موقّعة بـ')} <a href="#">${tr('Payment API Key', 'مفتاح Payment API')}</a></li><li>${tr('Transfer events are signed with your Transfer API Key', 'أحداث التحويل موقّعة بمفتاح Transfer API')}</li></ul></div>
      <div class="note"><h3>${icon('retry', 'ic')}${tr('How to answer', 'كيف تجيب')}</h3><ul><li>${tr('Return HTTP 200 within 30 seconds, before any slow work.', 'أعد HTTP 200 خلال 30 ثانية قبل أي عمل بطيء.')}</li><li>${tr('Return 409 for events you already handled.', 'أعد 409 لما عالجته سابقًا.')}</li><li>${tr('Anything else is retried up to 10 times over about 2 days.', 'غير ذلك يُعاد حتى 10 مرات خلال يومين تقريبًا.')}</li></ul></div></aside></div>`;
    usecaseInline(body.querySelector('#g'), { onDone: (m) => { WH.toast(live()); render(); setTimeout(() => openTest(m), 250); } });
  }
  function openRec(rec, h) { WH.drawer({ size: 'md', title: `${WH.EV[rec.event].label} · <span class="mono" dir="ltr">${esc(rec.resource)}</span>`, sub: `${esc(h.name)} · ${WH.stamp(rec.at)}`, render: (api) => api.body.append(WH.deliveryDetail(rec, h)) }); }
  function openTest(h) {
    WH.drawer({ size: 'md', title: tr('Send a test event', 'إرسال حدث تجريبي'), sub: esc(h.name), render(api) {
      api.body.innerHTML = `<p style="margin:0;color:var(--cadet-base)">${tr('Kashier sends a signed sample payment to your URL. It\'s marked as a test in your deliveries.', 'يرسل كاشير دفعة نموذجية موقعة إلى رابطك. تُعلَّم كاختبار في عمليات التسليم.')}</p><dl class="dl"><dt>${tr('Sent to', 'يُرسل إلى')}</dt><dd class="mono" dir="ltr">${esc(h.url)}</dd></dl><div id="tres"></div>`;
      api.foot.innerHTML = `<span class="sp"></span><button type="button" class="btn btn-outline" data-c>${tr('Close', 'إغلاق')}</button><button type="button" class="btn btn-primary" data-s autofocus>${icon('send', 'ic')}${tr('Send test', 'إرسال اختبار')}</button>`;
      api.foot.querySelector('[data-c]').onclick = api.close;
      const s = api.foot.querySelector('[data-s]'); s.onclick = () => { WH.sendTest(h, api.body.querySelector('#tres')); s.innerHTML = icon('retry', 'ic') + tr('Send again', 'إرسال مرة أخرى'); };
    } });
  }

  page.render = render;
  window.WebhooksPage = {
    mount(host, { openAdd } = {}) { page.host = host; if (openAdd) page.openAdd = openAdd; WH.onChange(render); render(); },
    render, setup, guidedDrawer, usecase, usecaseDrawer, usecaseInline, CASES, newHook, modeSub, openTest, live
  };
})();
