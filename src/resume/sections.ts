import type { FieldValue, ResumeSection, RichText, SectionField, SectionItem } from "./model";
import { hasRichText } from "./rich-text";
import { translate, type Language } from "./translations";

export const newId = () => crypto.randomUUID();
export const blankRichText = (): RichText => ({ type: "doc", content: [{ type: "paragraph" }] });
export const emptyValue = (field: SectionField): FieldValue => field.type === "richText" ? blankRichText() : field.type === "tags" ? []
  : field.type === "rating" ? { type: "rating", value: 0, max: 5, style: "dots" }
  : field.type === "chart" ? { type: "chart", segments: [] } : "";
export const newItem = (fields: SectionField[]): SectionItem => ({ id: newId(), values: Object.fromEntries(fields.map((field) => [field.id, emptyValue(field)])) });
export function fieldValue(item: SectionItem, field: SectionField): FieldValue {
  return item.values[field.id] ?? emptyValue(field);
}
export const richValue = (item: SectionItem, field: SectionField): RichText => fieldValue(item, field) as RichText;
export const tagsValue = (item: SectionItem, field: SectionField): string[] => fieldValue(item, field) as string[];
export const textValue = (item: SectionItem, field: SectionField): string => fieldValue(item, field) as string;
export function hasValue(value: FieldValue) {
  return typeof value === "string" ? !!value.trim() : Array.isArray(value) ? value.some((tag) => tag.trim())
    : value.type === "rating" ? value.value > 0 : value.type === "chart" ? value.segments.some((segment) => segment.value > 0) : hasRichText(value);
}
export const visibleFields = (section: ResumeSection, item: SectionItem) => section.fields.filter((field) => !field.hidden && !item.hiddenFields?.includes(field.id));
export const filledItems = (section: ResumeSection) => section.items.filter((item) => visibleFields(section, item).some((field) => hasValue(fieldValue(item, field))));

export function itemParts(section: ResumeSection, item: SectionItem, companyFirst = false) {
  const fields = visibleFields(section, item);
  const titleFields = fields.filter((field) => field.type === "title" && hasValue(fieldValue(item, field)));
  const subtitleFields = fields.filter((field) => field.type === "subtitle" && hasValue(fieldValue(item, field)));
  const display = (fields: SectionField[]) => fields.map((field) => displayText(item, field)).filter(Boolean).join(" · ");
  const swap = companyFirst && titleFields.length > 0 && subtitleFields.length > 0;
  return {
    title: display(swap ? subtitleFields : titleFields),
    subtitle: display(swap ? titleFields : subtitleFields),
    date: fields.filter((field) => field.type === "date").map((field) => displayText(item, field)).filter(Boolean).join(" – "),
    details: fields.filter((field) => field.type === "text").map((field) => displayText(item, field)).filter(Boolean).join(" · "),
    body: fields.filter((field) => ["richText", "tags", "link", "rating", "chart", "image"].includes(field.type) && hasValue(fieldValue(item, field))),
  };
}
export function displayText(item: SectionItem, field: SectionField) {
  const value = textValue(item, field).trim();
  return value && field.showLabel && field.label.trim() ? field.label + ": " + value : value;
}
export const iconLabels = { summary: "Text", experience: "Briefcase", education: "Graduation", skills: "Star", contact: "Contact" } as const;

type Preset = { id: string; name: string; kind: ResumeSection["kind"]; icon: ResumeSection["icon"]; column: 0 | 1; fields: [string, SectionField["type"]][] };
export const sectionPresets: Preset[] = [
  { id: "blank", name: "Blank section", kind: "entries", icon: "summary", column: 0, fields: [] },
  { id: "paragraph", name: "Paragraph / summary", kind: "prose", icon: "summary", column: 0, fields: [["Text", "richText"]] },
  { id: "experience", name: "Work experience", kind: "entries", icon: "experience", column: 0, fields: [["Role", "title"], ["Organization", "subtitle"], ["Location", "text"], ["Start date", "date"], ["End date", "date"], ["Description", "richText"]] },
  { id: "education", name: "Education", kind: "entries", icon: "education", column: 1, fields: [["Degree", "title"], ["Institution", "subtitle"], ["Location", "text"], ["Start date", "date"], ["End date", "date"]] },
  { id: "projects", name: "Projects", kind: "entries", icon: "experience", column: 0, fields: [["Project", "title"], ["Description", "richText"], ["Website", "link"]] },
  { id: "certificates", name: "Certifications", kind: "entries", icon: "education", column: 1, fields: [["Certificate", "title"], ["Issuer", "subtitle"], ["Date", "date"]] },
  { id: "skills", name: "Skills / interests", kind: "tags", icon: "skills", column: 1, fields: [["Skills", "tags"]] },
  { id: "skill-groups", name: "Grouped skills", kind: "tags", icon: "skills", column: 1, fields: [["Group", "title"], ["Skills", "tags"]] },
  { id: "languages", name: "Languages", kind: "entries", icon: "contact", column: 1, fields: [["Language", "title"], ["Level", "subtitle"], ["Proficiency", "rating"]] },
  { id: "expertise", name: "Industry expertise", kind: "entries", icon: "skills", column: 1, fields: [["Expertise", "title"], ["Proficiency", "rating"]] },
  { id: "volunteering", name: "Volunteering", kind: "entries", icon: "experience", column: 0, fields: [["Role", "title"], ["Organization", "subtitle"], ["Date", "date"], ["Description", "richText"]] },
  { id: "courses", name: "Training / courses", kind: "entries", icon: "education", column: 1, fields: [["Course", "title"], ["Provider", "subtitle"], ["Description", "richText"]] },
  { id: "interests", name: "Interests", kind: "entries", icon: "skills", column: 1, fields: [["Interest", "title"], ["Description", "richText"]] },
  { id: "my-time", name: "My time", kind: "entries", icon: "skills", column: 1, fields: [["Time allocation", "chart"]] },
  { id: "awards", name: "Awards / achievements", kind: "entries", icon: "skills", column: 1, fields: [["Award", "title"], ["Details", "richText"]] },
  { id: "references", name: "References", kind: "entries", icon: "contact", column: 1, fields: [["Name", "title"], ["Contact", "text"]] },
];
export function createSection(presetId: string, name: string, language: Language = "en"): ResumeSection {
  const preset = sectionPresets.find((preset) => preset.id === presetId) ?? sectionPresets[0];
  const fields = preset.fields.map(([label, type]) => ({ id: newId(), label: translate(label, language), type, showLabel: false }));
  return { id: newId(), name, kind: preset.kind, icon: preset.icon, column: preset.column, hidden: false, fields, items: fields.length ? [newItem(fields)] : [] };
}

