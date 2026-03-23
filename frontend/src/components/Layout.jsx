/** 공개 페이지 레이아웃 — 헤더, 네비게이션, 푸터 */
import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

const NAV = [
  { to: "/vault", label: "VAULT" },
  { to: "/search", label: "SEARCH" },
  { to: "/graph", label: "GRAPH" },
  { to: "/timeline", label: "TIMELINE" },
  { to: "/history", label: "HISTORY" },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  useEffect(() => { setMenuOpen(false); window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const heroTop = isHome && !scrolled && !menuOpen;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* ==================== HEADER ==================== */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: heroTop ? "transparent" : "rgba(255,255,255,0.95)",
          borderBottom: heroTop ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(0,0,0,0.08)",
          backdropFilter: heroTop ? "none" : "blur(16px)",
        }}
      >
        {/* Utility bar */}
        <div style={{ borderBottom: heroTop ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.04)" }}>
          <div className="container flex items-center justify-between" style={{ height: 30 }}>
            <div className="flex gap-4" style={{ fontSize: 10 }}>
              <span className="font-en" style={{ letterSpacing: "0.1em", color: heroTop ? "rgba(255,255,255,0.7)" : "#999" }}>SECOND BRAIN</span>
            </div>
            <div className="hidden md:flex gap-6" style={{ fontSize: 10, color: heroTop ? "rgba(255,255,255,0.4)" : "#999" }}>
              <Link to="/admin" className="hover:opacity-70 transition-opacity">ADMIN</Link>
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="container" style={{ height: 64 }}>
          <div className="flex items-center justify-between h-full">
            {/* Hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="relative z-50 flex-shrink-0" style={{ width: 26, height: 18 }} aria-label="메뉴">
              {[0, 8, 16].map((top, i) => (
                <span key={i} style={{
                  position: "absolute", left: 0, width: i === 1 ? 18 : 26, height: 1.5,
                  background: heroTop ? "#fff" : "#1a1a1a",
                  top: menuOpen ? 8 : top,
                  transition: "all 0.3s",
                  transform: menuOpen ? (i === 0 ? "rotate(45deg)" : i === 2 ? "rotate(-45deg)" : "none") : "none",
                  opacity: menuOpen && i === 1 ? 0 : 1,
                }} />
              ))}
            </button>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8 flex-shrink-0">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="nav-text transition-colors duration-300"
                  style={({ isActive }) => ({
                    color: isActive
                      ? (heroTop ? "#fff" : "#1a1a1a")
                      : (heroTop ? "rgba(255,255,255,0.6)" : "#999"),
                  })}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="lg:hidden" style={{ width: 26 }} />
          </div>
        </div>
      </header>

      {/* ==================== FULLSCREEN MENU ==================== */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(24px)" }}>
          <nav className="text-center">
            <NavLink to="/" end onClick={() => setMenuOpen(false)}
              className="block font-serif transition-colors duration-300 hover:text-[var(--accent-gold)]"
              style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 300, letterSpacing: "0.1em", lineHeight: 2.2, color: "#ccc" }}>
              HOME
            </NavLink>
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                className="block font-serif transition-colors duration-300 hover:text-[var(--accent-gold)]"
                style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 300, letterSpacing: "0.1em", lineHeight: 2.2, color: "#ccc" }}>
                {item.label}
              </NavLink>
            ))}
            <div style={{ paddingTop: 48 }}>
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="view-more" style={{ color: "var(--accent-gold)" }}>관리자 페이지</Link>
            </div>
          </nav>
        </div>
      )}

      {/* ==================== MAIN ==================== */}
      <main className="flex-1"><Outlet /></main>

      {/* ==================== FOOTER ==================== */}
      <footer style={{ background: "#fafaf9", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="container" style={{ paddingTop: 64, paddingBottom: 40 }}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12" style={{ marginBottom: 48 }}>
            <div className="md:col-span-5">
              <p className="font-serif" style={{ fontSize: 20, color: "#1a1a1a", letterSpacing: "0.14em", marginBottom: 24 }}>SECOND BRAIN</p>
              <div style={{ fontSize: 13, color: "#999", lineHeight: 2.2 }}>
                <p>법률 지식 관리 시스템</p>
                <p>문서 · 판례 · 법령 · 논문</p>
              </div>
            </div>
            <div className="md:col-span-3">
              <p className="font-en" style={{ fontSize: 10, color: "#bbb", letterSpacing: "0.2em", marginBottom: 20 }}>MENU</p>
              <div className="space-y-3" style={{ fontSize: 13 }}>
                {NAV.map((item) => (
                  <Link key={item.to} to={item.to} className="block transition-colors duration-300 hover:text-[#1a1a1a]" style={{ color: "#bbb", textDecoration: "none" }}>{item.label}</Link>
                ))}
              </div>
            </div>
            <div className="md:col-span-4">
              <p className="font-en" style={{ fontSize: 10, color: "#bbb", letterSpacing: "0.2em", marginBottom: 20 }}>MANAGEMENT</p>
              <Link to="/admin"
                className="inline-block font-en transition-all duration-300 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]"
                style={{ border: "1px solid rgba(0,0,0,0.12)", color: "#999", padding: "12px 32px", fontSize: 12, letterSpacing: "0.15em", textDecoration: "none" }}>
                관리자 페이지
              </Link>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 24 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p style={{ fontSize: 10, color: "#ccc" }}>&copy; 2025-2026 SECOND BRAIN. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
