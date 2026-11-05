// The Framework page (Settings → Framework): edit levels, requirements, standards and folders.

const FOLDER_LABELS = { prr: 'Reports (Word files you write)', matrix: 'Evidence matrix (Excel)', evidence: 'Evidence', feedback: 'Feedback, compliance and status', meetings: 'Meetings', cpd: 'CPD', exports: 'Exports' };

VIEWS.framework = async () => {
  const fw = FRAMEWORK;
  const ed = canEdit();
  const dd = dis(ed);
  const rows = (n) => ` rows="${n}" wrap="off" style="white-space:pre;font-family:Consolas,monospace;font-size:.85rem"`;
  return `<div class="row spread"><div><a href="#settings">← Settings</a><h1 style="margin-top:.3rem">Framework</h1></div>
      <div class="row"><button id="fwExport">Export as file</button>${ed ? '<button id="fwImport">Import file…</button><input type="file" id="fwFile" accept=".json,application/json" hidden>' : ''}</div></div>
    ${fw.source ? `<div class="banner info"><b>Source:</b> ${esc(fw.source)}. Read from the published document: it may contain mistakes or be out of date, so check it against the current version and correct anything below.</div>` : ''}
    <p class="muted small">This is what the tool checks you against. Change it to match your institution, profession or level. One item per line, columns separated by <code>|</code> or a tab, so you can paste a table straight from Excel or Word.
      ${ed ? 'Existing evidence mappings stay: a mapping to a requirement or level you delete is kept in your data but no longer counted.' : 'The apprentice owns the framework; you see it read-only.'}</p>
    <div class="grid">
      <div class="card"><h2>Name and words</h2>
        <label>Framework name</label><input id="fwName" value="${esc(fw.name)}" style="width:100%"${dd}>
        <div class="form-grid"><div><label>Tab name for the requirements</label><input id="fwLabelAttr" value="${esc(LABEL.attr)}"${dd}></div>
          <div><label>Tab name for the standards (leave the list empty to hide the tab)</label><input id="fwLabelKsb" value="${esc(LABEL.ksb)}"${dd}></div></div>
        <label>Start from</label><div class="row"><select id="fwPreset"${dd}><option value="">Choose…</option>${Object.entries(PRESETS).map(([k, p]) => `<option value="${k}">${esc(p.name)}</option>`).join('')}</select><span class="small muted">replaces everything in the boxes below (nothing is saved until you press Save)</span></div></div>
      <div class="card"><h2>Levels</h2><p class="small muted">Letters | Name | What it means. Each requirement needs the goal number of evidence items at every level (set in Settings). One level is fine.</p>
        <textarea id="fwLevels"${rows(4)}${dd}>${esc(toLevelText(fw))}</textarea></div>
      <div class="card"><h2>Groups</h2><p class="small muted">Group id | Title. Groups collect requirements, for example one per attribute, unit or competence area.</p>
        <textarea id="fwGroups"${rows(8)}${dd}>${esc(toGroupText(fw))}</textarea></div>
      <div class="card"><h2>Folders</h2><p class="small muted">Folder names inside your portfolio folder. New names are created when you save; existing folders are not renamed or moved.</p>
        <div class="form-grid">${Object.keys(DEFAULT_FOLDERS).map((k) => `<div><label>${FOLDER_LABELS[k]}</label><input data-folder="${k}" value="${esc(fw.folders[k] || DEFAULT_FOLDERS[k])}"${dd}></div>`).join('')}</div>
        <label>Kinds of evidence (folders inside the evidence folder, one per line; end with " - " and 2 or 3 letters for the code, e.g. <code>4 - Calculations - CA</code>)</label>
        <textarea id="fwEvFolders"${rows(9)}${dd}>${esc((fw.evidenceFolders || []).join('\n'))}</textarea></div>
    </div>
    <div class="card"><h2>Requirements</h2><p class="small muted">Id | Group id | Text, then optionally <code>| needs: K</code> to say the requirement is met by evidence at that level or above (otherwise every level needs evidence). The id is what you write in report headings, for example <code>2b – Contribute to…</code>.</p>
      <textarea id="fwAttrs"${rows(14)}${dd}>${esc(toAttrText(fw))}</textarea></div>
    <div class="card"><h2>Standards (optional, such as KSBs)</h2><p class="small muted">Id | Type | Text | Requirement ids it relates to (comma separated). Leave empty if your scheme has none.</p>
      <textarea id="fwKsbs"${rows(10)}${dd}>${esc(toKsbText(fw))}</textarea></div>
    ${ed ? '<div class="row"><button class="primary" id="fwSave">Save framework</button><span class="small muted">The tool checks the lines first and tells you which one is wrong.</span></div>' : ''}`;
};
VIEWS.framework.after = () => {
  const val = (id) => $(id).value;
  const fill = (fw) => {
    $('#fwName').value = fw.name; $('#fwLabelAttr').value = (fw.labels || {}).attr || 'Attributes'; $('#fwLabelKsb').value = (fw.labels || {}).ksb || 'KSBs';
    $('#fwLevels').value = toLevelText(fw); $('#fwGroups').value = toGroupText(fw); $('#fwAttrs').value = toAttrText(fw); $('#fwKsbs').value = toKsbText(fw);
    $('#fwEvFolders').value = (fw.evidenceFolders || []).join('\n');
    for (const i of $$('[data-folder]')) i.value = (fw.folders || {})[i.dataset.folder] || DEFAULT_FOLDERS[i.dataset.folder];
  };
  const read = () => {
    const folders = {};
    for (const i of $$('[data-folder]')) folders[i.dataset.folder] = i.value;
    return buildFramework({ name: val('#fwName'), labelAttr: val('#fwLabelAttr'), labelKsb: val('#fwLabelKsb'), levels: val('#fwLevels'), groups: val('#fwGroups'), attributes: val('#fwAttrs'), ksbs: val('#fwKsbs'), evidenceFolders: val('#fwEvFolders'), folders }, FRAMEWORK);
  };
  $('#fwPreset').addEventListener('change', (e) => { if (e.target.value) { fill(PRESETS[e.target.value].fw); e.target.value = ''; toast('Filled in: press Save to use it'); } });
  $('#fwExport').addEventListener('click', () => {
    let fw;
    try { fw = canEdit() ? read() : FRAMEWORK; } catch (err) { return toast(err.message, 'error'); }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ format: 'ice-tool/framework-1', ...fw }, null, 1)], { type: 'application/json' }));
    a.download = `${slug(fw.name) || 'framework'}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  if ($('#fwImport')) {
    $('#fwImport').addEventListener('click', () => $('#fwFile').click());
    $('#fwFile').addEventListener('change', async (e) => {
      try {
        const fw = JSON.parse(await e.target.files[0].text());
        if (!fw || !Array.isArray(fw.levels) || !Array.isArray(fw.attributes)) throw new Error('That file is not a framework exported from this tool');
        fill({ labels: {}, groups: [], ksbs: [], folders: {}, evidenceFolders: [], ...fw });
        toast('Loaded: check it, then press Save');
      } catch (err) { toast(err.message, 'error'); }
      e.target.value = '';
    });
  }
  if ($('#fwSave')) $('#fwSave').addEventListener('click', (e) => act(e.currentTarget, async () => {
    const fw = read();
    P().framework = fw;
    applyFramework(fw);
    await ensureFolders(S.own, P().mode);
    changed();
    await save();
    await scanEvidence();
    await loadReports();
    await render();
  }, 'Framework saved'));
};
