/** 관리자 사건 관리 — 사건 CRUD, 상태 관리, 메시지 스레드, 문서 목록 */
import { useState, useEffect, useCallback } from "react";
import { api } from "../../utils/api";

const T = { accent: "#b08d57", text: "#1e293b", textSec: "#475569", textMuted: "#94a3b8", border: "#e5e8ed" };
const fieldStyle = { width: "100%", padding: "10px 14px", fontSize: 14, border: "1px solid #d0d0d0", borderRadius: 6, background: "#fff", fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
const labelStyle = { fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4, display: "block" };
const btnStyle = (bg = "#1a1a2e") => ({ padding: "8px 20px", fontSize: 13, fontWeight: 500, color: "#fff", background: bg, border: "none", borderRadius: 4, cursor: "pointer" });

const STATUS_OPTIONS = [
  { value: "접수", label: "접수", color: "#1976d2", bg: "#e3f2fd" },
  { value: "진행", label: "진행", color: "#b08d57", bg: "#fff8e1" },
  { value: "완료", label: "완료", color: "#2e7d32", bg: "#e8f5e9" },
];

const EMPTY_FORM = {
  title: "", description: "", clientId: "", lawyerId: "", status: "접수",
};

/** 상태 배지 */
function StatusBadge({ status }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  return (
    <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 8, background: opt.bg, color: opt.color, fontWeight: 500 }}>
      {opt.label}
    </span>
  );
}

