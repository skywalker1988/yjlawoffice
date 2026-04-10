/**
 * EditorPage — MS Word 스타일 문서 에디터 메인 컴포넌트
 * 상태 관리와 비즈니스 로직은 커스텀 훅으로 분리,
 * 렌더링은 RibbonBar, EditorCanvas, DialogManager, EditorStatusBar 서브컴포넌트로 분리
 */
import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Highlight } from "@tiptap/extension-highlight";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { CharacterCount } from "@tiptap/extension-character-count";
import { FontFamily } from "@tiptap/extension-font-family";
import { Typography } from "@tiptap/extension-typography";

/* ── Custom Extensions ── */
import {
  FontSize, LineSpacing, Indent, ParagraphSpacing,
  PageBreak, SectionBreak, ColumnBreak, LetterSpacing, TextShadow,
  TextBorder, ParagraphBorder, DropCap, KeepWithNext, WidowOrphan,
  TextDirection, Bookmark,
  TrackInsert, TrackDelete, TrackFormat, TrackChangesManager,
  PageNumberField, DateField, NonBreakingSpace, LineNumbers,
} from "./modules/extensions";
import { CommentMark } from "./modules/comment-mark";
import { AuthorSetupDialog } from "./modules/CommentPanel";

/* ── UI Components ── */
import { editorStyles } from "./modules/styles";
/* BackstageView는 파일 메뉴 클릭 시에만 필요 → lazy load */
const BackstageView = lazy(() => import("./modules/BackstageView").then(m => ({ default: m.BackstageView })));
import { loadAutoSave } from "./modules/fileUtils";
import {
  ZOOM_MIN, ZOOM_MAX, ZOOM_STEP,
  FIT_PAGE_PADDING,
} from "./modules/editorConstants";
import { MetaDrawer } from "./modules/MetaDrawer";
import { DocListSidebar } from "./modules/DocListSidebar";
import { FootnoteReference } from "./modules/footnote-extension";
import { VisualPagination } from "./modules/pagination-extension";
/* lucide 아이콘은 TitleBar, RibbonBar 등 서브컴포넌트에서 직접 임포트 */

/* ── Sub-components (렌더 영역 분리) ── */
import { RibbonBar } from "./modules/RibbonBar";
import { EditorCanvas } from "./modules/EditorCanvas";
/* DialogManager는 다이얼로그가 열릴 때만 필요 → lazy load */
const DialogManager = lazy(() => import("./modules/DialogManager").then(m => ({ default: m.DialogManager })));
import { EditorStatusBar } from "./modules/EditorStatusBar";
import { TitleBar } from "./modules/TitleBar";
import { HorizontalRuler } from "./modules/HorizontalRuler";

