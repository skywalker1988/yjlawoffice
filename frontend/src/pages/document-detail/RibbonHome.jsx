/**
 * RibbonHome — 홈 탭 리본 (클립보드, 글꼴, 단락, 스타일, 편집)
 * 가장 많은 기능을 가진 주요 리본 탭
 */
import I from "./DocDetailIcons";
import { RibbonBtn, RibbonBtnLarge, Sep, SepSmall, RibbonGroup, Dropdown } from "./DocDetailUI";
import {
  FONT_FAMILIES, FONT_SIZES, HEADING_STYLES,
  TEXT_COLORS, HIGHLIGHT_COLORS, LINE_SPACING_OPTIONS,
} from "./docDetailConstants";
import {
  FONT_FORMAT_BUTTONS, PARAGRAPH_LIST_BUTTONS, PARAGRAPH_INDENT_BUTTONS,
  ALIGN_BUTTONS, getIcon, charIcon,
} from "./toolbarConfig";
import {
  RIBBON_TAB, colGroup, rowGroup, SELECT_BASE,
  COLOR_GRID, COLOR_ITEM, COLOR_REMOVE_BTN, EDIT_BTN,
  DROPDOWN_COLOR, DROPDOWN_LABEL,
  STYLE_CARD_BASE, LINE_SPACING_ITEM,
} from "./toolbarStyles";

/** 서식 토글 버튼 렌더 — 설정 배열에서 자동 생성 */
function renderFormatButtons(editor, buttons) {
  return buttons.map(({ iconKey, label, mark, command }) => (
    <RibbonBtn key={iconKey} icon={getIcon(iconKey)} label={label}
      active={editor?.isActive(mark)} onClick={() => editor?.chain().focus()[command]().run()} />
  ));
}

/** 색상 선택 드롭다운 — 글꼴색/형광펜 공용 */
function ColorPickerDropdown({ open, onClose, label, colors, onSelect, onClear, clearLabel, trigger }) {
  return (
    <div style={{ position: "relative" }}>
      {trigger}
      <Dropdown open={open} onClose={onClose} style={DROPDOWN_COLOR}>
        <p style={DROPDOWN_LABEL}>{label}</p>
        <div style={COLOR_GRID}>
          {colors.map(c => (
            <button key={c} className="cpick-item" onClick={() => onSelect(c)} style={{ ...COLOR_ITEM, background: c }} />
          ))}
        </div>
        <button onClick={onClear} style={COLOR_REMOVE_BTN}>{clearLabel}</button>
      </Dropdown>
    </div>
  );
}

/**
 * 홈 탭 — 클립보드, 글꼴, 단락, 스타일, 편집
 */
