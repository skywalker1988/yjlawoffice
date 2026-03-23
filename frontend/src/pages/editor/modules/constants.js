/**
 * Word 스타일 에디터에서 사용하는 모든 상수 정의
 * - 문서 유형, 글꼴, 크기, 여백, 용지, 스타일 프리셋
 * - 테두리, 표, 테마, 번호매기기, 워터마크, 수식 기호 등
 */

/* ── 문서 유형 ── */
export const DOC_TYPES = [
  { value: "guide", label: "가이드" },
  { value: "law", label: "법률" },
  { value: "statute", label: "법령" },
  { value: "case_law", label: "판례" },
  { value: "article", label: "아티클" },
  { value: "memo", label: "메모" },
  { value: "note", label: "노트" },
  { value: "reference", label: "참고자료" },
  { value: "textbook", label: "교과서" },
  { value: "book", label: "서적" },
  { value: "paper", label: "논문" },
  { value: "news", label: "뉴스" },
];

/* ── 빈 문서 기본값 ── */
export const EMPTY_DOC = {
  title: "",
  documentType: "article",
  subtitle: "",
  author: "",
  source: "",
  publishedDate: "",
  contentMarkdown: "",
  summary: "",
  status: "draft",
  importance: 3,
  tagIds: [],
};

/* ── 글꼴 목록 ── */
export const FONT_LIST = [
  { value: "malgun", label: "맑은 고딕", family: "'맑은 고딕', 'Malgun Gothic', sans-serif" },
  { value: "batang", label: "바탕", family: "'바탕', Batang, serif" },
  { value: "dotum", label: "돋움", family: "'돋움', Dotum, sans-serif" },
  { value: "gulim", label: "굴림", family: "'굴림', Gulim, sans-serif" },
  { value: "gungsuh", label: "궁서", family: "'궁서', Gungsuh, serif" },
  { value: "noto-sans", label: "Noto Sans KR", family: "'Noto Sans KR', sans-serif" },
  { value: "noto-serif", label: "Noto Serif KR", family: "'Noto Serif KR', serif" },
  { value: "arial", label: "Arial", family: "Arial, Helvetica, sans-serif" },
  { value: "times", label: "Times New Roman", family: "'Times New Roman', Times, serif" },
  { value: "georgia", label: "Georgia", family: "Georgia, serif" },
  { value: "courier", label: "Courier New", family: "'Courier New', Courier, monospace" },
  { value: "verdana", label: "Verdana", family: "Verdana, Geneva, sans-serif" },
];

/* ── 글꼴 크기 (pt) ── */
export const FONT_SIZES = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 28, 36, 48, 72];

/* ── 줄 간격 ── */
export const LINE_SPACINGS = [
  { value: "1", label: "1.0" },
  { value: "1.15", label: "1.15" },
  { value: "1.5", label: "1.5" },
  { value: "2", label: "2.0" },
  { value: "2.5", label: "2.5" },
  { value: "3", label: "3.0" },
];

/* ── 여백 프리셋 (px 단위) ── */
export const MARGIN_PRESETS = [
  { value: "narrow", label: "좁게", desc: "상하좌우 1.27cm", top: 48, bottom: 48, left: 48, right: 48 },
  { value: "normal", label: "보통", desc: "상하 2.54cm, 좌우 3.17cm", top: 96, bottom: 96, left: 120, right: 120 },
  { value: "wide", label: "넓게", desc: "상하 2.54cm, 좌우 5.08cm", top: 96, bottom: 96, left: 192, right: 192 },
  { value: "mirrored", label: "대칭", desc: "안쪽 3.17cm, 바깥쪽 2.54cm", top: 96, bottom: 96, left: 120, right: 96 },
];

/* ── 용지 크기 (px 단위, 96dpi 기준) ── */
export const PAGE_SIZES = [
  { value: "a4", label: "A4", width: 794, height: 1123, desc: "210 × 297 mm" },
  { value: "letter", label: "Letter", width: 816, height: 1056, desc: "215.9 × 279.4 mm" },
  { value: "legal", label: "Legal", width: 816, height: 1344, desc: "215.9 × 355.6 mm" },
  { value: "b5", label: "B5", width: 665, height: 945, desc: "176 × 250 mm" },
];

