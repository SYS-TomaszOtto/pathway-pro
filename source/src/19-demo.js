// "Look around with sample data": an in-memory demo portfolio. No folder is picked and nothing is written anywhere.
// While S.demo is true every writer is blocked (save, daily backup, writeFile, folder picking, Add files, restore):
// they check S.demo or call demoBlocked() (04-store.js, 05-framework.js, 06-model.js, 12-mentor-settings.js, 16-add.js).
// The sample is plain data in the real shapes (see DESIGN.md). The reports and mentor comments are made up in S.prr,
// the evidence files exist only as entries in S.files, so previews show a "sample file" message.

// One helper for every blocked write: says so and tells the caller to stop.
function demoBlocked() {
  if (!S.demo) return false;
  toast('Not available with sample data');
  return true;
}

const DEMO_NAME = 'Sample Apprentice';
const demoDay = (n) => localIso(new Date(Date.now() - n * 864e5)).slice(0, 10);

// A folder handle that has nothing in it and refuses everything, so code that expects a folder fails quietly.
function demoFolder() {
  const none = async () => { throw new DOMException('Not found', 'NotFoundError'); };
  return { kind: 'directory', name: 'Sample data (no folder)', getDirectoryHandle: none, getFileHandle: none, removeEntry: none,
    entries: async function* () { /* empty */ }, queryPermission: async () => 'denied', requestPermission: async () => 'denied', isSameEntry: async () => false };
}

// Evidence: [folder index, file name, size KB, days ago, project, notes, maps [[sub, level letter, ksbs]]]
const DEMO_EVIDENCE = [
  [0, 'CO-01 Email to contractor about drainage query.pdf', 120, 160, 'Harbour Road drainage', 'Asked the contractor to confirm the invert levels before the pipes were laid.',
    [['8a', 'E'], ['8b', 'K'], ['3c', 'K']]],
  [0, 'CO-02 Site photos sent to the client.pdf', 2400, 40, 'Harbour Road drainage', '', []],
  [1, 'MO-01 Ground model snapshot.png', 640, 150, 'Harbour Road drainage', 'Section through the trial pits used to pick the design groundwater level.',
    [['1a', 'K'], ['2a', 'K', ['K1']]]],
  [2, 'MU-01 Marked-up temporary works drawing.pdf', 380, 90, 'Harbour Road drainage', 'My mark-ups on the trench support drawing, agreed with the site team.',
    [['6a', 'E'], ['6b', 'E'], ['6c', 'K']]],
  [3, 'DR-01 Drainage strategy report.docx', 900, 120, 'Harbour Road drainage', 'I wrote sections 3 and 4 and checked the rest.',
    [['2b', 'A', ['S4']], ['2b', 'E'], ['2a', 'E'], ['2c', 'E'], ['7b', 'K']]],
  [3, 'DR-02 Sustainability appraisal summary.docx', 410, 70, 'Car park extension', 'Compared the options by embodied carbon and whole-life cost.',
    [['7a', 'K'], ['7b', 'K'], ['2b', 'K']]],
  [4, 'CA-01 Retaining wall stability calculation.xlsx', 150, 130, 'Car park extension', 'Sliding, overturning and bearing checks, reviewed by my supervisor.',
    [['1b', 'A', ['K3']], ['2a', 'A'], ['2b', 'E', ['S4']], ['2b', 'K']]],
  [4, 'CA-02 Pipe sizing check.xlsx', 90, 110, 'Harbour Road drainage', 'Checked the design flows and pipe sizes against the design standard.',
    [['1b', 'E'], ['2a', 'E'], ['2b', 'A'], ['2b', 'K'], ['1b', 'K']]],
  [5, 'MM-01 Quantities and cost tracker.xlsx', 70, 80, 'Car park extension', 'Kept the cost plan up to date for the team.',
    [['5a', 'E', ['S8']], ['3b', 'K']]],
  [6, 'DD-01 Drainage general arrangement drawing.pdf', 520, 100, 'Harbour Road drainage', 'Drew the pipe layout and long sections in the CAD model.',
    [['2b', 'E'], ['2b', 'A'], ['2c', 'E']]],
  [7, 'CE-01 CDM awareness course certificate.pdf', 60, 200, '', '',
    [['6a', 'K'], ['6c', 'K'], ['9b', 'K']]],
  [7, 'CE-02 Site safety passport.pdf', 55, 170, '', '',
    [['6a', 'K'], ['6c', 'E']]],
  [8, 'PR-01 Toolbox talk on excavation safety.pptx', 1800, 55, 'Harbour Road drainage', 'Gave this talk to eight site operatives and answered their questions.',
    [['8a', 'A', ['K8']], ['8b', 'E', ['S10']], ['6c', 'E']]],
];
const DEMO_LEVEL = { K: 'knowledge', E: 'experience', A: 'ability' };

