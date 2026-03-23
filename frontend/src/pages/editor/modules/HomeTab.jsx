/**
 * Home Tab - 홈 리본 탭 (lucide-react 아이콘 적용)
 */
import { useState, useEffect, useRef } from "react";
import {
  ClipboardPaste, Scissors, Copy, Paintbrush,
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Subscript, Superscript, Eraser, CaseSensitive,
  AArrowUp, AArrowDown, Highlighter, Baseline,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, ListChecks, Indent, Outdent,
  ChevronsUpDown, Quote, Pilcrow,
  Search, Replace, MousePointerClick,
  ChevronLeft, ChevronRight, ChevronDown,
} from "lucide-react";
import { RibbonBtn, RibbonBtnLarge, GroupSep, RibbonGroup, DropdownButton, ColorGrid } from "./RibbonParts";
import { FONT_LIST, FONT_SIZES, LINE_SPACINGS, STYLE_PRESETS, HIGHLIGHT_COLORS, TEXT_COLORS, PARAGRAPH_SHADING_COLORS, TEXT_EFFECTS } from "./constants";

const ICON_SIZE = 13; // icon size for inline
const ICON_SIZE_SMALL = 11; // icon size small

export function HomeTab({ editor, onShowFind, onShowReplace, onOpenFontDialog, onOpenParagraphDialog, onOpenBorderDialog }) {
  const [formatPainting, setFormatPainting] = useState(false);
  const formatMarksRef = useRef(null);
  const styleGalleryRef = useRef(null);
  const [recentHighlights, setRecentHighlights] = useState([]);
  const [recentTextColors, setRecentTextColors] = useState([]);

  /* ── Format Painter ── */
  const handleFormatPaint = () => {
    if (!editor) return;
    if (formatPainting) { setFormatPainting(false); formatMarksRef.current = null; return; }
    const marks = {};
    if (editor.isActive("bold")) marks.bold = true;
    if (editor.isActive("italic")) marks.italic = true;
    if (editor.isActive("underline")) marks.underline = true;
    if (editor.isActive("strike")) marks.strike = true;
    if (editor.isActive("subscript")) marks.subscript = true;
    if (editor.isActive("superscript")) marks.superscript = true;
    if (editor.isActive("highlight")) marks.highlight = editor.getAttributes("highlight").color || "#fef3b5";
    const tc = editor.getAttributes("textStyle").color;
    if (tc) marks.color = tc;
    const fs = editor.getAttributes("textStyle").fontSize;
    if (fs) marks.fontSize = fs;
    const ff = editor.getAttributes("textStyle").fontFamily;
    if (ff) marks.fontFamily = ff;
    formatMarksRef.current = marks;
    setFormatPainting(true);
  };

  useEffect(() => {
    if (!editor || !formatPainting) return;
    const handleClick = () => {
      const marks = formatMarksRef.current;
      if (!marks || editor.state.selection.empty) return;
      let chain = editor.chain().focus().unsetAllMarks();
      if (marks.bold) chain = chain.setBold();
      if (marks.italic) chain = chain.setItalic();
      if (marks.underline) chain = chain.setUnderline();
      if (marks.strike) chain = chain.setStrike();
      if (marks.subscript) chain = chain.setSubscript();
      if (marks.superscript) chain = chain.setSuperscript();
      if (marks.highlight) chain = chain.setHighlight({ color: marks.highlight });
      if (marks.color) chain = chain.setColor(marks.color);
      if (marks.fontSize) chain = chain.setFontSize(marks.fontSize);
      if (marks.fontFamily) chain = chain.setFontFamily(marks.fontFamily);
      chain.run();
      setFormatPainting(false);
      formatMarksRef.current = null;
    };
    const dom = editor.view.dom;
    dom.addEventListener("mouseup", handleClick);
    return () => dom.removeEventListener("mouseup", handleClick);
  }, [editor, formatPainting]);

  if (!editor) return null;

  // Safe wrappers — prevent crash when marks (e.g. comment) interfere with isActive/getAttributes
  const safeIsActive = (...args) => { try { return editor.isActive(...args); } catch { return false; } };
  const safeGetAttr = (name) => { try { return editor.getAttributes(name); } catch { return {}; } };

  const getCurrentFont = () => {
    const ff = safeGetAttr("textStyle").fontFamily;
    if (!ff) return "malgun";
    const found = FONT_LIST.find(f => ff.includes(f.label) || ff.includes(f.family.split(",")[0].replace(/'/g, "")));
    return found?.value || "malgun";
  };

  const getCurrentSize = () => {
    const fs = safeGetAttr("textStyle").fontSize;
    if (!fs) return "11";
    return fs.replace("pt", "").replace("px", "");
  };

  const handleFontChange = (val) => {
    const font = FONT_LIST.find(f => f.value === val);
    if (font) editor.chain().focus().setFontFamily(font.family).run();
  };

  const handleSizeChange = (val) => editor.chain().focus().setFontSize(val + "pt").run();

  const changeSizeStep = (dir) => {
    const cur = parseFloat(getCurrentSize()) || 11;
    let next;
    if (dir > 0) next = FONT_SIZES.find(s => s > cur) || FONT_SIZES[FONT_SIZES.length - 1];
    else next = [...FONT_SIZES].reverse().find(s => s < cur) || FONT_SIZES[0];
    handleSizeChange(String(next));
  };

  const handleCaseChange = () => {
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const text = editor.state.doc.textBetween(from, to);
    let result;
    if (text === text.toLowerCase()) result = text.toUpperCase();
    else if (text === text.toUpperCase()) result = text.replace(/\b\w/g, c => c.toUpperCase()).replace(/\B\w/g, c => c.toLowerCase());
    else result = text.toLowerCase();
    editor.chain().focus().insertContentAt({ from, to }, result).run();
  };

  const currentHeading = safeIsActive("heading", { level: 1 }) ? "1"
    : safeIsActive("heading", { level: 2 }) ? "2"
    : safeIsActive("heading", { level: 3 }) ? "3"
    : safeIsActive("heading", { level: 4 }) ? "4" : "0";

  const applyStyle = (preset) => {
    if (preset.tag === "blockquote") editor.chain().focus().toggleBlockquote().run();
    else if (preset.tag.startsWith("h")) editor.chain().focus().toggleHeading({ level: parseInt(preset.tag[1]) }).run();
    else editor.chain().focus().setParagraph().run();
  };

  const [lastHighlight, setLastHighlight] = useState("#fef3b5");
  const [lastTextColor, setLastTextColor] = useState("#c00");

  const addRecentHighlight = (c) => {
    setRecentHighlights(prev => [c, ...prev.filter(x => x !== c)].slice(0, 10));
    setLastHighlight(c);
  };

  const addRecentTextColor = (c) => {
    setRecentTextColors(prev => [c, ...prev.filter(x => x !== c)].slice(0, 10));
    setLastTextColor(c);
  };

  return (
    <div style={{
      display: "flex", alignItems: "stretch",
      background: "var(--ribbon-bg, #fff)", borderBottom: "1px solid var(--ribbon-sep, #d1d5db)",
      flexShrink: 0, minHeight: 84, padding: "0 2px", overflowX: "auto",
    }}>
      {/* ── 클립보드 ── */}
      <RibbonGroup label="클립보드">
        <div style={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
          <RibbonBtnLarge icon={<ClipboardPaste size={18} />} label="붙여넣기"
            onClick={() => navigator.clipboard.readText().then(t => editor.chain().focus().insertContent(t).run()).catch(() => {})}
            title="붙여넣기 (Ctrl+V)" split
            onDropdown={() => navigator.clipboard.readText().then(t => editor.chain().focus().insertContent(t).run()).catch(() => {})}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <RibbonBtn onClick={() => {
              const sel = editor.state.selection;
              if (sel.empty) return;
              const text = editor.state.doc.textBetween(sel.from, sel.to, "\n");
              navigator.clipboard.writeText(text).then(() => {
                editor.chain().focus().deleteSelection().run();
              }).catch(() => document.execCommand("cut"));
            }} title="잘라내기 (Ctrl+X)" small>
              <Scissors size={ICON_SIZE_SMALL} /> <span style={{ fontSize: 10 }}>잘라내기</span>
            </RibbonBtn>
            <RibbonBtn onClick={() => {
              const sel = editor.state.selection;
              if (sel.empty) return;
              const text = editor.state.doc.textBetween(sel.from, sel.to, "\n");
              navigator.clipboard.writeText(text).catch(() => document.execCommand("copy"));
            }} title="복사 (Ctrl+C)" small>
              <Copy size={ICON_SIZE_SMALL} /> <span style={{ fontSize: 10 }}>복사</span>
            </RibbonBtn>
            <RibbonBtn active={formatPainting} onClick={handleFormatPaint} title="서식 복사 (더블클릭: 연속)" small>
              <Paintbrush size={ICON_SIZE_SMALL} /> <span style={{ fontSize: 10 }}>서식복사</span>
            </RibbonBtn>
          </div>
        </div>
      </RibbonGroup>

      <GroupSep />

      {/* ── 글꼴 ── */}
      <RibbonGroup label="글꼴" dialogLauncher={onOpenFontDialog}>
        {/* Row 1: Font family + size */}
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          {/* Font family with preview */}
          <select value={getCurrentFont()} onChange={(e) => handleFontChange(e.target.value)} title="글꼴"
            style={{
              height: 24, width: 130, padding: "0 4px", background: "var(--ribbon-input-bg, #fff)",
              border: "1px solid var(--ribbon-input-border, #c0c0c0)", borderRadius: 2, fontSize: 12,
              cursor: "pointer", color: "var(--ribbon-fg, #333)",
            }}>
            {FONT_LIST.map((f) => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.family, fontSize: 13 }}>{f.label}</option>
            ))}
          </select>

          <select value={getCurrentSize()} onChange={(e) => handleSizeChange(e.target.value)} title="글꼴 크기"
            style={{
              height: 24, width: 46, padding: "0 2px", background: "var(--ribbon-input-bg, #fff)",
              border: "1px solid var(--ribbon-input-border, #c0c0c0)", borderRadius: 2, fontSize: 12,
              cursor: "pointer", color: "var(--ribbon-fg, #333)",
            }}>
            {FONT_SIZES.map(s => <option key={s} value={String(s)}>{s}</option>)}
          </select>

          <RibbonBtn onClick={() => changeSizeStep(1)} title="글꼴 크기 증가 (Ctrl+Shift+>)" small>
            <AArrowUp size={ICON_SIZE_SMALL} />
          </RibbonBtn>
          <RibbonBtn onClick={() => changeSizeStep(-1)} title="글꼴 크기 감소 (Ctrl+Shift+<)" small>
            <AArrowDown size={ICON_SIZE_SMALL} />
          </RibbonBtn>
          <RibbonBtn onClick={handleCaseChange} title="대/소문자 변경" small>
            <CaseSensitive size={ICON_SIZE_SMALL} />
          </RibbonBtn>
          <RibbonBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="서식 지우기" small>
            <Eraser size={ICON_SIZE_SMALL} />
          </RibbonBtn>
        </div>
        {/* Row 2: Inline formatting */}
        <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
          <RibbonBtn active={safeIsActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="굵게 (Ctrl+B)" small>
            <Bold size={ICON_SIZE} strokeWidth={3} />
          </RibbonBtn>
          <RibbonBtn active={safeIsActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="기울임 (Ctrl+I)" small>
            <Italic size={ICON_SIZE} />
          </RibbonBtn>
          <RibbonBtn active={safeIsActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="밑줄 (Ctrl+U)" small>
            <UnderlineIcon size={ICON_SIZE} />
          </RibbonBtn>
          <RibbonBtn active={safeIsActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="취소선" small>
            <Strikethrough size={ICON_SIZE} />
          </RibbonBtn>
          <RibbonBtn active={safeIsActive("subscript")} onClick={() => editor.chain().focus().toggleSubscript().run()} title="아래 첨자" small>
            <Subscript size={ICON_SIZE_SMALL} />
          </RibbonBtn>
          <RibbonBtn active={safeIsActive("superscript")} onClick={() => editor.chain().focus().toggleSuperscript().run()} title="위 첨자" small>
            <Superscript size={ICON_SIZE_SMALL} />
          </RibbonBtn>

          <span style={{ display: "inline-block", width: 6 }} />

          {/* Highlight with dropdown */}
          <DropdownButton trigger={
            <div style={{ display: "flex", alignItems: "center" }}>
              <RibbonBtn active={safeIsActive("highlight")}
                onClick={() => editor.chain().focus().toggleHighlight({ color: lastHighlight }).run()}
                title="텍스트 강조" small>
                <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                  <Highlighter size={ICON_SIZE_SMALL} />
                  <span style={{ width: 14, height: 3, background: lastHighlight, borderRadius: 1 }} />
                </span>
              </RibbonBtn>
              <span style={{ fontSize: 7, cursor: "pointer", color: "var(--ribbon-fg, #666)" }}>▼</span>
            </div>
          }>
            <div style={{ padding: 8, width: 180 }}>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>강조 색</div>
              <ColorGrid colors={HIGHLIGHT_COLORS} value={lastHighlight} recentColors={recentHighlights}
                onChange={(c) => { addRecentHighlight(c); editor.chain().focus().toggleHighlight({ color: c }).run(); }} columns={5} />
              <button className="word-dropdown-item" style={{ marginTop: 6, width: "100%" }}
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); }}>
                강조 없음
              </button>
            </div>
          </DropdownButton>

          {/* Font color with dropdown */}
          <DropdownButton trigger={
            <div style={{ display: "flex", alignItems: "center" }}>
              <RibbonBtn title="글꼴 색" onClick={() => editor.chain().focus().setColor(lastTextColor).run()} small>
                <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                  <Baseline size={ICON_SIZE} color={lastTextColor} strokeWidth={2.5} />
                  <span style={{ width: 14, height: 3, background: lastTextColor, borderRadius: 1, marginTop: -2 }} />
                </span>
              </RibbonBtn>
              <span style={{ fontSize: 7, cursor: "pointer", color: "var(--ribbon-fg, #666)" }}>▼</span>
            </div>
          }>
            <div style={{ padding: 8, width: 200 }}>
              <div style={{ fontSize: 11, color: "#555", marginBottom: 6 }}>글꼴 색</div>
              <ColorGrid colors={TEXT_COLORS} value={lastTextColor} recentColors={recentTextColors}
                onChange={(c) => { addRecentTextColor(c); editor.chain().focus().setColor(c).run(); }} columns={10} />
              <button className="word-dropdown-item" style={{ marginTop: 6, width: "100%" }}
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); }}>
                자동 (검정)
              </button>
            </div>
          </DropdownButton>
        </div>
      </RibbonGroup>

      <GroupSep />

      {/* ── 단락 ── */}
      <RibbonGroup label="단락" dialogLauncher={onOpenParagraphDialog}>
        <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
          <DropdownButton trigger={
            <RibbonBtn active={safeIsActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="글머리 기호" small>
              <List size={ICON_SIZE_SMALL} />
            </RibbonBtn>
          }>
            <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}>● 원형</button>
            <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }}>■ 사각형</button>
          </DropdownButton>

          <DropdownButton trigger={
            <RibbonBtn active={safeIsActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="번호 매기기" small>
              <ListOrdered size={ICON_SIZE_SMALL} />
            </RibbonBtn>
          }>
            <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }}>1. 2. 3.</button>
          </DropdownButton>

          <RibbonBtn active={safeIsActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()} title="체크리스트" small>
            <ListChecks size={ICON_SIZE_SMALL} />
          </RibbonBtn>

          <span style={{ display: "inline-block", width: 3 }} />
          <RibbonBtn onClick={() => editor.chain().focus().decreaseIndent().run()} title="내어쓰기 (Shift+Tab)" small>
            <Outdent size={ICON_SIZE_SMALL} />
          </RibbonBtn>
          <RibbonBtn onClick={() => editor.chain().focus().increaseIndent().run()} title="들여쓰기 (Tab)" small>
            <Indent size={ICON_SIZE_SMALL} />
          </RibbonBtn>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
          <RibbonBtn active={safeIsActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="왼쪽 맞춤" small>
            <AlignLeft size={ICON_SIZE_SMALL} />
          </RibbonBtn>
          <RibbonBtn active={safeIsActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="가운데 맞춤" small>
            <AlignCenter size={ICON_SIZE_SMALL} />
          </RibbonBtn>
          <RibbonBtn active={safeIsActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="오른쪽 맞춤" small>
            <AlignRight size={ICON_SIZE_SMALL} />
          </RibbonBtn>
          <RibbonBtn active={safeIsActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="양쪽 맞춤" small>
            <AlignJustify size={ICON_SIZE_SMALL} />
          </RibbonBtn>

          <span style={{ display: "inline-block", width: 3 }} />

          <DropdownButton trigger={
            <RibbonBtn title="줄 간격" small>
              <ChevronsUpDown size={ICON_SIZE_SMALL} />
            </RibbonBtn>
          }>
            <div style={{ padding: 4 }}>
              <div style={{ fontSize: 10, color: "#888", padding: "4px 8px" }}>줄 간격</div>
              {LINE_SPACINGS.map(s => (
                <button key={s.value} className="word-dropdown-item"
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setLineSpacing(s.value).run(); }}>
                  {s.label}
                </button>
              ))}
              <div style={{ borderTop: "1px solid #eee", margin: "4px 0" }} />
              <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setSpacingBefore("12pt").run(); }}>단락 앞 간격 추가</button>
              <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setSpacingAfter("12pt").run(); }}>단락 뒤 간격 추가</button>
            </div>
          </DropdownButton>

          <RibbonBtn onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={safeIsActive("blockquote")} title="인용" small>
            <Quote size={ICON_SIZE_SMALL} />
          </RibbonBtn>

          {/* 테두리 및 음영 */}
          <DropdownButton trigger={
            <RibbonBtn title="테두리 및 음영" small>
              <span style={{ fontSize: 10 }}>▦</span>
            </RibbonBtn>
          }>
            <div style={{ padding: 4, minWidth: 180 }}>
              <div style={{ fontSize: 10, color: "#888", padding: "4px 8px", fontWeight: 600 }}>테두리</div>
              {[
                { label: "바깥쪽 테두리", sides: { top: true, bottom: true, left: true, right: true } },
                { label: "위쪽 테두리만", sides: { top: true, bottom: false, left: false, right: false } },
                { label: "아래쪽 테두리만", sides: { top: false, bottom: true, left: false, right: false } },
                { label: "테두리 없음", sides: null },
              ].map(opt => (
                <button key={opt.label} className="word-dropdown-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (!opt.sides) {
                      editor.chain().focus().unsetParagraphBorder().run();
                    } else {
                      const val = "1px solid #333";
                      editor.chain().focus().setParagraphBorder({
                        borderTop: opt.sides.top ? val : "none",
                        borderBottom: opt.sides.bottom ? val : "none",
                        borderLeft: opt.sides.left ? val : "none",
                        borderRight: opt.sides.right ? val : "none",
                      }).run();
                    }
                  }}>
                  {opt.label}
                </button>
              ))}
              <div style={{ borderTop: "1px solid #eee", margin: "4px 0" }} />
              <div style={{ fontSize: 10, color: "#888", padding: "4px 8px", fontWeight: 600 }}>음영</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 24px)", gap: 2, padding: "2px 8px" }}>
                {PARAGRAPH_SHADING_COLORS.slice(0, 10).map(c => (
                  <button key={c} type="button" style={{ width: 24, height: 18, background: c, border: "1px solid #ddd", borderRadius: 2, cursor: "pointer" }}
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setParagraphShading(c).run(); }} />
                ))}
              </div>
              <div style={{ borderTop: "1px solid #eee", margin: "4px 0" }} />
              <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); onOpenBorderDialog?.(); }}>
                테두리 및 음영...
              </button>
            </div>
          </DropdownButton>

          {/* 텍스트 효과 */}
          <DropdownButton trigger={
            <RibbonBtn title="텍스트 효과" small>
              <span style={{ fontSize: 10 }}>✦</span>
            </RibbonBtn>
          }>
            <div style={{ padding: 6, minWidth: 180 }}>
              <div style={{ fontSize: 10, color: "#888", padding: "2px 8px 6px", fontWeight: 600 }}>텍스트 효과</div>
              {TEXT_EFFECTS.map(eff => (
                <button key={eff.id} className="word-dropdown-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (eff.id === "none") {
                      editor.chain().focus().unsetTextShadow().run();
                    } else if (eff.style.textShadow) {
                      editor.chain().focus().setTextShadow(eff.style.textShadow).run();
                    }
                  }}
                  style={{ ...eff.style, fontSize: 12 }}>
                  {eff.label} 가나다 Aa
                </button>
              ))}
            </div>
          </DropdownButton>
        </div>
      </RibbonGroup>

      <GroupSep />

      {/* ── 스타일 갤러리 ── */}
      <RibbonGroup label="스타일">
        <div style={{ display: "flex", alignItems: "center", gap: 2, maxWidth: 360 }}>
          <button type="button" onClick={() => { if (styleGalleryRef.current) styleGalleryRef.current.scrollBy({ left: -200, behavior: "smooth" }); }}
            style={{ border: "1px solid var(--ribbon-sep, #d5d5d5)", background: "var(--ribbon-bg, #f8f8f8)", borderRadius: 2, cursor: "pointer", padding: "6px 2px", color: "var(--ribbon-fg, #888)", flexShrink: 0, display: "flex" }}>
            <ChevronLeft size={10} />
          </button>
          <div ref={styleGalleryRef} style={{ display: "flex", gap: 3, overflow: "hidden", flex: 1 }}>
            {STYLE_PRESETS.map(preset => {
              const isActive = (preset.id === "normal" && currentHeading === "0")
                || (preset.id === "heading1" && currentHeading === "1")
                || (preset.id === "heading2" && currentHeading === "2")
                || (preset.id === "heading3" && currentHeading === "3")
                || (preset.id === "heading4" && currentHeading === "4")
                || (preset.id === "quote" && safeIsActive("blockquote"));
              return (
                <button key={preset.id} type="button" className="word-style-card"
                  onClick={() => applyStyle(preset)}
                  style={{
                    width: 64, height: 54, flexShrink: 0,
                    border: isActive ? "2px solid #3b82f6" : "1px solid var(--ribbon-sep, #c0c0c0)",
                    borderRadius: 3, background: "var(--ribbon-bg, #fff)", cursor: "pointer",
                    padding: "3px 4px 2px", display: "flex", flexDirection: "column",
                    justifyContent: "space-between", overflow: "hidden",
                  }}>
                  <span style={{
                    fontSize: parseInt(preset.fontSize) > 14 ? 12 : 10,
                    color: preset.color, fontWeight: preset.fontWeight,
                    fontStyle: preset.fontStyle || "normal", lineHeight: 1.2,
                    fontFamily: preset.fontFamily, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>가나다Aa</span>
                  <span style={{ fontSize: 8, color: "var(--ribbon-label, #888)" }}>{preset.label}</span>
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => { if (styleGalleryRef.current) styleGalleryRef.current.scrollBy({ left: 200, behavior: "smooth" }); }}
            style={{ border: "1px solid var(--ribbon-sep, #d5d5d5)", background: "var(--ribbon-bg, #f8f8f8)", borderRadius: 2, cursor: "pointer", padding: "6px 2px", color: "var(--ribbon-fg, #888)", flexShrink: 0, display: "flex" }}>
            <ChevronRight size={10} />
          </button>
        </div>
      </RibbonGroup>

      <GroupSep />

      {/* ── 편집 ── */}
      <RibbonGroup label="편집">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn onClick={() => onShowFind?.()} title="찾기 (Ctrl+F)" small>
            <Search size={ICON_SIZE_SMALL} /> <span style={{ fontSize: 10 }}>찾기</span>
          </RibbonBtn>
          <RibbonBtn onClick={() => onShowReplace?.()} title="바꾸기 (Ctrl+H)" small>
            <Replace size={ICON_SIZE_SMALL} /> <span style={{ fontSize: 10 }}>바꾸기</span>
          </RibbonBtn>
          <DropdownButton trigger={
            <RibbonBtn title="선택" small>
              <MousePointerClick size={ICON_SIZE_SMALL} /> <span style={{ fontSize: 10 }}>선택</span>
            </RibbonBtn>
          }>
            <button className="word-dropdown-item"
              onMouseDown={(e) => { e.preventDefault(); editor.commands.focus(); editor.commands.selectAll(); }}>
              모두 선택 (Ctrl+A)
            </button>
          </DropdownButton>
        </div>
      </RibbonGroup>
    </div>
  );
}
