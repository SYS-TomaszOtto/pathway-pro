# ICE Tool for Windows: design

A single HTML file (`ICE Tool.html`), opened in Microsoft Edge (or Chrome), with no install, no server, no AI
and no internet. It reads and writes a folder the person picks (their OneDrive folder) through the browser's
File System Access API. Everything it needs (ICE sub-attributes, KSBs, zip, Word and Excel writers) is
inside the file.

## Folders

```
ICE Portfolio - <Apprentice>/      owned by the apprentice; shared with the mentor as VIEW ONLY
  ICE Tool.html                    (can live anywhere; this is the usual place)
  Evidence/                        any sub-folders; every file in here is a piece of evidence
  PRR/                             the Professional Review Reports in Word (shared with mentor as CAN EDIT)
  Meetings/                        transcripts (.vtt/.docx/.txt) and the notes the tool writes
  Exports/                         Excel matrix, response-to-feedback tables
  ice-data/apprentice.json         the tracker: codes, mappings, levels, notes, comment responses, meetings
  ice-data/backups/                one copy per day, last 30 kept

ICE Mentoring - <Apprentice>/      owned by the mentor; shared with the apprentice as VIEW ONLY
  ice-data/mentor.json             assessment per sub-attribute, comments on evidence, agreed actions
```

The tool only ever writes into the folder the person owns. The other person's folder is opened with read
permission only. OneDrive's sharing is what actually stops one person changing the other's files.

## Data (apprentice.json)

```
{ format: 'ice-tool/1', role: 'apprentice', name, created, saved,
  settings: { goal: 3, folders: {evidence, prr, meetings, exports} },
  evidence: { "<path relative to Evidence>": { code, title, date, project, notes, size, mtime,
              maps: [{ sub: '2b', level: 'knowledge'|'experience'|'ability', ksbs: ['K1'], note }] } },
  comments: { "<comment key>": { status: 'open'|'done'|'wont', response, updated } },
  meetings: [{ id, date, title, source, lines: [{ time, speaker, text, tag }],
               items: [{ id, kind: 'done'|'todo'|'teaching', text, sub, due, status, evidence }] }] }
```

mentor.json: `{ format, role: 'mentor', name, apprentice, subs: {id: {status, comment, date}},
evidence: {code: {comment, date}}, actions: [{id, text, due, status}] }`

## Coverage

For each of the 28 sub-attributes, distinct evidence items mapped at each level (Knowledge, Experience,
Ability), goal 3 each (9 slots). Completion = evidence slots 50%, PRR sections written and passing checks 35%,
mentor comments answered 15% (evidence counts most).

## PRR (Word is the master)

Read only. Sections start at a heading such as `2b – Contribute to…`; `Evidence: CO-14, DD-00 to DD-05`
lines list evidence; `{CO-14}` starts the write-up about that item. The checks are listed in the Reports page help.
Mentor comments (comments.xml, replies and resolved state from commentsExtended.xml) and tracked changes
are listed per section; the apprentice marks each one done / won't do with a response, and can export a
"Response to feedback" Word table.
