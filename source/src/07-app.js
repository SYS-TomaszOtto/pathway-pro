// The app shell: top bar and tabs, routing, the preview panel, search, and the first-run screens.

const VIEWS = {};      // name -> function(arg, query) that renders into #main
const LOGO_SVG = '<img class="logo" width="22" height="22" alt="" src="data:image/png;base64,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">';   // src/logo.png at 64 px (also the browser tab icon)
const canEdit = () => !isMentor();   // the portfolio data belongs to the apprentice

// Every page that exists for this person (used for routing); the bottom tab bar (21-tabbar.js) shows some of them
// and puts the rest under "More".
function tabsFor() { return tabsAll(); }
// Progressive tabs: a new apprentice sees only Home, Evidence, CPD, Settings and Help. The others appear as soon as
// there is something for them to show (or always, with Settings -> "Show every tab"); the rest stay under "More".
function tabUnlocked(id) {
  if (isMentor() || !P() || P().mode === 'cpd' || (P().settings && P().settings.showAllTabs)) return true;
  const hasEvidence = evidenceItems().length > 0 || Object.values(P().evidence || {}).some((r) => r.maps && r.maps.length);
  switch (id) {
    case 'summary': case 'print': case 'attributes': case 'reports': return hasEvidence || Object.keys(S.prr || {}).length > 0;
    case 'feedback': return feedbackItems().length > 0;
    case 'meetings': return (P().meetings || []).length > 0;
    case 'mentor': return !!S.other || !!S.otherData;
    default: return true;
  }
}
function tabsShown(active) {
  const all = tabsFor();
  const shown = all.filter((t) => tabUnlocked(t[0]) || t[0] === active);
  return { shown, more: all.filter((t) => !shown.includes(t)) };
}
function tabsAll() {
  if (!S.data) return [];
  if (isMentor()) return [['home', 'Home'], ['summary', 'Summary'], ['evidence', 'Evidence'], ['attributes', LABEL.attr], ['reports', 'Reports'], ['feedback', 'Feedback'], ['meetings', 'Meetings'], ['mentor', 'Assessment'], ['cpd', 'CPD'], ['skills', 'Skills'], ['print', 'Print summary'], ['settings', 'Settings'], ['help', 'Help']];
  if (P().mode === 'cpd') return [['cpd', 'CPD'], ['skills', 'Skills'], ['settings', 'Settings'], ['help', 'Help']];
  return [['home', 'Home'], ['summary', 'Summary'], ['evidence', 'Evidence'], ['attributes', LABEL.attr], ['reports', 'Reports'], ['feedback', 'Feedback'], ['meetings', 'Meetings'], ['cpd', 'CPD'], ['skills', 'Skills'], ['mentor', 'Mentor'], ['print', 'Print summary'], ['settings', 'Settings'], ['help', 'Help']];
}
const ACTIVE_TAB = { edit: 'reports', lesson: 'help', framework: 'settings', item: 'evidence', sub: 'attributes', report: 'reports', meeting: 'meetings', ksbs: 'attributes', ksb: 'attributes' };

function renderHeader(active) {
  const who = S.data ? (isMentor() ? `Mentor: ${esc(S.data.name)} · apprentice: ${esc((P() && P().name) || S.data.apprentice || '?')}` : esc(S.data.name)) : '';
  const openFb = S.data && P() ? feedbackItems().filter((f) => f.status === 'open').length : 0;
  $('#top').innerHTML = `<div class="bar">
    <a class="brand" href="#${S.data && P() && P().mode === 'cpd' ? 'cpd' : 'home'}">${LOGO_SVG}Pathway Pro<small>${who}</small></a>
    <div class="top-right">${S.data ? `<button id="tourBtn" class="small" title="A short guided tour of this tool">Show me around</button>
      <button id="undoBtn" class="small" title="Undo the last change (Ctrl+Z)" ${UNDO.stack.length ? '' : 'hidden'}>↶ Undo</button><button id="redoBtn" class="small" title="Redo (Ctrl+Y)" ${UNDO.redo.length ? '' : 'hidden'}>Redo</button>
      <span id="saveState" class="save-state">${S.dirty ? 'Saving…' : isMentor() || S.data.saved ? 'Saved' : ''}</span>` : ''}</div></div>`;
  renderTabbar(active, openFb);
  if (S.demo) demoBanner();
  if (S.data) bindSearch();
  if ($('#undoBtn')) { $('#undoBtn').addEventListener('click', () => undoStep(false)); $('#redoBtn').addEventListener('click', () => undoStep(true)); }
}

