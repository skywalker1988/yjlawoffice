/** 블로그/법률 칼럼 목록 페이지 — 카테고리 필터, 페이지네이션 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import useReveal from "../hooks/useReveal";

/** 블로그 카테고리 라벨/키 매핑 */
const CATEGORY_OPTIONS = [
  { key: null, label: "전체" },
  { key: "legal_column", label: "법률 칼럼" },
  { key: "case_analysis", label: "판례 분석" },
  { key: "legal_news", label: "법률 뉴스" },
  { key: "law_guide", label: "법률 가이드" },
];

/** 카테고리 키를 한글 라벨로 변환 */
function getCategoryLabel(key) {
  const found = CATEGORY_OPTIONS.find((c) => c.key === key);
  return found ? found.label : key;
}

/** 날짜 포맷 (YYYY-MM-DD 또는 YYYY.MM.DD) */
function formatDate(dateStr) {
  if (!dateStr) return "";
  return dateStr.slice(0, 10).replace(/-/g, ".");
}

export default function BlogPage() {
  const ref = useReveal();
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  /** 게시글 목록 불러오기 */
  async function fetchPosts(page = 1, category = selectedCategory) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (category) params.set("category", category);

      const res = await api.get(`/blog?${params}`);
      setPosts(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, totalPages: 1 });
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts(1, selectedCategory);
  }, [selectedCategory]);

  function handleCategoryChange(key) {
    setSelectedCategory(key);
  }

  function handlePageChange(newPage) {
    fetchPosts(newPage, selectedCategory);
    window.scrollTo({ top: 400, behavior: "smooth" });
  }

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
            법률 칼럼
          </h1>
          <p className="font-en reveal" style={{ fontSize: 13, letterSpacing: "0.3em", color: "var(--white-40)", marginBottom: 24 }}>
            LEGAL COLUMN &amp; BLOG
          </p>
          <p className="reveal" style={{ fontSize: 15, color: "var(--white-60)", fontWeight: 300, lineHeight: 1.9 }}>
            법률 이슈와 판례 분석, 실무 가이드를 제공합니다.
          </p>
        </div>
      </section>

      {/* ==================== 카테고리 필터 ==================== */}
      <section className="section" style={{ background: "#fff" }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          <div className="flex flex-wrap justify-center gap-3 reveal" style={{ marginBottom: 48 }}>
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.key ?? "all"}
                onClick={() => handleCategoryChange(cat.key)}
                style={{
                  padding: "8px 24px",
                  fontSize: 13,
                  fontWeight: 400,
                  border: "1px solid",
                  borderColor: selectedCategory === cat.key ? "var(--accent-gold)" : "rgba(0,0,0,0.12)",
                  borderRadius: 24,
                  background: selectedCategory === cat.key ? "var(--accent-gold)" : "transparent",
                  color: selectedCategory === cat.key ? "#fff" : "var(--gray-500)",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  letterSpacing: "0.05em",
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* ==================== 게시글 목록 ==================== */}
          {loading ? (
            <div className="text-center" style={{ padding: "80px 0", color: "var(--text-muted)" }}>
              불러오는 중...
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center reveal" style={{ padding: "80px 0", color: "var(--text-muted)" }}>
              <p style={{ fontSize: 15 }}>등록된 칼럼이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="reveal group"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <article
                    style={{
                      border: "1px solid var(--border-color)",
                      borderRadius: 4,
                      overflow: "hidden",
                      transition: "all 0.3s",
                      background: "#fff",
                    }}
                    className="hover:shadow-lg"
                  >
                    {/* 썸네일 영역 */}
                    <div
                      style={{
                        height: 180,
                        background: post.thumbnailUrl
                          ? `url(${post.thumbnailUrl}) center/cover`
                          : "linear-gradient(135deg, #1a2332 0%, #2a3a4f 100%)",
                        display: "flex",
                        alignItems: "flex-end",
                        padding: 16,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 12px",
                          fontSize: 11,
                          fontWeight: 500,
                          background: "var(--accent-gold)",
                          color: "#fff",
                          borderRadius: 2,
                          letterSpacing: "0.05em",
                        }}
                      >
                        {getCategoryLabel(post.category)}
                      </span>
                    </div>

                    {/* 본문 영역 */}
                    <div style={{ padding: "20px 20px 24px" }}>
                      <h3
                        className="group-hover:text-[var(--accent-gold)] transition-colors"
                        style={{
                          fontSize: 17,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          lineHeight: 1.5,
                          marginBottom: 8,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p
                          style={{
                            fontSize: 13,
                            color: "#888",
                            lineHeight: 1.7,
                            marginBottom: 16,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between" style={{ fontSize: 12, color: "#aaa" }}>
                        <span>{post.author || "윤정 법률사무소"}</span>
                        <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}

          {/* ==================== 페이지네이션 ==================== */}
          {meta.totalPages > 1 && (
            <div className="flex justify-center gap-2" style={{ marginTop: 48 }}>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  style={{
                    width: 36,
                    height: 36,
                    fontSize: 13,
                    border: "1px solid",
                    borderColor: p === meta.page ? "var(--accent-gold)" : "rgba(0,0,0,0.1)",
                    borderRadius: 4,
                    background: p === meta.page ? "var(--accent-gold)" : "transparent",
                    color: p === meta.page ? "#fff" : "var(--gray-500)",
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
