"use client";
import { t as tr } from "@/resume/locale";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "../ui";

GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
const documentBase = () => window.location.origin + window.location.pathname.replace(/\/?$/, "/");

export function PdfPages({ blob }: { blob: Blob }) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [rendered, setRendered] = useState(0);
  const [error, setError] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let active = true;
    let task: ReturnType<typeof getDocument> | undefined;
    void blob.arrayBuffer().then(async (data) => {
      if (!active) return;
      // Draw embedded glyph paths so the preview matches PDF readers even when
      // a browser's downloadable-font sanitizer rejects a generated font subset.
      task = getDocument({ data, disableFontFace: true, useSystemFonts: false,
        standardFontDataUrl: new URL("pdf-standard-fonts/", documentBase()).href });
      const loaded = await task.promise;
      if (active) setDocument(loaded);
    }).catch(() => {
      if (active) setError("This PDF couldn’t be displayed here. Use Open PDF to view it.");
    });
    return () => {
      active = false;
      void task?.destroy().catch(() => undefined);
    };
  }, [blob]);

  useEffect(() => {
    if (!document || !canvas.current) return;
    const element = canvas.current;
    let active = true;
    let task: ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]> | undefined;
    void document.getPage(page).then(async (pdfPage) => {
      if (!active) return;
      const viewport = pdfPage.getViewport({ scale: 1.8 });
      element.width = Math.ceil(viewport.width);
      element.height = Math.ceil(viewport.height);
      task = pdfPage.render({ canvas: element, viewport });
      await task.promise;
      if (active) setRendered(page);
    }).catch(() => {
      if (active) setError("This PDF page couldn’t be displayed here. Use Open PDF to view it.");
    });
    return () => { active = false; task?.cancel(); };
  }, [document, page]);

  const busy = !error && rendered !== page;
  return <div className="pdf-viewer" aria-busy={busy}>
    {document && <div className="pdf-navigation" aria-label="PDF page controls" role="group">
      <Button variant="icon" aria-label={tr("Previous page")} disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={17} /></Button>
      <span aria-live="polite">{tr("Page")} {page} {tr("of")} {document.numPages}</span>
      <Button variant="icon" aria-label={tr("Next page")} disabled={page === document.numPages} onClick={() => setPage((p) => p + 1)}><ChevronRight size={17} /></Button>
    </div>}
    <div className="pdf-sheet-scroll" key={error || "canvas"}>
      {error && <p className="pdf-render-state" role="alert">{error}</p>}
      {busy && <p className="pdf-render-state" role="status"><LoaderCircle className="spin" size={16} /> {tr("Rendering PDF page…")}</p>}
      <canvas ref={canvas} hidden={!!error || busy} className="pdf-sheet" role="img" aria-label={"Generated résumé PDF, page " + page} />
    </div>
  </div>;
}