function demoPortfolio() {
  const folder = (i) => `${FOLDERS.evidence}/${EVIDENCE_CATEGORIES[i]}`;
  const evidence = {};
  const files = [];
  for (const [fi, name, kb, ago, project, notes, maps] of DEMO_EVIDENCE) {
    const path = `${folder(fi)}/${name}`;
    const mtime = Date.now() - ago * 864e5;
    files.push({ path, name, size: kb * 1024, mtime, handle: null });
    evidence[path] = { code: codeFromName(name), title: titleFromName(name), date: demoDay(ago), project, notes, size: kb * 1024, mtime,
      maps: maps.map(([sub, lv, ksbs]) => ({ sub, level: DEMO_LEVEL[lv], ksbs: ksbs || [], note: '' })) };
  }
  const d = newPortfolio(DEMO_NAME, 'ice');
  d.created = demoDay(220) + 'T09:00:00';
  d.profile = { jobRole: 'Graduate civil engineer (apprentice)', responsibilities: 'Drainage and earthworks design, site visits, cost tracking.', sector: 'Civil engineering consultancy' };
  d.settings = { ...d.settings, cpdTarget: 30, keyDate: demoDay(-60), keyDateLabel: 'Review meeting' };
  d.evidence = evidence;
  const obj = d.cpd.objectives[0];
  const plan = { id: 'demo-obj-1', ref: 'DAP1', title: 'Get better at drainage design', date: demoDay(200), status: 'active', area: 'Drainage design', learn: 'Design standards for surface water drainage.',
    action: 'Complete a course and design a small system with supervision.', resources: 'Company training budget, my supervisor.', evaluate: 'Supervisor review of my next design.', deadline: demoDay(-90), notes: '' };
  d.cpd.objectives = [plan, obj];
  const act = (id, ago, days, hours, details, type, learning, benefits, objective) => ({ id, ref: '', objective, details, theme: '', type, dateFrom: demoDay(ago), dateTo: demoDay(ago - days + 1), hours,
    learning, benefits, helped: 'I could do the next task with less supervision.', future: 'I will use it on my next design.', dap: '', documents: [], subs: [] });
  d.cpd.activities = [
    act('demo-act-1', 190, 1, 7, 'Surface water drainage design course', 'Course', 'Sizing pipes and checking flood routes.', 'I understood the design checks I was doing.', plan.id),
    act('demo-act-2', 120, 1, 3, 'Lunch and learn: temporary works', 'Seminar', 'What a temporary works coordinator checks.', 'Better mark-ups on site.', obj.id),
    act('demo-act-3', 75, 1, 4, 'Site visit to a pumping station', 'Site visit', 'How the pumps are controlled.', 'See what my design looks like when built.', plan.id),
    act('demo-act-4', 30, 1, 2, 'Reading: sustainable drainage guidance', 'Reading', 'Options to slow and clean runoff.', 'More ideas for the report.', plan.id),
    act('demo-act-5', 12, 1, '', 'Webinar on carbon in design', 'Webinar', '', '', obj.id),
  ];
  const lines = [
    ['00:00:12', 'Sample Mentor', 'Welcome back. Let us start with the drainage report.'],
    ['00:00:40', DEMO_NAME, 'I finished sections three and four and the supervisor has checked the pipe sizing.'],
    ['00:01:30', 'Sample Mentor', 'Good. I think the pipe sizing check is strong evidence for 2b at ability level.'],
    ['00:02:15', DEMO_NAME, 'I gave the toolbox talk on excavation safety to the site team last week.'],
    ['00:03:05', 'Sample Mentor', 'Please write that up and map it. Also send me the cost tracker so I can look at it.'],
    ['00:04:00', 'Sample Mentor', 'Next time we will go through the comments on your report.'],
  ];
  const tags = ['', 'done', 'teaching', 'done', 'todo', ''];
  d.meetings = [
    { id: 'demo-m-1', date: demoDay(21), title: 'Mentor meeting: drainage report', attendees: `${DEMO_NAME}, Sample Mentor`, source: '',
      lines: lines.map(([time, speaker, text], i) => ({ time, speaker, text, tag: tags[i] })),
      items: [
        { id: 'demo-i-1', kind: 'done', text: 'Finished sections 3 and 4 of the drainage report', who: DEMO_NAME, time: lines[1][0], line: 1, sub: '2b', due: '', status: 'open', evidence: 'DR-01' },
        { id: 'demo-i-2', kind: 'teaching', text: 'Pipe sizing check is strong evidence for 2b at ability level', who: 'Sample Mentor', time: lines[2][0], line: 2, sub: '2b', due: '', status: 'open', evidence: 'CA-02' },
        { id: 'demo-i-3', kind: 'done', text: 'Gave a toolbox talk on excavation safety', who: DEMO_NAME, time: lines[3][0], line: 3, sub: '8a', due: '', status: 'open', evidence: 'PR-01' },
        { id: 'demo-i-4', kind: 'todo', text: 'Send the cost tracker to my mentor', who: 'Sample Mentor', time: lines[4][0], line: 4, sub: '5a', due: demoDay(-7), status: 'open', evidence: 'MM-01' },
      ] },
    { id: 'demo-m-2', date: demoDay(70), title: 'Mentor meeting: planning the year', attendees: `${DEMO_NAME}, Sample Mentor`, source: '',
      lines: [
        { time: '00:00:20', speaker: 'Sample Mentor', text: 'Let us agree what you want to cover before the review.', tag: '' },
        { time: '00:01:10', speaker: DEMO_NAME, text: 'I will book the CDM course and ask to join a site safety walk.', tag: 'todo' },
      ],
      items: [{ id: 'demo-i-5', kind: 'todo', text: 'Book the CDM course and join a site safety walk', who: DEMO_NAME, time: '00:01:10', line: 1, sub: '6a', due: demoDay(50), status: 'done', evidence: 'CE-01' }] },
  ];
  return { data: d, files };
}

