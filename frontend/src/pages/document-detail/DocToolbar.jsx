/**
 * DocToolbar — Word 리본 탭 컴포넌트 모음 (탭 라우터)
 * 각 탭은 별도 파일에서 구현되며, 이 파일은 삽입 탭 + 모든 탭 재내보내기 담당
 */
import I from "./DocDetailIcons";
import { RibbonBtn, RibbonBtnLarge, Sep, RibbonGroup } from "./DocDetailUI";
import {
  ILLUSTRATION_BUTTONS, HEADER_FOOTER_BUTTONS,
  getIcon, charIcon,
} from "./toolbarConfig";
import { RIBBON_TAB, colGroup, EDIT_BTN } from "./toolbarStyles";

/* ── 다른 탭 파일에서 재내보내기 ── */
export { RibbonHome } from "./RibbonHome";
export { RibbonDraw, RibbonDesign, RibbonLayout } from "./RibbonEditTabs";
export { RibbonReferences, RibbonReview, RibbonView, RibbonFile } from "./RibbonRefTabs";

/** 미구현 소형 버튼 자동 렌더 */
function renderSmallNotImpl(notImpl, buttons) {
  return buttons.map(({ iconKey, label, notImplLabel }) => (
    <RibbonBtn key={iconKey} icon={getIcon(iconKey)} label={label} onClick={() => notImpl(notImplLabel || label)} />
  ));
}

/**
 * 삽입 탭 — 페이지, 표, 일러스트, 링크, 메모, 기호
 */
export function RibbonInsert({ editor, notImpl, toast, setTableModalOpen, setImageModalOpen, setLinkModalOpen, setInfoPanelOpen, setSymbolModalOpen }) {
  return (
    <div style={RIBBON_TAB}>
      <RibbonGroup label="페이지">
        <RibbonBtnLarge icon={I.cover} label="표지" onClick={() => notImpl("표지")} />
        <div style={colGroup()}>
          <RibbonBtn icon={I.pageBreak} label="새 페이지" onClick={() => { editor?.chain().focus().setHardBreak().run(); toast("페이지 나누기 삽입됨"); }} />
          <RibbonBtn icon={I.breaks} label="페이지 나누기" onClick={() => editor?.chain().focus().setHorizontalRule().run()} />
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="표">
        <RibbonBtnLarge icon={I.table} label="표" onClick={() => setTableModalOpen(true)} />
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="일러스트레이션">
        {ILLUSTRATION_BUTTONS.slice(0, 1).map(b => (
          <RibbonBtnLarge key={b.iconKey} icon={getIcon(b.iconKey)} label={b.label} onClick={() => notImpl(b.label)} />
        ))}
        <RibbonBtnLarge icon={I.image} label="그림" onClick={() => setImageModalOpen(true)} />
        {ILLUSTRATION_BUTTONS.slice(1).map(b => (
          <RibbonBtnLarge key={b.iconKey} icon={getIcon(b.iconKey)} label={b.label} onClick={() => notImpl(b.label)} />
        ))}
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="미디어">
        <RibbonBtnLarge icon={I.video} label="온라인 비디오" onClick={() => notImpl("온라인 비디오")} />
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="링크">
        <RibbonBtnLarge icon={I.link} label="링크" onClick={() => setLinkModalOpen(true)} />
        <div style={colGroup()}>
          <RibbonBtn icon={I.bookmark} label="책갈피" onClick={() => notImpl("책갈피")} />
          <RibbonBtn icon={charIcon("\u2197")} label="상호 참조" onClick={() => notImpl("상호 참조")} />
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="메모">
        <RibbonBtnLarge icon={I.comment} label="메모" onClick={() => { setInfoPanelOpen(true); document.getElementById("comment-input")?.focus(); }} />
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="머리글/바닥글">
        <div style={colGroup()}>
          {renderSmallNotImpl(notImpl, HEADER_FOOTER_BUTTONS)}
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="텍스트">
        <div style={colGroup()}>
          <RibbonBtn icon={I.formula} label="수식" onClick={() => notImpl("수식")} style={EDIT_BTN} />
          <RibbonBtn icon={I.symbol} label="기호" onClick={() => setSymbolModalOpen(true)} style={EDIT_BTN} />
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="eSignature">
        <RibbonBtnLarge icon={I.esign} label="eSignature" onClick={() => notImpl("eSignature")} style={{ color: "#e8a020" }} />
      </RibbonGroup>
    </div>
  );
}
