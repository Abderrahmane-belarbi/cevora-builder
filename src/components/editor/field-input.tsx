"use client";
import { t as tr } from "@/resume/locale";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { FieldValue, SectionField } from "@/resume/model";
import { Button, Input } from "../ui";
import { RichField } from "./rich-field";
import { VisualFieldInput } from "./visual-field-input";

export function FieldInput({ field, value, context, onChange }: {
  field: SectionField; value: FieldValue; context: string; onChange(value: FieldValue): void;
}) {
  const [draft, setDraft] = useState("");
  const name = field.label || "Unnamed field";
  if (field.type === "rating" || field.type === "chart" || field.type === "image") return <div className="field field-wide"><span>{name}</span><VisualFieldInput type={field.type} label={name + " — " + context} value={value} onChange={onChange} /></div>;
  if (field.type === "richText") return <div className="field field-wide"><span>{name}</span>
    <RichField label={name + " — " + context} value={value as import("@/resume/model").RichText} onChange={onChange} />
  </div>;
  if (field.type === "tags") {
    const tags = value as string[];
    return <div className="field field-wide"><span>{name}</span>
      <form className="skill-add" onSubmit={(event) => {
        event.preventDefault();
        const additions = draft.split(",").map((tag) => tag.trim()).filter(Boolean);
        if (!additions.length) return;
        onChange([...new Set([...tags, ...additions])]);
        setDraft("");
      }}>
        <Input aria-label={"New " + name + " — " + context} placeholder={tr("Add tags, separated by commas")} value={draft} onChange={(event) => setDraft(event.target.value)} />
        <Button type="submit" disabled={!draft.trim()}><Plus size={15} /> {tr("Add")}</Button>
      </form>
      <ul className="skill-chips">{tags.map((tag, i) => <li key={i}>{tag}<Button variant="icon" aria-label={"Remove " + tag + " — " + context} onClick={() => onChange(tags.filter((_, index) => index !== i))}><X size={13} /></Button></li>)}</ul>
    </div>;
  }
  return <label className={"field" + (field.type === "date" ? "" : " field-wide")}><span>{name}</span>
    <Input aria-label={name + " — " + context} inputMode={field.type === "link" ? "url" : undefined} value={value as string} onChange={(event) => onChange(event.target.value)} />
  </label>;
}

