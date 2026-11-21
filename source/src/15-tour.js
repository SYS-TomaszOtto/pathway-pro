// Guided tour: a main tour plus a short tour per page. No libraries. Targets are found by selector (steps with no
// visible target are skipped silently). Progress is kept in localStorage 'pathwayPro.tour' (every access in try/catch).
//
// Test (test build, in the browser console or a script, after testReset/testSeed and opening the portfolio):
//   testTour.start()                  // main tour, step 1
//   testTour.state()                  // {active, key, index, total, title, focusInPopover, ...}
//   await testTour.next()             // then state() again; testTour.back(); testTour.stop()
//   testTour.start('evidence')        // a page tour (framework, evidence, attributes, reports, feedback, mentor, cpd)
//   Esc closes and returns focus to the launcher; reload and testTour.progress() shows the saved state.
//   Storage blocked: Object.defineProperty(window,'localStorage',{get(){throw 1}}) then start() still works.

const TOUR_KEY = 'pathwayPro.tour';
let tourMem = null;
const itemWord = () => (typeof LABEL !== 'undefined' && LABEL && LABEL.item) || 'item';
const itemsWord = () => (typeof LABEL !== 'undefined' && LABEL && LABEL.items) || itemWord() + 's';
const attrWord = () => (typeof LABEL !== 'undefined' && LABEL && LABEL.attr) || 'Attributes';

function tourRead() {
  let s = null;
  try { const raw = localStorage.getItem(TOUR_KEY); if (raw) s = JSON.parse(raw); } catch (_) { s = null; }
  if (!s || typeof s !== 'object') s = tourMem ? JSON.parse(JSON.stringify(tourMem)) : {};
  if (!s.pages || typeof s.pages !== 'object') s.pages = {};
  return s;
}
function tourWrite(change) {
  const s = tourRead();
  change(s);
  tourMem = JSON.parse(JSON.stringify(s));
  try { localStorage.setItem(TOUR_KEY, JSON.stringify(s)); } catch (_) { /* blocked: the tour is simply offered again next visit */ }
}

