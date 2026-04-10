/** 문서 관리 — 생성/수정 모달 폼 */
import { Button } from "../../../components/ui/Button";
import {
  FormField, COLORS, btnStyle, outlineBtnStyle,
} from "../../../components/admin";
import { ALL_DOCUMENT_TYPES, getTypeLabel } from "../../../utils/document-types";
import { STATUS_OPTIONS } from "../../../utils/constants";

/* ── 중요도 옵션 ── */
const IMPORTANCE_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({
  value: n, label: `Level ${n} ${"★".repeat(n)}`,
}));

/* ── 모달 래퍼 ── */
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      paddingTop: 48, overflowY: "auto",
    }}>
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div style={{
        position: "relative", background: "#fff", borderRadius: 8,
        maxWidth: 720, width: "95%", marginBottom: 40,
        boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "14px 24px", borderBottom: `1px solid ${COLORS.border}`,
          background: COLORS.bgForm,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text }}>{title}</h3>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

/* ── 삭제 확인 모달 ── */
export function DeleteConfirmModal({ onConfirm, onCancel }) {
  return (
    <Modal title="문서 삭제 확인" onClose={onCancel}>
      <div style={{
        padding: "12px 16px", marginBottom: 20,
        background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4,
      }}>
        <p style={{ fontSize: 13, color: COLORS.danger, fontWeight: 500 }}>
          이 문서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
        </p>
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} style={outlineBtnStyle()}>취소</button>
        <Button variant="destructive" size="sm" onClick={onConfirm}>삭제 확인</Button>
      </div>
    </Modal>
  );
}

/* ── 카테고리 체크박스 목록 ── */
function CategorySelector({ categories, selectedIds, onToggle }) {
  if (categories.length === 0) return null;

  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4, display: "block" }}>
        카테고리 지정
      </label>
      <div className="flex flex-wrap gap-2" style={{ marginTop: 4 }}>
        {categories.map((cat) => {
          const isSelected = selectedIds.includes(cat.id);
          return (
            <label key={cat.id} className="flex items-center gap-1 cursor-pointer" style={{
              fontSize: 11, padding: "4px 10px", borderRadius: 4,
              border: `1px solid ${isSelected ? (cat.color || COLORS.primary) : COLORS.border}`,
              background: isSelected ? (cat.color || COLORS.primary) : "transparent",
              color: isSelected ? "#fff" : COLORS.textSecondary,
              fontWeight: isSelected ? 600 : 400,
            }}>
              <input
                type="checkbox" checked={isSelected}
                onChange={() => onToggle(cat.id)} style={{ display: "none" }}
              />
              {cat.name}
            </label>
          );
        })}
      </div>
    </div>
  );
}

/** 문서 생성/수정 모달 폼 */
export default function DocumentFormModal({ isNew, form, setField, allCategories, onSave, onCancel, onFileUpload, uploading, saving }) {
  const toggleCategory = (catId) => {
    setField("categoryIds",
      form.categoryIds.includes(catId)
        ? form.categoryIds.filter((id) => id !== catId)
        : [...form.categoryIds, catId]
    );
  };

  return (
    <Modal title={isNew ? "신규 문서 등록" : "문서 수정"} onClose={onCancel}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <FormField label="제목" value={form.title} onChange={(v) => setField("title", v)} required placeholder="문서 제목" />

        <div className="grid grid-cols-2 gap-4">
          <FormField label="문서 유형" value={form.documentType} onChange={(v) => setField("documentType", v)} type="select"
            options={ALL_DOCUMENT_TYPES.map((t) => ({ value: t, label: getTypeLabel(t) }))} />
          <FormField label="처리 상태" value={form.status} onChange={(v) => setField("status", v)} type="select" options={STATUS_OPTIONS} />
        </div>

        <FormField label="부제" value={form.subtitle} onChange={(v) => setField("subtitle", v)} placeholder="부제" />

        <div className="grid grid-cols-2 gap-4">
          <FormField label="저자" value={form.author} onChange={(v) => setField("author", v)} placeholder="저자명" />
          <FormField label="출처" value={form.source} onChange={(v) => setField("source", v)} placeholder="출처" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="발행일" value={form.publishedDate} onChange={(v) => setField("publishedDate", v)} type="date" />
          <FormField label="중요도" value={form.importance} onChange={(v) => setField("importance", v)} type="select" options={IMPORTANCE_OPTIONS} />
        </div>

        <FormField label="요약" value={form.summary} onChange={(v) => setField("summary", v)} type="textarea" placeholder="문서 요약" minHeight={60} />

        <div>
          <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#444" }}>본문 (Markdown)</label>
            <label style={{ fontSize: 11, color: COLORS.primary, cursor: "pointer", fontWeight: 600 }}>
              {uploading ? "업로드 중..." : "파일 업로드"}
              <input type="file" style={{ display: "none" }} onChange={onFileUpload} disabled={uploading} />
            </label>
          </div>
          <FormField value={form.contentMarkdown} onChange={(v) => setField("contentMarkdown", v)} type="textarea" placeholder="본문 내용 (Markdown 지원)" minHeight={160} />
        </div>

        <CategorySelector
          categories={allCategories}
          selectedIds={form.categoryIds}
          onToggle={toggleCategory}
        />

        <div className="flex justify-end gap-3" style={{ marginTop: 8, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
          <button onClick={onCancel} style={outlineBtnStyle()}>취소</button>
          <button
            onClick={onSave}
            disabled={saving || !form.title.trim()}
            style={{ ...btnStyle(), opacity: saving || !form.title.trim() ? 0.5 : 1 }}
          >
            {saving ? "처리 중..." : isNew ? "문서 등록" : "수정 완료"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
