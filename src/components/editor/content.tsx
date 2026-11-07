"use client";
import { t as tr } from "@/resume/locale";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, BriefcaseBusiness, ChevronDown, Ellipsis, Eye, EyeOff, GraduationCap, ListChecks, Plus, TextAlignStart, Trash2, UserRound } from "lucide-react";
import type { ResumeSection } from "@/resume/model";
import { createSection, sectionPresets } from "@/resume/sections";
import { useResume } from "@/resume/store";
import { Accordion, AlertDialog, Button, DropdownMenu, Input } from "../ui";
import { PhotoField } from "./photo-field";
import { SectionBuilder, type Confirm } from "./section-builder";
import { useDocumentUi } from "./document-ui";

const personalFields = [["name", "Full name"], ["headline", "Professional headline"], ["email", "Email"], ["phone", "Phone"], ["location", "Location"], ["website", "Website"], ["linkedin", "LinkedIn"]] as const;
const icons = { summary: TextAlignStart, experience: BriefcaseBusiness, education: GraduationCap, skills: ListChecks, contact: UserRound };

function PersonalForm() {
  const personal = useResume((s) => s.resume.personal);
  const edit = useResume((s) => s.edit);
  return <><PhotoField /><div className="fields-grid">{personalFields.map(([key, label]) => <label key={key} className={"field" + (["name", "headline", "linkedin"].includes(key) ? " field-wide" : "")}><span>{tr(label)}</span>
    <Input value={personal[key]} inputMode={key === "email" ? "email" : key === "phone" ? "tel" : ["website", "linkedin"].includes(key) ? "url" : undefined} onChange={(event) => edit((resume) => ({ ...resume, personal: { ...resume.personal, [key]: event.target.value } }))} />
  </label>)}</div></>;
}
function ContentEditor() {
  const sections = useResume((s) => s.resume.sections);
  const edit = useResume((s) => s.edit);
  const [open, setOpen] = useState(["personal"]);
  const [focusSection, setFocusSection] = useState("");
  const [preset, setPreset] = useState("experience");
  const [name, setName] = useState("");
  const [pending, setPending] = useState<{ title: string; description: string; action: () => void } | null>(null);
  const requestForm = useDocumentUi((state) => state.requestForm);
  useEffect(() => {
    if (!requestForm) return;
    setOpen((open) => [...new Set([...open, requestForm.sectionId])]);
    setFocusSection(requestForm.sectionId);
    const timer = window.setTimeout(() => document.querySelector('[data-form-section="' + requestForm.sectionId + '"]')?.scrollIntoView({ block: "center", behavior: "smooth" }), 100);
    return () => window.clearTimeout(timer);
  }, [requestForm]);
  const confirm: Confirm = (title, description, action) => setPending({ title, description, action });
  const change = (id: string, update: (section: ResumeSection) => ResumeSection) => edit((resume) => ({ ...resume, sections: resume.sections.map((section) => section.id === id ? update(section) : section) }));
  const move = (id: string, direction: -1 | 1) => edit((resume) => {
    const index = resume.sections.findIndex((section) => section.id === id);
    if (!resume.sections[index + direction]) return resume;
    const sections = [...resume.sections];
    [sections[index], sections[index + direction]] = [sections[index + direction], sections[index]];
    return { ...resume, sections };
  });
  return <>
    <div className="panel-intro"><h1>{tr("Your sections, your story")}</h1><p>{tr("Rename, rearrange, or build a section from scratch.")}</p></div>
    <Accordion.Root type="multiple" value={open} onValueChange={setOpen} className="section-list">
      <Accordion.Item className="editor-section" value="personal" data-form-section="personal">
        <Accordion.Header><Accordion.Trigger className="section-trigger"><span className="section-icon"><UserRound size={16} /></span><span className="section-name">{tr("Personal details")}</span><ChevronDown className="section-chevron" size={15} /></Accordion.Trigger></Accordion.Header>
        <Accordion.Content className="section-body"><PersonalForm /></Accordion.Content>
      </Accordion.Item>
      {sections.map((section, index) => {
        const Icon = icons[section.icon];
        const title = section.name || tr("Untitled section");
        const VisibilityIcon = section.hidden ? EyeOff : Eye;
        return <Accordion.Item className="editor-section" value={section.id} key={section.id} data-form-section={section.id}>
          <div className="section-bar">
            <Accordion.Header className="section-heading"><Accordion.Trigger className="section-trigger">
              <span className="section-icon"><Icon size={16} /></span><span className="section-name">{title}<small>{section.items.length} {section.items.length === 1 ? tr("item") : tr("items")} · {section.column === 0 ? tr("Main") : tr("Side")}</small></span><ChevronDown className="section-chevron" size={15} />
            </Accordion.Trigger></Accordion.Header>
            <Button variant="icon" className="visibility" aria-label={(section.hidden ? "Show " : "Hide ") + title} title={(section.hidden ? "Show " : "Hide ") + title} onClick={() => change(section.id, (section) => ({ ...section, hidden: !section.hidden }))}><VisibilityIcon size={14} /></Button>
            <DropdownMenu.Root><DropdownMenu.Trigger asChild><Button variant="icon" className="visibility" aria-label={"Section actions — " + title}><Ellipsis size={16} /></Button></DropdownMenu.Trigger>
              <DropdownMenu.Portal><DropdownMenu.Content className="action-menu" align="end" sideOffset={5}>
                <DropdownMenu.Item className="menu-item" disabled={index === 0} onSelect={() => move(section.id, -1)}><ArrowUp size={14} /> {tr("Move section up")}</DropdownMenu.Item>
                <DropdownMenu.Item className="menu-item" disabled={index === sections.length - 1} onSelect={() => move(section.id, 1)}><ArrowDown size={14} /> {tr("Move section down")}</DropdownMenu.Item>
                <DropdownMenu.Separator className="menu-rule" />
                <DropdownMenu.Item className="menu-item menu-danger" onSelect={() => confirm(tr("Delete this section?"), "“" + title + "” — " + tr("All entries in this section will be removed. Export a backup first if you want to keep a copy."), () => edit((resume) => ({ ...resume, sections: resume.sections.filter((entry) => entry.id !== section.id) })))}><Trash2 size={14} /> {tr("Delete section")}</DropdownMenu.Item>
              </DropdownMenu.Content></DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
          <Accordion.Content className="section-body"><SectionBuilder section={section} change={(update) => change(section.id, update)} confirm={confirm} autoFocus={focusSection === section.id} /></Accordion.Content>
        </Accordion.Item>;
      })}
    </Accordion.Root>
    <form className="new-section-form" onSubmit={(event) => {
      event.preventDefault();
      if (!name.trim()) return;
      const section = createSection(preset, name.trim(), useResume.getState().resume.design.language);
      edit((resume) => ({ ...resume, sections: [...resume.sections, section] }));
      setFocusSection(section.id);
      setOpen((open) => [...open, section.id]);
      setName("");
    }}>
      <h2><Plus size={16} /> {tr("Add a section")}</h2>
      <Button onClick={() => useDocumentUi.getState().openPicker()}>{tr("Browse section gallery")}</Button>
      <label className="field"><span>{tr("Section name")}</span><Input placeholder={tr("e.g. Projects, Publications, Volunteer work")} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label className="field"><span>{tr("Start with")}</span><select className="input" value={preset} onChange={(event) => setPreset(event.target.value)}>{sectionPresets.map((preset) => <option key={preset.id} value={preset.id}>{tr(preset.name)}</option>)}</select></label>
      <Button type="submit" variant="primary" disabled={!name.trim()}><Plus size={15} /> {tr("Create section")}</Button>
      <p className="builder-hint">{tr("Starting points are optional. Every heading and field label can be customized.")}</p>
    </form>
    <AlertDialog.Root open={!!pending} onOpenChange={(open) => { if (!open) setPending(null); }}><AlertDialog.Portal>
      <AlertDialog.Overlay className="dialog-overlay" /><AlertDialog.Content className="dialog-content">
        <AlertDialog.Title>{pending?.title}</AlertDialog.Title><AlertDialog.Description>{pending?.description}</AlertDialog.Description>
        <div className="dialog-buttons"><AlertDialog.Cancel asChild><Button>{tr("Cancel")}</Button></AlertDialog.Cancel><AlertDialog.Action asChild><Button variant="danger" onClick={() => { pending?.action(); setPending(null); }}>{tr("Delete")}</Button></AlertDialog.Action></div>
      </AlertDialog.Content>
    </AlertDialog.Portal></AlertDialog.Root>
  </>;
}
export function ContentPanel() {
  const replacement = useResume((s) => s.replacement);
  return <ContentEditor key={replacement} />;
}

