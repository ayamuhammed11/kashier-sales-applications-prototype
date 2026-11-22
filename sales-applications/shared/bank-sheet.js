/* The bank onboarding data sheet of a service, as an .xlsx: only the columns the bank's Online and POS sheets highlight yellow (the merchant's details
   Sales enter on the application), with the bank's own headers, in the bank's column order. Every cell is filled: a value that does not apply
   is written NA, as the bank's sheets do. Writes the file itself (a stored zip of the sheet's XML), so it needs no library. */
window.BankSheet = (function () {
  'use strict';
  /* The yellow columns of the bank's sheets: the exact header, in the bank's order. */
  const ONLINE = ["اسم التاجر (باللغة الإنجليزية)", "الاسم التجاري (باللغة الإنجليزية)", "عنوان التاجر1 (باللغة الإنجليزية)", "المحافظة", "company type", "رقم البطاقة الضريبية", "رقم السجل التجارى", "رقم بطاقة الرقم القومي ( للافراد )", "الموبايل", "الموقع / التطبيق الإلكتروني", "البريد الالكتروني"];
  const POS = ["اسم التاجر (باللغة الإنجليزية)", "الاسم التجاري (باللغة الإنجليزية)Kashier", "عنوان التاجر1 (باللغة الإنجليزية)", "المحافظة", "Company Type", "رقم البطاقة الضريبية", "رقم السجل التجارى", "رقم بطاقة الرقم القومي ( للافراد )", "الموبايل", "Email address"];
  const CITIES = ['CAIRO', 'GIZA', 'ALEXANDRIA', 'PORT SAID', 'ISMAILIA', 'BANHA', 'LUXOR', 'ASWAN', 'ARISH', 'SHARM ELSHEKH', 'HURGHADA', 'MARSA MATROH', 'TABA', 'RAAS ELBAR', 'TANTA', 'MANSOURA',
    'EL MAHALA', 'EL MENIA', 'BANI SWIEF', 'ASSUIT', 'SUHAG', 'SUEZ', 'EL FAYOUM', 'DOMYAT', 'SHEBEN EL KOUM', 'EL ZAGAZEG', 'KAFR ELSHEIKH', 'EL KHARGA', 'DAMANHOU'];
  const FORM_AR = { 'Sole proprietorship': 'فردى', LLC: 'مسئولية محدودة', 'Joint stock company': 'مساهمة', Partnership: 'تضامن', Other: 'أخرى' };
  const text = v => String(v == null ? '' : v).trim();
  const digits = v => text(v).replace(/\D/g, '');
  const mobile10 = v => { let d = digits(v); if (d.startsWith('20') && d.length >= 12) d = d.slice(2); return d.replace(/^0/, ''); };
  const city = d => { const c = text(d.city).toUpperCase(), g = text(d.gov).toUpperCase(); return CITIES.includes(c) ? c : CITIES.includes(g) ? g : 'CAIRO'; };
  const na = v => text(v) || 'NA';

  /* The values of the row, in the order of the yellow columns. d is the case: see sa-core exportSheet. */
  function values(d, online) {
    const form = d.ind ? 'Sole proprietorship' : d.legalForm, brand = na(d.brand);
    const owner = na(d.ownerName), address = na(d.address), gov = city(d), ctype = FORM_AR[form] || na(form), tax = d.tax ? na(d.taxNo) : 'NA', cr = d.cr ? na(d.crNo) : 'NA', nid = na(d.ownerIdNo), mobile = na(mobile10(d.mobile)), email = na(d.email);
    return online ? [owner, brand, address, gov, ctype, tax, cr, nid, mobile, na(d.website), email] : [owner, brand, address, gov, ctype, tax, cr, nid, mobile, email];
  }

  /* ---- the .xlsx file ---- */
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const colName = i => { let n = i + 1, s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  function sheetXml(cols, row) {
    const colsXml = '<cols>' + cols.map((c, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + Math.min(42, Math.max(16, Math.round(String(c).length * 1.1))) + '" customWidth="1"/>').join('') + '</cols>';
    const head = cols.map((c, i) => '<c r="' + colName(i) + '1" s="1" t="inlineStr"><is><t>' + esc(c) + '</t></is></c>').join('');
    const body = cols.map((c, i) => '<c r="' + colName(i) + '2" s="2" t="inlineStr"><is><t xml:space="preserve">' + esc(row[i]) + '</t></is></c>').join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' + colsXml + '<sheetData><row r="1">' + head + '</row><row r="2">' + body + '</row></sheetData></worksheet>';
  }
  /* Header and cells are yellow, as the bank's sheets mark these columns. */
  const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>'
    + '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/><bgColor indexed="64"/></patternFill></fill></fills>'
    + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
    + '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="2" borderId="0" xfId="0" applyFill="1"/></cellXfs></styleSheet>';
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
    const online = d.channel !== 'POS', cols = (online ? ONLINE : POS).slice(), row = values(d, online);
    const X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships', P = 'http://schemas.openxmlformats.org/package/2006/relationships', M = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    const files = [
      ['[Content_Types].xml', X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
      ['_rels/.rels', X + '<Relationships xmlns="' + P + '"><Relationship Id="rId1" Type="' + R + '/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', X + '<workbook xmlns="' + M + '" xmlns:r="' + R + '"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', X + '<Relationships xmlns="' + P + '"><Relationship Id="rId1" Type="' + R + '/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="' + R + '/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml', STYLES], ['xl/worksheets/sheet1.xml', sheetXml(cols, row)]];
    return { blob: zip(files), name: (d.caseId || 'case') + '-' + (online ? 'Online' : 'POS') + '-data-sheet.xlsx', cols: cols, row: row };
  }
  return { build: build, ONLINE: ONLINE, POS: POS };
})();
