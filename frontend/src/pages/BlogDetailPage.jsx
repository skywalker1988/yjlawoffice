/** 블로그 상세 페이지 — 개별 게시글 조회 (마크다운 렌더링) */
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { api } from "../utils/api";
import useReveal from "../hooks/useReveal";

/** 카테고리 키를 한글 라벨로 변환 */
const CATEGORY_LABELS = {
  legal_column: "법률 칼럼",
  case_analysis: "판례 분석",
  legal_news: "법률 뉴스",
  law_guide: "법률 가이드",
};

/** 날짜 포맷 */
function formatDate(dateStr) {
  if (!dateStr) return "";
  return dateStr.slice(0, 10).replace(/-/g, ".");
}

export default function BlogDetailPage() {
  const { slug } = useParams();
  const ref = useReveal();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPost() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/blog/${slug}`);
        setPost(res.data);
      } catch (e) {
        setError(e.message || "게시글을 불러올 수 없습니다");
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
        불러오는 중...
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ fontSize: 16, color: "#999" }}>{error || "게시글을 찾을 수 없습니다"}</p>
        <Link to="/blog" style={{ color: "var(--accent-gold)", fontSize: 14 }}>목록으로 돌아가기</Link>
      </div>
    );
  }

  /** 마크다운 콘텐츠를 HTML로 변환 (XSS 방지를 위해 DOMPurify 적용) */
  const contentHtml = DOMPurify.sanitize(marked.parse(post.content || "", { breaks: true }));

  return (
    <div ref={ref}>
      {/* ==================== 히어로 ==================== */}
      <section
        className="relative flex items-center justify-center"
        style={{
          height: "50vh",
          minHeight: 360,
          background: post.thumbnailUrl
            ? `linear-gradient(rgba(15,25,35,0.7), rgba(15,25,35,0.85)), url(${post.thumbnailUrl}) center/cover`
            : "linear-gradient(135deg, #0f1923 0%, #1a2332 50%, #0f1923 100%)",
        }}
      >
        <div className="relative text-center" style={{ maxWidth: 800, padding: "0 24px", zIndex: 2 }}>
          <div className="sep mx-auto reveal" style={{ marginBottom: 32 }} />
          <span
            className="reveal"
            style={{
              display: "inline-block",
              padding: "4px 16px",
              fontSize: 12,
              background: "var(--accent-gold)",
              color: "#fff",
              borderRadius: 2,
              marginBottom: 20,
              letterSpacing: "0.05em",
            }}
          >
            {CATEGORY_LABELS[post.category] || post.category}
          </span>
          <h1
            className="font-serif reveal"
            style={{ fontSize: "clamp(1.5rem, 4vw, 2.8rem)", fontWeight: 300, letterSpacing: "0.08em", color: "#fff", lineHeight: 1.6, marginBottom: 20 }}
          >
            {post.title}
          </h1>
          <div className="reveal flex items-center justify-center gap-6" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            <span>{post.author || "윤정 법률사무소"}</span>
            <span style={{ width: 1, height: 12, background: "rgba(255,255,255,0.2)" }} />
            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
            <span style={{ width: 1, height: 12, background: "rgba(255,255,255,0.2)" }} />
            <span>조회 {post.viewCount || 0}</span>
          </div>
        </div>
      </section>

      {/* ==================== 본문 ==================== */}
      <section className="section" style={{ background: "#fff" }}>
        <div className="container" style={{ maxWidth: 760 }}>
          {/* 본문 콘텐츠 — 마크다운 HTML 렌더링 */}
          <article
            className="reveal"
            style={{
              fontSize: 16,
              lineHeight: 2,
              color: "#333",
              wordBreak: "keep-all",
            }}
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          {/* 구분선 + 목록 링크 */}
          <div className="reveal" style={{ borderTop: "1px solid rgba(0,0,0,0.08)", marginTop: 64, paddingTop: 32, textAlign: "center" }}>
            <Link
              to="/blog"
              className="inline-block font-en transition-all duration-300 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]"
              style={{
                border: "1px solid rgba(0,0,0,0.15)",
                color: "#666",
                padding: "12px 40px",
                fontSize: 12,
                letterSpacing: "0.15em",
                textDecoration: "none",
              }}
            >
              목록으로 돌아가기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
