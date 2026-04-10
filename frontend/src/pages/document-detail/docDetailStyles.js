/**
 * docDetailStyles — ProseMirror + Word 리본 에디터 CSS
 * EDITOR_CSS를 문자열로 내보내어 <style> 태그에 주입
 */

export const EDITOR_CSS = `
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
