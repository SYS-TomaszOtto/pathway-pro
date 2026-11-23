// Skills tracker (a mentor's idea, Nov 2026): skill areas split into small skills, each cleared through the same 9-step
// cycle with the mentor; a 1-5 self-rating with history; sessions (optionally recorded as CPD); links to evidence,
// requirements and KSBs; notes/templates; comments. "Ready to teach" skills export as a training pack (HTML or Word).
// P().skills = { areas: [{id, title, objective, note, created}],
//   skills: [{id, area, title, created, steps: {"1": {done, date, note, by, at}}, ratings: [{date, rating}],
//             sessions: [{id, date, minutes, note, by, cpd}], evidence: [codes], subs: [ids], ksbs: [ids], notes, comments: [{by, text, at}]}] }
// The mentor writes only to their own file: M().skills = { "<skill id>": { steps: {"1": {...}}, comments: [...] } }.
// A step shows whichever copy (apprentice's or mentor's) was changed last; comments from both are merged.

const SKILL_STEPS = [
  [1, 'Topic background, context and briefing', 1, '~10 min'], [2, 'Queries and doubts', 0, '~2 min'], [3, 'Explain', 1, '~5 min'],
  [4, 'Quick questions during training', 0, '~3 min'], [5, 'Feedback', 1, '~2 min'], [6, 'Work on a complete task', 0, 'own time'],
  [7, 'Review the completed task', 1, 'own time'], [8, 'Document templates / notes for the skill', 0, 'own time'], [9, 'Update the tracker', 0, 'own time'],
];
const SK_READY_STEPS = [6, 7, 8];
const SK_CPD_TYPE = 'Peer guidance and discussion';
let SK_FILTER = 'all';

const skData = () => P().skills;
const skMentorOf = (id) => ((M() && M().skills) || {})[id] || {};
const skById = (id) => skData().skills.find((s) => s.id === id);
const skArea = (id) => skData().areas.find((a) => a.id === id);
function skStep(s, n) {
  const a = (s.steps || {})[n] || {}, m = (skMentorOf(s.id).steps || {})[n] || {};
  return (m.at || 0) > (a.at || 0) ? m : a;
}
const skDone = (s) => SKILL_STEPS.filter(([n]) => skStep(s, n).done).length;
const skRating = (s) => { const r = (s.ratings || []).slice(-1)[0]; return r ? r.rating : 0; };
const skReady = (s) => skRating(s) === 5 && SK_READY_STEPS.every((n) => skStep(s, n).done);
const skState = (s) => (skReady(s) ? 'ready' : skDone(s) ? 'progress' : 'todo');
const skComments = (s) => [...(s.comments || []), ...(skMentorOf(s.id).comments || [])].sort((a, b) => a.at - b.at);
const skMyName = () => (S.data.name || (isMentor() ? 'Mentor' : 'Me'));
const skCanStep = (n) => canEdit() || (isMentor() && SKILL_STEPS[n - 1][2] === 1);   // the mentor ticks only the mentor's steps
const skObjLabel = (id) => { const o = P().cpd.objectives.find((x) => x.id === id); return o ? `${o.ref} ${o.title || o.area}`.trim() : ''; };
const skOrdered = () => skData().areas.slice().sort((a, b) => a.created - b.created)
  .map((a) => ({ a, list: skData().skills.filter((s) => s.area === a.id).sort((x, y) => x.created - y.created) }));
const skReadyLabel = 'Rated 5 (Could teach it) with steps 6, 7 and 8 done';

function skDots(s) {
  return `<span class="sk-dots" role="img" aria-label="${skDone(s)} of 9 steps done">${SKILL_STEPS.map(([n, t, m]) =>
    `<i class="${skStep(s, n).done ? 'on' : ''}${m ? ' m' : ''}" title="${n}. ${esc(t)}"></i>`).join('')}</span>`;
}

