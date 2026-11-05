// The app shell: top bar and tabs, routing, the preview panel, search, and the first-run screens.

const VIEWS = {};      // name -> function(arg, query) that renders into #main
const canEdit = () => !isMentor();   // the portfolio data belongs to the apprentice

function tabsFor() { return tabsAll().filter((t) => t[0] !== 'ksbs' || KSBS.length); }
function tabsAll() {
  if (!S.data) return [];
  if (isMentor()) return [['home', 'Home'], ['evidence', 'Evidence'], ['attributes', LABEL.attr], ['ksbs', LABEL.ksb], ['reports', 'Reports'], ['feedback', 'Feedback'], ['meetings', 'Meetings'], ['mentor', 'Assessment'], ['cpd', 'CPD'], ['settings', 'Settings'], ['help', 'Help']];
  if (P().mode === 'cpd') return [['cpd', 'CPD'], ['settings', 'Settings'], ['help', 'Help']];
  return [['home', 'Home'], ['evidence', 'Evidence'], ['attributes', LABEL.attr], ['ksbs', LABEL.ksb], ['reports', 'Reports'], ['feedback', 'Feedback'], ['meetings', 'Meetings'], ['cpd', 'CPD'], ['mentor', 'Mentor'], ['settings', 'Settings'], ['help', 'Help']];
}
const ACTIVE_TAB = { framework: 'settings', item: 'evidence', sub: 'attributes', report: 'reports', meeting: 'meetings', ksb: 'ksbs' };

function renderHeader(active) {
  const who = S.data ? (isMentor() ? `Mentor: ${esc(S.data.name)} · apprentice: ${esc((P() && P().name) || S.data.apprentice || '?')}` : esc(S.data.name)) : '';
  const openFb = S.data && P() ? feedbackItems().filter((f) => f.status === 'open').length : 0;
  $('#top').innerHTML = `<div class="bar">
    <a class="brand" href="#${S.data && P() && P().mode === 'cpd' ? 'cpd' : 'home'}">Portfolio Tool<small>${who}</small></a>
    <nav class="tabs">${tabsFor().map(([id, name]) => `<a href="#${id}" class="${active === id ? 'active' : ''}"${active === id ? ' aria-current="page"' : ''}>${name}${
      id === 'feedback' && openFb ? `<span class="count" title="open comments">${openFb}</span>` : ''}</a>`).join('')}</nav>
    <div class="top-right">${S.data ? `<div class="search-wrap"><input id="search" type="search" placeholder="Search (Ctrl+K)" autocomplete="off"><div id="searchResults" hidden></div></div>
      <span id="saveState" class="save-state">${S.dirty ? 'Saving…' : isMentor() || S.data.saved ? 'Saved' : ''}</span>` : ''}</div></div>`;
  if (S.data) bindSearch();
}

function parseHash() {
  const raw = decodeURIComponent(location.hash.slice(1));
  const [path, query] = raw.split('?');
  const i = path.indexOf('/');
  return { name: i < 0 ? path : path.slice(0, i), arg: i < 0 ? '' : path.slice(i + 1), q: new URLSearchParams(query || '') };
}
const go = (hash) => { if (location.hash === hash) render(); else location.hash = hash; };

