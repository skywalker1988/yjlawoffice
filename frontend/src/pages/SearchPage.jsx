/** SearchPage — FTS5 전문 검색 페이지 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import {
  TYPE_CONFIG,
  ALL_DOCUMENT_TYPES,
  getTypeLabel,
  getTypeColor,
} from "../utils/document-types";
import { api } from "../utils/api";

/** FTS5 스니펫에서 <mark> 태그만 허용하는 HTML 정제 함수 */
function sanitizeSnippet(html) {
  if (!html) return "";
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: ["mark"] });
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const debounceRef = useRef(null);

  const doSearch = useCallback(
    (q) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      const params = new URLSearchParams();
      params.set("q", q);
      params.set("limit", "50");
      if (typeFilter) params.set("type", typeFilter);

      api.get(`/documents/search?${params}`)
        .then((data) => {
          setResults(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    },
    [typeFilter]
  );

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query);
      if (query) {
        setSearchParams({ q: query }, { replace: true });
      }
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch, setSearchParams]);

  // 타입 필터 변경 시 즉시 재검색 (디바운스 없이)
  const prevTypeFilter = useRef(typeFilter);
  useEffect(() => {
    if (prevTypeFilter.current !== typeFilter) {
      prevTypeFilter.current = typeFilter;
      if (query.trim()) doSearch(query);
    }
  }, [typeFilter, query, doSearch]);

  const filteredResults = typeFilter
    ? results.filter((r) => r.documentType === typeFilter)
    : results;

  return (
    <div className="section">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <p
            className="font-en"
            style={{
              fontSize: 11,
              letterSpacing: "0.25em",
              color: "var(--accent-gold)",
              marginBottom: 14,
            }}
          >
            SEARCH
          </p>
          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 300,
              color: "var(--text-primary)",
              marginBottom: 24,
            }}
          >
            문서 검색
          </h1>

          {/* Search input */}
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="법령, 판례, 논문을 검색하세요..."
            style={{ maxWidth: 600, fontSize: 15, height: 44 }}
            autoFocus
          />
        </div>

        {/* Type filter chips */}
        <div className="flex flex-wrap gap-2" style={{ marginBottom: 32 }}>
          <button
            onClick={() => setTypeFilter("")}
            style={{
              padding: "6px 16px",
              fontSize: 12,
              borderRadius: 20,
              border: `1px solid ${!typeFilter ? "var(--accent-gold)" : "rgba(0,0,0,0.1)"}`,
              background: !typeFilter ? "var(--accent-gold)" : "transparent",
              color: !typeFilter ? "#fff" : "#666",
              cursor: "pointer",
            }}
          >
            전체
          </button>
          {ALL_DOCUMENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type === typeFilter ? "" : type)}
              style={{
                padding: "6px 16px",
                fontSize: 12,
                borderRadius: 20,
                border: `1px solid ${
                  typeFilter === type ? getTypeColor(type) : "rgba(0,0,0,0.1)"
                }`,
                background:
                  typeFilter === type ? getTypeColor(type) : "transparent",
                color: typeFilter === type ? "#fff" : "#666",
                cursor: "pointer",
              }}
            >
              {getTypeLabel(type)}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <p style={{ color: "#999", padding: 20, textAlign: "center" }}>
            검색 중...
          </p>
        )}

        {/* Results */}
        {!loading && query.trim() && filteredResults.length === 0 && (
          <p style={{ color: "#999", padding: 40, textAlign: "center" }}>
            검색 결과가 없습니다.
          </p>
        )}

        {!loading && filteredResults.length > 0 && (
          <div>
            <p style={{ fontSize: 13, color: "#999", marginBottom: 16 }}>
              {filteredResults.length}건의 결과
            </p>
            {filteredResults.map((doc) => (
              <div
                key={doc.id}
                onClick={() => navigate(`/vault/${doc.id}`)}
                className="group cursor-pointer transition-colors duration-200 hover:bg-[var(--bg-secondary)]"
                style={{
                  padding: "18px 20px",
                  margin: "0 -20px",
                  borderBottom: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <Badge
                    style={{
                      backgroundColor: getTypeColor(doc.documentType),
                      color: "#fff",
                      fontSize: 10,
                    }}
                  >
                    {getTypeLabel(doc.documentType)}
                  </Badge>
                  {doc.title_snippet ? (
                    <span
                      className="group-hover:text-[var(--accent-gold)] transition-colors"
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        flex: 1,
                      }}
                      dangerouslySetInnerHTML={{ __html: sanitizeSnippet(doc.title_snippet) }}
                    />
                  ) : (
                    <span
                      className="group-hover:text-[var(--accent-gold)] transition-colors"
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        flex: 1,
                      }}
                    >
                      {doc.title}
                    </span>
                  )}
                  <span className="font-en" style={{ fontSize: 11, color: "#ccc" }}>
                    {doc.createdAt
                      ? new Date(doc.createdAt).toLocaleDateString("ko-KR")
                      : ""}
                  </span>
                </div>
                {doc.content_snippet && (
                  <p
                    style={{
                      fontSize: 13,
                      color: "#888",
                      lineHeight: 1.7,
                      marginTop: 4,
                    }}
                    dangerouslySetInnerHTML={{ __html: sanitizeSnippet(doc.content_snippet) }}
                  />
                )}
                {doc.summary && !doc.content_snippet && (
                  <p
                    style={{
                      fontSize: 13,
                      color: "#888",
                      lineHeight: 1.7,
                      marginTop: 4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {doc.summary}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !query.trim() && (
          <div style={{ textAlign: "center", padding: 60, color: "#ccc" }}>
            <svg
              width="48"
              height="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              viewBox="0 0 24 24"
              style={{ margin: "0 auto 16px" }}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p style={{ fontSize: 15 }}>검색어를 입력하세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
