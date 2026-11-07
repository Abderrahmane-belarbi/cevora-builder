// Exercise the actual typed model without adding a separate test runtime.
const ts = require("typescript");
const fs = require("node:fs");
const assert = require("node:assert/strict");
require.extensions[".ts"] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  module._compile(output, filename);
};
const { parseResume, legacyResumeSchema } = require("../src/resume/model.ts");
const { sampleResume } = require("../src/resume/sample.ts");
const { createSection, itemParts, newItem } = require("../src/resume/sections.ts");
const { sectionPlan } = require("../src/resume/presentation.ts");

const sample = sampleResume();
assert.equal(sample.schemaVersion, 2);
assert.equal(sample.sections.length, 4);
assert.deepEqual(parseResume(JSON.stringify(sample)), sample);

const legacy = {
  schemaVersion: 1, title: "Legacy résumé", personal: sample.personal, design: sample.design,
  summary: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Original summary", marks: [{ type: "bold" }, { type: "italic" }] }] }] },
  experience: [{ id: "keep-id", role: "Engineer", company: "Fictional Studio", location: "Remote", start: "2020", end: "Present", description: { type: "doc", content: [{ type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Original bullet" }] }] }] }] } }],
  education: [{ id: "keep-degree", degree: "BSc", school: "Fictional University", location: "", start: "2016", end: "2020" }],
  skills: ["TypeScript", "Research"], visibility: { summary: true, experience: true, education: false, skills: true },
};
legacyResumeSchema.parse(legacy);
const migrated = parseResume(JSON.stringify(legacy));
assert.deepEqual(migrated.sections[0].items[0].values.text, legacy.summary);
assert.equal(migrated.sections[1].items[0].id, "keep-id");
assert.deepEqual(migrated.sections[1].items[0].values.description, legacy.experience[0].description);
assert.equal(migrated.sections[2].hidden, true);
assert.deepEqual(migrated.sections[3].items[0].values.tags, legacy.skills);
assert.deepEqual(parseResume(JSON.stringify(migrated)), migrated);

const custom = createSection("blank", "Research & community work");
custom.fields = [
  { id: "subject", type: "title", label: "Whatever I want", showLabel: false },
  { id: "details", type: "richText", label: "Impact", showLabel: true },
  { id: "url", type: "link", label: "Publication", showLabel: false },
  { id: "topics", type: "tags", label: "Topics", showLabel: false },
];
custom.items = [newItem(custom.fields)];
custom.items[0].values.subject = "A custom accomplishment";
custom.items[0].values.details = legacy.summary;
custom.items[0].values.url = "https://example.com/research";
custom.items[0].values.topics = ["Community", "Design"];
const document = { ...sample, sections: [...sample.sections, custom] };
assert.deepEqual(parseResume(JSON.stringify(document)), document);
const renamed = { ...custom, name: "A completely different heading", column: 1 };
assert.equal(sectionPlan("split", [renamed]).side[0].id, custom.id);
assert.equal(sectionPlan("single", [renamed]).main[0].id, custom.id);
assert.equal(itemParts(custom, custom.items[0]).title, "A custom accomplishment");
assert.throws(() => parseResume(JSON.stringify({ ...document, sections: [...document.sections, custom] })), /Duplicate section IDs/);
const invalid = JSON.parse(JSON.stringify(document));
invalid.sections.at(-1).items[0].values.topics = "wrong type";
assert.throws(() => parseResume(JSON.stringify(invalid)), /field.*type/);
const dangling = JSON.parse(JSON.stringify(document));
dangling.sections.at(-1).items[0].values.unknown = "dangling value";
assert.throws(() => parseResume(JSON.stringify(dangling)), /Unknown field ID/);
assert.throws(() => parseResume("{broken"), /valid JSON/);

const input = JSON.parse(fs.readFileSync(require.resolve("../tests/section-example.json"), "utf8"));
const imported = parseResume(JSON.stringify(input));
assert.equal(imported.sections.length, Object.keys(input.sections).length);
for (const source of Object.values(input.sections)) {
  const section = imported.sections.find((section) => section.name === source.name);
  assert(section, source.name);
  assert.equal(section.items.length, source.items.length);
  assert.equal(section.column, source.column);
  assert(section.fields.length > 0, source.name + " must preserve its item fields");
  assert(Object.keys(section.items[0].values).length > 0, source.name + " must preserve its item values");
}
const importedSummary = imported.sections.find((section) => section.name === "Professional Summary");
assert.equal(importedSummary.kind, "prose");
assert(importedSummary.items[0].values["field-0"].content[0].content[0].text.includes("8+ years"));
assert(JSON.stringify(imported).includes("Improved system performance by 60%"));
assert(JSON.stringify(imported).includes("AWS Solutions Architect"));
assert.deepEqual(parseResume(JSON.stringify(imported)), imported);
const mixed = { title: "Mixed fields", header: { name: "Test" }, sections: { any: { name: "Flexible", column: 0, order: 0, items: [{ title: "One", dateRange: { fromYear: 2020 } }, { title: "Two" }] } } };
assert.equal(parseResume(JSON.stringify(mixed)).sections[0].items.length, 2);
console.log("PASS: v1 migration, v2 backups, arbitrary sections/fields, column placement, validation, and example import.");

const { changeField, dropItem, dropSection, insertItem, moveItem, toggleItemField } = require("../src/resume/operations.ts");
const { filledItems } = require("../src/resume/sections.ts");
const { chartSlices, donutArc } = require("../src/resume/visual-fields.ts");
const section = sample.sections[1];
const originalEntry = section.items[0];
const duplicated = insertItem(sample, section.id, originalEntry.id, true);
assert.notEqual(duplicated.itemId, originalEntry.id);
assert.deepEqual(duplicated.resume.sections[1].items[1].values, originalEntry.values);
assert.equal(sample.sections[1].items.length, 2);
const moved = moveItem(duplicated.resume, section.id, duplicated.itemId, 1);
assert.equal(moved.sections[1].items[2].id, duplicated.itemId);
const dropped = dropItem(moved, section.id, duplicated.itemId, originalEntry.id);
assert.equal(dropped.sections[1].items[0].id, duplicated.itemId);
const movedSection = dropSection(sample, section.id, 1, sample.sections[3].id, true);
assert.equal(movedSection.sections.at(-1).id, section.id);
assert.equal(movedSection.sections.at(-1).column, 1);
assert.equal(new Set(movedSection.sections.map((section) => section.id)).size, sample.sections.length);
const hidden = toggleItemField(sample, section.id, originalEntry.id, "role");
assert.equal(itemParts(hidden.sections[1], hidden.sections[1].items[0]).title, "");
assert.equal(hidden.sections[1].items[0].values.role, originalEntry.values.role);
const restoredField = toggleItemField(hidden, section.id, originalEntry.id, "role");
assert.equal(itemParts(restoredField.sections[1], restoredField.sections[1].items[0]).title, originalEntry.values.role);
const proficiency = createSection("languages", "Languages");
proficiency.items[0].values[proficiency.fields.find((field) => field.type === "rating").id] = { type: "rating", value: 4, max: 5, style: "dots" };
const time = createSection("my-time", "Time allocation");
const chart = { type: "chart", segments: [{ id: "work", label: "Work", value: 8 }, { id: "rest", label: "Rest", value: 8 }] };
time.items[0].values[time.fields[0].id] = chart;
assert.equal(chartSlices(chart, "#0e7066")[0].percent, 50);
assert(!donutArc(0, 1).includes("NaN"));
assert.equal(chartSlices({ type: "chart", segments: [] }, "#0e7066").length, 0);
assert.deepEqual(parseResume(JSON.stringify({ ...sample, sections: [proficiency, time] })).sections, [proficiency, time]);
const invalidRating = JSON.parse(JSON.stringify(proficiency));
invalidRating.items[0].values[proficiency.fields.find((field) => field.type === "rating").id].value = 9;
assert.throws(() => parseResume(JSON.stringify({ ...sample, sections: [invalidRating] })));
assert.equal(filledItems({ ...section, fields: section.fields.map((field) => ({ ...field, hidden: true })) }).length, 0);
console.log("PASS: insert, duplicate, move, drag reordering, non-destructive visibility, rating validation, and chart geometry.");

const { fonts, templates, compatibleFont } = require("../src/resume/presentation.ts");
const { translate } = require("../src/resume/translations.ts");
const arabicSample = sampleResume("ar");
assert.equal(arabicSample.design.language, "ar");
assert.equal(arabicSample.personal.name, "سارة أحمد");
assert.deepEqual(parseResume(JSON.stringify(arabicSample)), arabicSample);
const oldNative = JSON.parse(JSON.stringify(sample));
delete oldNative.design.language;
assert.equal(parseResume(JSON.stringify(oldNative)).design.language, "en");
const arabicSection = createSection("experience", "مشاريعي الخاصة", "ar");
assert.equal(arabicSection.name, "مشاريعي الخاصة");
assert.equal(arabicSection.fields[0].label, "المسمى الوظيفي");
assert.equal(translate("Custom user text", "ar"), "Custom user text");
assert.equal(compatibleFont("sans", "ar"), "noto-arabic");
assert.equal(compatibleFont("source-serif", "ar"), "naskh");
assert.equal(compatibleFont("amiri", "en"), "amiri");
assert.equal(templates.length, 21);
assert.equal(Object.keys(fonts).length, 10);
assert.equal(Object.values(fonts).filter((font) => font.arabic).length, 4);
for (const template of templates) {
  for (const language of ["en", "ar"]) {
    const doc = { ...sample, design: { ...sample.design, template: template.id, language, font: compatibleFont(template.defaultFont, language) } };
    assert.deepEqual(parseResume(JSON.stringify(doc)), doc);
  }
}
console.log("PASS: Arabic starter data, language defaults, custom-name preservation, 21 bilingual templates and 10 fonts.");

(async () => {
  const storage = new Map();
  global.window = { localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) } };
  const { useResume } = require("../src/resume/store.ts");
  await useResume.getState().initialize();
  await new Promise((resolve) => setImmediate(resolve));
  useResume.getState().edit((doc) => ({ ...doc, title: "First edit" }), "title");
  useResume.getState().edit((doc) => ({ ...doc, title: "Second edit" }), "title");
  assert.equal(useResume.getState().past.length, 1);
  useResume.getState().undo();
  assert.equal(useResume.getState().resume.title, sample.title);
  useResume.getState().redo();
  assert.equal(useResume.getState().resume.title, "Second edit");
  useResume.getState().edit((doc) => changeField(doc, section.id, originalEntry.id, "role", "New role"));
  useResume.getState().undo();
  assert.equal(useResume.getState().resume.sections[1].items[0].values.role, originalEntry.values.role);
  useResume.getState().flush();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(JSON.parse(storage.get("cevora.resume.v1")).schemaVersion, 2);
  console.log("PASS: grouped undo/redo, immutable entry history, and local saving after history changes.");
})().catch((error) => { console.error(error); process.exitCode = 1; });

