# Portfolio Tool: design

A single HTML file (`Portfolio Tool.html`, published as `index.html`), opened in Microsoft Edge (or Chrome), with no install, no server, no AI
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
"Portfolio Tool" (output `dist/Portfolio Tool.html`).
