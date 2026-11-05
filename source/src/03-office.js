// Word and Excel, with no library: read .docx (text, headings, comments, tracked changes) and write
// simple .docx and .xlsx files.

const xmlDoc = (text) => new DOMParser().parseFromString(text, 'application/xml');
const xmlEsc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const attr = (el, name) => el.getAttribute('w:' + name);
const kids = (el, local) => [...el.children].filter((c) => c.localName === local);

// ---------- reading Word ----------
// -> { paragraphs: [{style, text, ins: [{author, date, text}], del: [...]}],
//      comments: [{id, author, date, text, anchor, para, parent, done}] }
async function parseDocx(buffer) {
  const zip = await readZip(buffer);
  const docXml = await zip.text('word/document.xml');
  if (!docXml) throw new Error('no word/document.xml: not a Word file');
  const styles = {};
  const stylesXml = await zip.text('word/styles.xml');
  if (stylesXml) {
    for (const s of xmlDoc(stylesXml).getElementsByTagName('w:style')) {
      const name = s.getElementsByTagName('w:name')[0];
      styles[attr(s, 'styleId')] = name ? attr(name, 'val') : attr(s, 'styleId');
    }
  }
  const paragraphs = [];
  const anchors = {};   // comment id -> {text, para}
  const open = new Set();
  let para = null;
  const change = [];    // stack of {kind, author, date}

  const add = (text, deleted) => {
    if (!para) return;
    const c = change[change.length - 1];
    if (!deleted) para.text += text;
    if (c) {
      const list = deleted || c.kind === 'del' ? para.del : para.ins;
      const last = list[list.length - 1];
      if (last && last.author === c.author) last.text += text; else list.push({ author: c.author, date: c.date, text });
    }
    if (!deleted) for (const id of open) anchors[id].text += text;
  };

  const walk = (node) => {
    for (const el of node.children) {
      switch (el.localName) {
        case 'p': {
          if (para) { walk(el); break; } // a paragraph inside a paragraph (text box): fold into the outer one
          const pStyle = el.getElementsByTagName('w:pStyle')[0];
          para = { style: pStyle ? (styles[attr(pStyle, 'val')] || attr(pStyle, 'val')) : '', text: '', ins: [], del: [] };
          walk(el);
          para.text = para.text.replace(/[ \t]+/g, ' ').trim();
          paragraphs.push(para);
          para = null;
          break;
        }
        case 'pPr': case 'rPr': case 'sectPr': case 'instrText': case 'fldChar': case 'drawing': case 'pict': case 'object':
          break;
        case 't': add(el.textContent); break;
        case 'delText': add(el.textContent, true); break;
        case 'tab': add('\t'); break;
        case 'br': case 'cr': add(' '); break;
        case 'noBreakHyphen': add('-'); break;
        case 'ins': case 'moveTo': case 'del': case 'moveFrom':
          change.push({ kind: el.localName === 'ins' || el.localName === 'moveTo' ? 'ins' : 'del', author: attr(el, 'author') || '', date: attr(el, 'date') || '' });
          walk(el);
          change.pop();
          break;
        case 'commentRangeStart': {
          const id = attr(el, 'id');
          anchors[id] = { text: '', para: paragraphs.length };
          open.add(id);
          break;
        }
        case 'commentRangeEnd': open.delete(attr(el, 'id')); break;
        case 'commentReference': {
          const id = attr(el, 'id');
          if (!anchors[id]) anchors[id] = { text: '', para: paragraphs.length };
          break;
        }
        case 'tc': walk(el); add('\t'); break;
        default: walk(el);
      }
    }
  };
  const body = xmlDoc(docXml).getElementsByTagName('w:body')[0];
  walk(body);

  const comments = [];
  const commentsXml = await zip.text('word/comments.xml');
  if (commentsXml) {
    const extended = {};
    const extXml = await zip.text('word/commentsExtended.xml');
    if (extXml) {
      for (const e of xmlDoc(extXml).getElementsByTagName('w15:commentEx')) {
        extended[e.getAttribute('w15:paraId')] = { parent: e.getAttribute('w15:paraIdParent'), done: e.getAttribute('w15:done') === '1' };
      }
    }
    const byPara = {};
    for (const c of xmlDoc(commentsXml).getElementsByTagName('w:comment')) {
      const ps = [...c.getElementsByTagName('w:p')];
      const text = ps.map((p) => [...p.getElementsByTagName('w:t')].map((t) => t.textContent).join('')).join('\n').trim();
      const paraId = ps.length ? ps[ps.length - 1].getAttribute('w14:paraId') : null;
      const id = attr(c, 'id');
      const item = {
        id, author: attr(c, 'author') || '', date: attr(c, 'date') || '', text,
        anchor: anchors[id] ? anchors[id].text.replace(/\s+/g, ' ').trim() : '',
        para: anchors[id] ? Math.min(anchors[id].para, paragraphs.length - 1) : null,
        paraId, parent: null, done: false,
      };
      if (paraId && extended[paraId]) item.done = extended[paraId].done;
      if (paraId) byPara[paraId] = item;
      comments.push(item);
    }
    for (const c of comments) {
      const parentPara = c.paraId && extended[c.paraId] && extended[c.paraId].parent;
      if (parentPara && byPara[parentPara]) {
        c.parent = byPara[parentPara].id;
        if (c.para === null) c.para = byPara[parentPara].para;
      }
    }
  }
  return { paragraphs, comments };
}

