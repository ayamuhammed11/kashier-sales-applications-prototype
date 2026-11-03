/* Sales Applications directions: shared core.
   Data, rules and overlays follow the FIN-26379 stories (and the pricing logic of Aya's prototype),
   so A, B and C only differ in page structure and in how services are added. */
(function () {
  'use strict';

  /* ---------- Icons: verbatim Heroicons v2 outline paths ---------- */
  const P = d => `<path stroke-linecap="round" stroke-linejoin="round" d="${d}"/>`;
  const ICONS = {
    home: P('m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25'),
    users: P('M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z'),
    card: P('M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z'),
    banknotes: P('M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z'),
    store: P('M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z'),
    tag: P('M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z'),
    key: P('M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z'),
    device: P('M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3'),
    arrows: P('M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5M21 16.5 16.5 21m0 0L12 16.5m4.5 4.5V7.5'),
    send: P('M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5'),
    book: P('M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25'),
    wallet: P('M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3'),
    user: P('M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z'),
    upload: P('M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5'),
    link: P('M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244'),
    shield: P('M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z'),
    flag: P('M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5'),
    chevron: P('m19.5 8.25-7.5 7.5-7.5-7.5'),
    right: P('m8.25 4.5 7.5 7.5-7.5 7.5'),
    left: P('M15.75 19.5 8.25 12l7.5-7.5'),
    arrowR: P('M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3'),
    x: P('M6 18 18 6M6 6l12 12'),
    search: P('m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'),
    plus: P('M12 4.5v15m7.5-7.5h-15'),
    menu: P('M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'),
    tick: P('m4.5 12.75 6 6 9-13.5'),
    xcircle: P('m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'),
    check: P('M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'),
    warn: P('M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'),
    info: P('m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z'),
    clock: P('M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'),
    dots: P('M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z'),
    pencil: P('m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10'),
    trash: P('m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0'),
    retry: P('M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99'),
    ext: P('M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25'),
    download: P('M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3'),
    doc: P('M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z'),
    eye: P('M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z') + P('M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'),
    bolt: P('m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z'),
    help: P('M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z'),
    bell: P('M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0')
  };
  ICONS.cog = P('M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z') + P('M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z');
  const icon = (n, cls = 'ic-16', sw = 1.5) => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const round2 = v => Math.round(v * 100) / 100;
  const fmtN = v => (v === '' || v == null) ? '' : String(round2(Number(v)));

  /* ---------- Reference data ---------- */
  const ENTITIES = ['Individual Seller', 'Registered Business', 'Professional Business'];
  const OWNERS = ['Egyptian Owner', 'Foreign Owner'];
  const INDUSTRIES = ['Automotive', 'Education', 'Entertainment & Media', 'Fashion & Beauty', 'Financial Services', 'Food & Beverage',
    'Healthcare / Pharmacy', 'Insurance', 'Logistics & Delivery', 'Marketplace', 'Non-profit / NGO', 'Professional Services',
    'Real Estate', 'Retail & E-commerce', 'Technology / SaaS', 'Travel & Tourism'];
  const CHANNELS = ['Online', 'POS'];
  const SVC_NAMES = ['Card', 'Wallet', 'Valu', 'OCTO', 'Souhoola', 'Contact', 'Basata', 'Mogo', 'Tru', 'Forsa', 'Aman', 'Bank Installments', 'Instapay'];
  const SVC_HINT = { Card: 'Visa, Mastercard and Meeza', Wallet: 'Mobile wallets', Valu: 'Buy now, pay later', OCTO: 'Buy now, pay later', Souhoola: 'Consumer finance',
    Contact: 'Consumer finance', Basata: 'Cash collection', Mogo: 'Consumer finance', Tru: 'Buy now, pay later', Forsa: 'Consumer finance',
    Aman: 'Cash collection', 'Bank Installments': 'Card installments with banks', Instapay: 'Instant bank transfer' };
  const SERVICES = [].concat(...CHANNELS.map(ch => SVC_NAMES.map(n => ch + ' ' + n)));
  const BANKS = ['Bank Misr', 'National Bank of Egypt'];
  const chOf = id => id.split(' ')[0];
  const nmOf = id => id.slice(id.indexOf(' ') + 1);
  const label = id => `${nmOf(id)} (${chOf(id)})`;
  const isCard = id => nmOf(id) === 'Card';
  const needsBank = id => isCard(id) || nmOf(id) === 'Bank Installments';
  const multiBank = id => nmOf(id) === 'Bank Installments';
  const OPS = { Online: ['Pay Non-3DS', 'MOTO', 'Auth & Cap', 'Recurring', 'Virtual Cards'], POS: ['Auth & Cap'] };
  const CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP'];

  /* Rate tiers: published (standard) rate, Sales Manager floor, Head of Sales floor, fixed fee (Aya's prototype values). */
  const LOCAL = { key: 'local', label: 'Local rates', hint: 'Covers every domestic rate', fee: 2, std: 1.75, mgr: 1.25, head: 0.75 };
  const DOMESTIC = [
    { key: 'national-onus', label: 'National on-us rate (Mastercard/Visa)', short: 'National on-us', fee: 2, std: 1.5, mgr: 1, head: 0.5 },
    { key: 'national-offus', label: 'National off-us rate (Mastercard/Visa)', short: 'National off-us', fee: 2, std: 2, mgr: 1.5, head: 1 },
    { key: 'meeza-onus', label: 'Meeza on-us rate', short: 'Meeza on-us', fee: 1.5, std: 1.2, mgr: 0.9, head: 0.6 },
    { key: 'meeza-offus', label: 'Meeza off-us rate', short: 'Meeza off-us', fee: 1.8, std: 1.4, mgr: 1.1, head: 0.8 }
  ];
  const INTL = c => ({ key: 'intl-' + c, label: 'International rate (' + c + ')', short: 'International ' + c, fee: 3, std: 2.5, mgr: 2, head: 1.5, cur: c });
  const SELLING = { key: 'selling', label: 'Selling rate', fee: 1.5, std: 1, mgr: 0.75, head: 0.5 };
  const MODEL_F = { PF: 1, PSP: 1.1 };
  const BANK_F = {
    'National Bank of Egypt': { 'Retail & E-commerce': .96, 'Food & Beverage': 1.05, 'Healthcare / Pharmacy': .98, Education: .94, 'Travel & Tourism': 1.04, 'Professional Services': .97, 'Technology / SaaS': .95, 'Real Estate': 1.02, Automotive: 1, 'Fashion & Beauty': .99, 'Entertainment & Media': 1.03, 'Non-profit / NGO': .92, 'Financial Services': 1.06, Insurance: 1.01, Marketplace: .97, 'Logistics & Delivery': 1.02 },
    'Bank Misr': { 'Retail & E-commerce': 1.04, 'Food & Beverage': .95, 'Healthcare / Pharmacy': 1.02, Education: 1.05, 'Travel & Tourism': .97, 'Professional Services': 1.03, 'Technology / SaaS': 1.05, 'Real Estate': .98, Automotive: 1, 'Fashion & Beauty': 1.01, 'Entertainment & Media': .97, 'Non-profit / NGO': 1.06, 'Financial Services': .94, Insurance: .99, Marketplace: 1.03, 'Logistics & Delivery': .98 }
  };
  const bankF = (bank, act) => (BANK_F[bank] && BANK_F[bank][act]) || 1;
  const plainF = act => round2((bankF(BANKS[0], act) + bankF(BANKS[1], act)) / 2);

  /* Document rules (OR within a group, AND across groups), as in Document Rules. */
  const DOCS = {
    'National ID': { ar: 'بطاقة الرقم القومي', formats: 'PDF, JPG, PNG', size: 5, slots: ['Front side', 'Back side'] },
    'Bank Account Letter / IBAN proof': { ar: 'خطاب حساب بنكي / إثبات الآيبان', formats: 'PDF, JPG', size: 5 },
    'Commercial Registration (CR)': { ar: 'السجل التجاري', formats: 'PDF', size: 10 },
    'Tax Identification Card': { ar: 'البطاقة الضريبية', formats: 'PDF, JPG', size: 5 },
    "Owner's Passport": { ar: 'جواز سفر المالك', formats: 'PDF, JPG, PNG', size: 5 },
    "Owner's Residence Card": { ar: 'بطاقة إقامة المالك', formats: 'PDF, JPG, PNG', size: 5 },
    'BM PSP Agreement Annex': { ar: 'ملحق اتفاقية PSP - بنك مصر', formats: 'PDF', size: 10 },
    'Brand Authorization Letter': { ar: 'خطاب تفويض العلامة التجارية', formats: 'PDF', size: 5 },
    'Store Lease / Location Proof': { ar: 'عقد إيجار المتجر / إثبات الموقع', formats: 'PDF, JPG', size: 5 }
  };
  const DOC_RULES = [
    { name: 'Identity (universal)', docs: ['National ID'] },
    { name: 'Bank proof (universal)', docs: ['Bank Account Letter / IBAN proof'] },
    { name: 'Tax registration', docs: ['Tax Identification Card'], entities: ['Registered Business', 'Professional Business'] },
    { name: 'Commercial Registration', docs: ['Commercial Registration (CR)'], entities: ['Registered Business'] },
    { name: 'Foreign owner KYC', docs: ["Owner's Passport", "Owner's Residence Card"], owners: ['Foreign Owner'] },
    { name: 'Bank Misr PSP annex', docs: ['BM PSP Agreement Annex'], bankPsp: 'Bank Misr' },
    { name: 'Online services', docs: ['Brand Authorization Letter'], channel: 'Online' },
    { name: 'POS services', docs: ['Store Lease / Location Proof'], channel: 'POS' }
  ];
  const TAX_DOC = 'Tax Identification Card';
  const PAYOUT_BANKS = { 'National Bank of Egypt': ['Main Branch', 'Nasr City', 'Heliopolis', 'Maadi'], 'Banque Misr': ['Main Branch', 'Zamalek', 'Dokki', 'New Cairo'],
    CIB: ['Smart Village', 'Mohandessin', 'Korba'], 'QNB Alahli': ['Downtown Cairo', 'Sheikh Zayed', 'Alexandria, Smouha'] };
  const WALLETS = ['Vodafone Cash', 'Orange Cash', 'e& Cash', 'WE Pay'];

  /* ---------- State ---------- */
  /* Prototype roles (FIN-29568 hierarchy). Approvers act only on rates of their own tier (FIN-28612). */
  const ROLES = {
    sales: { key: 'sales', name: 'Aya Muhammed', email: 'aya@kashier.io', init: 'AM', role: 'Salesperson' },
    manager: { key: 'manager', name: 'Nadia Salah', email: 'nadia@kashier.io', init: 'NS', role: 'Sales Manager', tier: 'Sales Manager' },
    head: { key: 'head', name: 'Karim Zaki', email: 'karim@kashier.io', init: 'KZ', role: 'Head of Sales', tier: 'Head of Sales' }
  };
  let ME = ROLES.sales;
  const isApprover = () => !!ME.tier;
  const nowStr = () => new Date().toLocaleString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  function blankLine() { return { bank: '', adv: false, rates: {}, rule: null, custom: false }; }
  function blankState() {
    return {
      cases: {}, nextCase: 1, fixing: false, mid: '', appId: '', submittedAt: '', submitComment: '', cancelComment: '',
      merchant: { name: 'Delta Pharma Group', email: 'nourhan@deltapharma.eg', phone: '+20 111 234 5678' },
      entity: 'Registered Business', industry: 'Healthcare / Pharmacy', activities: ['Healthcare / Pharmacy'], owner: '',
      svc: {}, order: [], terminals: '',
      websites: [''], docs: {}, storeImage: '', taxInvoice: false,
      payouts: [], primary: null, nextPayout: 1,
      reqContracts: {}, contracts: [], nextContract: 1,
      just: {}, visited: {}, step: 0, viewAs: 'sales', decisions: {}, watch: {}, submittedBy: '',
      log: [{ t: '09/01/2026, 10:12:04 AM', who: 'System', text: 'created the application from Zoho CRM record ZOHO-00002', ic: 'link' }]
    };
  }
  let S = blankState();
  let V = null;           // the variant: { key, render(), live: {}, onGoto(target) }
  const KEY = () => 'sa-dir-' + (V && V.key);
  function save() { try { localStorage.setItem(KEY(), JSON.stringify(S)); } catch (e) { } }
  function load() { try { const s = JSON.parse(localStorage.getItem(KEY()) || 'null'); if (s && s.merchant) { S = Object.assign(blankState(), s); if (!s.cases) { S.cases = {}; if (s.status && s.status !== 'New') S.order.forEach(id => { S.cases[id] = { status: s.status, prev: s.prevStatus, cancelComment: s.cancelComment }; }); } delete S.status; } } catch (e) { } ME = ROLES[S.viewAs] || ROLES.sales; }
  const log = (text, ic = 'pencil', detail = '', id) => { S.log.unshift({ t: nowStr(), who: ME.name, text, ic, detail, id }); };

  /* ---------- Pricing ---------- */
  const acts = () => S.activities.slice();
  function tiersFor(id, line) {
    if (!isCard(id)) return [SELLING];
    const c = S.svc[id], cur = c.model === 'PSP' ? (c.currencies.length ? c.currencies : ['EGP']) : ['EGP'];
    if (c.model === 'PF' && !line.adv) return [LOCAL].concat(cur.map(INTL));
    if (c.model === 'PF') return DOMESTIC.map(t => Object.assign({}, t, { fee: LOCAL.fee, std: LOCAL.std, mgr: LOCAL.mgr, head: LOCAL.head })).concat(cur.map(INTL));
    return DOMESTIC.concat(cur.map(INTL));
  }
  /* Pricing rules: each bank publishes one rule per activity; services without a bank have one rule per activity. */
  function rulesFor(id) {
    const c = S.svc[id]; if (!c) return [];
    const out = [];
    acts().forEach(a => {
      if (needsBank(id)) BANKS.forEach(b => out.push({ id: b + '::' + a, bank: b, act: a, f: bankF(b, a) * (MODEL_F[c.model] || 1), bf: isCard(id) ? bankF(b, a) : 1 }));
      else out.push({ id: '::' + a, bank: '', act: a, f: plainF(a) * (MODEL_F[c.model] || 1), bf: 1 });
    });
    return out;
  }
  const ruleRate = (r, t) => ({ rate: round2(t.std * r.f), fee: round2(t.fee * r.bf) });
  function ruleCost(id, r) { // National Off-us on a 1,000 EGP payment
    const t = isCard(id) ? (S.svc[id].model === 'PF' ? LOCAL : DOMESTIC[1]) : SELLING;
    const v = ruleRate(r, t); return v.rate * 10 + v.fee;
  }
  function sortedRules(id) {
    const rs = rulesFor(id).map(r => Object.assign(r, { cost: ruleCost(id, r) })).sort((a, b) => a.cost - b.cost);
    if (rs.length > 1) rs.forEach(r => { r.best = Math.abs(r.cost - rs[0].cost) < 1e-9; });
    return rs;
  }
  /* The published pricing for one line: from its bank's best rule, or the best rule overall when no bank is set. */
  function publishedFactor(id, line) {
    const rs = sortedRules(id).filter(r => !line.bank || r.bank === line.bank);
    return rs[0] || { f: MODEL_F[S.svc[id].model] || 1, bf: 1 };
  }
  function pubFor(id, line, t) { const r = publishedFactor(id, line); return { std: round2(t.std * r.f), mgr: round2(t.mgr * r.f), head: round2(t.head * r.f), fee: round2(t.fee * r.bf) }; }
  const num = v => { const n = Number(v); return (v === '' || v == null || !isFinite(n) || n < 0) ? null : n; };
  function verdict(id, line, t) {
    const sel = line.rates[t.key] || {}, p = pubFor(id, line, t);
    const r = num(sel.rate), f = num(sel.fee);
    if (r === null || r <= 0 || f === null) return { tier: '', text: 'Enter the rate and flat fee', p };
    if (r < p.head) return { tier: 'head', text: 'Needs Head of Sales approval', p };
    if (r < p.mgr || r < p.std || f < p.fee) return { tier: r < p.mgr ? 'head' : 'manager', text: r < p.mgr ? 'Needs Head of Sales approval' : 'Needs Sales Manager approval', p };
    return { tier: 'auto', text: 'At or above published', p };
  }
  const pubText = p => `${fmtN(p.std)}% + ${fmtN(p.fee)} EGP`;
  const rateText = sel => `${fmtN(sel.rate)}% + ${fmtN(sel.fee)} EGP`;
  function verdictHTML(id, li, t, compact) {
    const line = S.svc[id].lines[li], v = verdict(id, line, t);
    const fk = { key: `${id}::${line.bank}::${t.key}`, sel: line.rates[t.key] }, d = decisionOf(fk);
    if (d && d.decision === 'rejected') return `<span class="flag h">${icon('xcircle', 'ic-14')}${compact ? 'Rejected' : `Rejected by ${esc(d.by)} (${esc(d.role)})${d.comment ? ': ' + esc(d.comment) : ''} Change this rate.`}</span>`;
    if (d && d.decision === 'approved') return `<span class="flag ok">${icon('check', 'ic-14')}${compact ? 'Approved' : `Approved by ${esc(d.by)} (${esc(d.role)})`}</span>`;
    if (!v.tier) return compact ? '' : `<span class="flag mute">Published ${pubText(v.p)}</span>`;
    if (v.tier === 'auto') return `<span class="flag ok">${icon('check', 'ic-14')}${compact ? 'OK' : 'At or above published'}</span>`;
    return `<span class="flag ${v.tier === 'head' ? 'h' : 'm'}">${icon('warn', 'ic-14')}${compact ? (v.tier === 'head' ? 'Head of Sales' : 'Sales Manager') : `Below published ${pubText(v.p)} · ${v.tier === 'head' ? 'Head of Sales' : 'Sales Manager'} approval`}</span>`;
  }
  function flagged() {
    const out = [];
    S.order.forEach(id => S.svc[id].lines.forEach((line, li) => tiersFor(id, line).forEach(t => {
      const v = verdict(id, line, t);
      if (v.tier === 'manager' || v.tier === 'head') out.push({ key: `${id}::${line.bank}::${t.key}`, id, li, line, t, approver: v.tier === 'head' ? 'Head of Sales' : 'Sales Manager', p: v.p, sel: line.rates[t.key] });
    })));
    return out;
  }
  /* Rate decisions (FIN-28612). A decision holds the rate it was made on; changing the rate voids it. */
  const sameRate = (d, f) => d && f.sel && String(d.rate) === String(f.sel.rate) && String(d.fee) === String(f.sel.fee);
  const decisionOf = f => { const d = S.decisions[f.key]; return sameRate(d, f) ? d : null; };
  const approvedOk = f => { const d = decisionOf(f); return !!d && d.decision === 'approved'; };
  const rejectedStill = f => { const d = decisionOf(f); return !!d && d.decision === 'rejected'; };
  /* Rates that still need an approver: below published and not already approved at this exact rate. */
  const needsApproval = () => flagged().filter(f => !approvedOk(f));
  const undecided = () => flagged().filter(f => !decisionOf(f));
  /* Cases: every service on a submitted application is its own case with its own status. The application has no status of its own. */
  const caseStatus = id => (S.cases[id] && S.cases[id].status) || 'New';
  const setCase = (id, status, extra) => { const c = S.cases[id] = Object.assign(S.cases[id] || {}, extra || {}, { status }); if (!c.caseId) c.caseId = 'CASE-' + String(S.nextCase++).padStart(3, '0'); };
  const submitted = () => !!S.appId;
  const hasRejectedCase = () => S.order.some(id => caseStatus(id) === 'Rejected');
  const caseRoute = id => needsApproval().some(f => f.id === id) ? 'Waiting Rate Approval' : 'Underwriting Review';
  /* A case in rate approval moves on as soon as every one of ITS rates is decided; other cases are not affected. */
  function settleCases() {
    S.order.forEach(id => {
      if (caseStatus(id) !== 'Waiting Rate Approval') return;
      const fl = flagged().filter(f => f.id === id); if (fl.some(f => !decisionOf(f))) return;
      if (fl.some(rejectedStill)) { const d = decisionOf(fl.find(rejectedStill)); setCase(id, 'Rejected', { reject: { source: 'approver', by: d.by, role: d.role, comment: d.comment, at: d.at } }); S.log.unshift({ t: nowStr(), who: 'System', text: `returned the ${label(id)} case to the salesperson`, ic: 'arrows', detail: 'One or more rates were rejected.', id }); }
      else { setCase(id, 'Underwriting Review'); S.log.unshift({ t: nowStr(), who: 'System', text: `moved the ${label(id)} case to Underwriting Review`, ic: 'check', detail: 'Every requested rate was approved.', id }); }
    });
  }
  function decide(f, decision, comment = '') {
    S.decisions[f.key] = { decision, by: ME.name, role: ME.role, comment, rate: f.sel.rate, fee: f.sel.fee, at: nowStr() };
    if (decision === 'rejected') delete S.just[f.key];
    log(`${decision} the rate ${f.t.label}: ${label(f.id)}${f.line.bank ? ' · ' + f.line.bank : ''}`, decision === 'approved' ? 'check' : 'xcircle', `Requested ${rateText(f.sel)} · Published ${pubText(f.p)}${comment ? ' · Decision comment: ' + comment : ''}`, f.id);
    settleCases();
  }
  function applyRule(id, li, rule, adv) {
    const c = S.svc[id], line = c.lines[li];
    if (isCard(id)) line.adv = !!adv;
    if (needsBank(id) && rule.bank) line.bank = rule.bank;
    line.rates = {};
    tiersFor(id, line).forEach(t => { const v = ruleRate(rule, t); line.rates[t.key] = { rate: String(v.rate), fee: String(v.fee) }; });
    line.rule = rule.id; line.custom = false; line.by = ME.name; line.at = nowStr();
    log(`added rates from service pricing: ${label(id)}${line.bank ? ' · ' + line.bank : ''}`, 'banknotes', `Rule: ${S.entity} · ${rule.act} · ${chOf(id)} · ${c.model} · ${nmOf(id)}`, id);
  }
  /* Rates applied from a rule follow the application's activities and model; manual rates stay. */
  function reprice(why) {
    let n = 0;
    S.order.forEach(id => S.svc[id].lines.forEach((line, li) => {
      if (!line.rule || line.custom) return;
      const rs = sortedRules(id).filter(r => !line.bank || r.bank === line.bank);
      if (!rs.length) return;
      const before = JSON.stringify(line.rates);
      tiersFor(id, line).forEach(t => { const v = ruleRate(rs[0], t); line.rates[t.key] = { rate: String(v.rate), fee: String(v.fee) }; });
      line.rule = rs[0].id;
      if (JSON.stringify(line.rates) !== before) n += tiersFor(id, line).length;
    }));
    if (n) toast(`${n} rates updated to the new ${why} pricing.`);
  }

  /* ---------- Validation ---------- */
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
  const phoneOk = v => /^\+\d{1,3}[\s-]?\d[\d\s-]{6,}$/.test(String(v).trim());
  const urlOk = v => /^(?:https?:\/\/)?(?:www\.)?[\w-]+(?:\.[\w-]+)+(?:\/\S*)?$/i.test(String(v).trim());
  const hasCh = ch => S.order.some(id => chOf(id) === ch);
  function lineIssues(id, li) {
    const c = S.svc[id], line = c.lines[li], out = [];
    if (needsBank(id) && !line.bank) out.push('Choose the financial institution');
    const missing = tiersFor(id, line).filter(t => { const s = line.rates[t.key] || {}; return num(s.rate) === null || num(s.rate) <= 0 || num(s.fee) === null; });
    if (missing.length) out.push(missing.length === 1 ? `Enter the ${missing[0].label.replace(/^\w+/, w => w === 'National' || w === 'Meeza' ? w : w.toLowerCase())}` : `Enter ${missing.length} rates`);
    return out;
  }
  function svcIssues(id) {
    const c = S.svc[id], out = [];
    if (!c.model) out.push('Choose the model');
    c.lines.forEach((l, li) => lineIssues(id, li).forEach(m => out.push(c.lines.length > 1 && l.bank ? `${m} (${l.bank})` : m)));
    return out;
  }
  function svcState(id) {
    const iss = svcIssues(id), fl = needsApproval().filter(f => f.id === id && !rejectedStill(f));
    return { issues: iss, flags: fl, ready: !iss.length, rates: S.svc[id].lines.some(l => Object.keys(l.rates).some(k => l.rates[k].rate !== '' || l.rates[k].fee !== '')) };
  }
  function servicesIssues() {
    const out = [];
    if (!S.order.length) out.push({ m: 'Add at least one service', target: 'services' });
    S.order.forEach(id => svcIssues(id).forEach(m => out.push({ m: `${label(id)}: ${m.charAt(0).toLowerCase() + m.slice(1)}`, target: 'svc:' + id })));
    flagged().filter(f => rejectedStill(f) && caseStatus(f.id) === 'Rejected').forEach(f => out.push({ m: `${label(f.id)}: change the rejected rate (${f.t.label})`, target: 'svc:' + f.id }));
    if (hasCh('POS') && !(parseInt(S.terminals, 10) >= 1 && /^\d+$/.test(String(S.terminals).trim()))) out.push({ m: 'Enter the number of POS terminals (1 or more)', target: 'terminals' });
    return out;
  }
  function requiredDocs() {
    const pspBanks = new Set(); S.order.forEach(id => { if (S.svc[id].model === 'PSP') S.svc[id].lines.forEach(l => l.bank && pspBanks.add(l.bank)); });
    const map = new Map();
    DOC_RULES.forEach(r => {
      if (r.entities && !r.entities.includes(S.entity)) return;
      if (r.owners && !r.owners.includes(S.owner)) return;
      if (r.bankPsp && !pspBanks.has(r.bankPsp)) return;
      if (r.channel && !hasCh(r.channel)) return;
      r.docs.forEach(d => { if (!map.has(d)) map.set(d, []); map.get(d).push(r.name); });
    });
    return map;
  }
  const slotsOf = n => DOCS[n].slots || ['File'];
  const docDone = n => { const st = S.docs[n] || {}; return slotsOf(n).every(s => st[s]); };
  function documentsIssues() {
    const out = [], req = requiredDocs();
    if (hasCh('Online')) { const f = S.websites.map(x => x.trim()).filter(Boolean); if (!f.length) out.push('Enter the merchant website or a social media link'); else if (f.some(x => !urlOk(x))) out.push('Fix the link that is not a valid website or social media link'); }
    if (hasCh('POS') && !S.storeImage) out.push('Upload the Store Image');
    if (S.taxInvoice && !docDone(TAX_DOC)) out.push('Upload the Tax Identification Card (needed for the tax invoice)');
    if (![...req.keys()].some(docDone)) out.push('Upload at least one document');
    return out;
  }
  function payoutIssues(p) {
    const out = [];
    if (p.id !== S.primary && !p.name.trim()) out.push('Payout Method Name');
    if (p.type === 'bank') {
      if (!p.bank) out.push('Bank Name'); if (!p.branch) out.push('Bank Branch Name');
      if (!/^[\p{L} .'-]+$/u.test(p.holder.trim())) out.push('Account Holder Name');
      if (!/^\d{8,20}$/.test(p.acct.trim())) out.push('Account Number');
    } else {
      if (!p.provider) out.push('Wallet Provider');
      if (!/^01\d{9}$/.test(p.mobile.trim())) out.push('Wallet Mobile Number');
      if (!/^[\p{L} .'-]+$/u.test(p.wholder.trim())) out.push('Wallet Holder Name');
    }
    return out;
  }
  function payoutsIssues() { const i = S.payouts.findIndex(p => payoutIssues(p).length); return i < 0 ? [] : [`Complete payout method ${i + 1}, or remove it`]; }
  /* One signed contract per PF method, named "<Method> - PF Contract" (a method on Online and POS shares one). */
  function requiredContracts() {
    const pf = S.order.filter(id => S.svc[id].model === 'PF');
    return [...new Set(pf.map(nmOf))].map(n => ({ label: `${n} - PF Contract`, text: `${n} on PF needs its own signed contract. It applies to ${pf.filter(id => nmOf(id) === n).map(chOf).join(' and ')}.` }));
  }
  function contractsIssues() {
    const miss = requiredContracts().filter(r => !S.reqContracts[r.label]), out = [];
    if (miss.length) out.push(`Upload the ${miss[0].label}${miss.length > 1 ? ` (+${miss.length - 1} more)` : ''}`);
    if (S.contracts.some(c => !c.label.trim() || !c.file)) out.push('Give every added contract a label and a file, or remove it');
    return out;
  }
  const justIssues = () => needsApproval().filter(f => !rejectedStill(f) && !(S.just[f.key] || '').trim());
  function checklist() {
    const m = S.merchant;
    const mIss = [!m.name.trim() && 'business name', !emailOk(m.email) && 'a valid email', !phoneOk(m.phone) && 'a phone with country code'].filter(Boolean);
    const svc = servicesIssues(), docs = documentsIssues(), pay = payoutsIssues(), con = contractsIssues(), jus = justIssues();
    return [
      { k: 'merchant', label: 'Merchant details: business name, email and phone', done: !mIss.length, hint: mIss.length ? 'Enter ' + mIss.join(', ') : '', target: 'merchant' },
      { k: 'type', label: 'Merchant type and industry', done: !!(S.entity && S.industry), hint: !S.entity ? 'Pick the merchant type' : !S.industry ? 'Pick the industry' : '', target: 'criteria' },
      { k: 'acts', label: 'At least one activity selected', done: S.activities.length > 0, target: 'criteria' },
      { k: 'svc1', label: 'At least one service selected', done: S.order.length > 0, target: 'services' },
      { k: 'pricing', label: 'Service setup: Services & Pricing', done: !svc.length, hint: svc[0] ? svc[0].m + (svc.length > 1 ? ` (+${svc.length - 1} more)` : '') : '', target: svc[0] ? svc[0].target : 'services' },
      { k: 'docs', label: 'Service setup: Documents', done: !docs.length && S.order.length > 0, hint: S.order.length ? (docs[0] ? docs[0] + (docs.length > 1 ? ` (+${docs.length - 1} more)` : '') : '') : 'Add a service first', target: 'documents' },
      { k: 'payout', label: 'Service setup: Payout Method', opt: true, done: !pay.length && S.order.length > 0, hint: pay[0] || '', target: 'payout' },
      { k: 'contracts', label: 'Service setup: Contracts', done: !con.length && S.order.length > 0, hint: S.order.length ? (con[0] || '') : 'Add a service first', target: 'contracts' },
      { k: 'just', label: 'Add a justification for every rate needing approval', done: !jus.length, hint: jus.length ? `${jus.length} rate${jus.length > 1 ? 's' : ''} below published need${jus.length > 1 ? '' : 's'} a justification` : '', target: 'justify' }
    ];
  }
  const openItems = () => checklist().filter(i => !i.done);

  /* ---------- Overlays ---------- */
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function trap(el, e) {
    if (e.key !== 'Tab') return;
    const f = [...el.querySelectorAll(FOCUSABLE)].filter(x => x.offsetParent !== null); if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
  const unlock = () => { if (!document.querySelector('.drawer,.modal')) document.body.classList.remove('locked'); };
  function drawer({ size = '', title, sub = '', expand = false, render, onClose, beforeClose }) {
    const prev = document.activeElement;
    const scrim = document.createElement('div'); scrim.className = 'd-scrim';
    const d = document.createElement('div'); d.className = 'drawer ' + size; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'dT');
    d.innerHTML = `<div class="dh"><div class="tt"><h2 id="dT">${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${expand ? `<button type="button" class="icon-btn expand" data-exp aria-label="Expand to full screen" aria-pressed="false"><svg class="ic-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${P('M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15')}</svg></button>` : ''}<button type="button" class="icon-btn" data-x aria-label="Close">${icon('x', 'ic-20')}</button></div><div class="db"></div><div class="df"></div>`;
    document.body.append(scrim, d); document.body.classList.add('locked');
    const key = e => { if (document.querySelector('.modal')) return; const all = document.querySelectorAll('.drawer'); if (all[all.length - 1] !== d) return; if (e.key === 'Escape') api.close(); else trap(d, e); };
    const api = {
      el: d, body: d.querySelector('.db'), foot: d.querySelector('.df'),
      close(force) { if (force !== true && beforeClose && beforeClose(api) === false) return; scrim.remove(); d.remove(); document.removeEventListener('keydown', key); unlock(); onClose && onClose(); setTimeout(() => prev && prev.isConnected && prev.focus()); },
      setTitle(t, s) { d.querySelector('#dT').innerHTML = t; let p = d.querySelector('.dh p'); if (s && !p) { p = document.createElement('p'); d.querySelector('.dh .tt').append(p); } if (p) p.innerHTML = s || ''; }
    };
    document.addEventListener('keydown', key);
    scrim.onclick = () => api.close(); d.querySelector('[data-x]').onclick = () => api.close();
    const ex = d.querySelector('[data-exp]'); if (ex) ex.onclick = () => { const on = d.classList.toggle('full'); ex.setAttribute('aria-pressed', on); ex.setAttribute('aria-label', on ? 'Exit full screen' : 'Expand to full screen'); };
    render(api);
    if (!api.foot.innerHTML.trim()) api.foot.remove();
    setTimeout(() => (d.querySelector('[autofocus]') || d.querySelector('[data-x]')).focus());
    return api;
  }
  function modal({ title, sub = '', body = '', foot, role = 'dialog', bind }) {
    const prev = document.activeElement;
    const s = document.createElement('div'); s.className = 'm-scrim';
    const m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', role); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'mT');
    m.innerHTML = `<div class="mh"><div class="tt"><h2 id="mT">${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div><button type="button" class="icon-btn" data-x aria-label="Close">${icon('x', 'ic-20')}</button></div><div class="mb">${body}</div><div class="mf">${foot}</div>`;
    document.body.append(s, m); document.body.classList.add('locked');
    const k = e => { if (e.key === 'Escape') { e.stopPropagation(); api.close(); } else trap(m, e); };
    const api = { el: m, close() { s.remove(); m.remove(); document.removeEventListener('keydown', k, true); unlock(); setTimeout(() => prev && prev.isConnected && prev.focus()); } };
    document.addEventListener('keydown', k, true);
    s.onclick = api.close; m.querySelector('[data-x]').onclick = api.close;
    bind && bind(api);
    setTimeout(() => (m.querySelector('[autofocus]') || m.querySelector('.mb ' + 'textarea, .mb input') || m.querySelector('.mf .btn')).focus());
    return api;
  }
  function confirmBox({ title, body, ok, danger }) {
    return new Promise(res => {
      let done = false;
      const api = modal({ title, role: 'alertdialog', body: `<p style="margin:0;color:var(--cadet-base)">${body}</p>`,
        foot: `<button type="button" class="btn btn-outline" data-n>Cancel</button><button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-y>${ok}</button>`,
        bind: a => { a.el.querySelector('[data-n]').onclick = () => { done = true; a.close(); res(false); }; a.el.querySelector('[data-y]').onclick = () => { done = true; a.close(); res(true); }; } });
      const c = api.close; api.close = () => { c(); if (!done) res(false); };
    });
  }
  let toastT;
  function toast(msg, undo) {
    document.querySelector('.toast')?.remove(); clearTimeout(toastT);
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
    t.innerHTML = icon('check', 'ic-20') + `<span>${msg}</span>` + (undo ? '<button type="button" class="link-btn">Undo</button>' : '');
    if (undo) t.querySelector('button').onclick = () => { t.remove(); undo(); };
    document.body.append(t); toastT = setTimeout(() => t.remove(), undo ? 6000 : 3600);
  }
  let popEl = null, popBtn = null;
  function closePop() { if (popEl) { popEl.remove(); popEl = null; popBtn && popBtn.setAttribute('aria-expanded', 'false'); document.removeEventListener('mousedown', popOutside); } }
  const popOutside = e => { if (popEl && !popEl.contains(e.target) && !popBtn.contains(e.target)) closePop(); };
  /* Anchored popover; on phones it becomes a bottom sheet. */
  function popover(btn, html, bind, { width = 360 } = {}) {
    if (popEl && popBtn === btn) return closePop();
    closePop(); popBtn = btn;
    popEl = document.createElement('div'); popEl.className = 'pop'; popEl.setAttribute('role', 'dialog');
    popEl.innerHTML = html; document.body.append(popEl);
    const r = btn.getBoundingClientRect(), rtl = document.dir === 'rtl', mob = innerWidth < 768;
    if (mob) { popEl.classList.add('sheet'); }
    else {
      popEl.style.width = width + 'px';
      let x = rtl ? r.right - width : r.left; x = Math.max(8, Math.min(x, innerWidth - width - 8));
      const below = innerHeight - r.bottom - 12, above = r.top - 12;
      if (below >= 300 || below >= above) { popEl.style.top = (r.bottom + 4) + 'px'; popEl.style.maxHeight = below + 'px'; }
      else { popEl.style.maxHeight = above + 'px'; popEl.style.top = Math.max(8, r.top - 4 - popEl.offsetHeight) + 'px'; }
      popEl.style.left = x + 'px';
    }
    btn.setAttribute('aria-expanded', 'true');
    popEl.addEventListener('keydown', e => { if (e.key === 'Escape') { closePop(); btn.focus(); } });
    bind && bind(popEl);
    setTimeout(() => document.addEventListener('mousedown', popOutside));
    return popEl;
  }

  /* ---------- Pricing drawer (FIN-28414) ---------- */
  function pricingMissing(id) {
    const m = []; if (!S.entity) m.push('merchant type'); if (!S.svc[id].model) m.push('model'); if (!S.activities.length) m.push('an activity');
    return m.length ? 'Set the ' + m.join(', ') + ' first' : '';
  }
  function pricingBtnHTML(id, li, cls = 'btn btn-outline btn-sm') {
    const miss = pricingMissing(id);
    return `<button type="button" class="${cls}" data-act="pricing" data-id="${esc(id)}" data-li="${li}" ${miss ? `disabled title="${esc(miss)}" aria-describedby="pm-${esc(id).replace(/\W/g, '')}-${li}"` : ''}>View service pricing</button>${miss ? `<span class="sr-only" id="pm-${esc(id).replace(/\W/g, '')}-${li}">${esc(miss)}</span>` : ''}`;
  }
  function openPricing(id, li) {
    const c = S.svc[id], line = c.lines[li];
    let adv = isCard(id) && c.model === 'PF' ? !!line.adv : false;
    const usedBanks = c.lines.filter((l, i) => i !== li).map(l => l.bank).filter(Boolean);
    let sel = null, state = 'loading';
    const showBank = needsBank(id);
    drawer({ size: 'xl', expand: true, title: `Service pricing: ${label(id)}`, sub: 'Predefined pricing rules for this merchant\'s type, activities, channel, model and service.',
      render(api) {
        const tiers = () => { const probe = Object.assign({}, line, { adv }); return tiersFor(id, probe); };
        const draw = () => {
          const rs = sortedRules(id);
          if (sel === null) { const ap = line.rule && rs.find(r => r.id === line.rule && !usedBanks.includes(r.bank)); sel = ap ? ap.id : (rs.find(r => !usedBanks.includes(r.bank)) || {}).id || null; }
          const ts = tiers(), banks = new Set(rs.map(r => r.bank));
          if (state === 'loading') { api.body.innerHTML = `<div class="rscroll"><table class="rtbl"><tbody>${[1, 2, 3].map(() => `<tr><td colspan="4"><span class="skel-bar"></span></td></tr>`).join('')}</tbody></table></div>`; api.foot.innerHTML = foot(true); return; }
          if (!rs.length) { api.body.innerHTML = `<div class="empty-line">No published pricing rules match this application. You can still type rates manually.</div>`; api.foot.innerHTML = foot(true); bindFoot(); return; }
          const why = rs.length === 1 ? '' : `<div class="why"><p><b>Why these ${rs.length} pricing rules?</b> Each one is defined for <b>${esc(S.entity)}</b> · ${chOf(id)} · ${c.model} · ${nmOf(id)} and is for one of the application's activities (${S.activities.map(esc).join(', ')})${banks.size > 1 ? ', in both banks' : ''}. Rules for other activities are not shown.</p><a class="btn btn-outline btn-sm" href="#" target="_blank" rel="noopener">Open Pricing Rules ${icon('ext', 'ic-14')}</a></div>`;
          const advbar = isCard(id) && c.model === 'PF' ? `<div class="advbar"><p>${adv ? '<b>Full rates.</b> Each domestic rate is shown on its own, starting at the local rate.' : '<b>Local rates and International rates.</b> The local rate covers every domestic rate.'}</p><label><button type="button" class="sw" role="switch" aria-checked="${adv}" data-adv aria-label="Switch to advanced rates"></button>Switch to advanced rates</label></div>` : '';
          const cell = (r, t) => { const v = ruleRate(r, t); return `<td class="rate num"><b>${fmtN(v.rate)}%</b> + ${fmtN(v.fee)} EGP</td>`; };
          if (rs.length === 1 && !showBank) {
            const r = rs[0]; sel = r.id;
            api.body.innerHTML = `<p class="hint" style="margin:0">${esc(S.entity)} · ${chOf(id)} · ${c.model} · ${nmOf(id)}</p><div class="rscroll"><table class="rtbl"><thead><tr><th>Rate type</th><th>Published pricing</th></tr></thead><tbody>${ts.map(t => `<tr><td>${t.label}</td>${cell(r, t)}</tr>`).join('')}</tbody></table></div>`;
          } else {
            api.body.innerHTML = why + advbar + `<div class="rscroll"><table class="rtbl"><thead><tr><th style="width:36px"><span class="sr-only">Select</span></th><th>Pricing rule</th>${showBank ? '<th>Bank</th>' : ''}${ts.map(t => `<th>${t.short || t.label}</th>`).join('')}</tr></thead><tbody>${rs.map(r => {
              const dis = usedBanks.includes(r.bank);
              return `<tr class="pick ${r.best ? 'best' : ''} ${sel === r.id ? 'on' : ''}" data-r="${esc(r.id)}" ${dis ? 'aria-disabled="true" style="opacity:.5;cursor:not-allowed"' : ''}><td><input type="radio" name="rule" value="${esc(r.id)}" ${sel === r.id ? 'checked' : ''} ${dis ? 'disabled' : ''} aria-label="${esc(r.act + (r.bank ? ' · ' + r.bank : ''))}"></td><td><div>${esc(S.entity)} · ${esc(r.act)} · ${chOf(id)} · ${c.model} · ${nmOf(id)}</div><div style="display:flex;gap:6px;margin-top:4px">${r.best ? '<span class="tag best">Best</span>' : ''}${line.rule === r.id ? '<span class="tag info">Applied</span>' : ''}${dis ? '<span class="tag">Already added</span>' : ''}</div></td>${showBank ? `<td>${esc(r.bank)}</td>` : ''}${ts.map(t => cell(r, t)).join('')}</tr>`;
            }).join('')}</tbody></table></div><div class="rcards">${rs.map(r => `<button type="button" class="rcard ${sel === r.id ? 'on' : ''}" data-r="${esc(r.id)}" ${usedBanks.includes(r.bank) ? 'disabled' : ''} aria-pressed="${sel === r.id}"><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><b>${esc(r.act)}${r.bank ? ' · ' + esc(r.bank) : ''}</b>${r.best ? '<span class="tag best">Best</span>' : ''}${line.rule === r.id ? '<span class="tag info">Applied</span>' : ''}</div><div class="kv">${ts.map(t => { const v = ruleRate(r, t); return `<span>${t.short || t.label}</span><span class="num"><b>${fmtN(v.rate)}%</b> + ${fmtN(v.fee)} EGP</span>`; }).join('')}</div></button>`).join('')}</div>`;
          }
          api.foot.innerHTML = foot(!sel); bindFoot();
          api.body.querySelectorAll('[data-r]').forEach(tr => tr.onclick = () => { if (tr.getAttribute('aria-disabled') === 'true' || tr.disabled) return; sel = tr.dataset.r; draw(); });
          const a = api.body.querySelector('[data-adv]'); if (a) a.onclick = () => { adv = !adv; draw(); api.body.querySelector('[data-adv]').focus(); };
        };
        const foot = dis => `<span class="sp"></span><button type="button" class="btn btn-outline" data-close>Close</button><button type="button" class="btn btn-primary" data-add ${dis ? 'disabled' : ''}>Add rates</button>`;
        const bindFoot = () => {
          api.foot.querySelector('[data-close]').onclick = api.close;
          const add = api.foot.querySelector('[data-add]');
          add.onclick = async () => {
            const r = sortedRules(id).find(x => x.id === sel); if (!r) return;
            const has = Object.values(line.rates).some(v => v.rate !== '' || v.fee !== '');
            if (has && !(await confirmBox({ title: 'Replace existing rates?', body: `The rates already entered for ${label(id)}${line.bank ? ' · ' + esc(line.bank) : ''} will be replaced with the ones from this pricing rule.`, ok: 'Replace rates' }))) return;
            applyRule(id, li, r, adv); api.close(); rerender(); toast(`Rates added to ${label(id)}${r.bank ? ' · ' + r.bank : ''}`);
          };
        };
        draw();
        setTimeout(() => { state = 'ok'; if (api.el.isConnected) draw(); }, 350);
      } });
  }

  /* ---------- Justification modal (FIN-28503) ---------- */
  function openJustify(onSaved) {
    const fl = needsApproval().filter(f => !rejectedStill(f)); if (!fl.length) { onSaved && onSaved(); return; }
    const draft = {}; fl.forEach(f => { draft[f.key] = S.just[f.key] || ''; });
    const body = fl.map((f, i) => `<div class="jrow"><div class="jhead"><span class="tag info">${chOf(f.id)}</span><b>${esc(nmOf(f.id))}${f.line.bank ? ' · ' + esc(f.line.bank) : ''}</b><span class="tag ${f.approver === 'Head of Sales' ? 'bad' : 'req'}" style="margin-inline-start:auto">${f.approver}</span></div><div class="jrate">${f.t.label}: <b>${rateText(f.sel)}</b> <span class="muted">· published ${pubText(f.p)}</span></div><label class="sr-only" for="j${i}">Justification for ${esc(label(f.id))} ${esc(f.t.label)}</label><textarea class="inp" id="j${i}" data-j="${esc(f.key)}" placeholder="Why does this merchant need this rate?">${esc(draft[f.key])}</textarea></div>`).join('');
    modal({ title: 'These rates need approval', sub: "Add a short justification for each one before continuing. It's what the Sales Manager or Head of Sales will see.", body,
      foot: `<span class="sp" data-left></span><button type="button" class="btn btn-outline" data-n>Cancel</button><button type="button" class="btn btn-primary" data-y>Save &amp; Continue</button>`,
      bind(api) {
        const y = api.el.querySelector('[data-y]'), left = api.el.querySelector('[data-left]');
        const upd = () => { const n = fl.filter(f => !draft[f.key].trim()).length; y.disabled = n > 0; left.textContent = n ? `${n} left to justify` : ''; };
        api.el.querySelectorAll('[data-j]').forEach(t => t.oninput = () => { draft[t.dataset.j] = t.value; upd(); });
        api.el.querySelector('[data-n]').onclick = api.close;
        y.onclick = () => { Object.assign(S.just, draft); log(`added justifications for ${fl.length} rate${fl.length > 1 ? 's' : ''} below published`, 'pencil'); api.close(); rerender(); onSaved && onSaved(); };
        upd();
      } });
  }
  /* Continue from Services & Pricing: the modal opens whenever a rate is below published (AC), pre-filled with saved text. */
  function continueFromServices(next) {
    if (servicesIssues().length) return false;
    if (needsApproval().length) openJustify(next); else next();
    return true;
  }

  /* ---------- Logs, cancel, submit ---------- */
  function openLogs() {
    drawer({ size: 'md', title: 'Activity Log', sub: `${esc(S.merchant.name)} · ${S.log.length} event${S.log.length === 1 ? '' : 's'}`,
      render(api) { api.body.innerHTML = `<ul class="log">${S.log.map(e => `<li><span class="li">${icon(e.ic || 'pencil', 'ic-16')}</span><div><div class="t num">${esc(e.t)}</div><div><b>${esc(e.who)}</b> ${esc(e.text)}</div>${e.detail ? `<div class="d">${esc(e.detail)}</div>` : ''}</div></li>`).join('')}</ul>`; } });
  }
  function openCancel(id) {
    modal({ title: 'Cancel Case', sub: `Are you sure you want to cancel the <b>${esc(label(id))}</b> case for <b>${esc(S.merchant.name)}</b>? No further onboarding action can be taken on it. The other cases are not affected.`,
      body: `<div class="fld"><label for="cc">Comment</label><textarea class="inp" id="cc" placeholder="Why is this case being canceled?"></textarea><span class="hint">Required. It's saved in the activity log.</span></div>`,
      foot: `<button type="button" class="btn btn-outline" data-n>Keep case</button><button type="button" class="btn btn-danger" data-y disabled>Cancel Case</button>`,
      bind(api) {
        const t = api.el.querySelector('#cc'), y = api.el.querySelector('[data-y]');
        t.oninput = () => { y.disabled = !t.value.trim(); };
        api.el.querySelector('[data-n]').onclick = api.close;
        y.onclick = () => { const c = t.value.trim(); setCase(id, 'Canceled', { prev: caseStatus(id), cancelComment: c }); log(`canceled the ${label(id)} case`, 'x', 'Comment: ' + c, id); api.close(); rerender(); toast(`${label(id)} case canceled`); };
      } });
  }
  /* Reopen (FIN-28567): any time, back to the status the case was canceled from. The MID on the portal is untouched. */
  function openReopen(id) {
    const to = (S.cases[id] && S.cases[id].prev) || 'New';
    modal({ title: 'Reopen Case', sub: `Reopen the <b>${esc(label(id))}</b> case? It goes back to <b>${esc(to)}</b>${isEditable(to) ? ' and can be edited again' : ' and continues from where it stopped'}.`,
      body: `<div class="fld"><label for="rc">Comment <span class="opt">(optional)</span></label><textarea class="inp" id="rc" placeholder="Why is this case being reopened?"></textarea><span class="hint">Saved in the activity log.</span></div>`,
      foot: `<button type="button" class="btn btn-outline" data-n>Keep canceled</button><button type="button" class="btn btn-primary" data-y>Reopen Case</button>`,
      bind(api) {
        const t = api.el.querySelector('#rc');
        api.el.querySelector('[data-n]').onclick = api.close;
        api.el.querySelector('[data-y]').onclick = () => { const c = t.value.trim(); setCase(id, to, { prev: '', cancelComment: '' }); log(`reopened the ${label(id)} case (back to ${to})`, 'arrows', c ? 'Comment: ' + c : '', id); api.close(); scrollTo(0, 0); rerender(); toast(`${label(id)} case reopened`); };
      } });
  }
  function openReject(f) {
    modal({ title: 'Reject this rate?', sub: `${esc(label(f.id))}${f.line.bank ? ' · ' + esc(f.line.bank) : ''}, ${f.t.label}: requested <b>${rateText(f.sel)}</b>, published ${pubText(f.p)}.`,
      body: `<div class="fld"><label for="rc">Decision comment</label><textarea class="inp" id="rc" placeholder="What rate can we offer, and why?"></textarea><span class="hint">The salesperson sees this when the application comes back to them.</span></div>`,
      foot: `<button type="button" class="btn btn-outline" data-n>Cancel</button><button type="button" class="btn btn-danger" data-y disabled>Reject rate</button>`,
      bind(api) {
        const t = api.el.querySelector('#rc'), y = api.el.querySelector('[data-y]');
        t.oninput = () => { y.disabled = !t.value.trim(); };
        api.el.querySelector('[data-n]').onclick = api.close;
        y.onclick = () => { decide(f, 'rejected', t.value.trim()); api.close(); rerender(); toast(`Rate rejected: ${label(f.id)}`); };
      } });
  }
  function openSubmit() {
    if (openItems().length) return;
    const re = hasRejectedCase();
    modal({ title: re ? 'Resubmit application' : 'Submit application', body: `<p class="hint" style="margin:0 0 12px">${re ? 'Only the returned cases are resubmitted. The other cases are not affected.' : 'Each service becomes its own case with its own status.'}</p><div class="fld"><label for="sc">Comment <span class="opt">(optional)</span></label><textarea class="inp" id="sc" placeholder="Anything the reviewers should know?"></textarea><span class="hint">It is shown with the application to the approvers and the Onboarding team.</span></div>`,
      foot: `<button type="button" class="btn btn-outline" data-n>Cancel</button><button type="button" class="btn btn-primary" data-y>${re ? 'Resubmit' : 'Submit'}</button>`,
      bind(api) {
        api.el.querySelector('[data-n]').onclick = api.close;
        api.el.querySelector('[data-y]').onclick = () => {
          Object.keys(S.decisions).forEach(k => { if (S.decisions[k].decision === 'rejected') delete S.decisions[k]; });
          S.submitComment = api.el.querySelector('#sc').value.trim();
          if (!S.mid) S.mid = 'MID-' + String(Math.floor(10000 + Math.random() * 89999)) + '-' + String(Math.floor(100 + Math.random() * 899));
          if (!S.appId) S.appId = 'APP-' + String(Math.floor(10000000 + Math.random() * 89999999));
          S.submittedBy = ME.name;
          S.submittedAt = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          const sent = S.order.filter(id => ['New', 'Rejected'].includes(caseStatus(id)));
          sent.forEach(id => setCase(id, caseRoute(id), { reject: null })); S.fixing = false;
          sent.forEach(id => log(`${re ? 'resubmitted' : 'submitted'} the ${label(id)} case`, 'send', `${S.cases[id].caseId} · ${S.cases[id].status}`, id));
          log(re ? 'resubmitted the returned cases with revised rates' : 'submitted the application', 'send', `Application ID ${S.appId} · ${sent.length} case${sent.length === 1 ? '' : 's'}: ${sent.map(label).join(', ')}${S.submitComment ? ' · Comment: ' + S.submitComment : ''}`);
          api.close(); scrollTo(0, 0); rerender(); toast(re ? 'Application resubmitted' : 'Application submitted');
        };
      } });
  }

  /* ---------- Shared section renderers ---------- */
  const STATUS_CLS = { New: 'info', Rejected: 'bad', 'Waiting Rate Approval': 'warn', 'Underwriting Review': 'info', 'Bank Submission': 'ok', Canceled: 'neu', Live: 'ok' };
  const caseChip = id => `<span class="sc ${STATUS_CLS[caseStatus(id)] || 'neu'}">${esc(caseStatus(id))}</span>`;
  const isEditable = s => s === 'New' || s === 'Rejected';
  /* The form is open until the first submit, and again when the salesperson chooses to fix a returned case. */
  const isEdit = () => !submitted() || (!!S.fixing && hasRejectedCase());
  const whenStr = t => { const d = new Date(t); return isNaN(d) ? t : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
  /* Page header, as the agent portal on staging (document-types): no bar, no border. Breadcrumb, title and
     description on the start side, the profile on the end side, 32px before the content. The page action is
     its own end-aligned row at the start of the content (like Export CSV / Add Document Type there). */
  const chevR = '<svg class="ic-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' + (window.AGENT_ICONS ? AGENT_ICONS['chevron-right'] : '') + '</svg>';
  function headTop() {
    const last = S.log[0], title = isEdit() ? 'Complete Onboarding Application' : 'Onboarding Application';
    return `<header class="hdr"><div class="hdr-l">
        <nav class="crumb" aria-label="Breadcrumb"><a href="#">My Applications</a>${chevR}<span aria-current="page">${isEdit() ? title : esc(S.merchant.name)}</span></nav>
        <h1>${title}</h1>
        <p class="desc">${isEdit() && submitted() ? 'One or more cases were returned to you. Change the rejected rates and resubmit. The other cases carry on unchanged.' : isEdit() ? 'Finish onboarding this lead into a live merchant. Capture their business criteria and services below. The required documents checklist updates automatically as you go, exactly like the merchant will see it.' : 'Everything about this merchant in one place. Open a case to see its full details and logs.'}</p>
        <div class="ph-meta">${submitted() ? `<span class="mi"><b>${esc(S.appId)}</b></span>` : ''}<span class="mi">${icon('link', 'ic-14')}<span>Zoho CRM record <a href="#" target="_blank" rel="noopener">ZOHO-00002 ${icon('ext', 'ic-14')}</a></span></span>${last ? `<span class="mi">${icon('clock', 'ic-14')}<span>Last activity ${esc(whenStr(last.t))} by ${esc(last.who)} · <button type="button" class="link-btn" data-act="logs">View logs</button></span></span>` : ''}</div>
      </div><button type="button" class="profile" aria-label="Account: ${ME.name}"><span class="pav">${ME.init}</span><span class="pdata"><span class="pname">${ME.name}</span><span class="pmail">${ME.email}</span></span>${icon('chevron', 'ic-16')}</button></header>`;
  }
  /* Page actions row: Watch / Unwatch for approvers (FIN-28612). Cancel and Reopen live on each case (FIN-28567, FIN-30327). */
  const headActions = () => isApprover() && submitted() && S.order.some(id => !['Live', 'Canceled'].includes(caseStatus(id))) ? `<button type="button" class="btn btn-outline" data-act="watch" aria-pressed="${!!S.watch[ME.key]}">${icon('bell', 'ic')}${S.watch[ME.key] ? 'Unwatch' : 'Watch'}</button>` : '';
  /* Returned to the salesperson: what was rejected, by whom, and why (FIN-28405 rejected rates). */
  function returnedBanner() {
    const cs = S.order.filter(id => caseStatus(id) === 'Rejected'); if (!cs.length || !S.fixing) return '';
    return `<div class="banner rj-banner">${icon('xcircle', 'ic-20')}<div><b>Returned to you: ${cs.length} case${cs.length > 1 ? 's' : ''}</b>
      <ul class="rj">${cs.map(id => { const r = (S.cases[id] || {}).reject || {}, uw = r.source === 'uw', rj = flagged().filter(f => f.id === id && rejectedStill(f));
        return `<li><b>${esc(label(id))}</b> · ${uw ? 'Rejected by the Underwriting team' : `Rejected by ${esc(r.by)} (${esc(r.role)})`}${r.comment ? `<br><span>${esc(r.comment)}</span>` : ''}
          ${uw ? ' <button type="button" class="link-btn" data-act="goto" data-t="documents">Go to documents</button>' : (rj.map(f => `<br><span class="num">${esc(f.t.label)}: ${rateText(f.sel)}</span> <button type="button" class="link-btn" data-act="goto" data-t="svc:${esc(f.id)}">Change rate</button>`).join('') || '<br><span>Every rejected rate is changed.</span>')}</li>`; }).join('')}</ul>
      <p>Resubmit when you are ready. Only the returned cases are sent again; changed rates that are still below published go back for approval.</p><button type="button" class="link-btn" data-act="stopFix">Back to the profile</button></div></div>`;
  }
  /* A new application, before it is submitted: the merchant's identity from the CRM lead, and no cases yet. */
  function draftHead() {
    if (submitted()) return '';
    return profileHead(false) + `<div class="grid2"><section class="card sec"><div class="sec-h"><div class="tt"><h2>Active services</h2><p>Services that are live for the merchant.</p></div></div><p class="hint" style="margin:0">No active services yet.</p></section>
      <section class="card sec"><div class="sec-h"><div class="tt"><h2>Cases <span class="cnt">0</span></h2><p>${S.order.length ? `${S.order.length} service${S.order.length === 1 ? ' is' : 's are'} selected. Each one becomes its own case when you submit the application.` : 'Add the services this merchant needs below. Each one becomes its own case when you submit the application.'}</p></div></div><p class="hint" style="margin:0">No cases yet.</p></section></div>`;
  }
  function fieldErr(cond, msg) { return cond ? `<span class="ferr">${icon('warn', 'ic-14')}${msg}</span>` : ''; }
  function merchantFields() {
    const m = S.merchant, t = S.visited.merchant;
    return `<div class="grid3">
      <div class="fld"><label for="mn">Business Name</label><input class="inp ${t && !m.name.trim() ? 'err' : ''}" id="mn" data-path="merchant.name" value="${esc(m.name)}" autocomplete="organization">${fieldErr(t && !m.name.trim(), 'Enter the business name')}</div>
      <div class="fld"><label for="me">Contact Email</label><input class="inp ${t && !emailOk(m.email) ? 'err' : ''}" id="me" type="email" data-path="merchant.email" value="${esc(m.email)}" autocomplete="email">${fieldErr(t && !emailOk(m.email), 'Enter a valid email, e.g. name@company.com')}</div>
      <div class="fld"><label for="mp">Contact Phone</label><input class="inp ${t && !phoneOk(m.phone) ? 'err' : ''}" id="mp" type="tel" dir="ltr" data-path="merchant.phone" value="${esc(m.phone)}" autocomplete="tel">${fieldErr(t && !phoneOk(m.phone), 'Include the country code, e.g. +20 100 123 4567')}</div>
    </div><p class="hint" style="margin:0">Pre-filled from the Zoho CRM lead.</p>`;
  }
  function criteriaFields({ compact = false } = {}) {
    return `<div class="${compact ? 'grid2' : 'crit'}">
      <div class="fld"><span class="lbl" id="etL">Merchant Type</span><div class="choice" role="radiogroup" aria-labelledby="etL">${ENTITIES.map(e => `<button type="button" role="radio" aria-checked="${S.entity === e}" data-act="entity" data-v="${esc(e)}">${e}</button>`).join('')}</div></div>
      <div class="fld"><span class="lbl" id="owL">Business Owner Nationality <span class="opt">(optional)</span></span><div class="choice" role="radiogroup" aria-labelledby="owL">${OWNERS.map(o => `<button type="button" role="radio" aria-checked="${S.owner === o}" data-act="owner" data-v="${esc(o)}">${o}</button>`).join('')}</div></div>
      <div class="fld"><label for="ind">Industry</label><select class="sel ${S.industry ? '' : 'is-empty'}" id="ind" data-act-change="industry"><option value="">Select industry</option>${INDUSTRIES.map(i => `<option ${S.industry === i ? 'selected' : ''}>${esc(i)}</option>`).join('')}</select><span class="hint">From Kashier industries.</span></div>
      <div class="fld"><span class="lbl" id="acL">Activities</span>
        <div class="ms"><button type="button" class="ms-btn" data-act="acts" aria-haspopup="dialog" aria-expanded="false" aria-labelledby="acL acV"><span id="acV">${S.activities.length ? `${S.activities.length} selected` : '<span class="muted">Select activities</span>'}</span>${icon('chevron', 'ic')}</button></div>
        ${S.activities.length ? `<div class="pills">${S.activities.map((a, i) => `<span class="pill"><span class="n">${i + 1}</span>${esc(a)}<button type="button" data-act="rmAct" data-v="${esc(a)}" aria-label="Remove ${esc(a)}">${icon('x', 'ic-14')}</button></span>`).join('')}</div>` : fieldErr(true, 'Select at least one activity')}
        <span class="hint">Pricing rules are matched on these activities.</span></div>
    </div>`;
  }
  function openActivities(btn) {
    let q = '';
    const html = () => `<div class="pop-b"><input class="inp" type="search" placeholder="Search activities" aria-label="Search activities" data-q value="${esc(q)}"><div class="ms-list">${INDUSTRIES.filter(i => i.toLowerCase().includes(q.toLowerCase())).map(i => `<label><input type="checkbox" value="${esc(i)}" ${S.activities.includes(i) ? 'checked' : ''}>${esc(i)}</label>`).join('') || '<p class="hint" style="padding:8px;margin:0">No match</p>'}</div></div>`;
    popover(btn, html(), el => {
      const bind = () => {
        const qi = el.querySelector('[data-q]'); qi.oninput = () => { q = qi.value; el.innerHTML = html(); bind(); const n = el.querySelector('[data-q]'); n.focus(); n.setSelectionRange(q.length, q.length); };
        el.querySelectorAll('input[type=checkbox]').forEach(c => c.onchange = () => { setActivity(c.value, c.checked); });
      };
      bind(); el.querySelector('[data-q]').focus();
    }, { width: 320 });
  }
  function setActivity(a, on) {
    const before = S.activities.slice();
    if (on && !S.activities.includes(a)) S.activities.push(a);
    if (!on) S.activities = S.activities.filter(x => x !== a);
    if (before.join() !== S.activities.join()) { log(`changed Activities from ${before.join('; ') || 'none'} to ${S.activities.join('; ') || 'none'}`); reprice("activities'"); rerender({ keepPop: true }); }
  }

  function documentsSection() {
    const req = requiredDocs(), names = [...req.keys()], done = names.filter(docDone).length;
    const links = hasCh('Online') ? `<div class="fld"><span class="lbl">Merchant Website or Social Media Links</span><span class="hint" style="margin-top:-4px">For Online services. At least one; add as many as the merchant has.</span>
      ${S.websites.map((w, i) => `<div style="display:flex;gap:8px"><label class="sr-only" for="ws${i}">Link ${i + 1}</label><input class="inp ${w.trim() && !urlOk(w) ? 'err' : ''}" id="ws${i}" dir="ltr" data-web="${i}" value="${esc(w)}" placeholder="www.merchant.com">${i > 0 ? `<button type="button" class="icon-btn" data-act="rmLink" data-i="${i}" aria-label="Remove link ${i + 1}">${icon('x', 'ic')}</button>` : ''}</div>${fieldErr(w.trim() && !urlOk(w), 'Enter a valid website or social media link')}`).join('')}
      <button type="button" class="link-btn" data-act="addLink" style="align-self:flex-start">${icon('plus', 'ic')}Add another link</button></div>` : '';
    const store = hasCh('POS') ? `<div class="ups"><div class="up"><div class="tt"><b>Store Image${S.storeImage ? '<span class="tag ok">Uploaded</span>' : ''}</b><span class="m">The merchant's logo or store image. Required for POS activation · JPG, PNG · max 5 MB</span></div><div class="acts">${S.storeImage ? fileChip(S.storeImage, 'rmStore', {}) : `<button type="button" class="btn btn-outline btn-sm" data-act="upStore">${icon('upload', 'ic')}Upload</button>`}</div></div></div>` : '';
    const taxInList = req.has(TAX_DOC), taxUp = docDone(TAX_DOC);
    const rows = names.map(n => {
      const d = DOCS[n], st = S.docs[n] || {}, ok = docDone(n), taxReq = n === TAX_DOC && S.taxInvoice;
      return `<div class="up" id="doc-${n.replace(/\W/g, '')}"><div class="tt"><b>${esc(n)}<span class="ar">· <bdi lang="ar">${d.ar}</bdi></span>${ok ? '<span class="tag ok">Uploaded</span>' : taxReq ? '' : '<span class="opt">(optional)</span>'}</b><span class="m">Applies to: ${req.get(n).map(esc).join(', ')} · ${d.formats} · max ${d.size} MB</span>
        ${n === TAX_DOC ? `<label class="cbx ${taxUp ? '' : 'dis'}" style="margin-top:6px"><input type="checkbox" data-act-change="tax" ${S.taxInvoice ? 'checked' : ''} ${taxUp || S.taxInvoice ? '' : 'disabled'}>The merchant needs a tax invoice${taxUp ? '' : ' <span class="hint">· Upload the tax ID first</span>'}</label>` : ''}</div>
        <div class="acts">${slotsOf(n).map(sl => st[sl] ? fileChip(st[sl], 'rmDoc', { n, sl }) : `<button type="button" class="btn btn-outline btn-sm" data-act="upDoc" data-n="${esc(n)}" data-sl="${esc(sl)}">${icon('upload', 'ic')}${sl === 'File' ? 'Upload' : esc(sl)}</button>`).join('')}</div></div>`;
    }).join('');
    return `${links}${store}<div class="fld"><span class="lbl">Documents</span><div class="counter">${done} of ${names.length} uploaded. ${S.taxInvoice ? 'The Tax Identification Card is required for the tax invoice; every other document is optional, but upload at least one to continue' : 'Every document is optional, but upload at least one to continue'}. Each is uploaded once, even when several services use it.</div><div class="ups">${rows}</div></div>${taxInList ? '' : ''}`;
  }
  const fileChip = (name, act, data) => `<span class="file">${icon('check', 'ic-14')}<span title="${esc(name)}">${esc(name)}</span><button type="button" data-act="${act}" ${Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ')} aria-label="Remove ${esc(name)}">${icon('x', 'ic-14')}</button></span>`;

  function payoutSection() {
    const items = S.payouts.map((p, i) => {
      const prim = p.id === S.primary, t = S.visited['p' + p.id];
      const err = (cond, m) => t && cond ? `<span class="ferr">${icon('warn', 'ic-14')}${m}</span>` : '';
      const f = (k, lbl, ph, extra = '') => `<div class="fld"><label for="p${p.id}${k}">${lbl}</label><input class="inp" id="p${p.id}${k}" data-pay="${p.id}" data-k="${k}" value="${esc(p[k])}" placeholder="${ph}" ${extra}></div>`;
      const s = (k, lbl, opts, ph) => `<div class="fld"><label for="p${p.id}${k}">${lbl}</label><select class="sel ${p[k] ? '' : 'is-empty'}" id="p${p.id}${k}" data-pay="${p.id}" data-k="${k}" data-act-change="pay"><option value="">${ph}</option>${opts.map(o => `<option ${p[k] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`;
      const body = p.type === 'bank'
        ? `<div class="grid2">${s('bank', 'Bank Name', Object.keys(PAYOUT_BANKS), 'Select bank…')}${s('branch', 'Bank Branch Name', p.bank ? PAYOUT_BANKS[p.bank] : [], p.bank ? 'Select branch…' : 'Select a bank first')}${f('holder', 'Account Holder Name', 'As it appears on the bank account')}<div>${f('acct', 'Account Number', 'e.g. 1002345678901', 'inputmode="numeric" dir="ltr"')}${err(p.acct && !/^\d{8,20}$/.test(p.acct.trim()), 'Enter the account number: 8 to 20 digits.')}</div></div>`
        : `<div class="grid2">${s('provider', 'Wallet Provider', WALLETS, 'Select provider…')}<div>${f('mobile', 'Wallet Mobile Number', 'e.g. 01012345678', 'inputmode="numeric" dir="ltr"')}${err(p.mobile && !/^01\d{9}$/.test(p.mobile.trim()), 'Enter the 11-digit wallet mobile number, e.g. 01012345678.')}</div>${f('wholder', 'Wallet Holder Name', 'Name registered on the wallet')}</div>`;
      return `<div class="item" id="pay-${p.id}"><div class="item-h"><b>Payout method ${i + 1}${!prim && p.name.trim() ? ': ' + esc(p.name) : ''}</b><span class="tag info">${p.type === 'bank' ? 'Bank Account' : 'E-Wallet'}</span>${prim ? '<span class="tag ok">Primary</span>' : ''}<span class="sp"></span>${!prim ? `<button type="button" class="btn btn-ghost btn-sm" data-act="primary" data-i="${p.id}">Make primary</button>` : ''}<button type="button" class="icon-btn" data-act="rmPay" data-i="${p.id}" aria-label="Remove payout method ${i + 1}">${icon('x', 'ic')}</button></div>
        ${!prim ? `<div class="fld"><label for="p${p.id}name">Payout Method Name</label><input class="inp" id="p${p.id}name" data-pay="${p.id}" data-k="name" value="${esc(p.name)}" placeholder="e.g. POS or Branch Korba"></div>` : ''}${body}</div>`;
    }).join('');
    return `<div class="items">${items || '<div class="empty-line">No payout methods added yet</div>'}</div><div class="row-acts"><button type="button" class="btn btn-outline btn-sm" data-act="addPay" data-t="bank">${icon('plus', 'ic')}Add bank account</button><button type="button" class="btn btn-outline btn-sm" data-act="addPay" data-t="wallet">${icon('plus', 'ic')}Add e-wallet</button></div>`;
  }
  function contractsSection() {
    const req = requiredContracts();
    const reqRows = req.map(r => `<div class="up"><div class="tt"><b>${esc(r.label)}${S.reqContracts[r.label] ? '<span class="tag ok">Uploaded</span>' : ''}</b><span class="m">${esc(r.text)}</span></div><div class="acts">${S.reqContracts[r.label] ? fileChip(S.reqContracts[r.label], 'rmReqC', { l: r.label }) : `<button type="button" class="btn btn-outline btn-sm" data-act="upReqC" data-l="${esc(r.label)}">${icon('upload', 'ic')}Upload</button>`}</div></div>`).join('');
    const opt = S.contracts.map((c, i) => `<div class="up"><div class="tt" style="min-width:220px"><label class="sr-only" for="ct${c.id}">Contract ${i + 1} label</label><input class="inp" id="ct${c.id}" data-con="${c.id}" value="${esc(c.label)}" placeholder="e.g. Kashier Merchant Agreement"></div><div class="acts">${c.file ? fileChip(c.file, 'rmConF', { i: c.id }) : `<button type="button" class="btn btn-outline btn-sm" data-act="upCon" data-i="${c.id}">${icon('upload', 'ic')}Upload</button>`}<button type="button" class="icon-btn" data-act="rmCon" data-i="${c.id}" aria-label="Remove contract ${i + 1}">${icon('x', 'ic')}</button></div></div>`).join('');
    return `${req.length ? `<div class="ups">${reqRows}</div>` : '<div class="note">' + icon('info', 'ic') + '<p>No contract is required for the services chosen so far.</p></div>'}
      <p class="hint" style="margin:0">${req.length ? 'Attach any other contracts already signed with this merchant.' : 'Attach any contracts already signed with this merchant.'} Give each one a label, then upload its file.</p>
      ${opt ? `<div class="ups">${opt}</div>` : '<div class="empty-line">No contracts added yet.</div>'}
      <button type="button" class="btn btn-outline btn-sm" data-act="addCon" style="align-self:flex-start">${icon('plus', 'ic')}Add contract</button>`;
  }
  function checklistHTML({ title = true } = {}) {
    const cl = checklist(), n = cl.filter(i => !i.done).length;
    return `${title ? `<h2 class="sub-h" style="font-size:16px">${n ? `Complete these ${n} to submit the application` : 'Ready to submit'}</h2>` : ''}<ul class="cl">${cl.map(i => `<li class="${i.done ? 'done' : ''}"><span class="ci">${i.done ? icon('tick', 'ic-14', 2.5) : ''}</span>${i.done ? `<span class="lb">${i.label}${i.opt ? ' <span class="opt">(optional)</span>' : ''}</span>` : `<button type="button" class="lb" data-act="goto" data-t="${esc(i.target)}">${i.label}${i.opt ? ' <span class="opt">(optional)</span>' : ''}${i.hint ? `<small>${esc(i.hint)}</small>` : ''}</button>`}</li>`).join('')}</ul>`;
  }

  /* Card options: currencies, advanced operations, notes (FIN-28405). */
  function cardOptions(id) {
    const c = S.svc[id];
    return `<div class="opts">
      <fieldset class="opt-g"><legend>Accepted currencies</legend><div class="opt-l">${CURRENCIES.map(cu => { const lock = c.model === 'PF'; const on = lock ? cu === 'EGP' : c.currencies.includes(cu); return `<label class="cbx ${lock ? 'dis' : ''}"><input type="checkbox" data-act-change="cur" data-id="${esc(id)}" value="${cu}" ${on ? 'checked' : ''} ${lock ? 'disabled' : ''}>${cu}</label>`; }).join('')}</div>${c.model === 'PF' ? '<span class="hint">PF settles in EGP only. Pick PSP for other currencies.</span>' : ''}</fieldset>
      <fieldset class="opt-g"><legend>Advanced operations</legend><div class="opt-l">${OPS[chOf(id)].map(o => `<label class="cbx"><input type="checkbox" data-act-change="op" data-id="${esc(id)}" value="${esc(o)}" ${c.ops.includes(o) ? 'checked' : ''}>${esc(o)}</label>`).join('')}</div></fieldset>
      <div class="fld opt-n"><label for="nt-${esc(id).replace(/\W/g, '')}">Notes <span class="opt">(optional)</span></label><textarea class="inp" id="nt-${esc(id).replace(/\W/g, '')}" data-note="${esc(id)}" placeholder="Any comment about this setup…">${esc(c.notes)}</textarea></div></div>`;
  }
  const optsSummary = id => { const c = S.svc[id]; const cur = c.model === 'PF' ? ['EGP'] : c.currencies; return `${cur.join(', ')} · ${c.ops.length ? c.ops.join(', ') : 'No advanced operations'}${c.notes.trim() ? ' · Note added' : ''}`; };
  const modelSelect = (id, cls = 'sel') => `<select class="${cls}" data-act-change="model" data-id="${esc(id)}" aria-label="Model for ${esc(label(id))}">${['PF', 'PSP'].map(m => `<option value="${m}" ${S.svc[id].model === m ? 'selected' : ''}>${m} - ${chOf(id)}</option>`).join('')}</select>`;
  function bankSelect(id, li, cls = 'sel') {
    const c = S.svc[id], line = c.lines[li], used = c.lines.filter((l, i) => i !== li).map(l => l.bank);
    return `<select class="${cls} ${line.bank ? '' : 'is-empty'}" data-act-change="bank" data-id="${esc(id)}" data-li="${li}" aria-label="Financial institution for ${esc(label(id))}"><option value="">Select institution</option>${BANKS.filter(b => !used.includes(b) || b === line.bank).map(b => `<option ${line.bank === b ? 'selected' : ''}>${b}</option>`).join('')}</select>`;
  }
  const canAddInst = id => multiBank(id) && S.svc[id].lines.every(l => l.bank) && S.svc[id].lines.length < BANKS.length;
  function moneyParts(id, li, t) {
    const line = S.svc[id].lines[li], s = line.rates[t.key] || { rate: '', fee: '' }, v = verdict(id, line, t);
    const w = v.tier === 'manager' || v.tier === 'head', k = `${esc(id)}|${li}|${t.key}`;
    const lid = (id + li + t.key).replace(/\W/g, '');
    return [`<span class="money ${w ? 'warn' : ''}"><input id="r${lid}" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${esc(s.rate)}" data-rate="${k}|rate" aria-label="${esc(label(id))} ${esc(t.label)} fee percent"><span class="u">%</span></span>`,
      `<span class="money ${w ? 'warn' : ''}"><input id="f${lid}" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${esc(s.fee)}" data-rate="${k}|fee" aria-label="${esc(label(id))} ${esc(t.label)} flat fee EGP"><span class="u">EGP</span></span>`];
  }
  const moneyInputs = (id, li, t) => moneyParts(id, li, t).join('');
  const sourceHTML = (id, li) => { const l = S.svc[id].lines[li]; if (l.custom) return `<span class="src">${icon('pencil', 'ic-14')}Custom pricing</span>`; if (l.rule) { const r = l.rule.split('::'); return `<span class="src">${icon('check', 'ic-14')}From pricing rule · ${esc(r[1])}${r[0] ? ' · ' + esc(r[0]) : ''}</span>`; } return ''; };
  function bestRule(id, li) { const used = S.svc[id].lines.filter((l, i) => i !== li).map(l => l.bank); const rs = sortedRules(id).filter(r => !used.includes(r.bank)); return rs[0] || null; }

  /* ---------- Service add / remove ---------- */
  function addService(id) {
    if (S.svc[id]) return;
    S.svc[id] = { model: 'PF', currencies: ['EGP'], ops: [], notes: '', lines: [blankLine()] };
    S.order.push(id); S.order.sort((a, b) => SERVICES.indexOf(a) - SERVICES.indexOf(b));
    log(`added service: ${nmOf(id)} (${chOf(id)})`, 'plus', '', id);
  }
  function removeService(id, { quiet = false } = {}) {
    const snap = JSON.stringify({ c: S.svc[id], just: S.just, terminals: S.terminals });
    delete S.svc[id]; delete S.cases[id]; S.order = S.order.filter(x => x !== id);
    Object.keys(S.just).forEach(k => { if (k.startsWith(id + '::')) delete S.just[k]; });
    if (!hasCh('POS')) S.terminals = '';
    log(`removed service: ${nmOf(id)} (${chOf(id)})`, 'x', '', id);
    if (!quiet) toast(`${label(id)} removed and its values cleared`, () => { const o = JSON.parse(snap); S.svc[id] = o.c; S.order.push(id); S.order.sort((a, b) => SERVICES.indexOf(a) - SERVICES.indexOf(b)); S.just = o.just; S.terminals = o.terminals; rerender(); });
  }

  /* ---------- Read-only view (submitted / canceled) ---------- */
  function approvalCard() {
    const fl = flagged().filter(f => caseStatus(f.id) === 'Waiting Rate Approval'); if (!isApprover() || !fl.length) return '';
    const mineLeft = fl.filter(f => f.approver === ME.tier && !decisionOf(f)).length;
    const rows = fl.map(f => { const d = decisionOf(f), m = f.approver === ME.tier; return `<div class="ap-row ${m && !d ? 'mine' : ''}">
        <div class="ap-what"><span class="tag info">${chOf(f.id)}</span><b>${esc(nmOf(f.id))}${f.line.bank ? ' · ' + esc(f.line.bank) : ''}</b><span class="muted">${f.t.label}</span></div>
        <div class="ap-rate"><span><span class="k">Requested</span><b class="num">${rateText(f.sel)}</b></span><span><span class="k">Published</span><span class="num">${pubText(f.p)}</span></span><span><span class="k">Approver</span><span>${f.approver}</span></span></div>
        <p class="ap-why">${icon('pencil', 'ic-14')}<span>${S.just[f.key] ? esc(S.just[f.key]) : '<span class="muted">No justification</span>'}</span></p>
        <div class="ap-act">${d ? `<span class="flag ${d.decision === 'approved' ? 'ok' : 'h'}">${icon(d.decision === 'approved' ? 'check' : 'xcircle', 'ic-14')}${d.decision === 'approved' ? 'Approved' : 'Rejected'} by ${esc(d.by)}${d.comment ? ' · ' + esc(d.comment) : ''}</span>` : m ? `<button type="button" class="btn btn-outline-danger btn-sm" data-act="reject" data-k="${esc(f.key)}">Reject</button><button type="button" class="btn btn-outline btn-sm" data-act="approve" data-k="${esc(f.key)}">${icon('tick', 'ic', 2)}Approve</button>` : `<span class="hint">Waiting for the ${f.approver}</span>`}</div></div>`; }).join('');
    return `<section class="card sec" id="approval" aria-labelledby="apH"><div class="sec-h"><div class="tt"><h2 id="apH">Rates waiting for your approval</h2><p>${mineLeft ? `${mineLeft} rate${mineLeft > 1 ? 's' : ''} need${mineLeft > 1 ? '' : 's'} your decision.` : 'You have decided every rate assigned to you.'}${S.submitComment ? ` Salesperson's note: “${esc(S.submitComment)}”` : ''}</p></div></div><div class="ap-list">${rows}</div></section>`;
  }
  /* Request a new service on a submitted application (FIN-30790): it becomes a new, independent case; existing cases stay read-only and unchanged. */
  function submitCase(id) {
    if (svcIssues(id).length) { toast('Finish the service setup first'); return false; }
    const go = () => { setCase(id, caseRoute(id)); log(`requested a new service: ${label(id)}`, 'send', `${S.cases[id].caseId} · ${caseRoute(id) === 'Waiting Rate Approval' ? 'rates need approval' : 'no approval needed'}`, id); rerender(); toast(`${label(id)} submitted as ${S.cases[id].caseId}`); };
    if (needsApproval().some(f => f.id === id && !rejectedStill(f))) openJustify(go); else go();
    return false;
  }
  const liveOf = id => (S.cases[id] && S.cases[id].liveSince) || S.liveSince || '';
  const banksOf = id => S.svc[id].lines.map(l => l.bank).filter(Boolean);
  function trackOf(id) {
    const st = caseStatus(id), fl = flagged().filter(f => f.id === id);
    const reviewed = fl.filter(f => decisionOf(f)).length, approvedN = fl.filter(approvedOk).length;
    const steps = fl.length ? ['Submitted', 'Rate Approval', 'Underwriting Review', 'Bank Submission'] : ['Submitted', 'Underwriting Review', 'Bank Submission'];
    if (st === 'Live') steps.push('Live');
    const cur = st === 'Live' ? steps.length : st === 'Waiting Rate Approval' ? 1 : st === 'Underwriting Review' ? (fl.length ? 2 : 1) : st === 'Bank Submission' ? steps.length - 1 : -1;
    if (st === 'Canceled' || st === 'New') return '';
    return `<ol class="track">${steps.map((t, k) => `<li class="${k < cur ? 'done' : k === cur ? 'now' : ''}"><span class="d">${k < cur ? icon('tick', 'ic-14', 2.5) : k + 1}</span><b>${t}</b><span class="hint">${k === 0 ? esc(S.submittedAt) : t === 'Live' ? esc(liveOf(id)) : t === 'Rate Approval' && k <= cur ? (st === 'Waiting Rate Approval' ? `${approvedN} approved · ${fl.length - reviewed} to review` : 'All rates approved') : ''}</span></li>`).join('')}</ol>`;
  }
  /* Who rejected a case and why: the Sales Manager / Head of Sales (a rate) or the Underwriting team. */
  function rejectBox(id) {
    const r = (S.cases[id] || {}).reject || {}, uw = r.source === 'uw';
    return `<div class="rj-box">${icon('xcircle', 'ic-16')}<div><b>Rejected by ${uw ? 'the Underwriting team' : `${esc(r.by)} (${esc(r.role)})`}</b>${r.comment ? `<p>${esc(r.comment)}</p>` : ''}<p class="rj-h">${uw ? 'Fix what the Underwriting team asked for, then resubmit this case.' : 'Change the rejected rate, then resubmit this case.'}</p></div></div>`;
  }
  /* A row in the profile's case list: ID, service and status. Opening it shows the whole case. */
  function caseRow(id) {
    const st = caseStatus(id), c = S.cases[id] || {}, svc = S.svc[id];
    const draft = st === 'New', ready = draft && !svcIssues(id).length, rej = st === 'Rejected', cx = st === 'Canceled';
    const note = draft ? (ready ? 'Not submitted yet. It becomes its own case when you submit it.' : `Not submitted yet. ${esc(svcIssues(id)[0])}.`) : '';
    const view = `<button type="button" class="btn btn-outline btn-sm" data-act="openCase" data-id="${esc(id)}" aria-label="View case ${esc(c.caseId || label(id))}">View case${icon('right', 'ic mirror')}</button>`;
    const acts = draft ? `<button type="button" class="btn btn-outline btn-sm" data-act="editSvc" data-id="${esc(id)}">Edit setup</button><button type="button" class="btn btn-outline-danger btn-sm" data-act="rmSvc" data-id="${esc(id)}">Remove</button><button type="button" class="btn btn-primary btn-sm" data-act="submitCase" data-id="${esc(id)}" ${ready ? '' : 'disabled'}>Submit request</button>`
      : rej ? `${isApprover() ? '' : '<button type="button" class="btn btn-primary btn-sm" data-act="fix">Review and resubmit</button>'}${view}`
      : cx ? `${isApprover() ? '' : `<button type="button" class="btn btn-outline btn-sm" data-act="reopen" data-id="${esc(id)}">Reopen Case</button>`}${view}`
      : view;
    return `<div class="crow ${draft ? 'draft' : ''} ${cx ? 'cx' : ''}" id="case-${id.replace(/\W/g, '')}"><div class="crow-m"><div class="crow-t">${c.caseId ? `<span class="cid">${esc(c.caseId)}</span>` : ''}<span class="tag info">${chOf(id)}</span><b>${esc(nmOf(id))}</b>${draft ? '<span class="sc neu">Not submitted</span>' : caseChip(id)}</div>
      ${note ? `<div class="crow-n">${note}</div>` : ''}${rej ? rejectBox(id) : ''}</div><div class="crow-a">${acts}</div></div>`;
  }
  /* The merchant identity card: a submitted application (sub) or a new one from the CRM lead. */
  function profileHead(sub) {
    const initials = S.merchant.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    return `<section class="card prof-h"><span class="prof-av" aria-hidden="true">${esc(initials)}</span>
      <div class="prof-id"><h2>${esc(S.merchant.name || 'New merchant')}${sub && S.mid ? ` <span class="mid" title="Account MID">${esc(S.mid)}</span>` : ''}</h2><p>${esc(S.industry)} · ${esc(S.entity)}${S.owner ? ' · ' + esc(S.owner) : ''}</p>
        <div class="prof-meta"><span class="mi">${icon('user', 'ic-14')}<a href="mailto:${esc(S.merchant.email)}">${esc(S.merchant.email)}</a></span><span class="mi" dir="ltr">${esc(S.merchant.phone)}</span>${sub ? `<span class="mi">${icon('link', 'ic-14')}<span>${esc(S.appId)}</span></span><span class="mi">${icon('send', 'ic-14')}<span>Submitted ${esc(S.submittedAt)} by ${esc(S.submittedBy || 'Aya Muhammed')}</span></span>` : ''}</div></div></section>`;
  }
  /* Case detail: everything about one service request in one place, with its own activity log. */
  function caseLogHTML(id) {
    const ts = e => { const d = Date.parse(e.t); return isNaN(d) ? 0 : d; };
    const rows = S.log.map((e, i) => ({ e, i })).filter(x => x.e.id === id || !x.e.id).sort((a, b) => (ts(b.e) - ts(a.e)) || (a.i - b.i)).map(x => x.e);
    return `<ul class="log">${rows.map(e => `<li><span class="li">${icon(e.ic || 'pencil', 'ic-16')}</span><div><div class="t num">${esc(e.t)}</div><div><b>${esc(e.who)}</b> ${esc(e.text)}</div>${e.detail ? `<div class="d">${esc(e.detail)}</div>` : ''}</div></li>`).join('')}</ul>`;
  }
  function caseRates(id) {
    const svc = S.svc[id], fl = flagged().filter(f => f.id === id), past = ['Underwriting Review', 'Bank Submission', 'Live'].includes(caseStatus(id));
    const rows = svc.lines.map(l => tiersFor(id, l).map(t => {
      const sel = l.rates[t.key] || {}, f = fl.find(x => x.key === `${id}::${l.bank}::${t.key}`), d = f && decisionOf(f), p = pubFor(id, l, t);
      const appr = !f ? '<span class="hint">No approval needed</span>'
        : d ? `<span class="sc ${d.decision === 'approved' ? 'ok' : 'bad'}">${d.decision}</span> <span class="hint">${esc(d.by)} (${esc(d.role)})${d.comment ? ' · ' + esc(d.comment) : ''}</span>`
        : past ? '<span class="sc ok">approved</span>' : `<span class="sc warn">Pending</span> <span class="hint">${f.approver}</span>`;
      const why = f && S.just[f.key] ? `<div class="hint" style="margin-top:4px">Justification: ${esc(S.just[f.key])}</div>` : '';
      return `<tr><td>${l.bank ? `<div class="hint">${esc(l.bank)}</div>` : ''}${esc(t.label)}</td><td class="num"><b>${fmtN(sel.rate)}% + ${fmtN(sel.fee)} EGP</b></td><td class="num">${pubText(p)}</td><td>${appr}${why}</td></tr>`;
    }).join('')).join('');
    return `<div class="rscroll" style="display:block"><table class="rtbl ro-svc"><thead><tr><th>Rate type</th><th>Requested</th><th>Published</th><th>Approval</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  let caseDr = null;
  function openCase(id) {
    const draw = () => {
      if (!S.svc[id]) { caseDr.api.close(true); return; }
      const st = caseStatus(id), c = S.cases[id] || {}, svc = S.svc[id], banks = banksOf(id);
      const note = st === 'Canceled' ? `Canceled. View only.${c.cancelComment ? ' Comment: ' + esc(c.cancelComment) : ''}`
        : st === 'Live' ? `The merchant went live with this service on ${esc(liveOf(id))}. View only.`
        : st === 'Waiting Rate Approval' ? 'Waiting for rate approval. It moves to Underwriting Review once every rate is approved, and comes back to the salesperson to edit if any is rejected.'
        : st === 'Rejected' ? 'Returned to the salesperson.' : `Submitted on ${esc(S.submittedAt)}. View only.`;
      const act = st === 'Live' || isApprover() ? '' : st === 'Canceled' ? `<button type="button" class="btn btn-outline btn-sm" data-cd="reopen">${icon('arrows', 'ic')}Reopen Case</button>` : `<button type="button" class="btn btn-outline-danger btn-sm" data-cd="cancel">Cancel Case</button>`;
      caseDr.api.setTitle(`${esc(label(id))}`, `${esc(c.caseId || '')} · ${esc(S.merchant.name)}`);
      caseDr.api.body.innerHTML = `<div class="cd-top"><div class="cd-st">${caseChip(id)}<span class="cid">${esc(c.caseId || '')}</span><span class="tag info">${chOf(id)}</span><span class="sp"></span>${act}</div><p class="case-n">${note}</p>${st === 'Rejected' ? rejectBox(id) + (isApprover() ? '' : '<div><button type="button" class="btn btn-primary btn-sm" data-cd="fix">Review and resubmit</button></div>') : ''}</div>
        <div class="cd-tabs" role="tablist" aria-label="Case sections"><button type="button" role="tab" aria-selected="${caseDr.tab === 'details'}" data-cdt="details">Details</button><button type="button" role="tab" aria-selected="${caseDr.tab === 'log'}" data-cdt="log">Activity log<span class="c">${S.log.filter(e => e.id === id || !e.id).length}</span></button></div>
        ${caseDr.tab === 'log' ? `<section class="cd-s">${caseLogHTML(id)}</section>` : `${trackOf(id) ? `<section class="cd-s"><h3 class="sub-h">Progress</h3>${trackOf(id)}</section>` : ''}
        <section class="cd-s"><h3 class="sub-h">Service details</h3><dl class="dl"><dt>Case ID</dt><dd>${esc(c.caseId || '')}</dd><dt>Service</dt><dd>${esc(nmOf(id))} · ${esc(SVC_HINT[nmOf(id)])}</dd><dt>Channel</dt><dd>${chOf(id)}</dd><dt>Model</dt><dd>${esc(svc.model)}</dd>
          ${needsBank(id) ? `<dt>Financial institution</dt><dd>${banks.length ? banks.map(esc).join(', ') : 'Not chosen'}</dd>` : ''}${chOf(id) === 'POS' ? `<dt>POS terminals</dt><dd>${esc(S.terminals || 'Not set')}</dd>` : ''}
          ${isCard(id) ? `<dt>Currencies and operations</dt><dd>${esc(optsSummary(id))}</dd>` : ''}${svc.notes && svc.notes.trim() ? `<dt>Notes</dt><dd>${esc(svc.notes)}</dd>` : ''}
          <dt>Submitted</dt><dd>${esc(S.submittedAt)} by ${esc(S.submittedBy || 'Aya Muhammed')}</dd><dt>Application</dt><dd>${esc(S.appId)} · ${esc(S.merchant.name)}</dd>${S.submitComment ? `<dt>Submit comment</dt><dd>${esc(S.submitComment)}</dd>` : ''}</dl></section>
        <section class="cd-s"><h3 class="sub-h">Rates and approvals</h3>${caseRates(id)}</section>`}`;
      caseDr.api.body.querySelectorAll('[data-cdt]').forEach(t => { t.onclick = () => { caseDr.tab = t.dataset.cdt; draw(); caseDr.api.body.scrollTop = 0; }; });
      const b = caseDr.api.body;
      const cb = b.querySelector('[data-cd=cancel]'), rb = b.querySelector('[data-cd=reopen]');
      if (cb) cb.onclick = () => openCancel(id); if (rb) rb.onclick = () => openReopen(id);
      const fb = b.querySelector('[data-cd=fix]'); if (fb) fb.onclick = () => { caseDr.api.close(true); S.fixing = true; rerender(); scrollTo(0, 0); };
    };
    caseDr = { draw, tab: 'details' };
    drawer({ size: 'xl', title: esc(label(id)), sub: '', onClose() { caseDr = null; }, render(api) { caseDr.api = api; draw(); } });
  }
  function readOnlyView() {
    const head = profileHead(true);
    const live = S.order.filter(id => caseStatus(id) === 'Live'), canceled = S.order.filter(id => caseStatus(id) === 'Canceled');
    const pending = S.order.filter(id => !['Live', 'Canceled'].includes(caseStatus(id))), pendingN = pending.filter(id => caseStatus(id) !== 'New').length;
    const allCanceled = S.order.length > 0 && !pending.length && !live.length;
    const banner = allCanceled ? `<div class="banner">${icon('info', 'ic-20')}<div><b>Every case on this application is canceled</b><p>No onboarding action is open. Reopen a case below, or request a new service to continue.</p></div></div>` : '';
    /* Active services: the live cases. Just the service and its full log, no detail view. */
    const activeSvc = `<section class="card sec"><div class="sec-h"><div class="tt"><h2>Active services</h2><p>Services that are live for the merchant.</p></div></div>${live.length ? `<div class="crows">${live.map(id => `<div class="crow"><div class="crow-m"><div class="crow-t"><b>${esc(label(id))}</b></div></div><div class="crow-a"><button type="button" class="btn btn-outline btn-sm" data-act="svcLogs" data-id="${esc(id)}">View logs</button></div></div>`).join('')}</div>` : '<p class="hint" style="margin:0">No active services yet. A service appears here once its case goes live.</p>'}</section>`;
    const casesMsg = !S.order.length ? 'No cases yet.' : !pending.length && !canceled.length ? 'No pending cases. Every case is live.' : !pending.length ? 'No pending cases.' : '';
    const cases = `<section class="card sec"><div class="sec-h"><div class="tt"><h2>Cases <span class="cnt" title="Pending cases">${pendingN}</span></h2><p>Each pending service is its own case with its own status. Open one to see its details and activity log.</p></div>${isApprover() ? '' : `<button type="button" class="btn btn-outline" data-act="addSvc">${icon('plus', 'ic')}Request new service</button>`}</div>${pending.length ? `<div class="crows">${pending.map(caseRow).join('')}</div>` : ''}${casesMsg ? `<p class="hint" style="margin:0">${casesMsg}</p>` : ''}${canceled.length ? `<details class="cgroup" ${pending.length ? '' : 'open'}><summary>Canceled cases · ${canceled.length}</summary><div class="crows">${canceled.map(caseRow).join('')}</div></details>` : ''}</section>`;
    const docs = [...requiredDocs().keys()].filter(docDone);
    const dl = rows => `<dl class="dl dl-s">${rows}</dl>`;
    const frow = (lbl, file) => `<div class="frow"><div class="fi"><b>${esc(lbl)}</b><span class="muted">${esc(file)}</span></div><div class="fa"><button type="button" class="btn btn-outline btn-sm" data-act="viewFile" data-f="${esc(file)}" data-l="${esc(lbl)}">${icon('eye', 'ic')}View</button><button type="button" class="btn btn-outline btn-sm" data-act="dlFile" data-f="${esc(file)}">${icon('download', 'ic')}Download</button></div></div>`;
    const docRows = docs.flatMap(d => Object.entries(S.docs[d]).map(([slot, f]) => frow(slotsOf(d).length > 1 ? `${d} · ${slot}` : d, f)));
    const conRows = Object.entries(S.reqContracts).map(([k, v]) => frow(k, v)).concat(S.contracts.map(c => frow(c.label, c.file)));
    const info = `<div class="prof-info">
      <section class="card sec prof-wide"><h2 class="sub-h">Business details</h2>${dl(`<dt>Business name</dt><dd>${esc(S.merchant.name)}</dd><dt>Merchant type</dt><dd>${esc(S.entity)}</dd><dt>Industry</dt><dd>${esc(S.industry)}</dd><dt>Activities</dt><dd>${S.activities.map(esc).join(', ')}</dd><dt>Owner nationality</dt><dd>${esc(S.owner || 'Not set')}</dd>${hasCh('POS') ? `<dt>POS terminals</dt><dd>${esc(S.terminals)}</dd>` : ''}`)}</section>
      <section class="card sec prof-wide"><div class="sub-hr"><h2 class="sub-h">Documents</h2>${docRows.length ? `<button type="button" class="btn btn-outline btn-sm" data-act="dlAll" data-k="docs" data-n="${docRows.length}">${icon('download', 'ic')}Download all (${docRows.length})</button>` : ''}</div>${docRows.length ? `<div class="frows">${docRows.join('')}</div>` : '<p class="hint" style="margin:0">None uploaded.</p>'}</section>
      <section class="card sec"><h2 class="sub-h">Payout methods</h2>${S.payouts.length ? `<div class="pm-list">${S.payouts.map((p, i) => `<div class="pm"><div class="pm-h"><b>${p.id === S.primary ? 'Primary payout method' : esc(p.name || 'Payout method ' + (i + 1))}</b><span class="tag info">${p.type === 'bank' ? 'Bank Account' : 'E-Wallet'}</span>${p.id === S.primary ? '<span class="tag ok">Primary</span>' : ''}</div>${dl((p.id !== S.primary && p.name ? `<dt>Method name</dt><dd>${esc(p.name)}</dd>` : '') + (p.type === 'bank' ? `<dt>Bank name</dt><dd>${esc(p.bank)}</dd><dt>Branch</dt><dd>${esc(p.branch)}</dd><dt>Account holder</dt><dd>${esc(p.holder)}</dd><dt>Account number</dt><dd dir="ltr" class="num">${esc(p.acct)}</dd>` : `<dt>Wallet provider</dt><dd>${esc(p.provider)}</dd><dt>Mobile number</dt><dd dir="ltr" class="num">${esc(p.mobile)}</dd><dt>Wallet holder</dt><dd>${esc(p.wholder)}</dd>`))}</div>`).join('')}</div>` : '<p class="hint" style="margin:0">None added.</p>'}</section>
      <section class="card sec"><div class="sub-hr"><h2 class="sub-h">Contracts</h2>${conRows.length ? `<button type="button" class="btn btn-outline btn-sm" data-act="dlAll" data-k="contracts" data-n="${conRows.length}">${icon('download', 'ic')}Download all (${conRows.length})</button>` : ''}</div>${conRows.length ? `<div class="frows">${conRows.join('')}</div>` : '<p class="hint" style="margin:0">None attached.</p>'}</section></div>`;
    return `${head}${banner}<div class="prof-g"><div class="prof-main">${approvalCard()}${info}</div><aside class="prof-side">${activeSvc}${cases}</aside></div>`;
  }

  /* ---------- Presets (prototype only) ---------- */
  function submitDemo() { if (!S.mid) S.mid = (new URLSearchParams(location.search).get('mid')) || 'MID-10200-100'; S.log.forEach(e => { if (e.t.slice(0, 10) === nowStr().slice(0, 10)) e.t = '09/02/2026, 09:00:00 AM'; }); S.appId = 'APP-24081306'; S.submittedAt = '06 Sept 2026'; S.submittedBy = 'Aya Muhammed'; S.submitComment = 'Two rates below published, both justified. The merchant wants to go live before Black Friday.'; S.order.forEach(id => { setCase(id, caseRoute(id)); S.log.unshift({ t: '09/06/2026, 05:20:01 PM', who: 'Aya Muhammed', text: `submitted the ${label(id)} case`, ic: 'send', detail: `${S.cases[id].caseId} · ${S.cases[id].status}`, id }); }); S.log.unshift({ t: '09/06/2026, 05:20:00 PM', who: 'Aya Muhammed', text: 'submitted the application', ic: 'send', detail: 'Application ID APP-24081306' }); }
  function rejectDemo(target) {
    const fl = flagged(), wid = (fl.find(f => f.id === (target || 'Online Wallet')) || fl[0]).id, ws = fl.filter(f => f.id === wid), b = target ? null : fl.find(f => f.id !== wid);
    if (b) S.decisions[b.key] = { decision: 'approved', by: 'Nadia Salah', role: 'Sales Manager', comment: '', rate: b.sel.rate, fee: b.sel.fee, at: '09/07/2026, 10:02:00 AM' };
    ws.forEach((w, k) => { S.decisions[w.key] = { decision: 'rejected', by: 'Karim Zaki', role: 'Head of Sales', comment: wid === 'Online Wallet' ? '0.6% is below cost for this volume. 0.85% is the lowest we can offer.' : k === 0 ? 'This rate is below cost for this volume. Please quote a higher rate.' : 'Same reason as the first rate.', rate: w.sel.rate, fee: w.sel.fee, at: '09/07/2026, 11:40:00 AM' }; delete S.just[w.key]; });
    settleCases();
  }
  /* The Underwriting team returns a case after the rates were already approved (documents, KYC and so on). */
  function uwRejectDemo(id) {
    setCase(id, 'Rejected', { reject: { source: 'uw', by: 'Underwriting team', role: 'Underwriting', comment: 'Commercial Registration is expired. Upload a valid copy.', at: '09/10/2026, 02:30:00 PM' } });
    S.log.unshift({ t: '09/10/2026, 02:30:00 PM', who: 'Underwriting team', text: `rejected the ${label(id)} case`, ic: 'xcircle', detail: 'Commercial Registration is expired. Upload a valid copy.', id });
  }
  function preset(name) {
    const as = S.viewAs;
    S = blankState(); S.viewAs = as;
    if (name === 'waiting' || name === 'returned') { preset('ready'); submitDemo(); if (name === 'returned') rejectDemo(); return; }
    if (name === 'new') return;
    addService('Online Card'); applyRule('Online Card', 0, sortedRules('Online Card')[0], false);
    addService('Online Wallet'); S.svc['Online Wallet'].lines[0].rates.selling = { rate: '0.6', fee: '1.5' }; S.svc['Online Wallet'].lines[0].custom = true;
    addService('POS Card'); S.svc['POS Card'].lines[0].bank = 'National Bank of Egypt'; S.svc['POS Card'].lines[0].rates = { local: { rate: '1.8', fee: '2' } };
    addService('Online Bank Installments'); applyRule('Online Bank Installments', 0, sortedRules('Online Bank Installments').find(r => r.bank === 'Bank Misr'), false);
    S.terminals = name === 'ready' ? '3' : '';
    S.websites = ['www.deltapharma.eg'];
    S.docs['National ID'] = { 'Front side': 'national-id-front.jpg', 'Back side': 'national-id-back.jpg' };
    if (name === 'ready') {
      S.svc['POS Card'].lines[0].rates['intl-EGP'] = { rate: '2.7', fee: '3' };
      S.storeImage = 'storefront-heliopolis.jpg';
      S.docs['Commercial Registration (CR)'] = { File: 'cr-delta-pharma.pdf' };
      S.payouts = [{ id: 1, type: 'bank', name: '', bank: 'National Bank of Egypt', branch: 'Heliopolis', holder: 'Delta Pharma Group', acct: '1002345678901', provider: '', mobile: '', wholder: '' }]; S.primary = 1; S.nextPayout = 2;
      requiredContracts().forEach(r => { S.reqContracts[r.label] = r.label.toLowerCase().replace(/\s+/g, '-') + '-signed.pdf'; });
      S.svc['Online Bank Installments'].lines[0].rates.selling = { rate: '0.9', fee: '1.5' }; S.svc['Online Bank Installments'].lines[0].custom = true;
      flagged().forEach(f => { S.just[f.key] = f.id === 'Online Wallet' ? 'Moving 600K EGP/month from a competitor that charges 0.6% on wallets.' : 'Large grocery baskets; installments drive their loyalty programme.'; });
    }
    S.log.unshift({ t: nowStr(), who: ME.name, text: 'started the application', ic: 'pencil' });
  }

  /* ---------- Events ---------- */
  const setPath = (p, v) => { const ks = p.split('.'); let o = S; while (ks.length > 1) o = o[ks.shift()]; o[ks[0]] = v; };
  let rendering = false;
  function rerender(opts = {}) {
    if (!opts.keepPop) closePop();
    const ae = document.activeElement, fid = ae && ae.id, sel = ae && 'selectionStart' in ae ? [ae.selectionStart, ae.selectionEnd] : null;
    const sx = scrollX, sy = scrollY;
    save(); rendering = true;
    try {
      V.render();
      bindStatic(); V.afterRender && V.afterRender();
    } finally { rendering = false; }
    if (caseDr && caseDr.api && caseDr.api.el.isConnected) caseDr.draw();
    scrollTo(sx, sy);
    if (fid) { const n = document.getElementById(fid); if (n && n !== document.activeElement) { n.focus({ preventScroll: true }); if (sel && 'setSelectionRange' in n) try { n.setSelectionRange(sel[0], sel[1]); } catch (e) { } } }
    if (opts.keepPop && popEl && popBtn && !popBtn.isConnected) { const nb = document.querySelector(`[data-act="${popBtn.dataset.act}"]`); if (nb) { popBtn = nb; nb.setAttribute('aria-expanded', 'true'); } }
  }
  /* Typing updates only the live regions, so focus and caret stay put. */
  function soft() { save(); document.querySelectorAll('[data-live]').forEach(el => { const f = V.live && V.live[el.dataset.live]; if (f) el.innerHTML = f(el); }); }
  const fake = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const ACT = {
    logs: () => openLogs(),
    viewFile: d => { modal({ title: esc(d.l), sub: esc(d.f), body: `<div class="fprev">${icon('doc', 'ic-24')}<b>${esc(d.f)}</b><span class="hint">Preview of the uploaded file. The prototype does not store real files.</span></div>`, foot: `<button type="button" class="btn btn-outline" data-n>Close</button><button type="button" class="btn btn-primary" data-y>${icon('download', 'ic')}Download</button>`, bind(api) { api.el.querySelector('[data-n]').onclick = api.close; api.el.querySelector('[data-y]').onclick = () => { api.close(); toast(`Downloading ${d.f}`); }; } }); return false; },
    dlFile: d => { toast(`Downloading ${d.f}`); return false; },
    svcLogs: d => { const id = d.id; drawer({ size: 'md', title: 'Activity log', sub: `${esc(label(id))} · ${esc((S.cases[id] || {}).caseId || '')}`, render(api) { api.body.innerHTML = caseLogHTML(id); } }); return false; },
    dlAll: d => { const f = d.k === 'docs' ? 'documents' : 'contracts'; toast(`Downloading ${d.n} file${+d.n === 1 ? '' : 's'} as ${f}-${S.appId.toLowerCase()}.zip`); return false; },
    fix: () => { S.fixing = true; scrollTo(0, 0); },
    stopFix: () => { S.fixing = false; scrollTo(0, 0); },
    submitCase: d => submitCase(d.id),
    openCase: d => { openCase(d.id); return false; },
    cancel: d => openCancel(d.id),
    reopen: d => openReopen(d.id),
    submit: () => openSubmit(),
    justify: () => openJustify(),
    entity: d => { if (S.entity !== d.v) { log(`changed Merchant Type from ${S.entity || 'none'} to ${d.v}`); S.entity = d.v; reprice('merchant type'); } },
    owner: d => { S.owner = S.owner === d.v ? '' : d.v; },
    acts: (d, el) => openActivities(el),
    rmAct: d => setActivity(d.v, false),
    pricing: d => openPricing(d.id, +d.li),
    addInst: d => { const c = S.svc[d.id]; const used = c.lines.map(l => l.bank); const nb = BANKS.find(b => !used.includes(b)); const l = blankLine(); l.bank = nb || ''; c.lines.push(l); log(`added institution: ${label(d.id)} · ${l.bank}`, 'plus'); },
    rmInst: d => { const c = S.svc[d.id]; const l = c.lines.splice(+d.li, 1)[0]; log(`removed institution: ${label(d.id)} · ${l.bank}`, 'x'); },
    rmSvc: d => removeService(d.id),
    addLink: () => { S.websites.push(''); setTimeout(() => document.getElementById('ws' + (S.websites.length - 1))?.focus()); },
    rmLink: d => S.websites.splice(+d.i, 1),
    upDoc: d => { S.docs[d.n] = S.docs[d.n] || {}; S.docs[d.n][d.sl] = fake(d.n) + (d.sl === 'File' ? '' : '-' + fake(d.sl)) + '.pdf'; log(`uploaded document: ${d.n}${d.sl === 'File' ? '' : ' (' + d.sl + ')'}`, 'upload'); },
    rmDoc: d => { delete S.docs[d.n][d.sl]; if (d.n === TAX_DOC) S.taxInvoice = false; },
    upStore: () => { S.storeImage = 'storefront.jpg'; log('uploaded Store Image', 'upload'); },
    rmStore: () => { S.storeImage = ''; },
    addPay: d => { const p = { id: S.nextPayout++, type: d.t, name: '', bank: '', branch: '', holder: '', acct: '', provider: '', mobile: '', wholder: '' }; S.payouts.push(p); if (S.primary == null) S.primary = p.id; setTimeout(() => document.querySelector(`#pay-${p.id} input, #pay-${p.id} select`)?.focus()); },
    rmPay: d => { S.payouts = S.payouts.filter(p => p.id !== +d.i); if (S.primary === +d.i) S.primary = S.payouts[0] ? S.payouts[0].id : null; },
    primary: d => { S.primary = +d.i; },
    upReqC: d => { S.reqContracts[d.l] = fake(d.l) + '-signed.pdf'; log(`uploaded contract: ${d.l}`, 'upload'); },
    rmReqC: d => { delete S.reqContracts[d.l]; },
    addCon: () => { const c = { id: S.nextContract++, label: '', file: '' }; S.contracts.push(c); setTimeout(() => document.getElementById('ct' + c.id)?.focus()); },
    rmCon: d => { S.contracts = S.contracts.filter(c => c.id !== +d.i); },
    upCon: d => { const c = S.contracts.find(x => x.id === +d.i); c.file = (fake(c.label) || 'contract') + '.pdf'; },
    rmConF: d => { S.contracts.find(x => x.id === +d.i).file = ''; },
    goto: d => V.onGoto && V.onGoto(d.t),
    approve: d => { const f = flagged().find(x => x.key === d.k); if (f) { decide(f, 'approved'); toast(`Rate approved: ${label(f.id)}`); } },
    reject: d => { const f = flagged().find(x => x.key === d.k); if (f) openReject(f); return false; },
    watch: () => { S.watch[ME.key] = !S.watch[ME.key]; toast(S.watch[ME.key] ? 'Watching: you will be emailed about every change to this application' : 'Stopped watching this application'); }
  };
  const CHG = {
    industry: el => { const v = el.value; if (v && !S.activities.includes(v)) S.activities.unshift(v); log(`changed Industry from ${S.industry || 'none'} to ${v || 'none'}`); S.industry = v; reprice("activities'"); },
    model: el => { const c = S.svc[el.dataset.id]; c.model = el.value; if (el.value === 'PF') c.currencies = ['EGP']; c.lines.forEach(l => { if (!l.rule) l.rates = {}; }); log(`changed Model of ${label(el.dataset.id)} to ${el.value}`); reprice('model'); },
    bank: el => { const c = S.svc[el.dataset.id], l = c.lines[+el.dataset.li]; l.bank = el.value; if (l.rule) { l.rule = null; l.custom = Object.keys(l.rates).length > 0; } },
    cur: el => { const c = S.svc[el.dataset.id]; c.currencies = el.checked ? [...new Set(c.currencies.concat(el.value))] : c.currencies.filter(x => x !== el.value); if (!c.currencies.length) c.currencies = ['EGP']; },
    op: el => { const c = S.svc[el.dataset.id]; c.ops = el.checked ? c.ops.concat(el.value) : c.ops.filter(x => x !== el.value); },
    tax: el => { S.taxInvoice = el.checked; },
    pay: el => { const p = S.payouts.find(x => x.id === +el.dataset.pay); p[el.dataset.k] = el.value; if (el.dataset.k === 'bank') p.branch = ''; S.visited['p' + p.id] = true; }
  };
  let bound = false;
  function bindStatic() {
    if (bound) return; bound = true;
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b || b.disabled || !b.closest('#page,.pop,.drawer[data-sa]')) return;
      const f = ACT[b.dataset.act] || (V.act && V.act[b.dataset.act]); if (!f) return;
      e.preventDefault();
      const keep = f(b.dataset, b);
      if (!['logs', 'cancel', 'reopen', 'submit', 'submitCase', 'openCase', 'dlAll', 'viewFile', 'dlFile', 'svcLogs', 'justify', 'acts', 'pricing', 'goto'].includes(b.dataset.act) && keep !== false) rerender();
    });
    document.addEventListener('change', e => {
      const el = e.target; const k = el.dataset && el.dataset.actChange; if (!k) return;
      const f = CHG[k] || (V.chg && V.chg[k]); if (!f) return; f(el); rerender();
    });
    document.addEventListener('input', e => {
      const el = e.target, d = el.dataset || {};
      if (d.path) setPath(d.path, el.value);
      else if (d.rate) { const [id, li, key, part] = d.rate.split('|'); const line = S.svc[id].lines[+li]; line.rates[key] = line.rates[key] || { rate: '', fee: '' }; line.rates[key][part] = el.value.replace(',', '.'); if (line.rule) line.custom = true; }
      else if (d.web != null) S.websites[+d.web] = el.value;
      else if (d.note) S.svc[d.note].notes = el.value;
      else if (d.pay) { const p = S.payouts.find(x => x.id === +d.pay); p[d.k] = el.value; }
      else if (d.con) { S.contracts.find(x => x.id === +d.con).label = el.value; }
      else if (d.term != null) S.terminals = el.value;
      else if (V.input && V.input(el)) { }
      else return;
      soft();
    });
    document.addEventListener('focusout', e => {
      const el = e.target, d = el.dataset || {};
      if (rendering || !el.isConnected) return;
      if (d.path && d.path.startsWith('merchant.')) { S.visited.merchant = true; setTimeout(() => rerender()); }
      else if (d.rate || d.web != null || d.term != null || d.pay) { if (d.pay) S.visited['p' + d.pay] = true; setTimeout(() => { const a = document.activeElement; if (!a || !a.closest || !a.closest('.modal,.drawer:not([data-sa]),.pop')) rerender(); }); }
    });
  }

  /* ---------- Shell ---------- */
  /* Agent-portal navigation, grouped as on staging. My Applications sits under Merchants. */
  const NAV = [['', [['home', 'Home']]],
    ['Merchants', [['user-group', 'My Applications', true], ['building-storefront', 'Merchants'], ['briefcase', 'Business Industries'], ['document-text', 'Document Types'], ['clipboard-document-check', 'Document Rules']]],
    ['Payments', [['shopping-bag', 'Orders'], ['arrows-right-left', 'Transfers'], ['scale', 'Reconciliation']]],
    ['Settlements', [['calendar-days', 'Settlement Windows'], ['bolt', 'Instant Settlements'], ['arrow-path-rounded-square', 'Automated Settlement'], ['wallet', 'Accounts'], ['lock-closed', 'On-Hold'], ['sun', 'Vacations']]],
    ['Products', [['gift', 'Bundles'], ['banknotes', 'Lending'], ['rectangle-group', 'Kashier Services']]],
    ['Configuration', [['credit-card', 'BIN Management'], ['building-library', 'Financial Institutions'], ['receipt-percent', 'Pricing Rules'], ['rectangle-stack', 'PCC Templates']]],
    ['POS', [['device-tablet', 'Terminals'], ['queue-list', 'Kashier POS Batches'], ['inbox-stack', 'POS Bank Batches'], ['key', 'POS Key Exchanges']]],
    ['Team', [['users', 'User Management'], ['shield-check', 'Roles & Permissions']]]];
  const navIcon = n => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${(window.AGENT_ICONS || {})[n] || ''}</svg>`;
  const navLink = ([i, l, cur]) => `<a href="#" class="nlink" ${cur ? 'aria-current="page"' : ''}>${navIcon(i)}<span>${esc(l)}</span></a>`;
  /* Prototype bar links: one list for every page, so order and labels never drift. */
  const PAGES = [['list.html', 'List', 'My Applications list'], ['application.html', 'Application', 'The chosen application form'], ['variant-a.html', 'A · Rail', 'Sections + sticky rail'], ['variant-b.html', 'B · Steps', 'Full-page steps'], ['variant-c.html', 'C · Blocks', 'Services first, inline blocks'], ['compare.html', 'Compare', 'A, B and C side by side'], ['audit.html', 'Audit', 'Audit of the current prototype']];
  function shell() {
    const qs = new URLSearchParams(location.search);
    const here = location.pathname.split('/').pop() || 'application.html';
    document.body.innerHTML = `<div class="proto" role="navigation" aria-label="Prototype controls"><b>Sales Applications</b>
      <span class="grp">${PAGES.map(([href, l, t]) => `<a href="${href}" title="${t}" ${href === here ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</span>
      <span class="sp"></span>
      <span class="grp">${V.protoControls ? V.protoControls() : '<label class="lbl" for="preset">State</label><select id="preset"><option value="">Keep my changes</option><option value="new">New lead</option><option value="progress">In progress</option><option value="ready">Ready to submit</option><option value="waiting">Submitted · waiting approval</option><option value="returned">Returned · rate rejected</option></select><label class="lbl" for="viewAs">View as</label><select id="viewAs">' + Object.values(ROLES).map(r => `<option value="${r.key}" ${r.key === ME.key ? 'selected' : ''}>${r.role}</option>`).join('') + '</select>'}<button type="button" id="rtl" aria-pressed="${document.dir === 'rtl'}">RTL</button></span></div>
      <div class="app"><aside class="sidebar sidenav" id="sidebar" aria-label="Main"><a href="#" class="logo"><img src="../img/Kashier-logo.svg" alt="Kashier"></a><nav class="routes">${NAV.map(([g, items], gi) => g ? `<div class="ngrp"><button type="button" class="ngrp-t" aria-expanded="true" aria-controls="ng${gi}">${g}<svg class="ic-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${(window.AGENT_ICONS || {})['chevron-down'] || ''}</svg></button><div class="ngrp-l" id="ng${gi}">${items.map(navLink).join('')}</div></div>` : items.map(navLink).join('')).join('')}</nav></aside>
      <div class="nav-scrim" id="navScrim"></div>
      <div class="main-col"><header class="mbar"><button class="icon-btn" id="navOpen" aria-label="Open menu" aria-controls="sidebar" aria-expanded="false">${icon('menu', 'ic-24')}</button><img class="mlogo" src="../img/Kashier-logo.svg" alt="Kashier"><span class="pav">${ME.init}</span></header>
      <main class="container" id="main"><div id="page"></div></main></div></div>`;
    const open = v => { document.getElementById('sidebar').classList.toggle('open', v); document.getElementById('navScrim').classList.toggle('show', v); document.getElementById('navOpen').setAttribute('aria-expanded', v); };
    document.getElementById('navOpen').onclick = () => open(true); document.getElementById('navScrim').onclick = () => open(false);
    document.querySelectorAll('.ngrp-t').forEach(b => b.onclick = () => { const on = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', on); document.getElementById(b.getAttribute('aria-controls')).hidden = !on; });
    if (V.bindProto) V.bindProto();
    if (document.getElementById('viewAs')) document.getElementById('viewAs').onchange = e => { S.viewAs = e.target.value; ME = ROLES[S.viewAs]; rerender(); toast(`Viewing as ${ME.role}`); };
    if (document.getElementById('preset')) document.getElementById('preset').onchange = e => { if (!e.target.value) return; preset(e.target.value); V.reset && V.reset(); e.target.value = ''; scrollTo(0, 0); rerender(); toast('Prototype state loaded'); };
    document.getElementById('rtl').onclick = e => { const r = document.dir !== 'rtl'; document.dir = r ? 'rtl' : 'ltr'; e.target.setAttribute('aria-pressed', r); };
    if (qs.get('state')) preset(qs.get('state'));
    /* Opening a submitted application from the list: ?state=ready&status=Underwriting%20Review */
    /* Opening a submitted application from the list: ?state=ready&cases=Online%20Card~Live|Online%20Wallet~Rejected (service~status per case) */
    if (qs.get('cases') || (qs.get('status') && qs.get('status') !== 'New')) {
      const only = (qs.get('cases') || '').split('|').filter(Boolean).map(x => x.split('~')[0]);
      if (only.length) S.order.slice().filter(id => !only.includes(id)).forEach(id => removeService(id, { quiet: true }));
      submitDemo();
      const want = {}; if (qs.get('status')) S.order.forEach(id => { want[id] = qs.get('status'); });
      (qs.get('cases') || '').split('|').filter(Boolean).forEach(x => { const [id, st] = x.split('~'); if (S.svc[id]) want[id] = st; });
      const since = new Date((qs.get('since') || '2026-10-20') + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      Object.keys(want).forEach(id => {
        const st = want[id];
        const kind = String(st).split(':')[1], st0 = String(st).split(':')[0];
        if (st0 === 'Rejected' && kind === 'uw') { flagged().filter(f => f.id === id && !decisionOf(f)).forEach(f => { S.decisions[f.key] = { decision: 'approved', by: f.approver === 'Head of Sales' ? 'Karim Zaki' : 'Nadia Salah', role: f.approver, comment: '', rate: f.sel.rate, fee: f.sel.fee, at: '09/07/2026, 10:02:00 AM' }; }); S.log.unshift({ t: '09/07/2026, 10:00:00 AM', who: 'System', text: `moved the ${label(id)} case to Underwriting Review`, ic: 'check', id }); uwRejectDemo(id); }
        else if (st0 === 'Rejected') { rejectDemo(id); }
        else {
          if (!['Waiting Rate Approval', 'New'].includes(st)) flagged().filter(f => f.id === id && !decisionOf(f)).forEach(f => { S.decisions[f.key] = { decision: 'approved', by: f.approver === 'Head of Sales' ? 'Karim Zaki' : 'Nadia Salah', role: f.approver, comment: '', rate: f.sel.rate, fee: f.sel.fee, at: '09/07/2026, 10:02:00 AM' }; });
          const hist = { 'Underwriting Review': 1, 'Bank Submission': 2, Live: 3, Canceled: 1 }[st] || 0;
          ['Underwriting Review', 'Bank Submission', 'Live'].slice(0, hist).forEach((x, k) => S.log.unshift({ t: `09/${String(7 + k * 2).padStart(2, '0')}/2026, 10:0${k}:00 AM`, who: 'System', text: `moved the ${label(id)} case to ${x}`, ic: 'check', id }));
          if (st === 'Canceled') S.log.unshift({ t: '09/12/2026, 03:15:00 PM', who: 'Aya Muhammed', text: `canceled the ${label(id)} case`, ic: 'x', detail: 'Comment: The merchant dropped this service.', id });
          setCase(id, st, st === 'Canceled' ? { prev: 'Underwriting Review', cancelComment: 'The merchant dropped this service.' } : st === 'Live' ? { liveSince: since } : {});
        }
      });
    }
    if (qs.get('as') && ROLES[qs.get('as')]) { S.viewAs = qs.get('as'); ME = ROLES[S.viewAs]; const v = document.getElementById('viewAs'); if (v) v.value = S.viewAs; }
  }
  function mount(variant, variants) {
    V = variant; load(); shell(variants); rerender();
  }

  window.SA = {
    get S() { return S; }, mount, navIcon, rerender, soft, toast, icon, esc, fmtN, label, chOf, nmOf, isCard, needsBank, multiBank,
    CHANNELS, SVC_NAMES, SVC_HINT, SERVICES, BANKS, tiersFor, verdict, verdictHTML, flagged, pubText, rateText, sortedRules, bestRule, applyRule, ruleRate,
    servicesIssues, svcIssues, svcState, lineIssues, documentsIssues, payoutsIssues, contractsIssues, checklist, openItems, hasCh,
    draftHead, headTop, headActions, caseChip, caseStatus, hasRejectedCase, submitted, isEdit, merchantFields, criteriaFields, documentsSection, payoutSection, contractsSection, checklistHTML,
    cardOptions, optsSummary, modelSelect, bankSelect, canAddInst, moneyInputs, moneyParts, sourceHTML, pricingBtnHTML, pricingMissing, openPricing, openJustify, continueFromServices,
    addService, removeService, readOnlyView, returnedBanner, popover, closePop, drawer, modal, confirmBox, log, openSubmit, get ME() { return ME; }
  };
})();