// ---------- target helpers ----------
const tourVisible = (el) => { if (!el || !el.isConnected) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
const tq = (sel) => $$(sel).find(tourVisible) || null;
const tCard = (sel) => { const el = tq(sel); return el ? el.closest('.card') || el : null; };
const tCardTitled = (title) => { const h = $$('#main h2').find((x) => x.textContent.trim().toLowerCase().startsWith(title.toLowerCase())); return h ? h.closest('.card') || h : null; };

// ---------- the tours (plain data: edit the wording here) ----------
// step: { title, text (string or function), page (hash page to be on), sel: [selector | function], action: {label, hash} }
const TOURS = {
  main: { name: 'Tour', steps: [
    { title: 'Welcome', text: 'This is your tracker. Your files stay in your OneDrive folder; nothing is sent anywhere. We will go through the five things you need first.' },
    { title: 'Choose your framework', page: 'settings', sel: [() => tCardTitled('Framework'), 'a.btn[href="#framework"]'], action: { label: 'Open framework settings', hash: '#framework' },
      text: () => `First choose what you are assessed against. This sets the list of ${attrWord()} you map evidence to. You can change it later.` },
    { title: 'Name and wording', page: 'framework', sel: [() => tCard('#fwName')],
      text: 'Check this is the right framework and edit any wording that is out of date. Built-in lists were read from published guidance and may contain mistakes.' },
    { title: 'Your evidence folder', page: 'evidence', sel: ['#main > p.muted', '#rescan'],
      text: 'Save your files in the Evidence folder in OneDrive and start each file name with a code such as CO-14. Then press Refresh on the Evidence tab.',
      key: 'A file only counts once its name starts with a code.' },
    { title: 'Map a file', page: 'evidence', sel: ['#main table tr[data-href]', '#main .empty'],
      text: () => `Click a file, then tick each ${itemWord()} it shows and at what level.`,
      key: () => `One file can count towards several ${itemsWord()}.` },
    { title: () => `Check your ${attrWord()}`, page: 'attributes', sel: ['#main > p.muted', '#main h1'],
      text: () => `This shows what is covered and what is missing. The goal is shown in the note at the top of the ${attrWord()} page.` },
    { title: 'Reports', page: 'reports', sel: ['#main > p.muted', '#reload'],
      text: 'Write your report in Word and save it in the Reports folder. The tool checks it and shows any problems here.',
      key: 'Word stays the master copy: the tool reads your report and never changes it.' },
    { title: 'Mentor feedback', page: 'feedback', sel: ['#exportResp', '#main .sub-tabs'],
      text: 'Your mentor\'s comments from the Word report are listed here. Answer each one and mark it done.' },
    { title: 'What to do next', page: 'home', sel: [() => tCardTitled('Next steps')],
      text: 'Come back to Home any time: the Next steps list tells you the most useful thing to do now.' },
  ] },
  framework: { name: 'Framework settings', steps: [
    { title: 'Start from a preset', sel: ['#fwPreset'], text: 'Pick a ready-made framework to fill the page in, then adjust it. Nothing changes until you press Save.' },
    { title: 'Name and labels', sel: [() => tCard('#fwName')], text: () => `Name your framework and choose the tab names. The tab for the requirements is called "${attrWord()}" at the moment.` },
    { title: 'Levels and goal', sel: [() => tCard('#fwLevels')], text: 'Levels say how well something is shown, for example Knowledge, Experience and Ability. The goal (set in Settings) is how many pieces of evidence each level needs. Use one level if your institution has none.' },
    { title: 'Edit as text lines', sel: [() => tCard('#fwAttrs')], text: () => `One ${itemWord()} per line: id | group id | text. For example: A1 | A | Plan the work. You can paste a table from Excel.` },
    { title: 'Share it', sel: ['#fwExport'], text: 'Export the framework as a file to give to another apprentice, who can then import it.' },
  ] },
  evidence: { name: 'Evidence', steps: [
    { title: 'Filters', sel: ['#main .sub-tabs'], text: 'Show all files, or only those not mapped yet. The Not mapped chip is the quickest way to find what still needs doing.' },
    { title: 'Codes', sel: ['#main table thead th'], text: 'Each file starts with a code such as CO-14: two or three letters for the kind of evidence, then a number.' },
    { title: 'Open a file', sel: ['#main table tr[data-href]'], text: () => `Click a row to map that file to ${itemsWord().toLowerCase()} and levels.` },
    { title: 'Refresh and number files', sel: ['#rescan'], text: 'After saving new files in OneDrive, press Refresh. Number files... gives codes to files that have none.' },
    { title: 'Export', sel: ['#exportXlsx'], text: 'Make an Excel matrix of everything mapped, to share or print.' },
  ] },
  attributes: { name: 'Attributes', steps: [
    { title: 'The boxes', sel: ['#main table thead th:nth-child(3)'], text: 'Each small box is one piece of evidence at that level. A filled box means a file has been mapped there.' },
    { title: 'The goal', sel: ['#main > p.muted', '#main h1'], text: 'The note at the top says how many different pieces of evidence are needed at each level.' },
    { title: 'Reports and comments', sel: ['#main table thead th:nth-child(5)'], text: 'The PRR column shows whether your Word report covers it. Comments shows open mentor comments.' },
    { title: 'Open a row', sel: ['#main tr.click'], text: 'Click a row to see all the evidence, report text and comments for it.' },
  ] },
  reports: { name: 'Reports', steps: [
    { title: 'Where the files live', sel: ['#main > p.muted'], text: 'Write your reports in Word and save them in the Reports folder. The tool reads them but never changes them.' },
    { title: 'Headings', sel: ['#howWrite'], text: () => `Start each ${itemWord()} with a heading such as "2b – Contribute to the design". This link shows exactly how.` },
    { title: 'The check list', sel: ['#main table', '#main .card'], text: 'Each heading is listed with its state and any checks, such as evidence listed but not written about.' },
    { title: 'New report', sel: ['#newPrr', '#reload'], text: 'New PRR from template makes a Word file with the headings already in place. Existing files are never overwritten.' },
  ] },
  feedback: { name: 'Feedback', steps: [
    { title: 'Open, done, won\'t change', sel: ['#main .sub-tabs'], text: 'Switch between comments still open and those you have dealt with.' },
    { title: 'Mark each one', sel: ['#main .fb-status'], text: 'Use the buttons to say whether you changed it (Done) or decided not to (Won\'t change).' },
    { title: 'Write a response', sel: ['#main .fb-resp'], text: 'Say what you changed, or why not. This becomes your response to your mentor.' },
    { title: 'One at a time', sel: ['#main .sub-tabs a[title*="one comment"]'], text: 'Work through the comments one by one to stay focused.' },
    { title: 'Export the response', sel: ['#exportResp'], text: 'Export "Response to feedback" as a Word table to send to your mentor.' },
  ] },
  mentor: { name: 'Mentor', steps: [
    { title: 'Link up in three steps', sel: ['#main ol', '#main .ms'], text: 'Your mentor creates their own folder and shares it with you. You add it to your OneDrive, then link it in Settings.' },
    { title: 'Settings button', sel: ['#main a[href="#settings"]', '#main .mc'], text: 'The link button is in Settings. Once linked, your mentor\'s assessment shows here.' },
    { title: 'Who sees what', sel: ['#main p.small.muted'], text: 'You can only read their folder and they can only read yours. Each of you edits only your own.' },
  ] },
  cpd: { name: 'CPD', steps: [
    { title: 'Record an activity', sel: ['#addAct'], text: 'Add each piece of learning as you do it: what it was, the hours and what you learnt.' },
    { title: 'Three views', sel: ['#main .sub-tabs'], text: 'Overview shows your hours against the target. Development plan is what you intend to do; Development record is what you did.' },
    { title: 'Export', sel: ['#main .sub-tabs a[href="#cpd/export"]'], text: 'Export your record when your institution asks for it.' },
  ] },
};
const TOUR_PAGES = ['framework', 'evidence', 'attributes', 'reports', 'feedback', 'mentor', 'cpd'];

// ---------- engine ----------
let T = null;                 // the running tour, or null
let tourRenderTick = 0, tourLastMut = 0;
const tval = (x) => (typeof x === 'function' ? x() : x);
const tsleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tourHashName = () => { try { return parseHash().name; } catch (_) { return ''; } };

function tourFindTarget(step) {
  for (const s of step.sel || []) { const el = typeof s === 'function' ? s() : tq(s); if (el && tourVisible(el)) return el; }
  return null;
}
async function tourWaitTarget(step, ms = 2200) {
  const end = Date.now() + ms;
  for (;;) {
    const el = tourFindTarget(step);
    if (el) return el;
    if (Date.now() > end || !T) return null;
    await tsleep(80);
  }
}
async function tourGoPage(page) {
  if (tourHashName() === page) return;
  const tick = tourRenderTick;
  const t = T;
  if (!t) return;
  t.nav = true;
  location.hash = '#' + page;
  const end = Date.now() + 3000;
  while (Date.now() < end && !(tourRenderTick > tick && Date.now() - tourLastMut > 150)) await tsleep(50);
  t.nav = false;
}

function tourBuild() {
  const hole = document.createElement('div'); hole.className = 'tour-hole none'; hole.setAttribute('aria-hidden', 'true');
  const pop = document.createElement('div'); pop.className = 'tour-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-modal', 'false');
  pop.setAttribute('aria-labelledby', 'tourTitle'); pop.tabIndex = -1;
  pop.setAttribute('aria-describedby', 'tourText tourKeyText');
  pop.innerHTML = '<h2 id="tourTitle"></h2><p id="tourText"></p><div class="keypoint" id="tourKey" hidden><b class="keypoint-label">Key point</b> <span id="tourKeyText"></span></div>'
    + '<div class="tour-foot"><ol class="tour-dots" id="tourDots" aria-hidden="true"></ol><span class="tour-count" id="tourCount"></span>'
    + '<button type="button" id="tourBack">Back</button><button type="button" class="primary" id="tourNext">Next</button>'
    + '<button type="button" id="tourAction" hidden></button><button type="button" class="tour-skip" id="tourSkip">Skip tour</button></div>';
  let live = $('#tourLive');
  if (!live) { live = document.createElement('div'); live.id = 'tourLive'; live.className = 'tour-live'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); document.body.append(live); }
  document.body.append(hole, pop);
  $('#tourBack', pop).addEventListener('click', () => tourStep(-1));
  $('#tourNext', pop).addEventListener('click', () => tourStep(1));
  $('#tourSkip', pop).addEventListener('click', () => tourStop('skipped'));
  $('#tourAction', pop).addEventListener('click', async () => {
    const a = T && T.steps[T.idx].action;
    if (a) { T.nav = true; go(a.hash); T.nav = false; }
    tourStep(1);
  });
  return { hole, pop, live };
}

