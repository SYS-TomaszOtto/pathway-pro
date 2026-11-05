// PRRs (Word is the master: the tool only reads them) and the mentor's comments in them.

const FB_STATUS = { open: 'Open', done: 'Done', wont: 'Won’t change' };

VIEWS.reports = async () => {
  await scanEvidence();
  await loadReports();
  const bySub = prrBySub();
  const reports = Object.values(S.prr).sort((a, b) => natural(a.name, b.name));
  const missing = SUBS.filter((a) => bySub[a.id].state === 'missing');
  const stateChip = (st) => chip({ draft: 'draft', placeholder: 'placeholder', empty: 'heading only' }[st] || st, st === 'draft' ? 'part' : 'outline');
  return `<div class="row spread"><h1>Professional Review Reports</h1><div class="row">
      <button id="reload">↻ Re-read Word files</button>${canEdit() ? '<button class="primary" id="newPrr">New PRR from template…</button>' : ''}</div></div>
    <p class="muted small">Write your PRRs in Word, in the <code>${FOLDERS.prr}</code> folder. The tool reads them (it never changes them) and checks the structure.
      <a href="#" id="howWrite">How to write them so the checks work</a></p>
    ${reports.length ? reports.map((r) => {
      const group = (/attribute\s*(\d)/i.exec(r.name) || /attribute\s*(\d)/i.exec(r.doc.title) || [])[1];
      const expected = group ? SUBS.filter((a) => String(a.group) === group && !r.doc.sections.some((s) => s.id === a.id)) : [];
      const open = feedbackItems().filter((f) => f.file === r.path && f.status === 'open').length;
      return `<div class="card"><div class="row spread"><h2 style="margin:0">${fileLink(r.path, r.name)}</h2>
        <span class="small muted">${r.doc.title ? esc(r.doc.title) + ' · ' : ''}changed ${new Date(r.mtime).toLocaleString('en-GB')}${open ? ' · ' + `<a href="#feedback?file=${encodeURIComponent(r.path)}">${plural(open, 'open comment')}</a>` : ''}</span></div>
        ${r.error ? `<div class="banner bad">Could not read this file: ${esc(r.error)}</div>` : ''}
        ${expected.length ? `<div class="issue warn">No heading for ${expected.map((a) => a.id).join(', ')} (expected in Attribute ${group})</div>` : ''}
        ${r.doc.sections.length ? `<div class="table-wrap"><table><thead><tr><th>Sub</th><th>Heading</th><th>State</th><th>Words</th><th>Evidence line</th><th>Written about</th><th>Checks</th></tr></thead><tbody>
          ${r.doc.sections.map((s) => {
            const issues = (bySub[s.id].sections.find((x) => x.file === r.path && x.section === s) || { issues: [] }).issues;
            return `<tr><td><b>${subLink(s.id)}</b></td><td class="small">${esc(s.heading)}</td>
              <td>${issues.some((i) => i[0] !== 'info') || s.state !== 'draft' ? stateChip(s.state) : chip('ready', 'good')}</td><td class="right">${s.words}</td>
              <td class="small">${s.listed.map(codeLink).join(' ') || '<span class="muted">–</span>'}</td>
              <td class="small">${s.discussed.map(codeLink).join(' ') || '<span class="muted">–</span>'}</td>
              <td>${issues.map(([lv, msg]) => `<div class="issue ${lv}">${linkify(msg)}</div>`).join('') || '<span class="good small">✓</span>'}</td></tr>`;
          }).join('')}</tbody></table></div>` : '<p class="muted">No sub-attribute headings found (a heading looks like "2b – Contribute to the design…").</p>'}</div>`;
    }).join('') : `<div class="empty">No Word files in <b>${FOLDERS.prr}</b> yet.${canEdit() ? ' Press <b>New PRR from template</b> to start one.' : ''}</div>`}
    ${reports.length && missing.length ? `<div class="card"><h2>Not in any PRR yet</h2><p>${missing.map((a) => subLink(a.id)).join(' ')}</p></div>` : ''}`;
};
VIEWS.reports.after = () => {
  $('#reload').addEventListener('click', (e) => act(e.currentTarget, async () => { S.prr = {}; await loadReports(); await render(); }, 'Word files re-read'));
  $('#howWrite').addEventListener('click', (e) => { e.preventDefault(); dialog(PRR_HELP + '<div class="row" style="justify-content:flex-end"><button onclick="this.closest(\'dialog\').close()">Close</button></div>'); });
  if ($('#newPrr')) $('#newPrr').addEventListener('click', newPrrDialog);
};

const PRR_HELP = `<h2>Writing a PRR the tool can check</h2>
  <ol>
    <li>Start each sub-attribute with a heading line such as <b>2b – Contribute to the design and development of engineering solutions</b> (number, letter, dash, then any text). Use Word's Heading style if you like; it is not required.</li>
    <li>Under it, list the evidence on one line: <b>Evidence: CO-14, DD-00 to DD-05</b>.</li>
    <li>Before you write about a piece of evidence, put its code in curly brackets: <b>{CO-14}</b> I checked the… The write-up runs until the next tag or heading.</li>
    <li>Your mentor comments in Word as normal (Review → New Comment, or Track Changes). The tool lists every comment under the right sub-attribute.</li>
  </ol>
  <p class="small muted">The checks: evidence listed but not written about, written about but not listed, codes that are not in your Evidence folder, very short write-ups, and evidence not yet mapped to that sub-attribute.</p>`;

