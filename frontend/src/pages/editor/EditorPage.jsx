import { useState, useEffect, useCallback, useRef, useMemo, useReducer } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
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
import { marked } from "marked";
import { api } from "../../utils/api";

/* ── Custom Extensions ── */
import { FontSize, LineSpacing, Indent, ParagraphSpacing } from "./modules/extensions";
import { CommentMark } from "./modules/comment-mark";
import {
  createCommentStore, commentReducer, createComment, generateCommentId,
  loadAuthor, saveAuthor, createAuthor, findCommentMarks, getNextComment, getPrevComment,
  getAllThreads,
} from "./modules/comment-store";
import { CommentPanel, CommentIndicators, ReviewingPane, AuthorSetupDialog } from "./modules/CommentPanel";

/* ── UI Components ── */
import { editorStyles } from "./modules/styles";
import { DOC_TYPES, EMPTY_DOC, MARGIN_PRESETS, PAGE_SIZES, COUNTRY_CODES, TYPE_NUMBERS, REGION_NUMBERS, CAT_NUMBERS } from "./modules/constants";
import { HomeTab } from "./modules/HomeTab";
import { InsertTab } from "./modules/InsertTab";
import { DesignTab, LayoutTab, ReferencesTab, ReviewTab, ViewTab } from "./modules/OtherTabs";
import { FindReplaceBar, FontDialog, ParagraphDialog, PageSetupDialog, HyperlinkDialog, TablePropertiesDialog, ImageDialog } from "./modules/Dialogs";
import { FloatingToolbar } from "./modules/FloatingToolbar";
import { BackstageView } from "./modules/BackstageView";
import { NavigationPane } from "./modules/NavigationPane";
import { ContextMenu } from "./modules/ContextMenu";
import { FootnoteReference, generateFootnoteId } from "./modules/footnote-extension";
import { FootnoteArea } from "./modules/FootnoteArea";
import { isMarkdown, htmlToMarkdown, exportHtml, exportDocx, exportPdf, importDocx, autoSaveToLocal, loadAutoSave } from "./modules/fileUtils";
import { MetaDrawer } from "./modules/MetaDrawer";
import { DocListSidebar } from "./modules/DocListSidebar";
import {
  Save, Undo2, Redo2, FileText, BookOpen, Globe, ZoomIn, ZoomOut,
  ChevronUp, ChevronDown, Settings, PanelTopClose, PanelTop,
  Moon, Sun,
} from "lucide-react";

