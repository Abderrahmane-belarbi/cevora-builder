"use client";
import { t as tr } from "@/resume/locale";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AlertCircle, Check, CircleCheck, CloudOff, Download, Eye, FileCheck2, FileText, LayoutTemplate, LoaderCircle, LockKeyhole, PanelTop, Pencil, Redo2, SlidersHorizontal, Undo2, X } from "lucide-react";
import { useResume } from "@/resume/store";
import { paperSizes } from "@/resume/design";
import { Button, Tabs } from "./ui";
import { ContentPanel } from "./editor/content";
import { DesignPanel, TemplatePanel } from "./editor/design-panels";
import { DocumentActions } from "./editor/document-actions";
import { HtmlResume } from "./preview/html-resume";
import { useExport } from "./preview/use-export";
import { useDocumentUi } from "./editor/document-ui";
import { DocumentRemovalDialog, SectionPicker } from "./editor/section-picker";
import { DragPreview } from "./editor/drag-preview";
import { cancelPointerReorder } from "./editor/pointer-reorder";
import { useLocale } from "@/resume/locale";
import { LanguageControls } from "./editor/language-controls";
import { Brand } from "./brand";

const PdfPages = dynamic(() => import("./preview/pdf-pages").then((module) => module.PdfPages), {
  ssr: false, loading: () => <p className="pdf-render-state" role="status">{tr("Opening PDF preview…")}</p>,
});

