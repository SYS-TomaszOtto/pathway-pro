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
  return `<h1>${isMentor() ? esc(P() ? P().name : 'Apprentice') + '’s portfolio' : 'Your ICE Professional Review'}</h1>
    <div class="kpis">
      <div class="kpi"><div class="label">Overall</div><div class="big-number">${Math.round(c.total * 100)}%</div>${meter(c.total)}</div>
      <div class="kpi"><div class="label">Evidence slots (K/E/A × ${goal()})</div><div class="big-number">${Math.round(c.evidence * 100)}%</div>${meter(c.evidence)}<div class="small muted">${met} of ${SUBS.length} sub-attributes full</div></div>
      <div class="kpi"><div class="label">PRR sections</div><div class="big-number">${Math.round(c.prr * 100)}%</div>${meter(c.prr)}<div class="small muted">${Object.keys(S.prr).length} Word file(s) in PRR</div></div>
      <div class="kpi"><div class="label">Mentor comments</div><div class="big-number">${fbOpen}</div><div class="small muted">open · <a href="#feedback">answer them</a></div></div>
      <div class="kpi"><div class="label">Evidence files</div><div class="big-number">${items.filter((i) => !i.missing).length}</div><div class="small muted">${items.filter((i) => !i.missing && !(i.rec && i.rec.maps && i.rec.maps.length)).length} not mapped yet</div></div>
      <div class="kpi"><div class="label">CPD ${cpdYearLabel(yr)}</div><div class="big-number">${hours}<small style="font-size:1rem"> / ${P().settings.cpdTarget} h</small></div>${meter(hours / (P().settings.cpdTarget || 30), hours >= P().settings.cpdTarget ? 'good' : '')}</div>
      ${ms !== null ? `<div class="kpi"><div class="label">Mentor: met</div><div class="big-number">${ms}<small style="font-size:1rem"> / ${SUBS.length}</small></div><div class="small muted"><a href="#mentor">assessment</a></div></div>` : ''}
    </div>
    <div class="grid">
      <div class="card"><h2>Next steps</h2>${steps.length ? `<ol>${steps.map((s) => `<li><a href="${s.href}">${linkify(s.text)}</a></li>`).join('')}</ol>` : '<p class="good">Nothing outstanding. 🎉</p>'}</div>
      <div class="card"><h2>Open actions from meetings</h2>${actions.length ? `<ul class="list-plain">${actions.slice(0, 10).map((a) => `<li>${a.due ? `<span class="chip ${a.due < today() ? 'bad' : ''}">${fmtDate(a.due)}</span> ` : ''}${linkify(a.text)} <span class="small muted">· <a href="#meeting/${a.meeting.id}">${fmtDate(a.meeting.date)}</a></span></li>`).join('')}</ul>` : '<p class="muted">None. Actions come from tagging "To do" in a meeting.</p>'}</div>
      <div class="card"><h2>By attribute</h2><table><tbody>${GROUPS.map((g) => {
        const subs = SUBS.filter((a) => a.group === g.group);
        const frac = subs.reduce((n, a) => n + slots(cov[a.id]), 0) / (subs.length * 3 * goal());
        return `<tr class="click" onclick="location.hash='#attributes?g=${g.group}'"><td class="nowrap"><b>${g.group}</b></td><td>${esc(g.title)}</td><td style="width:30%">${meter(frac, frac >= 1 ? 'good' : '')}</td></tr>`;
      }).join('')}</tbody></table></div>
    </div>`;
};