function parseHash() {
  const raw = decodeURIComponent(location.hash.slice(1));
  const [path, query] = raw.split('?');
  const i = path.indexOf('/');
  return { name: i < 0 ? path : path.slice(0, i), arg: i < 0 ? '' : path.slice(i + 1), q: new URLSearchParams(query || '') };
}
const go = (hash) => { if (location.hash === hash) render(); else location.hash = hash; };

// Tie each <label> that has no "for" to the form control that follows it, so every field has an accessible name.
let autoLabelId = 0;
function autoLabel(root) {
  for (const l of $$('label:not([for])', root)) {
    if (l.querySelector('input,select,textarea')) continue;
    const next = l.nextElementSibling;
    const ctl = next && (next.matches('input,select,textarea') ? next : next.querySelector('input,select,textarea'));
    if (!ctl || (ctl.id && document.querySelector(`label[for="${ctl.id}"]`))) continue;
    if (!ctl.id) ctl.id = 'auto-' + (++autoLabelId);
    l.setAttribute('for', ctl.id);
  }
  // Any field still without a name takes the heading of the card it sits in (for example the framework text boxes).
  for (const ctl of $$('input:not([type=hidden]):not([type=file]),select,textarea', root)) {
    if (ctl.getAttribute('aria-label') || ctl.getAttribute('aria-labelledby') || ctl.closest('label') || (ctl.id && document.querySelector(`label[for="${ctl.id}"]`))) continue;
    const box = ctl.closest('.card, section');
    const h = box && box.querySelector('h2, h3');
    if (h) ctl.setAttribute('aria-label', h.textContent.trim());
  }
}

async function render() {
  const main = $('#main');
  if (!S.data) return;
  let { name, arg, q } = parseHash();
  const tabs = tabsFor().map((t) => t[0]);
  if (!VIEWS[name] || (!tabs.includes(name) && !tabs.includes(ACTIVE_TAB[name]))) name = tabs[0];
  renderHeader(ACTIVE_TAB[name] || name);
  if (!S.demo) lookIntro();
  const banners = S.warnings.map((w) => `<div class="banner bad">${esc(w)}</div>`).join('');
  if (isMentor() && !P() && !['settings', 'help', 'mentor'].includes(name)) {
    main.innerHTML = banners + `<div class="card"><h1>Link the apprentice's folder</h1><p>Open <a href="#settings">Settings</a> and press <b>Link apprentice’s portfolio folder</b> (or <b>Reconnect</b>) to see their work.</p></div>`;
    return;
  }
  try {
    const html = await VIEWS[name](arg, q);
    if (html !== undefined) { main.innerHTML = banners + html; }
    if (VIEWS[name].after) VIEWS[name].after(arg, q);
    if (typeof dockPageControls === 'function') dockPageControls();
    autoLabel(main);
    if ($('#dock')) autoLabel($('#dock'));
    labelTableCells(main);
  } catch (err) {
    console.error(err);
    main.innerHTML = banners + `<div class="banner bad">This page failed to load: ${esc(err.message)}</div>`;
  }
  const page = tabsFor().find((t) => t[0] === (ACTIVE_TAB[name] || name));
  document.title = `Pathway Pro · ${page ? page[1] : ''}`;
}
window.addEventListener('hashchange', () => { closePreview(); render(); window.scrollTo(0, 0); });

