# Pathway Pro: design

A single HTML file (`Pathway Pro.html`, published as `index.html`), opened in Microsoft Edge (or Chrome), with no install, no server, no AI
and no internet. It reads and writes a folder the person picks (their OneDrive folder) through the browser's
File System Access API. Everything it needs (the built-in frameworks, zip, Word and Excel writers) is
inside the file.

## Folders

```
<Portfolio folder>/                owned by the apprentice; shared with the mentor as VIEW ONLY
  0 - Reports/                     the reports in Word (shared with mentor as CAN EDIT)
  1 - Evidence Matrix/             the Excel matrix the tool writes
  2 - Evidence/                    one sub-folder per kind of evidence, named "<n> - <Name> - <CODE PREFIX>"
                                   (default: 0 Correspondences CO, 1 Modeling Snaps MO, 2 Markups MU, 3 Deliverable Reports DR,
                                   4 Calculations CA, 5 Tools MM, 6 Deliverable Drawings DD, 7 Certificates CE, 8 Presentations PR)
  4 - Feedback, Compliance and Status/   response-to-feedback tables
  Meetings/  CPD/  Exports/        transcripts and notes; CPD attachments; other exports
  ice-data/portfolio.json          the tracker (includes the framework); ice-data/backups/ one copy per day, last 30 kept

ICE Mentoring - <apprentice>/      owned by the mentor; shared with the apprentice as VIEW ONLY
  ice-data/mentor.json
```

## Framework (customisable)

`portfolio.framework` (null = built-in ICE IEng) holds: name, tab labels, levels (id, letters, name, help), groups,
attributes (id, group, text), optional standards such as KSBs (id, kind, text, linked attribute ids), the folder names
and the evidence sub-folders. `05-framework.js` applies it to the globals (LEVELS, SUBS, GROUPS, KSBS, FOLDERS, the
report heading pattern); Settings → Framework (`13-framework-view.js`) edits it as pasted text lines, with export/import
as JSON. Mappings to a deleted requirement or level stay in the data but are not counted.

The tool only ever writes into the folder the person owns. The other person's folder is opened with read
permission only. OneDrive's sharing is what actually stops one person changing the other's files.

## Data (apprentice.json)

```
{ format: 'ice-tool/1', role: 'apprentice', name, created, saved, mode: 'ice'|'cpd',
  framework: null | { name, source, labels, levels, groups, attributes, ksbs, folders, evidenceFolders },  // null = built-in ICE IEng
  ksbRatings: { "<ksb id>": [{ date, rating: 1-5 }] },  // self-rating, one entry per day (src/20-selfrate.js)
  settings: { goal: 3, cpdTarget, cpdYearStart, themes },
  evidence: { "<path relative to Evidence>": { code, title, date, project, notes, size, mtime,
              maps: [{ sub: '2b', level: 'knowledge'|'experience'|'ability', ksbs: ['K1'], note }] } },
  comments: { "<comment key>": { status: 'open'|'done'|'wont', response, updated } },
  meetings: [{ id, date, title, source, lines: [{ time, speaker, text, tag }],
               items: [{ id, kind: 'done'|'todo'|'teaching', text, sub, due, status, evidence }] }] }
```

mentor.json: `{ format, role: 'mentor', name, apprentice, subs: {id: {status, comment, date}},
evidence: {code: {comment, date}}, actions: [{id, text, due, status}] }`

## Coverage

For each requirement of the framework, distinct evidence items mapped at each level of the framework
(for ICE IEng: Knowledge, Experience, Ability), goal 3 each. A requirement with a minimum level needs `goal` items
at that level or above. Completion = evidence slots 50%, PRR sections written and passing checks 35%,
mentor comments answered 15% (evidence counts most).

## PRR (Word is the master)

Read only. Sections start at a heading made of a requirement id and a dash, such as `2b – Contribute to…` or `A1 – …`; `Evidence: CO-14, DD-00 to DD-05`
lines list evidence; `{CO-14}` starts the write-up about that item. The checks are listed in the Reports page help.
Mentor comments (comments.xml, replies and resolved state from commentsExtended.xml) and tracked changes
are listed per section; the apprentice marks each one done / won't do with a response, and can export a
"Response to feedback" Word table.