/* ── 스타일 프리셋 (제목, 본문, 인용 등) ── */
export const STYLE_PRESETS = [
  { id: "normal", label: "표준", tag: "p", fontSize: "11pt", fontWeight: 400, color: "#333", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "no-spacing", label: "간격없음", tag: "p", fontSize: "11pt", fontWeight: 400, color: "#333", lineHeight: "1.0", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "heading1", label: "제목 1", tag: "h1", fontSize: "16pt", fontWeight: 600, color: "#1e3a5f", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "heading2", label: "제목 2", tag: "h2", fontSize: "13pt", fontWeight: 600, color: "#1e3a5f", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "heading3", label: "제목 3", tag: "h3", fontSize: "12pt", fontWeight: 600, color: "#1f4e79", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "heading4", label: "제목 4", tag: "h4", fontSize: "11pt", fontWeight: 600, color: "#1f4e79", fontStyle: "italic", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "title", label: "제목", tag: "h1", fontSize: "26pt", fontWeight: 300, color: "#333", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "subtitle", label: "부제", tag: "h2", fontSize: "14pt", fontWeight: 400, color: "#777", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "quote", label: "인용", tag: "blockquote", fontSize: "11pt", fontWeight: 400, color: "#555", fontStyle: "italic", fontFamily: "'맑은 고딕', sans-serif" },
  { id: "intense-quote", label: "강한 인용", tag: "blockquote", fontSize: "11pt", fontWeight: 600, color: "#3b82f6", fontFamily: "'맑은 고딕', sans-serif" },
];

/* ── 밑줄 스타일 ── */
export const UNDERLINE_STYLES = [
  { value: "solid", label: "───────", css: "underline" },
  { value: "double", label: "═══════", css: "underline double" },
  { value: "dotted", label: "· · · · · · ·", css: "underline dotted" },
  { value: "dashed", label: "- - - - - - -", css: "underline dashed" },
  { value: "wavy", label: "∿∿∿∿∿∿∿", css: "underline wavy" },
];

/* ── 특수 문자 ── */
export const SPECIAL_CHARS = [
  { category: "기호", chars: ["©", "®", "™", "§", "¶", "†", "‡", "•", "‣", "⁂", "※", "℗", "℠", "℃", "℉", "Å", "Ω", "µ", "∞", "≈", "≠", "≤", "≥", "±", "×", "÷", "√", "∑", "∏", "∫", "∂", "∇", "∆"] },
  { category: "화살표", chars: ["←", "→", "↑", "↓", "↔", "↕", "⇐", "⇒", "⇑", "⇓", "⇔", "↗", "↘", "↙", "↖", "➜", "➤", "➔", "➡"] },
  { category: "도형", chars: ["■", "□", "▪", "▫", "●", "○", "◆", "◇", "▲", "△", "▼", "▽", "◀", "▶", "★", "☆", "♠", "♣", "♥", "♦", "♤", "♧", "♡", "♢"] },
  { category: "괄호", chars: ["「", "」", "『", "』", "【", "】", "〔", "〕", "〈", "〉", "《", "》", "〖", "〗", "⌜", "⌝", "⌞", "⌟"] },
  { category: "수학", chars: ["∀", "∃", "∈", "∉", "∋", "∪", "∩", "⊂", "⊃", "⊆", "⊇", "⊕", "⊗", "⊥", "∠", "∟", "∥", "⌀", "∝", "∴", "∵", "∎"] },
  { category: "통화", chars: ["₩", "¥", "€", "£", "$", "¢", "₤", "₱", "₹", "₽", "₺", "฿"] },
  { category: "한글 자모", chars: ["ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄸ", "ㄹ", "ㅀ", "ㅁ", "ㅂ", "ㅃ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"] },
];

