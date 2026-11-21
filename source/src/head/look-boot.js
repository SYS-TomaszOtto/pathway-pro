// Runs before the CSS (build.py puts it first in <head>): sets data-style, data-theme and data-motion on <html>
// from the saved choice (localStorage 'pathwayPro.look', per device), so the page never flashes the wrong look.
// Storage blocked or empty: Paper, following the system light/dark setting. 22-look.js keeps it up to date after.
window.lookBoot = function () {
  var d = document.documentElement, l = {};
  try { l = JSON.parse(localStorage.getItem('pathwayPro.look')) || {}; } catch (e) { l = window.lookMem || {}; }
  var dark = false;
  try { dark = matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) {}
  d.setAttribute('data-style', ['basic', 'clear', 'neon', 'journal'].indexOf(l.style) >= 0 ? l.style : 'paper');
  d.setAttribute('data-theme', l.theme === 'light' || l.theme === 'dark' ? l.theme : (dark ? 'dark' : 'light'));
  if (l.motion === 'off') d.setAttribute('data-motion', 'off'); else d.removeAttribute('data-motion');
};
window.lookBoot();
