/**
 * DocToolbar 공유 스타일 — 리본 탭 내 반복되는 인라인 스타일을 상수로 추출
 */

/** 리본 탭 컨테이너 공통 스타일 */
export const RIBBON_TAB = {
  display: "flex",
  alignItems: "stretch",
  gap: 0,
  height: 72,
};

/** 세로 방향 버튼 그룹 (gap 조절 가능) */
export const colGroup = (gap = 0) => ({
  display: "flex",
  flexDirection: "column",
  gap,
});

/** 가로 방향 버튼 그룹 */
export const rowGroup = (gap = 1) => ({
  display: "flex",
  alignItems: "center",
  gap,
});

/** 셀렉트 입력 — 글꼴/크기/스타일 등 */
export const SELECT_BASE = {
  height: 22,
  border: "1px solid #c0c0c0",
  borderRadius: 2,
  padding: "0 2px",
  fontSize: 10,
  background: "#fff",
};

/** 숫자 입력 — 들여쓰기/간격 */
export const NUMBER_INPUT = {
  width: 40,
  height: 18,
  border: "1px solid #c0c0c0",
  borderRadius: 2,
  fontSize: 9,
  textAlign: "center",
  padding: 0,
};

/** 색상 피커 그리드 */
export const COLOR_GRID = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: 3,
};

/** 색상 피커 아이템 */
export const COLOR_ITEM = {
  width: 20,
  height: 20,
  border: "1px solid #ccc",
  borderRadius: 2,
  cursor: "pointer",
  transition: "transform 0.1s",
};

/** 색상 제거 버튼 */
export const COLOR_REMOVE_BTN = {
  marginTop: 4,
  fontSize: 9,
  border: "1px solid #ddd",
  borderRadius: 2,
  padding: "2px 6px",
  background: "#fff",
  cursor: "pointer",
  width: "100%",
};

/** 편집 그룹 버튼 스타일 (찾기, 바꾸기, 선택) */
export const EDIT_BTN = {
  gap: 4,
  minWidth: 50,
  justifyContent: "flex-start",
  padding: "0 6px",
};

/** 파일 탭 버튼 스타일 */
export const FILE_BTN = {
  gap: 6,
  minWidth: 80,
  justifyContent: "flex-start",
  padding: "0 8px",
};

/** 드롭다운 컨테이너 */
export const DROPDOWN_COLOR = {
  width: 140,
  padding: 8,
};

/** 드롭다운 라벨 */
export const DROPDOWN_LABEL = {
  fontSize: 9,
  color: "#888",
  marginBottom: 4,
};

/** 레이아웃 탭 — 들여쓰기/간격 라벨 */
export const FIELD_LABEL = {
  fontSize: 8,
  color: "#888",
};

/** 스타일 카드 기본 스타일 */
export const STYLE_CARD_BASE = {
  width: 52,
  height: 52,
  border: "1px solid #d0d0d0",
  borderRadius: 2,
  background: "#fff",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  transition: "border-color 0.15s",
};

/** 문서 삭제 버튼 */
export const DELETE_BTN = {
  padding: "4px 12px",
  border: "1px solid #e88",
  borderRadius: 3,
  background: "#fff",
  color: "#c44",
  fontSize: 10,
  cursor: "pointer",
  height: 26,
};

/** 문서 유형 뱃지 */
export const TYPE_BADGE = (bgColor) => ({
  padding: "1px 6px",
  borderRadius: 3,
  fontSize: 9,
  fontWeight: 600,
  background: bgColor,
  color: "#fff",
});

/** 문서 정보 영역 컨테이너 */
export const DOC_INFO_ROW = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "0 8px",
  fontSize: 10,
};

/** 레이아웃 탭 — 레이블+인풋 행 */
export const LAYOUT_FIELD_ROW = {
  display: "flex",
  alignItems: "center",
  gap: 2,
};

/** 참조 인용 스타일 셀렉트 */
export const CITE_SELECT = {
  height: 18,
  border: "1px solid #c0c0c0",
  borderRadius: 2,
  fontSize: 8,
  padding: "0 2px",
  background: "#fff",
};

/** 검토 변경 내용 셀렉트 */
export const REVIEW_SELECT = {
  height: 18,
  border: "1px solid #c0c0c0",
  borderRadius: 2,
  fontSize: 8,
  padding: "0 2px",
  background: "#fff",
  width: 80,
};

/** 줄간격 드롭다운 아이템 */
export const LINE_SPACING_ITEM = {
  display: "block",
  width: "100%",
  padding: "4px 8px",
  border: "none",
  background: "transparent",
  fontSize: 10,
  cursor: "pointer",
  textAlign: "left",
  borderRadius: 2,
};

/** 체크박스 라벨 (보기 탭) */
export const CHECKBOX_LABEL = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  fontSize: 9,
  cursor: "pointer",
};

/** 체크박스 크기 */
export const CHECKBOX = {
  width: 12,
  height: 12,
};
