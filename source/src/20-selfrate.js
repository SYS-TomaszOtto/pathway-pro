// Self-rating per KSB: P().ksbRatings = { "<ksb id>": [ { date, rating } ] }, rating 1-5, one entry per day.
const RATING_LABELS = ['', 'Not yet', 'Starting', 'Getting there', 'Confident', 'Could teach it'];
const ratingHist = (id) => (((P() || {}).ksbRatings || {})[id] || []).filter((r) => r && r.rating >= 1 && r.rating <= 5).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
const ratingLatest = (id) => ratingHist(id).slice(-1)[0] || null;
function ratingTrend(id) {
  const h = ratingHist(id);
  if (h.length < 2) return '';
  const prev = h[h.length - 2];
  return `was ${prev.rating} on ${fmtDate(prev.date)}`;
}
function ratingText(id) {
  const r = ratingLatest(id);
  return r ? `${r.rating} ${RATING_LABELS[r.rating]} (${r.date})` : '';
}
function ratingCell(k) {
  const r = ratingLatest(k.id), tr = ratingTrend(k.id);
  const note = r ? `<div class="small muted">${esc(RATING_LABELS[r.rating])}, ${esc(fmtDate(r.date))}${tr ? ' · ' + esc(tr) : ''}</div>` : '<div class="small muted">Not rated</div>';
  if (isMentor()) return r ? `<b>${r.rating} of 5</b>${note}` : note;
  return `<select class="rate-sel" data-k="${esc(k.id)}" aria-label="My rating for ${esc(k.id)}"><option value="">Not rated</option>${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${r && r.rating === n ? 'selected' : ''}>${n} – ${RATING_LABELS[n]}</option>`).join('')}</select>${note}`;
}
function ratingSummary() {
  if (!P() || !KSBS.length) return '';
  const link = (k) => `<a href="#ksbs?k=${encodeURIComponent(k.id)}">${esc(k.id)}</a>`;
  const rated = KSBS.filter((k) => ratingLatest(k.id));
  const unrated = KSBS.filter((k) => !ratingLatest(k.id));
  let t = `<b>Rated ${rated.length} of ${KSBS.length}.</b>`;
  if (rated.length) {
    const m = Math.min(...rated.map((k) => ratingLatest(k.id).rating));
    t += ` Lowest rated (${m} of 5): ${rated.filter((k) => ratingLatest(k.id).rating === m).slice(0, 5).map(link).join(', ')}.`;
  }
  if (unrated.length) t += ` Not rated yet: ${unrated.slice(0, 5).map(link).join(', ')}${unrated.length > 5 ? ' and ' + (unrated.length - 5) + ' more' : ''}.`;
  return `<p class="rate-summary" role="status">${t}</p>`;
}
function ratingAfter() {
  $$('.rate-sel').forEach((sel) => sel.addEventListener('change', () => {
    const id = sel.dataset.k, n = +sel.value, d = P();
    if (!d) return;
    d.ksbRatings = d.ksbRatings || {};
    const h = (d.ksbRatings[id] = d.ksbRatings[id] || []);
    const i = h.findIndex((r) => r.date === today());
    if (!n) { if (i >= 0) h.splice(i, 1); } else if (i >= 0) h[i].rating = n; else h.push({ date: today(), rating: n });
    if (!h.length) delete d.ksbRatings[id];
    changed();
    render().then(() => { const s = $(`.rate-sel[data-k="${CSS.escape(id)}"]`); if (s) s.focus(); });
  }));
}