function tourPlace() {
  if (!T || !T.pop) return;
  const { hole, pop } = T;
  const vw = innerWidth, vh = innerHeight, narrow = vw <= 640;
  let el = T.target;
  if (el && !tourVisible(el)) { el = T.target = tourFindTarget(T.steps[T.idx]); }
  if (!el) {
    hole.className = 'tour-hole none'; hole.removeAttribute('style');
    if (!narrow) { pop.style.left = Math.max(8, (vw - pop.offsetWidth) / 2) + 'px'; pop.style.top = Math.max(8, (vh - pop.offsetHeight) / 3) + 'px'; }
    return;
  }
  const r = el.getBoundingClientRect(), pad = 4;
  hole.className = 'tour-hole';
  Object.assign(hole.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: r.height + pad * 2 + 'px' });
  if (narrow) return;
  const w = pop.offsetWidth, h = pop.offsetHeight, gap = 14;
  let top, left = Math.min(Math.max(r.left, 8), vw - w - 8);
  if (r.bottom + pad + gap + h <= vh - 8) top = r.bottom + pad + gap;
  else if (r.top - pad - gap - h >= 8) top = r.top - pad - gap - h;
  else if (r.right + pad + gap + w <= vw - 8) { left = r.right + pad + gap; top = Math.min(Math.max(r.top, 8), vh - h - 8); }
  else if (r.left - pad - gap - w >= 8) { left = r.left - pad - gap - w; top = Math.min(Math.max(r.top, 8), vh - h - 8); }
  else top = Math.max(8, vh - h - 8);
  pop.style.left = left + 'px'; pop.style.top = top + 'px';
}
let tourRaf = 0;
const tourSchedule = () => { if (!tourRaf) tourRaf = requestAnimationFrame(() => { tourRaf = 0; tourPlace(); }); };

