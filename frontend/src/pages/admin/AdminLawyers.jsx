/** 관리자 변호사 관리 — CRUD + 순서 변경 */
import useCrudForm from "../../hooks/useCrudForm";
import { PageHeader, EditPanel, FormField, EmptyState, ErrorBanner, outlineBtnStyle, COLORS } from "../../components/admin";

const POSITIONS = ["대표변호사", "파트너변호사", "시니어변호사", "어소시에이트", "고문변호사"];
const POSITION_OPTIONS = POSITIONS.map((p) => ({ value: p, label: p }));

const EMPTY_FORM = {
  name: "", nameEn: "", position: "어소시에이트", photoUrl: "",
  education: "", career: "", specialties: "", introduction: "",
  email: "", phone: "", sortOrder: 0, isActive: 1,
};

export default function AdminLawyers() {
  const crud = useCrudForm("/lawyers", EMPTY_FORM, {
    queryParams: "?all=true",
    validate: (form) => !form.name.trim() ? "이름을 입력해주세요" : null,
  });

  return (
    <div>
      <ErrorBanner message={crud.error} onDismiss={crud.clearError} />
      <PageHeader
        title="변호사 관리"
        onAdd={() => crud.openNew({ sortOrder: crud.items.length })}
        addLabel="+ 변호사 등록"
      />

      {/* ── 편집 폼 ── */}
      {crud.isEditing && (
        <EditPanel isNew={crud.isNew} entityName="변호사" onSave={crud.save} onCancel={crud.cancelEdit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
            <FormField label="이름" value={crud.form.name} onChange={(v) => crud.setField("name", v)} required placeholder="홍길동" />
            <FormField label="영문 이름" value={crud.form.nameEn} onChange={(v) => crud.setField("nameEn", v)} placeholder="Gil-Dong Hong" />
            <FormField label="직위" value={crud.form.position} onChange={(v) => crud.setField("position", v)} type="select" options={POSITION_OPTIONS} required />
            <FormField label="사진 URL" value={crud.form.photoUrl} onChange={(v) => crud.setField("photoUrl", v)} placeholder="https://..." />
            <FormField label="이메일" value={crud.form.email} onChange={(v) => crud.setField("email", v)} placeholder="lawyer@younjeong.com" />
            <FormField label="전화번호" value={crud.form.phone} onChange={(v) => crud.setField("phone", v)} placeholder="02-594-5583" />
            <FormField label="정렬 순서" value={crud.form.sortOrder} onChange={(v) => crud.setField("sortOrder", v)} type="number" />
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14 }}>
                <input type="checkbox" checked={crud.form.isActive === 1} onChange={(e) => crud.setField("isActive", e.target.checked ? 1 : 0)} />
                사이트에 표시
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <FormField label="소개글" value={crud.form.introduction} onChange={(v) => crud.setField("introduction", v)} type="textarea" placeholder="변호사 소개글을 입력하세요" />
            <FormField label="학력 (줄바꿈으로 구분)" value={crud.form.education} onChange={(v) => crud.setField("education", v)} type="textarea" placeholder={"서울대학교 법학과 졸업\n서울대학교 법학전문대학원 졸업"} />
            <FormField label="경력 (줄바꿈으로 구분)" value={crud.form.career} onChange={(v) => crud.setField("career", v)} type="textarea" placeholder={"제OO회 변호사시험 합격\n현) 윤정 법률사무소"} />
            <FormField label="전문분야 (줄바꿈으로 구분)" value={crud.form.specialties} onChange={(v) => crud.setField("specialties", v)} type="textarea" minHeight={60} placeholder={"민사소송\n형사변호\n행정소송"} />
          </div>

          {crud.form.photoUrl && (
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#444", display: "block", marginBottom: 4 }}>사진 미리보기</label>
              <img src={crud.form.photoUrl} alt="미리보기" style={{ width: 120, height: 150, objectFit: "cover", border: "1px solid #ddd", borderRadius: 4 }}
                onError={(e) => { e.target.style.display = "none"; }} />
            </div>
          )}
        </EditPanel>
      )}

      {/* ── 변호사 목록 ── */}
      {crud.loading ? (
        <p style={{ color: COLORS.muted, fontSize: 14 }}>로딩 중...</p>
      ) : crud.items.length === 0 ? (
        <EmptyState icon="⚖️" message="등록된 변호사가 없습니다" />
      ) : (
        <div className="space-y-3">
          {crud.items.map((lawyer) => (
            <LawyerCard
              key={lawyer.id}
              lawyer={lawyer}
              onEdit={() => crud.openEdit(lawyer)}
              onRemove={() => crud.remove(lawyer.id)}
              onToggleActive={() => crud.patchItem(lawyer.id, { isActive: lawyer.isActive ? 0 : 1 })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** 변호사 목록 카드 — 단일 항목 렌더링 */
function LawyerCard({ lawyer, onEdit, onRemove, onToggleActive }) {
  return (
    <div
      className="flex items-center gap-4"
      style={{
        padding: "16px 20px",
        background: lawyer.isActive ? "#fff" : COLORS.bgInactive,
        border: `1px solid ${COLORS.borderLight}`,
        borderRadius: 6,
        opacity: lawyer.isActive ? 1 : 0.6,
      }}
    >
      {/* 사진 */}
      <div style={{
        width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
        background: lawyer.photoUrl ? `url(${lawyer.photoUrl}) center/cover no-repeat` : "#e0e0e0",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, color: COLORS.textLight,
      }}>
        {!lawyer.photoUrl && "⚖️"}
      </div>

      {/* 정보 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-baseline gap-2">
          <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.text }}>{lawyer.name}</span>
          {lawyer.nameEn && <span style={{ fontSize: 11, color: COLORS.textLight }}>{lawyer.nameEn}</span>}
        </div>
        <span style={{ fontSize: 12, color: COLORS.accent }}>{lawyer.position}</span>
        {!lawyer.isActive && <span style={{ fontSize: 10, color: "#c00", marginLeft: 8 }}>(비공개)</span>}
      </div>

      {/* 순서 */}
      <span style={{ fontSize: 11, color: "#ccc", minWidth: 40, textAlign: "center" }}>#{lawyer.sortOrder}</span>

      {/* 액션 */}
      <div className="flex gap-2">
        <button onClick={onToggleActive} title={lawyer.isActive ? "비공개" : "공개"} style={outlineBtnStyle()}>
          {lawyer.isActive ? "👁️" : "🔒"}
        </button>
        <button onClick={onEdit} style={outlineBtnStyle()}>✏️</button>
        <button onClick={onRemove} style={outlineBtnStyle("#c00")}>🗑️</button>
      </div>
    </div>
  );
}