// Keep the form fields in sync with an object: <input data-field="title"> edits obj.title and saves.
function bindFields(root, obj, after) {
  for (const el of $$('[data-field]', root)) {
    const key = el.dataset.field;
    const ev = el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'date' ? 'change' : 'input';
    el.addEventListener(ev, () => {
      obj[key] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? (el.value === '' ? '' : +el.value) : el.value;
      changed();
      if (after) after(key, el);
    });
  }
}
const dis = (editable) => (editable ? '' : ' disabled');

// ---------- links ----------
const subLink = (id) => (SUB[id] ? `<a class="sub-link" href="#sub/${id}" title="${esc(SUB[id].text)}">${id}</a>` : esc(id));
const itemHref = (it) => '#item/' + encodeURIComponent(it.path);
const codeLink = (code) => {
  const it = code && itemByCode(code);
  return it && !it.missing ? `<a href="${itemHref(it)}" data-preview="${esc(it.path)}" title="${esc(it.title)}">${esc(code)}</a>` : `<span class="chip bad" title="not found in the evidence folder">${esc(code)}</span>`;
};
const itemLink = (it) => it.missing ? `<span class="chip bad" title="file missing">${esc(it.code || it.title)}</span>` : `<a href="${itemHref(it)}" data-preview="${esc(it.path)}" title="${esc(it.title)}">${esc(it.code || it.title)}</a>`;
const fileLink = (path, text) => `<a href="#" data-preview="${esc(path)}">${esc(text || path.split('/').pop())}</a>`;
const linkify = (text) => esc(text)
  .replace(/\b([A-Z]{2,3}-\d{2,3})\b/g, (m) => (itemByCode(m) ? codeLink(m) : m))
  .replace(/(^|[\s(,;])([A-Za-z0-9][A-Za-z0-9.\-]{0,11})(?=[\s),.;:]|$)/g, (m, pre, id) => (SUB[id] ? pre + subLink(id) : m));
const chip = (text, cls = '') => `<span class="chip ${cls}">${esc(text)}</span>`;
// Page fact pills under a page title, e.g. facts([['38 files'], ['6 not mapped', 'part']]).
const facts = (list) => `<ul class="facts" aria-label="At a glance">${list.filter(Boolean).map(([t, cls]) => `<li>${chip(t, cls || '')}</li>`).join('')}</ul>`;
const prrChip = (state) => chip(...(PRR_STATE[state] || [state, '']));
const meter = (frac, cls = '') => `<div class="bar-meter ${cls}" title="${Math.round(frac * 100)}%"><span style="width:${Math.round(Math.min(1, frac) * 100)}%"></span></div>`;
function slotsHtml(cell) {
  if (cell._need) {
    const n = distinctNeeded(cell), lv = cell._need[0];
    return `<span class="slots" title="needs ${esc(LEVEL_NAME[lv])} or above: ${n}"><span class="lvl"><b>${esc(LEVEL_SHORT[lv])}+</b>${Array.from({ length: goal() }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span></span>`;
  }
  return `<span class="slots" title="${LEVELS.map((l) => `${l}: ${cell[l].length}`).join(', ')}">${LEVELS.map((l) =>
    `<span class="lvl"><b>${LEVEL_SHORT[l]}</b>${Array.from({ length: goal() }, (_, n) => `<i class="${n < cell[l].length ? 'on' : ''}"></i>`).join('')}</span>`).join('')}</span>`;
}

// ---------- preview panel ----------
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-preview]');
  if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  openPreview(a.dataset.preview);
});

