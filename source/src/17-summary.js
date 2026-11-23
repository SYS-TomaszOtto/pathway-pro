// A one-page summary to print or save as PDF (Ctrl+P): where the portfolio stands, for a mentor meeting or a review.
// Everything on it is worked out from the data; there is nothing to fill in.

// The Summary page (as in the server copy, without the AI parts): overall completion, next steps, by attribute,
// by sub-attribute with every level slot, evidence by folder and how each piece of evidence is used.
// The one-page printable summary is VIEWS.print below.

// Completion of one sub-attribute, weighted like completion(): evidence 50%, report 35%, feedback 15%.
function subCompletion(id, cov, prr, fb) {
  const st = prr[id].state;
  const ev = slots(cov[id]) / slotMax(cov[id]);
  const pr = st === 'ready' ? 1 : st === 'draft' ? 0.5 : 0;
  const fe = st === 'ready' && !fb.some((f) => f.sub === id && f.status === 'open') ? 1 : 0;
  return 0.5 * ev + 0.35 * pr + 0.15 * fe;
}
const SUM_STATUS = (c) => (c >= 0.999 ? ['complete', 'good'] : c > 0 ? ['in progress', 'part'] : ['not started', 'outline']);
const sumPct = (c) => `<div class="sum-pct">${meter(c, c >= 0.999 ? 'good' : '')}<span class="small">${Math.round(c * 100)}%</span> ${chip(...SUM_STATUS(c))}</div>`;

// How each evidence file is used: the sub-attributes it is mapped to, and the report sections that list or write about it.
function evidenceUse() {
  const prr = prrBySub();
  const inPrr = {};
  for (const [id, v] of Object.entries(prr)) for (const x of v.sections) for (const c of [...x.section.listed, ...x.section.discussed]) (inPrr[c] = inPrr[c] || new Set()).add(id);
  return evidenceItems().filter((i) => !i.missing).map((i) => {
    const mapped = [...new Set(((i.rec && i.rec.maps) || []).map((m) => m.sub))].sort(natural);
    const prrSubs = i.code && inPrr[i.code] ? [...inPrr[i.code]].sort(natural) : [];
    return { it: i, mapped, prr: prrSubs };
  }).sort((a, b) => (b.mapped.length + b.prr.length) - (a.mapped.length + a.prr.length) || natural(a.it.code || a.it.title, b.it.code || b.it.title));
}
const USE_FILTERS = { '': 'All evidence', unused: 'Not used anywhere', noprr: 'Mapped but not in any report', nomap: 'In a report but not mapped there' };
const useMatch = (u, f) => !f || (f === 'unused' && !u.mapped.length && !u.prr.length) || (f === 'noprr' && u.mapped.length && !u.prr.length) || (f === 'nomap' && u.prr.some((s) => !u.mapped.includes(s)));