VIEWS.skills = async (arg) => {
  const d = skData(), ed = canEdit();
  const sel = arg && skById(arg);
  const all = d.skills, ready = all.filter(skReady).length, prog = all.filter((s) => skState(s) === 'progress').length;
  const dock = `<div class="row sk-dock" data-dock>${ed ? '<button type="button" class="primary" id="skAddSkill">+ Skill</button><button type="button" id="skAddArea" title="New skill area">+ Area</button>' : ''}
    <select id="skFilter" aria-label="Show">${[['all', 'All skills'], ['todo', 'Not started'], ['progress', 'In progress'], ['ready', 'Ready to teach']].map(([v, t]) => `<option value="${v}" ${SK_FILTER === v ? 'selected' : ''}>${t}</option>`).join('')}</select>
    <button type="button" id="skPack" title="Ready-to-teach skills as one printable page">Training pack</button>${ed ? '<button type="button" id="skPackWord" title="Save the training pack as a Word file in the Exports folder">Word</button>' : ''}</div>`;
  const side = !d.areas.length
    ? `<div class="card empty"><p><b>No skill areas yet.</b></p><p class="small muted">${ed ? 'Start with an area you want to develop (for example "Drainage design"), then add the small skills to clear one at a time.' : 'The apprentice has not added any skills yet.'}</p>${ed ? '<button type="button" class="primary" data-sk-area="">+ Skill area</button>' : ''}</div>`
    : skOrdered().map(({ a, list }) => {
      const shown = list.filter((s) => SK_FILTER === 'all' || skState(s) === SK_FILTER);
      if (SK_FILTER !== 'all' && !shown.length) return '';
      return `<div class="card sk-area"><div class="row spread"><h2>${esc(a.title)}</h2><span class="small muted">${list.filter(skReady).length} of ${list.length} ready
        ${ed ? `<button type="button" class="small" data-sk-area="${esc(a.id)}" aria-label="Edit area ${esc(a.title)}">Edit</button>` : ''}</span></div>
        ${a.objective && skObjLabel(a.objective) ? `<div class="small muted">Plan: ${esc(skObjLabel(a.objective))}</div>` : ''}
        <ul class="sk-list">${shown.map((s) => `<li><a href="#skills/${esc(s.id)}"${sel === s ? ' aria-current="true"' : ''}><span class="sk-name">${esc(s.title)}</span>${skReady(s) ? chip('★ Ready to teach', 'good') : ''}
          <span class="sk-meta">${skDots(s)}<span>${skDone(s)}/9</span><span>${skRating(s) ? esc(RATING_LABELS[skRating(s)]) : 'Not rated'}</span></span></a></li>`).join('')
          || `<li class="small muted">No skills yet. ${ed ? `<button type="button" class="small" data-sk-new="${esc(a.id)}">+ Skill</button>` : ''}</li>`}</ul></div>`;
    }).join('') || '<div class="card muted">Nothing matches this filter.</div>';
  return `<div class="row spread"><div><h1>Skills</h1>${all.length ? facts([[plural(all.length, 'skill')], [prog + ' in progress', prog ? 'part' : ''], [ready + ' ready to teach', ready ? 'good' : '']]) : ''}</div></div>
    <p class="muted">Skill areas split into small skills, each cleared through the same 9-step cycle with ${isMentor() ? 'the apprentice' : 'your mentor'}.</p>
    ${dock}<div class="sk-grid${sel ? ' show-detail' : ''}"><div class="sk-side">${side}</div><div class="card sk-detail">${sel ? skDetailHtml(sel) : skIntroHtml()}</div></div>`;
};

function skIntroHtml() {
  return `<p class="muted">${skData().areas.length ? 'Pick a skill to see its cycle, rating, sessions and notes.' : 'Add a skill area to get started.'}</p>
    <h2>The cycle for every skill</h2><ol class="small">${SKILL_STEPS.map(([n, t, m, time]) => `<li>${esc(t)} <span class="muted">(${m ? 'mentor' : 'apprentice'}, ${time})</span></li>`).join('')}</ol>
    <p class="small muted">Steps 1 to 5 fit a 30-minute call with your mentor. A skill is <b>ready to teach</b> when it is rated 5 (Could teach it) and steps 6, 7 and 8 are done; ready skills go into the training pack.</p>`;
}

