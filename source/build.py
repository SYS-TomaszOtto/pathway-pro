"""Build the single-file Pathway Pro: src/*.js + style.css + reference data -> dist/Pathway Pro.html.
python3 build.py [--test]  (--test also writes dist/Pathway Pro.test.html with the test harness)"""
import datetime, json, pathlib, re, sys

root = pathlib.Path(__file__).parent
src = root / 'src'
ref = json.loads((src / 'reference.json').read_text())
ref = {
    'attributes': [{k: a[k] for k in ('id', 'group', 'group_title', 'text')} for a in ref['attributes']],
    'ksbs': [{k: x[k] for k in ('id', 'kind', 'text', 'attributes')} for x in ref['ksbs']],
}
version = datetime.date.today().isoformat()
IPD = json.loads((src / 'ipd.json').read_text())
INST = json.loads((src / 'institutions.json').read_text())
UKSPEC = json.loads((src / 'ukspec.json').read_text())
js = [f'const INST_DATA = {json.dumps(INST, ensure_ascii=False, separators=(",", ":"))};\n',
      f'const UKSPEC_DATA = {json.dumps(UKSPEC, ensure_ascii=False, separators=(",", ":"))};\n',
      f'const IPD_DATA = {json.dumps(IPD, ensure_ascii=False, separators=(",", ":"))};\n',
      f'const TOOL_VERSION = {json.dumps(version)};\n',
      f'// ICE IEng sub-attributes and apprenticeship KSBs, from "IEng Attributes and KSB List.xlsx".\nconst REF = {json.dumps(ref, ensure_ascii=False, separators=(",", ":"))};\n']
js += [p.read_text() for p in sorted(src.glob('*.js'))]
page = (src / 'index.html').read_text()
CSS_FILES = ['style.css', 'paper.css', 'clear.css', 'neon.css', 'journal.css', 'tour.css', 'selfrate.css', 'demo.css']
css = ''.join((src / f).read_text() for f in CSS_FILES if (src / f).exists())
# Embedded font for the Clear style (SIL OFL 1.1; the licence travels with it as a comment). Browsers only decode it when Clear is in use.
import base64
fonts = src / 'fonts'
lic = (fonts / 'OFL-AtkinsonHyperlegibleNext.txt').read_text().replace('*/', '* /')
css = f'/*\n{lic}\n*/\n' + ''.join(
    f'@font-face {{ font-family: "Atkinson Hyperlegible Next"; font-style: normal; font-weight: {w}; font-display: swap; '
    f'src: url(data:font/woff2;base64,{base64.b64encode((fonts / f"atkinson-hyperlegible-next-latin-{w}.woff2").read_bytes()).decode()}) format("woff2"); }}\n'
    for w in (400, 700)) + css
look = (src / 'head' / 'look-boot.js').read_text()
page = page.replace('__LOOK__', look).replace('__CSS__', css).replace('__VERSION__', version)
out = root / 'dist'
out.mkdir(exist_ok=True)
main = page.replace('__JS__', '\n'.join(js))
(out / 'Pathway Pro.html').write_text(main.replace('__TEST__', ''))
size = len(main.replace('__TEST__', '').encode())
print('dist/Pathway Pro.html', size // 1000, 'KB')
BUDGET = 580_000   # New Look plan hard limit with an embedded font (Atkinson Hyperlegible Next for Clear); 500 KB without
if '--test' in sys.argv:
    harness = (root / 'test' / 'harness.js').read_text()
    (out / 'Pathway Pro.test.html').write_text(main.replace('__TEST__', f'<script>\n{harness}\n</script>'))
    print('dist/Pathway Pro.test.html')
    problems = []
    if size > BUDGET: problems.append(f'file is {size} bytes, over the {BUDGET} budget')
    if not (0 <= main.find('window.lookBoot') < main.find('<style>')): problems.append('the look script is not before the first <style>')
    # Colours only inside the :root token blocks
    for f in CSS_FILES:
        if not (src / f).exists(): continue
        rest = re.sub(r'[^{}]*:root[^{}]*\{[^{}]*\}', '', (src / f).read_text())
        rest = re.sub(r'/\*.*?\*/', '', rest, flags=re.S)
        for m in re.finditer(r'#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(', rest):
            problems.append(f'{f}: colour outside the token blocks: ' + rest[max(0, m.start() - 50):m.end() + 12].replace(chr(10), ' '))
    if problems:
        print('BUILD CHECKS FAILED:\n  ' + '\n  '.join(problems)); sys.exit(1)
    print('build checks passed (size, look script first, no stray colours)')
