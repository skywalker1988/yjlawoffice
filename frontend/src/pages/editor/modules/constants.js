/**
 * Constants for the Word-like editor
 */

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

export const FONT_SIZES = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 28, 36, 48, 72];

export const LINE_SPACINGS = [
  { value: "1", label: "1.0" },
  { value: "1.15", label: "1.15" },
  { value: "1.5", label: "1.5" },
  { value: "2", label: "2.0" },
  { value: "2.5", label: "2.5" },
  { value: "3", label: "3.0" },
];

export const MARGIN_PRESETS = [
  { value: "narrow", label: "좁게", desc: "상하좌우 1.27cm", top: 48, bottom: 48, left: 48, right: 48 },
  { value: "normal", label: "보통", desc: "상하 2.54cm, 좌우 3.17cm", top: 96, bottom: 96, left: 120, right: 120 },
  { value: "wide", label: "넓게", desc: "상하 2.54cm, 좌우 5.08cm", top: 96, bottom: 96, left: 192, right: 192 },
  { value: "mirrored", label: "대칭", desc: "안쪽 3.17cm, 바깥쪽 2.54cm", top: 96, bottom: 96, left: 120, right: 96 },
];

export const PAGE_SIZES = [
  { value: "a4", label: "A4", width: 794, height: 1123, desc: "210 × 297 mm" },
  { value: "letter", label: "Letter", width: 816, height: 1056, desc: "215.9 × 279.4 mm" },
  { value: "legal", label: "Legal", width: 816, height: 1344, desc: "215.9 × 355.6 mm" },
  { value: "b5", label: "B5", width: 665, height: 945, desc: "176 × 250 mm" },
];

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

export const UNDERLINE_STYLES = [
  { value: "solid", label: "───────", css: "underline" },
  { value: "double", label: "═══════", css: "underline double" },
  { value: "dotted", label: "· · · · · · ·", css: "underline dotted" },
  { value: "dashed", label: "- - - - - - -", css: "underline dashed" },
  { value: "wavy", label: "∿∿∿∿∿∿∿", css: "underline wavy" },
];

export const SPECIAL_CHARS = [
  { category: "기호", chars: ["©", "®", "™", "§", "¶", "†", "‡", "•", "‣", "⁂", "※", "℗", "℠", "℃", "℉", "Å", "Ω", "µ", "∞", "≈", "≠", "≤", "≥", "±", "×", "÷", "√", "∑", "∏", "∫", "∂", "∇", "∆"] },
  { category: "화살표", chars: ["←", "→", "↑", "↓", "↔", "↕", "⇐", "⇒", "⇑", "⇓", "⇔", "↗", "↘", "↙", "↖", "➜", "➤", "➔", "➡"] },
  { category: "도형", chars: ["■", "□", "▪", "▫", "●", "○", "◆", "◇", "▲", "△", "▼", "▽", "◀", "▶", "★", "☆", "♠", "♣", "♥", "♦", "♤", "♧", "♡", "♢"] },
  { category: "괄호", chars: ["「", "」", "『", "』", "【", "】", "〔", "〕", "〈", "〉", "《", "》", "〖", "〗", "⌜", "⌝", "⌞", "⌟"] },
  { category: "수학", chars: ["∀", "∃", "∈", "∉", "∋", "∪", "∩", "⊂", "⊃", "⊆", "⊇", "⊕", "⊗", "⊥", "∠", "∟", "∥", "⌀", "∝", "∴", "∵", "∎"] },
  { category: "통화", chars: ["₩", "¥", "€", "£", "$", "¢", "₤", "₱", "₹", "₽", "₺", "฿"] },
  { category: "한글 자모", chars: ["ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄸ", "ㄹ", "ㅀ", "ㅁ", "ㅂ", "ㅃ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"] },
];

export const HIGHLIGHT_COLORS = [
  "#fef3b5", "#fde047", "#fdba74", "#fca5a5", "#f9a8d4",
  "#d8b4fe", "#93c5fd", "#86efac", "#6ee7b7", "#99f6e4",
  "#fecaca", "#fed7aa", "#fef08a", "#bbf7d0", "#bfdbfe",
];

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

/* ── Region / Country codes for document sidebar ── */
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