/* ──────────────────────── helpers ──────────────────────── */
function isMarkdownText(text) {
  return isMarkdown(text);
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function EditorPage() {
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState({ ...EMPTY_DOC });
  const [docId, setDocId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [tags, setTags] = useState([]);
  const [saveStatus, setSaveStatus] = useState("");
  const [viewMode, setViewMode] = useState("edit");
  const [metaOpen, setMetaOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const autoSaveTimer = useRef(null);
  const titleRef = useRef(null);
  const editorCanvasRef = useRef(null);
  const importFileRef = useRef(null);

  /* ── UI State ── */
  const [activeTab, setActiveTab] = useState("home");
  const [zoom, setZoom] = useState(100);
  const [showRuler, setShowRuler] = useState(true);
  const [showNavPane, setShowNavPane] = useState(false);
  const [findBarMode, setFindBarMode] = useState(null);
  const [pageColor, setPageColor] = useState("#ffffff");
  const [watermarkText, setWatermarkText] = useState("");
  const [margins, setMargins] = useState("normal");
  const [customMargins, setCustomMargins] = useState({ top: 96, bottom: 96, left: 120, right: 120 });
  const [orientation, setOrientation] = useState("portrait");
  const [pageSize, setPageSize] = useState("a4");
  const [columns, setColumns] = useState(1);
  const [showBackstage, setShowBackstage] = useState(false);
  const [ribbonCollapsed, setRibbonCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHeaderFooter, setShowHeaderFooter] = useState(true);
  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [footnotes, setFootnotes] = useState([]); // { id, number, content }
  const [footnoteAreaHeight, setFootnoteAreaHeight] = useState(0);
  const [dynamicPageCount, setDynamicPageCount] = useState(1);

  /* ── Comment State ── */
  const [commentStore, commentDispatch] = useReducer(commentReducer, null, createCommentStore);
  const [commentAuthor, setCommentAuthor] = useState(() => loadAuthor());
  const [showAuthorDialog, setShowAuthorDialog] = useState(false);

  /* ── Dialog State ── */
  const [dialogOpen, setDialogOpen] = useState(null); // "font" | "paragraph" | "pagesetup" | "hyperlink" | "table" | "image"

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
      FootnoteReference,
      CommentMark,
    ],
    editable: true,
    onUpdate: ({ editor: editorInstance }) => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        handleSave(true);
        // Auto-save locally using the actual editor instance
        if (editorInstance && !editorInstance.isDestroyed) {
          autoSaveToLocal(editorInstance.getHTML(), doc);
        }
      }, 3000);
    },
  });

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

  /* ──── load doc list + tags on mount ──── */
  useEffect(() => {
    Promise.all([
      api.get("/documents?limit=200").then((j) => setDocuments(j.data || [])).catch(() => {}),
      api.get("/tags").then((j) => setTags(j.data || [])).catch(() => {}),
    ]).finally(() => {
      // Show splash for at least 800ms for visual polish
      setTimeout(() => setLoading(false), 800);
    });
  }, []);

  /* ──── load a document into editor ──── */
  const loadDocument = useCallback(
    async (id) => {
      try {
        const j = await api.get("/documents/" + id);
        const d = j.data;
        setDocId(id);
        setDoc({
          title: d.title || "",
          documentType: d.documentType || "article",
          subtitle: d.subtitle || "",
          author: d.author || "",
          source: d.source || "",
          publishedDate: d.publishedDate ? d.publishedDate.slice(0, 10) : "",
          contentMarkdown: d.contentMarkdown || "",
          summary: d.summary || "",
          status: d.status || "draft",
          importance: d.importance ?? 3,
          tagIds: (d.tags || []).map((t) => t.id),
        });
        if (editor) {
          let html = d.contentHtml || "";
          if (!html && d.contentMarkdown) {
            if (isMarkdownText(d.contentMarkdown)) {
              html = marked(d.contentMarkdown);
            } else {
              html = "<p>" + d.contentMarkdown.replace(/\n/g, "</p><p>") + "</p>";
            }
          }
          editor.commands.setContent(html || "");
        }
        setSaveStatus("저장됨");
      } catch (err) {
        console.error(err);
        setSaveStatus("오류");
      }
    },
    [editor],
  );

  /* ──── save handler ──── */
  const handleSave = useCallback(
    async (auto = false) => {
      if (!editor) return;
      setSaveStatus("저장 중...");
      const html = editor.getHTML();
      const md = doc.contentMarkdown || htmlToMarkdown(html);
      const payload = {
        title: doc.title || "제목 없음",
        documentType: doc.documentType,
        subtitle: doc.subtitle,
        author: doc.author,
        source: doc.source,
        publishedDate: doc.publishedDate || null,
        contentHtml: html,
        contentMarkdown: md,
        summary: doc.summary,
        status: doc.status,
        importance: doc.importance,
        tagIds: doc.tagIds,
      };
      try {
        if (docId) {
          await api.patch("/documents/" + docId, payload);
        } else {
          const j = await api.post("/documents", payload);
          const newId = j.data?.id;
          if (newId) {
            setDocId(newId);
            api.get("/documents?limit=200").then((r) => setDocuments(r.data || [])).catch(() => {});
          }
        }
        setSaveStatus("저장됨");
      } catch (err) {
        console.error(err);
        setSaveStatus("오류");
      }
    },
    [editor, doc, docId],
  );

  /* ──── Keyboard Shortcuts ──── */
  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "s") { e.preventDefault(); handleSave(false); }
      if (ctrl && e.key === "f") { e.preventDefault(); setFindBarMode("find"); }
      if (ctrl && e.key === "h") { e.preventDefault(); setFindBarMode("replace"); }
      if (ctrl && e.key === "k") { e.preventDefault(); setDialogOpen("hyperlink"); }
      if (ctrl && e.key === "d") { e.preventDefault(); setDialogOpen("font"); }
      if (ctrl && e.key === "p") { e.preventDefault(); window.print(); }
      if (ctrl && e.altKey && e.key === "m") { e.preventDefault(); handleInsertComment(); }
      if (e.key === "F11") { e.preventDefault(); handleToggleFullscreen(); }
      if (ctrl && e.shiftKey && e.key === ">") { e.preventDefault(); editor?.chain().focus().setFontSize((() => { const s = parseFloat(editor?.getAttributes("textStyle").fontSize || "11"); const sizes = [8,9,10,10.5,11,12,14,16,18,20,22,24,28,36,48,72]; return (sizes.find(x => x > s) || 72) + "pt"; })()).run(); }
      if (ctrl && e.shiftKey && e.key === "<") { e.preventDefault(); editor?.chain().focus().setFontSize((() => { const s = parseFloat(editor?.getAttributes("textStyle").fontSize || "11"); const sizes = [8,9,10,10.5,11,12,14,16,18,20,22,24,28,36,48,72]; return ([...sizes].reverse().find(x => x < s) || 8) + "pt"; })()).run(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave, editor, handleToggleFullscreen]);

  /* ──── Ctrl + Mouse Wheel Zoom ──── */
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoom(z => {
          const delta = e.deltaY > 0 ? -10 : 10;
          return Math.max(50, Math.min(200, z + delta));
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

  /* ──── new document ──── */
  const handleNew = () => {
    setDocId(null);
    setDoc({ ...EMPTY_DOC });
    if (editor) editor.commands.setContent("");
    setFootnotes([]);
    commentDispatch({ type: "DELETE_ALL" });
    setSaveStatus("");
    titleRef.current?.focus();
  };

  /* ──── Insert Footnote ──── */
  const handleInsertFootnote = useCallback(() => {
    if (!editor) return;
    const id = generateFootnoteId();
    const content = window.prompt("각주 내용을 입력하세요:");
    if (content === null) return;
    // Insert reference in document
    editor.commands.insertFootnote(id);
    // Add footnote to state
    setFootnotes(prev => [...prev, {
      id,
      number: prev.length + 1,
      content: content || "",
    }]);
  }, [editor]);

  /* ──── Pagination: measure content → update page count ──── */
  const contentAreaHeight = pageH - marginTop - marginBottom; // content area per page in px (unscaled)
  const PAGE_GAP = 40; // gap between pages in px (unscaled)

  useEffect(() => {
    if (!editor) return;
    const measure = () => {
      const dom = editor.view.dom;
      if (!dom) return;
      const scrollH = dom.scrollHeight;
      const pages = Math.max(1, Math.ceil(scrollH / contentAreaHeight));
      setDynamicPageCount(pages);
    };
    // Measure on every update
    editor.on("update", measure);
    // Also measure on initial load
    const timer = setTimeout(measure, 200);
    // ResizeObserver for more accurate tracking
    const ro = new ResizeObserver(measure);
    if (editor.view.dom) ro.observe(editor.view.dom);
    return () => {
      editor.off("update", measure);
      clearTimeout(timer);
      ro.disconnect();
    };
  }, [editor, contentAreaHeight]);

  /* ──── Comment handlers ──── */
  const ensureAuthor = useCallback((callback) => {
    if (commentAuthor) {
      callback(commentAuthor);
    } else {
      // Show author dialog, then call callback
      setShowAuthorDialog(true);
      window._pendingCommentCallback = callback;
    }
  }, [commentAuthor]);

  const handleAuthorSave = useCallback((name, initials) => {
    const author = createAuthor(name, initials);
    saveAuthor(author);
    setCommentAuthor(author);
    setShowAuthorDialog(false);
    // Execute pending callback
    if (window._pendingCommentCallback) {
      window._pendingCommentCallback(author);
      window._pendingCommentCallback = null;
    }
  }, []);

  const handleInsertComment = useCallback(() => {
    if (!editor) return;
    ensureAuthor((author) => {
      const { from, to } = editor.state.selection;
      const id = generateCommentId();

      if (from === to) {
        // No selection — select the word at cursor
        const $pos = editor.state.doc.resolve(from);
        const word = $pos.parent.textContent;
        if (!word.trim()) return;
        // Find word boundaries
        const textBefore = $pos.parent.textBetween(0, $pos.parentOffset);
        const textAfter = $pos.parent.textBetween($pos.parentOffset, $pos.parent.content.size);
        const wordStart = textBefore.search(/\S+$/);
        const wordEndMatch = textAfter.match(/^\S+/);
        const wordEnd = wordEndMatch ? $pos.parentOffset + wordEndMatch[0].length : $pos.parentOffset;
        const absStart = $pos.start() + (wordStart >= 0 ? wordStart : $pos.parentOffset);
        const absEnd = $pos.start() + wordEnd;
        if (absStart < absEnd) {
          editor.chain().focus().setTextSelection({ from: absStart, to: absEnd }).setComment(id).run();
        } else {
          return; // Can't determine word
        }
      } else {
        editor.chain().focus().setComment(id).run();
      }

      const comment = createComment(author, "");
      comment.id = id;
      commentDispatch({ type: "ADD_COMMENT", comment });
      // The balloon will auto-focus for input
    });
  }, [editor, ensureAuthor]);

  const handleDeleteActiveComment = useCallback(() => {
    if (!editor || !commentStore.activeCommentId) return;
    editor.commands.unsetComment(commentStore.activeCommentId);
    commentDispatch({ type: "DELETE_COMMENT", id: commentStore.activeCommentId });
  }, [editor, commentStore.activeCommentId]);

  const handleDeleteAllComments = useCallback(() => {
    if (!editor) return;
    editor.commands.unsetAllComments();
    commentDispatch({ type: "DELETE_ALL" });
  }, [editor]);

  const handleNextComment = useCallback(() => {
    if (!editor) return;
    const { from } = editor.state.selection;
    const next = getNextComment(editor, from);
    if (next) {
      editor.commands.setTextSelection({ from: next.from, to: next.to });
      editor.commands.scrollIntoView();
      commentDispatch({ type: "SET_ACTIVE", id: next.commentId });
    }
  }, [editor]);

  const handlePrevComment = useCallback(() => {
    if (!editor) return;
    const { from } = editor.state.selection;
    const prev = getPrevComment(editor, from);
    if (prev) {
      editor.commands.setTextSelection({ from: prev.from, to: prev.to });
      editor.commands.scrollIntoView();
      commentDispatch({ type: "SET_ACTIVE", id: prev.commentId });
    }
  }, [editor]);

  // Listen for Ctrl+Alt+M via custom event from CommentMark extension
  useEffect(() => {
    const handler = () => handleInsertComment();
    window.addEventListener("comment:insert", handler);
    return () => window.removeEventListener("comment:insert", handler);
  }, [handleInsertComment]);

  // Apply active/resolved classes to comment highlights
  useEffect(() => {
    if (!editor) return;
    const updateHighlights = () => {
      const dom = editor.view.dom;
      dom.querySelectorAll("span.comment-highlight").forEach((el) => {
        const id = el.getAttribute("data-comment-id");
        el.classList.toggle("comment-active", id === commentStore.activeCommentId);
        const comment = commentStore.comments[id];
        el.classList.toggle("comment-resolved", comment?.resolved ?? false);
      });
    };
    updateHighlights();
    editor.on("update", updateHighlights);
    return () => editor.off("update", updateHighlights);
  }, [editor, commentStore.activeCommentId, commentStore.comments]);

  /* ──── Import DOCX ──── */
  const handleImportDocx = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".docx";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const html = await importDocx(file);
      if (html && editor) {
        editor.commands.setContent(html);
        setDoc(d => ({ ...d, title: file.name.replace(".docx", "") }));
        setSaveStatus("불러옴");
      }
    };
    input.click();
  };

  /* ──── Export handlers ──── */
  const handleExportDocx = () => {
    if (editor) exportDocx(editor.getHTML(), doc.title || "문서");
  };
  const handleExportPdf = () => {
    // Use the actual editor DOM element for accurate rendering
    const el = editor?.view?.dom || editorCanvasRef.current?.querySelector(".ProseMirror");
    if (el) exportPdf(el, doc.title || "문서");
    else alert("에디터 요소를 찾을 수 없습니다.");
  };
  const handleExportHtml = () => {
    if (editor) exportHtml(editor.getHTML(), doc.title || "문서");
  };

  /* ──── Counts ──── */
  const charCount = editor?.storage.characterCount?.characters() || 0;
  const wordCount = editor?.storage.characterCount?.words() || 0;
  const pageCount = Math.max(1, Math.ceil(charCount / 1800));

  /* ──── Page dimensions ──── */
  const pageDim = PAGE_SIZES.find(p => p.value === pageSize) || PAGE_SIZES[0];
  const marginPreset = MARGIN_PRESETS.find(m => m.value === margins) || MARGIN_PRESETS[1];
  const pageW = orientation === "portrait" ? pageDim.width : pageDim.height;
  const pageH = orientation === "portrait" ? pageDim.height : pageDim.width;
  const marginTop = margins === "custom" ? customMargins.top : marginPreset.top;
  const marginBottom = margins === "custom" ? customMargins.bottom : marginPreset.bottom;
  const marginLeft = margins === "custom" ? customMargins.left : marginPreset.left;
  const marginRight = margins === "custom" ? customMargins.right : marginPreset.right;

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

  /* ──── Page-width fit ──── */
  const handleFitPageWidth = useCallback(() => {
    const scrollEl = document.querySelector(".editor-canvas-scroll");
    if (!scrollEl) return;
    const availWidth = scrollEl.clientWidth - 60; // padding
    const newZoom = Math.round((availWidth / pageW) * 100);
    setZoom(Math.max(50, Math.min(200, newZoom)));
  }, [pageW]);

  const RIBBON_TABS = [
    { id: "file", label: "파일" },
    { id: "home", label: "홈" },
    { id: "insert", label: "삽입" },
    { id: "design", label: "디자인" },
    { id: "layout", label: "레이아웃" },
    { id: "references", label: "참조" },
    { id: "review", label: "검토" },
    { id: "view", label: "보기" },
  ];

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }} className={`word-editor-root${darkMode ? " dark-mode" : ""} comment-markup-${commentStore.markupMode}`}>
      <style>{editorStyles}</style>

      {/* ──── Splash Screen ──── */}
      {loading && (
        <div className="editor-splash">
          <div className="logo">YJ Editor</div>
          <div className="subtitle">윤정 법률사무소 문서 편집기</div>
          <div className="loading-bar" />
        </div>
      )}

      {/* ──── Author Setup Dialog ──── */}
      {showAuthorDialog && (
        <AuthorSetupDialog
          onSave={handleAuthorSave}
          onCancel={() => { setShowAuthorDialog(false); window._pendingCommentCallback = null; }}
        />
      )}

      {/* ──── Backstage View ──── */}
      {showBackstage && (
        <BackstageView
          doc={doc} setDoc={setDoc}
          onClose={() => setShowBackstage(false)}
          onNew={() => { handleNew(); setShowBackstage(false); }}
          onSave={() => { handleSave(false); setShowBackstage(false); }}
          onExportDocx={handleExportDocx}
          onExportPdf={handleExportPdf}
          onExportHtml={handleExportHtml}
          onImportDocx={handleImportDocx}
          onPrint={() => window.print()}
        />
      )}

      {/* ──── Dialogs ──── */}
      {dialogOpen === "font" && <FontDialog editor={editor} onClose={() => setDialogOpen(null)} />}
      {dialogOpen === "paragraph" && <ParagraphDialog editor={editor} onClose={() => setDialogOpen(null)} />}
      {dialogOpen === "pagesetup" && <PageSetupDialog margins={margins} setMargins={setMargins} orientation={orientation} setOrientation={setOrientation} pageSize={pageSize} setPageSize={setPageSize} customMargins={customMargins} setCustomMargins={setCustomMargins} onClose={() => setDialogOpen(null)} />}
      {dialogOpen === "hyperlink" && <HyperlinkDialog editor={editor} onClose={() => setDialogOpen(null)} />}
      {dialogOpen === "table" && <TablePropertiesDialog editor={editor} onClose={() => setDialogOpen(null)} />}
      {dialogOpen === "image" && <ImageDialog editor={editor} onClose={() => setDialogOpen(null)} />}

      {/* ──── Left Sidebar: Document List ──── */}
      <DocListSidebar
        documents={documents} onSelect={loadDocument} currentId={docId}
        onNew={handleNew} search={sidebarSearch} setSearch={setSidebarSearch}
        collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}
      />

      {/* ──── Right: Editor Area (MS Word clone) ──── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* ═══ Title Bar ═══ */}
        <div style={{
          height: 34, background: darkMode ? "#1a1a2e" : "#1e3a5f", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 10px", flexShrink: 0, color: "#fff",
          fontFamily: "'Segoe UI', '맑은 고딕', sans-serif",
        }}>
          {/* Quick Access Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FileText size={14} style={{ marginRight: 6, opacity: 0.8 }} />
            {[
              { icon: <Save size={13} />, title: "저장 (Ctrl+S)", fn: () => handleSave(false) },
              { icon: <Undo2 size={13} />, title: "실행 취소 (Ctrl+Z)", fn: () => editor?.chain().focus().undo().run() },
              { icon: <Redo2 size={13} />, title: "다시 실행 (Ctrl+Y)", fn: () => editor?.chain().focus().redo().run() },
            ].map((btn, i) => (
              <button key={i} type="button" onClick={btn.fn} title={btn.title}
                style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "3px 5px", borderRadius: 3, display: "flex", alignItems: "center" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}>{btn.icon}</button>
            ))}
            {/* Dark mode toggle */}
            <button type="button" onClick={() => setDarkMode(!darkMode)} title="다크 모드"
              style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "3px 5px", borderRadius: 3, display: "flex", alignItems: "center", marginLeft: 4 }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              {darkMode ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </div>

          {/* Document Title */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <input
              ref={titleRef} type="text"
              value={doc.title ? doc.title + " - Word" : "문서 - Word"}
              onChange={e => {
                const val = e.target.value.replace(/ - Word$/, "");
                setDoc(d => ({ ...d, title: val }));
              }}
              onFocus={e => {
                const end = e.target.value.lastIndexOf(" - Word");
                if (end > 0) e.target.setSelectionRange(0, end);
              }}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); editor?.commands.focus(); } }}
              style={{
                maxWidth: 400, textAlign: "center", fontSize: 11, fontWeight: 400,
                border: "none", outline: "none", background: "transparent", color: "#fff",
                fontFamily: "'맑은 고딕', 'Segoe UI', sans-serif", width: "100%",
              }}
            />
          </div>

          {/* Save status */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, color: saveStatus === "오류" ? "#ff8888" : "rgba(255,255,255,0.75)" }}>
              {saveStatus}
            </span>
          </div>
        </div>

        {/* ═══ Ribbon Tabs ═══ */}
        <div style={{
          height: 32, background: darkMode ? "#2d2d2d" : "#f3f3f3", borderBottom: "1px solid var(--ribbon-sep, #d1d5db)",
          display: "flex", alignItems: "flex-end", padding: "0 4px", flexShrink: 0,
        }}>
          {RIBBON_TABS.map(tab => (
            <button
              key={tab.id} className="word-tab-btn"
              onClick={() => {
                if (tab.id === "file") {
                  setShowBackstage(true);
                } else {
                  setActiveTab(tab.id);
                }
              }}
              style={{
                padding: "6px 14px 5px", border: "none",
                borderBottom: activeTab === tab.id ? "2px solid #3b82f6" : "2px solid transparent",
                background: activeTab === tab.id ? "#ffffff" : "transparent",
                color: tab.id === "file" ? "#fff" : activeTab === tab.id ? "#1e3a5f" : "#555",
                fontSize: 11, fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: "pointer", borderRadius: activeTab === tab.id ? "2px 2px 0 0" : 0,
                fontFamily: "'맑은 고딕', sans-serif",
                ...(tab.id === "file" ? { background: "#1e3a5f", borderRadius: "2px 2px 0 0", marginRight: 4 } : {}),
              }}
            >{tab.label}</button>
          ))}
          <div style={{ flex: 1 }} />
          <button type="button" onClick={() => setMetaOpen(true)} title="문서 속성" className="word-tab-btn"
            style={{ padding: "4px 10px", border: "none", background: "transparent", color: "var(--ribbon-label, #777)", fontSize: 10, cursor: "pointer", marginRight: 4, display: "flex", alignItems: "center", gap: 3 }}>
            <Settings size={10} /> 속성
          </button>
          <button type="button" onClick={() => setRibbonCollapsed(!ribbonCollapsed)} title={ribbonCollapsed ? "리본 펼치기" : "리본 접기"}
            className="word-tab-btn"
            style={{ padding: "4px 6px", border: "none", background: "transparent", color: "var(--ribbon-label, #777)", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center" }}>
            {ribbonCollapsed ? <PanelTop size={12} /> : <PanelTopClose size={12} />}
          </button>
        </div>

        {/* ═══ Ribbon Content ═══ */}
        {!ribbonCollapsed && viewMode === "edit" && activeTab === "home" && (
          <HomeTab editor={editor}
            onShowFind={() => setFindBarMode("find")}
            onShowReplace={() => setFindBarMode("replace")}
            onOpenFontDialog={() => setDialogOpen("font")}
            onOpenParagraphDialog={() => setDialogOpen("paragraph")}
          />
        )}
        {!ribbonCollapsed && viewMode === "edit" && activeTab === "insert" && (
          <InsertTab editor={editor}
            onOpenHyperlinkDialog={() => setDialogOpen("hyperlink")}
            onOpenImageDialog={() => setDialogOpen("image")}
          />
        )}
        {!ribbonCollapsed && viewMode === "edit" && activeTab === "design" && (
          <DesignTab pageColor={pageColor} setPageColor={setPageColor} watermarkText={watermarkText} setWatermarkText={setWatermarkText} />
        )}
        {!ribbonCollapsed && viewMode === "edit" && activeTab === "layout" && (
          <LayoutTab margins={margins} setMargins={setMargins} orientation={orientation} setOrientation={setOrientation}
            pageSize={pageSize} setPageSize={setPageSize} columns={columns} setColumns={setColumns}
            onOpenPageSetupDialog={() => setDialogOpen("pagesetup")} editor={editor}
          />
        )}
        {!ribbonCollapsed && viewMode === "edit" && activeTab === "references" && <ReferencesTab editor={editor} onInsertFootnote={handleInsertFootnote} />}
        {!ribbonCollapsed && viewMode === "edit" && activeTab === "review" && (
          <ReviewTab editor={editor}
            onInsertComment={handleInsertComment}
            onDeleteComment={handleDeleteActiveComment}
            onDeleteAllComments={handleDeleteAllComments}
            onPrevComment={handlePrevComment}
            onNextComment={handleNextComment}
            commentStore={commentStore}
            commentDispatch={commentDispatch}
          />
        )}
        {!ribbonCollapsed && viewMode === "edit" && activeTab === "view" && (
          <ViewTab showRuler={showRuler} setShowRuler={setShowRuler} viewMode={viewMode} setViewMode={setViewMode}
            zoom={zoom} setZoom={setZoom} showNavPane={showNavPane} setShowNavPane={setShowNavPane}
            onNew={handleNew} darkMode={darkMode} setDarkMode={setDarkMode}
            onFitPageWidth={handleFitPageWidth} onToggleFullscreen={handleToggleFullscreen} isFullscreen={isFullscreen} />
        )}

        {findBarMode && <FindReplaceBar editor={editor} showReplace={findBarMode === "replace"} onClose={() => setFindBarMode(null)} />}

        {/* ═══ Ruler ═══ */}
        {showRuler && (
          <div style={{
            height: 22, background: "#f5f5f5", borderBottom: "1px solid #e0e0e0",
            display: "flex", alignItems: "flex-end", justifyContent: "center", flexShrink: 0,
          }}>
            <div style={{ width: showNavPane ? 220 : 0, flexShrink: 0 }} />
            {showRuler && (
              <div style={{ width: 20, flexShrink: 0 }} />
            )}
            <div style={{ width: `${pageW * (zoom / 100)}px`, maxWidth: "calc(100% - 56px)", position: "relative", height: "100%" }}>
              {/* Margin indicators */}
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: `${marginLeft * (zoom / 100)}px`, background: "#e0e0e0",
              }} />
              <div style={{
                position: "absolute", right: 0, top: 0, bottom: 0,
                width: `${marginRight * (zoom / 100)}px`, background: "#e0e0e0",
              }} />
              {/* Tick marks */}
              {Array.from({ length: 22 }, (_, i) => {
                const pct = (i / 21) * 100;
                return (
                  <div key={i} style={{ position: "absolute", left: `${pct}%`, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 1, height: i % 5 === 0 ? 8 : 4, background: i % 5 === 0 ? "#888" : "#bbb" }} />
                    {i % 5 === 0 && i > 0 && i < 21 && (
                      <span style={{ fontSize: 7, color: "#999", position: "absolute", top: 1, left: 3 }}>{i}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ width: 28, flexShrink: 0 }} />
          </div>
        )}

        {/* ═══ Editor Canvas ═══ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Horizontal reviewing pane */}
          {commentStore.showReviewingPane === "horizontal" && (
            <div style={{ order: 2 }}>
              <ReviewingPane mode="horizontal" commentStore={commentStore} dispatch={commentDispatch}
                currentAuthor={commentAuthor} editor={editor}
                onClose={() => commentDispatch({ type: "SET_REVIEWING_PANE", mode: null })} />
            </div>
          )}

          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Vertical reviewing pane */}
          {commentStore.showReviewingPane === "vertical" && (
            <ReviewingPane mode="vertical" commentStore={commentStore} dispatch={commentDispatch}
              currentAuthor={commentAuthor} editor={editor}
              onClose={() => commentDispatch({ type: "SET_REVIEWING_PANE", mode: null })} />
          )}

          {/* Navigation Pane */}
          {showNavPane && <NavigationPane editor={editor} onClose={() => setShowNavPane(false)} />}

          <div className="editor-canvas-scroll" style={{
            flex: 1, overflowY: "auto", background: darkMode ? "#1a1a1a" : "#a0a0a0",
            display: "flex", justifyContent: "center", padding: "24px 0 40px",
            position: "relative",
          }}>
            {/* Vertical ruler */}
            {showRuler && (
              <div style={{
                width: 20, flexShrink: 0, background: "#f5f5f5", borderRight: "1px solid #e0e0e0",
                position: "sticky", top: 0, alignSelf: "flex-start", minHeight: "100%",
              }}>
                {Array.from({ length: 30 }, (_, i) => (
                  <div key={i} style={{ position: "relative", height: `${(pageH * (zoom / 100)) / 29}px` }}>
                    <div style={{
                      position: "absolute", right: 0, top: 0,
                      width: i % 5 === 0 ? 8 : 4, height: 1,
                      background: i % 5 === 0 ? "#888" : "#bbb",
                    }} />
                    {i % 5 === 0 && i > 0 && (
                      <span style={{ fontSize: 7, color: "#999", position: "absolute", right: 10, top: -4 }}>{i}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ═══ Multi-page A4 Area ═══ */}
            <div ref={editorCanvasRef} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: `${PAGE_GAP * (zoom / 100)}px`, flexShrink: 0,
            }}>
              {Array.from({ length: dynamicPageCount }, (_, pageIdx) => {
                const scaledPageW = pageW * (zoom / 100);
                const scaledPageH = pageH * (zoom / 100);
                const scaledMT = marginTop * (zoom / 100);
                const scaledMB = marginBottom * (zoom / 100);
                const scaledML = marginLeft * (zoom / 100);
                const scaledMR = marginRight * (zoom / 100);
                const scaledContentH = contentAreaHeight * (zoom / 100);
                const isFirstPage = pageIdx === 0;

                return (
                  <div key={pageIdx} className="editor-page-area" style={{
                    width: scaledPageW,
                    height: scaledPageH,
                    background: darkMode ? "#2d2d2d" : (pageColor || "#fff"),
                    boxShadow: "0 2px 8px rgba(0,0,0,0.25), 0 0 1px rgba(0,0,0,0.15)",
                    position: "relative",
                    overflow: "hidden",
                  }}>
                    {/* Watermark */}
                    {watermarkText && (
                      <div style={{
                        position: "absolute", top: "50%", left: "50%",
                        transform: "translate(-50%, -50%) rotate(-45deg)",
                        fontSize: `${60 * (zoom / 100)}px`, color: "rgba(0,0,0,0.06)",
                        fontWeight: 700, whiteSpace: "nowrap", pointerEvents: "none",
                        zIndex: 0, userSelect: "none",
                      }}>{watermarkText}</div>
                    )}

                    {/* Corner markers */}
                    {[
                      { top: 4, left: 4, borderTop: "1px solid #d0d0d0", borderLeft: "1px solid #d0d0d0" },
                      { top: 4, right: 4, borderTop: "1px solid #d0d0d0", borderRight: "1px solid #d0d0d0" },
                      { bottom: 4, left: 4, borderBottom: "1px solid #d0d0d0", borderLeft: "1px solid #d0d0d0" },
                      { bottom: 4, right: 4, borderBottom: "1px solid #d0d0d0", borderRight: "1px solid #d0d0d0" },
                    ].map((s, i) => (
                      <div key={i} style={{ position: "absolute", width: 10, height: 10, ...s }} />
                    ))}

                    {/* Header */}
                    {showHeaderFooter && viewMode === "edit" && (
                      <div style={{
                        position: "absolute", top: 8, left: scaledML, right: scaledMR,
                        height: scaledMT - 16,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: `${9 * (zoom / 100)}pt`, color: "#aaa",
                        pointerEvents: isFirstPage ? "auto" : "none",
                      }}>
                        {isFirstPage ? (
                          <input type="text" value={headerText} onChange={(e) => setHeaderText(e.target.value)}
                            placeholder="머리글" style={{
                              width: "100%", border: "none", outline: "none", background: "transparent",
                              textAlign: "center", fontSize: "inherit", color: "#999", fontFamily: "'맑은 고딕', sans-serif",
                            }} />
                        ) : (
                          <span>{headerText}</span>
                        )}
                      </div>
                    )}

                    {/* Editor content — only rendered in the first page shell,
                        subsequent pages use CSS clip to show the right portion */}
                    {isFirstPage ? (
                      <div style={{
                        position: "absolute",
                        top: scaledMT,
                        left: scaledML,
                        right: scaledMR,
                        bottom: scaledMB,
                        overflow: "visible",
                        columnCount: columns > 1 ? columns : undefined,
                        columnGap: columns > 1 ? `${30 * (zoom / 100)}px` : undefined,
                      }}>
                        {/* Title */}
                        {doc.title && viewMode === "edit" && (
                          <div style={{
                            fontSize: `${22 * (zoom / 100)}px`, fontWeight: 700, color: "#1a1a1a",
                            marginBottom: 8, fontFamily: "'Noto Serif KR', Georgia, serif",
                          }}>{doc.title}</div>
                        )}
                        {doc.subtitle && viewMode === "edit" && (
                          <div style={{
                            fontSize: `${14 * (zoom / 100)}px`, color: "#777", marginBottom: 20,
                            fontFamily: "'맑은 고딕', sans-serif",
                          }}>{doc.subtitle}</div>
                        )}

                        {viewMode === "edit" ? (
                          <>
                            <EditorContent editor={editor} />
                            <FootnoteArea
                              editor={editor}
                              footnotes={footnotes}
                              setFootnotes={setFootnotes}
                              onHeightChange={setFootnoteAreaHeight}
                            />
                            <FloatingToolbar editor={editor} onInsertComment={handleInsertComment} />
                            <ContextMenu editor={editor}
                              onOpenFontDialog={() => setDialogOpen("font")}
                              onOpenParagraphDialog={() => setDialogOpen("paragraph")}
                              onOpenHyperlinkDialog={() => setDialogOpen("hyperlink")}
                              onOpenTableDialog={() => setDialogOpen("table")}
                              onInsertComment={handleInsertComment}
                              commentStore={commentStore}
                              commentDispatch={commentDispatch}
                              commentAuthor={commentAuthor}
                            />
                            <CommentIndicators editor={editor} commentStore={commentStore} dispatch={commentDispatch} />
                          </>
                        ) : (
                          <div className="ProseMirror"
                            style={{ minHeight: 900, fontFamily: "'맑은 고딕', sans-serif", fontSize: "11pt", lineHeight: 1.75, color: "#1a1a1a" }}
                            dangerouslySetInnerHTML={{ __html: editor?.getHTML() || "" }}
                          />
                        )}
                      </div>
                    ) : (
                      /* Subsequent pages: show continuation of content via negative offset */
                      <div style={{
                        position: "absolute",
                        top: scaledMT,
                        left: scaledML,
                        right: scaledMR,
                        bottom: scaledMB,
                        overflow: "hidden",
                        pointerEvents: "none",
                      }} />
                    )}

                    {/* Footer / Page number */}
                    <div style={{
                      position: "absolute", bottom: 8, left: scaledML, right: scaledMR,
                      height: scaledMB - 16,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: `${9 * (zoom / 100)}pt`, color: "#aaa",
                      pointerEvents: isFirstPage ? "auto" : "none",
                    }}>
                      {isFirstPage && showHeaderFooter && viewMode === "edit" ? (
                        <input type="text" value={footerText} onChange={(e) => setFooterText(e.target.value)}
                          placeholder={`- ${pageIdx + 1} -`}
                          style={{
                            width: "100%", border: "none", outline: "none", background: "transparent",
                            textAlign: "center", fontSize: "inherit", color: "#999", fontFamily: "'맑은 고딕', sans-serif",
                          }} />
                      ) : (
                        <span style={{ color: "#bbb" }}>{footerText || `- ${pageIdx + 1} -`}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comment Panel (right side) */}
          {commentStore.markupMode === "all" && commentStore.showCommentsPanel && Object.keys(commentStore.comments).length > 0 && (
            <CommentPanel
              editor={editor}
              commentStore={commentStore}
              dispatch={commentDispatch}
              currentAuthor={commentAuthor}
            />
          )}

          </div>{/* end flex row */}
        </div>{/* end flex column */}

        {/* ═══ Status Bar ═══ */}
        <div style={{
          height: 26, background: darkMode ? "#1a1a2e" : "#1e3a5f", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 12px", flexShrink: 0,
          color: "rgba(255,255,255,0.9)", fontSize: 10,
          fontFamily: "'Segoe UI', '맑은 고딕', sans-serif",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span>{dynamicPageCount}/{dynamicPageCount} 페이지</span>
            <span>단어 수: {wordCount.toLocaleString()}</span>
            <span>{charCount.toLocaleString()}자</span>
            <span>한국어</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {[
              { mode: "preview", icon: <BookOpen size={12} />, title: "읽기 모드" },
              { mode: "edit", icon: <FileText size={12} />, title: "인쇄 모드" },
              { mode: "web", icon: <Globe size={12} />, title: "웹 모드" },
            ].map(v => (
              <button key={v.mode} type="button" onClick={() => setViewMode(v.mode)} title={v.title}
                style={{ background: "none", border: "none", color: viewMode === v.mode ? "#fff" : "rgba(255,255,255,0.4)", cursor: "pointer", padding: "0 3px", display: "flex", alignItems: "center" }}>
                {v.icon}
              </button>
            ))}
            <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.25)", margin: "0 4px" }} />
            <button type="button" onClick={() => setZoom(z => Math.max(25, z - 10))} title="축소"
              style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "0 3px", display: "flex" }}>
              <ZoomOut size={12} />
            </button>
            <input type="range" min="25" max="500" value={zoom}
              onChange={e => setZoom(+e.target.value)}
              style={{ width: 90, height: 3, accentColor: "#fff", cursor: "pointer" }} />
            <span style={{ width: 32, textAlign: "center", fontSize: 10 }}>{zoom}%</span>
            <button type="button" onClick={() => setZoom(z => Math.min(500, z + 10))} title="확대"
              style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "0 3px", display: "flex" }}>
              <ZoomIn size={12} />
            </button>
          </div>
        </div>

        {/* ──── Meta Drawer ──── */}
        {metaOpen && (
          <div onClick={() => setMetaOpen(false)}
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.15)", zIndex: 999 }}
          />
        )}
        <MetaDrawer doc={doc} setDoc={setDoc} tags={tags} open={metaOpen} onClose={() => setMetaOpen(false)} />
      </div>
    </div>
  );
}
