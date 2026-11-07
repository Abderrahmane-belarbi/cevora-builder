"use client";
import { t as tr } from "@/resume/locale";

import { useEffect, useRef, useState } from "react";
import { Camera, LoaderCircle, Trash2, Upload } from "lucide-react";
import { useResume } from "@/resume/store";
import { preparePhoto } from "@/resume/photo";
import { photoSchema } from "@/resume/model";
import { Button } from "../ui";

export function PhotoField() {
  const photo = useResume((s) => s.resume.personal.photo);
  const shape = useResume((s) => s.resume.design.photoShape);
  const edit = useResume((s) => s.edit);
  const replacement = useResume((s) => s.replacement);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  useEffect(() => () => { request.current++; }, []);

  return <div className="photo-field">
    <div className="photo-editor-row">
      <div className={"photo-thumbnail photo-" + shape}>
        {photo ? <img src={photo} alt="Your profile photo" width={60} height={60} /> : <Camera size={22} aria-hidden="true" />}
      </div>
      <div className="photo-editor-actions">
        <strong>{tr("Profile photo")} <span>{tr("Optional")}</span></strong>
        <div>
          <Button disabled={busy} onClick={() => input.current?.click()}>
            {busy ? <LoaderCircle className="spin" size={14} /> : <Upload size={14} />}
            {busy ? tr("Preparing…") : photo ? tr("Replace photo") : tr("Add photo")}
          </Button>
          {photo && <Button variant="icon" aria-label={tr("Remove profile photo")} title={tr("Remove profile photo")} disabled={busy} onClick={() => {
            request.current++;
            setError("");
            edit((r) => ({ ...r, personal: { ...r.personal, photo: null } }));
          }}><Trash2 size={15} /></Button>}
        </div>
      </div>
    </div>
    <input ref={input} type="file" className="hidden" accept="image/jpeg,image/png,image/webp" aria-label={tr("Choose profile photo")} disabled={busy} onChange={async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      const current = ++request.current;
      setBusy(true);
      setError("");
      try {
        const prepared = photoSchema.parse(await preparePhoto(file));
        // A reset/import while decoding must not receive an old photo.
        if (request.current === current && useResume.getState().replacement === replacement) {
          edit((r) => ({ ...r, personal: { ...r.personal, photo: prepared } }));
        }
      } catch (error) {
        if (request.current === current) setError(error instanceof Error ? error.message : "This photo couldn’t be opened.");
      } finally {
        if (request.current === current) setBusy(false);
      }
    }} />
    <p className="photo-hint">{tr("JPEG, PNG, or WebP · up to 10 MB. Center-cropped and saved only in this browser.")}</p>
    {photo && <fieldset className="photo-shape"><legend>{tr("Photo shape")}</legend>
      <div className="choice-row">{(["circle", "square"] as const).map((photoShape) => <label key={photoShape}>
        <input className="sr-only" type="radio" name="photoShape" checked={shape === photoShape} onChange={() => edit((r) => ({ ...r, design: { ...r.design, photoShape } }))} />
        <span>{tr(photoShape)}</span>
      </label>)}</div>
    </fieldset>}
    {error && <p className="photo-error" role="alert">{error}</p>}
  </div>;
}
