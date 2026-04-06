/** 관리자 미디어 관리 — 파일 업로드, 폴더 관리, 검색, 미리보기 */
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../../utils/api";

/* ── 디자인 토큰 ── */
const T = {
  accent: "#b08d57", text: "#1e293b", textSec: "#475569",
  textMuted: "#94a3b8", border: "#e5e8ed", card: "#ffffff",
};
const fieldStyle = {
  width: "100%", padding: "10px 14px", fontSize: 14,
  border: "1px solid #d0d0d0", borderRadius: 6, background: "#fff",
  fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};
const btnStyle = (bg = "#1a1a2e") => ({
  padding: "8px 20px", fontSize: 13, fontWeight: 500,
  color: "#fff", background: bg, border: "none", borderRadius: 4, cursor: "pointer",
});

/* ── 상수 ── */
const PAGE_LIMIT = 20;
const TYPE_FILTERS = [
  { key: "", label: "전체" },
  { key: "image", label: "이미지" },
  { key: "video", label: "영상" },
  { key: "document", label: "문서" },
];
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];
const VIDEO_EXTS = ["mp4", "webm", "mov", "avi"];

/** 파일 확장자로 아이콘 문자 반환 */
function fileIcon(filename) {
  const ext = (filename || "").split(".").pop().toLowerCase();
  if (IMAGE_EXTS.includes(ext)) return "🖼";
  if (VIDEO_EXTS.includes(ext)) return "🎬";
  if (["pdf"].includes(ext)) return "📄";
  if (["doc", "docx"].includes(ext)) return "📝";
  if (["xls", "xlsx"].includes(ext)) return "📊";
  if (["ppt", "pptx"].includes(ext)) return "📎";
  return "📁";
}

/** 파일 크기 포맷 */
function formatSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/** 날짜 포맷 */
function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

/** 이미지 파일 여부 */
function isImage(filename) {
  const ext = (filename || "").split(".").pop().toLowerCase();
  return IMAGE_EXTS.includes(ext);
}