/* ── 형광펜 색상 ── */
export const HIGHLIGHT_COLORS = [
  "#fef3b5", "#fde047", "#fdba74", "#fca5a5", "#f9a8d4",
  "#d8b4fe", "#93c5fd", "#86efac", "#6ee7b7", "#99f6e4",
  "#fecaca", "#fed7aa", "#fef08a", "#bbf7d0", "#bfdbfe",
];

/* ── 텍스트 색상 팔레트 ── */
export const TEXT_COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff",
  "#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff",
  "#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc",
  "#dd7e6b", "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#a4c2f4", "#9fc5e8", "#b4a7d6", "#d5a6bd",
  "#cc4125", "#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6d9eeb", "#6fa8dc", "#8e7cc3", "#c27ba0",
  "#a61c00", "#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3c78d8", "#3d85c6", "#674ea7", "#a64d79",
  "#85200c", "#990000", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#1155cc", "#0b5394", "#351c75", "#741b47",
  "#5b0f00", "#660000", "#783f04", "#7f6000", "#274e13", "#0c343d", "#1c4587", "#073763", "#20124d", "#4c1130",
];

/* ── 지역/국가 코드 ── */
export const COUNTRY_CODES = {
  "한국": "82", "중국": "86", "일본": "81", "미국": "1", "영국": "44", "프랑스": "33",
  "독일": "49", "이탈리아": "39", "러시아": "7", "인도": "91", "이집트": "20",
  "이라크": "964", "이란": "98", "이스라엘": "972", "터키": "90", "그리스": "30",
  "폴란드": "48", "스페인": "34", "몽골": "976", "베트남": "84", "쿠바": "53",
  "남아프리카공화국": "27", "호주": "61", "바하마": "1242", "사우디아라비아": "966",
  "우크라이나": "380", "아이티": "509", "벨기에": "32", "뉴질랜드": "64",
  "오스트리아": "43", "캄보디아": "855", "튀니지": "216", "파나마": "507",
  "페루": "51", "멕시코": "52", "베네수엘라": "58", "에티오피아": "251",
  "나이지리아": "234", "르완다": "250", "태국": "66", "말리": "223",
  "우즈베키스탄": "998", "스위스": "41", "쿠웨이트": "965",
};

export const TYPE_NUMBERS = {
  "note": "100", "news": "200", "statute": "300", "case_law": "400",
  "paper": "500", "textbook": "600", "book": "700",
};

export const REGION_NUMBERS = {
  "동아시아": "10", "동남아시아": "15", "남아시아": "20", "중앙아시아": "25",
  "중동": "30", "유럽": "40", "북미": "50", "중남미": "55",
  "아프리카": "60", "오세아니아": "70",
};

export const CAT_NUMBERS = {
  "politics": "01", "war": "02", "economy": "03", "culture": "04",
  "science": "05", "law": "06", "society": "07", "diplomacy": "08",
};

/* ================================================================
 *  아래부터 새로 추가된 상수
 * ================================================================ */

/* ── 1. 테두리 스타일 ── */
export const BORDER_STYLES = [
  { value: "none", label: "없음" },
  { value: "solid", label: "실선 ───" },
  { value: "dashed", label: "파선 - - -" },
  { value: "dotted", label: "점선 · · ·" },
  { value: "double", label: "이중선 ═══" },
  { value: "groove", label: "홈 파기" },
  { value: "ridge", label: "돌출" },
  { value: "inset", label: "안으로" },
  { value: "outset", label: "밖으로" },
];

/* ── 2. 테두리 두께 (px) ── */
export const BORDER_WIDTHS = [0.5, 1, 1.5, 2, 3, 4, 6];

