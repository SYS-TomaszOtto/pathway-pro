// The framework: what the person is being assessed against. Levels (such as Knowledge / Experience / Ability),
// groups of attributes, attributes, requirements (such as KSBs), the folder names and the evidence folders.
// ICE IEng is built in; anyone can edit it or write their own for another institution, level or field.
// It is stored in the portfolio data (framework) and applied here, so the rest of the tool just reads the
// globals below.

let LEVELS = [], LEVEL_SHORT = {}, LEVEL_NAME = {}, LEVEL_HELP = {};
let SUBS = [], SUB = {}, GROUPS = [], KSBS = [], KSB = {};
let HEADING_RE = /$^/, SUB_LC = {};
let LABEL = { attr: 'Attributes', ksb: 'KSBs' };
let FRAMEWORK = null;
const DEFAULT_FOLDERS = { ...FOLDERS };
const DEFAULT_CATEGORIES = EVIDENCE_CATEGORIES.slice();

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const clone = (o) => JSON.parse(JSON.stringify(o));

const ICE_FRAMEWORK = {
  name: 'ICE IEng (apprenticeship)',
  source: 'ICE IEng sub-attributes and the apprenticeship standard KSBs (Institute for Apprenticeships and Technical Education)',
  labels: { attr: 'Attributes', ksb: 'KSBs' },
  levels: [
    { id: 'knowledge', short: 'K', name: 'Knowledge', help: 'knows and understands it (training, CPD, reading), not yet shown applied on real work.' },
    { id: 'experience', short: 'E', name: 'Experience', help: 'applied it on real work, with guidance, as part of a team, or with a senior making the key decisions.' },
    { id: 'ability', short: 'A', name: 'Ability', help: 'did it themselves and took responsibility: own judgement and decisions, led the task, or guided others.' },
  ],
  groups: [...new Map(REF.attributes.map((a) => [String(a.group), a.group_title])).entries()].map(([id, title]) => ({ id, title })),
  attributes: REF.attributes.map((a) => ({ id: a.id, group: String(a.group), text: a.text })),
  ksbs: REF.ksbs.map((k) => ({ id: k.id, kind: k.kind, text: k.text, attributes: k.attributes.slice() })),
  folders: { ...DEFAULT_FOLDERS },
  evidenceFolders: DEFAULT_CATEGORIES.slice(),
};

const BLANK_FRAMEWORK = {
  name: 'My framework',
  labels: { attr: 'Requirements', ksb: 'Standards' },
  levels: [{ id: 'evidence', short: 'E', name: 'Evidence', help: 'a piece of evidence that shows this requirement is met.' }],
  groups: [{ id: '1', title: 'First group (rename me)' }],
  attributes: [{ id: '1a', group: '1', text: 'First requirement (replace with your own)' }],
  ksbs: [],
  folders: { ...DEFAULT_FOLDERS },
  evidenceFolders: ['0 - Documents - DO', '1 - Records - RE'],
};

