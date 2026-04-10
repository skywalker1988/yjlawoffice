/** 공개 페이지 레이아웃 — 헤더, 네비게이션, 푸터 */
import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useSiteSettingsPage, useLanguage, setLanguage } from "../hooks/useSiteSettings";
import Announcements from "./Announcements";
import ChatWidget from "./ChatWidget";
import KakaoChat from "./KakaoChat";
import NewsletterForm from "./NewsletterForm";

const NAV = [
  { to: "/about", label: "사무소 소개" },
  { to: "/practice", label: "업무분야" },
  { to: "/lawyers", label: "변호사 소개" },
  { to: "/consultation", label: "상담안내" },
  { to: "/blog", label: "법률 칼럼" },
  { to: "/cases", label: "성공 사례" },
];

const LAYOUT_DEFAULTS = {
  nav: { items: [{ to: "/about", label: "사무소 소개" }, { to: "/practice", label: "업무분야" }, { to: "/lawyers", label: "변호사 소개" }, { to: "/consultation", label: "상담안내" }, { to: "/blog", label: "법률 칼럼" }, { to: "/cases", label: "성공 사례" }] },
  footer: { companyName: "윤정 법률사무소", tagline: "진실된 마음으로 의뢰인의 목소리에 귀를 기울이며\n최선의 법률적 해법을 제시합니다", address: "서울특별시 서초구 서초대로 327, 5층", tel: "02-594-5583", fax: "02-594-5584", hours: "평일 09:00 - 18:00", note: "예약 상담 우선 진행", copyright: "© 2025-2026 윤정 법률사무소 YOUNJEONG LAW OFFICE. All Rights Reserved." },
};

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const lang = useLanguage();
  const { settings } = useSiteSettingsPage("layout", LAYOUT_DEFAULTS, lang);
  const isHome = pathname === "/";

  useEffect(() => { setMenuOpen(false); window.scrollTo(0, 0); }, [pathname]);
  useEffect(() => {
    let rafId = null;
    const fn = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 60);
        rafId = null;
      });
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => {
      window.removeEventListener("scroll", fn);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const heroTop = isHome && !scrolled && !menuOpen;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* ==================== 공지/배너 ==================== */}
      <Announcements />

      {/* ==================== HEADER ==================== */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: heroTop ? "transparent" : "rgba(255,255,255,0.95)",
          borderBottom: heroTop ? "1px solid var(--white-15)" : "1px solid var(--border-color)",
          backdropFilter: heroTop ? "none" : "blur(16px)",
        }}
      >
        {/* Utility bar */}
        <div style={{ borderBottom: heroTop ? "1px solid var(--white-08)" : "1px solid var(--border-subtle)" }}>
          <div className="container flex items-center justify-between" style={{ height: 30 }}>
            <div className="flex gap-4" style={{ fontSize: 10 }}>
              <span className="font-en" style={{ letterSpacing: "0.1em", color: heroTop ? "var(--white-60)" : "var(--text-muted)" }}>YOUNJEONG LAW OFFICE</span>
            </div>
            <div className="hidden md:flex gap-6 items-center" style={{ fontSize: 10, color: heroTop ? "var(--white-40)" : "var(--text-muted)" }}>
              <button onClick={() => setLanguage(lang === "ko" ? "en" : "ko")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 10, letterSpacing: "0.1em", padding: 0 }}
                aria-label="언어 전환 (한국어/English)">
                한/EN
              </button>
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
                  background: (heroTop || menuOpen) ? "#fff" : "var(--text-primary)",
                  top: menuOpen ? 8 : top,
                  transition: "all 0.3s",
                  transform: menuOpen ? (i === 0 ? "rotate(45deg)" : i === 2 ? "rotate(-45deg)" : "none") : "none",
                  opacity: menuOpen && i === 1 ? 0 : 1,
                }} />
              ))}
            </button>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8 flex-shrink-0" aria-label="주요 메뉴">
              {settings.nav.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="nav-text transition-colors duration-300"
                  style={({ isActive }) => ({
                    color: isActive
                      ? (heroTop ? "#fff" : "var(--text-primary)")
                      : (heroTop ? "rgba(255,255,255,0.6)" : "var(--text-muted)"),
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
        <div className="fixed inset-0 z-40 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="전체 메뉴" style={{ background: "rgba(15,25,35,0.97)", backdropFilter: "blur(24px)" }}>
          <nav className="text-center" aria-label="전체 메뉴 네비게이션">
            <NavLink to="/" end onClick={() => setMenuOpen(false)}
              className="block font-serif transition-colors duration-300 hover:text-[var(--accent-gold)]"
              style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 300, letterSpacing: "0.1em", lineHeight: 2.2, color: "var(--white-40)" }}>
              HOME
            </NavLink>
            {settings.nav.items.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                className="block font-serif transition-colors duration-300 hover:text-[var(--accent-gold)]"
                style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 300, letterSpacing: "0.1em", lineHeight: 2.2, color: "var(--white-40)" }}>
                {item.label}
              </NavLink>
            ))}
            <div style={{ paddingTop: 48 }}>
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="view-more" style={{ color: "var(--accent-gold)", borderColor: "var(--white-15)" }}>관리자 페이지</Link>
            </div>
          </nav>
        </div>
      )}

      {/* ==================== MAIN ==================== */}
      <main className="flex-1"><Outlet /></main>

      {/* ==================== FOOTER ==================== */}
      <footer style={{ background: "var(--bg-dark)", borderTop: "none" }} aria-label="사이트 하단 정보">
        <div className="container" style={{ paddingTop: 72, paddingBottom: 40 }}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12" style={{ marginBottom: 48 }}>
            <div className="md:col-span-5">
              <p className="font-serif" style={{ fontSize: 22, color: "var(--accent-gold)", letterSpacing: "0.14em", marginBottom: 24 }}>{settings.footer.companyName}</p>
              <div style={{ fontSize: 13, color: "var(--white-40)", lineHeight: 2.2 }}>
                {settings.footer.tagline.split("\n").map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 20, lineHeight: 2 }}>
                <p>{settings.footer.address}</p>
                <p>TEL {settings.footer.tel} / FAX {settings.footer.fax}</p>
              </div>
            </div>
            <div className="md:col-span-3">
              <p className="font-en" style={{ fontSize: 10, color: "var(--accent-gold)", letterSpacing: "0.2em", marginBottom: 20 }}>MENU</p>
              <div className="space-y-3" style={{ fontSize: 13 }}>
                {settings.nav.items.map((item) => (
                  <Link key={item.to} to={item.to} className="block transition-colors duration-300 hover:text-[var(--accent-gold)]" style={{ color: "var(--white-40)", textDecoration: "none" }}>{item.label}</Link>
                ))}
              </div>
            </div>
            <div className="md:col-span-4">
              <p className="font-en" style={{ fontSize: 10, color: "var(--accent-gold)", letterSpacing: "0.2em", marginBottom: 20 }}>CONTACT</p>
              <div style={{ fontSize: 13, color: "var(--white-40)", lineHeight: 2.2 }}>
                <p>{settings.footer.hours}</p>
                <p>{settings.footer.note}</p>
              </div>
              <Link to="/consultation"
                className="inline-block font-en transition-all duration-300 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]"
                style={{ border: "1px solid var(--white-15)", color: "var(--white-40)", padding: "12px 32px", fontSize: 12, letterSpacing: "0.15em", textDecoration: "none", marginTop: 20 }}>
                상담 예약
              </Link>
            </div>
          </div>
          {/* 뉴스레터 구독 */}
          <div style={{ borderTop: "1px solid var(--white-08)", paddingTop: 24, paddingBottom: 24 }}>
            <NewsletterForm />
          </div>

          <div style={{ borderTop: "1px solid var(--white-08)", paddingTop: 24 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p style={{ fontSize: 10, color: "var(--white-20)" }}>{settings.footer.copyright}</p>
          </div>
        </div>
      </footer>

      {/* 플로팅 위젯 */}
      <ChatWidget />
      <KakaoChat />
    </div>
  );
}
