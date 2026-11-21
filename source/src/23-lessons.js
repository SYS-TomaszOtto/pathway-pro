// Lessons in Help (New Look plan, phase 4): three short step-by-step lessons that explain how the tool works (the
// guided tour shows where things are). Lessons are plain data, worded through LABEL so they read right for every framework.
// Layout: illustration and explanation side by side on desktop, stacked on a phone; the step numbers with Back and
// Next sit at the bottom, just above the tab bar. Keys: Left/Right/Home/End move between steps while focus is in the
// lesson. Step buttons use aria-current="step"; a polite live region reads "Step 3 of 5: title". Progress is kept per
// device in localStorage 'pathwayPro.lessons' (try/catch; blocked storage just means no saved place).
// Routes: #lesson/1..3 (Help tab); from the start screen, lessonDialog(1). Test hook: window.testLessons (test build).

var LESSON_KEY = 'pathwayPro.lessons';
var lessonMem = {};
const lw = { items: () => (LABEL.items || 'requirements').toLowerCase(), item: () => (LABEL.item || 'requirement').toLowerCase(), attr: () => LABEL.attr || 'Attributes' };
const levelNames = () => (LEVELS.length ? LEVELS.map((l) => LEVEL_NAME[l]).join(', ') : 'Knowledge, Experience, Ability');

var LESSONS = [
  { title: 'Set up your portfolio', learn: ['What one portfolio folder holds', 'How the framework sets your list', 'How to name evidence files'], steps: [
    { title: 'One folder for everything', art: 'folder', text: 'Make one empty folder in OneDrive and pick it when you press Start my portfolio. The tool makes every folder it needs inside it, and keeps its tracker there too.', key: 'The top folder is the only one you make yourself.' },
    { title: 'Choose your framework', art: 'grid', text: () => `The framework is the list you are assessed against: your ${lw.items()}, grouped, with the levels they need. Pick a built-in one, or edit it in Settings, Framework.`, key: 'You can change the framework later without losing your work.' },
    { title: 'A sub-folder per kind of evidence', art: 'folders', text: 'Inside the Evidence folder there is one sub-folder per kind: emails, calculations, drawings and so on. The letters at the end of its name start each file code in it.', key: () => `Put each file in the folder for its kind, not its ${lw.item()}.` },
    { title: 'Give every file a code', art: 'file', text: 'Start each file name with its code, then what it is: CO-07 - Email - Project - Subject.pdf. Forgot? Number files on the Evidence page adds codes for you.', key: 'Each code is used once. Gaps in the numbers are fine.' },
    { title: 'Refresh to pick files up', art: 'meter', text: 'After saving files in OneDrive, press Refresh on the Evidence page. New, moved and deleted files show up straight away.' },
  ] },
  { title: 'Map evidence', learn: () => [`Linking a file to ${lw.items()}`, 'Choosing a level', 'Reading the goal and the gaps'], steps: [
    { title: 'Open a file', art: 'file', text: 'On the Evidence page, click a row to open that file. You can preview it and add a title, date, project and notes.' },
    { title: () => `Tick the ${lw.items()} it shows`, art: 'grid', text: () => `Tick every ${lw.item()} the file is evidence for. One good piece of work often shows several.`, key: () => `One file can count towards several ${lw.items()}.` },
    { title: 'Choose the level', art: 'grid', text: () => `For each tick, pick how well the file shows it: ${levelNames()}. Pick the highest level it really proves.` },
    { title: 'The goal', art: 'meter', text: () => `Each level needs ${typeof goal === 'function' && P() ? goal() : 3} different files. Home shows how full every slot is, and the bars fill as you map.`, key: 'Different files count; the same file twice does not.' },
    { title: 'Find the gaps', art: 'grid', text: () => `The ${lw.attr()} page shows a small box per slot. Empty boxes are what to look for next.` },
  ] },
  { title: 'Reports and feedback', learn: ['Headings the checks can read', 'Listing evidence in your report', 'Answering your mentor'], steps: [
    { title: 'Write in Word', art: 'report', text: 'Write your report in Word and save it in the Reports folder. The tool reads it and never changes it. New PRR from template gives you a file with the headings in place.', key: 'Word stays your master copy.' },
    { title: 'A heading per section', art: 'report', text: () => `Start each section with the ${lw.item()} id and a dash, for example 2b – Contribute to the design. The checks use these headings to find each section.` },
    { title: 'List your evidence', art: 'file', text: 'Under each heading add a line such as Evidence: CO-14, DD-03, and write about each file it lists. The Reports page flags codes you list but never write about.' },
    { title: "Your mentor's comments", art: 'bubble', text: 'Your mentor comments in the Word file as usual. The Feedback page lists every comment and suggested change under its section.' },
    { title: 'Answer and send back', art: 'bubble', text: 'Write what you changed, mark each comment Done or Won\'t change, then export the Response to feedback table for your mentor.', key: 'Every comment gets an answer, even when you change nothing.' },
  ] },
];

