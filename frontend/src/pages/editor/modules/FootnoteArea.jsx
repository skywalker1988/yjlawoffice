/**
 * FootnoteArea - 페이지 하단 각주 영역
 *
 * - 에디터 DOM 밖에서 독립적으로 렌더링
 * - 각주 번호 클릭 → 본문 해당 위치로 스크롤
 * - 각주 내용 직접 편집 가능
 * - ResizeObserver로 높이 변화 감지
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { getFootnoteIdsFromDoc } from "./footnote-extension";

export function FootnoteArea({ editor, footnotes, setFootnotes, onHeightChange }) {
  const areaRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const editInputRef = useRef(null);

  // Sync footnote numbers with editor document order
  useEffect(() => {
    if (!editor) return;

    const syncNumbers = () => {
      const docFootnotes = getFootnoteIdsFromDoc(editor.state.doc);
      const docIds = docFootnotes.map(f => f.id);

      setFootnotes(prev => {
        // Remove footnotes whose references no longer exist in doc
        let updated = prev.filter(fn => docIds.includes(fn.id));

        // Sort by document order
        updated.sort((a, b) => {
          return docIds.indexOf(a.id) - docIds.indexOf(b.id);
        });

        // Update numbers
        updated = updated.map((fn, i) => ({ ...fn, number: i + 1 }));

        return updated;
      });
    };

    editor.on("update", syncNumbers);
    syncNumbers(); // initial sync
    return () => editor.off("update", syncNumbers);
  }, [editor, setFootnotes]);

  // ResizeObserver for dynamic height
  useEffect(() => {
    if (!areaRef.current || !onHeightChange) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onHeightChange(entry.contentRect.height);
      }
    });
    observer.observe(areaRef.current);
    return () => observer.disconnect();
  }, [onHeightChange]);

  // Click footnote number → scroll to reference in document
  const scrollToReference = useCallback((footnoteId) => {
    if (!editor) return;
    let targetPos = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "footnoteReference" && node.attrs.footnoteId === footnoteId) {
        targetPos = pos;
        return false;
      }
    });
    if (targetPos !== null) {
      editor.chain().focus().setTextSelection(targetPos).run();
      // Scroll into view
      try {
        const domPos = editor.view.domAtPos(targetPos);
        const el = domPos.node.nodeType === Node.TEXT_NODE ? domPos.node.parentElement : domPos.node;
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {}
    }
  }, [editor]);

  // Edit footnote content
  const startEdit = (id) => {
    setEditingId(id);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const finishEdit = (id, newContent) => {
    setFootnotes(prev => prev.map(fn =>
      fn.id === id ? { ...fn, content: newContent } : fn
    ));
    setEditingId(null);
  };

  // Delete footnote (removes both reference and content)
  const deleteFootnote = (id) => {
    if (!editor) return;
    // Remove from document
    editor.commands.removeFootnote(id);
    // Remove from state
    setFootnotes(prev => prev.filter(fn => fn.id !== id));
  };

  if (!footnotes || footnotes.length === 0) return null;

  return (
    <div
      ref={areaRef}
      className="footnote-area"
      style={{
        position: "relative",
        borderTop: "1px solid #999",
        marginTop: 16,
        paddingTop: 8,
        width: "40%",
        minWidth: 200,
      }}
    >
      {footnotes.map((fn) => (
        <div
          key={fn.id}
          data-footnote-item-id={fn.id}
          className="footnote-item"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 4,
            marginBottom: 2,
            padding: "2px 0",
            fontSize: "10pt",
            lineHeight: 1.3,
            transition: "background 0.3s",
          }}
        >
          {/* Footnote number - click to go back to reference */}
          <span
            className="footnote-item-number"
            onClick={() => scrollToReference(fn.id)}
            style={{
              color: "#0563C1",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.75em",
              verticalAlign: "super",
              minWidth: 16,
              flexShrink: 0,
              userSelect: "none",
            }}
            title="클릭하면 본문 위치로 이동"
          >
            {fn.number}
          </span>

          {/* Footnote content - editable */}
          <div
            className="footnote-item-content"
            style={{ flex: 1, color: "#333", cursor: "text" }}
          >
            {editingId === fn.id ? (
              <input
                ref={editInputRef}
                type="text"
                value={fn.content}
                onChange={(e) => {
                  setFootnotes(prev => prev.map(f =>
                    f.id === fn.id ? { ...f, content: e.target.value } : f
                  ));
                }}
                onBlur={() => finishEdit(fn.id, fn.content)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") finishEdit(fn.id, fn.content);
                  if (e.key === "Escape") setEditingId(null);
                }}
                style={{
                  width: "100%", border: "none", borderBottom: "1px solid #0563C1",
                  outline: "none", fontSize: "10pt", fontFamily: "'맑은 고딕', sans-serif",
                  padding: "0 2px", background: "#fffef0",
                }}
              />
            ) : (
              <span
                onClick={() => startEdit(fn.id)}
                style={{ display: "inline-block", minHeight: 16 }}
              >
                {fn.content || "(클릭하여 각주 내용 입력)"}
              </span>
            )}
          </div>

          {/* Delete button */}
          <button
            type="button"
            onClick={() => deleteFootnote(fn.id)}
            title="각주 삭제"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#ccc", fontSize: 10, padding: "0 2px", flexShrink: 0,
              opacity: 0.5, transition: "opacity 0.1s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#dc2626"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.5"; e.currentTarget.style.color = "#ccc"; }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
