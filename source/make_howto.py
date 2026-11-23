"""Write "How to use Pathway Pro.docx": the guide that travels with the tool, for any apprentice or mentor."""
import pathlib, sys, zipfile

W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def runs(text):
    """**bold** spans become bold runs."""
    out = []
    for i, part in enumerate(text.split('**')):
        if part:
            out.append(f'<w:r>{"<w:rPr><w:b/></w:rPr>" if i % 2 else ""}<w:t xml:space="preserve">{esc(part)}</w:t></w:r>')
    return ''.join(out)


def para(text, style=None, indent=False):
    ppr = ''
    if style or indent:
        ppr = '<w:pPr>' + (f'<w:pStyle w:val="{style}"/>' if style else '') + ('<w:ind w:left="400" w:hanging="300"/>' if indent else '') + '</w:pPr>'
    return f'<w:p>{ppr}{runs(text)}</w:p>'


GUIDE = [
    ('title', 'Pathway Pro: how to use it'),
    ('p', 'A tracker for a professional review or apprenticeship portfolio, and for CPD. It is one file, **Pathway Pro.html**, that runs in Microsoft Edge or Google Chrome. There is nothing to install, it needs no internet and it has no AI: it lists, links, counts and checks, so nothing gets missed. Your files stay in a folder you choose, such as your OneDrive folder.'),
    ('h1', 'Suggested folder layout'),
    ('p', 'Keep everything for your review in one OneDrive folder. This is the layout the tool uses. Only the top folder is yours to make: the tool makes the rest when you press **Start my portfolio**.'),
    ('t0', '**OneDrive**'),
    ('t1', '**Portfolio - Your Name**: you make it. Make this empty folder, then pick it when you start.'),
    ('t2', '**0 - Reports**: tool makes it, you fill it. Your reports (PRR): written in Pathway Pro (Reports → Start) or in Word (Reports → New Word PRR from template…). Your mentor comments in the Word files.'),
    ('t2', '**1 - Evidence Matrix**: tool makes and fills it. The Excel evidence matrix from Evidence → Export Excel matrix.'),
    ('t2', '**2 - Evidence**: tool makes it, you fill it. One sub-folder per kind of evidence. For ICE IEng these are:'),
    ('t3', '**0 - Correspondences - CO**: emails, letters and meeting minutes about your work. Save emails as PDF.'),
    ('t3', '**1 - Modeling Snaps - MO**: screenshots of models you built or checked.'),
    ('t3', '**2 - Markups - MU**: drawings and documents you marked up or checked.'),
    ('t3', '**3 - Deliverable Reports - DR**: reports you wrote or helped to write.'),
    ('t3', '**4 - Calculations - CA**: calculations you did or checked.'),
    ('t3', '**5 - Tools - MM**: spreadsheets, scripts and other tools you made or improved.'),
    ('t3', '**6 - Deliverable Drawings - DD**: drawings you produced or worked on.'),
    ('t3', '**7 - Certificates - CE**: training certificates and course records.'),
    ('t3', '**8 - Presentations - PR**: presentations and talks you gave.'),
    ('t2', '**4 - Feedback, Compliance and Status**: tool makes and fills it. The "Response to feedback" tables you export.'),
    ('t2', '**Meetings**: tool makes it, you fill it. Teams transcripts you download, and the meeting notes the tool writes.'),
    ('t2', '**CPD**: tool makes and fills it. Certificates and handouts you attach to CPD activities, copied in by year.'),
    ('t2', '**Exports**: tool makes and fills it. CPD records exported in Word or Excel.'),
    ('t2', '**ice-data**: tool makes and fills it. The tracker itself, with daily backups. Never edit or move these files.'),
    ('p', 'Other frameworks have their own evidence sub-folders: the Help page in the tool shows the ones you have. The numbers in the names only keep the folders in order. You can rename folders in Settings → Framework, but it is easiest to keep them as they are.'),
    ('h1', 'Naming evidence files'),
    ('p', 'Start every file name with a code: the folder’s letters, a dash and a number. Then add what it is, the project and the subject: **CO-00 - Email - Project - Subject.pdf**'),
    ('b', 'CO-00 - Email - Riverside Car Park - Agreed bearing loads.pdf'),
    ('b', 'CA-03 - Calc - Riverside Car Park - Pile capacity check.pdf'),
    ('b', 'DD-12 - Drawing - Station Road - General arrangement rev C.pdf'),
    ('p', 'Each code is used once. Codes do not need to be in order, and gaps are fine. Use two digits (CO-07), or three once you pass 99. Forgot the code? **Evidence → Number files…** gives codes to files without one. You quote these codes in your report, for example **Evidence: CO-00, CA-03**.'),
    ('h1', 'Example: from an empty folder to a finished portfolio'),
    ('p', 'A typical route. Steps 3 to 9 repeat as your portfolio grows.'),
    ('h2', '1. Set up the folder'),
    ('p', 'In OneDrive, make an empty folder called **Portfolio - Your Name**. Open Pathway Pro in Edge, press **Start my portfolio** and pick that folder. Type your name and choose your framework.'),
    ('see', 'Edge asks to view and save files in the folder: allow it. The folders 0 - Reports, 2 - Evidence and the rest appear in OneDrive.'),
    ('h2', '2. Share it with your mentor'),
    ('p', 'In OneDrive, share the portfolio folder with your mentor as **Can view**, and **0 - Reports** as **Can edit**. Your mentor then follows "Working with your mentor" below.'),
    ('see', 'once their folder is linked in Settings, their assessment shows on the Mentor page.'),
    ('h2', '3. Drop in your first evidence'),
    ('p', 'Save three to five files into the right sub-folders of **2 - Evidence**, each named with a code. Then open **Evidence** and press **Refresh**.'),
    ('see', 'each file listed with its code and title, and a count of files "not mapped yet".'),
    ('h2', '4. Map each file'),
    ('p', 'Click a file. For each sub-attribute it shows, press **+ Add a sub-attribute**, pick it and its level (Knowledge, Experience or Ability for ICE IEng), and say how the file contributes.'),
    ('see', 'a card for each one under the file, and the file no longer counts as "not mapped".'),
    ('h2', '5. Check Attributes for gaps'),
    ('p', 'Open **Attributes**. Each sub-attribute needs 3 pieces of evidence at each level (you can change this number). Plan what to collect next. If your framework has KSBs, they are further down the same page: rate how well you know each one (1 to 5) and re-rate as you learn. **Summary** shows the whole picture: every level slot, next steps, and evidence you have not used yet.'),
    ('see', 'a bar per sub-attribute. Home lists the biggest gaps under Next steps.'),
    ('h2', '6. Write your report'),
    ('p', 'On **Reports**, press **Start** for an attribute to write it in Pathway Pro, checked as you type (**Make Word** saves a copy for your mentor to comment on). Or **New Word PRR from template…** makes a Word file in **0 - Reports**. Under each heading such as **2b – …**, add a line like **Evidence: CO-00, CA-03**. Put **{CO-00}** before you write about that file. See "Writing your report so the checks work" below.'),
    ('see', 'the file listed on Reports with its sections.'),
    ('h2', '7. Run the Reports checks'),
    ('p', 'Save the Word file, then press **Re-read Word files** on **Reports**. Fix what it flags in Word and check again.'),
    ('see', 'warnings such as evidence listed but not written about, codes that do not exist, or very short write-ups.'),
    ('h2', '8. Get your mentor’s comments'),
    ('p', 'Your mentor comments in your Word file as usual (Review → New Comment, or Track Changes).'),
    ('see', 'each comment on the Feedback page, under its sub-attribute.'),
    ('h2', '9. Respond to feedback'),
    ('p', 'Change your report, then on **Feedback** write what you changed and mark it **Done** or **Won’t change**. Export the **Response to feedback** table for your mentor.'),
    ('see', 'the open comment count on Home goes down. The table is saved in 4 - Feedback, Compliance and Status.'),
    ('h2', '10. Meetings and CPD along the way'),
    ('p', 'After each mentor meeting, import the Teams transcript on **Meetings** and tag lines as done, to do or teaching. Record training and learning on **CPD** as it happens.'),
    ('see', 'to-dos listed as open actions on Home, and your CPD hours for the year.'),
    ('h2', '11. Final check before you submit'),
    ('p', 'On **Home** and **Summary**, aim for full evidence slots, no Reports warnings and no open comments. Export the Excel matrix and your CPD record. Check your institution’s current submission rules.'),
    ('see', 'the files in 1 - Evidence Matrix and Exports, ready to attach.'),
    ('h1', 'Choose what you are assessed against (the framework)'),
    ('p', 'When you start, you pick a built-in framework: ICE IEng (apprenticeship), the current ICE Incorporated, Chartered or Technician Professional Review attributes, IStructE (Chartered, Incorporated or Technician Member), the Engineering Council UK-SPEC competences (CEng, IEng, EngTech), or lists for IChemE, CIBSE, IMechE, RINA, IHE (RITTech) and CIHT. Or start blank and write your own.'),
    ('b', '**Everything can be edited**: in **Settings → Framework** you can change the levels, groups, requirements, standards, tab names, folder names and evidence folders. The lists were read from the institutions’ published documents and may contain mistakes or be out of date, so correct anything that is wrong.'),
    ('b', 'Write one item per line, with columns separated by **|** or a tab, so you can paste a table straight from Excel or Word. A requirement can end with **| needs: K** to say it is met by evidence at that level or above.'),
    ('b', '**Export as file** saves your framework so someone else can **Import** it.'),
    ('h1', 'What it does'),
    ('b', '**Evidence**: lists every file in your evidence folder. You map each one to the requirements at a level (for ICE IEng: Knowledge, Experience or Ability), with the standards it covers and a note.'),
    ('b', '**Requirements and standards** (the tab names follow your framework): show what is covered and what is missing against your goal (you can change the number of items per level).'),
    ('b', '**Reports**: reads your Word reports and checks them: evidence listed but not written about, codes that do not exist, very short write-ups, evidence not yet mapped. It never changes your Word files.'),
    ('b', '**Feedback**: lists every comment and tracked change your mentor makes in your Word report, under the right requirement. You write your response, mark it done, and export a "Response to feedback" table.'),
    ('b', '**Meetings**: import a Teams transcript and tag each line as Done, To do or Teaching. To-dos become actions; it writes tidy meeting notes in Word.'),
    ('b', '**CPD**: a Development Action Plan and Personal Development Record in the layout of ICE’s CPD templates, with hours per year and Word exports.'),
    ('b', '**Mentor**: your mentor uses the same file to record an assessment per requirement and notes on your evidence, in their own folder.'),
    ('h1', 'Getting started (apprentice or candidate)'),
    ('n', '1. In OneDrive, make a folder such as **Portfolio - Your Name** and put **Pathway Pro.html** in it.'),
    ('n', '2. Right-click Pathway Pro.html → **Open with** → **Microsoft Edge**.'),
    ('n', '3. Click **Start my portfolio**, enter your name, choose your framework and pick that folder. Edge asks whether the page may view and save files there: allow it.'),
    ('n', '4. The tool makes the folders shown in "Suggested folder layout" above.'),
    ('n', '5. **There is no upload button.** Save each piece of evidence into the matching sub-folder of **2 - Evidence** in your OneDrive, then press **Refresh** on the Evidence page. Start file names with a code such as **CO-14**, or use **Number files…**, which suggests the code letters from the folder name (for example a folder ending in "- CA" gives CA codes).'),
    ('n', '6. Open each piece of evidence and press + Add for each requirement it shows, with its level. Say how it contributes.'),
    ('p', 'Next time, open the file again and press **Continue**: Edge asks once per session to use the folder again.'),
    ('h1', 'Writing your report so the checks work'),
    ('b', 'Start each requirement with a heading line made of its id, a dash, then any text, for example **2b – Contribute to the design and development of engineering solutions** (or **A1 – …**, or **3 – …**, whatever ids your framework uses).'),
    ('b', 'Under it, list the evidence on one line: **Evidence: CO-14, DD-00 to DD-05**.'),
    ('b', 'Before you write about a piece of evidence, put its code in curly brackets, for example **{CO-14}**, then write about it ("I checked the…"). The write-up runs until the next tag or heading.'),
    ('b', '**Reports → Start** (in Pathway Pro) or **New Word PRR from template** (Word) gives you these headings ready to fill in.'),
    ('h1', 'Working with your mentor'),
    ('p', 'Each person can only change their own folder. OneDrive enforces this, so neither of you can alter the other’s records, and nobody needs an extra login.'),
    ('n', '1. **Apprentice**: in OneDrive, share your portfolio folder with your mentor as **Can view**. Share the **0 - Reports** folder (or just the report files) as **Can edit** so they can comment in Word.'),
    ('n', '2. **Mentor**: in OneDrive, go to **Shared**, find the folder and choose **Add shortcut to My files** so it appears on your computer.'),
    ('n', '3. **Mentor**: make an empty folder of your own, e.g. **Mentoring - Apprentice Name**. Open Pathway Pro.html (the copy in the apprentice’s folder is fine), click **I am a mentor**, pick your own folder, then pick the apprentice’s folder to read it. The mentor sees the apprentice’s framework read-only.'),
    ('n', '4. **Mentor**: share your mentoring folder with the apprentice as **Can view**.'),
    ('n', '5. **Apprentice**: add the mentor’s folder to your OneDrive the same way, then in the tool go to **Settings → Link mentor’s folder**.'),
    ('p', 'Your mentor comments in your Word report as usual (Review → New Comment, or Track Changes). Their comments appear on the Feedback page; their assessment appears on the Mentor page.'),
    ('h1', 'Meetings'),
    ('n', '1. After a Teams meeting with transcription on, open the meeting chat → **Recap** → **Transcript** → **Download** (.vtt or .docx).'),
    ('n', '2. **Meetings → Import transcript…** and pick the file (or save it into the Meetings folder first: the tool offers to import it).'),
    ('n', '3. Tag lines with the buttons or keys: **D** done, **T** to do, **L** teaching, **X** clear, **J/K** to move. Add a requirement or due date to to-dos.'),
    ('n', '4. **Write notes to Word** saves the meeting notes in the Meetings folder.'),
    ('h1', 'CPD'),
    ('p', 'Following ICE’s CPD guidance: review your learning needs at least once a year (a SWOT works well), set objectives with reference codes (the Development plan), and record each activity with its effective learning time and what you learned (the Development record). Export makes Word and Excel files. There is also a "CPD record only" mode.'),
    ('h1', 'Look around first'),
    ('p', 'On the start screen, **Look around with sample data** opens the tool filled with made-up data: a sample apprentice with evidence, meetings, CPD and mentor comments. Use it to see how the pages fit together before you choose a folder. Nothing is saved or written anywhere, and a banner at the top of every page says so. Sample files cannot be opened, and adding files, exports and restoring backups are switched off. Press **Leave the sample** (or refresh the page) to go back to the start screen, or **Start my own portfolio** to begin for real.'),
    ('h1', 'Show me around (the built-in tour)'),
    ('p', 'You do not have to read this guide first. Press **Show me around** at the top of any page for a short tour that highlights each part of the tool and says what to do next. Every page also has a **Tour of this page** button. You can stop at any time and carry on later; the tour remembers where you were.'),
    ('p', 'A new portfolio shows only **Home**, **Evidence**, **CPD**, **Settings** and **Help**. The other pages (the requirements list, **Reports**, **Feedback**, **Meetings** and **Mentor**) appear as soon as you have something to put in them, and you can always reach them under **More**. To see every tab from the start, tick **Show every tab** in Settings.'),
    ('p', 'Home also shows a **Ready to submit?** checklist, and you can set a **key date** (for example your submission date) in Settings to see the days to go.'),
    ('h1', 'Adding evidence and undoing mistakes'),
    ('p', 'On the Evidence page press **Add files…** (or drag files from Explorer onto the page), choose the kind of evidence, and the tool copies the files into the right folder of your OneDrive, adding the next free code such as CO-15 to the file name if it has none. Your original files are not moved.'),
    ('p', 'Made a mistake? Press **Undo** at the top of the page (or **Ctrl+Z** when you are not typing in a box) to step back through your recent changes, and **Redo** (Ctrl+Y) to go forward again. Undo covers the last 25 changes made in this session. For anything older, use Settings → Restore from a backup.'),
    ('h1', 'Good to know'),
    ('b', 'It saves as you type. One copy of your data is kept per day in **ice-data/backups** (the last 30). Do not edit the files in ice-data by hand.'),
    ('b', 'If the data file was changed on another computer while the tool was open, it asks which copy to keep. If OneDrive makes a copy named like "portfolio-LAPTOP.json", the tool tells you.'),
    ('b', 'Press **Ctrl+K** to search everything. Click a code or file name to preview it beside the page (PDFs, pictures, Word files and text).'),
    ('b', 'Exports go to **1 - Evidence Matrix** (the Excel matrix), **4 - Feedback, Compliance and Status** (response tables), **Exports** (CPD records) and **Meetings** (meeting notes).'),
    ('b', 'Changing the framework later creates any new folders but never renames or moves your existing ones. Mappings to a requirement or level you delete are kept but no longer counted.'),
    ('b', 'It only works in Edge or Chrome on a computer: other browsers cannot use a folder on your computer.'),
    ('b', 'This is an independent tool: it is not made or endorsed by ICE, IStructE, the Engineering Council or any other institution.'),
    ('h1', 'If something goes wrong'),
    ('b', '**"Please open this in Microsoft Edge or Google Chrome"**: right-click the file → Open with → Microsoft Edge.'),
    ('b', '**The page asks for permission every time**: that is normal for Edge; press Continue.'),
    ('b', '**A file shows "file missing"**: it was moved or renamed. Open it and choose the new location, so its mappings follow it.'),
    ('b', '**A built-in list has a mistake or is out of date**: correct it in Settings → Framework.'),
    ('b', '**Restore an earlier copy of your data**: Settings → **Restore from a backup…**, then pick the day. Your current data is kept first, so you can undo the restore.'),
]


