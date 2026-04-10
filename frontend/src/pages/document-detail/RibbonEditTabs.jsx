/**
 * RibbonEditTabs — 그리기, 디자인, 레이아웃 리본 탭
 * 문서 편집/포맷 관련 보조 탭 모음
 */
import I from "./DocDetailIcons";
import { RibbonBtn, RibbonBtnLarge, Sep, RibbonGroup } from "./DocDetailUI";
import { PEN_COLORS } from "./docDetailConstants";
import {
  DRAW_CONVERT_BUTTONS, PAGE_BG_BUTTONS, DESIGN_THEME_CARDS,
  LAYOUT_PAGE_BUTTONS, LAYOUT_ARRANGE_LARGE, LAYOUT_ARRANGE_SMALL,
  getIcon, charIcon,
} from "./toolbarConfig";
import {
  RIBBON_TAB, colGroup, rowGroup,
  FIELD_LABEL, NUMBER_INPUT, LAYOUT_FIELD_ROW,
} from "./toolbarStyles";

/** 미구현 대형 버튼 자동 렌더 */
function renderLargeNotImpl(notImpl, buttons) {
  return buttons.map(({ iconKey, label, notImplLabel }) => (
    <RibbonBtnLarge key={iconKey} icon={getIcon(iconKey)} label={label} onClick={() => notImpl(notImplLabel || label)} />
  ));
}

/** 미구현 소형 버튼 자동 렌더 */
function renderSmallNotImpl(notImpl, buttons) {
  return buttons.map(({ iconKey, label, notImplLabel }) => (
    <RibbonBtn key={iconKey} icon={getIcon(iconKey)} label={label} onClick={() => notImpl(notImplLabel || label)} />
  ));
}

/** 레이아웃 탭 — 숫자 입력 필드 행 */
function LayoutField({ labelText, labelWidth, defaultValue, unit }) {
  return (
    <div style={LAYOUT_FIELD_ROW}>
      <span style={{ ...FIELD_LABEL, width: labelWidth }}>{labelText}</span>
      <input type="number" defaultValue={defaultValue} min={0} style={NUMBER_INPUT} />
      <span style={FIELD_LABEL}>{unit}</span>
    </div>
  );
}

/**
 * 그리기 탭 — 펜, 지우개, 스텐실
 */
export function RibbonDraw({ editor, notImpl }) {
  return (
    <div style={RIBBON_TAB}>
      <RibbonGroup label="도구">
        <RibbonBtnLarge icon={I.eraser} label="지우개" onClick={() => notImpl("지우개")} />
        <div style={colGroup()}>
          <RibbonBtn icon={I.undo} label="실행 취소" onClick={() => editor?.chain().focus().undo().run()} />
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="펜">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, padding: "0 4px" }}>
          {PEN_COLORS.map(c => (
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
        <RibbonBtnLarge icon={charIcon("+", 18)} label="추가(A)" onClick={() => notImpl("펜 추가")} />
        <RibbonBtnLarge icon={I.ruler} label="눈금자" onClick={() => notImpl("눈금자 도구")} />
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="편집">
        <RibbonBtnLarge icon={I.bgFormat} label="배경 서식" onClick={() => notImpl("배경 서식")} />
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="변환">
        {renderLargeNotImpl(notImpl, DRAW_CONVERT_BUTTONS)}
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
}

/**
 * 디자인 탭 — 테마, 문서 서식, 페이지 배경
 */
export function RibbonDesign({ notImpl }) {
  return (
    <div style={RIBBON_TAB}>
      <RibbonGroup label="테마">
        <RibbonBtnLarge icon={I.theme} label="테마" onClick={() => notImpl("테마")} />
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="문서 서식">
        <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "0 4px" }}>
          {DESIGN_THEME_CARDS.map((card, i) => (
            <button key={i} className="word-style-card"
              onClick={() => notImpl(`문서 서식 ${i + 1}`)}
              style={{
                width: 48, height: 52, border: "1px solid #d0d0d0", borderRadius: 2,
                background: card.bg, color: card.fg,
                cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                fontSize: 8, fontWeight: 500, transition: "border-color 0.15s", lineHeight: 1.3,
              }}>
              <span style={{ fontSize: card.showSub ? 9 : 10, fontWeight: 600 }}>제목</span>
              {card.showSub && <span style={{ fontSize: 7, marginTop: 1, color: card.fg === "#fff" ? "#ccc" : "#888" }}>제목 {i + 1}</span>}
            </button>
          ))}
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="">
        <div style={colGroup(1)}>
          <div style={rowGroup(2)}>
            <RibbonBtn icon={<span style={{ fontSize: 14, fontWeight: 700 }}>가</span>} label="색" onClick={() => notImpl("테마 색")} />
            <span style={{ fontSize: 9, color: "#666" }}>색</span>
          </div>
          <div style={rowGroup(2)}>
            <RibbonBtn icon={charIcon("\u{1F524}", 9)} label="글꼴" onClick={() => notImpl("테마 글꼴")} />
            <span style={{ fontSize: 9, color: "#666" }}>글꼴</span>
          </div>
        </div>
        <div style={{ ...colGroup(1), marginLeft: 4 }}>
          <div style={rowGroup(2)}>
            <RibbonBtn icon={I.effect} label="효과" onClick={() => notImpl("효과")} />
            <span style={{ fontSize: 9, color: "#666" }}>효과</span>
          </div>
          <div style={rowGroup(2)}>
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
        {renderLargeNotImpl(notImpl, PAGE_BG_BUTTONS)}
      </RibbonGroup>
    </div>
  );
}