VIEWS.summary = async (arg, q) => {
  await scanEvidence();
  await loadReports();
  const cov = coverage();
  const prr = prrBySub();
  const fb = feedbackItems();
  const c = completion();
  const comp = Object.fromEntries(SUBS.map((a) => [a.id, subCompletion(a.id, cov, prr, fb)]));
  const g = goal();
  const totalSlots = SUBS.reduce((n, a) => n + slotMax(cov[a.id]), 0);
  const gotSlots = SUBS.reduce((n, a) => n + slots(cov[a.id]), 0);
  const subsDone = SUBS.filter((a) => comp[a.id] >= 0.999).length;
  const groupsDone = GROUPS.filter((gr) => SUBS.filter((a) => a.group === gr.group).every((a) => comp[a.id] >= 0.999)).length;
  const drafted = SUBS.filter((a) => ['draft', 'ready'].includes(prr[a.id].state)).length;
  const steps = nextSteps(12);
  const use = evidenceUse();
  const filter = USE_FILTERS[q.get('use') || ''] ? q.get('use') || '' : '';
  const items = evidenceItems().filter((i) => !i.missing);
  const folderOf = (i) => i.folder.split('/')[0] || '(top folder)';
  const folders = [...new Set(items.map(folderOf))].sort(natural);
  const byUse = new Map(use.map((u) => [u.it.path, u]));
  const levelHead = LEVELS.flatMap((l) => Array.from({ length: g }, (_, n) => `<th scope="col">${esc(LEVEL_SHORT[l])}${n + 1}</th>`)).join('');
  const subRow = (a) => {
    const cell = cov[a.id];
    const n = new Set(LEVELS.flatMap((l) => cell[l])).size;
    const slotCells = cell._need
      ? `<td colspan="${LEVELS.length * g}" class="small">${distinctNeeded(cell)} of ${g} at ${esc(LEVEL_NAME[cell._need[0]])} or above: ${[...new Set(cell._need.flatMap((l) => cell[l]))].map(itemLink).join(' ') || '–'}</td>`
      : LEVELS.flatMap((l) => Array.from({ length: g }, (_, k) => cell[l][k] ? `<td class="slot on">${itemLink(cell[l][k])}</td>` : '<td class="slot"></td>')).join('');
    const open = fb.filter((f) => f.sub === a.id && f.status === 'open').length;
    return `<tr><th scope="row" title="${esc(a.text)}">${subLink(a.id)}</th><td>${n}</td>${slotCells}<td><b>${slots(cell)}</b><span class="small muted">/${slotMax(cell)}</span></td>
      <td>${prrChip(prr[a.id].state)}</td><td>${open ? `<a href="#feedback">${open} open</a>` : '–'}</td><td>${sumPct(comp[a.id])}</td></tr>`;
  };
  return `<div class="row spread"><h1>Summary</h1><div class="row" data-dock><button id="sumXlsx">Excel matrix</button><a class="btn" href="#print">Print summary</a></div></div>
    <p><b>${Math.round(c.total * 100)}% complete</b> · ${groupsDone} / ${GROUPS.length} ${esc(LABEL.attr.toLowerCase())} complete · ${subsDone} / ${SUBS.length} ${esc(LABEL.items)} complete · ${gotSlots} / ${totalSlots} evidence slots · ${drafted} report sections drafted</p>
    ${meter(c.total, c.total >= 0.999 ? 'good' : '')}
    <p class="small muted">How completion is worked out: evidence counts 50% (share of the level slots filled), the report section 35% (half when drafted, all when it passes the checks) and feedback 15% (the section is ready and every mentor comment on it is answered).</p>
    <div class="cols">
      <div class="card"><h2>Next steps</h2><p class="small muted">Worked out from the gaps, most useful first.</p>
        ${steps.length ? `<ol>${steps.map((s) => `<li><a href="${s.href}">${esc(s.text)}</a></li>`).join('')}</ol>` : '<p class="muted">Nothing left: everything is covered.</p>'}</div>
      <div class="card"><h2>How it fits together</h2><ol class="small">
        <li><b>Evidence</b>: every file in your evidence folders. Map each to the ${esc(LABEL.items)} it shows, with a level (${LEVELS.map((l) => esc(LEVEL_NAME[l])).join(', ')}).</li>
        <li><b>${esc(LABEL.attr)}</b>: one page per ${esc(LABEL.item)} (click any link like ${SUBS[0] ? subLink(SUBS[0].id) : ''}) with its slots, evidence, report section and comments.</li>
        <li><b>Reports</b>: your PRR, written here or in Word, checked against your evidence.</li>
        <li><b>Feedback</b>: your mentor's comments, to work through one at a time.</li>
        <li>Click an evidence code anywhere to preview the file without leaving the page.</li></ol></div>
    </div>
    <h2>By ${esc(LABEL.attr.replace(/s$/, '').toLowerCase())}</h2>
    <div class="card table-wrap" tabindex="0" role="region" aria-label="By ${esc(LABEL.attr)}"><table><thead><tr><th scope="col">${esc(LABEL.attr.replace(/s$/, ''))}</th><th scope="col">${esc(cap1(LABEL.items))} complete</th><th scope="col">Slots</th><th scope="col">Open feedback</th><th scope="col">Completion</th></tr></thead><tbody>
      ${GROUPS.map((gr) => {
        const subs = SUBS.filter((a) => a.group === gr.group);
        const got = subs.reduce((n, a) => n + slots(cov[a.id]), 0), max = subs.reduce((n, a) => n + slotMax(cov[a.id]), 0);
        const open = fb.filter((f) => f.status === 'open' && subs.some((a) => a.id === f.sub)).length;
        const cc = subs.reduce((n, a) => n + comp[a.id], 0) / (subs.length || 1);
        return `<tr><th scope="row"><a href="#attributes?g=${esc(gr.group)}">${esc(gr.group)}</a> ${esc(gr.title)}</th><td>${subs.filter((a) => comp[a.id] >= 0.999).length} / ${subs.length}</td><td>${got} / ${max}</td><td>${open ? `<a href="#feedback">${open} open</a>` : '–'}</td><td>${sumPct(cc)}</td></tr>`;
      }).join('')}</tbody></table></div>
    <h2>By ${esc(LABEL.item)}</h2>
    <p class="small muted">Each slot holds one separate piece of evidence mapped at that level (goal: ${g} at each level).</p>
    <div class="card table-wrap" tabindex="0" role="region" aria-label="By ${esc(LABEL.item)}"><table class="sum-subs"><thead><tr><th scope="col">${esc(cap1(LABEL.item))}</th><th scope="col">Evidence</th>${levelHead}<th scope="col">Slots</th><th scope="col">Report</th><th scope="col">Feedback</th><th scope="col">Completion</th></tr></thead><tbody>
      ${SUBS.map(subRow).join('')}</tbody></table></div>
    <h2>Evidence by folder</h2>
    <div class="card table-wrap" tabindex="0" role="region" aria-label="Evidence by folder"><table><thead><tr><th scope="col">Folder</th><th scope="col">Files</th><th scope="col">Mapped somewhere</th><th scope="col">In a report</th><th scope="col">Not used anywhere</th></tr></thead><tbody>
      ${folders.map((f) => {
        const us = items.filter((i) => folderOf(i) === f).map((i) => byUse.get(i.path));
        return `<tr><th scope="row"><a href="#evidence?folder=${encodeURIComponent(f)}">${esc(f)}</a></th><td>${us.length}</td><td>${us.filter((u) => u.mapped.length).length}</td><td>${us.filter((u) => u.prr.length).length}</td><td>${us.filter((u) => !u.mapped.length && !u.prr.length).length}</td></tr>`;
      }).join('') || '<tr><td colspan="5" class="muted">No evidence files yet.</td></tr>'}</tbody></table></div>
    <h2 id="use">Evidence use</h2>
    <p class="small muted">Most used first. "Mapped" = ${esc(LABEL.items)} you mapped it to; "Report" = report sections that list it or write about it (faded when it is not mapped there).</p>
    <div class="row"><label for="useFilter" class="small">Show</label><select id="useFilter">${Object.entries(USE_FILTERS).map(([k, t]) => `<option value="${k}" ${k === filter ? 'selected' : ''}>${esc(t)} (${use.filter((u) => useMatch(u, k)).length})</option>`).join('')}</select></div>
    <div class="card table-wrap" tabindex="0" role="region" aria-label="Evidence use"><table><thead><tr><th scope="col">Code</th><th scope="col">Title</th><th scope="col">Mapped</th><th scope="col">Report</th></tr></thead><tbody>
      ${use.filter((u) => useMatch(u, filter)).map((u) => `<tr class="click" data-href="${itemHref(u.it)}"><th scope="row">${itemLink(u.it)}</th><td>${esc(u.it.title)}</td>
        <td>${u.mapped.map(subLink).join(' ') || '<span class="muted small">none</span>'}</td>
        <td>${u.prr.map((s) => `<a href="#sub/${esc(s)}">${chip(s, u.mapped.includes(s) ? 'accent' : 'outline')}</a>`).join(' ') || '<span class="muted small">none</span>'}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">Nothing here.</td></tr>'}</tbody></table></div>`;
};
VIEWS.summary.after = (arg, q) => {
  $$('#main tr[data-href]').forEach((tr) => tr.addEventListener('click', (e) => { if (!e.target.closest('a')) location.hash = tr.dataset.href; }));
  const x = $('#sumXlsx');
  if (x) x.addEventListener('click', (e) => act(e.currentTarget, exportMatrix, (p) => 'Saved ' + p));
  const f = $('#useFilter');
  if (f) f.addEventListener('change', () => {
    if (f.value) q.set('use', f.value); else q.delete('use');
    history.replaceState(null, '', '#summary' + (q.toString() ? '?' + q.toString() : ''));
    render().then(() => { const s = $('#useFilter'); if (s) { s.focus({ preventScroll: true }); $('#use').scrollIntoView({ block: 'start' }); } });
  });
};

