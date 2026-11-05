// Mentor meetings: import a transcript made elsewhere (Teams .vtt / .docx, or plain text), tag what was said
// as Done, To do or Teaching, and write tidy notes to Word. Nothing is guessed: you do the tagging.

const KIND_KEYS = { d: 'done', t: 'todo', l: 'teaching' };

VIEWS.meetings = async (arg, q) => {
  const meetings = P().meetings.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const imported = new Set(meetings.map((m) => m.source).filter(Boolean));
  const waiting = canEdit() ? (await listDir(S.own, FOLDERS.meetings)).filter((f) => /\.(vtt|docx|txt)$/i.test(f.name) && !/ - notes\.docx$/i.test(f.name) && !imported.has(`${FOLDERS.meetings}/${f.path}`)) : [];
  const show = q.get('actions') || 'open';
  const actions = allActions().filter((a) => show === 'all' || (show === 'open' ? a.status !== 'done' : a.status === 'done'))
    .sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
  return `<div class="row spread"><h1>Meetings</h1>${canEdit() ? `<div class="row">
      <button id="newMeeting">New meeting without transcript</button>
      <label class="btn primary" style="margin:0;color:var(--accent-ink)">Import transcript…<input type="file" id="importFile" accept=".vtt,.docx,.txt" hidden></label></div>` : ''}</div>
    <p class="muted small">Get the transcript from Teams (Recap → Transcript → Download as .vtt or .docx), import it, then tag each line:
      <b class="good">Done</b> (work you described as finished), <b class="part">To do</b> (tasks still to do or new ones) and <b style="color:var(--accent)">Teaching</b> (your mentor explaining something).</p>
    ${waiting.length ? `<div class="banner info">Transcripts in your Meetings folder not imported yet: ${waiting.map((f) => `<button class="small import-waiting" data-path="${esc(FOLDERS.meetings + '/' + f.path)}">${esc(f.name)}</button>`).join(' ')}</div>` : ''}
    <div class="cols wide-left">
      <div class="card"><h2>All meetings</h2>${meetings.length ? `<table><thead><tr><th>Date</th><th>Meeting</th><th>Done</th><th>To do</th><th>Teaching</th></tr></thead><tbody>
        ${meetings.map((m) => `<tr class="click" data-href="#meeting/${m.id}"><td class="nowrap">${fmtDate(m.date)}</td><td>${esc(m.title)}</td>${['done', 'todo', 'teaching'].map((k) => `<td>${m.items.filter((i) => i.kind === k).length || ''}</td>`).join('')}</tr>`).join('')}</tbody></table>`
        : '<div class="empty">No meetings yet.</div>'}</div>
      <div class="card"><h2>Actions</h2>
        <div class="sub-tabs">${['open', 'done', 'all'].map((s) => `<a href="#meetings?actions=${s}" class="${show === s ? 'active' : ''}">${s[0].toUpperCase() + s.slice(1)}</a>`).join('')}</div>
        ${actions.length ? `<ul class="list-plain">${actions.map((a) => `<li class="row" style="flex-wrap:nowrap;align-items:flex-start">
          <input type="checkbox" class="act-done" data-m="${a.meeting.id}" data-i="${a.id}" ${a.status === 'done' ? 'checked' : ''}${dis(canEdit())} title="Mark done">
          <div>${linkify(a.text)}<div class="small muted">${a.due ? `<span class="${a.due < today() && a.status !== 'done' ? 'bad' : ''}">due ${fmtDate(a.due)}</span> · ` : ''}${a.sub ? subLink(a.sub) + ' · ' : ''}<a href="#meeting/${a.meeting.id}">${fmtDate(a.meeting.date)} ${esc(a.meeting.title)}</a></div></div></li>`).join('')}</ul>`
        : '<p class="muted">None.</p>'}</div>
    </div>`;
};
VIEWS.meetings.after = () => {
  $$('tr[data-href]').forEach((tr) => tr.addEventListener('click', () => { location.hash = tr.dataset.href; }));
  $$('.act-done').forEach((b) => b.addEventListener('change', () => {
    const m = P().meetings.find((x) => x.id === b.dataset.m);
    const it = m && m.items.find((x) => x.id === b.dataset.i);
    if (it) { it.status = b.checked ? 'done' : 'open'; changed(); toast(b.checked ? 'Action done' : 'Action re-opened'); }
  }));
  if (!canEdit()) return;
  $('#newMeeting').addEventListener('click', () => {
    const m = { id: uid(), date: today(), title: 'Mentor meeting', attendees: '', source: '', lines: [], items: [] };
    P().meetings.push(m);
    changed();
    location.hash = '#meeting/' + m.id;
  });
  $('#importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Keep a copy of the transcript in the Meetings folder so it travels with the portfolio.
    const path = `${FOLDERS.meetings}/${file.name}`;
    if (!(await exists(S.own, path))) await writeFile(S.own, path, file);
    await importTranscript(file, path);
  });
  $$('.import-waiting').forEach((b) => b.addEventListener('click', async () => importTranscript(await getFile(b.dataset.path, 'own'), b.dataset.path)));
};

