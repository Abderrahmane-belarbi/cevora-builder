"use client";
import { t as tr } from "@/resume/locale";

import { useState } from "react";
import { startPointerReorder } from "./pointer-reorder";
import { ArrowDown, ArrowUp, CalendarDays, Check, Copy, GripVertical, ListPlus, Plus, Settings2, Trash2 } from "lucide-react";
import type { ResumeSection, SectionItem } from "@/resume/model";
import { changeField, changeSection, insertItem, moveItem, toggleItemField } from "@/resume/operations";
import { emptyValue, newId, newItem } from "@/resume/sections";
import { useResume } from "@/resume/store";
import { Button, DropdownMenu, Input } from "../ui";
import { useDocumentUi } from "./document-ui";
import { translate } from "@/resume/translations";

export function addEntry(sectionId: string, afterId?: string, duplicate = false) {
  let itemId = "";
  useResume.getState().edit((resume) => {
    const added = insertItem(resume, sectionId, afterId, duplicate); itemId = added.itemId; return added.resume;
  });
  const section = useResume.getState().resume.sections.find((section) => section.id === sectionId);
  useDocumentUi.getState().focus({ sectionId, itemId, fieldId: section?.fields.find((field) => !field.hidden && field.type === "title")?.id ?? section?.fields.find((field) => !field.hidden)?.id });
}
function addGroup(sectionId: string, afterId: string) {
  let itemId = "", titleId = "";
  useResume.getState().edit((resume) => changeSection(resume, sectionId, (section) => {
    const existing = section.fields.find((field) => field.type === "title");
    const title = existing ?? { id: newId(), label: translate("Group", useResume.getState().resume.design.language), type: "title" as const, showLabel: false };
    titleId = title.id;
    const fields = existing ? section.fields : [title, ...section.fields];
    const item = newItem(fields); itemId = item.id;
    const items = section.items.map((item) => existing ? item : { ...item, values: { ...item.values, [title.id]: emptyValue(title) } });
    const at = items.findIndex((item) => item.id === afterId) + 1; items.splice(at, 0, item);
    return { ...section, fields, items };
  }));
  useDocumentUi.getState().focus({ sectionId, itemId, fieldId: titleId });
}
function addOptionalField(sectionId: string, itemId: string, type: "link" | "image") {
  const field = { id: newId(), label: translate(type === "link" ? "Link" : "Image / logo", useResume.getState().resume.design.language), type, showLabel: false };
  useResume.getState().edit((resume) => changeSection(resume, sectionId, (section) => ({
    ...section, fields: [...section.fields, field],
    items: section.items.map((item) => ({ ...item, values: { ...item.values, [field.id]: "" } })),
  })));
  useDocumentUi.getState().focus({ sectionId, itemId, fieldId: field.id });
}
function Dates({ section, item }: { section: ResumeSection; item: SectionItem }) {
  const [open, setOpen] = useState(false);
  const fields = section.fields.filter((field) => field.type === "date");
  if (!fields.length) return null;
  const update = (id: string, value: string) => useResume.getState().edit((resume) => changeField(resume, section.id, item.id, id, value), "field:" + section.id + ":" + item.id + ":" + id);
  return <div className="entry-date-control"><Button variant="icon" aria-label={tr("Edit entry dates")} title="Edit dates" aria-expanded={open} onClick={() => setOpen(!open)}><CalendarDays size={16} /></Button>
    {open && <div className="entry-date-popover" role="dialog" aria-label="Entry dates" onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
      <strong>{tr("Dates")}</strong>{fields.map((field) => <div key={field.id} className="date-field-row">
        <label className="field"><span>{field.label || tr("Date")}</span><Input aria-label={field.label + " text"} value={String(item.values[field.id] ?? "")} placeholder="e.g. Jan 2024" onChange={(event) => update(field.id, event.target.value)} /></label>
        <input className="input" type="month" aria-label={"Choose month — " + field.label} onChange={(event) => {
          if (!event.target.value) return;
          const [year, month] = event.target.value.split("-");
          update(field.id, new Intl.DateTimeFormat(useResume.getState().resume.design.language, { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(Number(year), Number(month) - 1))));
        }} />
        <label className="check-label"><input type="checkbox" checked={["Present", "حتى الآن"].includes(String(item.values[field.id]))} onChange={(event) => update(field.id, event.target.checked ? (useResume.getState().resume.design.language === "ar" ? "حتى الآن" : "Present") : "")} /> {tr("Ongoing / Present")}</label>
      </div>)}<Button onClick={() => setOpen(false)}>{tr("Done")}</Button>
    </div>}
  </div>;
}
export function EntryToolbar({ section, item }: { section: ResumeSection; item: SectionItem }) {
  const edit = useResume((state) => state.edit);
  const index = section.items.findIndex((entry) => entry.id === item.id);
  return <div className="entry-floating-toolbar" role="toolbar" aria-label={"Entry controls — " + section.name} onClick={(event) => event.stopPropagation()} onFocus={(event) => event.stopPropagation()}>
    <Button variant="primary" onClick={() => addEntry(section.id, item.id)} title="Insert entry after this one"><Plus size={15} /> {tr("Entry")}</Button>
    {section.fields.some((field) => field.type === "tags") && <Button variant="ghost" aria-label={tr("Add skill group")} title={tr("Add skill group")} onClick={() => addGroup(section.id, item.id)}><ListPlus size={16} /></Button>}
    <Button variant="icon" aria-label={tr("Move entry up")} title={tr("Move entry up")} disabled={index === 0} onClick={() => edit((resume) => moveItem(resume, section.id, item.id, -1))}><ArrowUp size={15} /></Button>
    <Button variant="icon" aria-label={tr("Move entry down")} title={tr("Move entry down")} disabled={index === section.items.length - 1} onClick={() => edit((resume) => moveItem(resume, section.id, item.id, 1))}><ArrowDown size={15} /></Button>
    <Button variant="icon" aria-label={tr("Duplicate entry")} title={tr("Duplicate entry")} onClick={() => addEntry(section.id, item.id, true)}><Copy size={15} /></Button>
    <Dates section={section} item={item} />
    <DropdownMenu.Root><DropdownMenu.Trigger asChild><Button variant="icon" aria-label={tr("Entry field visibility")} title={tr("Entry field visibility")}><Settings2 size={16} /></Button></DropdownMenu.Trigger>
      <DropdownMenu.Portal><DropdownMenu.Content className="action-menu field-toggle-menu" sideOffset={6} align="end">
        <DropdownMenu.Label className="menu-label">{tr("VISIBLE IN THIS ENTRY")}</DropdownMenu.Label>
        {section.fields.map((field) => <DropdownMenu.CheckboxItem className="menu-item" key={field.id} checked={!field.hidden && !item.hiddenFields?.includes(field.id)} disabled={!!field.hidden} onSelect={(event) => event.preventDefault()} onCheckedChange={() => edit((resume) => toggleItemField(resume, section.id, item.id, field.id))}>
          <span className="menu-checkbox"><DropdownMenu.ItemIndicator><Check size={12} /></DropdownMenu.ItemIndicator></span>{field.label || "Unnamed field"}{field.hidden && <small>{tr("hidden for all")}</small>}
        </DropdownMenu.CheckboxItem>)}
        <DropdownMenu.Separator className="menu-rule" /><DropdownMenu.Item className="menu-item" onSelect={() => useDocumentUi.getState().editForm(section.id)}>{tr("Manage fields in form")}</DropdownMenu.Item>
        {!section.fields.some((field) => field.type === "link") && <DropdownMenu.Item className="menu-item" onSelect={() => addOptionalField(section.id, item.id, "link")}>{tr("Add link field")}</DropdownMenu.Item>}
        {!section.fields.some((field) => field.type === "image") && <DropdownMenu.Item className="menu-item" onSelect={() => addOptionalField(section.id, item.id, "image")}>{tr("Add logo / image field")}</DropdownMenu.Item>}
      </DropdownMenu.Content></DropdownMenu.Portal>
    </DropdownMenu.Root>
    <Button variant="icon" aria-label={tr("Delete entry")} title={tr("Delete entry")} onClick={() => useDocumentUi.getState().requestRemoval(section.id, item.id)}><Trash2 size={15} /></Button>
    <Button variant="icon" aria-label={tr("Drag entry to reorder")} title="Drag to reorder, or use arrow keys" className="drag-handle" onClick={() => useDocumentUi.getState().announce("Use the up and down arrow keys to move this entry.")}
      onKeyDown={(event) => { if (["ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); edit((resume) => moveItem(resume, section.id, item.id, event.key === "ArrowUp" ? -1 : 1)); useDocumentUi.getState().announce("Entry reordered."); } }}
      onPointerDown={(event) => startPointerReorder(event, { type: "item", sectionId: section.id, itemId: item.id })}><GripVertical size={15} /></Button>
  </div>;
}

