"""Write "How to use ICE Tool.docx": the guide that travels with the tool, for any apprentice or mentor."""
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
    ('title', 'ICE Tool: how to use it'),
    ('p', 'A tracker for the ICE Professional Review (IEng apprenticeship) and for CPD. It is one file, **ICE Tool.html**, that runs in Microsoft Edge or Google Chrome. There is nothing to install, it needs no internet and no AI, and your files stay in your own OneDrive folder.'),
    ('h1', 'What it does'),
    ('b', '**Evidence**: lists every file in your Evidence folder. You map each one to the ICE sub-attributes at a level: Knowledge, Experience or Ability, with the KSBs it covers and a note.'),
    ('b', '**Attributes and KSBs**: shows what is covered and what is missing. The goal is 3 pieces of evidence at each level for every sub-attribute (you can change the number).'),
    ('b', '**Reports**: reads your Word PRRs and checks them: evidence listed but not written about, codes that do not exist, very short write-ups, evidence not yet mapped. It never changes your Word files.'),
    ('b', '**Feedback**: lists every comment and tracked change your mentor makes in your Word PRR, under the right sub-attribute. You write your response, mark it done, and export a "Response to feedback" table.'),
    ('b', '**Meetings**: import a Teams transcript and tag each line as Done, To do or Teaching. To-dos become actions; it writes tidy meeting notes in Word.'),
    ('b', '**CPD**: ICE’s Development Action Plan and Personal Development Record, with hours per year, and Word exports in the layout of ICE’s CPD templates.'),
    ('b', '**Mentor**: your mentor uses the same file to record an assessment per sub-attribute and notes on your evidence, in their own folder.'),
    ('h1', 'Getting started (apprentice)'),
    ('n', '1. In OneDrive, make a folder such as **ICE Portfolio - Your Name** and put **ICE Tool.html** in it.'),
    ('n', '2. Right-click ICE Tool.html → **Open with** → **Microsoft Edge**.'),
    ('n', '3. Click **Start my portfolio** and pick that folder. Edge asks whether the page may view and save files there: allow it. The tool makes the folders Evidence, PRR, Meetings, CPD, Exports and ice-data.'),
    ('n', '4. Save your evidence into **Evidence** (sub-folders are fine). Start file names with a code such as **CO-14** so they are picked up, or use **Number files…** on the Evidence page.'),
    ('n', '5. Open each piece of evidence and click **K**, **E** or **A** against each sub-attribute it shows.'),
    ('p', 'Next time, open the file again and press **Continue**: Edge asks once per session to use the folder again.'),
    ('h1', 'Writing your PRR so the checks work'),
    ('b', 'Start each sub-attribute with a heading line such as **2b – Contribute to the design and development of engineering solutions** (number, letter, dash, then any text).'),
    ('b', 'Under it, list the evidence on one line: **Evidence: CO-14, DD-00 to DD-05**.'),
    ('b', 'Before you write about a piece of evidence, put its code in curly brackets: **{CO-14}** I checked the… The write-up runs until the next tag or heading.'),
    ('b', '**Reports → New PRR from template** makes a Word file with these headings ready to fill in.'),
    ('h1', 'Working with your mentor'),
    ('p', 'Each person can only change their own folder. OneDrive enforces this, so neither of you can alter the other’s records, and nobody needs an extra login.'),
    ('n', '1. **Apprentice**: in OneDrive, share your portfolio folder with your mentor as **Can view**. Share the **PRR** folder (or the PRR files) as **Can edit** so they can comment in Word.'),
    ('n', '2. **Mentor**: in OneDrive, go to **Shared**, find the folder and choose **Add shortcut to My files** so it appears on your computer.'),
    ('n', '3. **Mentor**: make an empty folder of your own, e.g. **ICE Mentoring - Apprentice Name**. Open ICE Tool.html (the copy in the apprentice’s folder is fine), click **I am a mentor**, pick your own folder, then pick the apprentice’s folder.'),
    ('n', '4. **Mentor**: share your mentoring folder with the apprentice as **Can view**.'),
    ('n', '5. **Apprentice**: add the mentor’s folder to your OneDrive the same way, then in the tool go to **Settings → Link mentor’s folder**.'),
    ('p', 'Your mentor comments in your Word PRR as usual (Review → New Comment, or Track Changes). Their comments appear on the Feedback page; their assessment appears on the Mentor page.'),
    ('h1', 'Meetings'),
    ('n', '1. After a Teams meeting with transcription on, open the meeting chat → **Recap** → **Transcript** → **Download** (.vtt or .docx).'),
    ('n', '2. **Meetings → Import transcript…** and pick the file (or save it into the Meetings folder first: the tool offers to import it).'),
    ('n', '3. Tag lines with the buttons or keys: **D** done, **T** to do, **L** teaching, **X** clear, **J/K** to move. Add a sub-attribute or due date to to-dos.'),
    ('n', '4. **Write notes to Word** saves the meeting notes in the Meetings folder.'),
    ('h1', 'CPD'),
    ('p', 'Following ICE’s CPD guidance: review your learning needs at least once a year (a SWOT works well), set objectives with reference codes (the Development plan), and record each activity with its effective learning time, the objective it supports and what you learned (the Development record). ICE asks for at least 30 hours a year up to the Professional Review, no more than 6 hours for a day and 30 for one activity. **CPD → Export** makes Word files in the layout of ICE’s Appendix A and B templates. If you only want CPD, choose **CPD record only** when you start.'),
    ('h1', 'Good to know'),
    ('b', 'It saves as you type. One copy of your data is kept per day in **ice-data/backups** (the last 30). Do not edit the files in ice-data by hand.'),
    ('b', 'If the data file was changed on another computer while the tool was open, it asks which copy to keep. If OneDrive makes a copy named like "portfolio-LAPTOP.json", the tool tells you.'),
    ('b', 'Press **Ctrl+K** to search everything. Click a code or file name to preview it beside the page (PDFs, pictures, Word files and text).'),
    ('b', 'Exports (Excel matrix, response tables, meeting notes, CPD records) go into the Exports or Meetings folder.'),
    ('b', 'It only works in Edge or Chrome on a computer: other browsers cannot use a folder on your computer.'),
    ('h1', 'If something goes wrong'),
    ('b', '**"Please open this in Microsoft Edge or Google Chrome"**: right-click the file → Open with → Microsoft Edge.'),
    ('b', '**The page asks for permission every time**: that is normal for Edge; press Continue.'),
    ('b', '**A file shows "file missing"**: it was moved or renamed. Open it and choose the new location, so its mappings follow it.'),
    ('b', '**Restore yesterday’s data**: close the tool, copy the backup from ice-data/backups over ice-data/portfolio.json (keep the name portfolio.json), and open the tool again.'),
]


def build(out_path):
    body = []
    for kind, text in GUIDE:
        if kind == 'title':
            body.append(para(text, 'Title'))
        elif kind == 'h1':
            body.append(para(text, 'Heading1'))
        elif kind == 'b':
            body.append(para('•  ' + text, indent=True))
        elif kind == 'n':
            body.append(para(text, indent=True))
        else:
            body.append(para(text))
    styles = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles {W}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:lang w:val="en-GB"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>'
              '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>'
              '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:spacing w:after="200"/></w:pPr><w:rPr><w:sz w:val="44"/><w:color w:val="1F3864"/></w:rPr></w:style>'
              '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:keepNext/><w:spacing w:before="300" w:after="100"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1F3864"/></w:rPr></w:style></w:styles>')
    with zipfile.ZipFile(out_path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>')
        z.writestr('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
        z.writestr('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
        z.writestr('word/styles.xml', styles)
        z.writestr('word/document.xml', f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document {W}><w:body>{"".join(body)}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>')


if __name__ == '__main__':
    out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else pathlib.Path(__file__).parent / 'dist' / 'How to use ICE Tool.docx')
    build(out)
    print(out)
