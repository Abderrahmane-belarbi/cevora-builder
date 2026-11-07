"use client";
import { t as tr } from "@/resume/locale";

import { useRef, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import type { ChartValue, FieldValue, RatingValue } from "@/resume/model";
import { newId } from "@/resume/sections";
import { preparePhoto } from "@/resume/photo";
import { Button, Input } from "../ui";

export function VisualFieldInput({ type, value, label, onChange }: { type: "rating" | "chart" | "image"; value: FieldValue; label: string; onChange(value: FieldValue): void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (type === "rating") {
    const rating = value as RatingValue;
    return <div className="visual-field-controls">
      <label className="field"><span>{label} · {rating.value} / {rating.max}</span><input aria-label={label} type="range" min={0} max={rating.max} step={1} value={rating.value} onChange={(event) => onChange({ ...rating, value: Number(event.target.value) })} /></label>
      <div className="fields-grid">
        <label className="field"><span>{tr("Appearance")}</span><select className="input" aria-label={label + " appearance"} value={rating.style} onChange={(event) => onChange({ ...rating, style: event.target.value as "dots" | "bar" })}><option value="dots">{tr("Dots")}</option><option value="bar">{tr("Bar")}</option></select></label>
        <label className="field"><span>{tr("Scale")}</span><select className="input" aria-label={label + " scale"} value={rating.max} onChange={(event) => { const max = Number(event.target.value); onChange({ ...rating, max, value: Math.min(rating.value, max) }); }}><option value={5}>{tr("Out of 5")}</option><option value={10}>{tr("Out of 10")}</option>{![5, 10].includes(rating.max) && <option value={rating.max}>{tr("Out of")} {rating.max}</option>}</select></label>
      </div>
    </div>;
  }
  if (type === "chart") {
    const chart = value as ChartValue;
    return <div className="visual-field-controls">
      {chart.segments.map((segment, index) => <div className="chart-input-row" key={segment.id}>
        <Input aria-label={label + " category " + (index + 1)} placeholder={tr("e.g. Learning")} value={segment.label} onChange={(event) => onChange({ ...chart, segments: chart.segments.map((item) => item.id === segment.id ? { ...item, label: event.target.value } : item) })} />
        <Input type="number" min={0} max={1_000_000} aria-label={label + " value " + (index + 1)} value={segment.value} onChange={(event) => onChange({ ...chart, segments: chart.segments.map((item) => item.id === segment.id ? { ...item, value: Math.min(1_000_000, Math.max(0, Number(event.target.value) || 0)) } : item) })} />
        <Button variant="icon" aria-label={"Remove " + (segment.label || "category " + (index + 1))} onClick={() => onChange({ ...chart, segments: chart.segments.filter((item) => item.id !== segment.id) })}><Trash2 size={14} /></Button>
      </div>)}
      <Button disabled={chart.segments.length >= 20} onClick={() => onChange({ ...chart, segments: [...chart.segments, { id: newId(), label: "", value: 1 }] })}><Plus size={14} /> {tr("Add category")}</Button>
      <p className="builder-hint">{tr("Use hours or any consistent unit. The chart shows each category’s share of the total.")}</p>
    </div>;
  }
  return <div className="visual-field-controls">
    {value && <img className="entry-image-thumbnail" src={value as string} alt={label} />}
    <div className="image-field-actions"><Button disabled={busy} onClick={() => input.current?.click()}><Upload size={14} />{busy ? tr("Preparing…") : value ? tr("Replace image") : tr("Upload image")}</Button>
      {value && <Button onClick={() => onChange("")}>{tr("Remove image")}</Button>}</div>
    <input className="hidden" ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label={"Choose " + label} onChange={async (event) => {
      const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
      setBusy(true); setError("");
      try { onChange(await preparePhoto(file)); } catch (error) { setError(error instanceof Error ? error.message : "This image couldn’t be opened."); } finally { setBusy(false); }
    }} />
    {error && <p role="alert" className="photo-error">{error}</p>}
  </div>;
}