function newPrrDialog() {
  const d = dialog(`<h2>New PRR from the template</h2>
    <p class="small muted">Makes a Word file in <code>${FOLDERS.prr}</code> with a heading and an Evidence line for each sub-attribute. Existing files are never overwritten.</p>
    <label>Attribute</label><select id="prrGroup">${GROUPS.map((g) => `<option value="${g.group}">${g.group}. ${esc(g.title)}</option>`).join('')}<option value="all">All nine in one file</option></select>
    <label><input type="checkbox" id="prrEvidence" checked> Fill the Evidence lines from what is already mapped</label>
    <div class="row" style="justify-content:flex-end;margin-top:1rem"><button value="no">Cancel</button><button class="primary" id="prrMake">Create</button></div>`);
  $('button[value=no]', d).addEventListener('click', () => d.close());
  $('#prrMake', d).addEventListener('click', (e) => act(e.currentTarget, async () => {
    const g = $('#prrGroup', d).value;
    const fill = $('#prrEvidence', d).checked;
    const cov = coverage();
    const groups = g === 'all' ? GROUPS : GROUPS.filter((x) => String(x.group) === g);
    const name = g === 'all' ? 'PRR - All attributes.docx' : `PRR - Attribute ${g}.docx`;
    if (await exists(S.own, `${FOLDERS.prr}/${name}`)) throw new Error(`${name} already exists`);
    const blocks = [{ type: 'title', text: g === 'all' ? `Professional Review Report – ${P().name}` : `Attribute ${g} – ${groups[0].title}` },
      { type: 'small', text: 'Under each heading: list the evidence on the Evidence line, then write about each item after its tag, e.g. {CO-14}.' }];
    for (const grp of groups) {
      if (g === 'all') blocks.push({ type: 'h1', text: `Attribute ${grp.group} – ${grp.title}` });
      for (const a of SUBS.filter((x) => x.group === grp.group)) {
        const codes = fill ? [...new Set(LEVELS.flatMap((l) => cov[a.id][l].map((i) => i.code)).filter(Boolean))].sort(natural) : [];
        blocks.push({ type: g === 'all' ? 'h2' : 'h1', text: `${a.id} – ${a.text}` }, { type: 'p', text: 'Evidence: ' + codes.join(', ') });
        for (const c of codes) blocks.push({ type: 'p', text: `{${c}} …` });
        if (!codes.length) blocks.push({ type: 'p', text: '…' });
      }
    }
    await writeFile(S.own, `${FOLDERS.prr}/${name}`, makeDocx(blocks));
    d.close();
    await loadReports();
    await render();
    return name;
  }, (name) => `Created ${FOLDERS.prr}/${name}: open it in Word from your OneDrive folder`));
}

