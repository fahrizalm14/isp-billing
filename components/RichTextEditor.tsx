"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  minHeight?: number; // px
}

export default function RichTextEditor({
  value,
  onChange,
  className,
  minHeight = 160, // awal ketik tidak 1 baris
}: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false, // fix SSR hydration
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", {});
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className={`border rounded-md p-2 ${className ?? ""}`}>
      {/* Toolbar minimal ala WhatsApp: Bold, Italic, List */}
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 rounded text-sm ${
            editor.isActive("bold")
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 rounded text-sm ${
            editor.isActive("italic")
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 rounded text-sm ${
            editor.isActive("bulletList")
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          • List
        </button>
      </div>

      <EditorContent
        editor={editor}
        className="outline-none px-2"
        style={{ minHeight }}
      />
    </div>
  );
}