function skDetailHtml(s) {
  const ed = canEdit(), ice = P().mode !== 'cpd', area = skArea(s.area) || {};
  const r = skRating(s);
  const lock = (n) => (skCanStep(n) ? '' : ' disabled');
  return `<a href="#skills" class="btn small sk-back">← All skills</a>
    <div class="row spread"><div><h2 class="sk-title">${esc(s.title)}</h2><div class="small muted">${esc(area.title || '')} · ${skDone(s)} of 9 steps done ${skReady(s) ? chip('★ Ready to teach', 'good') : ''}</div></div>
      ${ed ? `<button type="button" class="small" data-sk-edit="${esc(s.id)}">Rename / move</button>` : ''}</div>
    <h3>How confident ${isMentor() ? 'is the apprentice' : 'are you'}?</h3>
    <div class="row"><div class="seg" role="group" aria-label="Self-rating">${[1, 2, 3, 4, 5].map((n) =>
      `<button type="button" data-sk-rate="${n}" aria-pressed="${r === n}" title="${esc(RATING_LABELS[n])}"${dis(ed)}>${n}</button>`).join('')}</div>
      <b>${r ? esc(RATING_LABELS[r]) : 'Not rated yet'}</b></div>
    ${(s.ratings || []).length ? `<p class="small muted">History: ${s.ratings.map((x) => `${x.rating} on ${esc(fmtDate(x.date))}`).join(' · ')}</p>` : ''}
    <h3>The cycle</h3>
    <p class="small muted">Tick each step when it happens; the date and a short note are kept. ${isMentor() ? 'You can tick the mentor steps (1, 3, 5 and 7).' : 'Steps marked Mentor are for your mentor (they can tick them in their copy of Pathway Pro, or you can).'}</p>
    <ol class="sk-steps">${SKILL_STEPS.map(([n, t, m, time]) => {
      const st = skStep(s, n);
      return `<li class="${st.done ? 'done' : ''}" data-sk-step="${n}"><input type="checkbox" id="skSt${n}" ${st.done ? 'checked' : ''}${lock(n)}>
        <label for="skSt${n}"><span class="sk-st-title">${n}. ${esc(t)}</span>
          <span class="small"><span class="${m ? 'sk-who-m' : ''}">${m ? 'Mentor' : 'Apprentice'}</span> · ${time}${st.done && st.by ? ' · ticked by ' + esc(st.by) : ''}</span></label>
        <input type="date" value="${esc(st.date || '')}" aria-label="Date for step ${n}" data-f="date"${lock(n)}>
        <input type="text" value="${esc(st.note || '')}" placeholder="Short note" aria-label="Note for step ${n}" data-f="note" maxlength="1000"${lock(n)}></li>`;
    }).join('')}</ol>
    <h3>Sessions</h3>
    ${(s.sessions || []).length ? `<table><thead><tr><th>Date</th><th>Minutes</th><th>Note</th><th>CPD</th>${ed ? '<th><span class="sr-only">Delete</span></th>' : ''}</tr></thead><tbody>${s.sessions.map((x) =>
      `<tr><td class="nowrap">${esc(fmtDate(x.date))}</td><td>${x.minutes}</td><td>${esc(x.note)}<div class="small muted">${esc(x.by)}</div></td>
       <td><label class="sk-inline"><input type="checkbox" data-sk-cpd="${esc(x.id)}" ${x.cpd ? 'checked' : ''}${dis(ed)}> ${x.cpd ? 'Yes' : 'No'}<span class="sr-only"> (recorded as CPD)</span></label></td>
       ${ed ? `<td><button type="button" class="small danger" data-sk-sdel="${esc(x.id)}" aria-label="Delete the session on ${esc(fmtDate(x.date))}">✕</button></td>` : ''}</tr>`).join('')}</tbody></table>`
      : '<p class="small muted">No sessions logged yet.</p>'}
    ${ed ? `<div class="sk-sess"><input type="text" id="skSessNote" placeholder="What you covered" aria-label="Session note">
      <input type="date" id="skSessDate" value="${today()}" aria-label="Session date"><input type="number" id="skSessMin" value="30" min="1" max="600" aria-label="Minutes">
      <label class="sk-inline"><input type="checkbox" id="skSessCpd" checked> Add to CPD</label><button type="button" id="skSessAdd">Log session</button></div>` : ''}
    ${ice ? `<h3>Links</h3><div class="sk-links">
      <label for="skLkEv">Evidence (the task)</label><input id="skLkEv" data-sk-link="evidence" value="${esc((s.evidence || []).join(', '))}" placeholder="e.g. CA-19"${dis(ed)}>
      <div class="sk-shown">${(s.evidence || []).map(codeLink).join(' ')}</div>
      <label for="skLkSub">${esc(cap1(LABEL.items))}</label><input id="skLkSub" data-sk-link="subs" value="${esc((s.subs || []).join(', '))}" placeholder="e.g. 2b, 3a"${dis(ed)}>
      <div class="sk-shown">${(s.subs || []).map(subLink).join(' ')}</div>
      ${KSBS.length ? `<label for="skLkKsb">${esc(LABEL.ksb)}</label><input id="skLkKsb" data-sk-link="ksbs" value="${esc((s.ksbs || []).join(', '))}" placeholder="e.g. S3, K2"${dis(ed)}>` : ''}</div>` : ''}
    <h3>Notes and templates</h3>
    <p class="small muted">What step 8 produces: method, checklists, rules of thumb, templates. This goes into the training pack.</p>
    <textarea id="skNotes" rows="6" aria-label="Notes and templates"${dis(ed)}>${esc(s.notes || '')}</textarea>
    <h3>Comments</h3>
    ${skComments(s).map((c) => `<div class="sk-bubble"><span class="small muted">${esc(c.by)} · ${esc(new Date(c.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }))}</span><div>${linkify(c.text)}</div></div>`).join('') || '<p class="small muted">No comments yet.</p>'}
    ${ed || isMentor() ? `<textarea id="skComment" rows="2" placeholder="Comment for ${isMentor() ? 'the apprentice' : 'your mentor'}" aria-label="New comment"></textarea>
      <div class="row"><button type="button" class="small" id="skCommentAdd">Add comment</button></div>` : ''}`;
}