VIEWS.print = async () => {
  await scanEvidence();
  await loadReports();
  const cov = coverage();
  const prr = prrBySub();
  const fb = feedbackItems();
  const open = fb.filter((f) => f.status === 'open');
  const c = completion();
  const items = evidenceItems().filter((i) => !i.missing);
  const actions = allActions().filter((a) => a.status !== 'done');
  const yr = cpdYear(today());
  const hours = P().cpd.activities.filter((a) => cpdYear(a.dateFrom) === yr).reduce((n, a) => n + (+a.hours || 0), 0);
  const k = P().settings && P().settings.keyDate;
  const ready = readiness();
  const levelHead = LEVELS.map((l) => `<th scope="col">${esc(LEVEL_SHORT[l])}</th>`).join('');
  const rows = GROUPS.map((g) => {
    const subs = SUBS.filter((a) => a.group === g.group);
    return `<tr class="group"><th colspan="${LEVELS.length + 4}" scope="colgroup">${esc(g.group)}. ${esc(g.title)}</th></tr>` + subs.map((a) => {
      const cell = cov[a.id];
      const counts = cell._need ? `<td colspan="${LEVELS.length}">${distinctNeeded(cell)} of ${goal()} at ${esc(LEVEL_NAME[cell._need[0]])} or above</td>` : LEVELS.map((l) => `<td>${cell[l].length}</td>`).join('');
      const openN = open.filter((f) => f.sub === a.id).length;
      return `<tr><th scope="row">${esc(a.id)}</th><td class="sum-text">${esc(a.text)}</td>${counts}<td>${esc((PRR_STATE[prr[a.id].state] || [prr[a.id].state])[0])}</td><td>${openN || ''}</td></tr>`;
    }).join('');
  }).join('');
  return `<div class="row spread no-print"><h1>Summary to print</h1><div class="row"><button class="primary" id="sumPrint">Print or save as PDF</button></div></div>
    <p class="muted small no-print">One page for a mentor meeting or a review. Press <b>Print</b>, then choose <b>Save as PDF</b> as the printer if you want a file.</p>
    <div class="card summary">
      <h2 class="sum-title">${esc(P().name || 'Portfolio')}: ${esc(FRAMEWORK.name)}</h2>
      <p class="small">Printed ${esc(fmtDate(today()))}${k ? ` · ${esc(P().settings.keyDateLabel || 'Key date')}: ${esc(fmtDate(k))}` : ''}</p>
      <ul class="sum-kpis">
        <li><b>${Math.round(c.total * 100)}%</b> overall</li>
        <li><b>${items.length}</b> evidence files, <b>${items.filter((i) => !((i.rec && i.rec.maps) || []).length).length}</b> not mapped</li>
        <li><b>${open.length}</b> open mentor comments</li>
        <li><b>${hours}</b> of ${P().settings.cpdTarget} CPD hours (${esc(cpdYearLabel(yr))})</li>
        <li><b>${actions.length}</b> open actions from meetings</li>
      </ul>
      <h3>Ready to submit?</h3>
      <ul class="list-plain ready-list">${ready.map((r) => `<li><span aria-hidden="true">${r.ok ? '✓' : '✗'}</span> <span class="sr-only">${r.ok ? 'Done: ' : 'Not yet: '}</span>${esc(r.text)}</li>`).join('')}</ul>
      <h3>${esc(LABEL.attr)}: evidence at each level (goal ${goal()})</h3>
      <table class="sum-table" data-cards="off"><thead><tr><th scope="col">${esc(LABEL.item)}</th><th scope="col">Description</th>${levelHead}<th scope="col">Report</th><th scope="col">Open comments</th></tr></thead><tbody>${rows}</tbody></table>
      ${actions.length ? `<h3>Open actions</h3><ul class="list-plain">${actions.slice(0, 15).map((a) => `<li>${a.due ? esc(fmtDate(a.due)) + ': ' : ''}${esc(a.text)}</li>`).join('')}</ul>` : ''}
    </div>`;
};
VIEWS.print.after = () => { const b = $('#sumPrint'); if (b) b.addEventListener('click', () => window.print()); };