export default function AdminMedia() {
  /* ── 상태 ── */
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedFolder, setSelectedFolder] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailAlt, setDetailAlt] = useState("");
  const [detailFolder, setDetailFolder] = useState("");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  /* ── 데이터 로드 ── */
  const loadFiles = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: PAGE_LIMIT });
    if (selectedFolder) params.set("folder", selectedFolder);
    if (typeFilter) params.set("type", typeFilter);
    if (search.trim()) params.set("search", search.trim());

    api.get(`/media?${params}`)
      .then((json) => {
        setFiles(json.data ?? []);
        const total = json.meta?.totalPages ?? 1;
        setTotalPages(total);
      })
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [page, selectedFolder, typeFilter, search]);

  const loadFolders = () => {
    api.get("/media/folders")
      .then((json) => setFolders(json.data ?? []))
      .catch(() => setFolders([]));
  };

  useEffect(() => { loadFolders(); }, []);
  useEffect(() => { loadFiles(); }, [loadFiles]);

  /* 필터 변경 시 페이지 1로 초기화 */
  const changeFolder = (f) => { setSelectedFolder(f); setPage(1); };
  const changeType = (t) => { setTypeFilter(t); setPage(1); };
  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  /* ── 파일 업로드 ── */
  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (selectedFolder) formData.append("folder", selectedFolder);
      const res = await fetch("/api/sb/media/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "업로드 실패");
      loadFiles();
      loadFolders();
    } catch (err) {
      alert("업로드 실패: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  /* ── 드래그 앤 드롭 ── */
  const onDragEnter = (e) => { e.preventDefault(); dragCounter.current++; setDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current <= 0) { setDragging(false); dragCounter.current = 0; } };
  const onDragOver = (e) => { e.preventDefault(); };
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  /* ── 상세 모달 ── */
  const openDetail = (file) => {
    setDetail(file);
    setDetailAlt(file.alt || "");
    setDetailFolder(file.folder || "");
    setCopied(false);
  };

  const saveDetail = async () => {
    if (!detail) return;
    try {
      await api.patch(`/media/${detail.id}`, { alt: detailAlt, folder: detailFolder });
      loadFiles();
      loadFolders();
      setDetail((prev) => ({ ...prev, alt: detailAlt, folder: detailFolder }));
    } catch (err) {
      alert("수정 실패: " + err.message);
    }
  };

  const deleteFile = async () => {
    if (!detail) return;
    if (!confirm("이 파일을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/media/${detail.id}`);
      setDetail(null);
      loadFiles();
      loadFolders();
    } catch (err) {
      alert("삭제 실패: " + err.message);
    }
  };

  const copyUrl = () => {
    if (!detail?.url) return;
    navigator.clipboard.writeText(detail.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* ── 렌더링 ── */
  return (
    <div style={{ display: "flex", gap: 0, minHeight: "calc(100vh - 64px)" }}>
      {/* 폴더 사이드바 */}
      <aside style={{
        width: 200, minWidth: 200, background: "#f8f8fa", borderRight: `1px solid ${T.border}`,
        padding: "20px 0", display: "flex", flexDirection: "column",
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: T.textMuted, padding: "0 16px", margin: "0 0 12px", letterSpacing: 1, textTransform: "uppercase" }}>
          폴더
        </h3>
        <button
          onClick={() => changeFolder("")}
          style={{
            display: "block", width: "100%", textAlign: "left", padding: "9px 16px",
            fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit",
            background: selectedFolder === "" ? T.accent + "18" : "transparent",
            color: selectedFolder === "" ? T.accent : T.text,
            fontWeight: selectedFolder === "" ? 600 : 400,
            borderLeft: selectedFolder === "" ? `3px solid ${T.accent}` : "3px solid transparent",
          }}
        >
          전체
        </button>
        {folders.map((f) => (
          <button
            key={f}
            onClick={() => changeFolder(f)}
            style={{
              display: "block", width: "100%", textAlign: "left", padding: "9px 16px",
              fontSize: 14, border: "none", cursor: "pointer", fontFamily: "inherit",
              background: selectedFolder === f ? T.accent + "18" : "transparent",
              color: selectedFolder === f ? T.accent : T.text,
              fontWeight: selectedFolder === f ? 600 : 400,
              borderLeft: selectedFolder === f ? `3px solid ${T.accent}` : "3px solid transparent",
            }}
          >
            {f}
          </button>
        ))}
      </aside>

      {/* 메인 영역 */}
      <main style={{ flex: 1, padding: 28, overflowY: "auto" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: "0 0 20px" }}>
          미디어 관리
        </h2>

        {/* 드래그 앤 드롭 업로드 영역 */}
        <div
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? T.accent : T.border}`,
            borderRadius: 10, padding: "32px 20px", textAlign: "center",
            background: dragging ? T.accent + "0c" : "#fafafa",
            cursor: "pointer", transition: "all 0.2s", marginBottom: 24,
          }}
        >
          <input ref={fileInputRef} type="file" hidden onChange={handleFilePick} />
          {uploading ? (
            <p style={{ margin: 0, fontSize: 14, color: T.textSec }}>업로드 중...</p>
          ) : (
            <>
              <p style={{ margin: "0 0 6px", fontSize: 28, lineHeight: 1 }}>
                {dragging ? "+" : ""}
              </p>
              <p style={{ margin: 0, fontSize: 14, color: dragging ? T.accent : T.textSec, fontWeight: dragging ? 600 : 400 }}>
                {dragging ? "여기에 파일을 놓으세요" : "파일을 드래그하거나 클릭하여 업로드"}
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: T.textMuted }}>
                이미지, 영상, 문서 등 최대 50MB
              </p>
            </>
          )}
        </div>

        {/* 필터 바 */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
          {/* 파일 타입 필터 */}
          <div style={{ display: "flex", gap: 4 }}>
            {TYPE_FILTERS.map((tf) => (
              <button
                key={tf.key}
                onClick={() => changeType(tf.key)}
                style={{
                  padding: "6px 14px", fontSize: 13, fontWeight: 500, borderRadius: 4,
                  border: `1px solid ${typeFilter === tf.key ? T.accent : T.border}`,
                  background: typeFilter === tf.key ? T.accent : "#fff",
                  color: typeFilter === tf.key ? "#fff" : T.textSec,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>
          {/* 검색 */}
          <input
            type="text"
            placeholder="파일명 검색..."
            value={search}
            onChange={handleSearch}
            style={{ ...fieldStyle, width: 240, fontSize: 13 }}
          />
        </div>

        {/* 파일 그리드 */}
        {loading ? (
          <p style={{ textAlign: "center", padding: 40, color: T.textMuted }}>불러오는 중...</p>
        ) : files.length === 0 ? (
          <p style={{ textAlign: "center", padding: 40, color: T.textMuted }}>파일이 없습니다</p>
        ) : (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 16,
          }}>
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => openDetail(file)}
                style={{
                  background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
                  overflow: "hidden", cursor: "pointer", transition: "box-shadow 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 4px 16px ${T.accent}22`; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
              >
                {/* 썸네일 영역 */}
                <div style={{
                  height: 120, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "#f4f4f6", overflow: "hidden",
                }}>
                  {isImage(file.filename) && file.url ? (
                    <img
                      src={file.url}
                      alt={file.alt || file.filename}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{ fontSize: 40 }}>{fileIcon(file.filename)}</span>
                  )}
                </div>
                {/* 파일 정보 */}
                <div style={{ padding: "10px 12px" }}>
                  <p style={{
                    margin: 0, fontSize: 13, fontWeight: 500, color: T.text,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {file.filename}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: T.textMuted }}>
                    {formatSize(file.size)} · {formatDate(file.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 28 }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                ...btnStyle(page <= 1 ? "#ccc" : T.accent),
                padding: "6px 14px", fontSize: 13,
                cursor: page <= 1 ? "default" : "pointer",
              }}
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  width: 32, height: 32, fontSize: 13, fontWeight: page === p ? 700 : 400,
                  border: `1px solid ${page === p ? T.accent : T.border}`,
                  borderRadius: 4, cursor: "pointer", fontFamily: "inherit",
                  background: page === p ? T.accent : "#fff",
                  color: page === p ? "#fff" : T.textSec,
                }}
              >
                {p}
              </button>
            ))}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                ...btnStyle(page >= totalPages ? "#ccc" : T.accent),
                padding: "6px 14px", fontSize: 13,
                cursor: page >= totalPages ? "default" : "pointer",
              }}
            >
              다음
            </button>
          </div>
        )}
      </main>

      {/* ── 상세 모달 ── */}
      {detail && (
        <div
          onClick={() => setDetail(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 12, width: "90%", maxWidth: 600,
              maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            {/* 미리보기 */}
            <div style={{
              background: "#f4f4f6", display: "flex", alignItems: "center",
              justifyContent: "center", minHeight: 200, maxHeight: 360, overflow: "hidden",
              borderRadius: "12px 12px 0 0",
            }}>
              {isImage(detail.filename) && detail.url ? (
                <img
                  src={detail.url}
                  alt={detail.alt || detail.filename}
                  style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain" }}
                />
              ) : (
                <span style={{ fontSize: 72 }}>{fileIcon(detail.filename)}</span>
              )}
            </div>

            {/* 정보 + 편집 */}
            <div style={{ padding: "20px 24px 24px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700, color: T.text, wordBreak: "break-all" }}>
                {detail.filename}
              </h3>

              {/* 파일 메타 */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px",
                marginBottom: 20, fontSize: 13, color: T.textSec,
              }}>
                <div><span style={{ color: T.textMuted }}>크기: </span>{formatSize(detail.size)}</div>
                <div><span style={{ color: T.textMuted }}>타입: </span>{detail.mimeType || "—"}</div>
                <div><span style={{ color: T.textMuted }}>업로드: </span>{formatDate(detail.createdAt)}</div>
                <div><span style={{ color: T.textMuted }}>폴더: </span>{detail.folder || "없음"}</div>
              </div>

              {/* URL 복사 */}
              {detail.url && (
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <input
                    readOnly
                    value={detail.url}
                    style={{ ...fieldStyle, fontSize: 12, color: T.textSec, background: "#f8f8fa" }}
                  />
                  <button onClick={copyUrl} style={btnStyle(copied ? "#22c55e" : T.accent)}>
                    {copied ? "복사됨" : "복사"}
                  </button>
                </div>
              )}

              {/* Alt 텍스트 */}
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: T.textSec, marginBottom: 6 }}>
                대체 텍스트 (alt)
              </label>
              <input
                value={detailAlt}
                onChange={(e) => setDetailAlt(e.target.value)}
                placeholder="이미지 설명 입력..."
                style={{ ...fieldStyle, marginBottom: 14 }}
              />

              {/* 폴더 변경 */}
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: T.textSec, marginBottom: 6 }}>
                폴더
              </label>
              <input
                value={detailFolder}
                onChange={(e) => setDetailFolder(e.target.value)}
                placeholder="폴더명 (비우면 미분류)"
                style={{ ...fieldStyle, marginBottom: 20 }}
              />

              {/* 액션 버튼 */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={deleteFile} style={btnStyle("#dc2626")}>
                  삭제
                </button>
                <button onClick={saveDetail} style={btnStyle(T.accent)}>
                  저장
                </button>
                <button onClick={() => setDetail(null)} style={{
                  ...btnStyle("#fff"), color: T.textSec, border: `1px solid ${T.border}`,
                }}>
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
