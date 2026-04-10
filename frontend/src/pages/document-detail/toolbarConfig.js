/**
 * DocToolbar 버튼 설정 — 리본 탭별 버튼을 데이터 배열로 정의
 * 각 배열 항목은 { icon, label, action, active?, style? } 형태
 */
import I from "./DocDetailIcons";

/* ── 홈 탭 ── */

/** 굵게/기울임/밑줄 등 서식 토글 버튼 */
export const FONT_FORMAT_BUTTONS = [
  { iconKey: "bold", label: "굵게 (Ctrl+B)", mark: "bold", command: "toggleBold" },
  { iconKey: "italic", label: "기울임 (Ctrl+I)", mark: "italic", command: "toggleItalic" },
  { iconKey: "underline", label: "밑줄 (Ctrl+U)", mark: "underline", command: "toggleUnderline" },
  { iconKey: "strike", label: "취소선", mark: "strike", command: "toggleStrike" },
  { iconKey: "sub", label: "아래 첨자", mark: "subscript", command: "toggleSubscript" },
  { iconKey: "sup", label: "위 첨자", mark: "superscript", command: "toggleSuperscript" },
];

/** 단락 — 목록/들여쓰기 버튼 (첫 번째 행) */
export const PARAGRAPH_LIST_BUTTONS = [
  { iconKey: "listUl", label: "글머리 기호", mark: "bulletList", command: "toggleBulletList" },
  { iconKey: "listOl", label: "번호 매기기", mark: "orderedList", command: "toggleOrderedList" },
];

export const PARAGRAPH_INDENT_BUTTONS = [
  { iconKey: "indentDec", label: "내어쓰기", command: "liftListItem", args: ["listItem"] },
  { iconKey: "indentInc", label: "들여쓰기", command: "sinkListItem", args: ["listItem"] },
];

/** 단락 — 정렬 버튼 (두 번째 행) */
export const ALIGN_BUTTONS = [
  { iconKey: "alignL", label: "왼쪽 맞춤", align: "left" },
  { iconKey: "alignC", label: "가운데 맞춤", align: "center" },
  { iconKey: "alignR", label: "오른쪽 맞춤", align: "right" },
  { iconKey: "alignJ", label: "양쪽 맞춤", align: "justify" },
];

/* ── 삽입 탭 ── */

/** 일러스트레이션 그룹 — notImpl 버튼 */
export const ILLUSTRATION_BUTTONS = [
  { iconKey: "shapes", label: "도형" },
  // image는 별도 처리 (setImageModalOpen)
  { iconKey: "icon", label: "아이콘" },
  { iconKey: "model3d", label: "3D 모델" },
  { iconKey: "smartart", label: "SmartArt" },
  { iconKey: "chart", label: "차트" },
  { iconKey: "screenshot", label: "스크린샷" },
];

/** 머리글/바닥글 그룹 */
export const HEADER_FOOTER_BUTTONS = [
  { iconKey: "header", label: "머리글" },
  { iconKey: "footer", label: "바닥글" },
  { iconKey: "pageNum", label: "페이지 번호" },
];

/* ── 그리기 탭 ── */

/** 변환 그룹 */
export const DRAW_CONVERT_BUTTONS = [
  { iconKey: "inkShape", label: "잉크를 셰이프로 변환", notImplLabel: "잉크→셰이프" },
  { iconKey: "inkMath", label: "잉크를 수식으로", notImplLabel: "잉크→수식" },
];

/* ── 디자인 탭 ── */

/** 페이지 배경 그룹 */
export const PAGE_BG_BUTTONS = [
  { iconKey: "watermark", label: "워터마크" },
  { iconKey: "pageColor", label: "페이지 색" },
  { iconKey: "border", label: "페이지 테두리" },
];

/** 디자인 문서 서식 카드 — 8개 테마 */
export const DESIGN_THEME_CARDS = [
  { bg: "#fff", fg: "#333", showSub: true },
  { bg: "#f8f8f8", fg: "#333", showSub: true },
  { bg: "#f8f8f8", fg: "#333", showSub: true },
  { bg: "#e8ecf0", fg: "#333", showSub: false },
  { bg: "#e8ecf0", fg: "#333", showSub: false },
  { bg: "#1a1a2e", fg: "#fff", showSub: false },
  { bg: "#1a1a2e", fg: "#fff", showSub: false },
  { bg: "#333", fg: "#fff", showSub: false },
];

/* ── 레이아웃 탭 ── */

/** 레이아웃 페이지 설정 — 대형 버튼 */
export const LAYOUT_PAGE_BUTTONS = [
  { iconKey: "textDir", label: "텍스트 방향" },
  { iconKey: "margin", label: "여백" },
  { iconKey: "printLayout", label: "용지" },
  { iconKey: "columns", label: "단" },
];

/** 레이아웃 정렬 — 대형 버튼 */
export const LAYOUT_ARRANGE_LARGE = [
  { iconKey: "position", label: "위치" },
  { iconKey: "wrapText", label: "텍스트 줄 바꿈" },
];

/** 레이아웃 정렬 — 소형 버튼 */
export const LAYOUT_ARRANGE_SMALL = [
  { iconKey: "bringFwd", label: "앞으로 가져오기", notImplLabel: "앞으로" },
  { iconKey: "sendBwd", label: "보내기" },
  { iconKey: "selPane", label: "선택 창" },
];

/* ── 보기 탭 ── */

/** 보기 모드 버튼 */
export const VIEW_MODE_BUTTONS = [
  { iconKey: "readMode", label: "읽기 모드", mode: "read" },
  { iconKey: "printLayout", label: "인쇄 모양", mode: "print" },
  { iconKey: "webLayout", label: "웹 모양", mode: "web" },
  { iconKey: "outline", label: "개요", mode: "outline" },
  { iconKey: "memo", label: "초안", mode: "draft" },
];

/**
 * 아이콘 키로 실제 아이콘 요소를 가져오는 헬퍼
 * @param {string} key - DocDetailIcons의 속성 키
 * @returns {React.ReactNode} 아이콘 요소
 */
export function getIcon(key) {
  return I[key];
}

/**
 * 유니코드/이모지 아이콘 생성 헬퍼
 * @param {string} char - 유니코드 문자
 * @param {number} size - fontSize (기본 10)
 * @returns {React.ReactElement} span 요소
 */
export function charIcon(char, size = 10) {
  return <span style={{ fontSize: size }}>{char}</span>;
}
