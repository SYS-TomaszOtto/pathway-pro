# ICE Tool

A free tracker for the **ICE Professional Review** (IEng apprenticeship) and for **CPD**, for apprentices and their mentors.

It is a single web page. There is nothing to install, no account, no server and no AI. Your files never leave your computer: the tool reads and saves them in a folder you choose, such as your OneDrive folder.

**[Open the ICE Tool](https://SYS-TomaszOtto.github.io/ice-tool/)**, or **[download it (ICE-Tool.zip)](https://github.com/SYS-TomaszOtto/ice-tool/raw/main/ICE-Tool.zip)** to use it offline.

Use **Microsoft Edge** or **Google Chrome** on a computer. Other browsers cannot use a folder on your computer.

## What it does

- **Evidence**: lists every file in your Evidence folder. You map each one to the ICE sub-attributes at a level (Knowledge, Experience or Ability), with the KSBs it covers and a note.
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

1. Make a folder in OneDrive, such as **ICE Portfolio - Your Name**.
2. Open the ICE Tool, either from the link above or from the downloaded `ICE Tool.html` (right-click → Open with → Microsoft Edge).
3. Click **Start my portfolio**, pick the folder, and allow Edge to use it.

The full guide is in **[How to use ICE Tool.docx](How to use ICE Tool.docx)**. It also covers how to set up sharing with your mentor.

## Privacy

Everything stays in the folder you pick. The page sends nothing anywhere: there are no analytics, no accounts and no uploads. The online version and the downloaded file are the same page.

## Building from source

The page is built from the files in `source/`:

```
cd source
python3 build.py        # writes dist/ICE Tool.html
python3 make_howto.py   # writes dist/How to use ICE Tool.docx
```

`DESIGN.md` explains the folder layout and the data format.

## Reference data

The tool includes:
- the ICE IEng sub-attribute descriptions;
- the Knowledge, Skills and Behaviours of the apprenticeship standard, which is published by the Institute for Apprenticeships and Technical Education.

They are included so the tool works offline. ICE's CPD guidance is summarised from ICE's own published guidance. This is an independent tool: it is not made or endorsed by ICE.

## Licence

MIT: see [LICENSE](LICENSE). Free to use, copy and change.