let previewUrl = null;
async function previewHtml(path) {
  if (S.demo) return demoPreviewHtml(path);
  const file = await getFile(path);
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  const ext = (path.split('.').pop() || '').toLowerCase();
  if (['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'txt', 'md', 'csv', 'htm', 'html', 'mp4', 'webm', 'mp3', 'm4a', 'wav'].includes(ext)) {
    const type = { pdf: 'application/pdf', svg: 'image/svg+xml', txt: 'text/plain;charset=utf-8', md: 'text/plain;charset=utf-8', csv: 'text/plain;charset=utf-8', htm: 'text/plain;charset=utf-8', html: 'text/plain;charset=utf-8' }[ext] || file.type;
    previewUrl = URL.createObjectURL(new Blob([file], { type }));
    if (/^(png|jpe?g|gif|webp|bmp|svg)$/.test(ext)) return `<img class="preview" src="${previewUrl}" alt="">`;
    if (/^(mp4|webm)$/.test(ext)) return `<video class="preview" src="${previewUrl}" controls></video>`;
    if (/^(mp3|m4a|wav)$/.test(ext)) return `<audio src="${previewUrl}" controls style="margin:20px"></audio>`;
    return `<iframe class="preview" src="${previewUrl}" title="preview"></iframe>`;
  }
  if (ext === 'docx') return `<div class="docx-view">${await docxPreviewHtml(await file.arrayBuffer())}</div>`;
  if (ext === 'vtt') return `<pre class="text-view">${esc(await file.text())}</pre>`;
  return `<div class="empty" style="margin:20px">This type of file (.${esc(ext)}, ${fmtSize(file.size)}) cannot be shown here.<br>Open it from your OneDrive folder:<br><code>${esc(path)}</code></div>`;
}

async function openPreview(path) {
  let d = $('#drawer');
  if (!d) {
    document.body.insertAdjacentHTML('beforeend', `<aside id="drawer" hidden aria-label="Preview"><div class="drawer-grip" title="Drag to resize"></div>
      <header><div id="drawerTitle"></div><button id="drawerClose" title="Close (Esc)">✕</button></header><div id="drawerBody"></div></aside>`);
    d = $('#drawer');
    $('#drawerClose').addEventListener('click', closePreview);
    const grip = d.querySelector('.drawer-grip');
    grip.addEventListener('pointerdown', (e) => {
      grip.setPointerCapture(e.pointerId);
      const move = (ev) => { d.style.width = Math.min(Math.max(window.innerWidth - ev.clientX, 320), window.innerWidth * 0.95) + 'px'; };
      grip.addEventListener('pointermove', move);
      grip.addEventListener('pointerup', () => { grip.removeEventListener('pointermove', move); try { localStorage.setItem('drawerWidth', d.style.width); } catch (_) {} }, { once: true });
    });
    try { const w = localStorage.getItem('drawerWidth'); if (w) d.style.width = w; } catch (_) {}
  }
  d.hidden = false;
  const it = evidenceItems().find((i) => i.path === path);
  $('#drawerTitle').innerHTML = `<b>${esc(it && it.code ? it.code + ' · ' : '')}${esc(path.split('/').pop())}</b><div class="small muted">${esc(path)}</div>
    ${it ? `<div class="small">${(it.rec && it.rec.maps || []).map((m) => chip(m.sub + ' ' + LEVEL_SHORT[m.level], 'accent')).join('') || '<span class="muted">not mapped yet</span>'}
      · <a href="${itemHref(it)}">Open evidence page</a></div>` : ''}`;
  $('#drawerBody').innerHTML = '<p class="muted" style="padding:16px">Loading…</p>';
  try { $('#drawerBody').innerHTML = await previewHtml(path); } catch (err) { $('#drawerBody').innerHTML = `<p class="bad" style="padding:16px">${esc(err.message)}</p>`; }
}
function closePreview() { const d = $('#drawer'); if (d) d.hidden = true; }

// ---------- search (Ctrl+K) ----------
function searchIndex() {
  const out = [];
  if (P() && P().mode !== 'cpd') {
    for (const it of evidenceItems()) out.push({ kind: 'Evidence', text: `${it.code} ${it.title} ${it.path} ${(it.rec && it.rec.notes) || ''} ${(it.rec && it.rec.tags) || ''}`, label: `${it.code ? it.code + ' · ' : ''}${it.title}`, href: itemHref(it) });
    for (const a of SUBS) out.push({ kind: cap1(LABEL.item), text: `${a.id} ${a.text} ${a.group_title}`, label: `${a.id} · ${a.text}`, href: '#sub/' + a.id });
    for (const k of KSBS) out.push({ kind: 'KSB', text: `${k.id} ${k.text}`, label: `${k.id} · ${k.text}`, href: '#ksbs?k=' + k.id });
    for (const f of feedbackItems()) out.push({ kind: 'Comment', text: `${f.author} ${f.text} ${f.anchor} ${f.response}`, label: `${f.sub || ''} ${f.author}: ${f.text}`, href: '#feedback?key=' + f.key });
    for (const m of P().meetings) {
      out.push({ kind: 'Meeting', text: `${m.date} ${m.title}`, label: `${fmtDate(m.date)} · ${m.title}`, href: '#meeting/' + m.id });
      for (const i of m.items) out.push({ kind: ITEM_KINDS[i.kind], text: i.text, label: i.text, href: '#meeting/' + m.id });
    }
  }
  if (P()) {
    for (const a of P().cpd.activities) out.push({ kind: 'CPD', text: `${a.details} ${a.learning} ${a.ref}`, label: `${a.dateFrom || ''} · ${a.details}`, href: '#cpd/activity/' + a.id });
    for (const s of P().skills.skills) out.push({ kind: 'Skill', text: `${s.title} ${s.notes}`, label: s.title, href: '#skills/' + s.id });
    for (const o of P().cpd.objectives) out.push({ kind: 'Objective', text: `${o.ref} ${o.title} ${o.area}`, label: `${o.ref} · ${o.title || o.area}`, href: '#cpd/plan' });
  }
  return out;
}
function bindSearch() {
  const input = $('#search');
  const box = $('#searchResults');
  let hits = [];
  let sel = 0;
  const show = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { box.hidden = true; return; }
    const terms = q.split(/\s+/);
    hits = searchIndex().filter((h) => terms.every((t) => h.text.toLowerCase().includes(t))).slice(0, 30);
    sel = 0;
    box.innerHTML = hits.length ? hits.map((h, i) => `<a href="${h.href}" class="${i === sel ? 'sel' : ''}"><span class="kind">${esc(h.kind)}</span>${esc(h.label.slice(0, 140))}</a>`).join('') : '<div class="muted" style="padding:.6rem">Nothing found</div>';
    box.hidden = false;
  };
  input.addEventListener('input', show);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % Math.max(1, hits.length);
      $$('a', box).forEach((a, i) => a.classList.toggle('sel', i === sel));
    } else if (e.key === 'Enter' && hits[sel]) { location.hash = hits[sel].href; box.hidden = true; input.blur(); }
    else if (e.key === 'Escape') { box.hidden = true; input.blur(); }
  });
  input.addEventListener('blur', () => setTimeout(() => { box.hidden = true; }, 200));
}
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && $('#search')) { e.preventDefault(); $('#search').focus(); $('#search').select(); }
  if (e.key === 'Escape') closePreview();
  // Ctrl+Z / Ctrl+Y undo and redo changes to the portfolio, except while typing in a field (the field keeps its own undo).
  if ((e.ctrlKey || e.metaKey) && !e.altKey && S.data && !(e.target.closest && e.target.closest('input,textarea,select,[contenteditable],dialog'))) {
    const k = e.key.toLowerCase();
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); undoStep(false); }
    else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); undoStep(true); }
  }
});

