"use client";
import { t as tr } from "@/resume/locale";

import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List } from "lucide-react";
import { useEffect } from "react";
import type { RichText } from "@/resume/model";
import { Button } from "../ui";

const extensions = [StarterKit.configure({
  blockquote: false, code: false, codeBlock: false, hardBreak: false,
  heading: false, horizontalRule: false, link: false, orderedList: false,
  strike: false, underline: false, trailingNode: false,
})];

export function RichField({ label, value, onChange }: { label: string; value: RichText; onChange(value: RichText): void }) {
  const editor = useEditor({
    extensions, content: value, immediatelyRender: false,
    editorProps: { attributes: { role: "textbox", "aria-label": label, "aria-multiline": "true", dir: "auto" } },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as RichText),
  });
  useEffect(() => {
    if (editor) editor.view.dom.setAttribute("aria-label", label);
  }, [editor, label]);
  useEffect(() => {
    if (editor && JSON.stringify(editor.getJSON()) !== JSON.stringify(value)) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  const active = useEditorState({ editor, selector: ({ editor }) => ({
    bold: !!editor?.isActive("bold"), italic: !!editor?.isActive("italic"), list: !!editor?.isActive("bulletList"),
  }) });
  return <div className="rich-field">
    <div className="rich-toolbar" role="group" aria-label={label + " formatting"}>
      <Button variant="icon" title={tr("Bold")} aria-label={tr("Bold")} aria-pressed={active?.bold ?? false} disabled={!editor} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={15} /></Button>
      <Button variant="icon" title={tr("Italic")} aria-label={tr("Italic")} aria-pressed={active?.italic ?? false} disabled={!editor} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={15} /></Button>
      <span className="toolbar-rule" aria-hidden="true" />
      <Button variant="icon" title={tr("Bullet list")} aria-label={tr("Bullet list")} aria-pressed={active?.list ?? false} disabled={!editor} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={16} /></Button>
    </div>
    <EditorContent editor={editor} />
  </div>;
}