// Record (or stop recording) a session as a CPD activity, linked to the area's plan objective.
function skSyncCpd(s, x) {
  const c = P().cpd, id = 'skill-' + x.id;
  c.activities = c.activities.filter((a) => a.id !== id);
  if (!x || !x.cpd) return;
  const area = skArea(s.area) || {};
  c.activities.push({ id, ref: '', objective: area.objective || (c.objectives.find((o) => o.ref === 'UNP') || {}).id || '',
    details: `Skills session: ${s.title}${area.title ? ` (${area.title})` : ''}`, theme: '', type: SK_CPD_TYPE, dateFrom: x.date, dateTo: x.date,
    hours: Math.round((x.minutes || 0) / 60 * 100) / 100, tags: ['skills tracker'], learning: x.note || '', benefits: '', helped: '', future: '', dap: '',
    documents: [], subs: [...(s.subs || [])], extra: {}, fromSkill: s.id });
}

// Where a step change is written: the apprentice's own record, or the mentor's file.
function skSetStep(s, n, patch) {
  const cur = { ...skStep(s, n), ...patch, at: Date.now() };
  if ('done' in patch && patch.done) { cur.by = skMyName(); cur.date = cur.date || today(); }
  if (isMentor()) {
    const m = (S.data.skills[s.id] = S.data.skills[s.id] || { steps: {}, comments: [] });
    (m.steps = m.steps || {})[n] = cur;
  } else (s.steps = s.steps || {})[n] = cur;
  changed();
}