// ---------- isometric line illustrations, drawn for Pathway Pro with currentColor and the theme tokens ----------
const ISO = (x, y, z) => [100 + (x - y) * 0.866, 96 + (x + y) * 0.5 - z].map((n) => Math.round(n * 10) / 10);
const pts = (a) => a.map((p) => p.join(',')).join(' ');
// A box from (x,y,z) with size w (x), d (y), h (z): top, left and right faces.
function isoBox(x, y, z, w, d, h, top = 'var(--panel)', cls = '') {
  const P = (a, b, c) => ISO(x + a, y + b, z + c);
  return `<g class="${cls}"><polygon points="${pts([P(0, d, 0), P(w, d, 0), P(w, d, h), P(0, d, h)])}" fill="var(--soft)"/>`
    + `<polygon points="${pts([P(w, 0, 0), P(w, d, 0), P(w, d, h), P(w, 0, h)])}" fill="var(--line)"/>`
    + `<polygon points="${pts([P(0, 0, h), P(w, 0, h), P(w, d, h), P(0, d, h)])}" fill="${top}"/></g>`;
}
const isoLine = (a, b, cls = '') => { const p = ISO(...a), q = ISO(...b); return `<line class="${cls}" x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}"/>`; };
const ART = {
  folder: () => isoBox(-40, -30, 0, 80, 60, 8, 'var(--part-soft)') + isoBox(-40, -30, 8, 30, 60, 4, 'var(--part-soft)', 'pop') + isoBox(-34, -24, 12, 66, 48, 2, 'var(--panel)', 'pop'),
  folders: () => [0, 1, 2].map((i) => isoBox(-50 + i * 34, -20, 0, 28, 44, 10 + i * 4, ['var(--part-soft)', 'var(--good-soft)', 'var(--accent-soft)'][i], i === 2 ? 'pop' : '')).join(''),
  file: () => isoBox(-20, -10, 0, 40, 6, 62) + isoLine([-14, -10, 50], [12, -10, 50]) + isoLine([-14, -10, 42], [14, -10, 42]) + isoLine([-14, -10, 34], [6, -10, 34])
    + isoBox(-30, -14, 52, 26, 2, 12, 'var(--accent-soft)', 'pop'),
  grid: () => [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => isoBox(-45 + c * 32, -45 + r * 32, 0, 26, 26, (r * 3 + c) % 4 === 0 ? 10 : 4, (r * 3 + c) % 4 === 0 ? 'var(--good-soft)' : 'var(--panel)', r === 1 && c === 1 ? 'pop' : ''))).join(''),
  report: () => isoBox(-24, -12, 0, 48, 6, 70) + [58, 50, 42, 30, 22].map((z, i) => isoLine([-18, -12, z], [i === 0 ? 4 : 18, -12, z], i === 0 ? 'thick' : '')).join('')
    + isoBox(10, -18, 8, 30, 4, 22, 'var(--keypoint-bg)', 'pop'),
  bubble: () => isoBox(-30, -10, 0, 60, 6, 40, 'var(--keypoint-bg)') + isoLine([-20, -10, 28], [18, -10, 28]) + isoLine([-20, -10, 18], [8, -10, 18])
    + `<polygon class="pop" points="${pts([ISO(-16, -10, 0), ISO(-6, -10, 0), ISO(-20, -10, -14)])}" fill="var(--keypoint-bg)"/>` + isoBox(6, 10, 0, 40, 6, 26, 'var(--good-soft)', 'pop'),
  meter: () => isoBox(-60, -8, 0, 120, 16, 10, 'var(--panel)') + isoBox(-60, -8, 10, 76, 16, 3, 'var(--accent-soft)', 'pop grow'),
};
const lessonArt = (key, cls = '') => `<svg class="lesson-art ${cls}" viewBox="20 20 160 130" role="img" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round">${(ART[key] || ART.folder)()}</svg>`;

// ---------- progress ----------
function lessonRead() { try { return JSON.parse(localStorage.getItem(LESSON_KEY)) || {}; } catch (_) { return lessonMem; } }
function lessonWrite(n, change) {
  const s = lessonRead();
  s[n] = Object.assign(s[n] || {}, change);
  lessonMem = s;
  try { localStorage.setItem(LESSON_KEY, JSON.stringify(s)); } catch (_) { /* blocked: kept for this session */ }
}

