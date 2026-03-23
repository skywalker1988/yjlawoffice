/**
 * Right-click Context Menu - MS Word style
 */
import { useState, useEffect, useRef } from "react";
import {
  Scissors, Copy, ClipboardPaste, Bold, Italic, Underline,
  Link2, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table2, Image as ImageIcon, Trash2,
  RotateCcw, RotateCw, Paintbrush,
  Heading1, Heading2, Heading3, Minus, Indent, Outdent,
  MessageSquare, Reply, Check,
} from "lucide-react";
import { createComment } from "./comment-store";

const ICON_SIZE = 14;

function MenuItem({ icon, label, shortcut, onClick, danger, disabled, dividerAfter }) {
  return (
    <>
      <button
        type="button"
        className="ctx-menu-item"
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); if (!disabled) onClick?.(); }}
        disabled={disabled}
        style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          padding: "6px 12px 6px 8px", border: "none",
          background: "transparent", cursor: disabled ? "default" : "pointer",
          fontSize: 12, textAlign: "left", color: danger ? "#dc2626" : disabled ? "#bbb" : "#333",
          fontFamily: "'Segoe UI', '맑은 고딕', sans-serif",
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "#eff6ff"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{ width: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon}
        </span>
        <span style={{ flex: 1 }}>{label}</span>
        {shortcut && <span style={{ fontSize: 10, color: "#999", marginLeft: 12 }}>{shortcut}</span>}
      </button>
      {dividerAfter && <div style={{ height: 1, background: "#e5e5e5", margin: "3px 0" }} />}
    </>
  );
}

