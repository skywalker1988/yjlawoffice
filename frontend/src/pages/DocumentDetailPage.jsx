/**
 * DocumentDetailPage — 문서 상세 보기 + 인라인 Word 스타일 편집
 * - TipTap 리치텍스트 에디터, 리본 툴바, 자동저장
 * - 문서 메타데이터 표시 및 상태 관리
 */
import { useState, useEffect, useRef, useCallback, useMemo, Fragment } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Highlight } from "@tiptap/extension-highlight";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Link as TipTapLink } from "@tiptap/extension-link";
import { Image as TipTapImage } from "@tiptap/extension-image";
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
import { getTypeLabel, getTypeColor } from "../utils/document-types";
import { STATUS_LABELS } from "../utils/constants";
import { parseAuthor } from "../utils/format";
import { api } from "../utils/api";

/* ═══════════════════════════════════════════════════════════════
   MS Word-Style Document Editor
   - Full ribbon toolbar (파일, 홈, 삽입, 그리기, 디자인, 레이아웃, 참조, 검토, 보기)
   - A4 page canvas with ruler
   - TipTap rich-text editing
   - Auto-save, manual save, print
   - Find & Replace, Table insert, Image insert
   - Comments, Status bar (page/word/char count, zoom)
═══════════════════════════════════════════════════════════════ */

/* ──── ProseMirror + Word styles ──── */
const EDITOR_CSS = `
/* Google Fonts 로딩 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100;300;400;500;700;900&family=Noto+Serif+KR:wght@200;300;400;500;600;700;900&family=Source+Code+Pro:wght@400;600&display=swap');

.ProseMirror {
  outline: none;
  min-height: 900px;
  font-family: '맑은 고딕', 'Malgun Gothic', 'Noto Sans KR', sans-serif;
  font-size: 10pt;
  line-height: 1.75;
  color: #1a1a1a;
  caret-color: #000;
}
.ProseMirror h1 { font-size: 20pt; font-weight: 700; margin: 20px 0 10px; }
.ProseMirror h2 { font-size: 16pt; font-weight: 600; margin: 16px 0 8px; }
.ProseMirror h3 { font-size: 13pt; font-weight: 600; margin: 14px 0 6px; }
.ProseMirror h4 { font-size: 11pt; font-weight: 600; margin: 12px 0 5px; }
.ProseMirror p { margin: 4px 0; }
.ProseMirror ul, .ProseMirror ol { padding-left: 24px; margin: 6px 0; }
.ProseMirror li { margin: 2px 0; }
.ProseMirror blockquote { border-left: 3px solid #2b579a; margin: 10px 0; padding: 6px 14px; background: #f8f9fb; color: #555; }
.ProseMirror table { border-collapse: collapse; width: 100%; margin: 10px 0; }
.ProseMirror th, .ProseMirror td { border: 1px solid #bbb; padding: 5px 8px; font-size: 9pt; }
.ProseMirror th { background: #e8ecf0; font-weight: 600; }
.ProseMirror code { background: #f0f0ee; padding: 1px 3px; border-radius: 2px; font-size: 0.9em; font-family: 'Consolas', monospace; }
.ProseMirror pre { background: #2d2d2d; color: #ccc; padding: 10px 14px; border-radius: 3px; font-size: 9pt; overflow-x: auto; margin: 10px 0; }
.ProseMirror pre code { background: none; padding: 0; }
.ProseMirror hr { border: none; border-top: 1px solid #ccc; margin: 20px 0; }
.ProseMirror a { color: #2b579a; text-decoration: underline; }
.ProseMirror img { max-width: 100%; margin: 8px 0; }
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: #bbb;
  float: left;
  pointer-events: none;
  height: 0;
}
.ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
.ProseMirror ul[data-type="taskList"] li { display: flex; align-items: baseline; gap: 6px; }
.ProseMirror .tableWrapper { overflow-x: auto; }

/* Highlight (형광펜) 색상 지원 */
.ProseMirror mark { padding: 0 2px; border-radius: 1px; }
.ProseMirror mark[data-color] { background-color: attr(data-color); }

/* 텍스트 정렬 */
.ProseMirror [style*="text-align: center"] { text-align: center; }
.ProseMirror [style*="text-align: right"] { text-align: right; }
.ProseMirror [style*="text-align: justify"] { text-align: justify; }

/* 각주 스타일 */
.footnote-ref { color: #2b579a; cursor: pointer; font-size: 0.75em; vertical-align: super; font-weight: 600; }
.footnote-content { font-size: 0.85em; color: #666; border-top: 1px solid #ddd; padding-top: 4px; margin-top: 2px; }

/* Find highlight */
.search-highlight { background: #fff59d; border-radius: 1px; }
.search-highlight-active { background: #ff9800; color: #fff; border-radius: 1px; }

/* Word ribbon styling */
.word-rb:hover { background: rgba(0,0,0,0.06) !important; }
.word-rb:active { background: rgba(0,0,0,0.1) !important; }
.word-rb.active { background: rgba(0,0,0,0.08) !important; }
.word-tab:hover { background: rgba(0,0,0,0.04) !important; }
.word-style-card:hover { border-color: #2b579a !important; }

/* Color picker grid */
.cpick-item:hover { transform: scale(1.3); box-shadow: 0 0 0 1px #2b579a; }

/* 플로팅 툴바 (텍스트 선택 시) */
.floating-toolbar {
  position: absolute;
  z-index: 9999;
  background: #fff;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
  padding: 4px 6px;
  display: flex;
  align-items: center;
  gap: 2px;
  animation: ftFadeIn 0.15s ease;
}
@keyframes ftFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
.ft-btn { display:flex; align-items:center; justify-content:center; width:28px; height:28px; border:none; border-radius:3px; background:transparent; cursor:pointer; color:#444; transition:background 0.1s; }
.ft-btn:hover { background:rgba(0,0,0,0.07); }
.ft-btn.active { background:rgba(43,87,154,0.12); color:#2b579a; }
.ft-sep { width:1px; height:20px; background:rgba(0,0,0,0.1); margin:0 2px; }
`;

/* ──── Constants ──── */

const FONT_FAMILIES = [
  // 한글 글꼴
  "맑은 고딕", "바탕", "돋움", "굴림", "궁서",
  "나눔고딕", "나눔명조", "나눔바른고딕", "나눔스퀘어",
  "Noto Sans KR", "Noto Serif KR",
  "본고딕", "본명조",
  "함초롬바탕", "함초롬돋움",
  "KoPub돋움체", "KoPub바탕체",
  // 영문 글꼴 - Serif
  "Times New Roman", "Georgia", "Cambria", "Garamond",
  "Book Antiqua", "Palatino Linotype", "Century",
  // 영문 글꼴 - Sans-serif
  "Arial", "Calibri", "Verdana", "Tahoma", "Segoe UI",
  "Helvetica", "Trebuchet MS", "Lucida Sans",
  "Franklin Gothic Medium", "Century Gothic",
  // 영문 글꼴 - Monospace
  "Consolas", "Courier New", "Lucida Console",
  "Monaco", "Source Code Pro",
  // 디자인 글꼴
  "Impact", "Comic Sans MS", "Brush Script MT",
];

const FONT_SIZES = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

const HEADING_STYLES = [
  { label: "표준", cmd: "paragraph" },
  { label: "제목 1", cmd: "h1" },
  { label: "제목 2", cmd: "h2" },
  { label: "제목 3", cmd: "h3" },
  { label: "제목 4", cmd: "h4" },
];

const TEXT_COLORS = [
  "#000000", "#c00000", "#ff0000", "#ffc000", "#ffff00",
  "#92d050", "#00b050", "#00b0f0", "#0070c0", "#002060",
  "#7030a0", "#808080", "#404040", "#a6a6a6", "#d9d9d9",
  "#595959", "#bf8f00", "#538135", "#2e75b6", "#bf4e15",
];

const HIGHLIGHT_COLORS = [
  "#ffff00", "#00ff00", "#00ffff", "#ff00ff", "#0000ff",
  "#ff0000", "#000080", "#008080", "#00ff00", "#800080",
  "#800000", "#808000", "#c0c0c0", "#ff9900", "#99cc00",
];

const THEME_PRESETS = [
  { name: "Office", colors: ["#4472c4", "#ed7d31", "#a5a5a5", "#ffc000", "#5b9bd5"] },
  { name: "전문가", colors: ["#2b579a", "#333333", "#888888", "#b08d57", "#5a8f7b"] },
  { name: "모던", colors: ["#1a1a2e", "#16213e", "#0f3460", "#e94560", "#533483"] },
  { name: "자연", colors: ["#606c38", "#283618", "#dda15e", "#bc6c25", "#fefae0"] },
];


/* ═══════════════════════════════════════════════════════════════
   Utility Components
═══════════════════════════════════════════════════════════════ */

function RibbonBtn({ icon, label, active, onClick, disabled, style, vertical, small }) {
  return (
    <button
      onClick={onClick}
      title={label}
      disabled={disabled}
      className="word-rb"
      style={{
        display: "flex", flexDirection: vertical ? "column" : "row",
        alignItems: "center", justifyContent: "center", gap: vertical ? 1 : 3,
        minWidth: vertical ? 44 : 26, height: vertical ? 56 : 26,
        border: "none", borderRadius: 2,
        background: active ? "rgba(0,0,0,0.08)" : "transparent",
        color: disabled ? "#bbb" : (active ? "#1a1a1a" : "#444"),
        cursor: disabled ? "default" : "pointer",
        transition: "background 0.12s", padding: vertical ? "4px 6px" : "0 3px",
        fontSize: small ? 9 : 10, whiteSpace: "nowrap",
        ...style,
      }}
    >
      {icon}
      {vertical && label && <span style={{ fontSize: 9, marginTop: 1 }}>{label}</span>}
    </button>
  );
}

function RibbonBtnLarge({ icon, label, onClick, disabled, style }) {
  return (
    <button
      onClick={onClick}
      title={label}
      disabled={disabled}
      className="word-rb"
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 2, minWidth: 50, height: 62, border: "none", borderRadius: 2,
        background: "transparent", color: disabled ? "#bbb" : "#444",
        cursor: disabled ? "default" : "pointer", transition: "background 0.12s",
        padding: "4px 6px", fontSize: 9, whiteSpace: "nowrap",
        ...style,
      }}
    >
      <div style={{ fontSize: 20, lineHeight: 1 }}>{icon}</div>
      <span>{label}</span>
    </button>
  );
}

function Sep() {
  return <div style={{ width: 1, height: 52, background: "rgba(0,0,0,0.1)", margin: "0 5px", flexShrink: 0 }} />;
}

function SepSmall() {
  return <div style={{ width: 1, height: 22, background: "rgba(0,0,0,0.08)", margin: "0 3px", flexShrink: 0 }} />;
}

function RibbonGroup({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
        {children}
      </div>
      {label && (
        <div style={{ fontSize: 8, color: "#888", borderTop: "1px solid rgba(0,0,0,0.06)", width: "100%", textAlign: "center", paddingTop: 1, marginTop: 1 }}>
          {label}
        </div>
      )}
    </div>
  );
}

function Dropdown({ open, onClose, children, style }) {
  if (!open) return null;
  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={onClose} />
      <div style={{
        position: "absolute", top: "100%", left: 0, zIndex: 9999,
        background: "#fff", border: "1px solid #d0d0d0", borderRadius: 4,
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)", padding: 6,
        ...style,
      }}>
        {children}
      </div>
    </>
  );
}

/* ──── Modal ──── */
function Modal({ open, title, onClose, children, width }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} onClick={onClose} />
      <div style={{
        position: "relative", background: "#fff", borderRadius: 6, padding: 0,
        maxWidth: width || 440, width: "92%", boxShadow: "0 16px 48px rgba(0,0,0,0.25)",
        maxHeight: "80vh", display: "flex", flexDirection: "column",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px", borderBottom: "1px solid #e8e8e8",
        }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>{title}</span>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, color: "#999", padding: "2px 6px" }}>✕</button>
        </div>
        <div style={{ padding: 16, overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <Modal open={open} title={title} onClose={onCancel} width={360}>
      <p style={{ fontSize: 13, color: "#555", marginBottom: 20, lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={onCancel} style={{ padding: "6px 18px", border: "1px solid #ddd", borderRadius: 4, background: "#fff", fontSize: 12, cursor: "pointer" }}>취소</button>
        <button onClick={onConfirm} style={{ padding: "6px 18px", border: "none", borderRadius: 4, background: "#c44", color: "#fff", fontSize: 12, cursor: "pointer" }}>삭제</button>
      </div>
    </Modal>
  );
}

/* ──── Toast ──── */
function useToast() {
  const [msg, setMsg] = useState(null);
  const show = useCallback((text) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 2200);
  }, []);
  const Toast = msg ? (
    <div style={{
      position: "fixed", bottom: 48, left: "50%", transform: "translateX(-50%)",
      zIndex: 99999, background: "#333", color: "#fff", padding: "8px 20px",
      borderRadius: 6, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    }}>
      {msg}
    </div>
  ) : null;
  return { show, Toast };
}

