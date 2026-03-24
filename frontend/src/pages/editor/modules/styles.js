/**
 * MS Word Editor Styles
 */
export const editorStyles = `
/* ──── ProseMirror Core ──── */
.ProseMirror {
  outline: none;
  min-height: 200px;
  position: relative;
  font-family: '맑은 고딕', 'Malgun Gothic', 'Noto Sans KR', sans-serif;
  font-size: 11pt;
  line-height: 1.75;
  color: #1a1a1a;
  caret-color: #000;
}
.ProseMirror h1 { font-size: 24pt; font-weight: 700; margin: 24px 0 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
.ProseMirror h2 { font-size: 18pt; font-weight: 600; margin: 20px 0 10px; }
.ProseMirror h3 { font-size: 14pt; font-weight: 600; margin: 16px 0 8px; }
.ProseMirror h4 { font-size: 12pt; font-weight: 600; margin: 14px 0 6px; }
.ProseMirror p { margin: 6px 0; }
.ProseMirror ul, .ProseMirror ol { padding-left: 24px; margin: 8px 0; }
.ProseMirror li { margin: 3px 0; }
.ProseMirror blockquote { border-left: 3px solid #3b82f6; margin: 12px 0; padding: 8px 16px; background: #fafaf6; color: #555; font-style: italic; }
.ProseMirror table { border-collapse: collapse; width: 100%; margin: 12px 0; }
.ProseMirror th, .ProseMirror td { border: 1px solid #ccc; padding: 6px 10px; font-size: 10pt; min-width: 80px; }
.ProseMirror th { background: #f1f5f9; font-weight: 600; }
.ProseMirror .selectedCell { background: rgba(59,130,246,0.1); }
.ProseMirror code { background: #f0f0ee; padding: 1px 4px; border-radius: 2px; font-size: 0.9em; font-family: 'Courier New', monospace; }
.ProseMirror pre { background: #2d2d2d; color: #ccc; padding: 12px 16px; border-radius: 4px; font-size: 10pt; overflow-x: auto; margin: 12px 0; }
.ProseMirror pre code { background: none; padding: 0; }
.ProseMirror hr { border: none; border-top: 1px solid #ddd; margin: 24px 0; }
.ProseMirror a { color: #3b82f6; text-decoration: underline; }
.ProseMirror img { max-width: 100%; cursor: pointer; }
.ProseMirror img.ProseMirror-selectednode { outline: 2px solid #3b82f6; }
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: #ccc;
  float: left;
  pointer-events: none;
  height: 0;
}
.ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 0; }
.ProseMirror ul[data-type="taskList"] li { display: flex; align-items: baseline; gap: 6px; }
.ProseMirror ul[data-type="taskList"] li input[type="checkbox"] { margin: 0; cursor: pointer; }
.ProseMirror .tableWrapper { overflow-x: auto; margin: 12px 0; }
.ProseMirror .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: 0; width: 4px; background: #3b82f6; cursor: col-resize; z-index: 20; }

/* ──── Selection Highlighting ──── */
.ProseMirror ::selection { background: #B4D6FA; }
.ProseMirror .ProseMirror-gapcursor { display: none; pointer-events: none; position: relative; }

/* ──── Word 365 ribbon buttons ──── */
.word-ribbon-btn { transition: background 0.08s, border-color 0.08s; }
.word-ribbon-btn:hover { background: #E5F1FB !important; }
.word-ribbon-btn:active { background: #CCE4F7 !important; }
.word-ribbon-btn.active { background: #CCE4F7 !important; border: 1px solid #98C6EA !important; }
.word-tab-btn { transition: background 0.08s, color 0.08s; }
.word-tab-btn:hover { background: transparent !important; color: #185ABD !important; }
.word-tab-btn.active { color: #185ABD !important; border-bottom: 2px solid #185ABD; font-weight: 600; }
.word-style-card { transition: border-color 0.1s, box-shadow 0.1s; }
.word-style-card:hover { border-color: #185ABD !important; box-shadow: 0 1px 4px rgba(24,90,189,0.15); }

/* ──── Tooltip (Word 365 스타일) ──── */
.word-tooltip {
  position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
  background: #fff; color: #333; padding: 6px 10px; border-radius: 4px;
  font-size: 11px; white-space: nowrap; pointer-events: none; z-index: 1000;
  opacity: 0; transition: opacity 0.15s;
  border: 1px solid #d1d5db; box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  font-family: 'Segoe UI', '맑은 고딕', sans-serif;
}
.word-tooltip::after {
  content: ""; position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
  border: 5px solid transparent; border-top-color: #fff;
  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.08));
}
*:hover > .word-tooltip { opacity: 1; }

/* ──── Dropdown menu (Word 365) ──── */
.word-dropdown-menu {
  position: absolute; top: 100%; left: 0; z-index: 200;
  background: #fff; border: 1px solid #d1d5db; border-radius: 6px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.14); min-width: 160px;
  padding: 4px 0; max-height: 360px; overflow-y: auto;
  animation: ribbonDropdownIn 0.12s ease-out;
}
@keyframes ribbonDropdownIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
.word-dropdown-item {
  display: flex; align-items: center; width: 100%; padding: 6px 12px; border: none; background: transparent;
  font-size: 12px; text-align: left; cursor: pointer; font-family: 'Segoe UI', '맑은 고딕', sans-serif;
  transition: background 0.08s; white-space: nowrap; gap: 8px;
}
.word-dropdown-item:hover { background: #E5F1FB; }
.word-dropdown-item.active { background: #CCE4F7; font-weight: 600; }
.word-dropdown-sep { height: 1px; background: #e5e5e5; margin: 4px 0; }

/* ──── Dialog / Modal ──── */
.word-dialog-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.35); z-index: 2000;
  display: flex; align-items: center; justify-content: center;
}
.word-dialog {
  background: #f3f3f3; border: 1px solid #b0b0b0; border-radius: 4px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25); min-width: 420px; max-width: 640px;
  font-family: '맑은 고딕', 'Segoe UI', sans-serif; font-size: 12px;
}
.word-dialog-title {
  padding: 10px 16px; font-size: 12px; font-weight: 400; color: #333;
  border-bottom: 1px solid #d5d5d5; background: #f3f3f3;
  display: flex; justify-content: space-between; align-items: center;
  cursor: default; user-select: none;
}
.word-dialog-body {
  padding: 16px; background: #fff;
}
.word-dialog-footer {
  padding: 10px 16px; display: flex; justify-content: flex-end; gap: 6px;
  border-top: 1px solid #d5d5d5;
}
.word-dialog-btn {
  padding: 5px 20px; font-size: 12px; border: 1px solid #adadad;
  border-radius: 2px; cursor: pointer; font-family: '맑은 고딕', sans-serif;
  background: #e5e5e5; color: #333;
}
.word-dialog-btn:hover { background: #d5d5d5; }
.word-dialog-btn.primary {
  background: #185ABD; color: #fff; border-color: #164EA8;
}
.word-dialog-btn.primary:hover { background: #1B4FA0; }
.word-dialog-label {
  display: block; font-size: 12px; color: #444; margin-bottom: 4px; font-weight: 400;
}
.word-dialog-input {
  width: 100%; padding: 4px 8px; border: 1px solid #adadad; border-radius: 2px;
  font-size: 12px; outline: none; box-sizing: border-box; font-family: '맑은 고딕', sans-serif;
}
.word-dialog-input:focus { border-color: #185ABD; box-shadow: 0 0 0 1px #185ABD; }
.word-dialog-tabs {
  display: flex; border-bottom: 1px solid #d5d5d5; padding: 0 16px; background: #f3f3f3;
}
.word-dialog-tab {
  padding: 8px 16px; font-size: 12px; border: none; background: transparent;
  cursor: pointer; border-bottom: 2px solid transparent; color: #555;
  font-family: '맑은 고딕', sans-serif;
}
.word-dialog-tab:hover { color: #333; }
.word-dialog-tab.active { color: #185ABD; border-bottom-color: #185ABD; font-weight: 600; }

/* ──── Floating Toolbar ──── */
.floating-toolbar {
  position: absolute; z-index: 100;
  background: #fff; border: 1px solid #d1d5db; border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 4px 6px;
  display: flex; align-items: center; gap: 1px;
  animation: floatIn 0.15s ease-out;
}
@keyframes floatIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ──── Backstage View (Word 365) ──── */
.backstage-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 3000;
  display: flex; animation: backstageFadeIn 0.15s ease-out;
}
@keyframes backstageFadeIn {
  from { opacity: 0; } to { opacity: 1; }
}
.backstage-sidebar {
  width: 280px; background: #185ABD; color: #fff; display: flex; flex-direction: column;
  padding: 0; flex-shrink: 0;
}
.backstage-content {
  flex: 1; background: #f3f3f3; padding: 40px 60px; overflow-y: auto;
}
.backstage-menu-item {
  display: flex; align-items: center; gap: 12px; padding: 12px 24px;
  border: none; background: transparent; color: rgba(255,255,255,0.9);
  font-size: 13px; cursor: pointer; width: 100%; text-align: left;
  font-family: 'Segoe UI', '맑은 고딕', sans-serif; transition: background 0.1s;
}
.backstage-menu-item:hover { background: rgba(255,255,255,0.12); }
.backstage-menu-item.active { background: rgba(255,255,255,0.18); color: #fff; font-weight: 600; }

/* ──── Table grid selector ──── */
.table-grid-cell {
  width: 18px; height: 18px; border: 1px solid #d1d5db; cursor: pointer;
  transition: background 0.05s, border-color 0.05s;
}
.table-grid-cell.active {
  background: #dbeafe; border-color: #3b82f6;
}

/* ──── Comment / Annotation ──── */
.word-comment {
  position: absolute; right: -220px; width: 200px;
  background: #fff; border: 1px solid #d1d5db; border-left: 3px solid #3b82f6;
  border-radius: 4px; padding: 8px 10px; font-size: 11px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}

/* ──── Context Menu ──── */
@keyframes ctxIn {
  from { opacity: 0; transform: translateY(-4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.ctx-menu-item:hover { background: #eff6ff !important; }

/* ──── Ribbon collapse toggle ──── */
.ribbon-collapse-btn {
  position: absolute; right: 8px; top: 8px; z-index: 10;
  width: 20px; height: 20px; border: 1px solid #d5d5d5;
  background: var(--ribbon-bg, #f8f8f8); border-radius: 3px;
  cursor: pointer; display: flex; align-items: center;
  justify-content: center; font-size: 10px; color: #888;
  transition: background 0.1s;
}
.ribbon-collapse-btn:hover { background: #dbeafe; }

/* ──── Image resize handles ──── */
.ProseMirror img { cursor: pointer; transition: outline 0.1s; border-radius: 2px; }
.ProseMirror img:hover { outline: 2px solid rgba(59,130,246,0.3); }
.ProseMirror img.ProseMirror-selectednode {
  outline: 2px solid #3b82f6;
  box-shadow: 0 0 0 4px rgba(59,130,246,0.1);
}

/* ──── Dark Mode ──── */
.word-editor-root.dark-mode {
  --ribbon-bg: #2d2d2d;
  --ribbon-fg: #e0e0e0;
  --ribbon-label: #888;
  --ribbon-sep: #444;
  --ribbon-active-bg: #3a3a5c;
  --ribbon-active-border: #5b7bb8;
  --ribbon-disabled: #555;
  --ribbon-input-bg: #383838;
  --ribbon-input-border: #555;
}
.word-editor-root.dark-mode .ProseMirror {
  color: #e0e0e0;
  caret-color: #fff;
}
.word-editor-root.dark-mode .ProseMirror h1,
.word-editor-root.dark-mode .ProseMirror h2,
.word-editor-root.dark-mode .ProseMirror h3,
.word-editor-root.dark-mode .ProseMirror h4 { color: #f0f0f0; }
.word-editor-root.dark-mode .ProseMirror a { color: #6ba3f7; }
.word-editor-root.dark-mode .ProseMirror blockquote { background: #333; border-left-color: #5b7bb8; color: #ccc; }
.word-editor-root.dark-mode .ProseMirror th { background: #383838; }
.word-editor-root.dark-mode .ProseMirror td, .word-editor-root.dark-mode .ProseMirror th { border-color: #555; }
.word-editor-root.dark-mode .ProseMirror code { background: #383838; }
.word-editor-root.dark-mode .ProseMirror hr { border-top-color: #555; }
.word-editor-root.dark-mode .ProseMirror ::selection { background: #3a5280; }
.word-editor-root.dark-mode .word-ribbon-btn:hover { background: #3a3a50 !important; }
.word-editor-root.dark-mode .word-ribbon-btn.active { background: #3a3a50 !important; border: 1px solid #5b7bb8 !important; }
.word-editor-root.dark-mode .word-tab-btn:hover { background: transparent !important; color: #7AACF0 !important; }
.word-editor-root.dark-mode .word-tab-btn.active { color: #7AACF0 !important; border-bottom-color: #7AACF0; }
.word-editor-root.dark-mode .word-style-card:hover { border-color: #5b7bb8 !important; }
.word-editor-root.dark-mode .word-dropdown-menu { background: #2d2d2d; border-color: #444; }
.word-editor-root.dark-mode .word-dropdown-item { color: #e0e0e0; }
.word-editor-root.dark-mode .word-dropdown-item:hover { background: #3a3a5c; }
.word-editor-root.dark-mode .floating-toolbar { background: #2d2d2d; border-color: #444; }
.word-editor-root.dark-mode .word-tooltip { background: #333; color: #e0e0e0; border-color: #555; }
.word-editor-root.dark-mode .word-tooltip::after { border-top-color: #333; }

/* ──── Print styles ──── */
@media print {
  /* Hide all UI elements */
  .word-editor-root > *:not(.editor-canvas-scroll):not([class*="editor-page"]) { display: none !important; }
  .word-editor-root { display: block !important; height: auto !important; overflow: visible !important; }

  /* Hide sidebar, ribbon, tabs, status bar, nav pane, meta drawer */
  .word-tab-btn, .word-ribbon-btn, .ribbon-collapse-btn { display: none !important; }
  .floating-toolbar { display: none !important; }
  .page-header-area input, .page-footer-area input { border: none !important; }

  /* Page area */
  .editor-page-area {
    box-shadow: none !important;
    margin: 0 !important;
    width: 100% !important;
    min-height: auto !important;
    page-break-after: always;
  }
  .editor-canvas-scroll {
    background: none !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  /* Handle page breaks */
  .ProseMirror hr { page-break-after: always; border: none !important; }
  .ProseMirror { min-height: auto !important; }

  /* Avoid breaking inside certain elements */
  .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 { page-break-after: avoid; }
  .ProseMirror table { page-break-inside: avoid; }
  .ProseMirror img { page-break-inside: avoid; }
  .ProseMirror blockquote { page-break-inside: avoid; }
}

/* ──── Splash / Loading screen (Word 365) ──── */
.editor-splash {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: #185ABD;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  z-index: 10000; color: #fff;
  animation: splashFadeIn 0.3s ease-out;
}
.editor-splash .logo { font-size: 42px; font-weight: 700; letter-spacing: -2px; margin-bottom: 8px; }
.editor-splash .subtitle { font-size: 14px; opacity: 0.85; letter-spacing: 1px; }
.editor-splash .loading-bar {
  width: 200px; height: 2px; background: rgba(255,255,255,0.2);
  margin-top: 24px; border-radius: 1px; overflow: hidden;
}
.editor-splash .loading-bar::after {
  content: ""; display: block; width: 40%; height: 100%;
  background: rgba(255,255,255,0.8); border-radius: 1px;
  animation: splashLoad 1.2s ease-in-out infinite;
}
@keyframes splashFadeIn {
  from { opacity: 0; } to { opacity: 1; }
}
@keyframes splashLoad {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(150%); }
  100% { transform: translateX(350%); }
}

/* ──── Pagination (워드 스타일 페이지 전환) ──── */
.editor-page-area { position: relative; }
.editor-page-area .ProseMirror { min-height: auto !important; }
/* 페이지 전환 시 부드러운 margin 애니메이션 */
.editor-page-area .ProseMirror > [data-pb] {
  transition: margin-top 0.15s ease-out;
}
/* 스크롤 컨테이너 부드러운 스크롤 */
.editor-canvas-scroll {
  scroll-behavior: auto;
}

/* ──── Drag & Drop ──── */
.ProseMirror.drag-over { outline: 2px dashed #3b82f6 !important; outline-offset: -4px; }

/* ══════════════════════════════════════════════════
   Footnote / Endnote System (MS Word 스타일)
   ══════════════════════════════════════════════════ */

/* 본문 내 각주 참조 (위첨자) */
.ProseMirror .footnote-ref {
  color: #0563C1;
  cursor: pointer;
  font-size: 0.75em;
  vertical-align: super;
  font-weight: 600;
  padding: 0 1px;
  transition: background 0.15s, color 0.15s;
  border-radius: 2px;
  text-decoration: none;
}
.ProseMirror .footnote-ref:hover,
.ProseMirror .footnote-ref.footnote-ref-hover {
  background: #dbeafe;
  color: #1d4ed8;
}
@keyframes footnoteFlash {
  0%, 100% { background: transparent; }
  25%, 75% { background: #fef3c7; }
}
.ProseMirror .footnote-ref.footnote-ref-flash {
  animation: footnoteFlash 1.5s ease;
}

/* 각주 툴팁 */
.footnote-tooltip {
  position: fixed;
  z-index: 9999;
  background: #1f2937;
  color: #f3f4f6;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 11px;
  max-width: 320px;
  line-height: 1.5;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
}

/* 페이지 하단 각주 영역 */
.footnote-area {
  position: relative;
  margin-top: 20px;
  padding-top: 8px;
}
.footnote-separator {
  width: 33%;
  height: 0;
  border-top: 1px solid #999;
  margin-bottom: 8px;
}
.footnote-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.footnote-item {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 2px 0;
  font-size: 9pt;
  line-height: 1.4;
  position: relative;
  transition: background 0.3s;
  font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
}
@keyframes footnoteItemFlash {
  0%, 100% { background: transparent; }
  20%, 80% { background: #fff3cd; }
}
.footnote-item.footnote-item-flash {
  animation: footnoteItemFlash 2s ease;
}
.footnote-item:hover {
  background: #f8fafc;
}
.footnote-item-editing {
  background: #fffef5 !important;
}
.footnote-item-number {
  color: #0563C1;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.8em;
  vertical-align: super;
  min-width: 18px;
  flex-shrink: 0;
  user-select: none;
  text-align: right;
  padding-right: 2px;
  line-height: 1.2;
}
.footnote-item-number:hover {
  text-decoration: underline;
  color: #1d4ed8;
}
.footnote-item-content {
  flex: 1;
  color: #333;
  min-height: 16px;
}
.footnote-item-text {
  cursor: text;
  display: inline-block;
  min-height: 14px;
  min-width: 40px;
}
.footnote-item-text:hover {
  background: #f0f7ff;
  border-radius: 2px;
}
.footnote-edit-input {
  width: 100%;
  border: none;
  border-bottom: 1.5px solid #0563C1;
  outline: none;
  font-size: 9pt;
  font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
  padding: 1px 2px;
  background: transparent;
  color: #333;
  line-height: 1.4;
}
.footnote-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #ccc;
  font-size: 10px;
  padding: 0 3px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
  line-height: 1;
  margin-top: 1px;
}
.footnote-item:hover .footnote-delete-btn {
  opacity: 0.5;
}
.footnote-delete-btn:hover {
  opacity: 1 !important;
  color: #dc2626 !important;
}

/* 미주 영역 */
.endnote-area {
  margin-top: 32px;
  padding-top: 8px;
}
.endnote-separator {
  width: 100%;
  height: 0;
  border-top: 2px solid #999;
  margin-bottom: 8px;
}
.endnote-header {
  font-size: 11pt;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
  font-family: '맑은 고딕', 'Malgun Gothic', sans-serif;
}
.endnote-number {
  color: #7c3aed;
}

/* ══════════════════════════════════════════════════
   Comment / Memo System (MS Word 365 스타일)
   ══════════════════════════════════════════════════ */

/* 본문 내 메모 하이라이트 */
.ProseMirror span.comment-highlight {
  background-color: rgba(255, 213, 79, 0.25);
  border-bottom: 2px solid #FFD54F;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
  border-radius: 1px;
}
.ProseMirror span.comment-highlight:hover {
  background-color: rgba(255, 213, 79, 0.4);
}
.ProseMirror span.comment-highlight.comment-active {
  background-color: rgba(255, 224, 130, 0.5);
  border-bottom-color: #FFA726;
}
.ProseMirror span.comment-highlight.comment-resolved {
  background-color: transparent;
  border-bottom: 1px dashed #CCC;
}

/* 마크업 모드별 하이라이트 숨김 */
.comment-markup-none .ProseMirror span.comment-highlight,
.comment-markup-original .ProseMirror span.comment-highlight,
.comment-markup-simple .ProseMirror span.comment-highlight {
  background-color: transparent !important;
  border-bottom: none !important;
}

/* 간단한 태그 모드 — 여백 아이콘 */
.comment-margin-indicator {
  position: absolute;
  right: -30px;
  width: 22px;
  height: 22px;
  cursor: pointer;
  opacity: 0.5;
  z-index: 10;
  transition: opacity 0.15s, transform 0.1s;
}
.comment-margin-indicator:hover {
  opacity: 1;
  transform: scale(1.15);
}

/* ── 메모 패널 (오른쪽) ── */
.comments-panel {
  width: 280px;
  min-width: 220px;
  max-width: 360px;
  background: #F8F9FA;
  border-left: 1px solid #E0E0E0;
  overflow-y: auto;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.comments-panel-header {
  padding: 10px 12px;
  border-bottom: 1px solid #E8E8E8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: #fff;
}
.comments-panel-title {
  font-size: 12px;
  font-weight: 600;
  color: #555;
  display: flex;
  align-items: center;
  gap: 6px;
}
.comments-panel-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 2px;
  border-radius: 3px;
  display: flex;
  align-items: center;
}
.comments-panel-close:hover {
  background: #f0f0f0;
  color: #666;
}
.comments-balloon-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

/* ── 메모 말풍선 카드 ── */
.comment-balloon {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: 6px;
  padding: 0;
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.5;
  position: relative;
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor: pointer;
  overflow: hidden;
  font-family: 'Segoe UI', '맑은 고딕', sans-serif;
}
.comment-balloon:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-color: #D0D0D0;
}
.comment-balloon.active {
  border-color: var(--author-color, #3b82f6);
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

/* 왼쪽 색상 바 (활성 시 표시) */
.comment-color-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 6px 0 0 6px;
  transition: background-color 0.2s;
}

.comment-balloon-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 6px;
}
.comment-meta-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.comment-author-name {
  font-weight: 600;
  font-size: 13px;
  color: #333;
  display: block;
  line-height: 1.3;
}
.comment-timestamp {
  font-size: 11px;
  color: #999;
}
.comment-edited-badge {
  font-size: 10px;
  color: #aaa;
}
.comment-content {
  font-size: 13px;
  color: #444;
  padding: 0 12px 8px;
  white-space: pre-wrap;
  line-height: 1.6;
  word-break: break-word;
}

/* 더보기 메뉴 버튼 */
.comment-more-btn {
  opacity: 0;
  transition: opacity 0.15s;
  cursor: pointer;
  padding: 3px 5px;
  border-radius: 3px;
  background: none;
  border: none;
  display: flex;
  align-items: center;
}
.comment-balloon:hover .comment-more-btn {
  opacity: 0.5;
}
.comment-more-btn:hover {
  opacity: 1 !important;
  background: #F0F0F0;
}

/* 더보기 드롭다운 메뉴 */
.comment-more-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 300;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  min-width: 170px;
  padding: 4px 0;
  animation: ctxIn 0.12s ease;
}
.comment-more-divider {
  height: 1px;
  background: #e5e5e5;
  margin: 3px 0;
}
.comment-more-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  text-align: left;
  color: #333;
  font-family: 'Segoe UI', '맑은 고딕', sans-serif;
  transition: background 0.1s;
}
.comment-more-item:hover {
  background: #eff6ff;
}
.comment-more-item.danger {
  color: #dc2626;
}
.comment-more-item.danger:hover {
  background: #fef2f2;
}
.comment-more-item.disabled {
  color: #bbb;
  cursor: default;
  opacity: 0.5;
}
.comment-more-icon {
  width: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 답글 */
.comment-replies {
  border-top: 1px solid #F0F0F0;
}
.comment-reply-item {
  padding: 8px 12px 6px;
  border-top: 1px solid #F5F5F5;
}
.comment-reply-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

/* 편집 영역 */
.comment-edit-area {
  padding: 0 12px 8px;
}
.comment-edit-textarea {
  width: 100%;
  border: 1.5px solid #4A86C8;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 13px;
  resize: none;
  min-height: 50px;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  line-height: 1.5;
  transition: border-color 0.2s;
}
.comment-edit-textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37,99,235,0.1);
}
.comment-edit-actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  justify-content: flex-end;
}

/* 액션 버튼 */
.comment-action-btn {
  padding: 4px 14px;
  font-size: 11px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  background: #fff;
  color: #555;
  font-family: 'Segoe UI', '맑은 고딕', sans-serif;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background 0.1s, border-color 0.1s;
}
.comment-action-btn:hover {
  background: #f5f5f5;
  border-color: #bbb;
}
.comment-action-btn.primary {
  background: #185ABD;
  color: #fff;
  border-color: #185ABD;
}
.comment-action-btn.primary:hover {
  background: #1a4fa0;
}
.comment-action-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

/* 답글 입력 필드 */
.comment-reply-input {
  width: 100%;
  border: 1.5px solid #E0E0E0;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 12px;
  resize: none;
  min-height: 36px;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.comment-reply-input:focus {
  border-color: #4A86C8;
  box-shadow: 0 0 0 2px rgba(74,134,200,0.1);
}

/* 하단 액션 바 */
.comment-actions-bar {
  padding: 6px 12px 10px;
  border-top: 1px solid #F0F0F0;
}
.comment-reply-area {
  display: flex;
  flex-direction: column;
}
.comment-bottom-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.comment-reply-trigger {
  flex: 1;
  text-align: left;
  border: 1px solid #E0E0E0;
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 12px;
  color: #999;
  cursor: pointer;
  background: #fafafa;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: border-color 0.15s, background 0.15s;
}
.comment-reply-trigger:hover {
  border-color: #ccc;
  background: #f5f5f5;
}
.comment-resolve-btn {
  border: 1px solid #4CAF50;
  border-radius: 20px;
  padding: 5px 14px;
  font-size: 11px;
  color: #4CAF50;
  cursor: pointer;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}
.comment-resolve-btn:hover {
  background: #4CAF50;
  color: #fff;
}

/* 해결된 메모 */
.comment-balloon.resolved {
  opacity: 0.65;
  padding: 0;
}
.comment-resolved-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  cursor: pointer;
}
.comment-resolved-text {
  font-size: 12px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.comment-reopen-btn {
  background: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  padding: 3px 10px;
  font-size: 11px;
  color: #555;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: background 0.1s;
}
.comment-reopen-btn:hover {
  background: #f0f0f0;
}

/* ── 검토 창 (세로/가로) ── */
.reviewing-pane {
  background: #F8F9FA;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}
.reviewing-pane-vertical {
  width: 300px;
  border-right: 1px solid #E0E0E0;
  overflow-y: auto;
}
.reviewing-pane-horizontal {
  height: 200px;
  border-top: 1px solid #E0E0E0;
  overflow-y: auto;
}
.reviewing-pane-header {
  padding: 10px 14px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  background: #fff;
}
.reviewing-pane-title {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}
.reviewing-pane-count {
  font-size: 11px;
  color: #888;
  margin-left: 10px;
}
.reviewing-pane-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #888;
  padding: 2px;
  border-radius: 3px;
}
.reviewing-pane-close:hover {
  background: #f0f0f0;
}
.reviewing-pane-list {
  flex: 1;
  overflow-y: auto;
}
.reviewing-pane-item {
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.1s;
}
.reviewing-pane-item:hover {
  background: #f5f5f5;
}
.reviewing-pane-item.active {
  background: #e8f0fe;
}
.reviewing-pane-item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}
.reviewing-pane-item-name {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}
.reviewing-pane-item-date {
  font-size: 10px;
  color: #888;
}
.reviewing-pane-item-content {
  font-size: 12px;
  color: #555;
  margin-left: 26px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.reviewing-pane-item-replies {
  font-size: 11px;
  color: #999;
  margin-left: 26px;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.reviewing-pane-empty {
  padding: 30px 20px;
  text-align: center;
  color: #999;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* ── Dark mode ── */
.word-editor-root.dark-mode .comment-balloon {
  background: #2d2d2d;
  border-color: #444;
}
.word-editor-root.dark-mode .comment-balloon.active {
  border-color: var(--author-color, #5b7bb8);
}
.word-editor-root.dark-mode .comment-balloon:hover {
  border-color: #555;
}
.word-editor-root.dark-mode .comment-author-name { color: #e0e0e0; }
.word-editor-root.dark-mode .comment-content { color: #ccc; }
.word-editor-root.dark-mode .comment-timestamp { color: #777; }
.word-editor-root.dark-mode .comments-panel { background: #1e1e1e; border-left-color: #444; }
.word-editor-root.dark-mode .comments-panel-header { background: #2a2a2a; border-bottom-color: #444; }
.word-editor-root.dark-mode .comments-panel-title { color: #bbb; }
.word-editor-root.dark-mode .reviewing-pane { background: #1e1e1e; }
.word-editor-root.dark-mode .reviewing-pane-header { background: #2a2a2a; border-bottom-color: #444; }
.word-editor-root.dark-mode .reviewing-pane-vertical { border-right-color: #444; }
.word-editor-root.dark-mode .reviewing-pane-horizontal { border-top-color: #444; }
.word-editor-root.dark-mode .reviewing-pane-item { border-bottom-color: #333; }
.word-editor-root.dark-mode .reviewing-pane-item:hover { background: #333; }
.word-editor-root.dark-mode .reviewing-pane-item.active { background: #2a3a5c; }
.word-editor-root.dark-mode .ProseMirror span.comment-highlight {
  background-color: rgba(255,243,196,0.2);
  border-bottom-color: rgba(255,213,79,0.4);
}
.word-editor-root.dark-mode .ProseMirror span.comment-highlight.comment-active {
  background-color: rgba(255,224,130,0.3);
}
.word-editor-root.dark-mode .comment-edit-textarea {
  background: #333;
  color: #e0e0e0;
  border-color: #5b7bb8;
}
.word-editor-root.dark-mode .comment-reply-input {
  background: #333;
  color: #e0e0e0;
  border-color: #555;
}
.word-editor-root.dark-mode .comment-reply-trigger {
  background: #333;
  border-color: #555;
  color: #888;
}
.word-editor-root.dark-mode .comment-more-menu {
  background: #2d2d2d;
  border-color: #555;
}
.word-editor-root.dark-mode .comment-more-item { color: #ddd; }
.word-editor-root.dark-mode .comment-more-item:hover { background: #3a3a3a; }

/* 각주 다크 모드 */
.word-editor-root.dark-mode .footnote-area { border-color: #555; }
.word-editor-root.dark-mode .footnote-separator { border-color: #555; }
.word-editor-root.dark-mode .footnote-item { color: #ccc; }
.word-editor-root.dark-mode .footnote-item:hover { background: #333; }
.word-editor-root.dark-mode .footnote-item-content { color: #ccc; }
.word-editor-root.dark-mode .footnote-edit-input { color: #e0e0e0; border-bottom-color: #5b7bb8; }
.word-editor-root.dark-mode .endnote-header { color: #ddd; }
.word-editor-root.dark-mode .endnote-separator { border-color: #555; }

/* ── 인쇄 시 숨김 ── */
@media print {
  .comments-panel { display: none !important; }
  .reviewing-pane, .reviewing-pane-vertical, .reviewing-pane-horizontal { display: none !important; }
  .comment-margin-indicator { display: none !important; }
  .ProseMirror span.comment-highlight { background-color: transparent !important; border-bottom: none !important; }
  .footnote-delete-btn { display: none !important; }
}

/* ══════════════════════════════════════════════════
   Page Break / Section Break / Column Break
   ══════════════════════════════════════════════════ */

/* 페이지 나누기 */
.ProseMirror .page-break {
  page-break-after: always;
  break-after: page;
  display: block;
  height: 0;
  border: none;
  border-top: 2px dashed #c0c0c0;
  margin: 24px 0;
  position: relative;
}
.ProseMirror .page-break::after {
  content: "페이지 나누기";
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  padding: 0 12px;
  font-size: 9px;
  color: #999;
  letter-spacing: 1px;
}

/* 구역 나누기 */
.ProseMirror .section-break {
  display: block;
  border: none;
  border-top: 2px dashed #a0a0a0;
  margin: 24px 0;
  position: relative;
}
.ProseMirror .section-break::after {
  content: "구역 나누기";
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  padding: 0 12px;
  font-size: 9px;
  color: #888;
  letter-spacing: 1px;
}

/* 단 나누기 */
.ProseMirror .column-break {
  break-after: column;
  display: block;
  border-top: 1px dashed #ccc;
  margin: 12px 0;
  position: relative;
}
.ProseMirror .column-break::after {
  content: "단 나누기";
  position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
  background: #fff; padding: 0 8px; font-size: 9px; color: #aaa;
}

/* ══════════════════════════════════════════════════
   변경 내용 추적 (Track Changes)
   ══════════════════════════════════════════════════ */

/* 삽입된 텍스트 */
.ProseMirror span.track-insert {
  color: #16a34a;
  text-decoration: underline;
  text-decoration-color: #16a34a;
  text-decoration-style: solid;
  background: rgba(22, 163, 74, 0.06);
  border-bottom: none;
  position: relative;
  cursor: pointer;
}
.ProseMirror span.track-insert:hover {
  background: rgba(22, 163, 74, 0.12);
}
.ProseMirror span.track-insert::after {
  content: attr(data-author);
  position: absolute;
  bottom: calc(100% + 2px);
  left: 0;
  background: #16a34a;
  color: #fff;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 9px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
  z-index: 50;
}
.ProseMirror span.track-insert:hover::after {
  opacity: 1;
}

/* 삭제된 텍스트 */
.ProseMirror span.track-delete {
  color: #dc2626;
  text-decoration: line-through;
  text-decoration-color: #dc2626;
  background: rgba(220, 38, 38, 0.06);
  opacity: 0.7;
  cursor: pointer;
}
.ProseMirror span.track-delete:hover {
  background: rgba(220, 38, 38, 0.12);
  opacity: 1;
}

/* 서식 변경 */
.ProseMirror span.track-format {
  text-decoration: underline;
  text-decoration-color: #2563eb;
  text-decoration-style: double;
  cursor: pointer;
}
.ProseMirror span.track-format:hover {
  background: rgba(37, 99, 235, 0.08);
}

/* 다크 모드 Track Changes */
.word-editor-root.dark-mode .ProseMirror span.track-insert {
  color: #4ade80;
  text-decoration-color: #4ade80;
  background: rgba(74, 222, 128, 0.08);
}
.word-editor-root.dark-mode .ProseMirror span.track-delete {
  color: #f87171;
  text-decoration-color: #f87171;
  background: rgba(248, 113, 113, 0.08);
}
.word-editor-root.dark-mode .ProseMirror span.track-format {
  text-decoration-color: #60a5fa;
}

/* ══════════════════════════════════════════════════
   페이지 번호 / 날짜 필드 노드
   ══════════════════════════════════════════════════ */
.ProseMirror .page-number-field,
.ProseMirror .date-field {
  background: #e8f0fe;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: inherit;
  color: #444;
  cursor: default;
  user-select: none;
  display: inline;
}
.ProseMirror .page-number-field:hover,
.ProseMirror .date-field:hover {
  background: #d0e1fd;
}

/* 책갈피 표시 */
.ProseMirror span.bookmark-anchor {
  display: inline;
  width: 0;
  height: 0;
  position: relative;
}
.ProseMirror span.bookmark-anchor::before {
  content: "⚑";
  font-size: 10px;
  color: #888;
  position: relative;
  top: -2px;
}

/* ══════════════════════════════════════════════════
   그리기 캔버스 오버레이
   ══════════════════════════════════════════════════ */
.drawing-canvas-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  cursor: crosshair;
}
.drawing-canvas-overlay svg {
  width: 100%;
  height: 100%;
}

/* ══════════════════════════════════════════════════
   커스텀 스크롤바 (Word 365 스타일)
   ══════════════════════════════════════════════════ */
.editor-canvas-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}
.editor-canvas-scroll::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.editor-canvas-scroll::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 6px;
  border: 3px solid #f1f1f1;
}
.editor-canvas-scroll::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
.word-editor-root.dark-mode .editor-canvas-scroll::-webkit-scrollbar-track {
  background: #2d2d2d;
}
.word-editor-root.dark-mode .editor-canvas-scroll::-webkit-scrollbar-thumb {
  background: #555;
  border-color: #2d2d2d;
}

/* ══════════════════════════════════════════════════
   향상된 리본 그룹 라벨
   ══════════════════════════════════════════════════ */
.ribbon-group-label {
  font-size: 9px;
  color: var(--ribbon-label, #888);
  text-align: center;
  padding-top: 2px;
  user-select: none;
  white-space: nowrap;
  font-family: 'Segoe UI', '맑은 고딕', sans-serif;
}

/* ══════════════════════════════════════════════════
   향상된 테이블 스타일
   ══════════════════════════════════════════════════ */
.ProseMirror table.resize-cursor {
  cursor: col-resize;
}
.ProseMirror .selectedCell::after {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(59, 130, 246, 0.08);
  pointer-events: none;
  z-index: 2;
}

/* ══════════════════════════════════════════════════
   인쇄 미리보기 오버레이
   ══════════════════════════════════════════════════ */
.print-preview-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: #f3f3f3;
  z-index: 5000;
  display: flex;
  flex-direction: column;
}
.print-preview-toolbar {
  height: 48px;
  background: #fff;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
  flex-shrink: 0;
}
.print-preview-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  padding: 24px;
  background: #e8e8e8;
}

/* ══════════════════════════════════════════════════
   Bookmark Anchor
   ══════════════════════════════════════════════════ */

.ProseMirror .bookmark-anchor {
  display: inline;
  position: relative;
  border-left: 2px solid #f59e0b;
  margin: 0 1px;
}
.ProseMirror .bookmark-anchor::before {
  content: "⚑";
  font-size: 8px;
  color: #f59e0b;
  position: absolute;
  top: -8px;
  left: -4px;
}

/* ══════════════════════════════════════════════════
   Drop Cap (첫 글자 장식)
   ══════════════════════════════════════════════════ */

.ProseMirror p[data-drop-cap="dropped"]::first-letter {
  float: left;
  font-size: 3.5em;
  line-height: 0.8;
  padding: 4px 8px 0 0;
  font-weight: 700;
  color: #1e3a5f;
}
.ProseMirror p[data-drop-cap="in-margin"]::first-letter {
  float: left;
  font-size: 3.5em;
  line-height: 0.8;
  padding: 4px 8px 0 0;
  margin-left: -40px;
  font-weight: 700;
  color: #1e3a5f;
}

/* ══════════════════════════════════════════════════
   Track Changes (변경 내용 추적)
   ══════════════════════════════════════════════════ */

.ProseMirror .track-insert {
  background-color: rgba(34, 197, 94, 0.15);
  border-bottom: 2px solid #22c55e;
  text-decoration: none;
}
.ProseMirror .track-delete {
  background-color: rgba(239, 68, 68, 0.15);
  text-decoration: line-through;
  color: #ef4444;
}
.ProseMirror .track-format {
  background-color: rgba(59, 130, 246, 0.1);
  border-bottom: 2px dotted #3b82f6;
}
.track-change-balloon {
  position: absolute;
  right: -240px;
  width: 220px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 11px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}
.track-change-balloon.insert { border-left: 3px solid #22c55e; }
.track-change-balloon.delete { border-left: 3px solid #ef4444; }
.track-change-balloon.format { border-left: 3px solid #3b82f6; }

/* ══════════════════════════════════════════════════
   Header / Footer Editing Area (머리글/바닥글)
   ══════════════════════════════════════════════════ */

.header-footer-edit-area {
  min-height: 40px;
  padding: 8px 16px;
  border: 1px dashed transparent;
  font-size: 9pt;
  color: #888;
  cursor: text;
  transition: border-color 0.2s;
}
.header-footer-edit-area:hover {
  border-color: #c0c0c0;
}
.header-footer-edit-area:focus-within {
  border-color: #3b82f6;
  outline: none;
}
.header-footer-edit-area.header {
  border-bottom: 1px solid #e5e5e5;
  margin-bottom: 8px;
}
.header-footer-edit-area.footer {
  border-top: 1px solid #e5e5e5;
  margin-top: 8px;
}
.header-footer-label {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 8px;
  color: #bbb;
  background: #fff;
  padding: 0 8px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* ══════════════════════════════════════════════════
   Status Bar (상태 표시줄)
   ══════════════════════════════════════════════════ */

.editor-status-bar {
  display: flex;
  align-items: center;
  height: 24px;
  padding: 0 12px;
  background: var(--ribbon-bg, #f3f3f3);
  border-top: 1px solid var(--ribbon-sep, #d1d5db);
  font-size: 11px;
  color: var(--ribbon-fg, #666);
  gap: 16px;
  flex-shrink: 0;
  user-select: none;
}
.editor-status-bar .status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: default;
}
.editor-status-bar .status-item.clickable {
  cursor: pointer;
}
.editor-status-bar .status-item.clickable:hover {
  color: #185ABD;
}
.editor-status-bar .status-sep {
  width: 1px;
  height: 14px;
  background: var(--ribbon-sep, #d1d5db);
}
.editor-status-bar .zoom-slider {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}
.editor-status-bar .zoom-slider input[type="range"] {
  width: 100px;
  height: 4px;
  accent-color: #185ABD;
  cursor: pointer;
}

/* ══════════════════════════════════════════════════
   Table Style Variants (표 스타일)
   ══════════════════════════════════════════════════ */

.ProseMirror table.table-style-elegant th { background: #1e3a5f; color: #fff; }
.ProseMirror table.table-style-elegant tr:nth-child(even) td { background: #f8fafc; }
.ProseMirror table.table-style-grid-blue th { background: #2563eb; color: #fff; }
.ProseMirror table.table-style-grid-blue td { border-color: #93c5fd; }
.ProseMirror table.table-style-grid-blue tr:nth-child(even) td { background: #eff6ff; }

/* ══════════════════════════════════════════════════
   Paragraph Borders / Shading (단락 테두리/음영)
   ══════════════════════════════════════════════════ */

.ProseMirror p[data-border], .ProseMirror p[data-shading] {
  padding: 8px 12px;
  margin: 6px 0;
  border-radius: 2px;
}

/* ══════════════════════════════════════════════════
   Reading Mode (읽기 모드)
   ══════════════════════════════════════════════════ */

.editor-reading-mode .ProseMirror {
  max-width: 700px;
  margin: 0 auto;
  font-size: 12pt;
  line-height: 2;
}
.editor-reading-mode .editor-page-area {
  box-shadow: none;
  border: none;
}

/* ══════════════════════════════════════════════════
   Outline View (개요 보기)
   ══════════════════════════════════════════════════ */

.editor-outline-mode .ProseMirror p:not(h1):not(h2):not(h3):not(h4) {
  display: none;
}
.editor-outline-mode .ProseMirror h1,
.editor-outline-mode .ProseMirror h2,
.editor-outline-mode .ProseMirror h3,
.editor-outline-mode .ProseMirror h4 {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 3px;
}
.editor-outline-mode .ProseMirror h1:hover,
.editor-outline-mode .ProseMirror h2:hover,
.editor-outline-mode .ProseMirror h3:hover,
.editor-outline-mode .ProseMirror h4:hover {
  background: #eff6ff;
}

/* ══════════════════════════════════════════════════
   Dark Mode — New Feature Overrides
   ══════════════════════════════════════════════════ */

/* 페이지/구역/단 나누기 다크모드 */
.word-editor-root.dark-mode .ProseMirror .page-break {
  border-top-color: #555;
}
.word-editor-root.dark-mode .ProseMirror .page-break::after {
  background: #2d2d2d;
  color: #777;
}
.word-editor-root.dark-mode .ProseMirror .section-break {
  border-top-color: #555;
}
.word-editor-root.dark-mode .ProseMirror .section-break::after {
  background: #2d2d2d;
  color: #777;
}
.word-editor-root.dark-mode .ProseMirror .column-break {
  border-top-color: #444;
}
.word-editor-root.dark-mode .ProseMirror .column-break::after {
  background: #2d2d2d;
  color: #666;
}

/* 북마크 다크모드 */
.word-editor-root.dark-mode .ProseMirror .bookmark-anchor {
  border-left-color: #d97706;
}
.word-editor-root.dark-mode .ProseMirror .bookmark-anchor::before {
  color: #d97706;
}

/* 드롭캡 다크모드 */
.word-editor-root.dark-mode .ProseMirror p[data-drop-cap="dropped"]::first-letter,
.word-editor-root.dark-mode .ProseMirror p[data-drop-cap="in-margin"]::first-letter {
  color: #6ba3f7;
}

/* 변경 내용 추적 다크모드 */
.word-editor-root.dark-mode .ProseMirror .track-insert {
  background-color: rgba(34, 197, 94, 0.2);
  border-bottom-color: #4ade80;
}
.word-editor-root.dark-mode .ProseMirror .track-delete {
  background-color: rgba(239, 68, 68, 0.2);
  color: #f87171;
}
.word-editor-root.dark-mode .ProseMirror .track-format {
  background-color: rgba(59, 130, 246, 0.15);
  border-bottom-color: #60a5fa;
}
.word-editor-root.dark-mode .track-change-balloon {
  background: #333;
  border-color: #555;
  color: #e0e0e0;
}

/* 머리글/바닥글 다크모드 */
.word-editor-root.dark-mode .header-footer-edit-area {
  color: #999;
}
.word-editor-root.dark-mode .header-footer-edit-area:hover {
  border-color: #555;
}
.word-editor-root.dark-mode .header-footer-edit-area:focus-within {
  border-color: #5b7bb8;
}
.word-editor-root.dark-mode .header-footer-edit-area.header {
  border-bottom-color: #444;
}
.word-editor-root.dark-mode .header-footer-edit-area.footer {
  border-top-color: #444;
}
.word-editor-root.dark-mode .header-footer-label {
  background: #2d2d2d;
  color: #666;
}

/* 상태 표시줄 다크모드 (CSS 변수로 자동 적용됨, 추가 오버라이드) */
.word-editor-root.dark-mode .editor-status-bar .status-item.clickable:hover {
  color: #6ba3f7;
}

/* 표 스타일 다크모드 */
.word-editor-root.dark-mode .ProseMirror table.table-style-elegant th { background: #1a2e4a; }
.word-editor-root.dark-mode .ProseMirror table.table-style-elegant tr:nth-child(even) td { background: #2a2a2a; }
.word-editor-root.dark-mode .ProseMirror table.table-style-grid-blue th { background: #1d4ed8; }
.word-editor-root.dark-mode .ProseMirror table.table-style-grid-blue td { border-color: #3b5998; }
.word-editor-root.dark-mode .ProseMirror table.table-style-grid-blue tr:nth-child(even) td { background: #1e2a3a; }

/* 단락 테두리/음영 다크모드 */
.word-editor-root.dark-mode .ProseMirror p[data-border],
.word-editor-root.dark-mode .ProseMirror p[data-shading] {
  border-color: #555;
}

/* 읽기 모드 다크모드 */
.word-editor-root.dark-mode .editor-reading-mode .editor-page-area {
  box-shadow: none;
  border: none;
}

/* 개요 보기 다크모드 */
.word-editor-root.dark-mode .editor-outline-mode .ProseMirror h1:hover,
.word-editor-root.dark-mode .editor-outline-mode .ProseMirror h2:hover,
.word-editor-root.dark-mode .editor-outline-mode .ProseMirror h3:hover,
.word-editor-root.dark-mode .editor-outline-mode .ProseMirror h4:hover {
  background: #2a2a3a;
}

/* Print: 새 요소 인쇄 처리 */
@media print {
  .ProseMirror .page-break { border-top: none !important; }
  .ProseMirror .page-break::after { display: none; }
  .ProseMirror .section-break { border-top: none !important; }
  .ProseMirror .section-break::after { display: none; }
  .ProseMirror .column-break { border-top: none !important; }
  .ProseMirror .column-break::after { display: none; }
  .ProseMirror .bookmark-anchor { border-left: none !important; }
  .ProseMirror .bookmark-anchor::before { display: none; }
  .track-change-balloon { display: none !important; }
  .editor-status-bar { display: none !important; }
  .header-footer-label { display: none !important; }
}
`;
