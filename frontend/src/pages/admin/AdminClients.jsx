/**
 * 관리자 고객 관리 — 고객 DB CRUD
 * - 상담 신청 시 자동 등록된 고객 + 직접 등록 고객
 * - 메시지 발송 시 수신자 목록으로 활용
 */
import { useState, useEffect, useCallback } from "react";
import { api } from "../../utils/api";

/** 상담 분야 한국어 라벨 */
const CATEGORY_LABELS = {
  general: "일반", civil: "민사", criminal: "형사", family: "가사",
  admin: "행정", tax: "조세", realestate: "부동산", corporate: "기업법무", other: "기타",
};
const CATEGORIES = ["civil", "criminal", "family", "admin", "tax", "realestate", "corporate", "other"];

/** 고객 출처 라벨 */
const SOURCE_LABELS = { consultation: "상담 신청", referral: "소개", manual: "직접 등록", other: "기타" };

const EMPTY_FORM = { name: "", phone: "", email: "", category: "", memo: "" };

/* ──────── 공통 스타일 ──────── */
const fieldStyle = {
  width: "100%", padding: "10px 14px", fontSize: 14,
  border: "1px solid #d0d0d0", borderRadius: 4, background: "#fff",
  fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};
const labelStyle = { fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4, display: "block" };
const btnStyle = (bg = "#1a1a2e") => ({
  padding: "8px 20px", fontSize: 13, fontWeight: 500,
  color: "#fff", background: bg, border: "none", borderRadius: 4, cursor: "pointer",
});
const badgeStyle = (color) => ({
  display: "inline-block", padding: "2px 10px", fontSize: 11, fontWeight: 600,
  borderRadius: 12, color: "#fff", background: color,
});

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (search) params.set("q", search);
    api.get(`/clients?${params}`)
      .then((json) => {
        setClients(json.data ?? []);
        setMeta(json.meta ?? { total: 0, totalPages: 0 });
      })
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(load, [load]);

  const openNew = () => { setEditing("new"); setForm({ ...EMPTY_FORM }); };
  const openEdit = (c) => {
    setEditing(c.id);
    setForm({
      name: c.name || "", phone: c.phone || "", email: c.email || "",
      category: c.category || "", memo: c.memo || "",
    });
  };

  const save = async () => {
    if (!form.name.trim()) return alert("이름을 입력해주세요");
    if (!form.phone.trim()) return alert("전화번호를 입력해주세요");
    try {
      if (editing === "new") {
        await api.post("/clients", form);
      } else {
        await api.patch(`/clients/${editing}`, form);
      }
      setEditing(null);
      load();
    } catch (err) {
      alert("저장 실패: " + err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("이 고객을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/clients/${id}`);
      load();
    } catch (err) {
      alert("삭제 실패: " + err.message);
    }
  };

  const toggleActive = async (client) => {
    try {
      await api.patch(`/clients/${client.id}`, { isActive: client.isActive ? 0 : 1 });
      load();
    } catch (err) {
      alert("상태 변경 실패");
    }
  };

  /** 날짜 포맷 */
  const formatDate = (d) => d ? d.replace("T", " ").slice(0, 10) : "-";

  /** 전화번호 포맷 (010-1234-5678) */
  const formatPhone = (p) => {
    if (!p) return "-";
    const clean = p.replace(/[-\s]/g, "");
    if (clean.length === 11) return `${clean.slice(0,3)}-${clean.slice(3,7)}-${clean.slice(7)}`;
    if (clean.length === 10) return `${clean.slice(0,3)}-${clean.slice(3,6)}-${clean.slice(6)}`;
    return p;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>고객 관리</h1>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
            총 {meta.total}명 · 상담 신청 시 자동 등록됩니다
          </p>
        </div>
        <button onClick={openNew} style={btnStyle()}>+ 고객 등록</button>
      </div>

      {/* 검색 */}
      <div style={{ marginBottom: 20 }}>
        <input style={{ ...fieldStyle, maxWidth: 360 }} value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="이름, 전화번호, 이메일 검색..." />
      </div>

      {/* 편집 폼 */}
      {editing && (
        <div style={{
          marginBottom: 28, padding: 24, background: "#f9f9f8",
          border: "1px solid #e0e0e0", borderRadius: 8,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#1a1a1a" }}>
            {editing === "new" ? "새 고객 등록" : "고객 정보 수정"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>이름 *</label>
              <input style={fieldStyle} value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="홍길동" />
            </div>
            <div>
              <label style={labelStyle}>전화번호 *</label>
              <input style={fieldStyle} value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-1234-5678" />
            </div>
            <div>
              <label style={labelStyle}>이메일</label>
              <input style={fieldStyle} value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="client@example.com" />
            </div>
            <div>
              <label style={labelStyle}>상담 분야</label>
              <select style={fieldStyle} value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">미지정</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>메모</label>
            <textarea style={{ ...fieldStyle, minHeight: 60, resize: "vertical" }} value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="특이사항, 참고사항 등..." />
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button onClick={() => setEditing(null)} style={btnStyle("#999")}>취소</button>
            <button onClick={save} style={btnStyle()}>저장</button>
          </div>
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999" }}>불러오는 중...</div>
      ) : clients.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999" }}>등록된 고객이 없습니다</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e0e0e0", textAlign: "left" }}>
              <th style={{ padding: "10px 8px", fontWeight: 600, color: "#555" }}>이름</th>
              <th style={{ padding: "10px 8px", fontWeight: 600, color: "#555" }}>전화번호</th>
              <th style={{ padding: "10px 8px", fontWeight: 600, color: "#555" }}>이메일</th>
              <th style={{ padding: "10px 8px", fontWeight: 600, color: "#555" }}>분야</th>
              <th style={{ padding: "10px 8px", fontWeight: 600, color: "#555" }}>출처</th>
              <th style={{ padding: "10px 8px", fontWeight: 600, color: "#555" }}>등록일</th>
              <th style={{ padding: "10px 8px", fontWeight: 600, color: "#555", width: 140 }}></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} style={{
                borderBottom: "1px solid #f0f0f0",
                opacity: c.isActive ? 1 : 0.45,
              }}>
                <td style={{ padding: "10px 8px", fontWeight: 500 }}>
                  {c.name}
                  {c.memo && (
                    <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>
                      {c.memo.length > 30 ? c.memo.slice(0, 30) + "..." : c.memo}
                    </div>
                  )}
                </td>
                <td style={{ padding: "10px 8px", color: "#555" }}>{formatPhone(c.phone)}</td>
                <td style={{ padding: "10px 8px", color: "#555" }}>{c.email || "-"}</td>
                <td style={{ padding: "10px 8px" }}>
                  {c.category ? (
                    <span style={{ fontSize: 12, color: "#666" }}>{CATEGORY_LABELS[c.category] || c.category}</span>
                  ) : "-"}
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <span style={badgeStyle(c.source === "consultation" ? "#3498db" : c.source === "referral" ? "#27ae60" : "#95a5a6")}>
                    {SOURCE_LABELS[c.source] || c.source}
                  </span>
                </td>
                <td style={{ padding: "10px 8px", color: "#999", fontSize: 12 }}>{formatDate(c.createdAt)}</td>
                <td style={{ padding: "10px 8px", display: "flex", gap: 6 }}>
                  <button onClick={() => openEdit(c)}
                    style={{ ...btnStyle("#555"), padding: "4px 12px", fontSize: 12 }}>수정</button>
                  <button onClick={() => toggleActive(c)}
                    style={{ ...btnStyle(c.isActive ? "#f39c12" : "#27ae60"), padding: "4px 12px", fontSize: 12 }}>
                    {c.isActive ? "비활성" : "활성"}
                  </button>
                  <button onClick={() => remove(c.id)}
                    style={{ ...btnStyle("#c0392b"), padding: "4px 12px", fontSize: 12 }}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 페이지네이션 */}
      {meta.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
            style={{ ...btnStyle(page <= 1 ? "#ddd" : "#666"), padding: "6px 14px" }}>이전</button>
          <span style={{ alignSelf: "center", fontSize: 13, color: "#666" }}>
            {page} / {meta.totalPages}
          </span>
          <button onClick={() => setPage(Math.min(meta.totalPages, page + 1))} disabled={page >= meta.totalPages}
            style={{ ...btnStyle(page >= meta.totalPages ? "#ddd" : "#666"), padding: "6px 14px" }}>다음</button>
        </div>
      )}
    </div>
  );
}
