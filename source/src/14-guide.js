// Guidance for people new to the tool: the suggested folder layout (built from the real folder names of the
// current framework) and a worked example from an empty folder to a finished portfolio. Shown on the Help
// page and, from the start screen, in dialogs. The Word guide (make_howto.py) has the same text.

const EVIDENCE_KIND_HELP = {
  CO: 'emails, letters and meeting minutes about your work. Save emails as PDF.',
  MO: 'screenshots of models you built or checked.',
  MU: 'drawings and documents you marked up or checked.',
  DR: 'reports you wrote or helped to write.',
  CA: 'calculations you did or checked.',
  MM: 'spreadsheets, scripts and other tools you made or improved.',
  DD: 'drawings you produced or worked on.',
  CE: 'training certificates and course records.',
  PR: 'presentations and talks you gave.',
};

const folderBadge = (who) => `<span class="chip">${who === 'you' ? 'You make it' : who === 'both' ? 'Tool makes it, you fill it' : 'Tool makes and fills it'}</span>`;
const folderItem = (name, who, text, children = '') => `<li><span class="tree-name"><span aria-hidden="true">📁 </span><b>${esc(name)}</b></span> ${folderBadge(who)}<span class="tree-text">${text}</span>${children}</li>`;

// The folder tree as nested lists, so screen readers announce the levels.
function folderTreeHtml() {
  const cats = EVIDENCE_CATEGORIES.map((c) => {
    const p = categoryPrefix(c);
    return folderItem(c, 'both', `${p ? `Codes start <code>${p}-</code>: ` : ''}${EVIDENCE_KIND_HELP[p] || 'evidence of this kind.'}`);
  }).join('');
  return `<ul class="tree"><li><span class="tree-name"><span aria-hidden="true">☁️ </span><b>OneDrive</b></span>
    <ul>${folderItem('Portfolio - Your Name', 'you', 'Make this empty folder yourself, then pick it when you press <b>Start my portfolio</b>. The tool makes everything below.', `<ul>
      ${folderItem(FOLDERS.prr, 'both', 'Your reports (PRR): written in Pathway Pro (<b>Reports → Start</b>) or in Word (<b>New Word PRR from template…</b>). Your mentor comments in the Word files.')}
      ${folderItem(FOLDERS.matrix, 'tool', 'The Excel evidence matrix, written by <b>Evidence → Export Excel matrix</b>. Nothing to add yourself.')}
      ${folderItem(FOLDERS.evidence, 'both', 'Your evidence, one sub-folder per kind:', `<ul>${cats}</ul>`)}
      ${folderItem(FOLDERS.feedback, 'tool', 'The “Response to feedback” tables you export from <b>Feedback</b>.')}
      ${folderItem(FOLDERS.meetings, 'both', 'Teams transcripts you download, and the meeting notes the tool writes.')}
      ${folderItem(FOLDERS.cpd, 'tool', 'Certificates and handouts you attach to CPD activities, copied in by year.')}
      ${folderItem(FOLDERS.exports, 'tool', 'CPD records exported in Word or Excel.')}
      ${folderItem(DATA_DIR, 'tool', 'The tracker itself, with daily backups. Never edit or move these files.')}
    </ul>`)}</ul></li></ul>
    <p class="small muted">The numbers in the names only keep the folders in order. You can rename folders in <b>Settings → Framework</b>, but it is easiest to keep them as they are.</p>`;
}

const NAMING_HTML = `<h3>Naming evidence files</h3>
  <p>Start every file name with a code: the folder’s letters, a dash and a number. Then add what it is, the project and the subject.</p>
  <p><code>CO-00 - Email - Project - Subject.pdf</code></p>
  <ul>
    <li><code>CO-00 - Email - Riverside Car Park - Agreed bearing loads.pdf</code></li>
    <li><code>CA-03 - Calc - Riverside Car Park - Pile capacity check.pdf</code></li>
    <li><code>DD-12 - Drawing - Station Road - General arrangement rev C.pdf</code></li>
  </ul>
  <ul>
    <li>Each code is used once. Codes do not need to be in order, and gaps are fine.</li>
    <li>Use two digits (<code>CO-07</code>), or three once you pass 99.</li>
    <li>Forgot the code? <b>Evidence → Number files…</b> gives codes to files without one.</li>
    <li>You quote these codes in your report, for example <code>Evidence: CO-00, CA-03</code>.</li>
  </ul>`;

const FOLDER_GUIDE_HTML = () => `<h2 id="guideFolders">Suggested folder layout</h2>
  <p>Keep everything for your review in one OneDrive folder. This is the layout the tool uses. Only the top folder is yours to make.</p>
  ${folderTreeHtml()}${NAMING_HTML}`;

