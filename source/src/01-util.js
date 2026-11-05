// Small helpers shared by every part of the tool.
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
// Local time, not UTC, so late-evening entries in British Summer Time get the right day.
const localIso = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
const today = () => localIso().slice(0, 10);
const nowIso = () => localIso();
const plural = (n, word, many) => `${n} ${n === 1 ? word : (many || word + 's')}`;
const words = (text) => (String(text).match(/[A-Za-z][A-Za-z'’\-]+/g) || []).length;
const fmtDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? iso + 'T00:00' : iso);
  return isNaN(d) ? iso : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtSize = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';

function toast(message, kind = 'ok') {
  let box = $('#toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.append(box); }
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.textContent = message;
  box.append(t);
  setTimeout(() => t.classList.add('gone'), kind === 'error' ? 8000 : 3500);
  setTimeout(() => t.remove(), kind === 'error' ? 8500 : 4000);
}

// Run an action from a button: busy state while it runs, then a tick or a cross, and a message.
async function act(btn, fn, okMessage) {
  if (btn) { btn.classList.add('busy'); btn.disabled = true; }
  try {
    const result = await fn();
    if (btn) flash(btn, 'done');
    if (okMessage) toast(typeof okMessage === 'function' ? okMessage(result) : okMessage);
    return result;
  } catch (err) {
    console.error(err);
    if (btn) flash(btn, 'failed');
    toast('That did not work: ' + (err.message || err), 'error');
  } finally {
    if (btn) { btn.classList.remove('busy'); btn.disabled = false; }
  }
}

function flash(el, cls) {
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 1600);
}

async function sha1(text) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// "CA-00 to CA-18, CO-14" -> ['CA-00', ..., 'CA-18', 'CO-14']
const CODE_RE = /\b([A-Z]{2,3})-(\d{2,3})\b/g;
function expandCodes(text) {
  const out = [];
  const re = /\b([A-Z]{2,3})-(\d{2,3})\b(?:\s*(?:to|–|—|-)\s*(?:([A-Z]{2,3})-)?(\d{2,3})\b)?/g;
  let m;
  while ((m = re.exec(text))) {
    const [, prefix, from, prefix2, to] = m;
    if (to !== undefined && (!prefix2 || prefix2 === prefix) && +to >= +from && +to - +from < 200) {
      for (let n = +from; n <= +to; n++) out.push(`${prefix}-${String(n).padStart(from.length, '0')}`);
    } else {
      out.push(`${prefix}-${from}`);
    }
  }
  return [...new Set(out)];
}

// Natural sort: "CO-2" before "CO-10", "2b" before "10a".
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
const natural = (a, b) => collator.compare(a, b);

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