function skAreaDialog(id) {
  const a = id ? skArea(id) : null;
  const objs = P().cpd.objectives;
  const d = dialog(`<h2>${a ? 'Edit skill area' : 'New skill area'}</h2>
    <label for="skAT">Name</label><input id="skAT" maxlength="200" placeholder="e.g. Drainage design" value="${esc(a ? a.title : '')}" style="width:100%">
    <label for="skAO">Development plan objective (CPD)</label><select id="skAO"><option value="">None</option>${objs.map((o) => `<option value="${o.id}" ${a && a.objective === o.id ? 'selected' : ''}>${esc(o.ref)} – ${esc(o.title || o.area)}</option>`).join('')}</select>
    <label for="skAN">Why this area (optional)</label><textarea id="skAN" rows="3">${esc(a ? a.note : '')}</textarea>
    <div class="row spread" style="margin-top:1rem"><span>${a ? '<button type="button" class="danger" id="skADel">Delete area</button>' : ''}</span>
      <span class="row"><button type="button" id="skACancel">Cancel</button><button type="button" class="primary" id="skASave">Save</button></span></div>`);
  $('#skACancel', d).addEventListener('click', () => d.close());
  $('#skASave', d).addEventListener('click', () => {
    const title = $('#skAT', d).value.trim();
    if (!title) { $('#skAT', d).focus(); return; }
    const x = a || { id: uid(), created: Date.now() };
    Object.assign(x, { title, objective: $('#skAO', d).value, note: $('#skAN', d).value.trim() });
    if (!a) skData().areas.push(x);
    changed(); d.close(); render(); toast('Skill area saved');
  });
  if (a) $('#skADel', d).addEventListener('click', () => {
    if (skData().skills.some((s) => s.area === a.id)) { toast('Move or delete the skills in this area first', 'error'); return; }
    skData().areas = skData().areas.filter((x) => x !== a);
    changed(); d.close(); render(); toast('Area deleted');
  });
}

function skSkillDialog(id, areaId) {
  if (!skData().areas.length) return skAreaDialog();
  const s = id ? skById(id) : null;
  const d = dialog(`<h2>${s ? 'Rename or move skill' : 'New skill'}</h2>
    <label for="skST">Name</label><input id="skST" maxlength="200" placeholder="e.g. Size a soakaway to BRE 365" value="${esc(s ? s.title : '')}" style="width:100%">
    <label for="skSA">Skill area</label><select id="skSA">${skOrdered().map(({ a }) => `<option value="${a.id}">${esc(a.title)}</option>`).join('')}</select>
    <div class="row spread" style="margin-top:1rem"><span>${s ? '<button type="button" class="danger" id="skSDel">Delete skill</button>' : ''}</span>
      <span class="row"><button type="button" id="skSCancel">Cancel</button><button type="button" class="primary" id="skSSave">Save</button></span></div>`);
  $('#skSA', d).value = s ? s.area : areaId || skOrdered().slice(-1)[0].a.id;
  $('#skSCancel', d).addEventListener('click', () => d.close());
  $('#skSSave', d).addEventListener('click', () => {
    const title = $('#skST', d).value.trim();
    if (!title) { $('#skST', d).focus(); return; }
    const x = s || { id: uid(), created: Date.now(), steps: {}, ratings: [], sessions: [], evidence: [], subs: [], ksbs: [], notes: '', comments: [] };
    Object.assign(x, { title, area: $('#skSA', d).value });
    if (!s) skData().skills.push(x);
    changed(); d.close(); go('#skills/' + x.id); toast('Skill saved');
  });
  if (s) $('#skSDel', d).addEventListener('click', async () => {
    d.close();
    if (!(await ask(`Delete the skill “${esc(s.title)}” with its ticks, sessions and notes? Any CPD entries already made stay in your CPD record. Undo can bring it back.`, 'Delete'))) return;
    skData().skills = skData().skills.filter((x) => x !== s);
    changed(); go('#skills'); toast('Skill deleted');
  });
}

const skLinkParse = {
  evidence: (v) => [...new Set(v.toUpperCase().split(/[\s,;]+/).filter((c) => /^[A-Z]{2,3}-\d{2,3}$/.test(c)))],
  subs: (v) => [...new Set(v.split(/[\s,;]+/).map((x) => (SUB[x] ? x : (SUBS.find((a) => a.id.toLowerCase() === x.toLowerCase()) || {}).id)).filter(Boolean))],
  ksbs: (v) => [...new Set(v.toUpperCase().split(/[\s,;]+/).filter((k) => KSBS.some((x) => x.id.toUpperCase() === k)))],
};

