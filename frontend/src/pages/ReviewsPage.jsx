/** 의뢰인 후기 페이지 — 공개 리뷰 목록, 별점, 카테고리 필터, 페이지네이션 */
import { useState, useEffect, useCallback } from "react";
import useReveal from "../hooks/useReveal";
import { api } from "../utils/api";

const T = { accent: "#b08d57", accentDim: "rgba(176,141,87,0.08)", text: "#1e293b", textSec: "#475569", textMuted: "#94a3b8", border: "#e5e8ed", card: "#ffffff" };

const CATEGORIES = [
  { value: "", label: "전체" },
  { value: "civil", label: "민사" },
  { value: "criminal", label: "형사" },
  { value: "family", label: "가사" },
  { value: "admin", label: "행정" },
  { value: "tax", label: "조세" },
  { value: "realestate", label: "부동산" },
  { value: "corporate", label: "기업법무" },
];

const ITEMS_PER_PAGE = 6;

/** 별점 렌더링 (filled/empty) */
function Stars({ rating, size = 18, color = T.accent }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ fontSize: size, color: i <= rating ? color : "#ddd", lineHeight: 1 }}>
          {i <= rating ? "\u2605" : "\u2606"}
        </span>
      ))}
    </span>
  );
}

/** 카테고리 라벨 변환 */
function categoryLabel(value) {
  const found = CATEGORIES.find((c) => c.value === value);
  return found ? found.label : value;
}

export default function ReviewsPage() {
  const ref = useReveal();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [averageRating, setAverageRating] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: ITEMS_PER_PAGE });
      if (category) params.set("category", category);
      const json = await api.get(`/reviews?${params}`);
      setReviews(json.data ?? []);
      setTotalPages(json.meta?.totalPages ?? 1);
      setTotalCount(json.meta?.total ?? 0);
      if (json.meta?.averageRating != null) {
        setAverageRating(json.meta.averageRating);
      }
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [category, page]);

  useEffect(() => { load(); }, [load]);

  /** 카테고리 변경 시 첫 페이지로 초기화 */
  const handleCategory = (val) => {
    setCategory(val);
    setPage(1);
  };

  return (
    <div ref={ref}>
      {/* ==================== 히어로 ==================== */}
      <section
        className="relative flex items-center justify-center"
        style={{
          height: "60vh",
          minHeight: 400,
          background: "linear-gradient(135deg, #0f1923 0%, #1a2332 50%, #0f1923 100%)",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <div className="reveal" style={{ opacity: 0, transform: "translateY(30px)", transition: "all 0.8s ease" }}>
          <p style={{ fontSize: 13, letterSpacing: 4, color: T.accent, marginBottom: 16, fontWeight: 500 }}>
            CLIENT REVIEWS
          </p>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 300, fontFamily: "'Noto Serif KR', serif", lineHeight: 1.3, marginBottom: 16 }}>
            의뢰인 후기
          </h1>
          <div style={{ width: 48, height: 1, background: T.accent, margin: "0 auto 24px" }} />
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 500, margin: "0 auto" }}>
            윤정 법률사무소를 경험하신 의뢰인의 생생한 후기입니다
          </p>
        </div>
      </section>

      {/* ==================== 평균 별점 ==================== */}
      <section style={{ background: "#faf9f6", padding: "48px 24px", textAlign: "center" }}>
        <div className="reveal" style={{ opacity: 0, transform: "translateY(20px)", transition: "all 0.6s ease" }}>
          <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 8 }}>평균 만족도</p>
          <div style={{ fontSize: 42, fontWeight: 300, color: T.text, marginBottom: 8, fontFamily: "'Noto Serif KR', serif" }}>
            {averageRating ? averageRating.toFixed(1) : "-"}
          </div>
          <Stars rating={Math.round(averageRating)} size={24} />
          <p style={{ fontSize: 13, color: T.textMuted, marginTop: 8 }}>총 {totalCount}건의 후기</p>
        </div>
      </section>

      {/* ==================== 카테고리 필터 ==================== */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 0" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => handleCategory(c.value)}
              style={{
                padding: "8px 20px",
                fontSize: 13,
                fontWeight: category === c.value ? 600 : 400,
                color: category === c.value ? "#fff" : T.textSec,
                background: category === c.value ? T.accent : "transparent",
                border: `1px solid ${category === c.value ? T.accent : T.border}`,
                borderRadius: 20,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* ==================== 리뷰 카드 ==================== */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 60px" }}>
        {loading ? (
          <p style={{ textAlign: "center", color: T.textMuted, padding: 60 }}>로딩 중...</p>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, color: T.textMuted }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>&#x1F4DD;</p>
            <p>등록된 후기가 없습니다</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {reviews.map((r) => (
              <div
                key={r.id}
                className="reveal"
                style={{
                  opacity: 0,
                  transform: "translateY(20px)",
                  transition: "all 0.5s ease",
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  padding: 28,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Stars rating={r.rating} />
                  {r.category && (
                    <span style={{
                      fontSize: 11, padding: "3px 10px", borderRadius: 10,
                      background: T.accentDim, color: T.accent, fontWeight: 500,
                    }}>
                      {categoryLabel(r.category)}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 14, color: T.text, lineHeight: 1.7, marginBottom: 16, minHeight: 60 }}>
                  {r.content}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: T.textSec }}>
                    {r.isAnonymous ? "익명" : r.clientName}
                  </span>
                  <span style={{ fontSize: 11, color: T.textMuted }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString("ko-KR") : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================== 페이지네이션 ==================== */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40 }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              style={{
                padding: "8px 14px", fontSize: 13, border: `1px solid ${T.border}`,
                borderRadius: 4, background: "#fff", cursor: page <= 1 ? "default" : "pointer",
                opacity: page <= 1 ? 0.4 : 1,
              }}
            >
              &#8592; 이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  padding: "8px 14px", fontSize: 13, border: `1px solid ${p === page ? T.accent : T.border}`,
                  borderRadius: 4, background: p === page ? T.accent : "#fff",
                  color: p === page ? "#fff" : T.text, cursor: "pointer", fontWeight: p === page ? 600 : 400,
                }}
              >
                {p}
              </button>
            ))}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              style={{
                padding: "8px 14px", fontSize: 13, border: `1px solid ${T.border}`,
                borderRadius: 4, background: "#fff", cursor: page >= totalPages ? "default" : "pointer",
                opacity: page >= totalPages ? 0.4 : 1,
              }}
            >
              다음 &#8594;
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
