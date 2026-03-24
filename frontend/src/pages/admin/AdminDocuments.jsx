/**
 * AdminDocuments — 미국 정부 스타일 문서 CRUD 페이지
 * 공식 문서 테이블 + 구조화된 폼 모달
 */
import { useState, useEffect, useCallback } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { Badge } from "../../components/ui/Badge";
import { ALL_DOCUMENT_TYPES, getTypeLabel, getTypeColor } from "../../utils/document-types";
import { api } from "../../utils/api";
import { STATUS_OPTIONS } from "../../utils/constants";

const GOV = {
  navy: "#0b1a2e",
  gold: "#c9a961",
  goldBg: "rgba(201,169,97,0.08)",
  text: "#1b2a4a",
  textSec: "#5a6a85",
  textMuted: "#8e99ab",
  border: "#dce1e8",
  cardBg: "#ffffff",
  headerBg: "#0f2341",
  rowAlt: "#fafbfc",
};

const EMPTY_FORM = {
  title: "", documentType: "note", subtitle: "", author: "",
  source: "", publishedDate: "", contentMarkdown: "",
  summary: "", status: "inbox", importance: 3,
  tagIds: [], categoryIds: [],
};

/** 정부 스타일 페이지 헤더 */
function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-end", justifyContent: "space-between",
      marginBottom: 28, paddingBottom: 16,
      borderBottom: `2px solid ${GOV.navy}`,
    }}>
      <div>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: GOV.navy,
          fontFamily: "'Georgia', serif", letterSpacing: "0.03em",
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 12, color: GOV.textMuted, marginTop: 4 }}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/** 정부 스타일 모달 래퍼 */
function GovModal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      paddingTop: 40, overflowY: "auto",
    }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(11,26,46,0.6)" }} onClick={onClose} />
      <div style={{
        position: "relative", background: "#fff", borderRadius: 2,
        maxWidth: 720, width: "95%", marginBottom: 40,
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        border: `1px solid ${GOV.border}`,
      }}>
        {/* 모달 헤더 — 네이비 바 */}
        <div style={{
          background: GOV.headerBg, padding: "14px 28px",
          borderBottom: `2px solid ${GOV.gold}`,
        }}>
          <h3 style={{
            fontSize: 14, fontWeight: 700, color: GOV.gold,
            letterSpacing: "0.08em", fontFamily: "'Georgia', serif",
          }}>
            {title}
          </h3>
        </div>
        <div style={{ padding: "24px 28px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** 정부 스타일 폼 필드 라벨 */
function FieldLabel({ children, required }) {
  return (
    <label style={{
      display: "block", marginBottom: 4, fontSize: 10, fontWeight: 700,
      color: GOV.textSec, letterSpacing: "0.1em", textTransform: "uppercase",
    }}>
      {children} {required && <span style={{ color: "#b91c1c" }}>*</span>}
    </label>
  );
}

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const [allTags, setAllTags] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get("/tags").then((json) => setAllTags(Array.isArray(json.data) ? json.data : [])).catch(() => {});
    api.get("/categories").then((json) => setAllCategories(Array.isArray(json.data) ? json.data : [])).catch(() => {});
  }, []);

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

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);
  useEffect(() => { setPage(1); }, [typeFilter, statusFilter, searchQuery]);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleTag = (tagId) => {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter((id) => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  const toggleCategory = (catId) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(catId)
        ? prev.categoryIds.filter((id) => id !== catId)
        : [...prev.categoryIds, catId],
    }));
  };

  const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setShowForm(true); };

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
        ...form, importance: Number(form.importance),
        author: form.author || undefined,
        publishedDate: form.publishedDate || undefined,
      };
      if (editingId) await api.patch(`/documents/${editingId}`, body);
      else await api.post("/documents", body);
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
      if (result.content || result.contentMarkdown) updateForm("contentMarkdown", result.content || result.contentMarkdown);
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
      <PageHeader
        title="문서 관리"
        subtitle={`총 ${documents.length > 0 ? "검색 결과 표시 중" : "문서 없음"} | 페이지 ${page}/${totalPages}`}
        action={
          <button onClick={openCreate} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 20px", fontSize: 12, fontWeight: 600,
            background: GOV.navy, color: GOV.gold, border: "none",
            borderRadius: 2, cursor: "pointer", letterSpacing: "0.06em",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "#142d52"}
          onMouseLeave={e => e.currentTarget.style.background = GOV.navy}
          >
            + 새 문서 등록
          </button>
        }
      />

      {/* 필터 바 */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center",
        marginBottom: 24, padding: "14px 20px",
        background: GOV.goldBg, border: `1px solid rgba(201,169,97,0.15)`,
        borderRadius: 2,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: GOV.textSec, letterSpacing: "0.12em", textTransform: "uppercase", marginRight: 4 }}>
          필터:
        </span>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: 130, borderRadius: 2 }}>
          <option value="">모든 유형</option>
          {ALL_DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{getTypeLabel(t)}</option>)}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 130, borderRadius: 2 }}>
          <option value="">모든 상태</option>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="문서 검색..." style={{ width: 220, borderRadius: 2 }} />
      </div>

      {/* 생성/수정 모달 */}
      {showForm && (
        <GovModal title={editingId ? "문서 수정" : "신규 문서 등록"} onClose={() => setShowForm(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <FieldLabel required>제목</FieldLabel>
              <Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="문서 제목" style={{ borderRadius: 2 }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>문서 유형</FieldLabel>
                <Select value={form.documentType} onChange={(e) => updateForm("documentType", e.target.value)} style={{ borderRadius: 2 }}>
                  {ALL_DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{getTypeLabel(t)}</option>)}
                </Select>
              </div>
              <div>
                <FieldLabel>처리 상태</FieldLabel>
                <Select value={form.status} onChange={(e) => updateForm("status", e.target.value)} style={{ borderRadius: 2 }}>
                  {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
              </div>
            </div>
            <div>
              <FieldLabel>부제</FieldLabel>
              <Input value={form.subtitle} onChange={(e) => updateForm("subtitle", e.target.value)} placeholder="부제" style={{ borderRadius: 2 }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>저자</FieldLabel>
                <Input value={form.author} onChange={(e) => updateForm("author", e.target.value)} placeholder="저자명" style={{ borderRadius: 2 }} />
              </div>
              <div>
                <FieldLabel>출처</FieldLabel>
                <Input value={form.source} onChange={(e) => updateForm("source", e.target.value)} placeholder="출처" style={{ borderRadius: 2 }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>발행일</FieldLabel>
                <Input type="date" value={form.publishedDate} onChange={(e) => updateForm("publishedDate", e.target.value)} style={{ borderRadius: 2 }} />
              </div>
              <div>
                <FieldLabel>중요도</FieldLabel>
                <Select value={form.importance} onChange={(e) => updateForm("importance", e.target.value)} style={{ borderRadius: 2 }}>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Level {n} {"★".repeat(n)}</option>)}
                </Select>
              </div>
            </div>
            <div>
              <FieldLabel>요약</FieldLabel>
              <Textarea value={form.summary} onChange={(e) => updateForm("summary", e.target.value)} placeholder="문서 요약" rows={3} style={{ borderRadius: 2 }} />
            </div>
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                <FieldLabel>본문 (Markdown)</FieldLabel>
                <label style={{ fontSize: 11, color: GOV.gold, cursor: "pointer", fontWeight: 600 }}>
                  {uploading ? "업로드 중..." : "파일 업로드"}
                  <input type="file" style={{ display: "none" }} onChange={handleFileUpload} disabled={uploading} />
                </label>
              </div>
              <Textarea value={form.contentMarkdown} onChange={(e) => updateForm("contentMarkdown", e.target.value)} placeholder="본문 내용 (Markdown 지원)" rows={8} style={{ borderRadius: 2 }} />
            </div>

            {allTags.length > 0 && (
              <div>
                <FieldLabel>태그 지정</FieldLabel>
                <div className="flex flex-wrap gap-2" style={{ marginTop: 4 }}>
                  {allTags.map((tag) => (
                    <label key={tag.id} className="flex items-center gap-1 cursor-pointer" style={{
                      fontSize: 11, padding: "4px 10px", borderRadius: 2,
                      border: `1px solid ${form.tagIds.includes(tag.id) ? (tag.color || GOV.navy) : GOV.border}`,
                      background: form.tagIds.includes(tag.id) ? (tag.color || GOV.navy) : "transparent",
                      color: form.tagIds.includes(tag.id) ? "#fff" : GOV.textSec,
                      fontWeight: form.tagIds.includes(tag.id) ? 600 : 400,
                    }}>
                      <input type="checkbox" checked={form.tagIds.includes(tag.id)} onChange={() => toggleTag(tag.id)} style={{ display: "none" }} />
                      {tag.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {allCategories.length > 0 && (
              <div>
                <FieldLabel>카테고리 지정</FieldLabel>
                <div className="flex flex-wrap gap-2" style={{ marginTop: 4 }}>
                  {allCategories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-1 cursor-pointer" style={{
                      fontSize: 11, padding: "4px 10px", borderRadius: 2,
                      border: `1px solid ${form.categoryIds.includes(cat.id) ? (cat.color || GOV.navy) : GOV.border}`,
                      background: form.categoryIds.includes(cat.id) ? (cat.color || GOV.navy) : "transparent",
                      color: form.categoryIds.includes(cat.id) ? "#fff" : GOV.textSec,
                      fontWeight: form.categoryIds.includes(cat.id) ? 600 : 400,
                    }}>
                      <input type="checkbox" checked={form.categoryIds.includes(cat.id)} onChange={() => toggleCategory(cat.id)} style={{ display: "none" }} />
                      {cat.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex justify-end gap-3" style={{ marginTop: 8, paddingTop: 16, borderTop: `1px solid ${GOV.border}` }}>
              <button onClick={() => setShowForm(false)} style={{
                padding: "8px 20px", fontSize: 12, fontWeight: 600,
                background: "transparent", color: GOV.textSec, border: `1px solid ${GOV.border}`,
                borderRadius: 2, cursor: "pointer",
              }}>
                취소
              </button>
              <button onClick={handleSave} disabled={saving || !form.title.trim()} style={{
                padding: "8px 24px", fontSize: 12, fontWeight: 600,
                background: GOV.navy, color: GOV.gold, border: "none",
                borderRadius: 2, cursor: "pointer",
                opacity: saving || !form.title.trim() ? 0.5 : 1,
              }}>
                {saving ? "처리 중..." : editingId ? "수정 완료" : "문서 등록"}
              </button>
            </div>
          </div>
        </GovModal>
      )}

      {/* 삭제 확인 */}
      {deleteId && (
        <GovModal title="문서 삭제 확인" onClose={() => setDeleteId(null)}>
          <div style={{
            padding: "12px 16px", marginBottom: 20,
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 2,
          }}>
            <p style={{ fontSize: 13, color: "#991b1b", fontWeight: 500 }}>
              이 문서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteId(null)} style={{
              padding: "8px 20px", fontSize: 12, fontWeight: 600,
              background: "transparent", color: GOV.textSec, border: `1px solid ${GOV.border}`,
              borderRadius: 2, cursor: "pointer",
            }}>취소</button>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(deleteId)}>삭제 확인</Button>
          </div>
        </GovModal>
      )}

      {/* 테이블 */}
      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: GOV.textMuted }}>
          <div className="spinner" style={{ margin: "0 auto 12px" }} />
          문서 목록 조회 중...
        </div>
      ) : (
        <div style={{
          border: `1px solid ${GOV.border}`, borderRadius: 2,
          overflow: "hidden", background: "#fff",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: GOV.headerBg }}>
                {["유형", "제목", "상태", "중요도", "등록일", "관리"].map((h, i) => (
                  <th key={h} style={{
                    textAlign: i === 5 ? "right" : "left",
                    padding: "10px 14px",
                    color: GOV.gold,
                    fontWeight: 700, fontSize: 10,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    borderBottom: `2px solid ${GOV.gold}`,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: GOV.textMuted, padding: 48, fontSize: 13 }}>
                    검색 결과가 없습니다
                  </td>
                </tr>
              )}
              {documents.map((doc, i) => (
                <tr key={doc.id} style={{
                  borderBottom: `1px solid ${GOV.border}`,
                  background: i % 2 === 0 ? "transparent" : GOV.rowAlt,
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#eef3fa"}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : GOV.rowAlt}
                >
                  <td style={{ padding: "10px 14px" }}>
                    <Badge style={{
                      backgroundColor: getTypeColor(doc.documentType), color: "#fff",
                      fontSize: 9, borderRadius: 2,
                    }}>
                      {getTypeLabel(doc.documentType)}
                    </Badge>
                  </td>
                  <td style={{
                    padding: "10px 14px", cursor: "pointer",
                    maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap", fontWeight: 500, color: GOV.text,
                  }} onClick={() => openEdit(doc)}>
                    {doc.title}
                  </td>
                  <td style={{ padding: "10px 14px", color: GOV.textSec, fontSize: 12 }}>
                    {STATUS_OPTIONS.find((s) => s.value === doc.status)?.label || doc.status}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ color: GOV.gold, fontSize: 12, letterSpacing: "1px" }}>
                      {"★".repeat(doc.importance || 0)}
                    </span>
                    <span style={{ color: "#ddd", fontSize: 12, letterSpacing: "1px" }}>
                      {"★".repeat(5 - (doc.importance || 0))}
                    </span>
                  </td>
                  <td style={{
                    padding: "10px 14px", color: GOV.textMuted, fontSize: 11,
                    fontFamily: "'Georgia', serif",
                  }}>
                    {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("ko-KR") : ""}
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(doc)} style={{
                        padding: "4px 10px", fontSize: 11, background: "transparent",
                        border: `1px solid ${GOV.border}`, borderRadius: 2,
                        color: GOV.textSec, cursor: "pointer", fontWeight: 500,
                      }}>수정</button>
                      <button onClick={() => setDeleteId(doc.id)} style={{
                        padding: "4px 10px", fontSize: 11, background: "transparent",
                        border: "1px solid #fecaca", borderRadius: 2,
                        color: "#b91c1c", cursor: "pointer", fontWeight: 500,
                      }}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3" style={{ marginTop: 24 }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{
            padding: "6px 16px", fontSize: 11, fontWeight: 600,
            background: page <= 1 ? "#f0f0f0" : GOV.navy, color: page <= 1 ? GOV.textMuted : GOV.gold,
            border: "none", borderRadius: 2, cursor: page <= 1 ? "not-allowed" : "pointer",
          }}>이전</button>
          <span style={{
            fontSize: 12, color: GOV.textSec, fontFamily: "'Georgia', serif",
            padding: "0 8px",
          }}>
            {page} / {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{
            padding: "6px 16px", fontSize: 11, fontWeight: 600,
            background: page >= totalPages ? "#f0f0f0" : GOV.navy, color: page >= totalPages ? GOV.textMuted : GOV.gold,
            border: "none", borderRadius: 2, cursor: page >= totalPages ? "not-allowed" : "pointer",
          }}>다음</button>
        </div>
      )}
    </div>
  );
}
