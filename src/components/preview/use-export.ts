"use client";

import { useEffect, useRef, useState } from "react";
import { downloadBlob, filename } from "@/resume/download";
import type { Resume } from "@/resume/model";

export function useExport(resume: Resume) {
  const [busy, setBusy] = useState<"preview" | "download" | null>(null);
  const [preview, setPreview] = useState<{ url: string; blob: Blob; snapshot: Resume } | null>(null);
  const [mode, setMode] = useState<"live" | "pdf">("live");
  const lock = useRef(false);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  const stale = !!preview && preview.snapshot !== resume;

  async function run(action: "preview" | "download", onError: (message: string) => void) {
    if (lock.current) return;
    lock.current = true;
    setBusy(action);
    const snapshot = resume;
    try {
      const blob = preview?.snapshot === snapshot ? preview.blob : await (await import("./pdf-resume")).generatePdf(snapshot);
      if (action === "download") downloadBlob(blob, filename(snapshot.title, "pdf"));
      else {
        if (preview?.snapshot !== snapshot) setPreview({ url: URL.createObjectURL(blob), blob, snapshot });
        setMode("pdf");
      }
    } catch {
      onError("The PDF couldn’t be generated. Please try again.");
    } finally {
      setBusy(null);
      lock.current = false;
    }
  }
  return { mode, setMode, preview, stale, busy, run };
}
