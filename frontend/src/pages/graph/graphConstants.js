/**
 * graphConstants.js — 지식 그래프 물리 시뮬레이션 및 시각화 상수
 * 그래프 레이아웃, 엣지 판정, 렌더링에 사용되는 모든 매직넘버를 한 곳에 관리한다.
 */

/** 물리 시뮬레이션 파라미터 */
export const PHYSICS = {
  /** 노드 간 척력 강도 -- 높을수록 노드가 멀리 밀려남 */
  REPULSION_STRENGTH: 1500,
  /** 척력 무시 거리 제곱 (px^2) -- 이 거리 이상 떨어진 노드 쌍은 척력 계산 생략 */
  REPULSION_CUTOFF_SQ: 490000,
  /** 연결선의 기본 길이(px) */
  SPRING_REST_LENGTH: 120,
  /** 스프링 강성 -- 연결된 노드를 당기는 힘 */
  SPRING_STIFFNESS: 0.002,
  /** 동일 그룹 노드 간 인력 강도 */
  GROUP_ATTRACTION: 0.004,
  /** 중앙 중력 계수 -- 전체 그래프가 화면 중앙으로 약하게 끌림 */
  CENTER_GRAVITY: 0.0004,
  /** 속도 감쇠 계수 (프레임당) */
  DAMPING: 0.85,
  /** 최대 노드 속도(px/frame) */
  MAX_SPEED: 3,
  /** 시뮬레이션이 정착(settled)으로 간주되는 쿨링 프레임 수 */
  COOLING_FRAMES: 400,
  /** 그룹 간 최소 거리 여유(px) */
  GROUP_REPULSION_PADDING: 50,
  /** 그룹 간 밀어내기 힘 계수 */
  GROUP_REPULSION_FORCE: 0.025,
};

/** 엣지(연결) 가중치 판정 기준 */
export const EDGE_RULES = {
  /** 최소 연결 가중치 -- 이 값 미만이면 연결선 미표시 */
  MIN_WEIGHT: 2,
  /** 동일 국가에서 연결로 간주할 연도 차이 */
  SAME_COUNTRY_YEAR_THRESHOLD: 100,
  /** 동일 국가 근접 연도 기준 (높은 가중치) */
  SAME_COUNTRY_CLOSE_YEAR: 30,
  /** 동일 카테고리에서 연결로 간주할 연도 차이 */
  SAME_CATEGORY_YEAR_THRESHOLD: 50,
  /** 연결 강도 정규화 기준 (실용적 최대 가중치) */
  MAX_PRACTICAL_WEIGHT: 7,
};

/** 캔버스 렌더링 관련 상수 */
export const RENDER = {
  /** 버블 라벨이 페이드인 시작하는 줌 레벨 */
  BUBBLE_FADE_START_ZOOM: 0.8,
  /** 버블 라벨 페이드인 범위 (start ~ start+range 구간에서 0->1 보간) */
  BUBBLE_FADE_RANGE: 0.4,
  /** 최소 줌 */
  MIN_ZOOM: 0.15,
  /** 최대 줌 */
  MAX_ZOOM: 6,
};

/** 그룹 버블 배경색 (RGB 배열) */
export const GROUP_COLORS = [
  [59, 130, 246],
  [239, 68, 68],
  [34, 197, 94],
  [168, 85, 247],
  [245, 158, 11],
  [20, 184, 166],
  [236, 72, 153],
  [99, 102, 241],
  [234, 88, 12],
  [107, 114, 128],
];

/** 카테고리 코드 -> 한국어 라벨 매핑 */
export const CATEGORY_LABELS_KR = {
  politics: "정치",
  war: "전쟁",
  culture: "문화",
  science: "과학",
  economy: "경제",
  religion: "종교",
  philosophy: "철학",
  art: "예술",
  law: "법률",
  society: "사회",
  diplomacy: "외교",
  technology: "기술",
};
