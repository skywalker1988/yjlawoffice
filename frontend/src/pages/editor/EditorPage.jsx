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
import {
  FontSize, LineSpacing, Indent, ParagraphSpacing,
  PageBreak, SectionBreak, ColumnBreak, LetterSpacing, TextShadow,
  TextBorder, ParagraphBorder, DropCap, KeepWithNext, WidowOrphan,
  TextDirection, Bookmark,
  TrackInsert, TrackDelete, TrackFormat, TrackChangesManager,
  PageNumberField, DateField, NonBreakingSpace, LineNumbers,
} from "./modules/extensions";
import { CommentMark } from "./modules/comment-mark";
import {
  createCommentStore, commentReducer, createComment, generateCommentId,
  loadAuthor, saveAuthor, createAuthor, findCommentMarks, getNextComment, getPrevComment,
  getAllThreads, saveCommentsToLocal, loadCommentsFromLocal,
} from "./modules/comment-store";
import { CommentPanel, CommentIndicators, ReviewingPane, AuthorSetupDialog } from "./modules/CommentPanel";

/* ── UI Components ── */
import { editorStyles } from "./modules/styles";
import { DOC_TYPES, EMPTY_DOC, MARGIN_PRESETS, PAGE_SIZES, COUNTRY_CODES, TYPE_NUMBERS, REGION_NUMBERS, CAT_NUMBERS } from "./modules/constants";
import { HomeTab } from "./modules/HomeTab";
import { InsertTab } from "./modules/InsertTab";
import { DesignTab, LayoutTab, ReferencesTab, ReviewTab, ViewTab } from "./modules/OtherTabs";
import { DrawTab } from "./modules/DrawTab";
import { FindReplaceBar, FontDialog, ParagraphDialog, PageSetupDialog, HyperlinkDialog, TablePropertiesDialog as OrigTablePropsDialog, ImageDialog } from "./modules/Dialogs";
import { BorderShadingDialog, TablePropertiesDialog as NewTablePropsDialog, BookmarkDialog, CrossReferenceDialog, PageBorderDialog, WatermarkDialog } from "./modules/NewDialogs";
import { PrintPreviewDialog, StylesManagerDialog, SymbolPickerDialog } from "./modules/PrintPreviewDialog";
import { FloatingToolbar } from "./modules/FloatingToolbar";
import { BackstageView } from "./modules/BackstageView";
import { NavigationPane } from "./modules/NavigationPane";
import { ContextMenu } from "./modules/ContextMenu";
import { FootnoteReference, generateFootnoteId } from "./modules/footnote-extension";
import { FootnoteArea } from "./modules/FootnoteArea";
import { isMarkdown, htmlToMarkdown, exportHtml, exportDocx, exportPdf, exportMarkdown, exportHwpx, importDocx, autoSaveToLocal, loadAutoSave } from "./modules/fileUtils";
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
  const [headerFooterSettings, setHeaderFooterSettings] = useState({
    headerPos: 12.5, footerPos: 12.5, differentFirstPage: false, differentOddEven: false,
  });

  /* ── Comment State ── */
  const [commentStore, commentDispatch] = useReducer(commentReducer, null, createCommentStore);
  const [commentAuthor, setCommentAuthor] = useState(() => loadAuthor());
  const [showAuthorDialog, setShowAuthorDialog] = useState(false);

  /* ── Track Changes State ── */
  const [trackChangesEnabled, setTrackChangesEnabled] = useState(false);

  /* ── Dialog State ── */
  const [dialogOpen, setDialogOpen] = useState(null); // "font" | "paragraph" | "pagesetup" | "hyperlink" | "table" | "image" | "border" | "bookmark" | "crossref" | "pageborder" | "watermark" | "printpreview" | "stylesmanager" | "symbol"
  const [pageBorder, setPageBorder] = useState(null);

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
    ],
    editable: true,
    onUpdate: ({ editor: editorInstance }) => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      setSaveStatus("수정됨");
      // 로컬 저장은 즉시 (1초 후)
      autoSaveTimer.current = setTimeout(() => {
        if (editorInstance && !editorInstance.isDestroyed) {
          autoSaveToLocal(editorInstance.getHTML(), doc);
          setSaveStatus("로컬 저장됨");
        }
        // 서버 저장은 3초 후
        setTimeout(() => handleSave(true), 2000);
      }, 1000);
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

  /* ──── 자동 저장 복원: 에디터 준비 후 로컬 백업이 있으면 복원 여부 확인 ──── */
  useEffect(() => {
    if (!editor || docId) return; // 이미 문서를 로드한 경우 건너뜀
    const saved = loadAutoSave();
    if (saved && saved.html) {
      const shouldRestore = window.confirm("이전에 자동 저장된 문서가 있습니다. 복원하시겠습니까?");
      if (shouldRestore) {
        editor.commands.setContent(saved.html);
        if (saved.title) setDoc(d => ({ ...d, title: saved.title }));
        setSaveStatus("복원됨");
      }
    }
  }, [editor]); // eslint-disable-line react-hooks/exhaustive-deps

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

  /* ──── Keyboard Shortcuts (ref로 최신 핸들러 참조 — 선언 순서 무관) ──── */
  const handleInsertCommentRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "s") { e.preventDefault(); handleSave(false); }
      if (ctrl && e.key === "f") { e.preventDefault(); setFindBarMode("find"); }
      if (ctrl && e.key === "h") { e.preventDefault(); setFindBarMode("replace"); }
      if (ctrl && e.key === "k") { e.preventDefault(); setDialogOpen("hyperlink"); }
      if (ctrl && e.key === "d") { e.preventDefault(); setDialogOpen("font"); }
      if (ctrl && e.key === "p") { e.preventDefault(); setDialogOpen("printpreview"); }
      if (ctrl && e.altKey && e.key === "m") { e.preventDefault(); handleInsertCommentRef.current?.(); }
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
          return Math.max(25, Math.min(500, z + delta));
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

  /* ──── Page dimensions (pagination 등에서 참조하므로 먼저 선언) ──── */
  const pageDim = PAGE_SIZES.find(p => p.value === pageSize) || PAGE_SIZES[0];
  const marginPreset = MARGIN_PRESETS.find(m => m.value === margins) || MARGIN_PRESETS[1];
  const pageW = orientation === "portrait" ? pageDim.width : pageDim.height;
  const pageH = orientation === "portrait" ? pageDim.height : pageDim.width;
  const marginTop = margins === "custom" ? customMargins.top : marginPreset.top;
  const marginBottom = margins === "custom" ? customMargins.bottom : marginPreset.bottom;
  const marginLeft = margins === "custom" ? customMargins.left : marginPreset.left;
  const marginRight = margins === "custom" ? customMargins.right : marginPreset.right;

  /* ──── Pagination (워드 스타일 페이지 전환) ──── */
  const contentAreaHeight = pageH - marginTop - marginBottom;
  const PAGE_GAP = 40;
  const gapH = marginBottom + PAGE_GAP + marginTop;

  const [pageBreaks, setPageBreaks] = useState([]);

  /* 최신값을 ref로 유지 — effect 재등록 없이 참조 */
  const pgRef = useRef({ contentAreaHeight, marginTop, marginBottom, gapH, pageH });
  pgRef.current = { contentAreaHeight, marginTop, marginBottom, gapH, pageH };

  /* 디바운스 타이머 ref */
  const pageBreakTimer = useRef(null);
  /* 이전 페이지 브레이크 수 — 변경 시 스크롤 보정용 */
  const prevBreakCount = useRef(0);

  useEffect(() => {
    if (!editor) return;

    /**
     * 워드 스타일 페이지네이션 핵심 알고리즘:
     * - 요소가 페이지 경계에 걸치면, 요소 높이가 작으면 다음 페이지로 이동
     * - 요소가 페이지 높이보다 크면 그 자리에 두고 오버레이로 처리
     * - 엔터 시 생기는 빈 줄이 경계를 넘으면 즉시 다음 페이지로 이동
     * - 페이지 전환 후 커서가 보이도록 자동 스크롤
     */
    const applyPageBreaks = () => {
      const dom = editor.view.dom;
      if (!dom) return;
      const { contentAreaHeight: caH, marginTop: mT, gapH: gap } = pgRef.current;
      if (caH <= 0) return;

      /* 1단계: 이전에 주입한 margin 전부 제거 */
      dom.querySelectorAll("[data-pb]").forEach(el => {
        el.style.marginTop = "";
        el.removeAttribute("data-pb");
      });
      /* 강제 reflow — margin 제거 후 정확한 레이아웃 확보 */
      void dom.offsetHeight;

      /* 2단계: 모든 자식의 위치를 한 번에 측정 (margin 없는 상태) */
      const children = Array.from(dom.children);
      const measurements = children.map(child => ({
        el: child,
        top: child.offsetTop,
        height: child.offsetHeight,
        bottom: child.offsetTop + child.offsetHeight,
      }));

      /* 3단계: 페이지 경계를 넘는 요소 찾아 margin 주입 */
      let pageNum = 1;
      const breaks = [];
      let nextBreak = caH;
      let accumulatedGap = 0;

      for (let i = 0; i < measurements.length; i++) {
        const m = measurements[i];
        /* 누적 gap을 빼서 실제 콘텐츠 위치 계산 */
        const realTop = m.top - accumulatedGap;
        const realBottom = m.bottom - accumulatedGap;

        if (realBottom <= nextBreak) continue;

        /**
         * 이 요소가 페이지 경계를 넘음. 판단 기준:
         * 1) 요소 높이가 콘텐츠 영역보다 크면 → 분할 불가, 현 위치 유지
         * 2) 요소 상단이 경계보다 아래면 → 이전 요소가 경계까지 차지, 이 요소는 다음 페이지
         * 3) 요소 상단이 경계 근처(하위 20%)면 → 다음 페이지로 밀기 (과부(widow) 방지)
         * 4) 요소가 경계를 가로지르지만 상단이 아직 여유 있으면 → 분할 허용
         */
        const elementFitsInPage = m.height <= caH;
        const topNearBoundary = (nextBreak - realTop) < caH * 0.15;

        if (elementFitsInPage || topNearBoundary) {
          /* 다음 페이지로 이동 */
          const breakY = mT + nextBreak + breaks.length * gap;
          breaks.push(breakY);
          const gapAmount = gap;
          m.el.style.marginTop = `${gapAmount}px`;
          m.el.setAttribute("data-pb", String(pageNum + 1));
          accumulatedGap += gapAmount;
          pageNum++;

          /* 이 요소가 밀린 후의 새 nextBreak 계산 */
          const newRealBottom = realTop + m.height;
          /* 다음 페이지 경계 = 현재 경계 + contentAreaHeight */
          nextBreak += caH;

          /* 밀린 요소가 여전히 다음 경계를 넘는 경우 (매우 긴 요소) */
          while (newRealBottom > nextBreak) {
            const extraBreakY = mT + nextBreak + breaks.length * gap;
            breaks.push(extraBreakY);
            pageNum++;
            nextBreak += caH;
          }
        } else {
          /* 요소가 경계를 걸치지만 상단에 충분한 콘텐츠가 있음 → 분할 허용 */
          /* 오버레이가 시각적으로 처리하므로 margin 주입 없이 넘어감 */
          const breakY = mT + nextBreak + breaks.length * gap;
          breaks.push(breakY);
          pageNum++;
          nextBreak += caH;

          /* 분할된 요소가 여러 페이지에 걸칠 수 있음 */
          while (realBottom > nextBreak) {
            const extraBreakY = mT + nextBreak + breaks.length * gap;
            breaks.push(extraBreakY);
            pageNum++;
            nextBreak += caH;
          }
        }
      }

      setPageBreaks(breaks);
      setDynamicPageCount(pageNum);

      /* 4단계: 페이지가 새로 생겼으면 커서 위치로 부드럽게 스크롤 */
      if (breaks.length !== prevBreakCount.current) {
        prevBreakCount.current = breaks.length;
        scrollToCursor();
      }
    };

    /** 커서가 보이는 영역으로 부드럽게 스크롤 */
    const scrollToCursor = () => {
      requestAnimationFrame(() => {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (!rect || (rect.width === 0 && rect.height === 0)) return;

        const scrollEl = document.querySelector(".editor-canvas-scroll");
        if (!scrollEl) return;

        const containerRect = scrollEl.getBoundingClientRect();
        const cursorRelativeTop = rect.top - containerRect.top;
        const cursorRelativeBottom = rect.bottom - containerRect.top;
        const visibleHeight = containerRect.height;

        /* 커서가 뷰포트 밖에 있으면 스크롤 */
        if (cursorRelativeBottom > visibleHeight - 40) {
          /* 커서가 아래로 벗어남 → 커서를 화면 중간으로 */
          const targetScroll = scrollEl.scrollTop + cursorRelativeBottom - visibleHeight + visibleHeight * 0.4;
          scrollEl.scrollTo({ top: targetScroll, behavior: "smooth" });
        } else if (cursorRelativeTop < 40) {
          /* 커서가 위로 벗어남 */
          const targetScroll = scrollEl.scrollTop + cursorRelativeTop - visibleHeight * 0.4;
          scrollEl.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
        }
      });
    };

    /* 디바운스된 applyPageBreaks — 빠른 타이핑 시 과도한 재계산 방지 */
    const debouncedApply = () => {
      if (pageBreakTimer.current) cancelAnimationFrame(pageBreakTimer.current);
      pageBreakTimer.current = requestAnimationFrame(applyPageBreaks);
    };

    editor.on("update", debouncedApply);
    editor.on("selectionUpdate", debouncedApply);
    const timer = setTimeout(applyPageBreaks, 100);
    const ro = new ResizeObserver(debouncedApply);
    if (editor.view.dom) ro.observe(editor.view.dom);

    return () => {
      editor.off("update", debouncedApply);
      editor.off("selectionUpdate", debouncedApply);
      clearTimeout(timer);
      if (pageBreakTimer.current) cancelAnimationFrame(pageBreakTimer.current);
      ro.disconnect();
    };
  }, [editor]);

  /* 여백/용지 변경 시 즉시 재계산 */
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    if (!dom) return;
    dom.querySelectorAll("[data-pb]").forEach(el => {
      el.style.marginTop = "";
      el.removeAttribute("data-pb");
    });
    /* update 이벤트를 강제 발생시켜 applyPageBreaks 재실행 */
    editor.commands.focus();
  }, [editor, contentAreaHeight, marginTop, gapH]);

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

  // ref 동기화 — 키보드 단축키에서 최신 핸들러 참조
  handleInsertCommentRef.current = handleInsertComment;

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

  /* 댓글 자동 저장: commentStore 변경 시 localStorage에 저장 */
  useEffect(() => {
    if (Object.keys(commentStore.comments).length > 0) {
      saveCommentsToLocal(docId, commentStore.comments);
    }
  }, [commentStore.comments, docId]);

  /* 문서 로드 시 저장된 댓글 복원 */
  useEffect(() => {
    const saved = loadCommentsFromLocal(docId);
    if (saved && Object.keys(saved).length > 0) {
      commentDispatch({ type: "LOAD_COMMENTS", comments: saved });
    }
  }, [docId]);

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
    const el = editor?.view?.dom || editorCanvasRef.current?.querySelector(".ProseMirror");
    if (el) exportPdf(el, doc.title || "문서", { orientation, pageSize });
    else alert("에디터 요소를 찾을 수 없습니다.");
  };
  const handleExportHtml = () => {
    if (editor) exportHtml(editor.getHTML(), doc.title || "문서");
  };
  const handleExportMarkdown = () => {
    if (editor) exportMarkdown(editor.getHTML(), doc.title || "문서");
  };
  const handleExportHwpx = () => {
    if (editor) exportHwpx(editor.getHTML(), doc.title || "문서");
  };

  /* ──── Counts ──── */
  const charCount = editor?.storage.characterCount?.characters() || 0;
  const wordCount = editor?.storage.characterCount?.words() || 0;
  const pageCount = Math.max(1, Math.ceil(charCount / 1800));

  /* ──── Page-width fit ──── */
  const handleFitPageWidth = useCallback(() => {
    const scrollEl = document.querySelector(".editor-canvas-scroll");
    if (!scrollEl) return;
    const availWidth = scrollEl.clientWidth - 60; // padding
    const newZoom = Math.round((availWidth / pageW) * 100);
    setZoom(Math.max(25, Math.min(500, newZoom)));
  }, [pageW]);

  const RIBBON_TABS = [
    { id: "file", label: "파일", isFile: true },
    { id: "home", label: "홈" },
    { id: "insert", label: "삽입" },
    { id: "draw", label: "그리기" },
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
          onExportMarkdown={handleExportMarkdown}
          onExportHwpx={handleExportHwpx}
          onImportDocx={handleImportDocx}
          onPrint={() => window.print()}
        />
      )}

      {/* ──── Dialogs ──── */}
      {dialogOpen === "font" && <FontDialog editor={editor} onClose={() => setDialogOpen(null)} />}
      {dialogOpen === "paragraph" && <ParagraphDialog editor={editor} onClose={() => setDialogOpen(null)} />}
      {dialogOpen === "pagesetup" && <PageSetupDialog margins={margins} setMargins={setMargins} orientation={orientation} setOrientation={setOrientation} pageSize={pageSize} setPageSize={setPageSize} customMargins={customMargins} setCustomMargins={setCustomMargins} headerFooterSettings={headerFooterSettings} setHeaderFooterSettings={setHeaderFooterSettings} onClose={() => setDialogOpen(null)} />}
      {dialogOpen === "hyperlink" && <HyperlinkDialog editor={editor} onClose={() => setDialogOpen(null)} />}
      {dialogOpen === "table" && <OrigTablePropsDialog editor={editor} onClose={() => setDialogOpen(null)} />}
      {dialogOpen === "image" && <ImageDialog editor={editor} onClose={() => setDialogOpen(null)} />}
      {dialogOpen === "border" && <BorderShadingDialog editor={editor} onClose={() => setDialogOpen(null)} />}
      {dialogOpen === "bookmark" && <BookmarkDialog editor={editor} onClose={() => setDialogOpen(null)} />}
      {dialogOpen === "crossref" && <CrossReferenceDialog editor={editor} onClose={() => setDialogOpen(null)} />}
      {dialogOpen === "pageborder" && <PageBorderDialog pageBorder={pageBorder} setPageBorder={setPageBorder} onClose={() => setDialogOpen(null)} />}
      {dialogOpen === "watermark" && <WatermarkDialog watermarkText={watermarkText} setWatermarkText={setWatermarkText} onClose={() => setDialogOpen(null)} />}
      {dialogOpen === "printpreview" && <PrintPreviewDialog editor={editor} onClose={() => setDialogOpen(null)} onPrint={() => { window.print(); setDialogOpen(null); }} pageW={pageW} pageH={pageH} marginTop={marginTop} marginBottom={marginBottom} marginLeft={marginLeft} marginRight={marginRight} />}
      {dialogOpen === "stylesmanager" && <StylesManagerDialog editor={editor} onClose={() => setDialogOpen(null)} onApplyStyle={(style) => {
        if (style.tag === "blockquote") editor?.chain().focus().toggleBlockquote().run();
        else if (style.tag?.startsWith("h")) editor?.chain().focus().toggleHeading({ level: parseInt(style.tag[1]) }).run();
        else editor?.chain().focus().setParagraph().run();
      }} />}
      {dialogOpen === "symbol" && <SymbolPickerDialog editor={editor} onClose={() => setDialogOpen(null)} />}

      {/* ──── Left Sidebar: Document List ──── */}
      <DocListSidebar
        documents={documents} onSelect={loadDocument} currentId={docId}
        onNew={handleNew} search={sidebarSearch} setSearch={setSidebarSearch}
        collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed}
      />

      {/* ──── Right: Editor Area (MS Word clone) ──── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* ═══ Title Bar (MS Word 365 스타일) ═══ */}
        <div style={{
          height: 32, background: darkMode ? "#1e1e1e" : "#185ABD", display: "flex", alignItems: "center",
          padding: "0 8px", flexShrink: 0, color: "#fff",
          fontFamily: "'Segoe UI', '맑은 고딕', sans-serif", userSelect: "none",
        }}>
          {/* Quick Access Toolbar (QAT) */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
            {/* Word 아이콘 */}
            <div style={{ width: 16, height: 16, marginRight: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: -1 }}>W</span>
            </div>
            {[
              { icon: <Save size={12} />, title: "저장 (Ctrl+S)", fn: () => handleSave(false) },
              { icon: <Undo2 size={12} />, title: "실행 취소 (Ctrl+Z)", fn: () => editor?.chain().focus().undo().run() },
              { icon: <Redo2 size={12} />, title: "다시 실행 (Ctrl+Y)", fn: () => editor?.chain().focus().redo().run() },
            ].map((btn, i) => (
              <button key={i} type="button" onClick={btn.fn} title={btn.title}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.85)", cursor: "pointer", padding: "4px 6px", borderRadius: 2, display: "flex", alignItems: "center", lineHeight: 1 }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}>{btn.icon}</button>
            ))}
            {/* QAT 구분선 */}
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.2)", margin: "0 4px" }} />
            {/* 다크 모드 */}
            <button type="button" onClick={() => setDarkMode(!darkMode)} title="다크 모드"
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.85)", cursor: "pointer", padding: "4px 6px", borderRadius: 2, display: "flex", alignItems: "center", lineHeight: 1 }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}>
              {darkMode ? <Sun size={12} /> : <Moon size={12} />}
            </button>
          </div>

          {/* Document Title (가운데 정렬) */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minWidth: 0 }}>
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
                fontFamily: "'Segoe UI', '맑은 고딕', sans-serif", width: "100%",
                letterSpacing: 0.2,
              }}
            />
          </div>

          {/* 오른쪽: 저장 상태 + 최소화/최대화/닫기 */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <span style={{
              fontSize: 10, marginRight: 4,
              color: saveStatus === "오류" ? "#ff8888"
                : saveStatus === "저장됨" ? "#90EE90"
                : saveStatus === "수정됨" ? "#ffdd57"
                : "rgba(255,255,255,0.7)",
            }}>
              {saveStatus === "저장 중..." ? "⟳ 저장 중..." :
               saveStatus === "저장됨" ? "✓ 저장됨" :
               saveStatus === "로컬 저장됨" ? "↓ 로컬 저장" :
               saveStatus === "수정됨" ? "● 수정됨" :
               saveStatus === "오류" ? "✕ 오류" :
               saveStatus}
            </span>
            {/* 창 제어 버튼 (Word 365 스타일) */}
            <button type="button" onClick={() => setMetaOpen(true)} title="문서 속성"
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: "4px 6px", borderRadius: 2, display: "flex", alignItems: "center" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
              <Settings size={13} />
            </button>
          </div>
        </div>

        {/* ═══ Ribbon Tabs (MS Word 365 스타일) ═══ */}
        <div style={{
          height: 36, background: darkMode ? "#2d2d2d" : "#f3f3f3",
          borderBottom: "none",
          display: "flex", alignItems: "stretch", padding: "0 4px 0 0", flexShrink: 0,
        }}>
          {RIBBON_TABS.map(tab => (
            <button
              key={tab.id} className="word-tab-btn"
              onClick={() => {
                if (tab.id === "file") {
                  setShowBackstage(true);
                } else {
                  if (ribbonCollapsed && activeTab === tab.id) {
                    setRibbonCollapsed(false);
                  } else if (!ribbonCollapsed && activeTab === tab.id) {
                    setRibbonCollapsed(true);
                  } else {
                    setActiveTab(tab.id);
                    if (ribbonCollapsed) setRibbonCollapsed(false);
                  }
                }
              }}
              style={{
                padding: "0 14px", border: "none", borderBottom: "none",
                background: tab.isFile
                  ? (darkMode ? "#0078D4" : "#185ABD")
                  : activeTab === tab.id && !ribbonCollapsed
                    ? (darkMode ? "#3a3a3a" : "#ffffff")
                    : "transparent",
                color: tab.isFile
                  ? "#fff"
                  : activeTab === tab.id && !ribbonCollapsed
                    ? (darkMode ? "#fff" : "#185ABD")
                    : (darkMode ? "#ccc" : "#444"),
                fontSize: 12, fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: "pointer",
                fontFamily: "'Segoe UI', '맑은 고딕', sans-serif",
                display: "flex", alignItems: "center",
                borderTop: activeTab === tab.id && !ribbonCollapsed && !tab.isFile
                  ? `2px solid ${darkMode ? "#0078D4" : "#185ABD"}`
                  : "2px solid transparent",
                marginTop: 2,
                borderRadius: 0,
                letterSpacing: 0.3,
                transition: "color 0.1s, background 0.1s",
              }}
            >{tab.label}</button>
          ))}
          <div style={{ flex: 1 }} />
          {/* 리본 접기/펼치기 버튼 */}
          <button type="button" onClick={() => setRibbonCollapsed(!ribbonCollapsed)}
            title={ribbonCollapsed ? "리본 표시 (Ctrl+F1)" : "리본 최소화 (Ctrl+F1)"}
            style={{
              padding: "0 8px", border: "none", background: "transparent",
              color: darkMode ? "#888" : "#666", cursor: "pointer",
              display: "flex", alignItems: "center", fontSize: 10,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = darkMode ? "#3a3a3a" : "#e5f1fb"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            {ribbonCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>

        {/* ═══ Ribbon Content ═══ */}
        {!ribbonCollapsed && viewMode === "edit" && activeTab === "home" && (
          <HomeTab editor={editor}
            onShowFind={() => setFindBarMode("find")}
            onShowReplace={() => setFindBarMode("replace")}
            onOpenFontDialog={() => setDialogOpen("font")}
            onOpenParagraphDialog={() => setDialogOpen("paragraph")}
            onOpenBorderDialog={() => setDialogOpen("border")}
          />
        )}
        {!ribbonCollapsed && viewMode === "edit" && activeTab === "insert" && (
          <InsertTab editor={editor}
            onOpenHyperlinkDialog={() => setDialogOpen("hyperlink")}
            onOpenImageDialog={() => setDialogOpen("image")}
            onOpenBookmarkDialog={() => setDialogOpen("bookmark")}
            onOpenCrossRefDialog={() => setDialogOpen("crossref")}
          />
        )}
        {!ribbonCollapsed && viewMode === "edit" && activeTab === "draw" && (
          <DrawTab editor={editor} />
        )}
        {!ribbonCollapsed && viewMode === "edit" && activeTab === "design" && (
          <DesignTab pageColor={pageColor} setPageColor={setPageColor}
            watermarkText={watermarkText} setWatermarkText={setWatermarkText}
            onOpenPageBorderDialog={() => setDialogOpen("pageborder")}
            onOpenWatermarkDialog={() => setDialogOpen("watermark")}
          />
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
            trackChangesEnabled={trackChangesEnabled}
            onToggleTrackChanges={() => {
              setTrackChangesEnabled(v => !v);
              editor?.commands.toggleTrackChanges();
            }}
          />
        )}
        {!ribbonCollapsed && activeTab === "view" && (
          <ViewTab showRuler={showRuler} setShowRuler={setShowRuler} viewMode={viewMode} setViewMode={setViewMode}
            zoom={zoom} setZoom={setZoom} showNavPane={showNavPane} setShowNavPane={setShowNavPane}
            onNew={handleNew} darkMode={darkMode} setDarkMode={setDarkMode}
            onFitPageWidth={handleFitPageWidth} onToggleFullscreen={handleToggleFullscreen} isFullscreen={isFullscreen} />
        )}

        {findBarMode && <FindReplaceBar editor={editor} showReplace={findBarMode === "replace"} onClose={() => setFindBarMode(null)} />}

        {/* ═══ Ruler (MS Word 365 스타일 - cm 눈금) ═══ */}
        {showRuler && (
          <div style={{
            height: 24, background: darkMode ? "#2d2d2d" : "#f5f5f5",
            borderBottom: `1px solid ${darkMode ? "#444" : "#ddd"}`,
            display: "flex", alignItems: "flex-end", justifyContent: "center", flexShrink: 0,
            position: "relative",
          }}>
            {/* 좌측 패딩 (문서 목록/탐색 창 너비만큼) */}
            <div style={{ width: showNavPane ? 220 : 0, flexShrink: 0 }} />
            <div style={{ width: showRuler ? 20 : 0, flexShrink: 0 }} />

            {/* 눈금자 본체 */}
            <div style={{
              width: `${pageW * (zoom / 100)}px`, maxWidth: "calc(100% - 56px)",
              position: "relative", height: "100%",
            }}>
              {/* 왼쪽 여백 영역 (회색) */}
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: `${marginLeft * (zoom / 100)}px`,
                background: darkMode ? "#3a3a3a" : "#c4c4c4",
              }} />
              {/* 오른쪽 여백 영역 (회색) */}
              <div style={{
                position: "absolute", right: 0, top: 0, bottom: 0,
                width: `${marginRight * (zoom / 100)}px`,
                background: darkMode ? "#3a3a3a" : "#c4c4c4",
              }} />
              {/* 본문 영역 (흰색) */}
              <div style={{
                position: "absolute", left: `${marginLeft * (zoom / 100)}px`, right: `${marginRight * (zoom / 100)}px`,
                top: 0, bottom: 0,
                background: darkMode ? "#2d2d2d" : "#fff",
              }} />

              {/* cm 눈금 표시 */}
              {(() => {
                const contentWidthPx = pageW - marginLeft - marginRight;
                const contentWidthCm = contentWidthPx / 37.8; // 96dpi → 37.8px/cm
                const marks = [];
                const totalCm = Math.ceil(contentWidthCm);
                for (let cm = -Math.floor(marginLeft / 37.8); cm <= totalCm + Math.floor(marginRight / 37.8); cm++) {
                  const xPx = (marginLeft + cm * 37.8) * (zoom / 100);
                  if (xPx < -5 || xPx > pageW * (zoom / 100) + 5) continue;
                  // 1cm 눈금
                  marks.push(
                    <div key={`cm-${cm}`} style={{
                      position: "absolute", left: `${xPx}px`, bottom: 0,
                      display: "flex", flexDirection: "column", alignItems: "center",
                    }}>
                      <div style={{ width: 1, height: 10, background: darkMode ? "#888" : "#666" }} />
                      {cm > 0 && cm <= totalCm && (
                        <span style={{
                          fontSize: 7, color: darkMode ? "#888" : "#777",
                          position: "absolute", top: 2, left: 3, fontFamily: "'Segoe UI', sans-serif",
                        }}>{cm}</span>
                      )}
                    </div>
                  );
                  // 0.5cm 하위 눈금
                  const halfX = (marginLeft + (cm + 0.5) * 37.8) * (zoom / 100);
                  if (halfX > 0 && halfX < pageW * (zoom / 100)) {
                    marks.push(
                      <div key={`half-${cm}`} style={{
                        position: "absolute", left: `${halfX}px`, bottom: 0,
                      }}>
                        <div style={{ width: 1, height: 5, background: darkMode ? "#666" : "#aaa" }} />
                      </div>
                    );
                  }
                }
                return marks;
              })()}

              {/* 왼쪽 여백 조절 핸들 (들여쓰기 표시) */}
              <div style={{
                position: "absolute", left: `${marginLeft * (zoom / 100) - 4}px`, bottom: 0,
                width: 8, height: 8, cursor: "ew-resize",
                borderLeft: "4px solid transparent", borderRight: "4px solid transparent",
                borderBottom: `8px solid ${darkMode ? "#999" : "#666"}`,
              }} />
              {/* 오른쪽 여백 조절 핸들 */}
              <div style={{
                position: "absolute", right: `${marginRight * (zoom / 100) - 4}px`, bottom: 0,
                width: 8, height: 8, cursor: "ew-resize",
                borderLeft: "4px solid transparent", borderRight: "4px solid transparent",
                borderBottom: `8px solid ${darkMode ? "#999" : "#666"}`,
              }} />
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
            flex: 1, overflowY: "auto",
            background: viewMode === "web"
              ? (darkMode ? "#1e1e1e" : "#fff")
              : (darkMode ? "#1e1e1e" : "#e8e8e8"),
            display: "flex", justifyContent: "center", padding: viewMode === "web" ? "0" : "20px 0 60px",
            position: "relative",
          }}>
            {/* 세로 눈금자 (cm 단위) */}
            {showRuler && (
              <div style={{
                width: 18, flexShrink: 0,
                background: darkMode ? "#2d2d2d" : "#f5f5f5",
                borderRight: `1px solid ${darkMode ? "#444" : "#ddd"}`,
                position: "sticky", top: 0, alignSelf: "flex-start",
                minHeight: `${pageH * (zoom / 100)}px`,
              }}>
                {(() => {
                  const totalCm = Math.ceil(pageH / 37.8);
                  const marks = [];
                  for (let cm = 0; cm <= totalCm; cm++) {
                    const yPx = cm * 37.8 * (zoom / 100);
                    marks.push(
                      <div key={`vc-${cm}`} style={{
                        position: "absolute", right: 0, top: `${yPx}px`,
                      }}>
                        <div style={{ width: 8, height: 1, background: darkMode ? "#888" : "#666" }} />
                        {cm > 0 && cm < totalCm && (
                          <span style={{
                            fontSize: 7, color: darkMode ? "#888" : "#777",
                            position: "absolute", right: 10, top: -4,
                            fontFamily: "'Segoe UI', sans-serif",
                          }}>{cm}</span>
                        )}
                      </div>
                    );
                    // 0.5cm 하위 눈금
                    const halfY = (cm + 0.5) * 37.8 * (zoom / 100);
                    if (halfY < pageH * (zoom / 100)) {
                      marks.push(
                        <div key={`vh-${cm}`} style={{
                          position: "absolute", right: 0, top: `${halfY}px`,
                        }}>
                          <div style={{ width: 4, height: 1, background: darkMode ? "#555" : "#aaa" }} />
                        </div>
                      );
                    }
                  }
                  return marks;
                })()}
              </div>
            )}

            {/* ═══ Web Layout View ═══ */}
            {viewMode === "web" && (
              <div ref={editorCanvasRef} style={{
                width: "100%", maxWidth: 900, padding: "20px 40px",
                background: darkMode ? "#2d2d2d" : "#fff",
                minHeight: "100%",
              }}>
                {doc.title && (
                  <div style={{
                    fontSize: 24, fontWeight: 700, color: darkMode ? "#eee" : "#1a1a1a",
                    marginBottom: 8, fontFamily: "'Noto Serif KR', Georgia, serif",
                  }}>{doc.title}</div>
                )}
                {doc.subtitle && (
                  <div style={{ fontSize: 14, color: "#777", marginBottom: 20 }}>{doc.subtitle}</div>
                )}
                <EditorContent editor={editor} />
                <FloatingToolbar editor={editor} onInsertComment={handleInsertComment} />
              </div>
            )}

            {/* ═══ Read Mode View ═══ */}
            {viewMode === "preview" && (
              <div ref={editorCanvasRef} style={{
                width: "100%", maxWidth: 800, padding: "40px 60px",
                background: darkMode ? "#2d2d2d" : "#fff",
                minHeight: "100%",
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                margin: "0 auto",
              }}>
                {doc.title && (
                  <div style={{
                    fontSize: 28, fontWeight: 700, color: darkMode ? "#eee" : "#1a1a1a",
                    marginBottom: 12, fontFamily: "'Noto Serif KR', Georgia, serif",
                    borderBottom: "2px solid #185ABD", paddingBottom: 12,
                  }}>{doc.title}</div>
                )}
                {doc.subtitle && (
                  <div style={{ fontSize: 15, color: "#666", marginBottom: 8 }}>{doc.subtitle}</div>
                )}
                {(doc.author || doc.publishedDate) && (
                  <div style={{ fontSize: 12, color: "#999", marginBottom: 24 }}>
                    {doc.author && <span>{doc.author}</span>}
                    {doc.author && doc.publishedDate && <span> · </span>}
                    {doc.publishedDate && <span>{doc.publishedDate}</span>}
                  </div>
                )}
                <div className="ProseMirror"
                  style={{
                    fontFamily: "'맑은 고딕', sans-serif", fontSize: "11pt",
                    lineHeight: 1.85, color: darkMode ? "#ddd" : "#1a1a1a",
                  }}
                  dangerouslySetInnerHTML={{ __html: editor?.getHTML() || "" }}
                />
              </div>
            )}

            {/* ═══ A4 편집 영역 (인쇄 모양) ═══ */}
            {viewMode === "edit" && (() => {
              const zoomR = zoom / 100;
              const pageBg = darkMode ? "#2d2d2d" : (pageColor || "#fff");
              const canvasBg = darkMode ? "#1e1e1e" : "#e8e8e8";

              return (
                <div style={{
                  transform: `scale(${zoomR})`,
                  transformOrigin: "top center",
                  width: pageW,
                  flexShrink: 0,
                }}>
                  <div ref={editorCanvasRef} className="editor-page-area" style={{
                    position: "relative",
                    width: pageW,
                    minHeight: pageH,
                    background: pageBg,
                    boxShadow: darkMode
                      ? "0 1px 4px rgba(0,0,0,0.5)"
                      : "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06)",
                    border: darkMode ? "1px solid #444" : "none",
                    paddingTop: marginTop,
                    paddingBottom: marginBottom,
                    paddingLeft: marginLeft,
                    paddingRight: marginRight,
                    boxSizing: "border-box",
                  }}>

                    {/* ── 마진 가이드라인 (Word 스타일: 모서리 L자 표시) ── */}
                    {/* 상단 좌 */}
                    <div style={{ position: "absolute", top: marginTop, left: marginLeft - 1, width: 12, height: 1, background: darkMode ? "#555" : "#c0c0c0", pointerEvents: "none", zIndex: 4 }} />
                    <div style={{ position: "absolute", top: marginTop, left: marginLeft - 1, width: 1, height: 12, background: darkMode ? "#555" : "#c0c0c0", pointerEvents: "none", zIndex: 4 }} />
                    {/* 상단 우 */}
                    <div style={{ position: "absolute", top: marginTop, right: marginRight - 1, width: 12, height: 1, background: darkMode ? "#555" : "#c0c0c0", pointerEvents: "none", zIndex: 4 }} />
                    <div style={{ position: "absolute", top: marginTop, right: marginRight - 1, width: 1, height: 12, background: darkMode ? "#555" : "#c0c0c0", pointerEvents: "none", zIndex: 4 }} />
                    {/* 하단 좌 (1페이지 기준) */}
                    <div style={{ position: "absolute", top: pageH - marginBottom, left: marginLeft - 1, width: 12, height: 1, background: darkMode ? "#555" : "#c0c0c0", pointerEvents: "none", zIndex: 4 }} />
                    <div style={{ position: "absolute", top: pageH - marginBottom - 12, left: marginLeft - 1, width: 1, height: 12, background: darkMode ? "#555" : "#c0c0c0", pointerEvents: "none", zIndex: 4 }} />
                    {/* 하단 우 (1페이지 기준) */}
                    <div style={{ position: "absolute", top: pageH - marginBottom, right: marginRight - 1, width: 12, height: 1, background: darkMode ? "#555" : "#c0c0c0", pointerEvents: "none", zIndex: 4 }} />
                    <div style={{ position: "absolute", top: pageH - marginBottom - 12, right: marginRight - 1, width: 1, height: 12, background: darkMode ? "#555" : "#c0c0c0", pointerEvents: "none", zIndex: 4 }} />

                    {/* ── 페이지 구분 오버레이 (회색 간격 + 페이지 번호 + 마진 가이드) ── */}
                    {pageBreaks.map((breakY, i) => (
                      <div key={`pgb-${i}`} style={{
                        position: "absolute",
                        top: breakY,
                        left: -1,
                        right: -1,
                        height: gapH,
                        zIndex: 3, pointerEvents: "none",
                        display: "flex", flexDirection: "column",
                      }}>
                        {/* 하단 여백 (페이지 배경색) */}
                        <div style={{ height: marginBottom, background: pageBg, position: "relative" }}>
                          {/* 하단 마진 가이드 — L자 */}
                          <div style={{ position: "absolute", bottom: 0, left: marginLeft - 1, width: 12, height: 1, background: darkMode ? "#555" : "#c0c0c0" }} />
                          <div style={{ position: "absolute", bottom: 0, left: marginLeft - 1, width: 1, height: 12, background: darkMode ? "#555" : "#c0c0c0" }} />
                          <div style={{ position: "absolute", bottom: 0, right: marginRight - 1, width: 12, height: 1, background: darkMode ? "#555" : "#c0c0c0" }} />
                          <div style={{ position: "absolute", bottom: 0, right: marginRight - 1, width: 1, height: 12, background: darkMode ? "#555" : "#c0c0c0" }} />
                          {/* 바닥글 */}
                          <div style={{
                            position: "absolute", bottom: 4, left: marginLeft, right: marginRight,
                            textAlign: "center", fontSize: "9pt", color: "#bbb",
                          }}>{footerText || `- ${i + 1} -`}</div>
                          {/* 하단 그림자 */}
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }} />
                        </div>
                        {/* 회색 간격 (페이지 사이 공간) */}
                        <div style={{
                          flex: "0 0 auto", height: PAGE_GAP, background: canvasBg,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <span style={{ fontSize: 9, color: darkMode ? "#666" : "#aaa", fontFamily: "'Segoe UI', sans-serif" }}>
                            {i + 2}페이지
                          </span>
                        </div>
                        {/* 상단 여백 (페이지 배경색) */}
                        <div style={{ height: marginTop, background: pageBg, position: "relative" }}>
                          {/* 상단 마진 가이드 — L자 */}
                          <div style={{ position: "absolute", top: 0, left: marginLeft - 1, width: 12, height: 1, background: darkMode ? "#555" : "#c0c0c0" }} />
                          <div style={{ position: "absolute", top: 0, left: marginLeft - 1, width: 1, height: 12, background: darkMode ? "#555" : "#c0c0c0" }} />
                          <div style={{ position: "absolute", top: 0, right: marginRight - 1, width: 12, height: 1, background: darkMode ? "#555" : "#c0c0c0" }} />
                          <div style={{ position: "absolute", top: 0, right: marginRight - 1, width: 1, height: 12, background: darkMode ? "#555" : "#c0c0c0" }} />
                          {/* 상단 그림자 */}
                          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
                            boxShadow: "0 -2px 4px rgba(0,0,0,0.1)" }} />
                          {/* 머리글 */}
                          <div style={{
                            position: "absolute", top: 4, left: marginLeft, right: marginRight,
                            textAlign: "center", fontSize: "9pt", color: "#bbb",
                          }}>{headerText}</div>
                        </div>
                      </div>
                    ))}

                    {/* ── 워터마크 ── */}
                    {watermarkText && (
                      <div style={{
                        position: "absolute", top: pageH / 2, left: "50%",
                        transform: "translate(-50%, -50%) rotate(-45deg)",
                        fontSize: 54, color: "rgba(192,192,192,0.25)",
                        fontWeight: 300, whiteSpace: "nowrap", pointerEvents: "none",
                        userSelect: "none", fontFamily: "'Segoe UI', '맑은 고딕', sans-serif",
                        letterSpacing: 8, zIndex: 0,
                      }}>{watermarkText}</div>
                    )}

                    {/* ── 머리글 (1페이지) ── */}
                    {showHeaderFooter && (
                      <div style={{
                        position: "absolute", top: 0, left: marginLeft, right: marginRight,
                        height: marginTop, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "9pt", color: "#aaa", zIndex: 1,
                      }}>
                        <input type="text" value={headerText} onChange={(e) => setHeaderText(e.target.value)}
                          placeholder="머리글" style={{
                            width: "100%", border: "none", outline: "none", background: "transparent",
                            textAlign: "center", fontSize: "inherit", color: "#999", fontFamily: "'맑은 고딕', sans-serif",
                          }} />
                      </div>
                    )}

                    {/* ── 제목 ── */}
                    {doc.title && (
                      <div style={{
                        fontSize: 22, fontWeight: 700,
                        color: darkMode ? "#eee" : "#1a1a1a",
                        marginBottom: 8, fontFamily: "'Noto Serif KR', Georgia, serif",
                      }}>{doc.title}</div>
                    )}
                    {doc.subtitle && (
                      <div style={{
                        fontSize: 14, color: "#777", marginBottom: 20,
                        fontFamily: "'맑은 고딕', sans-serif",
                      }}>{doc.subtitle}</div>
                    )}

                    {/* ── 에디터 본문 ── */}
                    <EditorContent editor={editor} />
                    <FootnoteArea editor={editor} footnotes={footnotes} setFootnotes={setFootnotes} onHeightChange={setFootnoteAreaHeight} />
                    <FloatingToolbar editor={editor} onInsertComment={handleInsertComment} />
                    <ContextMenu editor={editor}
                      onOpenFontDialog={() => setDialogOpen("font")}
                      onOpenParagraphDialog={() => setDialogOpen("paragraph")}
                      onOpenHyperlinkDialog={() => setDialogOpen("hyperlink")}
                      onOpenTableDialog={() => setDialogOpen("table")}
                      onInsertComment={handleInsertComment}
                      commentStore={commentStore} commentDispatch={commentDispatch}
                      commentAuthor={commentAuthor}
                    />
                    <CommentIndicators editor={editor} commentStore={commentStore} dispatch={commentDispatch} />
                  </div>
                </div>
              );
            })()}
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

        {/* ═══ Status Bar (MS Word 365 스타일) ═══ */}
        <div style={{
          height: 24, background: darkMode ? "#1e1e1e" : "#185ABD", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 10px", flexShrink: 0,
          color: "#fff", fontSize: 11,
          fontFamily: "'Segoe UI', '맑은 고딕', sans-serif", userSelect: "none",
        }}>
          {/* 왼쪽: 페이지/단어/문자/언어 */}
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {[
              { label: `페이지: ${dynamicPageCount}/${dynamicPageCount}`, title: "페이지 수" },
              { label: `단어 수: ${wordCount.toLocaleString()}`, title: "단어 수" },
              { label: `${charCount.toLocaleString()}자`, title: "문자 수" },
              { label: "한국어", title: "언어" },
            ].map((item, i) => (
              <span key={i} style={{
                padding: "2px 10px", cursor: "default", fontSize: 11, lineHeight: 1,
                borderRight: "1px solid rgba(255,255,255,0.15)",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                title={item.title}
              >{item.label}</span>
            ))}
          </div>

          {/* 오른쪽: 보기 모드 + 확대/축소 */}
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* 보기 모드 아이콘 */}
            {[
              { mode: "edit", icon: <FileText size={13} />, title: "인쇄 모양" },
              { mode: "preview", icon: <BookOpen size={13} />, title: "읽기 모드" },
              { mode: "web", icon: <Globe size={13} />, title: "웹 레이아웃" },
            ].map(v => (
              <button key={v.mode} type="button" onClick={() => setViewMode(v.mode)} title={v.title}
                style={{
                  background: viewMode === v.mode ? "rgba(255,255,255,0.2)" : "none",
                  border: "none", color: "rgba(255,255,255,0.85)", cursor: "pointer",
                  padding: "3px 5px", borderRadius: 2, display: "flex", alignItems: "center",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = viewMode === v.mode ? "rgba(255,255,255,0.2)" : "none"; }}>
                {v.icon}
              </button>
            ))}

            {/* 구분선 */}
            <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.2)", margin: "0 6px" }} />

            {/* 줌 컨트롤 */}
            <button type="button" onClick={() => setZoom(z => Math.max(25, z - 10))} title="축소"
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.85)", cursor: "pointer", padding: "2px 3px", display: "flex", borderRadius: 2 }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
              <ZoomOut size={13} />
            </button>
            <input type="range" min="25" max="500" value={zoom}
              onChange={e => setZoom(+e.target.value)}
              style={{
                width: 100, height: 4, cursor: "pointer",
                accentColor: "#fff",
                WebkitAppearance: "none", appearance: "none",
                background: "rgba(255,255,255,0.3)", borderRadius: 2,
              }} />
            <button type="button" onClick={() => setZoom(z => Math.min(500, z + 10))} title="확대"
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.85)", cursor: "pointer", padding: "2px 3px", display: "flex", borderRadius: 2 }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
              <ZoomIn size={13} />
            </button>
            <span style={{ width: 36, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.85)" }}>{zoom}%</span>
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
