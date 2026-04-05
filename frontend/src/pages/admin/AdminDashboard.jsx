/**
 * AdminDashboard — 프리미엄 관리자 대시보드
 * 골드 악센트 + 세련된 카드 레이아웃 + 미세 그라디언트
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { getTypeLabel, getTypeColor, ALL_DOCUMENT_TYPES } from "../../utils/document-types";
import { api } from "../../utils/api";

const T = {
  accent: "#4f46e5",
  accentLight: "#6366f1",
  accentDim: "rgba(79,70,229,0.07)",
  text: "#1e293b",
  textSec: "#475569",
  textMuted: "#94a3b8",
  border: "#e5e8ed",
  borderLight: "#f0f2f5",
  cardBg: "#ffffff",
  pageBg: "#f8f9fb",
};

/** 섹션 헤더 — 골드 악센트 라인 */
function SectionHeader({ title }) {
  return (
    <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 3, height: 16, borderRadius: 2,
        background: `linear-gradient(180deg, ${T.accent} 0%, rgba(79,70,229,0.3) 100%)`,
      }} />
      <h3 style={{
        fontSize: 12, fontWeight: 600, color: T.text,
        letterSpacing: "0.08em", textTransform: "uppercase",
      }}>
        {title}
      </h3>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard")
      .then((json) => setData(json.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 100, textAlign: "center", color: T.textMuted, fontSize: 13 }}>
        <div style={{
          width: 32, height: 32, border: `2px solid ${T.border}`,
          borderTopColor: T.accent, borderRadius: "50%",
          margin: "0 auto 16px",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        데이터를 불러오는 중...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 100, textAlign: "center" }}>
        <div style={{
          display: "inline-block", padding: "20px 40px",
          border: `1px solid ${T.border}`, borderRadius: 12,
          color: "#ef4444", fontSize: 13, background: T.cardBg,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}>
          대시보드 데이터를 불러올 수 없습니다
        </div>
      </div>
    );
  }

  const statusMap = {};
  if (Array.isArray(data.byStatus)) {
    data.byStatus.forEach((s) => { statusMap[s.status] = s.count; });
  }

  const stats = [
    { label: "전체 문서", value: data.totalDocuments ?? 0, accent: false },
    { label: "금주 신규", value: data.thisWeek ?? 0, accent: true },
    { label: "열람 중", value: statusMap.reading ?? 0, accent: false },
    { label: "완독 처리", value: statusMap.completed ?? 0, accent: false },
  ];

  const typeMap = {};
  if (Array.isArray(data.byType)) {
    data.byType.forEach((t) => { typeMap[t.documentType] = t.count; });
  }
  const maxCount = Math.max(1, ...Object.values(typeMap).map(Number).filter(Boolean), 1);

  return (
    <div>
      {/* 페이지 타이틀 */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: T.accent,
          letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 10,
          opacity: 0.8,
        }}>
          ADMINISTRATION
        </div>
        <h1 style={{
          fontSize: 26, fontWeight: 600, color: T.text,
          letterSpacing: "-0.02em",
        }}>
          관리 대시보드
        </h1>
      </div>

      {/* 통계 카드 — 4열 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5" style={{ marginBottom: 40 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: s.accent
              ? `linear-gradient(135deg, ${T.accent} 0%, ${T.accentLight} 100%)`
              : T.cardBg,
            border: `1px solid ${s.accent ? "transparent" : T.border}`,
            borderRadius: 12,
            padding: "22px 26px",
            boxShadow: s.accent
              ? "0 8px 32px rgba(79,70,229,0.2)"
              : "0 1px 4px rgba(0,0,0,0.04)",
            transition: "box-shadow 0.3s ease, transform 0.3s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = s.accent
              ? "0 12px 40px rgba(79,70,229,0.3)"
              : "0 4px 16px rgba(0,0,0,0.08)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = s.accent
              ? "0 8px 32px rgba(79,70,229,0.2)"
              : "0 1px 4px rgba(0,0,0,0.04)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
          >
            <p style={{
              fontSize: 10, fontWeight: 600,
              color: s.accent ? "rgba(255,255,255,0.75)" : T.textMuted,
              letterSpacing: "0.14em", textTransform: "uppercase",
              marginBottom: 12,
            }}>
              {s.label}
            </p>
            <p style={{
              fontSize: 38, fontWeight: 200,
              color: s.accent ? "#ffffff" : T.text,
              lineHeight: 1, fontFamily: "'Inter', sans-serif",
            }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 문서 유형 분포 */}
        <div style={{
          background: T.cardBg, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: "28px 30px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
        }}>
          <SectionHeader title="문서 유형 분포" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ALL_DOCUMENT_TYPES.map((type) => {
              const count = typeMap[type] || 0;
              const pct = (count / maxCount) * 100;
              return (
                <div key={type} className="flex items-center gap-3">
                  <span style={{
                    width: 56, fontSize: 11.5, color: T.text,
                    fontWeight: 500, letterSpacing: "0.02em",
                  }}>
                    {getTypeLabel(type)}
                  </span>
                  <div style={{
                    flex: 1, height: 22, background: "#f3f5f8",
                    borderRadius: 6, overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${pct}%`, height: "100%",
                      background: `linear-gradient(90deg, ${getTypeColor(type)}, ${getTypeColor(type)}cc)`,
                      borderRadius: 6,
                      transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                    }} />
                  </div>
                  <span style={{
                    width: 32, fontSize: 12, color: T.textSec,
                    textAlign: "right", fontWeight: 600,
                  }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 최근 문서 */}
        <div style={{
          background: T.cardBg, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: "28px 30px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
        }}>
          <SectionHeader title="최근 등록 문서" />
          {data.recentDocuments?.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.text}` }}>
                  {["유형", "제목", "날짜"].map((h, i) => (
                    <th key={h} style={{
                      textAlign: i === 2 ? "right" : "left",
                      padding: "8px 0", fontSize: 9, fontWeight: 600,
                      color: T.textMuted, letterSpacing: "0.14em",
                      textTransform: "uppercase",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentDocuments.slice(0, 6).map((doc, i) => (
                  <tr key={doc.id} style={{
                    borderBottom: `1px solid ${T.borderLight}`,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8f9fc"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "10px 8px 10px 0" }}>
                      <Badge style={{
                        backgroundColor: getTypeColor(doc.documentType),
                        color: "#fff", fontSize: 9, borderRadius: 4,
                        padding: "3px 8px",
                      }}>
                        {getTypeLabel(doc.documentType)}
                      </Badge>
                    </td>
                    <td style={{ padding: "10px 0" }}>
                      <Link to={`/vault/${doc.id}`} style={{
                        fontSize: 13, color: T.text,
                        textDecoration: "none", fontWeight: 500,
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = T.accent}
                      onMouseLeave={e => e.currentTarget.style.color = T.text}
                      >
                        {doc.title}
                      </Link>
                    </td>
                    <td style={{
                      padding: "10px 0", textAlign: "right",
                      fontSize: 11, color: T.textMuted,
                    }}>
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("ko-KR") : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: 13, color: T.textMuted, padding: "24px 0" }}>등록된 문서가 없습니다.</p>
          )}
        </div>

        {/* 인기 태그 */}
        <div style={{
          background: T.cardBg, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: "28px 30px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
        }}>
          <SectionHeader title="주요 태그" />
          {data.topTags?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.topTags.map((tag, i) => (
                <span key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "6px 14px", fontSize: 12,
                  fontWeight: 500, letterSpacing: "0.02em",
                  background: tag.color ? `${tag.color}0d` : "#f3f5f8",
                  color: tag.color || T.text,
                  border: `1px solid ${tag.color ? `${tag.color}20` : T.border}`,
                  borderRadius: 20,
                  transition: "all 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {tag.name || tag}
                  {tag._count?.documents != null && (
                    <span style={{ fontSize: 10, opacity: 0.5 }}>
                      ({tag._count.documents})
                    </span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: T.textMuted, padding: "24px 0" }}>태그가 없습니다.</p>
          )}
        </div>

        {/* 상태별 분포 */}
        <div style={{
          background: T.cardBg, border: `1px solid ${T.border}`,
          borderRadius: 12, padding: "28px 30px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
        }}>
          <SectionHeader title="처리 현황" />
          {data.byStatus && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.text}` }}>
                  {[
                    { label: "상태", align: "left" },
                    { label: "건수", align: "right" },
                    { label: "비율", align: "right" },
                  ].map(h => (
                    <th key={h.label} style={{
                      textAlign: h.align, padding: "8px 0", fontSize: 9,
                      fontWeight: 600, color: T.textMuted,
                      letterSpacing: "0.14em", textTransform: "uppercase",
                    }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries({
                  inbox: "수신 대기",
                  reading: "열람 중",
                  completed: "처리 완료",
                  archived: "보관 처리",
                  reference: "참고 자료",
                }).map(([key, label]) => {
                  const count = statusMap[key] || 0;
                  const total = data.totalDocuments || 1;
                  const pct = ((count / total) * 100).toFixed(1);
                  return (
                    <tr key={key} style={{
                      borderBottom: `1px solid ${T.borderLight}`,
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8f9fc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "11px 0", fontSize: 13, color: T.text, fontWeight: 500 }}>
                        {label}
                      </td>
                      <td style={{
                        padding: "11px 0", textAlign: "right",
                        fontSize: 15, fontWeight: 600, color: T.text,
                      }}>
                        {count}
                      </td>
                      <td style={{
                        padding: "11px 0", textAlign: "right",
                        fontSize: 12, color: T.textMuted,
                      }}>
                        {pct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
