// Home, the evidence list, one evidence item (mapping with K/E/A levels), the attributes and KSBs.

VIEWS.home = async () => {
  await scanEvidence();
  await loadReports();
  const c = completion();
  const items = evidenceItems();
  const cov = coverage();
  const met = SUBS.filter((a) => slotStatus(cov[a.id]) === 'met').length;
  const fbOpen = feedbackItems().filter((f) => f.status === 'open').length;
  const actions = allActions().filter((a) => a.status !== 'done');
  const steps = nextSteps();
  const yr = cpdYear(today());
  const hours = P().cpd.activities.filter((a) => cpdYear(a.dateFrom) === yr).reduce((n, a) => n + (+a.hours || 0), 0);
  const ms = M() ? SUBS.filter((a) => M().subs[a.id] && M().subs[a.id].status === 'met').length : null;
  // Brand new portfolio: a short "start here" list instead of a screen of zeros.
  if (!isMentor() && P().mode !== 'cpd' && !items.length && !Object.keys(S.prr).length && !P().meetings.length && !P().cpd.activities.length) {
    return `<h1>Welcome, ${esc(P().name || 'there')}</h1>
      <div class="card get-started">${lessonArt('folder', 'mini get-started-art')}<h2>Three steps to get going</h2><p class="small">New to this? <a href="#lesson/1">Take the first lesson</a> (five short steps).</p>
        <ol class="steps">
          <li><b>Check your framework.</b> This is the list of ${esc(LABEL.attr.toLowerCase())} you will map your evidence to. ${esc(FRAMEWORK.name)} is chosen. <a class="btn" href="#framework">Check or change it</a></li>
          <li><b>Put your evidence files in your OneDrive folder.</b> Save them in <code>${esc(FOLDERS.evidence)}</code> (sub-folders are fine) and start each file name with a code such as <code>CO-14</code>. <button id="homeRefresh" class="primary">Look for my files</button></li>
          <li><b>Map each file</b> to the ${esc(LABEL.attr.toLowerCase())} it shows. The tool then shows what is covered and what is missing. <a class="btn" href="#evidence">Open Evidence</a></li>
        </ol>
        <p class="small muted">The other pages (${esc(LABEL.attr)}, Reports, Feedback, Meetings and Mentor) appear as soon as you have something to put in them. <a href="#settings">Show every tab now</a>. Stuck? <a href="#help">Read the short guide</a>.</p></div>`;
  }
  return `<h1>${isMentor() ? esc(P() ? P().name : 'Apprentice') + '’s portfolio' : 'Your portfolio'}</h1>
    ${(() => { const k = P().settings && P().settings.keyDate; if (!k) return ''; const days = Math.round((new Date(k + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 86400000); const what = esc(P().settings.keyDateLabel || 'Key date'); return `<p class="key-date"><b>${what}:</b> ${esc(fmtDate(k))} · ${days > 1 ? days + ' days to go (about ' + Math.ceil(days / 7) + ' weeks)' : days === 1 ? 'tomorrow' : days === 0 ? 'today' : Math.abs(days) + ' days ago'}</p>`; })()}
    <p class="muted small">Assessing against ${esc(FRAMEWORK.name)}.${isMentor() ? '' : ' <a href="#framework">Change</a>'} <a href="#print">Print a one-page summary</a></p>
    <div class="kpis progress-strip${homeFillOnce() ? ' fill' : ''}">
      <div class="kpi"><div class="label">Overall</div><div class="big-number">${Math.round(c.total * 100)}%</div>${meter(c.total)}</div>
      <div class="kpi"><div class="label">Evidence slots (${LEVELS.map((l) => LEVEL_SHORT[l]).join('/')} × ${goal()})</div><div class="big-number">${Math.round(c.evidence * 100)}%</div>${meter(c.evidence)}<div class="small muted">${met} of ${SUBS.length} sub-attributes full</div></div>
      <div class="kpi"><div class="label">PRR sections</div><div class="big-number">${Math.round(c.prr * 100)}%</div>${meter(c.prr)}<div class="small muted">${Object.keys(S.prr).length} Word file(s) in PRR</div></div>
      <div class="kpi"><div class="label">Mentor comments</div><div class="big-number">${fbOpen}</div><div class="small muted">open${fbOpen ? ' · <a href="#feedback">answer them</a>' : ''}</div></div>
      <div class="kpi"><div class="label">Evidence files</div><div class="big-number">${items.filter((i) => !i.missing).length}</div><div class="small muted">${items.filter((i) => !i.missing && !(i.rec && i.rec.maps && i.rec.maps.length)).length} not mapped yet</div></div>
      <div class="kpi"><div class="label">CPD ${cpdYearLabel(yr)}</div><div class="big-number">${hours}<small style="font-size:1rem"> / ${P().settings.cpdTarget} h</small></div>${meter(hours / (P().settings.cpdTarget || 30), hours >= P().settings.cpdTarget ? 'good' : '')}</div>
      ${ms !== null ? `<div class="kpi"><div class="label">Mentor: met</div><div class="big-number">${ms}<small style="font-size:1rem"> / ${SUBS.length}</small></div><div class="small muted"><a href="#mentor">assessment</a></div></div>` : ''}
    </div>
    <div class="grid">
      ${!isMentor() && P().mode !== 'cpd' ? `<div class="card"><h2>Ready to submit?</h2><ul class="list-plain ready-list">${readiness().map((r) => `<li><span class="${r.ok ? 'good' : 'bad'}" aria-hidden="true">${r.ok ? '✓' : '✗'}</span> <span class="sr-only">${r.ok ? 'Done: ' : 'Not yet: '}</span>${r.ok ? esc(r.text) : `<a href="${r.href}">${esc(r.text)}</a>`}</li>`).join('')}</ul></div>` : ''}
      <div class="card"><h2>Next steps</h2>${steps.length ? `<div class="keypoint"><b class="keypoint-label">Key point: do this first</b><p><a href="${steps[0].href}">${esc(steps[0].text)}</a></p></div>${steps.length > 1 ? `<ol start="2">${steps.slice(1).map((s) => `<li><a href="${s.href}">${esc(s.text)}</a></li>`).join('')}</ol>` : ''}` : '<p class="good">Nothing outstanding. 🎉</p>'}</div>
      <div class="card"><h2>Open actions from meetings</h2>${actions.length ? `<ul class="list-plain">${actions.slice(0, 10).map((a) => `<li>${a.due ? `<span class="chip ${a.due < today() ? 'bad' : ''}">${fmtDate(a.due)}</span> ` : ''}${linkify(a.text)} <span class="small muted">· <a href="#meeting/${a.meeting.id}">${fmtDate(a.meeting.date)}</a></span></li>`).join('')}</ul>` : '<p class="muted">None. Actions come from tagging "To do" in a meeting.</p>'}</div>
      <div class="card"><h2>${esc(LABEL.attr)}</h2><table><tbody>${GROUPS.map((g) => {
        const subs = SUBS.filter((a) => a.group === g.group);
        const frac = subs.reduce((n, a) => n + slots(cov[a.id]), 0) / subs.reduce((n, a) => n + slotMax(cov[a.id]), 0);
        return `<tr class="click" onclick="location.hash='#attributes?g=${g.group}'"><td class="nowrap"><b>${g.group}</b></td><td>${esc(g.title)}</td><td style="width:30%">${meter(frac, frac >= 1 ? 'good' : '')}</td></tr>`;
      }).join('')}</tbody></table></div>
    </div>`;
};

