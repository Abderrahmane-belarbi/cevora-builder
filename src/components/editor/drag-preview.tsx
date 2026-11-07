"use client";
import { t as tr } from "@/resume/locale";

import { GripVertical } from "lucide-react";
import { useDocumentUi } from "./document-ui";
import { useResume } from "@/resume/store";
export function DragPreview() {
  const point = useDocumentUi((state) => state.dragPoint);
  const dragged = useDocumentUi((state) => state.dragged);
  const title = useResume((state) => state.resume.sections.find((section) => section.id === dragged?.sectionId)?.name ?? "");
  return point && dragged ? <div className="document-drag-preview" style={{ left: Math.min(point.x + 12, window.innerWidth - 200), top: point.y + 12 }}><GripVertical size={15} /><span>{dragged.type === "item" ? "Move entry" : "Move section"}<small>{title}</small></span></div> : null;
}