export default function AdminCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [clients, setClients] = useState([]);
  const [lawyers, setLawyers] = useState([]);

  /* 사건 상세 보기 */
  const [detailCase, setDetailCase] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const loadCases = () => {
    setLoading(true);
    api.get("/cases")
      .then((json) => setCases(json.data ?? []))
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCases();
    api.get("/clients").then((j) => setClients(j.data ?? [])).catch(() => {});
    api.get("/lawyers").then((j) => setLawyers(j.data ?? [])).catch(() => {});
  }, []);

  const openNew = () => {
    setEditing("new");
    setDetailCase(null);
    setForm({ ...EMPTY_FORM });
  };

  const openEdit = (c) => {
    setEditing(c.id);
    setDetailCase(null);
    setForm({
      title: c.title || "",
      description: c.description || "",
      clientId: c.clientId || "",
      lawyerId: c.lawyerId || "",
      status: c.status || "접수",
    });
  };

  const save = async () => {
    if (!form.title.trim()) return alert("사건명을 입력해주세요");
    try {
      if (editing === "new") {
        await api.post("/cases", form);
      } else {
        await api.patch(`/cases/${editing}`, form);
      }
      setEditing(null);
      loadCases();
    } catch (err) {
      alert("저장 실패: " + err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/cases/${id}`);
      loadCases();
    } catch (err) {
      alert("삭제 실패: " + err.message);
    }
  };

  /** 사건 상세 보기 */
  const openDetail = useCallback(async (c) => {
    setEditing(null);
    setDetailCase(c);
    setMessages([]);
    setDocuments([]);
    try {
      const [msgRes, docRes] = await Promise.all([
        api.get(`/cases/${c.id}/messages`).catch(() => ({ data: [] })),
        api.get(`/cases/${c.id}/documents`).catch(() => ({ data: [] })),
      ]);
      setMessages(msgRes.data ?? []);
      setDocuments(docRes.data ?? []);
    } catch { /* 무시 */ }
  }, []);

  /** 상태 변경 */
  const updateStatus = async (caseId, newStatus) => {
    try {
      await api.patch(`/cases/${caseId}`, { status: newStatus });
      setDetailCase((prev) => prev ? { ...prev, status: newStatus } : prev);
      loadCases();
    } catch (err) {
      alert("상태 변경 실패: " + err.message);
    }
  };

  /** 메시지 전송 */
  const sendMessage = async () => {
    if (!newMessage.trim() || !detailCase) return;
    try {
      await api.post(`/cases/${detailCase.id}/messages`, { content: newMessage, senderType: "lawyer" });
      setNewMessage("");
      const res = await api.get(`/cases/${detailCase.id}/messages`);
      setMessages(res.data ?? []);
    } catch (err) {
      alert("전송 실패: " + err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1a1a1a" }}>사건 관리</h1>
        <button onClick={openNew} style={btnStyle()}>+ 사건 등록</button>
      </div>

      {/* ==================== 편집 폼 ==================== */}
      {editing && (
        <div style={{ marginBottom: 32, padding: 28, background: "#f9f9f8", border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: "#1a1a1a" }}>
            {editing === "new" ? "새 사건 등록" : "사건 수정"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>사건명 *</label>
              <input style={fieldStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="손해배상 청구 사건" />
            </div>
            <div>
              <label style={labelStyle}>상태</label>
              <select style={fieldStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>의뢰인</label>
              <select style={fieldStyle} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                <option value="">선택해주세요</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>담당 변호사</label>
              <select style={fieldStyle} value={form.lawyerId} onChange={(e) => setForm({ ...form, lawyerId: e.target.value })}>
                <option value="">선택해주세요</option>
                {lawyers.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>사건 설명</label>
            <textarea
              style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="사건 개요를 입력하세요"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={save} style={btnStyle("#1a1a2e")}>저장</button>
            <button onClick={() => setEditing(null)} style={btnStyle("#999")}>취소</button>
          </div>
        </div>
      )}

      {/* ==================== 사건 상세 ==================== */}
      {detailCase && (
        <div style={{ marginBottom: 32, padding: 28, background: "#f9f9f8", border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1a1a1a", marginBottom: 6 }}>{detailCase.title}</h3>
              <StatusBadge status={detailCase.status} />
            </div>
            <button onClick={() => setDetailCase(null)} style={btnStyle("#999")}>닫기</button>
          </div>

          {/* 상태 변경 */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>상태 변경</label>
            <div style={{ display: "flex", gap: 8 }}>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => updateStatus(detailCase.id, s.value)}
                  style={{
                    padding: "6px 16px", fontSize: 12, borderRadius: 4, cursor: "pointer",
                    border: `1px solid ${detailCase.status === s.value ? s.color : "#ddd"}`,
                    background: detailCase.status === s.value ? s.bg : "#fff",
                    color: s.color, fontWeight: detailCase.status === s.value ? 600 : 400,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 문서 목록 */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>관련 서류 ({documents.length})</label>
            {documents.length === 0 ? (
              <p style={{ fontSize: 13, color: T.textMuted }}>등록된 서류가 없습니다</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} style={{ padding: "8px 12px", background: "#fff", border: "1px solid #e8e8e8", borderRadius: 4, fontSize: 13 }}>
                    {doc.title || doc.filename}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 메시지 스레드 */}
          <div>
            <label style={labelStyle}>메시지 ({messages.length})</label>
            <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 12, padding: 12, background: "#fff", border: "1px solid #e8e8e8", borderRadius: 6 }}>
              {messages.length === 0 ? (
                <p style={{ fontSize: 13, color: T.textMuted, textAlign: "center", padding: 20 }}>메시지가 없습니다</p>
              ) : (
                messages.map((m, i) => (
                  <div key={m.id || i} style={{
                    marginBottom: 10, display: "flex",
                    justifyContent: m.senderType === "lawyer" ? "flex-end" : "flex-start",
                  }}>
                    <div style={{
                      maxWidth: "70%", padding: "8px 14px", borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                      background: m.senderType === "lawyer" ? T.accent : "#f0f0f0",
                      color: m.senderType === "lawyer" ? "#fff" : T.text,
                    }}>
                      {m.content}
                      <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6 }}>
                        {m.createdAt ? new Date(m.createdAt).toLocaleString("ko-KR") : ""}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={{ ...fieldStyle, flex: 1 }}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="메시지 입력..."
                onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              />
              <button onClick={sendMessage} style={btnStyle(T.accent)}>전송</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 사건 목록 ==================== */}
      {loading ? (
        <p style={{ color: "#999", fontSize: 14 }}>로딩 중...</p>
      ) : cases.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#bbb" }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>&#x2696;&#xFE0F;</p>
          <p>등록된 사건이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-4"
              style={{ padding: "14px 20px", background: "#fff", border: "1px solid #e8e8e8", borderRadius: 6 }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-3" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{c.title}</span>
                  <StatusBadge status={c.status} />
                </div>
                <p style={{ fontSize: 12, color: T.textSec }}>
                  {c.clientName && <span>{c.clientName}</span>}
                  {c.lawyerName && <span style={{ color: T.textMuted }}> &middot; {c.lawyerName}</span>}
                  {c.createdAt && <span style={{ color: T.textMuted }}> &middot; {new Date(c.createdAt).toLocaleDateString("ko-KR")}</span>}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openDetail(c)} style={{ padding: "6px 12px", fontSize: 12, border: "1px solid #ddd", background: "#fff", borderRadius: 4, cursor: "pointer" }}>
                  상세
                </button>
                <button onClick={() => openEdit(c)} style={{ padding: "6px 12px", fontSize: 12, border: "1px solid #ddd", background: "#fff", borderRadius: 4, cursor: "pointer" }}>
                  수정
                </button>
                <button onClick={() => remove(c.id)} style={{ padding: "6px 12px", fontSize: 12, border: "1px solid #ddd", background: "#fff", borderRadius: 4, cursor: "pointer", color: "#c00" }}>
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
