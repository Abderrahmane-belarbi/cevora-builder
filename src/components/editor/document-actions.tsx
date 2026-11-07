"use client";
import { t as tr } from "@/resume/locale";

import { useRef, useState } from "react";
import { Download, Ellipsis, RotateCcw, Upload } from "lucide-react";
import { downloadBlob, filename } from "@/resume/download";
import { parseResume, type Resume } from "@/resume/model";
import { sampleResume } from "@/resume/sample";
import { useResume } from "@/resume/store";
import { AlertDialog, Button, DropdownMenu } from "../ui";

type Pending = { type: "reset" } | { type: "import"; resume: Resume; name: string };

export function DocumentActions({ onMessage }: { onMessage(message: string, error?: boolean): void }) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const replace = useResume((s) => s.replace);
  const exportBackup = () => {
    try {
      const { resume } = useResume.getState();
      downloadBlob(new Blob([JSON.stringify(resume, null, 2)], { type: "application/json" }), filename(resume.title, "json"));
      onMessage("JSON backup downloaded.");
    } catch { onMessage("The backup couldn’t be downloaded. Please try again.", true); }
  };
  return <>
    <input ref={input} className="hidden" type="file" accept=".json,application/json" aria-label="Choose a résumé backup" onChange={async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      try { setPending({ type: "import", resume: parseResume(await file.text()), name: file.name }); }
      catch (error) { onMessage(error instanceof Error ? error.message : tr("The backup couldn’t be opened."), true); }
    }} />
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild><Button className="more-button" variant="icon" aria-label={tr("Document actions")} title={tr("Document actions")}><Ellipsis size={20} /></Button></DropdownMenu.Trigger>
      <DropdownMenu.Portal><DropdownMenu.Content className="action-menu" align="end" sideOffset={8}>
        <DropdownMenu.Label className="menu-label">{tr("DOCUMENT BACKUP")}</DropdownMenu.Label>
        <DropdownMenu.Item className="menu-item" onSelect={exportBackup}><Download size={15} /> {tr("Export JSON backup")}</DropdownMenu.Item>
        <DropdownMenu.Item className="menu-item" onSelect={() => input.current?.click()}><Upload size={15} /> {tr("Import JSON backup")}</DropdownMenu.Item>
        <DropdownMenu.Separator className="menu-rule" />
        <DropdownMenu.Item className="menu-item menu-danger" onSelect={() => setPending({ type: "reset" })}><RotateCcw size={15} /> {tr("Reset to sample résumé")}</DropdownMenu.Item>
      </DropdownMenu.Content></DropdownMenu.Portal>
    </DropdownMenu.Root>
    <AlertDialog.Root open={!!pending} onOpenChange={(open) => { if (!open) setPending(null); }}>
      <AlertDialog.Portal><AlertDialog.Overlay className="dialog-overlay" /><AlertDialog.Content className="dialog-content">
        <AlertDialog.Title>{pending?.type === "import" ? tr("Replace with this backup?") : tr("Reset to sample résumé?")}</AlertDialog.Title>
        <AlertDialog.Description>{pending?.type === "import"
          ? tr("Importing") + " “" + pending.name + "” " + tr("will replace your current résumé. You can export a backup of your current work first.")
          : tr("This will replace your current résumé with the original sample. You can export a backup of your current work first.")}</AlertDialog.Description>
        <div className="dialog-buttons">
          <AlertDialog.Cancel asChild><Button>{tr("Cancel")}</Button></AlertDialog.Cancel>
          <AlertDialog.Action asChild><Button variant="danger" onClick={() => {
            if (!pending) return;
            replace(pending.type === "import" ? pending.resume : sampleResume(useResume.getState().resume.design.language));
            onMessage(pending.type === "import" ? tr("Backup imported.") : tr("Sample résumé restored."));
            setPending(null);
          }}>{pending?.type === "import" ? tr("Replace résumé") : tr("Reset résumé")}</Button></AlertDialog.Action>
        </div>
      </AlertDialog.Content></AlertDialog.Portal>
    </AlertDialog.Root>
  </>;
}
