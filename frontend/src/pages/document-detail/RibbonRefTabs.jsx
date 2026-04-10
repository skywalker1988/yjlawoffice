/**
 * RibbonRefTabs — 참조, 검토, 보기, 파일 리본 탭
 * 문서 참조/검토/보기 모드/파일 관리 탭 모음
 */
import I from "./DocDetailIcons";
import { RibbonBtn, RibbonBtnLarge, Sep, RibbonGroup } from "./DocDetailUI";
import { getTypeLabel, getTypeColor } from "../../utils/document-types";
import { STATUS_LABELS } from "../../utils/constants";
import { parseAuthor } from "../../utils/format";
import { VIEW_MODE_BUTTONS, getIcon, charIcon } from "./toolbarConfig";
import {
  RIBBON_TAB, colGroup, rowGroup, SELECT_BASE,
  FIELD_LABEL, CITE_SELECT, REVIEW_SELECT,
  FILE_BTN, DELETE_BTN, TYPE_BADGE, DOC_INFO_ROW,
  CHECKBOX_LABEL, CHECKBOX,
} from "./toolbarStyles";

/**
 * 참조 탭 — 목차, 각주, 인용, 캡션, 색인
 */
export function RibbonReferences({ editor, notImpl, toast, insertFootnote }) {
  return (
    <div style={RIBBON_TAB}>
      <RibbonGroup label="목차">
        <RibbonBtnLarge icon={I.toc} label="목차" onClick={() => notImpl("목차")} />
        <div style={colGroup()}>
          <RibbonBtn icon={charIcon("\u{1F4DD}", 9)} label="텍스트 추가" onClick={() => notImpl("텍스트 추가")} />
          <RibbonBtn icon={charIcon("\u{1F504}", 9)} label="목차 업데이트" onClick={() => notImpl("목차 업데이트")} />
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="각주">
        <RibbonBtnLarge icon={I.footnote} label="각주 삽입" onClick={() => {
          const text = prompt("각주 내용을 입력하세요:");
          if (text) insertFootnote(text);
        }} />
        <div style={colGroup()}>
          <RibbonBtn icon={charIcon("\u{1F4CC}", 9)} label="미주 삽입" onClick={() => editor?.chain().focus().insertContent('<sup style="color:#c00">[미주]</sup>').run()} />
          <RibbonBtn icon={charIcon("\u2B07", 9)} label="다음 각주" onClick={() => notImpl("다음 각주")} />
          <RibbonBtn icon={charIcon("\u{1F4CB}", 9)} label="각주/미주 표시" onClick={() => notImpl("각주 표시")} />
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="인용 및 참고 문헌">
        <RibbonBtnLarge icon={I.cite} label="인용 삽입" onClick={() => { editor?.chain().focus().insertContent(' [저자, 연도]').run(); toast("인용 삽입됨"); }} />
        <div style={colGroup()}>
          <div style={{ ...rowGroup(2), padding: "2px 4px" }}>
            <span style={FIELD_LABEL}>스타일:</span>
            <select style={CITE_SELECT}>
              <option>APA</option><option>MLA</option><option>Chicago</option><option>Harvard</option>
            </select>
          </div>
          <RibbonBtn icon={I.thesaurus} label="참고 문헌" onClick={() => notImpl("참고 문헌")} />
          <RibbonBtn icon={charIcon("\u2699", 9)} label="공급자 변경" onClick={() => notImpl("공급자 변경")} />
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="캡션">
        <RibbonBtnLarge icon={I.caption} label="캡션 삽입" onClick={() => editor?.chain().focus().insertContent('<p style="font-size:9pt;color:#666;text-align:center">그림 1 — 설명</p>').run()} />
        <div style={colGroup()}>
          <RibbonBtn icon={I.table} label="그림 목차 삽입" onClick={() => notImpl("그림 목차")} />
          <RibbonBtn icon={charIcon("\u{1F504}", 9)} label="목차 업데이트" onClick={() => notImpl("목차 업데이트")} />
          <RibbonBtn icon={charIcon("\u2197", 9)} label="상호 참조" onClick={() => notImpl("상호 참조")} />
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="색인">
        <RibbonBtnLarge icon={I.index} label="색인 삽입" onClick={() => notImpl("색인 삽입")} />
        <div style={colGroup()}>
          <RibbonBtn icon={charIcon("\u{1F504}", 9)} label="색인 업데이트" onClick={() => notImpl("색인 업데이트")} />
          <RibbonBtn icon={charIcon("\u{1F4CC}", 9)} label="항목 표시" onClick={() => notImpl("항목 표시")} />
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="관련 근거 목차">
        <div style={colGroup()}>
          <RibbonBtn icon={I.toc} label="관련 근거 목차 삽입" onClick={() => notImpl("관련 근거 목차")} />
          <RibbonBtn icon={I.cite} label="인용 표시" onClick={() => notImpl("인용 표시")} />
          <RibbonBtn icon={charIcon("\u{1F504}", 9)} label="관련 근거 업데이트" onClick={() => notImpl("관련 근거 업데이트")} />
        </div>
      </RibbonGroup>
    </div>
  );
}

