"""Fetch OFL fonts from Google Fonts and freeze variable files for PDF embedding.

Development helper: requires fonttools. Output assets are checked in; no runtime download.
Use: python -m pip install fonttools; python scripts/prepare-fonts.py
"""
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import quote
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tmp/font-tools'))
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

root = Path(__file__).resolve().parents[1] / 'public/fonts'
root.mkdir(parents=True, exist_ok=True)
families = {
    'lato': ('lato', 'Lato', False),
    'open-sans': ('opensans', 'OpenSans[wdth,wght]', True),
    'source-serif': ('sourceserif4', 'SourceSerif4[opsz,wght]', True),
    'noto-arabic': ('notosansarabic', 'NotoSansArabic[wdth,wght]', True),
    'naskh': ('notonaskharabic', 'NotoNaskhArabic[wght]', True),
    'cairo': ('cairo', 'Cairo[slnt,wght]', True),
    'amiri': ('amiri', 'Amiri', False),
}
base = 'https://raw.githubusercontent.com/google/fonts/main/ofl/'
def fetch(folder, filename):
    with urlopen(base + folder + '/' + quote(filename), timeout=60) as response:
        return response.read()

def build(item):
    name, (folder, source, variable) = item
    (root / (name + '-OFL.txt')).write_bytes(fetch(folder, 'OFL.txt'))
    variants = [('Regular', 400, False), ('Bold', 700, False)]
    if name in ('lato', 'amiri', 'open-sans', 'source-serif'):
        variants += [('Italic', 400, True), ('BoldItalic', 700, True)]
    cache = {}
    for variant, weight, italic in variants:
        if variable:
            filename = source.replace('[', '-Italic[', 1) + '.ttf' if italic else source + '.ttf'
        else:
            filename = source + '-' + variant + '.ttf'
        if filename not in cache:
            cache[filename] = fetch(folder, filename)
        font = TTFont(BytesIO(cache[filename]))
        if variable:
            axes = {axis.axisTag: axis.defaultValue for axis in font['fvar'].axes}
            axes['wght'] = weight
            font = instantiateVariableFont(font, axes, inplace=True)
        font.save(root / (name + '-' + variant + '.ttf'))
    print('Prepared ' + name, flush=True)

with ThreadPoolExecutor(max_workers=4) as pool:
    list(pool.map(build, families.items()))
