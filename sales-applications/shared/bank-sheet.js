/* The bank onboarding data sheet of a service, as an .xlsx in the bank's own layout: the same columns, in the same order, as the Online and POS sheets
   Kashier sends to the bank. The columns the bank asks Sales for (highlighted yellow in the bank's sheets) are filled from the application; the
   rest from the case and Kashier's fixed values. Every cell is filled: a value that does not apply is written NA, as the bank's sheets do.
   Writes the file itself (a stored zip of the sheet's XML), so it needs no library. */
window.BankSheet = (function () {
  'use strict';
  /* [header, 1 when the bank's sheet highlights the column yellow], in the bank's column order. */
  const ONLINE = [["Case #", 0], ["CID", 0], ["PSP CODE", 0], ["STAFF ID", 0], ["تاريخ ارسال البحث", 0], ["اسم التاجر (باللغة الإنجليزية)", 1], ["الاسم التجاري (باللغة الإنجليزية)", 1], ["الاسم القانونى (باللغة الإنجليزية)", 0], ["عنوان التاجر1 (باللغة الإنجليزية)", 1], ["المحافظة", 1], ["مبادره البنك المركزى", 0], ["company type", 1], ["رقم البطاقة الضريبية", 1], ["رقم السجل التجارى", 1], ["رقم بطاقة الرقم القومي ( للافراد )", 1], ["الموبايل", 1], ["الموقع / التطبيق الإلكتروني", 1], ["نشاط التاجر الفعلي(ِArabic)", 0], ["البريد الالكتروني", 1], ["Average ticket size", 0], ["Sectorial MID", 0], ["PF MID", 0], ["Integration Model (Payment Link/Merchant App/Merchant Website)", 0], ["Integration Type (2P or 2.5P or 3P)", 0], ["PF Name", 0], ["PF Name + Merchant Commercial Name", 0], ["PF account Number", 0], ["PF Profile Code", 0], ["Discount Code", 0], ["MCC", 0]];
  const POS = [["تاريخ ارسال البحث", 0], ["اسم التاجر (باللغة الإنجليزية)", 1], ["الاسم التجاري (باللغة الإنجليزية)Kashier", 1], ["الاسم التجاري (باللغة الإنجليزية)", 0], ["الاسم القانونى(باللغة الإنجليزية)", 0], ["عنوان التاجر1 (باللغة الإنجليزية)", 1], ["المحافظة", 1], ["مبادره البنك المركزى", 0], ["Company Type", 1], ["رقم البطاقة الضريبية", 1], ["رقم السجل التجارى", 1], ["رقم بطاقة الرقم القومي ( للافراد )", 1], ["الموبايل", 1], ["النشاط الفعلى للتاجر", 0], ["Email address", 1], ["Account number", 0], ["Profile Code", 0], ["MCC", 0], ["Discount Code", 0], ["Currency", 0]];
  /* Fixed values. Kashier's real account numbers are kept in the private bm-defaults.js; the public prototype uses demo values. */
  const D = window.BM_DEFAULTS || {}, ON = D.online || {}, MA = D.manual || {};
  const FIXED = { cid: ON.cid || 'DEMO-CID-001', onlineAccount: ON.account || 'DEMO-ACCT-000001', posAccount: MA.account || 'DEMO-ACCT-000002', profile: ON.profileCode || MA.profileCode || '930', currency: MA.currency || 'EGP' };
  const CITIES = ['CAIRO', 'GIZA', 'ALEXANDRIA', 'PORT SAID', 'ISMAILIA', 'BANHA', 'LUXOR', 'ASWAN', 'ARISH', 'SHARM ELSHEKH', 'HURGHADA', 'MARSA MATROH', 'TABA', 'RAAS ELBAR', 'TANTA', 'MANSOURA',
    'EL MAHALA', 'EL MENIA', 'BANI SWIEF', 'ASSUIT', 'SUHAG', 'SUEZ', 'EL FAYOUM', 'DOMYAT', 'SHEBEN EL KOUM', 'EL ZAGAZEG', 'KAFR ELSHEIKH', 'EL KHARGA', 'DAMANHOU'];
  const FORM_AR = { 'Sole proprietorship': 'فردى', LLC: 'مسئولية محدودة', 'Joint stock company': 'مساهمة', Partnership: 'تضامن', Other: 'أخرى' };
  /* Per industry: the merchant's activity in Arabic, the sector the bank files it under, its MCC and the bank's discount code. */
  const IND = {
    'Automotive': ['بيع قطع غيار سيارات', 'Auto parts', '5533', 'M01'], 'Education': ['خدمات تعليمية', 'Education', '8299', 'M02'], 'Entertainment & Media': ['خدمات ترفيه واعلام', 'Entertainment', '7999', 'M03'],
    'Fashion & Beauty': ['بيع ملابس ومستحضرات تجميل', 'Fashion', '5651', 'M04'], 'Financial Services': ['خدمات مالية', 'Financial services', '6012', 'M05'], 'Food & Beverage': ['مطاعم واغذية ومشروبات', 'Food', '5812', 'M06'],
    'Healthcare / Pharmacy': ['خدمات طبية وصيدلة', 'Healthcare', '5912', 'M07'], 'Insurance': ['خدمات تأمين', 'Insurance', '6300', 'M08'], 'Logistics & Delivery': ['خدمات شحن وتوصيل', 'Logistics', '4215', 'M09'],
    'Marketplace': ['منصة بيع الكترونية', 'Marketplace', '5399', 'M10'], 'Non-profit / NGO': ['جمعية اهلية', 'Non-profit', '8398', 'M11'], 'Professional Services': ['خدمات مهنية', 'Professional services', '8999', 'M12'],
    'Real Estate': ['خدمات عقارية', 'Real estate', '6513', 'M13'], 'Retail & E-commerce': ['بيع بالتجزئة', 'Retail', '5999', 'M14'], 'Technology / SaaS': ['خدمات سوفت وير وبرمجيات', 'Technology', '5734', 'M15'],
    'Travel & Tourism': ['خدمات سياحة وسفر', 'Travel', '4722', 'M16']
  };
  const text = v => String(v == null ? '' : v).trim();
  const digits = v => text(v).replace(/\D/g, '');
  const mobile10 = v => { let d = digits(v); if (d.startsWith('20') && d.length >= 12) d = d.slice(2); return d.replace(/^0/, ''); };
  const city = d => { const c = text(d.city).toUpperCase(), g = text(d.gov).toUpperCase(); return CITIES.includes(c) ? c : CITIES.includes(g) ? g : 'CAIRO'; };
  const na = v => text(v) || 'NA';

  /* The values of one row, in the order of the bank sheet's columns. d is the case: see sa-core exportSheet. */
  function values(d, online) {
    const ind = IND[d.industry] || ['خدمات تجارية', 'Retail', '5999', 'M14'], form = d.ind ? 'Sole proprietorship' : d.legalForm, brand = text(d.brand);
    const tax = d.tax ? na(d.taxNo) : 'NA', cr = d.cr ? na(d.crNo) : 'NA', act = text(d.activityAr) || ind[0], mcc = text(d.mcc) || ind[2], disc = text(d.discount) || ind[3];
    const owner = na(d.ownerName), name = na(brand), legal = na(d.legalName || brand), address = na(d.address), gov = city(d), ctype = FORM_AR[form] || na(form), nid = na(d.ownerIdNo), mobile = na(mobile10(d.mobile)), email = na(d.email);
    return online
      ? [na(d.caseId), FIXED.cid, 'NA', 'NA', d.date, owner, name, legal, address, gov, 'NA', ctype, tax, cr, nid, mobile, na(d.website), act, email,
        na(d.ticket), ind[1], na(digits(d.mid)), na(d.intModel), na(d.intType), 'Kashier', name, FIXED.onlineAccount, FIXED.profile, disc, mcc]
      : [d.date, owner, name, name, legal, address, gov, 'NA', ctype, tax, cr, nid, mobile, act, email, FIXED.posAccount, FIXED.profile, mcc, disc, FIXED.currency];
  }

  /* ---- the .xlsx file ---- */
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const colName = i => { let n = i + 1, s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const serial = dt => Math.floor((Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate()) - Date.UTC(1899, 11, 30)) / 864e5);
  function sheetXml(cols, row, dateIdx) {
    const colsXml = '<cols>' + cols.map((c, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (i === dateIdx ? 14 : Math.min(42, Math.max(14, Math.round(String(c[0]).length * 1.1)))) + '" customWidth="1"/>').join('') + '</cols>';
    const head = cols.map((c, i) => '<c r="' + colName(i) + '1" s="' + (c[1] ? 2 : 1) + '" t="inlineStr"><is><t>' + esc(c[0]) + '</t></is></c>').join('');
    const body = cols.map((c, i) => i === dateIdx ? '<c r="' + colName(i) + '2" s="3"><v>' + row[i] + '</v></c>' : '<c r="' + colName(i) + '2" s="' + (c[1] ? 4 : 0) + '" t="inlineStr"><is><t xml:space="preserve">' + esc(row[i]) + '</t></is></c>').join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' + colsXml + '<sheetData><row r="1">' + head + '</row><row r="2">' + body + '</row></sheetData></worksheet>';
  }
  const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
    + '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/><bgColor indexed="64"/></patternFill></fill></fills>'
    + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
    + '<cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>'
    + '<xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="0" fillId="2" borderId="0" xfId="0" applyFill="1"/></cellXfs></styleSheet>';
  const crcT = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  /* A zip with every file stored (no compression), which is all an .xlsx needs. */
  function zip(files) {
    const enc = new TextEncoder(), parts = [], central = []; let off = 0;
    files.forEach(f => {
      const name = enc.encode(f[0]), data = enc.encode(f[1]), crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30)); lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(12, 0x21, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true);
      const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(14, 0x21, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true); ch.setUint32(42, off, true);
      parts.push(new Uint8Array(lh.buffer), name, data); central.push(new Uint8Array(ch.buffer), name); off += 30 + name.length + data.length;
    });
    const cdSize = central.reduce((n, p) => n + p.length, 0), end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, cdSize, true); end.setUint32(16, off, true);
    return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  /* d: the case's data. Returns { blob, name, cols, row } for the Online or the POS sheet. */
  function build(d) {
    const online = d.channel !== 'POS', cols = online ? ONLINE : POS, row = values(Object.assign({}, d, { date: serial(new Date()) }), online);
    const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships', P = 'http://schemas.openxmlformats.org/package/2006/relationships', M = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    const files = [
      ['[Content_Types].xml', X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
      ['_rels/.rels', X + '<Relationships xmlns="' + P + '"><Relationship Id="rId1" Type="' + R + '/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', X + '<workbook xmlns="' + M + '" xmlns:r="' + R + '"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', X + '<Relationships xmlns="' + P + '"><Relationship Id="rId1" Type="' + R + '/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="' + R + '/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml', STYLES], ['xl/worksheets/sheet1.xml', sheetXml(cols, row, online ? 4 : 0)]];
    return { blob: zip(files), name: (d.caseId || 'case') + '-' + (online ? 'Online' : 'POS') + '-data-sheet.xlsx', cols: cols, row: row };
  }
  return { build: build, ONLINE: ONLINE, POS: POS };
})();