// ---------- dialogs ----------
function dialog(html, onOpen) {
  const d = document.createElement('dialog');
  d.innerHTML = html;
  document.body.append(d);
  d.addEventListener('close', () => d.remove());
  // Remove at once on close: the close event can arrive late, leaving a stale dialog in the page.
  const close = d.close.bind(d);
  d.close = (v) => { close(v); d.remove(); };
  d.showModal();
  if (onOpen) onOpen(d);
  return d;
}
function ask(question, okLabel = 'OK') {
  return new Promise((resolve) => {
    const d = dialog(`<p>${question}</p><div class="row" style="justify-content:flex-end;margin-top:1rem"><button value="no">Cancel</button><button class="primary" value="yes">${esc(okLabel)}</button></div>`);
    $$('button', d).forEach((b) => b.addEventListener('click', () => { resolve(b.value === 'yes'); d.close(); }));
    d.addEventListener('cancel', () => resolve(false));
  });
}

function showConflict() {
  const d = dialog(`<h2>Changed somewhere else</h2>
    <p>Your data file was changed after this page loaded, probably on another computer through OneDrive.</p>
    <p><b>Load the newer file</b> (recommended) loses only the changes made on this page in the last few seconds.
    <b>Keep mine</b> overwrites the newer file with this page's copy (yesterday's backup is in <code>ice-data/backups</code>).</p>
    <div class="row" style="justify-content:flex-end;margin-top:1rem"><button id="cKeep">Keep mine</button><button class="primary" id="cLoad">Load the newer file</button></div>`);
  $('#cLoad', d).addEventListener('click', async () => { d.close(); await loadOwn(); S.dirty = false; await render(); toast('Loaded the newer file'); });
  $('#cKeep', d).addEventListener('click', async () => { d.close(); await save(true); });
}

