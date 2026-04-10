/**
 * Floating Toolbar - 텍스트 선택 시 미니 서식 도구 (lucide-react)
 */
import { memo, useState, useEffect, useRef, useCallback } from "react";
import {
  Bold, Italic, Underline, Strikethrough,
  Highlighter, Baseline, Link2,
  AlignLeft, AlignCenter, AlignRight,
  ChevronDown, MessageSquare,
} from "lucide-react";
import { RibbonBtn, DropdownButton, ColorGrid } from "./RibbonParts";
import { HIGHLIGHT_COLORS, TEXT_COLORS, FONT_LIST, FONT_SIZES } from "./constants";
import { showEditorAlert } from "./editorToast";

const I = 13;

/**
 * 텍스트 선택 시 표시되는 미니 서식 도구 모음 (볼드/이탤릭/밑줄/링크/댓글).
 * @param {{ editor: import("@tiptap/react").Editor, onInsertComment: Function }} props
 */
export const FloatingToolbar = memo(function FloatingToolbar({ editor, onInsertComment }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef(null);
  const hideTimer = useRef(null);

  const updatePosition = useCallback(() => {
    if (!editor) return;
    const { selection } = editor.state;
    if (selection.empty || !editor.isFocused) {
      setVisible(false);
      return;
    }

    try {
      const { from } = selection;
      const start = editor.view.coordsAtPos(from);
      // Walk up DOM tree to find the scroll container
      let scrollParent = editor.view.dom.parentElement;
      while (scrollParent && !scrollParent.classList.contains("editor-canvas-scroll")) {
        scrollParent = scrollParent.parentElement;
      }
      if (!scrollParent) {
        // Fallback: use editor DOM parent
        scrollParent = editor.view.dom.closest("[class*='editor']")?.parentElement;
      }
      if (!scrollParent) { setVisible(false); return; }
      const scrollRect = scrollParent.getBoundingClientRect();

      const top = start.top - scrollRect.top - 48;
      const left = Math.max(10, Math.min(start.left - scrollRect.left, scrollRect.width - 380));

      if (top < 0 || top > scrollRect.height) { setVisible(false); return; }
      setPosition({ top, left });
      setVisible(true);
    } catch {
      setVisible(false);
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const onSelectionUpdate = () => {
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(updatePosition, 150);
    };
    const onBlur = () => {
      hideTimer.current = setTimeout(() => {
        if (!toolbarRef.current?.contains(document.activeElement)) setVisible(false);
      }, 300);
    };
    editor.on("selectionUpdate", onSelectionUpdate);
    editor.on("blur", onBlur);
    return () => {
      editor.off("selectionUpdate", onSelectionUpdate);
      editor.off("blur", onBlur);
      clearTimeout(hideTimer.current);
    };
  }, [editor, updatePosition]);

  if (!visible || !editor) return null;

  // Safe wrappers — prevent crash when marks (e.g. comment) cause isActive/getAttributes to throw
  const safeIsActive = (...args) => { try { return editor.isActive(...args); } catch { return false; } };
  const safeGetAttr = (name) => { try { return editor.getAttributes(name); } catch { return {}; } };

  const textColor = safeGetAttr("textStyle").color || "#333";
  const headingVal = safeIsActive("heading", { level: 1 }) ? "1"
    : safeIsActive("heading", { level: 2 }) ? "2"
    : safeIsActive("heading", { level: 3 }) ? "3" : "0";

  return (
    <div ref={toolbarRef} className="floating-toolbar"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.preventDefault()}>
      {/* 글꼴 및 크기 선택 */}
      <select value={(() => {
        const ff = safeGetAttr("textStyle").fontFamily;
        if (!ff) return "malgun";
        const found = FONT_LIST.find(f => ff.includes(f.label) || ff.includes(f.family.split(",")[0].replace(/'/g, "")));
        return found?.value || "malgun";
      })()} onChange={(e) => {
        const font = FONT_LIST.find(f => f.value === e.target.value);
        if (font) editor.chain().focus().setFontFamily(font.family).run();
      }} style={{ height: 22, fontSize: 10, border: "1px solid #d5d5d5", borderRadius: 3, padding: "0 2px", cursor: "pointer", background: "#fff", maxWidth: 80 }}>
        {FONT_LIST.slice(0, 12).map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
      <select value={(() => {
        const fs = safeGetAttr("textStyle").fontSize;
        return fs ? fs.replace("pt", "").replace("px", "") : "11";
      })()} onChange={(e) => editor.chain().focus().setFontSize(e.target.value + "pt").run()}
        style={{ height: 22, fontSize: 10, border: "1px solid #d5d5d5", borderRadius: 3, padding: "0 2px", cursor: "pointer", background: "#fff", width: 36 }}>
        {FONT_SIZES.map(s => <option key={s} value={String(s)}>{s}</option>)}
      </select>

      <span style={{ width: 1, height: 16, background: "#ddd", margin: "0 3px" }} />

      <RibbonBtn active={safeIsActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="굵게" small>
        <Bold size={I} strokeWidth={3} />
      </RibbonBtn>
      <RibbonBtn active={safeIsActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="기울임" small>
        <Italic size={I} />
      </RibbonBtn>
      <RibbonBtn active={safeIsActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="밑줄" small>
        <Underline size={I} />
      </RibbonBtn>
      <RibbonBtn active={safeIsActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="취소선" small>
        <Strikethrough size={I} />
      </RibbonBtn>

      <span style={{ width: 1, height: 16, background: "#ddd", margin: "0 3px" }} />

      <DropdownButton trigger={
        <RibbonBtn active={safeIsActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight({ color: "#fef3b5" }).run()} title="강조" small>
          <Highlighter size={12} />
        </RibbonBtn>
      }>
        <div style={{ padding: 6 }}>
          <ColorGrid colors={HIGHLIGHT_COLORS} onChange={(c) => editor.chain().focus().toggleHighlight({ color: c }).run()} columns={5} />
        </div>
      </DropdownButton>

      <DropdownButton trigger={
        <RibbonBtn title="글꼴 색" small>
          <Baseline size={I} color={textColor} strokeWidth={2.5} />
        </RibbonBtn>
      }>
        <div style={{ padding: 6 }}>
          <ColorGrid colors={TEXT_COLORS.slice(0, 40)} onChange={(c) => editor.chain().focus().setColor(c).run()} columns={10} />
        </div>
      </DropdownButton>

      <span style={{ width: 1, height: 16, background: "#ddd", margin: "0 3px" }} />

      <select value={headingVal} onChange={(e) => {
        const v = parseInt(e.target.value);
        if (v === 0) editor.chain().focus().setParagraph().run();
        else editor.chain().focus().toggleHeading({ level: v }).run();
      }} style={{ height: 22, fontSize: 10, border: "1px solid #d5d5d5", borderRadius: 3, padding: "0 3px", cursor: "pointer", background: "#fff" }}>
        <option value="0">본문</option>
        <option value="1">제목 1</option>
        <option value="2">제목 2</option>
        <option value="3">제목 3</option>
      </select>

      <span style={{ width: 1, height: 16, background: "#ddd", margin: "0 3px" }} />

      <RibbonBtn active={safeIsActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="왼쪽" small>
        <AlignLeft size={11} />
      </RibbonBtn>
      <RibbonBtn active={safeIsActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="가운데" small>
        <AlignCenter size={11} />
      </RibbonBtn>
      <RibbonBtn active={safeIsActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="오른쪽" small>
        <AlignRight size={11} />
      </RibbonBtn>

      <span style={{ width: 1, height: 16, background: "#ddd", margin: "0 3px" }} />

      <RibbonBtn active={safeIsActive("link")} onClick={() => {
        const prev = safeGetAttr("link").href || "";
        const url = window.prompt("URL:", prev);
        if (url === null) return;
        if (!url) editor.chain().focus().unsetLink().run();
        else {
          try {
            const parsed = new URL(url, window.location.origin);
            if (!["http:", "https:"].includes(parsed.protocol)) { showEditorAlert("유효하지 않은 URL입니다."); return; }
          } catch { showEditorAlert("유효하지 않은 URL입니다."); return; }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }
      }} title="링크" small>
        <Link2 size={12} />
      </RibbonBtn>

      <span style={{ width: 1, height: 16, background: "#ddd", margin: "0 3px" }} />

      <RibbonBtn onClick={() => onInsertComment?.()} title="새 메모 (Ctrl+Alt+M)" small>
        <MessageSquare size={12} />
      </RibbonBtn>
    </div>
  );
});