const labels = { loading: "Loading résumé…", saving: "Saving…", saved: "Saved on this device", error: "Not saved" } as const;
export function Workspace() {
  const interfaceLanguage = useLocale((state) => state.language);
  const { resume, ready, status, message, initialize, edit, flush } = useResume();
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [activeTab, setActiveTab] = useState("content");
  const inlineEditing = useDocumentUi((state) => state.enabled);
  const requestForm = useDocumentUi((state) => state.requestForm);
  const announcement = useDocumentUi((state) => state.announcement);
  const canUndo = useResume((state) => state.past.length > 0);
  const canRedo = useResume((state) => state.future.length > 0);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const showMessage = useCallback((text: string, error = false) => setNotice({ text, error }), []);
  const exportPdf = useExport(resume);
  const exportError = (error: string) => showMessage(error, true);
  useEffect(() => {
    if (requestForm) { setActiveTab("content"); setMobileView("edit"); }
  }, [requestForm]);
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || (event.target as Element)?.closest?.('input,textarea,[contenteditable="true"]')) return;
      if (event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? useResume.getState().redo() : useResume.getState().undo(); }
      if (event.key.toLowerCase() === "y") { event.preventDefault(); useResume.getState().redo(); }
    }
    window.addEventListener("keydown", shortcut);
    return () => { window.removeEventListener("keydown", shortcut); cancelPointerReorder(); };
  }, []);

  useEffect(() => {
    useLocale.getState().initialize();
    void initialize();
    const onVisibility = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [initialize, flush]);

  useEffect(() => {
    if (!notice || notice.error) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    document.documentElement.lang = interfaceLanguage;
    document.documentElement.dir = interfaceLanguage === "ar" ? "rtl" : "ltr";
  }, [interfaceLanguage]);
  const previewActive = exportPdf.mode === "pdf" && exportPdf.preview;
  return <div className="workspace" lang={interfaceLanguage} dir={interfaceLanguage === "ar" ? "rtl" : "ltr"} data-mobile-view={mobileView}>
    <header className="topbar">
      <Brand />
      <div className="topbar-divider" />
      <label className="document-title">
        <input aria-label={tr("Document title")} value={resume.title} disabled={!ready} placeholder={tr("Untitled résumé")} onChange={(e) => edit((r) => ({ ...r, title: e.target.value }))} />
        <Pencil size={13} aria-hidden="true" />
      </label>
      <div className="topbar-end">
        <span className={"save-status save-" + status} role="status" title={tr(message || labels[status])}>
          {status === "saved" ? <CircleCheck size={15} /> : status === "error" ? <CloudOff size={16} /> : <LoaderCircle className="spin" size={15} />}
          <span>{tr(labels[status])}</span>
        </span>
        <div className="header-actions">
          <LanguageControls />
          <Button variant="icon" className="history-button" aria-label={tr("Undo change")} title={tr("Undo")} disabled={!canUndo} onClick={() => useResume.getState().undo()}><Undo2 size={16} /></Button>
          <Button variant="icon" className="history-button" aria-label={tr("Redo change")} title={tr("Redo")} disabled={!canRedo} onClick={() => useResume.getState().redo()}><Redo2 size={16} /></Button>
          {ready && <DocumentActions onMessage={showMessage} />}
          <Button className="download-button" variant="primary" disabled={!ready || !!exportPdf.busy} onClick={() => void exportPdf.run("download", exportError)}>
            {exportPdf.busy === "download" ? <LoaderCircle className="spin" size={16} /> : <Download size={16} />}
            <span>{exportPdf.busy === "download" ? tr("Generating…") : tr("Download PDF")}</span>
          </Button>
        </div>
      </div>
    </header>

    <div className="mobile-switch" role="group" aria-label="Workspace view">
      <Button variant="ghost" aria-pressed={mobileView === "edit"} onClick={() => setMobileView("edit")}><Pencil size={15} /> {tr("Edit")}</Button>
      <Button variant="ghost" aria-pressed={mobileView === "preview"} onClick={() => setMobileView("preview")}><Eye size={16} /> {tr("Preview")}</Button>
      <span className={"mobile-status save-" + status}>{tr(labels[status])}</span>
    </div>

    <main className="workspace-main">
      <aside className="edit-panel" aria-label="Résumé editor">
        <Tabs.Root dir={interfaceLanguage === "ar" ? "rtl" : "ltr"} className="editor-tabs" value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="editor-tab-list" aria-label="Editor controls">
            <Tabs.Trigger value="content"><FileText size={16} /> {tr("Content")}</Tabs.Trigger>
            <Tabs.Trigger value="template"><LayoutTemplate size={16} /> {tr("Template")}</Tabs.Trigger>
            <Tabs.Trigger value="design"><SlidersHorizontal size={16} /> {tr("Design")}</Tabs.Trigger>
          </Tabs.List>
          <div className="panel-scroll">
            {!ready ? <p className="panel-loading" role="status">{tr("Opening your résumé…")}</p> : <>
              <Tabs.Content value="content"><ContentPanel /></Tabs.Content>
              <Tabs.Content value="template"><TemplatePanel /></Tabs.Content>
              <Tabs.Content value="design"><DesignPanel /></Tabs.Content>
            </>}
          </div>
        </Tabs.Root>
        <div className="privacy-note"><LockKeyhole size={16} /><div><strong>{tr("Private by default")}</strong><p>{tr("Saved only in this browser. Clearing browser data can remove your résumé.")}</p></div></div>
      </aside>

      <section className="preview-panel" aria-label="Résumé preview">
        <div className="preview-toolbar">
          <div className="preview-title">
            <span className="preview-title-icon">{previewActive ? <FileCheck2 size={16} /> : <PanelTop size={16} />}</span>
            <strong>{previewActive ? tr("Export preview") : tr("Live preview")}</strong>
            <span className="paper-label">{paperSizes[(previewActive ? previewActive.snapshot : resume).design.paper].label}</span>
          </div>
          {previewActive ? <Button className="preview-button" onClick={() => exportPdf.setMode("live")}><Eye size={15} /> {tr("Live preview")}</Button> : <div className="live-preview-actions">
            <Button variant="ghost" className="preview-button" aria-pressed={inlineEditing} onClick={() => useDocumentUi.getState().setEnabled(!inlineEditing)}><Pencil size={14} /> {tr("Edit on page")}</Button>
            <Button className="preview-button" disabled={!ready || !!exportPdf.busy} onClick={() => void exportPdf.run("preview", exportError)}>
              {exportPdf.busy === "preview" ? <LoaderCircle className="spin" size={15} /> : <FileCheck2 size={15} />}
              {exportPdf.busy === "preview" ? tr("Generating…") : tr("Export preview")}
            </Button></div>}
        </div>

        {previewActive ? <div className="pdf-preview">
          <div className={"pdf-info" + (exportPdf.stale ? " pdf-outdated" : "")}>
            {exportPdf.stale ? <><AlertCircle size={16} /><span>{tr("Outdated preview. Your résumé has changed.")}</span><Button disabled={!!exportPdf.busy} onClick={() => void exportPdf.run("preview", exportError)}>{exportPdf.busy === "preview" ? tr("Generating…") : tr("Refresh preview")}</Button></>
              : <><Check size={16} /><span>{tr("This preview shows the actual PDF pages.")}</span></>}
            <a href={previewActive.url} target="_blank" rel="noreferrer">{tr("Open PDF")}</a>
          </div>
          <PdfPages key={previewActive.url} blob={previewActive.blob} />
        </div> : <div className="paper-scroll" onKeyDown={(event) => { if (event.key === "Escape" && !(event.target as Element).closest('[contenteditable="true"]')) useDocumentUi.getState().select(null); }}><HtmlResume resume={resume} editing={ready && inlineEditing} /><p className="preview-caption">{inlineEditing ? tr("Click text to edit · Drag handles to rearrange · Export preview shows page breaks") : tr("Live layout · Use export preview to check page breaks")}</p></div>}
      </section>
    </main>
    <SectionPicker /><DocumentRemovalDialog /><DragPreview />
    <p className="sr-only" role="status" aria-live="polite">{announcement}</p>

    {(notice || message) && <div className="notifications" aria-live="polite">
      {message && <div className="toast toast-error" role="alert"><AlertCircle size={17} /><span>{tr(message)}</span></div>}
      {notice && <div className={"toast" + (notice.error ? " toast-error" : "")} role={notice.error ? "alert" : "status"}>
        {notice.error ? <AlertCircle size={17} /> : <CircleCheck size={17} />}<span>{tr(notice.text)}</span>
        <Button variant="icon" aria-label={tr("Dismiss message")} onClick={() => setNotice(null)}><X size={15} /></Button>
      </div>}
    </div>}
  </div>;
}
