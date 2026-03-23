/**
 * VaultPage — 문서 보관소 페이지
 * - 문서 목록 (리스트/카드 뷰), 필터링, 페이지네이션
 * - 마크다운 파일 드래그 앤 드롭 업로드
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useReveal from "../hooks/useReveal";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Stars } from "../components/Stars";
import { ALL_DOCUMENT_TYPES, getTypeLabel, getTypeColor } from "../utils/document-types";
import { STATUS_LABELS } from "../utils/constants";
import { parseAuthor } from "../utils/format";
import { api } from "../utils/api";

export default function VaultPage() {
  const navigate = useNavigate();
  const ref = useReveal();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");

  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [importanceFilter, setImportanceFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Markdown upload state
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef(null);

  // Refresh trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handle markdown file upload
  const handleMarkdownUpload = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["md", "markdown", "txt"].includes(ext)) {
      alert("마크다운(.md) 또는 텍스트(.txt) 파일만 업로드 가능합니다.");
      return;
    }

    setUploading(true);
    setUploadResult(null);
    try {
      const data = await api.upload("/documents/upload-markdown", file);

      if (data.error) {
        alert("업로드 실패: " + data.error);
      } else {
        setUploadResult(data.data);
        setShowUploadModal(true);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      alert("업로드 오류: " + err.message);
    } finally {
      setUploading(false);
    }
  }, []);

  // Handle multiple files
  const handleMultipleFiles = useCallback(async (files) => {
    for (const file of files) {
      await handleMarkdownUpload(file);
    }
  }, [handleMarkdownUpload]);

  // Drag & drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleMultipleFiles(files);
  }, [handleMultipleFiles]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const fetchDocuments = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (typeFilter) params.set("document_type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (importanceFilter) params.set("importance", importanceFilter);
    if (searchQuery) params.set("q", searchQuery);

    api.get(`/documents?${params}`)
      .then((data) => {
        setDocuments(data.data || []);
        const total = data.meta?.total || 0;
        setTotalPages(data.meta?.totalPages || Math.max(1, Math.ceil(total / limit)));
      })
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, [page, typeFilter, statusFilter, importanceFilter, searchQuery, refreshTrigger]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter, importanceFilter, searchQuery]);

  return (
    <div className="section" ref={ref}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ position: "relative" }}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(43, 87, 154, 0.12)",
          border: "3px dashed var(--accent-gold)",
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, padding: "40px 60px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)", textAlign: "center",
          }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>📄</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>마크다운 파일을 여기에 놓으세요</p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>자동으로 분석하여 문서를 생성합니다</p>
          </div>
        </div>
      )}

      {/* Upload result modal */}
      {showUploadModal && uploadResult && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={() => setShowUploadModal(false)} />
          <div style={{ position: "relative", background: "#fff", borderRadius: 10, padding: 0, maxWidth: 520, width: "92%", boxShadow: "0 16px 48px rgba(0,0,0,0.25)", maxHeight: "80vh", overflow: "auto" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>문서 자동 분석 완료</h3>
              <button onClick={() => setShowUploadModal(false)} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: "#999" }}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              {/* Document info */}
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>{uploadResult.document?.title}</h4>
                {uploadResult.document?.subtitle && <p style={{ fontSize: 12, color: "#888" }}>{uploadResult.document.subtitle}</p>}
              </div>

              {/* Analysis results */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div style={{ padding: 10, background: "#f8f9fb", borderRadius: 6 }}>
                  <p style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>문서 유형</p>
                  <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: getTypeColor(uploadResult.analysis?.documentType), color: "#fff" }}>
                    {getTypeLabel(uploadResult.analysis?.documentType)}
                  </span>
                </div>
                <div style={{ padding: 10, background: "#f8f9fb", borderRadius: 6 }}>
                  <p style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>구조</p>
                  <p style={{ fontSize: 11, color: "#333" }}>
                    {uploadResult.analysis?.structure?.wordCount?.toLocaleString()}단어,{" "}
                    {uploadResult.analysis?.structure?.estimatedPages}페이지
                  </p>
                </div>
              </div>

              {/* Keywords */}
              {uploadResult.analysis?.keywords?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 10, color: "#888", marginBottom: 6 }}>추출된 키워드</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {uploadResult.analysis.keywords.map((kw, i) => (
                      <span key={i} style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, background: "#e8ecf0", color: "#444" }}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {uploadResult.document?.tags?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 10, color: "#888", marginBottom: 6 }}>자동 생성된 태그</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {uploadResult.document.tags.map((tag, i) => (
                      <span key={i} style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, background: tag.color, color: "#fff" }}>{tag.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Structure features */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 10, color: "#888", marginBottom: 6 }}>문서 특성</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {uploadResult.analysis?.structure?.hasCodeBlocks && <span style={{ fontSize: 10, padding: "2px 6px", border: "1px solid #ddd", borderRadius: 3, color: "#666" }}>코드 블록</span>}
                  {uploadResult.analysis?.structure?.hasImages && <span style={{ fontSize: 10, padding: "2px 6px", border: "1px solid #ddd", borderRadius: 3, color: "#666" }}>이미지</span>}
                  {uploadResult.analysis?.structure?.hasTables && <span style={{ fontSize: 10, padding: "2px 6px", border: "1px solid #ddd", borderRadius: 3, color: "#666" }}>표</span>}
                  {uploadResult.analysis?.structure?.hasLinks && <span style={{ fontSize: 10, padding: "2px 6px", border: "1px solid #ddd", borderRadius: 3, color: "#666" }}>링크</span>}
                  {uploadResult.analysis?.structure?.hasFrontmatter && <span style={{ fontSize: 10, padding: "2px 6px", border: "1px solid #ddd", borderRadius: 3, color: "#666" }}>프론트매터</span>}
                  <span style={{ fontSize: 10, padding: "2px 6px", border: "1px solid #ddd", borderRadius: 3, color: "#666" }}>제목 {uploadResult.analysis?.structure?.headingCount}개</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setShowUploadModal(false)}
                  style={{ padding: "8px 16px", border: "1px solid #ddd", borderRadius: 6, background: "#fff", fontSize: 12, cursor: "pointer" }}>닫기</button>
                <button onClick={() => { setShowUploadModal(false); navigate(`/vault/${uploadResult.document?.id}`); }}
                  style={{ padding: "8px 16px", border: "none", borderRadius: 6, background: "var(--accent-gold)", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>문서 열기</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container">
        {/* Header */}
        <div
          className="reveal flex items-end justify-between flex-wrap gap-4"
          style={{ marginBottom: 40 }}
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
              VAULT
            </p>
            <h1
              className="font-serif"
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: 300,
                color: "var(--text-primary)",
              }}
            >
              문서관리함
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              {uploading ? "분석 중..." : "📄 마크다운 업로드"}
            </Button>
            <input ref={fileInputRef} type="file" accept=".md,.markdown,.txt" multiple
              onChange={(e) => handleMultipleFiles(Array.from(e.target.files))}
              style={{ display: "none" }} />
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              목록
            </Button>
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("card")}
            >
              카드
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div
          className="reveal flex flex-wrap gap-3 items-center"
          style={{ marginBottom: 32 }}
        >
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ width: 140 }}
          >
            <option value="">모든 유형</option>
            {ALL_DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {getTypeLabel(t)}
              </option>
            ))}
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 140 }}
          >
            <option value="">모든 상태</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>

          <Select
            value={importanceFilter}
            onChange={(e) => setImportanceFilter(e.target.value)}
            style={{ width: 140 }}
          >
            <option value="">중요도</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {"★".repeat(n)}
              </option>
            ))}
          </Select>

          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="제목, 저자 검색..."
            style={{ width: 220 }}
          />
        </div>

        {/* Loading */}
        {loading && (
          <p style={{ textAlign: "center", color: "#999", padding: 40 }}>
            불러오는 중...
          </p>
        )}

        {/* List View */}
        {!loading && viewMode === "list" && (
          <div className="stagger">
            {documents.length === 0 && (
              <p style={{ textAlign: "center", color: "#999", padding: 40 }}>
                문서가 없습니다.
              </p>
            )}
            {documents.map((doc) => (
              <Link
                key={doc.id}
                to={`/vault/${doc.id}`}
                className="reveal block group transition-colors duration-200 hover:bg-[var(--bg-secondary)]"
                style={{
                  padding: "18px 20px",
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
                      fontSize: 10,
                    }}
                  >
                    {getTypeLabel(doc.documentType)}
                  </Badge>
                  <span
                    className="group-hover:text-[var(--accent-gold)] transition-colors"
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      flex: 1,
                      color: "var(--text-primary)",
                    }}
                  >
                    {doc.title}
                  </span>
                  {doc.importance && <Stars rating={doc.importance} />}
                  <span style={{ fontSize: 12, color: "#aaa" }}>
                    {STATUS_LABELS[doc.status] || doc.status}
                  </span>
                  <span
                    className="font-en"
                    style={{ fontSize: 11, color: "#ccc" }}
                  >
                    {doc.createdAt
                      ? new Date(doc.createdAt).toLocaleDateString("ko-KR")
                      : ""}
                  </span>
                </div>
                {(doc.author || doc.tags?.length > 0) && (
                  <div className="flex gap-2 mt-1 items-center flex-wrap">
                    {doc.author && (
                      <span style={{ fontSize: 12, color: "#999" }}>
                        {parseAuthor(doc.author)}
                      </span>
                    )}
                    {doc.tags?.slice(0, 5).map((tag, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 10,
                          color: "#aaa",
                          border: "1px solid rgba(0,0,0,0.08)",
                          padding: "0px 6px",
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
        )}

        {/* Card View */}
        {!loading && viewMode === "card" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
            {documents.length === 0 && (
              <p
                style={{
                  textAlign: "center",
                  color: "#999",
                  padding: 40,
                  gridColumn: "1 / -1",
                }}
              >
                문서가 없습니다.
              </p>
            )}
            {documents.map((doc) => (
              <Link
                key={doc.id}
                to={`/vault/${doc.id}`}
                className="reveal block group transition-all duration-300 hover:shadow-md"
                style={{
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.06)",
                  padding: 24,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    style={{
                      backgroundColor: getTypeColor(doc.documentType),
                      color: "#fff",
                    }}
                  >
                    {getTypeLabel(doc.documentType)}
                  </Badge>
                  <span style={{ fontSize: 11, color: "#aaa", marginLeft: "auto" }}>
                    {STATUS_LABELS[doc.status] || doc.status}
                  </span>
                </div>
                <h3
                  className="group-hover:text-[var(--accent-gold)] transition-colors"
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    marginBottom: 8,
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {doc.title}
                </h3>
                {doc.author && (
                  <p style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
                    {parseAuthor(doc.author)}
                  </p>
                )}
                <div className="flex items-center justify-between mt-auto">
                  {doc.importance && <Stars rating={doc.importance} />}
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
                  <div className="flex gap-1 mt-3 flex-wrap">
                    {doc.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: 10,
                          color: "#aaa",
                          border: "1px solid rgba(0,0,0,0.08)",
                          padding: "1px 6px",
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
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex justify-center items-center gap-2"
            style={{ marginTop: 48 }}
          >
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              이전
            </Button>
            <span style={{ fontSize: 13, color: "#999", padding: "0 12px" }}>
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              다음
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