/**
 * 검토 탭 — 언어 교정, 음성, 메모, 변경 추적
 */
export function RibbonReview({ editor, notImpl, toast, setInfoPanelOpen, setWordCountOpen, comments, setComments }) {
  return (
    <div style={RIBBON_TAB}>
      <RibbonGroup label="언어 교정">
        <RibbonBtnLarge icon={I.spellcheck} label="맞춤법 및 문법 검사" onClick={() => notImpl("맞춤법 검사")} />
        <div style={colGroup()}>
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
        <RibbonBtnLarge icon={<span style={{ fontSize: 14, fontWeight: 600 }}>가</span>} label="언어" onClick={() => notImpl("언어")} />
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="메모">
        <RibbonBtnLarge icon={I.comment} label="새 메모" onClick={() => setInfoPanelOpen(true)} />
        <div style={colGroup()}>
          <RibbonBtn icon={charIcon("\u{1F5D1}")} label="삭제" onClick={() => { if (comments.length) { setComments(prev => prev.slice(0, -1)); toast("메모 삭제됨"); } }} />
          <RibbonBtn icon={charIcon("\u25C0")} label="이전" onClick={() => notImpl("이전 메모")} />
          <RibbonBtn icon={charIcon("\u{1F4AC}", 9)} label="메모 표시" onClick={() => setInfoPanelOpen(true)} />
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="변경 내용">
        <div style={colGroup()}>
          <div style={{ ...rowGroup(2), padding: "2px 4px" }}>
            <select style={REVIEW_SELECT}>
              <option>메모 및 변경...</option><option>모든 마크업</option><option>마크업 없음</option>
            </select>
          </div>
          <RibbonBtn icon={charIcon("\u{1F4CB}", 9)} label="변경 내용 표시" onClick={() => notImpl("변경 내용 표시")} />
          <RibbonBtn icon={charIcon("\u{1F4DD}", 9)} label="검토 창" onClick={() => notImpl("검토 창")} />
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
        <div style={colGroup()}>
          <RibbonBtn icon={charIcon("\u{1F58A}", 9)} label="잉크 숨기기" onClick={() => notImpl("잉크 숨기기")} />
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="OneNote">
        <RibbonBtnLarge icon={I.onenote} label="연결된 OneNote" onClick={() => notImpl("OneNote")} />
      </RibbonGroup>
    </div>
  );
}

/**
 * 보기 탭 — 보기 모드, 눈금자, 확대/축소, 창
 */
