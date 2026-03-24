/**
 * FootnoteArea — MS Word 스타일 페이지 하단 각주 영역
 *
 * - 가는 구분선으로 본문과 분리 (Word 스타일: 왼쪽 1/3 너비)
 * - 각주 번호 클릭 → 본문 해당 위치로 스크롤
 * - 각주 내용 직접 인라인 편집 (contentEditable)
 * - 자동 번호 동기화 및 정렬
 * - ResizeObserver로 높이 변화 감지
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { getFootnoteIdsFromDoc, formatFootnoteNumber } from "./footnote-extension";

/* ── 상수 ── */
const FOOTNOTE_FONT_SIZE = "9pt";
const FOOTNOTE_LINE_HEIGHT = 1.4;

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
          setTimeout(() => el.classList.remove("footnote-ref-flash"), 1500);
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); finishEdit(fn.id); }
                      if (e.key === "Escape") { setEditingId(null); }
                      // Tab → 다음 각주로 이동
                      if (e.key === "Tab") {
                        e.preventDefault();
                        finishEdit(fn.id);
                        const idx = footnotes.findIndex(f => f.id === fn.id);
                        const next = footnotes[idx + 1];
                        if (next) startEdit(next.id, next.content);
                      }
                    }}
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

/**
 * EndnoteArea — 문서 끝에 표시되는 미주 영역
 * FootnoteArea와 유사하지만 문서 끝에 위치
 */