function demoMentor() {
  const m = newMentor('Sample Mentor', DEMO_NAME);
  m.created = demoDay(200) + 'T09:00:00';
  m.saved = demoDay(5) + 'T16:30:00';
  m.subs = {
    '2b': { status: 'met', comment: 'Good range of design evidence at every level.', date: demoDay(5) },
    '1b': { status: 'developing', comment: 'Needs one more calculation at experience level.', date: demoDay(5) },
    '6a': { status: 'developing', comment: 'Add something from your own site work.', date: demoDay(5) },
    '8a': { status: 'met', comment: 'The toolbox talk is a good example.', date: demoDay(5) },
    '7a': { status: 'notyet', comment: 'Nothing beyond knowledge yet.', date: demoDay(5) },
  };
  m.actions = [{ id: 'demo-ma-1', text: 'Write up the toolbox talk for 8a', due: demoDay(-14), status: 'open' }];
  return m;
}

// Made-up Word reports in S.prr, parsed by the real parser, with mentor comments (two open, one resolved).
function demoPrr() {
  const long = (s) => s + ' I checked the figures against the design standard, compared two options and recorded why I chose the one I did. My supervisor reviewed the result and I changed the layout after their comments.';
  const p = (text, style = '') => ({ text, style });
  const paras = [
    p('Professional Review Report: Sample Apprentice', 'Title'),
    p('1b – Solve engineering problems using a sound theoretical approach', 'Heading2'),
    p('Evidence: CA-01, CA-02'),
    p(long('{CA-01} I checked the retaining wall for sliding, overturning and bearing.')),
    p(long('{CA-02} I sized the drainage pipes for the design flows.')),
    p('2b – Contribute to the design and development of engineering solutions', 'Heading2'),
    p('Evidence: DR-01, CA-02, DR-02'),
    p(long('{DR-01} I wrote sections 3 and 4 of the drainage strategy report.')),
    p(long('{CA-02} I checked the pipe sizes and the flood route.')),
    p('6a – Demonstrate a sound knowledge of legislation, hazards and safe systems', 'Heading2'),
    p('Evidence: MU-01, CE-01'),
    p('{MU-01} …'),
    p('8a – Communicate well with others at all levels', 'Heading2'),
    p('Evidence: CO-01, PR-01'),
    p(long('{PR-01} I gave a toolbox talk on excavation safety.')),
    p('9b – Plan, carry out and record Continuing Professional Development', 'Heading2'),
  ];
  const doc = parsePrr(paras);
  const path = `${FOLDERS.prr}/Sample Apprentice PRR draft 1.docx`;
  const c = (n, sub, ago, text, anchor, resolved = false, replies = []) => ({ kind: 'comment', key: 'demo-c' + n, author: 'Sample Mentor', date: demoDay(ago) + 'T10:00:00', text, anchor, sub, file: path, resolved, replies });
  return { [path]: { path, name: 'Sample Apprentice PRR draft 1.docx', mtime: Date.now() - 6 * 864e5, doc, edits: [], error: null, comments: [
    c(1, '2b', 6, 'Say which parts of the design were yours and which were your supervisor\'s.', 'I wrote sections 3 and 4 of the drainage strategy report.'),
    c(2, '6a', 6, 'This section is only a placeholder. Describe what you did on site and which hazards you controlled.', '{MU-01} …'),
    c(3, '1b', 20, 'Please state the design standard you used for the checks.', 'I checked the retaining wall for sliding, overturning and bearing.', true, [{ author: DEMO_NAME, date: demoDay(18) + 'T09:00:00', text: 'Added the standard to the first paragraph.' }]),
  ] } };
}

