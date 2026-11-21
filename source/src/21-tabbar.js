// Bottom tab bar (phones first, desktop too): the most used pages sit in a bar fixed at the bottom of the screen,
// within thumb reach and clear of desktop notifications; every other page is in a "More" sheet that opens above the
// bar. ARIA: a tablist of link tabs (aria-selected, aria-current="page" on the open page), arrow keys / Home / End
// move between tabs, Space or Enter opens one. The sheet is a non-modal dialog: focus moves into it, Up/Down move
// between its links, Esc (or a click outside, or Tab past the end) closes it and focus goes back to "More".

let tabbarRefocus = false;   // a page was opened from the bar or sheet: focus the new page's tab after the re-render
const TABBAR_SLOTS = 4;   // pages in the bar itself; "More" makes the fifth
// Which pages earn a place in the bar, most used first (the bar then keeps the usual page order).
const TAB_PRIORITY = ['home', 'evidence', 'attributes', 'reports', 'cpd', 'feedback', 'meetings', 'mentor', 'ksbs', 'settings', 'help'];
const TAB_PRIORITY_MENTOR = ['home', 'evidence', 'mentor', 'reports', 'feedback', 'attributes', 'meetings', 'ksbs', 'cpd', 'settings', 'help'];

const TAB_ICONS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.5V20h5v-6h3v6h5V9.5"/>',
  evidence: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2h8.5A1.5 1.5 0 0 1 21 8.5v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>',
  attributes: '<path d="m4 7 2 2 3.5-3.5"/><path d="M12 7.5h8"/><path d="m4 15 2 2 3.5-3.5"/><path d="M12 15.5h8"/>',
  ksbs: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  reports: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h7"/>',
  feedback: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12.5h5"/>',
  meetings: '<rect x="3.5" y="5" width="17" height="15" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  mentor: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/>',
  cpd: '<path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v5c1.5 1.6 3.4 2.4 5.5 2.4s4-.8 5.5-2.4v-5"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.7"/><circle cx="12" cy="17" r=".6"/>',
  more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
};
const tabIcon = (id) => `<svg class="tab-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${TAB_ICONS[id] || TAB_ICONS.more}</svg>`;

// Split the pages into the bar and the More sheet. The bar takes the highest-priority pages that are unlocked
// (see tabUnlocked), in the usual page order; everything else, locked pages included, goes under More.
function tabbarSplit(active) {
  const { shown } = tabsShown(active);
  const all = tabsFor();
  const order = isMentor() ? TAB_PRIORITY_MENTOR : TAB_PRIORITY;
  const rank = (id) => { const i = order.indexOf(id); return i < 0 ? 99 : i; };
  // When everything fits (CPD-only record: three pages) there is no More at all.
  if (all.length <= TABBAR_SLOTS + 1) return { bar: all, more: [] };
  const pick = new Set(shown.filter((t) => t[0] !== active || tabUnlocked(t[0])).slice().sort((a, b) => rank(a[0]) - rank(b[0])).slice(0, TABBAR_SLOTS).map((t) => t[0]));
  return { bar: all.filter((t) => pick.has(t[0])), more: all.filter((t) => !pick.has(t[0])) };
}

function renderTabbar(active, openFb = 0) {
  const nav = $('#tabbar'), sheet = $('#moreSheet');
  if (!nav || !sheet) return;
  // Keyboard users keep their place: if focus was in the bar or sheet, put it back on the open page's tab after.
  const hadFocus = tabbarRefocus || nav.contains(document.activeElement) || sheet.contains(document.activeElement);
  tabbarRefocus = false;
  closeMoreSheet(false);
  if (!S.data || !tabsFor().length) {
    nav.innerHTML = ''; sheet.innerHTML = ''; nav.hidden = true;
    document.body.classList.remove('has-tabbar');
    return;
  }
  const { bar, more } = tabbarSplit(active);
  const inMore = more.some((t) => t[0] === active);
  const count = (id) => (id === 'feedback' && openFb ? `<span class="count" title="open comments"><span class="sr-only">, </span>${openFb}<span class="sr-only"> open</span></span>` : '');
  const anyActive = bar.some((t) => t[0] === active) || inMore;
  const tab = ([id, name], i) => {
    const on = active === id || (!anyActive && i === 0);
    return `<a role="tab" href="#${id}" data-tab="${id}" class="${active === id ? 'active' : ''}" aria-selected="${active === id}"${active === id ? ' aria-current="page"' : ''} tabindex="${on ? 0 : -1}" title="${esc(name)}">${tabIcon(id)}<span class="tab-label">${esc(name)}</span>${count(id)}</a>`;
  };
  nav.hidden = false;
  nav.innerHTML = `<div class="tabbar-in" role="tablist" aria-label="Main pages" aria-orientation="horizontal">${bar.map(tab).join('')}${more.length
    ? `<button type="button" role="tab" id="moreBtn" class="${inMore ? 'active' : ''}" aria-selected="${inMore}" aria-haspopup="dialog" aria-expanded="false" aria-controls="moreSheet" tabindex="${inMore ? 0 : -1}">${tabIcon('more')}<span class="tab-label">More</span>${inMore ? `<span class="sr-only">, now on ${esc(more.find((t) => t[0] === active)[1])}</span>` : ''}${more.some((t) => t[0] === 'feedback') ? count('feedback') : ''}</button>`
    : ''}</div>`;
  sheet.innerHTML = more.length ? `<h2 id="moreTitle">More pages</h2><ul>${more.map(([id, name]) => `<li><a href="#${id}" data-tab="${id}" class="${active === id ? 'active' : ''}"${active === id ? ' aria-current="page"' : ''}>${tabIcon(id)}<span>${esc(name)}</span>${count(id)}</a></li>`).join('')}</ul>` : '';
  document.body.classList.add('has-tabbar');
  if (hadFocus) { const t = $('[role=tab][tabindex="0"]', nav); if (t) t.focus({ preventScroll: true }); }
}

