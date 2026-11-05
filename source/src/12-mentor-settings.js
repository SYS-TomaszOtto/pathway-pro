// The mentor's assessment (kept in the mentor's own folder), settings, help and the Excel export.

const MENTOR_STATUS = { '': 'Not assessed', notyet: 'Not yet', developing: 'Developing', met: 'Met' };

VIEWS.mentor = async () => {
  if (!isMentor() && !M()) {
    return `<h1>Mentor</h1><div class="card"><p>Your mentor's assessment shows here once you link their folder.</p>
      <ol><li>Your mentor uses this same tool and picks <b>I am a mentor</b>. It makes a folder of theirs, e.g. <i>ICE Mentoring - ${esc(P().name)}</i>.</li>
      <li>They share that folder with you as <b>Can view</b>, and you add it to your OneDrive (Shared → the folder → <b>Add shortcut to My files</b>).</li>
      <li>In <a href="#settings">Settings</a>, press <b>Link mentor's folder</b> and pick it.</li></ol>
      <p class="small muted">You can only read it, and your mentor can only read your portfolio: each of you edits just your own folder.</p></div>`;
  }
  const ed = isMentor();
  const m = M();
  const cov = coverage();
  const prr = prrBySub();
  const counts = Object.keys(MENTOR_STATUS).map((k) => [k, SUBS.filter((a) => ((m.subs[a.id] || {}).status || '') === k).length]);
  return `<div class="row spread"><h1>${ed ? 'Your assessment' : `${esc(m.name)}'s assessment`}</h1>
      <div class="small muted">${counts.map(([k, n]) => `${MENTOR_STATUS[k]}: ${n}`).join(' · ')}</div></div>
    ${ed ? '<p class="small muted">Only you can change this; the apprentice sees it read-only. It is saved in your own folder.</p>' : `<p class="small muted">Last changed ${fmtDate(m.saved)}. Read only.</p>`}
    ${GROUPS.map((g) => `<div class="card"><h2>${g.group}. ${esc(g.title)}</h2><table><thead><tr><th>Sub</th><th>Evidence</th><th>PRR</th><th style="width:11rem">Status</th><th>Comment</th></tr></thead><tbody>
      ${SUBS.filter((a) => a.group === g.group).map((a) => { const s = m.subs[a.id] || {}; return `<tr><td><b>${subLink(a.id)}</b><div class="small muted">${esc(a.text)}</div></td>
        <td class="nowrap">${slotsHtml(cov[a.id])}</td><td>${prrChip(prr[a.id].state)}</td>
        <td>${ed ? `<select class="ms" data-sub="${a.id}">${Object.entries(MENTOR_STATUS).map(([k, v]) => `<option value="${k}" ${(s.status || '') === k ? 'selected' : ''}>${v}</option>`).join('')}</select>` : chip(MENTOR_STATUS[s.status || ''], s.status === 'met' ? 'good' : s.status ? 'part' : 'outline')}
          ${s.date ? `<div class="small muted">${fmtDate(s.date)}</div>` : ''}</td>
        <td>${ed ? `<textarea class="mc" data-sub="${a.id}" rows="2">${esc(s.comment || '')}</textarea>` : linkify(s.comment || '')}</td></tr>`; }).join('')}</tbody></table></div>`).join('')}
    <div class="card"><div class="row spread"><h2 style="margin:0">Agreed actions</h2>${ed ? '<button id="addMa">+ Add</button>' : ''}</div>
      ${m.actions.length ? `<table><thead><tr><th>Action</th><th>Due</th><th>Done</th>${ed ? '<th></th>' : ''}</tr></thead><tbody>${m.actions.map((x, i) => `<tr>
        <td>${ed ? `<input class="ma" data-i="${i}" data-k="text" value="${esc(x.text)}" style="width:100%">` : linkify(x.text)}</td>
        <td>${ed ? `<input type="date" class="ma" data-i="${i}" data-k="due" value="${esc(x.due || '')}">` : fmtDate(x.due)}</td>
        <td><input type="checkbox" class="ma" data-i="${i}" data-k="status" ${x.status === 'done' ? 'checked' : ''}${dis(ed)}></td>
        ${ed ? `<td><button class="small danger ma-del" data-i="${i}">✕</button></td>` : ''}</tr>`).join('')}</tbody></table>` : '<p class="muted">None.</p>'}</div>`;
};
VIEWS.mentor.after = () => {
  if (!isMentor()) return;
  const sub = (id) => (S.data.subs[id] = S.data.subs[id] || { status: '', comment: '', date: '' });
  $$('.ms').forEach((el) => el.addEventListener('change', () => { const s = sub(el.dataset.sub); s.status = el.value; s.date = today(); changed(); flash(el, 'done'); }));
  $$('.mc').forEach((el) => el.addEventListener('input', () => { const s = sub(el.dataset.sub); s.comment = el.value; s.date = today(); changed(); }));
  $$('.ma').forEach((el) => el.addEventListener(el.type === 'checkbox' || el.type === 'date' ? 'change' : 'input', () => {
    const x = S.data.actions[+el.dataset.i];
    x[el.dataset.k] = el.type === 'checkbox' ? (el.checked ? 'done' : 'open') : el.value;
    changed();
  }));
  $$('.ma-del').forEach((b) => b.addEventListener('click', () => { S.data.actions.splice(+b.dataset.i, 1); changed(); render(); }));
  $('#addMa').addEventListener('click', () => { S.data.actions.push({ id: uid(), text: '', due: '', status: 'open' }); changed(); render(); });
};

// ---------- settings ----------
VIEWS.settings = async () => {
  const mentor = isMentor();
  const d = S.data;
  const otherOk = S.other && (await permission(S.other, 'read', false));
  const otherLabel = mentor ? 'apprentice’s portfolio folder' : 'mentor’s folder';
  return `<h1>Settings</h1><div class="grid">
    <div class="card"><h2>You</h2><label>Name</label><input id="setName" value="${esc(d.name)}" style="width:100%">
      ${mentor ? '' : `<label>What to use</label><select id="setMode"><option value="ice" ${d.mode !== 'cpd' ? 'selected' : ''}>Professional Review portfolio and CPD</option><option value="cpd" ${d.mode === 'cpd' ? 'selected' : ''}>CPD record only</option></select>`}</div>
    <div class="card"><h2>Folders</h2>
      <p>Your folder: <b>${esc(S.own.name)}</b> <span class="small muted">(you can change things here)</span></p>
      <p>Linked ${otherLabel}: ${S.other ? `<b>${esc(S.other.name)}</b> ${otherOk ? chip('read only', 'good') : chip('needs permission', 'bad')}` : '<span class="muted">none</span>'}</p>
      <div class="row">${S.other && !otherOk ? '<button id="reconnectOther" class="primary">Reconnect</button>' : ''}
        <button id="linkOther">${S.other ? 'Pick a different ' : 'Link '}${otherLabel}…</button>${S.other ? '<button id="unlinkOther">Unlink</button>' : ''}</div>
      <p class="small muted" style="margin-top:1rem">The tool never writes into the linked folder. To protect your own files from changes by others, share your folder with them as <b>Can view</b> in OneDrive.</p>
      <button id="switchFolder" style="margin-top:.5rem">Open a different folder of my own…</button></div>
    <div class="card"><h2>Framework</h2><p>Assessing against <b>${esc(FRAMEWORK.name)}</b>: ${plural(SUBS.length, 'requirement')}, ${plural(LEVELS.length, 'level')}${KSBS.length ? `, ${plural(KSBS.length, 'standard')}` : ''}.</p>
      <p class="small muted">${mentor ? 'Set by the apprentice; shown here read-only.' : 'Edit the requirements, levels, evidence folders and folder names to match your institution or level, or start from a blank one.'}</p><a class="btn" href="#framework">${mentor ? 'View' : 'Edit'} framework</a></div>
    ${mentor ? '' : `<div class="card"><h2>Targets</h2>
      ${d.mode !== 'cpd' ? `<label>Evidence goal per level (${LEVELS.map((l) => LEVEL_NAME[l]).join(', ')}) for each sub-attribute</label><input type="number" min="1" max="9" id="setGoal" value="${d.settings.goal}">` : ''}
      <label>CPD hours a year</label><input type="number" min="0" id="setTarget" value="${d.settings.cpdTarget}">
      <label>CPD year starts in</label><select id="setYearStart">${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => `<option value="${i + 1}" ${d.settings.cpdYearStart === i + 1 ? 'selected' : ''}>${m}</option>`).join('')}</select>
      <label>ICE CPD Framework themes, one per line (start a line with * for a mandatory theme)</label>
      <textarea id="setThemes" rows="5" placeholder="Copy the theme names from the ICE website">${esc((d.settings.themes || []).join('\n'))}</textarea></div>`}
    <div class="card"><h2>Your data</h2>
      <p class="small">Saved as <code>${esc(myDataPath())}</code> in your folder, last at ${d.saved ? new Date(d.saved).toLocaleString('en-GB') : '–'}. A copy is kept each day in <code>${DATA_DIR}/backups</code> (the last 30).</p>
      <p class="small muted">To restore a backup: close this page, rename the backup to <code>${esc(myDataPath().split('/').pop())}</code> and put it in <code>${DATA_DIR}</code>.</p>
      ${!mentor && d.mode !== 'cpd' ? '<button id="exportAll" class="primary">Export everything to Excel</button>' : ''}</div>
  </div>`;
};
VIEWS.settings.after = () => {
  const d = S.data;
  $('#setName').addEventListener('input', (e) => { d.name = e.target.value; changed(); });
  if ($('#setMode')) $('#setMode').addEventListener('change', async (e) => { d.mode = e.target.value; if (d.mode === 'ice') await ensureFolders(S.own, 'ice'); changed(); render(); });
  if ($('#setGoal')) $('#setGoal').addEventListener('input', (e) => { d.settings.goal = Math.max(1, +e.target.value || 3); changed(); });
  if ($('#setTarget')) $('#setTarget').addEventListener('input', (e) => { d.settings.cpdTarget = +e.target.value || 0; changed(); });
  if ($('#setYearStart')) $('#setYearStart').addEventListener('change', (e) => { d.settings.cpdYearStart = +e.target.value; changed(); });
  if ($('#setThemes')) $('#setThemes').addEventListener('input', (e) => { d.settings.themes = e.target.value.split('\n').map((t) => t.trim()).filter(Boolean); changed(); });
  if ($('#reconnectOther')) $('#reconnectOther').addEventListener('click', async () => { if (await permission(S.other, 'read', true)) { await openAll(); toast('Reconnected'); } });
  $('#linkOther').addEventListener('click', async () => {
    let dir;
    try { dir = await pickFolder('other', 'read'); } catch (_) { return; }
    const want = isMentor() ? FILES.apprentice : FILES.mentor;
    if (!(await exists(dir, `${DATA_DIR}/${want}`))) return toast(`That folder has no ${DATA_DIR}/${want}: pick the ${isMentor() ? 'apprentice’s portfolio' : 'mentor’s'} folder`, 'error');
    if (await dir.isSameEntry(S.own)) return toast('That is your own folder', 'error');
    S.other = dir;
    await remember('other', dir);
    await openAll();
    toast(`Linked “${dir.name}” (read only)`);
  });
  if ($('#unlinkOther')) $('#unlinkOther').addEventListener('click', async () => { S.other = null; S.otherData = null; await remember('other', null); await openAll(); toast('Unlinked'); });
  $('#switchFolder').addEventListener('click', async () => {
    if (S.dirty) await save();
    let dir;
    try { dir = await pickFolder('own', 'readwrite'); } catch (_) { return; }
    S.own = dir; S.other = null; S.data = null; S.prr = {};
    await remember('own', dir); await remember('other', null);
    location.hash = '';
    await openAll();
  });
  if ($('#exportAll')) $('#exportAll').addEventListener('click', (e) => act(e.currentTarget, exportMatrix, (p) => 'Saved ' + p));
};

// ---------- Excel matrix ----------
async function exportMatrix() {
  await scanEvidence();
  await loadReports();
  const items = evidenceItems().filter((i) => !i.missing).sort((a, b) => natural(a.code || 'zz' + a.title, b.code || 'zz' + b.title));
  const cov = coverage();
  const prr = prrBySub();
  const fb = feedbackItems();
  const levelCell = (it, sub) => { const ls = ((it.rec && it.rec.maps) || []).filter((m) => m.sub === sub).map((m) => LEVEL_SHORT[m.level]); return ls.length ? { v: ls.sort().join(''), s: 'good' } : ''; };
  const g = goal();
  const status = (n) => ({ v: `${n}/${g}`, s: n >= g ? 'good' : n ? 'part' : 'none' });
  const sheets = [
    { name: 'Evidence Matrix', freeze: { rows: 1, cols: 2 }, filter: true, widths: [9, 40, 22, 11, ...SUBS.map(() => 5), 18, 40],
      rows: [['Code', 'Title', 'Project', 'Date', ...SUBS.map((a) => a.id), 'KSBs', 'File'],
        ...items.map((it) => [it.code, it.title, (it.rec && it.rec.project) || '', (it.rec && it.rec.date) || '', ...SUBS.map((a) => levelCell(it, a.id)),
          [...new Set(((it.rec && it.rec.maps) || []).flatMap((m) => m.ksbs || []))].sort(natural).join(', '), it.path])] },
    { name: 'Summary', freeze: { rows: 1 }, filter: true, widths: [6, 30, 6, 60, ...LEVELS.map(() => 7), 10, 12, 10, 14, 40],
      rows: [['Attr.', 'Attribute', 'Sub', 'Sub-attribute', ...LEVELS.map((l) => LEVEL_SHORT[l]), 'Slots', 'PRR', 'Open comments', 'Mentor', 'Evidence'],
        ...SUBS.map((a) => [a.group, a.group_title, a.id, { v: a.text, s: 'wrap' }, ...LEVELS.map((l) => status(cov[a.id][l].length)),
          `${slots(cov[a.id])}/${slotMax(cov[a.id])}`, prr[a.id].state, fb.filter((f) => f.sub === a.id && f.status === 'open').length, M() ? MENTOR_STATUS[(M().subs[a.id] || {}).status || ''] : '',
          [...new Set(LEVELS.flatMap((l) => cov[a.id][l].map(label)))].sort(natural).join(', ')])] },
    { name: 'KSBs', freeze: { rows: 1 }, widths: [6, 80, 16, 30], rows: [['KSB', 'Description', 'Sub-attributes', 'Evidence (ticked)'],
      ...KSBS.map((k) => { const c = ksbCoverage()[k.id]; return [k.id, { v: k.text, s: 'wrap' }, k.attributes.join(', '), [...c.direct].map(label).join(', ')]; })] },
    { name: 'Mentor feedback', freeze: { rows: 1 }, filter: true, widths: [6, 16, 12, 60, 60, 12, 30], rows: [['Sub', 'From', 'Date', 'Comment', 'Response', 'Status', 'File'],
      ...fb.map((f) => [f.sub, f.author, (f.date || '').slice(0, 10), { v: f.text, s: 'wrap' }, { v: f.response, s: 'wrap' }, FB_STATUS[f.status], f.file])] },
    { name: 'Actions', freeze: { rows: 1 }, filter: true, widths: [12, 30, 70, 6, 12, 8], rows: [['Meeting', 'Title', 'Action', 'Sub', 'Due', 'Status'],
      ...allActions().map((a) => [a.meeting.date, a.meeting.title, { v: a.text, s: 'wrap' }, a.sub, a.due, a.status === 'done' ? 'Done' : 'Open'])] },
    ...cpdSheets('all'),
  ];
  const path = `${FOLDERS.matrix}/ICE evidence matrix ${today()}.xlsx`;
  await writeFile(S.own, path, makeXlsx(sheets));
  return path;
}

// ---------- help ----------
VIEWS.help = async () => (P() && P().mode === 'cpd' ? `<h1>How to use the Portfolio Tool</h1><div class="grid">
  <div class="card"><h2>CPD record</h2><p>This follows ICE's CPD guidance. Review your learning needs at least once a year (a SWOT works well), set objectives with reference codes in the <b>Development plan</b>, and record what you do in the <b>Development record</b> with its effective learning time and what you learned.</p>
    <p>Keep an <b>Unplanned</b> objective for learning you did not plan. ICE advises no more than 6 hours for a day and 30 hours for one activity.</p>
    <p><b>Export</b> makes Word or Excel files in the layout of ICE's CPD templates, ready for an application or the annual CPD audit.</p></div>
  <div class="card"><h2>Good to know</h2><ul>
    <li>Your folder holds <b>${FOLDERS.cpd}</b> (attached certificates and notes), <b>${FOLDERS.exports}</b> and <b>${DATA_DIR}</b> (the record itself: do not edit by hand).</li>
    <li>It saves as you type, and keeps one copy a day in <code>${DATA_DIR}/backups</code>.</li>
    <li>To track a Professional Review as well, switch in <a href="#settings">Settings</a>.</li></ul></div></div>` : '') || `<h1>How to use the Portfolio Tool</h1><div class="grid">
  <div class="card"><h2>The idea</h2><p>One HTML file that keeps a tracker of your ICE Professional Review in your OneDrive folder. It does no thinking for you (no AI): it lists, links, counts and checks, so nothing gets missed.</p>
    <p>Your folder holds: <b>${FOLDERS.prr}</b> (your Word PRRs), <b>${FOLDERS.matrix}</b> (the Excel matrix), <b>${FOLDERS.evidence}</b> (one sub-folder per kind of evidence), <b>${FOLDERS.feedback}</b> (response tables), <b>${FOLDERS.meetings}</b>, <b>${FOLDERS.cpd}</b>, <b>${FOLDERS.exports}</b>, and <b>${DATA_DIR}</b> (the tracker itself: do not edit by hand).</p></div>
  <div class="card"><h2>1. Evidence</h2><ol><li>Save evidence files into <b>${FOLDERS.evidence}</b>. Start file names with a code such as <code>CO-14</code> to have it picked up (or use <b>Number files…</b>).</li>
    <li>Open each one and click <b>K</b>, <b>E</b> or <b>A</b> against every sub-attribute it shows. Add a note on why.</li>
    <li><b>Attributes</b> shows what is covered; the goal is ${P() ? goal() : 3} pieces at each level for every sub-attribute. <b>Home</b> lists the biggest gaps.</li></ol></div>
  <div class="card">${PRR_HELP}</div>
  <div class="card"><h2>3. Mentor feedback</h2><p>Your mentor comments in your Word PRR as usual. <b>Feedback</b> lists every comment and suggested edit under its sub-attribute. Write what you changed, mark it Done (or Won't change), and export the <b>Response to feedback</b> table for your mentor. Use <b>One at a time</b> when there are lots.</p></div>
  <div class="card"><h2>4. Meetings</h2><p>Download the Teams transcript (.vtt or .docx), import it, and tag each line with <kbd>D</kbd> done, <kbd>T</kbd> to do, <kbd>L</kbd> teaching. To-dos become actions; <b>Write notes to Word</b> makes tidy minutes in the Meetings folder.</p></div>
  <div class="card"><h2>5. CPD</h2><p>Follows ICE's CPD guidance: a <b>Development plan</b> (objectives with reference codes, after a yearly review of your learning needs) and a <b>Development record</b> (activities with effective learning time and an evaluation). <b>Export</b> makes Word files in the layout of ICE's templates.</p></div>
  <div class="card"><h2>Working with your mentor</h2><ol>
    <li>Share your portfolio folder with your mentor in OneDrive as <b>Can view</b>, and the <b>${FOLDERS.prr}</b> folder (or just the PRR files) as <b>Can edit</b> so they can comment in Word.</li>
    <li>Your mentor adds it to their OneDrive (Shared → <b>Add shortcut to My files</b>), opens this same file and picks <b>I am a mentor</b>: they make a folder of their own for their assessment and share it back with you as <b>Can view</b>.</li>
    <li>You add theirs to your OneDrive the same way, then <b>Settings → Link mentor's folder</b>.</li></ol>
    <p class="small muted">Each of you can only change your own folder: OneDrive enforces it, so neither can alter the other's records.</p></div>
  <div class="card"><h2>Good to know</h2><ul>
    <li>Use Microsoft Edge or Google Chrome. Edge asks for permission to the folder once per session: press <b>Continue</b>.</li>
    <li>It saves as you type. If OneDrive shows a changed file from another computer, the tool asks which copy to keep.</li>
    <li><kbd>Ctrl</kbd>+<kbd>K</kbd> searches everything. Click any code or file name to preview it beside the page.</li>
    <li>One copy of the tracker is kept per day in <code>${DATA_DIR}/backups</code>.</li></ul></div>
</div>`;
