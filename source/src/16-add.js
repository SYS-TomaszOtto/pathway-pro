// Add evidence files from the Evidence page: pick files (or drop them on the page), choose the kind of evidence,
// and the tool copies them into the right folder of your own OneDrive folder, with the next free code in the name.

async function addEvidenceFiles(fileList) {
  const files = [...fileList].filter((f) => f && f.size !== undefined && f.name);
  if (!files.length) return;
  if (!canEdit() || demoBlocked()) return;
  const cats = EVIDENCE_CATEGORIES.length ? EVIDENCE_CATEGORIES : [''];
  const needCode = files.some((f) => !codeFromName(f.name));
  const d = dialog(`<h2>Add ${plural(files.length, 'file')} to your evidence</h2>
    <p class="small muted">The files are copied into your evidence folder in OneDrive. The originals are not moved or changed.</p>
    <ul class="list-plain add-list">${files.slice(0, 12).map((f) => `<li>${esc(f.name)} <span class="small muted">${esc(fmtSize(f.size))}</span></li>`).join('')}${files.length > 12 ? `<li class="muted">and ${files.length - 12} more</li>` : ''}</ul>
    <label for="addKind">What kind of evidence is this?</label>
    <select id="addKind">${cats.map((c) => `<option value="${esc(c)}">${esc(c || '(top level)')}</option>`).join('')}</select>
    ${needCode ? '<label class="check"><input type="checkbox" id="addCode" checked> Put the next free code at the start of each file name (for example CO-15)</label>' : ''}
    <div class="row" style="justify-content:flex-end;margin-top:1rem"><button value="no" id="addCancel">Cancel</button><button class="primary" id="addGo">Add</button></div>`);
  $('#addCancel', d).addEventListener('click', () => d.close());
  $('#addGo', d).addEventListener('click', async () => {
    const kind = $('#addKind', d).value;
    const withCode = !!($('#addCode', d) && $('#addCode', d).checked);
    const goBtn = $('#addGo', d);
    goBtn.disabled = true;
    goBtn.textContent = 'Adding…';
    try {
      const prefix = categoryPrefix(kind) || 'EV';
      const used = evidenceItems().map((i) => i.code).filter((c) => c && c.startsWith(prefix + '-')).map((c) => +c.split('-')[1]);
      let next = used.length ? Math.max(...used) + 1 : 0;
      let added = 0;
      for (const f of files) {
        let name = f.name.replace(/[\\/:*?"<>|]/g, '_');
        if (withCode && !codeFromName(name)) name = `${prefix}-${String(next++).padStart(2, '0')} ${name}`;
        const base = `${FOLDERS.evidence}${kind ? '/' + kind : ''}`;
        let path = `${base}/${name}`;
        for (let n = 2; await exists(S.own, path); n++) path = `${base}/${name.replace(/(\.[^.]*)?$/, ` (${n})$1`)}`;
        await writeFile(S.own, path, f);
        added++;
      }
      d.close();
      await scanEvidence();
      await render();
      toast(`${plural(added, 'file')} added to your evidence`);
    } catch (err) {
      goBtn.disabled = false;
      goBtn.textContent = 'Add';
      toast('Could not add the files: ' + err.message, 'error');
    }
  });
}

function pickEvidenceFiles() {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.addEventListener('change', () => { if (input.files.length) addEvidenceFiles(input.files); });
  input.click();
}

// Drag files from Explorer onto the Evidence page.
(() => {
  const onEvidence = () => /^#evidence(\?|$)/.test(location.hash) && S.data && canEdit() && P() && P().mode !== 'cpd';
  const hasFiles = (e) => e.dataTransfer && [...(e.dataTransfer.types || [])].includes('Files');
  document.addEventListener('dragover', (e) => { if (onEvidence() && hasFiles(e)) { e.preventDefault(); document.body.classList.add('dropping'); } });
  document.addEventListener('dragleave', (e) => { if (!e.relatedTarget) document.body.classList.remove('dropping'); });
  document.addEventListener('drop', (e) => {
    document.body.classList.remove('dropping');
    if (!onEvidence() || !hasFiles(e)) return;
    e.preventDefault();
    addEvidenceFiles(e.dataTransfer.files);
  });
})();