export function RibbonHome({
  editor, currentFont, currentSize, applyFontFamily, applyFontSize,
  fontColorOpen, setFontColorOpen, applyFontColor,
  highlightColorOpen, setHighlightColorOpen, applyHighlight,
  lineSpacingOpen, setLineSpacingOpen,
  notImpl, setFindOpen,
}) {
  return (
    <div style={RIBBON_TAB}>
      {/* 클립보드 */}
      <RibbonGroup label="클립보드">
        <div style={colGroup(1)}>
          <RibbonBtnLarge icon={I.clipboard} label="붙여넣기" onClick={() => { navigator.clipboard?.readText().then(t => editor?.commands.insertContent(t)).catch(() => notImpl("붙여넣기")); }} />
        </div>
        <div style={colGroup()}>
          <RibbonBtn icon={charIcon("\u2702", 11)} label="잘라내기" onClick={() => document.execCommand("cut")} />
          <RibbonBtn icon={charIcon("\u{1F4CB}", 11)} label="복사" onClick={() => document.execCommand("copy")} />
          <RibbonBtn icon={charIcon("\u{1F58C}", 11)} label="서식 복사" onClick={() => notImpl("서식 복사")} />
        </div>
      </RibbonGroup>
      <Sep />

      {/* 글꼴 */}
      <RibbonGroup label="글꼴">
        <div style={colGroup(2)}>
          <div style={rowGroup(2)}>
            <select value={currentFont} onChange={e => applyFontFamily(e.target.value)}
              style={{ ...SELECT_BASE, width: 100, fontFamily: currentFont }}>
              {FONT_FAMILIES.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
            </select>
            <select value={currentSize} onChange={e => applyFontSize(e.target.value)}
              style={{ ...SELECT_BASE, width: 38, textAlign: "center" }}>
              {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <RibbonBtn icon={<span style={{ fontSize: 12, fontWeight: 700 }}>A</span>} label="글꼴 크기 키우기" onClick={() => { const n = Math.min(72, parseFloat(currentSize) + 1); applyFontSize(String(n)); }} />
            <RibbonBtn icon={<span style={{ fontSize: 9, fontWeight: 700 }}>A</span>} label="글꼴 크기 줄이기" onClick={() => { const n = Math.max(6, parseFloat(currentSize) - 1); applyFontSize(String(n)); }} />
            <RibbonBtn icon={charIcon("Aa")} label="대/소문자 변경" onClick={() => notImpl("대/소문자 변경")} />
          </div>
          <div style={rowGroup(1)}>
            {renderFormatButtons(editor, FONT_FORMAT_BUTTONS)}
            <SepSmall />
            <ColorPickerDropdown open={fontColorOpen} onClose={() => setFontColorOpen(false)}
              label="글꼴 색" colors={TEXT_COLORS} onSelect={applyFontColor}
              onClear={() => { editor?.chain().focus().unsetColor().run(); setFontColorOpen(false); }} clearLabel="색 제거"
              trigger={
                <button onClick={() => setFontColorOpen(!fontColorOpen)} title="글꼴 색" className="word-rb"
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 26, height: 26, border: "none", borderRadius: 2, background: "transparent", cursor: "pointer", padding: "3px 0" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1 }}>A</span>
                  <div style={{ width: 14, height: 3, background: "#c00", borderRadius: 1 }} />
                </button>
              } />
            <ColorPickerDropdown open={highlightColorOpen} onClose={() => setHighlightColorOpen(false)}
              label="형광펜 색" colors={HIGHLIGHT_COLORS} onSelect={applyHighlight}
              onClear={() => { editor?.chain().focus().unsetHighlight().run(); setHighlightColorOpen(false); }} clearLabel="형광펜 제거"
              trigger={
                <button onClick={() => setHighlightColorOpen(!highlightColorOpen)} title="형광펜" className="word-rb"
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 26, height: 26, border: "none", borderRadius: 2, background: "transparent", cursor: "pointer", padding: "4px 0" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, lineHeight: 1, background: "#ff0", padding: "0 3px" }}>ab</span>
                </button>
              } />
          </div>
        </div>
      </RibbonGroup>
      <Sep />

      {/* 단락 */}
      <RibbonGroup label="단락">
        <div style={colGroup(2)}>
          <div style={rowGroup(1)}>
            {PARAGRAPH_LIST_BUTTONS.map(({ iconKey, label, mark, command }) => (
              <RibbonBtn key={iconKey} icon={getIcon(iconKey)} label={label} active={editor?.isActive(mark)} onClick={() => editor?.chain().focus()[command]().run()} />
            ))}
            <SepSmall />
            {PARAGRAPH_INDENT_BUTTONS.map(({ iconKey, label, command, args }) => (
              <RibbonBtn key={iconKey} icon={getIcon(iconKey)} label={label} onClick={() => editor?.chain().focus()[command](...(args || [])).run()} />
            ))}
            <SepSmall />
            <RibbonBtn icon={charIcon("\u00B6")} label="편집 기호 표시/숨기기" onClick={() => notImpl("편집 기호")} />
          </div>
          <div style={rowGroup(1)}>
            {ALIGN_BUTTONS.map(({ iconKey, label, align }) => (
              <RibbonBtn key={iconKey} icon={getIcon(iconKey)} label={label} active={editor?.isActive({ textAlign: align })} onClick={() => editor?.chain().focus().setTextAlign(align).run()} />
            ))}
            <SepSmall />
            <div style={{ position: "relative" }}>
              <RibbonBtn icon={I.lineSpace} label="줄 간격" onClick={() => setLineSpacingOpen(!lineSpacingOpen)} />
              <Dropdown open={lineSpacingOpen} onClose={() => setLineSpacingOpen(false)} style={{ width: 100, padding: 4 }}>
                {LINE_SPACING_OPTIONS.map(sp => (
                  <button key={sp} onClick={() => { notImpl(`줄 간격 ${sp}`); setLineSpacingOpen(false); }} style={LINE_SPACING_ITEM} className="word-rb">{sp}줄</button>
                ))}
              </Dropdown>
            </div>
          </div>
        </div>
      </RibbonGroup>
      <Sep />

      {/* 스타일 */}
      <RibbonGroup label="스타일">
        <div style={rowGroup(3)}>
          {HEADING_STYLES.map(s => (
            <button key={s.label} className="word-style-card"
              onClick={() => {
                if (s.cmd === "paragraph") editor?.chain().focus().setParagraph().run();
                else editor?.chain().focus().toggleHeading({ level: parseInt(s.cmd[1]) }).run();
              }}
              style={{
                ...STYLE_CARD_BASE,
                fontSize: s.cmd === "paragraph" ? 9 : (s.cmd === "h1" ? 12 : s.cmd === "h2" ? 10 : 9),
                fontWeight: s.cmd === "paragraph" ? 400 : 600,
                color: s.cmd === "paragraph" ? "#333" : "#2b579a",
              }}>
              <span style={{ fontFamily: "'맑은 고딕'" }}>가나다Aa</span>
              <span style={{ fontSize: 7, color: "#888", marginTop: 2 }}>{s.label}</span>
            </button>
          ))}
        </div>
      </RibbonGroup>
      <Sep />

      {/* 편집 */}
      <RibbonGroup label="편집">
        <div style={colGroup(1)}>
          <RibbonBtn icon={I.search} label="찾기 (Ctrl+F)" onClick={() => setFindOpen(true)} style={EDIT_BTN} />
          <RibbonBtn icon={I.replace} label="바꾸기 (Ctrl+H)" onClick={() => setFindOpen(true)} style={EDIT_BTN} />
          <RibbonBtn icon={I.select} label="선택" onClick={() => editor?.commands.selectAll()} style={EDIT_BTN} />
        </div>
      </RibbonGroup>
    </div>
  );
}
