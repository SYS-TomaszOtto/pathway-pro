// Appearance (New Look plan, phase 1): a style (Paper or Basic), a theme (follow the system, light or dark) and
// animations (follow the system, or off). Saved per device in localStorage 'pathwayPro.look' (every access in
// try/catch; with storage blocked the choice lasts for the session), never in the portfolio, so it does not touch
// undo, backups, sample mode or the mentor. The head script (src/head/look-boot.js) applies it before first paint;
// this file changes it, follows the system theme live, and draws the controls (Settings card, More sheet, start screen).
// Globals are `var` so nothing here can hit a TDZ if another file calls in early.

var LOOK_KEY = 'pathwayPro.look';
var LOOK_DEFAULT = { style: 'paper', theme: 'system', motion: 'system' };
var LOOK_MQL = (() => { try { return matchMedia('(prefers-color-scheme: dark)'); } catch (_) { return null; } })();

function lookSystemDark() { return !!(LOOK_MQL && LOOK_MQL.matches); }

function getLook() {
  let l = null;
  try { l = JSON.parse(localStorage.getItem(LOOK_KEY)); } catch (_) { l = window.lookMem || null; }
  return Object.assign({}, LOOK_DEFAULT, l || {});
}
function setLook(change) {
  const l = Object.assign(getLook(), change);
  window.lookMem = l;   // the head script and getLook fall back to this when storage is blocked
  try { localStorage.setItem(LOOK_KEY, JSON.stringify(l)); } catch (_) { /* blocked: kept for this session only */ }
  applyLook();
  lookSync();
  return l;
}
function applyLook() {
  const l = getLook(), d = document.documentElement;
  d.setAttribute('data-style', LOOK_STYLES.some((x) => x[0] === l.style) ? l.style : 'paper');
  d.setAttribute('data-theme', l.theme === 'light' || l.theme === 'dark' ? l.theme : (lookSystemDark() ? 'dark' : 'light'));
  if (l.motion === 'off') d.setAttribute('data-motion', 'off'); else d.removeAttribute('data-motion');
}
// "Follow the system" changes live when the OS setting changes.
if (LOOK_MQL) {
  const onSys = () => { if (getLook().theme === 'system') applyLook(); };
  if (LOOK_MQL.addEventListener) LOOK_MQL.addEventListener('change', onSys); else if (LOOK_MQL.addListener) LOOK_MQL.addListener(onSys);
}

