"use client";
import { t as tr } from "@/resume/locale";

import { Check } from "lucide-react";
import { useMemo } from "react";
import { accentColors, type Design } from "@/resume/model";
import { useResume } from "@/resume/store";
import { compatibleFont, fonts, templates } from "@/resume/presentation";
import { sampleResume } from "@/resume/sample";
import { HtmlResume } from "../preview/html-resume";

const palette = ["Teal", "Navy", "Clay", "Plum", "Graphite"];
function useDesign() {
  const design = useResume((s) => s.resume.design);
  const edit = useResume((s) => s.edit);
  return { design, change: (patch: Partial<Design>) => edit((r) => ({ ...r, design: { ...r.design, ...patch } })) };
}
export function TemplatePanel() {
  const { design, change } = useDesign();
  const specimens = useMemo(() => templates.map((template) => {
    const resume = sampleResume(design.language);
    resume.design = { ...resume.design, template: template.id, font: compatibleFont(template.defaultFont, design.language), spacing: "compact" };
    return resume;
  }), [design.language]);
  return <>
    <div className="panel-intro"><h1>{tr("Find your layout")}</h1><p>{tr("Choose a style, then make it your own in Design.")}</p></div>
    <fieldset className="template-gallery"><legend className="sr-only">{tr("Résumé template")}</legend>
      {templates.map(({ id, name, detail, defaultFont }, index) => <label className="template-card" key={id} title={tr(detail)}>
        <input className="sr-only" name="template" type="radio" value={id} checked={design.template === id} onChange={() => change({ template: id, font: compatibleFont(defaultFont, design.language) })} />
        <div className="template-specimen" aria-hidden="true" inert><HtmlResume resume={specimens[index]} thumbnail /></div>
        <span className="template-description"><strong>{tr(name)}</strong><small>{tr(detail)}</small></span>
        {design.template === id && <span className="option-check"><Check size={14} /></span>}
      </label>)}
    </fieldset>
    <p className="gallery-note">{tr("Each layout includes suggested typography. Your content, photo, and colors stay with you.")}</p>
  </>;
}

export function DesignPanel() {
  const { design, change } = useDesign();
  return <>
    <div className="panel-intro"><h1>{tr("Résumé design")}</h1><p>{tr("Fine-tune the look of your document.")}</p></div>
    <div className="design-controls">
      <fieldset><legend>{tr("Font")}</legend><p>{tr("Applies to your live preview and PDF.")}</p>
        <div className="font-options">{(Object.entries(fonts) as [Design["font"], typeof fonts[Design["font"]]][]).filter(([, font]) => design.language !== "ar" || font.arabic).map(([id, font]) => <label className="font-option" key={id}>
          <input className="sr-only" type="radio" name="font" value={id} checked={compatibleFont(design.font, design.language) === id} onChange={() => change({ font: id })} />
          <span className="font-example" style={{ fontFamily: font.css }}>{font.arabic ? "أب" : "Aa"}</span>
          <span><strong>{font.label}</strong><small>{tr(font.detail)}</small></span>
          {compatibleFont(design.font, design.language) === id && <Check size={16} />}
        </label>)}</div>
      </fieldset>
      <fieldset><legend>{tr("Accent color")}</legend><p>{tr("Used for headings and highlights.")}</p>
        <div className="palette">{accentColors.map((accent, index) => <label className="swatch" key={accent} style={{ "--swatch": accent } as React.CSSProperties} title={tr(palette[index])}>
          <input className="sr-only" type="radio" name="accent" aria-label={tr(palette[index])} checked={design.accent === accent} onChange={() => change({ accent })} />
          <span>{design.accent === accent && <Check size={17} />}</span>
        </label>)}</div>
      </fieldset>
      <fieldset><legend>{tr("Spacing")}</legend><p>{tr("Adjust margins and space between sections.")}</p>
        <div className="choice-row">{(["compact", "comfortable", "spacious"] as const).map((spacing) => <label key={spacing}>
          <input className="sr-only" type="radio" name="spacing" checked={design.spacing === spacing} onChange={() => change({ spacing })} />
          <span>{tr(spacing)}</span>
        </label>)}</div>
      </fieldset>
      <fieldset><legend>{tr("Paper size")}</legend><p>{tr("Sets the page size of your PDF.")}</p>
        <div className="choice-row">{(["A4", "LETTER"] as const).map((paper) => <label key={paper}>
          <input className="sr-only" type="radio" name="paper" checked={design.paper === paper} onChange={() => change({ paper })} />
          <span>{paper === "A4" ? "A4" : tr("US Letter")}</span>
        </label>)}</div>
      </fieldset>
    </div>
  </>;
}
