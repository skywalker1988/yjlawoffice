/**
 * AdminLayout — 로그인 페이지 톤에 맞춘 미니멀 관리자 레이아웃
 * 다크 네이비 사이드바 + 깔끔한 미니멀 디자인
 */
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

/* 로그인 페이지와 통일된 디자인 토큰 */
const THEME = {
  navy: "#1a2332",
  navyDeep: "#111827",
  navyLight: "#243447",
  white: "#ffffff",
  offWhite: "#f9fafb",
  lightGray: "#f3f4f6",
  border: "#e5e7eb",
  borderLight: "#f0f0f0",
  text: "#1a1a1a",
  textSec: "#6b7280",
  textMuted: "#9ca3af",
  accent: "#1a2332",
  accentHover: "#2a3a4e",
  red: "#ef4444",
};

const MENU = [
  { to: "/admin", label: "대시보드", icon: "grid", end: true },
  { to: "/admin/editor", label: "에디터", icon: "edit" },
  { to: "/admin/documents", label: "문서 관리", icon: "file" },
  { to: "/admin/tags", label: "태그 관리", icon: "tag" },
  { to: "/admin/history", label: "세계사 관리", icon: "globe" },
  { to: "/admin/hero-videos", label: "히어로 영상", icon: "video" },
];

/** 사이드바 아이콘 SVG */
function Icon({ name, size = 18 }) {
  const icons = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></>,
    file: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></>,
    tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
    globe: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
    video: <><polygon points="23,7 16,12 23,17"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>,
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    left: <><polyline points="15,18 9,12 15,6"/></>,
    right: <><polyline points="9,18 15,12 9,6"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

export default function AdminLayout({ onLogout, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const isEditor = pathname.startsWith("/admin/editor");
  const sidebarWidth = collapsed ? 60 : 220;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: THEME.offWhite }}>
      {/* 사이드바 */}
      <aside style={{
        position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 40,
        width: sidebarWidth,
        background: THEME.navy,
        transition: "width 0.25s ease",
        display: "flex", flexDirection: "column",
        boxShadow: "2px 0 12px rgba(0,0,0,0.15)",
      }}>
        {/* 브랜드 */}
        <div style={{
          padding: collapsed ? "20px 0" : "24px 20px",
          display: "flex", flexDirection: collapsed ? "column" : "row",
          alignItems: "center", gap: collapsed ? 4 : 12,
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          minHeight: 72,
        }}>
          {/* 미니멀 로고 마크 */}
          <div style={{
            width: 32, height: 32, borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)",
            fontFamily: "'Georgia', serif", letterSpacing: "0.05em",
            flexShrink: 0,
          }}>
            YJ
          </div>
          {!collapsed && (
            <div style={{ lineHeight: 1.2 }}>
              <div style={{
                fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.8)",
                letterSpacing: "0.2em", fontFamily: "'Georgia', serif",
              }}>
                YOUNJEONG
              </div>
              <div style={{
                fontSize: 9, color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.15em", marginTop: 2,
              }}>
                ADMINISTRATION
              </div>
            </div>
          )}
        </div>

        {/* 섹션 라벨 */}
        {!collapsed && (
          <div style={{
            padding: "16px 20px 6px",
            fontSize: 9, fontWeight: 600, letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.25)", textTransform: "uppercase",
          }}>
            Menu
          </div>
        )}

        {/* 네비게이션 */}
        <nav style={{ flex: 1, padding: "4px 8px", overflowY: "auto" }}>
          {MENU.map((item) => (
            <NavLink
              key={item.to} to={item.to} end={item.end}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10,
                padding: collapsed ? "10px 0" : "9px 14px",
                justifyContent: collapsed ? "center" : "flex-start",
                fontSize: 12.5, fontWeight: isActive ? 600 : 400,
                letterSpacing: "0.02em",
                color: isActive ? "#ffffff" : "rgba(255,255,255,0.45)",
                background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                borderRadius: 4, textDecoration: "none",
                borderLeft: isActive ? "3px solid rgba(255,255,255,0.5)" : "3px solid transparent",
                transition: "all 0.15s", marginBottom: 1,
              })}
            >
              <span style={{ flexShrink: 0, display: "flex" }}>
                <Icon name={item.icon} size={17} />
              </span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* 하단 — 홈/로그아웃 + 토글 */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "8px" }}>
          <Link to="/" style={{
            display: "flex", alignItems: "center", gap: 8,
            justifyContent: collapsed ? "center" : "flex-start",
            fontSize: 11.5, color: "rgba(255,255,255,0.3)", textDecoration: "none",
            padding: collapsed ? "8px 0" : "7px 14px", borderRadius: 4,
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
          >
            <Icon name="home" size={15} />{!collapsed && "홈페이지"}
          </Link>
          <button onClick={onLogout} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            justifyContent: collapsed ? "center" : "flex-start",
            fontSize: 11.5, color: "rgba(255,255,255,0.3)", background: "none",
            border: "none", cursor: "pointer",
            padding: collapsed ? "8px 0" : "7px 14px", borderRadius: 4,
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
          >
            <Icon name="logout" size={15} />{!collapsed && "로그아웃"}
          </button>

          <button onClick={() => setCollapsed(!collapsed)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "100%", marginTop: 4, padding: "6px 0",
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.2)", borderRadius: 4,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.2)"}
          >
            <Icon name={collapsed ? "right" : "left"} size={14} />
          </button>
        </div>
      </aside>

      {/* 메인 영역 */}
      <div style={{
        flex: 1, marginLeft: sidebarWidth, transition: "margin-left 0.25s ease",
        minHeight: "100vh", display: "flex", flexDirection: "column",
        ...(isEditor ? { height: "100vh", overflow: "hidden" } : {}),
      }}>
        {/* 상단 배너 */}
        {!isEditor && (
          <div style={{
            background: THEME.navy,
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
            padding: "5px 0",
            fontSize: 9.5,
            fontWeight: 500,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontFamily: "'Georgia', serif",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}>
            YOUNJEONG LAW OFFICE — KNOWLEDGE MANAGEMENT SYSTEM
          </div>
        )}

        {isEditor ? children : (
          <div style={{ padding: "32px 40px", maxWidth: 1440, flex: 1 }}>
            {children}
          </div>
        )}

        {/* 하단 바 */}
        {!isEditor && (
          <div style={{
            borderTop: `1px solid ${THEME.border}`,
            padding: "10px 40px",
            fontSize: 10,
            color: THEME.textMuted,
            letterSpacing: "0.08em",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            textTransform: "uppercase",
          }}>
            <span>YOUNJEONG LAW OFFICE</span>
            <span style={{ fontFamily: "'Georgia', serif" }}>CONFIDENTIAL ACCESS</span>
          </div>
        )}
      </div>
    </div>
  );
}
