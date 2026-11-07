"use client";
import { t as tr } from "@/resume/locale";
import { type CSSProperties, type ReactNode } from "react";
import { Globe, Link2, Mail, MapPin, Phone } from "lucide-react";
import { contacts, designTokens, ink, safeHref, sidebarFraction } from "@/resume/design";
import type { ChartValue, RatingValue, ResumeSection as SectionData, Resume, RichText } from "@/resume/model";
import { fieldValue, filledItems, itemParts, richValue, tagsValue, textValue } from "@/resume/sections";
import { presentation, sectionIconPaths, sectionPlan, wavePath, type SectionIcon } from "@/resume/presentation";

import { HtmlRichText } from "./rich-html";
import { Rating, TimeChart } from "./visual-fields";
import { EditableSection, DocumentColumn } from "../editor/editable-section";
import { InlineText } from "../editor/inline-text";
import { useResume } from "@/resume/store";
import { useDocumentUi } from "../editor/document-ui";
import { translate } from "@/resume/translations";

const contactIcons = { location: MapPin, email: Mail, phone: Phone, website: Globe, linkedin: Link2 };

function Rich({ value }: { value: RichText }) { return <div className="resume-rich"><HtmlRichText value={value} /></div>; }
function Section({ title, icon, children }: { title: string; icon: SectionIcon; children: ReactNode }) {
  return <section className={"resume-section resume-section-" + icon}><h3>
    <span className="resume-section-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {sectionIconPaths[icon].map((d, i) => <path key={i} d={d} />)}
    </svg></span>{title}</h3>{children}</section>;
}
function Photo({ resume, thumbnail = false, organic = false }: { resume: Resume; thumbnail?: boolean; organic?: boolean }) {
  if (!resume.personal.photo && !thumbnail) return null;
  return <div className={"resume-photo-wrap" + (organic ? " photo-organic" : "")}>
    {organic && <><span className="photo-blob photo-blob-one" /><span className="photo-blob photo-blob-two" /><span className="photo-dot" /></>}
    {resume.personal.photo ? <img className={"resume-photo photo-" + resume.design.photoShape} src={resume.personal.photo} alt={tr("Profile photo") + (resume.personal.name ? " of " + resume.personal.name : "")} width={384} height={384} />
      : <svg className={"resume-photo photo-" + resume.design.photoShape} viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" fill="#e6ece9" /><circle cx="50" cy="36" r="18" fill="#8ba69b" /><path d="M12 100v-9a38 38 0 0 1 76 0v9" fill="#8ba69b" /></svg>}
  </div>;
}
function Header({ resume, thumbnail, editing }: { resume: Resume; thumbnail: boolean; editing: boolean }) {
  const { name, headline, photo } = resume.personal;
  const showPhoto = !presentation(resume.design).sidebar && (photo || thumbnail);
  return (editing || name.trim() || headline.trim() || showPhoto) ? <header className="resume-heading">
    <div className="resume-identity">{(editing || name.trim()) && <h2>{editing ? <InlineText label={tr("Full name on résumé")} placeholder={tr("Your name")} value={name} onChange={(name) => useResume.getState().edit((resume) => ({ ...resume, personal: { ...resume.personal, name } }), "personal:name")} /> : name}</h2>}{(editing || headline.trim()) && <p>{editing ? <InlineText label={tr("Headline on résumé")} placeholder={tr("Your professional headline")} value={headline} onChange={(headline) => useResume.getState().edit((resume) => ({ ...resume, personal: { ...resume.personal, headline } }), "personal:headline")} /> : headline}</p>}</div>
    {showPhoto && <Photo resume={resume} thumbnail={thumbnail} />}
  </header> : null;
}
function ContactList({ resume, editing = false }: { resume: Resume; editing?: boolean }) {
  return <ul className="resume-contacts">{contacts(resume.personal).map(({ key, text, href }) => {
    const Icon = contactIcons[key as keyof typeof contactIcons];
    return <li key={key}><Icon size="1.1em" aria-hidden="true" />{editing ? <InlineText label={key + " on résumé"} value={text} onChange={(value) => useResume.getState().edit((resume) => ({ ...resume, personal: { ...resume.personal, [key]: value } }), "personal:" + key)} /> : href ? <a href={href} target="_blank" rel="noreferrer">{text}</a> : <span>{text}</span>}</li>;
  })}</ul>;
}

function ResumeSection({ section, resume }: { section: SectionData; resume: Resume }) {
  if (section.hidden) return null;
  const entries = filledItems(section);
  if (!entries.length) return null;
  const { template } = presentation(resume.design);
  return <section className="resume-section" data-kind={section.kind}>
    {section.name.trim() && <h3><span className="resume-section-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{sectionIconPaths[section.icon].map((d, i) => <path key={i} d={d} />)}</svg></span>{section.name}</h3>}
    {entries.map((item) => {
      const parts = itemParts(section, item, template.companyFirst);
      return <div className="resume-entry" key={item.id}>
        {(parts.title || parts.date) && <div className="resume-entry-heading">{parts.title && <h4>{parts.title}</h4>}{parts.date && <span>{parts.date}</span>}</div>}
        {parts.subtitle && <div className="resume-entry-meta">{parts.subtitle}</div>}
        {parts.details && <div className="resume-entry-details">{parts.details}</div>}
        {parts.body.map((field) => <div className="resume-body-field" key={field.id}>
          {field.type === "richText" ? <>{field.showLabel && field.label && <strong className="resume-field-label">{field.label}</strong>}<Rich value={richValue(item, field)} /></>
            : field.type === "tags" ? <>{field.showLabel && field.label && <strong className="resume-field-label">{field.label}</strong>}<ul className="resume-skills">{tagsValue(item, field).map((tag, i) => <li key={i}>{tag}</li>)}</ul></>
            : field.type === "rating" ? <Rating value={fieldValue(item, field) as RatingValue} />
            : field.type === "chart" ? <TimeChart value={fieldValue(item, field) as ChartValue} accent={resume.design.accent} />
            : field.type === "image" ? <img className="resume-entry-image" src={textValue(item, field)} alt={field.label} />
            : <div className="resume-field-link">{safeHref(textValue(item, field)) ? <a href={safeHref(textValue(item, field))} target="_blank" rel="noreferrer">{field.showLabel && field.label ? field.label + ": " : ""}{textValue(item, field)}</a> : <span>{field.showLabel && field.label ? field.label + ": " : ""}{textValue(item, field)}</span>}</div>}
        </div>)}
      </div>;
    })}
  </section>;
}
export function HtmlResume({ resume, thumbnail = false, editing = false }: { resume: Resume; thumbnail?: boolean; editing?: boolean }) {
  const { design } = resume;
  const t = designTokens(design);
  const { template, font, sidebar, darkSidebar, sidebarColor, tint, faint } = presentation(design);
  const plan = sectionPlan(template.layout, resume.sections);
  const style = {
    "--paper-ratio": t.width / t.height, "--paper-width": (t.width / 595.28 * 738) + "px", "--inset": (100 * t.inset / t.width) + "cqw",
    "--section-gap": (100 * t.section / t.width) + "cqw", "--entry-gap": (100 * t.entry / t.width) + "cqw",
    "--doc-scale": (100 / t.width) + "cqw", "--doc-line": t.line, "--accent": t.accent, "--doc-heading": ink.heading,
    "--doc-body": ink.body, "--doc-muted": ink.muted, "--doc-rule": ink.line, "--doc-sidebar": sidebarColor,
    "--doc-sidebar-text": ink.sidebarText, "--sidebar-width": (sidebarFraction * 100) + "%",
    "--doc-font": font.css, "--doc-name-size": template.nameSize, "--doc-align": template.align === "center" ? "center" : design.language === "ar" ? "right" : "left",
    "--doc-background": template.background, "--doc-tint": tint, "--doc-faint": faint,
  } as CSSProperties;
  const group = (sections: SectionData[]) => sections.map((section) => editing ? <EditableSection key={section.id} section={section} resume={resume} /> : <ResumeSection key={section.id} section={section} resume={resume} />);
  const masthead = <div className="resume-masthead"><Header resume={resume} thumbnail={thumbnail} editing={editing} />{!plan.contactsInSide && <ContactList resume={resume} editing={editing} />}</div>;
  const sideContent = <>
    {sidebar && (template.layout === "right-sidebar" ? <div className="resume-side-hero"><Photo resume={resume} thumbnail={thumbnail} /></div>
      : <Photo resume={resume} thumbnail={thumbnail} organic={template.decoration === "organic"} />)}
    {plan.contactsInSide && contacts(resume.personal).length > 0 && <Section title={translate("Contact", design.language)} icon="contact"><ContactList resume={resume} editing={editing} /></Section>}
    {group(plan.side)}
  </>;
  const sideClass = "resume-side" + (darkSidebar ? " resume-side-dark" : "");
  const side = editing ? <DocumentColumn as="aside" className={sideClass} column={1}>{sideContent}</DocumentColumn> : <aside className={sideClass}>{sideContent}</aside>;
  const main = editing ? <DocumentColumn className="resume-main" column={0}>{masthead}{group(plan.main)}</DocumentColumn> : <div className="resume-main">{masthead}{group(plan.main)}</div>;
  const splitMain = editing ? <DocumentColumn className="resume-column-main" column={0}>{group(plan.main)}</DocumentColumn> : <div className="resume-column-main">{group(plan.main)}</div>;
  return <article lang={design.language} dir={design.language === "ar" ? "rtl" : "ltr"} className={"resume-paper resume-" + design.template} data-layout={template.layout} data-section-style={template.section}
    data-section-case={template.sectionCase} data-light-name={template.lightName} data-uppercase-name={template.uppercaseName}
    data-plain-skills={template.plainSkills} data-masthead-band={template.band} data-header-center={template.align === "center"} style={style} data-inline-editing={editing} aria-label={thumbnail ? undefined : "Live résumé"} onClick={editing ? () => useDocumentUi.getState().select(null) : undefined}>
    <div className={"paper-content layout-" + template.layout}>
      {template.decoration === "wave" && <svg className="resume-wave-art" viewBox="0 0 600 145" preserveAspectRatio="none" aria-hidden="true">
        <path d={wavePath} fill="var(--doc-tint)" /><path d="M40 0C200 180 270-75 440 47S600 24 600 0" fill="none" stroke="white" strokeWidth="1.2" />
      </svg>}
      {sidebar ? <>
        {template.layout !== "right-sidebar" && side}
        {main}
        {template.layout === "right-sidebar" && side}
      </> : <>{masthead}{template.layout === "split" ? <div className="resume-columns">{splitMain}{side}</div> : editing ? <DocumentColumn className="single-column-sections" column={0}>{group(plan.main)}</DocumentColumn> : group(plan.main)}</>}
    </div>
  </article>;
}