// IStructE core objectives, read from the Institution's IPD guidance (Chartered 2026, Incorporated 2025, Technician 2026).
// Each objective has a minimum standard; the bullets under "must demonstrate" become the standards list.
function ipdFramework(key, name, level) {
  const objs = IPD_DATA[key];
  const lv = { Appreciation: 'appreciation', Knowledge: 'knowledge', Experience: 'experience', Ability: 'ability' };
  const sentence = (s) => s.charAt(0) + s.slice(1).toLowerCase();
  const levels = [
    ...(key === 'tm' ? [{ id: 'appreciation', short: 'A', name: 'Appreciation', help: 'a general appreciation of the subject, and how it relates to other subjects.' }] : []),
    { id: 'knowledge', short: 'K', name: 'Knowledge', help: 'a knowledge and understanding of the subject and its application.' },
    { id: 'experience', short: 'E', name: 'Experience', help: 'the subject performed independently or under supervision.' },
    { id: 'ability', short: 'B', name: 'Ability', help: 'performed without supervision and competent to advise others.' },
  ];
  return {
    name, source: 'Institution of Structural Engineers, IPD Guidance for this grade', goal: 1, labels: { attr: 'Core objectives', ksb: 'Must demonstrate' }, levels,
    groups: [{ id: 'CO', title: 'Core Objectives' }],
    attributes: objs.map((o) => ({ id: o.num, group: 'CO', text: `${sentence(o.title)}: ${o.intro.replace(/^This objective is intended to /, '')}`, min: lv[o.level] || '' })),
    ksbs: objs.flatMap((o) => o.must.map((m, i) => ({ id: `${o.num}.${i + 1}`, kind: `Objective ${o.num}`, text: m, attributes: [o.num] }))),
    folders: { ...DEFAULT_FOLDERS },
    evidenceFolders: ['0 - Portfolio evidence - PE', '1 - CPD records - CP', '2 - IPD reports - IP'],
  };
}
// Engineering Council UK-SPEC competences A to E, per registration level (read from the published standard).
function ukspecFramework(key) {
  const d = UKSPEC_DATA[key];
  return {
    name: d.name, source: d.source, goal: 1, labels: { attr: 'Competences', ksb: 'Standards' },
    levels: [{ id: 'evidence', short: 'E', name: 'Evidence', help: 'a piece of evidence that shows this competence, for example a report, drawing, calculation, email or record of your own work.' }],
    groups: Object.entries(UKSPEC_DATA._titles).map(([id, title]) => ({ id, title: `${id}. ${title}` })),
    attributes: d.attrs.map(([id, group, text]) => ({ id, group, text })),
    ksbs: [],
    folders: { ...DEFAULT_FOLDERS },
    evidenceFolders: ['0 - Project work - PW', '1 - Reports and calculations - RC', '2 - Drawings and models - DM', '3 - Correspondence and meetings - CO', '4 - Certificates and CPD - CE'],
  };
}
// Other institutions' published competence lists (one preset each), read from their guidance documents.
function instFramework(key) {
  const d = INST_DATA[key];
  const custom = d.levels && d.levels.length;
  const levels = custom ? d.levels.map(([short, name, help]) => ({ id: slug(name), short, name, help })) : [{ id: 'evidence', short: 'E', name: 'Evidence', help: 'a piece of evidence that shows this requirement is met, for example a report, drawing, calculation, email or record of your own work.' }];
  return {
    name: d.name, source: d.source, goal: 1, labels: { attr: 'Requirements', ksb: 'Standards' }, levels,
    groups: d.groups.map(([id, title]) => ({ id, title })),
    attributes: d.attrs.map(([id, group, text, min]) => ({ id, group, text, min: custom && min ? (levels.find((l) => l.short === min) || {}).id || '' : '' })),
    ksbs: [],
    folders: { ...DEFAULT_FOLDERS },
    evidenceFolders: ['0 - Project work - PW', '1 - Reports and calculations - RC', '2 - Drawings and models - DM', '3 - Correspondence and meetings - CO', '4 - Certificates and CPD - CE'],
  };
}
const INST_ABOUT = 'Read from the institution’s published guidance. Evidence is mapped to each item; edit anything that is wrong or out of date.';
const UKSPEC_ABOUT = 'Competences A1 to E5 as published by the Engineering Council. Many institutions assess against these, usually with their own examples. Evidence is mapped to each competence.';
const IPD_ABOUT = 'Core objectives and the minimum standard for each, read from the Institution’s IPD guidance. Evidence at the minimum level or above counts. Check wording against the current guidance.';

