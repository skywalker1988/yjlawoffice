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
import AboutPage from "./pages/AboutPage";
import LawyersPage from "./pages/LawyersPage";
import PracticePage from "./pages/PracticePage";
import ConsultationPage from "./pages/ConsultationPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminTags from "./pages/admin/AdminTags";
import AdminHistory from "./pages/admin/AdminHistory";
import EditorPage from "./pages/editor/EditorPage";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminHeroVideos from "./pages/admin/AdminHeroVideos";
import AdminLawyers from "./pages/admin/AdminLawyers";

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
        <Route path="hero-videos" element={<AdminHeroVideos />} />
        <Route path="lawyers" element={<AdminLawyers />} />
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
          <Route path="/about" element={<AboutPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/lawyers" element={<LawyersPage />} />
          <Route path="/consultation" element={<ConsultationPage />} />
        </Route>

        <Route path="/editor" element={<ErrorBoundary><EditorPage /></ErrorBoundary>} />
        <Route path="/editor/:id" element={<ErrorBoundary><EditorPage /></ErrorBoundary>} />
        <Route path="/admin/*" element={<AdminArea />} />
      </Routes>
    </BrowserRouter>
  );
}
