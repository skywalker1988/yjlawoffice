/** 성공 사례 페이지 — 카테고리별 사례 목록, 결과 배지 */
import { useState, useEffect } from "react";
import { api } from "../utils/api";
import useReveal from "../hooks/useReveal";

/** 사례 카테고리 필터 옵션 */
const CATEGORY_OPTIONS = [
  { key: null, label: "전체" },
  { key: "civil", label: "민사" },
  { key: "criminal", label: "형사" },
  { key: "family", label: "가사" },
  { key: "administrative", label: "행정" },
  { key: "tax", label: "조세" },
  { key: "real_estate", label: "부동산" },
  { key: "corporate", label: "기업법무" },
];

/** 카테고리 키를 한글 라벨로 변환 */
function getCategoryLabel(key) {
  const found = CATEGORY_OPTIONS.find((c) => c.key === key);
  return found ? found.label : key;
}

/** 결과 배지 색상 매핑 — 결과 텍스트에 따라 배경색 반환 */
const RESULT_COLORS = {
  "승소": "#2563eb",
  "일부승소": "#3b82f6",
  "합의": "#059669",
  "불기소": "#7c3aed",
  "무죄": "#2563eb",
  "감형": "#6366f1",
  "기각": "#dc2626",
  "조정성립": "#059669",
  "인용": "#2563eb",
};

function getResultColor(result) {
  return RESULT_COLORS[result] || "var(--accent-gold)";
}

export default function CasesPage() {
  const ref = useReveal();
  const [cases, setCases] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  /** 사례 목록 불러오기 */
  async function fetchCases(category = selectedCategory) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (category) params.set("category", category);

      const res = await api.get(`/cases?${params}`);
      setCases(res.data || []);
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCases(selectedCategory);
  }, [selectedCategory]);

  return (
    <div ref={ref}>
      {/* ==================== 히어로 ==================== */}
      <section
        className="relative flex items-center justify-center"
        style={{
          height: "60vh",
          minHeight: 400,
          background: "linear-gradient(135deg, #0f1923 0%, #1a2332 50%, #0f1923 100%)",
        }}
      >
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)" }} />
        <div className="relative text-center" style={{ maxWidth: 700, padding: "0 24px", zIndex: 2 }}>
          <div className="sep mx-auto reveal" style={{ marginBottom: 40 }} />
          <h1
            className="font-serif reveal"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 300, letterSpacing: "0.2em", color: "#fff", marginBottom: 16 }}
          >
            성공 사례
          </h1>
          <p className="font-en reveal" style={{ fontSize: 13, letterSpacing: "0.3em", color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
            SUCCESS CASES
          </p>
          <p className="reveal" style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", fontWeight: 300, lineHeight: 1.9 }}>
            윤정 법률사무소의 주요 성공 사례를 소개합니다.
          </p>
        </div>
      </section>

      {/* ==================== 카테고리 필터 + 사례 목록 ==================== */}
      <section className="section" style={{ background: "#fff" }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          {/* 카테고리 필터 칩 */}
          <div className="flex flex-wrap justify-center gap-3 reveal" style={{ marginBottom: 48 }}>
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.key ?? "all"}
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  padding: "8px 24px",
                  fontSize: 13,
                  fontWeight: 400,
                  border: "1px solid",
                  borderColor: selectedCategory === cat.key ? "var(--accent-gold)" : "rgba(0,0,0,0.12)",
                  borderRadius: 24,
                  background: selectedCategory === cat.key ? "var(--accent-gold)" : "transparent",
                  color: selectedCategory === cat.key ? "#fff" : "#666",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  letterSpacing: "0.05em",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 사례 목록 */}
          {loading ? (
            <div className="text-center" style={{ padding: "80px 0", color: "#999" }}>
              불러오는 중...
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center reveal" style={{ padding: "80px 0", color: "#999" }}>
              <p style={{ fontSize: 15 }}>등록된 성공 사례가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cases.map((item) => (
                <article
                  key={item.id}
                  className="reveal hover:shadow-lg"
                  style={{
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 4,
                    padding: "28px 28px 24px",
                    background: "#fff",
                    transition: "all 0.3s",
                  }}
                >
                  {/* 상단: 카테고리 + 결과 배지 */}
                  <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#999",
                        fontWeight: 500,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {getCategoryLabel(item.category)}
                    </span>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 14px",
                        fontSize: 12,
                        fontWeight: 600,
                        background: getResultColor(item.result),
                        color: "#fff",
                        borderRadius: 2,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {item.result}
                    </span>
                  </div>

                  {/* 제목 */}
                  <h3 style={{ fontSize: 17, fontWeight: 600, color: "#1a1a1a", lineHeight: 1.5, marginBottom: 12 }}>
                    {item.title}
                  </h3>

                  {/* 요약 */}
                  <p style={{ fontSize: 14, color: "#666", lineHeight: 1.8 }}>
                    {item.summary}
                  </p>

                  {/* 상세 내용 (있을 경우) */}
                  {item.detail && (
                    <details style={{ marginTop: 16 }}>
                      <summary
                        style={{
                          fontSize: 13,
                          color: "var(--accent-gold)",
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >
                        상세 내용 보기
                      </summary>
                      <p style={{ fontSize: 13, color: "#888", lineHeight: 1.8, marginTop: 12, paddingLeft: 12, borderLeft: "2px solid var(--accent-gold)" }}>
                        {item.detail}
                      </p>
                    </details>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
