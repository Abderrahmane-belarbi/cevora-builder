"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { dropItem, dropSection } from "@/resume/operations";
import { useResume } from "@/resume/store";
import { useDocumentUi, type Dragged, type DropTarget } from "./document-ui";

let activeCancel: (() => void) | undefined;
export function cancelPointerReorder() { activeCancel?.(); }

function targetAt(x: number, y: number, source: Dragged): DropTarget | null {
  const element = document.elementFromPoint(x, y);
  const section = element?.closest<HTMLElement>("[data-document-section]");
  if (source.type === "item") {
    const item = element?.closest<HTMLElement>("[data-document-item]");
    if (!item || !section || section.dataset.documentSection !== source.sectionId || item.dataset.documentItem === source.itemId) return null;
    const rect = item.getBoundingClientRect();
    return { type: "item", sectionId: source.sectionId, itemId: item.dataset.documentItem!, after: y > rect.top + rect.height / 2 };
  }
  if (section) {
    if (section.dataset.documentSection === source.sectionId) return null;
    const model = useResume.getState().resume.sections.find((item) => item.id === section.dataset.documentSection);
    if (!model) return null;
    const rect = section.getBoundingClientRect();
    return { type: "section", sectionId: model.id, column: model.column, after: y > rect.top + rect.height / 2 };
  }
  const column = element?.closest<HTMLElement>("[data-document-column]")?.dataset.documentColumn;
  return column === "0" || column === "1" ? { type: "column", column: Number(column) as 0 | 1 } : null;
}

/** Pointer-based sorting supports mouse, touch and pen without native HTML drag state. */
export function startPointerReorder(event: ReactPointerEvent<HTMLElement>, source: Dragged) {
  if (event.button !== 0) return;
  activeCancel?.();
  event.preventDefault(); event.stopPropagation();
  const origin = { x: event.clientX, y: event.clientY };
  let point = origin, started = false, frame = 0, finished = false;
  const scroll = event.currentTarget.closest<HTMLElement>(".paper-scroll");
  function updateTarget() {
    if (!started || finished) return;
    useDocumentUi.getState().setDropTarget(targetAt(point.x, point.y, source), point);
    if (scroll) {
      const rect = scroll.getBoundingClientRect();
      if (point.y < rect.top + 42) scroll.scrollTop -= 8;
      if (point.y > rect.bottom - 42) scroll.scrollTop += 8;
    }
    frame = window.requestAnimationFrame(updateTarget);
  }
  function move(event: PointerEvent) {
    point = { x: event.clientX, y: event.clientY };
    if (!started && Math.hypot(point.x - origin.x, point.y - origin.y) >= 4) {
      started = true; useDocumentUi.getState().setDragged(source); frame = window.requestAnimationFrame(updateTarget);
    }
    if (started) event.preventDefault();
  }
  function cleanup() {
    if (finished) return; finished = true;
    window.cancelAnimationFrame(frame);
    window.removeEventListener("pointermove", move, true);
    window.removeEventListener("pointerup", up, true);
    window.removeEventListener("pointercancel", cancel, true);
    window.removeEventListener("keydown", key, true);
    useDocumentUi.getState().setDragged(null);
    useDocumentUi.getState().setDropTarget(null, null);
    activeCancel = undefined;
  }
  function cancel() { cleanup(); }
  function key(event: KeyboardEvent) { if (event.key === "Escape") { event.preventDefault(); cancel(); } }
  function up(event: PointerEvent) {
    if (started) {
      const target = targetAt(event.clientX, event.clientY, source);
      if (source.type === "item" && target?.type === "item") {
        useResume.getState().edit((resume) => dropItem(resume, source.sectionId, source.itemId, target.itemId, target.after));
        useDocumentUi.getState().announce("Entry reordered.");
      } else if (source.type === "section" && target && target.type !== "item") {
        useResume.getState().edit((resume) => dropSection(resume, source.sectionId, target.column, target.type === "section" ? target.sectionId : undefined, target.type === "section" && target.after));
        useDocumentUi.getState().announce("Section reordered.");
      }
    }
    cleanup();
  }
  activeCancel = cancel;
  window.addEventListener("pointermove", move, { capture: true, passive: false });
  window.addEventListener("pointerup", up, true);
  window.addEventListener("pointercancel", cancel, true);
  window.addEventListener("keydown", key, true);
}

