/** 앱 라우터 설정 — 공개/에디터/관리자 경로 분기 */
import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import VaultPage from "./pages/VaultPage";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import SearchPage from "./pages/SearchPage";
import GraphPage from "./pages/GraphPage";
import TimelinePage from "./pages/TimelinePage";
import HistoryPage from "./pages/HistoryPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminTags from "./pages/admin/AdminTags";
import AdminHistory from "./pages/admin/AdminHistory";
import EditorPage from "./pages/editor/EditorPage";

function AdminLogin({ onLogin }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (pw === "1234") onLogin();
    else setErr("비밀번호가 틀렸습니다.");
  };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 360, padding: 32, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", letterSpacing: "0.08em", fontFamily: "'Montserrat', sans-serif" }}>SECOND BRAIN</p>
          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 6, letterSpacing: "0.1em" }}>KNOWLEDGE SYSTEM</p>
        </div>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호를 입력하세요"
          style={{ width: "100%", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, color: "#1e293b", padding: "12px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        {err && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 8 }}>{err}</p>}
        <button style={{ width: "100%", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "12px 0", fontSize: 14, fontWeight: 500, cursor: "pointer", marginTop: 16, transition: "background 0.15s" }}
          onMouseEnter={e => e.target.style.background = "#2563eb"}
          onMouseLeave={e => e.target.style.background = "#3b82f6"}
        >로그인</button>
      </form>
    </div>
  );
}

function AdminArea() {
  const [auth, setAuth] = useState(!!sessionStorage.getItem("admin"));
  const login = () => { sessionStorage.setItem("admin", "1"); setAuth(true); };
  const logout = () => { sessionStorage.removeItem("admin"); setAuth(false); };

  if (!auth) return <AdminLogin onLogin={login} />;

  return (
    <AdminLayout onLogout={logout}>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="documents" element={<AdminDocuments />} />
        <Route path="tags" element={<AdminTags />} />
        <Route path="history" element={<AdminHistory />} />
        <Route path="editor" element={<EditorPage />} />
        <Route path="editor/:id" element={<EditorPage />} />
      </Routes>
    </AdminLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/vault" element={<VaultPage />} />
          <Route path="/vault/:id" element={<DocumentDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/graph" element={<GraphPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>

        <Route path="/editor" element={<EditorPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
        <Route path="/admin/*" element={<AdminArea />} />
      </Routes>
    </BrowserRouter>
  );
}
