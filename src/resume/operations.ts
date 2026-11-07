import type { FieldValue, Resume, ResumeSection } from "./model";
import { newId, newItem } from "./sections";

export function changeSection(resume: Resume, id: string, update: (section: ResumeSection) => ResumeSection): Resume {
  let changed = false;
  const sections = resume.sections.map((section) => {
    if (section.id !== id) return section;
    const next = update(section); changed ||= next !== section; return next;
  });
  return changed ? { ...resume, sections } : resume;
}
export function changeField(resume: Resume, sectionId: string, itemId: string, fieldId: string, value: FieldValue) {
  return changeSection(resume, sectionId, (section) => ({ ...section, items: section.items.map((item) => item.id === itemId ? { ...item, values: { ...item.values, [fieldId]: value } } : item) }));
}
export function insertItem(resume: Resume, sectionId: string, afterId?: string, duplicate = false): { resume: Resume; itemId: string } {
  let itemId = "";
  const next = changeSection(resume, sectionId, (section) => {
    const source = section.items.find((item) => item.id === afterId);
    const item = duplicate && source ? { ...structuredClone(source), id: newId() } : newItem(section.fields);
    itemId = item.id;
    const index = afterId ? section.items.findIndex((item) => item.id === afterId) + 1 : section.items.length;
    return { ...section, items: [...section.items.slice(0, index), item, ...section.items.slice(index)] };
  });
  return { resume: next, itemId };
}
export function moveItem(resume: Resume, sectionId: string, id: string, direction: -1 | 1) {
  return changeSection(resume, sectionId, (section) => {
    const index = section.items.findIndex((item) => item.id === id);
    if (index < 0 || !section.items[index + direction]) return section;
    const items = [...section.items];
    [items[index], items[index + direction]] = [items[index + direction], items[index]];
    return { ...section, items };
  });
}
export function dropItem(resume: Resume, sectionId: string, id: string, targetId: string, after = false) {
  return changeSection(resume, sectionId, (section) => {
    const source = section.items.find((item) => item.id === id);
    if (!source || id === targetId) return section;
    const items = section.items.filter((item) => item.id !== id);
    const target = items.findIndex((item) => item.id === targetId);
    if (target < 0) return section;
    items.splice(target + Number(after), 0, source);
    return { ...section, items };
  });
}
export function dropSection(resume: Resume, id: string, column: 0 | 1, targetId?: string, after = false): Resume {
  const source = resume.sections.find((section) => section.id === id);
  if (!source || id === targetId) return resume;
  const sections = resume.sections.filter((section) => section.id !== id);
  const target = targetId ? sections.findIndex((section) => section.id === targetId) : sections.length;
  if (target < 0) return resume;
  sections.splice(Math.min(sections.length, target + Number(!!targetId && after)), 0, { ...source, column });
  return { ...resume, sections };
}
export function toggleItemField(resume: Resume, sectionId: string, itemId: string, fieldId: string) {
  return changeSection(resume, sectionId, (section) => ({ ...section, items: section.items.map((item) => item.id !== itemId ? item : {
    ...item, hiddenFields: item.hiddenFields?.includes(fieldId) ? item.hiddenFields.filter((id) => id !== fieldId) : [...(item.hiddenFields ?? []), fieldId],
  }) }));
}

