/** 관리자 설정 — 사용자 관리, 보안, 활동 로그, 개발 이력 */
import { useState, useEffect } from "react";
import { api } from "../../utils/api";

const TABS = ["사용자 관리", "보안", "활동 로그", "개발 이력"];
const ROLES = ["admin", "editor", "viewer"];
const ROLE_LABELS = { admin: "관리자", editor: "편집자", viewer: "뷰어" };
const ROLE_COLORS = { admin: "#c0392b", editor: "#3498db", viewer: "#95a5a6" };

const T = {
  accent: "#b08d57", text: "#1e293b", textSec: "#475569",
  textMuted: "#94a3b8", border: "#e5e8ed", card: "#ffffff",
};

const fieldStyle = {
  width: "100%", padding: "10px 14px", fontSize: 14,
  border: "1px solid #d0d0d0", borderRadius: 6, background: "#fff",
  fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};

const labelStyle = { fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4, display: "block" };

const btnStyle = (bg = "#1a1a2e") => ({
  padding: "8px 20px", fontSize: 13, fontWeight: 500,
  color: "#fff", background: bg, border: "none", borderRadius: 4, cursor: "pointer",
});

const badgeStyle = (color) => ({
  display: "inline-block", padding: "2px 10px", fontSize: 11,
  fontWeight: 600, borderRadius: 12, color: "#fff", background: color,
});

const EMPTY_USER = {
  username: "", name: "", password: "", role: "viewer", email: "", isActive: 1,
};

/* ================================================================
   사용자 관리 탭
   ================================================================ */
function UserManagementTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_USER);

  const load = () => {
    setLoading(true);
    api.get("/admin-users")
      .then((json) => setUsers(json.data ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => {
    setEditing("new");
    setForm({ ...EMPTY_USER });
  };

  const openEdit = (user) => {
    setEditing(user.id);
    setForm({
      username: user.username || "",
      name: user.name || "",
      password: "",
      role: user.role || "viewer",
      email: user.email || "",
      isActive: user.isActive ?? 1,
    });
  };

  const save = async () => {
    if (!form.username.trim()) return alert("아이디를 입력해주세요");
    if (!form.name.trim()) return alert("이름을 입력해주세요");
    if (editing === "new" && !form.password) return alert("비밀번호를 입력해주세요");

    const payload = { ...form };
    // 수정 시 비밀번호가 비어있으면 전송하지 않음
    if (editing !== "new" && !payload.password) delete payload.password;

    try {
      if (editing === "new") {
        await api.post("/admin-users", payload);
      } else {
        await api.patch(`/admin-users/${editing}`, payload);
      }
      setEditing(null);
      load();
    } catch (err) {
      alert("저장 실패: " + err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("이 사용자를 비활성화하시겠습니까?")) return;
    try {
      await api.delete(`/admin-users/${id}`);
      load();
    } catch (err) {
      alert("삭제 실패: " + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: T.text }}>사용자 목록</h2>
        <button onClick={openNew} style={btnStyle()}>+ 사용자 등록</button>
      </div>

      {/* 편집 폼 */}
      {editing && (
        <div style={{ marginBottom: 28, padding: 24, background: "#f9f9f8", border: `1px solid ${T.border}`, borderRadius: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 18, color: T.text }}>
            {editing === "new" ? "새 사용자 등록" : "사용자 정보 수정"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>아이디 *</label>
              <input style={fieldStyle} value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="admin01" disabled={editing !== "new"} />
            </div>
            <div>
              <label style={labelStyle}>이름 *</label>
              <input style={fieldStyle} value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="홍길동" />
            </div>
            <div>
              <label style={labelStyle}>{editing === "new" ? "비밀번호 *" : "비밀번호 (변경 시 입력)"}</label>
              <input type="password" style={fieldStyle} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editing === "new" ? "비밀번호 입력" : "변경하지 않으려면 비워두세요"} />
            </div>
            <div>
              <label style={labelStyle}>역할 *</label>
              <select style={fieldStyle} value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>이메일</label>
              <input type="email" style={fieldStyle} value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@example.com" />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <label style={{ fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={form.isActive === 1}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked ? 1 : 0 })} />
                활성 상태
              </label>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={save} style={btnStyle("#1a1a2e")}>저장</button>
            <button onClick={() => setEditing(null)} style={btnStyle("#999")}>취소</button>
          </div>
        </div>
      )}

      {/* 사용자 테이블 */}
      {loading ? (
        <p style={{ color: T.textMuted, fontSize: 14 }}>로딩 중...</p>
      ) : users.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>
          <p style={{ fontSize: 36, marginBottom: 10 }}>👤</p>
          <p>등록된 사용자가 없습니다</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {["아이디", "이름", "역할", "이메일", "마지막 로그인", "상태", ""].map((h) => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: T.textSec, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${T.border}`, opacity: u.isActive ? 1 : 0.5 }}>
                  <td style={{ padding: "10px 12px", fontWeight: 500 }}>{u.username}</td>
                  <td style={{ padding: "10px 12px" }}>{u.name}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={badgeStyle(ROLE_COLORS[u.role] || "#999")}>{ROLE_LABELS[u.role] || u.role}</span>
                  </td>
                  <td style={{ padding: "10px 12px", color: T.textMuted }}>{u.email || "-"}</td>
                  <td style={{ padding: "10px 12px", color: T.textMuted, fontSize: 12 }}>
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString("ko-KR") : "-"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={badgeStyle(u.isActive ? "#27ae60" : "#e74c3c")}>{u.isActive ? "활성" : "비활성"}</span>
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button onClick={() => openEdit(u)}
                        style={{ padding: "5px 10px", fontSize: 12, border: "1px solid #ddd", background: "#fff", borderRadius: 4, cursor: "pointer" }}>
                        수정
                      </button>
                      <button onClick={() => remove(u.id)}
                        style={{ padding: "5px 10px", fontSize: 12, border: "1px solid #ddd", background: "#fff", borderRadius: 4, cursor: "pointer", color: "#c00" }}>
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   보안 탭
   ================================================================ */
function SecurityTab() {
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [msg, setMsg] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    api.get("/admin-users/me")
      .then((json) => setCurrentUser(json.data ?? null))
      .catch(() => setCurrentUser(null));
  }, []);

  const changePassword = async () => {
    if (!pwForm.current) return alert("현재 비밀번호를 입력해주세요");
    if (!pwForm.newPw) return alert("새 비밀번호를 입력해주세요");
    if (pwForm.newPw.length < 4) return alert("비밀번호는 4자 이상이어야 합니다");
    if (pwForm.newPw !== pwForm.confirm) return alert("새 비밀번호가 일치하지 않습니다");

    try {
      await api.post("/admin-users/change-password", {
        currentPassword: pwForm.current,
        newPassword: pwForm.newPw,
      });
      setMsg({ type: "success", text: "비밀번호가 변경되었습니다." });
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (err) {
      setMsg({ type: "error", text: "변경 실패: " + err.message });
    }
  };

  return (
    <div>
      {/* 현재 사용자 정보 */}
      <div style={{ marginBottom: 28, padding: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 14 }}>현재 로그인 정보</h3>
        {currentUser ? (
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "8px 16px", fontSize: 13 }}>
            <span style={{ color: T.textMuted }}>아이디</span>
            <span style={{ fontWeight: 500 }}>{currentUser.username}</span>
            <span style={{ color: T.textMuted }}>이름</span>
            <span>{currentUser.name}</span>
            <span style={{ color: T.textMuted }}>역할</span>
            <span><span style={badgeStyle(ROLE_COLORS[currentUser.role])}>{ROLE_LABELS[currentUser.role]}</span></span>
            <span style={{ color: T.textMuted }}>이메일</span>
            <span>{currentUser.email || "-"}</span>
            <span style={{ color: T.textMuted }}>마지막 로그인</span>
            <span>{currentUser.lastLogin ? new Date(currentUser.lastLogin).toLocaleString("ko-KR") : "-"}</span>
          </div>
        ) : (
          <p style={{ color: T.textMuted, fontSize: 13 }}>로그인 정보를 불러올 수 없습니다.</p>
        )}
      </div>

      {/* 비밀번호 변경 */}
      <div style={{ padding: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, maxWidth: 420 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 14 }}>비밀번호 변경</h3>

        {msg && (
          <div style={{
            marginBottom: 14, padding: "8px 14px", borderRadius: 6, fontSize: 13,
            background: msg.type === "success" ? "#d4edda" : "#f8d7da",
            color: msg.type === "success" ? "#155724" : "#721c24",
          }}>
            {msg.text}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>현재 비밀번호</label>
            <input type="password" style={fieldStyle} value={pwForm.current}
              onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
              placeholder="현재 비밀번호 입력" />
          </div>
          <div>
            <label style={labelStyle}>새 비밀번호</label>
            <input type="password" style={fieldStyle} value={pwForm.newPw}
              onChange={(e) => setPwForm({ ...pwForm, newPw: e.target.value })}
              placeholder="새 비밀번호 입력" />
          </div>
          <div>
            <label style={labelStyle}>새 비밀번호 확인</label>
            <input type="password" style={fieldStyle} value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              placeholder="새 비밀번호 다시 입력" />
          </div>
        </div>
        <button onClick={changePassword} style={btnStyle(T.accent)}>비밀번호 변경</button>
      </div>
    </div>
  );
}

/* ================================================================
   활동 로그 탭
   ================================================================ */
function ActivityLogTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const load = (p) => {
    setLoading(true);
    const offset = (p - 1) * LIMIT;
    api.get(`/site-settings/history?limit=${LIMIT}&offset=${offset}`)
      .then((json) => {
        setLogs(json.data ?? []);
        setTotal(json.meta?.total ?? 0);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page); }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 16 }}>최근 활동 로그</h2>

      {loading ? (
        <p style={{ color: T.textMuted, fontSize: 14 }}>로딩 중...</p>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>
          <p style={{ fontSize: 36, marginBottom: 10 }}>📋</p>
          <p>기록된 활동이 없습니다</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {logs.map((log, i) => (
              <div key={log.id ?? i} style={{
                padding: "12px 16px", background: T.card,
                border: `1px solid ${T.border}`, borderRadius: 6,
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <span style={{ fontSize: 11, color: T.textMuted, minWidth: 130, flexShrink: 0 }}>
                  {log.createdAt ? new Date(log.createdAt).toLocaleString("ko-KR") : "-"}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: T.text, minWidth: 80 }}>
                  {log.changedBy || "시스템"}
                </span>
                <span style={{ fontSize: 13, color: T.textSec, flex: 1 }}>
                  {log.section || log.action || "설정 변경"}
                  {log.description && <span style={{ color: T.textMuted }}> - {log.description}</span>}
                </span>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 }}>
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
                style={{ ...btnStyle("#eee"), color: "#333", opacity: page <= 1 ? 0.4 : 1 }}>
                이전
              </button>
              <span style={{ fontSize: 13, color: T.textSec }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
                style={{ ...btnStyle("#eee"), color: "#333", opacity: page >= totalPages ? 0.4 : 1 }}>
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ================================================================
   개발 이력 탭
   ================================================================ */
function DevHistoryTab() {
  const [devLogs, setDevLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dev-logs")
      .then((json) => setDevLogs(json.data ?? []))
      .catch(() => setDevLogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 16 }}>개발 이력</h2>

      {loading ? (
        <p style={{ color: T.textMuted, fontSize: 14 }}>로딩 중...</p>
      ) : devLogs.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>
          <p style={{ fontSize: 36, marginBottom: 10 }}>📝</p>
          <p>기록된 개발 이력이 없습니다</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {devLogs.map((log, i) => (
            <div key={log.id ?? i} style={{
              padding: "16px 20px", background: T.card,
              border: `1px solid ${T.border}`, borderRadius: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>{log.date || "-"}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{log.title}</span>
              </div>
              {log.summary && (
                <p style={{ fontSize: 13, color: T.textSec, margin: 0, lineHeight: 1.6 }}>{log.summary}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   메인 설정 페이지
   ================================================================ */
export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: T.text, marginBottom: 24 }}>관리자 설정</h1>

      {/* 탭 네비게이션 */}
      <div style={{ display: "flex", gap: 0, borderBottom: `2px solid ${T.border}`, marginBottom: 28 }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              padding: "10px 22px", fontSize: 13, fontWeight: activeTab === i ? 600 : 400,
              color: activeTab === i ? T.accent : T.textSec,
              background: "transparent", border: "none", cursor: "pointer",
              borderBottom: activeTab === i ? `2px solid ${T.accent}` : "2px solid transparent",
              marginBottom: -2, transition: "all 0.15s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 0 && <UserManagementTab />}
      {activeTab === 1 && <SecurityTab />}
      {activeTab === 2 && <ActivityLogTab />}
      {activeTab === 3 && <DevHistoryTab />}
    </div>
  );
}
