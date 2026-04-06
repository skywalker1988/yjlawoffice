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

import EditorPage from "./pages/editor/EditorPage";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminHeroVideos from "./pages/admin/AdminHeroVideos";
import AdminLawyers from "./pages/admin/AdminLawyers";
import AdminClients from "./pages/admin/AdminClients";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminSiteManager from "./pages/admin/AdminSiteManager";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminCases from "./pages/admin/AdminCases";
import BlogPage from "./pages/BlogPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import CasesPage from "./pages/CasesPage";
import ReviewsPage from "./pages/ReviewsPage";
import PortalLayout from "./pages/portal/PortalLayout";
import PortalLogin from "./pages/portal/PortalLogin";
import PortalRegister from "./pages/portal/PortalRegister";
import PortalDashboard from "./pages/portal/PortalDashboard";
import PortalCaseDetail from "./pages/portal/PortalCaseDetail";

function AdminArea() {
  const [auth, setAuth] = useState(!!sessionStorage.getItem("admin_token"));
  const login = () => {
    const token = Date.now().toString(36) + Math.random().toString(36).slice(2);
    sessionStorage.setItem("admin_token", token);
    setAuth(true);
  };
  const logout = () => { sessionStorage.removeItem("admin_token"); setAuth(false); };

  if (!auth) return <AdminLogin onLogin={login} />;

  return (
    <AdminLayout onLogout={logout}>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="documents" element={<AdminDocuments />} />

        <Route path="hero-videos" element={<AdminHeroVideos />} />
        <Route path="lawyers" element={<AdminLawyers />} />
        <Route path="clients" element={<AdminClients />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="site-manager" element={<AdminSiteManager />} />
        <Route path="media" element={<AdminMedia />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="cases" element={<AdminCases />} />
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
          <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
          <Route path="/about" element={<ErrorBoundary><AboutPage /></ErrorBoundary>} />
          <Route path="/practice" element={<ErrorBoundary><PracticePage /></ErrorBoundary>} />
          <Route path="/lawyers" element={<ErrorBoundary><LawyersPage /></ErrorBoundary>} />
          <Route path="/consultation" element={<ErrorBoundary><ConsultationPage /></ErrorBoundary>} />
          <Route path="/blog" element={<ErrorBoundary><BlogPage /></ErrorBoundary>} />
          <Route path="/blog/:slug" element={<ErrorBoundary><BlogDetailPage /></ErrorBoundary>} />
          <Route path="/cases" element={<ErrorBoundary><CasesPage /></ErrorBoundary>} />
          <Route path="/reviews" element={<ErrorBoundary><ReviewsPage /></ErrorBoundary>} />
        </Route>

        <Route path="/portal" element={<PortalLayout />}>
          <Route path="login" element={<PortalLogin />} />
          <Route path="register" element={<PortalRegister />} />
          <Route path="dashboard" element={<PortalDashboard />} />
          <Route path="cases/:id" element={<PortalCaseDetail />} />
        </Route>

        <Route path="/editor" element={<ErrorBoundary><EditorPage /></ErrorBoundary>} />
        <Route path="/editor/:id" element={<ErrorBoundary><EditorPage /></ErrorBoundary>} />
        <Route path="/admin/*" element={<AdminArea />} />
      </Routes>
    </BrowserRouter>
  );
}