VIEWS.skills.after = (arg) => {
  const s = arg && skById(arg);
  const keep = (fn) => { const y = window.scrollY; fn(); render().then(() => window.scrollTo(0, y)); };
  const on = (sel, ev, fn) => { const el = $(sel); if (el) el.addEventListener(ev, fn); };
  on('#skFilter', 'change', (e) => { SK_FILTER = e.target.value; render(); });
  on('#skAddArea', 'click', () => skAreaDialog());
  on('#skAddSkill', 'click', () => skSkillDialog(null, s && s.area));
  on('#skPack', 'click', skPackHtml);
  on('#skPackWord', 'click', (e) => { if (!demoBlocked()) act(e.currentTarget, skPackDocx, (p) => 'Saved ' + p); });
  $$('[data-sk-area]').forEach((b) => b.addEventListener('click', () => skAreaDialog(b.dataset.skArea)));
  $$('[data-sk-new]').forEach((b) => b.addEventListener('click', () => skSkillDialog(null, b.dataset.skNew)));
  if (!s) return;
  if (matchMedia('(max-width: 900px)').matches) { const h = $('.sk-title'); if (h) h.scrollIntoView({ block: 'start' }); }
  on('[data-sk-edit]', 'click', () => skSkillDialog(s.id));
  $$('[data-sk-rate]').forEach((b) => b.addEventListener('click', () => keep(() => {
    const n = +b.dataset.skRate, day = today(), had = (s.ratings || []).find((x) => x.date === day);
    s.ratings = (s.ratings || []).filter((x) => x.date !== day);   // one rating a day; pressing today's rating again clears it
    if (!(had && had.rating === n)) s.ratings.push({ date: day, rating: n });
    s.ratings.sort((x, y) => (x.date < y.date ? -1 : 1));
    changed();
  })));
  $$('[data-sk-step]').forEach((li) => li.addEventListener('change', (e) => {
    const n = +li.dataset.skStep, t = e.target;
    if (t.type === 'checkbox') keep(() => skSetStep(s, n, { done: t.checked, date: $('input[type=date]', li).value || today() }));
    else skSetStep(s, n, { [t.dataset.f]: t.value });
  }));
  on('#skSessAdd', 'click', () => {
    const minutes = Math.round(+$('#skSessMin').value);
    if (!(minutes > 0 && minutes <= 600)) { $('#skSessMin').focus(); toast('Minutes must be between 1 and 600', 'error'); return; }
    const x = { id: uid(), date: $('#skSessDate').value || today(), minutes, note: $('#skSessNote').value.trim(), by: skMyName(), cpd: $('#skSessCpd').checked };
    keep(() => { (s.sessions = s.sessions || []).push(x); s.sessions.sort((a, b) => (a.date < b.date ? -1 : 1)); skSyncCpd(s, x); changed(); });
    toast(x.cpd ? `Session logged and ${Math.round(minutes / 6) / 10} h added to CPD` : 'Session logged');
  });
  $$('[data-sk-cpd]').forEach((b) => b.addEventListener('change', () => keep(() => {
    const x = s.sessions.find((y) => y.id === b.dataset.skCpd);
    x.cpd = b.checked; skSyncCpd(s, x); changed(); toast(b.checked ? 'Added to CPD' : 'Removed from CPD');
  })));
  $$('[data-sk-sdel]').forEach((b) => b.addEventListener('click', async () => {
    if (!(await ask('Delete this session (and its CPD entry, if any)?', 'Delete'))) return;
    const x = s.sessions.find((y) => y.id === b.dataset.skSdel);
    keep(() => { s.sessions = s.sessions.filter((y) => y !== x); x.cpd = false; skSyncCpd(s, x); changed(); });
  }));
  $$('[data-sk-link]').forEach((inp) => inp.addEventListener('change', () => keep(() => {
    const k = inp.dataset.skLink, before = inp.value.split(/[\s,;]+/).filter(Boolean).length;
    s[k] = skLinkParse[k](inp.value);
    if (s[k].length < before) toast(`Some ${k === 'evidence' ? 'codes' : 'ids'} were not recognised and were left out`, 'error');
    changed();
  })));
  on('#skNotes', 'input', (e) => { s.notes = e.target.value; changed(); });
  on('#skCommentAdd', 'click', () => {
    const text = $('#skComment').value.trim();
    if (!text) { $('#skComment').focus(); return; }
    const c = { by: skMyName(), text: text.slice(0, 4000), at: Date.now() };
    keep(() => {
      if (isMentor()) { const m = (S.data.skills[s.id] = S.data.skills[s.id] || { steps: {}, comments: [] }); (m.comments = m.comments || []).push(c); }
      else (s.comments = s.comments || []).push(c);
      changed();
    });
    toast('Comment saved');
  });
};