const PRESETS = {
  ice: { group: 'ICE', name: 'ICE IEng (apprenticeship)', about: 'The Institution of Civil Engineers IEng sub-attributes and apprenticeship KSBs, with Knowledge / Experience / Ability levels.', fw: ICE_FRAMEWORK },
  'ukspec4-ceng': { group: 'Engineering Council UK-SPEC (used by many institutions)', name: 'Chartered Engineer (CEng), UK-SPEC 4th edition', about: UKSPEC_ABOUT, fw: ukspecFramework('ukspec4-ceng') },
  'ukspec4-ieng': { group: 'Engineering Council UK-SPEC (used by many institutions)', name: 'Incorporated Engineer (IEng), UK-SPEC 4th edition', about: UKSPEC_ABOUT, fw: ukspecFramework('ukspec4-ieng') },
  'ukspec4-engtech': { group: 'Engineering Council UK-SPEC (used by many institutions)', name: 'Engineering Technician (EngTech), UK-SPEC 4th edition', about: UKSPEC_ABOUT, fw: ukspecFramework('ukspec4-engtech') },
  'ukspec3-ceng': { group: 'Engineering Council UK-SPEC (used by many institutions)', name: 'Chartered Engineer (CEng), older UK-SPEC 3rd edition wording', about: 'The 3rd edition wording, still used on some application forms (for example SOE, IET and IMechE forms). ' + UKSPEC_ABOUT, fw: ukspecFramework('ukspec3-ceng') },
  'ukspec3-ieng': { group: 'Engineering Council UK-SPEC (used by many institutions)', name: 'Incorporated Engineer (IEng), older UK-SPEC 3rd edition wording', about: 'The 3rd edition wording, still used on some application forms (for example SOE). ' + UKSPEC_ABOUT, fw: ukspecFramework('ukspec3-ieng') },
  'istructe-cm': { group: 'IStructE', name: 'IStructE Chartered Member (MIStructE): 10 core objectives', about: IPD_ABOUT, fw: ipdFramework('cm', 'IStructE Chartered Member (MIStructE)') },
  'istructe-im': { group: 'IStructE', name: 'IStructE Incorporated Member (IMIStructE): 10 core objectives', about: IPD_ABOUT, fw: ipdFramework('im', 'IStructE Incorporated Member (IMIStructE)') },
  'istructe-tm': { group: 'IStructE', name: 'IStructE Technician Member (TIStructE): 11 core objectives', about: IPD_ABOUT, fw: ipdFramework('tm', 'IStructE Technician Member (TIStructE)') },
  'ice-ipr': { group: 'ICE', name: 'Incorporated Professional Review (IEng MICE): the seven areas of attributes', about: INST_ABOUT + ' The current ICE professional review attributes (not the apprenticeship list above).', fw: instFramework('ice-ipr') },
  'ice-cpr': { group: 'ICE', name: 'Chartered Professional Review (CEng MICE): the seven areas of attributes', about: INST_ABOUT + ' Each Chartered item is the Incorporated statement plus the extra "And …" requirement.', fw: instFramework('ice-cpr') },
  'ice-tpr': { group: 'ICE', name: 'Technician Professional Review (EngTech MICE): the seven areas of attributes', about: INST_ABOUT + ' From the Technician Professional Review Guidance (July 2024).', fw: instFramework('ice-tpr') },
  'icheme': { group: 'IChemE', name: 'Chartered Member: IPD submission sections A to D', about: INST_ABOUT, fw: instFramework('icheme') },
  'cibse-mcibse': { group: 'CIBSE', name: 'Member (MCIBSE): competence criteria A1 to E5', about: INST_ABOUT, fw: instFramework('cibse-mcibse') },
  'cibse-acibse': { group: 'CIBSE', name: 'Associate (ACIBSE): competence criteria A1 to E5', about: INST_ABOUT, fw: instFramework('cibse-acibse') },
  'imeche-ceng': { group: 'IMechE', name: 'Chartered Engineer (CEng): application questions (2019 form)', about: INST_ABOUT, fw: instFramework('imeche-ceng') },
  'imeche-ieng': { group: 'IMechE', name: 'Incorporated Engineer (IEng): application questions (2019 form)', about: INST_ABOUT, fw: instFramework('imeche-ieng') },
  'rina-ceng': { group: 'RINA', name: 'Chartered Engineer (CEng): experiential learning outcomes', about: INST_ABOUT, fw: instFramework('rina-ceng') },
  'rina-ieng': { group: 'RINA', name: 'Incorporated Engineer (IEng): experiential learning outcomes', about: INST_ABOUT, fw: instFramework('rina-ieng') },
  'rittech': { group: 'IHE', name: 'Registered IT Technician (RITTech): competencies P1 to P4', about: INST_ABOUT, fw: instFramework('rittech') },
  'ciht-tpp': { group: 'CIHT', name: 'Transport Planning Professional (TPP): units with minimum levels', about: INST_ABOUT + ' ' + INST_DATA['ciht-tpp'].note, fw: instFramework('ciht-tpp') },
  blank: { group: 'Your own', name: 'Start my own (blank)', about: 'One level, one requirement and two evidence folders. You write the rest in Settings → Framework: paste your requirements from a spreadsheet or document.', fw: BLANK_FRAMEWORK },
};


function applyFramework(fw) {
  fw = fw || ICE_FRAMEWORK;
  FRAMEWORK = fw;
  LEVELS = fw.levels.map((l) => l.id);
  LEVEL_SHORT = Object.fromEntries(fw.levels.map((l) => [l.id, l.short]));
  LEVEL_NAME = Object.fromEntries(fw.levels.map((l) => [l.id, l.name]));
  LEVEL_HELP = Object.fromEntries(fw.levels.map((l) => [l.id, `${l.name}: ${l.help}`]));
  const title = Object.fromEntries(fw.groups.map((g) => [String(g.id), g.title]));
  SUBS = fw.attributes.map((a) => ({ id: a.id, group: String(a.group), group_title: title[String(a.group)] || String(a.group), text: a.text, min: a.min || '' }));
  SUB = Object.fromEntries(SUBS.map((a) => [a.id, a]));
  SUB_LC = Object.fromEntries(SUBS.map((a) => [a.id.toLowerCase(), a.id]));
  const used = new Set(SUBS.map((a) => a.group));
  GROUPS = fw.groups.filter((g) => used.has(String(g.id))).map((g) => ({ group: String(g.id), title: g.title }));
  KSBS = (fw.ksbs || []).map((k) => ({ id: k.id, kind: k.kind || '', text: k.text, attributes: k.attributes || [] }));
  KSB = Object.fromEntries(KSBS.map((k) => [k.id, k]));
  const ids = SUBS.map((a) => a.id).sort((x, y) => y.length - x.length).map(escRe);
  HEADING_RE = ids.length ? new RegExp(`^\\s*(${ids.join('|')})\\s*[–—\\-:.)]\\s*(.*)$`, 'i') : /$^/;
  LABEL = { attr: (fw.labels && fw.labels.attr) || 'Attributes', ksb: (fw.labels && fw.labels.ksb) || 'KSBs' };
  Object.assign(FOLDERS, DEFAULT_FOLDERS, fw.folders || {});
  EVIDENCE_CATEGORIES = (fw.evidenceFolders || []).slice();
  S.prr = {};   // parsed reports depend on the requirement ids: read them again
}
const subIdFromHeading = (text) => SUB_LC[String(text).toLowerCase()] || '';
applyFramework(null);

// Make the folders in the person's OneDrive folder, including one per kind of evidence.
async function ensureFolders(dir, mode) {
  const names = mode === 'cpd' ? [FOLDERS.cpd, FOLDERS.exports] : Object.values(FOLDERS);
  for (const f of names) await subDir(dir, f, true);
  if (mode !== 'cpd') for (const c of EVIDENCE_CATEGORIES) await subDir(dir, `${FOLDERS.evidence}/${c}`, true);
}

function choosePreset() {
  return new Promise((resolve) => {
    const d = dialog(`<h2>What are you being assessed against?</h2>
      <p class="muted small">You can change everything later in Settings → Framework.</p>
      <p class="small muted">The built-in lists were read from the institutions’ published documents. They may contain mistakes or be out of date, so every word can be edited afterwards.</p>
      <div style="max-height:50vh;overflow:auto;padding-right:.4rem">${[...new Set(Object.values(PRESETS).map((p) => p.group))].map((g) => `<h3 style="margin:.9rem 0 .2rem">${esc(g)}</h3>` + Object.entries(PRESETS).filter(([, p]) => p.group === g).map(([k, p]) => `<label style="display:flex;gap:.6rem;align-items:flex-start;color:var(--ink);margin:.5rem 0"><input type="radio" name="preset" value="${k}" ${k === 'ice' ? 'checked' : ''}><span><b>${esc(p.name)}</b><br><span class="small muted">${esc(p.about)}</span></span></label>`).join('')).join('')}</div>
      <div class="row" style="justify-content:flex-end;margin-top:1rem"><button value="">Cancel</button><button class="primary" id="presetOk">Continue</button></div>`);
    let done = false;
    const finish = (v) => { if (!done) { done = true; resolve(v); } };
    $('button[value=""]', d).addEventListener('click', () => { finish(null); d.close(); });
    $('#presetOk', d).addEventListener('click', () => { finish($('input[name=preset]:checked', d).value); d.close(); });
    d.addEventListener('close', () => finish(null));
  });
}

