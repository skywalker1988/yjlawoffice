/**
 * useDocDetailState — DocumentDetailPage의 상태 관리 커스텀 훅
 * 문서 로딩, 저장, UI/모달 상태, 키보드 단축키를 관리
 * 에디터 편집 액션은 useDocEditorActions로 분리
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import { useToast } from "./DocDetailUI";
import { useDocDetailEditor } from "./useDocDetailEditor";
import { useDocEditorActions } from "./useDocEditorActions";

/**
 * 문서 상세 페이지의 모든 상태와 액션을 관리하는 훅
 * @returns {Object} 상태 값과 핸들러 함수 모음
 */
export function useDocDetailState() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show: toast, Toast } = useToast();

  /* ── 문서 상태 ── */
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");

  /* ── UI 상태 ── */
  const [activeTab, setActiveTab] = useState("home");
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [showRuler, setShowRuler] = useState(true);
  const [showGridlines, setShowGridlines] = useState(false);
  const [showNavPane, setShowNavPane] = useState(false);
  const [viewMode, setViewMode] = useState("print");

  /* ── 모달 상태 ── */
  const [findOpen, setFindOpen] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [wordCountOpen, setWordCountOpen] = useState(false);
  const [symbolModalOpen, setSymbolModalOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [fontColorOpen, setFontColorOpen] = useState(false);
  const [highlightColorOpen, setHighlightColorOpen] = useState(false);
  const [lineSpacingOpen, setLineSpacingOpen] = useState(false);

  const saveTimerRef = useRef(null);

  /* ── 자동저장 ── */
  const autoSave = useCallback((html) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaving(true);
      api.patch(`/documents/${id}`, { contentMarkdown: html })
        .then(() => setLastSaved(new Date()))
        .catch(() => {})
        .finally(() => setSaving(false));
    }, 2000);
  }, [id]);

  /* ── TipTap 에디터 ── */
  const editor = useDocDetailEditor(autoSave);

  /* ── 에디터 액션 (찾기/삽입/글꼴 등) ── */
  const actions = useDocEditorActions(editor, toast, {
    findText, replaceText,
    tableRows, tableCols,
    imageUrl, setImageUrl, setImageModalOpen,
    linkUrl, linkLabel, setLinkUrl, setLinkLabel, setLinkModalOpen,
    setTableModalOpen,
    commentText, setCommentText, setComments,
    setFontColorOpen, setHighlightColorOpen,
  });

  /* ── 문서 로딩 ── */
  useEffect(() => {
    setLoading(true);
    api.get(`/documents/${id}`)
      .then(data => {
        const document = data.data || data;
        setDoc(document);
        setTitle(document.title || "");
        const html = document.contentHtml || document.contentMarkdown || document.contentPlain || "";
        if (editor) {
          editor.commands.setContent(html.includes("<") ? html : html.replace(/\n/g, "<br/>"));
        }
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [id, editor]);

  /* ── 수동 저장 ── */
  const manualSave = useCallback(() => {
    if (!editor) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaving(true);
    api.patch(`/documents/${id}`, { contentMarkdown: editor.getHTML(), title })
      .then(() => { setLastSaved(new Date()); toast("저장되었습니다"); })
      .catch(() => toast("저장 실패"))
      .finally(() => setSaving(false));
  }, [id, editor, title, toast]);

  /* ── 상태 변경 ── */
  const handleStatusChange = useCallback((newStatus) => {
    api.patch(`/documents/${id}`, { status: newStatus })
      .then(updated => setDoc(prev => ({ ...prev, ...(updated.data || updated) })))
      .catch(() => {});
  }, [id]);

  /* ── 삭제 ── */
  const handleDelete = useCallback(() => {
    api.del(`/documents/${id}`)
      .then(() => navigate("/vault"))
      .catch(() => {});
  }, [id, navigate]);

  /* ── 제목 변경 ── */
  const onTitleChange = useCallback((e) => {
    setTitle(e.target.value);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      api.patch(`/documents/${id}`, { title: e.target.value })
        .then(() => setLastSaved(new Date())).catch(() => {});
    }, 2000);
  }, [id]);

  /* ── 통계 ── */
  const stats = useMemo(() => {
    if (!editor) return { chars: 0, words: 0, pages: 1 };
    const text = editor.state.doc.textContent || "";
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const pages = Math.max(1, Math.ceil(chars / 1800));
    return { chars, words, pages };
  }, [editor?.state?.doc?.textContent]);

  /* ── 인쇄 ── */
  const handlePrint = useCallback(() => window.print(), []);

  /* ── 키보드 단축키 ── */
  useEffect(() => {
    const fn = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); manualSave(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "p") { e.preventDefault(); handlePrint(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") { e.preventDefault(); setFindOpen(true); }
      if ((e.ctrlKey || e.metaKey) && e.key === "h") { e.preventDefault(); setFindOpen(true); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [manualSave, handlePrint]);

  return {
    /* 라우터 */
    id, navigate,
    /* 에디터 */
    editor,
    /* 문서 상태 */
    doc, setDoc, loading, error, title,
    /* UI 상태 */
    activeTab, setActiveTab, zoom, setZoom,
    saving, lastSaved,
    deleteOpen, setDeleteOpen,
    infoPanelOpen, setInfoPanelOpen,
    showRuler, setShowRuler,
    showGridlines, setShowGridlines,
    showNavPane, setShowNavPane,
    viewMode, setViewMode,
    /* 모달 상태 */
    findOpen, setFindOpen, findText, setFindText, replaceText, setReplaceText,
    tableModalOpen, setTableModalOpen, tableRows, setTableRows, tableCols, setTableCols,
    imageModalOpen, setImageModalOpen, imageUrl, setImageUrl,
    linkModalOpen, setLinkModalOpen, linkUrl, setLinkUrl, linkLabel, setLinkLabel,
    wordCountOpen, setWordCountOpen,
    symbolModalOpen, setSymbolModalOpen,
    commentText, setCommentText, comments, setComments,
    fontColorOpen, setFontColorOpen,
    highlightColorOpen, setHighlightColorOpen,
    lineSpacingOpen, setLineSpacingOpen,
    /* 액션 */
    manualSave, handleStatusChange, handleDelete, onTitleChange,
    handlePrint,
    /* 통계 */
    stats,
    /* 토스트 */
    toast, Toast,
    /* 에디터 액션 (useDocEditorActions) */
    ...actions,
  };
}
