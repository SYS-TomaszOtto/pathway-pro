<img src="source/src/logo.png" alt="" width="96">

# Pathway Pro

A free tracker for professional review portfolios and **CPD**, for apprentices, candidates and their mentors. It has built-in frameworks for **ICE** (IEng apprenticeship, and the current Incorporated, Chartered and Technician Professional Review attributes), **IStructE** (Chartered, Incorporated and Technician Member) and the Engineering Council's **UK-SPEC** competences (CEng, IEng and EngTech, in the 4th edition and, for CEng and IEng, the older 3rd edition wording that some institutions' forms still use). There are also lists for **IChemE** (Chartered Member), **CIBSE** (MCIBSE, ACIBSE), **IMechE** (CEng and IEng application questions), **RINA** (CEng and IEng experiential learning outcomes), **IHE** (RITTech) and **CIHT** (Transport Planning Professional units, with minimum levels). Every list can be edited, and you can write your own for any institution or level.

It is a single web page. There is nothing to install, no account, no server and no AI. Your files never leave your computer: the tool reads and saves them in a folder you choose, such as your OneDrive folder.

**[Download Pathway Pro (Pathway-Pro.zip)](https://github.com/SYS-TomaszOtto/pathway-pro/raw/main/Pathway-Pro.zip)**, unzip it, and open `Pathway Pro.html` in Edge or Chrome. There is no online version: the app runs from the downloaded file.

Use **Microsoft Edge** or **Google Chrome** on a computer. Other browsers cannot use a folder on your computer.

## What it does

- **Framework**: pick ICE IEng (apprenticeship), the current ICE Incorporated, Chartered or Technician Professional Review attributes, an IStructE grade, a UK-SPEC level or a blank one when you start, and edit it any time in Settings → Framework (levels, requirements, standards, folder names). Nothing is locked: if a built-in list is wrong or out of date, correct it there. Requirements can have a minimum level, as in IStructE's core objectives. Frameworks export and import as a file.
- **Evidence**: lists every file in your Evidence folder, which has one sub-folder per kind of evidence. You map each one to the requirements at a level, with the standards it covers and a note.
- **Attributes and KSBs**: shows what is covered and what is missing, against a goal of 3 pieces of evidence per level for each sub-attribute. On the KSB page you can rate how well you know each item (1 to 5) and re-rate over time.
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

1. Make an empty folder in OneDrive, such as **Portfolio - Your Name**. The tool creates its folders inside it (see [Suggested folder layout](#suggested-folder-layout) below).
2. Open the Pathway Pro, either from the link above or from the downloaded `index.html` (right-click → Open with → Microsoft Edge).
3. Click **Start my portfolio**, pick the folder, and allow Edge to use it.

Press **Show me around** at the top of any page for a short guided tour (each page also has a **Tour of this page** button). A new portfolio shows only Home, Evidence, CPD, Settings and Help; the other pages appear as you have something to put in them, and are always under **More** (or tick **Show every tab** in Settings).

**Look around first:** on the start screen, **Look around with sample data** opens the tool filled with made-up data (a sample apprentice, evidence, meetings, CPD and mentor comments) so you can see how it works before choosing a folder. Nothing is saved or written anywhere, and a banner on every page says so; **Leave the sample** goes back to the start screen, and so does refreshing the page. Sample files cannot be opened, and adding files, exports to your folder and restoring backups are switched off.

On the Evidence page, **Add files…** (or drag files onto the page) copies files into the right evidence folder with the next free code in the name. **Undo** (Ctrl+Z) steps back through your recent changes.

New to portfolios? You don't need to know how to organise your evidence first. Read the folder layout and the worked example below. Both are also in the tool's Help page and in the Word guide.

## Suggested folder layout

Keep everything for your review in one OneDrive folder. This is the layout the tool uses. Only the top folder is yours to make: the tool makes the rest when you press **Start my portfolio**.

- **OneDrive**
  - **Portfolio - Your Name**: *you make it.* Make this empty folder, then pick it when you start.
    - **0 - Reports**: *tool makes it, you fill it.* Your reports (PRR) in Word. Reports → New PRR from template… makes a starter file here. Your mentor comments in these files.
    - **1 - Evidence Matrix**: *tool makes and fills it.* The Excel evidence matrix from Evidence → Export Excel matrix.
    - **2 - Evidence**: *tool makes it, you fill it.* One sub-folder per kind of evidence. For ICE IEng these are:
      - **0 - Correspondences - CO**: emails, letters and meeting minutes about your work. Save emails as PDF.
      - **1 - Modeling Snaps - MO**: screenshots of models you built or checked.
      - **2 - Markups - MU**: drawings and documents you marked up or checked.
      - **3 - Deliverable Reports - DR**: reports you wrote or helped to write.
      - **4 - Calculations - CA**: calculations you did or checked.
      - **5 - Tools - MM**: spreadsheets, scripts and other tools you made or improved.
      - **6 - Deliverable Drawings - DD**: drawings you produced or worked on.
      - **7 - Certificates - CE**: training certificates and course records.
      - **8 - Presentations - PR**: presentations and talks you gave.
    - **4 - Feedback, Compliance and Status**: *tool makes and fills it.* The "Response to feedback" tables you export.
    - **Meetings**: *tool makes it, you fill it.* Teams transcripts you download, and the meeting notes the tool writes.
    - **CPD**: *tool makes and fills it.* Certificates and handouts you attach to CPD activities, copied in by year.
    - **Exports**: *tool makes and fills it.* CPD records exported in Word or Excel.
    - **ice-data**: *tool makes and fills it.* The tracker itself, with daily backups. Never edit or move these files.

Other frameworks have their own evidence sub-folders: the Help page in the tool shows the ones you have. The numbers in the names only keep the folders in order. You can rename folders in Settings → Framework, but it is easiest to keep them as they are.

### Naming evidence files

Start every file name with a code: the folder's letters, a dash and a number. Then add what it is, the project and the subject: `CO-00 - Email - Project - Subject.pdf`

- `CO-00 - Email - Riverside Car Park - Agreed bearing loads.pdf`
- `CA-03 - Calc - Riverside Car Park - Pile capacity check.pdf`
- `DD-12 - Drawing - Station Road - General arrangement rev C.pdf`

Each code is used once. Codes do not need to be in order, and gaps are fine. Use two digits (`CO-07`), or three once you pass 99. Forgot the code? **Evidence → Number files…** gives codes to files without one. You quote these codes in your report, for example `Evidence: CO-00, CA-03`.

## Example: from an empty folder to a finished portfolio

A typical route. Steps 3 to 9 repeat as your portfolio grows.

1. **Set up the folder.** In OneDrive, make an empty folder called **Portfolio - Your Name**. Open Pathway Pro in Edge, press **Start my portfolio** and pick that folder. Type your name and choose your framework.
   *What you'll see:* Edge asks to view and save files in the folder: allow it. The folders 0 - Reports, 2 - Evidence and the rest appear in OneDrive.
2. **Share it with your mentor.** In OneDrive, share the portfolio folder with your mentor as **Can view**, and **0 - Reports** as **Can edit**. Your mentor then follows "Working with your mentor" in the guide.
   *What you'll see:* once their folder is linked in Settings, their assessment shows on the Mentor page.
3. **Drop in your first evidence.** Save three to five files into the right sub-folders of **2 - Evidence**, each named with a code. Then open **Evidence** and press **Refresh**.
   *What you'll see:* each file listed with its code and title, and a count of files "not mapped yet".
4. **Map each file.** Click a file. For each sub-attribute it shows, press a level: **K** Knowledge, **E** Experience or **A** Ability (ICE IEng). Add a short note on why.
   *What you'll see:* the level buttons light up, and the file no longer counts as "not mapped".
5. **Check Attributes for gaps.** Open **Attributes**. Each sub-attribute needs 3 pieces of evidence at each level (you can change this number). Plan what to collect next.
   *What you'll see:* a bar per sub-attribute. Home lists the biggest gaps under Next steps.
6. **Write your report in Word.** **Reports → New PRR from template…** makes a Word file in **0 - Reports**. Under each heading such as **2b – …**, add a line like **Evidence: CO-00, CA-03**. Put **{CO-00}** before you write about that file.
   *What you'll see:* the file listed on Reports with its sections.
7. **Run the Reports checks.** Save the Word file, then press **Re-read Word files** on **Reports**. Fix what it flags in Word and check again.
   *What you'll see:* warnings such as evidence listed but not written about, codes that do not exist, or very short write-ups.
8. **Get your mentor's comments.** Your mentor comments in your Word file as usual (Review → New Comment, or Track Changes).
   *What you'll see:* each comment on the Feedback page, under its sub-attribute.
9. **Respond to feedback.** Change your report, then on **Feedback** write what you changed and mark it **Done** or **Won't change**. Export the **Response to feedback** table for your mentor.
   *What you'll see:* the open comment count on Home goes down. The table is saved in 4 - Feedback, Compliance and Status.
10. **Meetings and CPD along the way.** After each mentor meeting, import the Teams transcript on **Meetings** and tag lines as done, to do or teaching. Record training and learning on **CPD** as it happens.
    *What you'll see:* to-dos listed as open actions on Home, and your CPD hours for the year.
11. **Final check before you submit.** On **Home**, aim for full evidence slots, no Reports warnings and no open comments. Export the Excel matrix and your CPD record. Check your institution's current submission rules.
    *What you'll see:* the files in 1 - Evidence Matrix and Exports, ready to attach.

## The full guide

The full guide is in **[How to use Pathway Pro.docx](How%20to%20use%20Pathway%20Pro.docx)**. It covers the folder layout and this example, choosing and editing a framework, writing reports the tool can check, and how to set up sharing with your mentor. The download zip contains the tool and the guide.

## Privacy

Everything stays in the folder you pick. The page sends nothing anywhere: there are no analytics, no accounts and no uploads.

## Building from source

The page is built from the files in `source/`:

```
cd source
python3 build.py        # writes dist/Pathway Pro.html
python3 make_howto.py   # writes dist/How to use Pathway Pro.docx
```

`DESIGN.md` explains the folder layout and the data format.

## Reference data

The tool includes:
- the ICE IEng sub-attribute descriptions, and the ICE Professional Review attributes from ICE's Professional Review Guidance (version 3 revision 14, June 2026) and Technician Professional Review Guidance (version 3 revision 7, July 2024);
- the Knowledge, Skills and Behaviours of the apprenticeship standard, which is published by the Institute for Apprenticeships and Technical Education.

The lists for the other institutions were read from their published guidance and application forms; the source is shown on the Framework page. They may contain mistakes or be out of date, so check them against the current documents and correct anything in Settings → Framework. The UK-SPEC frameworks are the Engineering Council's published competence statements (UK-SPEC 4th edition; the 3rd edition wording is read from the Society of Operations Engineers application forms). The IStructE frameworks use the core objectives and minimum standards from the Institution's published IPD guidance (Chartered 2026, Incorporated 2025, Technician 2026); check them against the current guidance. They are included so the tool works offline. ICE's CPD guidance is summarised from ICE's own published guidance. This is an independent tool: it is not made or endorsed by ICE, IStructE, the Engineering Council or any other institution.

## Licence

MIT: see [LICENSE](LICENSE). Free to use, copy and change.
