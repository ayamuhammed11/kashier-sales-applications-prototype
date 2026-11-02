/* WebhookKit (components/webhooks.js): model + chrome for the Webhooks tab (webhooks.html) and its proposals.
   The model follows developers.kashier.io/docs/webhooks/manage: name, url, headers, events, mode, isActive;
   5 webhooks per mode; delivery records (pending / delivered / retrying / failed); resend (30 s cooldown); test send.
   Variants only decide the arrangement. */
(function () {
  const qs = new URLSearchParams(location.search);
  const lang = qs.get('lang') === 'ar' ? 'ar' : 'en';
  const AR = lang === 'ar';
  document.documentElement.lang = lang; document.documentElement.dir = AR ? 'rtl' : 'ltr';
  const tr = (en, ar) => AR && ar ? ar : en;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LOC = AR ? 'ar-EG' : 'en-GB';
  const fmt = (n) => Number(n).toLocaleString(LOC);

  /* ---------- Heroicons v2 outline 24, verbatim ---------- */
  const P = (d) => `<path stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`;
  const ICONS = {
    home: P('m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25'),
    arrows: P('M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5M21 16.5 16.5 21m0 0L12 16.5m4.5 4.5V7.5'),
    link: P('M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244'),
    store: P('M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z'),
    users: P('M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z'),
    device: P('M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3'),
    wallet: P('M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3'),
    shield: P('M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z'),
    puzzle: P('M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.548.183-3.087.291-4.61.29Z'),
    book: P('M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25'),
    chevron: P('m19.5 8.25-7.5 7.5-7.5-7.5'),
    right: P('m8.25 4.5 7.5 7.5-7.5 7.5'),
    left: P('M15.75 19.5 8.25 12l7.5-7.5'),
    arrowR: P('M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3'),
    x: P('M6 18 18 6M6 6l12 12'),
    search: P('m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'),
    plus: P('M12 4.5v15m7.5-7.5h-15'),
    menu: P('M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'),
    tick: P('m4.5 12.75 6 6 9-13.5'),
    check: P('M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'),
    xcircle: P('m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'),
    warn: P('M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'),
    info: P('m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z'),
    clock: P('M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'),
    dots: P('M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z'),
    pencil: P('m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10'),
    trash: P('m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0'),
    send: P('M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5'),
    retry: P('M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99'),
    copy: P('M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75'),
    bolt: P('m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z'),
    key: P('M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z'),
    code: P('M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5'),
    signal: P('M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z'),
    ext: P('M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25')
  };
  const icon = (n, cls = 'ic-16', sw = 1.5) => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" aria-hidden="true">${ICONS[n] || ''}</svg>`;

  /* ---------- Events (docs: subscribable values, exact casing) ---------- */
  const EVENT_GROUPS = [
    { key: 'tx', label: tr('Payments', 'المدفوعات'), hint: tr('Signed with your Payment API Key', 'موقعة بمفتاح Payment API') },
    { key: 'tr', label: tr('Transfers', 'التحويلات'), hint: tr('Signed with your Transfer API Key', 'موقعة بمفتاح Transfer API') }
  ];
  const EVENTS = [
    { key: 'pay', g: 'tx', label: tr('Payment', 'دفع'), desc: tr('Sent for successful and failed payments. Check data.status.', 'تُرسل للمدفوعات الناجحة والفاشلة. راجع data.status.') },
    { key: 'authorize', g: 'tx', label: tr('Authorization', 'تفويض'), desc: tr('Funds were held on the card.', 'تم حجز المبلغ على البطاقة.') },
    { key: 'capture', g: 'tx', label: tr('Capture', 'تحصيل'), desc: tr('Held funds were captured.', 'تم تحصيل المبلغ المحجوز.') },
    { key: 'refund', g: 'tx', label: tr('Refund', 'استرداد'), desc: tr('Full refunds only. Partial refunds are not sent.', 'الاسترداد الكامل فقط. لا يُرسل الاسترداد الجزئي.') },
    { key: 'void', g: 'tx', label: tr('Void', 'إلغاء'), desc: tr('A payment or authorization was cancelled.', 'تم إلغاء دفعة أو تفويض.') },
    { key: 'reversal', g: 'tx', label: tr('Reversal', 'عكس'), desc: tr('A payment was reversed.', 'تم عكس دفعة.') },
    { key: 'INITIATED', g: 'tr', label: tr('Initiated', 'بدأ'), desc: tr('A transfer was created.', 'تم إنشاء تحويل.') },
    { key: 'IN_TRANSIT', g: 'tr', label: tr('In transit', 'قيد التحويل'), desc: tr('The transfer is on its way.', 'التحويل في الطريق.') },
    { key: 'TRANSFERRED', g: 'tr', label: tr('Transferred', 'تم التحويل'), desc: tr('The money arrived.', 'وصل المبلغ.') },
    { key: 'FAILED', g: 'tr', label: tr('Failed', 'فشل'), desc: tr('The transfer could not be completed.', 'تعذّر إتمام التحويل.') }
  ];
  const EV = Object.fromEntries(EVENTS.map(e => [e.key, e]));
  const ALL = EVENTS.map(e => e.key);
  const evSummary = (keys) => {
    const tx = keys.filter(k => EV[k]?.g === 'tx').length, trn = keys.filter(k => EV[k]?.g === 'tr').length;
    if (keys.length === ALL.length) return tr('All events', 'كل الأحداث');
    const p = [];
    if (tx) p.push(tx === 6 ? tr('All payment events', 'كل أحداث الدفع') : tr(`${tx} payment`, `${fmt(tx)} دفع`));
    if (trn) p.push(trn === 4 ? tr('All transfer events', 'كل أحداث التحويل') : tr(`${trn} transfer`, `${fmt(trn)} تحويل`));
    return p.join(' · ');
  };

  /* ---------- Data ---------- */
  const NOW = new Date('2026-10-19T14:20:00');
  const ago = (min) => new Date(NOW - min * 60000);
  const seed = {
    live: [
      { id: 'wh_7d2a', name: 'Orders production', url: 'https://shop.example.com/kashier/webhook', events: ['pay', 'authorize', 'capture', 'refund', 'void', 'reversal'], headers: [['X-Shop-Token', 'shp_live_••••91c2']], channel: 'all', active: true, created: '2026-06-22', stats: { ok: 1284, fail: 3, retrying: 0, last: 2, lastCode: 200, rate: 99.8 } },
      { id: 'wh_41bf', name: 'Payouts ledger', url: 'https://erp.example.com/api/kashier/transfers', events: ['INITIATED', 'IN_TRANSIT', 'TRANSFERRED', 'FAILED'], headers: [['Authorization', 'Bearer ••••e7a0'], ['X-Env', 'production']], channel: 'all', active: true, created: '2026-08-03', stats: { ok: 212, fail: 6, retrying: 2, last: 14, lastCode: 500, rate: 81.3, failing: true } },
      { id: 'wh_0c91', name: 'Analytics sink', url: 'https://ingest.example.io/kashier', events: ['pay'], headers: [], channel: 'online', active: false, created: '2026-09-11', stats: { ok: 40, fail: 0, retrying: 0, last: 9000, lastCode: 200, rate: 100 } }
    ],
    test: [
      { id: 'wh_t11a', name: 'Legacy webhook', url: 'https://hooks.example.com/kashier', events: ALL.slice(), headers: [], channel: 'all', active: true, legacy: true, created: '2025-02-10', stats: { ok: 87, fail: 0, retrying: 0, last: 31, lastCode: 200, rate: 100 } },
      { id: 'wh_t22c', name: 'Staging orders', url: 'https://staging.shop.example.com/kashier/webhook', events: ['pay', 'refund', 'void'], headers: [['X-Env', 'staging']], channel: 'all', active: true, created: '2026-10-01', stats: { ok: 19, fail: 1, retrying: 0, last: 5, lastCode: 200, rate: 95 } }
    ]
  };
  const mode = qs.get('mode') === 'test' ? 'test' : 'live';
  const state = ['loaded', 'empty', 'loading', 'error'].includes(qs.get('state')) ? qs.get('state') : 'loaded';
  const KEY = 'wh-proto-' + mode;
  let hooks;
  try { hooks = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { hooks = null; }
  if (!Array.isArray(hooks)) hooks = JSON.parse(JSON.stringify(seed[mode]));
  hooks.forEach(h => { if (!h.channels) { h.channels = {}; h.events.forEach(k => { if (EV[k] && EV[k].g === 'tx') h.channels[k] = h.channel || 'all'; }); } delete h.channel; });
  if (state === 'empty') hooks = [];
  const save = () => { if (state === 'empty') return; try { sessionStorage.setItem(KEY, JSON.stringify(hooks)); } catch (e) { } };
  const LIMIT = 5;

  // deterministic pseudo-random
  const rnd = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; };
  function deliveries(wh, n = 24) {
    if (wh.stats.last == null) return []; // new webhook: no deliveries yet
    const r = rnd(wh.id), out = [];
    let t = wh.stats.last;
    for (let i = 0; i < n; i++) {
      const ev = wh.events[Math.floor(r() * wh.events.length)];
      const isTr = EV[ev].g === 'tr';
      let status = 'delivered', code = 200;
      if (wh.stats.failing) { if (i < 8) { status = i < 2 ? 'retrying' : 'failed'; code = i === 3 ? 0 : 500; } }
      else if (r() < (100 - wh.stats.rate) / 100) { status = 'failed'; code = r() < .5 ? 404 : 503; }
      const attempts = status === 'delivered' ? (r() < .1 ? 2 : 1) : status === 'retrying' ? 3 + Math.floor(r() * 3) : 11;
      const id = (isTr ? 'TRF-' : 'TX-') + (240000000 + Math.floor(r() * 9999999));
      out.push({ id: 'rec_' + wh.id.slice(3) + i, webhookId: wh.id, event: ev, resource: id, status, attempts, code, latency: 80 + Math.floor(r() * 400), at: ago(t), isTest: i === 9 });
      t += 6 + Math.floor(r() * 90);
    }
    return out;
  }
  const payloadFor = (rec) => {
    const isTr = EV[rec.event].g === 'tr';
    const o = isTr
      ? { event: rec.event, data: { transferId: rec.resource, amount: 1500, currency: 'EGP', status: rec.event, beneficiary: 'BEN-2231', signatureKeys: ['transferId', 'amount', 'currency', 'status'] } }
      : { event: rec.event, data: { transactionId: rec.resource, kashierOrderId: '9ad06b17-755b-4e21-9774-aff3e2726ac9', merchantOrderId: '1653481557813', amount: 250, currency: 'EGP', method: 'card', channel: 'online | e-commerce', status: rec.code === 0 ? 'FAILURE' : 'SUCCESS', signatureKeys: ['amount', 'channel', 'currency', 'kashierOrderId', 'merchantOrderId', 'method', 'status', 'transactionId'] } };
    return highlight(JSON.stringify(o, null, 2));
  };
  const highlight = (json) => esc(json).replace(/(&quot;[^&]*?&quot;)(\s*:)?|\b(\d+)\b/g, (m, s, colon, n) => s ? (colon ? `<span class="p">${s}</span>${colon}` : `<span class="s">${s}</span>`) : `<span class="n">${n}</span>`);

  const when = (d) => {
    const m = Math.round((NOW - d) / 60000);
    if (m < 1) return tr('Just now', 'الآن');
    if (m < 60) return tr(`${m} min ago`, `منذ ${fmt(m)} د`);
    if (m < 1440) return tr(`${Math.round(m / 60)} h ago`, `منذ ${fmt(Math.round(m / 60))} س`);
    return d.toLocaleDateString(LOC, { day: 'numeric', month: 'short' });
  };
  const stamp = (d) => d.toLocaleString(LOC, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const codeText = (c) => c === 0 ? tr('Timed out (30 s)', 'انتهت المهلة (30 ث)') : c + ' ' + ({ 200: 'OK', 404: 'Not Found', 500: 'Server Error', 503: 'Unavailable', 409: 'Conflict' }[c] || '');
  const STATUS = {
    delivered: { cls: 'ok', l: tr('Delivered', 'تم التسليم') },
    failed: { cls: 'bad', l: tr('Failed', 'فشل') },
    retrying: { cls: 'warn', l: tr('Retrying', 'إعادة المحاولة') },
    pending: { cls: 'neu', l: tr('Pending', 'قيد الانتظار') }
  };
  const chip = (s) => `<span class="sc ${STATUS[s].cls}">${STATUS[s].l}</span>`;
  const host = (u) => { try { return new URL(u).host; } catch (e) { return u; } };
  const path = (u) => { try { const x = new URL(u); return x.pathname + x.search; } catch (e) { return ''; } };

  /* ---------- URL validation (docs: public https only) ---------- */
  function validateUrl(v) {
    v = (v || '').trim();
    if (!v) return tr('Enter the URL Kashier should send events to.', 'أدخل الرابط الذي يرسل إليه كاشير الأحداث.');
    let u; try { u = new URL(v); } catch (e) { return tr('Enter a full URL, like https://shop.com/kashier/webhook', 'أدخل رابطًا كاملًا مثل https://shop.com/kashier/webhook'); }
    if (u.protocol !== 'https:') return tr('Use an https:// address. Kashier only sends to secure URLs.', 'استخدم رابط https://. يرسل كاشير إلى الروابط الآمنة فقط.');
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|\[?::1)/.test(u.hostname)) return tr('Kashier can\'t reach localhost or private addresses. Use a public URL.', 'لا يمكن لكاشير الوصول إلى العناوين المحلية أو الخاصة. استخدم رابطًا عامًا.');
    return '';
  }

  /* ---------- Shell ---------- */
  const keep = (extra) => { const p = new URLSearchParams(location.search); Object.entries(extra).forEach(([k, v]) => v == null ? p.delete(k) : p.set(k, v)); const s = p.toString(); return s ? '?' + s : location.pathname.split('/').pop(); };
  /* Prototype bar for webhooks.html: jump to the other directions, the add-flow pages and the data states.
     Review chrome, not product UI. */
  function protoBar() {
    const inP = location.pathname.includes('/webhooks-proposals/');
    const P = inP ? '' : 'webhooks-proposals/', R = inP ? '../' : '';
    const lq = AR ? '?lang=ar' : '';
    const states = [['loaded', 'Loaded'], ['empty', 'Empty'], ['loading', 'Loading'], ['error', 'Error']];
    return `<div class="proto" role="navigation" aria-label="Prototype controls"><b>Webhooks</b>
      <span class="grp"><a href="${R}webhooks.html${lq}" aria-current="page">Final</a><a href="${P}variant-a.html${lq}">A · Table + drawers</a><a href="${P}variant-b.html${lq}">B · Endpoint pages</a><a href="${P}variant-c.html${lq}">C · Health first (draft)</a></span>
      <span class="grp"><a href="${P}add-flows-compare.html">Compare add flows</a><a href="${P}add-flows.html${lq}">Try add flows</a></span>
      <span class="grp">${states.map(([k, l]) => `<a href="${keep({ state: k === 'loaded' ? null : k })}" ${state === k ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</span>
      <span class="sp"></span><button type="button" id="protoReset">Reset data</button><a href="${P}audit.html">Audit</a><a href="${keep({ lang: AR ? null : 'ar' })}">${AR ? 'English' : 'عربي'}</a></div>`;
  }

  /* shell({ proto }) — proto: optional prototype-bar HTML (proposal pages only; the product page passes none) */
  function shell({ proto = '' } = {}) {
    const nav = [
      [null, [['home', tr('Home', 'الرئيسية'), 'home.html'], ['arrows', tr('Payments', 'المدفوعات'), 'payments.html']]],
      [tr('Manage', 'الإدارة'), [['link', tr('Payment Links', 'روابط الدفع'), 'payment-links.html'], ['store', tr('Products', 'المنتجات'), '#'], ['users', tr('Customers', 'العملاء'), '#'], ['device', tr('Terminals', 'الأجهزة'), 'terminals.html']]],
      [tr('Balance', 'الرصيد'), [['wallet', tr('Transfers', 'التحويلات'), '#']]],
      [tr('Team', 'الفريق'), [['shield', tr('Roles', 'الأدوار'), '#'], ['users', tr('Users', 'المستخدمون'), '#']]],
      [tr('Developers', 'المطورون'), [['puzzle', tr('Integrations', 'التكاملات'), 'webhooks.html', true], ['book', tr('Docs', 'المستندات'), 'https://developers.kashier.io/']]]
    ];
    const base = location.pathname.includes('/webhooks-proposals/') ? '../' : '';
    document.body.insertAdjacentHTML('afterbegin', proto + `<div class="app">
      <aside class="sidebar" id="sidebar" aria-label="${tr('Main navigation', 'التنقل الرئيسي')}">
        <div class="merchant"><div class="logo">G</div><div><div class="nm">GEEK</div><span class="mid" dir="ltr">MID-957-917</span></div></div>
        <nav class="nav">${nav.map(([g, items]) => `<div class="nav-grp">${g ? `<p class="nav-lbl">${g}</p>` : ''}${items.map(([i, l, h, cur]) => `<a href="${h.startsWith('http') || h === '#' ? h : base + h}" ${cur ? 'aria-current="page"' : ''}>${icon(i, 'ic')}<span>${l}</span></a>`).join('')}</div>`).join('')}</nav>
      </aside><div class="nav-scrim" id="navScrim"></div>
      <div class="main-col">
        <header class="mbar"><button class="icon-btn" id="navOpen" aria-label="${tr('Open menu', 'فتح القائمة')}" aria-controls="sidebar" aria-expanded="false">${icon('menu', 'ic-24')}</button><span class="brand">kashier</span></header>
        <main class="container" id="main"><div class="wrap">
          <div class="tb"><h1>${tr('Integrations', 'التكاملات')}</h1><div class="tb-ctrls"><a class="lang-btn" href="${keep({ lang: AR ? null : 'ar' })}">${AR ? 'English' : 'عربي'}</a><span class="cur">EGP ${icon('chevron')}</span>
            <a class="modechip ${mode}" role="switch" aria-checked="${mode === 'live'}" aria-describedby="modeHint" href="${keep({ mode: mode === 'live' ? 'test' : null })}">${mode === 'live' ? tr('Live mode', 'الوضع المباشر') : tr('Test mode', 'وضع الاختبار')}<span class="trk"></span></a><span id="modeHint" class="sr-only">${tr('Switches between test and live data', 'التبديل بين بيانات الاختبار والمباشرة')}</span></div></div>
          <div class="mod">
            <p class="mod-intro">${tr('Keys and webhooks for connecting your systems to Kashier.', 'المفاتيح والويب هوك لربط أنظمتك بكاشير.')} <a href="https://developers.kashier.io/docs/webhooks" target="_blank" rel="noopener">${tr('Developer docs', 'مستندات المطورين')}</a></p>
            <nav class="mtabs" aria-label="${tr('Integrations sections', 'أقسام التكاملات')}"><a href="#">${tr('Payment API Keys', 'مفاتيح Payment API')}</a><a href="#">${tr('Secret Keys', 'المفاتيح السرية')}</a><a href="#" aria-current="page">${tr('Webhooks', 'الويب هوك')}</a><a href="#">${tr('Help', 'المساعدة')}</a></nav>
            <section id="whHost" aria-live="polite"></section>
          </div>
        </div></main>
      </div></div>`);
    const sb = document.getElementById('sidebar'), ns = document.getElementById('navScrim'), no = document.getElementById('navOpen');
    no.onclick = () => { sb.classList.add('open'); ns.classList.add('show'); no.setAttribute('aria-expanded', 'true'); };
    ns.onclick = () => { sb.classList.remove('open'); ns.classList.remove('show'); no.setAttribute('aria-expanded', 'false'); };
    // the prototype bar wraps on narrower screens: keep the sticky sidebar just below its real height
    const pb = document.querySelector('body > .proto');
    if (pb && 'ResizeObserver' in window) new ResizeObserver(() => document.body.style.setProperty('--proto-h', pb.offsetHeight + 'px')).observe(pb);
    document.getElementById('protoReset')?.addEventListener('click', () => { try { sessionStorage.removeItem('wh-proto-live'); sessionStorage.removeItem('wh-proto-test'); } catch (e) { } location.reload(); });
    return document.getElementById('whHost');
  }

  /* ---------- Overlays ---------- */
  let lastFocus = null;
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
  function trap(el, e) {
    if (e.key !== 'Tab') return;
    const f = [...el.querySelectorAll(FOCUSABLE)].filter(x => x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
  function drawer({ size = 'lg', title, sub = '', render, onClose }) {
    closeMenu();
    lastFocus = document.activeElement;
    const scrim = document.createElement('div'); scrim.className = 'd-scrim';
    const d = document.createElement('div'); d.className = 'drawer ' + size; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'dTitle');
    d.innerHTML = `<div class="dh"><div class="tt"><h2 id="dTitle">${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div><button type="button" class="icon-btn" data-close aria-label="${tr('Close', 'إغلاق')}">${icon('x', 'ic-20')}</button></div><div class="db"></div><div class="df"></div>`;
    document.body.append(scrim, d); document.body.classList.add('locked');
    const api = {
      el: d, body: d.querySelector('.db'), foot: d.querySelector('.df'),
      setTitle(t, s) { d.querySelector('#dTitle').innerHTML = t; const p = d.querySelector('.dh p'); if (p) p.innerHTML = s || ''; },
      close() { scrim.remove(); d.remove(); document.removeEventListener('keydown', key); if (!document.querySelector('.drawer')) document.body.classList.remove('locked'); onClose && onClose(); const lf = lastFocus; setTimeout(() => { const t = lf && lf.isConnected ? lf : (document.getElementById('addBtn') || document.querySelector('#whHost h2')); if (t) { if (!t.matches(FOCUSABLE)) t.tabIndex = -1; t.focus(); } }); }
    };
    const key = (e) => { if (document.querySelector('.modal')) return; if (e.key === 'Escape') api.close(); else trap(d, e); };
    document.addEventListener('keydown', key);
    scrim.onclick = api.close; d.querySelector('[data-close]').onclick = api.close;
    render(api);
    if (!api.foot.innerHTML.trim()) api.foot.remove();
    setTimeout(() => (d.querySelector('[autofocus]') || d.querySelector('.db ' + FOCUSABLE.split(',').join(', .db ')) || d.querySelector('[data-close]')).focus());
    return api;
  }
  function confirm({ title, body, ok, danger }) {
    return new Promise((res) => {
      const prev = document.activeElement;
      const s = document.createElement('div'); s.className = 'm-scrim';
      const m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', 'alertdialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'mT'); m.setAttribute('aria-describedby', 'mB');
      m.innerHTML = `<h2 id="mT">${title}</h2><p id="mB">${body}</p><div class="acts"><button type="button" class="btn btn-outline" data-n>${tr('Cancel', 'إلغاء')}</button><button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-y>${ok}</button></div>`;
      document.body.append(s, m); document.body.classList.add('locked');
      const done = (v) => { s.remove(); m.remove(); document.removeEventListener('keydown', k, true); if (!document.querySelector('.drawer')) document.body.classList.remove('locked'); setTimeout(() => { const t = prev && prev.isConnected ? prev : (document.getElementById('addBtn') || document.querySelector('#whHost h2')); if (t) { if (!t.matches(FOCUSABLE)) t.tabIndex = -1; t.focus(); } }); res(v); };
      const k = (e) => { if (e.key === 'Escape') { e.stopPropagation(); done(false); } else trap(m, e); };
      document.addEventListener('keydown', k, true);
      s.onclick = () => done(false); m.querySelector('[data-n]').onclick = () => done(false); m.querySelector('[data-y]').onclick = () => done(true);
      m.querySelector('[data-n]').focus();
    });
  }
  let menuEl = null, menuBtn = null;
  function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; menuBtn && menuBtn.setAttribute('aria-expanded', 'false'); document.removeEventListener('mousedown', outside); } }
  const outside = (e) => { if (menuEl && !menuEl.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) closeMenu(); };
  function menu(btn, items) {
    if (menuEl && menuBtn === btn) return closeMenu();
    closeMenu(); menuBtn = btn;
    menuEl = document.createElement('div'); menuEl.className = 'menu'; menuEl.setAttribute('role', 'menu');
    menuEl.innerHTML = items.map((it, i) => it === '-' ? '<hr>' : `<button type="button" role="menuitem" data-i="${i}" class="${it.danger ? 'danger' : ''}" ${it.disabled ? 'disabled' : ''}>${icon(it.icon)}${it.label}</button>`).join('');
    document.body.append(menuEl);
    const r = btn.getBoundingClientRect(), w = menuEl.offsetWidth, h = menuEl.offsetHeight, rtl = document.dir === 'rtl';
    let x = rtl ? r.left : r.right - w; x = Math.max(8, Math.min(x, innerWidth - w - 8));
    let y = r.bottom + 4; if (y + h > innerHeight - 8) y = r.top - h - 4;
    menuEl.style.left = x + 'px'; menuEl.style.top = y + 'px';
    btn.setAttribute('aria-expanded', 'true');
    menuEl.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const it = items[+b.dataset.i]; closeMenu(); it.run(); });
    const bs = [...menuEl.querySelectorAll('button')]; bs[0].focus();
    menuEl.addEventListener('keydown', (e) => {
      const i = bs.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); bs[(i + 1) % bs.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); bs[(i - 1 + bs.length) % bs.length].focus(); }
      if (e.key === 'Escape' || e.key === 'Tab') { closeMenu(); btn.focus(); }
    });
    setTimeout(() => document.addEventListener('mousedown', outside));
  }
  let toastT;
  function toast(msg, ok = true) {
    document.querySelector('.toast')?.remove(); clearTimeout(toastT);
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
    t.innerHTML = icon(ok ? 'check' : 'warn', 'ic-20') + `<span>${msg}</span>`;
    document.body.append(t); toastT = setTimeout(() => t.remove(), 3600);
  }
  async function copyText(s, label) { try { await navigator.clipboard.writeText(s); } catch (e) { } toast(label || tr('Copied', 'تم النسخ')); }

  /* ---------- Building blocks ---------- */
  function switchBtn(on, label, onChange) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'sw'; b.setAttribute('role', 'switch'); b.setAttribute('aria-checked', on); b.setAttribute('aria-label', label);
    b.onclick = (e) => { e.stopPropagation(); const v = b.getAttribute('aria-checked') !== 'true'; b.setAttribute('aria-checked', v); onChange && onChange(v, b); };
    return b;
  }
  /* Channel is per payment event (as on staging): All / Online / POS. It appears only once the event is ticked,
     so there are no idle radio groups. */
  const CH = [['all', tr('All channels', 'كل القنوات')], ['online', tr('Online', 'أونلاين')], ['pos', tr('POS', 'نقاط البيع')]];
  const CHL = Object.fromEntries(CH);
  function channelSeg(k, channels, onChange) {
    const el = document.createElement('div'); el.className = 'seg sm'; el.setAttribute('role', 'radiogroup'); el.setAttribute('aria-label', tr(`Channel for ${EV[k].label}`, `قناة ${EV[k].label}`));
    const draw = () => {
      const v = channels[k] || 'all';
      el.innerHTML = CH.map(([c, l]) => `<button type="button" role="radio" aria-checked="${v === c}" tabindex="${v === c ? 0 : -1}" data-c="${c}">${l}</button>`).join('');
      const bs = [...el.querySelectorAll('button')];
      bs.forEach((b, i) => {
        b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); channels[k] = b.dataset.c; draw(); el.querySelector(`[data-c="${b.dataset.c}"]`).focus(); onChange && onChange(k, b.dataset.c); };
        b.onkeydown = (e) => { const rtl = document.dir === 'rtl'; const d = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 1, ArrowUp: -1 }[e.key]; if (d) { e.preventDefault(); bs[(i + d + bs.length) % bs.length].click(); } };
      });
    };
    draw();
    return el;
  }
  // compact "channel per payment event" list, for flows that pick events without the full picker
  function channelList(keys, channels, onChange) {
    const tx = keys.filter(k => EV[k].g === 'tx');
    const el = document.createElement('div'); el.className = 'chl';
    if (!tx.length) { el.hidden = true; return el; }
    el.innerHTML = `<span class="chl-h">${tr('Channel per payment event', 'القناة لكل حدث دفع')}</span>` + tx.map(k => `<div class="chl-r"><span>${EV[k].label}</span><span data-seg="${k}"></span></div>`).join('');
    tx.forEach(k => el.querySelector(`[data-seg="${k}"]`).append(channelSeg(k, channels, onChange)));
    return el;
  }
  const chSummary = (h) => {
    const odd = h.events.filter(k => EV[k].g === 'tx' && h.channels && h.channels[k] && h.channels[k] !== 'all');
    return odd.map(k => `${EV[k].label}: ${CHL[h.channels[k]]}`).join(', ');
  };
  /* Event picker: a strict accordion (one group open at a time). Each group header has its own "Select all";
     a closed group summarises what's ticked so nothing is hidden. Ticked payment events show their channel
     (All / Online / POS) at the end of the row. { channels, open: 'tx' | 'tr' } */
  function eventPicker(selected, onChange, { channels = null, onChannel, open } = {}) {
    const sel = new Set(selected);
    const firstWith = EVENT_GROUPS.find(g => EVENTS.some(e => e.g === g.key && sel.has(e.key)));
    let openG = open || (firstWith ? firstWith.key : EVENT_GROUPS[0].key);
    const uid = 'ev' + Math.random().toString(36).slice(2, 7);
    const el = document.createElement('div'); el.className = 'acc';
    const sumOf = (its) => {
      const on = its.filter(e => sel.has(e.key));
      if (!on.length) return tr('None selected', 'لا شيء محدد');
      return on.map(e => e.label + (channels && e.g === 'tx' && channels[e.key] && channels[e.key] !== 'all' ? ` (${CHL[channels[e.key]]})` : '')).join(', ');
    };
    const draw = (focus) => {
      el.innerHTML = EVENT_GROUPS.map(g => {
        const its = EVENTS.filter(e => e.g === g.key), n = its.filter(e => sel.has(e.key)).length, isOpen = openG === g.key;
        return `<div class="acc-g${isOpen ? ' open' : ''}">
          <div class="acc-h"><button type="button" class="tg" aria-expanded="${isOpen}" aria-controls="${uid}-${g.key}" data-t="${g.key}">${icon('chevron', 'ic-16 chev')}<span class="nm">${g.label}</span><span class="cnt">${tr(`${n} of ${its.length}`, `${fmt(n)} من ${fmt(its.length)}`)}</span>${isOpen ? '' : `<span class="sum">${esc(sumOf(its))}</span>`}</button>
            <label class="all"><input type="checkbox" data-g="${g.key}" ${n === its.length ? 'checked' : ''}>${tr('Select all', 'تحديد الكل')}<span class="sr-only"> ${g.label}</span></label></div>
          <div class="acc-b" id="${uid}-${g.key}" role="group" aria-label="${g.label}" ${isOpen ? '' : 'hidden'}>${its.map(e => `<div class="evr${sel.has(e.key) ? ' on' : ''}"><label><input type="checkbox" value="${e.key}" ${sel.has(e.key) ? 'checked' : ''}><span class="t"><span class="l">${e.label} <code class="k" dir="ltr">${e.key}</code></span><span class="d">${e.desc}</span></span></label>${channels && e.g === 'tx' && sel.has(e.key) ? `<div class="evch" data-ch="${e.key}"></div>` : ''}</div>`).join('')}</div></div>`;
      }).join('');
      if (channels) el.querySelectorAll('[data-ch]').forEach(c => c.append(channelSeg(c.dataset.ch, channels, (k, v) => { onChannel && onChannel(k, v); })));
      el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { openG = openG === b.dataset.t ? null : b.dataset.t; draw(`[data-t="${b.dataset.t}"]`); });
      el.querySelectorAll('[data-g]').forEach(c => {
        const its = EVENTS.filter(e => e.g === c.dataset.g), n = its.filter(e => sel.has(e.key)).length;
        c.indeterminate = n > 0 && n < its.length;
        c.onchange = () => { its.forEach(e => c.checked ? sel.add(e.key) : sel.delete(e.key)); if (c.checked) openG = c.dataset.g; draw(`[data-g="${c.dataset.g}"]`); onChange([...sel]); };
      });
      el.querySelectorAll('.evr input').forEach(c => c.onchange = () => { c.checked ? sel.add(c.value) : sel.delete(c.value); draw(`.evr input[value="${c.value}"]`); onChange([...sel]); });
      if (focus) el.querySelector(focus)?.focus();
    };
    draw();
    el.openGroup = (g) => { openG = g; draw(); };
    return el;
  }
  function headersEditor(rows, onChange) {
    let data = rows.map(r => r.slice());
    const el = document.createElement('div'); el.className = 'hdrs';
    const draw = (focusLast) => {
      el.innerHTML = (data.length ? `<div class="hdrs-cols" aria-hidden="true"><span>${tr('Header name', 'اسم الترويسة')}</span><span>${tr('Value', 'القيمة')}</span><span></span></div>` : '') +
        data.map((r, i) => `<div class="hrow"><input class="inp" dir="ltr" data-i="${i}" data-c="0" value="${esc(r[0])}" placeholder="X-Shop-Token" aria-label="${tr('Header name', 'اسم الترويسة')} ${i + 1}"><input class="inp" dir="ltr" data-i="${i}" data-c="1" value="${esc(r[1])}" placeholder="${tr('Value', 'القيمة')}" aria-label="${tr('Value', 'القيمة')} ${i + 1}"><button type="button" class="icon-btn" data-rm="${i}" aria-label="${tr('Remove header', 'حذف الترويسة')} ${i + 1}">${icon('trash', 'ic')}</button></div>`).join('') +
        `<button type="button" class="btn btn-ghost addrow">${icon('plus', 'ic')}${tr('Add header', 'إضافة ترويسة')}</button>`;
      el.querySelectorAll('input').forEach(i => i.oninput = () => { data[+i.dataset.i][+i.dataset.c] = i.value; onChange(data.filter(r => r[0].trim())); });
      el.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { data.splice(+b.dataset.rm, 1); draw(); onChange(data.filter(r => r[0].trim())); el.querySelector('.addrow').focus(); });
      el.querySelector('.addrow').onclick = () => { data.push(['', '']); draw(true); };
      if (focusLast) el.querySelector(`[data-i="${data.length - 1}"][data-c="0"]`).focus();
    };
    draw();
    return el;
  }
  /* ---------- Create / edit form (drawer body) ---------- */
  function webhookForm(api, wh, { onSaved } = {}) {
    const isNew = !wh;
    const m = wh ? JSON.parse(JSON.stringify(wh)) : { id: 'wh_' + Math.random().toString(16).slice(2, 6), name: '', url: '', events: [], headers: [], channels: {}, active: true, created: '2026-10-19', stats: { ok: 0, fail: 0, retrying: 0, last: null, lastCode: null, rate: null } };
    const b = api.body;
    b.innerHTML = `
      <div class="dsec"><h3>${tr('Endpoint', 'نقطة الاستقبال')}</h3>
        <div class="fld"><label for="fName">${tr('Name', 'الاسم')}</label><input id="fName" class="inp" value="${esc(m.name)}" placeholder="${tr('e.g. Orders production', 'مثال: طلبات الإنتاج')}" ${isNew ? 'autofocus' : ''}><span class="hint">${tr('Only you see this. Use something that tells your webhooks apart.', 'يظهر لك فقط. اختر اسمًا يميز كل ويب هوك.')}</span><span class="ferr" id="eName"></span></div>
        <div class="fld"><label for="fUrl">${tr('Endpoint URL', 'رابط الاستقبال')}</label><input id="fUrl" class="inp" dir="ltr" inputmode="url" value="${esc(m.url)}" placeholder="https://shop.com/kashier/webhook"><span class="hint">${tr('A public https address. Kashier sends a POST request here for each event.', 'رابط https عام. يرسل كاشير طلب POST إليه لكل حدث.')}</span><span class="ferr" id="eUrl" role="alert"></span></div>
      </div>
      <div class="dsec"><h3>${tr('Events', 'الأحداث')}</h3><p class="sub">${tr('Pick only what your server handles. You can change this later.', 'اختر ما يعالجه خادمك فقط. يمكنك التغيير لاحقًا.')}</p><div id="fEv"></div><span class="ferr" id="eEv" role="alert"></span>
      </div>
      <div class="dsec"><h3>${tr('Custom headers', 'ترويسات مخصصة')} <span class="opt" style="font-weight:400;color:var(--muted-fg);font-size:14px">${tr('optional', 'اختياري')}</span></h3><p class="sub">${tr('Sent with every request, for example a token your server checks.', 'تُرسل مع كل طلب، مثل رمز يتحقق منه خادمك.')}</p><div id="fHd"></div></div>
      <div class="dsec"><div style="display:flex;align-items:center;gap:16px"><div style="flex:1"><h3 style="font-family:var(--font-body);font-size:16px">${tr('Active', 'مفعّل')}</h3><p class="sub" style="margin:2px 0 0;color:var(--muted-fg);font-size:12px">${tr('When off, Kashier stops sending events to this URL.', 'عند الإيقاف، يتوقف كاشير عن إرسال الأحداث لهذا الرابط.')}</p></div><span id="fAct"></span></div></div>`;
    m.channels = m.channels || {};
    b.querySelector('#fEv').append(eventPicker(m.events, (v) => { m.events = v; b.querySelector('#eEv').textContent = ''; }, { channels: m.channels }));
    b.querySelector('#fHd').append(headersEditor(m.headers, (v) => m.headers = v));
    b.querySelector('#fAct').append(switchBtn(m.active, tr('Active', 'مفعّل'), (v) => m.active = v));
    const name = b.querySelector('#fName'), url = b.querySelector('#fUrl');
    name.oninput = () => { m.name = name.value; name.classList.remove('err'); b.querySelector('#eName').textContent = ''; };
    url.oninput = () => { m.url = url.value.trim(); if (url.classList.contains('err')) { const e = validateUrl(m.url); url.classList.toggle('err', !!e); b.querySelector('#eUrl').innerHTML = e ? icon('warn') + e : ''; } };
    url.onblur = () => { if (!m.url) return; const e = validateUrl(m.url); url.classList.toggle('err', !!e); b.querySelector('#eUrl').innerHTML = e ? icon('warn') + e : ''; };
    api.foot.innerHTML = `${isNew ? '' : `<button type="button" class="btn btn-text-danger" data-del>${icon('trash', 'ic')}${tr('Delete', 'حذف')}</button>`}<span class="sp"></span><button type="button" class="btn btn-outline" data-cancel>${tr('Cancel', 'إلغاء')}</button><button type="button" class="btn btn-primary" data-save>${isNew ? tr('Create webhook', 'إنشاء ويب هوك') : tr('Save changes', 'حفظ التغييرات')}</button>`;
    api.foot.querySelector('[data-cancel]').onclick = api.close;
    api.foot.querySelector('[data-del]')?.addEventListener('click', async () => { if (await askDelete(wh)) { api.close(); } });
    api.foot.querySelector('[data-save]').onclick = () => {
      let first = null;
      if (!m.name.trim()) { name.classList.add('err'); b.querySelector('#eName').innerHTML = icon('warn') + tr('Give this webhook a name.', 'أدخل اسمًا لهذا الويب هوك.'); first = first || name; }
      const ue = validateUrl(m.url); if (ue) { url.classList.add('err'); b.querySelector('#eUrl').innerHTML = icon('warn') + ue; first = first || url; }
      if (!m.events.length) { b.querySelector('#eEv').innerHTML = icon('warn') + tr('Choose at least one event.', 'اختر حدثًا واحدًا على الأقل.'); first = first || b.querySelector('#fEv input'); }
      if (first) { first.focus(); return; }
      if (isNew) hooks.push(m); else hooks[hooks.findIndex(h => h.id === m.id)] = m;
      save(); api.close();
      toast(isNew ? tr('Webhook created. Send a test to check your endpoint.', 'تم إنشاء الويب هوك. أرسل اختبارًا للتحقق.') : tr('Changes saved', 'تم حفظ التغييرات'));
      onSaved && onSaved(m, isNew);
    };
  }
  let onChange = () => { };
  async function askDelete(wh) {
    const ok = await confirm({ title: tr(`Delete “${esc(wh.name)}”?`, `حذف «${esc(wh.name)}»؟`), body: tr('Kashier will stop sending events to this URL right away. Past deliveries stay in your records. This can\'t be undone.', 'سيتوقف كاشير عن الإرسال لهذا الرابط فورًا. تبقى عمليات التسليم السابقة في السجل. لا يمكن التراجع.'), ok: tr('Delete webhook', 'حذف الويب هوك'), danger: true });
    if (!ok) return false;
    hooks = hooks.filter(h => h.id !== wh.id); WH.hooks = hooks; save(); toast(tr('Webhook deleted', 'تم حذف الويب هوك')); onChange();
    return true;
  }
  function setActive(wh, v) { wh.active = v; save(); toast(v ? tr(`“${esc(wh.name)}” is on`, `تم تفعيل «${esc(wh.name)}»`) : tr(`“${esc(wh.name)}” is off. Events are no longer sent.`, `تم إيقاف «${esc(wh.name)}». لن تُرسل الأحداث.`)); }

  /* ---------- Test send (POST /v2/webhooks/:id/test) ---------- */
  function sendTest(wh, target) {
    const failing = wh.stats.failing;
    const out = { success: !failing, statusCode: failing ? 500 : 200, responseBody: failing ? 'Internal Server Error' : 'OK', latencyMs: failing ? 1204 : 184 };
    if (target) {
      target.innerHTML = `<div class="note" aria-live="polite"><h3>${icon('clock', 'ic')}${tr('Sending a test event…', 'جارٍ إرسال حدث تجريبي…')}</h3></div>`;
      setTimeout(() => {
        target.innerHTML = `<div class="note"><h3 style="color:${out.success ? 'var(--lemon-80)' : 'var(--destructive)'}">${icon(out.success ? 'check' : 'xcircle', 'ic')}${out.success ? tr('Your endpoint received the test', 'وصل الاختبار إلى خادمك') : tr('Your endpoint returned an error', 'أعاد خادمك خطأ')}</h3>
          <dl class="dl" style="font-size:13px"><dt>${tr('Response', 'الاستجابة')}</dt><dd class="mono">${out.statusCode} · ${esc(out.responseBody)}</dd><dt>${tr('Time', 'الوقت')}</dt><dd>${fmt(out.latencyMs)} ms</dd></dl>
          ${out.success ? `<p>${tr('Next: check that your server verified the x-kashier-signature header.', 'التالي: تأكد أن خادمك تحقق من ترويسة x-kashier-signature.')}</p>` : `<p>${tr('Kashier expects HTTP 200 (or 409 for events you already processed) within 30 seconds. Check your server logs, then send another test.', 'يتوقع كاشير HTTP 200 (أو 409 لما عالجته سابقًا) خلال 30 ثانية. راجع سجلات خادمك ثم أرسل اختبارًا آخر.')}</p>`}</div>`;
      }, 900);
    }
    return out;
  }

  /* ---------- Delivery detail (one record) ---------- */
  const cooldown = {};
  function deliveryDetail(rec, wh) {
    const el = document.createElement('div'); el.className = 'dsec'; el.style.gap = '20px';
    const atts = Array.from({ length: Math.min(rec.attempts, 6) }, (_, i) => {
      const last = i === rec.attempts - 1 || i === 5;
      const ok = rec.status === 'delivered' && last;
      return { n: i + 1, at: new Date(rec.at.getTime() + [0, 2, 12, 42, 102, 222][i] * 60000), code: ok ? 200 : rec.code || 500, ok };
    });
    const resendable = () => !cooldown[rec.id] || Date.now() - cooldown[rec.id] > 30000;
    el.innerHTML = `
      <dl class="dl"><dt>${tr('Status', 'الحالة')}</dt><dd>${chip(rec.status)}${rec.isTest ? ` <span class="sc neu">${tr('Test', 'اختبار')}</span>` : ''}</dd>
        <dt>${tr('Event', 'الحدث')}</dt><dd>${EV[rec.event].label} <code class="k" dir="ltr">${rec.event}</code></dd>
        <dt>${EV[rec.event].g === 'tr' ? tr('Transfer', 'التحويل') : tr('Transaction', 'المعاملة')}</dt><dd><a href="#" class="mono" dir="ltr">${esc(rec.resource)}</a></dd>
        <dt>${tr('Sent to', 'أُرسل إلى')}</dt><dd class="mono" dir="ltr">${esc(wh ? wh.url : '')}</dd>
        <dt>${tr('Attempts', 'المحاولات')}</dt><dd>${fmt(rec.attempts)}${rec.status === 'retrying' ? ' · ' + tr('next retry in 26 min', 'المحاولة التالية خلال 26 د') : rec.status === 'failed' && rec.attempts >= 11 ? ' · ' + tr('retries used up', 'انتهت المحاولات') : ''}</dd></dl>
      <div class="dsec"><h3>${tr('Attempts', 'المحاولات')}</h3>
        <ol class="atl">${atts.map(a => `<li><span class="dot ${a.ok ? 'ok' : 'bad'}"></span><span class="num">${stamp(a.at)}</span><span class="mono">${codeText(a.code)}</span></li>`).join('')}${rec.attempts > 6 ? `<li class="more">${tr(`+ ${rec.attempts - 6} more, every 4 hours`, `+ ${fmt(rec.attempts - 6)} أخرى كل 4 ساعات`)}</li>` : ''}</ol></div>
      <div class="dsec"><div style="display:flex;align-items:center;gap:8px"><h3 style="flex:1;font-family:var(--font-body);font-size:16px">${tr('Request body', 'محتوى الطلب')}</h3><button type="button" class="copy" data-copy>${icon('copy')}${tr('Copy', 'نسخ')}</button></div><pre class="code">${payloadFor(rec)}</pre></div>
      <div class="rsnd" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap"><button type="button" class="btn btn-outline" data-resend ${resendable() ? '' : 'disabled'}>${icon('retry', 'ic')}${tr('Resend', 'إعادة الإرسال')}</button><span class="muted" style="font-size:12px">${tr('Sends the original request again, with its original signature.', 'يعيد إرسال الطلب الأصلي بتوقيعه الأصلي.')}</span></div>`;
    el.querySelector('[data-copy]').onclick = () => copyText(el.querySelector('pre').textContent, tr('Request body copied', 'تم نسخ محتوى الطلب'));
    const rb = el.querySelector('[data-resend]');
    rb.onclick = () => {
      cooldown[rec.id] = Date.now(); rb.disabled = true;
      const ok = !(wh && wh.stats.failing);
      rb.innerHTML = icon('clock', 'ic') + tr('Resending…', 'جارٍ الإرسال…');
      setTimeout(() => { rb.innerHTML = icon('retry', 'ic') + tr('Resend', 'إعادة الإرسال'); toast(ok ? tr('Resent. Your endpoint returned 200.', 'تمت إعادة الإرسال. أعاد خادمك 200.') : tr('Resent, but your endpoint returned 500 again.', 'أُعيد الإرسال لكن خادمك أعاد 500 مجددًا.'), ok); setTimeout(() => rb.disabled = false, 30000); }, 800);
    };
    return el;
  }

  /* ---------- Shared state blocks ---------- */
  const skeletonRows = (n, cols) => Array.from({ length: n }, () => `<tr class="skel">${Array.from({ length: cols }, (_, i) => `<td><span style="width:${[60, 80, 50, 40, 30][i % 5]}%"></span></td>`).join('')}</tr>`).join('');
  const errorBlock = () => `<div class="errbox" role="alert"><div class="ei">${icon('warn', 'ic-24')}</div><h3>${tr('Couldn\'t load your webhooks', 'تعذّر تحميل الويب هوك')}</h3><p>${tr('Something went wrong on our side. Your webhooks are still sending events.', 'حدث خطأ من جهتنا. ما زالت الويب هوك ترسل الأحداث.')}</p><a class="btn btn-outline" href="${keep({ state: null })}">${icon('retry', 'ic')}${tr('Try again', 'حاول مرة أخرى')}</a></div>`;
  const usage = () => `<span class="usage">${mode === 'live' ? tr('Live', 'مباشر') : tr('Test', 'اختبار')}: ${tr(`${hooks.length} of ${LIMIT} used`, `${fmt(hooks.length)} من ${fmt(LIMIT)} مستخدمة`)}</span>`;

  window.WH = {
    lang, AR, tr, esc, fmt, icon, mode, state, LIMIT, EVENTS, EVENT_GROUPS, EV, ALL, evSummary,
    get hooks() { return hooks; }, set hooks(v) { hooks = v; },
    save, deliveries, payloadFor, when, stamp, codeText, chip, STATUS, host, path, validateUrl, keep,
    shell, protoBar, drawer, confirm, menu, closeMenu, toast, copyText, switchBtn, eventPicker, headersEditor, channelSeg, channelList, chSummary, CH,
    webhookForm, askDelete, setActive, sendTest, deliveryDetail, skeletonRows, errorBlock, usage,
    onChange(fn) { onChange = fn; }, NOW
  };
})();
