/**
 * 각주/미주 관리 훅
 * — EditorPage에서 분리된 각주 삽입/삭제 로직
 */
import { useState, useCallback } from "react";
import { generateFootnoteId } from "../modules/footnote-extension";

export default function useFootnotes(editor) {
  const [footnotes, setFootnotes] = useState([]);
  const [endnotes, setEndnotes] = useState([]);
  const [footnoteAreaHeight, setFootnoteAreaHeight] = useState(0);
  const [footnoteNumberFormat, setFootnoteNumberFormat] = useState("decimal");
  const [endnoteNumberFormat, setEndnoteNumberFormat] = useState("lowerRoman");

  /** 각주/미주 삽입 공통 로직 — 본문에 참조 삽입 + 하단에 항목 추가 */
  const insertNote = useCallback((type) => {
    if (!editor) return;
    const id = generateFootnoteId();
    editor.commands.insertFootnote(id, type);
    const setter = type === "footnote" ? setFootnotes : setEndnotes;
    setter(prev => [...prev, { id, number: prev.length + 1, content: "" }]);
    // 해당 노트 영역으로 스크롤
    setTimeout(() => {
      const fnEl = document.querySelector(`[data-footnote-item-id="${id}"]`);
      if (fnEl) {
        fnEl.scrollIntoView({ behavior: "smooth", block: "center" });
        fnEl.querySelector(".footnote-item-text")?.click();
      }
    }, 100);
  }, [editor]);

  /** 각주 삽입 */
  const handleInsertFootnote = useCallback(() => insertNote("footnote"), [insertNote]);

  /** 미주 삽입 */
  const handleInsertEndnote = useCallback(() => insertNote("endnote"), [insertNote]);

  /** 각주/미주 다이얼로그에서 삽입 */
  const handleFootnoteDialogInsert = useCallback((opts) => {
    if (opts.type === "footnote") {
      setFootnoteNumberFormat(opts.numberFormat);
      handleInsertFootnote();
    } else {
      setEndnoteNumberFormat(opts.numberFormat);
      handleInsertEndnote();
    }
  }, [handleInsertFootnote, handleInsertEndnote]);

  /** 전체 초기화 (새 문서 시) */
  const resetFootnotes = useCallback(() => {
    setFootnotes([]);
    setEndnotes([]);
  }, []);

  return {
    footnotes, setFootnotes,
    endnotes, setEndnotes,
    footnoteAreaHeight, setFootnoteAreaHeight,
    footnoteNumberFormat, setFootnoteNumberFormat,
    endnoteNumberFormat, setEndnoteNumberFormat,
    handleInsertFootnote, handleInsertEndnote, handleFootnoteDialogInsert,
    resetFootnotes,
  };
}