// ---------- start-up ----------
async function start() {
  if (!supported()) {
    $('#main').innerHTML = `<div class="welcome card"><h1>Please open this in Microsoft Edge or Google Chrome</h1>
      <p>The Pathway Pro keeps your files in a folder on your computer (your OneDrive folder). Only Edge and Chrome on a computer let a page do that.</p>
      <p class="muted">Right-click <b>Pathway Pro.html</b> → <b>Open with</b> → <b>Microsoft Edge</b>.</p></div>`;
    return;
  }
  // If reading the folder stalls (for example OneDrive is still syncing), say so instead of showing "Loading…" for ever.
  const stalled = setTimeout(() => {
    if (S.data) return;
    $('#main').innerHTML = `<div class="welcome card"><h1>Still opening your folder…</h1>
      <p>This is taking longer than usual. OneDrive may still be syncing, or Edge may be waiting for your permission.</p>
      <div class="row"><button class="primary" id="stallReload">Try again</button><button id="stallForget">Use a different folder</button></div></div>`;
    $('#stallReload').addEventListener('click', () => location.reload());
    $('#stallForget').addEventListener('click', async () => { try { await remember('own', null); await remember('other', null); } catch (_) {} location.reload(); });
  }, 10000);
  try {
    S.own = await recall('own');
    S.other = await recall('other');
    if (!S.own) return welcome();
    if (!(await permission(S.own, 'readwrite', false))) return reconnect();
    await openAll();
  } catch (err) {
    console.error(err);
    $('#main').innerHTML = `<div class="welcome card"><h1>Could not open your folder</h1><p>${esc(err.message)}</p>
      <p class="muted">Check that the folder still exists and OneDrive has finished syncing, then try again.</p>
      <div class="row"><button class="primary" id="errReload">Try again</button></div></div>`;
    $('#errReload').addEventListener('click', () => location.reload());
  } finally { clearTimeout(stalled); }
}

async function openAll() {
  S.warnings = [];
  if (!(await loadOwn())) return welcome(`The folder "${esc(S.own.name)}" has no Pathway Pro data yet.`);
  await loadOther();
  FOLDER_MAP = (P() && P().folderMap) || null;
  applyFramework(P() && P().framework);
  if (canEdit() && P()) {   // folders the person made themselves, or renamed since: use them rather than empty copies
    const adopted = await adoptFolders(S.own, P().mode);
    if (adopted.length) { changed(); await save(); S.warnings.push(`Using your own folders: ${adopted.join('; ')}. Any empty folders the tool made earlier can be deleted.`); }
  }
  if (isMentor() && !S.other) S.warnings.push('Link the apprentice\'s portfolio folder in Settings to see their work.');
  if (isMentor() && S.other && !S.otherData) S.warnings.push('The apprentice\'s folder needs permission again: open Settings and press Reconnect.');
  const copies = await conflictCopies();
  if (copies.length) S.warnings.push(`OneDrive made conflict copies of the data file (${copies.join(', ')}). The tool uses the main file; check whether anything in a copy is missing, then delete the copy.`);
  await scanEvidence();
  await loadReports();
  undoReset();
  if (!location.hash) location.hash = P() && P().mode === 'cpd' ? '#cpd' : '#home';
  await render();
}