// The Home meters fill once per session (the figures show at once; only the bars move). sessionStorage, in try/catch.
function homeFillOnce() {
  try { if (sessionStorage.getItem('pathwayPro.filled')) return false; sessionStorage.setItem('pathwayPro.filled', '1'); return true; } catch (_) { return false; }
}

VIEWS.home.after = () => {
  const b = $('#homeRefresh');
  if (b) b.addEventListener('click', (e) => act(e.currentTarget, async () => { await scanEvidence(); await loadReports(); await render(); }, 'Evidence folder re-read'));
};

// ---------- evidence list ----------
VIEWS.evidence = async (arg, q) => {
  await scanEvidence();
  const show = q.get('show') || 'all';
  const folder = q.get('folder') || '';
  const sub = SUB[q.get('sub')] ? q.get('sub') : '';
  const check = q.get('check') || '';
  const text = (q.get('q') || '').toLowerCase();
  const items = evidenceItems();
  // The mentor's verdicts on this file's mappings (agree / more / disagree), for the "Mentor check" filter.
  const verdictsOf = (i) => { const m = i.code && M() && M().evidence[i.code]; return (m && m.verdicts) || {}; };
  const folders = [...new Set(items.map((i) => i.folder))].sort(natural);
  const list = items.filter((i) => {
    const maps = (i.rec && i.rec.maps) || [];
    if (show === 'unmapped' && (i.missing || maps.length)) return false;
    if (show === 'mapped' && !maps.length) return false;
    if (show === 'missing' && !i.missing) return false;
    if (folder && i.folder !== folder) return false;
    if (sub && !maps.some((m) => m.sub === sub)) return false;
    if (check) {
      const v = verdictsOf(i), subs = [...new Set(maps.map((m) => m.sub))];
      if (check === 'unchecked' ? !subs.length || subs.every((s) => v[s]) : !Object.values(v).includes(check)) return false;
    }
    if (text && !`${i.code} ${i.title} ${i.path} ${(i.rec && i.rec.notes) || ''} ${(i.rec && i.rec.project) || ''} ${(i.rec && i.rec.tags) || ''}`.toLowerCase().includes(text)) return false;
    return true;
  });
  const counts = { all: items.filter((i) => !i.missing).length, unmapped: items.filter((i) => !i.missing && !((i.rec && i.rec.maps) || []).length).length, mapped: items.filter((i) => ((i.rec && i.rec.maps) || []).length).length, missing: items.filter((i) => i.missing).length };
  const qs = (patch) => '#evidence?' + new URLSearchParams({ show, folder, sub, check, q: q.get('q') || '', ...patch }).toString();
  return `<div class="row spread"><h1>Evidence</h1><div class="row">
      <button id="rescan" title="Look for new, moved or deleted files">↻ Refresh</button>
      ${canEdit() ? '<button id="addFiles" class="primary" title="Copy files into your evidence folder (or drag them onto this page)">Add files…</button>' : ''}
      ${canEdit() ? '<button id="autoCodes" title="Give codes to files that have none">Number files…</button>' : ''}
      <button id="exportXlsx">Export Excel matrix</button></div></div>
    ${facts([[plural(counts.all, 'file')], counts.unmapped ? [counts.unmapped + ' not mapped', 'part'] : [ 'all mapped', 'good'], counts.missing ? [counts.missing + ' missing', 'bad'] : null, [plural(folders.length, 'folder')]])}
    ${neededChecklist([
      { ok: counts.all > 0, text: `Add at least one file to ${FOLDERS.evidence}` },
      { ok: counts.all > 0 && counts.unmapped === 0, text: `Map every file (${counts.unmapped} left)`, href: counts.unmapped ? '#evidence?show=unmapped' : '' },
      { ok: counts.missing === 0, text: `No missing files (${counts.missing} missing)`, href: counts.missing ? '#evidence?show=missing' : '' },
    ])}
    <p class="muted small">Every file in <code>${FOLDERS.evidence}</code> (and its sub-folders) is listed. Save each file in the folder for its kind (correspondence, markups, calculations…). Put a code such as <code>CO-14</code> at the start of a file name and it is picked up; otherwise type one in. Click a row to map it.</p>
    <div class="sub-tabs" data-dock>
      <div class="filter-controls" id="evFilterControls">${['all', 'unmapped', 'mapped', 'missing'].map((s) => `<a href="${qs({ show: s })}" class="${show === s ? 'active' : ''}">${{ all: 'All', unmapped: 'Not mapped', mapped: 'Mapped', missing: 'File missing' }[s]} (${counts[s]})</a>`).join('')}
        <select id="folderSel" aria-label="Folder"><option value="">All folders</option>${folders.map((f) => `<option ${f === folder ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select>
        <select id="subSel" aria-label="${esc(cap1(LABEL.item))}"><option value="">All ${esc(LABEL.items)}</option>${SUBS.map((a) => `<option value="${esc(a.id)}" ${a.id === sub ? 'selected' : ''}>${esc(a.id)} · ${esc(a.text.slice(0, 40))}</option>`).join('')}</select>
        ${M() ? `<select id="checkSel" aria-label="Mentor check"><option value="">Any mentor check</option>${[['unchecked', 'Not checked yet'], ...Object.entries(VERDICTS).map(([k, v]) => [k, 'Mentor: ' + v])].map(([k, v]) => `<option value="${k}" ${k === check ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>` : ''}
        <input id="evFilter" type="search" aria-label="Filter evidence" placeholder="Filter…" value="${esc(q.get('q') || '')}"></div>
      <button type="button" class="small filter-toggle" id="evFilterToggle" aria-expanded="false" aria-controls="evFilterControls">Filters</button></div>
    ${list.length ? `<div class="card table-wrap" tabindex="0" role="region" aria-label="Table"><table><thead><tr><th>Code</th><th>Title</th><th>Folder</th><th>Mapped to</th><th>Date</th><th></th></tr></thead><tbody>
      ${list.map((i) => `<tr class="click" data-href="${itemHref(i)}"><td class="nowrap"><b>${i.code ? `<a class="row-link" href="${itemHref(i)}">${esc(i.code)}</a>` : `<a class="row-link muted" href="${itemHref(i)}" aria-label="Open ${esc(i.title)}">–</a>`}</b></td>
        <td>${esc(i.title)}${((i.rec && i.rec.tags) || '').split(',').map((t) => t.trim()).filter(Boolean).map((t) => ' ' + chip(t)).join('')}${i.missing ? ' ' + chip('file missing', 'bad') : ''}${M() && i.code && M().evidence[i.code] ? ' ' + chip('mentor note', 'accent') : ''}</td>
        <td class="small muted">${esc(i.folder)}</td>
        <td>${((i.rec && i.rec.maps) || []).sort((a, b) => natural(a.sub, b.sub)).map((m) => chip(`${m.sub} ${LEVEL_SHORT[m.level]}`, 'accent')).join('')}</td>
        <td class="small nowrap">${esc((i.rec && i.rec.date) || '')}</td>
        <td>${i.missing ? '' : `<a href="#" data-preview="${esc(i.path)}" class="preview-link small" aria-label="Preview ${esc(i.title)}"><span aria-hidden="true">👁</span> Preview</a>`}</td></tr>`).join('')}</tbody></table></div>`
      : emptyState('folders', counts.all ? 'Nothing matches. <a href="#evidence">Show everything</a>.' : `<b>No evidence files yet.</b><br>Press <b>Add files…</b> (or drag files onto this page), or save them into the <code>${FOLDERS.evidence}</code> folder in your OneDrive yourself (sub-folders are fine). Start each file name with a code such as <code>CO-14</code>, then press <b>Refresh</b> above. Not sure how to organise them? <a href="#help">See the suggested folder layout</a>.`)}`;
};
VIEWS.evidence.after = (arg, q) => {
  $$('tr[data-href]').forEach((tr) => tr.addEventListener('click', (e) => { if (!e.target.closest('a')) location.hash = tr.dataset.href; }));
  $('#rescan').addEventListener('click', (e) => act(e.currentTarget, async () => { await scanEvidence(); await render(); }, 'Evidence folder re-read'));
  $('#exportXlsx').addEventListener('click', (e) => act(e.currentTarget, exportMatrix, (p) => 'Saved ' + p));
  const filter = $('#evFilter');
  filter.addEventListener('input', debounce(() => { q.set('q', filter.value); history.replaceState(null, '', '#evidence?' + q.toString()); render().then(() => { const f = $('#evFilter'); f.focus(); f.setSelectionRange(f.value.length, f.value.length); }); }, 300));
  $('#folderSel').addEventListener('change', (e) => { q.set('folder', e.target.value); location.hash = '#evidence?' + q.toString(); });
  $('#subSel').addEventListener('change', (e) => { q.set('sub', e.target.value); location.hash = '#evidence?' + q.toString(); });
  if ($('#checkSel')) $('#checkSel').addEventListener('change', (e) => { q.set('check', e.target.value); location.hash = '#evidence?' + q.toString(); });
  if ($('#autoCodes')) $('#autoCodes').addEventListener('click', numberFiles);
  if ($('#addFiles')) $('#addFiles').addEventListener('click', pickEvidenceFiles);
};

function evidenceRecord(it) {
  const ev = P().evidence;
  if (!ev[it.path]) ev[it.path] = { code: it.code, title: it.title, date: '', project: '', notes: '', maps: [], size: it.file ? it.file.size : 0 };
  return ev[it.path];
}

async function numberFiles() {
  const items = evidenceItems().filter((i) => !i.missing && !i.code);
  if (!items.length) return toast('Every file already has a code');
  const byFolder = {};
  for (const i of items) (byFolder[i.folder] = byFolder[i.folder] || []).push(i);
  const used = new Set(evidenceItems().map((i) => i.code).filter(Boolean));
  const d = dialog(`<h2>Give codes to ${plural(items.length, 'file')}</h2>
    <p class="small muted">Pick a 2 or 3 letter prefix per folder (for example SV for site visits). Files are numbered in name order, skipping codes already used. Only the tracker changes: file names stay as they are.</p>
    <table><thead><tr><th>Folder</th><th>Files</th><th>Prefix</th></tr></thead><tbody>${Object.entries(byFolder).map(([f, list]) => `<tr><td>${esc(f || '(top level)')}</td><td>${list.length}</td>
      <td><input data-folder="${esc(f)}" size="4" maxlength="3" value="${esc(categoryPrefix(f) || (f.replace(/^[\d\s.\-–]+/, '').match(/[A-Za-z]/g) || ['E', 'V']).slice(0, 2).join('').toUpperCase())}"></td></tr>`).join('')}</tbody></table>
    <div class="row" style="justify-content:flex-end;margin-top:1rem"><button value="no">Cancel</button><button class="primary" id="doNumber">Give codes</button></div>`);
  $('button[value=no]', d).addEventListener('click', () => d.close());
  $('#doNumber', d).addEventListener('click', () => {
    for (const input of $$('input[data-folder]', d)) {
      const prefix = input.value.trim().toUpperCase();
      if (!/^[A-Z]{2,3}$/.test(prefix)) { toast('A prefix must be 2 or 3 letters', 'error'); return; }
      let n = 0;
      for (const it of byFolder[input.dataset.folder].sort((a, b) => natural(a.path, b.path))) {
        while (used.has(`${prefix}-${String(n).padStart(2, '0')}`)) n++;
        const code = `${prefix}-${String(n).padStart(2, '0')}`;
        used.add(code);
        evidenceRecord(it).code = code;
      }
    }
    changed();
    d.close();
    toast(`Codes given to ${plural(items.length, 'file')}`);
    render();
  });
}

// ---------- one evidence item ----------
// VIEWS.item and its handlers are in 08b-item.js.
document.addEventListener('keydown', (e) => {
  if (parseHash().name !== 'item' || (e.target.closest && e.target.closest('input, textarea, select')) || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'j' || k === 'k') {
    const link = $$('a.btn.small').find((a) => a.title.startsWith(k === 'j' ? 'Next' : 'Previous'));
    if (link) location.hash = link.getAttribute('href');
  }
});

// ---------- attributes ----------
VIEWS.attributes = async (arg, q) => {
  await loadReports();
  const cov = coverage();
  const prr = prrBySub();
  const fb = feedbackItems();
  const only = q.get('g');
  const metN = SUBS.filter((a) => slotStatus(cov[a.id]) === 'met').length;
  return `<h1>${esc(LABEL.attr)}</h1>
    ${facts([[plural(SUBS.length, LABEL.item, LABEL.items)], [metN + ' met', metN === SUBS.length ? 'good' : metN ? 'part' : 'bad'], ['Goal ' + goal()]])}
    ${neededChecklist([
      { ok: metN === SUBS.length, text: `${metN} of ${SUBS.length} ${LABEL.items} meet the goal of ${goal()} items per level` },
      { ok: fb.filter((f) => f.status === 'open').length === 0, text: `Resolve open mentor comments (${fb.filter((f) => f.status === 'open').length} open)`, href: fb.some((f) => f.status === 'open') ? '#feedback' : '' },
    ])}
    <p class="muted small">Goal: ${goal()} different pieces of evidence at each level (${LEVELS.map((l) => LEVEL_NAME[l]).join(', ')}) for every ${LABEL.item}. Click a row for everything about it.${KSBS.length && !only ? ` <a href="#ksbs">Jump to ${esc(LABEL.ksb)}</a>` : ''}</p>
    ${GROUPS.filter((g) => !only || String(g.group) === only).map((g) => `<div class="card"><h2>${g.group}. ${esc(g.title)}</h2><div class="table-wrap" tabindex="0" role="region" aria-label="Table"><table class="attr">
      <thead><tr><th>Sub</th><th>Description</th><th>${LEVELS.map((l) => LEVEL_SHORT[l]).join(' / ')}</th><th>Evidence</th><th>PRR</th><th>Comments</th>${M() ? '<th>Mentor</th>' : ''}</tr></thead><tbody>
      ${SUBS.filter((a) => a.group === g.group).map((a) => {
        const cell = cov[a.id];
        const codes = [...new Set(LEVELS.flatMap((l) => cell[l].map(label)))].sort(natural);
        const open = fb.filter((f) => f.sub === a.id && f.status === 'open').length;
        const ms = M() && M().subs[a.id];
        return `<tr class="click" data-href="#sub/${a.id}"><td><b><a class="row-link" href="#sub/${a.id}">${a.id}</a></b></td><td>${esc(a.text)}</td><td class="nowrap">${slotsHtml(cell)}</td>
          <td class="small">${codes.slice(0, 12).map((c) => esc(c)).join(', ')}${codes.length > 12 ? ` +${codes.length - 12}` : ''}</td>
          <td>${prrChip(prr[a.id].state)}</td><td>${open ? chip(open + ' open', 'bad') : ''}</td>
          ${M() ? `<td>${ms && ms.status ? chip(MENTOR_STATUS[ms.status], ms.status === 'met' ? 'good' : 'part') : ''}</td>` : ''}</tr>`;
      }).join('')}</tbody></table></div></div>`).join('')}
    ${only ? (KSBS.length ? `<p class="small"><a href="#ksbs">${esc(LABEL.ksb)} and your self-rating</a></p>` : '') : ksbSection(q)}`;
};
VIEWS.attributes.after = () => {
  $$('tr[data-href]').forEach((tr) => tr.addEventListener('click', (e) => { if (!e.target.closest('a')) location.hash = tr.dataset.href; }));
  if ($('#ksbs')) ratingAfter();
};

// Everything about one sub-attribute on one page.
VIEWS.sub = async (id) => {
  const a = SUB[id];
  if (!a) return '<div class="empty">Unknown item.</div>';
  await loadReports();
  const cell = coverage()[id];
  const prr = prrBySub()[id];
  const fb = feedbackItems().filter((f) => f.sub === id);
  const meet = P().meetings.flatMap((m) => m.items.filter((i) => i.sub === id).map((i) => ({ ...i, meeting: m })));
  const ms = M() && M().subs[id];
  const i = SUBS.indexOf(a);
  return `<div class="row spread"><a href="#attributes">← ${esc(LABEL.attr)}</a><div class="row">
      ${SUBS[i - 1] ? `<a class="btn small" href="#sub/${SUBS[i - 1].id}">‹ ${SUBS[i - 1].id}</a>` : ''}${SUBS[i + 1] ? `<a class="btn small" href="#sub/${SUBS[i + 1].id}">${SUBS[i + 1].id} ›</a>` : ''}</div></div>
    <h1>${id} · ${esc(a.text)}</h1><p class="muted">${a.group}. ${esc(a.group_title)} · ${slotsHtml(cell)}</p>
    <div class="cols">
      <div>
        <div class="card"><h2>Evidence by level</h2>${LEVELS.map((l) => `<h3>${esc(LEVEL_NAME[l])} <span class="small muted">${cell[l].length} / ${goal()}</span></h3>
          ${cell[l].length ? `<ul class="list-plain">${cell[l].map((it) => {
            const m = it.rec.maps.find((x) => x.sub === id && x.level === l);
            return `<li>${itemLink(it)} ${it.code ? esc(it.title) : ''}${m && m.note ? `<div class="small muted">${esc(m.note)}</div>` : ''}</li>`;
          }).join('')}</ul>` : `<p class="small muted">${esc(LEVEL_HELP[l])}</p>`}`).join('')}</div>
        <div class="card"><h2>Linked KSBs</h2>${KSBS.filter((k) => k.attributes.includes(id)).map((k) => `<p><b>${k.id}</b> <span class="small">${esc(k.text)}</span></p>`).join('') || '<p class="muted">None.</p>'}</div>
      </div>
      <div>
        <div class="card"><h2>In your PRR</h2>${prr.sections.length ? prr.sections.map((x) => `<p>${fileLink(x.file, x.name)} · ${x.section.words} words · ${chip(x.section.state)}</p>
          ${x.section.listedText ? `<p class="small">Evidence line: ${linkify(x.section.listedText)}</p>` : ''}
          ${x.issues.map(([lv, msg]) => `<div class="issue ${lv}">${linkify(msg)}</div>`).join('')}`).join('') : `<p class="muted">No heading "${id} – …" found in the Word files in <code>${FOLDERS.prr}</code>.</p>`}</div>
        <div class="card"><h2>Mentor comments</h2>${fb.length ? fb.map((f) => `<div class="fb ${f.status !== 'open' ? 'done' : ''}"><div class="meta">${esc(f.author)} · ${chip(FB_STATUS[f.status], f.status === 'open' ? 'bad' : 'good')}</div><div class="text">${linkify(f.text)}</div>${f.response ? `<div class="small"><b>Response:</b> ${esc(f.response)}</div>` : ''}</div>`).join('') + `<a href="#feedback?sub=${id}">Work through them →</a>` : '<p class="muted">None.</p>'}</div>
        ${M() ? `<div class="card"><h2>Mentor's assessment</h2>${ms && ms.status ? `<p>${chip(MENTOR_STATUS[ms.status], ms.status === 'met' ? 'good' : 'part')} <span class="small muted">${fmtDate(ms.date)}</span></p><p>${linkify(ms.comment || '')}</p>` : '<p class="muted">Not assessed yet.</p>'}${isMentor() ? '<a href="#mentor">Edit in Assessment →</a>' : ''}</div>` : ''}
        <div class="card"><h2>From meetings</h2>${meet.length ? `<ul class="list-plain">${meet.map((m) => `<li>${chip(ITEM_KINDS[m.kind])} ${linkify(m.text)} <span class="small muted">· <a href="#meeting/${m.meeting.id}">${fmtDate(m.meeting.date)}</a></span></li>`).join('')}</ul>` : '<p class="muted">Nothing tagged to this sub-attribute.</p>'}</div>
      </div>
    </div>`;
};

// ---------- KSBs: on the same page as the attributes (as in the server copy); #ksbs opens that page at the KSBs ----------
function ksbSection(q) {
  if (!KSBS.length) return '';
  const cov = ksbCoverage();
  const focus = q.get('k');
  return `<h2 id="ksbs" class="ksb-head">${esc(LABEL.ksb)}</h2>
    ${ratingSummary()}<p class="muted small">From the apprenticeship standard. <b>Direct</b>: evidence where you ticked the KSB on a mapping. <b>Via ${LABEL.item}</b>: evidence mapped to a ${LABEL.item} this KSB is linked to.</p>
    <div class="card table-wrap" tabindex="0" role="region" aria-label="Table"><table><thead><tr><th>KSB</th><th>Description</th><th>${cap1(LABEL.items)}</th><th>Direct</th><th>Via ${LABEL.item}</th><th>My rating</th></tr></thead><tbody>
    ${KSBS.map((k) => `<tr id="ksb-${k.id}" ${focus === k.id ? 'style="outline:2px solid var(--accent)"' : ''}><td><b>${k.id}</b><div class="small muted">${esc(k.kind)}</div></td><td class="small">${esc(k.text)}</td>
      <td>${k.attributes.map(subLink).join(' ')}</td>
      <td>${[...cov[k.id].direct].map(itemLink).join(' ') || '<span class="muted">–</span>'}</td>
      <td>${cov[k.id].via.size ? chip(cov[k.id].via.size + ' items', cov[k.id].via.size >= 3 ? 'good' : 'part') : chip('none', 'bad')}</td><td>${ratingCell(k)}</td></tr>`).join('')}</tbody></table></div>`;
}
VIEWS.ksbs = (arg, q) => VIEWS.attributes(arg, q);
VIEWS.ksbs.after = (arg, q) => {
  VIEWS.attributes.after(arg, q);
  const k = q.get('k'), el = (k && $('#ksb-' + k)) || $('#ksbs');
  if (el) requestAnimationFrame(() => el.scrollIntoView({ block: k ? 'center' : 'start' }));
};
