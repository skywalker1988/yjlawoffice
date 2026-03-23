/**
 * AdminDocuments — 관리자 문서 CRUD 페이지
 */
import { useState, useEffect, useCallback } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { Badge } from "../../components/ui/Badge";
import {
  ALL_DOCUMENT_TYPES,
  getTypeLabel,
  getTypeColor,
} from "../../utils/document-types";
import { api } from "../../utils/api";
import { STATUS_OPTIONS } from "../../utils/constants";

const EMPTY_FORM = {
  title: "",
  documentType: "note",
  subtitle: "",
  author: "",
  source: "",
  publishedDate: "",
  contentMarkdown: "",
  summary: "",
  status: "inbox",
  importance: 3,
  tagIds: [],
  categoryIds: [],
};

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // Tags & categories for selection
  const [allTags, setAllTags] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState(null);

  // Upload
  const [uploading, setUploading] = useState(false);

  // Load tags and categories
  useEffect(() => {
    api.get("/tags")
      .then((json) => setAllTags(Array.isArray(json.data) ? json.data : []))
      .catch(() => {});
    api.get("/categories")
      .then((json) => setAllCategories(Array.isArray(json.data) ? json.data : []))
      .catch(() => {});
  }, []);

  // Fetch documents
  const fetchDocuments = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (typeFilter) params.set("document_type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (searchQuery) params.set("q", searchQuery);

    api.get(`/documents?${params}`)
      .then((data) => {
        setDocuments(data.data || []);
        const total = data.meta?.total || 0;
        setTotalPages(data.meta?.totalPages || Math.max(1, Math.ceil(total / limit)));
      })
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, [page, typeFilter, statusFilter, searchQuery]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter, searchQuery]);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleTag = (tagId) => {
    setForm((prev) => {
      const ids = prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId];
      return { ...prev, tagIds: ids };
    });
  };

  const toggleCategory = (catId) => {
    setForm((prev) => {
      const ids = prev.categoryIds.includes(catId)
        ? prev.categoryIds.filter((id) => id !== catId)
        : [...prev.categoryIds, catId];
      return { ...prev, categoryIds: ids };
    });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (doc) => {
    setEditingId(doc.id);
    setForm({
      title: doc.title || "",
      documentType: doc.documentType || "note",
      subtitle: doc.subtitle || "",
      author: typeof doc.author === "string" ? doc.author : Array.isArray(doc.author) ? doc.author.join(", ") : "",
      source: doc.source || "",
      publishedDate: doc.publishedDate ? doc.publishedDate.split("T")[0] : "",
      contentMarkdown: doc.contentMarkdown || "",
      summary: doc.summary || "",
      status: doc.status || "inbox",
      importance: doc.importance || 3,
      tagIds: (doc.tags || []).map((t) => (typeof t === "object" ? t.id : t)).filter(Boolean),
      categoryIds: (doc.categories || []).map((c) => (typeof c === "object" ? c.id : c)).filter(Boolean),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        ...form,
        importance: Number(form.importance),
        author: form.author || undefined,
        publishedDate: form.publishedDate || undefined,
      };

      if (editingId) {
        await api.patch(`/documents/${editingId}`, body);
      } else {
        await api.post("/documents", body);
      }
      setShowForm(false);
      fetchDocuments();
    } catch (err) {
      alert("저장 실패: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.del(`/documents/${id}`);
      setDeleteId(null);
      fetchDocuments();
    } catch (err) {
      alert("삭제 실패: " + err.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.upload("/documents/upload", file);
      if (result.content || result.contentMarkdown) {
        updateForm("contentMarkdown", result.content || result.contentMarkdown);
      }
      if (result.title) updateForm("title", result.title);
      if (result.author) updateForm("author", result.author);
    } catch (err) {
      alert("업로드 실패: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>문서 관리</h2>
        <Button onClick={openCreate}>새 문서</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center" style={{ marginBottom: 24 }}>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ width: 130 }}
        >
          <option value="">모든 유형</option>
          {ALL_DOCUMENT_TYPES.map((t) => (
            <option key={t} value={t}>{getTypeLabel(t)}</option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: 130 }}
        >
          <option value="">모든 상태</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="검색..."
          style={{ width: 200 }}
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: 40,
            overflowY: "auto",
          }}
        >
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)" }}
            onClick={() => setShowForm(false)}
          />
          <div
            style={{
              position: "relative",
              background: "#fff",
              borderRadius: 8,
              padding: 32,
              maxWidth: 700,
              width: "95%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              marginBottom: 40,
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>
              {editingId ? "문서 수정" : "새 문서 작성"}
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Title */}
              <div>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>제목 *</label>
                <Input
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  placeholder="문서 제목"
                />
              </div>

              {/* Type & Status row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>문서 유형</label>
                  <Select
                    value={form.documentType}
                    onChange={(e) => updateForm("documentType", e.target.value)}
                  >
                    {ALL_DOCUMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{getTypeLabel(t)}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>상태</label>
                  <Select
                    value={form.status}
                    onChange={(e) => updateForm("status", e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>부제</label>
                <Input
                  value={form.subtitle}
                  onChange={(e) => updateForm("subtitle", e.target.value)}
                  placeholder="부제"
                />
              </div>

              {/* Author & Source */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>저자</label>
                  <Input
                    value={form.author}
                    onChange={(e) => updateForm("author", e.target.value)}
                    placeholder="저자명"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>출처</label>
                  <Input
                    value={form.source}
                    onChange={(e) => updateForm("source", e.target.value)}
                    placeholder="출처 URL 또는 이름"
                  />
                </div>
              </div>

              {/* Published Date & Importance */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>발행일</label>
                  <Input
                    type="date"
                    value={form.publishedDate}
                    onChange={(e) => updateForm("publishedDate", e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>중요도</label>
                  <Select
                    value={form.importance}
                    onChange={(e) => updateForm("importance", e.target.value)}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{"★".repeat(n)} ({n})</option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Summary */}
              <div>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>요약</label>
                <Textarea
                  value={form.summary}
                  onChange={(e) => updateForm("summary", e.target.value)}
                  placeholder="문서 요약"
                  rows={3}
                />
              </div>

              {/* Content */}
              <div>
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <label style={{ fontSize: 12, color: "#666" }}>본문 (Markdown)</label>
                  <label
                    style={{
                      fontSize: 12,
                      color: "var(--accent-gold)",
                      cursor: "pointer",
                    }}
                  >
                    {uploading ? "업로드 중..." : "파일 업로드"}
                    <input
                      type="file"
                      style={{ display: "none" }}
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                </div>
                <Textarea
                  value={form.contentMarkdown}
                  onChange={(e) => updateForm("contentMarkdown", e.target.value)}
                  placeholder="본문 내용을 입력하세요 (Markdown 지원)"
                  rows={8}
                />
              </div>

              {/* Tags */}
              {allTags.length > 0 && (
                <div>
                  <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 8 }}>태그</label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <label
                        key={tag.id}
                        className="flex items-center gap-1 cursor-pointer"
                        style={{
                          fontSize: 12,
                          padding: "4px 10px",
                          borderRadius: 12,
                          border: `1px solid ${form.tagIds.includes(tag.id) ? (tag.color || "var(--accent-gold)") : "rgba(0,0,0,0.1)"}`,
                          background: form.tagIds.includes(tag.id) ? (tag.color || "var(--accent-gold)") : "transparent",
                          color: form.tagIds.includes(tag.id) ? "#fff" : "#666",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.tagIds.includes(tag.id)}
                          onChange={() => toggleTag(tag.id)}
                          style={{ display: "none" }}
                        />
                        {tag.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories */}
              {allCategories.length > 0 && (
                <div>
                  <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 8 }}>카테고리</label>
                  <div className="flex flex-wrap gap-2">
                    {allCategories.map((cat) => (
                      <label
                        key={cat.id}
                        className="flex items-center gap-1 cursor-pointer"
                        style={{
                          fontSize: 12,
                          padding: "4px 10px",
                          borderRadius: 12,
                          border: `1px solid ${form.categoryIds.includes(cat.id) ? (cat.color || "var(--accent-gold)") : "rgba(0,0,0,0.1)"}`,
                          background: form.categoryIds.includes(cat.id) ? (cat.color || "var(--accent-gold)") : "transparent",
                          color: form.categoryIds.includes(cat.id) ? "#fff" : "#666",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.categoryIds.includes(cat.id)}
                          onChange={() => toggleCategory(cat.id)}
                          style={{ display: "none" }}
                        />
                        {cat.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-3" style={{ marginTop: 8 }}>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  취소
                </Button>
                <Button onClick={handleSave} disabled={saving || !form.title.trim()}>
                  {saving ? "저장 중..." : editingId ? "수정" : "작성"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }}
            onClick={() => setDeleteId(null)}
          />
          <div
            style={{
              position: "relative",
              background: "#fff",
              borderRadius: 8,
              padding: 32,
              maxWidth: 400,
              width: "90%",
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>문서 삭제</h3>
            <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>
              이 문서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>
                취소
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(deleteId)}>
                삭제
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p style={{ textAlign: "center", color: "#999", padding: 40 }}>불러오는 중...</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid rgba(0,0,0,0.08)" }}>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 500 }}>유형</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 500 }}>제목</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 500 }}>상태</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 500 }}>중요도</th>
                <th style={{ textAlign: "left", padding: "10px 12px", color: "#999", fontWeight: 500 }}>날짜</th>
                <th style={{ textAlign: "right", padding: "10px 12px", color: "#999", fontWeight: 500 }}>작업</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#999", padding: 40 }}>
                    문서가 없습니다.
                  </td>
                </tr>
              )}
              {documents.map((doc) => (
                <tr
                  key={doc.id}
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                  className="hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <td style={{ padding: "10px 12px" }}>
                    <Badge
                      style={{
                        backgroundColor: getTypeColor(doc.documentType),
                        color: "#fff",
                        fontSize: 10,
                      }}
                    >
                      {getTypeLabel(doc.documentType)}
                    </Badge>
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      cursor: "pointer",
                      maxWidth: 300,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => openEdit(doc)}
                  >
                    {doc.title}
                  </td>
                  <td style={{ padding: "10px 12px", color: "#888" }}>
                    {STATUS_OPTIONS.find((s) => s.value === doc.status)?.label || doc.status}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ color: "var(--accent-gold)" }}>
                      {"★".repeat(doc.importance || 0)}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#aaa", fontSize: 11 }}>
                    {doc.createdAt
                      ? new Date(doc.createdAt).toLocaleDateString("ko-KR")
                      : ""}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(doc)}>
                        수정
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(doc.id)} style={{ color: "#c44" }}>
                        삭제
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2" style={{ marginTop: 24 }}>
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            이전
          </Button>
          <span style={{ fontSize: 13, color: "#999", padding: "0 12px" }}>
            {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
