// One evidence item, laid out like the server copy's item page (Nov 2026): the file on the left, and on the right the
// summary, background notes, one card per mapping (level, strength, official wording, KSBs, how it contributes,
// why this level, quotes, comments and the mentor's verdict) and "+ Add a sub-attribute". No AI: everything is typed.
// rec.thread = { "": [...item comments], "<sub>": [...] } holds the apprentice's comments {by, text, at};
// the mentor's are in M().evidence[code].thread (same shape) and their verdicts in M().evidence[code].verdicts { "<sub>": v }.

const STRENGTHS = ['strong', 'supporting', 'weak'];
const VERDICTS = { agree: 'Agree', more: 'Needs more', disagree: 'Disagree' };
const ITEM_FACTS = [['type', 'Type of document'], ['role', 'Your role'], ['what', 'What was done'], ['technical', 'Technical content'], ['outcome', 'Outcome']];
const listOf = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
const mentorEv = (code) => (code && M() && M().evidence[code]) || {};
const threadOf = (rec, code, key) => [...(((rec || {}).thread || {})[key] || []), ...((mentorEv(code).thread || {})[key] || [])].sort((a, b) => a.at - b.at);

function threadHtml(rec, code, key, placeholder) {
  const v = key && mentorEv(code).verdicts ? mentorEv(code).verdicts[key] : '';
  const can = canEdit() || (isMentor() && code);
  return `<div class="discuss" data-thread="${esc(key)}">
    ${key && isMentor() ? `<div class="row"><span class="small muted">Your assessment:</span>${Object.entries(VERDICTS).map(([k, t]) => `<button type="button" class="small vd" data-v="${k}" aria-pressed="${v === k}">${t}</button>`).join('')}</div>`
      : v ? `<p class="small">Mentor's assessment: ${chip(VERDICTS[v], v === 'agree' ? 'good' : v === 'more' ? 'part' : 'bad')}</p>` : ''}
    ${threadOf(rec, code, key).map((c) => `<div class="sk-bubble"><span class="small muted">${esc(c.by)} · ${esc(new Date(c.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }))}</span><div>${linkify(c.text)}</div></div>`).join('')}
    ${can ? `<textarea rows="2" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}"></textarea><div class="row"><button type="button" class="small addc">Add comment</button></div>` : ''}</div>`;
}

function mappingCard(m, i, rec, firstOfSub) {
  const ed = canEdit(), a = SUB[m.sub] || { text: '', group_title: '' };
  const cur = m.ksbs || [];
  const linked = KSBS.filter((k) => k.attributes.includes(m.sub) && !cur.includes(k.id));
  const others = KSBS.filter((k) => !k.attributes.includes(m.sub) && !cur.includes(k.id));
  const opt = (k) => `<option value="${esc(k.id)}">${esc(k.id)} · ${esc(k.text.slice(0, 50))}</option>`;
  return `<div class="card mapping" data-i="${i}"><div class="mapping-head"><span class="title">${subLink(m.sub)} · ${esc(a.group_title || '')}</span>
      <select class="m-level" aria-label="Level for ${esc(m.sub)}"${dis(ed)}>${LEVELS.map((l) => `<option value="${l}" ${l === m.level ? 'selected' : ''}>${esc(LEVEL_NAME[l])}</option>`).join('')}</select>
      <select class="m-strength" aria-label="Strength for ${esc(m.sub)}"${dis(ed)}><option value="">strength?</option>${STRENGTHS.map((s) => `<option ${s === m.strength ? 'selected' : ''}>${s}</option>`).join('')}</select>
      ${ed ? `<button type="button" class="small danger m-del" aria-label="Remove ${esc(m.sub)} ${esc(LEVEL_NAME[m.level] || '')}">Remove</button>` : ''}</div>
    <div class="official">${esc(a.text)}</div>
    ${KSBS.length ? `<div class="ksb-row"><span class="small muted">${esc(LABEL.ksb)}:</span> ${cur.map((k) => `<span class="chip" title="${esc((KSBS.find((x) => x.id === k) || {}).text || '')}">${esc(k)}${ed ? `<button type="button" class="chip-x m-ksb-del" data-k="${esc(k)}" aria-label="Remove ${esc(k)}">×</button>` : ''}</span>`).join('') || '<span class="small muted">none</span>'}
      ${ed ? `<select class="m-ksb-add" aria-label="Add ${esc(LABEL.ksb)} to ${esc(m.sub)}"><option value="">+ Add…</option>${linked.length ? `<optgroup label="Linked to ${esc(m.sub)}">${linked.map(opt).join('')}</optgroup>` : ''}${others.length ? `<optgroup label="Others">${others.map(opt).join('')}</optgroup>` : ''}</select>` : ''}</div>` : ''}
    <label>How it contributes</label><textarea class="m-note" rows="2" placeholder="What this evidence shows for ${esc(m.sub)}"${dis(ed)}>${esc(m.note || '')}</textarea>
    <label>Why this level</label><input class="m-reason" value="${esc(m.reason || '')}" placeholder="e.g. I did the check myself and signed it off"${dis(ed)}>
    ${(m.quotes || []).map((q, qi) => `<blockquote class="quote-row"><textarea class="m-quote" data-qi="${qi}" rows="2" aria-label="Quote ${qi + 1}"${dis(ed)}>${esc(q)}</textarea>${ed ? `<button type="button" class="chip-x m-quote-del" data-qi="${qi}" aria-label="Remove quote ${qi + 1}">×</button>` : ''}</blockquote>`).join('')}
    ${ed ? '<div class="row"><button type="button" class="small m-quote-add">+ Add quote</button></div>' : ''}
    ${firstOfSub ? threadHtml(rec, rec.code, m.sub, `Comment on ${m.sub}`) : ''}</div>`;
}

VIEWS.item = async (arg) => {
  const items = evidenceItems();
  const it = items.find((i) => i.path === arg);
  if (!it) return `<div class="empty">That evidence file is not in the list any more. <a href="#evidence">Back to Evidence</a></div>`;
  const list = items.filter((i) => !i.missing);
  const idx = list.indexOf(it);
  const prev = list[idx - 1], next = list[idx + 1];
  const rec = it.rec || { code: it.code, title: it.title, date: '', project: '', notes: '', maps: [] };
  const ed = canEdit();
  const code = rec.code || it.code || '';
  const legacy = mentorEv(code).comment;
  const usedIn = Object.values(S.prr).flatMap((r) => r.doc.sections.filter((s) => s.listed.includes(code) || s.discussed.includes(code)).map((s) => s.id));
  const skills = code && P().skills ? P().skills.skills.filter((s) => (s.evidence || []).includes(code)) : [];
  const relink = it.missing ? S.files.filter((f) => !P().evidence[f.path] && (f.name === it.path.split('/').pop() || (rec.size && f.size === rec.size))) : [];
  const chipsRow = (field, label) => `<div class="tag-row"><span class="small muted">${label}:</span> ${listOf(rec[field]).map((v, i) => `<span class="chip">${esc(v)}${ed ? `<button type="button" class="chip-x tag-del" data-f="${field}" data-i="${i}" aria-label="Remove ${esc(v)}">×</button>` : ''}</span>`).join('') || '<span class="small muted">none</span>'}
    ${ed ? `<input class="tag-input" data-f="${field}" placeholder="+ Add ${label.toLowerCase().replace(/s$/, '')}" aria-label="Add ${label.toLowerCase().replace(/s$/, '')}">` : ''}</div>`;
  const seen = new Set();
  const maps = (rec.maps || []).map((m, i) => ({ m, i })).sort((a, b) => natural(a.m.sub, b.m.sub) || LEVELS.indexOf(a.m.level) - LEVELS.indexOf(b.m.level));
  return `<div class="row spread"><div class="row"><a href="#evidence">← All evidence</a>
      ${prev ? `<a class="btn small" href="${itemHref(prev)}" title="Previous (K)">‹ ${esc(prev.code || 'previous')}</a>` : ''}
      ${next ? `<a class="btn small" href="${itemHref(next)}" title="Next (J)">${esc(next.code || 'next')} ›</a>` : ''}
      <span class="small muted">${idx + 1} of ${list.length}</span></div></div>
    <h1>${esc(code ? code + ' · ' : '')}${esc(rec.title || it.title)}</h1>
    <p class="small muted">${it.missing ? esc(it.path) : fileLink(it.path, it.path)}${it.file ? ` · ${fmtSize(it.file.size)}` : ''}</p>
    ${it.missing ? `<div class="banner bad">The file is not in the Evidence folder any more.${relink.length ? ` It may be one of these: ${relink.map((f) => `<button class="small relink" data-path="${esc(f.path)}">${esc(f.path)}</button>`).join(' ')}` : ''}
      ${ed ? ' <button class="small danger" id="dropRec">Remove this record</button>' : ''}</div>` : ''}
    <div class="cols item-cols">
      <div>${it.missing ? '' : `<div class="preview-inline" id="inlinePreview"><p class="muted" style="padding:16px">Loading preview…</p></div>`}</div>
      <div class="item-scroll">
        <div class="card"><h2>Summary</h2><div class="form-grid">
          <div class="full"><label>Title</label><input data-field="title" value="${esc(rec.title || it.title)}"${dis(ed)}></div>
          <div><label>Code</label><input data-field="code" value="${esc(code)}" placeholder="e.g. CO-14"${dis(ed)}></div>
          <div><label>Date</label><input type="date" data-field="date" value="${esc(rec.date || '')}"${dis(ed)}></div>
          <div class="full"><label>Project / job</label><input data-field="project" value="${esc(rec.project || '')}"${dis(ed)} list="projects"></div>
          ${ITEM_FACTS.map(([k, l]) => `<div class="full"><label>${l}</label>${k === 'type' ? `<input data-field="${k}" value="${esc(rec[k] || '')}"${dis(ed)}>` : `<textarea data-field="${k}" rows="2"${dis(ed)}>${esc(rec[k] || '')}</textarea>`}</div>`).join('')}
        </div>
        <datalist id="projects">${[...new Set(Object.values(P().evidence).map((r) => r.project).filter(Boolean))].map((p) => `<option>${esc(p)}</option>`).join('')}</datalist>
        ${chipsRow('people', 'People')}${chipsRow('tags', 'Tags')}</div>

        <div class="card"><h2>Background &amp; extra context</h2><p class="small muted">Not in the file: project context, decisions you made, what happened next. Useful when you write your PRR.</p>
          <textarea data-field="notes" rows="3"${dis(ed)}>${esc(rec.notes || '')}</textarea></div>

        <h2>${esc(cap1(LABEL.items))} and ${esc(LABEL.ksb)}</h2>
        <p class="small muted">${usedIn.length ? `Your PRR lists or writes about it in ${usedIn.map(subLink).join(', ')}.` : 'Not in any PRR yet.'}${skills.length ? ` Skills: ${skills.map((s) => `<a href="#skills/${esc(s.id)}">${esc(s.title)}</a>`).join(', ')}.` : ''}</p>
        ${maps.map(({ m, i }) => { const f = !seen.has(m.sub); seen.add(m.sub); return mappingCard(m, i, rec, f); }).join('')
          || `<div class="card muted">Not mapped yet. ${ed ? `Press <b>+ Add a ${esc(LABEL.item)}</b> for each one this evidence shows.` : ''}</div>`}
        ${ed ? `<div class="row"><button type="button" class="primary" id="addMap">+ Add a ${esc(LABEL.item)}</button></div>` : ''}

        <div class="card"><h2>Comments on this item</h2>
          ${legacy ? `<p>${linkify(legacy)}</p><p class="small muted">${esc(M().name)} · ${fmtDate(mentorEv(code).date)}</p>` : ''}
          ${threadHtml(rec, code, '', isMentor() ? 'Anything about this evidence as a whole' : 'Anything about the document as a whole')}
          ${isMentor() && !code ? '<p class="small bad">This file has no code yet, so comments cannot be attached.</p>' : ''}</div>
      </div>
    </div>`;
};

function addMapDialog(rec) {
  const d = dialog(`<h2>Add a ${esc(LABEL.item)}</h2>
    <label for="amSub">${esc(cap1(LABEL.item))}</label><select id="amSub" style="width:100%">${GROUPS.map((g) => `<optgroup label="${esc(g.group + '. ' + g.title)}">${SUBS.filter((a) => a.group === g.group).map((a) => `<option value="${a.id}">${esc(a.id)} · ${esc(a.text.slice(0, 70))}</option>`).join('')}</optgroup>`).join('')}</select>
    <label for="amLevel">Level</label><select id="amLevel">${LEVELS.map((l) => `<option value="${l}">${esc(LEVEL_NAME[l])}</option>`).join('')}</select>
    <p class="small muted" id="amHelp"></p>
    <label for="amStrength">Strength</label><select id="amStrength">${STRENGTHS.map((s) => `<option ${s === 'supporting' ? 'selected' : ''}>${s}</option>`).join('')}</select>
    ${KSBS.length ? `<fieldset class="am-ksbs"><legend>${esc(LABEL.ksb)} linked to it</legend><div id="amKsbs"></div></fieldset>` : ''}
    <label for="amNote">How it contributes</label><textarea id="amNote" rows="3"></textarea>
    <div class="row" style="justify-content:flex-end;margin-top:1rem"><button type="button" id="amCancel">Cancel</button><button type="button" class="primary" id="amSave">Save</button></div>`);
  const fill = () => {
    const id = $('#amSub', d).value;
    if ($('#amKsbs', d)) $('#amKsbs', d).innerHTML = KSBS.filter((k) => k.attributes.includes(id)).map((k) => `<label class="check"><input type="checkbox" value="${esc(k.id)}"> ${esc(k.id)} · ${esc(k.text.slice(0, 80))}</label>`).join('') || '<p class="small muted">None linked; add others on the card.</p>';
    const l = $('#amLevel', d).value;
    $('#amHelp', d).textContent = (LEVEL_HELP[l] || '') + ((rec.maps || []).some((m) => m.sub === id && m.level === l) ? ' (already mapped at this level)' : '');
  };
  $('#amSub', d).addEventListener('change', fill); $('#amLevel', d).addEventListener('change', fill); fill();
  $('#amCancel', d).addEventListener('click', () => d.close());
  $('#amSave', d).addEventListener('click', () => {
    const sub = $('#amSub', d).value, level = $('#amLevel', d).value;
    if (rec.maps.some((m) => m.sub === sub && m.level === level)) { toast(`${sub} is already mapped at that level`, 'error'); return; }
    rec.maps.push({ sub, level, strength: $('#amStrength', d).value, ksbs: $$('#amKsbs input:checked', d).map((x) => x.value), note: $('#amNote', d).value.trim(), reason: '', quotes: [] });
    changed(); d.close(); refreshItem(parseHash().arg); toast(`${sub} added`);
  });
}

// Redraw only the details column, so the file preview beside it does not reload after each edit.
async function refreshItem(arg, then) {
  const box = $('.item-scroll');
  if (!box) return render();
  const y = box.scrollTop, wy = window.scrollY;
  const tmp = document.createElement('div');
  tmp.innerHTML = await VIEWS.item(arg);
  const fresh = $('.item-scroll', tmp);
  if (!fresh) return render();
  box.replaceWith(fresh);
  autoLabel(fresh); labelTableCells(fresh);
  bindItem(arg);
  fresh.scrollTop = y; window.scrollTo(0, wy);
  if (then) then();
}

VIEWS.item.after = async (arg) => {
  if (!bindItem(arg)) return;
  if ($('#inlinePreview')) {
    try { $('#inlinePreview').innerHTML = await previewHtml(arg); } catch (err) { $('#inlinePreview').innerHTML = `<p class="bad" style="padding:16px">${esc(err.message)}</p>`; }
  }
};

function bindItem(arg) {
  const it = evidenceItems().find((i) => i.path === arg);
  if (!it) return false;
  const rec = canEdit() ? evidenceRecord(it) : (it.rec || {});
  const keep = (then) => refreshItem(arg, then);
  const code = () => rec.code || it.code;
  // Comments and verdicts: the apprentice writes into the portfolio, the mentor into their own file.
  $$('.discuss').forEach((box) => box.addEventListener('click', (e) => {
    const key = box.dataset.thread, b = e.target.closest('button');
    if (!b) return;
    if (b.classList.contains('addc')) {
      const ta = $('textarea', box), text = ta.value.trim();
      if (!text) { ta.focus(); return; }
      const c = { by: S.data.name || (isMentor() ? 'Mentor' : 'Me'), text: text.slice(0, 4000), at: Date.now() };
      if (isMentor()) { const m = (S.data.evidence[code()] = S.data.evidence[code()] || { comment: '', date: '' }); ((m.thread = m.thread || {})[key] = m.thread[key] || []).push(c); }
      else ((rec.thread = rec.thread || {})[key] = rec.thread[key] || []).push(c);
      changed(); keep(); toast('Comment saved');
    } else if (b.classList.contains('vd') && isMentor()) {
      const m = (S.data.evidence[code()] = S.data.evidence[code()] || { comment: '', date: '' });
      m.verdicts = m.verdicts || {};
      if (m.verdicts[key] === b.dataset.v) delete m.verdicts[key]; else m.verdicts[key] = b.dataset.v;
      m.date = today(); changed(); keep();
    }
  }));
  if (canEdit()) {
    bindFields($('.item-scroll'), rec);
    $$('.tag-input').forEach((inp) => {
      const add = () => {
        const v = inp.value.trim().replace(/,/g, ' ');
        if (!v) return;
        const f = inp.dataset.f, vals = listOf(rec[f]);
        if (!vals.includes(v)) rec[f] = [...vals, v].join(', ');
        inp.value = ''; changed(); keep();
      };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
      inp.addEventListener('change', add);
    });
    $$('.tag-del').forEach((b) => b.addEventListener('click', () => { const vals = listOf(rec[b.dataset.f]); vals.splice(+b.dataset.i, 1); rec[b.dataset.f] = vals.join(', '); changed(); keep(); }));
    $$('.mapping').forEach((card) => {
      const m = rec.maps[+card.dataset.i];
      const on = (sel, ev, fn) => $$(sel, card).forEach((el) => el.addEventListener(ev, (e) => fn(el, e)));
      on('.m-level', 'change', (el) => {
        if (rec.maps.some((x) => x !== m && x.sub === m.sub && x.level === el.value)) { el.value = m.level; toast(`${m.sub} is already mapped at that level`, 'error'); return; }
        m.level = el.value; changed(); keep();
      });
      on('.m-strength', 'change', (el) => { m.strength = el.value; changed(); });
      on('.m-note', 'input', (el) => { m.note = el.value; changed(); });
      on('.m-reason', 'input', (el) => { m.reason = el.value; changed(); });
      on('.m-quote', 'input', (el) => { m.quotes[+el.dataset.qi] = el.value; changed(); });
      on('.m-quote-del', 'click', (el) => { m.quotes.splice(+el.dataset.qi, 1); changed(); keep(); });
      on('.m-quote-add', 'click', () => { (m.quotes = m.quotes || []).push(''); changed(); const i = card.dataset.i; keep(() => { const q = $$(`.mapping[data-i="${i}"] .m-quote`).pop(); if (q) q.focus(); }); });
      on('.m-ksb-del', 'click', (el) => { m.ksbs = (m.ksbs || []).filter((k) => k !== el.dataset.k); changed(); keep(); });
      on('.m-ksb-add', 'change', (el) => { if (!el.value) return; m.ksbs = [...new Set([...(m.ksbs || []), el.value])].sort(natural); changed(); keep(); });
      on('.m-del', 'click', async () => {
        if ((m.note || m.reason || (m.quotes || []).some(Boolean)) && !(await ask(`Remove ${esc(m.sub)} (${esc(LEVEL_NAME[m.level])}) and what you wrote for it?`, 'Remove'))) return;
        rec.maps.splice(rec.maps.indexOf(m), 1); changed(); keep();
      });
    });
    if ($('#addMap')) $('#addMap').addEventListener('click', () => addMapDialog(rec));
    $$('.relink').forEach((b) => b.addEventListener('click', () => {
      P().evidence[b.dataset.path] = rec;
      delete P().evidence[it.path];
      changed();
      location.hash = '#item/' + encodeURIComponent(b.dataset.path);
    }));
    if ($('#dropRec')) $('#dropRec').addEventListener('click', async () => {
      if (!(await ask('Remove this record and its mappings? The file itself is already gone.', 'Remove'))) return;
      delete P().evidence[it.path];
      changed();
      location.hash = '#evidence';
    });
  }
  return true;
}
