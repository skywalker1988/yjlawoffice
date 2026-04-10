/**
 * FootnoteArea — MS Word 스타일 페이지 하단 각주 영역
 * - 가는 구분선으로 본문과 분리 (Word 스타일: 왼쪽 1/3 너비)
 * - 각주 번호 클릭 → 본문 해당 위치로 스크롤
 * - 각주 내용 직접 인라인 편집 (contentEditable)
 * - 자동 번호 동기화 및 정렬
 * - ResizeObserver로 높이 변화 감지
 *
 * 관련 파일:
 *   - EndnoteArea.jsx: 문서 끝 미주 영역
 *   - FootnoteEndnoteDialog.jsx: 각주/미주 삽입 대화상자
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { getFootnoteIdsFromDoc, formatFootnoteNumber } from "./footnote-extension";
import { FLASH_DURATION_MS } from "../../../utils/timing";

// 기존 import 호환을 위한 re-export
export { EndnoteArea } from "./EndnoteArea";
export { FootnoteEndnoteDialog } from "./FootnoteEndnoteDialog";

export function FootnoteArea({
  editor, footnotes, setFootnotes,
  onHeightChange, numberFormat = "decimal",
}) {
  const areaRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef(null);

  // 문서 순서와 각주 번호 동기화
  useEffect(() => {
    if (!editor) return;

    const syncNumbers = () => {
      const docFootnotes = getFootnoteIdsFromDoc(editor.state.doc);
      const docIds = docFootnotes
        .filter(f => f.noteType === "footnote")
        .map(f => f.id);

      setFootnotes(prev => {
        let updated = prev.filter(fn => docIds.includes(fn.id));
        updated.sort((a, b) => docIds.indexOf(a.id) - docIds.indexOf(b.id));
        updated = updated.map((fn, i) => ({ ...fn, number: i + 1 }));
        return updated;
      });
    };

    editor.on("update", syncNumbers);
    syncNumbers();
    return () => editor.off("update", syncNumbers);
  }, [editor, setFootnotes]);

  // ResizeObserver로 높이 변화 감지
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

  // 각주 번호 클릭 → 본문 참조 위치로 스크롤
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
      try {
        const domPos = editor.view.domAtPos(targetPos);
        const el = domPos.node.nodeType === Node.TEXT_NODE ? domPos.node.parentElement : domPos.node;
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        // 본문의 각주 참조 깜빡임 효과
        if (el) {
          el.classList.add("footnote-ref-flash");
          setTimeout(() => el.classList.remove("footnote-ref-flash"), FLASH_DURATION_MS);
        }
      } catch { /* ignore */ }
    }
  }, [editor]);

  // 편집 시작
  const startEdit = (id, content) => {
    setEditingId(id);
    setEditValue(content || "");
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 30);
  };

  // 편집 완료
  const finishEdit = (id) => {
    setFootnotes(prev => prev.map(fn =>
      fn.id === id ? { ...fn, content: editValue } : fn
    ));
    setEditingId(null);
  };

  /** 각주 편집 입력 키보드 핸들러 — Enter(완료), Escape(취소), Tab(다음 각주) */
  const handleFootnoteKeyDown = (e, footnoteId) => {
    if (e.key === "Enter") { e.preventDefault(); finishEdit(footnoteId); return; }
    if (e.key === "Escape") { setEditingId(null); return; }
    if (e.key === "Tab") {
      e.preventDefault();
      finishEdit(footnoteId);
      const idx = footnotes.findIndex(f => f.id === footnoteId);
      const next = footnotes[idx + 1];
      if (next) startEdit(next.id, next.content);
    }
  };

  // 각주 삭제 (본문 참조 + 상태 모두 제거)
  const deleteFootnote = (id) => {
    if (!editor) return;
    editor.commands.removeFootnote(id);
    setFootnotes(prev => prev.filter(fn => fn.id !== id));
  };

  if (!footnotes || footnotes.length === 0) return null;

  return (
    <div ref={areaRef} className="footnote-area">
      {/* Word 스타일 구분선: 왼쪽 약 1/3 너비 */}
      <div className="footnote-separator" />

      {/* 각주 목록 */}
      <div className="footnote-list">
        {footnotes.map((fn) => {
          const displayNum = formatFootnoteNumber(fn.number, numberFormat);
          const isEditing = editingId === fn.id;

          return (
            <div
              key={fn.id}
              data-footnote-item-id={fn.id}
              className={`footnote-item${isEditing ? " footnote-item-editing" : ""}`}
            >
              {/* 각주 번호 (위첨자, 클릭 → 본문 이동) */}
              <span
                className="footnote-item-number"
                onClick={() => scrollToReference(fn.id)}
                title="클릭하면 본문 위치로 이동"
              >
                {displayNum}
              </span>

              {/* 각주 내용 (클릭하여 편집) */}
              <div className="footnote-item-content" style={{ flex: 1 }}>
                {isEditing ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    className="footnote-edit-input"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => finishEdit(fn.id)}
                    onKeyDown={(e) => handleFootnoteKeyDown(e, fn.id)}
                  />
                ) : (
                  <span
                    className="footnote-item-text"
                    onClick={() => startEdit(fn.id, fn.content)}
                  >
                    {fn.content || "(클릭하여 각주 내용 입력)"}
                  </span>
                )}
              </div>

              {/* 삭제 버튼 (호버 시 표시) */}
              <button
                type="button"
                className="footnote-delete-btn"
                onClick={() => deleteFootnote(fn.id)}
                title="각주 삭제"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
