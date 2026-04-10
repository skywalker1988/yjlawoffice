/**
 * useDocEditorActions — 에디터 편집 액션 훅
 * 찾기/바꾸기, 표/이미지/링크 삽입, 글꼴 적용, 각주 등 에디터 조작 액션 모음
 */
import { useState, useRef, useCallback } from "react";

/**
 * 에디터 편집 액션을 제공하는 훅
 * @param {Object} editor - TipTap 에디터 인스턴스
 * @param {Function} toast - 토스트 알림 함수
 * @param {Object} modalState - 모달 상태 세터 모음
 * @returns {Object} 액션 핸들러 모음
 */
export function useDocEditorActions(editor, toast, modalState) {
  const {
    findText, replaceText,
    tableRows, tableCols,
    imageUrl, setImageUrl, setImageModalOpen,
    linkUrl, linkLabel, setLinkUrl, setLinkLabel, setLinkModalOpen,
    setTableModalOpen,
    commentText, setCommentText, setComments,
    setFontColorOpen, setHighlightColorOpen,
  } = modalState;

  /* ── 글꼴 상태 ── */
  const [currentFont, setCurrentFont] = useState("맑은 고딕");
  const [currentSize, setCurrentSize] = useState("10");
  const [footnoteCounter, setFootnoteCounter] = useState(1);
  const fileInputRef = useRef(null);

  /* ── 찾기/바꾸기 ── */
  const handleFind = useCallback(() => {
    if (!editor || !findText) return;
    const content = editor.getHTML();
    const clean = content.replace(/<span class="search-highlight[^"]*">(.*?)<\/span>/g, "$1");
    const regex = new RegExp(`(${findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const highlighted = clean.replace(regex, '<span class="search-highlight">$1</span>');
    editor.commands.setContent(highlighted);
    const count = (clean.match(regex) || []).length;
    toast(`${count}개 검색됨`);
  }, [editor, findText, toast]);

  const handleReplaceAll = useCallback(() => {
    if (!editor || !findText) return;
    const content = editor.getHTML();
    const clean = content.replace(/<span class="search-highlight[^"]*">(.*?)<\/span>/g, "$1");
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const count = (clean.match(regex) || []).length;
    const replaced = clean.replace(regex, replaceText);
    editor.commands.setContent(replaced);
    toast(`${count}개 바꿈`);
  }, [editor, findText, replaceText, toast]);

  /* ── 표 삽입 ── */
  const insertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
    setTableModalOpen(false);
    toast("표가 삽입되었습니다");
  }, [editor, tableRows, tableCols, toast, setTableModalOpen]);

  /* ── 이미지 삽입 ── */
  const insertImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageModalOpen(false);
    setImageUrl("");
    toast("이미지가 삽입되었습니다");
  }, [editor, imageUrl, toast, setImageModalOpen, setImageUrl]);

  const handleImageFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = () => {
      editor.chain().focus().setImage({ src: reader.result }).run();
      toast("이미지가 삽입되었습니다");
    };
    reader.readAsDataURL(file);
    setImageModalOpen(false);
  }, [editor, toast, setImageModalOpen]);

  /* ── 링크 삽입 ── */
  const insertLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    if (linkLabel) {
      editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkLabel}</a>`).run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    }
    setLinkModalOpen(false);
    setLinkUrl("");
    setLinkLabel("");
  }, [editor, linkUrl, linkLabel, setLinkModalOpen, setLinkUrl, setLinkLabel]);

  /* ── 메모 추가 ── */
  const addComment = useCallback(() => {
    if (!commentText.trim()) return;
    const selection = editor?.state?.selection;
    const selectedText = selection ? editor.state.doc.textBetween(selection.from, selection.to) : "";
    setComments(prev => [...prev, {
      id: Date.now(),
      text: commentText,
      selection: selectedText,
      time: new Date().toLocaleTimeString("ko-KR"),
      author: "사용자",
    }]);
    setCommentText("");
    toast("메모가 추가되었습니다");
  }, [commentText, editor, toast, setComments, setCommentText]);

  /* ── 글꼴 크기 적용 ── */
  const applyFontSize = useCallback((size) => {
    if (!editor) return;
    setCurrentSize(String(size));
    editor.chain().focus().setMark("textStyle", { fontSize: `${size}pt` }).run();
  }, [editor]);

  /* ── 글꼴 적용 ── */
  const applyFontFamily = useCallback((font) => {
    if (!editor) return;
    setCurrentFont(font);
    editor.chain().focus().setFontFamily(font).run();
  }, [editor]);

  /* ── 글꼴색 적용 ── */
  const applyFontColor = useCallback((color) => {
    if (!editor) return;
    editor.chain().focus().setColor(color).run();
    setFontColorOpen(false);
  }, [editor, setFontColorOpen]);

  /* ── 형광펜 적용 ── */
  const applyHighlight = useCallback((color) => {
    if (!editor) return;
    editor.chain().focus().toggleHighlight({ color }).run();
    setHighlightColorOpen(false);
  }, [editor, setHighlightColorOpen]);

  /* ── 각주 삽입 ── */
  const insertFootnote = useCallback((text) => {
    if (!editor) return;
    const num = footnoteCounter;
    editor.chain().focus().insertContent(
      `<sup class="footnote-ref" title="${text || '각주'}">[${num}]</sup>`
    ).run();
    setFootnoteCounter(prev => prev + 1);
    toast(`각주 ${num} 삽입됨`);
  }, [editor, footnoteCounter, toast]);

  /* ── 미구현 기능 ── */
  const notImpl = useCallback((name) => toast(`${name} — 기능 준비 중`), [toast]);

  return {
    currentFont, currentSize, fileInputRef,
    handleFind, handleReplaceAll,
    insertTable, insertImage, handleImageFile, insertLink,
    addComment, applyFontSize, applyFontFamily, applyFontColor, applyHighlight,
    insertFootnote, notImpl,
  };
}
