/**
 * AdminLayout — 미국 정부 스타일 관리자 레이아웃
 * 다크 네이비 사이드바 + 골드 엠블럼 + 공식 문서 스타일
 */
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

/* 미국 정부 스타일 디자인 시스템 색상 */
const GOV = {
  navy: "#0b1a2e",
  navyLight: "#112240",
  navyMid: "#1a2f4e",
  gold: "#c9a961",
  goldLight: "#dfc382",
  goldDim: "rgba(201,169,97,0.15)",
  white: "#ffffff",
  offWhite: "#f7f8fa",
  lightGray: "#eef0f4",
  border: "#dce1e8",
  text: "#1b2a4a",
  textSecondary: "#5a6a85",
  textMuted: "#8e99ab",
  red: "#b91c1c",
  headerBar: "#1a237e",
};

const MENU = [
  { to: "/admin", label: "대시보드", icon: "grid", end: true },
  { to: "/admin/editor", label: "에디터", icon: "edit" },
  { to: "/admin/documents", label: "문서 관리", icon: "file" },
  { to: "/admin/tags", label: "태그 관리", icon: "tag" },
  { to: "/admin/history", label: "세계사 관리", icon: "globe" },
];

/** 사이드바 아이콘 SVG */
function Icon({ name, size = 18 }) {
  const icons = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></>,
    file: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></>,
    tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
    globe: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    left: <><polyline points="15,18 9,12 15,6"/></>,
    right: <><polyline points="9,18 15,12 9,6"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

/** 정부 스타일 엠블럼 (별+방패) */
function GovSeal({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      {/* 외곽 원 */}
      <circle cx="40" cy="40" r="38" stroke={GOV.gold} strokeWidth="2" />
      <circle cx="40" cy="40" r="34" stroke={GOV.gold} strokeWidth="0.5" opacity="0.5" />
      {/* 방패 */}
      <path d="M40 16 L56 24 L56 40 C56 52 40 62 40 62 C40 62 24 52 24 40 L24 24 Z" fill="none" stroke={GOV.gold} strokeWidth="1.5" />
      {/* 방패 내부 세로줄 */}
      <line x1="40" y1="24" x2="40" y2="55" stroke={GOV.gold} strokeWidth="0.5" opacity="0.4" />
      <line x1="32" y1="26" x2="32" y2="48" stroke={GOV.gold} strokeWidth="0.5" opacity="0.3" />
      <line x1="48" y1="26" x2="48" y2="48" stroke={GOV.gold} strokeWidth="0.5" opacity="0.3" />
      {/* 별 */}
      <polygon points="40,22 42.5,29 50,29 44,33.5 46,41 40,37 34,41 36,33.5 30,29 37.5,29" fill={GOV.gold} />
      {/* 하단 장식 점 */}
      {[0, 1, 2, 3, 4].map(i => (
        <circle key={i} cx={28 + i * 6} cy="68" r="1.2" fill={GOV.gold} opacity="0.6" />
      ))}
    </svg>
  );
}

export default function AdminLayout({ onLogout, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();
  const isEditor = pathname.startsWith("/admin/editor");
  const sidebarWidth = collapsed ? 60 : 240;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: GOV.offWhite }}>
      {/* 사이드바 — 다크 네이비 정부 스타일 */}
      <aside style={{
        position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 40,
        width: sidebarWidth,
        background: `linear-gradient(180deg, ${GOV.navy} 0%, ${GOV.navyLight} 100%)`,
        transition: "width 0.25s ease",
        display: "flex", flexDirection: "column",
        boxShadow: "2px 0 8px rgba(0,0,0,0.3)",
      }}>
        {/* 엠블럼 + 타이틀 */}
        <div style={{
          padding: collapsed ? "16px 0" : "20px 20px",
          display: "flex", flexDirection: collapsed ? "column" : "row",
          alignItems: "center", gap: collapsed ? 4 : 12,
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: `1px solid rgba(201,169,97,0.15)`,
          minHeight: 80,
        }}>
          <GovSeal size={collapsed ? 32 : 40} />
          {!collapsed && (
            <div style={{ lineHeight: 1.2 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: GOV.gold,
                letterSpacing: "0.14em", fontFamily: "'Georgia', serif",
              }}>
                YUNJUNG
              </div>
              <div style={{
                fontSize: 9, color: "rgba(201,169,97,0.6)",
                letterSpacing: "0.12em", marginTop: 2,
              }}>
                LAW OFFICE
              </div>
            </div>
          )}
        </div>

        {/* 섹션 라벨 */}
        {!collapsed && (
          <div style={{
            padding: "14px 20px 6px",
            fontSize: 9, fontWeight: 600, letterSpacing: "0.2em",
            color: "rgba(201,169,97,0.4)", textTransform: "uppercase",
          }}>
            Administration
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
                color: isActive ? GOV.gold : "rgba(255,255,255,0.55)",
                background: isActive ? GOV.goldDim : "transparent",
                borderRadius: 4, textDecoration: "none",
                borderLeft: isActive ? `3px solid ${GOV.gold}` : "3px solid transparent",
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
        <div style={{ borderTop: "1px solid rgba(201,169,97,0.12)", padding: "8px" }}>
          <Link to="/" style={{
            display: "flex", alignItems: "center", gap: 8,
            justifyContent: collapsed ? "center" : "flex-start",
            fontSize: 11.5, color: "rgba(255,255,255,0.35)", textDecoration: "none",
            padding: collapsed ? "8px 0" : "7px 14px", borderRadius: 4,
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
          >
            <Icon name="home" size={15} />{!collapsed && "공개 사이트"}
          </Link>
          <button onClick={onLogout} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            justifyContent: collapsed ? "center" : "flex-start",
            fontSize: 11.5, color: "rgba(255,255,255,0.35)", background: "none",
            border: "none", cursor: "pointer",
            padding: collapsed ? "8px 0" : "7px 14px", borderRadius: 4,
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
          >
            <Icon name="logout" size={15} />{!collapsed && "로그아웃"}
          </button>

          {/* 접기/펼치기 */}
          <button onClick={() => setCollapsed(!collapsed)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "100%", marginTop: 4, padding: "6px 0",
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.25)", borderRadius: 4,
              transition: "color 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.25)"}
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
        {/* 상단 분류 배너 — 정부 문서 스타일 */}
        {!isEditor && (
          <div style={{
            background: GOV.navy,
            color: GOV.gold,
            textAlign: "center",
            padding: "5px 0",
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            fontFamily: "'Georgia', serif",
            borderBottom: `2px solid ${GOV.gold}`,
          }}>
            YUNJUNG LAW OFFICE — KNOWLEDGE MANAGEMENT SYSTEM
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
            borderTop: `1px solid ${GOV.border}`,
            padding: "10px 40px",
            fontSize: 10,
            color: GOV.textMuted,
            letterSpacing: "0.05em",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>YUNJUNG LAW OFFICE INTERNAL SYSTEM</span>
            <span style={{ fontFamily: "'Georgia', serif" }}>RESTRICTED ACCESS</span>
          </div>
        )}
      </div>
    </div>
  );
}
