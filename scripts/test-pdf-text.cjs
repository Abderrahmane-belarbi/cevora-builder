const assert = require('node:assert/strict');
const fs = require('node:fs');
const { openSync } = require('fontkit');

(async () => {
  const textkit = await import('@react-pdf/textkit');
  const layout = textkit.default(textkit);
  for (const family of ['noto-arabic', 'naskh', 'cairo', 'amiri']) {
    const font = openSync('public/fonts/' + family + '-Regular.ttf');
    for (const text of ['نبي', 'بابا', 'في', 'سارة أحمد', 'مصممة منتجات', 'التعليم', 'السِّيرة الذاتية', 'مُصمِّم']) {
      const native = font.layout(text, undefined, undefined, undefined, 'rtl');
      const output = layout(textkit.fromFragments([{ string: text, attributes: { font: [font], fontSize: 24, direction: 'rtl' } }]), { x: 0, y: 0, width: 500, height: 200 }, { hyphenationCallback: word => [word] });
      const runs = output.flat().flatMap(line => line.runs);
      const glyphs = runs.flatMap(run => run.glyphs);
      assert.deepEqual(glyphs.map(g => g.id), native.glyphs.map(g => g.id), family + ': keep every shaped glyph in ' + text);
      const positions = runs.flatMap(run => run.positions);
      const units = 1000 / font.unitsPerEm;
      for (let i = 0; i < positions.length; i++) {
        assert(Math.abs(positions[i].xOffset - native.positions[i].xOffset * units) < 0.01, family + ': preserve horizontal mark position in ' + text);
        assert(Math.abs(positions[i].yOffset - native.positions[i].yOffset * units) < 0.01, family + ': preserve vertical mark position in ' + text);
      }
    }
    assert(font.hasGlyphForCodePoint('A'.codePointAt(0)), family + ' supports mixed Latin text');
  }
  const patch = fs.readFileSync(require.resolve('@react-pdf/textkit'), 'utf8');
  assert(patch.includes('cevora: preserve complete glyph groups'));
  console.log('PASS: 32 Arabic shaping cases, including vowel marks, match native RTL glyphs and positions across all four Arabic fonts.');
})().catch(error => { console.error(error); process.exitCode = 1; });
