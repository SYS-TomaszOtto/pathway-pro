// CPD, following ICE's CPD guidance: a Development Action Plan (objectives with reference codes, after a
// review of learning needs) and a Personal Development Record (activities with effective learning time and
// an evaluation). Exports to Word in the layout of ICE's Appendix A and B templates.

const CPD_TYPES = ['Learning on the job', 'Peer guidance and discussion', 'Employer training or presentation', 'Course', 'Conference, seminar or workshop',
  'ICE or regional event', 'Structured reading', 'Self-study (textbooks, study packs)', 'Online learning or webinar', 'Podcast or video', 'Work shadowing',
  'Site visit', 'Secondment', 'Writing reports or for publication', 'Giving a presentation or lecture', 'Coaching or mentoring others',
  'STEM outreach (schools, careers events)', 'ICE volunteering (reviewer, committee)', 'Research', 'Trade exhibition', 'Qualification (not your academic base)', 'Other'];
const OBJ_STATUS = { active: 'Active', complete: 'Complete', archived: 'Archived' };

const cpd = () => P().cpd;
const objectiveOf = (a) => cpd().objectives.find((o) => o.id === a.objective);
const themes = () => (P().settings.themes || []).map((t) => ({ name: t.replace(/^\*\s*/, '').trim(), mandatory: /^\*/.test(t) })).filter((t) => t.name);

function cpdYears() {
  const ys = new Set(cpd().activities.map((a) => cpdYear(a.dateFrom)).filter((y) => y !== null));
  ys.add(cpdYear(today()));
  return [...ys].sort((a, b) => b - a);
}

VIEWS.cpd = async (arg, q) => {
  const [page, id] = (arg || 'overview').split('/');
  const tabs = [['overview', 'Overview'], ['plan', 'Development plan'], ['record', 'Development record'], ['export', 'Export']];
  const head = `<div class="row spread"><h1>CPD</h1>${canEdit() ? `<div class="row"><button id="addAct" class="primary">+ Record an activity</button></div>` : ''}</div>
    <div class="sub-tabs">${tabs.map(([k, v]) => `<a href="#cpd/${k}" class="${page === k || (page === 'activity' && k === 'record') || (page === 'objective' && k === 'plan') ? 'active' : ''}">${v}</a>`).join('')}</div>`;
  const body = { overview: cpdOverview, plan: cpdPlan, record: cpdRecord, activity: cpdActivity, objective: cpdObjective, export: cpdExport }[page] || cpdOverview;
  return head + body(id, q);
};
VIEWS.cpd.after = (arg, q) => {
  const [page, id] = (arg || 'overview').split('/');
  if ($('#addAct')) $('#addAct').addEventListener('click', () => {
    const a = { id: uid(), ref: '', objective: (cpd().objectives.find((o) => o.ref === 'UNP') || {}).id || '', details: '', theme: '', type: '', dateFrom: today(), dateTo: today(), hours: '',
      learning: '', benefits: '', helped: '', future: '', dap: '', documents: [], subs: [] };
    cpd().activities.push(a);
    changed();
    location.hash = '#cpd/activity/' + a.id;
  });
  ({ activity: afterActivity, objective: afterObjective, plan: afterPlan, export: afterExport, record: afterRecord }[page] || (() => {}))(id, q);
};