async function importTranscript(file, path) {
  let lines;
  try { lines = await readTranscript(file); } catch (err) { return toast('Could not read the transcript: ' + err.message, 'error'); }
  if (!lines.length) return toast('No lines found in that file', 'error');
  const date = (/(\d{4})[-_.]?(\d{2})[-_.]?(\d{2})/.exec(file.name) || []).slice(1).join('-') || localIso(new Date(file.lastModified)).slice(0, 10);
  const speakers = [...new Set(lines.map((l) => l.speaker).filter(Boolean))];
  const m = { id: uid(), date, title: file.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').replace(/\d{4}[-_.]?\d{2}[-_.]?\d{2}/, '').replace(/^[\s\-–]+|[\s\-–]+$/g, '').slice(0, 80) || 'Mentor meeting', attendees: speakers.join(', '), source: path, lines, items: [] };
  P().meetings.push(m);
  changed();
  toast(`Imported ${plural(lines.length, 'line')}${speakers.length ? ' from ' + speakers.join(', ') : ''}`);
  location.hash = '#meeting/' + m.id;
}

let selLine = 0;
VIEWS.meeting = async (id) => {
  const m = P().meetings.find((x) => x.id === id);
  if (!m) return '<div class="empty">Meeting not found. <a href="#meetings">Back</a></div>';
  const ed = canEdit();
  const subOptions = (val) => `<option value="">–</option>${SUBS.map((a) => `<option value="${a.id}" ${val === a.id ? 'selected' : ''}>${a.id}</option>`).join('')}`;
  const itemHtml = (i) => `<div class="mitem item-kind-${i.kind}" data-id="${i.id}">
    <textarea class="it-text"${dis(ed)}>${esc(i.text)}</textarea>
    <div class="row small">${i.who ? `<span class="muted">${esc(i.who)}${i.time ? ' · ' + esc(i.time) : ''}</span>` : ''}
      <label style="margin:0">Sub <select class="it-sub"${dis(ed)}>${subOptions(i.sub)}</select></label>
      ${i.kind === 'todo' ? `<label style="margin:0">Due <input type="date" class="it-due" value="${esc(i.due || '')}"${dis(ed)}></label>
        <label style="margin:0"><input type="checkbox" class="it-status" ${i.status === 'done' ? 'checked' : ''}${dis(ed)}> done</label>` : ''}
      ${i.kind === 'done' ? `<label style="margin:0">Evidence <input class="it-ev" size="7" value="${esc(i.evidence || '')}" placeholder="CO-14"${dis(ed)}></label>` : ''}
      ${ed ? `<select class="it-kind">${Object.entries(ITEM_KINDS).map(([k, v]) => `<option value="${k}" ${k === i.kind ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <button class="small danger it-del" title="Remove">✕</button>` : ''}</div></div>`;
  return `<div class="row spread"><a href="#meetings">← Meetings</a><div class="row">
      <button id="writeNotes" class="primary">Write notes to Word</button>${ed ? '<button id="delMeeting" class="danger">Delete meeting</button>' : ''}</div></div>
    <div class="card"><div class="form-grid">
      <div><label>Date</label><input type="date" data-field="date" value="${esc(m.date)}"${dis(ed)}></div>
      <div class="full" style="grid-column:span 2"><label>Title</label><input data-field="title" value="${esc(m.title)}"${dis(ed)}></div>
      <div class="full"><label>Attendees</label><input data-field="attendees" value="${esc(m.attendees || '')}"${dis(ed)}></div>
      ${m.source ? `<div class="full small muted">Transcript: ${fileLink(m.source, m.source)}</div>` : ''}</div></div>
    <div class="cols">
      <div>${m.lines.length ? `<div class="row spread small" style="margin-bottom:6px"><span class="muted">${plural(m.lines.length, 'line')} · ${m.lines.filter((l) => l.tag).length} tagged</span>
          ${ed ? '<span class="muted">Keys: <kbd>J</kbd>/<kbd>K</kbd> move · <kbd>D</kbd> done · <kbd>T</kbd> to do · <kbd>L</kbd> teaching · <kbd>X</kbd> clear</span>' : ''}</div>
        <div class="transcript" id="transcript">${m.lines.map((l, n) => `<div class="tline ${l.tag ? 't-' + l.tag : ''} ${n === selLine ? 'sel' : ''}" data-n="${n}">
          <span class="when">${esc(l.time || '')}</span><span class="who" title="${esc(l.speaker)}">${esc(l.speaker || '')}</span><span>${esc(l.text)}</span>
          <span class="tags">${ed ? Object.entries({ done: 'D', todo: 'T', teaching: 'L' }).map(([k, v]) => `<button class="small tag-btn ${l.tag === k ? 'on' : ''}" data-kind="${k}" title="${ITEM_KINDS[k]}">${v}</button>`).join('') : l.tag ? chip(ITEM_KINDS[l.tag]) : ''}</span></div>`).join('')}</div>`
        : '<div class="empty">No transcript: add the notes on the right by hand.</div>'}</div>
      <div>${Object.entries(ITEM_KINDS).map(([k, v]) => `<div class="card"><div class="row spread"><h2 style="margin:0">${v} <span class="small muted">${m.items.filter((i) => i.kind === k).length}</span></h2>
          ${ed ? `<button class="small add-item" data-kind="${k}">+ Add</button>` : ''}</div>
          <p class="small muted">${{ done: 'Work you described as finished: possible evidence.', todo: 'Tasks still to do, and new tasks: they appear under Actions.', teaching: 'What your mentor explained: possible CPD (knowledge).' }[k]}</p>
          ${m.items.filter((i) => i.kind === k).map(itemHtml).join('')}</div>`).join('')}</div>
    </div>`;
};
VIEWS.meeting.after = (id) => {
  const m = P().meetings.find((x) => x.id === id);
  if (!m) return;
  $('#writeNotes').addEventListener('click', (e) => act(e.currentTarget, () => writeMeetingNotes(m), (p) => 'Saved ' + p));
  if (!canEdit()) return;
  bindFields($('.card'), m);
  $('#delMeeting').addEventListener('click', async () => {
    if (!(await ask(`Delete “${esc(m.title)}” and its ${plural(m.items.length, 'item')}? The transcript file stays in your Meetings folder.`, 'Delete'))) return;
    P().meetings.splice(P().meetings.indexOf(m), 1);
    changed();
    location.hash = '#meetings';
  });
  const keep = () => { const t = $('#transcript'); const y = t ? t.scrollTop : 0; return () => { const t2 = $('#transcript'); if (t2) t2.scrollTop = y; }; };
  const rerender = () => { const restore = keep(); const wy = window.scrollY; render().then(() => { restore(); window.scrollTo(0, wy); }); };
  const tag = (n, kind) => {
    const line = m.lines[n];
    const existing = m.items.find((i) => i.line === n);
    if (!kind || line.tag === kind) {
      line.tag = '';
      if (existing) m.items.splice(m.items.indexOf(existing), 1);
    } else {
      line.tag = kind;
      if (existing) existing.kind = kind;
      else m.items.push({ id: uid(), kind, text: line.text, who: line.speaker, time: line.time, line: n, sub: '', due: '', status: 'open', evidence: '' });
      m.items.sort((a, b) => (a.line ?? 1e9) - (b.line ?? 1e9));
    }
    changed();
    rerender();
  };
  $$('.tline').forEach((row) => {
    row.addEventListener('click', (e) => {
      selLine = +row.dataset.n;
      $$('.tline.sel').forEach((x) => x.classList.remove('sel'));
      row.classList.add('sel');
      const b = e.target.closest('.tag-btn');
      if (b) tag(+row.dataset.n, b.dataset.kind);
    });
  });
  $$('.add-item').forEach((b) => b.addEventListener('click', () => {
    m.items.push({ id: uid(), kind: b.dataset.kind, text: '', who: '', time: '', line: null, sub: '', due: '', status: 'open', evidence: '' });
    changed();
    rerender();
    setTimeout(() => { const all = $$(`.item-kind-${b.dataset.kind} .it-text`); if (all.length) all[all.length - 1].focus(); }, 50);
  }));
  $$('.mitem').forEach((card) => {
    const it = m.items.find((i) => i.id === card.dataset.id);
    const on = (sel, ev, fn) => { const el = $(sel, card); if (el) el.addEventListener(ev, () => { fn(el); changed(); }); };
    on('.it-text', 'input', (el) => { it.text = el.value; });
    on('.it-sub', 'change', (el) => { it.sub = el.value; });
    on('.it-due', 'change', (el) => { it.due = el.value; });
    on('.it-status', 'change', (el) => { it.status = el.checked ? 'done' : 'open'; });
    on('.it-ev', 'input', (el) => { it.evidence = el.value.trim().toUpperCase(); });
    on('.it-kind', 'change', (el) => { it.kind = el.value; if (it.line !== null && m.lines[it.line]) m.lines[it.line].tag = el.value; rerender(); });
    const del = $('.it-del', card);
    if (del) del.addEventListener('click', () => {
      if (it.line !== null && m.lines[it.line]) m.lines[it.line].tag = '';
      m.items.splice(m.items.indexOf(it), 1);
      changed();
      rerender();
    });
  });
  VIEWS.meeting.tag = tag;
};
document.addEventListener('keydown', (e) => {
  const { name, arg } = parseHash();
  if (name !== 'meeting' || !canEdit() || (e.target.closest && e.target.closest('input, textarea, select')) || e.ctrlKey || e.metaKey || e.altKey) return;
  const m = P().meetings.find((x) => x.id === arg);
  if (!m || !m.lines.length) return;
  const k = e.key.toLowerCase();
  if (k === 'j' || k === 'k' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    selLine = Math.max(0, Math.min(m.lines.length - 1, selLine + (k === 'j' || e.key === 'ArrowDown' ? 1 : -1)));
    $$('.tline.sel').forEach((x) => x.classList.remove('sel'));
    const row = $(`.tline[data-n="${selLine}"]`);
    if (row) { row.classList.add('sel'); row.scrollIntoView({ block: 'nearest' }); }
  } else if (KIND_KEYS[k]) { e.preventDefault(); VIEWS.meeting.tag(selLine, KIND_KEYS[k]); }
  else if (k === 'x') { e.preventDefault(); VIEWS.meeting.tag(selLine, ''); }
});

async function writeMeetingNotes(m) {
  const by = (k) => m.items.filter((i) => i.kind === k && i.text.trim());
  const line = (i) => `${i.text.trim()}${i.who ? ` (${i.who})` : ''}${i.sub ? ` [${i.sub}]` : ''}${i.evidence ? ` – evidence ${i.evidence}` : ''}`;
  const blocks = [
    { type: 'title', text: `Meeting notes – ${m.title}` },
    { type: 'small', text: `${fmtDate(m.date)}${m.attendees ? ' · ' + m.attendees : ''}` },
    { type: 'h1', text: 'Completed' },
    ...(by('done').length ? by('done').map((i) => ({ type: 'p', text: '• ' + line(i) })) : [{ type: 'p', text: 'Nothing recorded.' }]),
    { type: 'h1', text: 'To do and new tasks' },
    by('todo').length ? { type: 'table', rows: [['Task', 'Sub-attribute', 'Due', 'Status'], ...by('todo').map((i) => [i.text.trim() + (i.who ? ` (${i.who})` : ''), i.sub || '', i.due ? fmtDate(i.due) : '', i.status === 'done' ? 'Done' : 'Open'])], widths: [5600, 1300, 1300, 1000] } : { type: 'p', text: 'Nothing recorded.' },
    { type: 'h1', text: 'Teaching from my mentor' },
    ...(by('teaching').length ? by('teaching').map((i) => ({ type: 'p', text: '• ' + line(i) })) : [{ type: 'p', text: 'Nothing recorded.' }]),
  ];
  const safe = `${m.date} ${m.title}`.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
  const path = `${FOLDERS.meetings}/${safe} - notes.docx`;
  await writeFile(S.own, path, makeDocx(blocks));
  return path;
}
