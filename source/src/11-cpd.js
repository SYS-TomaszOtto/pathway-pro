// CPD, following ICE's CPD guidance: a Development Action Plan (objectives with reference codes, after a
// review of learning needs) and a Personal Development Record (activities with effective learning time and
// an evaluation). Fully customisable fields/headings/types, Excel/CSV/PDF import, and Word/Excel export.

const CPD_TYPES = ['Learning on the job', 'Peer guidance and discussion', 'Employer training or presentation', 'Course', 'Conference, seminar or workshop',
  'ICE or regional event', 'Structured reading', 'Self-study (textbooks, study packs)', 'Online learning or webinar', 'Podcast or video', 'Work shadowing',
  'Site visit', 'Secondment', 'Writing reports or for publication', 'Giving a presentation or lecture', 'Coaching or mentoring others',
  'STEM outreach (schools, careers events)', 'ICE volunteering (reviewer, committee)', 'Research', 'Trade exhibition', 'Qualification (not your academic base)', 'Other'];
const OBJ_STATUS = { active: 'Active', complete: 'Complete', archived: 'Archived' };
const CPD_BUILTIN_FIELDS = [
  { key: 'details',   label: 'Details of CPD activity',                        kind: 'text',      builtin: true, showInTable: true,  hidden: false },
  { key: 'type',      label: 'Type',                                           kind: 'select',    builtin: true, showInTable: true,  hidden: false },
  { key: 'theme',     label: 'CPD Framework theme',                            kind: 'text',      builtin: true, showInTable: true,  hidden: false },
  { key: 'dateFrom',  label: 'From',                                           kind: 'date',      builtin: true, showInTable: true,  hidden: false },
  { key: 'dateTo',    label: 'To',                                             kind: 'date',      builtin: true, showInTable: false, hidden: false },
  { key: 'hours',     label: 'Effective learning time (hours)',                kind: 'number',    builtin: true, showInTable: true,  hidden: false },
  { key: 'objective', label: 'Development plan ref.',                          kind: 'objective', builtin: true, showInTable: true,  hidden: false },
  { key: 'tags',      label: 'Tags',                                           kind: 'tags',      builtin: true, showInTable: false, hidden: false },
  { key: 'learning',  label: 'Key learning points',                            kind: 'textarea',  builtin: true, showInTable: false, hidden: false },
  { key: 'benefits',  label: 'Key benefits / value added',                     kind: 'textarea',  builtin: true, showInTable: false, hidden: false },
  { key: 'helped',    label: 'How has this learning activity helped you?',     kind: 'textarea',  builtin: true, showInTable: false, hidden: false },
  { key: 'future',    label: 'How will the learning be used in the future?',   kind: 'textarea',  builtin: true, showInTable: false, hidden: false },
  { key: 'dap',       label: 'How will this influence my development plan next year?', kind: 'textarea', builtin: true, showInTable: false, hidden: false },
];
const CPD_KIND_LABELS = { text: 'Short text', textarea: 'Long text', number: 'Number', date: 'Date', tags: 'Tags', select: 'Activity type', objective: 'Plan objective' };

const cpd = () => P().cpd;
const objectiveOf = (a) => cpd().objectives.find((o) => o.id === a.objective);
const themes = () => (P().settings.themes || []).map((t) => ({ name: t.replace(/^\*\s*/, '').trim(), mandatory: /^\*/.test(t) })).filter((t) => t.name);

