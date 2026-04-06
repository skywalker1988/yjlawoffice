/** 포털 레이아웃 — 의뢰인 포털 헤더/네비게이션 래퍼, 인증 확인 */
import { useEffect } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";

const T = { accent: "#b08d57", text: "#1e293b", border: "#e5e8ed" };

export default function PortalLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("portal_token");
    if (!token) navigate("/portal/login", { replace: true });
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("portal_token");
    navigate("/portal/login", { replace: true });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8f6" }}>
      {/* ==================== 헤더 ==================== */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 60, background: "#fff",
        borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100,
      }}>
        <Link to="/portal" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: "'Noto Serif KR', serif" }}>
            윤정 법률사무소
          </span>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link to="/portal" style={{ fontSize: 13, color: T.text, textDecoration: "none", fontWeight: 500 }}>
            대시보드
          </Link>
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 16px", fontSize: 13, fontWeight: 500,
              color: T.accent, background: "transparent",
              border: `1px solid ${T.accent}`, borderRadius: 4, cursor: "pointer",
            }}
          >
            로그아웃
          </button>
        </nav>
      </header>

      {/* ==================== 콘텐츠 ==================== */}
      <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
        <Outlet />
      </main>
    </div>
  );
}
