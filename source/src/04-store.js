// Folders and saving. The person picks their own folder once (read and write) and, optionally, the other
// person's folder (read only). Folder handles are remembered in the browser; Edge asks again for
// permission after a restart, which needs one click.

const DATA_DIR = 'ice-data';
const FILES = { apprentice: 'portfolio.json', mentor: 'mentor.json' };
const FOLDERS = { evidence: 'Evidence', prr: 'PRR', meetings: 'Meetings', cpd: 'CPD', exports: 'Exports' };
const IGNORE = /^(~\$|\.|desktop\.ini$|thumbs\.db$)/i;

const S = {
  own: null,          // FileSystemDirectoryHandle of my folder
  other: null,        // the other person's folder (mentor's for an apprentice, apprentice's for a mentor)
  data: null,         // my data (portfolio.json or mentor.json)
  otherData: null,    // their data, read only
  loadedStamp: 0,     // lastModified of my data file when loaded, to spot an edit from another device
  files: [],          // evidence files in the portfolio: {path, name, size, mtime, handle}
  saving: false,
  dirty: false,
  warnings: [],
};

// ---------- remembering folders (IndexedDB) ----------
// If the browser's database never answers (seen in some locked-down set-ups), carry on without it:
// the tool then just asks for the folder each time.
function idb() {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('browser storage did not answer')), 3000);
    const req = indexedDB.open('ice-tool', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('handles');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function remember(key, value) {
  let db;
  try { db = await idb(); } catch (_) { return; }
  await new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readwrite');
    if (value === null) tx.objectStore('handles').delete(key); else tx.objectStore('handles').put(value, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}
async function recall(key) {
  let db;
  try { db = await idb(); } catch (_) { return null; }
  return new Promise((resolve) => {
    const req = db.transaction('handles').objectStore('handles').get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

const supported = () => 'showDirectoryPicker' in window;

async function permission(handle, mode, ask) {
  if (!handle) return false;
  const opts = { mode };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  return ask ? (await handle.requestPermission(opts)) === 'granted' : false;
}

async function pickFolder(id, mode) {
  return window.showDirectoryPicker({ id, mode, startIn: 'documents' });
}

// ---------- reading and writing files ----------
async function subDir(dir, path, create = false) {
  for (const part of path.split('/').filter(Boolean)) dir = await dir.getDirectoryHandle(part, { create });
  return dir;
}
async function fileHandle(dir, path, create = false) {
  const parts = path.split('/');
  const name = parts.pop();
  return (await subDir(dir, parts.join('/'), create)).getFileHandle(name, { create });
}
async function exists(dir, path) {
  try { await fileHandle(dir, path); return true; } catch (_) { return false; }
}
async function readJson(dir, path) {
  const file = await (await fileHandle(dir, path)).getFile();
  return { json: JSON.parse(await file.text()), stamp: file.lastModified };
}
async function writeFile(dir, path, content) {
  const h = await fileHandle(dir, path, true);
  const w = await h.createWritable();
  await w.write(content);
  await w.close();
  return (await h.getFile()).lastModified;
}
// Every file under a folder, depth first: [{path, name, size, mtime, handle}]
async function listFiles(dir, prefix = '') {
  const out = [];
  for await (const [name, h] of dir.entries()) {
    if (IGNORE.test(name)) continue;
    const path = prefix ? `${prefix}/${name}` : name;
    if (h.kind === 'directory') out.push(...await listFiles(h, path));
    else {
      try {
        const f = await h.getFile();
        out.push({ path, name, size: f.size, mtime: f.lastModified, handle: h });
      } catch (_) { out.push({ path, name, size: 0, mtime: 0, handle: h }); }
    }
  }
  return out;
}
async function listDir(dir, path) {
  try { return await listFiles(await subDir(dir, path)); } catch (_) { return []; }
}

// A file from a path such as "Evidence/1 - Knowledge/CO-14 Site visit.pdf" in my folder or, failing
// that, in the other person's folder (so a mentor can open the apprentice's evidence).
async function getFile(path, where) {
  const roots = where === 'own' ? [S.own] : where === 'other' ? [S.other] : [S.own, S.other];
  for (const root of roots.filter(Boolean)) {
    try { return await (await fileHandle(root, path)).getFile(); } catch (_) { /* try the next */ }
  }
  throw new Error('file not found: ' + path);
}

// ---------- my data ----------
const role = () => S.data && S.data.role;
const isMentor = () => role() === 'mentor';
const myDataPath = () => `${DATA_DIR}/${isMentor() ? FILES.mentor : FILES.apprentice}`;
// The apprentice's portfolio data, whoever is looking at it.
const P = () => (isMentor() ? S.otherData : S.data);
// The mentor's data, whoever is looking at it.
const M = () => (isMentor() ? S.data : S.otherData);
// The folder holding the apprentice's files.
const portfolioRoot = () => (isMentor() ? S.other : S.own);

function newPortfolio(name, mode) {
  return {
    format: 'ice-tool/1', role: 'apprentice', mode, name, created: nowIso(), saved: null,
    profile: { jobRole: '', responsibilities: '', sector: '' },
    settings: { goal: 3, cpdTarget: 30, cpdYearStart: 1, themes: [] },
    evidence: {}, comments: {}, meetings: [],
    cpd: { objectives: [{ id: uid(), ref: 'UNP', title: 'Unplanned CPD', date: today(), status: 'active', area: 'Learning I did not plan for', learn: '', action: '', resources: '', evaluate: '', deadline: '', notes: '' }],
      activities: [], reviews: [] },
  };
}
function newMentor(name, apprentice) {
  return { format: 'ice-tool/1', role: 'mentor', name, apprentice, created: nowIso(), saved: null, subs: {}, evidence: {}, actions: [] };
}

// Fill in anything an older file lacks, so new features never meet undefined.
function upgrade(d) {
  if (d.role === 'mentor') {
    d.subs = d.subs || {}; d.evidence = d.evidence || {}; d.actions = d.actions || [];
    return d;
  }
  d.mode = d.mode || 'ice';
  d.profile = { jobRole: '', responsibilities: '', sector: '', ...(d.profile || {}) };
  d.settings = { goal: 3, cpdTarget: 30, cpdYearStart: 1, themes: [], ...(d.settings || {}) };
  d.evidence = d.evidence || {}; d.comments = d.comments || {}; d.meetings = d.meetings || [];
  d.cpd = d.cpd || { objectives: [], activities: [], reviews: [] };
  d.cpd.reviews = d.cpd.reviews || [];
  return d;
}

async function loadOwn() {
  for (const r of ['apprentice', 'mentor']) {
    if (await exists(S.own, `${DATA_DIR}/${FILES[r]}`)) {
      const { json, stamp } = await readJson(S.own, `${DATA_DIR}/${FILES[r]}`);
      S.data = upgrade(json);
      S.loadedStamp = stamp;
      return true;
    }
  }
  return false;
}

async function loadOther() {
  S.otherData = null;
  if (!S.other) return;
  if (!(await permission(S.other, 'read', false))) return;
  const name = isMentor() ? FILES.apprentice : FILES.mentor;
  try {
    S.otherData = upgrade((await readJson(S.other, `${DATA_DIR}/${name}`)).json);
  } catch (err) {
    S.warnings.push(`Could not read ${name} in the linked folder "${S.other.name}": ${err.message}`);
  }
}

async function scanEvidence() {
  const root = portfolioRoot();
  S.files = root ? (await listDir(root, FOLDERS.evidence)).map((f) => ({ ...f, path: `${FOLDERS.evidence}/${f.path}` })) : [];
  S.files.sort((a, b) => natural(a.path, b.path));
}

// OneDrive makes "portfolio-LAPTOP.json" when two devices change the file while offline.
async function conflictCopies() {
  const out = [];
  try {
    const dir = await subDir(S.own, DATA_DIR);
    for await (const [name, h] of dir.entries()) {
      if (h.kind === 'file' && /\.json$/i.test(name) && !Object.values(FILES).includes(name)) out.push(name);
    }
  } catch (_) { /* no data folder yet */ }
  return out;
}

const saveSoon = debounce(() => save(), 700);
function changed() {
  S.dirty = true;
  setSaveState('Saving…');
  saveSoon();
}

async function save(force = false) {
  if (!S.data || S.saving) { if (S.saving) saveSoon(); return; }
  S.saving = true;
  try {
    const path = myDataPath();
    if (!force && S.loadedStamp) {
      let current = 0;
      try { current = (await (await fileHandle(S.own, path)).getFile()).lastModified; } catch (_) { /* new file */ }
      if (current && current > S.loadedStamp + 1000) {
        setSaveState('Not saved', 'bad');
        showConflict();
        return;
      }
    }
    S.data.saved = nowIso();
    const text = JSON.stringify(S.data, null, 1);
    S.loadedStamp = await writeFile(S.own, path, text);
    S.dirty = false;
    setSaveState('Saved');
    await dailyBackup(text);
  } catch (err) {
    setSaveState('Not saved', 'bad');
    toast('Could not save: ' + err.message, 'error');
  } finally {
    S.saving = false;
  }
}

// One copy a day in ice-data/backups, the newest 30 kept.
async function dailyBackup(text) {
  const base = isMentor() ? 'mentor' : 'portfolio';
  const path = `${DATA_DIR}/backups/${base}-${today()}.json`;
  if (await exists(S.own, path)) return;
  await writeFile(S.own, path, text);
  const dir = await subDir(S.own, `${DATA_DIR}/backups`);
  const names = [];
  for await (const [name] of dir.entries()) if (name.startsWith(base + '-')) names.push(name);
  names.sort();
  for (const old of names.slice(0, Math.max(0, names.length - 30))) await dir.removeEntry(old);
}

function setSaveState(text, cls = '') {
  const el = $('#saveState');
  if (el) { el.textContent = text; el.className = 'save-state ' + cls; }
}

window.addEventListener('beforeunload', (e) => { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });
