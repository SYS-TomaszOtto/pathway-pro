// What the views show, worked out from the data: evidence list, K/E/A coverage, PRR structure and checks,
// mentor feedback, completion and next steps. All plain code: nothing here guesses.

const LEVELS = ['knowledge', 'experience', 'ability'];
const LEVEL_SHORT = { knowledge: 'K', experience: 'E', ability: 'A' };
const LEVEL_HELP = {
  knowledge: 'Knowledge: knows and understands it (training, CPD, reading), not yet shown applied on real work.',
  experience: 'Experience: applied it on real work, with guidance, as part of a team, or with a senior making the key decisions.',
  ability: 'Ability: did it themselves and took responsibility: own judgement and decisions, led the task, or guided others.',
};
const SUBS = REF.attributes;
const SUB = Object.fromEntries(SUBS.map((a) => [a.id, a]));
const GROUPS = [...new Map(SUBS.map((a) => [a.group, a.group_title])).entries()].map(([group, title]) => ({ group, title }));
const KSBS = REF.ksbs;
const KSB = Object.fromEntries(KSBS.map((k) => [k.id, k]));
const goal = () => (P() && P().settings.goal) || 3;

// ---------- evidence ----------
const codeFromName = (name) => { const m = /\b([A-Z]{2,3}-\d{2,3})\b/.exec(name); return m ? m[1] : ''; };
const titleFromName = (name) => name.replace(/\.[^.]+$/, '').replace(/^\s*[A-Z]{2,3}-\d{2,3}\s*[-–_.]?\s*/, '').trim() || name;

// Every evidence file joined with its record; records whose file has gone are listed as missing.
function evidenceItems() {
  const recs = (P() && P().evidence) || {};
  const seen = new Set();
  const items = S.files.map((f) => {
    seen.add(f.path);
    const rec = recs[f.path];
    return { path: f.path, file: f, rec, code: (rec && rec.code) || codeFromName(f.name), title: (rec && rec.title) || titleFromName(f.name), folder: f.path.split('/').slice(1, -1).join('/') };
  });
  for (const [path, rec] of Object.entries(recs)) {
    if (!seen.has(path)) items.push({ path, file: null, rec, code: rec.code || codeFromName(path.split('/').pop()), title: rec.title || titleFromName(path.split('/').pop()), folder: path.split('/').slice(1, -1).join('/'), missing: true });
  }
  return items;
}
function itemByCode(code) { return evidenceItems().find((i) => i.code === code); }
const label = (it) => it.code || it.title;

// For each sub-attribute and level: the evidence items mapped there.
function coverage() {
  const out = Object.fromEntries(SUBS.map((a) => [a.id, { knowledge: [], experience: [], ability: [] }]));
  for (const it of evidenceItems()) {
    if (it.missing || !it.rec) continue;
    for (const m of it.rec.maps || []) {
      const cell = out[m.sub] && out[m.sub][m.level];
      if (cell && !cell.includes(it)) cell.push(it);
    }
  }
  return out;
}
function slots(cell) { return LEVELS.reduce((n, l) => n + Math.min(cell[l].length, goal()), 0); }
function slotStatus(cell) {
  const s = slots(cell);
  return s >= 3 * goal() ? 'met' : s > 0 ? 'part' : 'none';
}
function ksbCoverage() {
  const out = Object.fromEntries(KSBS.map((k) => [k.id, { direct: new Set(), via: new Set() }]));
  for (const it of evidenceItems()) {
    if (it.missing || !it.rec) continue;
    for (const m of it.rec.maps || []) {
      for (const k of m.ksbs || []) if (out[k]) out[k].direct.add(it);
      for (const k of KSBS) if (k.attributes.includes(m.sub)) out[k.id].via.add(it);
    }
  }
  return out;
}

// ---------- PRRs (Word) ----------
const HEADING_RE = /^\s*(\d)\s*([a-e])\s*[–—\-:.)]\s*(.*)$/;
const EVIDENCE_RE = /^\s*evidence\s*:\s*(.*)$/i;
const TAG_RE = /\{\s*([A-Z]{2,3}-\d{2,3})\s*\}/g;
const PLACEHOLDER_RE = /^(?:[\d\s.…]*|.*(?:…|\.\.\.)\s*(?:…|\.\.\.)?\s*|tbc|tbd|todo|xxx+|placeholder)$/i;
const DRAFT_WORDS = 40;
const PRR_STATE = { ready: ['ready', 'good'], draft: ['draft', 'part'], placeholder: ['placeholder', 'part'], empty: ['heading only', 'outline'], missing: ['not in PRR', 'outline'] };
const isPlaceholder = (t) => PLACEHOLDER_RE.test(t.trim());

S.prr = {}; // path -> {mtime, doc: {title, sections}, comments, edits, error}

function parsePrr(paragraphs) {
  let title = '';
  const sections = [];
  let cur = null;
  let block = null;
  paragraphs.forEach((p, i) => {
    const text = p.text;
    if (!text) return;
    const h = HEADING_RE.exec(text);
    if (h && SUB[h[1] + h[2]] && (/^heading/i.test(p.style) || text.length < 250)) {
      cur = { id: h[1] + h[2], heading: h[3].trim(), start: i, end: paragraphs.length, listed: [], listedText: '', general: [], blocks: [] };
      if (sections.length) sections[sections.length - 1].end = i;
      sections.push(cur);
      block = null;
      return;
    }
    if (!cur) { if (!title && (/^title$/i.test(p.style) || /attribute\s*\d|report|review/i.test(text))) title = text; return; }
    const e = EVIDENCE_RE.exec(text);
    if (e && !cur.blocks.length) { cur.listedText = e[1].trim(); cur.listed.push(...expandCodes(e[1])); return; }
    const tags = [...text.matchAll(TAG_RE)];
    if (!tags.length) { (block ? block.paragraphs : cur.general).push(text); return; }
    const before = text.slice(0, tags[0].index).trim();
    if (before) (block ? block.paragraphs : cur.general).push(before);
    tags.forEach((t, n) => {
      const end = n + 1 < tags.length ? tags[n + 1].index : text.length;
      block = { code: t[1], paragraphs: [] };
      const rest = text.slice(t.index + t[0].length, end).trim();
      if (rest) block.paragraphs.push(rest);
      cur.blocks.push(block);
    });
  });
  for (const s of sections) {
    const real = [...s.general, ...s.blocks.flatMap((b) => b.paragraphs)].filter((t) => !isPlaceholder(t));
    s.words = real.reduce((n, t) => n + words(t), 0);
    const anyText = s.general.join('') + s.blocks.map((b) => b.paragraphs.join('')).join('');
    s.state = s.words >= DRAFT_WORDS ? 'draft' : anyText.trim() || s.listed.length ? 'placeholder' : 'empty';
    for (const b of s.blocks) { b.words = b.paragraphs.filter((t) => !isPlaceholder(t)).reduce((n, t) => n + words(t), 0); b.thin = b.words < 15; }
    s.discussed = [...new Set(s.blocks.map((b) => b.code))].sort(natural);
    s.listed = [...new Set(s.listed)];
  }
  return { title, sections };
}

// Code checks for one section: [[level, message]].
function sectionChecks(s, codes, accepted) {
  const out = [];
  if (s.state === 'draft' && !s.listed.length && !s.discussed.length) out.push(['warn', 'no evidence referenced: add an "Evidence:" line and a {CODE} tag before each item you write about']);
  const unknown = [...new Set([...s.listed, ...s.discussed])].filter((c) => !codes.has(c));
  if (unknown.length) out.push(['error', 'not found in your evidence: ' + unknown.join(', ')]);
  const notDiscussed = s.listed.filter((c) => !s.discussed.includes(c) && codes.has(c));
  if (notDiscussed.length && s.state === 'draft') out.push(['warn', 'listed but not written about ({CODE} tag missing): ' + notDiscussed.join(', ')]);
  const notListed = s.discussed.filter((c) => !s.listed.includes(c));
  if (notListed.length && s.listed.length) out.push(['warn', 'written about but not in the Evidence line: ' + notListed.join(', ')]);
  const thin = s.blocks.filter((b) => b.thin).map((b) => b.code);
  if (thin.length && s.state === 'draft') out.push(['warn', 'placeholder or very short write-up for: ' + thin.join(', ')]);
  const unmapped = [...new Set([...s.listed, ...s.discussed])].filter((c) => codes.has(c) && !accepted.has(c + '|' + s.id));
  if (unmapped.length) out.push(['info', `not yet mapped to ${s.id} on the Evidence page: ` + unmapped.join(', ')]);
  return out;
}

async function loadReports() {
  const root = portfolioRoot();
  if (!root) return;
  const files = (await listDir(root, FOLDERS.prr)).filter((f) => /\.docx$/i.test(f.name));
  const keep = new Set();
  for (const f of files) {
    const path = `${FOLDERS.prr}/${f.path}`;
    keep.add(path);
    if (S.prr[path] && S.prr[path].mtime === f.mtime) continue;
    try {
      const parsed = await parseDocx(await (await f.handle.getFile()).arrayBuffer());
      const doc = parsePrr(parsed.paragraphs);
      const sectionAt = (para) => doc.sections.find((s) => para !== null && para >= s.start && para < s.end);
      const comments = [];
      for (const c of parsed.comments.filter((x) => !x.parent)) {
        const s = sectionAt(c.para);
        comments.push({ kind: 'comment', key: await sha1(`${c.author}|${c.date}|${c.text}`), author: c.author, date: c.date, text: c.text, anchor: c.anchor,
          resolved: c.done, sub: s ? s.id : '', file: path, replies: parsed.comments.filter((r) => r.parent === c.id).map((r) => ({ author: r.author, date: r.date, text: r.text })) });
      }
      const edits = [];
      for (const [i, p] of parsed.paragraphs.entries()) {
        for (const [kind, list] of [['added', p.ins], ['removed', p.del]]) {
          for (const ch of list) {
            if (words(ch.text) < 4) continue;
            const s = sectionAt(i);
            edits.push({ kind: 'edit', change: kind, key: await sha1(`${ch.author}|${ch.date}|${kind}|${ch.text}`), author: ch.author, date: ch.date,
              text: ch.text.trim(), anchor: p.text.slice(0, 200), sub: s ? s.id : '', file: path, replies: [] });
          }
        }
      }
      S.prr[path] = { path, name: f.name, mtime: f.mtime, doc, comments, edits, error: null };
    } catch (err) {
      S.prr[path] = { path, name: f.name, mtime: f.mtime, doc: { title: '', sections: [] }, comments: [], edits: [], error: err.message };
    }
  }
  for (const path of Object.keys(S.prr)) if (!keep.has(path)) delete S.prr[path];
}

// Everything the PRRs say, per sub-attribute: {id: {sections: [{file, section, issues}], state}}
function prrBySub() {
  const items = evidenceItems();
  const codes = new Set(items.map((i) => i.code).filter(Boolean));
  const mapped = new Set(items.flatMap((i) => ((i.rec && i.rec.maps) || []).map((m) => i.code + '|' + m.sub)));
  const out = Object.fromEntries(SUBS.map((a) => [a.id, { sections: [], state: 'missing' }]));
  for (const r of Object.values(S.prr)) {
    for (const s of r.doc.sections) {
      const issues = sectionChecks(s, codes, mapped);
      const dup = r.doc.sections.filter((x) => x.id === s.id).length > 1;
      if (dup) issues.unshift(['error', `${s.id} appears more than once in ${r.name}`]);
      out[s.id].sections.push({ file: r.path, name: r.name, section: s, issues });
    }
  }
  for (const v of Object.values(out)) {
    const states = v.sections.map((x) => (x.section.state === 'draft' && !x.issues.some((i) => i[0] !== 'info') ? 'ready' : x.section.state));
    v.state = states.includes('ready') ? 'ready' : states.includes('draft') ? 'draft' : states.includes('placeholder') ? 'placeholder' : states.length ? 'empty' : 'missing';
  }
  return out;
}

// ---------- mentor feedback ----------
function feedbackItems() {
  const responses = (P() && P().comments) || {};
  const all = Object.values(S.prr).flatMap((r) => [...r.comments, ...r.edits]);
  return all.map((f) => {
    const resp = responses[f.key];
    const status = resp ? resp.status : f.resolved ? 'done' : 'open';
    return { ...f, status, response: resp ? resp.response : '', updated: resp ? resp.updated : '' };
  });
}

// ---------- completion ----------
// Evidence slots 50%, PRR sections 35% (half when drafted, all when ready), feedback 15% (a sub-attribute
// counts once its section is ready and every comment on it is answered).
function completion() {
  const cov = coverage();
  const prr = prrBySub();
  const fb = feedbackItems();
  let ev = 0, pr = 0, fe = 0;
  for (const a of SUBS) {
    ev += slots(cov[a.id]) / (3 * goal());
    const st = prr[a.id].state;
    pr += st === 'ready' ? 1 : st === 'draft' ? 0.5 : 0;
    if (st === 'ready' && !fb.some((f) => f.sub === a.id && f.status === 'open')) fe += 1;
  }
  const n = SUBS.length;
  const parts = { evidence: ev / n, prr: pr / n, feedback: fe / n };
  return { ...parts, total: 0.5 * parts.evidence + 0.35 * parts.prr + 0.15 * parts.feedback };
}

// The most useful things to do next, worst gaps first.
function nextSteps(limit = 8) {
  const out = [];
  const cov = coverage();
  const prr = prrBySub();
  const fb = feedbackItems().filter((f) => f.status === 'open');
  const unmapped = evidenceItems().filter((i) => !i.missing && !(i.rec && i.rec.maps && i.rec.maps.length));
  const missing = evidenceItems().filter((i) => i.missing);
  if (missing.length) out.push({ text: `${plural(missing.length, 'evidence record')} lost ${missing.length === 1 ? 'its file' : 'their files'} (moved or renamed): relink them`, href: '#evidence?show=missing' });
  if (fb.length) out.push({ text: `Answer ${plural(fb.length, 'open mentor comment')}`, href: '#feedback' });
  if (unmapped.length) out.push({ text: `Map ${plural(unmapped.length, 'evidence file')} to sub-attributes`, href: '#evidence?show=unmapped' });
  const gaps = SUBS.map((a) => ({ a, s: slots(cov[a.id]) })).sort((x, y) => x.s - y.s);
  for (const { a, s } of gaps.slice(0, 4)) {
    if (s >= 3 * goal()) break;
    const lacking = LEVELS.filter((l) => cov[a.id][l].length < goal()).map((l) => `${goal() - cov[a.id][l].length} ${l}`);
    out.push({ text: `${a.id}: needs ${lacking.join(', ')}`, href: '#sub/' + a.id });
  }
  for (const a of SUBS) {
    if (out.length >= limit) break;
    const st = prr[a.id].state;
    if (st === 'draft') out.push({ text: `${a.id}: PRR section drafted but has check warnings`, href: '#sub/' + a.id });
  }
  return out.slice(0, limit);
}