// Text of a Word file as simple HTML, for the preview panel.
async function docxPreviewHtml(buffer) {
  const { paragraphs, comments } = await parseDocx(buffer);
  const notes = {};
  for (const c of comments) if (c.para !== null && !c.parent) (notes[c.para] = notes[c.para] || []).push(c);
  return paragraphs.map((p, i) => {
    const s = p.style.toLowerCase();
    const tag = s === 'title' ? 'h1' : s.startsWith('heading 1') ? 'h2' : s.startsWith('heading') ? 'h3' : 'p';
    const text = esc(p.text).replace(/\{\s*([A-Z]{2,3}-\d{2,3})\s*\}/g, '<mark>{$1}</mark>');
    const cmt = (notes[i] || []).map((c) => `<div class="doc-comment"><b>${esc(c.author)}:</b> ${esc(c.text)}</div>`).join('');
    return p.text || cmt ? `<${tag}>${text}</${tag}>${cmt}` : '';
  }).join('');
}

// ---------- writing Word ----------
// blocks: [{type: 'title'|'h1'|'h2'|'p'|'small'|'table', text, rows: [[cell]], widths: [twips]}]
function makeDocx(blocks, opts = {}) {
  const run = (text, props = '') => String(text ?? '').split('\n').map((line, i) =>
    `${i ? '<w:r><w:br/></w:r>' : ''}<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ''}<w:t xml:space="preserve">${xmlEsc(line)}</w:t></w:r>`).join('');
  const para = (text, style, props) => `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}${run(text, props)}</w:p>`;
  const body = blocks.map((b) => {
    if (b.type === 'title') return para(b.text, 'Title');
    if (b.type === 'h1') return para(b.text, 'Heading1');
    if (b.type === 'h2') return para(b.text, 'Heading2');
    if (b.type === 'small') return para(b.text, null, '<w:color w:val="666666"/><w:sz w:val="18"/>');
    if (b.type === 'table') {
      const widths = b.widths || b.rows[0].map(() => Math.floor((opts.landscape ? 14500 : 9600) / b.rows[0].length));
      const grid = widths.map((w) => `<w:gridCol w:w="${w}"/>`).join('');
      const rows = b.rows.map((row, r) => `<w:tr>${r === 0 ? '<w:trPr><w:tblHeader/></w:trPr>' : ''}${row.map((cell, c) =>
        `<w:tc><w:tcPr><w:tcW w:w="${widths[c]}" w:type="dxa"/>${r === 0 ? '<w:shd w:val="clear" w:color="auto" w:fill="DCE6F2"/>' : ''}</w:tcPr>${
          para(cell, null, r === 0 ? '<w:b/>' : '')}</w:tc>`).join('')}</w:tr>`).join('');
      return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${rows}</w:tbl><w:p/>`;
    }
    return para(b.text);
  }).join('');
  const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
  const files = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    'word/_rels/document.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    'word/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${W}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:lang w:val="en-GB"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>`
      + `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>`
      + `<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:sz w:val="44"/><w:color w:val="1F3864"/></w:rPr></w:style>`
      + `<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="360" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="30"/><w:color w:val="1F3864"/></w:rPr></w:style>`
      + `<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="25"/><w:color w:val="2F5496"/></w:rPr></w:style>`
      + `<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="A6A6A6"/><w:left w:val="single" w:sz="4" w:color="A6A6A6"/><w:bottom w:val="single" w:sz="4" w:color="A6A6A6"/><w:right w:val="single" w:sz="4" w:color="A6A6A6"/><w:insideH w:val="single" w:sz="4" w:color="A6A6A6"/><w:insideV w:val="single" w:sz="4" w:color="A6A6A6"/></w:tblBorders><w:tblCellMar><w:left w:w="100" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>`,
    'word/document.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W}><w:body>${body}<w:sectPr>${opts.landscape ? '<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>' : '<w:pgSz w:w="11906" w:h="16838"/>'}<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`,
  };
  return writeZip(files, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}

// ---------- writing Excel ----------
// sheets: [{name, rows: [[value | {v, s}]], widths: [chars], freeze: {rows, cols}, filter: true}]
// Styles s: 'head', 'bold', 'good', 'part', 'none', 'wrap'.
const XLSX_STYLES = { plain: 0, head: 1, bold: 2, good: 3, part: 4, none: 5, wrap: 6 };
function makeXlsx(sheets) {
  const colName = (n) => { let s = ''; for (n++; n; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };
  const safeName = (name, i) => (String(name).replace(/[\[\]:*?\/\\]/g, ' ').slice(0, 31) || 'Sheet' + (i + 1));
  const files = {};
  sheets.forEach((sheet, i) => {
    const rows = sheet.rows.map((row, r) => `<row r="${r + 1}">${row.map((cell, c) => {
      const v = cell !== null && typeof cell === 'object' ? cell.v : cell;
      const s = cell !== null && typeof cell === 'object' && cell.s ? ` s="${XLSX_STYLES[cell.s] || 0}"` : (r === 0 && sheet.header !== false ? ' s="1"' : '');
      const ref = colName(c) + (r + 1);
      if (v === null || v === undefined || v === '') return s ? `<c r="${ref}"${s}/>` : '';
      if (typeof v === 'number') return `<c r="${ref}"${s}><v>${v}</v></c>`;
      return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`;
    }).join('')}</row>`).join('');
    const cols = sheet.widths ? `<cols>${sheet.widths.map((w, c) => `<col min="${c + 1}" max="${c + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` : '';
    const f = sheet.freeze;
    const pane = f ? `<sheetViews><sheetView workbookViewId="0"><pane${f.cols ? ` xSplit="${f.cols}"` : ''}${f.rows ? ` ySplit="${f.rows}"` : ''} topLeftCell="${colName(f.cols || 0)}${(f.rows || 0) + 1}" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>` : '';
    const lastCol = colName(Math.max(1, ...sheet.rows.map((r) => r.length)) - 1);
    const filter = sheet.filter && sheet.rows.length > 1 ? `<autoFilter ref="A1:${lastCol}${sheet.rows.length}"/>` : '';
    files[`xl/worksheets/sheet${i + 1}.xml`] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${pane}${cols}<sheetData>${rows}</sheetData>${filter}</worksheet>`;
  });
  const names = sheets.map((s, i) => safeName(s.name, i));
  files['[Content_Types].xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${
    sheets.map((s, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`;
  files['_rels/.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  files['xl/workbook.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${
    names.map((n, i) => `<sheet name="${xmlEsc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`;
  files['xl/_rels/workbook.xml.rels'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${
    sheets.map((s, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')
  }<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const fill = (rgb) => `<fill><patternFill patternType="solid"><fgColor rgb="FF${rgb}"/><bgColor indexed="64"/></patternFill></fill>`;
  files['xl/styles.xml'] = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
    + `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>`
    + `<fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>${fill('DCE6F2')}${fill('C6EFCE')}${fill('FFEB9C')}${fill('FFC7CE')}</fills>`
    + `<borders count="2"><border/><border><left style="thin"><color rgb="FFBFBFBF"/></left><right style="thin"><color rgb="FFBFBFBF"/></right><top style="thin"><color rgb="FFBFBFBF"/></top><bottom style="thin"><color rgb="FFBFBFBF"/></bottom></border></borders>`
    + `<cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="7">`
    + `<xf/>`
    + `<xf fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>`
    + `<xf fontId="1" applyFont="1"/>`
    + `<xf fillId="3" borderId="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>`
    + `<xf fillId="4" borderId="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>`
    + `<xf fillId="5" borderId="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>`
    + `<xf applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>`
    + `</cellXfs></styleSheet>`;
  return writeZip(files, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}
