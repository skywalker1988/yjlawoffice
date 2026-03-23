/** AdminLayout — 관리자 영역 사이드바 레이아웃 */
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

/*
  Admin Design System — unified light blue tone
  - Sidebar: #f8fafc (very light) with #3b82f6 accents
  - Background: #f1f5f9
  - Cards: #ffffff
  - Accent: #3b82f6
  - Text: #1e293b / #64748b / #94a3b8
*/

const MENU = [
  { to: "/admin", label: "대시보드", icon: "grid", end: true },
  { to: "/admin/editor", label: "에디터", icon: "edit" },
  { to: "/admin/documents", label: "문서 관리", icon: "file" },
  { to: "/admin/tags", label: "태그 관리", icon: "tag" },
  { to: "/admin/history", label: "세계사 관리", icon: "globe" },
];

function Icon({ name, size = 18 }) {
  const icons = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></>,
    file: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></>,
    tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
    globe: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
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

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9" }}>
      {/* Sidebar — light, clean */}
      <aside style={{
        position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 40,
        width: collapsed ? 56 : 220,
        background: "#ffffff",
        borderRight: "1px solid #e2e8f0",
        transition: "width 0.2s ease",
        display: "flex", flexDirection: "column",
      }}>
        {/* Logo */}
        <div style={{
          height: 52, display: "flex", alignItems: "center",
          padding: collapsed ? "0 10px" : "0 16px",
          justifyContent: collapsed ? "center" : "space-between",
          borderBottom: "1px solid #e2e8f0",
        }}>
          {!collapsed && (
            <Link to="/admin" style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", letterSpacing: "0.06em", textDecoration: "none", fontFamily: "'Montserrat', sans-serif" }}>
              SECOND BRAIN
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, borderRadius: 4, display: "flex" }}
          >
            <Icon name={collapsed ? "right" : "left"} size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 6px", overflowY: "auto" }}>
          {MENU.map((item) => (
            <NavLink
              key={item.to} to={item.to} end={item.end}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10,
                padding: collapsed ? "9px 0" : "8px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? "#3b82f6" : "#64748b",
                background: isActive ? "#eff6ff" : "transparent",
                borderRadius: 6, textDecoration: "none",
                transition: "all 0.12s", marginBottom: 1,
              })}
            >
              <span style={{ flexShrink: 0, display: "flex" }}><Icon name={item.icon} size={18} /></span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: collapsed ? "10px 6px" : "10px 14px", borderTop: "1px solid #e2e8f0" }}>
          <Link to="/" style={{
            display: "flex", alignItems: "center", gap: 8,
            justifyContent: collapsed ? "center" : "flex-start",
            fontSize: 12, color: "#94a3b8", textDecoration: "none", padding: "5px 0",
          }}>
            <Icon name="home" size={15} />{!collapsed && "홈으로"}
          </Link>
          <button onClick={onLogout} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            justifyContent: collapsed ? "center" : "flex-start",
            fontSize: 12, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: "5px 0",
          }}>
            <Icon name="logout" size={15} />{!collapsed && "로그아웃"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, marginLeft: collapsed ? 56 : 220, transition: "margin-left 0.2s ease", minHeight: "100vh", ...(isEditor ? { height: "100vh", overflow: "hidden" } : {}) }}>
        {isEditor ? children : <div style={{ padding: "28px 32px", maxWidth: 1400 }}>{children}</div>}
      </div>
    </div>
  );
}
