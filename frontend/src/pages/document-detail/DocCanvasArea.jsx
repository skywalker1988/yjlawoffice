/**
 * DocCanvasArea — A4 용지 캔버스, 플로팅 서브 툴바, 탐색 창
 * 문서 편집 영역의 시각적 레이아웃 컴포넌트 모음
 */
import { EditorContent } from "@tiptap/react";
import { parseAuthor } from "../../utils/format";
import { FONT_FAMILIES, FONT_SIZES, TEXT_COLORS, HIGHLIGHT_COLORS } from "./docDetailConstants";
import I from "./DocDetailIcons";

/** A4 용지 코너 마커 스타일 */
const CORNER_MARKERS = [
  { top: "0.8em", left: "1.2em", borderTop: "1px solid #bbb", borderLeft: "1px solid #bbb" },
  { top: "0.8em", right: "1.2em", borderTop: "1px solid #bbb", borderRight: "1px solid #bbb" },
  { bottom: "0.8em", left: "1.2em", borderBottom: "1px solid #bbb", borderLeft: "1px solid #bbb" },
  { bottom: "0.8em", right: "1.2em", borderBottom: "1px solid #bbb", borderRight: "1px solid #bbb" },
];

/**
 * A4 용지 캔버스 — 제목, 부제/저자, 요약, TipTap 에디터를 포함
 */