## Minimum level and built-in frameworks
A requirement may have `min` (a level id): it is then met by `goal` distinct evidence items at that level or above
(IStructE core objectives each have a minimum standard). Without `min`, every level needs `goal` items.
Built-in frameworks: ICE IEng, IStructE Chartered / Incorporated / Technician Member (generated at build time from
`src/ipd.json`, which was extracted from the Institution's IPD guidance PDFs), and a blank one. The tool is named
"Pathway Pro" (output `dist/Pathway Pro.html`).

## Guidance for new users
`14-guide.js` builds the "Suggested folder layout" (a nested list made from the live `FOLDERS` and
`EVIDENCE_CATEGORIES`, so it always matches what the tool creates) and an 11-step worked example. Both show on
the Help page and, from the start screen's "New to this?" card, in dialogs. `make_howto.py` carries the same text
(ICE IEng folder names) for the Word guide; keep the two in step.

## First run and wording
- **Progressive tabs** (`tabUnlocked` in `07-app.js`): a new apprentice sees Home, Evidence, CPD, Settings, Help and a "More" menu; the other pages show once they have content. `settings.showAllTabs` shows all. Routing still accepts every page.
- **Bottom tab bar** (`21-tabbar.js`, end of `style.css`): all tabs live in a bar fixed at the bottom (phones and desktop; logo, search and undo stay in the header). It shows the 4 most used unlocked pages (`TAB_PRIORITY`, mentor order `TAB_PRIORITY_MENTOR`) plus "More", which opens a non-modal sheet above the bar with the rest; with 5 pages or fewer (CPD-only) there is no More. ARIA tablist/tab with roving tabindex, arrows/Home/End, `aria-current="page"`; the sheet takes focus, Up/Down move, Esc/click outside/Tab away close it and focus returns to More. `body.has-tabbar` pads the page by `--tabbar-space` (includes `env(safe-area-inset-bottom)`) and lifts toasts, the preview drawer, dialogs and the phone tour popover above the bar. Test: `await testTabbar()` in the test build.
- **Guided tour** (`15-tour.js`, `tour.css`): a main tour and a short tour per page, no libraries, popover is a dialog with focus handling, progress in localStorage `pathwayPro.tour` (every access in try/catch). Test hook `window.testTour`. The folder layout and worked example stay in `14-guide.js` (Help page and start screen).
- **Sample data mode** (`19-demo.js`, `demo.css`): `startDemo()` builds an in-memory portfolio (real data shapes, made-up evidence in `S.files`, made-up Word reports and mentor comments in `S.prr` via `parsePrr`, mentor data in `S.otherData`) and sets `S.demo`. `S.own` is an empty stub folder. Every writer is blocked by one rule: `save`, `dailyBackup`, `remember`, `ensureFolders`, `scanEvidence`, `loadReports` return at once, `writeFile` throws "Not available with sample data", and `pickFolder`, Add files and Restore call `demoBlocked()` (toast). Previews show a "sample file" message. The banner (`role=region`) is added by `renderHeader`. Nothing is persisted, so F5 shows the start screen; `leaveDemo()` is synchronous so "Start my own portfolio" can open the folder picker at once. New writers must check `S.demo`.
- **Wording**: `framework.labels` = `{ attr, ksb, item, items }` (`attr` names the list, `item`/`items` one entry, e.g. competence, question, learning outcome, unit). Older portfolios without `item` get it from `attr`.
- **Other settings**: `settings.keyDate` / `keyDateLabel` (shown on Home), `settings.showAllTabs`. Settings can restore a daily backup (the current data is kept first as `*-before-restore.json`).
- **Undo** (`UNDO` in `04-store.js`): one snapshot of the whole portfolio per burst of changes (1.5 s), last 25 steps in memory, Ctrl+Z / Ctrl+Y and top-bar buttons; not kept between sessions (daily backups cover that).
- **Add evidence** (`16-add.js`): copies picked or dropped files into `2 - Evidence/<kind>/`, next free code for the kind's prefix, never overwrites (adds " (2)").
- **Labels**: `autoLabel` (`07-app.js`) ties every label without `for`, and every unnamed field, to a name after each render (axe-checked on all pages).

## Appearance (styles, themes, animations)
- **Five styles × light/dark = 10 looks**, chosen per device (never in the portfolio, so undo, backups, sample mode and the mentor are untouched): `localStorage['pathwayPro.look'] = { style: paper|basic|clear|neon|journal, theme: system|light|dark, motion: system|off }`, every access in try/catch (blocked storage: the choice lasts for the session). Default: Paper, following the system theme. A one-off toast (once per device) says where to switch.
  - **Paper** (default): warm cream with a faint grid and grain (CSS gradients), typewriter (system monospace) headings, labels, buttons and tab bar, ink outlines with a small offset shadow, rounder corners, wavy title rules, soft pastel pills, terracotta accent. Paper dark is true black (#000) with the same outlines, pills and warm accents.
  - **Basic**: the look before Nov 2026, unchanged (checked element by element on Home, Evidence and Settings). Print always uses Basic light.
  - **Clear**: accessibility first. Atkinson Hyperlegible Next (embedded, SIL OFL 1.1, licence in the file as a comment and in `src/fonts/`), 16 px, line height 1.6, wider spacing, 2 px control borders, GOV-style focus (ink ring with a yellow halo; yellow in dark), underlined links, status tags with a symbol (✓ ◐ ✕), calm motion (no fills or draw-ins).
  - **Neon**: sharp corners, Bahnschrift headings, uppercase mono labels, outline tags in the status colour, thin neon meters. Light has a light header and tab bar; dark is OLED black throughout with a static glow on focus, the active tab and primary buttons.
  - **Journal**: system serif headings (Charter/Sitka/Cambria/Georgia) over a 2 px masthead rule, no card boxes (hairline rules), small-caps labels, status as a coloured dot and a word, midnight navy dark.
- **How**: `<html data-style data-theme [data-motion=off]>`. The head script (`src/head/look-boot.js`, placed before the CSS by build.py) sets them before first paint; `22-look.js` changes them, follows the OS theme live (`matchMedia` change) and draws the controls. Token blocks at the top of `style.css` are `:is(:root, .look-preview)[data-style=x][data-theme=dark]`; component CSS uses only tokens, and each style's extras live in `paper.css`, `clear.css`, `neon.css`, `journal.css` under `[data-style=x]`. `build.py --test` fails on any hex/rgba colour outside a `:root` block, on the look script not being first, and on size over 580 KB (the plan's limit with an embedded font).
- **Controls**: Settings → Appearance: Theme and Animations as segmented buttons, Style as five radio cards with live mini-previews (each preview carries its own `data-style`/`data-theme`, so it is drawn by the real tokens), "✓ In use" on the chosen one, a polite "Style: X" announcement. The More sheet foot (and the start screen) has Auto/Light/Dark and a "Style: X ›" button that opens the same five cards in the sheet.
- **Motion**: every animation is inside `prefers-reduced-motion: no-preference` and `:root:not([data-motion=off])`, plays once and is under 5 s. Home meters fill once per session (`sessionStorage`), lesson illustrations slide in once per step.
- **Paper extras** (phase 2–3): Key point box (`.keypoint`, both styles; Basic gets a left-bordered note), tour popover with step dots and key points, Ctrl K pill hint (desktop), Home progress strip, ticked/open boxes for "Ready to submit?", Key point on the first Next step, fact pills (`facts()`) under the Evidence, Attributes and Reports titles.
- **Tests** (test build): `await testLook()` (all 10 looks: tokens, contrast pairs, focus ring, distinctness, persistence via the head script, storage blocked, system follow, Animations off, Settings cards and the More-sheet cards, tab bar in Paper dark), `await testAllLooks({ axe: true })` (every page and lesson 1 in every look: no sideways scroll, nothing off the edge, page end clears the tab bar, axe-core with no violations; run at desktop and at 375 px), `await testHome()`, `await testLessons()`, `await testSuite()` runs them all.

## Lessons
- `23-lessons.js`: three lessons (Set up your portfolio, Map evidence, Reports and feedback), plain data worded through `LABEL`, each with a "You'll learn" list, 5 steps, an isometric line illustration per step (inline SVG drawn with `currentColor` and tokens) and a Key point. Route `#lesson/n` (Help tab), a Lessons card at the top of Help, "Lesson 1" on the start screen (in a dialog) and a link on the new-user Home card.
- Back (`aria-disabled` on step 1), numbered step buttons (`aria-current="step"`), Next / Finish, sticky above the tab bar; Left/Right/Home/End move steps when focus is in the lesson; a polite live region reads "Step n of m: title". Progress per device in `localStorage['pathwayPro.lessons']` (try/catch). The guided tour stays as "where things are"; lessons are "how it works".
