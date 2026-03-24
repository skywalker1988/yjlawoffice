/** 앱 라우터 설정 — 공개/에디터/관리자 경로 분기 */
import { useState, Component } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

/* ── 에러 바운더리: 렌더링 에러를 화면에 표시 ── */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: "monospace", background: "#1e1e1e", color: "#f44", minHeight: "100vh" }}>
          <h2 style={{ color: "#ff6b6b" }}>렌더링 에러 발생</h2>
          <pre style={{ whiteSpace: "pre-wrap", color: "#ffa" }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: "pre-wrap", color: "#aaa", marginTop: 20, fontSize: 12 }}>
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0b1a2e" }}>
      {/* 상단 골드 라인 */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, background: "#c9a961" }} />

      <form onSubmit={submit} style={{ width: "100%", maxWidth: 380, background: "#fff", borderRadius: 2, boxShadow: "0 12px 48px rgba(0,0,0,0.4)", overflow: "hidden" }}>
        {/* 네이비 헤더 */}
        <div style={{ background: "#0f2341", padding: "28px 32px 24px", textAlign: "center", borderBottom: "2px solid #c9a961" }}>
          {/* 엠블럼 */}
          <svg width="52" height="52" viewBox="0 0 80 80" fill="none" style={{ margin: "0 auto 12px" }}>
            <circle cx="40" cy="40" r="38" stroke="#c9a961" strokeWidth="2" />
            <circle cx="40" cy="40" r="34" stroke="#c9a961" strokeWidth="0.5" opacity="0.5" />
            <path d="M40 16 L56 24 L56 40 C56 52 40 62 40 62 C40 62 24 52 24 40 L24 24 Z" fill="none" stroke="#c9a961" strokeWidth="1.5" />
            <polygon points="40,22 42.5,29 50,29 44,33.5 46,41 40,37 34,41 36,33.5 30,29 37.5,29" fill="#c9a961" />
          </svg>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#c9a961", letterSpacing: "0.14em", fontFamily: "'Georgia', serif" }}>YUNJUNG LAW OFFICE</p>
          <p style={{ fontSize: 9, color: "rgba(201,169,97,0.5)", marginTop: 4, letterSpacing: "0.2em", textTransform: "uppercase" }}>Knowledge Management System</p>
        </div>

        {/* 폼 영역 */}
        <div style={{ padding: "28px 32px 32px" }}>
          <label style={{ display: "block", marginBottom: 6, fontSize: 10, fontWeight: 700, color: "#5a6a85", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            인증 코드
          </label>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="관리자 인증 코드를 입력하세요"
            style={{ width: "100%", background: "#f7f8fa", border: "1px solid #dce1e8", borderRadius: 2, color: "#1b2a4a", padding: "11px 14px", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
            onFocus={e => e.target.style.borderColor = "#c9a961"}
            onBlur={e => e.target.style.borderColor = "#dce1e8"}
          />
          {err && <p style={{ color: "#b91c1c", fontSize: 12, marginTop: 8, fontWeight: 500 }}>{err}</p>}
          <button style={{ width: "100%", background: "#0b1a2e", color: "#c9a961", border: "none", borderRadius: 2, padding: "11px 0", fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 16, letterSpacing: "0.1em", transition: "background 0.15s" }}
            onMouseEnter={e => e.target.style.background = "#142d52"}
            onMouseLeave={e => e.target.style.background = "#0b1a2e"}
          >AUTHORIZED ACCESS</button>
        </div>
      </form>

      {/* 하단 텍스트 */}
      <p style={{ marginTop: 24, fontSize: 9, color: "rgba(201,169,97,0.3)", letterSpacing: "0.15em", textTransform: "uppercase" }}>
        RESTRICTED ACCESS — AUTHORIZED PERSONNEL ONLY
      </p>
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

        <Route path="/editor" element={<ErrorBoundary><EditorPage /></ErrorBoundary>} />
        <Route path="/editor/:id" element={<ErrorBoundary><EditorPage /></ErrorBoundary>} />
        <Route path="/admin/*" element={<AdminArea />} />
      </Routes>
    </BrowserRouter>
  );
}