function cpdConfig() {
  const c = cpd();
  if (!c.config) c.config = {};
  if (!Array.isArray(c.config.types) || !c.config.types.length) c.config.types = [...CPD_TYPES];
  if (!Array.isArray(c.config.fields)) c.config.fields = [];
  const seen = new Set(c.config.fields.map((f) => f.key));
  for (const df of CPD_BUILTIN_FIELDS) if (!seen.has(df.key)) c.config.fields.push({ ...df });
  return c.config;
}
function cpdFieldVal(a, f) {
  if (f.builtin) {
    if (f.key === 'objective') { const o = objectiveOf(a); return o ? o.ref : ''; }
    const v = a[f.key];
    return Array.isArray(v) ? v.join(', ') : (v == null ? '' : String(v));
  }
  const v = (a.extra || {})[f.key];
  return Array.isArray(v) ? v.join(', ') : (v == null ? '' : String(v));
}
function cpdSlugKey(label) {
  const base = 'c_' + String(label || 'field').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 28);
  const used = new Set(cpdConfig().fields.map((f) => f.key));
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}_${n}`)) n++;
  return `${base}_${n}`;
}
const cpdSplitTags = (s) => String(s || '').split(/[,;|]/).map((x) => x.trim()).filter(Boolean);

function cpdYears() {
  const ys = new Set(cpd().activities.map((a) => cpdYear(a.dateFrom)).filter((y) => y !== null));
  ys.add(cpdYear(today()));
  return [...ys].sort((a, b) => b - a);
}

VIEWS.cpd = async (arg, q) => {
  cpdConfig();
  const [page, id] = (arg || 'overview').split('/');
  const tabs = [['overview', 'Overview'], ['plan', 'Development plan'], ['record', 'Development record'], ['customise', 'Customise'], ['export', 'Export']];
  const head = `<div class="row spread"><h1>CPD</h1>${canEdit() ? `<div class="row"><button id="addAct" class="primary">+ Record an activity</button><label class="btn" style="margin:0;color:var(--ink)">Import Excel / PDF<input type="file" id="cpdImpFile" accept=".xlsx,.xlsm,.csv,.pdf" hidden></label></div>` : ''}</div>
    <div class="sub-tabs">${tabs.map(([k, v]) => `<a href="#cpd/${k}" class="${page === k || (page === 'activity' && k === 'record') || (page === 'objective' && k === 'plan') ? 'active' : ''}">${v}</a>`).join('')}</div>`;
  const body = { overview: cpdOverview, plan: cpdPlan, record: cpdRecord, activity: cpdActivity, objective: cpdObjective, customise: cpdCustomise, export: cpdExport }[page] || cpdOverview;
  return head + body(id, q);
};
VIEWS.cpd.after = (arg, q) => {
  const [page, id] = (arg || 'overview').split('/');
  if ($('#addAct')) $('#addAct').addEventListener('click', () => {
    const a = { id: uid(), ref: '', objective: (cpd().objectives.find((o) => o.ref === 'UNP') || {}).id || '', details: '', theme: '', type: '', dateFrom: today(), dateTo: today(), hours: '',
      tags: [], learning: '', benefits: '', helped: '', future: '', dap: '', documents: [], subs: [], extra: {} };
    cpd().activities.push(a);
    changed();
    location.hash = '#cpd/activity/' + a.id;
  });
  if ($('#cpdImpFile')) $('#cpdImpFile').addEventListener('change', handleCpdImportFile);
  ({ activity: afterActivity, objective: afterObjective, plan: afterPlan, customise: afterCustomise, export: afterExport, record: afterRecord }[page] || (() => {}))(id, q);
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
    ${neededChecklist([
      { ok: hours >= target, text: `Log at least ${target} effective learning hours for ${cpdYearLabel(yr)} (${hours} h logged)`, href: '#cpd/record' },
      { ok: cpd().objectives.some((o) => o.status === 'active'), text: 'Have at least one active Development Action Plan objective', href: '#cpd/plan' },
      { ok: warnings.length === 0, text: `Complete details and evaluations (${warnings.length} to tidy up)` },
    ])}
    <div class="grid">
      <div class="card"><h2>${cpdYearLabel(yr)} by objective</h2>${table(sum(acts, (a) => { const o = objectiveOf(a); return o ? `${o.ref} ${o.title || o.area}` : ''; }))}</div>
      <div class="card"><h2>${cpdYearLabel(yr)} by type</h2>${table(sum(acts, (a) => a.type))}</div>
      <div class="card"><h2>${cpdYearLabel(yr)} by CPD Framework theme</h2>${table(sum(acts.filter((a) => a.theme), (a) => a.theme))}
        ${mandatory.length ? `<h3>Mandatory themes, last 3 years</h3>${mandatory.map((t) => `<div>${covered(t) ? '<span class="good">✓</span>' : '<span class="bad">✕</span>'} ${esc(t.name)}</div>`).join('')}` : `<p class="small muted">Add ICE's CPD Framework themes in <a href="#cpd/customise">Customise</a> or <a href="#settings">Settings</a> to track them (mark the mandatory ones with *).</p>`}</div>
      <div class="card"><h2>To tidy up</h2>${warnings.length ? `<ul class="list-plain">${warnings.slice(0, 15).map(({ a, w }) => `<li><a href="#cpd/activity/${a.id}">${esc(a.details || '(no details)')}</a><div class="small part">${w.map(esc).join(' · ')}</div></li>`).join('')}</ul>` : '<p class="good">All activities are complete.</p>'}</div>
    </div>`;
}

function cpdRecord(id, q) {
  const year = q.get('year') || String(cpdYears()[0]);
  const list = cpd().activities.filter((a) => year === 'all' || String(cpdYear(a.dateFrom)) === year).sort((a, b) => (b.dateFrom || '').localeCompare(a.dateFrom || ''));
  const total = list.reduce((n, a) => n + (+a.hours || 0), 0);
  const fields = cpdConfig().fields;
  const cols = fields.filter((f) => f.showInTable && !f.hidden);
  const useCols = cols.length ? cols : fields.slice(0, 6);
  const cell = (a, f) => {
    if (f.key === 'dateFrom') return `<td class="nowrap small">${fmtDate(a.dateFrom)}${a.dateTo && a.dateTo !== a.dateFrom ? ' – ' + fmtDate(a.dateTo) : ''}</td>`;
    if (f.key === 'details') return `<td>${esc(a.details || '(no details)')}${a.documents && a.documents.length ? ' 📎' : ''}</td>`;
    if (f.key === 'hours') return `<td class="right">${esc(a.hours)}</td>`;
    const val = cpdFieldVal(a, f);
    if (f.kind === 'tags' && val) return `<td>${cpdSplitTags(val).map((t) => chip(t)).join('')}</td>`;
    return `<td class="small">${esc(val)}</td>`;
  };
  return `<div class="row" style="margin-bottom:8px"><label style="margin:0">CPD year</label><select id="cpdYear">${cpdYears().map((y) => `<option value="${y}" ${String(y) === year ? 'selected' : ''}>${cpdYearLabel(y)}</option>`).join('')}<option value="all" ${year === 'all' ? 'selected' : ''}>All years</option></select>
      <span class="muted">${plural(list.length, 'activity', 'activities')} · ${total} hours</span></div>
    ${list.length ? `<div class="card table-wrap" tabindex="0" role="region" aria-label="Table"><table><thead><tr>${useCols.map((f) => `<th>${esc(f.label)}</th>`).join('')}<th></th></tr></thead><tbody>
      ${list.map((a) => { const w = cpdWarnings(a); return `<tr class="click" data-href="#cpd/activity/${a.id}">${useCols.map((f) => cell(a, f)).join('')}
        <td>${w.length ? `<span class="part" title="${esc(w.join('\n'))}">!</span>` : ''}</td></tr>`; }).join('')}</tbody></table></div>`
      : emptyState('grid', 'No activities recorded for this year.')}`;
}
function afterRecord(id, q) {
  $$('tr[data-href]').forEach((tr) => tr.addEventListener('click', () => { location.hash = tr.dataset.href; }));
  $('#cpdYear').addEventListener('change', (e) => { location.hash = '#cpd/record?year=' + e.target.value; });
}

function cpdActivityFieldHtml(a, f, ed) {
  const full = f.kind === 'textarea' || f.key === 'details' || f.kind === 'tags' ? ' class="full"' : '';
  const attr = f.builtin ? `data-field="${esc(f.key)}"` : `data-extra="${esc(f.key)}"`;
  const kindAttr = `data-fkind="${esc(f.kind)}"`;
  const raw = f.builtin ? a[f.key] : (a.extra || {})[f.key];
  const val = Array.isArray(raw) ? raw.join(', ') : (raw == null ? '' : String(raw));
  if (f.kind === 'select') {
    const types = cpdConfig().types;
    const opts = val && !types.includes(val) ? [val, ...types] : types;
    return `<div${full}><label>${esc(f.label)}</label><select ${attr}${dis(ed)}><option value="">–</option>${opts.map((t) => `<option ${val === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`;
  }
  if (f.kind === 'objective') {
    return `<div${full}><label>${esc(f.label)}</label><select ${attr}${dis(ed)}><option value="">–</option>${cpd().objectives.map((o) => `<option value="${o.id}" ${val === o.id ? 'selected' : ''}>${esc(o.ref)} – ${esc(o.title || o.area)}</option>`).join('')}</select></div>`;
  }
  if (f.kind === 'textarea') return `<div${full}><label>${esc(f.label)}</label><textarea ${attr}${dis(ed)}>${esc(val)}</textarea></div>`;
  if (f.kind === 'date') return `<div${full}><label>${esc(f.label)}</label><input type="date" ${attr} value="${esc(val)}"${dis(ed)}></div>`;
  if (f.kind === 'number') return `<div${full}><label>${esc(f.label)}</label><input type="number" min="0" step="0.25" ${attr} value="${esc(val)}"${dis(ed)}></div>`;
  if (f.key === 'theme') return `<div${full}><label>${esc(f.label)}</label><input ${attr} value="${esc(val)}" list="themeList"${dis(ed)}><datalist id="themeList">${themes().map((t) => `<option>${esc(t.name)}</option>`).join('')}</datalist></div>`;
  const ph = f.kind === 'tags' ? ' placeholder="Comma-separated"' : f.key === 'details' ? ' placeholder="e.g. ICE webinar: Eurocode 7 changes"' : '';
  return `<div${full}><label>${esc(f.label)}</label><input ${attr} ${kindAttr} value="${esc(val)}"${ph}${dis(ed)}></div>`;
}