// ---------- evidence list ----------
VIEWS.evidence = async (arg, q) => {
  await scanEvidence();
  const show = q.get('show') || 'all';
  const folder = q.get('folder') || '';
  const text = (q.get('q') || '').toLowerCase();
  const items = evidenceItems();
  const folders = [...new Set(items.map((i) => i.folder))].sort(natural);
  const list = items.filter((i) => {
    const maps = (i.rec && i.rec.maps) || [];
    if (show === 'unmapped' && (i.missing || maps.length)) return false;
    if (show === 'mapped' && !maps.length) return false;
    if (show === 'missing' && !i.missing) return false;
    if (folder && i.folder !== folder) return false;
    if (text && !`${i.code} ${i.title} ${i.path} ${(i.rec && i.rec.notes) || ''} ${(i.rec && i.rec.project) || ''}`.toLowerCase().includes(text)) return false;
    return true;
  });
  const counts = { all: items.filter((i) => !i.missing).length, unmapped: items.filter((i) => !i.missing && !((i.rec && i.rec.maps) || []).length).length, mapped: items.filter((i) => ((i.rec && i.rec.maps) || []).length).length, missing: items.filter((i) => i.missing).length };
  const qs = (patch) => '#evidence?' + new URLSearchParams({ show, folder, q: q.get('q') || '', ...patch }).toString();
  return `<div class="row spread"><h1>Evidence</h1><div class="row">
      <button id="rescan" title="Look for new, moved or deleted files">↻ Refresh</button>
      ${canEdit() ? '<button id="autoCodes" title="Give codes to files that have none">Number files…</button>' : ''}
      <button id="exportXlsx" class="primary">Export Excel matrix</button></div></div>
    <p class="muted small">Every file in <code>${FOLDERS.evidence}</code> (and its sub-folders) is listed. Put a code such as <code>CO-14</code> at the start of a file name and it is picked up; otherwise type one in. Click a row to map it.</p>
    <div class="sub-tabs">${['all', 'unmapped', 'mapped', 'missing'].map((s) => `<a href="${qs({ show: s })}" class="${show === s ? 'active' : ''}">${{ all: 'All', unmapped: 'Not mapped', mapped: 'Mapped', missing: 'File missing' }[s]} (${counts[s]})</a>`).join('')}
      <select id="folderSel"><option value="">All folders</option>${folders.map((f) => `<option ${f === folder ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select>
      <input id="evFilter" type="search" placeholder="Filter…" value="${esc(q.get('q') || '')}"></div>
    ${list.length ? `<div class="card table-wrap"><table><thead><tr><th>Code</th><th>Title</th><th>Folder</th><th>Mapped to</th><th>Date</th><th></th></tr></thead><tbody>
      ${list.map((i) => `<tr class="click" data-href="${itemHref(i)}"><td class="nowrap"><b>${esc(i.code) || '<span class="muted">–</span>'}</b></td>
        <td>${esc(i.title)}${i.missing ? ' ' + chip('file missing', 'bad') : ''}${M() && i.code && M().evidence[i.code] ? ' ' + chip('mentor note', 'accent') : ''}</td>
        <td class="small muted">${esc(i.folder)}</td>
        <td>${((i.rec && i.rec.maps) || []).sort((a, b) => natural(a.sub, b.sub)).map((m) => chip(`${m.sub} ${LEVEL_SHORT[m.level]}`, 'accent')).join('')}</td>
        <td class="small nowrap">${esc((i.rec && i.rec.date) || '')}</td>
        <td>${i.missing ? '' : `<a href="#" data-preview="${esc(i.path)}" title="Preview">👁</a>`}</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="empty">${counts.all ? 'Nothing matches.' : `No files yet. Save your evidence into the <b>${FOLDERS.evidence}</b> folder (sub-folders are fine), then press Refresh.`}</div>`}`;
};
VIEWS.evidence.after = (arg, q) => {
  $$('tr[data-href]').forEach((tr) => tr.addEventListener('click', (e) => { if (!e.target.closest('a')) location.hash = tr.dataset.href; }));
  $('#rescan').addEventListener('click', (e) => act(e.currentTarget, async () => { await scanEvidence(); await render(); }, 'Evidence folder re-read'));
  $('#exportXlsx').addEventListener('click', (e) => act(e.currentTarget, exportMatrix, (p) => 'Saved ' + p));
  const filter = $('#evFilter');
  filter.addEventListener('input', debounce(() => { q.set('q', filter.value); history.replaceState(null, '', '#evidence?' + q.toString()); render().then(() => { const f = $('#evFilter'); f.focus(); f.setSelectionRange(f.value.length, f.value.length); }); }, 300));
  $('#folderSel').addEventListener('change', (e) => { q.set('folder', e.target.value); location.hash = '#evidence?' + q.toString(); });
  if ($('#autoCodes')) $('#autoCodes').addEventListener('click', numberFiles);
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
      <td><input data-folder="${esc(f)}" size="4" maxlength="3" value="${esc((f.replace(/^[\d\s.\-–]+/, '').match(/[A-Za-z]/g) || ['E', 'V']).slice(0, 2).join('').toUpperCase())}"></td></tr>`).join('')}</tbody></table>
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
VIEWS.item = async (arg) => {
  const items = evidenceItems();
  const it = items.find((i) => i.path === arg);
  if (!it) return `<div class="empty">That evidence file is not in the list any more. <a href="#evidence">Back to Evidence</a></div>`;
  const list = items.filter((i) => !i.missing);
  const idx = list.indexOf(it);
  const prev = list[idx - 1], next = list[idx + 1];
  const rec = it.rec || { code: it.code, title: it.title, date: '', project: '', notes: '', maps: [] };
  const ed = canEdit();
  const has = (sub, level) => (rec.maps || []).some((m) => m.sub === sub && m.level === level);
  const mentorNote = M() && it.code && M().evidence[it.code];
  const usedIn = Object.values(S.prr).flatMap((r) => r.doc.sections.filter((s) => s.listed.includes(it.code) || s.discussed.includes(it.code)).map((s) => s.id));
  const relink = it.missing ? S.files.filter((f) => !P().evidence[f.path] && (f.name === it.path.split('/').pop() || (rec.size && f.size === rec.size))) : [];
  return `<div class="row spread"><div class="row"><a href="#evidence">← Evidence</a>
      ${prev ? `<a class="btn small" href="${itemHref(prev)}" title="Previous (K)">‹ ${esc(prev.code || 'previous')}</a>` : ''}
      ${next ? `<a class="btn small" href="${itemHref(next)}" title="Next (J)">${esc(next.code || 'next')} ›</a>` : ''}
      <span class="small muted">${idx + 1} of ${list.length}</span></div>
      <span class="small muted">Keys: <kbd>J</kbd>/<kbd>K</kbd> next/previous</span></div>
    <h1>${esc(rec.code || it.code || '')} ${esc(rec.title || it.title)}</h1>
    ${it.missing ? `<div class="banner bad">The file <code>${esc(it.path)}</code> is not in the Evidence folder any more.${relink.length ? ` It may be one of these: ${relink.map((f) => `<button class="small relink" data-path="${esc(f.path)}">${esc(f.path)}</button>`).join(' ')}` : ''}
      ${ed ? ' <button class="small danger" id="dropRec">Remove this record</button>' : ''}</div>` : ''}
    <div class="cols">
      <div>
        <div class="card"><div class="form-grid">
          <div><label>Code</label><input data-field="code" value="${esc(rec.code || it.code)}" placeholder="e.g. CO-14"${dis(ed)}></div>
          <div><label>Date</label><input type="date" data-field="date" value="${esc(rec.date || '')}"${dis(ed)}></div>
          <div class="full"><label>Title</label><input data-field="title" value="${esc(rec.title || it.title)}"${dis(ed)}></div>
          <div class="full"><label>Project / job</label><input data-field="project" value="${esc(rec.project || '')}"${dis(ed)} list="projects"></div>
          <div class="full"><label>Notes (what it shows, your part in it)</label><textarea data-field="notes"${dis(ed)}>${esc(rec.notes || '')}</textarea></div>
        </div>
        <datalist id="projects">${[...new Set(Object.values(P().evidence).map((r) => r.project).filter(Boolean))].map((p) => `<option>${esc(p)}</option>`).join('')}</datalist>
        <p class="small muted">File: ${it.missing ? esc(it.path) : fileLink(it.path, it.path)}${it.file ? ` · ${fmtSize(it.file.size)}` : ''}${usedIn.length ? ` · in your PRR for ${usedIn.map(subLink).join(' ')}` : ''}</p></div>

        <div class="card"><h2>Sub-attributes and level</h2>
          <p class="small muted">Click K, E or A for each sub-attribute this shows. <b>K</b> ${esc(LEVEL_HELP.knowledge.split(': ')[1])} <b>E</b> ${esc(LEVEL_HELP.experience.split(': ')[1])} <b>A</b> ${esc(LEVEL_HELP.ability.split(': ')[1])}</p>
          <div class="map-grid">${GROUPS.map((g) => `<div class="group-title">${g.group}. ${esc(g.title)}</div>` + SUBS.filter((a) => a.group === g.group).map((a) =>
            `<div class="map-row"><span class="sid">${subLink(a.id)}</span><span class="stext" title="${esc(a.text)}">${esc(a.text)}</span>${LEVELS.map((l) =>
              `<button class="small lvl-btn ${has(a.id, l) ? 'on' : ''}" data-sub="${a.id}" data-level="${l}" title="${esc(LEVEL_HELP[l])}"${dis(ed)}>${LEVEL_SHORT[l]}</button>`).join('')}</div>`).join('')).join('')}</div>
        </div>

        ${(rec.maps || []).length ? `<div class="card"><h2>Mapping details</h2><table><thead><tr><th>Sub-attr.</th><th>Level</th><th>KSBs</th><th>Note (why it fits)</th><th></th></tr></thead><tbody>
          ${rec.maps.slice().sort((a, b) => natural(a.sub, b.sub)).map((m) => {
            const i = rec.maps.indexOf(m);
            const related = KSBS.filter((k) => k.attributes.includes(m.sub));
            return `<tr><td>${subLink(m.sub)}</td><td>${esc(m.level)}</td>
              <td>${related.map((k) => `<label class="nowrap" style="display:inline;margin:0 .4rem 0 0;color:var(--ink)" title="${esc(k.text)}"><input type="checkbox" class="ksb-box" data-i="${i}" value="${k.id}" ${(m.ksbs || []).includes(k.id) ? 'checked' : ''}${dis(ed)}> ${k.id}</label>`).join('') || '<span class="muted small">none linked</span>'}</td>
              <td><input class="map-note" data-i="${i}" value="${esc(m.note || '')}" style="width:100%"${dis(ed)}></td>
              <td>${ed ? `<button class="small danger map-del" data-i="${i}" title="Remove">✕</button>` : ''}</td></tr>`;
          }).join('')}</tbody></table></div>` : ''}

        ${M() || isMentor() ? `<div class="card"><h2>Mentor's note</h2>${isMentor()
          ? `<textarea id="mentorNote" placeholder="Your comment on this piece of evidence (only you can edit it; the apprentice sees it)">${esc(mentorNote ? mentorNote.comment : '')}</textarea>${it.code ? '' : '<p class="small bad">This file has no code yet, so a note cannot be attached.</p>'}`
          : mentorNote ? `<p>${linkify(mentorNote.comment)}</p><p class="small muted">${esc(M().name)} · ${fmtDate(mentorNote.date)}</p>` : '<p class="muted">No note.</p>'}</div>` : ''}
      </div>
      <div>${it.missing ? '' : `<div class="preview-inline" id="inlinePreview"><p class="muted" style="padding:16px">Loading preview…</p></div>`}</div>
    </div>`;
};
VIEWS.item.after = async (arg) => {
  const it = evidenceItems().find((i) => i.path === arg);
  if (!it) return;
  const rec = canEdit() ? evidenceRecord(it) : (it.rec || {});
  if (canEdit()) {
    bindFields($('#main'), rec);
    $$('.lvl-btn').forEach((b) => b.addEventListener('click', () => {
      const { sub, level } = b.dataset;
      const i = rec.maps.findIndex((m) => m.sub === sub && m.level === level);
      if (i >= 0) rec.maps.splice(i, 1); else rec.maps.push({ sub, level, ksbs: [], note: '' });
      changed();
      const y = window.scrollY;
      render().then(() => window.scrollTo(0, y));
    }));
    $$('.ksb-box').forEach((b) => b.addEventListener('change', () => {
      const m = rec.maps[+b.dataset.i];
      m.ksbs = $$(`.ksb-box[data-i="${b.dataset.i}"]:checked`).map((x) => x.value);
      changed();
    }));
    $$('.map-note').forEach((inp) => inp.addEventListener('input', () => { rec.maps[+inp.dataset.i].note = inp.value; changed(); }));
    $$('.map-del').forEach((b) => b.addEventListener('click', () => { rec.maps.splice(+b.dataset.i, 1); changed(); render(); }));
    $$('.relink').forEach((b) => b.addEventListener('click', () => {
      P().evidence[b.dataset.path] = rec;
      delete P().evidence[it.path];
      changed();
      location.hash = '#item/' + encodeURIComponent(b.dataset.path);
    }));
    if ($('#dropRec')) $('#dropRec').addEventListener('click', async () => {
      if (!(await ask('Remove this record and its mappings? The file itself is already gone.', 'Remove'))) return;
      delete P().evidence[it.path];
      changed();
      location.hash = '#evidence';
    });
  }
  if (isMentor() && $('#mentorNote') && it.code) {
    $('#mentorNote').addEventListener('input', (e) => { S.data.evidence[it.code] = { comment: e.target.value, date: today() }; changed(); });
  }
  if ($('#inlinePreview')) {
    try { $('#inlinePreview').innerHTML = await previewHtml(it.path); } catch (err) { $('#inlinePreview').innerHTML = `<p class="bad" style="padding:16px">${esc(err.message)}</p>`; }
  }
};
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
  return `<h1>Attributes</h1>
    <p class="muted small">Goal: ${goal()} different pieces of evidence at each level (Knowledge, Experience, Ability) for every sub-attribute. Click a row for everything about it.</p>
    ${GROUPS.filter((g) => !only || String(g.group) === only).map((g) => `<div class="card"><h2>${g.group}. ${esc(g.title)}</h2><div class="table-wrap"><table>
      <thead><tr><th>Sub</th><th>Description</th><th>K / E / A</th><th>Evidence</th><th>PRR</th><th>Comments</th>${M() ? '<th>Mentor</th>' : ''}</tr></thead><tbody>
      ${SUBS.filter((a) => a.group === g.group).map((a) => {
        const cell = cov[a.id];
        const codes = [...new Set(LEVELS.flatMap((l) => cell[l].map(label)))].sort(natural);
        const open = fb.filter((f) => f.sub === a.id && f.status === 'open').length;
        const ms = M() && M().subs[a.id];
        return `<tr class="click" data-href="#sub/${a.id}"><td><b>${a.id}</b></td><td>${esc(a.text)}</td><td class="nowrap">${slotsHtml(cell)}</td>
          <td class="small">${codes.slice(0, 12).map((c) => esc(c)).join(', ')}${codes.length > 12 ? ` +${codes.length - 12}` : ''}</td>
          <td>${prrChip(prr[a.id].state)}</td><td>${open ? chip(open + ' open', 'bad') : ''}</td>
          ${M() ? `<td>${ms && ms.status ? chip(MENTOR_STATUS[ms.status], ms.status === 'met' ? 'good' : 'part') : ''}</td>` : ''}</tr>`;
      }).join('')}</tbody></table></div></div>`).join('')}`;
};
VIEWS.attributes.after = () => $$('tr[data-href]').forEach((tr) => tr.addEventListener('click', (e) => { if (!e.target.closest('a')) location.hash = tr.dataset.href; }));

// Everything about one sub-attribute on one page.
VIEWS.sub = async (id) => {
  const a = SUB[id];
  if (!a) return '<div class="empty">Unknown sub-attribute.</div>';
  await loadReports();
  const cell = coverage()[id];
  const prr = prrBySub()[id];
  const fb = feedbackItems().filter((f) => f.sub === id);
  const meet = P().meetings.flatMap((m) => m.items.filter((i) => i.sub === id).map((i) => ({ ...i, meeting: m })));
  const ms = M() && M().subs[id];
  const i = SUBS.indexOf(a);
  return `<div class="row spread"><a href="#attributes">← Attributes</a><div class="row">
      ${SUBS[i - 1] ? `<a class="btn small" href="#sub/${SUBS[i - 1].id}">‹ ${SUBS[i - 1].id}</a>` : ''}${SUBS[i + 1] ? `<a class="btn small" href="#sub/${SUBS[i + 1].id}">${SUBS[i + 1].id} ›</a>` : ''}</div></div>
    <h1>${id} · ${esc(a.text)}</h1><p class="muted">${a.group}. ${esc(a.group_title)} · ${slotsHtml(cell)}</p>
    <div class="cols">
      <div>
        <div class="card"><h2>Evidence by level</h2>${LEVELS.map((l) => `<h3>${l[0].toUpperCase() + l.slice(1)} <span class="small muted">${cell[l].length} / ${goal()}</span></h3>
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

// ---------- KSBs ----------
VIEWS.ksbs = async (arg, q) => {
  const cov = ksbCoverage();
  const focus = q.get('k');
  return `<h1>Knowledge, Skills and Behaviours</h1>
    <p class="muted small">From the apprenticeship standard. <b>Direct</b>: evidence where you ticked the KSB on a mapping. <b>Via sub-attribute</b>: evidence mapped to a sub-attribute this KSB is linked to.</p>
    <div class="card table-wrap"><table><thead><tr><th>KSB</th><th>Description</th><th>Sub-attributes</th><th>Direct</th><th>Via sub-attribute</th></tr></thead><tbody>
    ${KSBS.map((k) => `<tr id="ksb-${k.id}" ${focus === k.id ? 'style="outline:2px solid var(--accent)"' : ''}><td><b>${k.id}</b><div class="small muted">${esc(k.kind)}</div></td><td class="small">${esc(k.text)}</td>
      <td>${k.attributes.map(subLink).join(' ')}</td>
      <td>${[...cov[k.id].direct].map(itemLink).join(' ') || '<span class="muted">–</span>'}</td>
      <td>${cov[k.id].via.size ? chip(cov[k.id].via.size + ' items', cov[k.id].via.size >= 3 ? 'good' : 'part') : chip('none', 'bad')}</td></tr>`).join('')}</tbody></table></div>`;
};
VIEWS.ksbs.after = (arg, q) => { const k = q.get('k'); if (k && $('#ksb-' + k)) $('#ksb-' + k).scrollIntoView({ block: 'center' }); };