export function RibbonView({ notImpl, viewMode, setViewMode, showRuler, setShowRuler, showGridlines, setShowGridlines, showNavPane, setShowNavPane, setZoom }) {
  return (
    <div style={RIBBON_TAB}>
      <RibbonGroup label="보기">
        {VIEW_MODE_BUTTONS.map(({ iconKey, label, mode }) => (
          <RibbonBtnLarge
            key={mode}
            icon={getIcon(iconKey)}
            label={label}
            onClick={() => setViewMode(mode)}
            style={viewMode === mode ? { background: "rgba(0,0,0,0.06)" } : undefined}
          />
        ))}
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="몰입형">
        <RibbonBtnLarge icon={I.readMode} label="몰입형 리더" onClick={() => notImpl("몰입형 리더")} />
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="표시">
        <div style={colGroup(3)}>
          <label style={CHECKBOX_LABEL}>
            <input type="checkbox" checked={showRuler} onChange={() => setShowRuler(!showRuler)} style={CHECKBOX} /> 눈금자
          </label>
          <label style={CHECKBOX_LABEL}>
            <input type="checkbox" checked={showGridlines} onChange={() => setShowGridlines(!showGridlines)} style={CHECKBOX} /> 눈금선
          </label>
          <label style={CHECKBOX_LABEL}>
            <input type="checkbox" checked={showNavPane} onChange={() => setShowNavPane(!showNavPane)} style={CHECKBOX} /> 탐색 창
          </label>
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="페이지 이동">
        <div style={colGroup()}>
          <RibbonBtn icon={charIcon("\u2195", 9)} label="세로" onClick={() => notImpl("세로")} />
          <RibbonBtn icon={charIcon("\u2194", 9)} label="나란히" onClick={() => notImpl("나란히")} />
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="확대/축소">
        <RibbonBtnLarge icon={I.zoom} label="확대/축소" onClick={() => setZoom(1)} />
        <div style={colGroup()}>
          <RibbonBtn icon={I.printLayout} label="한 페이지" onClick={() => setZoom(0.75)} />
          <RibbonBtn icon={I.split} label="여러 페이지" onClick={() => setZoom(0.5)} />
          <RibbonBtn icon={charIcon("\u2194", 9)} label="페이지 너비" onClick={() => setZoom(1)} />
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="창">
        <RibbonBtnLarge icon={I.newWin} label="새 창" onClick={() => window.open(window.location.href, "_blank")} />
        <div style={colGroup()}>
          <RibbonBtn icon={I.grid} label="모두 정렬" onClick={() => notImpl("모두 정렬")} />
          <RibbonBtn icon={I.split} label="나누기" onClick={() => notImpl("나누기")} />
        </div>
        <div style={colGroup()}>
          <RibbonBtn icon={charIcon("\u{1F440}", 9)} label="나란히 보기" onClick={() => notImpl("나란히 보기")} />
          <RibbonBtn icon={charIcon("\u{1F504}", 9)} label="동시 스크롤" onClick={() => notImpl("동시 스크롤")} />
          <RibbonBtn icon={charIcon("\u21A9", 9)} label="창 위치 다시 정렬" onClick={() => notImpl("창 위치")} />
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="매크로">
        <RibbonBtnLarge icon={I.macro} label="매크로" onClick={() => notImpl("매크로")} />
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="SharePoint">
        <RibbonBtnLarge icon={I.info} label="속성" onClick={() => notImpl("SharePoint")} />
      </RibbonGroup>
    </div>
  );
}

/**
 * 파일 탭 — 저장, 인쇄, 정보, 문서 정보, 삭제
 */
export function RibbonFile({ doc, editor, manualSave, handlePrint, infoPanelOpen, setInfoPanelOpen, handleStatusChange, setDeleteOpen }) {
  return (
    <div style={RIBBON_TAB}>
      <RibbonGroup label="">
        <div style={{ ...colGroup(1), padding: "0 8px" }}>
          <RibbonBtn icon={I.save} label="저장 (Ctrl+S)" onClick={manualSave} style={FILE_BTN} />
          <RibbonBtn icon={I.print} label="인쇄 (Ctrl+P)" onClick={handlePrint} style={FILE_BTN} />
          <RibbonBtn icon={I.info} label="정보" onClick={() => setInfoPanelOpen(!infoPanelOpen)} style={FILE_BTN} />
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="문서 정보">
        <div style={DOC_INFO_ROW}>
          <div>
            <span style={{ color: "#888" }}>유형: </span>
            <span style={TYPE_BADGE(getTypeColor(doc.documentType))}>{getTypeLabel(doc.documentType)}</span>
          </div>
          <div>
            <span style={{ color: "#888" }}>상태: </span>
            <select value={doc.status || "inbox"} onChange={e => handleStatusChange(e.target.value)}
              style={{ ...SELECT_BASE, fontSize: 9, padding: "0 4px", height: 20 }}>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          {doc.author && <div><span style={{ color: "#888" }}>저자: </span><span>{parseAuthor(doc.author)}</span></div>}
          <div>
            <span style={{ color: "#888" }}>중요도: </span>
            {[1, 2, 3, 4, 5].map(s => <span key={s} style={{ color: s <= (doc.importance || 3) ? "#6366f1" : "#ddd", fontSize: 11 }}>&#x2605;</span>)}
          </div>
        </div>
      </RibbonGroup>
      <Sep />
      <RibbonGroup label="">
        <button onClick={() => setDeleteOpen(true)} style={DELETE_BTN}>문서 삭제</button>
      </RibbonGroup>
    </div>
  );
}
