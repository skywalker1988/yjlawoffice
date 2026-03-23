/**
 * Insert Tab - lucide-react 아이콘 적용
 */
import { useState } from "react";
import {
  Table2, Image as ImageIcon, Shapes, Link2, Type, Code2,
  Minus, Quote, Hash, FileText, CornerDownRight,
  Omega, ChevronDown,
} from "lucide-react";
import { RibbonBtn, RibbonBtnLarge, GroupSep, RibbonGroup, DropdownButton } from "./RibbonParts";
import { SPECIAL_CHARS } from "./constants";

const IS = 12;

function TableGridSelector({ onSelect }) {
  const [hover, setHover] = useState({ row: 0, col: 0 });
  const R = 8, C = 10;
  return (
    <div style={{ padding: 8 }}>
      <div style={{ fontSize: 11, color: "#555", marginBottom: 6, fontWeight: 500 }}>표 삽입</div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${C}, 18px)`, gap: 1 }}>
        {Array.from({ length: R * C }, (_, i) => {
          const r = Math.floor(i / C), c = i % C;
          const active = r < hover.row && c < hover.col;
          return <div key={i} className={`table-grid-cell${active ? " active" : ""}`}
            onMouseEnter={() => setHover({ row: r + 1, col: c + 1 })} onClick={() => onSelect(hover.row, hover.col)} />;
        })}
      </div>
      <div style={{ fontSize: 10, color: "#888", marginTop: 4, textAlign: "center" }}>
        {hover.row > 0 ? `${hover.row} × ${hover.col} 표` : "셀 위로 마우스를 이동하세요"}
      </div>
    </div>
  );
}

function SpecialCharPicker({ onSelect }) {
  const [category, setCategory] = useState(SPECIAL_CHARS[0].category);
  const chars = SPECIAL_CHARS.find(c => c.category === category)?.chars || [];
  return (
    <div style={{ padding: 8, width: 320 }}>
      <div style={{ fontSize: 11, color: "#555", marginBottom: 6, fontWeight: 500 }}>특수 문자</div>
      <div style={{ display: "flex", gap: 3, marginBottom: 8, flexWrap: "wrap" }}>
        {SPECIAL_CHARS.map(c => (
          <button key={c.category} className="word-dropdown-item"
            onClick={(e) => { e.stopPropagation(); setCategory(c.category); }}
            style={{
              padding: "3px 8px", fontSize: 10, background: category === c.category ? "#dbeafe" : "transparent",
              borderRadius: 3, border: "1px solid #ddd", fontWeight: category === c.category ? 600 : 400,
            }}>{c.category}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2 }}>
        {chars.map((ch, i) => (
          <button key={i} type="button" onClick={(e) => { e.stopPropagation(); onSelect(ch); }}
            style={{
              width: 24, height: 24, border: "1px solid #e0e0e0", borderRadius: 2,
              background: "#fff", cursor: "pointer", fontSize: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.08s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#dbeafe"; e.currentTarget.style.transform = "scale(1.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.transform = "scale(1)"; }}
            title={ch}>{ch}</button>
        ))}
      </div>
    </div>
  );
}

export function InsertTab({ editor, onOpenHyperlinkDialog, onOpenImageDialog }) {
  if (!editor) return null;

  return (
    <div style={{
      display: "flex", alignItems: "stretch", background: "var(--ribbon-bg, #fff)",
      borderBottom: "1px solid var(--ribbon-sep, #d1d5db)", flexShrink: 0, minHeight: 84, padding: "0 2px",
    }}>
      <RibbonGroup label="표">
        <DropdownButton trigger={
          <RibbonBtnLarge icon={<Table2 size={18} />} label="표" title="표 삽입" />
        }>
          <TableGridSelector onSelect={(r, c) => editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run()} />
        </DropdownButton>
      </RibbonGroup>

      <GroupSep />

      <RibbonGroup label="일러스트레이션">
        <div style={{ display: "flex", gap: 4 }}>
          <RibbonBtnLarge icon={<ImageIcon size={18} />} label="그림"
            onClick={() => onOpenImageDialog ? onOpenImageDialog() : (() => { const u = window.prompt("이미지 URL:"); if (u) editor.chain().focus().setImage({ src: u }).run(); })()}
            title="그림 삽입" />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <DropdownButton trigger={
              <RibbonBtn title="도형" small><Shapes size={IS} /> <span style={{ fontSize: 10 }}>도형</span></RibbonBtn>
            }>
              <div style={{ padding: 8 }}>
                <div style={{ fontSize: 11, marginBottom: 4, fontWeight: 500 }}>기본 도형</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 28px)", gap: 2 }}>
                  {["□", "○", "△", "◇", "☆", "♡", "⬠", "⬡", "▬", "▭", "⌒", "⌓"].map((s, i) => (
                    <button key={i} type="button" className="word-dropdown-item"
                      style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, padding: 0 }}
                      onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().insertContent(s).run(); }}>{s}</button>
                  ))}
                </div>
              </div>
            </DropdownButton>
            <RibbonBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선" small>
              <Minus size={IS} /> <span style={{ fontSize: 10 }}>구분선</span>
            </RibbonBtn>
          </div>
        </div>
      </RibbonGroup>

      <GroupSep />

      <RibbonGroup label="머리글/바닥글">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn onClick={() => { const t = window.prompt("머리글:"); if (t) editor.commands.setContent(`<div style="text-align:center;font-size:9pt;color:#999;border-bottom:1px solid #eee;padding-bottom:4px;margin-bottom:12px;">${t}</div>` + editor.getHTML()); }} title="머리글" small>
            <FileText size={IS} /> <span style={{ fontSize: 10 }}>머리글</span>
          </RibbonBtn>
          <RibbonBtn onClick={() => { const t = window.prompt("바닥글:"); if (t) editor.commands.setContent(editor.getHTML() + `<div style="text-align:center;font-size:9pt;color:#999;border-top:1px solid #eee;padding-top:4px;margin-top:12px;">${t}</div>`); }} title="바닥글" small>
            <FileText size={IS} /> <span style={{ fontSize: 10 }}>바닥글</span>
          </RibbonBtn>
          <RibbonBtn onClick={() => editor.chain().focus().insertContent('<p style="text-align:center;font-size:10pt;color:#888;">— # —</p>').run()} title="페이지 번호" small>
            <Hash size={IS} /> <span style={{ fontSize: 10 }}>페이지번호</span>
          </RibbonBtn>
        </div>
      </RibbonGroup>

      <GroupSep />

      <RibbonGroup label="링크">
        <RibbonBtnLarge icon={<Link2 size={18} />} label="링크" active={editor.isActive("link")}
          onClick={() => onOpenHyperlinkDialog ? onOpenHyperlinkDialog() : (() => {
            const prev = editor.getAttributes("link").href || "";
            const url = window.prompt("URL:", prev);
            if (url === null) return;
            if (!url) editor.chain().focus().unsetLink().run();
            else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          })()} title="하이퍼링크 (Ctrl+K)" />
      </RibbonGroup>

      <GroupSep />

      <RibbonGroup label="텍스트">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="인용" small>
            <Quote size={IS} /> <span style={{ fontSize: 10 }}>인용</span>
          </RibbonBtn>
          <RibbonBtn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="코드 블록" small>
            <Code2 size={IS} /> <span style={{ fontSize: 10 }}>코드</span>
          </RibbonBtn>
        </div>
      </RibbonGroup>

      <GroupSep />

      <RibbonGroup label="기호">
        <DropdownButton trigger={
          <RibbonBtnLarge icon={<Omega size={18} />} label="특수문자" title="특수 문자 삽입" />
        }>
          <SpecialCharPicker onSelect={(ch) => editor.chain().focus().insertContent(ch).run()} />
        </DropdownButton>
      </RibbonGroup>
    </div>
  );
}
