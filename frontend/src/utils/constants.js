/**
 * 프로젝트 전역 공통 상수
 * - 여러 페이지에서 중복 정의되던 상수들을 한 곳에서 관리
 */

/** 문서 상태 라벨 매핑 */
export const STATUS_LABELS = {
  inbox: "수신함",
  reading: "읽는 중",
  completed: "완독",
  archived: "보관",
  reference: "참고",
};

/** 문서 상태 옵션 (Select 컴포넌트용 배열 형태) */
export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

/** 세계사 이벤트 카테고리 설정 (라벨 + 색상) */
export const CATEGORY_CONFIG = {
  politics: { label: "정치", color: "#3498db" },
  war: { label: "전쟁", color: "#e74c3c" },
  economy: { label: "경제", color: "#f39c12" },
  culture: { label: "문화", color: "#9b59b6" },
  science: { label: "과학", color: "#2ecc71" },
  law: { label: "법률", color: "#e67e22" },
  society: { label: "사회", color: "#1abc9c" },
  diplomacy: { label: "외교", color: "#34495e" },
};

export const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG);

/** 카테고리 한국어 약어 매핑 (그래프 등에서 사용) */
export const CATEGORY_LABELS_KR = {
  politics: "정치",
  war: "전쟁",
  economy: "경제",
  culture: "문화",
  science: "과학",
  law: "법률",
  society: "사회",
  diplomacy: "외교",
};

/** 지역별 지도 좌표 */
export const REGION_COORDS = {
  "동아시아": [35.8, 120],
  "동남아시아": [10, 106],
  "남아시아": [22, 78],
  "중앙아시아": [42, 65],
  "중동": [30, 45],
  "유럽": [50, 10],
  "북아프리카": [28, 10],
  "사하라이남 아프리카": [-5, 25],
  "북미": [40, -100],
  "중남미": [-15, -60],
  "오세아니아": [-25, 135],
  "전세계": [20, 0],
};

/** 세계사 지역 목록 */
export const REGIONS = Object.keys(REGION_COORDS);