// Show step i (moving in direction dir), skipping steps whose target is missing.
async function tourShow(i, dir) {
  const my = ++T.token;
  const stepsN = T.steps.length;
  for (; i >= 0 && i < stepsN; i += dir) {
    const step = T.steps[i];
    if (step.page) { await tourGoPage(step.page); if (!T || T.token !== my) return; }
    let el = null;
    if (step.sel) { el = await tourWaitTarget(step); if (!T || T.token !== my) return; if (!el) continue; }
    T.idx = i; T.target = el;
    tourRender(step, el);
    return;
  }
  if (dir > 0) tourStop('done');
  else if (T.idx < 0 || T.idx >= stepsN) tourStop('done');   // nothing earlier: stay on the current step
}

function tourRender(step, el) {
  const { pop, live } = T;
  const title = tval(step.title), text = tval(step.text), n = T.idx + 1, total = T.steps.length;
  $('#tourTitle', pop).textContent = title;
  $('#tourText', pop).textContent = text;
  $('#tourCount', pop).textContent = `Step ${n} of ${total}`;
  const key = tval(step.key);
  $('#tourKey', pop).hidden = !key; $('#tourKeyText', pop).textContent = key || '';
  $('#tourDots', pop).innerHTML = T.steps.map((_, k) => `<li class="${k < T.idx ? 'past' : k === T.idx ? 'now' : ''}"></li>`).join('');
  $('#tourBack', pop).hidden = n === 1;
  $('#tourNext', pop).textContent = n === total ? 'Finish' : 'Next';
  const act = $('#tourAction', pop);
  act.hidden = !step.action; act.textContent = step.action ? step.action.label : '';
  live.textContent = '';
  setTimeout(() => { if (T) live.textContent = `Step ${n} of ${total}: ${title}`; }, 30);
  if (T.key === 'main') tourWrite((s) => { s.main = n; });
  if (el && !el.closest('#top')) {
    const tall = el.getBoundingClientRect().height > innerHeight * 0.6;
    try { el.scrollIntoView({ block: innerWidth <= 640 || tall ? 'start' : 'center', behavior: 'instant' }); } catch (_) { el.scrollIntoView(); }
  }
  tourPlace();
  pop.focus({ preventScroll: true });
  tourSchedule();
}