function cpdActivity(id) {
  const a = cpd().activities.find((x) => x.id === id);
  if (!a) return '<div class="empty">Activity not found.</div>';
  const ed = canEdit();
  const fields = cpdConfig().fields;
  const evalKeys = new Set(['learning', 'benefits', 'helped', 'future', 'dap']);
  const mainFields = fields.filter((f) => !f.hidden && !evalKeys.has(f.key));
  const evalFields = fields.filter((f) => !f.hidden && evalKeys.has(f.key));
  const hiddenBuiltins = fields.filter((f) => f.hidden && f.builtin);
  return `<a href="#cpd/record">← Development record</a>
    <div class="cols wide-left" style="margin-top:8px"><div>
      <div class="card"><h2>Development activity</h2><div class="form-grid">
        ${mainFields.map((f) => cpdActivityFieldHtml(a, f, ed)).join('')}
      </div></div>
      ${evalFields.length ? `<div class="card"><h2>Evaluation</h2><div class="form-grid">
        ${evalFields.map((f) => cpdActivityFieldHtml(a, f, ed)).join('')}
      </div></div>` : ''}
      ${hiddenBuiltins.length ? `<details class="card"><summary><b>More default fields</b> (${hiddenBuiltins.length})</summary><div class="form-grid" style="margin-top:8px">
        ${hiddenBuiltins.map((f) => cpdActivityFieldHtml(a, f, ed)).join('')}
      </div></details>` : ''}
    </div><div>
      <div class="card"><h2>Checks</h2><div id="actWarn"></div></div>
      <div class="card"><h2>Supporting documents</h2><p class="small muted">Certificates, handouts, notes. They are copied into <code>${FOLDERS.cpd}</code>. ICE does not ask for them, but they are handy.</p>
        <ul class="list-plain">${(a.documents || []).map((p, i) => `<li>${fileLink(p)} ${ed ? `<button class="small danger doc-del" data-i="${i}" title="Remove from this activity (the file stays)">✕</button>` : ''}</li>`).join('') || '<li class="muted">None.</li>'}</ul>
        ${ed ? '<label class="btn small" style="margin-top:.5rem;color:var(--ink)">Attach a file…<input type="file" id="attach" hidden multiple></label>' : ''}</div>
      ${P().mode !== 'cpd' ? `<div class="card"><h2>${cap1(LABEL.items)}</h2><p class="small muted">Optional: which ${LABEL.items} this learning supports (as Knowledge). To count it as evidence, save the certificate into the Evidence folder and map it there.</p>
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
  let lastFrom = a.dateFrom;
  bindFields($('#main'), a, (key, el) => {
    if (el && el.dataset.fkind === 'tags') { a[key] = cpdSplitTags(el.value); changed(); }
    if (key === 'dateFrom') {
      const toEl = $('[data-field=dateTo]');
      if (!a.dateTo || a.dateTo === lastFrom || a.dateTo < a.dateFrom) { a.dateTo = a.dateFrom; if (toEl) toEl.value = a.dateTo; changed(); }
      lastFrom = a.dateFrom;
    }
    warn();
  });
  for (const el of $$('[data-extra]', $('#main'))) {
    const k = el.dataset.extra;
    const ev = el.tagName === 'SELECT' || el.type === 'date' ? 'change' : 'input';
    el.addEventListener(ev, () => {
      if (!a.extra) a.extra = {};
      a.extra[k] = el.dataset.fkind === 'tags' ? cpdSplitTags(el.value) : el.value;
      changed();
    });
  }
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

function cpdCustomise() {
  const ed = canEdit();
  const cfg = cpdConfig();
  const target = +P().settings.cpdTarget || 30;
  return `<div class="cols">
    <div class="card">
      <div class="row spread"><h2 style="margin:0">CPD fields &amp; headings</h2>${ed ? '<button class="small" id="cpdResetFields">Reset defaults</button>' : ''}</div>
      <p class="small muted">Rename headings, reorder fields, choose which columns show in the record table, or add custom fields. Hidden default fields stay available under "More default fields" on each activity.</p>
      <div class="table-wrap"><table><thead><tr><th>Heading</th><th>Kind</th><th>Table</th><th>Hide</th><th></th></tr></thead><tbody>
        ${cfg.fields.map((f, idx) => `<tr data-fidx="${idx}">
          <td><input class="cf-label" value="${esc(f.label)}" style="width:100%"${dis(ed)}></td>
          <td class="small muted">${esc(CPD_KIND_LABELS[f.kind] || f.kind)}${f.builtin ? '' : ' · custom'}</td>
          <td><input type="checkbox" class="cf-table"${f.showInTable ? ' checked' : ''}${dis(ed)}></td>
          <td><input type="checkbox" class="cf-hide"${f.hidden ? ' checked' : ''}${dis(ed)}></td>
          <td class="nowrap">${ed ? `<button class="small cf-up"${idx === 0 ? ' disabled' : ''}>↑</button> <button class="small cf-dn"${idx === cfg.fields.length - 1 ? ' disabled' : ''}>↓</button>${f.builtin ? '' : ' <button class="small danger cf-del">✕</button>'}` : ''}</td>
        </tr>`).join('')}</tbody></table></div>
      ${ed ? `<div class="row" style="margin-top:.7rem"><input id="cfNewLabel" placeholder="New custom field heading (e.g. Provider, Location)" style="flex:1"><select id="cfNewKind"><option value="text">Short text</option><option value="textarea">Long text</option><option value="number">Number</option><option value="date">Date</option><option value="tags">Tags</option></select><button class="primary small" id="cfAdd">+ Add field</button></div>` : ''}
    </div>
    <div class="card">
      <h2>Targets, themes &amp; activity types</h2>
      <div class="form-grid">
        <div><label>Annual CPD target (hours)</label><input type="number" min="1" id="cfTarget" value="${esc(target)}"${dis(ed)}></div>
        <div class="full"><label>CPD Framework themes (one per line; prefix * for mandatory)</label><textarea id="cfThemes" rows="4"${dis(ed)}>${esc((P().settings.themes || []).join('\n'))}</textarea></div>
        <div class="full"><label>Activity types (one per line)</label><textarea id="cfTypes" rows="8"${dis(ed)}>${esc(cfg.types.join('\n'))}</textarea></div>
      </div>
      ${ed ? '<div class="row" style="margin-top:.8rem"><button class="primary" id="cfSaveMeta">Save settings &amp; types</button></div>' : ''}
    </div>
  </div>`;
}
function afterCustomise() {
  if (!canEdit()) return;
  const cfg = cpdConfig();
  $$('tr[data-fidx]').forEach((tr) => {
    const idx = +tr.dataset.fidx, f = cfg.fields[idx];
    $('.cf-label', tr).addEventListener('change', (e) => { if (e.target.value.trim()) { f.label = e.target.value.trim(); changed(); } });
    $('.cf-table', tr).addEventListener('change', (e) => { f.showInTable = e.target.checked; changed(); });
    $('.cf-hide', tr).addEventListener('change', (e) => { f.hidden = e.target.checked; changed(); });
    const up = $('.cf-up', tr), dn = $('.cf-dn', tr), del = $('.cf-del', tr);
    if (up) up.addEventListener('click', () => { if (idx > 0) { [cfg.fields[idx - 1], cfg.fields[idx]] = [cfg.fields[idx], cfg.fields[idx - 1]]; changed(); render(); } });
    if (dn) dn.addEventListener('click', () => { if (idx < cfg.fields.length - 1) { [cfg.fields[idx + 1], cfg.fields[idx]] = [cfg.fields[idx], cfg.fields[idx + 1]]; changed(); render(); } });
    if (del) del.addEventListener('click', () => { cfg.fields.splice(idx, 1); changed(); render(); });
  });
  $('#cfAdd').addEventListener('click', () => {
    const lbl = $('#cfNewLabel').value.trim();
    if (!lbl) return;
    cfg.fields.push({ key: cpdSlugKey(lbl), label: lbl, kind: $('#cfNewKind').value, builtin: false, showInTable: true, hidden: false });
    changed(); render(); toast(`Added field "${lbl}"`);
  });
  $('#cpdResetFields').addEventListener('click', () => {
    const custom = cfg.fields.filter((f) => !f.builtin);
    cfg.fields = [...CPD_BUILTIN_FIELDS.map((f) => ({ ...f })), ...custom];
    changed(); render(); toast('Default headings restored');
  });
  $('#cfSaveMeta').addEventListener('click', () => {
    const types = $('#cfTypes').value.split('\n').map((s) => s.trim()).filter(Boolean);
    if (types.length) cfg.types = types;
    P().settings.themes = $('#cfThemes').value.split('\n').map((s) => s.trim()).filter(Boolean);
    P().settings.cpdTarget = Math.max(1, +$('#cfTarget').value || 30);
    changed(); toast('CPD settings saved');
  });
}

// ---------- Excel / CSV / PDF import ----------
const CPD_FIELD_PATS = [
  ['dateFrom',  /\b(from|start\s*date|date\s*from|date\s*completed|date\s*attended|date)\b/i],
  ['dateTo',    /\b(to|end\s*date|date\s*to|finish)\b/i],
  ['hours',     /\b(hours?|hrs?|effective\s*learning|duration|cpd\s*time|credits?|points?)\b/i],
  ['type',      /\b(type|format|method|delivery|activity\s*type|category)\b/i],
  ['theme',     /\b(theme|framework|topic|domain|pillar)\b/i],
  ['objective', /\b(plan\s*ref|dev\.?\s*plan\s*ref|objective|dap\s*ref|ref\.?)\b/i],
  ['tags',      /\b(tags?|labels?|keywords?)\b/i],
  ['subs',      /\b(attributes?|sub-?attributes?|competenc|ksbs?|uk-?spec)\b/i],
  ['learning',  /\b(key\s*learning|learning\s*points?|learning\s*outcomes?|takeaways?)\b/i],
  ['benefits',  /\b(benefits?|value\s*added)\b/i],
  ['helped',    /\b(helped|impact)\b/i],
  ['future',    /\b(future|apply|application|next\s*steps?)\b/i],
  ['dap',       /\b(influence|next\s*year|dap\s*next)\b/i],
  ['details',   /\b(details?|activity|title|description|course|event|training|subject|name|summary)\b/i],
];
function cpdExtractTable(rawRows) {
  const cleaned = rawRows.map((r) => r.map((c) => String(c ?? '').replace(/\s+/g, ' ').trim())).filter((r) => r.some(Boolean));
  if (!cleaned.length) return { headers: [], rows: [] };
  let hdrIdx = 0;
  for (let i = 0; i < Math.min(12, cleaned.length); i++) {
    const ne = cleaned[i].filter(Boolean);
    if (ne.length >= 2 && ne.filter((c) => !/^[\d.,/\-:]+$/.test(c)).length >= 2) { hdrIdx = i; break; }
  }
  const width = Math.max(...cleaned.slice(hdrIdx).map((r) => r.length));
  const headers = Array.from({ length: width }, (_, i) => cleaned[hdrIdx][i] || `Column ${i + 1}`);
  const rows = [];
  for (const r of cleaned.slice(hdrIdx + 1)) {
    const pad = Array.from({ length: width }, (_, i) => r[i] || '');
    if (pad.every((v, i) => v === headers[i])) continue;
    const first = pad.find(Boolean) || '';
    if (/^total\b/i.test(first) && pad.filter(Boolean).length <= 3) continue;
    if (pad.some(Boolean)) rows.push(pad);
  }
  return { headers, rows };
}
function cpdParseDateFlex(s) {
  const t = String(s || '').trim();
  if (!t) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (m) { let [, d, mo, y] = m; if (y.length === 2) y = (+y >= 70 ? '19' : '20') + y; return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`; }
  const dt = new Date(t);
  return Number.isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10);
}
async function handleCpdImportFile(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    let headers = [], rows = [], source = file.name;
    if (ext === 'xlsx' || ext === 'xlsm') {
      const sheets = await parseXlsx(await file.arrayBuffer());
      let best = null;
      for (const sh of sheets) {
        const t = cpdExtractTable(sh.rows);
        if (!t.rows.length) continue;
        const score = t.rows.length + (/record|cpd|activit|log/i.test(sh.name) ? 1000 : 0);
        if (!best || score > best.score) best = { score, name: sh.name, ...t };
      }
      if (best) { headers = best.headers; rows = best.rows; source = best.name; }
    } else if (ext === 'csv') {
      ({ headers, rows } = cpdExtractTable(parseCsvText(await file.text())));
      source = 'CSV';
    } else if (ext === 'pdf') {
      const lines = await parsePdfLines(await file.arrayBuffer());
      const tabRows = lines.map((l) => l.split('\t').map((x) => x.trim()).filter(Boolean));
      const multiCol = tabRows.filter((r) => r.length >= 2);
      if (multiCol.length >= 2) {
        ({ headers, rows } = cpdExtractTable(multiCol));
        source = 'PDF table';
      } else {
        const kv = []; let cur = {};
        for (const ln of lines) {
          const m = ln.match(/^([A-Za-z][A-Za-z0-9 /\-().]{1,36}):\s+(.+)$/);
          if (m) {
            const k = m[1].trim(), v = m[2].trim();
            if (cur[k] && Object.keys(cur).length >= 2) { kv.push(cur); cur = {}; }
            cur[k] = v;
          }
        }
        if (Object.keys(cur).length >= 2) kv.push(cur);
        if (kv.length) {
          headers = [...new Set(kv.flatMap((o) => Object.keys(o)))];
          rows = kv.map((o) => headers.map((h) => o[h] || ''));
          source = 'PDF text';
        } else {
          const dated = lines.map((ln) => {
            const dm = ln.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})/);
            const hm = ln.match(/(\d+(?:\.\d+)?)\s*(?:hrs?|hours?|h)\b/i);
            return (dm || hm) ? [dm ? dm[1] : '', ln, hm ? hm[1] : ''] : null;
          }).filter(Boolean);
          if (dated.length) { headers = ['Date', 'Details of CPD activity', 'Hours']; rows = dated; source = 'PDF lines'; }
          else if (lines.length) { headers = ['Details of CPD activity']; rows = lines.slice(0, 100).map((l) => [l]); source = 'PDF lines'; }
        }
      }
    } else {
      toast('Unsupported file type. Use .xlsx, .csv or .pdf', 'bad'); return;
    }
    if (!rows.length) { toast('No rows found in that file.'); return; }
    const used = new Set();
    const suggested = headers.map((h) => {
      if (/\b(date\s*to|end\s*date|^to$)\b/i.test(h) && !used.has('dateTo')) { used.add('dateTo'); return 'dateTo'; }
      for (const [k, pat] of CPD_FIELD_PATS) {
        if (!used.has(k) && pat.test(h)) { used.add(k); return k; }
      }
      return 'custom';
    });
    const mapOpts = [['custom', 'Custom field (keep heading)'], ['skip', 'Skip column'], ...CPD_BUILTIN_FIELDS.map((f) => [f.key, `Default: ${f.label}`]), ['subs', 'Default: Attributes']];
    dialog(`<h2>Import CPD activities</h2>
      <p class="small muted">Found ${rows.length} rows (${headers.length} columns) from ${esc(source)}. Choose how each imported column maps below.</p>
      <div class="row" style="margin:.4rem 0"><label style="display:inline-flex;gap:6px;align-items:center;margin:0;color:var(--ink)"><input type="checkbox" id="impRename" checked> Match built-in headings to imported column names</label>
        <label style="display:inline-flex;gap:6px;align-items:center;margin:0;color:var(--ink)"><input type="checkbox" id="impShowCols" checked> Show imported columns in the record table</label></div>
      <div style="overflow:auto;max-height:34vh;margin:.5rem 0"><table><thead><tr><th>Imported heading</th><th>Maps to</th><th>Sample value</th></tr></thead><tbody>
        ${headers.map((h, i) => `<tr><td><b>${esc(h)}</b></td><td><select class="imp-col" data-ci="${i}">${mapOpts.map(([k, lbl]) => `<option value="${esc(k)}"${suggested[i] === k ? ' selected' : ''}>${esc(lbl)}</option>`).join('')}</select></td><td class="small muted">${esc(rows[0][i] || '')}</td></tr>`).join('')}</tbody></table></div>
      <details open style="margin:.4rem 0"><summary>Preview (first 5 rows)</summary><div style="overflow:auto;max-height:24vh;margin-top:.3rem"><table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>
        ${rows.slice(0, 5).map((r) => `<tr>${r.map((c) => `<td class="small">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>
      <div class="row" style="justify-content:flex-end;margin-top:.8rem"><button value="no">Cancel</button><button class="primary" id="impConfirm">Import ${rows.length} activities</button></div>`, (d) => {
      $('#impConfirm', d).addEventListener('click', () => {
        const cfg = cpdConfig();
        const renameBuiltins = $('#impRename', d).checked;
        const showCols = $('#impShowCols', d).checked;
        const mapping = $$('.imp-col', d).map((s) => s.value);
        const customKey = {};
        headers.forEach((h, i) => {
          const target = mapping[i];
          if (target === 'skip') return;
          if (target === 'custom') {
            const ex = cfg.fields.find((f) => !f.builtin && f.label.toLowerCase() === h.toLowerCase());
            const key = ex ? ex.key : cpdSlugKey(h);
            if (!ex) cfg.fields.push({ key, label: h, kind: 'text', builtin: false, showInTable: showCols, hidden: false });
            else if (showCols) { ex.showInTable = true; ex.hidden = false; }
            customKey[i] = key;
          } else {
            const f = cfg.fields.find((x) => x.key === target);
            if (f) {
              if (renameBuiltins && h.trim()) f.label = h.trim();
              if (showCols) { f.showInTable = true; f.hidden = false; }
            }
          }
        });
        const objs = cpd().objectives;
        for (const row of rows) {
          const act = { id: uid(), ref: '', objective: '', details: '', theme: '', type: '', dateFrom: '', dateTo: '', hours: '', tags: [], learning: '', benefits: '', helped: '', future: '', dap: '', documents: [], subs: [], extra: {} };
          row.forEach((val, i) => {
            const target = mapping[i];
            if (!val || target === 'skip') return;
            if (target === 'custom') act.extra[customKey[i]] = val;
            else if (target === 'dateFrom' || target === 'dateTo') act[target] = cpdParseDateFlex(val) || val;
            else if (target === 'hours') { const hm = val.match(/(\d+(?:\.\d+)?)/); act.hours = hm ? hm[1] : ''; }
            else if (target === 'tags' || target === 'subs') act[target] = cpdSplitTags(val);
            else if (target === 'objective') {
              const mo = objs.find((o) => o.ref.toLowerCase() === val.toLowerCase() || (o.title || '').toLowerCase() === val.toLowerCase());
              if (mo) act.objective = mo.id; else act.extra.imported_objective = val;
            } else {
              act[target] = act[target] ? `${act[target]}\n${val}` : val;
              if (target === 'type' && !cfg.types.includes(val)) cfg.types.push(val);
            }
          });
          if (act.dateFrom && !act.dateTo) act.dateTo = act.dateFrom;
          if (!act.details) act.details = Object.values(act.extra).find(Boolean) || act.type || act.theme || '(imported activity)';
          cpd().activities.push(act);
        }
        changed();
        d.close();
        toast(`Imported ${plural(rows.length, 'activity', 'activities')}`);
        location.hash = '#cpd/record?year=all';
        render();
      });
      $('button[value=no]', d).addEventListener('click', () => d.close());
    });
  } catch (err) {
    toast('Import failed: ' + err.message);
  }
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
  const fields = cpdConfig().fields.filter((f) => !f.hidden);
  const customFields = fields.filter((f) => !f.builtin);
  const lbl = (k, fallback) => (fields.find((f) => f.key === k) || {}).label || fallback;
  const blocks = [
    { type: 'title', text: `CPD development action plan (${label})` }, ...who,
    { type: 'h1', text: 'Review of learning needs' },
    ...(reviews.length ? reviews.flatMap((r) => [{ type: 'small', text: fmtDate(r.date) }, ...['strengths', 'weaknesses', 'opportunities', 'threats', 'notes'].filter((k) => r[k]).map((k) => ({ type: 'p', text: `${k === 'notes' ? 'Conclusions' : k[0].toUpperCase() + k.slice(1)}: ${r[k]}` }))]) : [{ type: 'p', text: '' }]),
    { type: 'h1', text: 'Development plan' },
    { type: 'table', widths: [1300, 1100, 2050, 2050, 2050, 2050, 2050, 1400], rows: [['Date', 'Ref', 'In what area do I need to improve my performance?', 'What do I need to learn in order to achieve this?', 'What will I do to achieve this?', 'What are the likely resources and support that I will need?', 'How will I evaluate a successful outcome?', 'What are my deadlines for meeting this target?'],
      ...objs.map((o) => [fmtDate(o.date), o.ref, o.area || o.title, o.learn, o.action, o.resources, o.evaluate, fmtDate(o.deadline)])] },
    { type: 'title', text: `CPD personal development record (${label})` }, ...who,
    { type: 'table', widths: [2400, 1500, 1100, 900, 1700, 1700, 1700, 1700, 1700], rows: [[lbl('details', 'Details of CPD activity'), 'Dates', lbl('hours', 'Effective learning time'), lbl('objective', 'Dev. plan ref.'), lbl('learning', 'Key learning points'), lbl('benefits', 'Key benefits / value added'), lbl('helped', 'How has this learning activity helped you?'), lbl('future', 'How will the learning be used in the future?'), lbl('dap', 'How will this influence my DAP next year?')],
      ...acts.map((a) => {
        const extraLines = customFields.map((f) => { const v = cpdFieldVal(a, f); return v ? `${f.label}: ${v}` : ''; }).filter(Boolean);
        const tagLine = (a.tags && a.tags.length) ? `Tags: ${a.tags.join(', ')}` : '';
        return [[a.details, a.theme ? `${lbl('theme', 'Theme')}: ${a.theme}` : '', a.type ? `(${a.type})` : '', tagLine, ...extraLines].filter(Boolean).join('\n'),
          fmtDate(a.dateFrom) + (a.dateTo && a.dateTo !== a.dateFrom ? ' – ' + fmtDate(a.dateTo) : ''), a.hours ? a.hours + ' h' : '', (objectiveOf(a) || {}).ref || '', a.learning, a.benefits, a.helped, a.future, a.dap];
      })] },
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
  const fields = cpdConfig().fields.filter((f) => !f.hidden);
  return [
    { name: 'Development plan', freeze: { rows: 1 }, filter: true, widths: [12, 8, 30, 30, 30, 30, 30, 12, 10],
      rows: [['Date', 'Ref', 'Area to improve', 'What to learn', 'What I will do', 'Resources and support', 'How I will evaluate', 'Deadline', 'Status'],
        ...objs.map((o) => [o.date, o.ref, w(o.area || o.title), w(o.learn), w(o.action), w(o.resources), w(o.evaluate), o.deadline, OBJ_STATUS[o.status] || ''])] },
    { name: 'Development record', freeze: { rows: 1 }, filter: true, widths: fields.map((f) => (f.kind === 'textarea' || f.key === 'details' ? 32 : f.kind === 'number' ? 10 : 16)),
      rows: [fields.map((f) => f.label),
        ...acts.map((a) => fields.map((f) => {
          const val = cpdFieldVal(a, f);
          if (f.kind === 'number') return +val || 0;
          return f.kind === 'textarea' || f.key === 'details' ? w(val) : val;
        }))] },
  ];
}
