"use client";

import { create } from "zustand";
export type Selection = { sectionId: string; itemId?: string; fieldId?: string };
export type Dragged = { type: "section"; sectionId: string } | { type: "item"; sectionId: string; itemId: string };
export type DropTarget = { type: "item"; sectionId: string; itemId: string; after: boolean } | { type: "section"; sectionId: string; column: 0 | 1; after: boolean } | { type: "column"; column: 0 | 1 };
type Ui = {
  enabled: boolean; selection: Selection | null; dragged: Dragged | null;
  dropTarget: DropTarget | null; dragPoint: { x: number; y: number } | null;
  setDropTarget(target: DropTarget | null, point: { x: number; y: number } | null): void;
  picker: { column: 0 | 1; afterId?: string } | null;
  removal: { sectionId: string; itemId?: string } | null;
  focusVersion: number;
  announcement: string;
  announce(message: string): void;
  select(selection: Selection | null): void;
  focus(selection: Selection): void;
  setEnabled(enabled: boolean): void;
  setDragged(dragged: Dragged | null): void;
  openPicker(column?: 0 | 1, afterId?: string): void;
  closePicker(): void;
  requestRemoval(sectionId: string, itemId?: string): void;
  cancelRemoval(): void;
  requestForm: { sectionId: string; version: number } | null;
  editForm(sectionId: string): void;
};
export const useDocumentUi = create<Ui>((set) => ({
  enabled: true, selection: null, dragged: null, dropTarget: null, dragPoint: null, picker: null, removal: null, focusVersion: 0, requestForm: null, announcement: "",
  select: (selection) => set({ selection }),
  focus: (selection) => set((state) => ({ selection, focusVersion: state.focusVersion + 1 })),
  setEnabled: (enabled) => set({ enabled, selection: null }),
  setDragged: (dragged) => set((state) => ({ dragged, announcement: dragged ? "Dragging " + dragged.type + ". Drop to rearrange." : state.announcement.startsWith("Dragging") ? "Reordering finished." : state.announcement })),
  announce: (announcement) => set({ announcement }),
  setDropTarget: (dropTarget, dragPoint) => set((state) => {
    const same = JSON.stringify(state.dropTarget) === JSON.stringify(dropTarget);
    if (same && state.dragPoint?.x === dragPoint?.x && state.dragPoint?.y === dragPoint?.y) return state;
    return { dropTarget: same ? state.dropTarget : dropTarget, dragPoint };
  }),
  openPicker: (column = 0, afterId) => set({ picker: { column, afterId } }),
  closePicker: () => set({ picker: null }),
  requestRemoval: (sectionId, itemId) => set({ removal: { sectionId, itemId } }),
  cancelRemoval: () => set({ removal: null }),
  editForm: (sectionId) => set((state) => ({ requestForm: { sectionId, version: (state.requestForm?.version ?? 0) + 1 } })),
}));

