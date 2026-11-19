// A one-page summary to print or save as PDF (Ctrl+P): where the portfolio stands, for a mentor meeting or a review.
// Everything on it is worked out from the data; there is nothing to fill in.

VIEWS.summary = async () => {
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
VIEWS.summary.after = () => { const b = $('#sumPrint'); if (b) b.addEventListener('click', () => window.print()); };
