# Portfolio Tool

A free tracker for professional review portfolios and **CPD**, for apprentices, candidates and their mentors. It has built-in frameworks for **ICE** (IEng apprenticeship, and the current Incorporated, Chartered and Technician Professional Review attributes), **IStructE** (Chartered, Incorporated and Technician Member) and the Engineering Council's **UK-SPEC** competences (CEng, IEng and EngTech, in the 4th edition and, for CEng and IEng, the older 3rd edition wording that some institutions' forms still use). There are also lists for **IChemE** (Chartered Member), **CIBSE** (MCIBSE, ACIBSE), **IMechE** (CEng and IEng application questions), **RINA** (CEng and IEng experiential learning outcomes), **IHE** (RITTech) and **CIHT** (Transport Planning Professional units, with minimum levels). Every list can be edited, and you can write your own for any institution or level.

It is a single web page. There is nothing to install, no account, no server and no AI. Your files never leave your computer: the tool reads and saves them in a folder you choose, such as your OneDrive folder.

**[Open the Portfolio Tool](https://SYS-TomaszOtto.github.io/ice-tool/)**, or **[download it (Portfolio-Tool.zip)](https://github.com/SYS-TomaszOtto/ice-tool/raw/main/Portfolio-Tool.zip)** to use it offline.

Use **Microsoft Edge** or **Google Chrome** on a computer. Other browsers cannot use a folder on your computer.

## What it does

- **Framework**: pick ICE IEng (apprenticeship), the current ICE Incorporated, Chartered or Technician Professional Review attributes, an IStructE grade, a UK-SPEC level or a blank one when you start, and edit it any time in Settings → Framework (levels, requirements, standards, folder names). Nothing is locked: if a built-in list is wrong or out of date, correct it there. Requirements can have a minimum level, as in IStructE's core objectives. Frameworks export and import as a file.
- **Evidence**: lists every file in your Evidence folder, which has one sub-folder per kind of evidence. You map each one to the requirements at a level, with the standards it covers and a note.
- **Attributes and KSBs**: shows what is covered and what is missing, against a goal of 3 pieces of evidence per level for each sub-attribute.
- **Reports**: reads your Word PRRs, without changing them, and checks the structure:
  - evidence listed but not written about;
  - codes that don't exist;
  - very short write-ups;
  - evidence not yet mapped.
- **Feedback**: lists your mentor's Word comments and tracked changes by sub-attribute. You write a response to each, and export a "Response to feedback" table.
- **Meetings**: you import a Teams transcript and tag each line as Done, To do or Teaching. To-dos become actions, and the tool writes the meeting notes in Word.
- **CPD**: follows ICE's CPD guidance, with a Development Action Plan and a Personal Development Record. It shows hours per year, and exports Word files in the layout of ICE's CPD templates. There is also a "CPD record only" mode.
- **Mentor**: your mentor uses the same tool to record an assessment per sub-attribute, kept in their own folder. Each of you can only read the other's folder, because OneDrive's sharing enforces it.

## Getting started

1. Make a folder in OneDrive, such as **Portfolio - Your Name**. The tool creates its folders inside it: reports, evidence matrix, evidence (one folder per kind of evidence), feedback, meetings and CPD.
2. Open the Portfolio Tool, either from the link above or from the downloaded `index.html` (right-click → Open with → Microsoft Edge).
3. Click **Start my portfolio**, pick the folder, and allow Edge to use it.

The full guide is in **[How to use Portfolio Tool.docx](How%20to%20use%20Portfolio%20Tool.docx)**. It covers choosing and editing a framework, the folders, writing reports the tool can check, and how to set up sharing with your mentor. The download zip contains the tool and the guide.

## Privacy

Everything stays in the folder you pick. The page sends nothing anywhere: there are no analytics, no accounts and no uploads. The online version and the downloaded file are the same page.

## Building from source

The page is built from the files in `source/`:

```
cd source
python3 build.py        # writes dist/Portfolio Tool.html
python3 make_howto.py   # writes dist/How to use Portfolio Tool.docx
```

`DESIGN.md` explains the folder layout and the data format.

## Reference data

The tool includes:
- the ICE IEng sub-attribute descriptions, and the ICE Professional Review attributes from ICE's Professional Review Guidance (version 3 revision 14, June 2026) and Technician Professional Review Guidance (version 3 revision 7, July 2024);
- the Knowledge, Skills and Behaviours of the apprenticeship standard, which is published by the Institute for Apprenticeships and Technical Education.

The lists for the other institutions were read from their published guidance and application forms; the source is shown on the Framework page. They may contain mistakes or be out of date, so check them against the current documents and correct anything in Settings → Framework. The UK-SPEC frameworks are the Engineering Council's published competence statements (UK-SPEC 4th edition; the 3rd edition wording is read from the Society of Operations Engineers application forms). The IStructE frameworks use the core objectives and minimum standards from the Institution's published IPD guidance (Chartered 2026, Incorporated 2025, Technician 2026); check them against the current guidance. They are included so the tool works offline. ICE's CPD guidance is summarised from ICE's own published guidance. This is an independent tool: it is not made or endorsed by ICE, IStructE, the Engineering Council or any other institution.

## Licence

MIT: see [LICENSE](LICENSE). Free to use, copy and change.
