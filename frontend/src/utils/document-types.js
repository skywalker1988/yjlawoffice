/** 문서 유형 설정 — 유형별 라벨, 색상 매핑 */
export const TYPE_CONFIG = {
  statute: { label: "법령", color: "#3498db" },
  case_law: { label: "판례", color: "#e74c3c" },
  textbook: { label: "교과서", color: "#9b59b6" },
  book: { label: "서적", color: "#4CAF50" },
  paper: { label: "논문", color: "#e67e22" },
  news: { label: "뉴스", color: "#2ecc71" },
  note: { label: "메모", color: "#95a5a6" },
};

export const ALL_DOCUMENT_TYPES = Object.keys(TYPE_CONFIG);

export function getTypeLabel(type) {
  return TYPE_CONFIG[type]?.label ?? type;
}

export function getTypeColor(type) {
  return TYPE_CONFIG[type]?.color ?? "#95a5a6";
}