/**
 * 레이아웃 탭 — 페이지 설정, 단락, 정렬
 */
export function RibbonLayout({ editor, notImpl }) {
  return (
    <div style={RIBBON_TAB}>
      <RibbonGroup label="페이지 설정">
        {renderLargeNotImpl(notImpl, LAYOUT_PAGE_BUTTONS)}
        <RibbonBtnLarge icon={charIcon("\u{1F4D0}", 16)} label="크기" onClick={() => notImpl("용지 크기")} />
        <div style={colGroup()}>
          <RibbonBtn icon={I.breaks} label="나누기" onClick={() => editor?.chain().focus().setHorizontalRule().run()} />
          <RibbonBtn icon={I.lineNum} label="줄 번호" onClick={() => notImpl("줄 번호")} />
          <RibbonBtn icon={I.hyphen} label="하이픈 넣기" onClick={() => notImpl("하이픈")} />
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="원고지">
        <RibbonBtnLarge icon={charIcon("\u{1F4DD}", 14)} label="원고지 설정" onClick={() => notImpl("원고지 설정")} />
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="단락">
        <div style={colGroup(3)}>
          <div style={{ ...rowGroup(4), ...FIELD_LABEL, color: "#666" }}><span>들여쓰기</span></div>
          <LayoutField labelText="왼쪽:" labelWidth={28} defaultValue={0} unit="글자" />
          <LayoutField labelText="오른쪽:" labelWidth={28} defaultValue={0} unit="글자" />
        </div>
        <div style={{ ...colGroup(3), marginLeft: 8 }}>
          <div style={{ ...rowGroup(4), ...FIELD_LABEL, color: "#666" }}><span>간격</span></div>
          <LayoutField labelText="앞:" labelWidth={14} defaultValue={0} unit="줄" />
          <LayoutField labelText="뒤:" labelWidth={14} defaultValue={4} unit="pt" />
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="정렬">
        {renderLargeNotImpl(notImpl, LAYOUT_ARRANGE_LARGE)}
        <div style={colGroup()}>
          {renderSmallNotImpl(notImpl, LAYOUT_ARRANGE_SMALL)}
        </div>
        <RibbonBtnLarge icon={I.alignObj} label="맞춤" onClick={() => notImpl("맞춤")} />
      </RibbonGroup>
    </div>
  );
}