// ---------- meetings ----------
// Lines from a Teams transcript (.vtt, .docx or .txt): [{time, speaker, text}]
function parseTranscriptLines(lines, isVtt) {
  const out = [];
  const push = (time, speaker, text) => {
    text = text.replace(/<\/?v[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    const last = out[out.length - 1];
    // Teams cuts sentences across cues: join a cue to the last one only when that one stopped mid-sentence.
    if (last && last.speaker === speaker && !/[.!?…]$/.test(last.text) && (last.text.length + text.length) < 700) last.text += ' ' + text;
    else out.push({ time, speaker, text, tag: '' });
  };
  if (isVtt) {
    let time = '';
    for (const line of lines) {
      const t = /^(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{3}\s*-->/.exec(line);
      if (t) { time = line.split('-->')[0].trim().replace(/[.,]\d{3}$/, ''); continue; }
      if (!line.trim() || /^WEBVTT/.test(line) || /^NOTE\b/.test(line) || /^[0-9a-f-]{8,}(\/\d+-\d+)?$/i.test(line.trim()) || /^\d+$/.test(line.trim())) continue;
      const v = /<v\s+([^>]+)>(.*?)(<\/v>|$)/.exec(line);
      if (v) push(time, v[1].trim(), v[2]); else push(time, '', line);
    }
    return out;
  }
  let speaker = '', time = '';
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    let m = /^(.{2,60}?)\s+((?:\d{1,2}:)?\d{1,2}:\d{2})\s*$/.exec(line);
    if (m && !/[.!?]$/.test(m[1])) { speaker = m[1].trim(); time = m[2]; continue; }
    m = /^((?:\d{1,2}:)?\d{1,2}:\d{2}(?:\.\d+)?)\s+(.{2,60}?)\s*$/.exec(line);
    if (m && !/[.!?]$/.test(m[2]) && m[2].split(' ').length <= 5) { time = m[1]; speaker = m[2].trim(); continue; }
    m = /^\[?((?:\d{1,2}:)?\d{1,2}:\d{2})\]?\s+([^:]{2,40}):\s+(.+)$/.exec(line);
    if (m) { push(m[1], m[2].trim(), m[3]); continue; }
    m = /^([A-Z][^:]{1,39}):\s+(.+)$/.exec(line);
    if (m && m[1].split(' ').length <= 4) { push(time, m[1].trim(), m[2]); continue; }
    if (/started transcription|stopped transcription/i.test(line)) continue;
    push(time, speaker, line);
  }
  return out;
}

async function readTranscript(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.docx')) {
    const { paragraphs } = await parseDocx(await file.arrayBuffer());
    return parseTranscriptLines(paragraphs.map((p) => p.text), false);
  }
  const text = await file.text();
  return parseTranscriptLines(text.split(/\r?\n/), name.endsWith('.vtt') || /^WEBVTT/.test(text));
}

const ITEM_KINDS = { done: 'Done', todo: 'To do', teaching: 'Teaching' };
function allActions() {
  return ((P() && P().meetings) || []).flatMap((m) => m.items.filter((i) => i.kind === 'todo').map((i) => ({ ...i, meeting: m })));
}

// ---------- CPD ----------
function cpdYear(dateIso) {
  const start = (P() && P().settings.cpdYearStart) || 1;
  const d = new Date(dateIso);
  if (isNaN(d)) return null;
  return d.getMonth() + 1 >= start ? d.getFullYear() : d.getFullYear() - 1;
}
const cpdYearLabel = (y) => ((P() && P().settings.cpdYearStart) || 1) === 1 ? String(y) : `${y}/${String(y + 1).slice(2)}`;
function cpdWarnings(a) {
  const out = [];
  const days = a.dateTo && a.dateFrom ? Math.round((new Date(a.dateTo) - new Date(a.dateFrom)) / 864e5) + 1 : 1;
  if (+a.hours > 30) out.push('ICE advises claiming no more than 30 hours for one activity');
  if (+a.hours > 6 * Math.max(1, days)) out.push('more than 6 hours a day: ICE advises a day counts as 6 hours at most');
  if (!a.learning || !a.benefits) out.push('evaluation missing: key learning points and benefits');
  if (!a.objective) out.push('no development plan reference');
  return out;
}