// ---------- the lesson component ----------
// Draws lesson n (1-based) into box; onDone runs after Finish. Returns { go(step) } for tests.
function lessonMount(box, n, onDone) {
  const L = LESSONS[n - 1];
  if (!L) { box.innerHTML = '<p>No such lesson.</p>'; return null; }
  const steps = L.steps, total = steps.length;
  let i = Math.min(Math.max(0, (lessonRead()[n] || {}).step || 0), total - 1);
  const learn = tval(L.learn);
  box.innerHTML = `<section class="lesson" aria-labelledby="lessonH">
    <p class="lesson-kicker">Lesson ${n} of ${LESSONS.length}</p><h1 id="lessonH">${esc(L.title)}</h1>
    <div class="lesson-learn"><b class="keypoint-label">You'll learn</b><ul>${learn.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>
    <div class="lesson-body"><div class="lesson-fig" id="lessonFig"></div>
      <div class="lesson-panel card"><h2 id="lessonStepTitle" tabindex="-1"></h2><p id="lessonText"></p><div class="keypoint" id="lessonKey" hidden><b class="keypoint-label">Key point</b><p id="lessonKeyText"></p></div></div></div>
    <nav class="lesson-nav" aria-label="Lesson steps">
      <button type="button" id="lessonBack">Back</button>
      <ol class="lesson-steps">${steps.map((s, k) => `<li><button type="button" class="lesson-step" data-step="${k}" aria-label="Step ${k + 1}: ${esc(tval(s.title))}">${k + 1}</button></li>`).join('')}</ol>
      <button type="button" class="primary" id="lessonNext">Next</button></nav>
    <div class="sr-only" id="lessonLive" role="status" aria-live="polite"></div></section>`;
  const live = $('#lessonLive', box);
  const show = (k, focus) => {
    i = Math.min(Math.max(0, k), total - 1);
    const s = steps[i], title = tval(s.title), key = tval(s.key);
    $('#lessonFig', box).innerHTML = lessonArt(s.art, 'play');
    $('#lessonStepTitle', box).textContent = `${i + 1}. ${title}`;
    $('#lessonText', box).textContent = tval(s.text);
    $('#lessonKey', box).hidden = !key; $('#lessonKeyText', box).textContent = key || '';
    $$('.lesson-step', box).forEach((b, k2) => { if (k2 === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); b.classList.toggle('past', k2 < i); });
    const back = $('#lessonBack', box);
    back.setAttribute('aria-disabled', String(i === 0));
    $('#lessonNext', box).textContent = i === total - 1 ? 'Finish' : 'Next';
    live.textContent = '';
    setTimeout(() => { live.textContent = `Step ${i + 1} of ${total}: ${title}`; }, 30);
    lessonWrite(n, { step: i });
    if (focus) { const f = focus === 'step' ? $(`.lesson-step[data-step="${i}"]`, box) : focus; if (f) f.focus({ preventScroll: true }); }
  };
  $('#lessonBack', box).addEventListener('click', (e) => { if (i > 0) show(i - 1, i - 1 === 0 ? 'step' : e.currentTarget); });
  $('#lessonNext', box).addEventListener('click', (e) => {
    if (i < total - 1) return show(i + 1, e.currentTarget);
    lessonWrite(n, { step: 0, done: true });
    toast(`Lesson ${n} done.${n < LESSONS.length ? ' The next one is in Help.' : ''}`);
    if (onDone) onDone();
  });
  $$('.lesson-step', box).forEach((b) => b.addEventListener('click', () => show(+b.dataset.step, b)));
  $('.lesson', box).addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select')) return;
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: total - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    show(to, 'step');
  });
  show(i);
  return { go: (k) => show(k, 'step'), index: () => i };
}

VIEWS.lesson = async (arg) => '<div id="lessonBox"></div>';
VIEWS.lesson.after = (arg) => { lessonMount($('#lessonBox'), +arg || 1, () => { location.hash = '#help'; }); };

// The Lessons card at the top of Help.
function lessonsCardHtml() {
  const s = lessonRead();
  return `<div class="card wide lessons-card"><h2>Lessons</h2><p>Three short lessons on how the tool works. The guided tour (<b>Show me around</b>) shows where things are.</p>
    <ol class="lesson-list">${LESSONS.map((L, k) => { const st = s[k + 1] || {}; return `<li>${lessonArt(L.steps[0].art, 'mini')}<div><a href="#lesson/${k + 1}"><b>${esc(L.title)}</b></a> <span class="chip ${st.done ? 'good' : st.step ? 'part' : ''}">${st.done ? 'done' : st.step ? 'step ' + (st.step + 1) + ' of ' + L.steps.length : plural(L.steps.length, 'step')}</span></div></li>`; }).join('')}</ol></div>`;
}

// From the start screen (no portfolio open yet): lesson 1 in a dialog.
function lessonDialog(n = 1) {
  const d = dialog('<div id="lessonDlg"></div><div class="row" style="justify-content:flex-end;margin-top:.6rem"><button type="button" id="lessonClose">Close</button></div>');
  d.classList.add('wide', 'lesson-dialog');
  d.setAttribute('aria-labelledby', 'lessonH');
  lessonMount($('#lessonDlg', d), n, () => d.close());
  $('#lessonClose', d).addEventListener('click', () => d.close());
  const h = $('#lessonH', d); h.tabIndex = -1; h.focus();
  return d;
}