// ---------- training pack ----------
function skPackParts() {
  const titles = Object.fromEntries(evidenceItems().filter((i) => i.code).map((i) => [i.code, i.title]));
  return skOrdered().flatMap(({ a, list }) => list.filter(skReady).map((s) => ({ a, s, titles,
    steps: SKILL_STEPS.map(([n, t]) => [t, skStep(s, n)]).filter(([, st]) => st.done) })));
}
const skPackIntro = (n) => `Made ${fmtDate(today())} from Pathway Pro: ${plural(n, 'skill')} ready to teach. Use the notes and the worked task to brief an apprentice or graduate through the same 9-step cycle.`;
const skPackNone = `No skill is ready to teach yet (${skReadyLabel.toLowerCase()}).`;
const skMeta = (a, s) => `${a.title}${skObjLabel(a.objective) ? ' · ' + skObjLabel(a.objective) : ''}${P().mode !== 'cpd' ? ` · ${cap1(LABEL.items)}: ${(s.subs || []).join(', ') || '–'} · ${LABEL.ksb}: ${(s.ksbs || []).join(', ') || '–'}` : ''}`;
const skStepLine = ([t, st]) => `${t} – ${fmtDate(st.date)} ${st.by || ''}${st.note ? ' · ' + st.note : ''}`;

function skPackHtml() {
  const parts = skPackParts();
  const body = parts.map(({ a, s, titles, steps }) => `<section><h2>${esc(s.title)}</h2><p class="meta">${esc(skMeta(a, s))}</p>
    <h3>Notes and templates</h3><div class="notes">${esc(s.notes || 'No notes written yet.')}</div>
    <h3>Worked task (evidence)</h3><ul>${(s.evidence || []).map((c) => `<li>${esc(c)} – ${esc(titles[c] || 'not in the evidence list')}</li>`).join('') || '<li>No evidence linked.</li>'}</ul>
    <h3>How it was learnt</h3><ul>${steps.map((x) => `<li>${esc(skStepLine(x))}</li>`).join('')}</ul></section>`).join('') || `<p>${esc(skPackNone)}</p>`;
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Skills training pack</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:820px;margin:24px auto;padding:0 16px;color:#222}
h1{font-size:24px}section{border-top:2px solid #ccc;padding-top:8px;margin-top:24px;page-break-inside:avoid}.meta{color:#555;font-size:13px}.notes{white-space:pre-wrap;background:#f6f6f4;padding:10px;border-radius:6px}</style></head>
<body><h1>Skills training pack</h1><p class="meta">${esc(skPackIntro(parts.length))}</p>${body}</body></html>`;
  const url = URL.createObjectURL(new Blob([page], { type: 'text/html' }));
  if (!window.open(url, '_blank')) download(new Blob([page], { type: 'text/html' }), 'Skills training pack.html');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function skPackDocx() {
  const parts = skPackParts();
  const blocks = [{ type: 'title', text: 'Skills training pack' }, { type: 'small', text: skPackIntro(parts.length) }];
  if (!parts.length) blocks.push({ text: skPackNone });
  for (const { a, s, titles, steps } of parts) {
    blocks.push({ type: 'h1', text: s.title }, { type: 'small', text: skMeta(a, s) }, { type: 'h2', text: 'Notes and templates' }, { text: s.notes || 'No notes written yet.' },
      { type: 'h2', text: 'Worked task (evidence)' }, ...((s.evidence || []).length ? s.evidence.map((c) => ({ text: `• ${c} – ${titles[c] || 'not in the evidence list'}` })) : [{ text: 'No evidence linked.' }]),
      { type: 'h2', text: 'How it was learnt' }, ...steps.map((x) => ({ text: '• ' + skStepLine(x) })));
  }
  const path = `${FOLDERS.exports}/Skills training pack ${today()}.docx`;
  await writeFile(S.own, path, makeDocx(blocks));
  return path;
}