/* ── 3. 표 스타일 프리셋 ── */
export const TABLE_STYLES = [
  { id: "plain", label: "표 눈금", headerBg: "#f1f5f9", borderColor: "#ccc" },
  { id: "elegant", label: "우아한 표", headerBg: "#1e3a5f", headerColor: "#fff", borderColor: "#1e3a5f", stripedBg: "#f8fafc" },
  { id: "simple1", label: "간단한 표 1", headerBg: "transparent", borderColor: "#000", headerBorderBottom: "2px solid #000" },
  { id: "simple2", label: "간단한 표 2", headerBg: "transparent", borderColor: "#999", headerBorderBottom: "1px solid #999" },
  { id: "grid-blue", label: "눈금(파랑)", headerBg: "#2563eb", headerColor: "#fff", borderColor: "#93c5fd", stripedBg: "#eff6ff" },
  { id: "grid-green", label: "눈금(초록)", headerBg: "#16a34a", headerColor: "#fff", borderColor: "#86efac", stripedBg: "#f0fdf4" },
  { id: "grid-red", label: "눈금(빨강)", headerBg: "#dc2626", headerColor: "#fff", borderColor: "#fca5a5", stripedBg: "#fef2f2" },
  { id: "grid-purple", label: "눈금(보라)", headerBg: "#7c3aed", headerColor: "#fff", borderColor: "#c4b5fd", stripedBg: "#f5f3ff" },
  { id: "list-blue", label: "목록(파랑)", headerBg: "transparent", headerColor: "#2563eb", borderColor: "#2563eb", headerBorderBottom: "2px solid #2563eb" },
  { id: "list-green", label: "목록(초록)", headerBg: "transparent", headerColor: "#16a34a", borderColor: "#16a34a", headerBorderBottom: "2px solid #16a34a" },
];

/* ── 4. 단락 음영 배경색 (파스텔 계열) ── */
export const PARAGRAPH_SHADING_COLORS = [
  "#fff8e1", "#fff3e0", "#fce4ec", "#f3e5f5", "#ede7f6",
  "#e8eaf6", "#e3f2fd", "#e1f5fe", "#e0f7fa", "#e0f2f1",
  "#e8f5e9", "#f1f8e9", "#f9fbe7", "#fffde7", "#fafafa",
  "#eceff1", "#fbe9e7", "#efebe9", "#f5f5f5", "#ffffff",
];

/* ── 5. 텍스트 효과 프리셋 ── */
export const TEXT_EFFECTS = [
  { id: "none", label: "없음", style: {} },
  { id: "shadow", label: "그림자", style: { textShadow: "1px 1px 2px rgba(0,0,0,0.3)" } },
  { id: "outline", label: "윤곽선", style: { WebkitTextStroke: "0.5px #333" } },
  { id: "emboss", label: "양각", style: { textShadow: "-1px -1px 0 rgba(255,255,255,0.5), 1px 1px 0 rgba(0,0,0,0.3)" } },
  { id: "engrave", label: "음각", style: { textShadow: "1px 1px 0 rgba(255,255,255,0.5), -1px -1px 0 rgba(0,0,0,0.3)" } },
  { id: "glow-blue", label: "파란빛", style: { textShadow: "0 0 4px #3b82f6, 0 0 8px rgba(59,130,246,0.3)" } },
  { id: "glow-gold", label: "금빛", style: { textShadow: "0 0 4px #f59e0b, 0 0 8px rgba(245,158,11,0.3)" } },
];

/* ── 6. 문서 테마 ── */
export const DOCUMENT_THEMES = [
  { id: "office", label: "Office", primary: "#4472C4", secondary: "#ED7D31", accent1: "#A5A5A5", accent2: "#FFC000", accent3: "#5B9BD5", headingFont: "'맑은 고딕'", bodyFont: "'맑은 고딕'" },
  { id: "elegant", label: "우아한", primary: "#1e3a5f", secondary: "#b08d57", accent1: "#8b7355", accent2: "#c4a882", headingFont: "'Noto Serif KR'", bodyFont: "'맑은 고딕'" },
  { id: "modern", label: "모던", primary: "#2563eb", secondary: "#0891b2", accent1: "#7c3aed", accent2: "#059669", headingFont: "'Noto Sans KR'", bodyFont: "'Noto Sans KR'" },
  { id: "classic", label: "클래식", primary: "#333333", secondary: "#666666", accent1: "#999999", accent2: "#cccccc", headingFont: "'바탕'", bodyFont: "'바탕'" },
  { id: "nature", label: "자연", primary: "#15803d", secondary: "#854d0e", accent1: "#166534", accent2: "#a16207", headingFont: "'Noto Sans KR'", bodyFont: "'맑은 고딕'" },
];