function reconnect() {
  renderHeader('');
  $('#main').innerHTML = `<div class="welcome card"><h1>Welcome back</h1>
    <p>Edge needs your permission again to use the folder <b>${esc(S.own.name)}</b>${S.other ? ` and the linked folder <b>${esc(S.other.name)}</b>` : ''}.</p>
    <div class="row" style="margin-top:1rem"><button class="primary" id="reconnect">Continue</button><button id="forget">Use a different folder</button></div></div>`;
  $('#reconnect').addEventListener('click', async () => {
    if (!(await permission(S.own, 'readwrite', true))) return toast('Permission was not given', 'error');
    if (S.other) await permission(S.other, 'read', true);
    await openAll();
  });
  $('#forget').addEventListener('click', async () => { await remember('own', null); await remember('other', null); S.own = S.other = null; welcome(); });
}

function welcome(note = '') {
  renderHeader('');
  $('#main').innerHTML = `<div class="welcome">
    <h1>Pathway Pro</h1>
    <p>A tracker for a professional review or apprenticeship portfolio: evidence mapped to the attributes or requirements of your own framework (ICE IEng is built in; you can edit it or write your own for any institution or level),
    checks on your Word reports, your mentor's comments, meeting notes and CPD. No AI, no internet, no install: everything stays in your OneDrive folder.</p>
    ${note ? `<div class="banner">${note}</div>` : ''}
    <div class="card start-main"><h2>Start here</h2>
      <p>Pick (or make) an empty folder in your OneDrive, for example <i>Portfolio - Your Name</i>. The tool sets up the folders for your evidence, reports, meetings and CPD inside it. It takes about a minute.</p>
      <button class="primary big" id="wNew">Start my portfolio</button></div>
    <p class="start-other"><b>Already use it, or a different job?</b>
      <button id="wOpen" title="You already use the tool: pick your portfolio or mentoring folder">Open my folder</button>
      <button id="wMentor" title="Pick an empty folder of your own for your assessments, then the apprentice's shared folder">I am a mentor</button>
      <button id="wCpd" title="Just the ICE Development Action Plan and Personal Development Record, without the Professional Review parts">CPD record only</button>
      <button id="wDemo" title="See the tool filled in with made-up data. Nothing is saved and no folder is needed">Look around with sample data</button></p>
    <div class="card"><h2>New to this?</h2><p>You do not need to know how to organise your evidence first. See how the folders are laid out and what goes where, then follow a worked example.</p>
      <div class="row"><button id="wLesson" class="primary">Lesson 1: set up your portfolio</button><button id="wFolders">Suggested folder layout</button><button id="wSteps">Example: empty folder to finished portfolio</button></div></div>
    <p class="small muted">Your files never leave your computer and OneDrive. Edge will ask to let this page see and save files in the folder you pick.</p>
    ${lookQuickHtml()}</div>`;
  $('#wNew').addEventListener('click', () => setupPortfolio('ice'));
  $('#wCpd').addEventListener('click', () => setupPortfolio('cpd'));
  $('#wOpen').addEventListener('click', async () => {
    try { S.own = await pickFolder('own', 'readwrite'); } catch (_) { return; }
    await remember('own', S.own);
    await openAll();
  });
  $('#wMentor').addEventListener('click', setupMentor);
  $('#wDemo').addEventListener('click', startDemo);
  $('#wLesson').addEventListener('click', () => lessonDialog(1));
  $('#wFolders').addEventListener('click', () => showGuide('folders'));
  $('#wSteps').addEventListener('click', () => showGuide('steps'));
}

