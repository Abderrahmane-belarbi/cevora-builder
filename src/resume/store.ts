"use client";

import { create } from "zustand";
import { type Resume } from "./model";
import { resumeRepository } from "./repository";
import { emptyResume, sampleResume } from "./sample";

type SaveStatus = "loading" | "saving" | "saved" | "error";
type ResumeStore = {
  resume: Resume;
  ready: boolean;
  status: SaveStatus;
  message: string;
  replacement: number;
  pristine: boolean;
  past: Resume[];
  future: Resume[];
  initialize(): Promise<void>;
  edit(transform: (resume: Resume) => Resume, group?: string): void;
  replace(resume: Resume): void;
  undo(): void;
  redo(): void;
  flush(): void;
};

let timer: ReturnType<typeof setTimeout> | undefined;
let initialization: Promise<void> | undefined;
let inFlight = false;
let dirty = false;
let preserveStoredCopy = false;
let lastGroup = "";
let lastEditAt = 0;
function scheduleSave(flush: () => void) {
  if (preserveStoredCopy) return;
  dirty = true;
  clearTimeout(timer);
  timer = setTimeout(flush, 500);
}

export const useResume = create<ResumeStore>((set, get) => ({
  resume: emptyResume(), ready: false, status: "loading", message: "", replacement: 0,
  past: [], future: [],
  pristine: true,
  initialize() {
    return initialization ??= (async () => {
      try {
        const saved = await resumeRepository.loadResume();
        if (saved) {
          set({ resume: saved, ready: true, status: "saved", replacement: 1, pristine: false });
        } else {
          const language = window.localStorage.getItem("cevora.interface-language") === "ar" ? "ar" : "en";
          set({ resume: sampleResume(language), ready: true, status: "saving" });
          dirty = true;
          get().flush();
        }
      } catch {
        preserveStoredCopy = true;
        set({ ready: true, pristine: false, status: "error", message: "Saved data couldn’t be opened. Changes are kept in this tab. Export a JSON backup to keep them, or import or reset to start a new local copy." });
      }
    })();
  },
  edit(transform, group) {
    if (!get().ready) return;
    const old = get().resume;
    const resume = transform(old);
    if (resume === old) return;
    const coalesce = !!group && group === lastGroup && Date.now() - lastEditAt < 800;
    set({ resume, pristine: false, past: coalesce ? get().past : [...get().past, old].slice(-40), future: [] });
    lastGroup = group ?? "";
    lastEditAt = Date.now();
    if (preserveStoredCopy) return;
    set({ status: "saving", message: "" });
    scheduleSave(() => get().flush());
  },
  replace(resume) {
    preserveStoredCopy = false;
    set(({ replacement, past, resume: old }) => ({ resume, pristine: false, replacement: replacement + 1, status: "saving", message: "", past: [...past, old].slice(-40), future: [] }));
    lastGroup = "";
    scheduleSave(() => get().flush());
  },
  undo() {
    const { past, resume, future } = get();
    const previous = past.at(-1);
    if (!previous) return;
    set((state) => ({ resume: previous, past: past.slice(0, -1), future: [resume, ...future], replacement: state.replacement + 1,
      ...(preserveStoredCopy ? {} : { status: "saving" as const, message: "" }) }));
    lastGroup = "";
    scheduleSave(() => get().flush());
  },
  redo() {
    const { past, resume, future } = get();
    if (!future.length) return;
    set((state) => ({ resume: future[0], past: [...past, resume].slice(-40), future: future.slice(1), replacement: state.replacement + 1,
      ...(preserveStoredCopy ? {} : { status: "saving" as const, message: "" }) }));
    lastGroup = "";
    scheduleSave(() => get().flush());
  },
  flush() {
    clearTimeout(timer);
    timer = undefined;
    if (!dirty || inFlight || preserveStoredCopy) return;
    inFlight = true;
    dirty = false;
    void resumeRepository.saveResume(get().resume).then(() => {
      if (!dirty) set({ status: "saved", message: "" });
    }).catch(() => {
      if (!dirty) set({ status: "error", message: "This browser couldn’t save your résumé. Export a JSON backup to keep your changes." });
    }).finally(() => {
      inFlight = false;
      if (dirty && timer === undefined) get().flush();
    });
  },
}));
