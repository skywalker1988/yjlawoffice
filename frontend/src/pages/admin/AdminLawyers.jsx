/** 관리자 변호사 관리 — CRUD + 순서 변경 */
import { useState, useEffect } from "react";
import { api } from "../../utils/api";

const POSITIONS = ["대표변호사", "파트너변호사", "시니어변호사", "어소시에이트", "고문변호사"];

const EMPTY_FORM = {
  name: "", nameEn: "", position: "어소시에이트", photoUrl: "",
  education: "", career: "", specialties: "", introduction: "",
  email: "", phone: "", sortOrder: 0, isActive: 1,
};

export default function AdminLawyers() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () => {
    setLoading(true);
    api.get("/lawyers?all=true")
      .then((json) => setLawyers(json.data ?? []))
      .catch(() => setLawyers([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => {
    setEditing("new");
    setForm({ ...EMPTY_FORM, sortOrder: lawyers.length });
  };

  const openEdit = (lawyer) => {
    setEditing(lawyer.id);
    setForm({
      name: lawyer.name || "",
      nameEn: lawyer.nameEn || "",
      position: lawyer.position || "어소시에이트",
      photoUrl: lawyer.photoUrl || "",
      education: lawyer.education || "",
      career: lawyer.career || "",
      specialties: lawyer.specialties || "",
      introduction: lawyer.introduction || "",
      email: lawyer.email || "",
      phone: lawyer.phone || "",
      sortOrder: lawyer.sortOrder ?? 0,
      isActive: lawyer.isActive ?? 1,
    });
  };

  const save = async () => {
    if (!form.name.trim()) return alert("이름을 입력해주세요");
    try {
      if (editing === "new") {
        await api.post("/lawyers", form);
      } else {
        await api.patch(`/lawyers/${editing}`, form);
      }
      setEditing(null);
      load();
    } catch (err) {
      alert("저장 실패: " + err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/lawyers/${id}`);
      load();
    } catch (err) {
      alert("삭제 실패: " + err.message);
    }
  };

  const toggleActive = async (lawyer) => {
    try {
      await api.patch(`/lawyers/${lawyer.id}`, { isActive: lawyer.isActive ? 0 : 1 });
      load();
    } catch (err) {
      alert("상태 변경 실패");
    }
  };

  const fieldStyle = {
    width: "100%", padding: "10px 14px", fontSize: 14,
    border: "1px solid #d0d0d0", borderRadius: 4, background: "#fff",
    fontFamily: "inherit", outline: "none",
  };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4, display: "block" };
  const btnStyle = (bg = "#1a1a2e") => ({
    padding: "8px 20px", fontSize: 13, fontWeight: 500,
    color: "#fff", background: bg, border: "none", borderRadius: 4, cursor: "pointer",
  });

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1a1a1a" }}>변호사 관리</h1>
        <button onClick={openNew} style={btnStyle()}>+ 변호사 등록</button>
      </div>

      {/* ==================== 편집 폼 ==================== */}
      {editing && (
        <div style={{
          marginBottom: 32, padding: 28, background: "#f9f9f8",
          border: "1px solid #e0e0e0", borderRadius: 8,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: "#1a1a1a" }}>
            {editing === "new" ? "새 변호사 등록" : "변호사 정보 수정"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>이름 *</label>
              <input style={fieldStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="홍길동" />
            </div>
            <div>
              <label style={labelStyle}>영문 이름</label>
              <input style={fieldStyle} value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} placeholder="Gil-Dong Hong" />
            </div>
            <div>
              <label style={labelStyle}>직위 *</label>
              <select style={fieldStyle} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>사진 URL</label>
              <input style={fieldStyle} value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label style={labelStyle}>이메일</label>
              <input style={fieldStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="lawyer@younjeong.com" />
            </div>
            <div>
              <label style={labelStyle}>전화번호</label>
              <input style={fieldStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="02-594-5583" />
            </div>
            <div>
              <label style={labelStyle}>정렬 순서</label>
              <input type="number" style={fieldStyle} value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14 }}>
                <input type="checkbox" checked={form.isActive === 1} onChange={(e) => setForm({ ...form, isActive: e.target.checked ? 1 : 0 })} />
                사이트에 표시
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4" style={{ marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>소개글</label>
              <textarea style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }} value={form.introduction}
                onChange={(e) => setForm({ ...form, introduction: e.target.value })}
                placeholder="변호사 소개글을 입력하세요" />
            </div>
            <div>
              <label style={labelStyle}>학력 (줄바꿈으로 구분)</label>
              <textarea style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }} value={form.education}
                onChange={(e) => setForm({ ...form, education: e.target.value })}
                placeholder={"서울대학교 법학과 졸업\n서울대학교 법학전문대학원 졸업"} />
            </div>
            <div>
              <label style={labelStyle}>경력 (줄바꿈으로 구분)</label>
              <textarea style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }} value={form.career}
                onChange={(e) => setForm({ ...form, career: e.target.value })}
                placeholder={"제OO회 변호사시험 합격\n법무법인 OO 근무\n현) 윤정 법률사무소"} />
            </div>
            <div>
              <label style={labelStyle}>전문분야 (줄바꿈으로 구분)</label>
              <textarea style={{ ...fieldStyle, minHeight: 60, resize: "vertical" }} value={form.specialties}
                onChange={(e) => setForm({ ...form, specialties: e.target.value })}
                placeholder={"민사소송\n형사변호\n행정소송"} />
            </div>
          </div>

          {/* 사진 미리보기 */}
          {form.photoUrl && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>사진 미리보기</label>
              <img src={form.photoUrl} alt="미리보기" style={{ width: 120, height: 150, objectFit: "cover", border: "1px solid #ddd", borderRadius: 4 }}
                onError={(e) => { e.target.style.display = "none"; }} />
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={save} style={btnStyle("#1a1a2e")}>저장</button>
            <button onClick={() => setEditing(null)} style={btnStyle("#999")}>취소</button>
          </div>
        </div>
      )}

      {/* ==================== 변호사 목록 ==================== */}
      {loading ? (
        <p style={{ color: "#999", fontSize: 14 }}>로딩 중...</p>
      ) : lawyers.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#bbb" }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>⚖️</p>
          <p>등록된 변호사가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lawyers.map((lawyer) => (
            <div
              key={lawyer.id}
              className="flex items-center gap-4"
              style={{
                padding: "16px 20px",
                background: lawyer.isActive ? "#fff" : "#f5f5f3",
                border: "1px solid #e8e8e8",
                borderRadius: 6,
                opacity: lawyer.isActive ? 1 : 0.6,
              }}
            >
              {/* 사진 썸네일 */}
              <div style={{
                width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                background: lawyer.photoUrl
                  ? `url(${lawyer.photoUrl}) center/cover no-repeat`
                  : "#e0e0e0",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, color: "#bbb",
              }}>
                {!lawyer.photoUrl && "⚖️"}
              </div>

              {/* 정보 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-baseline gap-2">
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a" }}>{lawyer.name}</span>
                  {lawyer.nameEn && <span style={{ fontSize: 11, color: "#bbb" }}>{lawyer.nameEn}</span>}
                </div>
                <span style={{ fontSize: 12, color: "#b08d57" }}>{lawyer.position}</span>
                {!lawyer.isActive && <span style={{ fontSize: 10, color: "#c00", marginLeft: 8 }}>(비공개)</span>}
              </div>

              {/* 순서 */}
              <span style={{ fontSize: 11, color: "#ccc", minWidth: 40, textAlign: "center" }}>#{lawyer.sortOrder}</span>

              {/* 액션 */}
              <div className="flex gap-2">
                <button onClick={() => toggleActive(lawyer)} title={lawyer.isActive ? "비공개" : "공개"}
                  style={{ padding: "6px 10px", fontSize: 12, border: "1px solid #ddd", background: "#fff", borderRadius: 4, cursor: "pointer" }}>
                  {lawyer.isActive ? "👁️" : "🔒"}
                </button>
                <button onClick={() => openEdit(lawyer)}
                  style={{ padding: "6px 10px", fontSize: 12, border: "1px solid #ddd", background: "#fff", borderRadius: 4, cursor: "pointer" }}>
                  ✏️
                </button>
                <button onClick={() => remove(lawyer.id)}
                  style={{ padding: "6px 10px", fontSize: 12, border: "1px solid #ddd", background: "#fff", borderRadius: 4, cursor: "pointer", color: "#c00" }}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