function askText(title, labelText, value = '', help = '') {
  return new Promise((resolve) => {
    const d = dialog(`<h2>${title}</h2>${help ? `<p class="muted small">${help}</p>` : ''}<label for="askInput">${labelText}</label><input id="askInput" style="width:100%" value="${esc(value)}">
      <div class="row" style="justify-content:flex-end;margin-top:1rem"><button value="">Cancel</button><button class="primary" value="ok">OK</button></div>`);
    const input = $('#askInput', d);
    input.focus();
    const done = (ok) => { resolve(ok ? input.value.trim() : null); d.close(); };
    $$('button', d).forEach((b) => b.addEventListener('click', () => done(b.value === 'ok')));
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(true); });
    d.addEventListener('cancel', () => resolve(null));
  });
}

async function setupPortfolio(mode) {
  let dir;
  try { dir = await pickFolder('own', 'readwrite'); } catch (_) { return; }
  S.own = dir;
  if (await loadOwn()) { await remember('own', dir); return openAll(); }
  const name = await askText('Your name', 'Your full name', '', 'Shown on exports and to your mentor.');
  if (!name) return;
  S.data = newPortfolio(name, mode);
  if (mode !== 'cpd') {
    const key = await choosePreset();
    if (!key) { S.data = null; return; }
    S.data.framework = key === 'ice' ? null : clone(PRESETS[key].fw);
    if (PRESETS[key].fw.goal) S.data.settings.goal = PRESETS[key].fw.goal;
  }
  FOLDER_MAP = null;
  applyFramework(S.data.framework);
  await ensureFolders(dir, mode);
  await subDir(dir, DATA_DIR, true);
  await save(true);
  await remember('own', dir);
  toast(`Set up in "${dir.name}"`);
  location.hash = mode === 'cpd' ? '#cpd' : '#home';
  await openAll();
}

async function setupMentor() {
  let dir;
  try { dir = await pickFolder('own', 'readwrite'); } catch (_) { return; }
  S.own = dir;
  if (await loadOwn()) { await remember('own', dir); return openAll(); }
  const name = await askText('Your name', 'Your name (the mentor)');
  if (!name) return;
  toast('Now pick the apprentice\'s shared portfolio folder');
  let other;
  try { other = await pickFolder('other', 'read'); } catch (_) { return; }
  let apprentice = '';
  try { apprentice = (await readJson(other, `${DATA_DIR}/${FILES.apprentice}`)).json.name; } catch (_) {
    toast('That folder has no ICE portfolio (ice-data/portfolio.json). Pick the apprentice\'s folder.', 'error');
    return;
  }
  S.data = newMentor(name, apprentice);
  await subDir(dir, DATA_DIR, true);
  await save(true);
  S.other = other;
  await remember('own', dir);
  await remember('other', other);
  await openAll();
}

// "Skip to content" for keyboard and screen-reader users (a plain #main link would change the page route).
document.addEventListener('click', (e) => {
  if (!e.target.closest('#skipLink')) return;
  e.preventDefault();
  const m = $('#main');
  m.setAttribute('tabindex', '-1');
  m.focus();
});

// Anything unexpected is shown, never a page stuck on "Loading…".
window.addEventListener('error', (e) => toast('Something went wrong: ' + e.message, 'error'));
window.addEventListener('unhandledrejection', (e) => toast('Something went wrong: ' + ((e.reason && e.reason.message) || e.reason), 'error'));
document.addEventListener('DOMContentLoaded', () => start().catch((err) => {
  $('#main').innerHTML = `<div class="welcome card"><h1>The Pathway Pro could not start</h1><p class="bad">${esc(err.message || err)}</p><p>Try opening it in Microsoft Edge or Google Chrome.</p></div>`;
}));