function walkthroughHtml() {
  const lv = LEVELS.map((l) => `<b>${LEVEL_SHORT[l]}</b> ${esc(LEVEL_NAME[l])}`).join(', ');
  const step = (title, body, see) => `<li><h3>${title}</h3>${body}<p class="see"><b>What you’ll see:</b> ${see}</p></li>`;
  return `<h2 id="guideSteps">Example: from an empty folder to a finished portfolio</h2>
  <p>A typical route. Steps 3 to 9 repeat as your portfolio grows.</p>
  <ol class="steps">
    ${step('Set up the folder', '<p>In OneDrive, make an empty folder called <b>Portfolio - Your Name</b>. Open Pathway Pro in Edge, press <b>Start my portfolio</b> and pick that folder. Type your name and choose your framework.</p>',
      `Edge asks to view and save files in the folder: allow it. The folders <b>${esc(FOLDERS.prr)}</b>, <b>${esc(FOLDERS.evidence)}</b> and the rest appear in OneDrive.`)}
    ${step('Share it with your mentor', `<p>In OneDrive, share the portfolio folder with your mentor as <b>Can view</b>, and <b>${esc(FOLDERS.prr)}</b> as <b>Can edit</b>. Your mentor then follows <b>Working with your mentor</b> on the Help page.</p>`,
      'once their folder is linked in Settings, their assessment shows on the <b>Mentor</b> page.')}
    ${step('Drop in your first evidence', `<p>Save three to five files into the right sub-folders of <b>${esc(FOLDERS.evidence)}</b>, each named with a code. Then open <b>Evidence</b> and press <b>Refresh</b>.</p>`,
      'each file listed with its code and title, and a count of files “not mapped yet”.')}
    ${step('Map each file', `<p>Click a file. For each ${LABEL.item} it shows, press <b>+ Add a ${LABEL.item}</b>, pick it and its level (${lv}), and say how the file contributes.</p>`,
      'a card for each one under the file, and the file no longer counts as “not mapped”.')}
    ${step(`Check ${esc(LABEL.attr)} for gaps`, `<p>Open <b>${esc(LABEL.attr)}</b>. Each ${LABEL.item} needs ${P() ? goal() : 3} pieces of evidence at each level. Plan what to collect next.</p>`,
      `a bar per ${LABEL.item}. <b>Home</b> lists the biggest gaps under <b>Next steps</b>.`)}
    ${step('Write your report', `<p>On <b>Reports</b>, press <b>Start</b> for an attribute to write it in Pathway Pro (or <b>New Word PRR from template…</b> for a Word file in <b>${esc(FOLDERS.prr)}</b>). Under each heading such as <b>2b – …</b>, add a line like <b>Evidence: CO-00, CA-03</b>. Put <b>{CO-00}</b> before you write about that file.</p>`,
      'the file listed on <b>Reports</b> with its sections.')}
    ${step('Run the Reports checks', '<p>Save the Word file, then press <b>Re-read Word files</b> on <b>Reports</b>. Fix what it flags in Word and check again.</p>',
      'warnings such as evidence listed but not written about, codes that do not exist, or very short write-ups.')}
    ${step('Get your mentor’s comments', '<p>Your mentor comments in your Word file as usual (Review → New Comment, or Track Changes).</p>',
      `each comment on the <b>Feedback</b> page, under its ${LABEL.item}.`)}
    ${step('Respond to feedback', `<p>Change your report, then on <b>Feedback</b> write what you changed and mark it <b>Done</b> or <b>Won’t change</b>. Export the <b>Response to feedback</b> table for your mentor.</p>`,
      `the open comment count on <b>Home</b> goes down. The table is saved in <b>${esc(FOLDERS.feedback)}</b>.`)}
    ${step('Meetings and CPD along the way', '<p>After each mentor meeting, import the Teams transcript on <b>Meetings</b> and tag lines as done, to do or teaching. Record training and learning on <b>CPD</b> as it happens.</p>',
      'to-dos listed as open actions on <b>Home</b>, and your CPD hours for the year.')}
    ${step('Final check before you submit', `<p>On <b>Home</b>, aim for full evidence slots, no Reports warnings and no open comments. Export the Excel matrix and your CPD record. Check your institution’s current submission rules.</p>`,
      `the files in <b>${esc(FOLDERS.matrix)}</b> and <b>${esc(FOLDERS.exports)}</b>, ready to attach.`)}
  </ol>`;
}

// Start screen: open either guide in a dialog.
function showGuide(which) {
  const html = which === 'steps' ? walkthroughHtml() : FOLDER_GUIDE_HTML();
  const d = dialog(`<div class="guide">${html}</div><div class="row" style="justify-content:flex-end;margin-top:1rem"><button class="primary">Close</button></div>`);
  d.setAttribute('aria-labelledby', which === 'steps' ? 'guideSteps' : 'guideFolders');
  d.classList.add('wide');
  $('button.primary', d).addEventListener('click', () => d.close());
  const h = $('h2', d);
  h.setAttribute('tabindex', '-1');
  h.focus();
}

// In-page jump on the Help page (the hash is used for routing, so plain #anchors cannot be used).
function jumpTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.setAttribute('tabindex', '-1');
  el.scrollIntoView({ block: 'start' });
  el.focus({ preventScroll: true });
}
