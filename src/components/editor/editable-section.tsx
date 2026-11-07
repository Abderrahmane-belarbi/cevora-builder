"use client";
import { t as tr } from "@/resume/locale";

import type { ReactNode } from "react";
import { startPointerReorder } from "./pointer-reorder";
import { ArrowDown, ArrowUp, GripVertical, Plus, Settings2, Trash2 } from "lucide-react";
import type { Resume, ResumeSection } from "@/resume/model";
import { changeSection, dropSection } from "@/resume/operations";
import { visibleFields } from "@/resume/sections";
import { presentation, sectionIconPaths } from "@/resume/presentation";
import { useResume } from "@/resume/store";
import { Button, DropdownMenu } from "../ui";
import { useDocumentUi } from "./document-ui";
import { EditableField } from "./editable-field";
import { addEntry, EntryToolbar } from "./entry-toolbar";
import { InlineText } from "./inline-text";

function SectionTools({ section }: { section: ResumeSection }) {
  const edit = useResume((state) => state.edit);
  const sections = useResume((state) => state.resume.sections);
  const index = sections.findIndex((entry) => entry.id === section.id);
  const move = (direction: -1 | 1) => {
    const target = sections[index + direction];
    if (target) edit((resume) => dropSection(resume, section.id, section.column, target.id, direction === 1));
  };
  return <div className="section-floating-toolbar" role="toolbar" aria-label={"Section controls — " + section.name} onClick={(event) => event.stopPropagation()}>
    <Button variant="primary" disabled={!section.fields.length} onClick={() => addEntry(section.id)}><Plus size={14} /> {tr("Entry")}</Button>
    <Button variant="icon" aria-label={tr("Move section up")} title={tr("Move section up")} disabled={index === 0} onClick={() => move(-1)}><ArrowUp size={15} /></Button>
    <Button variant="icon" aria-label={tr("Move section down")} title={tr("Move section down")} disabled={index === sections.length - 1} onClick={() => move(1)}><ArrowDown size={15} /></Button>
    <DropdownMenu.Root><DropdownMenu.Trigger asChild><Button variant="icon" aria-label={tr("Section layout settings")} title={tr("Section settings")}><Settings2 size={15} /></Button></DropdownMenu.Trigger>
      <DropdownMenu.Portal><DropdownMenu.Content className="action-menu" sideOffset={5}>
        <DropdownMenu.Label className="menu-label">{tr("PLACE SECTION IN")}</DropdownMenu.Label>
        <DropdownMenu.RadioGroup value={String(section.column)} onValueChange={(value) => edit((resume) => changeSection(resume, section.id, (section) => ({ ...section, column: Number(value) as 0 | 1 })))}>
          <DropdownMenu.RadioItem className="menu-item" value="0">{tr("Main column")}</DropdownMenu.RadioItem><DropdownMenu.RadioItem className="menu-item" value="1">{tr("Side column")}</DropdownMenu.RadioItem>
        </DropdownMenu.RadioGroup>
        <DropdownMenu.Separator className="menu-rule" /><DropdownMenu.Item className="menu-item" onSelect={() => useDocumentUi.getState().editForm(section.id)}>{tr("Manage section fields")}</DropdownMenu.Item>
        <DropdownMenu.Item className="menu-item" onSelect={() => edit((resume) => changeSection(resume, section.id, (section) => ({ ...section, hidden: true })))}>{tr("Hide section")}</DropdownMenu.Item>
      </DropdownMenu.Content></DropdownMenu.Portal>
    </DropdownMenu.Root>
    <Button variant="icon" aria-label={tr("Delete section")} title={tr("Delete section")} onClick={() => useDocumentUi.getState().requestRemoval(section.id)}><Trash2 size={15} /></Button>
    <Button variant="icon" className="drag-handle" aria-label={tr("Drag section to reorder or change column")} title="Drag section, or use arrow keys"
      onClick={() => useDocumentUi.getState().announce("Use the up and down arrow keys to move this section.")}
      onKeyDown={(event) => { if (["ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); move(event.key === "ArrowUp" ? -1 : 1); useDocumentUi.getState().announce("Section reordered."); } }}
      onPointerDown={(event) => startPointerReorder(event, { type: "section", sectionId: section.id })}><GripVertical size={15} /></Button>
  </div>;
}

export function EditableSection({ section, resume }: { section: ResumeSection; resume: Resume }) {
  const selection = useDocumentUi((state) => state.selection);
  const dragged = useDocumentUi((state) => state.dragged);
  const edit = useResume((state) => state.edit);
  const target = useDocumentUi((state) => state.dropTarget);
  const edge = target?.type === "section" && target.sectionId === section.id ? (target.after ? "after" : "before") : null;
  const itemEdge = target?.type === "item" && target.sectionId === section.id ? { id: target.itemId, edge: target.after ? "after" : "before" } : null;
  const selected = selection?.sectionId === section.id;
  return <section className={"resume-section inline-section" + (selected ? " section-is-selected" : "") + (edge ? " drop-" + edge : "")} data-kind={section.kind} data-document-section={section.id}
    onClick={(event) => { event.stopPropagation(); useDocumentUi.getState().select({ sectionId: section.id }); }}
    >
    {selected && !selection?.itemId && <SectionTools section={section} />}
    <h3 onFocus={() => useDocumentUi.getState().select({ sectionId: section.id })}>
      <span className="resume-section-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{sectionIconPaths[section.icon].map((d, i) => <path key={i} d={d} />)}</svg></span>
      <InlineText value={section.name} label={"Section heading — " + section.id} placeholder="Section heading" onChange={(name) => edit((resume) => changeSection(resume, section.id, (section) => ({ ...section, name })), "section-name:" + section.id)} />
    </h3>
    {!section.fields.length && <button type="button" className="inline-empty-section" onClick={(event) => { event.stopPropagation(); useDocumentUi.getState().editForm(section.id); }}>{tr("Add your first field in the form editor")}</button>}
    {section.items.map((item) => {
      const fields = visibleFields(section, item);
      const titles = fields.filter((field) => field.type === "title");
      const subtitles = fields.filter((field) => field.type === "subtitle");
      const swap = presentation(resume.design).template.companyFirst && titles.length > 0 && subtitles.length > 0;
      const headingFields = swap ? subtitles : titles;
      const subheadingFields = swap ? titles : subtitles;
      const dates = fields.filter((field) => field.type === "date");
      const details = fields.filter((field) => field.type === "text");
      const body = fields.filter((field) => !["title", "subtitle", "date", "text"].includes(field.type));
      const active = selected && selection.itemId === item.id;
      return <div className={"resume-entry inline-entry" + (active ? " entry-is-selected" : "") + (dragged?.type === "item" && dragged.itemId === item.id ? " entry-is-dragging" : "") + (itemEdge?.id === item.id ? " drop-" + itemEdge.edge : "")} key={item.id} data-document-item={item.id}
        onClick={(event) => { event.stopPropagation(); if (!active) useDocumentUi.getState().select({ sectionId: section.id, itemId: item.id }); }}
        >
        {active && <EntryToolbar section={section} item={item} />}
        {(headingFields.length > 0 || dates.length > 0) && <div className="resume-entry-heading">
          <h4>{headingFields.map((field) => <EditableField key={field.id} section={section} item={item} field={field} accent={resume.design.accent} />)}</h4>
          <span className="inline-dates">{dates.map((field, index) => <span key={field.id}>{index > 0 && " – "}<EditableField section={section} item={item} field={field} accent={resume.design.accent} /></span>)}</span>
        </div>}
        {subheadingFields.map((field) => <div className="resume-entry-meta" key={field.id}><EditableField section={section} item={item} field={field} accent={resume.design.accent} /></div>)}
        {details.map((field) => <div className="resume-entry-details" key={field.id}><EditableField section={section} item={item} field={field} accent={resume.design.accent} /></div>)}
        {body.map((field) => <div className="resume-body-field" key={field.id}><EditableField section={section} item={item} field={field} accent={resume.design.accent} /></div>)}
        {!fields.length && <span className="inline-empty-hint">{tr("All fields are hidden. Use entry settings to show them.")}</span>}
      </div>;
    })}
    <div className="inline-section-add"><button type="button" disabled={!section.fields.length} onClick={(event) => { event.stopPropagation(); addEntry(section.id); }}><Plus size={12} /> <span>{tr(section.fields.some((field) => field.type === "tags") ? "Add group / entry" : "Add entry")}</span></button>
      <button type="button" onClick={(event) => { event.stopPropagation(); useDocumentUi.getState().openPicker(section.column, section.id); }}><Plus size={12} /> {tr("Section")}</button></div>
  </section>;
}

export function DocumentColumn({ children, className, column, as = "div" }: { children: ReactNode; className: string; column: 0 | 1; as?: "div" | "aside" }) {
  const target = useDocumentUi((state) => state.dropTarget);
  const Tag = as;
  return <Tag className={className + " document-column" + (target?.type === "column" && target.column === column ? " column-drop-active" : "")} data-document-column={column}>
    {children}<button className="document-add-section" type="button" onClick={() => useDocumentUi.getState().openPicker(column)}><Plus size={14} /> {tr("New section")}</button>
  </Tag>;
}