// ---------- starting, leaving, and the banner ----------
async function startDemo() {
  const { data, files } = demoPortfolio();
  S.demo = true;
  S.own = demoFolder();
  S.other = null;
  S.warnings = [];
  S.data = upgrade(data);
  S.otherData = upgrade(demoMentor());
  S.files = files;
  S.dirty = false;
  applyFramework(null);   // also installs the sample reports (S.prr)
  undoReset();
  location.hash = '#home';
  await render();
  toast('Sample data: nothing you do here is saved');
}

// Back to the start screen. Synchronous, so "Start my own portfolio" can open the folder picker straight away.
function leaveDemo() {
  S.demo = false;
  S.data = S.otherData = S.own = S.other = null;
  S.files = []; S.warnings = []; S.dirty = false; S.loadedStamp = 0;
  applyFramework(null);
  S.prr = {};
  undoReset();
  closePreview();
  history.replaceState(null, '', location.pathname + location.search);
  document.title = 'Pathway Pro';
  welcome();
}

function demoBanner() {
  $('#top').insertAdjacentHTML('beforeend', `<div class="demo-banner" role="region" aria-label="Sample data notice">
    <span><b>Sample data:</b> nothing here is saved.</span>
    <span class="row"><button class="primary small" id="demoStart">Start my own portfolio</button><button class="small" id="demoLeave">Leave the sample</button></span></div>`);
  $('#demoLeave').addEventListener('click', leaveDemo);
  $('#demoStart').addEventListener('click', () => { leaveDemo(); setupPortfolio('ice'); });
}

function demoPreviewHtml(path) {
  return `<div class="empty demo-sample-file" style="margin:20px"><b>Sample file</b><br>This file is made up for the sample, so there is nothing to show.
    In your own portfolio, clicking a file shows it here.<div class="small muted">${esc(path.split('/').pop())}</div></div>`;
}