function cpdOverview() {
  const years = cpdYears();
  const target = +P().settings.cpdTarget || 30;
  const yr = years[0];
  const acts = cpd().activities.filter((a) => cpdYear(a.dateFrom) === yr);
  const hours = acts.reduce((n, a) => n + (+a.hours || 0), 0);
  const sum = (list, key) => { const out = {}; for (const a of list) { const k = key(a) || '(none)'; out[k] = (out[k] || 0) + (+a.hours || 0); } return Object.entries(out).sort((x, y) => y[1] - x[1]); };
  const warnings = cpd().activities.map((a) => ({ a, w: cpdWarnings(a) })).filter((x) => x.w.length);
  const recent = years.slice(0, 3);
  const mandatory = themes().filter((t) => t.mandatory);
  const covered = (t) => cpd().activities.some((a) => a.theme === t.name && recent.includes(cpdYear(a.dateFrom)));
  const table = (rows) => rows.length ? `<table><tbody>${rows.map(([k, h]) => `<tr><td>${esc(k)}</td><td class="right nowrap">${h} h</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Nothing yet.</p>';
  return `<div class="kpis">${years.slice(0, 4).map((y) => {
      const h = cpd().activities.filter((a) => cpdYear(a.dateFrom) === y).reduce((n, a) => n + (+a.hours || 0), 0);
      return `<div class="kpi"><div class="label">CPD year ${cpdYearLabel(y)}</div><div class="big-number">${h}<small style="font-size:1rem"> / ${target} h</small></div>${meter(h / target, h >= target ? 'good' : '')}</div>`;
    }).join('')}
    <div class="kpi"><div class="label">Objectives</div><div class="big-number">${cpd().objectives.filter((o) => o.status === 'active').length}</div><div class="small muted">active · ${cpd().objectives.filter((o) => o.status === 'complete').length} complete</div></div></div>
    <p class="small muted">ICE asks for at least ${target} hours of effective learning a year up to the Professional Review. Effective learning time is the time you actually learned for, not how long the activity lasted: no more than 6 hours for a day and 30 hours for one activity.</p>
    <div class="grid">
      <div class="card"><h2>${cpdYearLabel(yr)} by objective</h2>${table(sum(acts, (a) => { const o = objectiveOf(a); return o ? `${o.ref} ${o.title || o.area}` : ''; }))}</div>
      <div class="card"><h2>${cpdYearLabel(yr)} by type</h2>${table(sum(acts, (a) => a.type))}</div>
      <div class="card"><h2>${cpdYearLabel(yr)} by CPD Framework theme</h2>${table(sum(acts.filter((a) => a.theme), (a) => a.theme))}
        ${mandatory.length ? `<h3>Mandatory themes, last 3 years</h3>${mandatory.map((t) => `<div>${covered(t) ? '<span class="good">✓</span>' : '<span class="bad">✕</span>'} ${esc(t.name)}</div>`).join('')}` : `<p class="small muted">Add ICE's CPD Framework themes in <a href="#settings">Settings</a> to track them (mark the mandatory ones with *).</p>`}</div>
      <div class="card"><h2>To tidy up</h2>${warnings.length ? `<ul class="list-plain">${warnings.slice(0, 15).map(({ a, w }) => `<li><a href="#cpd/activity/${a.id}">${esc(a.details || '(no details)')}</a><div class="small part">${w.map(esc).join(' · ')}</div></li>`).join('')}</ul>` : '<p class="good">All activities are complete.</p>'}</div>
    </div>`;
}

function cpdRecord(id, q) {
  const year = q.get('year') || String(cpdYears()[0]);
  const list = cpd().activities.filter((a) => year === 'all' || String(cpdYear(a.dateFrom)) === year).sort((a, b) => (b.dateFrom || '').localeCompare(a.dateFrom || ''));
  const total = list.reduce((n, a) => n + (+a.hours || 0), 0);
  return `<div class="row" style="margin-bottom:8px"><label style="margin:0">CPD year</label><select id="cpdYear">${cpdYears().map((y) => `<option value="${y}" ${String(y) === year ? 'selected' : ''}>${cpdYearLabel(y)}</option>`).join('')}<option value="all" ${year === 'all' ? 'selected' : ''}>All years</option></select>
      <span class="muted">${plural(list.length, 'activity', 'activities')} · ${total} hours</span></div>
    ${list.length ? `<div class="card table-wrap"><table><thead><tr><th>Dates</th><th>Activity</th><th>Type</th><th>Hours</th><th>Plan ref.</th><th>Theme</th><th></th></tr></thead><tbody>
      ${list.map((a) => { const o = objectiveOf(a); const w = cpdWarnings(a); return `<tr class="click" data-href="#cpd/activity/${a.id}"><td class="nowrap small">${fmtDate(a.dateFrom)}${a.dateTo && a.dateTo !== a.dateFrom ? ' – ' + fmtDate(a.dateTo) : ''}</td>
        <td>${esc(a.details || '(no details)')}${a.documents && a.documents.length ? ' 📎' : ''}</td><td class="small">${esc(a.type)}</td><td class="right">${esc(a.hours)}</td><td>${o ? esc(o.ref) : ''}</td><td class="small">${esc(a.theme)}</td>
        <td>${w.length ? `<span class="part" title="${esc(w.join('\n'))}">!</span>` : ''}</td></tr>`; }).join('')}</tbody></table></div>`
      : '<div class="empty">No activities recorded for this year.</div>'}`;
}
function afterRecord(id, q) {
  $$('tr[data-href]').forEach((tr) => tr.addEventListener('click', () => { location.hash = tr.dataset.href; }));
  $('#cpdYear').addEventListener('change', (e) => { location.hash = '#cpd/record?year=' + e.target.value; });
}

function cpdActivity(id) {
  const a = cpd().activities.find((x) => x.id === id);
  if (!a) return '<div class="empty">Activity not found.</div>';
  const ed = canEdit();
  const area = (field, labelText, help) => `<div class="full"><label>${labelText}${help ? ` <span class="small">– ${help}</span>` : ''}</label><textarea data-field="${field}"${dis(ed)}>${esc(a[field] || '')}</textarea></div>`;
  return `<a href="#cpd/record">← Development record</a>
    <div class="cols wide-left" style="margin-top:8px"><div>
      <div class="card"><h2>Development activity</h2><div class="form-grid">
        <div class="full"><label>Details of CPD activity</label><input data-field="details" value="${esc(a.details)}" placeholder="e.g. ICE webinar: Eurocode 7 changes"${dis(ed)}></div>
        <div><label>Type</label><select data-field="type"${dis(ed)}><option value="">–</option>${CPD_TYPES.map((t) => `<option ${a.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <div><label>ICE CPD Framework theme (if any)</label><input data-field="theme" value="${esc(a.theme || '')}" list="themeList"${dis(ed)}><datalist id="themeList">${themes().map((t) => `<option>${esc(t.name)}</option>`).join('')}</datalist></div>
        <div><label>From</label><input type="date" data-field="dateFrom" value="${esc(a.dateFrom || '')}"${dis(ed)}></div>
        <div><label>To</label><input type="date" data-field="dateTo" value="${esc(a.dateTo || '')}"${dis(ed)}></div>
        <div><label>Effective learning time (hours)</label><input type="number" min="0" step="0.25" data-field="hours" value="${esc(a.hours)}"${dis(ed)}></div>
        <div><label>Development plan ref.</label><select data-field="objective"${dis(ed)}><option value="">–</option>${cpd().objectives.map((o) => `<option value="${o.id}" ${a.objective === o.id ? 'selected' : ''}>${esc(o.ref)} – ${esc(o.title || o.area)}</option>`).join('')}</select></div>
      </div></div>
      <div class="card"><h2>Evaluation</h2><div class="form-grid">
        ${area('learning', 'Key learning points')}
        ${area('benefits', 'Key benefits / value added')}
        ${area('helped', 'How has this learning activity helped you?')}
        ${area('future', 'How will the learning be used in the future?')}
        ${area('dap', 'How will this influence my development plan next year?')}
      </div></div>
    </div><div>
      <div class="card"><h2>Checks</h2><div id="actWarn"></div></div>
      <div class="card"><h2>Supporting documents</h2><p class="small muted">Certificates, handouts, notes. They are copied into <code>${FOLDERS.cpd}</code>. ICE does not ask for them, but they are handy.</p>
        <ul class="list-plain">${(a.documents || []).map((p, i) => `<li>${fileLink(p)} ${ed ? `<button class="small danger doc-del" data-i="${i}" title="Remove from this activity (the file stays)">✕</button>` : ''}</li>`).join('') || '<li class="muted">None.</li>'}</ul>
        ${ed ? '<label class="btn small" style="margin-top:.5rem;color:var(--ink)">Attach a file…<input type="file" id="attach" hidden multiple></label>' : ''}</div>
      ${P().mode !== 'cpd' ? `<div class="card"><h2>ICE sub-attributes</h2><p class="small muted">Optional: which sub-attributes this learning supports (as Knowledge). To count it as evidence, save the certificate into the Evidence folder and map it there.</p>
        <div>${SUBS.map((s) => `<label style="display:inline;margin:0 .5rem 0 0;color:var(--ink)" title="${esc(s.text)}"><input type="checkbox" class="act-sub" value="${s.id}" ${(a.subs || []).includes(s.id) ? 'checked' : ''}${dis(ed)}> ${s.id}</label>`).join('')}</div></div>` : ''}
      ${ed ? '<button class="danger" id="delAct">Delete this activity</button>' : ''}
    </div></div>`;
}
function afterActivity(id) {
  const a = cpd().activities.find((x) => x.id === id);
  if (!a) return;
  const warn = () => { const w = cpdWarnings(a); $('#actWarn').innerHTML = w.length ? w.map((x) => `<div class="issue warn">${esc(x)}</div>`).join('') : '<p class="good">Complete.</p>'; };
  warn();
  if (!canEdit()) return;
  // A one-day activity keeps To equal to From when From changes.
  let lastFrom = a.dateFrom;
  bindFields($('#main'), a, (key) => {
    if (key === 'dateFrom') {
      if (!a.dateTo || a.dateTo === lastFrom || a.dateTo < a.dateFrom) { a.dateTo = a.dateFrom; $('[data-field=dateTo]').value = a.dateTo; changed(); }
      lastFrom = a.dateFrom;
    }
    warn();
  });
  $$('.act-sub').forEach((b) => b.addEventListener('change', () => { a.subs = $$('.act-sub:checked').map((x) => x.value); changed(); }));
  $$('.doc-del').forEach((b) => b.addEventListener('click', () => { a.documents.splice(+b.dataset.i, 1); changed(); render(); }));
  $('#attach').addEventListener('change', async (e) => {
    const y = cpdYear(a.dateFrom) || new Date().getFullYear();
    for (const file of e.target.files) {
      let path = `${FOLDERS.cpd}/${cpdYearLabel(y).replace('/', '-')}/${file.name}`;
      if (await exists(S.own, path)) path = path.replace(/(\.[^.]+)?$/, ` (${uid().slice(-4)})$1`);
      await writeFile(S.own, path, file);
      a.documents = [...(a.documents || []), path];
    }
    changed();
    toast(`Attached ${plural(e.target.files.length, 'file')}`);
    render();
  });
  $('#delAct').addEventListener('click', async () => {
    if (!(await ask('Delete this activity? Attached files stay in the CPD folder.', 'Delete'))) return;
    cpd().activities.splice(cpd().activities.indexOf(a), 1);
    changed();
    location.hash = '#cpd/record';
  });
}

function cpdPlan() {
  const ed = canEdit();
  const reviews = cpd().reviews.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const hoursFor = (o) => cpd().activities.filter((a) => a.objective === o.id).reduce((n, a) => n + (+a.hours || 0), 0);
  return `<div class="cols wide-left"><div>
      <div class="card"><div class="row spread"><h2 style="margin:0">Development Action Plan</h2>${ed ? '<button id="addObj">+ Add objective</button>' : ''}</div>
        <p class="small muted">Each objective gets a reference code (e.g. TECH1); activities in your record point to it. Keep an “Unplanned” objective for learning you did not plan.</p>
        ${['active', 'complete', 'archived'].map((st) => { const list = cpd().objectives.filter((o) => (o.status || 'active') === st); return list.length ? `<h3>${OBJ_STATUS[st]}</h3><table><thead><tr><th>Ref</th><th>Objective</th><th>Deadline</th><th>Activities</th></tr></thead><tbody>
          ${list.map((o) => `<tr class="click" data-href="#cpd/objective/${o.id}"><td><b>${esc(o.ref)}</b></td><td>${esc(o.title || o.area)}</td><td class="nowrap small">${fmtDate(o.deadline)}</td>
            <td class="nowrap">${cpd().activities.filter((a) => a.objective === o.id).length} · ${hoursFor(o)} h</td></tr>`).join('')}</tbody></table>` : ''; }).join('')}</div>
    </div><div>
      <div class="card"><div class="row spread"><h2 style="margin:0">Review of learning needs</h2>${ed ? '<button id="addReview">+ New review</button>' : ''}</div>
        <p class="small muted">At least once a year: look at your recent performance, what your employer and ICE expect, and your goals. A SWOT is a good way to do it.</p>
        ${reviews.map((r) => `<div class="mitem" data-id="${r.id}"><div class="row spread"><input type="date" class="rv" data-k="date" value="${esc(r.date)}"${dis(ed)}>${ed ? '<button class="small danger rv-del">✕</button>' : ''}</div>
          ${['strengths', 'weaknesses', 'opportunities', 'threats'].map((k) => `<label>${k[0].toUpperCase() + k.slice(1)}</label><textarea class="rv" data-k="${k}"${dis(ed)}>${esc(r[k] || '')}</textarea>`).join('')}
          <label>Conclusions: what I need to develop</label><textarea class="rv" data-k="notes"${dis(ed)}>${esc(r.notes || '')}</textarea></div>`).join('') || '<p class="muted">No review yet.</p>'}</div>
    </div></div>`;
}
function afterPlan() {
  $$('tr[data-href]').forEach((tr) => tr.addEventListener('click', () => { location.hash = tr.dataset.href; }));
  if (!canEdit()) return;
  $('#addObj').addEventListener('click', () => {
    const n = cpd().objectives.length;
    const o = { id: uid(), ref: 'OBJ' + n, title: '', date: today(), status: 'active', area: '', learn: '', action: '', resources: '', evaluate: '', deadline: '', notes: '' };
    cpd().objectives.push(o);
    changed();
    location.hash = '#cpd/objective/' + o.id;
  });
  $('#addReview').addEventListener('click', () => { cpd().reviews.push({ id: uid(), date: today(), strengths: '', weaknesses: '', opportunities: '', threats: '', notes: '' }); changed(); render(); });
  $$('.mitem[data-id]').forEach((card) => {
    const r = cpd().reviews.find((x) => x.id === card.dataset.id);
    $$('.rv', card).forEach((el) => el.addEventListener(el.type === 'date' ? 'change' : 'input', () => { r[el.dataset.k] = el.value; changed(); }));
    const del = $('.rv-del', card);
    if (del) del.addEventListener('click', async () => { if (await ask('Delete this review?', 'Delete')) { cpd().reviews.splice(cpd().reviews.indexOf(r), 1); changed(); render(); } });
  });
}

function cpdObjective(id) {
  const o = cpd().objectives.find((x) => x.id === id);
  if (!o) return '<div class="empty">Objective not found.</div>';
  const ed = canEdit();
  const acts = cpd().activities.filter((a) => a.objective === o.id);
  const area = (field, labelText) => `<div class="full"><label>${labelText}</label><textarea data-field="${field}"${dis(ed)}>${esc(o[field] || '')}</textarea></div>`;
  return `<a href="#cpd/plan">← Development plan</a>
    <div class="cols wide-left" style="margin-top:8px"><div class="card"><div class="form-grid">
      <div><label>Reference</label><input data-field="ref" value="${esc(o.ref)}"${dis(ed)}></div>
      <div><label>Date</label><input type="date" data-field="date" value="${esc(o.date)}"${dis(ed)}></div>
      <div><label>Status</label><select data-field="status"${dis(ed)}>${Object.entries(OBJ_STATUS).map(([k, v]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="full"><label>Short title</label><input data-field="title" value="${esc(o.title || '')}"${dis(ed)}></div>
      ${area('area', 'In what area do I need to improve my performance?')}
      ${area('learn', 'What do I need to learn in order to achieve this?')}
      ${area('action', 'What will I do to achieve this?')}
      ${area('resources', 'What are the likely resources and support that I will need?')}
      ${area('evaluate', 'How will I evaluate a successful outcome?')}
      <div><label>Deadline</label><input type="date" data-field="deadline" value="${esc(o.deadline || '')}"${dis(ed)}></div>
    </div></div>
    <div><div class="card"><h2>Activities (${acts.reduce((n, a) => n + (+a.hours || 0), 0)} h)</h2>${acts.length ? `<ul class="list-plain">${acts.map((a) => `<li><a href="#cpd/activity/${a.id}">${esc(a.details || '(no details)')}</a> <span class="small muted">${fmtDate(a.dateFrom)} · ${esc(a.hours)} h</span></li>`).join('')}</ul>` : '<p class="muted">None yet.</p>'}</div>
      ${ed ? `<button class="danger" id="delObj">Delete objective</button>` : ''}</div></div>`;
}
function afterObjective(id) {
  const o = cpd().objectives.find((x) => x.id === id);
  if (!o || !canEdit()) return;
  bindFields($('#main'), o);
  $('#delObj').addEventListener('click', async () => {
    const n = cpd().activities.filter((a) => a.objective === o.id).length;
    if (!(await ask(`Delete objective ${esc(o.ref)}?${n ? ` Its ${plural(n, 'activity', 'activities')} stay, without a plan reference.` : ''}`, 'Delete'))) return;
    for (const a of cpd().activities) if (a.objective === o.id) a.objective = '';
    cpd().objectives.splice(cpd().objectives.indexOf(o), 1);
    changed();
    location.hash = '#cpd/plan';
  });
}

function cpdExport() {
  const pr = P().profile;
  const ed = canEdit();
  return `<div class="cols"><div class="card"><h2>About you (printed at the top)</h2><div class="form-grid">
      <div class="full"><label>Job role</label><input id="pfRole" value="${esc(pr.jobRole)}"${dis(ed)}></div>
      <div class="full"><label>Responsibilities</label><textarea id="pfResp"${dis(ed)}>${esc(pr.responsibilities)}</textarea></div>
      <div class="full"><label>Engineering sector</label><input id="pfSector" value="${esc(pr.sector)}"${dis(ed)}></div></div></div>
    <div class="card"><h2>Export</h2><p class="small muted">Word files in the layout of ICE's CPD templates (Appendix A: development action plan, Appendix B: personal development record), saved in <code>${FOLDERS.exports}</code>. ICE accepts these for the Professional Review and the annual audit.</p>
      <label>CPD year</label><select id="exYear">${cpdYears().map((y) => `<option value="${y}">${cpdYearLabel(y)}</option>`).join('')}<option value="all">All years</option></select>
      <div class="row" style="margin-top:1rem"><button class="primary" id="exWord">Export to Word</button><button id="exXlsx">Export to Excel</button></div></div></div>`;
}
function afterExport() {
  if (canEdit()) {
    const pr = P().profile;
    $('#pfRole').addEventListener('input', (e) => { pr.jobRole = e.target.value; changed(); });
    $('#pfResp').addEventListener('input', (e) => { pr.responsibilities = e.target.value; changed(); });
    $('#pfSector').addEventListener('input', (e) => { pr.sector = e.target.value; changed(); });
  }
  $('#exWord').addEventListener('click', (e) => act(e.currentTarget, () => exportCpdWord($('#exYear').value), (p) => 'Saved ' + p));
  $('#exXlsx').addEventListener('click', (e) => act(e.currentTarget, () => exportCpdExcel($('#exYear').value), (p) => 'Saved ' + p));
}

function cpdSelection(year) {
  const acts = cpd().activities.filter((a) => year === 'all' || String(cpdYear(a.dateFrom)) === year).sort((a, b) => (a.dateFrom || '').localeCompare(b.dateFrom || ''));
  const used = new Set(acts.map((a) => a.objective));
  const objs = cpd().objectives.filter((o) => used.has(o.id) || o.status === 'active');
  return { acts, objs, label: year === 'all' ? 'all years' : cpdYearLabel(+year) };
}

async function exportCpdWord(year) {
  const { acts, objs, label } = cpdSelection(year);
  const pr = P().profile;
  const who = [{ type: 'p', text: `Name: ${P().name}` }, { type: 'p', text: `Job role, responsibilities, and engineering sector: ${[pr.jobRole, pr.responsibilities, pr.sector].filter(Boolean).join('; ')}` }];
  const reviews = cpd().reviews.filter((r) => year === 'all' || String(cpdYear(r.date)) === year);
  const blocks = [
    { type: 'title', text: `CPD development action plan (${label})` }, ...who,
    { type: 'h1', text: 'Review of learning needs' },
    ...(reviews.length ? reviews.flatMap((r) => [{ type: 'small', text: fmtDate(r.date) }, ...['strengths', 'weaknesses', 'opportunities', 'threats', 'notes'].filter((k) => r[k]).map((k) => ({ type: 'p', text: `${k === 'notes' ? 'Conclusions' : k[0].toUpperCase() + k.slice(1)}: ${r[k]}` }))]) : [{ type: 'p', text: '' }]),
    { type: 'h1', text: 'Development plan' },
    { type: 'table', widths: [1300, 1100, 2050, 2050, 2050, 2050, 2050, 1400], rows: [['Date', 'Ref', 'In what area do I need to improve my performance?', 'What do I need to learn in order to achieve this?', 'What will I do to achieve this?', 'What are the likely resources and support that I will need?', 'How will I evaluate a successful outcome?', 'What are my deadlines for meeting this target?'],
      ...objs.map((o) => [fmtDate(o.date), o.ref, o.area || o.title, o.learn, o.action, o.resources, o.evaluate, fmtDate(o.deadline)])] },
    { type: 'title', text: `CPD personal development record (${label})` }, ...who,
    { type: 'table', widths: [2400, 1500, 1100, 900, 1700, 1700, 1700, 1700, 1700], rows: [['Details of CPD activity (and ICE CPD Framework theme)', 'Dates', 'Effective learning time', 'Dev. plan ref.', 'Key learning points', 'Key benefits / value added', 'How has this learning activity helped you?', 'How will the learning be used in the future?', 'How will this influence my DAP next year?'],
      ...acts.map((a) => [a.details + (a.theme ? `\nTheme: ${a.theme}` : '') + (a.type ? `\n(${a.type})` : ''), fmtDate(a.dateFrom) + (a.dateTo && a.dateTo !== a.dateFrom ? ' – ' + fmtDate(a.dateTo) : ''), a.hours ? a.hours + ' h' : '', (objectiveOf(a) || {}).ref || '', a.learning, a.benefits, a.helped, a.future, a.dap])] },
    { type: 'small', text: `Total effective learning time: ${acts.reduce((n, a) => n + (+a.hours || 0), 0)} hours.` },
  ];
  const path = `${FOLDERS.exports}/CPD record ${label.replace('/', '-')} ${today()}.docx`;
  await writeFile(S.own, path, makeDocx(blocks, { landscape: true }));
  return path;
}

async function exportCpdExcel(year) {
  const path = `${FOLDERS.exports}/CPD record ${(year === 'all' ? 'all years' : cpdYearLabel(+year)).replace('/', '-')} ${today()}.xlsx`;
  await writeFile(S.own, path, makeXlsx(cpdSheets(year)));
  return path;
}
function cpdSheets(year) {
  const { acts, objs } = cpdSelection(year);
  const w = (s) => ({ v: s, s: 'wrap' });
  return [
    { name: 'Development plan', freeze: { rows: 1 }, filter: true, widths: [12, 8, 30, 30, 30, 30, 30, 12, 10],
      rows: [['Date', 'Ref', 'Area to improve', 'What to learn', 'What I will do', 'Resources and support', 'How I will evaluate', 'Deadline', 'Status'],
        ...objs.map((o) => [o.date, o.ref, w(o.area || o.title), w(o.learn), w(o.action), w(o.resources), w(o.evaluate), o.deadline, OBJ_STATUS[o.status] || ''])] },
    { name: 'Development record', freeze: { rows: 1 }, filter: true, widths: [12, 12, 36, 18, 18, 8, 8, 30, 30, 30, 30, 30],
      rows: [['From', 'To', 'Details of CPD activity', 'Type', 'CPD Framework theme', 'Hours', 'Plan ref.', 'Key learning points', 'Key benefits', 'How it helped', 'Future use', 'Influence on DAP'],
        ...acts.map((a) => [a.dateFrom, a.dateTo, w(a.details), a.type, a.theme, +a.hours || 0, (objectiveOf(a) || {}).ref || '', w(a.learning), w(a.benefits), w(a.helped), w(a.future), w(a.dap)])] },
  ];
}
