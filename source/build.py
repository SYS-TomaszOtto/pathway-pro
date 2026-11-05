"""Build the single-file ICE Tool: src/*.js + style.css + reference data -> dist/ICE Tool.html.
python3 build.py [--test]  (--test also writes dist/ICE Tool.test.html with the test harness)"""
import datetime, json, pathlib, sys

root = pathlib.Path(__file__).parent
src = root / 'src'
ref = json.loads((src / 'reference.json').read_text())
ref = {
    'attributes': [{k: a[k] for k in ('id', 'group', 'group_title', 'text')} for a in ref['attributes']],
    'ksbs': [{k: x[k] for k in ('id', 'kind', 'text', 'attributes')} for x in ref['ksbs']],
}
version = datetime.date.today().isoformat()
js = [f'const TOOL_VERSION = {json.dumps(version)};\n',
      f'// ICE IEng sub-attributes and apprenticeship KSBs, from "IEng Attributes and KSB List.xlsx".\nconst REF = {json.dumps(ref, ensure_ascii=False, separators=(",", ":"))};\n']
js += [p.read_text() for p in sorted(src.glob('*.js'))]
page = (src / 'index.html').read_text()
page = page.replace('__CSS__', (src / 'style.css').read_text()).replace('__VERSION__', version)
out = root / 'dist'
out.mkdir(exist_ok=True)
main = page.replace('__JS__', '\n'.join(js))
(out / 'ICE Tool.html').write_text(main.replace('__TEST__', ''))
print('dist/ICE Tool.html', len(main) // 1024, 'KB')
if '--test' in sys.argv:
    harness = (root / 'test' / 'harness.js').read_text()
    (out / 'ICE Tool.test.html').write_text(main.replace('__TEST__', f'<script>\n{harness}\n</script>'))
    print('dist/ICE Tool.test.html')