function SubMenu({ icon, label, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  return (
    <div ref={ref} style={{ position: "relative" }}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button" className="ctx-menu-item"
        style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          padding: "6px 12px 6px 8px", border: "none",
          background: "transparent", cursor: "pointer",
          fontSize: 12, textAlign: "left", color: "#333",
          fontFamily: "'Segoe UI', '맑은 고딕', sans-serif",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      >
        <span style={{ width: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        <span style={{ fontSize: 10, color: "#999" }}>▶</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", left: "100%", top: -4,
          background: "#fff", border: "1px solid #d1d5db", borderRadius: 4,
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 160,
          padding: "4px 0", zIndex: 10,
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

export function ContextMenu({ editor, onOpenFontDialog, onOpenParagraphDialog, onOpenHyperlinkDialog, onOpenTableDialog, onInsertComment, commentStore, commentDispatch, commentAuthor }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);

  useEffect(() => {
    if (!editor) return;

    const handleContextMenu = (e) => {
      // Only handle right-click inside the editor
      if (!editor.view.dom.contains(e.target)) return;
      e.preventDefault();
      e.stopPropagation();

      const x = Math.min(e.clientX, window.innerWidth - 220);
      const y = Math.min(e.clientY, window.innerHeight - 400);
      setPosition({ x, y });
      setVisible(true);
    };

    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setVisible(false);
      }
    };

    const handleScroll = () => setVisible(false);

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [editor]);

  const close = () => setVisible(false);

  if (!visible || !editor) return null;

  const hasSelection = !editor.state.selection.empty;
  const isTable = editor.isActive("table");
  const isLink = editor.isActive("link");
  const isImage = editor.isActive("image");

  const exec = (fn) => { fn(); close(); };

  return (
    <div ref={menuRef} style={{
      position: "fixed", left: position.x, top: position.y, zIndex: 5000,
      background: "#fff", border: "1px solid #d1d5db", borderRadius: 6,
      boxShadow: "0 6px 24px rgba(0,0,0,0.15)", minWidth: 200,
      padding: "4px 0", animation: "ctxIn 0.1s ease-out",
    }}>
      {/* Undo / Redo */}
      <MenuItem icon={<RotateCcw size={ICON_SIZE} />} label="실행 취소" shortcut="Ctrl+Z"
        onClick={() => exec(() => editor.chain().focus().undo().run())}
        disabled={!editor.can().undo()} />
      <MenuItem icon={<RotateCw size={ICON_SIZE} />} label="다시 실행" shortcut="Ctrl+Y"
        onClick={() => exec(() => editor.chain().focus().redo().run())}
        disabled={!editor.can().redo()} dividerAfter />

      {/* Cut / Copy / Paste */}
      <MenuItem icon={<Scissors size={ICON_SIZE} />} label="잘라내기" shortcut="Ctrl+X"
        onClick={() => exec(() => {
          const { from, to } = editor.state.selection;
          const text = editor.state.doc.textBetween(from, to, "\n");
          navigator.clipboard.writeText(text).then(() => {
            editor.chain().focus().deleteSelection().run();
          }).catch(() => document.execCommand("cut"));
        })}
        disabled={!hasSelection} />
      <MenuItem icon={<Copy size={ICON_SIZE} />} label="복사" shortcut="Ctrl+C"
        onClick={() => exec(() => {
          const { from, to } = editor.state.selection;
          const text = editor.state.doc.textBetween(from, to, "\n");
          navigator.clipboard.writeText(text).catch(() => document.execCommand("copy"));
        })}
        disabled={!hasSelection} />
      <MenuItem icon={<ClipboardPaste size={ICON_SIZE} />} label="붙여넣기" shortcut="Ctrl+V"
        onClick={() => exec(() => {
          navigator.clipboard.readText().then(t => {
            editor.chain().focus().insertContent(t).run();
          }).catch(() => {});
        })} />
      <MenuItem icon={<ClipboardPaste size={ICON_SIZE} />} label="서식 없이 붙여넣기" shortcut="Ctrl+Shift+V"
        onClick={() => exec(() => {
          navigator.clipboard.readText().then(t => {
            // Insert as plain text (no formatting)
            editor.chain().focus().insertContent({ type: "text", text: t }).run();
          }).catch(() => {});
        })} dividerAfter />

      {/* Formatting */}
      {hasSelection && (
        <>
          <MenuItem icon={<Bold size={ICON_SIZE} />} label="굵게" shortcut="Ctrl+B"
            onClick={() => exec(() => editor.chain().focus().toggleBold().run())} />
          <MenuItem icon={<Italic size={ICON_SIZE} />} label="기울임" shortcut="Ctrl+I"
            onClick={() => exec(() => editor.chain().focus().toggleItalic().run())} />
          <MenuItem icon={<Underline size={ICON_SIZE} />} label="밑줄" shortcut="Ctrl+U"
            onClick={() => exec(() => editor.chain().focus().toggleUnderline().run())} dividerAfter />
        </>
      )}

      {/* Alignment submenu */}
      <SubMenu icon={<AlignLeft size={ICON_SIZE} />} label="단락 정렬">
        <MenuItem icon={<AlignLeft size={ICON_SIZE} />} label="왼쪽 맞춤"
          onClick={() => exec(() => editor.chain().focus().setTextAlign("left").run())} />
        <MenuItem icon={<AlignCenter size={ICON_SIZE} />} label="가운데 맞춤"
          onClick={() => exec(() => editor.chain().focus().setTextAlign("center").run())} />
        <MenuItem icon={<AlignRight size={ICON_SIZE} />} label="오른쪽 맞춤"
          onClick={() => exec(() => editor.chain().focus().setTextAlign("right").run())} />
        <MenuItem icon={<AlignJustify size={ICON_SIZE} />} label="양쪽 맞춤"
          onClick={() => exec(() => editor.chain().focus().setTextAlign("justify").run())} />
      </SubMenu>

      {/* Heading submenu */}
      <SubMenu icon={<Type size={ICON_SIZE} />} label="스타일">
        <MenuItem icon={<Type size={ICON_SIZE} />} label="본문"
          onClick={() => exec(() => editor.chain().focus().setParagraph().run())} />
        <MenuItem icon={<Heading1 size={ICON_SIZE} />} label="제목 1"
          onClick={() => exec(() => editor.chain().focus().toggleHeading({ level: 1 }).run())} />
        <MenuItem icon={<Heading2 size={ICON_SIZE} />} label="제목 2"
          onClick={() => exec(() => editor.chain().focus().toggleHeading({ level: 2 }).run())} />
        <MenuItem icon={<Heading3 size={ICON_SIZE} />} label="제목 3"
          onClick={() => exec(() => editor.chain().focus().toggleHeading({ level: 3 }).run())} />
      </SubMenu>

      {/* Lists */}
      <SubMenu icon={<List size={ICON_SIZE} />} label="목록">
        <MenuItem icon={<List size={ICON_SIZE} />} label="글머리 기호"
          onClick={() => exec(() => editor.chain().focus().toggleBulletList().run())} />
        <MenuItem icon={<ListOrdered size={ICON_SIZE} />} label="번호 매기기"
          onClick={() => exec(() => editor.chain().focus().toggleOrderedList().run())} />
      </SubMenu>

      <div style={{ height: 1, background: "#e5e5e5", margin: "3px 0" }} />

      {/* Indent */}
      <MenuItem icon={<Indent size={ICON_SIZE} />} label="들여쓰기" shortcut="Tab"
        onClick={() => exec(() => editor.chain().focus().increaseIndent().run())} />
      <MenuItem icon={<Outdent size={ICON_SIZE} />} label="내어쓰기" shortcut="Shift+Tab"
        onClick={() => exec(() => editor.chain().focus().decreaseIndent().run())} dividerAfter />

      {/* Link */}
      <MenuItem icon={<Link2 size={ICON_SIZE} />} label={isLink ? "링크 편집..." : "하이퍼링크..."} shortcut="Ctrl+K"
        onClick={() => exec(() => onOpenHyperlinkDialog?.())} />

      {/* Image insert */}
      <MenuItem icon={<ImageIcon size={ICON_SIZE} />} label="그림 삽입..."
        onClick={() => exec(() => {
          const input = document.createElement("input");
          input.type = "file"; input.accept = "image/*";
          input.onchange = (ev) => {
            const file = ev.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => editor.chain().focus().setImage({ src: reader.result }).run();
            reader.readAsDataURL(file);
          };
          input.click();
        })} dividerAfter />

      {/* Comment items */}
      <MenuItem icon={<MessageSquare size={ICON_SIZE} />} label="새 메모" shortcut="Ctrl+Alt+M"
        onClick={() => exec(() => onInsertComment?.())} />
      {(() => {
        // Check if cursor is on a comment mark
        const $from = editor.state.selection.$from;
        const commentMark = $from.marks().find(m => m.type.name === "comment");
        if (commentMark && commentStore && commentDispatch) {
          const cid = commentMark.attrs.commentId;
          const comment = commentStore.comments[cid];
          return (
            <>
              <MenuItem icon={<Reply size={ICON_SIZE} />} label="메모에 답글 달기"
                onClick={() => exec(() => {
                  commentDispatch({ type: "SET_ACTIVE", id: cid });
                  commentDispatch({ type: "SET_PANEL_VISIBLE", visible: true });
                  if (commentStore.markupMode !== "all") commentDispatch({ type: "SET_MARKUP_MODE", mode: "all" });
                })} />
              <MenuItem icon={<Check size={ICON_SIZE} />} label="메모 해결"
                onClick={() => exec(() => commentDispatch({ type: "RESOLVE_COMMENT", id: cid, author: commentAuthor }))}
                disabled={comment?.resolved} />
              <MenuItem icon={<Trash2 size={ICON_SIZE} />} label="메모 삭제" danger
                onClick={() => exec(() => {
                  editor.commands.unsetComment(cid);
                  commentDispatch({ type: "DELETE_COMMENT", id: cid });
                })} />
            </>
          );
        }
        return null;
      })()}
      <div style={{ height: 1, background: "#e5e5e5", margin: "3px 0" }} />

      {/* Table operations */}
      {isTable && (
        <>
          <SubMenu icon={<Table2 size={ICON_SIZE} />} label="표 조작">
            <MenuItem label="행 추가 (위)" onClick={() => exec(() => editor.chain().focus().addRowBefore().run())} />
            <MenuItem label="행 추가 (아래)" onClick={() => exec(() => editor.chain().focus().addRowAfter().run())} />
            <MenuItem label="열 추가 (왼쪽)" onClick={() => exec(() => editor.chain().focus().addColumnBefore().run())} />
            <MenuItem label="열 추가 (오른쪽)" onClick={() => exec(() => editor.chain().focus().addColumnAfter().run())} />
            <div style={{ height: 1, background: "#e5e5e5", margin: "3px 0" }} />
            <MenuItem label="행 삭제" onClick={() => exec(() => editor.chain().focus().deleteRow().run())} />
            <MenuItem label="열 삭제" onClick={() => exec(() => editor.chain().focus().deleteColumn().run())} />
            <MenuItem label="셀 병합" onClick={() => exec(() => editor.chain().focus().mergeCells().run())} />
            <MenuItem label="셀 분할" onClick={() => exec(() => editor.chain().focus().splitCell().run())} />
            <div style={{ height: 1, background: "#e5e5e5", margin: "3px 0" }} />
            <MenuItem label="표 삭제" danger onClick={() => exec(() => editor.chain().focus().deleteTable().run())} />
          </SubMenu>
          <div style={{ height: 1, background: "#e5e5e5", margin: "3px 0" }} />
        </>
      )}

      {/* Dialogs */}
      <MenuItem icon={<Type size={ICON_SIZE} />} label="글꼴..." shortcut="Ctrl+D"
        onClick={() => exec(() => onOpenFontDialog?.())} />
      <MenuItem icon={<Minus size={ICON_SIZE} />} label="단락..."
        onClick={() => exec(() => onOpenParagraphDialog?.())} />

      {/* Select All */}
      <div style={{ height: 1, background: "#e5e5e5", margin: "3px 0" }} />
      <MenuItem icon={<Paintbrush size={ICON_SIZE} />} label="서식 지우기"
        onClick={() => exec(() => editor.chain().focus().clearNodes().unsetAllMarks().run())}
        disabled={!hasSelection} />
    </div>
  );
}
