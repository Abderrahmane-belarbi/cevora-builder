// Temporary fixes for textkit 7.0.1's decomposed Arabic glyph boundaries and mark offsets.
// Upstream reports: https://github.com/diegomura/react-pdf/issues/3555 and /issues/3576
// Keep this patch narrow and fail visibly if a dependency update changes the affected code.
const fs = require('node:fs');
const file = require.resolve('@react-pdf/textkit');
let source = fs.readFileSync(file, 'utf8');
const marker = '// cevora: preserve complete glyph groups at a slice start.';
if (!source.includes(marker)) {
  const boundary = 'const startIndex = glyphIndexAt(start, run);';
  if (!source.includes(boundary)) throw new Error('PDF textkit changed; review the Arabic glyph boundary fix.');
  source = source.replace(boundary, `${marker}
    let startIndex = glyphIndexAt(start, run);
    while (startIndex > 0 && run.glyphIndices?.[startIndex - 1] === run.glyphIndices?.[startIndex]) startIndex -= 1;`);
}
const offsetMarker = '// cevora: retain GPOS mark placement in renderer per-mille units.';
if (!source.includes(offsetMarker)) {
  const offsets = 'run.positions[i].yOffset = yOffset;';
  if (!source.includes(offsets)) throw new Error('PDF textkit changed; review the Arabic mark positioning fix.');
  source = source.replace(offsets, `${offsetMarker}
    const factor = run.attributes?.fontSize ? 1000 / run.attributes.fontSize : 0;
    run.positions[i].xOffset = (run.positions[i].xOffset || 0) * factor;
    run.positions[i].yOffset = yOffset + (run.positions[i].yOffset || 0) * factor;`);
}
fs.writeFileSync(file, source);
// Fontkit shapes with forced LTR, so reversing RTL glyphs must also move a
// zero-advance mark from after its base to before it (fontkit's native RTL rule).
const reverseMarker = '// cevora: re-anchor RTL zero-advance marks to their base glyph.';
if (!source.includes(reverseMarker)) {
  const reversed = 'const positions = [...(run.positions || [])].reverse();';
  if (!source.includes(reversed)) throw new Error('PDF textkit changed; review RTL mark re-anchoring.');
  source = source.replace(reversed, `${reverseMarker}
    const positions = (run.positions || []).map((position, index, all) => {
      if (position.xAdvance !== 0) return { ...position };
      let base = index - 1;
      while (base >= 0 && all[base].xAdvance === 0) base -= 1;
      const advance = base >= 0 ? all[base].xAdvance : 0;
      return { ...position, xOffset: position.xOffset + advance * (1000 / run.attributes.fontSize) };
    }).reverse();`);
  fs.writeFileSync(file, source);
}
// Preserve logical source text for PDF copy/search independently of shaped glyph IDs.
const actualMarker = '// cevora: preserve logical text before visual bidi reordering.';
if (!source.includes(actualMarker)) {
  const returned = 'return { ...line, runs, string };';
  if (!source.includes(returned)) throw new Error('PDF textkit changed; review the logical text mapping.');
  source = source.replace(returned, `${actualMarker}
    const actualText = Array.from(line.string).map((char, index) => {
      const owner = line.runs.find((run) => index >= run.start && index < run.end);
      return owner?.attributes.bidiLevel % 2 === 1 ? (bidi$1.getMirroredCharacter(char) || char) : char;
    }).join('');
    return { ...line, runs, string, actualText };`);
  fs.writeFileSync(file, source);
}
const renderFile = require.resolve('@react-pdf/render');
let renderSource = fs.readFileSync(renderFile, 'utf8');
const renderMarker = '// cevora: tagged logical text for RTL copy and search.';
if (!renderSource.includes(renderMarker)) {
  const start = 'ctx.translate(line.box.x, line.box.y + lineAscent);';
  const end = 'renderRun(ctx, run);\n    }\n    ctx.restore();';
  if (!renderSource.includes(start) || !renderSource.includes(end)) throw new Error('PDF renderer changed; review RTL ActualText tagging.');
  renderSource = renderSource.replace(start, `${start}
    ${renderMarker}
    if (line.actualText) ctx.markContent('Span', { actual: line.actualText });`);
  renderSource = renderSource.replace(end, 'renderRun(ctx, run);\n    }\n    if (line.actualText) ctx.endMarkedContent();\n    ctx.restore();');
  fs.writeFileSync(renderFile, renderSource);
}
console.log('Applied Arabic PDF glyph, mark and logical-text fixes.');
