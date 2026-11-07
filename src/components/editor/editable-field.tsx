"use client";
import { t as tr } from "@/resume/locale";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { ChartValue, FieldValue, RatingValue, ResumeSection, SectionField, SectionItem } from "@/resume/model";
import { changeField } from "@/resume/operations";
import { fieldValue, tagsValue, visibleFields } from "@/resume/sections";
import { useResume } from "@/resume/store";
import { Button, Input } from "../ui";
import { HtmlRichText } from "../preview/rich-html";
import { Rating, TimeChart } from "../preview/visual-fields";
import { useDocumentUi } from "./document-ui";
import { InlineRichText, InlineText } from "./inline-text";
import { VisualFieldInput } from "./visual-field-input";

function InlineTags({ value, label, onChange }: { value: string[]; label: string; onChange(value: string[]): void }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  function commit() {
    const tags = draft.split(",").map((tag) => tag.trim()).filter(Boolean);
    if (tags.length) onChange([...new Set([...value, ...tags])]);
    setDraft(""); setAdding(false);
  }
  return <ul className="resume-skills inline-tags">
    {value.map((tag, i) => <li key={i}><InlineText value={tag} label={label + ", tag " + (i + 1)} onChange={(text) => onChange(value.map((tag, index) => index === i ? text : tag))} /><button type="button" className="remove-inline-tag" aria-label={"Remove " + tag} onClick={() => onChange(value.filter((_, index) => index !== i))}><X size={10} /></button></li>)}
    <li className="inline-tag-add">{adding ? <Input autoFocus aria-label={"New tag — " + label} value={draft} placeholder={tr("New skill")} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commit(); } if (event.key === "Escape") { setDraft(""); setAdding(false); } }} onBlur={commit} />
      : <button type="button" onClick={() => setAdding(true)}><Plus size={11} /> {value.length ? tr("Skill") : tr("Add skill")}</button>}</li>
  </ul>;
}
export function EditableField({ section, item, field, accent }: { section: ResumeSection; item: SectionItem; field: SectionField; accent: string }) {
  const selection = useDocumentUi((state) => state.selection);
  const focusVersion = useDocumentUi((state) => state.focusVersion);
  const active = selection?.sectionId === section.id && selection.itemId === item.id && selection.fieldId === field.id;
  const value = fieldValue(item, field);
  const label = (field.label || "Field") + " — " + section.name + ", entry " + (section.items.findIndex((entry) => entry.id === item.id) + 1);
  const select = () => useDocumentUi.getState().select({ sectionId: section.id, itemId: item.id, fieldId: field.id });
  const update = (value: FieldValue) => useResume.getState().edit((resume) => changeField(resume, section.id, item.id, field.id, value), "field:" + section.id + ":" + item.id + ":" + field.id);
  if (field.type === "richText") return <div className="resume-rich editable-rich" onClick={(event) => event.stopPropagation()}>
    {field.showLabel && field.label && <strong className="resume-field-label">{field.label}</strong>}
    {active ? <InlineRichText label={label} value={value as import("@/resume/model").RichText} onChange={update} />
      : <div role="button" tabIndex={0} aria-label={"Edit " + label} className="inline-rich-trigger" onClick={select} onKeyDown={(event) => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); select(); } }}>
        <HtmlRichText value={value as import("@/resume/model").RichText} />{!(value as import("@/resume/model").RichText).content.some((node) => node.content?.length) && <span className="inline-empty-hint">{field.label || "Add description or bullets"}</span>}
      </div>}
  </div>;
  if (field.type === "tags") return <div className="editable-tag-field" onClick={(event) => { event.stopPropagation(); select(); }} onFocus={select}>
    {field.showLabel && field.label && <strong className="resume-field-label">{field.label}</strong>}
    <InlineTags value={tagsValue(item, field)} label={label} onChange={update} />
  </div>;
  if (field.type === "rating" || field.type === "chart" || field.type === "image") return <div className="inline-visual-field" onClick={(event) => event.stopPropagation()}>
    {field.showLabel && field.label && <strong className="resume-field-label">{field.label}</strong>}
    <div role="button" tabIndex={0} aria-label={"Edit " + label} onClick={select} onKeyDown={(event) => { if (event.key === "Enter") select(); }}>
      {field.type === "rating" ? <Rating value={value as RatingValue} /> : field.type === "chart" ? <TimeChart value={value as ChartValue} accent={accent} /> : value ? <img className="resume-entry-image" src={value as string} alt={field.label} /> : <span className="inline-empty-hint">{tr("Add")} {field.label || "image"}</span>}
    </div>
    {active && <div className="inline-visual-popover" role="dialog" aria-label={"Edit " + field.label}><VisualFieldInput type={field.type} value={value} label={field.label || "Value"} onChange={update} /><Button onClick={() => useDocumentUi.getState().select({ sectionId: section.id, itemId: item.id })}>{tr("Done")}</Button></div>}
  </div>;
  return <span className="editable-value" onClick={(event) => { event.stopPropagation(); select(); }} onFocus={select}>
    {field.showLabel && field.label && <span className="resume-inline-label">{field.label}: </span>}
    <InlineText value={value as string} label={label} placeholder={field.label} onChange={update} focus={active} focusVersion={focusVersion} />
  </span>;
}