export function EndnoteArea({
  editor, endnotes, setEndnotes,
  numberFormat = "lowerRoman",
}) {
  const editInputRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  // 문서 순서 동기화
  useEffect(() => {
    if (!editor) return;

    const syncNumbers = () => {
      const docFootnotes = getFootnoteIdsFromDoc(editor.state.doc);
      const docIds = docFootnotes
        .filter(f => f.noteType === "endnote")
        .map(f => f.id);

      setEndnotes(prev => {
        let updated = prev.filter(fn => docIds.includes(fn.id));
        updated.sort((a, b) => docIds.indexOf(a.id) - docIds.indexOf(b.id));
        updated = updated.map((fn, i) => ({ ...fn, number: i + 1 }));
        return updated;
      });
    };

    editor.on("update", syncNumbers);
    syncNumbers();
    return () => editor.off("update", syncNumbers);
  }, [editor, setEndnotes]);

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
      } catch { /* ignore */ }
    }
  }, [editor]);

  const startEdit = (id, content) => {
    setEditingId(id);
    setEditValue(content || "");
    setTimeout(() => editInputRef.current?.focus(), 30);
  };

  const finishEdit = (id) => {
    setEndnotes(prev => prev.map(fn =>
      fn.id === id ? { ...fn, content: editValue } : fn
    ));
    setEditingId(null);
  };

  const deleteEndnote = (id) => {
    if (!editor) return;
    editor.commands.removeFootnote(id);
    setEndnotes(prev => prev.filter(fn => fn.id !== id));
  };

  if (!endnotes || endnotes.length === 0) return null;

  return (
    <div className="endnote-area">
      <div className="endnote-separator" />
      <div className="endnote-header">미주</div>
      <div className="footnote-list">
        {endnotes.map((fn) => {
          const displayNum = formatFootnoteNumber(fn.number, numberFormat);
          const isEditing = editingId === fn.id;

          return (
            <div key={fn.id} data-footnote-item-id={fn.id}
              className={`footnote-item${isEditing ? " footnote-item-editing" : ""}`}>
              <span className="footnote-item-number endnote-number"
                onClick={() => scrollToReference(fn.id)}
                title="클릭하면 본문 위치로 이동">
                {displayNum}
              </span>
              <div className="footnote-item-content" style={{ flex: 1 }}>
                {isEditing ? (
                  <input ref={editInputRef} type="text" className="footnote-edit-input"
                    value={editValue} onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => finishEdit(fn.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); finishEdit(fn.id); }
                      if (e.key === "Escape") setEditingId(null);
                    }} />
                ) : (
                  <span className="footnote-item-text"
                    onClick={() => startEdit(fn.id, fn.content)}>
                    {fn.content || "(클릭하여 미주 내용 입력)"}
                  </span>
                )}
              </div>
              <button type="button" className="footnote-delete-btn"
                onClick={() => deleteEndnote(fn.id)} title="미주 삭제">✕</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * FootnoteEndnoteDialog — 각주/미주 삽입 대화상자 (Word 스타일)
 *
 * 위치 선택, 번호 형식, 시작 번호, 적용 범위 등 설정
 */
export function FootnoteEndnoteDialog({
  onInsert, onClose,
  numberFormat, setNumberFormat,
  endnoteNumberFormat, setEndnoteNumberFormat,
}) {
  const [location, setLocation] = useState("footnote"); // footnote | endnote
  const [startNumber, setStartNumber] = useState(1);
  const [numbering, setNumbering] = useState("continuous"); // continuous | eachSection | eachPage

  const handleInsert = () => {
    onInsert({
      type: location,
      numberFormat: location === "footnote" ? numberFormat : endnoteNumberFormat,
      startNumber,
      numbering,
    });
    onClose();
  };

  const footnoteFormats = [
    { value: "decimal", label: "1, 2, 3, ..." },
    { value: "lowerAlpha", label: "a, b, c, ..." },
    { value: "upperAlpha", label: "A, B, C, ..." },
    { value: "lowerRoman", label: "i, ii, iii, ..." },
    { value: "upperRoman", label: "I, II, III, ..." },
    { value: "symbol", label: "*, †, ‡, ..." },
  ];

  const currentFormat = location === "footnote" ? numberFormat : endnoteNumberFormat;
  const setCurrentFormat = location === "footnote" ? setNumberFormat : setEndnoteNumberFormat;

  return (
    <div className="word-dialog-overlay" onClick={onClose}>
      <div className="word-dialog" style={{ minWidth: 440, maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <div className="word-dialog-title">
          <span>각주 및 미주</span>
          <button type="button" onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#888" }}>✕</button>
        </div>
        <div className="word-dialog-body" style={{ padding: "16px 24px" }}>
          {/* 위치 선택 */}
          <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
            <fieldset style={{ border: "1px solid #d1d5db", borderRadius: 4, padding: "12px 16px", flex: 1 }}>
              <legend style={{ fontSize: 11, fontWeight: 600, color: "#555", padding: "0 4px" }}>위치</legend>
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 12 }}>
                <input type="radio" name="noteType" value="footnote"
                  checked={location === "footnote"} onChange={() => setLocation("footnote")} />
                <span style={{ fontWeight: location === "footnote" ? 600 : 400 }}>각주(F)</span>
                <span style={{ fontSize: 10, color: "#888", marginLeft: "auto" }}>페이지 아래쪽</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12 }}>
                <input type="radio" name="noteType" value="endnote"
                  checked={location === "endnote"} onChange={() => setLocation("endnote")} />
                <span style={{ fontWeight: location === "endnote" ? 600 : 400 }}>미주(E)</span>
                <span style={{ fontSize: 10, color: "#888", marginLeft: "auto" }}>문서 끝</span>
              </label>
            </fieldset>
          </div>

          {/* 번호 형식 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label className="word-dialog-label" style={{ fontSize: 11 }}>번호 형식(N):</label>
              <select className="word-dialog-input" value={currentFormat}
                onChange={(e) => setCurrentFormat(e.target.value)}
                style={{ width: "100%", padding: "4px 8px", fontSize: 12 }}>
                {footnoteFormats.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="word-dialog-label" style={{ fontSize: 11 }}>시작 번호(S):</label>
              <input type="number" className="word-dialog-input" min={1} value={startNumber}
                onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: "100%", padding: "4px 8px", fontSize: 12 }} />
            </div>
          </div>

          {/* 번호 매기기 */}
          <div style={{ marginBottom: 8 }}>
            <label className="word-dialog-label" style={{ fontSize: 11 }}>번호 매기기(U):</label>
            <select className="word-dialog-input" value={numbering}
              onChange={(e) => setNumbering(e.target.value)}
              style={{ width: "100%", padding: "4px 8px", fontSize: 12 }}>
              <option value="continuous">연속</option>
              <option value="eachSection">각 구역마다 다시 시작</option>
              <option value="eachPage">각 페이지마다 다시 시작</option>
            </select>
          </div>

          {/* 미리보기 */}
          <div style={{
            marginTop: 16, padding: 12, background: "#f8f9fa", border: "1px solid #e5e7eb",
            borderRadius: 4, fontSize: 11, color: "#666",
          }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>미리보기:</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <sup style={{ color: "#0563C1", fontWeight: 600, fontSize: "0.8em" }}>
                {formatFootnoteNumber(startNumber, currentFormat)}
              </sup>
              <span style={{ fontSize: "9pt", color: "#333" }}>
                {location === "footnote" ? "각주 내용이 여기에 표시됩니다." : "미주 내용이 여기에 표시됩니다."}
              </span>
            </div>
          </div>
        </div>
        <div className="word-dialog-footer">
          <button className="word-dialog-btn primary" onClick={handleInsert}>삽입(I)</button>
          <button className="word-dialog-btn" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}