// ---------- feedback ----------
VIEWS.feedback = async (arg, q) => {
  await loadReports();
  const all = feedbackItems();
  const status = q.get('status') || (q.get('key') ? 'all' : 'open');
  const sub = q.get('sub') || '';
  const file = q.get('file') || '';
  const focus = q.get('focus') === '1';
  let list = all.filter((f) => (status === 'all' || f.status === status) && (!sub || f.sub === sub) && (!file || f.file === file));
  if (q.get('key')) list = all.filter((f) => f.key === q.get('key'));
  list.sort((a, b) => natural(a.sub || 'zz', b.sub || 'zz') || natural(a.file, b.file));
  const qs = (patch) => '#feedback?' + new URLSearchParams({ status, sub, file, focus: focus ? '1' : '', ...patch }).toString();
  const count = (s) => all.filter((f) => s === 'all' || f.status === s).length;
  const subs = [...new Set(all.map((f) => f.sub).filter(Boolean))].sort(natural);
  const at = Math.min(+(q.get('i') || 0), Math.max(0, list.length - 1));
  const shown = focus ? list.slice(at, at + 1) : list;
  return `<div class="row spread"><h1>Mentor feedback</h1><div class="row">
      <button id="exportResp" class="primary">Export “Response to feedback” (Word)</button></div></div>
    <p class="muted small">Comments and tracked changes from the Word files in <code>${FOLDERS.prr}</code>, sorted by sub-attribute. ${canEdit() ? 'Write what you changed under each one and mark it done: that becomes your response table for the mentor.' : 'The apprentice’s responses are shown under each comment.'}</p>
    <div class="sub-tabs">${['open', 'done', 'wont', 'all'].map((s) => `<a href="${qs({ status: s, i: 0 })}" class="${status === s ? 'active' : ''}">${s === 'all' ? 'All' : FB_STATUS[s]} (${count(s)})</a>`).join('')}
      <select id="fbSub"><option value="">All sub-attributes</option>${subs.map((s) => `<option ${s === sub ? 'selected' : ''}>${s}</option>`).join('')}</select>
      <a href="${qs({ focus: focus ? '' : '1', i: 0 })}" class="${focus ? 'active' : ''}" title="Show one comment at a time">One at a time</a></div>
    ${focus && list.length ? `<div class="row" style="margin-bottom:8px"><a class="btn small" href="${qs({ i: Math.max(0, at - 1) })}">‹ Previous</a><span>${at + 1} of ${list.length}</span><a class="btn small" href="${qs({ i: Math.min(list.length - 1, at + 1) })}">Next ›</a></div>` : ''}
    ${shown.length ? shown.map(fbCard).join('') : `<div class="empty">${all.length ? 'Nothing here.' : 'No comments found yet. When your mentor comments in your Word PRR, they appear here.'}</div>`}`;
};
function fbCard(f) {
  const ed = canEdit();
  return `<div class="fb ${f.status !== 'open' ? 'done' : ''}" data-key="${f.key}">
    <div class="row spread"><div class="meta">${f.sub ? `<b>${subLink(f.sub)}</b> · ` : ''}${esc(f.author)} · ${fmtDate(f.date)} · ${fileLink(f.file, f.file.split('/').pop())}
      ${f.kind === 'edit' ? ' · ' + chip(f.change === 'added' ? 'suggested text' : 'suggested deletion', 'accent') : ''}${f.resolved ? ' · ' + chip('resolved in Word', 'good') : ''}</div>
      <div class="row">${Object.entries(FB_STATUS).map(([k, v]) => `<button class="small fb-status ${f.status === k ? 'on' : ''}" data-status="${k}"${dis(ed)}>${v}</button>`).join('')}</div></div>
    ${f.anchor && f.kind === 'comment' ? `<div class="quote">“${esc(f.anchor.slice(0, 400))}”</div>` : ''}
    <div class="text">${f.kind === 'edit' ? `<span class="${f.change === 'added' ? 'good' : 'bad'}">${f.change === 'added' ? '+ ' : '− '}${esc(f.text)}</span><div class="small muted">in: ${esc(f.anchor.slice(0, 200))}</div>` : linkify(f.text)}</div>
    ${f.replies.map((r) => `<div class="reply"><b>${esc(r.author)}:</b> ${esc(r.text)}</div>`).join('')}
    ${ed ? `<textarea class="fb-resp" placeholder="Your response: what you changed, or why not">${esc(f.response)}</textarea>` : f.response ? `<div class="small"><b>Response:</b> ${esc(f.response)}</div>` : ''}
  </div>`;
}
VIEWS.feedback.after = (arg, q) => {
  $('#fbSub').addEventListener('change', (e) => { q.set('sub', e.target.value); q.set('i', 0); location.hash = '#feedback?' + q.toString(); });
  $('#exportResp').addEventListener('click', (e) => act(e.currentTarget, exportResponses, (p) => 'Saved ' + p));
  if (!canEdit()) return;
  const record = (key, f) => (P().comments[key] = P().comments[key] || { status: f ? f.status : 'open', response: '', updated: '' });
  $$('.fb').forEach((card) => {
    const key = card.dataset.key;
    const f = feedbackItems().find((x) => x.key === key);
    $$('.fb-status', card).forEach((b) => b.addEventListener('click', () => {
      const r = record(key, f);
      r.status = b.dataset.status;
      r.updated = nowIso();
      changed();
      $$('.fb-status', card).forEach((x) => x.classList.toggle('on', x === b));
      card.classList.toggle('done', r.status !== 'open');
      flash(b, 'done');
      renderHeader('feedback');
    }));
    const ta = $('.fb-resp', card);
    if (ta) ta.addEventListener('input', () => { const r = record(key, f); r.response = ta.value; r.updated = nowIso(); changed(); });
  });
};

async function exportResponses() {
  await loadReports();
  const items = feedbackItems().sort((a, b) => natural(a.sub || 'zz', b.sub || 'zz'));
  if (!items.length) throw new Error('there are no comments to export');
  const rows = [['#', 'Section', 'Comment', 'Response', 'Status']];
  items.forEach((f, i) => rows.push([String(i + 1), f.sub || '–', `${f.author}: ${f.kind === 'edit' ? (f.change === 'added' ? 'suggested adding: ' : 'suggested removing: ') : ''}${f.text}`, f.response || '', FB_STATUS[f.status]]));
  const blob = makeDocx([
    { type: 'title', text: 'Response to feedback' },
    { type: 'small', text: `${P().name} · ${fmtDate(today())} · ${items.filter((f) => f.status !== 'open').length} of ${items.length} answered` },
    { type: 'table', rows, widths: [500, 1100, 3700, 3700, 1100] },
  ]);
  const path = `${FOLDERS.exports}/Response to feedback ${today()}.docx`;
  await writeFile(S.own, path, blob);
  return path;
}
