/**
 * AdminDocuments — 문서 CRUD 관리 페이지
 * 공유 인프라(useCrudForm, admin 컴포넌트, 공통 스타일)를 활용한 리팩토링 버전
 */
import { useState, useEffect, useCallback } from "react";
import useCrudForm from "../../../hooks/useCrudForm";
import { PageHeader, EmptyState, Pagination, COLORS } from "../../../components/admin";
import { api } from "../../../utils/api";
import { showToast } from "../../../utils/showToast";
import DocumentFilters from "./DocumentFilters";
import DocumentTable, { DocumentRow } from "./DocumentTable";
import DocumentFormModal, { DeleteConfirmModal } from "./DocumentFormModal";

/* ── 도메인 상수 ── */
const EMPTY_FORM = {
  title: "", documentType: "note", subtitle: "", author: "",
  source: "", publishedDate: "", contentMarkdown: "",
  summary: "", status: "inbox", importance: 3,
  categoryIds: [],
};

/**
 * DB 레코드를 폼 객체로 변환
 * — useCrudForm의 mapToForm 옵션에 전달
 */
function mapDocToForm(doc) {
  return {
    title: doc.title || "",
    documentType: doc.documentType || "note",
    subtitle: doc.subtitle || "",
    author: typeof doc.author === "string"
      ? doc.author
      : Array.isArray(doc.author) ? doc.author.join(", ") : "",
    source: doc.source || "",
    publishedDate: doc.publishedDate ? doc.publishedDate.split("T")[0] : "",
    contentMarkdown: doc.contentMarkdown || "",
    summary: doc.summary || "",
    status: doc.status || "inbox",
    importance: doc.importance || 3,
    categoryIds: (doc.categories || [])
      .map((c) => (typeof c === "object" ? c.id : c))
      .filter(Boolean),
  };
}

/* ── 메인 컴포넌트 ── */
export default function AdminDocuments() {
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const buildQueryParams = useCallback(() => {
    const parts = [];
    if (typeFilter) parts.push(`document_type=${typeFilter}`);
    if (statusFilter) parts.push(`status=${statusFilter}`);
    return parts.length > 0 ? "?" + parts.join("&") : "";
  }, [typeFilter, statusFilter]);

  const crud = useCrudForm("/documents", EMPTY_FORM, {
    paginated: true,
    pageSize: 20,
    queryParams: buildQueryParams(),
    mapToForm: mapDocToForm,
    validate: (form) => !form.title.trim() ? "제목을 입력해주세요" : null,
  });

  const [allCategories, setAllCategories] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  /* 필터 변경 시 페이지 리셋 */
  useEffect(() => { crud.setPage(1); }, [typeFilter, statusFilter]);

  /* 카테고리 목록 초기 로드 */
  useEffect(() => {
    api.get("/categories")
      .then((json) => setAllCategories(Array.isArray(json.data) ? json.data : []))
      .catch(() => {});
  }, []);

  /** 저장 — importance 등 형변환 후 useCrudForm.save 사용 */
  const handleSave = async () => {
    setSaving(true);
    try {
      crud.setForm((prev) => ({
        ...prev,
        importance: Number(prev.importance),
        author: prev.author || undefined,
        publishedDate: prev.publishedDate || undefined,
      }));
      await crud.save();
    } finally {
      setSaving(false);
    }
  };

  /** 삭제 확인 후 실행 */
  const handleDelete = async (id) => {
    try {
      await api.del(`/documents/${id}`);
      setDeleteId(null);
      crud.load();
    } catch (err) {
      showToast("삭제 실패: " + err.message);
    }
  };

  /** 파일 업로드로 본문 추출 */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.upload("/documents/upload", file);
      if (result.content || result.contentMarkdown) {
        crud.setField("contentMarkdown", result.content || result.contentMarkdown);
      }
      if (result.title) crud.setField("title", result.title);
      if (result.author) crud.setField("author", result.author);
    } catch (err) {
      showToast("업로드 실패: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSearchChange = (value) => {
    crud.updateSearch(value);
  };

  return (
    <div>
      <PageHeader
        title="문서 관리"
        subtitle={`페이지 ${crud.page}/${crud.totalPages || 1}`}
        onAdd={() => crud.openNew()}
        addLabel="+ 새 문서 등록"
      />

      <DocumentFilters
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchQuery={crud.search}
        setSearchQuery={handleSearchChange}
      />

      {crud.isEditing && (
        <DocumentFormModal
          isNew={crud.isNew}
          form={crud.form}
          setField={crud.setField}
          allCategories={allCategories}
          onSave={handleSave}
          onCancel={crud.cancelEdit}
          onFileUpload={handleFileUpload}
          uploading={uploading}
          saving={saving}
        />
      )}

      {deleteId && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {crud.loading ? (
        <p style={{ textAlign: "center", padding: 60, color: COLORS.muted }}>문서 목록 조회 중...</p>
      ) : crud.items.length === 0 ? (
        <EmptyState icon="📄" message="검색 결과가 없습니다" />
      ) : (
        <DocumentTable>
          {crud.items.map((doc, i) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              index={i}
              onEdit={() => crud.openEdit(doc)}
              onDelete={() => setDeleteId(doc.id)}
            />
          ))}
        </DocumentTable>
      )}

      <Pagination
        page={crud.page}
        totalPages={crud.totalPages}
        onPageChange={crud.setPage}
      />
    </div>
  );
}
