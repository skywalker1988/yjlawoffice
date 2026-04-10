/**
 * VaultPage — 문서 보관소 페이지 (메인 구성)
 * - 문서 목록 (리스트/카드 뷰), 필터링, 페이지네이션
 * - 마크다운 파일 드래그 앤 드롭 업로드
 */
import { useState, useEffect, useCallback, useRef } from "react";
import useReveal from "../../hooks/useReveal";
import { Button } from "../../components/ui/Button";
import { api } from "../../utils/api";
import { showToast } from "../../utils/showToast";
import { PAGE_LIMIT, SEARCH_DEBOUNCE_MS, ALLOWED_UPLOAD_EXTENSIONS } from "./vaultConstants";
import VaultFilters from "./VaultFilters";
import VaultDocumentList from "./VaultDocumentList";
import VaultUploadModal from "./VaultUploadModal";

export default function VaultPage() {
  const ref = useReveal();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");

  // 필터 상태
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [importanceFilter, setImportanceFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const searchDebounceRef = useRef(null);

  // 업로드 상태
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef(null);

  // 페이지네이션
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 검색어 디바운스
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearchQuery(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchQuery]);

  // 마크다운 파일 업로드 처리
  const handleMarkdownUpload = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_UPLOAD_EXTENSIONS.includes(ext)) {
      showToast("마크다운(.md) 또는 텍스트(.txt) 파일만 업로드 가능합니다.");
      return;
    }

    setUploading(true);
    setUploadResult(null);
    try {
      const data = await api.upload("/documents/upload-markdown", file);
      if (data.error) {
        showToast("업로드 실패: " + data.error);
      } else {
        setUploadResult(data.data);
        setShowUploadModal(true);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) {
      showToast("업로드 오류: " + err.message);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleMultipleFiles = useCallback(async (files) => {
    for (const file of files) {
      await handleMarkdownUpload(file);
    }
  }, [handleMarkdownUpload]);

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleMultipleFiles(files);
  }, [handleMultipleFiles]);

  // 문서 목록 조회
  const fetchDocuments = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(PAGE_LIMIT));
    if (typeFilter) params.set("document_type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (importanceFilter) params.set("importance", importanceFilter);
    if (debouncedSearchQuery) params.set("q", debouncedSearchQuery);

    api.get(`/documents?${params}`)
      .then((data) => {
        setDocuments(data.data || []);
        const total = data.meta?.total || 0;
        setTotalPages(data.meta?.totalPages || Math.max(1, Math.ceil(total / PAGE_LIMIT)));
      })
      .catch(() => { setDocuments([]); })
      .finally(() => setLoading(false));
  }, [page, typeFilter, statusFilter, importanceFilter, debouncedSearchQuery, refreshTrigger]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  // 필터 변경 시 첫 페이지로 이동
  useEffect(() => { setPage(1); }, [typeFilter, statusFilter, importanceFilter, debouncedSearchQuery]);

  return (
    <div className="section" ref={ref}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ position: "relative" }}
    >
      {/* 드래그 오버레이 */}
      {dragOver && <DragOverlay />}

      {/* 업로드 결과 모달 */}
      {showUploadModal && uploadResult && (
        <VaultUploadModal
          uploadResult={uploadResult}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      <div className="container">
        {/* 헤더 */}
        <div className="reveal flex items-end justify-between flex-wrap gap-4" style={{ marginBottom: 40 }}>
          <div>
            <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
              VAULT
            </p>
            <h1 className="font-serif" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300, color: "var(--text-primary)" }}>
              문서관리함
            </h1>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline"
              onClick={() => fileInputRef.current?.click()}
              style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {uploading ? "분석 중..." : "📄 마크다운 업로드"}
            </Button>
            <input ref={fileInputRef} type="file" accept=".md,.markdown,.txt" multiple
              onChange={(e) => handleMultipleFiles(Array.from(e.target.files))}
              style={{ display: "none" }} />
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              목록
            </Button>
            <Button variant={viewMode === "card" ? "default" : "outline"} size="sm" onClick={() => setViewMode("card")}>
              카드
            </Button>
          </div>
        </div>

        {/* 필터 바 */}
        <VaultFilters
          typeFilter={typeFilter} onTypeChange={setTypeFilter}
          statusFilter={statusFilter} onStatusChange={setStatusFilter}
          importanceFilter={importanceFilter} onImportanceChange={setImportanceFilter}
          searchQuery={searchQuery} onSearchChange={setSearchQuery}
        />

        {/* 로딩 */}
        {loading && (
          <p style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
            불러오는 중...
          </p>
        )}

        {/* 문서 목록 */}
        {!loading && (
          <VaultDocumentList documents={documents} viewMode={viewMode} />
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2" style={{ marginTop: 48 }}>
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              이전
            </Button>
            <span style={{ fontSize: 13, color: "var(--text-muted)", padding: "0 12px" }}>
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              다음
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** 드래그 앤 드롭 시 표시되는 오버레이 */
function DragOverlay() {
  return (
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
  );
}
