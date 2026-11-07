"use client";
import { t as tr } from "@/resume/locale";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Settings2, Trash2 } from "lucide-react";
import { fieldTypeLabels, fieldTypes, type ResumeSection, type SectionField } from "@/resume/model";
import { emptyValue, fieldValue, iconLabels, newId, newItem } from "@/resume/sections";
import { Button, Input } from "../ui";
import { FieldInput } from "./field-input";

export type Confirm = (title: string, description: string, action: () => void) => void;
export function SectionBuilder({ section, change, confirm, autoFocus }: {
  section: ResumeSection; change(update: (section: ResumeSection) => ResumeSection): void; confirm: Confirm; autoFocus: boolean;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<SectionField["type"]>("text");
  const swap = <T,>(items: T[], index: number, direction: -1 | 1) => {
    if (!items[index + direction]) return items;
    const copy = [...items];
    [copy[index], copy[index + direction]] = [copy[index + direction], copy[index]];
    return copy;
  };
  return <div className="section-builder">
    <label className="field"><span>{tr("Section name")}</span><Input aria-label={"Section name — " + section.id} autoFocus={autoFocus} value={section.name} placeholder={tr("Name this section")} onChange={(event) => change((section) => ({ ...section, name: event.target.value }))} /></label>
    <div className="fields-grid">
      <label className="field"><span>{tr("Column")}</span><select className="input" value={section.column} onChange={(event) => change((section) => ({ ...section, column: Number(event.target.value) as 0 | 1 }))}>
        <option value={0}>{tr("Main column")}</option><option value={1}>{tr("Side column")}</option>
      </select></label>
      <label className="field"><span>{tr("Section icon")}</span><select className="input" value={section.icon} onChange={(event) => change((section) => ({ ...section, icon: event.target.value as ResumeSection["icon"] }))}>
        {Object.entries(iconLabels).map(([id, name]) => <option key={id} value={id}>{tr(name)}</option>)}
      </select></label>
    </div>
    <p className="builder-hint">{tr("Columns apply to two-column templates. Single-column templates use the order in this list.")}</p>

    <details className="field-settings">
      <summary><Settings2 size={14} /> {tr("Manage fields")} <span>{section.fields.length}</span></summary>
      <p className="builder-hint">{tr("Rename labels or add any fields you need. A field’s type controls where it appears.")}</p>
      <div className="field-definitions">{section.fields.map((field, index) => <div className="field-definition" key={field.id}>
        <label className="field"><span>{tr(fieldTypeLabels[field.type])}</span><Input aria-label={"Field label " + (index + 1) + " — " + section.name} value={field.label} placeholder={tr("Field label")} onChange={(event) => change((section) => ({ ...section, fields: section.fields.map((item) => item.id === field.id ? { ...item, label: event.target.value } : item) }))} /></label>
        <div className="definition-actions">
          <label className="check-label"><input type="checkbox" checked={!field.hidden} onChange={(event) => change((section) => ({ ...section, fields: section.fields.map((item) => item.id === field.id ? { ...item, hidden: !event.target.checked } : item) }))} /> {tr("Visible")}</label>
          <label className="check-label"><input type="checkbox" checked={field.showLabel} onChange={(event) => change((section) => ({ ...section, fields: section.fields.map((item) => item.id === field.id ? { ...item, showLabel: event.target.checked } : item) }))} /> {tr("Show label")}</label>
          <Button variant="icon" aria-label={"Move field up: " + field.label} disabled={index === 0} onClick={() => change((section) => ({ ...section, fields: swap(section.fields, index, -1) }))}><ArrowUp size={14} /></Button>
          <Button variant="icon" aria-label={"Move field down: " + field.label} disabled={index === section.fields.length - 1} onClick={() => change((section) => ({ ...section, fields: swap(section.fields, index, 1) }))}><ArrowDown size={14} /></Button>
          <Button variant="icon" aria-label={"Delete field: " + field.label} onClick={() => confirm(tr("Delete this field?"), "“" + (field.label || tr("Unnamed field")) + "” — " + tr("This field’s values will be removed from every entry in this section."), () => change((section) => ({
            ...section, fields: section.fields.filter((item) => item.id !== field.id),
            items: section.items.map((item) => ({ ...item, values: Object.fromEntries(Object.entries(item.values).filter(([key]) => key !== field.id)) })),
          })))}><Trash2 size={14} /></Button>
        </div>
      </div>)}</div>
      <form className="new-field-form" onSubmit={(event) => {
        event.preventDefault();
        if (!newLabel.trim()) return;
        const field: SectionField = { id: newId(), label: newLabel.trim(), type: newType, showLabel: newType === "text" };
        change((section) => ({
          ...section, fields: [...section.fields, field],
          items: section.items.length ? section.items.map((item) => ({ ...item, values: { ...item.values, [field.id]: emptyValue(field) } })) : [newItem([field])],
        }));
        setNewLabel("");
      }}>
        <label className="field"><span>{tr("New field label")}</span><Input placeholder={tr("e.g. GPA, Author, Issuer")} value={newLabel} onChange={(event) => setNewLabel(event.target.value)} /></label>
        <label className="field"><span>{tr("Field type")}</span><select className="input" value={newType} onChange={(event) => setNewType(event.target.value as SectionField["type"])}>{fieldTypes.map((type) => <option key={type} value={type}>{tr(fieldTypeLabels[type])}</option>)}</select></label>
        <Button type="submit" disabled={!newLabel.trim()}><Plus size={14} /> {tr("Add field")}</Button>
      </form>
    </details>

    {!section.fields.length && <p className="builder-empty">{tr("Open Manage fields to add your first field. You can use any labels you like.")}</p>}
    <div className="entry-editor">{section.items.map((item, index) => {
      const titleField = section.fields.find((field) => field.type === "title");
      const title = titleField ? String(item.values[titleField.id] || "Item " + (index + 1)) : "Item " + (index + 1);
      const context = (section.name || tr("Untitled section")) + ", item " + (index + 1);
      return <fieldset key={item.id} className="entry-card"><legend className="sr-only">{context}</legend>
        <div className="entry-bar"><strong>{title}</strong>
          <Button variant="icon" aria-label={"Move item up — " + context} disabled={index === 0} onClick={() => change((section) => ({ ...section, items: swap(section.items, index, -1) }))}><ArrowUp size={14} /></Button>
          <Button variant="icon" aria-label={"Move item down — " + context} disabled={index === section.items.length - 1} onClick={() => change((section) => ({ ...section, items: swap(section.items, index, 1) }))}><ArrowDown size={14} /></Button>
          <Button variant="icon" className="delete-entry" aria-label={"Delete item — " + context} onClick={() => change((section) => ({ ...section, items: section.items.filter((entry) => entry.id !== item.id) }))}><Trash2 size={14} /></Button>
        </div>
        <div className="fields-grid">{section.fields.map((field) => <FieldInput key={field.id} field={field} value={fieldValue(item, field)} context={context} onChange={(value) => change((section) => ({
          ...section, items: section.items.map((entry) => entry.id === item.id ? { ...entry, values: { ...entry.values, [field.id]: value } } : entry),
        }))} />)}</div>
      </fieldset>;
    })}</div>
    <Button className="add-entry" disabled={!section.fields.length} onClick={() => change((section) => ({ ...section, items: [...section.items, newItem(section.fields)] }))}><Plus size={15} /> {tr("Add item")}</Button>
  </div>;
}