// ---------- editing as text ----------
// One item per line, columns separated by " | " or a tab (so a table pasted from Excel or Word works).
const splitLine = (line) => line.split(/\t|\s*\|\s*/).map((s) => s.trim());
const lines = (text) => String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const toLevelText = (fw) => fw.levels.map((l) => [l.short, l.name, l.help].join(' | ')).join('\n');
const toGroupText = (fw) => fw.groups.map((g) => [g.id, g.title].join(' | ')).join('\n');
const toAttrText = (fw) => fw.attributes.map((a) => { const lv = a.min && fw.levels.find((l) => l.id === a.min); return [a.id, a.group, a.text, ...(lv ? ['needs: ' + lv.short] : [])].join(' | '); }).join('\n');
const toKsbText = (fw) => (fw.ksbs || []).map((k) => [k.id, k.kind, k.text, (k.attributes || []).join(', ')].join(' | ')).join('\n');

// Turns the form text into a framework, or throws a message saying what is wrong.
function buildFramework(f, previous) {
  const levels = lines(f.levels).map((l) => {
    const [short, name, ...help] = splitLine(l);
    if (!short || !name) throw new Error(`Level line "${l}": write it as  K | Knowledge | what this level means`);
    const old = previous.levels.find((x) => x.short === short);
    return { id: old ? old.id : slug(name) || slug(short), short, name, help: help.join(' | ') };
  });
  if (!levels.length) throw new Error('Add at least one level.');
  if (new Set(levels.map((l) => l.id)).size !== levels.length || new Set(levels.map((l) => l.short)).size !== levels.length) throw new Error('Each level needs its own letters and name.');
  const groups = lines(f.groups).map((l) => {
    const [id, ...title] = splitLine(l);
    if (!id) throw new Error(`Group line "${l}": write it as  1 | Title of the group`);
    return { id, title: title.join(' | ') || id };
  });
  const attributes = lines(f.attributes).map((l) => {
    const parts = splitLine(l);
    const need = /^needs:\s*(.+)$/i.exec(parts[parts.length - 1] || '');
    if (need) parts.pop();
    const [id, group, ...text] = parts;
    if (!id || !group || !text.length) throw new Error(`Requirement line "${l}": write it as  2b | 2 | The text of the requirement`);
    let min = '';
    if (need) {
      const lv = levels.find((x) => x.short.toLowerCase() === need[1].trim().toLowerCase() || x.name.toLowerCase() === need[1].trim().toLowerCase());
      if (!lv) throw new Error(`Requirement ${id}: "needs: ${need[1]}" is not one of your levels`);
      min = lv.id;
    }
    return { id, group, text: text.join(' | '), min };
  });
  if (!attributes.length) throw new Error('Add at least one requirement.');
  const ids = attributes.map((a) => a.id);
  if (new Set(ids.map((x) => x.toLowerCase())).size !== ids.length) throw new Error('Two requirements have the same id.');
  for (const a of attributes) if (!groups.some((g) => String(g.id) === a.group)) groups.push({ id: a.group, title: a.group });
  const ksbs = lines(f.ksbs).map((l) => {
    const [id, kind, text, links] = splitLine(l);
    if (!id || !text) throw new Error(`Standard line "${l}": write it as  K1 | Knowledge | The text | 2a, 2b`);
    return { id, kind: kind || '', text, attributes: (links || '').split(/[,;\s]+/).filter((x) => ids.includes(x)) };
  });
  if (new Set(ksbs.map((k) => k.id)).size !== ksbs.length) throw new Error('Two standards have the same id.');
  const folders = {};
  for (const k of Object.keys(DEFAULT_FOLDERS)) {
    const v = String(f.folders[k] || '').trim().replace(/[\\/:*?"<>|]+/g, ' ').trim();
    folders[k] = v || DEFAULT_FOLDERS[k];
  }
  if (new Set(Object.values(folders)).size !== Object.keys(folders).length) throw new Error('Each folder needs a different name.');
  const evidenceFolders = lines(f.evidenceFolders).map((x) => x.replace(/[\\/:*?"<>|]+/g, ' ').trim()).filter(Boolean);
  return { name: f.name.trim() || 'My framework', goal: previous.goal, source: previous.source, labels: { attr: f.labelAttr.trim() || 'Attributes', ksb: f.labelKsb.trim() || 'KSBs' }, levels, groups, attributes, ksbs, folders, evidenceFolders };
}

