/**
 * docDetailConstants — 문서 상세 에디터에서 사용하는 상수 모음
 * 글꼴, 크기, 스타일, 색상, 탭 설정 등
 */

export const FONT_FAMILIES = [
  // 한글 글꼴
  "맑은 고딕", "바탕", "돋움", "굴림", "궁서",
  "나눔고딕", "나눔명조", "나눔바른고딕", "나눔스퀘어",
  "Noto Sans KR", "Noto Serif KR",
  "본고딕", "본명조",
  "함초롬바탕", "함초롬돋움",
  "KoPub돋움체", "KoPub바탕체",
  // 영문 글꼴 - Serif
  "Times New Roman", "Georgia", "Cambria", "Garamond",
  "Book Antiqua", "Palatino Linotype", "Century",
  // 영문 글꼴 - Sans-serif
  "Arial", "Calibri", "Verdana", "Tahoma", "Segoe UI",
  "Helvetica", "Trebuchet MS", "Lucida Sans",
  "Franklin Gothic Medium", "Century Gothic",
  // 영문 글꼴 - Monospace
  "Consolas", "Courier New", "Lucida Console",
  "Monaco", "Source Code Pro",
  // 디자인 글꼴
  "Impact", "Comic Sans MS", "Brush Script MT",
];

export const FONT_SIZES = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

export const HEADING_STYLES = [
  { label: "표준", cmd: "paragraph" },
  { label: "제목 1", cmd: "h1" },
  { label: "제목 2", cmd: "h2" },
  { label: "제목 3", cmd: "h3" },
  { label: "제목 4", cmd: "h4" },
];

export const TEXT_COLORS = [
  "#000000", "#c00000", "#ff0000", "#ffc000", "#ffff00",
  "#92d050", "#00b050", "#00b0f0", "#0070c0", "#002060",
  "#7030a0", "#808080", "#404040", "#a6a6a6", "#d9d9d9",
  "#595959", "#bf8f00", "#538135", "#2e75b6", "#bf4e15",
];

export const HIGHLIGHT_COLORS = [
  "#ffff00", "#00ff00", "#00ffff", "#ff00ff", "#0000ff",
  "#ff0000", "#000080", "#008080", "#00ff00", "#800080",
  "#800000", "#808000", "#c0c0c0", "#ff9900", "#99cc00",
];

export const THEME_PRESETS = [
  { name: "Office", colors: ["#4472c4", "#ed7d31", "#a5a5a5", "#ffc000", "#5b9bd5"] },
  { name: "전문가", colors: ["#2b579a", "#333333", "#888888", "#6366f1", "#5a8f7b"] },
  { name: "모던", colors: ["#1a1a2e", "#16213e", "#0f3460", "#e94560", "#533483"] },
  { name: "자연", colors: ["#606c38", "#283618", "#dda15e", "#bc6c25", "#fefae0"] },
];

export const RIBBON_TABS = [
  { id: "file", label: "파일" },
  { id: "home", label: "홈" },
  { id: "insert", label: "삽입" },
  { id: "draw", label: "그리기" },
  { id: "design", label: "디자인" },
  { id: "layout", label: "레이아웃" },
  { id: "references", label: "참조" },
  { id: "review", label: "검토" },
  { id: "view", label: "보기" },
];

export const SYMBOLS = [
  "©", "®", "™", "§", "¶", "†", "‡", "•", "…", "—",
  "–", "±", "×", "÷", "≠", "≈", "≤", "≥", "∞", "√",
  "∑", "∏", "∫", "∂", "∇", "∈", "∉", "⊂", "⊃", "∪",
  "∩", "∧", "∨", "¬", "∀", "∃", "α", "β", "γ", "δ",
  "ε", "θ", "λ", "μ", "π", "σ", "φ", "ω", "Δ", "Ω",
  "★", "☆", "♠", "♣", "♥", "♦", "←", "→", "↑", "↓",
];

/** 펜 도구 색상 */
export const PEN_COLORS = ["#000", "#c00", "#00c", "#0a0", "#f60", "#808", "#088"];

/** 줄 간격 옵션 */
export const LINE_SPACING_OPTIONS = [1, 1.15, 1.5, 2, 2.5, 3];