function tourStep(dir) { if (T) tourShow(T.idx + dir, dir); }

function tourStop(how) {
  if (!T) return;
  const t = T; T = null;
  t.token++;
  document.removeEventListener('keydown', tourKeys, true);
  window.removeEventListener('resize', tourSchedule);
  window.removeEventListener('scroll', tourSchedule, true);
  window.removeEventListener('hashchange', tourHash);
  if (t.hole) t.hole.remove();
  if (t.pop) t.pop.remove();
  if (how === 'done' || how === 'skipped') {
    tourWrite((s) => { if (t.key === 'main') s.main = how; else s.pages[t.key] = how; });
  }
  let back = t.launcher && t.launcher.isConnected ? t.launcher : null;
  if (!back) back = $('#tourBtn');
  if (!back) { const h = $('#main h1'); if (h) { h.tabIndex = -1; back = h; } }
  if (back) back.focus({ preventScroll: true });
  const live = $('#tourLive');
  if (live) live.textContent = how === 'done' ? 'Tour finished' : 'Tour closed';
  tourDecorate();
}

async function tourStart(key = 'main', from = 0, launcher) {
  if (!S.data) return false;
  if (!TOURS[key]) return false;
  if (T) tourStop('closed');
  const steps = TOURS[key].steps;
  T = { key, steps, idx: -1, token: 0, nav: false, target: null, launcher: launcher || (document.activeElement !== document.body ? document.activeElement : null) };
  Object.assign(T, tourBuild());
  document.addEventListener('keydown', tourKeys, true);
  window.addEventListener('resize', tourSchedule);
  window.addEventListener('scroll', tourSchedule, true);
  window.addEventListener('hashchange', tourHash);
  const offer = $('.tour-offer'); if (offer) offer.remove();
  await tourShow(Math.max(0, Math.min(from, steps.length - 1)), 1);
  return true;
}

function tourKeys(e) {
  if (!T) return;
  const pop = T.pop, inPop = pop.contains(document.activeElement);
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); tourStop('closed'); return; }
  if (e.key === 'Tab' && inPop) {
    const f = $$('button', pop).filter((b) => !b.hidden && !b.disabled);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (document.activeElement === pop) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    return;
  }
  if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === pop) { e.preventDefault(); tourStep(1); return; }
  const t = e.target;
  const typing = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
  if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
    e.preventDefault(); tourStep(e.key === 'ArrowRight' ? 1 : -1);
  }
}

// The user moved to another page by themselves: carry on if it is where the next step lives, otherwise pause the tour.
function tourHash() {
  if (!T || T.nav) return;
  const name = tourHashName(), cur = T.steps[T.idx], next = T.steps[T.idx + 1];
  if (cur && (!cur.page || cur.page === name)) return;
  if (next && next.page === name) tourStep(1);
  else tourStop('closed');
}

// ---------- entry points, injected after every render ----------
function tourStatus() { const s = tourRead(); return { main: s.main, resume: typeof s.main === 'number' && s.main > 1 && s.main <= TOURS.main.steps.length ? s.main : 0 }; }

