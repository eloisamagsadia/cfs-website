"use client";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState } from "react";

const B  = "var(--font-barlow,'Barlow',sans-serif)";
const SG = "var(--font-space-grotesk,'Space Grotesk',sans-serif)";

interface Props {
  value: string;
  onChange: (html: string) => void;
  variables?: { name: string; note?: string }[];
  placeholder?: string;
  minHeight?: number;
}

const btn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  minWidth: "30px", height: "30px", padding: "0 8px",
  background: "transparent", border: "1px solid transparent", borderRadius: "6px",
  cursor: "pointer", color: "#1B3A2D", fontFamily: SG, fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px",
  transition: "background 0.15s, border-color 0.15s",
};
const btnActive: React.CSSProperties = { ...btn, background: "#E8F0E4", borderColor: "#1A8040", color: "#1A8040" };
const sep: React.CSSProperties = { width: "1px", height: "20px", background: "#DDE8DD", margin: "0 4px" };

function ToolbarButton({ active, disabled, onClick, title, children }: { active?: boolean; disabled?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button type="button" title={title} onMouseDown={e => e.preventDefault()} onClick={onClick} disabled={disabled}
      style={{ ...(active ? btnActive : btn), opacity: disabled ? 0.4 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
      {children}
    </button>
  );
}

function Toolbar({ editor, variables }: { editor: Editor | null; variables?: Props["variables"] }) {
  if (!editor) return null;

  const insertLink = () => {
    const previous = editor.getAttributes("link").href ?? "";
    const url = window.prompt("URL (leave blank to remove):", previous);
    if (url === null) return;
    if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertImage = () => {
    const url = window.prompt("Image URL:");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  const insertVar = (name: string) => {
    editor.chain().focus().insertContent(`{{${name}}}`).run();
  };

  const setColor = (c: string) => {
    if (!c) editor.chain().focus().unsetColor().run();
    else editor.chain().focus().setColor(c).run();
  };

  const COLORS = ["#1B3A2D", "#1A8040", "#B78A1F", "#CC3344", "#5A7A60", "#7A5A0F"];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2px", padding: "8px 10px", background: "#F7FAF5", borderBottom: "1px solid #DDE8DD", borderTopLeftRadius: "8px", borderTopRightRadius: "8px" }}>
      <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><strong>B</strong></ToolbarButton>
      <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><em>I</em></ToolbarButton>
      <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><span style={{ textDecoration: "underline" }}>U</span></ToolbarButton>
      <ToolbarButton title="Strike" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><span style={{ textDecoration: "line-through" }}>S</span></ToolbarButton>

      <span style={sep} />

      <ToolbarButton title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</ToolbarButton>
      <ToolbarButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
      <ToolbarButton title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarButton>
      <ToolbarButton title="Paragraph" active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>P</ToolbarButton>

      <span style={sep} />

      <ToolbarButton title="Bulleted list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>•</ToolbarButton>
      <ToolbarButton title="Ordered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</ToolbarButton>
      <ToolbarButton title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>&ldquo;&rdquo;</ToolbarButton>

      <span style={sep} />

      <ToolbarButton title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>≡</ToolbarButton>
      <ToolbarButton title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>≣</ToolbarButton>
      <ToolbarButton title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>≢</ToolbarButton>

      <span style={sep} />

      <ToolbarButton title="Link" active={editor.isActive("link")} onClick={insertLink}>🔗</ToolbarButton>
      <ToolbarButton title="Insert image" onClick={insertImage}>🖼</ToolbarButton>
      <ToolbarButton title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>―</ToolbarButton>

      <span style={sep} />

      {COLORS.map(c => (
        <button key={c} type="button" title={`Color ${c}`} onMouseDown={e => e.preventDefault()} onClick={() => setColor(c)}
          style={{ width: "20px", height: "20px", borderRadius: "50%", background: c, border: "1.5px solid #ffffff", boxShadow: "0 0 0 1px #DDE8DD", cursor: "pointer", margin: "0 2px" }} />
      ))}
      <ToolbarButton title="Clear color" onClick={() => setColor("")}>⌀</ToolbarButton>

      {variables && variables.length > 0 && (
        <>
          <span style={sep} />
          <select onChange={e => { const v = e.target.value; if (v) insertVar(v); e.currentTarget.value = ""; }} defaultValue=""
            style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#1B3A2D", background: "#E8F0E4", border: "1.5px solid transparent", borderRadius: "6px", padding: "6px 8px", cursor: "pointer", letterSpacing: "1px" }}>
            <option value="">+ INSERT VAR</option>
            {variables.map(v => <option key={v.name} value={v.name}>{"{{"}{v.name}{"}}"} {v.note ? `— ${v.note}` : ""}</option>)}
          </select>
        </>
      )}

      <span style={{ marginLeft: "auto", display: "flex", gap: "2px" }}>
        <ToolbarButton title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>↶</ToolbarButton>
        <ToolbarButton title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>↷</ToolbarButton>
      </span>
    </div>
  );
}

export default function RichEmailEditor({ value, onChange, variables, placeholder, minHeight = 420 }: Props) {
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [rawHtml, setRawHtml] = useState(value);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener", target: "_blank" } }),
      Image.configure({ inline: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Placeholder.configure({ placeholder: placeholder ?? "Compose your email…" }),
    ],
    content: value,
    editorProps: {
      attributes: {
        style: `padding:18px 20px; min-height:${minHeight}px; outline:none; font-family:${B}; font-size:14px; line-height:1.6; color:#1B3A2D; background:#ffffff;`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      setRawHtml(html);
      onChange(html);
    },
    immediatelyRender: false,
  });

  // If the caller replaces `value` (loading a saved template) sync the editor.
  useEffect(() => {
    if (!editor) return;
    if (value === editor.getHTML()) return;
    editor.commands.setContent(value || "", { emitUpdate: false });
    setRawHtml(value);
  }, [value, editor]);

  const applyRawHtml = () => {
    if (!editor) return;
    editor.commands.setContent(rawHtml || "", { emitUpdate: false });
    onChange(rawHtml);
    setMode("visual");
  };

  return (
    <div style={{ border: "1.5px solid #DDE8DD", borderRadius: "10px", overflow: "hidden", background: "#ffffff" }}>
      {/* Mode toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "#F0F5F0", borderBottom: "1px solid #DDE8DD" }}>
        <div style={{ display: "flex", gap: "4px" }}>
          <button type="button" onClick={() => setMode("visual")}
            style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: mode === "visual" ? "#ffffff" : "#5A7A60", background: mode === "visual" ? "#1A8040" : "transparent", border: "1.5px solid " + (mode === "visual" ? "#1A8040" : "#DDE8DD"), borderRadius: "6px", padding: "5px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
            VISUAL
          </button>
          <button type="button" onClick={() => { setRawHtml(editor?.getHTML() ?? value); setMode("html"); }}
            style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: mode === "html" ? "#ffffff" : "#5A7A60", background: mode === "html" ? "#1A8040" : "transparent", border: "1.5px solid " + (mode === "html" ? "#1A8040" : "#DDE8DD"), borderRadius: "6px", padding: "5px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
            HTML
          </button>
        </div>
        {mode === "html" && (
          <button type="button" onClick={applyRawHtml}
            style={{ fontFamily: SG, fontSize: "10px", fontWeight: 700, color: "#ffffff", background: "#1A8040", border: "1.5px solid #1A8040", borderRadius: "6px", padding: "5px 12px", cursor: "pointer", letterSpacing: "1.2px" }}>
            APPLY HTML
          </button>
        )}
      </div>

      {mode === "visual" ? (
        <>
          <Toolbar editor={editor} variables={variables} />
          <div style={{ background: "#ffffff" }}>
            <EditorContent editor={editor} />
          </div>
        </>
      ) : (
        <textarea value={rawHtml} onChange={e => setRawHtml(e.target.value)} spellCheck={false}
          style={{ width: "100%", minHeight: `${minHeight + 40}px`, padding: "14px 16px", border: "none", outline: "none", background: "#ffffff", color: "#1B3A2D", fontFamily: "'SF Mono', ui-monospace, Menlo, monospace", fontSize: "12px", lineHeight: 1.55, resize: "vertical" as const, boxSizing: "border-box" as const, whiteSpace: "pre" as const }} />
      )}
    </div>
  );
}
