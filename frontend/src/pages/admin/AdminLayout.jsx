/**
 * AdminLayout — 프리미엄 로펌 관리자 레이아웃
 * 다크 그라디언트 사이드바 + 골드 악센트 + 세련된 타이포그래피
 */
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

/* 프리미엄 디자인 토큰 — 클린 화이트 + 딥 블루 악센트 */
const THEME = {
  /* 사이드바 */
  sidebarBg: "#ffffff",
  sidebarBorder: "#edf0f4",
  /* 악센트 — 골드 */
  accent: "#b08d57",
  accentLight: "#c8a97e",
  accentDim: "rgba(176,141,87,0.08)",
  accentText: "#9a7a48",
  /* 본문 */
  pageBg: "#f8f9fb",
  white: "#ffffff",
  border: "#e5e8ed",
  text: "#1e293b",
  textSec: "#475569",
  textMuted: "#94a3b8",
};

const MENU = [
  { to: "/admin", label: "대시보드", icon: "grid", end: true },
  { to: "/admin/editor", label: "에디터", icon: "edit" },
  { to: "/admin/documents", label: "문서 관리", icon: "file" },
  { to: "/admin/tags", label: "태그 관리", icon: "tag" },
  { to: "/admin/history", label: "세계사 관리", icon: "globe" },
  { to: "/admin/hero-videos", label: "히어로 영상", icon: "video" },
  { to: "/admin/lawyers", label: "변호사 관리", icon: "users" },
];

