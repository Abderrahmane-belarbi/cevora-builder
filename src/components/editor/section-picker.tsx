"use client";
import { t as tr } from "@/resume/locale";

import { useEffect, useState } from "react";
import { Check, FilePlus2, Plus, X } from "lucide-react";
import type { ChartValue } from "@/resume/model";
import { createSection, newId, sectionPresets } from "@/resume/sections";
import { useResume } from "@/resume/store";
import { AlertDialog, Button, Dialog, Input } from "../ui";
import { useDocumentUi } from "./document-ui";
import { translate } from "@/resume/translations";

function CardPreview({ id, name }: { id: string; name: string }) {
  return <div className={"section-card-preview card-preview-" + id} aria-hidden="true">
    <strong>{name.replace(" / summary", "").replace(" / interests", "")}</strong>
    {id === "my-time" ? <div className="card-chart"><i /><span>{tr("Focus work")}<br />{tr("Learning")}<br />{tr("Rest")}</span></div>
      : id === "languages" || id === "expertise" ? <><b>{id === "languages" ? tr("English") : tr("Problem solving")}</b><div className="card-dots"><i /><i /><i /><i /><i /></div><b>{id === "languages" ? tr("Spanish") : tr("Systems thinking")}</b><div className="card-dots"><i /><i /><i /></div></>
      : id === "skills" || id === "skill-groups" ? <><b>{id === "skill-groups" ? tr("Frontend") : tr("Technical skills")}</b><div className="card-tags"><span>React</span><span>TypeScript</span><span>Figma</span></div><b>{tr("Tools & methods")}</b><div className="card-tags"><span>Git</span><span>{tr("Research")}</span></div></>
      : <><b>{id === "blank" ? tr("Your own heading") : id === "experience" ? tr("Your role · Organization") : tr("A story worth sharing")}</b><small>{id === "blank" ? tr("Choose any fields you need") : tr("Jan 2024 — Present")}</small><i /><i /><i className="short-line" /></>}
  </div>;
}
export function SectionPicker() {
  const picker = useDocumentUi((state) => state.picker);
  const close = useDocumentUi((state) => state.closePicker);
  const [selected, setSelected] = useState("experience");
  const [name, setName] = useState("Work experience");
  const [column, setColumn] = useState<0 | 1>(0);
  const edit = useResume((state) => state.edit);
  const language = useResume((state) => state.resume.design.language);
  useEffect(() => { if (picker) { setColumn(picker.column); setName(translate(sectionPresets.find((preset) => preset.id === selected)!.name.replace(" / summary", "").replace(" / interests", ""), language)); } }, [picker, language]);
  function add() {
    if (!picker || !name.trim()) return;
    const section = createSection(selected, name.trim(), language);
    section.column = column;
    if (selected === "my-time") {
      const field = section.fields[0];
      const chart: ChartValue = { type: "chart", segments: [{ id: newId(), label: translate("Focus work", language), value: 8 }, { id: newId(), label: translate("Learning", language), value: 3 }, { id: newId(), label: translate("Rest", language), value: 7 }] };
      section.items[0].values[field.id] = chart;
    }
    edit((resume) => {
      const index = picker.afterId ? resume.sections.findIndex((item) => item.id === picker.afterId) + 1 : resume.sections.length;
      return { ...resume, sections: [...resume.sections.slice(0, index), section, ...resume.sections.slice(index)] };
    });
    close();
    useDocumentUi.getState().focus({ sectionId: section.id, itemId: section.items[0]?.id, fieldId: section.fields.find((field) => field.type === "title")?.id });
    if (!section.fields.length) useDocumentUi.getState().editForm(section.id);
    window.setTimeout(() => document.querySelector('[data-document-section="' + section.id + '"]')?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
  }
  return <Dialog.Root open={!!picker} onOpenChange={(open) => { if (!open) close(); }}><Dialog.Portal>
    <Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="section-picker-dialog">
      <div className="picker-heading"><div><Dialog.Title>{tr("Add a section")}</Dialog.Title><Dialog.Description>{tr("Choose a starting point. Every heading, field, and entry stays yours to edit.")}</Dialog.Description></div><Dialog.Close asChild><Button variant="icon" aria-label={tr("Close section picker")}><X size={20} /></Button></Dialog.Close></div>
      <div className="section-picker-grid" role="radiogroup" aria-label="Section starting point" onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
        event.preventDefault();
        const index = sectionPresets.findIndex((preset) => preset.id === selected);
        const next = (index + (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1) + sectionPresets.length) % sectionPresets.length;
        setSelected(sectionPresets[next].id); setName(translate(sectionPresets[next].name, language));
        (event.currentTarget.querySelectorAll('button[role="radio"]')[next] as HTMLButtonElement)?.focus();
      }}>{sectionPresets.map((preset) => <button type="button" role="radio" tabIndex={selected === preset.id ? 0 : -1} aria-checked={selected === preset.id} aria-label={tr(preset.name)} className="section-picker-card" key={preset.id} onClick={() => { setSelected(preset.id); setName(translate(preset.name.replace(" / summary", "").replace(" / interests", ""), language)); }}>
        <CardPreview id={preset.id} name={tr(preset.name)} /><span>{tr(preset.name)}</span>{selected === preset.id && <i className="picker-check"><Check size={14} /></i>}
      </button>)}</div>
      <form className="picker-footer" onSubmit={(event) => { event.preventDefault(); add(); }}>
        <label className="field"><span>{tr("Section name")}</span><Input value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="field"><span>{tr("Place in")}</span><select className="input" aria-label="New section column" value={column} onChange={(event) => setColumn(Number(event.target.value) as 0 | 1)}><option value={0}>{tr("Main column")}</option><option value={1}>{tr("Side column")}</option></select></label>
        <Button variant="primary" type="submit" disabled={!name.trim()}><FilePlus2 size={16} /> {tr("Add to résumé")}</Button>
      </form>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}

export function DocumentRemovalDialog() {
  const removal = useDocumentUi((state) => state.removal);
  const cancel = useDocumentUi((state) => state.cancelRemoval);
  const edit = useResume((state) => state.edit);
  return <AlertDialog.Root open={!!removal} onOpenChange={(open) => { if (!open) cancel(); }}><AlertDialog.Portal>
    <AlertDialog.Overlay className="dialog-overlay" /><AlertDialog.Content className="dialog-content">
      <AlertDialog.Title>{removal?.itemId ? tr("Delete this entry?") : tr("Delete this section?")}</AlertDialog.Title>
      <AlertDialog.Description>{removal?.itemId ? tr("This entry will be removed from the résumé.") : tr("The section and all its entries will be removed.")} {tr("You can undo this change.")}</AlertDialog.Description>
      <div className="dialog-buttons"><AlertDialog.Cancel asChild><Button>{tr("Cancel")}</Button></AlertDialog.Cancel><AlertDialog.Action asChild><Button variant="danger" onClick={() => {
        if (!removal) return;
        edit((resume) => ({ ...resume, sections: removal.itemId ? resume.sections.map((section) => section.id === removal.sectionId ? { ...section, items: section.items.filter((item) => item.id !== removal.itemId) } : section) : resume.sections.filter((section) => section.id !== removal.sectionId) }));
        useDocumentUi.getState().select(null); cancel();
      }}>{tr("Delete")}</Button></AlertDialog.Action></div>
    </AlertDialog.Content>
  </AlertDialog.Portal></AlertDialog.Root>;
}

