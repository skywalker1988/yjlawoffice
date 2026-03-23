/** HomePage — 대시보드 + 실시간 검색 페이지 */
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import useReveal from "../hooks/useReveal";
import { Badge } from "../components/ui/Badge";
import { getTypeLabel, getTypeColor } from "../utils/document-types";
import { api } from "../utils/api";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const heroVideo = localStorage.getItem("heroVideo") || "/hero-video.mp4";
  const navigate = useNavigate();
  const ref = useReveal();
  const debounceRef = useRef(null);

  // Dashboard data
  useEffect(() => {
    api.get("/dashboard")
      .then((json) => setDashboard(json.data ?? null))
      .catch(() => setDashboard(null));
  }, []);

  // Debounced search
  const handleSearch = useCallback((value) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      api.get(`/documents/search?q=${encodeURIComponent(value)}`)
        .then((json) => {
          const results = json.data ?? json;
          setSearchResults(Array.isArray(results) ? results.slice(0, 8) : []);
        })
        .catch(() => setSearchResults([]));
    }, 500);
  }, []);

  const selectResult = (doc) => {
    setQuery("");
    setSearchResults([]);
    navigate(`/vault/${doc.id}`);
  };

  const stats = dashboard
    ? (() => {
        const statusMap = {};
        if (Array.isArray(dashboard.byStatus)) {
          dashboard.byStatus.forEach((s) => { statusMap[s.status] = s.count; });
        }
        return {
          total: dashboard.totalDocuments ?? 0,
          thisWeek: dashboard.thisWeek ?? 0,
          reading: statusMap.reading ?? 0,
          completed: statusMap.completed ?? 0,
        };
      })()
    : null;

  return (
    <div ref={ref}>
      {/* ==================== HERO ==================== */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ height: "100vh", minHeight: 700 }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.7) contrast(1.15) saturate(0.9)" }}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.5) 100%)",
          }}
        />

        <div
          className="relative text-center"
          style={{ maxWidth: 720, padding: "0 24px", zIndex: 2 }}
        >
          <div className="sep mx-auto reveal" style={{ marginBottom: 48 }} />

          <h1
            className="font-serif reveal"
            style={{
              fontSize: "clamp(3rem, 7vw, 5rem)",
              fontWeight: 300,
              letterSpacing: "0.35em",
              color: "#fff",
              marginBottom: 14,
              lineHeight: 1.1,
            }}
          >
            SECOND BRAIN
          </h1>
          <p
            className="font-en reveal"
            style={{
              fontSize: "0.85rem",
              letterSpacing: "0.3em",
              color: "rgba(255,255,255,0.4)",
              marginBottom: 44,
              fontWeight: 400,
            }}
          >
            KNOWLEDGE SYSTEM
          </p>
          <p
            className="font-serif-kr reveal"
            style={{
              fontSize: "1.1rem",
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.9,
              marginBottom: 52,
              fontWeight: 300,
            }}
          >
            지식의 바다를 항해하는 당신의 나침반
          </p>

          {/* Search bar */}
          <div
            className="reveal"
            style={{
              maxWidth: 520,
              margin: "0 auto 52px",
              position: "relative",
            }}
          >
            <div
              className="transition-all duration-300"
              style={{
                display: "flex",
                alignItems: "center",
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${
                  searchFocused
                    ? "rgba(255,255,255,0.35)"
                    : "rgba(255,255,255,0.12)"
                }`,
                backdropFilter: "blur(8px)",
              }}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
                style={{ marginLeft: 20, flexShrink: 0 }}
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() =>
                  setTimeout(() => {
                    setSearchFocused(false);
                    setSearchResults([]);
                  }, 200)
                }
                placeholder="법령, 판례, 논문을 검색하세요"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  padding: "16px 20px",
                  fontSize: 14,
                  color: "#fff",
                  outline: "none",
                  fontFamily: "var(--font-sans-kr)",
                  fontWeight: 300,
                }}
              />
            </div>
            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div
                className="absolute left-0 right-0 top-full mt-1"
                style={{
                  background: "rgba(20,20,20,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(12px)",
                  zIndex: 10,
                  maxHeight: 360,
                  overflowY: "auto",
                }}
              >
                {searchResults.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => selectResult(doc)}
                    className="block w-full text-left transition-colors duration-200 hover:bg-[rgba(255,255,255,0.06)]"
                    style={{
                      padding: "12px 20px",
                      fontSize: 13,
                      color: "rgba(255,255,255,0.7)",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        color: getTypeColor(doc.documentType),
                        fontSize: 10,
                        marginRight: 8,
                      }}
                    >
                      [{getTypeLabel(doc.documentType)}]
                    </span>
                    {doc.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/vault"
            className="view-more reveal"
            style={{ color: "#fff" }}
          >
            문서관리함 보기
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          style={{ zIndex: 2 }}
        >
          <span
            className="font-en"
            style={{
              fontSize: 9,
              letterSpacing: "0.25em",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            SCROLL DOWN
          </span>
          <div className="scroll-anim">
            <svg
              width="14"
              height="22"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1.2"
              viewBox="0 0 14 22"
            >
              <rect x="1" y="1" width="12" height="20" rx="6" />
              <line x1="7" y1="5" x2="7" y2="9" />
            </svg>
          </div>
        </div>
      </section>

      {/* ==================== Gradient Transition ==================== */}
      <div
        style={{
          height: 120,
          background: "linear-gradient(to bottom, #0a0a0a, #ffffff)",
        }}
      />

      {/* ==================== DASHBOARD ==================== */}
      <section className="section" style={{ background: "#fff" }}>
        <div className="container">
          {/* Stats Row */}
          {stats && (
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-5 stagger"
              style={{ marginBottom: 56 }}
            >
              {[
                { label: "전체 문서 수", value: stats.total, icon: "📚" },
                { label: "이번주 추가", value: stats.thisWeek, icon: "📝" },
                { label: "읽는 중", value: stats.reading, icon: "📖" },
                { label: "완독", value: stats.completed, icon: "✅" },
              ].map((s, i) => (
                <div
                  key={i}
                  className="reveal"
                  style={{
                    background: "#f9f9f8",
                    border: "1px solid rgba(0,0,0,0.06)",
                    padding: "28px 24px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</p>
                  <p
                    className="font-serif"
                    style={{
                      fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
                      fontWeight: 300,
                      color: "#1a1a1a",
                    }}
                  >
                    {s.value}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      color: "#999",
                      marginTop: 4,
                      fontWeight: 300,
                    }}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Recent Documents */}
          {dashboard?.recentDocuments?.length > 0 && (
            <div style={{ marginBottom: 56 }}>
              <div
                className="flex items-end justify-between reveal"
                style={{ marginBottom: 32 }}
              >
                <div>
                  <p
                    className="font-en"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.25em",
                      color: "var(--accent-gold)",
                      marginBottom: 14,
                    }}
                  >
                    RECENT
                  </p>
                  <h2
                    className="font-serif"
                    style={{
                      fontSize: "clamp(1.5rem, 3vw, 2rem)",
                      fontWeight: 300,
                      color: "#1a1a1a",
                    }}
                  >
                    최근 문서
                  </h2>
                </div>
                <Link
                  to="/vault"
                  className="view-more hidden sm:inline-flex"
                >
                  MORE{" "}
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="stagger">
                {dashboard.recentDocuments.slice(0, 5).map((doc) => (
                  <Link
                    key={doc.id}
                    to={`/vault/${doc.id}`}
                    className="reveal group block cursor-pointer transition-colors duration-300 hover:bg-[#fafaf9]"
                    style={{
                      padding: "20px",
                      margin: "0 -20px",
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge
                        style={{
                          backgroundColor: getTypeColor(doc.documentType),
                          color: "#fff",
                        }}
                      >
                        {getTypeLabel(doc.documentType)}
                      </Badge>
                      <h3
                        className="group-hover:text-[var(--accent-gold)] transition-colors duration-300"
                        style={{
                          fontSize: "1rem",
                          fontWeight: 500,
                          color: "#1a1a1a",
                          flex: 1,
                        }}
                      >
                        {doc.title}
                      </h3>
                      <span
                        className="font-en"
                        style={{ fontSize: 11, color: "#ccc" }}
                      >
                        {doc.createdAt
                          ? new Date(doc.createdAt).toLocaleDateString("ko-KR")
                          : ""}
                      </span>
                    </div>
                    {doc.tags?.length > 0 && (
                      <div
                        className="flex gap-1 mt-2 flex-wrap"
                        style={{ marginLeft: 0 }}
                      >
                        {doc.tags.slice(0, 4).map((tag, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 10,
                              color: "#999",
                              border: "1px solid rgba(0,0,0,0.08)",
                              padding: "1px 8px",
                              borderRadius: 2,
                            }}
                          >
                            {typeof tag === "string" ? tag : tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Top Tags */}
          {dashboard?.topTags?.length > 0 && (
            <div className="reveal">
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#999",
                  marginBottom: 16,
                  letterSpacing: "0.05em",
                }}
              >
                인기 태그
              </h3>
              <div className="flex flex-wrap gap-2">
                {dashboard.topTags.map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-block",
                      padding: "6px 16px",
                      fontSize: 13,
                      color: "#666",
                      background: "#f5f5f3",
                      border: "1px solid rgba(0,0,0,0.06)",
                      borderRadius: 20,
                      fontWeight: 300,
                    }}
                  >
                    {tag.name || tag}{" "}
                    {tag.count != null && (
                      <span style={{ color: "#bbb", fontSize: 11 }}>
                        ({tag.count})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
