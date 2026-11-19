// Phone layout for tables: on a narrow screen each table row becomes a small card, with the column name shown beside
// each value. The column names are copied from the table header after every render, so no page needs changing.

function labelTableCells(root) {
  for (const table of $$('table', root)) {
    if (table.dataset.cards === 'off') continue;
    const heads = $$('thead th', table).map((th) => th.textContent.trim());
    if (!heads.length) continue;
    table.classList.add('cardable');
    for (const tr of $$('tbody tr', table)) {
      let i = 0;
      for (const td of tr.children) {
        if (td.tagName !== 'TD' && td.tagName !== 'TH') continue;
        if (!td.hasAttribute('data-label') && heads[i]) td.setAttribute('data-label', heads[i]);
        i += td.colSpan || 1;
      }
    }
  }
}
