/* The Bank Misr batch. Bank Misr takes the day's cases together: every case that is ready for the bank goes in one set of the bank's sheets,
   one row per case. This drawer lists them, downloads the sheets (bm-export.js and the bank's templates) and marks the whole batch as sent.
   The sheets are kept out of the public prototype; there the drawer says so instead of failing. */
window.UWBM = (function () {
  const { icon, esc } = SA, U = UW;
  const today = () => new Date('2026-10-21T12:00:00');
  function open(after) { SA.drawer({ size: 'xl', title: 'Bank Misr batch', sub: 'The cases that are ready go to Bank Misr together, in one set of sheets.', render(api) { draw(api, after); } }); }
  function draw(api, after) {
    const ready = window.BMExport && BMExport.available();
    const list = U.bmReady();
    if (!ready) { api.body.innerHTML = '<p class="hint">The Bank Misr sheets are not available on this site. They are kept out of the public prototype.</p>'; return; }
    if (!list.length) { api.body.innerHTML = '<div class="empty"><h3>No case is ready for Bank Misr</h3><p class="hint">A case joins the batch when it is marked ready for the bank.</p></div>'; return; }
    const items = list.map(c => { const inp = U.bmInput(c); return { c: c, inp: inp, snap: BMExport.snapshot(inp.c, inp.saved), rev: BMExport.review(inp.c, inp.saved) }; });
    const snaps = items.map(i => i.snap), files = BMExport.filesOf(snaps), day = BMExport.fmtDay(today());
    const missing = [].concat.apply([], items.map(i => [].concat.apply([], i.rev.map(f => f.missing.map(m => i.c.merchant.name + ': ' + m.label)))));
    const batchNo = 'BM-' + today().toISOString().slice(0, 10);
    api.body.innerHTML = `<section class="cd-s"><h3 class="sub-h">Cases in this batch (${items.length})</h3>
        <table class="rtbl"><thead><tr><th>Case</th><th>Merchant</th><th>Sheets</th></tr></thead><tbody>${items.map(i => `<tr><td>${esc(i.c.caseId)} · ${esc(i.c.service)}</td><td>${esc(i.c.merchant.name)}<div class="hint">${esc(i.c.mid)}</div></td><td>${esc(i.snap.files.map(id => (files.filter(f => f.id === id)[0] || {}).short || id).join(', '))}</td></tr>`).join('')}</tbody></table>
        ${missing.length ? `<div class="info bad" style="margin-block-start:12px"><b>Something is missing for the bank's sheets:</b> ${esc(missing.slice(0, 6).join('; '))}${missing.length > 6 ? '…' : ''}</div>` : ''}</section>
      <section class="cd-s"><h3 class="sub-h">The sheets</h3>${files.map(f => `<div class="frow"><div class="fi"><b>${esc(f.name)}</b><span class="muted">${f.count} row${f.count === 1 ? '' : 's'}</span></div><div class="fa"><button type="button" class="btn btn-outline btn-sm" data-bmf="${esc(f.id)}">${icon('download', 'ic')}Download</button></div></div>`).join('')}
        <div style="margin-block-start:12px"><button type="button" class="btn btn-outline" data-bmall>${icon('download', 'ic')}Download all (${files.length})</button></div></section>`;
    api.foot.innerHTML = `<div class="fld" style="flex:1;max-width:260px"><label for="bmNo" class="sr-only">Batch number</label><input class="inp" id="bmNo" value="${esc(batchNo)}" aria-label="Batch number"></div><button type="button" class="btn btn-primary" data-bmsent>Mark the batch as sent to Bank Misr</button>`;
    const logExport = names => U.logBatchExport(list, names);
    api.body.querySelectorAll('[data-bmf]').forEach(b => b.onclick = async () => {
      const f = files.filter(x => x.id === b.dataset.bmf)[0]; try { const name = BMExport.fileName(day, f.name); BMExport.save(await BMExport.build(f.id, snaps, today()), name); logExport([name]); SA.toast('Downloaded ' + f.name); } catch (e) { SA.toast(e.message || 'The sheet could not be built'); }
    });
    api.body.querySelector('[data-bmall]').onclick = async () => {
      try { const zip = new JSZip(), names = []; for (const f of files) { const n = BMExport.fileName(day, f.name); names.push(n); zip.file(n, await BMExport.build(f.id, snaps, today())); }
        BMExport.save(await zip.generateAsync({ type: 'blob' }), 'Bank Misr batch - ' + day + '.zip'); logExport(names); SA.toast('Downloaded ' + names.length + ' sheets'); } catch (e) { SA.toast(e.message || 'The sheets could not be built'); }
    };
    api.foot.querySelector('[data-bmsent]').onclick = () => { const n = U.sendBatch(list, document.getElementById('bmNo').value); api.close(true); SA.toast(n + ' case' + (n === 1 ? '' : 's') + ' marked as sent to Bank Misr'); if (after) after(); };
  }
  return { open: open };
})();