function tourDecorate() {
  const main = $('#main');
  if (!main || !S.data || !P() || $('.tour-link', main) || $('.tour-offer', main)) return;
  const name = tourHashName();
  const h1 = $('h1', main);
  if (!h1) return;
  let top = h1; while (top.parentElement && top.parentElement !== main) top = top.parentElement;
  if (top.parentElement !== main) return;
  const { main: st, resume } = tourStatus();
  const cpd = P().mode === 'cpd';
  if (name === 'home' && !T && !isMentor() && !cpd && (st === undefined || resume)) {
    const card = document.createElement('div');
    card.className = 'card tour-offer'; card.setAttribute('role', 'region'); card.setAttribute('aria-label', 'Guided tour');
    card.innerHTML = resume
      ? `<p><b>You stopped part way through the tour.</b></p><div class="row"><button type="button" class="primary" data-tour-start="resume">Continue the tour (step ${resume} of ${TOURS.main.steps.length})</button><button type="button" data-tour-start="main">Start again</button><button type="button" data-tour-dismiss>Not now</button></div>`
      : '<p><b>Want a two-minute walk-through?</b> It shows the first things to do, and you can stop at any time.</p><div class="row"><button type="button" class="primary" data-tour-start="main">Show me around</button><button type="button" data-tour-dismiss>Not now</button></div>';
    top.after(card);
  } else if (name === 'help') {
    const p = document.createElement('p'); p.className = 'tour-link';
    p.innerHTML = `<button type="button" data-tour-start="${cpd ? 'cpd' : 'main'}">Show me around</button>${resume && !cpd ? `<button type="button" data-tour-start="resume">Continue the tour (step ${resume} of ${TOURS.main.steps.length})</button>` : ''}`;
    top.after(p);
  } else if (TOUR_PAGES.includes(name) && TOURS[name]) {
    const p = document.createElement('p'); p.className = 'tour-link';
    p.innerHTML = '<button type="button" data-tour-start="page">Tour of this page</button>';
    top.after(p);
  }
  if (name === 'settings' && !$('.tour-reset', main)) {
    const p = document.createElement('p'); p.className = 'small muted tour-reset';
    p.innerHTML = '<button type="button" data-tour-reset>Reset tours</button> Offers the guided tours again, as if you had never seen them.';
    main.append(p);
  }
}

document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('#tourBtn, [data-tour-start], [data-tour-dismiss], [data-tour-reset]');
  if (!b) return;
  if (b.matches('[data-tour-dismiss]')) { tourWrite((s) => { s.main = 'skipped'; }); const c = $('.tour-offer'); if (c) c.remove(); const h = $('#main h1'); if (h) { h.tabIndex = -1; h.focus(); } return; }
  if (b.matches('[data-tour-reset]')) { tourWrite((s) => { delete s.main; s.pages = {}; }); toast('Tours reset: they will be offered again on Home'); return; }
  let key = b.dataset.tourStart || 'main', from = 0;
  if (b.id === 'tourBtn') key = P() && P().mode === 'cpd' ? 'cpd' : 'main';
  if (key === 'page') key = tourHashName();
  if (key === 'resume') { key = 'main'; from = Math.max(0, tourStatus().resume - 1); }
  tourStart(key, from, b.isConnected && !b.closest('.tour-offer') ? b : null);
});

new MutationObserver(() => {
  tourRenderTick++; tourLastMut = Date.now();
  setTimeout(() => { tourDecorate(); if (T && !T.nav) tourSchedule(); }, 40);
}).observe($('#main'), { childList: true });

// Test hook (works in the normal build too; harmless).
window.testTour = {
  start: (key = 'main', from = 0) => tourStart(key, from),
  next: () => { if (T) return tourShow(T.idx + 1, 1); },
  back: () => { if (T) return tourShow(T.idx - 1, -1); },
  stop: () => tourStop('closed'),
  reset: () => { tourWrite((s) => { delete s.main; s.pages = {}; }); },
  progress: () => tourRead(),
  steps: (key = 'main') => TOURS[key].steps.map((s) => tval(s.title)),
  state: () => (T ? {
    active: true, key: T.key, index: T.idx, total: T.steps.length, title: $('#tourTitle').textContent, text: $('#tourText').textContent,
    count: $('#tourCount').textContent, hasTarget: !!T.target, focusInPopover: T.pop.contains(document.activeElement), hash: location.hash,
  } : { active: false, activeElement: document.activeElement && (document.activeElement.id || document.activeElement.tagName) }),
};