var LOOK_STYLES = [
  ['paper', 'Paper', 'Warm paper, typewriter headings and pastel tags'],
  ['basic', 'Basic', 'The plain grey and white app look'],
  ['clear', 'Clear', 'Larger, roomier text and a strong focus ring, for easier reading'],
  ['neon', 'Neon', 'Neon lines and labels; true black in the dark'],
  ['journal', 'Journal', 'Serif headings and hairline rules, like a printed report'],
];
var LOOK_OPTS = {
  theme: [['system', 'Auto'], ['light', 'Light'], ['dark', 'Dark']],
  motion: [['system', 'Auto'], ['off', 'Off']],
};
function lookTheme() { return document.documentElement.getAttribute('data-theme') || 'light'; }
function lookStyleName(v) { return (LOOK_STYLES.find((x) => x[0] === v) || LOOK_STYLES[0])[1]; }
// A live mini-render of a style in the current theme: it carries its own data-style/data-theme, so the real tokens draw it.
function lookPreview(s) {
  return `<span class="look-preview" data-style="${s}" data-theme="${lookTheme()}" aria-hidden="true"><span class="lp-h">Aa</span>`
    + '<span class="lp-row"><span class="lp-pill good">Met</span><span class="lp-pill part">Part</span><span class="lp-btn">Save</span></span>'
    + '<span class="lp-bar"><i></i><i class="on"></i><i></i></span></span>';
}
function lookSeg(key, label, l) {
  return `<div class="seg" role="group" aria-label="${label}">${LOOK_OPTS[key].map(([v, t]) =>
    `<button type="button" class="small" data-look-set="${key}" data-value="${v}" aria-pressed="${l[key] === v}">${t}${v === 'system' ? '<span class="sr-only"> (follow the system)</span>' : ''}</button>`).join('')}</div>`;
}
// Quick switch (foot of the More sheet, start screen): Auto/Light/Dark, and "Style: Paper" which opens the five style cards below it.
function lookQuickHtml() {
  const l = getLook();
  return `<div class="look-quick" data-look><span class="look-quick-title" aria-hidden="true">Look</span>${lookSeg('theme', 'Theme', l)}
    <button type="button" class="small look-style-btn" aria-expanded="false" aria-controls="lookStylesQuick">Style: <b class="look-cur">${lookStyleName(l.style)}</b> <span aria-hidden="true">›</span></button>
    <div class="look-sheet" id="lookStylesQuick" role="group" aria-label="Style" hidden>${LOOK_STYLES.map(([v, name]) =>
      `<button type="button" class="look-pick" data-look-set="style" data-value="${v}" aria-pressed="${l.style === v}">${lookPreview(v)}<span class="look-name">${name}<span class="look-inuse"> ✓ In use</span></span></button>`).join('')}</div></div>`;
}
// Settings card: Theme and Animations as segmented buttons, then the five styles as radio cards with live previews.
function lookCardHtml() {
  const l = getLook();
  return `<div class="card wide" id="appearance" data-look><h2>Appearance</h2>
    <p class="small muted">Saved on this device only: your portfolio file and your mentor are not affected.</p>
    <div class="row look-segs"><span class="look-seg-label" aria-hidden="true">Theme</span>${lookSeg('theme', 'Theme', l)}<span class="look-seg-label" aria-hidden="true">Animations</span>${lookSeg('motion', 'Animations', l)}</div>
    <fieldset class="look-set"><legend>Style</legend><div class="look-cards">${LOOK_STYLES.map(([v, name, text]) =>
      `<label class="look-card"><input type="radio" name="look-style" value="${v}" ${l.style === v ? 'checked' : ''}>${lookPreview(v)}<span class="look-name"><b>${name}</b><span class="look-inuse"> ✓ In use</span></span><span class="small muted">${text}</span></label>`).join('')}</div></fieldset>
    <div class="sr-only" id="lookLive" role="status" aria-live="polite"></div></div>`;
}
// Keep every visible control (and the previews' theme) in step with the saved choice.
function lookSync() {
  const l = getLook();
  for (const b of $$('[data-look-set]')) b.setAttribute('aria-pressed', String(l[b.dataset.lookSet] === b.dataset.value));
  for (const r of $$('input[name^="look-"]')) r.checked = l[r.name.slice(5)] === r.value;
  for (const pv of $$('.look-preview')) pv.setAttribute('data-theme', lookTheme());
  for (const c of $$('.look-cur')) c.textContent = lookStyleName(l.style);
}
function lookSay(text) { const live = $('#lookLive'); if (live) { live.textContent = ''; setTimeout(() => { live.textContent = text; }, 30); } }
document.addEventListener('click', (e) => {
  const t = e.target.closest ? e.target : null;
  if (!t) return;
  const sb = t.closest('.look-style-btn');
  if (sb) {
    const sh = document.getElementById(sb.getAttribute('aria-controls'));
    const open = sh.hidden;
    sh.hidden = !open; sb.setAttribute('aria-expanded', String(open));
    if (open) { const cur = $('[aria-pressed=true]', sh) || $('button', sh); if (cur) cur.focus(); }
    return;
  }
  const b = t.closest('[data-look-set]');
  if (b) { setLook({ [b.dataset.lookSet]: b.dataset.value }); if (b.dataset.lookSet === 'style') lookSay('Style: ' + lookStyleName(b.dataset.value)); }
});
document.addEventListener('change', (e) => {
  const r = e.target;
  if (r && r.matches && r.matches('input[name^="look-"]')) { setLook({ [r.name.slice(5)]: r.value }); if (r.name === 'look-style') lookSay('Style: ' + lookStyleName(r.value)); }
});
// When following the system, the previews follow too.
if (LOOK_MQL && LOOK_MQL.addEventListener) LOOK_MQL.addEventListener('change', () => lookSync());

// One-off note for people who used the old look: shown once per device, the first time a portfolio opens.
function lookIntro() {
  let seen = true;
  try { seen = !!localStorage.getItem(LOOK_KEY); } catch (_) { return; }
  if (seen) return;
  try { localStorage.setItem(LOOK_KEY, JSON.stringify(getLook())); } catch (_) { return; }
  toast('New look: 5 styles in Settings, Appearance, including Clear for easier reading and Basic, the old look.');
}