def build(out_path):
    body = []
    for kind, text in GUIDE:
        if kind == 'title':
            body.append(para(text, 'Title'))
        elif kind == 'h1':
            body.append(para(text, 'Heading1'))
        elif kind == 'h2':
            body.append(para(text, 'Heading2'))
        elif kind == 'see':
            body.append(para("**What you’ll see:** " + text))
        elif kind in ('t0', 't1', 't2', 't3'):
            depth = int(kind[1])
            body.append(f'<w:p><w:pPr><w:ind w:left="{200 + 450 * depth}"/></w:pPr>{runs(("▸ " if depth else "") + text)}</w:p>')
        elif kind == 'b':
            body.append(para('•  ' + text, indent=True))
        elif kind == 'n':
            body.append(para(text, indent=True))
        else:
            body.append(para(text))
    styles = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles {W}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:lang w:val="en-GB"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>'
              '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>'
              '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:spacing w:after="200"/></w:pPr><w:rPr><w:sz w:val="44"/><w:color w:val="1F3864"/></w:rPr></w:style>'
              '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:keepNext/><w:spacing w:before="300" w:after="100"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1F3864"/></w:rPr></w:style>'
              '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="60"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="1F3864"/></w:rPr></w:style></w:styles>')
    with zipfile.ZipFile(out_path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>')
        z.writestr('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
        z.writestr('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
        z.writestr('word/styles.xml', styles)
        z.writestr('word/document.xml', f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document {W}><w:body>{"".join(body)}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>')


if __name__ == '__main__':
    out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else pathlib.Path(__file__).parent / 'dist' / 'How to use Pathway Pro.docx')
    build(out)
    print(out)