/* ── Custom Hooks ── */
import {
  useDocumentManager,
  useComments,
  usePageLayout,
  useEditorShortcuts,
  useFootnotes,
  useExportImport,
  usePagination,
} from "./hooks";

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function EditorPage() {
  const titleRef = useRef(null);
  const editorCanvasRef = useRef(null);
  const scheduleAutoSaveRef = useRef(null);

  /* ── UI State (순수 로컬) ── */
  const [viewMode, setViewMode] = useState("edit");
  const [metaOpen, setMetaOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [zoom, setZoom] = useState(100);
  const [showRuler, setShowRuler] = useState(true);
  const [showNavPane, setShowNavPane] = useState(false);
  const [findBarMode, setFindBarMode] = useState(null);
  const [showBackstage, setShowBackstage] = useState(false);
  const [ribbonCollapsed, setRibbonCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHeaderFooter, setShowHeaderFooter] = useState(true);
  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [dynamicPageCount, setDynamicPageCount] = useState(1);

  /* ── Track Changes State ── */
  const [trackChangesEnabled, setTrackChangesEnabled] = useState(false);

  /* ── Dialog State ── */
  const [dialogOpen, setDialogOpen] = useState(null);

  /* ──── TipTap editor ──── */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Color,
      TextStyle,
      FontFamily,
      Typography,
      Link.configure({ openOnClick: false }),
      Image.configure({ allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder: "본문을 입력하세요..." }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,
      FontSize,
      LineSpacing,
      Indent,
      ParagraphSpacing,
      PageBreak,
      SectionBreak,
      ColumnBreak,
      LetterSpacing,
      TextShadow,
      TextBorder,
      ParagraphBorder,
      DropCap,
      KeepWithNext,
      WidowOrphan,
      TextDirection,
      Bookmark,
      FootnoteReference,
      CommentMark,
      TrackInsert,
      TrackDelete,
      TrackFormat,
      TrackChangesManager,
      PageNumberField,
      DateField,
      NonBreakingSpace,
      LineNumbers,
      VisualPagination,
    ],
    editable: true,
    /* ProseMirror의 기본 스크롤을 비활성화 — 페이지 갭을 모르기 때문에
       페이지네이션 전 위치(회색 갭 영역)로 스크롤하는 문제 방지.
       대신 applyPageBreaks 후 커스텀 scrollToCursor로 처리 */
    editorProps: {
      handleScrollToSelection: () => true,
    },
    onUpdate: () => scheduleAutoSaveRef.current?.(),
  });

  /* ── Custom Hooks ── */
  const docManager = useDocumentManager(editor);
  const {
    doc, setDoc, docId, documents, loading,
    saveStatus, setSaveStatus, loadDocument,
    handleSave, refreshList, scheduleAutoSave,
  } = docManager;
  /* ref 동기화 — useEditor의 onUpdate에서 최신 scheduleAutoSave 참조 */
  scheduleAutoSaveRef.current = scheduleAutoSave;

  const comments = useComments(editor, docId);
  const {
    commentStore, commentDispatch,
    commentAuthor, showAuthorDialog,
    handleInsertComment, handleAuthorSave, handleAuthorCancel,
    handleDeleteActiveComment, handleDeleteAllComments,
    handleNextComment, handlePrevComment,
    deleteAllComments, loadComments, setActiveComment,
  } = comments;

  const layout = usePageLayout();
  const {
    margins, setMargins,
    customMargins, setCustomMargins,
    orientation, setOrientation,
    pageSize, setPageSize,
    columns, setColumns,
    pageColor, setPageColor,
    watermarkText, setWatermarkText,
    pageBorder, setPageBorder,
    headerFooterSettings, setHeaderFooterSettings,
    pageW, pageH,
    marginTop, marginBottom, marginLeft, marginRight,
    contentAreaHeight, gapH, PAGE_GAP,
  } = layout;

  const footnotesHook = useFootnotes(editor);
  const {
    footnotes, setFootnotes,
    endnotes, setEndnotes,
    footnoteAreaHeight, setFootnoteAreaHeight,
    footnoteNumberFormat, setFootnoteNumberFormat,
    endnoteNumberFormat, setEndnoteNumberFormat,
    handleInsertFootnote, handleInsertEndnote,
    handleFootnoteDialogInsert,
  } = footnotesHook;

  const {
    handleExportDocx, handleExportPdf, handleExportHtml,
    handleExportMarkdown, handleExportHwpx, handleImportDocx,
  } = useExportImport({ editor, doc, setDoc, setSaveStatus, editorCanvasRef, layoutOptions: { orientation, pageSize } });

  /* ──── viewMode에 따라 편집 가능 여부 설정 ──── */
  useEffect(() => {
    if (editor) editor.setEditable(viewMode === "edit");
  }, [viewMode, editor]);

  /* ──── Image drag-and-drop ──── */
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;

    const handleDragOver = (e) => {
      e.preventDefault();
      dom.classList.add("drag-over");
    };
    const handleDragLeave = () => {
      dom.classList.remove("drag-over");
    };
    const handleDrop = (e) => {
      e.preventDefault();
      dom.classList.remove("drag-over");
      const files = e.dataTransfer?.files;
      if (!files?.length) return;
      for (const file of files) {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = () => {
            editor.chain().focus().setImage({ src: reader.result, alt: file.name }).run();
          };
          reader.readAsDataURL(file);
        }
      }
    };

    dom.addEventListener("dragover", handleDragOver);
    dom.addEventListener("dragleave", handleDragLeave);
    dom.addEventListener("drop", handleDrop);
    return () => {
      dom.removeEventListener("dragover", handleDragOver);
      dom.removeEventListener("dragleave", handleDragLeave);
      dom.removeEventListener("drop", handleDrop);
    };
  }, [editor]);

  /* ──── load doc list on mount ──── */
  useEffect(() => {
    refreshList();
  }, [refreshList]);

  /* ──── 자동 저장 복원: 에디터 준비 후 로컬 백업이 있으면 자동 복원 ──── */
  useEffect(() => {
    if (!editor || docId) return;
    const saved = loadAutoSave();
    if (saved && saved.html) {
      editor.commands.setContent(saved.html);
      if (saved.title) setDoc(d => ({ ...d, title: saved.title }));
      setSaveStatus("복원됨");
    }
  }, [editor]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ──── Fullscreen toggle ──── */
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  /* ──── Keyboard Shortcuts ──── */
  useEditorShortcuts(editor, {
    onSave: () => handleSave(false),
    onFind: () => setFindBarMode("find"),
    onReplace: () => setFindBarMode("replace"),
    onHyperlink: () => setDialogOpen("hyperlink"),
    onFont: () => setDialogOpen("font"),
    onPrint: () => setDialogOpen("printpreview"),
    onComment: () => handleInsertComment(),
    onFullscreen: handleToggleFullscreen,
  });

  /* ──── Ctrl + Mouse Wheel Zoom ──── */
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoom(z => {
          const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
          return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z + delta));
        });
      }
    };
    const scrollEl = document.querySelector(".editor-canvas-scroll");
    if (scrollEl) scrollEl.addEventListener("wheel", handler, { passive: false });
    return () => { if (scrollEl) scrollEl.removeEventListener("wheel", handler); };
  }, []);

  /* ──── Fullscreen change listener ──── */
  useEffect(() => {
    const handler = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (fs) setRibbonCollapsed(true);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  /* ──── new document (훅 초기화 통합) ──── */
  const handleNew = () => {
    docManager.handleNew();
    footnotesHook.resetFootnotes();
    deleteAllComments();
    titleRef.current?.focus();
  };

  /* ──── Pagination (워드 스타일 페이지 전환) ──── */
  const { pageBreaks, pageBg, canvasBg } = usePagination({
    editor, viewMode, darkMode, pageColor,
    pageW, contentAreaHeight,
    marginTop, marginBottom, marginLeft, marginRight,
    headerText, footerText, PAGE_GAP,
    editorCanvasRef, setDynamicPageCount,
  });

  /* ──── Counts (에디터 업데이트 시에만 변경됨) ──── */
  const charCount = editor?.storage.characterCount?.characters() || 0;
  const wordCount = editor?.storage.characterCount?.words() || 0;

  /* ──── Page-width fit ──── */
  const handleFitPageWidth = useCallback(() => {
    const scrollEl = document.querySelector(".editor-canvas-scroll");
    if (!scrollEl) return;
    const availWidth = scrollEl.clientWidth - FIT_PAGE_PADDING;
    const newZoom = Math.round((availWidth / pageW) * 100);
    setZoom(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newZoom)));
  }, [pageW]);

  /* ──── Track Changes 토글 핸들러 ──── */
  const handleToggleTrackChanges = useCallback(() => {
    setTrackChangesEnabled(v => !v);
    editor?.commands.toggleTrackChanges();
  }, [editor]);

  /* ═══════════════════════════════════════════════════════════
     Memoized prop objects — 자식 컴포넌트 불필요 리렌더 방지
     ═══════════════════════════════════════════════════════════ */
  const dialogLayoutProps = useMemo(() => ({
    margins, setMargins, orientation, setOrientation,
    pageSize, setPageSize, customMargins, setCustomMargins,
    headerFooterSettings, setHeaderFooterSettings,
  }), [margins, orientation, pageSize, customMargins, headerFooterSettings]);

  const dialogPageProps = useMemo(() => ({
    pageBorder, setPageBorder, watermarkText, setWatermarkText,
  }), [pageBorder, watermarkText]);

  const dialogFootnoteProps = useMemo(() => ({
    handleFootnoteDialogInsert,
    footnoteNumberFormat, setFootnoteNumberFormat,
    endnoteNumberFormat, setEndnoteNumberFormat,
  }), [handleFootnoteDialogInsert, footnoteNumberFormat, endnoteNumberFormat]);

  const dialogPrintPreviewProps = useMemo(() => ({
    pageW, pageH, marginTop, marginBottom, marginLeft, marginRight,
  }), [pageW, pageH, marginTop, marginBottom, marginLeft, marginRight]);

  const ribbonDesignProps = useMemo(() => ({
    pageColor, setPageColor, watermarkText, setWatermarkText,
  }), [pageColor, watermarkText]);

  const ribbonLayoutProps = useMemo(() => ({
    margins, setMargins, orientation, setOrientation,
    pageSize, setPageSize, columns, setColumns,
  }), [margins, orientation, pageSize, columns]);

  const ribbonReferencesProps = useMemo(() => ({
    onInsertFootnote: handleInsertFootnote,
    onInsertEndnote: handleInsertEndnote,
  }), [handleInsertFootnote, handleInsertEndnote]);

  const ribbonReviewProps = useMemo(() => ({
    onInsertComment: handleInsertComment,
    onDeleteComment: handleDeleteActiveComment,
    onDeleteAllComments: handleDeleteAllComments,
    onPrevComment: handlePrevComment,
    onNextComment: handleNextComment,
    commentStore, commentDispatch,
    trackChangesEnabled,
    onToggleTrackChanges: handleToggleTrackChanges,
  }), [
    handleInsertComment, handleDeleteActiveComment, handleDeleteAllComments,
    handlePrevComment, handleNextComment, commentStore, commentDispatch,
    trackChangesEnabled, handleToggleTrackChanges,
  ]);

  const ribbonViewProps = useMemo(() => ({
    showRuler, setShowRuler, viewMode, setViewMode,
    zoom, setZoom, showNavPane, setShowNavPane,
    onNew: handleNew, darkMode, setDarkMode,
    onFitPageWidth: handleFitPageWidth, onToggleFullscreen: handleToggleFullscreen, isFullscreen,
  }), [
    showRuler, viewMode, zoom, showNavPane,
    handleNew, darkMode, handleFitPageWidth, handleToggleFullscreen, isFullscreen,
  ]);

  const canvasPageLayout = useMemo(() => ({
    pageW, pageH, marginTop, marginBottom, marginLeft, marginRight, gapH, PAGE_GAP,
  }), [pageW, pageH, marginTop, marginBottom, marginLeft, marginRight, gapH, PAGE_GAP]);

  const canvasCommentProps = useMemo(() => ({
    commentStore, commentDispatch, commentAuthor,
  }), [commentStore, commentDispatch, commentAuthor]);

  const canvasFootnoteProps = useMemo(() => ({
    footnotes, setFootnotes,
    endnotes, setEndnotes,
    setFootnoteAreaHeight,
    footnoteNumberFormat, endnoteNumberFormat,
  }), [footnotes, endnotes, footnoteNumberFormat, endnoteNumberFormat]);

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }} className={`word-editor-root${darkMode ? " dark-mode" : ""} comment-markup-${commentStore.markupMode}`}>
      <style>{editorStyles}</style>

      {/* ──── Splash Screen ──── */}
      {loading && (
        <div className="editor-splash">
          <div className="logo">
            <span style={{ fontWeight: 700, fontSize: 42, letterSpacing: -2 }}>W</span>
          </div>
          <div className="subtitle" style={{ fontSize: 14, marginTop: 8, letterSpacing: 1 }}>Word</div>
          <div style={{ fontSize: 10, marginTop: 4, opacity: 0.5 }}>윤정 법률사무소</div>
          <div className="loading-bar" />
        </div>
      )}

      {/* ──── Author Setup Dialog ──── */}
      {showAuthorDialog && (
        <AuthorSetupDialog
          onSave={handleAuthorSave}
          onCancel={handleAuthorCancel}
        />
      )}

      {/* ──── Backstage View (lazy) ──── */}
      {showBackstage && (
        <Suspense fallback={null}>
          <BackstageView
            doc={doc} setDoc={setDoc}
            onClose={() => setShowBackstage(false)}
            onNew={() => { handleNew(); setShowBackstage(false); }}
            onSave={() => { handleSave(false); setShowBackstage(false); }}
            onExportDocx={handleExportDocx}
            onExportPdf={handleExportPdf}
            onExportHtml={handleExportHtml}
            onExportMarkdown={handleExportMarkdown}
            onExportHwpx={handleExportHwpx}
            onImportDocx={handleImportDocx}
            onPrint={() => window.print()}
          />
        </Suspense>
      )}

      {/* ──── Dialogs (lazy) ──── */}
      {dialogOpen && (
        <Suspense fallback={null}>
          <DialogManager
            dialogOpen={dialogOpen}
            setDialogOpen={setDialogOpen}
            editor={editor}
            layoutProps={dialogLayoutProps}
            pageProps={dialogPageProps}
            footnoteProps={dialogFootnoteProps}
            printPreviewProps={dialogPrintPreviewProps}
          />
        </Suspense>
      )}

      {/* ──── Left Sidebar: Document List ──── */}
      <DocListSidebar
        documents={documents} onSelect={loadDocument} currentId={docId}
        onNew={handleNew} search={sidebarSearch} setSearch={setSidebarSearch}
        collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}
      />

      {/* ──── Right: Editor Area (MS Word clone) ──── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* ═══ Title Bar (MS Word 365 스타일) ═══ */}
        <TitleBar
          editor={editor} doc={doc} setDoc={setDoc}
          titleRef={titleRef} darkMode={darkMode} setDarkMode={setDarkMode}
          saveStatus={saveStatus} handleSave={handleSave}
          setMetaOpen={setMetaOpen}
        />

        {/* ═══ Ribbon ═══ */}
        <RibbonBar
          editor={editor}
          activeTab={activeTab} setActiveTab={setActiveTab}
          ribbonCollapsed={ribbonCollapsed} setRibbonCollapsed={setRibbonCollapsed}
          darkMode={darkMode}
          viewMode={viewMode}
          setShowBackstage={setShowBackstage}
          findBarMode={findBarMode} setFindBarMode={setFindBarMode}
          setDialogOpen={setDialogOpen}
          designProps={ribbonDesignProps}
          layoutProps={ribbonLayoutProps}
          referencesProps={ribbonReferencesProps}
          reviewProps={ribbonReviewProps}
          viewProps={ribbonViewProps}
        />

        {/* ═══ Ruler (MS Word 365 스타일 - cm 눈금) ═══ */}
        {showRuler && (
          <HorizontalRuler
            darkMode={darkMode} zoom={zoom} pageW={pageW}
            marginLeft={marginLeft} marginRight={marginRight}
            showNavPane={showNavPane} showRuler={showRuler}
          />
        )}

        {/* ═══ Editor Canvas ═══ */}
        <EditorCanvas
          editor={editor}
          editorCanvasRef={editorCanvasRef}
          viewMode={viewMode}
          darkMode={darkMode}
          zoom={zoom}
          showRuler={showRuler}
          showNavPane={showNavPane}
          setShowNavPane={setShowNavPane}
          doc={doc}
          pageLayout={canvasPageLayout}
          commentProps={canvasCommentProps}
          footnoteProps={canvasFootnoteProps}
          setDialogOpen={setDialogOpen}
          handleInsertComment={handleInsertComment}
          showHeaderFooter={showHeaderFooter}
          headerText={headerText}
          setHeaderText={setHeaderText}
          watermarkText={watermarkText}
          pageColor={pageColor}
        />

        {/* ═══ Status Bar ═══ */}
        <EditorStatusBar
          darkMode={darkMode}
          dynamicPageCount={dynamicPageCount}
          wordCount={wordCount}
          charCount={charCount}
          viewMode={viewMode}
          setViewMode={setViewMode}
          zoom={zoom}
          setZoom={setZoom}
        />

        {/* ──── Meta Drawer ──── */}
        {metaOpen && (
          <div onClick={() => setMetaOpen(false)}
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.15)", zIndex: 999 }}
          />
        )}
        <MetaDrawer doc={doc} setDoc={setDoc} open={metaOpen} onClose={() => setMetaOpen(false)} />
      </div>
    </div>
  );
}
