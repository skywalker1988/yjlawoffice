/** 앱 라우터 설정 — 공개/에디터/관리자 경로 분기, 코드 스플리팅 적용 */
import { useState, useEffect, Component, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";

/* ── 로딩 폴백: 지연 로딩 중 표시할 스피너 ── */
function LoadingFallback() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "60vh",
      fontFamily: "'Malgun Gothic', sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid #e5e7eb",
            borderTop: "3px solid #2563eb",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        <p style={{ color: "#6b7280", fontSize: 14 }}>로딩 중...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

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

/* ── 메인 청크: 공개 페이지 (정적 임포트, 빠른 초기 로딩) ── */
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import LawyersPage from "./pages/LawyersPage";
import PracticePage from "./pages/PracticePage";
import PracticeConstructionPage from "./pages/PracticeConstructionPage";
import PracticeRealEstatePage from "./pages/PracticeRealEstatePage";
import ConsultationPage from "./pages/ConsultationPage";

/* ── 블로그 청크: 지연 로딩 ── */
const BlogPage = lazy(() => import("./pages/BlogPage"));
const BlogDetailPage = lazy(() => import("./pages/BlogDetailPage"));

/* ── 사례/후기 청크: 지연 로딩 ── */
const CasesPage = lazy(() => import("./pages/CasesPage"));
const ReviewsPage = lazy(() => import("./pages/ReviewsPage"));

/* ── 에디터 청크: 가장 큰 번들, 지연 로딩 ── */
const EditorPage = lazy(() => import("./pages/editor/EditorPage"));

/* ── 관리자 청크: 지연 로딩 ── */
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminDocuments = lazy(() => import("./pages/admin/AdminDocuments"));
const AdminHeroVideos = lazy(() => import("./pages/admin/AdminHeroVideos"));
const AdminLawyers = lazy(() => import("./pages/admin/AdminLawyers"));
const AdminClients = lazy(() => import("./pages/admin/AdminClients"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminSiteManager = lazy(() => import("./pages/admin/AdminSiteManager"));
const AdminMedia = lazy(() => import("./pages/admin/AdminMedia"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings"));
const AdminCases = lazy(() => import("./pages/admin/AdminCases"));

/* ── 포털 청크: 지연 로딩 ── */
const PortalLayout = lazy(() => import("./pages/portal/PortalLayout"));
const PortalLogin = lazy(() => import("./pages/portal/PortalLogin"));
const PortalRegister = lazy(() => import("./pages/portal/PortalRegister"));
const PortalDashboard = lazy(() => import("./pages/portal/PortalDashboard"));
const PortalCaseDetail = lazy(() => import("./pages/portal/PortalCaseDetail"));

/** 지연 로딩 컴포넌트를 Suspense로 감싸는 헬퍼 */
function LazyRoute({ children }) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      {children}
    </Suspense>
  );
}

/** /editor/:id → /admin/editor/:id 리다이렉트 */
function EditorRedirect() {
  const { id } = useParams();
  return <Navigate to={`/admin/editor/${id}`} replace />;
}

function AdminArea() {
  const [auth, setAuth] = useState(false);
  const [checking, setChecking] = useState(true);

  // 마운트 시 서버에 토큰 유효성 검증 요청
  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) { setChecking(false); return; }
    fetch("/api/sb/admin-users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(() => setAuth(true))
      .catch(() => { sessionStorage.removeItem("admin_token"); })
      .finally(() => setChecking(false));
  }, []);

  const login = () => setAuth(true);
  const logout = () => {
    const token = sessionStorage.getItem("admin_token");
    if (token) {
      fetch("/api/sb/admin-users/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    sessionStorage.removeItem("admin_token");
    setAuth(false);
  };

  if (checking) return <LoadingFallback />;
  if (!auth) return <LazyRoute><AdminLogin onLogin={login} /></LazyRoute>;

  return (
    <LazyRoute>
      <AdminLayout onLogout={logout}>
        <Routes>
          <Route index element={<LazyRoute><AdminDashboard /></LazyRoute>} />
          <Route path="documents" element={<LazyRoute><AdminDocuments /></LazyRoute>} />
          <Route path="hero-videos" element={<LazyRoute><AdminHeroVideos /></LazyRoute>} />
          <Route path="lawyers" element={<LazyRoute><AdminLawyers /></LazyRoute>} />
          <Route path="clients" element={<LazyRoute><AdminClients /></LazyRoute>} />
          <Route path="messages" element={<LazyRoute><AdminMessages /></LazyRoute>} />
          <Route path="site-manager" element={<LazyRoute><AdminSiteManager /></LazyRoute>} />
          <Route path="media" element={<LazyRoute><AdminMedia /></LazyRoute>} />
          <Route path="analytics" element={<LazyRoute><AdminAnalytics /></LazyRoute>} />
          <Route path="settings" element={<LazyRoute><AdminSettings /></LazyRoute>} />
          <Route path="reviews" element={<LazyRoute><AdminReviews /></LazyRoute>} />
          <Route path="bookings" element={<LazyRoute><AdminBookings /></LazyRoute>} />
          <Route path="cases" element={<LazyRoute><AdminCases /></LazyRoute>} />
          <Route path="editor" element={<LazyRoute><EditorPage /></LazyRoute>} />
          <Route path="editor/:id" element={<LazyRoute><EditorPage /></LazyRoute>} />
        </Routes>
      </AdminLayout>
    </LazyRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 공개 페이지 — 정적 임포트, 빠른 초기 로딩 */}
        <Route element={<Layout />}>
          <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
          <Route path="/about" element={<ErrorBoundary><AboutPage /></ErrorBoundary>} />
          <Route path="/practice" element={<ErrorBoundary><PracticePage /></ErrorBoundary>} />
          <Route path="/practice/construction" element={<ErrorBoundary><PracticeConstructionPage /></ErrorBoundary>} />
          <Route path="/practice/realestate" element={<ErrorBoundary><PracticeRealEstatePage /></ErrorBoundary>} />
          <Route path="/lawyers" element={<ErrorBoundary><LawyersPage /></ErrorBoundary>} />
          <Route path="/consultation" element={<ErrorBoundary><ConsultationPage /></ErrorBoundary>} />

          {/* 블로그 — 지연 로딩 */}
          <Route path="/blog" element={<ErrorBoundary><LazyRoute><BlogPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/blog/:slug" element={<ErrorBoundary><LazyRoute><BlogDetailPage /></LazyRoute></ErrorBoundary>} />

          {/* 사례/후기 — 지연 로딩 */}
          <Route path="/cases" element={<ErrorBoundary><LazyRoute><CasesPage /></LazyRoute></ErrorBoundary>} />
          <Route path="/reviews" element={<ErrorBoundary><LazyRoute><ReviewsPage /></LazyRoute></ErrorBoundary>} />
        </Route>

        {/* 포털 — 지연 로딩 */}
        <Route path="/portal" element={<ErrorBoundary><LazyRoute><PortalLayout /></LazyRoute></ErrorBoundary>}>
          <Route path="login" element={<LazyRoute><PortalLogin /></LazyRoute>} />
          <Route path="register" element={<LazyRoute><PortalRegister /></LazyRoute>} />
          <Route path="dashboard" element={<LazyRoute><PortalDashboard /></LazyRoute>} />
          <Route path="cases/:id" element={<LazyRoute><PortalCaseDetail /></LazyRoute>} />
        </Route>

        {/* 에디터 — 관리자 인증 필요 (AdminArea로 리다이렉트) */}
        <Route path="/editor" element={<Navigate to="/admin/editor" replace />} />
        <Route path="/editor/:id" element={<EditorRedirect />} />

        {/* 관리자 — 지연 로딩 */}
        <Route path="/admin/*" element={<ErrorBoundary><AdminArea /></ErrorBoundary>} />
      </Routes>
    </BrowserRouter>
  );
}