function moreSheetOpen() { const s = $('#moreSheet'); return !!s && !s.hidden; }
function openMoreSheet() {
  const sheet = $('#moreSheet'), btn = $('#moreBtn');
  if (!sheet || !btn || !sheet.innerHTML) return;
  sheet.hidden = false;
  btn.setAttribute('aria-expanded', 'true');
  const first = $('a.active', sheet) || $('a', sheet);
  if (first) first.focus({ preventScroll: true });
}
function closeMoreSheet(refocus = true) {
  const sheet = $('#moreSheet'), btn = $('#moreBtn');
  if (!sheet || sheet.hidden) return;
  sheet.hidden = true;
  if (btn) { btn.setAttribute('aria-expanded', 'false'); if (refocus) btn.focus({ preventScroll: true }); }
}

document.addEventListener('click', (e) => {
  const t = e.target.closest ? e.target : null;
  if (!t) return;
  if (t.closest('#moreBtn')) { if (moreSheetOpen()) closeMoreSheet(); else openMoreSheet(); return; }
  if (t.closest('#tabbar a[role=tab]')) { tabbarRefocus = true; return; }
  const link = t.closest('#moreSheet a');
  if (link) {
    tabbarRefocus = true;
    closeMoreSheet(false);
    // Already on that page: the hash does not change, so just put focus back on More.
    if (location.hash === link.getAttribute('href')) { e.preventDefault(); tabbarRefocus = false; if ($('#moreBtn')) $('#moreBtn').focus(); }
    return;
  }
  if (moreSheetOpen() && !t.closest('#moreSheet')) closeMoreSheet(false);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && moreSheetOpen()) { e.preventDefault(); e.stopPropagation(); closeMoreSheet(); return; }
  const tab = e.target.closest && e.target.closest('#tabbar [role=tab]');
  if (tab) {
    const tabs = $$('#tabbar [role=tab]');
    const i = tabs.indexOf(tab);
    let j = -1;
    if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = tabs.length - 1;
    else if (e.key === ' ' && tab.tagName === 'A') { e.preventDefault(); tab.click(); return; }
    else if (e.key === 'ArrowUp' && tab.id === 'moreBtn') { e.preventDefault(); openMoreSheet(); return; }
    if (j < 0) return;
    e.preventDefault();
    tabs.forEach((t, k) => { t.tabIndex = k === j ? 0 : -1; });
    tabs[j].focus();
    return;
  }
  const link = e.target.closest && e.target.closest('#moreSheet a');
  if (link && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End')) {
    const links = $$('#moreSheet a');
    const i = links.indexOf(link);
    const j = e.key === 'Home' ? 0 : e.key === 'End' ? links.length - 1 : e.key === 'ArrowDown' ? (i + 1) % links.length : (i - 1 + links.length) % links.length;
    e.preventDefault();
    links[j].focus();
  }
});

// Tabbing out of the sheet closes it (it is not modal), unless focus went back to the More button.
document.addEventListener('focusout', (e) => {
  const sheet = $('#moreSheet');
  if (!sheet || sheet.hidden || !sheet.contains(e.target)) return;
  const to = e.relatedTarget;
  if (to && (sheet.contains(to) || to.id === 'moreBtn')) return;
  if (!to) return;   // focus left the page (window switch, or a click on nothing): the click handler decides
  closeMoreSheet(false);
});