export function A4Page({ doc, title, onTitleChange, editor, zoom, showGridlines }) {
  return (
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
      {/* 코너 마커 */}
      {CORNER_MARKERS.map((s, i) => (
        <div key={i} style={{ position: "absolute", width: 10, height: 10, ...s }} />
      ))}

      {/* 제목 */}
      <input value={title} onChange={onTitleChange}
        style={{
          width: "100%", border: "none", outline: "none",
          fontSize: `${Math.max(16, 20 * zoom)}px`, fontWeight: 600,
          color: "#1a1a1a", lineHeight: 1.4, marginBottom: `${0.8 * zoom}em`,
          fontFamily: "'맑은 고딕', 'Noto Serif KR', Georgia, serif",
          background: "transparent",
        }}
        placeholder="제목을 입력하세요..."
      />

      {/* 부제/저자 */}
      {(doc.subtitle || doc.author) && (
        <div style={{ marginBottom: `${0.8 * zoom}em`, paddingBottom: `${0.4 * zoom}em`, borderBottom: "1px solid #eee" }}>
          {doc.subtitle && <p style={{ fontSize: `${Math.max(11, 12 * zoom)}px`, color: "#888", marginBottom: 3 }}>{doc.subtitle}</p>}
          {doc.author && <p style={{ fontSize: `${Math.max(10, 11 * zoom)}px`, color: "#aaa" }}>{parseAuthor(doc.author)}</p>}
        </div>
      )}

      {/* 요약 */}
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

      {/* TipTap 에디터 */}
      <div style={{ fontSize: `${10 * zoom}pt`, minHeight: `${20 * zoom}em` }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

/**
 * 탐색 창 — 문서 구조 탐색용 사이드 패널
 */
export function NavPane({ title, onClose }) {
  return (
    <div style={{ width: 200, background: "#fff", borderRight: "1px solid #ddd", padding: 12, overflowY: "auto", flexShrink: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600 }}>탐색</span>
        <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 12, color: "#999" }}>&#x2715;</button>
      </div>
      <input placeholder="문서 검색..." style={{ width: "100%", padding: "4px 8px", border: "1px solid #ddd", borderRadius: 3, fontSize: 10, marginBottom: 8, boxSizing: "border-box" }} />
      <div style={{ fontSize: 9, color: "#888" }}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>제목</p>
        <p style={{ padding: "2px 0", cursor: "pointer", color: "#2b579a" }}>{title || "문서 제목"}</p>
      </div>
    </div>
  );
}

/**
 * 플로팅 서브 툴바 — 텍스트 선택 시 빠른 서식 도구 모음
 */
export function FloatingSubToolbar({
  editor, currentFont, currentSize, applyFontFamily, applyFontSize,
  fontColorOpen, setFontColorOpen, applyFontColor,
  highlightColorOpen, setHighlightColorOpen, applyHighlight,
  setLinkModalOpen, insertFootnote,
}) {
  return (
    <div style={{
      flexShrink: 0, display: "flex", alignItems: "center", gap: 2,
      padding: "4px 12px", background: "#fff", borderBottom: "1px solid #d8d8d5",
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

      {/* 서식 버튼 */}
      <button className={`ft-btn ${editor.isActive("bold")?"active":""}`} title="굵게" onMouseDown={e=>{e.preventDefault();editor.chain().focus().toggleBold().run()}}>{I.bold}</button>
      <button className={`ft-btn ${editor.isActive("italic")?"active":""}`} title="기울임" onMouseDown={e=>{e.preventDefault();editor.chain().focus().toggleItalic().run()}}>{I.italic}</button>
      <button className={`ft-btn ${editor.isActive("underline")?"active":""}`} title="밑줄" onMouseDown={e=>{e.preventDefault();editor.chain().focus().toggleUnderline().run()}}>{I.underline}</button>
      <button className={`ft-btn ${editor.isActive("strike")?"active":""}`} title="취소선" onMouseDown={e=>{e.preventDefault();editor.chain().focus().toggleStrike().run()}}>{I.strike}</button>
      <div className="ft-sep"/>

      {/* 글꼴색 */}
      <FloatingColorPicker
        editor={editor} open={fontColorOpen} setOpen={setFontColorOpen}
        onOtherClose={() => setHighlightColorOpen(false)}
        colors={TEXT_COLORS} label="글꼴 색" onSelect={applyFontColor}
        onClear={() => { editor.chain().focus().unsetColor().run(); setFontColorOpen(false); }}
        clearLabel="색 제거"
        trigger={
          <span style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
            <span style={{fontSize:12,fontWeight:700,lineHeight:1}}>A</span>
            <span style={{width:14,height:3,background:"#c00",borderRadius:1}}/>
          </span>
        }
      />

      {/* 형광펜 */}
      <FloatingColorPicker
        editor={editor} open={highlightColorOpen} setOpen={setHighlightColorOpen}
        onOtherClose={() => setFontColorOpen(false)}
        colors={HIGHLIGHT_COLORS} label="형광펜" onSelect={applyHighlight}
        onClear={() => { editor.chain().focus().unsetHighlight().run(); setHighlightColorOpen(false); }}
        clearLabel="형광펜 제거"
        trigger={<span style={{fontSize:10,fontWeight:600,background:"#ff0",padding:"1px 4px",borderRadius:2}}>ab</span>}
      />
      <div className="ft-sep"/>

      {/* 정렬 */}
      <button className={`ft-btn ${editor.isActive({textAlign:"left"})?"active":""}`} title="왼쪽" onMouseDown={e=>{e.preventDefault();editor.chain().focus().setTextAlign("left").run()}}>{I.alignL}</button>
      <button className={`ft-btn ${editor.isActive({textAlign:"center"})?"active":""}`} title="가운데" onMouseDown={e=>{e.preventDefault();editor.chain().focus().setTextAlign("center").run()}}>{I.alignC}</button>
      <button className={`ft-btn ${editor.isActive({textAlign:"right"})?"active":""}`} title="오른쪽" onMouseDown={e=>{e.preventDefault();editor.chain().focus().setTextAlign("right").run()}}>{I.alignR}</button>
      <button className={`ft-btn ${editor.isActive({textAlign:"justify"})?"active":""}`} title="양쪽" onMouseDown={e=>{e.preventDefault();editor.chain().focus().setTextAlign("justify").run()}}>{I.alignJ}</button>
      <div className="ft-sep"/>

      {/* 목록 */}
      <button className={`ft-btn ${editor.isActive("bulletList")?"active":""}`} title="글머리 기호" onMouseDown={e=>{e.preventDefault();editor.chain().focus().toggleBulletList().run()}}>{I.listUl}</button>
      <button className={`ft-btn ${editor.isActive("orderedList")?"active":""}`} title="번호 목록" onMouseDown={e=>{e.preventDefault();editor.chain().focus().toggleOrderedList().run()}}>{I.listOl}</button>
      <div className="ft-sep"/>

      {/* 기타 삽입 */}
      <button className="ft-btn" title="링크" onMouseDown={e=>{e.preventDefault();setLinkModalOpen(true)}}>{I.link}</button>
      <button className="ft-btn" title="각주" onMouseDown={e=>{e.preventDefault();const t=prompt("각주 내용:");if(t)insertFootnote(t)}}>
        <span style={{fontSize:9,fontWeight:700,color:"#2b579a"}}>주</span>
      </button>
      <button className={`ft-btn ${editor.isActive("blockquote")?"active":""}`} title="인용문" onMouseDown={e=>{e.preventDefault();editor.chain().focus().toggleBlockquote().run()}}>{I.quote}</button>
      <button className="ft-btn" title="수평선" onMouseDown={e=>{e.preventDefault();editor.chain().focus().setHorizontalRule().run()}}>{I.hr}</button>
      <button className={`ft-btn ${editor.isActive("codeBlock")?"active":""}`} title="코드 블록" onMouseDown={e=>{e.preventDefault();editor.chain().focus().toggleCodeBlock().run()}}>{I.code}</button>
    </div>
  );
}

/**
 * 플로팅 툴바용 색상 선택기 — 글꼴색/형광펜 공용
 */
function FloatingColorPicker({ editor, open, setOpen, onOtherClose, colors, label, onSelect, onClear, clearLabel, trigger }) {
  return (
    <div style={{position:"relative"}}>
      <button className="ft-btn" title={label} onMouseDown={e=>{e.preventDefault();setOpen(v=>!v);onOtherClose()}}>
        {trigger}
      </button>
      {open && (<>
        <div style={{position:"fixed",inset:0,zIndex:9998}} onClick={()=>setOpen(false)}/>
        <div style={{position:"absolute",top:30,left:0,zIndex:9999,background:"#fff",border:"1px solid #d0d0d0",borderRadius:6,boxShadow:"0 4px 16px rgba(0,0,0,0.18)",padding:8,width:150}}>
          <p style={{fontSize:9,color:"#888",marginBottom:4}}>{label}</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4}}>
            {colors.map(c=>(<button key={c} className="cpick-item" onMouseDown={e=>{e.preventDefault();onSelect(c)}} style={{width:22,height:22,background:c,border:"1px solid #ccc",borderRadius:3,cursor:"pointer",transition:"transform 0.1s"}}/>))}
          </div>
          <button onMouseDown={e=>{e.preventDefault();onClear()}} style={{marginTop:6,fontSize:9,border:"1px solid #ddd",borderRadius:3,padding:"3px 0",background:"#fff",cursor:"pointer",width:"100%"}}>{clearLabel}</button>
        </div>
      </>)}
    </div>
  );
}
