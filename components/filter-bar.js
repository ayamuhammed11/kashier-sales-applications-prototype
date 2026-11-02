/* Kashier filter bar (B2) — styleguide tables.md §Filter bar.
 *
 *   const fb = KFilter.mount(hostEl, {
 *     fields: [ { key, type: 'multi'|'single'|'range'|'date', label, icon, options, hint, unit, def, group } ],
 *     groups: { key: label },            // optional, groups the "+ Add filter" list
 *     noun: ['payment', 'payments'],      // "Show 12 payments"
 *     count: (values) => n,               // live result count (also powers facet counts)
 *     onChange: (values, { live }) => {}, // live = edit inside an open popover
 *     onExport: () => {},                 // optional; renders Export at the end of the row
 *     url: 'r.',                          // optional; sync to the query string (string = key prefix)
 *     today: '2026-10-19'                 // optional; date pickers stop here
 *   });
 *   KFilter.matches(values, row, fields, get)   // generic predicate; get(row, key) → row's value
 *   KFilter.search(el, { placeholder, value, onSearch })   // topbar search (Balances 165:10934)
 *
 * Labels may be strings or { en, ar }. Options may be strings or { value, label }.
 */
(function () {
  const lang = () => (document.documentElement.lang === 'ar' ? 'ar' : 'en');
  const AR = () => lang() === 'ar';
  const tx = (o) => (o == null ? '' : typeof o === 'string' ? o : (o[lang()] || o.en || ''));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (n) => Number(n).toLocaleString('en');
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const S = {
    add: { en: 'Add filter', ar: 'إضافة تصفية' }, find: { en: 'Filter by…', ar: 'تصفية حسب…' }, clear: { en: 'Clear', ar: 'مسح' },
    clearAll: { en: 'Clear all', ar: 'مسح الكل' }, back: { en: 'Back', ar: 'رجوع' }, close: { en: 'Close', ar: 'إغلاق' },
    export: { en: 'Export', ar: 'تصدير' }, none: { en: 'No filter by that name', ar: 'لا يوجد حقل بهذا الاسم' },
    noRes: { en: 'No results — adjust filters', ar: 'لا توجد نتائج — عدّل التصفية' }, noOpts: { en: 'No matching options', ar: 'لا توجد نتائج' },
    search: { en: 'Search options', ar: 'ابحث' }, any: { en: 'Any', ar: 'الكل' }, min: { en: 'Min', ar: 'من' }, max: { en: 'Max', ar: 'إلى' },
    from: { en: 'From', ar: 'من' }, to: { en: 'To', ar: 'إلى' }, pick: { en: 'Pick a date', ar: 'اختر تاريخًا' }, pickEnd: { en: 'Now pick an end date', ar: 'اختر تاريخ النهاية' },
    prev: { en: 'Previous month', ar: 'الشهر السابق' }, next: { en: 'Next month', ar: 'الشهر التالي' }, filters: { en: 'Filters', ar: 'عوامل التصفية' },
    is: { en: ' is', ar: ':' }, or: { en: ' or ', ar: ' أو ' }
  };
  const s = (k) => tx(S[k]);
  const PRESETS = [
    ['today', { en: 'Today', ar: 'اليوم' }], ['yesterday', { en: 'Yesterday', ar: 'أمس' }], ['last7', { en: 'Last 7 days', ar: 'آخر 7 أيام' }],
    ['last30', { en: 'Last 30 days', ar: 'آخر 30 يومًا' }], ['thisMonth', { en: 'This month', ar: 'هذا الشهر' }], ['lastMonth', { en: 'Last month', ar: 'الشهر الماضي' }],
    ['last90', { en: 'Last 90 days', ar: 'آخر 90 يومًا' }], ['all', { en: 'All time', ar: 'كل الوقت' }]
  ];

  /* ---------- Heroicons (outline, verbatim) ---------- */
  const P = (d) => `<path stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`;
  const ICONS = {
    calendar: P('M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5'),
    check: P('M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'),
    card: P('M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z'),
    banknotes: P('M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z'),
    device: P('M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3'),
    link: P('M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244'),
    store: P('M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z'),
    wallet: P('M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3'),
    tag: P('M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z') + P('M6 6h.008v.008H6V6Z'),
    flag: P('M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5'),
    user: P('M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z'),
    arrows: P('M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5'),
    truck: P('M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12'),
    clock: P('M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'),
    chevron: P('m19.5 8.25-7.5 7.5-7.5-7.5'), right: P('m8.25 4.5 7.5 7.5-7.5 7.5'), left: P('M15.75 19.5 8.25 12l7.5-7.5'),
    x: P('M6 18 18 6M6 6l12 12'), search: P('m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'),
    upload: P('M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5'),
    tick: P('m4.5 12.75 6 6 9-13.5'), plus: P('M12 4.5v15m7.5-7.5h-15')
  };
  const icon = (n, cls = 'ic', sw = 1.5) => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" aria-hidden="true">${ICONS[n] || ICONS.check}</svg>`;
  const mir = (h) => h.replace('class="', 'class="mirror ');

  /* ---------- dates ---------- */
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const toD = (str) => new Date(str + 'T12:00:00');
  function presetRange(p, today) {
    const d = toD(today), a = toD(today);
    switch (p) {
      case 'today': return [iso(d), iso(d)];
      case 'yesterday': a.setDate(a.getDate() - 1); return [iso(a), iso(a)];
      case 'last7': a.setDate(a.getDate() - 6); return [iso(a), iso(d)];
      case 'last30': a.setDate(a.getDate() - 29); return [iso(a), iso(d)];
      case 'last90': a.setDate(a.getDate() - 89); return [iso(a), iso(d)];
      case 'thisMonth': a.setDate(1); return [iso(a), iso(d)];
      case 'lastMonth': return [iso(new Date(d.getFullYear(), d.getMonth() - 1, 1, 12)), iso(new Date(d.getFullYear(), d.getMonth(), 0, 12))];
      default: return [null, null];
    }
  }
  const LOC = () => (AR() ? 'ar-EG' : 'en-GB');
  const shortDate = (str) => str ? toD(str).toLocaleDateString(LOC(), { day: 'numeric', month: 'short' }) : '…';
  const longDate = (str) => str ? toD(str).toLocaleDateString(LOC(), { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  /* ---------- value model ---------- */
  const norm = (f) => { f.options = (f.options || []).map(o => typeof o === 'string' ? { value: o, label: o } : o); return f; };
  const optLabel = (f, v) => { const o = f.options.find(x => x.value === v); return o ? tx(o.label) : v; };
  const emptyVal = (f) => f.type === 'multi' ? [] : f.type === 'range' ? { min: null, max: null } : f.type === 'date' ? { preset: f.def || 'all' } : '';
  function isActive(f, v) {
    if (f.type === 'multi') return v.length > 0;
    if (f.type === 'range') return v.min != null || v.max != null;
    if (f.type === 'date') return v.from || v.to ? true : v.preset !== (f.def || 'all');
    return !!v;
  }
  const hasValue = (f, v) => f.type === 'date' ? !!(v.from || v.to || v.preset !== 'all') : isActive(f, v);
  function summary(f, v, today) {
    if (f.type === 'multi') return v.length ? (v.length === 1 ? optLabel(f, v[0]) : `${optLabel(f, v[0])} +${v.length - 1}`) : '';
    if (f.type === 'single') return v ? optLabel(f, v) : '';
    if (f.type === 'range') {
      const u = f.unit ? f.unit + ' ' : '';
      if (v.min != null && v.max != null) return `${u}${fmt(v.min)} – ${fmt(v.max)}`;
      if (v.min != null) return `${u}≥ ${fmt(v.min)}`;
      if (v.max != null) return `${u}≤ ${fmt(v.max)}`;
      return '';
    }
    if (f.type === 'date') {
      if (v.from || v.to) return `${shortDate(v.from)} – ${shortDate(v.to)}`;
      const p = PRESETS.find(x => x[0] === v.preset); return p ? tx(p[1]) : '';
    }
    return '';
  }
  const full = (f, v, today) => f.type === 'multi' ? v.map(x => optLabel(f, x)).join(', ') : summary(f, v, today);
  function phrase(f, v, today) {
    if (f.type === 'multi') {
      const L = v.map(x => optLabel(f, x));
      return L.length <= 2 ? L.join(s('or')) : `${L.slice(0, 2).join(', ')} +${L.length - 2}`;
    }
    return summary(f, v, today);
  }
  function matches(values, row, fields, get) {
    const today = matches.today || iso(new Date());
    for (const f of fields) {
      const v = values[f.key]; if (v == null) continue;
      const x = get(row, f.key);
      if (f.type === 'multi' && v.length && !(Array.isArray(x) ? x.some(y => v.includes(y)) : v.includes(x))) return false;   // list values (labels) match on any overlap
      if (f.type === 'single' && v && x !== v) return false;
      if (f.type === 'range') { if (v.min != null && Number(x) < v.min) return false; if (v.max != null && Number(x) > v.max) return false; }
      if (f.type === 'date') {
        const [a, b] = v.from || v.to ? [v.from, v.to] : presetRange(v.preset, f.today || today);
        if (a && x < a) return false; if (b && x > b) return false;
      }
    }
    return true;
  }

  /* ---------- popover singleton ---------- */
  let scrim, pop, anchor = null, onCloseCb = null;
  function ensurePop() {
    if (pop) return;
    scrim = document.createElement('div'); scrim.className = 'kf-scrim';
    pop = document.createElement('div'); pop.className = 'kf-pop'; pop.setAttribute('role', 'dialog');
    document.body.append(scrim, pop);
    scrim.onclick = () => closePop();
    addEventListener('resize', place); addEventListener('scroll', place, true);
    addEventListener('keydown', (e) => {
      if (!anchor) return;
      if (e.key === 'Escape') { e.stopPropagation(); closePop(); }
      if (e.key === 'Tab') {
        const f = [...pop.querySelectorAll('button, input')].filter(x => x.offsetParent !== null && !x.disabled);
        if (!f.length) return; const a = f[0], b = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { b.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === b) { a.focus(); e.preventDefault(); }
      }
    }, true);
  }
  function place() {
    if (!anchor || innerWidth < 768 || !document.contains(anchor)) return;
    pop.style.maxHeight = '';
    const r = anchor.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight, rtl = document.dir === 'rtl';
    let x = rtl ? r.right - w : r.left; x = Math.max(16, Math.min(x, innerWidth - w - 16));
    const below = innerHeight - r.bottom - 22, above = r.top - 22;
    let y = r.bottom + 6;
    if (h > below && below < 280 && above > below) { y = Math.max(16, r.top - Math.min(h, above) - 6); pop.style.maxHeight = Math.min(h, above) + 'px'; }
    else if (h > below) pop.style.maxHeight = Math.max(200, below) + 'px';
    pop.style.left = x + 'px'; pop.style.top = y + 'px';
  }
  // Not enough room under the trigger? Scroll the page up (80px kept above it) rather than squeezing the panel;
  // short pages borrow bottom room while the popover is open.
  function fit() {
    if (!anchor || innerWidth < 768 || !document.contains(anchor)) return place();
    pop.style.maxHeight = '';
    const r = anchor.getBoundingClientRect(), need = pop.offsetHeight, below = innerHeight - r.bottom - 22;
    if (need > below) {
      const d = Math.min(need - below, r.top - 80);
      if (d > 0) { const room = document.documentElement.scrollHeight - innerHeight - scrollY; if (d > room) document.body.style.paddingBottom = (d - room) + 'px'; scrollBy(0, d); }
    }
    place();
  }
  function openPop(a, title, render, onClose) {
    ensurePop(); closePop(true);
    anchor = a; onCloseCb = onClose;
    pop.className = 'kf-pop';
    pop.setAttribute('aria-label', title);
    pop.innerHTML = `<div class="ph"><h3>${esc(title)}</h3><button type="button" class="kf-ib" data-x aria-label="${s('close')}">${icon('x', 'ic-20')}</button></div><div class="pb"></div><div class="pf" hidden></div>`;
    pop.querySelector('[data-x]').onclick = () => closePop();
    a.setAttribute('aria-expanded', 'true');
    scrim.classList.add('show'); pop.classList.add('show');
    if (innerWidth < 768) document.body.classList.add('kf-locked');
    render(pop.querySelector('.pb'), pop.querySelector('.pf'), pop);
    fit();
  }
  function closePop(silent) {
    if (!anchor) return;
    const a = anchor, cb = onCloseCb; anchor = null; onCloseCb = null;
    pop.classList.remove('show'); scrim.classList.remove('show'); document.body.classList.remove('kf-locked'); document.body.style.paddingBottom = '';
    a.setAttribute('aria-expanded', 'false');
    if (cb) cb();
    // the trigger may have been re-rendered while open (live apply): fall back to this bar's "+ Add filter"
    if (!silent) (document.contains(a) ? a : (a._kfHost && a._kfHost.querySelector('.kf-add')) || document.querySelector('.kf-add'))?.focus({ preventScroll: true });
  }

  /* ---------- field editors (multi / single / range) ---------- */
  function editor(f, value, onEdit, facet) {
    const el = document.createElement('div');
    let v = clone(value);
    const emit = () => onEdit(clone(v));
    if (f.type === 'multi' || f.type === 'single') {
      const multi = f.type === 'multi', searchable = f.options.length > 7, name = 'kf-' + f.key + Math.random().toString(36).slice(2, 6);
      el.innerHTML = (searchable ? `<label class="kf-os">${icon('search')}<input type="search" placeholder="${s('search')}" aria-label="${s('search')} – ${esc(tx(f.label))}"></label>` : '') + `<div role="group" aria-label="${esc(tx(f.label))}"></div>`;
      const box = el.lastElementChild;
      const draw = (q = '') => {
        const list = f.options.filter(o => tx(o.label).toLowerCase().includes(q.toLowerCase()));
        const all = multi ? list : [{ value: '', label: S.any }].concat(list);
        box.innerHTML = list.length ? all.map(o => {
          const on = multi ? v.includes(o.value) : v === o.value, n = facet && o.value ? facet(o.value) : null;
          return `<label class="kf-opt${n === 0 && !on ? ' zero' : ''}"><input type="${multi ? 'checkbox' : 'radio'}" name="${name}" value="${esc(o.value)}" ${on ? 'checked' : ''}><span class="box${multi ? '' : ' rd'}">${multi ? icon('tick', 'ic-14', 3) : ''}</span><span class="t">${esc(tx(o.label))}</span>${n != null ? `<span class="n">${fmt(n)}</span>` : ''}</label>`;
        }).join('') : `<div class="kf-none">${s('noOpts')}</div>`;
      };
      draw();
      box.addEventListener('change', (e) => {
        const o = e.target.value;
        if (multi) { v = e.target.checked ? [...v, o] : v.filter(x => x !== o); v = f.options.map(x => x.value).filter(x => v.includes(x)); } else v = o;
        emit();
      });
      const q = el.querySelector('.kf-os input'); if (q) q.addEventListener('input', () => draw(q.value));
    }
    if (f.type === 'range') {
      const u = f.unit || '', presets = f.presets || [[0, 500], [500, 2000], [2000, 10000], [10000, null]];
      el.innerHTML = `<div class="kf-range">
        <label>${s('min')}<span class="kf-inp"><input inputmode="numeric" data-k="min" placeholder="0" value="${v.min ?? ''}"><span class="u">${u}</span></span></label><span class="sep">–</span>
        <label>${s('max')}<span class="kf-inp"><input inputmode="numeric" data-k="max" placeholder="${s('any')}" value="${v.max ?? ''}"><span class="u">${u}</span></span></label></div>
        <div class="kf-seg">${presets.map(([a, b]) => `<button type="button" data-a="${a}" data-b="${b ?? ''}" aria-pressed="${v.min === a && (v.max ?? '') === (b ?? '')}">${b == null ? fmt(a) + '+' : fmt(a) + '–' + fmt(b)}</button>`).join('')}</div>`;
      el.querySelectorAll('input').forEach(i => i.addEventListener('input', () => {
        i.value = i.value.replace(/[^\d]/g, ''); v[i.dataset.k] = i.value === '' ? null : +i.value;
        el.querySelectorAll('.kf-seg button').forEach(b => b.setAttribute('aria-pressed', 'false')); emit();
      }));
      el.querySelectorAll('.kf-seg button').forEach(b => b.onclick = () => {
        v = { min: +b.dataset.a, max: b.dataset.b === '' ? null : +b.dataset.b };
        el.querySelector('[data-k=min]').value = v.min; el.querySelector('[data-k=max]').value = v.max ?? '';
        el.querySelectorAll('.kf-seg button').forEach(x => x.setAttribute('aria-pressed', x === b)); emit();
      });
    }
    return el;
  }

  /* ---------- date range picker: presets + one-month calendar ---------- */
  function datePicker(f, value, onEdit, today) {
    const el = document.createElement('div');
    let v = clone(value), pending = null;
    const rng = () => pending ? [pending, null] : (v.from || v.to ? [v.from, v.to] : presetRange(v.preset, today));
    const [a0, b0] = rng(); const base = toD(b0 || a0 || today);
    let vy = base.getFullYear(), vm = base.getMonth();
    const wk = Array.from({ length: 7 }, (_, i) => new Date(2026, 9, 17 + i, 12).toLocaleDateString(LOC(), { weekday: 'narrow' })); // Sat → Fri
    const T = toD(today);
    const draw = () => {
      const [a, b] = rng(), cur = pending || v.from || v.to ? 'custom' : v.preset;
      const first = new Date(vy, vm, 1, 12), lead = (first.getDay() + 1) % 7, days = new Date(vy, vm + 1, 0).getDate();
      const atMax = vy > T.getFullYear() || (vy === T.getFullYear() && vm >= T.getMonth());
      let cells = '';
      for (let i = 0; i < lead; i++) cells += '<span class="d out" aria-hidden="true"></span>';
      for (let d = 1; d <= days; d++) {
        const str = iso(new Date(vy, vm, d, 12));
        const cls = ['d', a && b && str > a && str < b ? 'in' : '', str === a ? 's' : '', str === b || (str === a && !b) ? 'e' : '', str === today ? 'today' : ''].join(' ');
        cells += `<button type="button" class="${cls}" data-d="${str}" ${str > today ? 'disabled' : ''} aria-label="${longDate(str)}" aria-pressed="${str === a || str === b}"><span>${d.toLocaleString(LOC())}</span></button>`;
      }
      el.innerHTML = `<div class="kf-dp">
        <div class="kf-dp-pre" role="group" aria-label="${esc(tx(f.label))}">${PRESETS.map(([k, l]) => `<button type="button" data-p="${k}" aria-pressed="${cur === k}">${esc(tx(l))}</button>`).join('')}</div>
        <div class="kf-dp-cal">
          <div class="kf-dp-sel"><div class="f${pending ? '' : ' act'}"><span>${s('from')}</span><b class="${a ? '' : 'ph'}">${a ? longDate(a) : s('pick')}</b></div><span class="arr">${mir(icon('right'))}</span><div class="f${pending ? ' act' : ''}"><span>${s('to')}</span><b class="${b ? '' : 'ph'}">${b ? longDate(b) : s('pick')}</b></div></div>
          <div class="kf-dp-h"><button type="button" data-m="-1" aria-label="${s('prev')}">${mir(icon('left', 'ic', 2))}</button><b aria-live="polite">${first.toLocaleDateString(LOC(), { month: 'long', year: 'numeric' })}</b><button type="button" data-m="1" aria-label="${s('next')}" ${atMax ? 'disabled' : ''}>${mir(icon('right', 'ic', 2))}</button></div>
          <div class="kf-dp-g" role="group">${wk.map(w => `<span class="wd" aria-hidden="true">${w}</span>`).join('')}${cells}</div>
          <div class="kf-dp-tip">${pending ? s('pickEnd') : ''}</div>
        </div></div>`;
      el.querySelectorAll('[data-p]').forEach(btn => btn.onclick = () => {
        pending = null; v = { preset: btn.dataset.p };
        const [, pb] = presetRange(v.preset, today); const d = toD(pb || today); vy = d.getFullYear(); vm = d.getMonth();
        draw(); onEdit(clone(v)); el.querySelector(`[data-p="${btn.dataset.p}"]`).focus();
      });
      el.querySelectorAll('[data-m]').forEach(btn => btn.onclick = () => { vm += +btn.dataset.m; if (vm < 0) { vm = 11; vy--; } if (vm > 11) { vm = 0; vy++; } draw(); el.querySelector(`[data-m="${btn.dataset.m}"]`)?.focus(); });
      el.querySelectorAll('[data-d]').forEach(btn => btn.onclick = () => {
        const d = btn.dataset.d;
        if (!pending) { pending = d; draw(); }
        else { const [x, y] = d < pending ? [d, pending] : [pending, d]; pending = null; v = { from: x, to: y }; draw(); onEdit(clone(v)); }
        el.querySelector(`[data-d="${d}"]`)?.focus();
      });
    };
    draw();
    return el;
  }

  /* ---------- mount ---------- */
  function mount(host, cfg) {
    const F = cfg.fields.map(norm), byKey = Object.fromEntries(F.map(f => [f.key, f]));
    const today = cfg.today || iso(new Date()); F.forEach(f => f.today = today); matches.today = today;
    const groups = cfg.groups ? [...new Set(F.map(f => f.group))] : [null];
    const prefix = typeof cfg.url === 'string' ? cfg.url : '';
    const values = {};
    const qs = new URLSearchParams(location.search);
    F.forEach(f => {
      let v = emptyVal(f); const raw = cfg.url ? qs.get(prefix + f.key) : null;
      if (raw != null) {
        const ok = (x) => f.options.some(o => o.value === x);
        if (f.type === 'multi') v = raw.split('|').filter(ok);
        else if (f.type === 'single') v = ok(raw) ? raw : '';
        else if (f.type === 'range') { const [a, b] = raw.split('~'); v = { min: a ? +a : null, max: b ? +b : null }; }
        else if (f.type === 'date') v = raw.includes('~') ? { from: raw.split('~')[0] || null, to: raw.split('~')[1] || null } : { preset: raw };
      }
      if (cfg.initial && cfg.initial[f.key] !== undefined && raw == null) v = clone(cfg.initial[f.key]);
      values[f.key] = v;
    });
    const nounFor = (n) => { const nn = tx(cfg.noun) || cfg.noun; return Array.isArray(nn) ? (n === 1 ? nn[0] : nn[1]) : (nn || ''); };
    const showLabel = (n) => n ? (AR() ? `عرض ${fmt(n)} ${nounFor(n)}` : `Show ${fmt(n)} ${nounFor(n)}`) : s('noRes');
    const activeCount = () => F.filter(f => isActive(f, values[f.key])).length;

    function sync() {
      if (!cfg.url) return;
      const p = new URLSearchParams(location.search);
      F.forEach(f => {
        const v = values[f.key], k = prefix + f.key;
        if (!isActive(f, v)) { p.delete(k); return; }
        p.set(k, f.type === 'multi' ? v.join('|') : f.type === 'range' ? `${v.min ?? ''}~${v.max ?? ''}` : f.type === 'date' ? (v.from || v.to ? `${v.from || ''}~${v.to || ''}` : v.preset) : v);
      });
      const q = p.toString(); history.replaceState(null, '', q ? '?' + q : location.pathname);
    }
    function commit(live) { sync(); draw(); cfg.onChange && cfg.onChange(clone(values), { live: !!live }); }
    function set(key, v, live) { values[key] = clone(v); commit(live); }
    function clear(key, live) { values[key] = emptyVal(byKey[key]); commit(live); }
    function clearAll() { F.forEach(f => values[f.key] = emptyVal(f)); commit(false); }
    const count = (vals) => cfg.count ? cfg.count(vals) : null;

    /* field popover body */
    function fieldBody(f, body, foot, popEl, onBack) {
      popEl.classList.remove('menu'); popEl.classList.toggle('date', f.type === 'date');
      const slim = f.type === 'date';
      body.innerHTML = (slim && !onBack ? '' : `<div class="kf-eh">${onBack ? `<button type="button" class="kf-ib" data-back aria-label="${s('back')}">${mir(icon('left', 'ic-20'))}</button>` : ''}<div class="tt"><h4>${esc(tx(f.label))}</h4>${f.hint ? `<p>${esc(tx(f.hint))}</p>` : ''}</div><button type="button" class="clr" ${isActive(f, values[f.key]) && !slim ? '' : 'hidden'}>${s('clear')}</button></div>`) + `<div class="kf-eb${slim ? ' slim' : ''}"></div>`;
      const clr = body.querySelector('.clr') || document.createElement('button');
      const drawFoot = () => {
        if (!cfg.count) { foot.hidden = true; return; }
        foot.hidden = false;
        foot.innerHTML = `<button type="button" class="kf-btn" data-done>${esc(showLabel(count(values)))}</button>`;
        foot.querySelector('[data-done]').onclick = () => closePop();
      };
      const onEdit = (nv) => { set(f.key, nv, true); clr.hidden = slim || !isActive(f, values[f.key]); drawFoot(); };
      const facet = cfg.count && (f.type === 'multi' || f.type === 'single') ? (opt) => count({ ...values, [f.key]: f.type === 'multi' ? [opt] : opt }) : null;
      const mountEd = () => { const eb = body.querySelector('.kf-eb'); eb.innerHTML = ''; eb.appendChild(f.type === 'date' ? datePicker(f, values[f.key], onEdit, today) : editor(f, values[f.key], onEdit, facet)); };
      clr.onclick = () => { clear(f.key, true); clr.hidden = true; mountEd(); drawFoot(); body.querySelector('.kf-eb input, .kf-eb button')?.focus(); };
      if (onBack) body.querySelector('[data-back]').onclick = onBack;
      mountEd(); drawFoot(); fit();
      setTimeout(() => body.querySelector('.kf-eb [aria-pressed="true"], .kf-eb input:not([type=checkbox]):not([type=radio]), .kf-eb input, .kf-eb button')?.focus());
    }
    function editAt(a, f, done) { a._kfHost = host; openPop(a, tx(f.label), (b, ft, p) => fieldBody(f, b, ft, p), done); }
    function openMenu(a) {
      a._kfHost = host;
      openPop(a, s('add'), (body, foot, popEl) => {
        let hl = 0, q = '';
        const list = () => F.filter(f => tx(f.label).toLowerCase().includes(q.toLowerCase()));
        const showMenu = () => {
          popEl.classList.remove('date'); popEl.classList.add('menu'); foot.innerHTML = ''; foot.hidden = true;
          body.innerHTML = `<label class="kf-ms">${icon('search')}<input type="text" placeholder="${s('find')}" aria-label="${s('find')}" role="combobox" aria-expanded="true" aria-controls="kf-ml" aria-autocomplete="list" value="${esc(q)}"></label><div class="kf-ml" id="kf-ml" role="listbox"></div>`;
          const inp = body.querySelector('input'), box = body.querySelector('.kf-ml');
          const drawList = () => {
            const items = list(); hl = Math.min(hl, Math.max(0, items.length - 1));
            if (!items.length) { box.innerHTML = `<div class="kf-none">${s('none')}</div>`; inp.removeAttribute('aria-activedescendant'); return; }
            const mark = (str) => q ? esc(str).replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'i'), '<mark>$1</mark>') : esc(str);
            box.innerHTML = groups.map(g => {
              const its = items.filter(f => g == null || f.group === g); if (!its.length) return '';
              return (g != null && groups.length > 1 && !q ? `<div class="g">${esc(tx(cfg.groups[g]))}</div>` : '') + its.map(f => {
                const i = items.indexOf(f);
                return `<button type="button" class="kf-mi${i === hl ? ' hl' : ''}${isActive(f, values[f.key]) ? ' on' : ''}" role="option" id="kf-mi-${f.key}" aria-selected="${i === hl}" data-k="${f.key}" tabindex="-1">${icon(f.icon)}<span class="l">${mark(tx(f.label))}</span>${hasValue(f, values[f.key]) ? `<span class="val">${esc(summary(f, values[f.key], today))}</span>` : ''}</button>`;
              }).join('');
            }).join('');
            inp.setAttribute('aria-activedescendant', 'kf-mi-' + items[hl].key);
            box.querySelectorAll('.kf-mi').forEach(b => {
              b.onclick = () => fieldBody(byKey[b.dataset.k], body, foot, popEl, showMenu);
              b.onmousemove = () => {
                const i = list().findIndex(f => f.key === b.dataset.k); if (i === hl) return; hl = i;
                box.querySelectorAll('.kf-mi').forEach(x => { const on = x === b; x.classList.toggle('hl', on); x.setAttribute('aria-selected', on); });
                inp.setAttribute('aria-activedescendant', b.id);
              };
            });
          };
          inp.addEventListener('input', () => { q = inp.value.trim(); hl = 0; drawList(); });
          inp.addEventListener('keydown', (e) => {
            const items = list(); if (!items.length) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); hl = (hl + 1) % items.length; drawList(); box.querySelector('.hl')?.scrollIntoView({ block: 'nearest' }); }
            if (e.key === 'ArrowUp') { e.preventDefault(); hl = (hl - 1 + items.length) % items.length; drawList(); box.querySelector('.hl')?.scrollIntoView({ block: 'nearest' }); }
            if (e.key === 'Enter') { e.preventDefault(); fieldBody(items[hl], body, foot, popEl, showMenu); }
          });
          drawList(); fit(); setTimeout(() => inp.focus());
        };
        showMenu();
      });
    }

    /* the row */
    host.classList.add('kf');
    host.innerHTML = `<div class="kf-bar" role="group" aria-label="${s('filters')}"></div>` +
      (cfg.onExport ? `<button type="button" class="kf-export" aria-label="${s('export')}">${icon('upload')}<span class="t">${s('export')}</span></button>` : '');
    const bar = host.querySelector('.kf-bar');
    if (cfg.onExport) host.querySelector('.kf-export').onclick = () => cfg.onExport(clone(values));
    let addBtn;
    function draw() {
      bar.innerHTML = '';
      F.filter(f => isActive(f, values[f.key]) || (f.type === 'date' && hasValue(f, values[f.key]))).forEach(f => {
        const v = values[f.key], act = isActive(f, v);
        const el = document.createElement('span'); el.className = 'kf-tok' + (act ? '' : ' def');
        el.innerHTML = `<button type="button" class="o" aria-haspopup="dialog" aria-expanded="false" title="${esc(tx(f.label) + ': ' + full(f, v, today))}">${icon(f.icon)}<span class="k">${esc(tx(f.label) + s('is'))}</span><span class="v">${esc(phrase(f, v, today))}</span></button>` +
          (act ? `<button type="button" class="x" aria-label="${s('clear')} ${esc(tx(f.label))}">${icon('x', 'ic-14', 2)}</button>` : `<span class="chev" aria-hidden="true">${icon('chevron', 'ic-14', 2)}</span>`);
        const o = el.querySelector('.o');
        o.onclick = () => { el.classList.add('open'); editAt(o, f, () => el.classList.remove('open')); };
        const x = el.querySelector('.x'); if (x) x.onclick = () => { clear(f.key); addBtn.focus(); };
        bar.appendChild(el);
      });
      addBtn = document.createElement('button'); addBtn.type = 'button'; addBtn.className = 'kf-add'; addBtn.setAttribute('aria-haspopup', 'dialog'); addBtn.setAttribute('aria-expanded', 'false');
      addBtn.innerHTML = `${icon('plus', 'ic', 2)}<span>${s('add')}</span>`;
      addBtn.onclick = () => openMenu(addBtn);
      bar.appendChild(addBtn);
      if (activeCount()) { const c = document.createElement('button'); c.type = 'button'; c.className = 'kf-clear'; c.textContent = s('clearAll'); c.onclick = () => { clearAll(); addBtn.focus(); }; bar.appendChild(c); }
    }
    draw();
    return {
      values: () => clone(values), set: (k, v) => set(k, v), clear: (k) => clear(k), clearAll,
      activeCount, fields: F, matches: (row, get) => matches(values, row, F, get), redraw: draw
    };
  }

  /* ---------- topbar search ---------- */
  function search(el, { placeholder, value = '', onSearch, delay = 200 }) {
    el.classList.add('kf-search'); el.setAttribute('role', 'search');
    el.innerHTML = `<input type="search" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}" value="${esc(value)}"><button type="button" class="kf-sx" aria-label="${s('clear')}">${icon('x', 'ic', 2)}</button><span class="kf-sgo" aria-hidden="true">${icon('search', 'ic-24', 2)}</span>`;
    const i = el.querySelector('input'); let tm;
    el.classList.toggle('filled', !!value);
    i.addEventListener('input', () => { el.classList.toggle('filled', !!i.value); clearTimeout(tm); tm = setTimeout(() => onSearch(i.value.trim()), delay); });
    el.querySelector('.kf-sx').onclick = (e) => { e.preventDefault(); i.value = ''; el.classList.remove('filled'); onSearch(''); i.focus(); };
    return i;
  }
  // a host's table re-settles (no skeleton) after a live edit
  const settle = (el) => { if (!el) return; el.classList.remove('kf-settle'); void el.offsetWidth; el.classList.add('kf-settle'); };

  window.KFilter = { mount, search, matches: (values, row, fields, get) => matches(values, row, fields.map(norm), get), settle, presetRange, iso };
})();