/* ── 7. 다단계 번호매기기 스타일 ── */
export const NUMBERING_STYLES = [
  { id: "decimal", label: "1, 2, 3", levels: ["1.", "  1)", "    (1)", "      ①"] },
  { id: "alpha-upper", label: "A, B, C", levels: ["A.", "  a)", "    (a)", "      ⓐ"] },
  { id: "roman", label: "I, II, III", levels: ["I.", "  i)", "    (i)", "      (a)"] },
  { id: "korean", label: "가, 나, 다", levels: ["가.", "  1)", "    가)", "      (1)"] },
  { id: "outline", label: "제1장", levels: ["제1장", "  제1절", "    1.", "      가."] },
  { id: "legal", label: "1. 1.1 1.1.1", levels: ["1.", "  1.1.", "    1.1.1.", "      1.1.1.1."] },
];

/* ── 8. 페이지 테두리 스타일 ── */
export const PAGE_BORDER_STYLES = [
  { id: "box", label: "상자", style: "solid" },
  { id: "shadow", label: "그림자", style: "solid", shadow: true },
  { id: "3d", label: "3차원", style: "outset" },
  { id: "custom", label: "사용자 지정", style: "solid" },
];

/* ── 9. 워터마크 프리셋 텍스트 ── */
export const WATERMARK_PRESETS = [
  "긴급", "대외비", "초안", "샘플", "사본",
  "보안", "비밀", "원본", "검토용", "최종",
];

/* ── 10. 머리글/바닥글 프리셋 레이아웃 ── */
export const HEADER_FOOTER_PRESETS = [
  { id: "blank", label: "비어있음" },
  { id: "title-only", label: "제목만" },
  { id: "title-date", label: "제목 + 날짜" },
  { id: "title-page", label: "제목 + 페이지" },
  { id: "page-center", label: "페이지 번호 (가운데)" },
  { id: "page-right", label: "페이지 번호 (오른쪽)" },
];

/* ── 11. 수식 기호 (카테고리별 그룹) ── */
export const EQUATION_SYMBOLS = [
  { category: "그리스 문자", chars: ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι", "κ", "λ", "μ", "ν", "ξ", "π", "ρ", "σ", "τ", "υ", "φ", "χ", "ψ", "ω", "Γ", "Δ", "Θ", "Λ", "Ξ", "Π", "Σ", "Φ", "Ψ", "Ω"] },
  { category: "연산자", chars: ["±", "×", "÷", "∓", "⊕", "⊗", "⊙", "∘", "·", "⋅", "∗", "⋆", "†", "‡"] },
  { category: "관계", chars: ["=", "≠", "<", ">", "≤", "≥", "≪", "≫", "≈", "≅", "≡", "∝", "∼", "≃"] },
  { category: "집합", chars: ["∈", "∉", "⊂", "⊃", "⊆", "⊇", "∪", "∩", "∅", "∖", "⊄", "⊈", "⊊"] },
  { category: "논리", chars: ["∧", "∨", "¬", "⇒", "⇔", "∀", "∃", "∄", "⊢", "⊨", "⊤", "⊥"] },
  { category: "미적분", chars: ["∫", "∬", "∮", "∑", "∏", "∂", "∇", "∞", "lim", "dx", "dy"] },
  { category: "행렬/괄호", chars: ["⌈", "⌉", "⌊", "⌋", "⟨", "⟩", "‖", "⟦", "⟧", "⎡", "⎤", "⎣", "⎦"] },
];

/* ── 12. 찾기/바꾸기 고급 옵션 기본값 ── */
export const FIND_REPLACE_OPTIONS = {
  matchCase: false,
  wholeWord: false,
  useRegex: false,
  matchFormat: false,
};