/** 사이드바 아이콘 SVG */
function Icon({ name, size = 18 }) {
  const icons = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></>,
    file: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></>,
    tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
    globe: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
    video: <><polygon points="23,7 16,12 23,17"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    left: <><polyline points="15,18 9,12 15,6"/></>,
    right: <><polyline points="9,18 15,12 9,6"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

export default function AdminLayout({ onLogout, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const { pathname } = useLocation();
  const isEditor = pathname.startsWith("/admin/editor");
  const sidebarWidth = collapsed ? 68 : 240;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: THEME.pageBg }}>
      {/* 사이드바 */}
      <aside style={{
        position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 40,
        width: sidebarWidth,
        background: THEME.sidebarBg,
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex", flexDirection: "column",
        boxShadow: "1px 0 0 #e5e8ed, 4px 0 16px rgba(0,0,0,0.04)",
        borderRight: `1px solid ${THEME.sidebarBorder}`,
      }}>
        {/* 브랜드 */}
        <div style={{
          padding: collapsed ? "24px 0" : "28px 24px",
          display: "flex", flexDirection: collapsed ? "column" : "row",
          alignItems: "center", gap: collapsed ? 6 : 14,
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: `1px solid ${THEME.sidebarBorder}`,
          minHeight: 80,
        }}>
          {/* 로고 마크 — 골드 악센트 */}
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: THEME.accentDim,
            border: `1px solid rgba(79,70,229,0.15)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: THEME.accent,
            fontFamily: "'Georgia', serif", letterSpacing: "0.08em",
            flexShrink: 0,
          }}>
            YJ
          </div>
          {!collapsed && (
            <div style={{ lineHeight: 1.3, overflow: "hidden" }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: THEME.text,
                letterSpacing: "0.22em", fontFamily: "'Georgia', serif",
              }}>
                YOUNJEONG
              </div>
              <div style={{
                fontSize: 9, color: THEME.accent,
                letterSpacing: "0.2em", marginTop: 3,
                fontWeight: 500,
              }}>
                ADMINISTRATION
              </div>
            </div>
          )}
        </div>

        {/* 섹션 라벨 */}
        {!collapsed && (
          <div style={{
            padding: "20px 24px 8px",
            fontSize: 9, fontWeight: 600, letterSpacing: "0.2em",
            color: THEME.textMuted, textTransform: "uppercase",
          }}>
            Navigation
          </div>
        )}

        {/* 네비게이션 */}
        <nav style={{ flex: 1, padding: collapsed ? "8px 8px" : "4px 12px", overflowY: "auto" }}>
          {MENU.map((item) => (
            <NavLink
              key={item.to} to={item.to} end={item.end}
              onMouseEnter={() => setHoveredItem(item.to)}
              onMouseLeave={() => setHoveredItem(null)}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 12,
                padding: collapsed ? "11px 0" : "10px 16px",
                justifyContent: collapsed ? "center" : "flex-start",
                fontSize: 13, fontWeight: isActive ? 600 : 450,
                letterSpacing: "0.02em",
                color: isActive ? THEME.accent : (hoveredItem === item.to ? THEME.text : THEME.textSec),
                background: isActive
                  ? THEME.accentDim
                  : (hoveredItem === item.to ? "#f5f6f8" : "transparent"),
                borderRadius: 8, textDecoration: "none",
                borderLeft: isActive ? `3px solid ${THEME.accent}` : "3px solid transparent",
                transition: "all 0.2s ease", marginBottom: 2,
                position: "relative",
              })}
            >
              <span style={{ flexShrink: 0, display: "flex", opacity: 0.9 }}>
                <Icon name={item.icon} size={17} />
              </span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* 하단 — 홈/로그아웃 + 토글 */}
        <div style={{ borderTop: `1px solid ${THEME.sidebarBorder}`, padding: "10px 12px" }}>
          <Link to="/" style={{
            display: "flex", alignItems: "center", gap: 10,
            justifyContent: collapsed ? "center" : "flex-start",
            fontSize: 12, color: THEME.textMuted, textDecoration: "none",
            padding: collapsed ? "8px 0" : "8px 16px", borderRadius: 8,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = THEME.text; e.currentTarget.style.background = "#f5f6f8"; }}
          onMouseLeave={e => { e.currentTarget.style.color = THEME.textMuted; e.currentTarget.style.background = "transparent"; }}
          >
            <Icon name="home" size={15} />{!collapsed && "홈페이지"}
          </Link>
          <button onClick={onLogout} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            justifyContent: collapsed ? "center" : "flex-start",
            fontSize: 12, color: THEME.textMuted, background: "none",
            border: "none", cursor: "pointer",
            padding: collapsed ? "8px 0" : "8px 16px", borderRadius: 8,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = THEME.text; e.currentTarget.style.background = "#f5f6f8"; }}
          onMouseLeave={e => { e.currentTarget.style.color = THEME.textMuted; e.currentTarget.style.background = "transparent"; }}
          >
            <Icon name="logout" size={15} />{!collapsed && "로그아웃"}
          </button>

          <button onClick={() => setCollapsed(!collapsed)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "100%", marginTop: 6, padding: "7px 0",
              background: "none", border: "none", cursor: "pointer",
              color: THEME.textMuted, borderRadius: 6,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = THEME.textSec}
            onMouseLeave={e => e.currentTarget.style.color = THEME.textMuted}
          >
            <Icon name={collapsed ? "right" : "left"} size={14} />
          </button>
        </div>
      </aside>

      {/* 메인 영역 */}
      <div style={{
        flex: 1, marginLeft: sidebarWidth,
        transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        minHeight: "100vh", display: "flex", flexDirection: "column",
        ...(isEditor ? { height: "100vh", overflow: "hidden" } : {}),
      }}>
        {/* 상단 배너 */}
        {!isEditor && (
          <div style={{
            background: THEME.white,
            color: THEME.textMuted,
            textAlign: "center",
            padding: "8px 0",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            borderBottom: `1px solid ${THEME.border}`,
          }}>
            YOUNJEONG LAW OFFICE — KNOWLEDGE MANAGEMENT SYSTEM
          </div>
        )}

        {isEditor ? children : (
          <div style={{ padding: "36px 44px", maxWidth: 1440, flex: 1 }}>
            {children}
          </div>
        )}

        {/* 하단 바 */}
        {!isEditor && (
          <div style={{
            borderTop: `1px solid ${THEME.border}`,
            padding: "12px 44px",
            fontSize: 10,
            color: THEME.textMuted,
            letterSpacing: "0.1em",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            textTransform: "uppercase",
            background: THEME.white,
          }}>
            <span>YOUNJEONG LAW OFFICE</span>
            <span style={{ fontFamily: "'Georgia', serif", color: THEME.textMuted }}>CONFIDENTIAL ACCESS</span>
          </div>
        )}
      </div>
    </div>
  );
}