async function render() {
  const main = $('#main');
  if (!S.data) return;
  let { name, arg, q } = parseHash();
  const tabs = tabsFor().map((t) => t[0]);
  if (!VIEWS[name] || (!tabs.includes(name) && !tabs.includes(ACTIVE_TAB[name]))) name = tabs[0];
  renderHeader(ACTIVE_TAB[name] || name);
  const banners = S.warnings.map((w) => `<div class="banner bad">${esc(w)}</div>`).join('');
  if (isMentor() && !P() && !['settings', 'help', 'mentor'].includes(name)) {
    main.innerHTML = banners + `<div class="card"><h1>Link the apprentice's folder</h1><p>Open <a href="#settings">Settings</a> and press <b>Link apprentice’s portfolio folder</b> (or <b>Reconnect</b>) to see their work.</p></div>`;
    return;
  }
  try {
    const html = await VIEWS[name](arg, q);
    if (html !== undefined) { main.innerHTML = banners + html; }
    if (VIEWS[name].after) VIEWS[name].after(arg, q);
  } catch (err) {
    console.error(err);
    main.innerHTML = banners + `<div class="banner bad">This page failed to load: ${esc(err.message)}</div>`;
  }
  document.title = `Portfolio Tool · ${$('nav.tabs a.active') ? $('nav.tabs a.active').firstChild.textContent : ''}`;
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
  .replace(/(^|[\s(,;])([1-9][a-e])(?=[\s),.;:]|$)/g, (m, pre, id) => pre + subLink(id));
const chip = (text, cls = '') => `<span class="chip ${cls}">${esc(text)}</span>`;
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
    for (const it of evidenceItems()) out.push({ kind: 'Evidence', text: `${it.code} ${it.title} ${it.path} ${(it.rec && it.rec.notes) || ''}`, label: `${it.code ? it.code + ' · ' : ''}${it.title}`, href: itemHref(it) });
    for (const a of SUBS) out.push({ kind: 'Sub-attr.', text: `${a.id} ${a.text} ${a.group_title}`, label: `${a.id} · ${a.text}`, href: '#sub/' + a.id });
    for (const k of KSBS) out.push({ kind: 'KSB', text: `${k.id} ${k.text}`, label: `${k.id} · ${k.text}`, href: '#ksbs?k=' + k.id });
    for (const f of feedbackItems()) out.push({ kind: 'Comment', text: `${f.author} ${f.text} ${f.anchor} ${f.response}`, label: `${f.sub || ''} ${f.author}: ${f.text}`, href: '#feedback?key=' + f.key });
    for (const m of P().meetings) {
      out.push({ kind: 'Meeting', text: `${m.date} ${m.title}`, label: `${fmtDate(m.date)} · ${m.title}`, href: '#meeting/' + m.id });
      for (const i of m.items) out.push({ kind: ITEM_KINDS[i.kind], text: i.text, label: i.text, href: '#meeting/' + m.id });
    }
  }
  if (P()) {
    for (const a of P().cpd.activities) out.push({ kind: 'CPD', text: `${a.details} ${a.learning} ${a.ref}`, label: `${a.dateFrom || ''} · ${a.details}`, href: '#cpd/activity/' + a.id });
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
      <p>The Portfolio Tool keeps your files in a folder on your computer (your OneDrive folder). Only Edge and Chrome on a computer let a page do that.</p>
      <p class="muted">Right-click <b>Portfolio Tool.html</b> → <b>Open with</b> → <b>Microsoft Edge</b>.</p></div>`;
    return;
  }
  S.own = await recall('own');
  S.other = await recall('other');
  if (!S.own) return welcome();
  if (!(await permission(S.own, 'readwrite', false))) return reconnect();
  await openAll();
}

async function openAll() {
  S.warnings = [];
  if (!(await loadOwn())) return welcome(`The folder "${esc(S.own.name)}" has no Portfolio Tool data yet.`);
  await loadOther();
  applyFramework(P() && P().framework);
  if (isMentor() && !S.other) S.warnings.push('Link the apprentice\'s portfolio folder in Settings to see their work.');
  if (isMentor() && S.other && !S.otherData) S.warnings.push('The apprentice\'s folder needs permission again: open Settings and press Reconnect.');
  const copies = await conflictCopies();
  if (copies.length) S.warnings.push(`OneDrive made conflict copies of the data file (${copies.join(', ')}). The tool uses the main file; check whether anything in a copy is missing, then delete the copy.`);
  await scanEvidence();
  await loadReports();
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
    <h1>Portfolio Tool</h1>
    <p>A tracker for a professional review or apprenticeship portfolio: evidence mapped to the attributes or requirements of your own framework (ICE IEng is built in; you can edit it or write your own for any institution or level),
    checks on your Word reports, your mentor's comments, meeting notes and CPD. No AI, no internet, no install: everything stays in your OneDrive folder.</p>
    ${note ? `<div class="banner">${note}</div>` : ''}
    <div class="choices">
      <button class="choice card" id="wNew"><b>Start my portfolio</b><span class="muted">Pick (or make) an empty folder in your OneDrive, e.g. <i>ICE Portfolio - Your Name</i>. The tool creates the Evidence, PRR, Meetings and CPD folders in it.</span></button>
      <button class="choice card" id="wOpen"><b>Open my folder</b><span class="muted">You already use the tool: pick your portfolio or mentoring folder.</span></button>
      <button class="choice card" id="wMentor"><b>I am a mentor</b><span class="muted">Pick an empty folder of your own for your assessments, then the apprentice's shared folder.</span></button>
      <button class="choice card" id="wCpd"><b>CPD record only</b><span class="muted">Just the ICE Development Action Plan and Personal Development Record, without the Professional Review parts.</span></button>
    </div>
    <p class="small muted">Your files never leave your computer and OneDrive. Edge will ask to let this page see and save files in the folder you pick.</p></div>`;
  $('#wNew').addEventListener('click', () => setupPortfolio('ice'));
  $('#wCpd').addEventListener('click', () => setupPortfolio('cpd'));
  $('#wOpen').addEventListener('click', async () => {
    try { S.own = await pickFolder('own', 'readwrite'); } catch (_) { return; }
    await remember('own', S.own);
    await openAll();
  });
  $('#wMentor').addEventListener('click', setupMentor);
}

function askText(title, labelText, value = '', help = '') {
  return new Promise((resolve) => {
    const d = dialog(`<h2>${title}</h2>${help ? `<p class="muted small">${help}</p>` : ''}<label>${labelText}</label><input id="askInput" style="width:100%" value="${esc(value)}">
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
  const name = await askText('Your name', 'Name (as on your ICE application)', '', 'Shown on exports and to your mentor.');
  if (!name) return;
  S.data = newPortfolio(name, mode);
  if (mode !== 'cpd') {
    const key = await choosePreset();
    if (!key) { S.data = null; return; }
    S.data.framework = key === 'ice' ? null : clone(PRESETS[key].fw);
    if (PRESETS[key].fw.goal) S.data.settings.goal = PRESETS[key].fw.goal;
  }
  applyFramework(S.data.framework);
  await ensureFolders(dir, mode);
  await subDir(dir, DATA_DIR, true);
  await save(true);
  await remember('own', dir);
  toast(`Set up in "${dir.name}"`);
  location.hash = mode === 'cpd' ? '#cpd' : '#help';
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

// Anything unexpected is shown, never a page stuck on "Loading…".
window.addEventListener('error', (e) => toast('Something went wrong: ' + e.message, 'error'));
window.addEventListener('unhandledrejection', (e) => toast('Something went wrong: ' + ((e.reason && e.reason.message) || e.reason), 'error'));
document.addEventListener('DOMContentLoaded', () => start().catch((err) => {
  $('#main').innerHTML = `<div class="welcome card"><h1>The Portfolio Tool could not start</h1><p class="bad">${esc(err.message || err)}</p><p>Try opening it in Microsoft Edge or Google Chrome.</p></div>`;
}));
