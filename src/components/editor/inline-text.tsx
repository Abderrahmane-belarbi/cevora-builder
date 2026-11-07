"use client";
import { t as tr } from "@/resume/locale";

import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List } from "lucide-react";
import type { RichText } from "@/resume/model";
import { Button } from "../ui";

export function InlineText({ value, label, placeholder, onChange, className = "", focusVersion = 0, focus = false }: {
  value: string; label: string; placeholder?: string; onChange(value: string): void; className?: string; focusVersion?: number; focus?: boolean;
}) {
  const element = useRef<HTMLSpanElement>(null);
  const initial = useRef(value);
  const before = useRef(value);
  const composing = useRef(false);
  useEffect(() => {
    if (element.current && document.activeElement !== element.current && element.current.textContent !== value) element.current.textContent = value;
  }, [value]);
  useEffect(() => {
    if (focus && element.current && document.activeElement !== element.current) element.current.focus();
  }, [focusVersion, focus]);
  return <span ref={element} role="textbox" aria-label={label} contentEditable suppressContentEditableWarning
    spellCheck data-placeholder={placeholder ?? label} className={"inline-text " + className}
    onFocus={() => { before.current = element.current?.textContent ?? ""; }}
    onCompositionStart={() => { composing.current = true; }} onCompositionEnd={() => { composing.current = false; onChange(element.current?.textContent ?? ""); }}
    onInput={() => { if (!composing.current) onChange(element.current?.textContent ?? ""); }}
    onKeyDown={(event) => {
      if (event.key === "Enter" && !composing.current) { event.preventDefault(); element.current?.blur(); }
      if (event.key === "Escape") { event.preventDefault(); if (element.current) element.current.textContent = before.current; onChange(before.current); element.current?.blur(); }
    }}
    onPaste={(event) => {
      event.preventDefault();
      const text = event.clipboardData.getData("text/plain").replace(/[\r\n]+/g, " ");
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;
      const range = selection.getRangeAt(0); range.deleteContents();
      const node = document.createTextNode(text); range.insertNode(node); range.setStartAfter(node); range.collapse(true);
      selection.removeAllRanges(); selection.addRange(range);
      onChange(element.current?.textContent ?? "");
    }}>{initial.current}</span>;
}

const extensions = [StarterKit.configure({
  blockquote: false, code: false, codeBlock: false, hardBreak: false, heading: false, horizontalRule: false,
  link: false, orderedList: false, strike: false, underline: false, trailingNode: false,
})];
export function InlineRichText({ value, label, onChange }: { value: RichText; label: string; onChange(value: RichText): void }) {
  const editor = useEditor({
    extensions, content: value, immediatelyRender: false,
    editorProps: { attributes: { role: "textbox", "aria-label": label, "aria-multiline": "true", class: "inline-prose" } },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as RichText),
    onCreate: ({ editor }) => { editor.commands.focus("end"); },
  });
  useEffect(() => {
    if (editor && JSON.stringify(editor.getJSON()) !== JSON.stringify(value)) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);
  useEffect(() => { editor?.view.dom.setAttribute("aria-label", label); }, [editor, label]);
  const state = useEditorState({ editor, selector: ({ editor }) => ({ bold: editor?.isActive("bold") ?? false, italic: editor?.isActive("italic") ?? false, bullet: editor?.isActive("bulletList") ?? false }) });
  return <div className="inline-rich-editor">
    <div className="inline-format-toolbar" role="group" aria-label={"Formatting — " + label}>
      <Button variant="icon" aria-label={tr("Bold")} aria-pressed={state?.bold ?? false} onMouseDown={(event) => event.preventDefault()} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={14} /></Button>
      <Button variant="icon" aria-label={tr("Italic")} aria-pressed={state?.italic ?? false} onMouseDown={(event) => event.preventDefault()} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={14} /></Button>
      <Button variant="icon" aria-label={tr("Bullet list")} aria-pressed={state?.bullet ?? false} onMouseDown={(event) => event.preventDefault()} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={15} /></Button>
    </div>
    <EditorContent editor={editor} />
  </div>;
}

