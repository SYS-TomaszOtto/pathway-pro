"""Build the single-file Pathway Pro: src/*.js + style.css + reference data -> dist/Pathway Pro.html.
python3 build.py [--test]  (--test also writes dist/Pathway Pro.test.html with the test harness)"""
import datetime, json, pathlib, sys

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
page = page.replace('__CSS__', (src / 'style.css').read_text()).replace('__VERSION__', version)
out = root / 'dist'
out.mkdir(exist_ok=True)
main = page.replace('__JS__', '\n'.join(js))
(out / 'Pathway Pro.html').write_text(main.replace('__TEST__', ''))
print('dist/Pathway Pro.html', len(main) // 1024, 'KB')
if '--test' in sys.argv:
    harness = (root / 'test' / 'harness.js').read_text()
    (out / 'Pathway Pro.test.html').write_text(main.replace('__TEST__', f'<script>\n{harness}\n</script>'))
    print('dist/Pathway Pro.test.html')