/* ──── Ruler ──── */
function Ruler({ zoom, show }) {
  if (!show) return null;
  const marks = [];
  const totalCm = 21;
  for (let i = 0; i <= totalCm; i++) {
    const isMajor = i % 5 === 0;
    marks.push(
      <div key={i} style={{ position: "absolute", left: `${(i / totalCm) * 100}%`, textAlign: "center" }}>
        <div style={{ width: 1, height: isMajor ? 8 : (i % 1 === 0 ? 5 : 3), background: "#999", margin: "0 auto" }} />
        {isMajor && i > 0 && (
          <span style={{ fontSize: 7, color: "#888", position: "absolute", top: 9, left: "50%", transform: "translateX(-50%)" }}>
            {i}
          </span>
        )}
      </div>
    );
    if (i < totalCm) {
      for (let j = 1; j <= 4; j++) {
        const pos = (i + j * 0.2) / totalCm * 100;
        marks.push(
          <div key={`${i}-${j}`} style={{ position: "absolute", left: `${pos}%` }}>
            <div style={{ width: 1, height: j === 2 ? 5 : 3, background: "#bbb", margin: "0 auto" }} />
          </div>
        );
      }
    }
  }
  return (
    <div style={{
      height: 20, background: "#f5f5f3", borderBottom: "1px solid rgba(0,0,0,0.08)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", flexShrink: 0,
    }}>
      <div style={{ width: `${21 * zoom * 2.2}em`, maxWidth: "95vw", position: "relative", height: "100%", paddingTop: 2 }}>
        {marks}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SVG Icons — compact Word ribbon style
═══════════════════════════════════════════════════════════════ */
const I = {
  save: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  undo: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 105.64-8.36L1 10"/></svg>,
  redo: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-5.64-8.36L23 10"/></svg>,
  back: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  bold: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6zM6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg>,
  italic: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>,
  underline: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>,
  strike: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.3 4.9c-1.1-.8-2.7-1.4-4.3-1.4C9.5 3.5 7 5.5 7 8c0 2 1.2 3.3 3.5 4"/><line x1="4" y1="12" x2="20" y2="12"/><path d="M7 16c0 2.5 2.5 4.5 6 4.5 1.6 0 3.2-.6 4.3-1.4"/></svg>,
  sub: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><text x="2" y="14" fontSize="14" fill="currentColor" stroke="none" fontWeight="600">X</text><text x="14" y="20" fontSize="10" fill="currentColor" stroke="none">2</text></svg>,
  sup: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><text x="2" y="16" fontSize="14" fill="currentColor" stroke="none" fontWeight="600">X</text><text x="14" y="10" fontSize="10" fill="currentColor" stroke="none">2</text></svg>,
  alignL: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>,
  alignC: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>,
  alignR: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>,
  alignJ: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  listUl: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>,
  listOl: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" fontSize="7" fill="currentColor" stroke="none" fontWeight="600">1</text><text x="2" y="14" fontSize="7" fill="currentColor" stroke="none" fontWeight="600">2</text><text x="2" y="20" fontSize="7" fill="currentColor" stroke="none" fontWeight="600">3</text></svg>,
  indentInc: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="4" x2="21" y2="4"/><line x1="11" y1="10" x2="21" y2="10"/><line x1="11" y1="16" x2="21" y2="16"/><line x1="3" y1="20" x2="21" y2="20"/><polyline points="3 10 7 13 3 16"/></svg>,
  indentDec: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="4" x2="21" y2="4"/><line x1="11" y1="10" x2="21" y2="10"/><line x1="11" y1="16" x2="21" y2="16"/><line x1="3" y1="20" x2="21" y2="20"/><polyline points="7 10 3 13 7 16"/></svg>,
  lineSpace: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/><polyline points="1 8 1 4"/><polyline points="1 16 1 20"/></svg>,
  print: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  search: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  replace: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  select: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 3l4 18 3-7 7-3L5 3z"/></svg>,
  clipboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>,
  table: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>,
  image: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  link: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  bookmark: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>,
  comment: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  shapes: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="8" height="8" rx="1"/><circle cx="17" cy="7" r="4"/><polygon points="12 22 7 14 17 14"/></svg>,
  header: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="4" x2="21" y2="4"/><line x1="3" y1="10" x2="21" y2="10" strokeDasharray="3 2"/></svg>,
  footer: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="18" x2="21" y2="18"/><line x1="3" y1="20" x2="21" y2="20"/><line x1="3" y1="14" x2="21" y2="14" strokeDasharray="3 2"/></svg>,
  pageNum: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2"/><text x="12" y="15" fontSize="8" fill="currentColor" stroke="none" textAnchor="middle" fontWeight="600">#</text></svg>,
  formula: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><text x="3" y="16" fontSize="14" fill="currentColor" stroke="none" fontStyle="italic">∑</text></svg>,
  symbol: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><text x="5" y="17" fontSize="16" fill="currentColor" stroke="none">Ω</text></svg>,
  hr: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/></svg>,
  code: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  quote: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><text x="3" y="18" fontSize="20" fill="currentColor" stroke="none" fontWeight="700">"</text></svg>,
  task: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 11 12 14 22 4" strokeWidth="2.5"/></svg>,
  eraser: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 20H7L3 16l9-9 8 8-4 4"/><line x1="7" y1="20" x2="20" y2="20"/></svg>,
  pen: (color) => <svg width="14" height="30" viewBox="0 0 14 30"><rect x="3" y="0" width="8" height="22" rx="1" fill={color}/><polygon points="3,22 11,22 7,30" fill={color}/></svg>,
  ruler: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="6" width="22" height="12" rx="1"/><line x1="5" y1="6" x2="5" y2="10"/><line x1="9" y1="6" x2="9" y2="12"/><line x1="13" y1="6" x2="13" y2="10"/><line x1="17" y1="6" x2="17" y2="12"/></svg>,
  canvas: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/></svg>,
  theme: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 010 20" fill="currentColor" opacity="0.3"/></svg>,
  watermark: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  pageColor: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="3" y="14" width="18" height="7" rx="0" fill="currentColor" opacity="0.2"/></svg>,
  border: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>,
  margin: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1"/><rect x="6" y="6" width="12" height="12" rx="0" strokeDasharray="2 2"/></svg>,
  columns: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/></svg>,
  breaks: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/><path d="M12 9v6" strokeDasharray="2 2"/></svg>,
  textDir: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><text x="4" y="15" fontSize="12" fill="currentColor" stroke="none" fontWeight="600">가</text><path d="M18 6v12M18 18l-3-3M18 18l3-3"/></svg>,
  toc: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="15" y2="6"/><line x1="3" y1="12" x2="18" y2="12"/><line x1="3" y1="18" x2="12" y2="18"/><line x1="19" y1="6" x2="21" y2="6"/><line x1="19" y1="12" x2="21" y2="12"/><line x1="19" y1="18" x2="21" y2="18"/></svg>,
  footnote: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="16" x2="21" y2="16"/><text x="6" y="13" fontSize="8" fill="currentColor" stroke="none">1</text></svg>,
  cite: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><text x="4" y="16" fontSize="14" fill="currentColor" stroke="none">[</text><text x="13" y="16" fontSize="14" fill="currentColor" stroke="none">]</text></svg>,
  caption: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="12" rx="1"/><line x1="3" y1="19" x2="21" y2="19"/></svg>,
  index: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="4" x2="14" y2="4"/><line x1="3" y1="9" x2="11" y2="9"/><line x1="3" y1="14" x2="16" y2="14"/><line x1="3" y1="19" x2="10" y2="19"/><text x="18" y="10" fontSize="8" fill="currentColor" stroke="none">A</text></svg>,
  spellcheck: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><text x="2" y="14" fontSize="11" fill="currentColor" stroke="none" fontWeight="600">ABC</text><path d="M4 18c2-1 4 1 6 0s4 1 6 0" stroke="#c00" strokeWidth="1.5" fill="none"/></svg>,
  thesaurus: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/></svg>,
  wordcount: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><text x="3" y="15" fontSize="10" fill="currentColor" stroke="none" fontWeight="500">123</text></svg>,
  translate: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 8l6 0M8 5v3M5 11c1 3 3 5 6 6"/><path d="M14 10l2 6 2-6"/><path d="M14 14h4"/></svg>,
  track: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  protect: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  compare: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="8" height="18" rx="1"/><rect x="13" y="3" width="8" height="18" rx="1"/></svg>,
  readMode: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
  printLayout: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="1"/><line x1="9" y1="6" x2="15" y2="6"/><line x1="9" y1="10" x2="15" y2="10"/></svg>,
  webLayout: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  outline: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="7" y1="12" x2="21" y2="12"/><line x1="11" y1="18" x2="21" y2="18"/></svg>,
  grid: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  nav: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="6" height="18" rx="1"/><line x1="12" y1="8" x2="21" y2="8"/><line x1="12" y1="12" x2="21" y2="12"/><line x1="12" y1="16" x2="18" y2="16"/></svg>,
  zoom: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/></svg>,
  newWin: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>,
  split: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>,
  macro: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="14" y1="4" x2="10" y2="20"/></svg>,
  info: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  close: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  zoomIn: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/></svg>,
  zoomOut: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  accessibility: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="4" r="2"/><path d="M12 8v6M8 22l2-6h4l2 6M6 12h12"/></svg>,
  speaker: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>,
  onenote: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><text x="8" y="16" fontSize="11" fill="#7b2d8e" stroke="none" fontWeight="700">N</text></svg>,
  pageBreak: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="6" rx="1"/><rect x="5" y="16" width="14" height="6" rx="1"/><line x1="4" y1="11" x2="8" y2="11"/><line x1="11" y1="11" x2="13" y2="11"/><line x1="16" y1="11" x2="20" y2="11"/></svg>,
  cover: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="14" y2="12"/></svg>,
  chart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  smartart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="3"/><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><line x1="12" y1="8" x2="5" y2="15"/><line x1="12" y1="8" x2="19" y2="15"/></svg>,
  video: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="14" height="14" rx="2"/><polygon points="23 7 16 12 23 17 23 7"/></svg>,
  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3"/><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3"/></svg>,
  model3d: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l10 6v8l-10 6L2 16V8l10-6z"/><line x1="12" y1="22" x2="12" y2="8"/><line x1="22" y1="8" x2="12" y2="14"/><line x1="2" y1="8" x2="12" y2="14"/></svg>,
  screenshot: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/></svg>,
  memo: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  esign: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e8a020" strokeWidth="2" strokeLinecap="round"><path d="M3 17c3-4 5-1 8-5s3 1 7-4"/><line x1="3" y1="20" x2="21" y2="20"/></svg>,
  spacing: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22"/><polyline points="8 6 12 2 16 6"/><polyline points="8 18 12 22 16 18"/></svg>,
  effect: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
  default: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  inkShape: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 17L12 7l5 10" strokeLinecap="round"/></svg>,
  inkMath: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><text x="3" y="17" fontSize="15" fill="currentColor" stroke="none" fontStyle="italic">∫</text><text x="13" y="10" fontSize="8" fill="currentColor" stroke="none">π</text></svg>,
  bgFormat: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="3" y="14" width="18" height="7" fill="currentColor" opacity="0.15"/></svg>,
  inkHelp: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  hyphen: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><text x="4" y="8" fontSize="7" fill="currentColor" stroke="none">a-</text><text x="13" y="20" fontSize="7" fill="currentColor" stroke="none">bc</text></svg>,
  lineNum: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><text x="2" y="8" fontSize="6" fill="currentColor" stroke="none">1</text><text x="2" y="14" fontSize="6" fill="currentColor" stroke="none">2</text><text x="2" y="20" fontSize="6" fill="currentColor" stroke="none">3</text><line x1="9" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/></svg>,
  position: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="8" width="8" height="8" rx="1"/><path d="M3 3h4M3 3v4M21 3h-4M21 3v4M3 21h4M3 21v-4M21 21h-4M21 21v-4"/></svg>,
  wrapText: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="11" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/><rect x="13" y="9" width="6" height="6" rx="1" fill="none"/></svg>,
  bringFwd: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="2" width="13" height="13" rx="1" fill="currentColor" opacity="0.15"/><rect x="3" y="9" width="13" height="13" rx="1"/></svg>,
  sendBwd: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="9" width="13" height="13" rx="1" fill="currentColor" opacity="0.15"/><rect x="8" y="2" width="13" height="13" rx="1"/></svg>,
  selPane: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="15" x2="21" y2="15"/><rect x="5" y="5" width="5" height="5" rx="1" fill="currentColor" opacity="0.2"/></svg>,
  alignObj: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="22" strokeDasharray="3 2"/><rect x="4" y="6" width="7" height="5" rx="1"/><rect x="13" y="13" width="7" height="5" rx="1"/></svg>,
};

/* ═══════════════════════════════════════════════════════════════
   FontSize Extension for TipTap
═══════════════════════════════════════════════════════════════ */
import { Extension } from "@tiptap/core";

/* Custom FontSize — works by extending TextStyle attributes */
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() { return { types: ["textStyle"] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el) => el.style.fontSize || null,
          renderHTML: (attrs) => {
            if (!attrs.fontSize) return {};
            return { style: `font-size: ${attrs.fontSize}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (fontSize) => ({ chain }) => {
        return chain().setMark("textStyle", { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run();
      },
    };
  },
});

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show: toast, Toast } = useToast();

  /* ── Doc state ── */
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState("");

  /* ── UI state ── */
  const [activeTab, setActiveTab] = useState("home");
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const [showRuler, setShowRuler] = useState(true);
  const [showGridlines, setShowGridlines] = useState(false);
  const [showNavPane, setShowNavPane] = useState(false);
  const [viewMode, setViewMode] = useState("print"); // print, read, web, outline, draft

  /* ── Dialog state ── */
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

  /* ── Font state ── */
  const [currentFont, setCurrentFont] = useState("맑은 고딕");
  const [currentSize, setCurrentSize] = useState("10");

  const saveTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  /* ── Floating Toolbar state ── */
  const [floatingToolbar, setFloatingToolbar] = useState(null); // { top, left }
  const floatingRef = useRef(null);

  /* ── TipTap Editor ── */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
        defaultAlignment: "left",
      }),
      Highlight.configure({ multicolor: true, HTMLAttributes: {} }),
      TextStyle,
      Color,
      FontFamily.configure({ types: ["textStyle"] }),
      FontSize,
      TipTapLink.configure({ openOnClick: false }),
      TipTapImage,
      Table.configure({ resizable: true }),
      TableRow, TableCell, TableHeader,
      Placeholder.configure({ placeholder: "여기에 내용을 입력하세요..." }),
      Subscript, Superscript,
      TaskList, TaskItem.configure({ nested: true }),
      CharacterCount,
    ],
    content: "",
    onUpdate: ({ editor }) => {
      autoSave(editor.getHTML());
    },
    /* onSelectionUpdate — reserved */
  });

  /* ── Fetch document ── */
  useEffect(() => {
    setLoading(true);
    api.get(`/documents/${id}`)
      .then(data => {
        const d = data.data || data;
        setDoc(d);
        setTitle(d.title || "");
        const html = d.contentHtml || d.contentMarkdown || d.contentPlain || "";
        if (editor) {
          editor.commands.setContent(html.includes("<") ? html : html.replace(/\n/g, "<br/>"));
        }
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [id, editor]);

  /* ── Auto-save ── */
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

  /* ── Manual save ── */
  const manualSave = useCallback(() => {
    if (!editor) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaving(true);
    api.patch(`/documents/${id}`, { contentMarkdown: editor.getHTML(), title })
      .then(() => { setLastSaved(new Date()); toast("저장되었습니다"); })
      .catch(() => toast("저장 실패"))
      .finally(() => setSaving(false));
  }, [id, editor, title, toast]);

  /* ── Status change ── */
  const handleStatusChange = useCallback((newStatus) => {
    api.patch(`/documents/${id}`, { status: newStatus })
      .then(updated => setDoc(prev => ({ ...prev, ...(updated.data || updated) })))
      .catch(() => {});
  }, [id]);

  /* ── Delete ── */
  const handleDelete = () => {
    api.del(`/documents/${id}`)
      .then(() => navigate("/vault"))
      .catch(() => {});
  };

  /* ── Title change ── */
  const onTitleChange = useCallback((e) => {
    setTitle(e.target.value);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      api.patch(`/documents/${id}`, { title: e.target.value })
        .then(() => setLastSaved(new Date())).catch(() => {});
    }, 2000);
  }, [id]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    if (!editor) return { chars: 0, words: 0, pages: 1 };
    const text = editor.state.doc.textContent || "";
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const pages = Math.max(1, Math.ceil(chars / 1800));
    return { chars, words, pages };
  }, [editor?.state?.doc?.textContent]);

  /* ── Print ── */
  const handlePrint = useCallback(() => window.print(), []);

  /* ── Keyboard shortcuts ── */
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

  /* ── Find & Replace ── */
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

  /* ── Insert Table ── */
  const insertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
    setTableModalOpen(false);
    toast("표가 삽입되었습니다");
  }, [editor, tableRows, tableCols, toast]);

  /* ── Insert Image ── */
  const insertImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageModalOpen(false);
    setImageUrl("");
    toast("이미지가 삽입되었습니다");
  }, [editor, imageUrl, toast]);

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
  }, [editor, toast]);

  /* ── Insert Link ── */
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
  }, [editor, linkUrl, linkLabel]);

  /* ── Add Comment ── */
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
  }, [commentText, editor, toast]);

  /* ── Font size ── */
  const applyFontSize = useCallback((size) => {
    if (!editor) return;
    setCurrentSize(String(size));
    editor.chain().focus().setMark("textStyle", { fontSize: `${size}pt` }).run();
  }, [editor]);

  /* ── Font family ── */
  const applyFontFamily = useCallback((font) => {
    if (!editor) return;
    setCurrentFont(font);
    editor.chain().focus().setFontFamily(font).run();
  }, [editor]);

  /* ── Apply font color ── */
  const applyFontColor = useCallback((color) => {
    if (!editor) return;
    editor.chain().focus().setColor(color).run();
    setFontColorOpen(false);
  }, [editor]);

  /* ── Apply highlight ── */
  const applyHighlight = useCallback((color) => {
    if (!editor) return;
    editor.chain().focus().toggleHighlight({ color }).run();
    setHighlightColorOpen(false);
  }, [editor]);

  /* ── Insert footnote ── */
  const [footnoteCounter, setFootnoteCounter] = useState(1);
  const insertFootnote = useCallback((text) => {
    if (!editor) return;
    const num = footnoteCounter;
    editor.chain().focus().insertContent(
      `<sup class="footnote-ref" title="${text || '각주'}">[${num}]</sup>`
    ).run();
    setFootnoteCounter(prev => prev + 1);
    toast(`각주 ${num} 삽입됨`);
  }, [editor, footnoteCounter, toast]);

  /* ── Common feature handler ── */
  const notImpl = useCallback((name) => toast(`${name} — 기능 준비 중`), [toast]);

  /* ── Loading / Error ── */
  if (loading) return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#e8e8e4" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 28, height: 28, border: "3px solid #2b579a", borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 12, color: "#888" }}>문서를 불러오는 중...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (error || !doc) return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#e8e8e4" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#c44", marginBottom: 16 }}>{error || "문서를 찾을 수 없습니다."}</p>
        <button onClick={() => navigate("/vault")} style={{ padding: "8px 20px", background: "#fff", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>목록으로 돌아가기</button>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════
     RIBBON TABS
  ═══════════════════════════════════════════════════════════════ */

  const TABS = [
    { id: "file", label: "파일" },
    { id: "home", label: "홈" },
    { id: "insert", label: "삽입" },
    { id: "draw", label: "그리기" },
    { id: "design", label: "디자인" },
    { id: "layout", label: "레이아웃" },
    { id: "references", label: "참조" },
    { id: "review", label: "검토" },
    { id: "view", label: "보기" },
  ];

  /* ════════════════ RIBBON: 홈 (Home) ════════════════ */
  const RibbonHome = () => (
    <div style={{ display: "flex", alignItems: "stretch", gap: 0, height: 72 }}>
      {/* 클립보드 */}
      <RibbonGroup label="클립보드">
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <RibbonBtnLarge icon={I.clipboard} label="붙여넣기" onClick={() => { navigator.clipboard?.readText().then(t => editor?.commands.insertContent(t)).catch(() => notImpl("붙여넣기")); }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RibbonBtn icon={<span style={{fontSize:11}}>✂</span>} label="잘라내기" onClick={() => document.execCommand("cut")} />
          <RibbonBtn icon={<span style={{fontSize:11}}>📋</span>} label="복사" onClick={() => document.execCommand("copy")} />
          <RibbonBtn icon={<span style={{fontSize:11}}>🖌</span>} label="서식 복사" onClick={() => notImpl("서식 복사")} />
        </div>
      </RibbonGroup>
      <Sep />

      {/* 글꼴 */}
      <RibbonGroup label="글꼴">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <select value={currentFont} onChange={e => applyFontFamily(e.target.value)}
              style={{ height: 22, border: "1px solid #c0c0c0", borderRadius: 2, padding: "0 2px", fontSize: 10, width: 100, background: "#fff", fontFamily: currentFont }}>
              {FONT_FAMILIES.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
            </select>
            <select value={currentSize} onChange={e => applyFontSize(e.target.value)}
              style={{ height: 22, border: "1px solid #c0c0c0", borderRadius: 2, padding: "0 2px", fontSize: 10, width: 38, background: "#fff", textAlign: "center" }}>
              {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <RibbonBtn icon={<span style={{fontSize:12,fontWeight:700}}>A</span>} label="글꼴 크기 키우기" onClick={() => { const n = Math.min(72, parseFloat(currentSize) + 1); applyFontSize(String(n)); }} />
            <RibbonBtn icon={<span style={{fontSize:9,fontWeight:700}}>A</span>} label="글꼴 크기 줄이기" onClick={() => { const n = Math.max(6, parseFloat(currentSize) - 1); applyFontSize(String(n)); }} />
            <RibbonBtn icon={<span style={{fontSize:10}}>Aa</span>} label="대/소문자 변경" onClick={() => notImpl("대/소문자 변경")} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
            <RibbonBtn icon={I.bold} label="굵게 (Ctrl+B)" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()} />
            <RibbonBtn icon={I.italic} label="기울임 (Ctrl+I)" active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()} />
            <RibbonBtn icon={I.underline} label="밑줄 (Ctrl+U)" active={editor?.isActive("underline")} onClick={() => editor?.chain().focus().toggleUnderline().run()} />
            <RibbonBtn icon={I.strike} label="취소선" active={editor?.isActive("strike")} onClick={() => editor?.chain().focus().toggleStrike().run()} />
            <RibbonBtn icon={I.sub} label="아래 첨자" active={editor?.isActive("subscript")} onClick={() => editor?.chain().focus().toggleSubscript().run()} />
            <RibbonBtn icon={I.sup} label="위 첨자" active={editor?.isActive("superscript")} onClick={() => editor?.chain().focus().toggleSuperscript().run()} />
            <SepSmall />
            {/* Font color */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setFontColorOpen(!fontColorOpen)} title="글꼴 색" className="word-rb"
                style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 26, height: 26, border: "none", borderRadius: 2, background: "transparent", cursor: "pointer", padding: "3px 0" }}>
                <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1 }}>A</span>
                <div style={{ width: 14, height: 3, background: "#c00", borderRadius: 1 }} />
              </button>
              <Dropdown open={fontColorOpen} onClose={() => setFontColorOpen(false)} style={{ width: 140, padding: 8 }}>
                <p style={{ fontSize: 9, color: "#888", marginBottom: 4 }}>글꼴 색</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 3 }}>
                  {TEXT_COLORS.map(c => (
                    <button key={c} className="cpick-item" onClick={() => applyFontColor(c)}
                      style={{ width: 20, height: 20, background: c, border: "1px solid #ccc", borderRadius: 2, cursor: "pointer", transition: "transform 0.1s" }} />
                  ))}
                </div>
                <button onClick={() => { editor?.chain().focus().unsetColor().run(); setFontColorOpen(false); }}
                  style={{ marginTop: 4, fontSize: 9, border: "1px solid #ddd", borderRadius: 2, padding: "2px 6px", background: "#fff", cursor: "pointer", width: "100%" }}>색 제거</button>
              </Dropdown>
            </div>
            {/* Highlight color */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setHighlightColorOpen(!highlightColorOpen)} title="형광펜" className="word-rb"
                style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 26, height: 26, border: "none", borderRadius: 2, background: "transparent", cursor: "pointer", padding: "4px 0" }}>
                <span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1, background: "#ff0", padding: "0 3px" }}>ab</span>
              </button>
              <Dropdown open={highlightColorOpen} onClose={() => setHighlightColorOpen(false)} style={{ width: 140, padding: 8 }}>
                <p style={{ fontSize: 9, color: "#888", marginBottom: 4 }}>형광펜 색</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 3 }}>
                  {HIGHLIGHT_COLORS.map(c => (
                    <button key={c} className="cpick-item" onClick={() => applyHighlight(c)}
                      style={{ width: 20, height: 20, background: c, border: "1px solid #ccc", borderRadius: 2, cursor: "pointer", transition: "transform 0.1s" }} />
                  ))}
                </div>
                <button onClick={() => { editor?.chain().focus().unsetHighlight().run(); setHighlightColorOpen(false); }}
                  style={{ marginTop: 4, fontSize: 9, border: "1px solid #ddd", borderRadius: 2, padding: "2px 6px", background: "#fff", cursor: "pointer", width: "100%" }}>형광펜 제거</button>
              </Dropdown>
            </div>
          </div>
        </div>
      </RibbonGroup>
      <Sep />

      {/* 단락 */}
      <RibbonGroup label="단락">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
            <RibbonBtn icon={I.listUl} label="글머리 기호" active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()} />
            <RibbonBtn icon={I.listOl} label="번호 매기기" active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()} />
            <SepSmall />
            <RibbonBtn icon={I.indentDec} label="내어쓰기" onClick={() => editor?.chain().focus().liftListItem("listItem").run()} />
            <RibbonBtn icon={I.indentInc} label="들여쓰기" onClick={() => editor?.chain().focus().sinkListItem("listItem").run()} />
            <SepSmall />
            <RibbonBtn icon={<span style={{fontSize:10}}>¶</span>} label="편집 기호 표시/숨기기" onClick={() => notImpl("편집 기호")} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
            <RibbonBtn icon={I.alignL} label="왼쪽 맞춤" active={editor?.isActive({ textAlign: "left" })} onClick={() => editor?.chain().focus().setTextAlign("left").run()} />
            <RibbonBtn icon={I.alignC} label="가운데 맞춤" active={editor?.isActive({ textAlign: "center" })} onClick={() => editor?.chain().focus().setTextAlign("center").run()} />
            <RibbonBtn icon={I.alignR} label="오른쪽 맞춤" active={editor?.isActive({ textAlign: "right" })} onClick={() => editor?.chain().focus().setTextAlign("right").run()} />
            <RibbonBtn icon={I.alignJ} label="양쪽 맞춤" active={editor?.isActive({ textAlign: "justify" })} onClick={() => editor?.chain().focus().setTextAlign("justify").run()} />
            <SepSmall />
            {/* Line spacing dropdown */}
            <div style={{ position: "relative" }}>
              <RibbonBtn icon={I.lineSpace} label="줄 간격" onClick={() => setLineSpacingOpen(!lineSpacingOpen)} />
              <Dropdown open={lineSpacingOpen} onClose={() => setLineSpacingOpen(false)} style={{ width: 100, padding: 4 }}>
                {[1, 1.15, 1.5, 2, 2.5, 3].map(sp => (
                  <button key={sp} onClick={() => { notImpl(`줄 간격 ${sp}`); setLineSpacingOpen(false); }}
                    style={{ display: "block", width: "100%", padding: "4px 8px", border: "none", background: "transparent", fontSize: 10, cursor: "pointer", textAlign: "left", borderRadius: 2 }}
                    className="word-rb">{sp}줄</button>
                ))}
              </Dropdown>
            </div>
          </div>
        </div>
      </RibbonGroup>
      <Sep />

      {/* 스타일 */}
      <RibbonGroup label="스타일">
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          {HEADING_STYLES.map(s => (
            <button key={s.label} className="word-style-card"
              onClick={() => {
                if (s.cmd === "paragraph") editor?.chain().focus().setParagraph().run();
                else editor?.chain().focus().toggleHeading({ level: parseInt(s.cmd[1]) }).run();
              }}
              style={{
                width: 52, height: 52, border: "1px solid #d0d0d0", borderRadius: 2, background: "#fff",
                cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                fontSize: s.cmd === "paragraph" ? 9 : (s.cmd === "h1" ? 12 : s.cmd === "h2" ? 10 : 9),
                fontWeight: s.cmd === "paragraph" ? 400 : 600, color: s.cmd === "paragraph" ? "#333" : "#2b579a",
                transition: "border-color 0.15s",
              }}>
              <span style={{ fontFamily: "'맑은 고딕'" }}>{s.label.startsWith("제목") ? "가나다Aa" : "가나다Aa"}</span>
              <span style={{ fontSize: 7, color: "#888", marginTop: 2 }}>{s.label}</span>
            </button>
          ))}
        </div>
      </RibbonGroup>
      <Sep />

      {/* 편집 */}
      <RibbonGroup label="편집">
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <RibbonBtn icon={I.search} label="찾기 (Ctrl+F)" onClick={() => setFindOpen(true)} style={{ gap: 4, minWidth: 50, justifyContent: "flex-start", padding: "0 6px" }} />
          <RibbonBtn icon={I.replace} label="바꾸기 (Ctrl+H)" onClick={() => setFindOpen(true)} style={{ gap: 4, minWidth: 50, justifyContent: "flex-start", padding: "0 6px" }} />
          <RibbonBtn icon={I.select} label="선택" onClick={() => editor?.commands.selectAll()} style={{ gap: 4, minWidth: 50, justifyContent: "flex-start", padding: "0 6px" }} />
        </div>
      </RibbonGroup>
    </div>
  );

  /* ════════════════ RIBBON: 삽입 (Insert) ════════════════ */
  const RibbonInsert = () => (
    <div style={{ display: "flex", alignItems: "stretch", gap: 0, height: 72 }}>
      {/* 페이지 */}
      <RibbonGroup label="페이지">
        <RibbonBtnLarge icon={I.cover} label="표지" onClick={() => notImpl("표지")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RibbonBtn icon={I.pageBreak} label="새 페이지" onClick={() => { editor?.chain().focus().setHardBreak().run(); toast("페이지 나누기 삽입됨"); }} />
          <RibbonBtn icon={I.breaks} label="페이지 나누기" onClick={() => { editor?.chain().focus().setHorizontalRule().run(); }} />
        </div>
      </RibbonGroup>
      <Sep />

      {/* 표 */}
      <RibbonGroup label="표">
        <RibbonBtnLarge icon={I.table} label="표" onClick={() => setTableModalOpen(true)} />
      </RibbonGroup>
      <Sep />

      {/* 일러스트레이션 */}
      <RibbonGroup label="일러스트레이션">
        <RibbonBtnLarge icon={I.shapes} label="도형" onClick={() => notImpl("도형")} />
        <RibbonBtnLarge icon={I.image} label="그림" onClick={() => setImageModalOpen(true)} />
        <RibbonBtnLarge icon={I.icon} label="아이콘" onClick={() => notImpl("아이콘")} />
        <RibbonBtnLarge icon={I.model3d} label="3D 모델" onClick={() => notImpl("3D 모델")} />
        <RibbonBtnLarge icon={I.smartart} label="SmartArt" onClick={() => notImpl("SmartArt")} />
        <RibbonBtnLarge icon={I.chart} label="차트" onClick={() => notImpl("차트")} />
        <RibbonBtnLarge icon={I.screenshot} label="스크린샷" onClick={() => notImpl("스크린샷")} />
      </RibbonGroup>
      <Sep />

      {/* 미디어 */}
      <RibbonGroup label="미디어">
        <RibbonBtnLarge icon={I.video} label="온라인 비디오" onClick={() => notImpl("온라인 비디오")} />
      </RibbonGroup>
      <Sep />

      {/* 링크 */}
      <RibbonGroup label="링크">
        <RibbonBtnLarge icon={I.link} label="링크" onClick={() => setLinkModalOpen(true)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RibbonBtn icon={I.bookmark} label="책갈피" onClick={() => notImpl("책갈피")} />
          <RibbonBtn icon={<span style={{fontSize:10}}>↗</span>} label="상호 참조" onClick={() => notImpl("상호 참조")} />
        </div>
      </RibbonGroup>
      <Sep />

      {/* 메모 */}
      <RibbonGroup label="메모">
        <RibbonBtnLarge icon={I.comment} label="메모" onClick={() => { setInfoPanelOpen(true); document.getElementById("comment-input")?.focus(); }} />
      </RibbonGroup>
      <Sep />

      {/* 머리글/바닥글 */}
      <RibbonGroup label="머리글/바닥글">
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RibbonBtn icon={I.header} label="머리글" onClick={() => notImpl("머리글")} />
          <RibbonBtn icon={I.footer} label="바닥글" onClick={() => notImpl("바닥글")} />
          <RibbonBtn icon={I.pageNum} label="페이지 번호" onClick={() => notImpl("페이지 번호")} />
        </div>
      </RibbonGroup>
      <Sep />

      {/* 텍스트 */}
      <RibbonGroup label="텍스트">
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RibbonBtn icon={I.formula} label="수식" onClick={() => notImpl("수식")} style={{ gap: 4, minWidth: 44, justifyContent: "flex-start", padding: "0 6px" }}>
            <span style={{ marginLeft: 4, fontSize: 9 }}>수식</span>
          </RibbonBtn>
          <RibbonBtn icon={I.symbol} label="기호" onClick={() => setSymbolModalOpen(true)} style={{ gap: 4, minWidth: 44, justifyContent: "flex-start", padding: "0 6px" }}>
            <span style={{ marginLeft: 4, fontSize: 9 }}>기호</span>
          </RibbonBtn>
        </div>
      </RibbonGroup>
      <Sep />

      {/* eSignature */}
      <RibbonGroup label="eSignature">
        <RibbonBtnLarge icon={I.esign} label="eSignature" onClick={() => notImpl("eSignature")} style={{ color: "#e8a020" }} />
      </RibbonGroup>
    </div>
  );

  /* ════════════════ RIBBON: 그리기 (Draw) ════════════════ */
  const RibbonDraw = () => {
    const penColors = ["#000", "#c00", "#00c", "#0a0", "#f60", "#808", "#088"];
    return (
      <div style={{ display: "flex", alignItems: "stretch", gap: 0, height: 72 }}>
        <RibbonGroup label="도구">
          <RibbonBtnLarge icon={I.eraser} label="지우개" onClick={() => notImpl("지우개")} />
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <RibbonBtn icon={I.undo} label="실행 취소" onClick={() => editor?.chain().focus().undo().run()} />
          </div>
        </RibbonGroup>
        <Sep />

        <RibbonGroup label="펜">
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, padding: "0 4px" }}>
            {penColors.map(c => (
              <button key={c} onClick={() => notImpl(`펜 ${c}`)} title={`펜 (${c})`}
                style={{ border: "none", background: "transparent", cursor: "pointer", padding: 2, borderRadius: 2 }}
                className="word-rb">
                {I.pen(c)}
              </button>
            ))}
          </div>
        </RibbonGroup>
        <Sep />

        <RibbonGroup label="스텐실">
          <RibbonBtnLarge icon={<span style={{fontSize:18}}>+</span>} label="추가(A)" onClick={() => notImpl("펜 추가")} />
          <RibbonBtnLarge icon={I.ruler} label="눈금자" onClick={() => notImpl("눈금자 도구")} />
        </RibbonGroup>
        <Sep />

        <RibbonGroup label="편집">
          <RibbonBtnLarge icon={I.bgFormat} label="배경 서식" onClick={() => notImpl("배경 서식")} />
        </RibbonGroup>
        <Sep />

        <RibbonGroup label="변환">
          <RibbonBtnLarge icon={I.inkShape} label="잉크를 셰이프로 변환" onClick={() => notImpl("잉크→셰이프")} />
          <RibbonBtnLarge icon={I.inkMath} label="잉크를 수식으로" onClick={() => notImpl("잉크→수식")} />
        </RibbonGroup>
        <Sep />

        <RibbonGroup label="삽입">
          <RibbonBtnLarge icon={I.canvas} label="그리기 캔버스" onClick={() => notImpl("그리기 캔버스")} />
        </RibbonGroup>
        <Sep />

        <RibbonGroup label="">
          <RibbonBtnLarge icon={I.inkHelp} label="잉크 도움말" onClick={() => notImpl("잉크 도움말")} />
        </RibbonGroup>
      </div>
    );
  };

  /* ════════════════ RIBBON: 디자인 (Design) ════════════════ */
  const RibbonDesign = () => (
    <div style={{ display: "flex", alignItems: "stretch", gap: 0, height: 72 }}>
      <RibbonGroup label="테마">
        <RibbonBtnLarge icon={I.theme} label="테마" onClick={() => notImpl("테마")} />
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="문서 서식">
        <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "0 4px" }}>
          {["제목\n제목 1", "제목\n제목 1", "제목\n제목 1", "제목", "제목", "제목", "제목", "제목"].map((label, i) => (
            <button key={i} className="word-style-card"
              onClick={() => notImpl(`문서 서식 ${i + 1}`)}
              style={{
                width: 48, height: 52, border: "1px solid #d0d0d0", borderRadius: 2,
                background: i === 0 ? "#fff" : (i < 3 ? "#f8f8f8" : (i < 5 ? "#e8ecf0" : (i < 7 ? "#1a1a2e" : "#333"))),
                color: i >= 5 ? "#fff" : "#333",
                cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                fontSize: 8, fontWeight: 500, transition: "border-color 0.15s", lineHeight: 1.3,
              }}>
              <span style={{ fontSize: i < 3 ? 9 : 10, fontWeight: 600 }}>제목</span>
              {i < 3 && <span style={{ fontSize: 7, marginTop: 1, color: i >= 5 ? "#ccc" : "#888" }}>제목 {i + 1}</span>}
            </button>
          ))}
        </div>
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="">
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            <RibbonBtn icon={<span style={{fontSize:14,fontWeight:700}}>가</span>} label="색" onClick={() => notImpl("테마 색")} />
            <span style={{ fontSize: 9, color: "#666" }}>색</span>
          </div>
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            <RibbonBtn icon={<span style={{fontSize:9}}>🔤</span>} label="글꼴" onClick={() => notImpl("테마 글꼴")} />
            <span style={{ fontSize: 9, color: "#666" }}>글꼴</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 1, marginLeft: 4 }}>
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            <RibbonBtn icon={I.effect} label="효과" onClick={() => notImpl("효과")} />
            <span style={{ fontSize: 9, color: "#666" }}>효과</span>
          </div>
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            <RibbonBtn icon={I.default} label="기본값으로 설정" onClick={() => notImpl("기본값 설정")} />
            <span style={{ fontSize: 8, color: "#666" }}>기본값으로 설정</span>
          </div>
        </div>
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="">
        <RibbonBtnLarge icon={I.spacing} label="단락 간격" onClick={() => notImpl("단락 간격")} />
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="페이지 배경">
        <RibbonBtnLarge icon={I.watermark} label="워터마크" onClick={() => notImpl("워터마크")} />
        <RibbonBtnLarge icon={I.pageColor} label="페이지 색" onClick={() => notImpl("페이지 색")} />
        <RibbonBtnLarge icon={I.border} label="페이지 테두리" onClick={() => notImpl("페이지 테두리")} />
      </RibbonGroup>
    </div>
  );

  /* ════════════════ RIBBON: 레이아웃 (Layout) ════════════════ */
  const RibbonLayout = () => (
    <div style={{ display: "flex", alignItems: "stretch", gap: 0, height: 72 }}>
      <RibbonGroup label="페이지 설정">
        <RibbonBtnLarge icon={I.textDir} label="텍스트 방향" onClick={() => notImpl("텍스트 방향")} />
        <RibbonBtnLarge icon={I.margin} label="여백" onClick={() => notImpl("여백")} />
        <RibbonBtnLarge icon={I.printLayout} label="용지" onClick={() => notImpl("용지 방향")} />
        <RibbonBtnLarge icon={<span style={{fontSize:16}}>📐</span>} label="크기" onClick={() => notImpl("용지 크기")} />
        <RibbonBtnLarge icon={I.columns} label="단" onClick={() => notImpl("단")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RibbonBtn icon={I.breaks} label="나누기" onClick={() => { editor?.chain().focus().setHorizontalRule().run(); }} />
          <RibbonBtn icon={I.lineNum} label="줄 번호" onClick={() => notImpl("줄 번호")} />
          <RibbonBtn icon={I.hyphen} label="하이픈 넣기" onClick={() => notImpl("하이픈")} />
        </div>
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="원고지">
        <RibbonBtnLarge icon={<span style={{fontSize:14}}>📝</span>} label="원고지 설정" onClick={() => notImpl("원고지 설정")} />
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="단락">
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "#666" }}>
            <span>들여쓰기</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 8, color: "#888", width: 28 }}>왼쪽:</span>
            <input type="number" defaultValue={0} min={0} style={{ width: 40, height: 18, border: "1px solid #c0c0c0", borderRadius: 2, fontSize: 9, textAlign: "center", padding: 0 }} />
            <span style={{ fontSize: 8, color: "#888" }}>글자</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 8, color: "#888", width: 28 }}>오른쪽:</span>
            <input type="number" defaultValue={0} min={0} style={{ width: 40, height: 18, border: "1px solid #c0c0c0", borderRadius: 2, fontSize: 9, textAlign: "center", padding: 0 }} />
            <span style={{ fontSize: 8, color: "#888" }}>글자</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginLeft: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "#666" }}>
            <span>간격</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 8, color: "#888", width: 14 }}>앞:</span>
            <input type="number" defaultValue={0} min={0} style={{ width: 40, height: 18, border: "1px solid #c0c0c0", borderRadius: 2, fontSize: 9, textAlign: "center", padding: 0 }} />
            <span style={{ fontSize: 8, color: "#888" }}>줄</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 8, color: "#888", width: 14 }}>뒤:</span>
            <input type="number" defaultValue={4} min={0} style={{ width: 40, height: 18, border: "1px solid #c0c0c0", borderRadius: 2, fontSize: 9, textAlign: "center", padding: 0 }} />
            <span style={{ fontSize: 8, color: "#888" }}>pt</span>
          </div>
        </div>
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="정렬">
        <RibbonBtnLarge icon={I.position} label="위치" onClick={() => notImpl("위치")} />
        <RibbonBtnLarge icon={I.wrapText} label="텍스트 줄 바꿈" onClick={() => notImpl("텍스트 줄 바꿈")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RibbonBtn icon={I.bringFwd} label="앞으로 가져오기" onClick={() => notImpl("앞으로")} />
          <RibbonBtn icon={I.sendBwd} label="보내기" onClick={() => notImpl("보내기")} />
          <RibbonBtn icon={I.selPane} label="선택 창" onClick={() => notImpl("선택 창")} />
        </div>
        <RibbonBtnLarge icon={I.alignObj} label="맞춤" onClick={() => notImpl("맞춤")} />
      </RibbonGroup>
    </div>
  );

  /* ════════════════ RIBBON: 참조 (References) ════════════════ */
  const RibbonReferences = () => (
    <div style={{ display: "flex", alignItems: "stretch", gap: 0, height: 72 }}>
      <RibbonGroup label="목차">
        <RibbonBtnLarge icon={I.toc} label="목차" onClick={() => notImpl("목차")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RibbonBtn icon={<span style={{fontSize:9}}>📝</span>} label="텍스트 추가" onClick={() => notImpl("텍스트 추가")} />
          <RibbonBtn icon={<span style={{fontSize:9}}>🔄</span>} label="목차 업데이트" onClick={() => notImpl("목차 업데이트")} />
        </div>
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="각주">
        <RibbonBtnLarge icon={I.footnote} label="각주 삽입" onClick={() => {
          const text = prompt("각주 내용을 입력하세요:");
          if (text) insertFootnote(text);
        }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RibbonBtn icon={<span style={{fontSize:9}}>📌</span>} label="미주 삽입" onClick={() => { editor?.chain().focus().insertContent('<sup style="color:#c00">[미주]</sup>').run(); }} />
          <RibbonBtn icon={<span style={{fontSize:9}}>⬇</span>} label="다음 각주" onClick={() => notImpl("다음 각주")} />
          <RibbonBtn icon={<span style={{fontSize:9}}>📋</span>} label="각주/미주 표시" onClick={() => notImpl("각주 표시")} />
        </div>
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="인용 및 참고 문헌">
        <RibbonBtnLarge icon={I.cite} label="인용 삽입" onClick={() => { editor?.chain().focus().insertContent(' [저자, 연도]').run(); toast("인용 삽입됨"); }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "2px 4px" }}>
            <span style={{ fontSize: 8, color: "#888" }}>스타일:</span>
            <select style={{ height: 18, border: "1px solid #c0c0c0", borderRadius: 2, fontSize: 8, padding: "0 2px", background: "#fff" }}>
              <option>APA</option><option>MLA</option><option>Chicago</option><option>Harvard</option>
            </select>
          </div>
          <RibbonBtn icon={I.thesaurus} label="참고 문헌" onClick={() => notImpl("참고 문헌")} />
          <RibbonBtn icon={<span style={{fontSize:9}}>⚙</span>} label="공급자 변경" onClick={() => notImpl("공급자 변경")} />
        </div>
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="캡션">
        <RibbonBtnLarge icon={I.caption} label="캡션 삽입" onClick={() => { editor?.chain().focus().insertContent('<p style="font-size:9pt;color:#666;text-align:center">그림 1 — 설명</p>').run(); }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RibbonBtn icon={I.table} label="그림 목차 삽입" onClick={() => notImpl("그림 목차")} />
          <RibbonBtn icon={<span style={{fontSize:9}}>🔄</span>} label="목차 업데이트" onClick={() => notImpl("목차 업데이트")} />
          <RibbonBtn icon={<span style={{fontSize:9}}>↗</span>} label="상호 참조" onClick={() => notImpl("상호 참조")} />
        </div>
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="색인">
        <RibbonBtnLarge icon={I.index} label="색인 삽입" onClick={() => notImpl("색인 삽입")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RibbonBtn icon={<span style={{fontSize:9}}>🔄</span>} label="색인 업데이트" onClick={() => notImpl("색인 업데이트")} />
          <RibbonBtn icon={<span style={{fontSize:9}}>📌</span>} label="항목 표시" onClick={() => notImpl("항목 표시")} />
        </div>
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="관련 근거 목차">
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RibbonBtn icon={I.toc} label="관련 근거 목차 삽입" onClick={() => notImpl("관련 근거 목차")} />
          <RibbonBtn icon={I.cite} label="인용 표시" onClick={() => notImpl("인용 표시")} />
          <RibbonBtn icon={<span style={{fontSize:9}}>🔄</span>} label="관련 근거 업데이트" onClick={() => notImpl("관련 근거 업데이트")} />
        </div>
      </RibbonGroup>
    </div>
  );

  /* ════════════════ RIBBON: 검토 (Review) ════════════════ */
  const RibbonReview = () => (
    <div style={{ display: "flex", alignItems: "stretch", gap: 0, height: 72 }}>
      <RibbonGroup label="언어 교정">
        <RibbonBtnLarge icon={I.spellcheck} label="맞춤법 및 문법 검사" onClick={() => notImpl("맞춤법 검사")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RibbonBtn icon={I.thesaurus} label="동의어 사전" onClick={() => notImpl("동의어 사전")} />
          <RibbonBtn icon={I.wordcount} label="단어 개수" onClick={() => setWordCountOpen(true)} />
        </div>
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="음성">
        <RibbonBtnLarge icon={I.speaker} label="소리내어 읽기" onClick={() => {
          const text = editor?.state?.doc?.textContent;
          if (text && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text.substring(0, 500));
            utterance.lang = "ko-KR";
            window.speechSynthesis.speak(utterance);
            toast("읽기 시작...");
          }
        }} />
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="접근성">
        <RibbonBtnLarge icon={I.accessibility} label="접근성 검사" onClick={() => notImpl("접근성 검사")} />
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="언어">
        <RibbonBtnLarge icon={I.translate} label="번역" onClick={() => notImpl("번역")} />
        <RibbonBtnLarge icon={<span style={{fontSize:14,fontWeight:600}}>가</span>} label="언어" onClick={() => notImpl("언어")} />
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="메모">
        <RibbonBtnLarge icon={I.comment} label="새 메모" onClick={() => { setInfoPanelOpen(true); }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RibbonBtn icon={<span style={{fontSize:10}}>🗑</span>} label="삭제" onClick={() => { if (comments.length) { setComments(prev => prev.slice(0, -1)); toast("메모 삭제됨"); } }} />
          <RibbonBtn icon={<span style={{fontSize:10}}>◀</span>} label="이전" onClick={() => notImpl("이전 메모")} />
          <RibbonBtn icon={<span style={{fontSize:9}}>💬</span>} label="메모 표시" onClick={() => setInfoPanelOpen(true)} />
        </div>
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="변경 내용">
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "2px 4px" }}>
            <select style={{ height: 18, border: "1px solid #c0c0c0", borderRadius: 2, fontSize: 8, padding: "0 2px", background: "#fff", width: 80 }}>
              <option>메모 및 변경...</option><option>모든 마크업</option><option>마크업 없음</option>
            </select>
          </div>
          <RibbonBtn icon={<span style={{fontSize:9}}>📋</span>} label="변경 내용 표시" onClick={() => notImpl("변경 내용 표시")} />
          <RibbonBtn icon={<span style={{fontSize:9}}>📝</span>} label="검토 창" onClick={() => notImpl("검토 창")} />
        </div>
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="추적">
        <RibbonBtnLarge icon={I.track} label="추적" onClick={() => notImpl("변경 내용 추적")} />
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="비교">
        <RibbonBtnLarge icon={I.compare} label="비교" onClick={() => notImpl("비교")} />
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="보호">
        <RibbonBtnLarge icon={I.protect} label="보호" onClick={() => notImpl("문서 보호")} />
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="잉크">
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RibbonBtn icon={<span style={{fontSize:9}}>🖊</span>} label="잉크 숨기기" onClick={() => notImpl("잉크 숨기기")} />
        </div>
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="OneNote">
        <RibbonBtnLarge icon={I.onenote} label="연결된 OneNote" onClick={() => notImpl("OneNote")} />
      </RibbonGroup>
    </div>
  );

  /* ════════════════ RIBBON: 보기 (View) ════════════════ */
  const RibbonView = () => (
    <div style={{ display: "flex", alignItems: "stretch", gap: 0, height: 72 }}>
      <RibbonGroup label="보기">
        <RibbonBtnLarge icon={I.readMode} label="읽기 모드" onClick={() => setViewMode("read")} />
        <RibbonBtnLarge icon={I.printLayout} label="인쇄 모양" onClick={() => setViewMode("print")} style={{ background: viewMode === "print" ? "rgba(0,0,0,0.06)" : undefined }} />
        <RibbonBtnLarge icon={I.webLayout} label="웹 모양" onClick={() => setViewMode("web")} />
        <RibbonBtnLarge icon={I.outline} label="개요" onClick={() => setViewMode("outline")} />
        <RibbonBtnLarge icon={I.memo} label="초안" onClick={() => setViewMode("draft")} />
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="몰입형">
        <RibbonBtnLarge icon={I.readMode} label="몰입형 리더" onClick={() => notImpl("몰입형 리더")} />
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="표시">
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, cursor: "pointer" }}>
            <input type="checkbox" checked={showRuler} onChange={() => setShowRuler(!showRuler)} style={{ width: 12, height: 12 }} /> 눈금자
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, cursor: "pointer" }}>
            <input type="checkbox" checked={showGridlines} onChange={() => setShowGridlines(!showGridlines)} style={{ width: 12, height: 12 }} /> 눈금선
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, cursor: "pointer" }}>
            <input type="checkbox" checked={showNavPane} onChange={() => setShowNavPane(!showNavPane)} style={{ width: 12, height: 12 }} /> 탐색 창
          </label>
        </div>
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="페이지 이동">
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RibbonBtn icon={<span style={{fontSize:9}}>↕</span>} label="세로" onClick={() => notImpl("세로")} />
          <RibbonBtn icon={<span style={{fontSize:9}}>↔</span>} label="나란히" onClick={() => notImpl("나란히")} />
        </div>
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="확대/축소">
        <RibbonBtnLarge icon={I.zoom} label="확대/축소" onClick={() => setZoom(1)} />
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RibbonBtn icon={I.printLayout} label="한 페이지" onClick={() => setZoom(0.75)} />
          <RibbonBtn icon={I.split} label="여러 페이지" onClick={() => setZoom(0.5)} />
          <RibbonBtn icon={<span style={{fontSize:9}}>↔</span>} label="페이지 너비" onClick={() => setZoom(1)} />
        </div>
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="창">
        <RibbonBtnLarge icon={I.newWin} label="새 창" onClick={() => window.open(window.location.href, "_blank")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RibbonBtn icon={I.grid} label="모두 정렬" onClick={() => notImpl("모두 정렬")} />
          <RibbonBtn icon={I.split} label="나누기" onClick={() => notImpl("나누기")} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <RibbonBtn icon={<span style={{fontSize:9}}>👀</span>} label="나란히 보기" onClick={() => notImpl("나란히 보기")} />
          <RibbonBtn icon={<span style={{fontSize:9}}>🔄</span>} label="동시 스크롤" onClick={() => notImpl("동시 스크롤")} />
          <RibbonBtn icon={<span style={{fontSize:9}}>↩</span>} label="창 위치 다시 정렬" onClick={() => notImpl("창 위치")} />
        </div>
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="매크로">
        <RibbonBtnLarge icon={I.macro} label="매크로" onClick={() => notImpl("매크로")} />
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="SharePoint">
        <RibbonBtnLarge icon={I.info} label="속성" onClick={() => { setInfoPanelOpen(true); }} />
      </RibbonGroup>
    </div>
  );

  /* ════════════════ RIBBON: 파일 (File) — backstage ════════════════ */
  const RibbonFile = () => (
    <div style={{ display: "flex", alignItems: "stretch", gap: 0, height: 72 }}>
      <RibbonGroup label="">
        <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "0 8px" }}>
          <RibbonBtn icon={I.save} label="저장 (Ctrl+S)" onClick={manualSave} style={{ gap: 6, minWidth: 80, justifyContent: "flex-start", padding: "0 8px" }}>
            <span style={{ marginLeft: 4, fontSize: 10 }}>저장</span>
          </RibbonBtn>
          <RibbonBtn icon={I.print} label="인쇄 (Ctrl+P)" onClick={handlePrint} style={{ gap: 6, minWidth: 80, justifyContent: "flex-start", padding: "0 8px" }}>
            <span style={{ marginLeft: 4, fontSize: 10 }}>인쇄</span>
          </RibbonBtn>
          <RibbonBtn icon={I.info} label="정보" onClick={() => setInfoPanelOpen(!infoPanelOpen)} style={{ gap: 6, minWidth: 80, justifyContent: "flex-start", padding: "0 8px" }}>
            <span style={{ marginLeft: 4, fontSize: 10 }}>정보</span>
          </RibbonBtn>
        </div>
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="문서 정보">
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 8px", fontSize: 10 }}>
          <div>
            <span style={{ color: "#888" }}>유형: </span>
            <span style={{ padding: "1px 6px", borderRadius: 3, fontSize: 9, fontWeight: 600, background: getTypeColor(doc.documentType), color: "#fff" }}>{getTypeLabel(doc.documentType)}</span>
          </div>
          <div>
            <span style={{ color: "#888" }}>상태: </span>
            <select value={doc.status || "inbox"} onChange={e => handleStatusChange(e.target.value)}
              style={{ height: 20, border: "1px solid #c0c0c0", borderRadius: 2, fontSize: 9, padding: "0 4px", background: "#fff" }}>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {doc.author && <div><span style={{ color: "#888" }}>저자: </span><span>{parseAuthor(doc.author)}</span></div>}
          <div>
            <span style={{ color: "#888" }}>중요도: </span>
            {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ color: s <= (doc.importance || 3) ? "#b08d57" : "#ddd", fontSize: 11 }}>★</span>)}
          </div>
        </div>
      </RibbonGroup>
      <Sep />

      <RibbonGroup label="">
        <button onClick={() => setDeleteOpen(true)}
          style={{ padding: "4px 12px", border: "1px solid #e88", borderRadius: 3, background: "#fff", color: "#c44", fontSize: 10, cursor: "pointer", height: 26 }}>
          문서 삭제
        </button>
      </RibbonGroup>
    </div>
  );

  const ribbonContent = {
    file: <RibbonFile />,
    home: <RibbonHome />,
    insert: <RibbonInsert />,
    draw: <RibbonDraw />,
    design: <RibbonDesign />,
    layout: <RibbonLayout />,
    references: <RibbonReferences />,
    review: <RibbonReview />,
    view: <RibbonView />,
  };

  /* ═══════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════ */
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", background: "#e8e8e4", fontFamily: "'맑은 고딕', 'Noto Sans KR', 'Segoe UI', sans-serif" }}>
      <style>{EDITOR_CSS}</style>

      {/* ═══ TITLE BAR — Word 스타일 ═══ */}
      <div style={{
        height: 32, background: "#2b579a",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 6px 0 4px", color: "#fff", fontSize: 11, flexShrink: 0,
        position: "relative", userSelect: "none",
      }}>
        {/* Quick access toolbar (왼쪽) */}
        <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Word 아이콘 */}
          <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 4 }}>
            <svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#fff" opacity="0.9"/><text x="3" y="12" fontSize="10" fill="#2b579a" fontWeight="800" fontFamily="serif">W</text></svg>
          </div>
          <RibbonBtn icon={I.save} label="저장 (Ctrl+S)" onClick={manualSave} style={{ color: "rgba(255,255,255,0.9)", width: 24, height: 24 }} />
          <RibbonBtn icon={I.undo} label="실행 취소 (Ctrl+Z)" onClick={() => editor?.chain().focus().undo().run()} style={{ color: "rgba(255,255,255,0.9)", width: 24, height: 24 }} />
          <RibbonBtn icon={I.redo} label="다시 실행 (Ctrl+Y)" onClick={() => editor?.chain().focus().redo().run()} style={{ color: "rgba(255,255,255,0.9)", width: 24, height: 24 }} />
        </div>

        {/* 문서 제목 (가운데) */}
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ opacity: 0.95, fontWeight: 400, maxWidth: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11.5 }}>
            {title || "제목 없음"} - Word
          </span>
        </div>

        {/* 오른쪽 - 저장 상태 + 사용자 + 창 컨트롤 */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {saving && <span style={{ fontSize: 9, opacity: 0.65, marginRight: 4 }}>저장 중...</span>}
          {!saving && lastSaved && <span style={{ fontSize: 9, opacity: 0.55, marginRight: 4 }}>저장됨</span>}
          <span style={{ fontSize: 10, opacity: 0.8 }}>Se Hwan Youn</span>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#e8a020", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", marginLeft: 2 }}>Y</div>
          <div style={{ display: "flex", marginLeft: 8, gap: 0 }}>
            <button onClick={() => navigate("/vault")} style={{ width: 36, height: 24, border: "none", background: "transparent", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }} title="뒤로">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2"><line x1="0" y1="5" x2="10" y2="5"/></svg>
            </button>
            <button style={{ width: 36, height: 24, border: "none", background: "transparent", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }} title="최대화">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1" y="1" width="8" height="8"/></svg>
            </button>
            <button onClick={() => navigate("/vault")} style={{ width: 36, height: 24, border: "none", background: "transparent", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = "#c42b1c"} onMouseLeave={e => e.currentTarget.style.background = "transparent"} title="닫기">{I.close}</button>
          </div>
        </div>
      </div>

      {/* ═══ TAB BAR — Word 리본 탭 ═══ */}
      <div style={{
        height: 28, background: "#fff", borderBottom: "1px solid #ddd",
        display: "flex", alignItems: "stretch", padding: "0", gap: 0, flexShrink: 0,
      }}>
        {TABS.map(tab => {
          const isFile = tab.id === "file";
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={isFile ? "" : "word-tab"}
              style={{
                padding: "0 14px", border: "none", height: "100%",
                display: "flex", alignItems: "center",
                ...(isFile ? {
                  background: isActive ? "#2b579a" : "#2b579a",
                  color: "#fff", fontWeight: 500, fontSize: 12,
                  borderRadius: 0,
                } : {
                  background: isActive ? "#f8f8f6" : "transparent",
                  color: isActive ? "#2b579a" : "#666",
                  borderBottom: isActive ? "2px solid #2b579a" : "2px solid transparent",
                  fontSize: 11, fontWeight: isActive ? 600 : 400,
                }),
                cursor: "pointer", transition: "all 0.1s",
              }}
            >
              {tab.label}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        {/* 검색 바 */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "0 8px" }}>
          <div onClick={() => setFindOpen(true)} style={{
            display: "flex", alignItems: "center", gap: 4, padding: "0 12px",
            border: "1px solid #ddd", borderRadius: 14, height: 22, cursor: "pointer",
            fontSize: 10, color: "#999", background: "#f8f8f8", minWidth: 140,
          }}>
            {I.search} <span>어떤 작업을 원하시나요?</span>
          </div>
        </div>
      </div>

      {/* ═══ RIBBON CONTENT ═══ */}
      <div style={{
        background: "linear-gradient(to bottom, #f8f8f6 0%, #f0f0ee 100%)",
        borderBottom: "1px solid #c8c8c5",
        padding: "3px 8px", display: "flex", alignItems: "center",
        minHeight: 78, flexShrink: 0, overflowX: "auto", overflowY: "hidden",
      }}>
        {ribbonContent[activeTab]}
      </div>

      {/* ═══ RULER ═══ */}
      <Ruler zoom={zoom} show={showRuler} />

      {/* ═══ 플로팅 서브 툴바 (리본 아래, 캔버스 위 — 항상 보임) ═══ */}
      {editor && (
        <div style={{
          flexShrink: 0, display: "flex", alignItems: "center", gap: 2,
          padding: "4px 12px", background: "#fff",
          borderBottom: "1px solid #d8d8d5",
          overflowX: "auto", overflowY: "hidden",
        }}>
          <select value={currentFont} onChange={e => applyFontFamily(e.target.value)}
            style={{ height: 24, border: "1px solid #c0c0c0", borderRadius: 3, fontSize: 10, width: 100, background: "#fff", padding: "0 2px", fontFamily: currentFont }}>
            {FONT_FAMILIES.map(f => <option key={f} value={f} style={{fontFamily:f}}>{f}</option>)}
          </select>
          <select value={currentSize} onChange={e => applyFontSize(e.target.value)}
            style={{ height: 24, border: "1px solid #c0c0c0", borderRadius: 3, fontSize: 10, width: 42, background: "#fff", textAlign: "center" }}>
            {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="ft-sep"/>
          <button className={`ft-btn ${editor.isActive("bold")?"active":""}`} title="굵게" onMouseDown={e=>{e.preventDefault();editor.chain().focus().toggleBold().run()}}>{I.bold}</button>
          <button className={`ft-btn ${editor.isActive("italic")?"active":""}`} title="기울임" onMouseDown={e=>{e.preventDefault();editor.chain().focus().toggleItalic().run()}}>{I.italic}</button>
          <button className={`ft-btn ${editor.isActive("underline")?"active":""}`} title="밑줄" onMouseDown={e=>{e.preventDefault();editor.chain().focus().toggleUnderline().run()}}>{I.underline}</button>
          <button className={`ft-btn ${editor.isActive("strike")?"active":""}`} title="취소선" onMouseDown={e=>{e.preventDefault();editor.chain().focus().toggleStrike().run()}}>{I.strike}</button>
          <div className="ft-sep"/>
          {/* 글꼴색 */}
          <div style={{position:"relative"}}>
            <button className="ft-btn" title="글꼴 색" onMouseDown={e=>{e.preventDefault();setFontColorOpen(v=>!v);setHighlightColorOpen(false)}}>
              <span style={{display:"flex",flexDirection:"column",alignItems:"center"}}><span style={{fontSize:12,fontWeight:700,lineHeight:1}}>A</span><span style={{width:14,height:3,background:"#c00",borderRadius:1}}/></span>
            </button>
            {fontColorOpen&&(<>
              <div style={{position:"fixed",inset:0,zIndex:9998}} onClick={()=>setFontColorOpen(false)}/>
              <div style={{position:"absolute",top:30,left:0,zIndex:9999,background:"#fff",border:"1px solid #d0d0d0",borderRadius:6,boxShadow:"0 4px 16px rgba(0,0,0,0.18)",padding:8,width:150}}>
                <p style={{fontSize:9,color:"#888",marginBottom:4}}>글꼴 색</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4}}>
                  {TEXT_COLORS.map(c=>(<button key={c} className="cpick-item" onMouseDown={e=>{e.preventDefault();applyFontColor(c)}} style={{width:22,height:22,background:c,border:"1px solid #ccc",borderRadius:3,cursor:"pointer",transition:"transform 0.1s"}}/>))}
                </div>
                <button onMouseDown={e=>{e.preventDefault();editor.chain().focus().unsetColor().run();setFontColorOpen(false)}} style={{marginTop:6,fontSize:9,border:"1px solid #ddd",borderRadius:3,padding:"3px 0",background:"#fff",cursor:"pointer",width:"100%"}}>색 제거</button>
              </div>
            </>)}
          </div>
          {/* 형광펜 */}
          <div style={{position:"relative"}}>
            <button className="ft-btn" title="형광펜" onMouseDown={e=>{e.preventDefault();setHighlightColorOpen(v=>!v);setFontColorOpen(false)}}>
              <span style={{fontSize:10,fontWeight:600,background:"#ff0",padding:"1px 4px",borderRadius:2}}>ab</span>
            </button>
            {highlightColorOpen&&(<>
              <div style={{position:"fixed",inset:0,zIndex:9998}} onClick={()=>setHighlightColorOpen(false)}/>
              <div style={{position:"absolute",top:30,left:0,zIndex:9999,background:"#fff",border:"1px solid #d0d0d0",borderRadius:6,boxShadow:"0 4px 16px rgba(0,0,0,0.18)",padding:8,width:150}}>
                <p style={{fontSize:9,color:"#888",marginBottom:4}}>형광펜</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4}}>
                  {HIGHLIGHT_COLORS.map(c=>(<button key={c} className="cpick-item" onMouseDown={e=>{e.preventDefault();applyHighlight(c)}} style={{width:22,height:22,background:c,border:"1px solid #ccc",borderRadius:3,cursor:"pointer",transition:"transform 0.1s"}}/>))}
                </div>
                <button onMouseDown={e=>{e.preventDefault();editor.chain().focus().unsetHighlight().run();setHighlightColorOpen(false)}} style={{marginTop:6,fontSize:9,border:"1px solid #ddd",borderRadius:3,padding:"3px 0",background:"#fff",cursor:"pointer",width:"100%"}}>형광펜 제거</button>
              </div>
            </>)}
          </div>
          <div className="ft-sep"/>
          <button className={`ft-btn ${editor.isActive({textAlign:"left"})?"active":""}`} title="왼쪽" onMouseDown={e=>{e.preventDefault();editor.chain().focus().setTextAlign("left").run()}}>{I.alignL}</button>
          <button className={`ft-btn ${editor.isActive({textAlign:"center"})?"active":""}`} title="가운데" onMouseDown={e=>{e.preventDefault();editor.chain().focus().setTextAlign("center").run()}}>{I.alignC}</button>
          <button className={`ft-btn ${editor.isActive({textAlign:"right"})?"active":""}`} title="오른쪽" onMouseDown={e=>{e.preventDefault();editor.chain().focus().setTextAlign("right").run()}}>{I.alignR}</button>
          <button className={`ft-btn ${editor.isActive({textAlign:"justify"})?"active":""}`} title="양쪽" onMouseDown={e=>{e.preventDefault();editor.chain().focus().setTextAlign("justify").run()}}>{I.alignJ}</button>
          <div className="ft-sep"/>
          <button className={`ft-btn ${editor.isActive("bulletList")?"active":""}`} title="글머리 기호" onMouseDown={e=>{e.preventDefault();editor.chain().focus().toggleBulletList().run()}}>{I.listUl}</button>
          <button className={`ft-btn ${editor.isActive("orderedList")?"active":""}`} title="번호 목록" onMouseDown={e=>{e.preventDefault();editor.chain().focus().toggleOrderedList().run()}}>{I.listOl}</button>
          <div className="ft-sep"/>
          <button className="ft-btn" title="링크" onMouseDown={e=>{e.preventDefault();setLinkModalOpen(true)}}>{I.link}</button>
          <button className="ft-btn" title="각주" onMouseDown={e=>{e.preventDefault();const t=prompt("각주 내용:");if(t)insertFootnote(t)}}>
            <span style={{fontSize:9,fontWeight:700,color:"#2b579a"}}>주</span>
          </button>
          <button className={`ft-btn ${editor.isActive("blockquote")?"active":""}`} title="인용문" onMouseDown={e=>{e.preventDefault();editor.chain().focus().toggleBlockquote().run()}}>{I.quote}</button>
          <button className="ft-btn" title="수평선" onMouseDown={e=>{e.preventDefault();editor.chain().focus().setHorizontalRule().run()}}>{I.hr}</button>
          <button className={`ft-btn ${editor.isActive("codeBlock")?"active":""}`} title="코드 블록" onMouseDown={e=>{e.preventDefault();editor.chain().focus().toggleCodeBlock().run()}}>{I.code}</button>
        </div>
      )}

      {/* ═══ DOCUMENT CANVAS ═══ */}
      <div style={{ flex: 1, overflow: "auto", background: "#d4d4d0", display: "flex", justifyContent: "center", paddingTop: 20, paddingBottom: 40 }}>
        {/* Navigation pane */}
        {showNavPane && (
          <div style={{ width: 200, background: "#fff", borderRight: "1px solid #ddd", padding: 12, overflowY: "auto", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 600 }}>탐색</span>
              <button onClick={() => setShowNavPane(false)} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 12, color: "#999" }}>✕</button>
            </div>
            <input placeholder="문서 검색..." style={{ width: "100%", padding: "4px 8px", border: "1px solid #ddd", borderRadius: 3, fontSize: 10, marginBottom: 8, boxSizing: "border-box" }} />
            <div style={{ fontSize: 9, color: "#888" }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>제목</p>
              <p style={{ padding: "2px 0", cursor: "pointer", color: "#2b579a" }}>{title || "문서 제목"}</p>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 0 }}>
          {/* A4 Page */}
          <div style={{
            width: `${21 * zoom * 2.2}em`,
            minHeight: `${29.7 * zoom * 2.2}em`,
            maxWidth: "95vw",
            background: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)",
            position: "relative",
            padding: `${2.54 * zoom}em ${2 * zoom}em`,
            ...(showGridlines ? { backgroundImage: "linear-gradient(rgba(0,0,200,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,200,0.05) 1px, transparent 1px)", backgroundSize: "20px 20px" } : {}),
          }}>
            {/* Corner markers */}
            {[
              { top: "0.8em", left: "1.2em", borderTop: "1px solid #bbb", borderLeft: "1px solid #bbb" },
              { top: "0.8em", right: "1.2em", borderTop: "1px solid #bbb", borderRight: "1px solid #bbb" },
              { bottom: "0.8em", left: "1.2em", borderBottom: "1px solid #bbb", borderLeft: "1px solid #bbb" },
              { bottom: "0.8em", right: "1.2em", borderBottom: "1px solid #bbb", borderRight: "1px solid #bbb" },
            ].map((s, i) => (
              <div key={i} style={{ position: "absolute", width: 10, height: 10, ...s }} />
            ))}

            {/* Title */}
            <input
              value={title}
              onChange={onTitleChange}
              style={{
                width: "100%", border: "none", outline: "none",
                fontSize: `${Math.max(16, 20 * zoom)}px`, fontWeight: 600,
                color: "#1a1a1a", lineHeight: 1.4, marginBottom: `${0.8 * zoom}em`,
                fontFamily: "'맑은 고딕', 'Noto Serif KR', Georgia, serif",
                background: "transparent",
              }}
              placeholder="제목을 입력하세요..."
            />

            {/* Subtitle / Author line */}
            {(doc.subtitle || doc.author) && (
              <div style={{ marginBottom: `${0.8 * zoom}em`, paddingBottom: `${0.4 * zoom}em`, borderBottom: "1px solid #eee" }}>
                {doc.subtitle && <p style={{ fontSize: `${Math.max(11, 12 * zoom)}px`, color: "#888", marginBottom: 3 }}>{doc.subtitle}</p>}
                {doc.author && <p style={{ fontSize: `${Math.max(10, 11 * zoom)}px`, color: "#aaa" }}>{parseAuthor(doc.author)}</p>}
              </div>
            )}

            {/* Summary */}
            {doc.summary && (
              <div style={{
                background: "#f8f9fb", borderLeft: "3px solid #2b579a",
                padding: `${0.5 * zoom}em ${0.8 * zoom}em`, marginBottom: `${0.8 * zoom}em`,
                borderRadius: "0 3px 3px 0",
              }}>
                <p style={{ fontSize: `${Math.max(9, 10 * zoom)}px`, color: "#2b579a", fontWeight: 600, marginBottom: 3 }}>요약</p>
                <p style={{ fontSize: `${Math.max(11, 12 * zoom)}px`, color: "#444", lineHeight: 1.75 }}>{doc.summary}</p>
              </div>
            )}

            {/* TipTap Editor */}
            <div style={{ fontSize: `${10 * zoom}pt`, minHeight: `${20 * zoom}em` }}>
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* ── Info / Comments Side Panel (전면 개선) ── */}
          {infoPanelOpen && (
            <div style={{
              width: 300, background: "#fafbfc", borderLeft: "1px solid #e0e0e0",
              display: "flex", flexDirection: "column", flexShrink: 0,
              boxShadow: "-2px 0 12px rgba(0,0,0,0.06)",
            }}>
              {/* 패널 헤더 */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderBottom: "1px solid #e8e8e8", background: "#fff",
              }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>문서 속성</h3>
                <button onClick={() => setInfoPanelOpen(false)}
                  style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, color: "#999", lineHeight: 1 }}>✕</button>
              </div>

              {/* 스크롤 영역 */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>

                {/* ── 문서 기본 정보 카드 ── */}
                <div style={{ background: "#fff", borderRadius: 6, border: "1px solid #eee", padding: 12, marginBottom: 12 }}>
                  {/* 유형 + 상태 행 */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 9, color: "#999", marginBottom: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>유형</p>
                      <span style={{ padding: "3px 10px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: getTypeColor(doc.documentType), color: "#fff", display: "inline-block" }}>
                        {getTypeLabel(doc.documentType)}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 9, color: "#999", marginBottom: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>상태</p>
                      <select value={doc.status || "inbox"} onChange={e => handleStatusChange(e.target.value)}
                        style={{ width: "100%", height: 28, border: "1px solid #ddd", borderRadius: 4, padding: "0 8px", fontSize: 11, background: "#fff", cursor: "pointer" }}>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* 중요도 — 클릭 가능 */}
                  <div style={{ marginBottom: 8 }}>
                    <p style={{ fontSize: 9, color: "#999", marginBottom: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>중요도</p>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => {
                          api.patch(`/documents/${id}`, { importance: s })
                            .then(() => { setDoc(prev => ({ ...prev, importance: s })); toast(`중요도 ${s}로 변경`); });
                        }}
                          style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: s <= (doc.importance || 3) ? "#e8a020" : "#ddd", padding: 0, transition: "color 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.2)"}
                          onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                          ★
                        </button>
                      ))}
                      <span style={{ fontSize: 10, color: "#999", marginLeft: 4, alignSelf: "center" }}>{doc.importance || 3}/5</span>
                    </div>
                  </div>

                  {/* 저자 */}
                  {doc.author && (
                    <div style={{ marginBottom: 6 }}>
                      <p style={{ fontSize: 9, color: "#999", marginBottom: 2, fontWeight: 500 }}>저자</p>
                      <p style={{ fontSize: 11, color: "#333" }}>{parseAuthor(doc.author)}</p>
                    </div>
                  )}

                  {/* 출처 */}
                  {doc.source && (
                    <div style={{ marginBottom: 6 }}>
                      <p style={{ fontSize: 9, color: "#999", marginBottom: 2, fontWeight: 500 }}>출처</p>
                      <p style={{ fontSize: 10, color: "#2b579a", wordBreak: "break-all", cursor: doc.source.startsWith("http") ? "pointer" : "default" }}
                        onClick={() => { if (doc.source.startsWith("http")) window.open(doc.source, "_blank"); }}>
                        {doc.source}
                      </p>
                    </div>
                  )}

                  {/* 발행일 */}
                  {doc.publishedDate && (
                    <div>
                      <p style={{ fontSize: 9, color: "#999", marginBottom: 2, fontWeight: 500 }}>발행일</p>
                      <p style={{ fontSize: 11, color: "#333" }}>{new Date(doc.publishedDate).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</p>
                    </div>
                  )}
                </div>

                {/* ── 태그 관리 카드 ── */}
                <div style={{ background: "#fff", borderRadius: 6, border: "1px solid #eee", padding: 12, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "#333", margin: 0 }}>태그</p>
                    <span style={{ fontSize: 9, color: "#999" }}>{doc.tags?.length || 0}개</span>
                  </div>

                  {/* 기존 태그 — 삭제 가능 */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                    {(doc.tags || []).map((tag, i) => (
                      <span key={i} style={{
                        display: "inline-flex", alignItems: "center", gap: 3,
                        padding: "3px 8px", borderRadius: 12, fontSize: 10,
                        background: (tag.color || "#6b7280") + "18",
                        color: tag.color || "#6b7280", border: `1px solid ${tag.color || "#6b7280"}40`,
                        fontWeight: 500,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: tag.color || "#6b7280" }} />
                        {typeof tag === "string" ? tag : tag.name}
                        <button onClick={() => {
                          api.patch(`/documents/${id}`, { tagIds: doc.tags.filter(t => (t.id || t) !== (tag.id || tag)).map(t => t.id || t) })
                          .then(() => {
                            setDoc(prev => ({ ...prev, tags: prev.tags.filter(t => (t.id || t) !== (tag.id || tag)) }));
                            toast("태그 제거됨");
                          });
                        }}
                          style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 10, color: tag.color || "#999", padding: 0, lineHeight: 1 }}>✕</button>
                      </span>
                    ))}
                    {(!doc.tags || doc.tags.length === 0) && <span style={{ fontSize: 10, color: "#ccc", fontStyle: "italic" }}>태그 없음</span>}
                  </div>

                  {/* 태그 추가 입력 */}
                  <div style={{ display: "flex", gap: 4 }}>
                    <input id="tag-input" placeholder="새 태그 입력 후 Enter..."
                      onKeyDown={e => {
                        if (e.key === "Enter" && e.target.value.trim()) {
                          const tagName = e.target.value.trim();
                          // 태그 생성 후 문서에 추가
                          api.post("/tags", { name: tagName, color: ["#3b82f6","#ef4444","#f59e0b","#10b981","#8b5cf6","#ec4899","#06b6d4"][Math.floor(Math.random()*7)] })
                          .then(data => {
                            const newTag = data.data || data;
                            if (newTag?.id) {
                              const currentTagIds = (doc.tags || []).map(t => t.id).filter(Boolean);
                              api.patch(`/documents/${id}`, { tagIds: [...currentTagIds, newTag.id] })
                              .then(() => {
                                setDoc(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
                                toast(`태그 "${tagName}" 추가됨`);
                              });
                            }
                          }).catch(() => toast("태그 추가 실패"));
                          e.target.value = "";
                        }
                      }}
                      style={{ flex: 1, height: 28, border: "1px solid #ddd", borderRadius: 4, padding: "0 8px", fontSize: 10, background: "#fafafa" }} />
                  </div>
                </div>

                {/* ── 카테고리 카드 ── */}
                {doc.categories?.length > 0 && (
                  <div style={{ background: "#fff", borderRadius: 6, border: "1px solid #eee", padding: 12, marginBottom: 12 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "#333", marginBottom: 6 }}>카테고리</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {doc.categories.map((cat, i) => (
                        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 10px", borderRadius: 4, fontSize: 10, border: "1px solid #e0e0e0", color: "#555", background: "#f8f8f8" }}>
                          {cat.icon || "📁"} {typeof cat === "string" ? cat : cat.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── 문서 통계 카드 ── */}
                <div style={{ background: "#fff", borderRadius: 6, border: "1px solid #eee", padding: 12, marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#333", marginBottom: 8 }}>문서 통계</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {[
                      { label: "페이지", value: stats.pages },
                      { label: "단어", value: stats.words.toLocaleString() },
                      { label: "문자", value: stats.chars.toLocaleString() },
                      { label: "단락", value: editor?.getJSON()?.content?.length || 0 },
                    ].map(s => (
                      <div key={s.label} style={{ padding: "6px 8px", background: "#f8f9fb", borderRadius: 4, textAlign: "center" }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#2b579a", margin: 0 }}>{s.value}</p>
                        <p style={{ fontSize: 8, color: "#999", margin: 0, marginTop: 1 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── 타임스탬프 카드 ── */}
                <div style={{ background: "#fff", borderRadius: 6, border: "1px solid #eee", padding: 12, marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#333", marginBottom: 8 }}>기록</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "#888" }}>생성일</span>
                      <span style={{ fontSize: 10, color: "#444" }}>{doc.createdAt ? new Date(doc.createdAt).toLocaleString("ko-KR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "#888" }}>수정일</span>
                      <span style={{ fontSize: 10, color: "#444" }}>{doc.updatedAt ? new Date(doc.updatedAt).toLocaleString("ko-KR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}</span>
                    </div>
                    {lastSaved && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: "#888" }}>마지막 저장</span>
                        <span style={{ fontSize: 10, color: "#10b981" }}>{lastSaved.toLocaleTimeString("ko-KR")}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 메모/댓글 카드 ── */}
                <div style={{ background: "#fff", borderRadius: 6, border: "1px solid #eee", padding: 12, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: "#333", margin: 0 }}>메모</p>
                    <span style={{ fontSize: 9, color: "#999" }}>{comments.length}개</span>
                  </div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                    <input id="comment-input" value={commentText} onChange={e => setCommentText(e.target.value)}
                      placeholder="메모를 입력하세요..."
                      onKeyDown={e => { if (e.key === "Enter") addComment(); }}
                      style={{ flex: 1, height: 30, border: "1px solid #ddd", borderRadius: 4, padding: "0 10px", fontSize: 11, background: "#fafafa" }} />
                    <button onClick={addComment}
                      style={{ padding: "0 12px", border: "none", borderRadius: 4, background: "#2b579a", color: "#fff", fontSize: 10, cursor: "pointer", height: 30, fontWeight: 500 }}>추가</button>
                  </div>
                  <div style={{ maxHeight: 200, overflowY: "auto" }}>
                    {comments.map(c => (
                      <div key={c.id} style={{ padding: 10, background: "#fffbeb", borderRadius: 6, marginBottom: 6, border: "1px solid #fde68a", position: "relative" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#92400e" }}>{c.author}</span>
                          <span style={{ fontSize: 8, color: "#b8a060" }}>{c.time}</span>
                        </div>
                        {c.selection && (
                          <div style={{ fontSize: 9, color: "#888", fontStyle: "italic", marginBottom: 4, padding: "3px 6px", background: "#fff8e1", borderRadius: 3, borderLeft: "2px solid #f59e0b" }}>
                            "{c.selection}"
                          </div>
                        )}
                        <p style={{ fontSize: 11, color: "#333", margin: 0, lineHeight: 1.5 }}>{c.text}</p>
                        <button onClick={() => setComments(prev => prev.filter(x => x.id !== c.id))}
                          style={{ position: "absolute", top: 6, right: 6, fontSize: 10, color: "#ccc", border: "none", background: "transparent", cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.color = "#c44"}
                          onMouseLeave={e => e.currentTarget.style.color = "#ccc"}>✕</button>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <div style={{ textAlign: "center", padding: "16px 0", color: "#ccc" }}>
                        <p style={{ fontSize: 20, marginBottom: 4 }}>💬</p>
                        <p style={{ fontSize: 10 }}>메모가 없습니다</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 위험 영역 ── */}
                <div style={{ background: "#fff5f5", borderRadius: 6, border: "1px solid #fee2e2", padding: 12 }}>
                  <button onClick={() => setDeleteOpen(true)}
                    style={{ width: "100%", padding: "7px 0", border: "1px solid #fca5a5", borderRadius: 4, background: "#fff", color: "#dc2626", fontSize: 11, cursor: "pointer", fontWeight: 500, transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#dc2626"; }}>
                    문서 삭제
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ STATUS BAR ═══ */}
      <div style={{
        height: 22, background: "#2b579a", display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 10px", flexShrink: 0,
        color: "rgba(255,255,255,0.85)", fontSize: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span>{stats.pages}/{stats.pages} 페이지</span>
          <span>{stats.words}개 단어</span>
          <span style={{ opacity: 0.6 }}>다국어</span>
          <span style={{ opacity: 0.6 }}>한국어</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* View mode icons */}
          <RibbonBtn icon={I.readMode} label="읽기 모드" onClick={() => setViewMode("read")} style={{ color: viewMode === "read" ? "#fff" : "rgba(255,255,255,0.5)", width: 18, height: 18 }} />
          <RibbonBtn icon={I.printLayout} label="인쇄 모양" onClick={() => setViewMode("print")} style={{ color: viewMode === "print" ? "#fff" : "rgba(255,255,255,0.5)", width: 18, height: 18 }} />
          <RibbonBtn icon={I.webLayout} label="웹 모양" onClick={() => setViewMode("web")} style={{ color: viewMode === "web" ? "#fff" : "rgba(255,255,255,0.5)", width: 18, height: 18 }} />

          <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.25)", margin: "0 4px" }} />

          {/* Zoom controls */}
          <RibbonBtn icon={I.zoomOut} label="축소" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} style={{ color: "#fff", width: 18, height: 18 }} />
          <input
            type="range" min="30" max="200" value={Math.round(zoom * 100)}
            onChange={e => setZoom(+e.target.value / 100)}
            style={{ width: 80, height: 3, accentColor: "#fff", cursor: "pointer" }}
          />
          <span style={{ width: 32, textAlign: "center", fontSize: 9 }}>{Math.round(zoom * 100)}%</span>
          <RibbonBtn icon={I.zoomIn} label="확대" onClick={() => setZoom(z => Math.min(2, z + 0.1))} style={{ color: "#fff", width: 18, height: 18 }} />
        </div>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Find & Replace */}
      <Modal open={findOpen} title="찾기 및 바꾸기" onClose={() => setFindOpen(false)} width={400}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 3 }}>찾기</label>
            <input value={findText} onChange={e => setFindText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleFind(); }}
              autoFocus placeholder="검색할 텍스트..."
              style={{ width: "100%", padding: "6px 10px", border: "1px solid #ccc", borderRadius: 3, fontSize: 12, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 3 }}>바꾸기</label>
            <input value={replaceText} onChange={e => setReplaceText(e.target.value)}
              placeholder="바꿀 텍스트..."
              style={{ width: "100%", padding: "6px 10px", border: "1px solid #ccc", borderRadius: 3, fontSize: 12, boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <button onClick={handleFind} style={{ padding: "5px 14px", border: "1px solid #2b579a", borderRadius: 3, background: "#2b579a", color: "#fff", fontSize: 11, cursor: "pointer" }}>찾기</button>
            <button onClick={handleReplaceAll} style={{ padding: "5px 14px", border: "1px solid #ccc", borderRadius: 3, background: "#fff", color: "#333", fontSize: 11, cursor: "pointer" }}>모두 바꾸기</button>
          </div>
        </div>
      </Modal>

      {/* Table insert */}
      <Modal open={tableModalOpen} title="표 삽입" onClose={() => setTableModalOpen(false)} width={320}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 16 }}>
            <div>
              <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 3 }}>행 수</label>
              <input type="number" value={tableRows} onChange={e => setTableRows(+e.target.value)} min={1} max={20}
                style={{ width: 60, padding: "4px 8px", border: "1px solid #ccc", borderRadius: 3, fontSize: 12 }} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 3 }}>열 수</label>
              <input type="number" value={tableCols} onChange={e => setTableCols(+e.target.value)} min={1} max={10}
                style={{ width: 60, padding: "4px 8px", border: "1px solid #ccc", borderRadius: 3, fontSize: 12 }} />
            </div>
          </div>
          {/* Quick grid */}
          <div>
            <p style={{ fontSize: 9, color: "#888", marginBottom: 4 }}>빠른 선택 (클릭하여 삽입)</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2 }}>
              {Array.from({ length: 48 }, (_, i) => {
                const r = Math.floor(i / 8) + 1, c = (i % 8) + 1;
                return (
                  <div key={i}
                    onMouseEnter={() => { setTableRows(r); setTableCols(c); }}
                    onClick={() => { setTableRows(r); setTableCols(c); insertTable(); }}
                    style={{
                      width: 16, height: 16, border: "1px solid #ccc", borderRadius: 1, cursor: "pointer",
                      background: r <= tableRows && c <= tableCols ? "#2b579a" : "#fff",
                      transition: "background 0.1s",
                    }} />
                );
              })}
            </div>
            <p style={{ fontSize: 9, color: "#666", marginTop: 4 }}>{tableRows} x {tableCols} 표</p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={insertTable} style={{ padding: "5px 14px", border: "none", borderRadius: 3, background: "#2b579a", color: "#fff", fontSize: 11, cursor: "pointer" }}>삽입</button>
          </div>
        </div>
      </Modal>

      {/* Image insert */}
      <Modal open={imageModalOpen} title="그림 삽입" onClose={() => setImageModalOpen(false)} width={400}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 3 }}>이미지 URL</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..."
              style={{ width: "100%", padding: "6px 10px", border: "1px solid #ccc", borderRadius: 3, fontSize: 12, boxSizing: "border-box" }} />
          </div>
          <div style={{ textAlign: "center", padding: "8px 0", color: "#999", fontSize: 10 }}>또는</div>
          <button onClick={() => fileInputRef.current?.click()}
            style={{ padding: "8px 0", border: "2px dashed #ccc", borderRadius: 4, background: "#fafafa", cursor: "pointer", fontSize: 11, color: "#666" }}>
            📁 파일에서 선택
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFile} style={{ display: "none" }} />
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={insertImage} disabled={!imageUrl} style={{ padding: "5px 14px", border: "none", borderRadius: 3, background: imageUrl ? "#2b579a" : "#ccc", color: "#fff", fontSize: 11, cursor: imageUrl ? "pointer" : "default" }}>삽입</button>
          </div>
        </div>
      </Modal>

      {/* Link insert */}
      <Modal open={linkModalOpen} title="링크 삽입" onClose={() => setLinkModalOpen(false)} width={380}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 3 }}>표시 텍스트</label>
            <input value={linkLabel} onChange={e => setLinkLabel(e.target.value)} placeholder="링크 텍스트 (선택사항)"
              style={{ width: "100%", padding: "6px 10px", border: "1px solid #ccc", borderRadius: 3, fontSize: 12, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 3 }}>URL</label>
            <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..."
              style={{ width: "100%", padding: "6px 10px", border: "1px solid #ccc", borderRadius: 3, fontSize: 12, boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
            <button onClick={() => { editor?.chain().focus().unsetLink().run(); setLinkModalOpen(false); }}
              style={{ padding: "5px 14px", border: "1px solid #ccc", borderRadius: 3, background: "#fff", color: "#333", fontSize: 11, cursor: "pointer" }}>링크 제거</button>
            <button onClick={insertLink} disabled={!linkUrl}
              style={{ padding: "5px 14px", border: "none", borderRadius: 3, background: linkUrl ? "#2b579a" : "#ccc", color: "#fff", fontSize: 11, cursor: linkUrl ? "pointer" : "default" }}>삽입</button>
          </div>
        </div>
      </Modal>

      {/* Word count */}
      <Modal open={wordCountOpen} title="단어 개수" onClose={() => setWordCountOpen(false)} width={300}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "페이지", value: stats.pages },
            { label: "단어", value: stats.words },
            { label: "문자 (공백 포함)", value: stats.chars },
            { label: "문자 (공백 제외)", value: (editor?.state?.doc?.textContent || "").replace(/\s/g, "").length },
            { label: "단락", value: editor?.getJSON()?.content?.length || 0 },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontSize: 11, color: "#555" }}>{row.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#1a1a1a" }}>{row.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Modal>

      {/* Symbol insert */}
      <Modal open={symbolModalOpen} title="기호 삽입" onClose={() => setSymbolModalOpen(false)} width={360}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4 }}>
          {["©", "®", "™", "§", "¶", "†", "‡", "•", "…", "—",
            "–", "±", "×", "÷", "≠", "≈", "≤", "≥", "∞", "√",
            "∑", "∏", "∫", "∂", "∇", "∈", "∉", "⊂", "⊃", "∪",
            "∩", "∧", "∨", "¬", "∀", "∃", "α", "β", "γ", "δ",
            "ε", "θ", "λ", "μ", "π", "σ", "φ", "ω", "Δ", "Ω",
            "★", "☆", "♠", "♣", "♥", "♦", "←", "→", "↑", "↓",
          ].map(sym => (
            <button key={sym} onClick={() => { editor?.chain().focus().insertContent(sym).run(); setSymbolModalOpen(false); }}
              className="word-rb"
              style={{ width: 28, height: 28, border: "1px solid #ddd", borderRadius: 2, background: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {sym}
            </button>
          ))}
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmModal
        open={deleteOpen}
        title="문서 삭제"
        message="이 문서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      {Toast}
    </div>
  );
}
