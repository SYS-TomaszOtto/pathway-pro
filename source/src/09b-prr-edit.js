// Writing a PRR inside Pathway Pro (like the server copy's editor, Nov 2026). The report is a plain-text file in the
// Reports folder, "PRR - Attribute 2.md": "# title", "## 2b – heading", "Evidence: CO-14, CA-00 to CA-18", "{CO-14} text".
// It is read by the same parser as the Word reports. When a Word file covers the same sections, the in-app report is the
// one that counts; the Word file is kept for its comments (Make Word saves a dated copy for the mentor to comment on).
// Earlier versions: ice-data/prr-history/<group>/<time>.md, at most one every 10 minutes plus every manual save, last 30.

const notePath = (g) => `${FOLDERS.prr}/PRR - Attribute ${g}.md`;
const noteGroup = (path) => (/PRR - Attribute (.+)\.md$/.exec(path) || [])[1];
const NOTE_MEM = {};          // sample data: path -> text (never written)
const NOTE_HIST_MEM = {};     // sample data: group -> [{name, text}]
let ED = null;                // the open editor: {group, path, saved, mtime, origin, lastHist}

// One paragraph per non-empty line; "#" lines are headings.
const noteParas = (text) => String(text).split('\n').map((l) => l.trim()).filter(Boolean)
  .map((l) => { const h = /^(#{1,3})\s+(.*)$/.exec(l); return h ? { text: h[2], style: h[1].length === 1 ? 'Title' : 'Heading' + (h[1].length - 1) } : { text: l.replace(/\*\*|__/g, ''), style: '' }; });
const noteDoc = (path, text, mtime) => ({ path, name: path.split('/').pop(), mtime, doc: parsePrr(noteParas(text)), comments: [], edits: [], error: null, kind: 'note' });

async function readNote(path) {
  if (S.demo) return path in NOTE_MEM ? { text: NOTE_MEM[path], mtime: 0 } : null;
  try { const f = await getFile(path, isMentor() ? 'other' : 'own'); return { text: await f.text(), mtime: f.lastModified }; } catch (_) { return null; }
}

// A starting text: the Word draft for this attribute converted, or headings with the mapped evidence.
async function noteStart(g) {
  const grp = GROUPS.find((x) => String(x.group) === String(g));
  const subs = SUBS.filter((a) => String(a.group) === String(g));
  const word = Object.values(S.prr).find((r) => r.kind !== 'note' && r.doc.sections.some((s) => subs.some((a) => a.id === s.id)));
  if (word && !S.demo) {
    try {
      const parsed = await parseDocx(await (await getFile(word.path)).arrayBuffer());
      const lines = parsed.paragraphs.filter((p) => p.text).map((p) => {
        const h = HEADING_RE.exec(p.text);
        if (h && subIdFromHeading(h[1]) && (/^heading/i.test(p.style) || p.text.length < 250)) return '\n## ' + p.text;
        return /^title$/i.test(p.style) ? '# ' + p.text : p.text + '\n';
      });
      return { text: lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n', origin: word.name };
    } catch (_) { /* fall back to the template */ }
  }
  const cov = coverage();
  const parts = [`# Attribute ${g} – ${grp ? grp.title : ''}`];
  for (const a of subs) {
    const codes = [...new Set(LEVELS.flatMap((l) => cov[a.id][l].map((i) => i.code)).filter(Boolean))].sort(natural);
    parts.push(`## ${a.id} – ${a.text}`, `Evidence: ${codes.join(', ')}`, ...(codes.length ? codes.map((c) => `{${c}} …`) : ['…']));
  }
  return { text: parts.join('\n\n') + '\n', origin: '' };
}

const mdInline = (s) => linkify(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>')
  .replace(/\{\s*(<a [^>]*>[A-Z]{2,3}-\d{2,3}<\/a>|<span [^>]*>[A-Z]{2,3}-\d{2,3}<\/span>|[A-Z]{2,3}-\d{2,3})\s*\}/g, '<span class="ed-tag">$1</span>');
function notePreview(text) {
  return String(text).split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const h = /^(#{1,3})\s+(.*)$/.exec(l);
    if (h) return `<h${h[1].length + 1}>${mdInline(h[2])}</h${h[1].length + 1}>`;
    const e = EVIDENCE_RE.exec(l);
    return e ? `<p class="ed-evline"><b>Evidence:</b> ${mdInline(e[1])}</p>` : `<p>${mdInline(l)}</p>`;
  }).join('');
}

VIEWS.edit = async (arg) => {
  await scanEvidence();
  await loadReports();
  const g = GROUPS.some((x) => String(x.group) === arg) ? arg : String((GROUPS[0] || {}).group);
  const grp = GROUPS.find((x) => String(x.group) === g) || { title: '' };
  const path = notePath(g);
  const found = await readNote(path);
  let text, origin = 'note', from = '';
  if (found) text = found.text;
  else if (!canEdit()) return `<a href="#reports">← Reports</a><h1>PRR · Attribute ${esc(g)}</h1><p class="muted">Not written in Pathway Pro yet.</p>`;
  else { const st = await noteStart(g); text = st.text; from = st.origin; origin = from ? 'word' : 'new'; }
  ED = { group: g, path, saved: found ? text : '', mtime: found ? found.mtime : 0, origin, from, lastHist: 0 };
  const ed = canEdit();
  return `<a href="#reports">← Reports</a>
    <div class="row spread"><h1>PRR · Attribute ${esc(g)} <span class="small muted">${esc(grp.title)}</span></h1><span class="save-state" id="edState">${origin === 'note' ? 'Saved' : 'Not saved yet'}</span></div>
    <div class="row ed-groups" aria-label="Attribute">${GROUPS.map((x) => `<a class="btn small${String(x.group) === g ? ' on' : ''}" href="#edit/${esc(x.group)}"${String(x.group) === g ? ' aria-current="page"' : ''}>${esc(x.group)}</a>`).join('')}</div>
    <div class="row" data-dock>${ed ? '<button type="button" class="primary" id="edSave" title="Ctrl+S">Save</button><button type="button" id="edTag" title="Type { or a code like CO- to get suggestions">Insert evidence…</button><button type="button" id="edEvLine">Evidence line</button><button type="button" id="edWord" title="Save a dated Word copy for your mentor to comment on">Make Word</button>' : ''}
      <button type="button" id="edPrint">Print / PDF</button><button type="button" id="edHist">History</button></div>
    ${origin === 'word' ? `<div class="banner">Converted from your Word draft (${esc(ED.from)}). It becomes a report in Pathway Pro when you press <b>Save</b>; the Word file is left as it is.</div>`
      : origin === 'new' ? '<div class="banner">A new report with a heading for each requirement and the evidence you have mapped. It is created when you press <b>Save</b>.</div>' : ''}
    <div class="ed-grid">
      <div class="ed-src"><textarea id="edSrc" spellcheck="true" aria-label="Report text"${ed ? '' : ' readonly'}>${esc(text)}</textarea><div id="edSuggest" class="ed-suggest" role="listbox" aria-label="Evidence codes" hidden></div></div>
      <div class="card ed-side" id="edSide" aria-live="polite"></div>
      <div class="card prr-doc" id="edPreview" aria-label="Preview"></div>
    </div>
    <p class="small muted"><code>## 2b – heading</code> starts a section, <code>Evidence: CO-14, CA-00 to CA-18</code> lists its evidence, <code>{CO-14}</code> starts the write-up about that item, <code>**bold**</code>, <code>*italic*</code>.
      ${ed ? 'Saves by itself two seconds after you stop typing.' : ''} The file is <code>${esc(path)}</code>.</p>`;
};

function edCurrentSection() {
  const src = $('#edSrc');
  const before = src.value.slice(0, src.selectionStart).split('\n').reverse();
  for (const l of before) { const h = /^#{2,3}\s+(.*)$/.exec(l.trim()); const m = h && HEADING_RE.exec(h[1]); const id = m && subIdFromHeading(m[1]); if (id) return id; }
  return null;
}
function edCheck() {
  const src = $('#edSrc');
  if (!src) return;
  const doc = parsePrr(noteParas(src.value));
  const prev = $('#edPreview'), y = prev.scrollTop;
  prev.innerHTML = notePreview(src.value) || '<p class="muted">Nothing written yet.</p>';
  prev.scrollTop = y;
  const items = evidenceItems();
  const codes = new Set(items.map((i) => i.code).filter(Boolean));
  const mapped = new Set(items.flatMap((i) => ((i.rec && i.rec.maps) || []).map((m) => i.code + '|' + m.sub)));
  const missing = SUBS.filter((a) => String(a.group) === ED.group && !doc.sections.some((s) => s.id === a.id)).map((a) => a.id);
  const id = edCurrentSection(), s = doc.sections.find((x) => x.id === id);
  const miss = missing.length ? `<p class="issue warn">No heading yet for ${missing.join(', ')}</p>` : '';
  if (!s) { $('#edSide').innerHTML = miss + '<p class="muted small">Put the cursor in a section to see its checks.</p>'; return; }
  const issues = sectionChecks(s, codes, mapped);
  $('#edSide').innerHTML = `<h2>${subLink(s.id)} ${prrChip(s.state === 'draft' && !issues.some((i) => i[0] !== 'info') ? 'ready' : s.state)}</h2>
    <p class="small">${s.words} words · written about: ${s.discussed.map(codeLink).join(' ') || 'none'}</p>
    ${issues.map(([lv, t]) => `<div class="issue ${lv}">${linkify(t)}</div>`).join('') || '<p class="small good">No problems found by the checks.</p>'}${miss}
    <p class="small"><a href="#feedback?sub=${esc(s.id)}">Feedback on ${esc(s.id)}</a></p>`;
}

async function edSave(manual) {
  const src = $('#edSrc');
  if (!ED || !src || !canEdit()) return;
  clearTimeout(edSave.t);
  const text = src.value;
  if (text === ED.saved && ED.origin === 'note' && !manual) return;
  const state = $('#edState');
  try {
    if (!S.demo && ED.mtime) {
      const now = await readNote(ED.path);
      if (now && now.mtime > ED.mtime + 1000 && now.text !== ED.saved) { edConflict(now); return; }
    }
    // keep the previous version: on a manual save, or at most every 10 minutes
    if (ED.saved && ED.saved !== text && (manual || Date.now() - ED.lastHist > 600000)) {
      ED.lastHist = Date.now();
      const name = localIso().replace(/[:T]/g, '-') + '.md';
      if (S.demo) (NOTE_HIST_MEM[ED.group] = NOTE_HIST_MEM[ED.group] || []).push({ name, text: ED.saved });
      else {
        const dir = `${DATA_DIR}/prr-history/${ED.group}`;
        await writeFile(S.own, `${dir}/${name}`, ED.saved);
        const old = (await listDir(S.own, dir)).map((f) => f.name).sort();
        const h = await subDir(S.own, dir);
        for (const n of old.slice(0, Math.max(0, old.length - 30))) await h.removeEntry(n);
      }
    }
    if (S.demo) { NOTE_MEM[ED.path] = text; ED.mtime = Date.now(); }
    else ED.mtime = await writeFile(S.own, ED.path, text);
    S.prr[ED.path] = noteDoc(ED.path, text, ED.mtime);
    if (ED.origin !== 'note') { ED.origin = 'note'; $$('#main .banner').forEach((b) => b.remove()); toast('Saved as a report in Pathway Pro'); }
    ED.saved = text;
    if (state) { state.textContent = S.demo ? 'Not saved (sample)' : 'Saved ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); state.className = 'save-state'; }
  } catch (err) {
    if (state) { state.textContent = 'Not saved'; state.className = 'save-state bad'; }
    toast('Could not save the report: ' + err.message, 'error');
  }
}

function edConflict(now) {
  const d = dialog(`<h2>The report changed somewhere else</h2><p>It was saved on another computer (or by OneDrive) after you opened it here. Which version do you want?</p>
    <div class="row" style="justify-content:flex-end;margin-top:1rem"><button id="edKeep">Keep mine and overwrite it</button><button class="primary" id="edTheirs">Load the other version (my unsaved edits are lost)</button></div>`);
  $('#edTheirs', d).addEventListener('click', () => { d.close(); $('#edSrc').value = ED.saved = now.text; ED.mtime = now.mtime; edCheck(); toast('Loaded the other version'); });
  $('#edKeep', d).addEventListener('click', () => { d.close(); ED.mtime = now.mtime; edSave(true); });
}

// ---------- evidence code suggestions ----------
function edToken() { const src = $('#edSrc'); const m = src.value.slice(0, src.selectionStart).match(/(\{\s*[A-Z]{0,3}-?\d{0,3}|\b[A-Z]{2,3}-\d{0,3})$/); return m ? m[0] : null; }
function edSuggest(forced) {
  const tok = forced !== undefined ? forced : edToken(), box = $('#edSuggest');
  if (tok === null) { box.hidden = true; return; }
  const q = tok.replace(/[{\s-]/g, '').toUpperCase();
  const list = evidenceItems().filter((i) => i.code && i.code.replace('-', '').startsWith(q)).slice(0, 30);
  if (!list.length) { box.hidden = true; return; }
  box.innerHTML = list.map((i, n) => `<div role="option" data-code="${esc(i.code)}" class="${n ? '' : 'on'}" aria-selected="${!n}"><b>${esc(i.code)}</b> ${esc(i.title)}</div>`).join('');
  box.dataset.token = forced !== undefined ? '' : tok;
  box.hidden = false;
}
function edInsert(code) {
  const src = $('#edSrc'), box = $('#edSuggest'), tok = box.dataset.token || '';
  src.setRangeText(`{${code}} `, src.selectionStart - tok.length, src.selectionStart, 'end');
  box.hidden = true; src.focus(); src.dispatchEvent(new Event('input'));
}

VIEWS.edit.after = () => {
  const src = $('#edSrc');
  if (!src) return;
  edCheck();
  const on = (id, fn) => { const el = $('#' + id); if (el) el.addEventListener('click', fn); };
  src.addEventListener('input', () => {
    if (!canEdit()) return;
    const st = $('#edState'); st.textContent = ED.origin === 'note' ? 'Unsaved changes' : 'Not saved yet';
    clearTimeout(edCheck.t); edCheck.t = setTimeout(edCheck, 600);
    if (ED.origin === 'note') { clearTimeout(edSave.t); edSave.t = setTimeout(edSave, 2000); }
    edSuggest();
  });
  ['click', 'keyup'].forEach((ev) => src.addEventListener(ev, (e) => { if (!['ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'Escape'].includes(e.key)) { clearTimeout(edCheck.t); edCheck.t = setTimeout(edCheck, 150); } }));
  src.addEventListener('keydown', (e) => {
    const box = $('#edSuggest');
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); edSave(true); return; }
    if (box.hidden) return;
    const opts = $$('[data-code]', box), cur = opts.findIndex((x) => x.classList.contains('on'));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = (cur + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
      opts.forEach((x, i) => { x.classList.toggle('on', i === n); x.setAttribute('aria-selected', i === n); }); opts[n].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); edInsert(opts[Math.max(cur, 0)].dataset.code); }
    else if (e.key === 'Escape') { e.preventDefault(); box.hidden = true; }
  });
  $('#edSuggest').addEventListener('mousedown', (e) => { const d = e.target.closest('[data-code]'); if (d) { e.preventDefault(); edInsert(d.dataset.code); } });
  on('edSave', () => edSave(true));
  on('edTag', () => { src.focus(); edSuggest(''); });
  on('edEvLine', () => {
    const before = src.value.slice(0, src.selectionStart), at = before.lastIndexOf('\n## ');
    if (!edCurrentSection() || at < 0 && !/^## /.test(src.value)) { toast('Put the cursor under a "## 2b – …" heading first', 'error'); return; }
    const pos = src.value.indexOf('\n', at + 1);
    src.setRangeText('\n\nEvidence: ', pos < 0 ? src.value.length : pos, pos < 0 ? src.value.length : pos, 'end'); src.focus(); src.dispatchEvent(new Event('input'));
  });
  on('edWord', (e) => { if (!demoBlocked()) act(e.currentTarget, edMakeWord, (p) => `Saved ${p}. Share it with your mentor to comment in Word; their comments show on Feedback.`); });
  on('edPrint', () => {
    const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>PRR · Attribute ${esc(ED.group)}</title><style>body{font:15px/1.55 Calibri,system-ui,sans-serif;max-width:800px;margin:24px auto;padding:0 16px;color:#111}
      h2{font-size:22px}h3{font-size:17px;margin-top:22px}a{color:inherit;text-decoration:none}.ed-tag{font-weight:600}</style></head><body>${notePreview(src.value)}<script>print()<\/script></body></html>`;
    const url = URL.createObjectURL(new Blob([page], { type: 'text/html' }));
    if (!window.open(url, '_blank')) download(new Blob([page], { type: 'text/html' }), `PRR - Attribute ${ED.group}.html`);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  });
  on('edHist', edHistory);
};
document.addEventListener('visibilitychange', () => { if (document.hidden && ED && $('#edSrc') && ED.origin === 'note') edSave(); });
// Leaving the editor saves first (the page is drawn again on every hash change).
window.addEventListener('hashchange', (e) => { if (ED && ED.origin === 'note' && /#edit\//.test(e.oldURL) && $('#edSrc')) edSave(); }, true);

async function edMakeWord() {
  const src = $('#edSrc'); await edSave(true);
  const blocks = String(src.value).split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const h = /^(#{1,3})\s+(.*)$/.exec(l), plain = (s) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
    return h ? { type: ['title', 'h1', 'h2'][h[1].length - 1], text: plain(h[2]) } : { type: 'p', text: plain(l) };
  });
  let name = `PRR - Attribute ${ED.group} - for comments ${today()}.docx`;
  for (let n = 2; await exists(S.own, `${FOLDERS.prr}/${name}`); n++) name = `PRR - Attribute ${ED.group} - for comments ${today()} (${n}).docx`;
  await writeFile(S.own, `${FOLDERS.prr}/${name}`, makeDocx(blocks));
  await loadReports();
  return `${FOLDERS.prr}/${name}`;
}

async function edHistory() {
  const g = ED.group;
  let list = [];
  if (S.demo) list = (NOTE_HIST_MEM[g] || []).map((x) => ({ name: x.name, read: async () => x.text }));
  else list = (await listDir(isMentor() ? S.other : S.own, `${DATA_DIR}/prr-history/${g}`)).map((f) => ({ name: f.name, read: async () => (await f.handle.getFile()).text() }));
  list.sort((a, b) => (a.name < b.name ? 1 : -1));
  const when = (n) => n.replace(/\.md$/, '').replace(/^(\d{4}-\d\d-\d\d)-(\d\d)-(\d\d)-(\d\d)$/, '$1 $2:$3');
  const d = dialog(`<h2>Earlier versions</h2><p class="small muted">A copy is kept when you press Save, and every 10 minutes while you write (the last 30).</p>
    <div class="ed-hist"><div>${list.length ? list.map((x, i) => `<div><button type="button" class="small" data-v="${i}">${esc(when(x.name))}</button></div>`).join('') : '<p class="muted">No earlier versions yet.</p>'}</div><pre class="ed-hist-text" id="edHistText"></pre></div>
    <div class="row" style="justify-content:flex-end;margin-top:1rem"><button type="button" id="edHistLoad" hidden>Load this version into the editor</button><button type="button" id="edHistClose">Close</button></div>`);
  let chosen = null;
  $$('[data-v]', d).forEach((b) => b.addEventListener('click', async () => { chosen = await list[+b.dataset.v].read(); $('#edHistText', d).textContent = chosen; $('#edHistLoad', d).hidden = !canEdit(); }));
  $('#edHistClose', d).addEventListener('click', () => d.close());
  $('#edHistLoad', d).addEventListener('click', () => { const src = $('#edSrc'); src.value = chosen; d.close(); src.dispatchEvent(new Event('input')); toast('Earlier version loaded; it saves like any edit'); });
}
