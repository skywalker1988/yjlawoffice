/**
 * AdminDashboard — 미니멀 관리자 대시보드
 * 로그인 페이지 톤과 통일된 깔끔한 디자인
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { getTypeLabel, getTypeColor, ALL_DOCUMENT_TYPES } from "../../utils/document-types";
import { api } from "../../utils/api";

const T = {
  navy: "#1a2332",
  text: "#1a1a1a",
  textSec: "#6b7280",
  textMuted: "#9ca3af",
  border: "#e5e7eb",
  cardBg: "#ffffff",
  sectionBg: "#f9fafb",
};

/** 섹션 헤더 */
function SectionHeader({ title }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{
        fontSize: 11, fontWeight: 600, color: T.textMuted,
        letterSpacing: "0.15em", textTransform: "uppercase",
        paddingBottom: 8,
        borderBottom: `1px solid ${T.border}`,
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
      <div style={{ padding: 80, textAlign: "center", color: T.textMuted, fontSize: 13 }}>
        데이터 로딩 중...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 80, textAlign: "center" }}>
        <div style={{
          display: "inline-block", padding: "16px 32px",
          border: `1px solid ${T.border}`, color: "#ef4444", fontSize: 13,
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
    { label: "전체 문서", value: data.totalDocuments ?? 0 },
    { label: "금주 신규", value: data.thisWeek ?? 0 },
    { label: "열람 중", value: statusMap.reading ?? 0 },
    { label: "완독 처리", value: statusMap.completed ?? 0 },
  ];

  const typeMap = {};
  if (Array.isArray(data.byType)) {
    data.byType.forEach((t) => { typeMap[t.documentType] = t.count; });
  }
  const maxCount = Math.max(1, ...Object.values(typeMap).map(Number).filter(Boolean), 1);

  return (
    <div>
      {/* 페이지 타이틀 */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 10, fontWeight: 600, color: T.textMuted,
          letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8,
        }}>
          ADMINISTRATION
        </div>
        <h1 style={{
          fontSize: 24, fontWeight: 600, color: T.text,
          letterSpacing: "-0.01em",
        }}>
          관리 대시보드
        </h1>
      </div>

      {/* 통계 카드 — 4열 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5" style={{ marginBottom: 36 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: T.cardBg,
            border: `1px solid ${T.border}`,
            padding: "20px 24px",
          }}>
            <p style={{
              fontSize: 10, fontWeight: 600, color: T.textMuted,
              letterSpacing: "0.12em", textTransform: "uppercase",
              marginBottom: 10,
            }}>
              {s.label}
            </p>
            <p style={{
              fontSize: 36, fontWeight: 300, color: T.navy,
              lineHeight: 1,
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
          padding: "24px 28px",
        }}>
          <SectionHeader title="문서 유형 분포" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ALL_DOCUMENT_TYPES.map((type) => {
              const count = typeMap[type] || 0;
              const pct = (count / maxCount) * 100;
              return (
                <div key={type} className="flex items-center gap-3">
                  <span style={{
                    width: 56, fontSize: 11, color: T.text,
                    fontWeight: 500, letterSpacing: "0.02em",
                  }}>
                    {getTypeLabel(type)}
                  </span>
                  <div style={{
                    flex: 1, height: 18, background: "#f3f4f6",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${pct}%`, height: "100%",
                      background: getTypeColor(type),
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                  <span style={{
                    width: 28, fontSize: 11, color: T.textMuted,
                    textAlign: "right",
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
          padding: "24px 28px",
        }}>
          <SectionHeader title="최근 등록 문서" />
          {data.recentDocuments?.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.navy}` }}>
                  <th style={{ textAlign: "left", padding: "6px 0", fontSize: 9, fontWeight: 600, color: T.textMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>유형</th>
                  <th style={{ textAlign: "left", padding: "6px 0", fontSize: 9, fontWeight: 600, color: T.textMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>제목</th>
                  <th style={{ textAlign: "right", padding: "6px 0", fontSize: 9, fontWeight: 600, color: T.textMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>날짜</th>
                </tr>
              </thead>
              <tbody>
                {data.recentDocuments.slice(0, 6).map((doc, i) => (
                  <tr key={doc.id} style={{
                    borderBottom: `1px solid ${T.border}`,
                    background: i % 2 === 0 ? "transparent" : "#fafbfc",
                  }}>
                    <td style={{ padding: "8px 8px 8px 0" }}>
                      <Badge style={{
                        backgroundColor: getTypeColor(doc.documentType),
                        color: "#fff", fontSize: 9, borderRadius: 2,
                      }}>
                        {getTypeLabel(doc.documentType)}
                      </Badge>
                    </td>
                    <td style={{ padding: "8px 0" }}>
                      <Link to={`/vault/${doc.id}`} style={{
                        fontSize: 12.5, color: T.text,
                        textDecoration: "none", fontWeight: 500,
                      }}>
                        {doc.title}
                      </Link>
                    </td>
                    <td style={{
                      padding: "8px 0", textAlign: "right",
                      fontSize: 11, color: T.textMuted,
                    }}>
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("ko-KR") : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: 12, color: T.textMuted, padding: "20px 0" }}>등록된 문서가 없습니다.</p>
          )}
        </div>

        {/* 인기 태그 */}
        <div style={{
          background: T.cardBg, border: `1px solid ${T.border}`,
          padding: "24px 28px",
        }}>
          <SectionHeader title="주요 태그" />
          {data.topTags?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.topTags.map((tag, i) => (
                <span key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "5px 12px", fontSize: 11.5,
                  fontWeight: 500, letterSpacing: "0.02em",
                  background: tag.color ? `${tag.color}12` : "#f3f4f6",
                  color: tag.color || T.navy,
                  border: `1px solid ${tag.color ? `${tag.color}25` : T.border}`,
                }}>
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
            <p style={{ fontSize: 12, color: T.textMuted, padding: "20px 0" }}>태그가 없습니다.</p>
          )}
        </div>

        {/* 상태별 분포 */}
        <div style={{
          background: T.cardBg, border: `1px solid ${T.border}`,
          padding: "24px 28px",
        }}>
          <SectionHeader title="처리 현황" />
          {data.byStatus && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.navy}` }}>
                  <th style={{ textAlign: "left", padding: "6px 0", fontSize: 9, fontWeight: 600, color: T.textMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>상태</th>
                  <th style={{ textAlign: "right", padding: "6px 0", fontSize: 9, fontWeight: 600, color: T.textMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>건수</th>
                  <th style={{ textAlign: "right", padding: "6px 0", fontSize: 9, fontWeight: 600, color: T.textMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>비율</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries({
                  inbox: "수신 대기",
                  reading: "열람 중",
                  completed: "처리 완료",
                  archived: "보관 처리",
                  reference: "참고 자료",
                }).map(([key, label], i) => {
                  const count = statusMap[key] || 0;
                  const total = data.totalDocuments || 1;
                  const pct = ((count / total) * 100).toFixed(1);
                  return (
                    <tr key={key} style={{
                      borderBottom: `1px solid ${T.border}`,
                      background: i % 2 === 0 ? "transparent" : "#fafbfc",
                    }}>
                      <td style={{ padding: "9px 0", fontSize: 12.5, color: T.text, fontWeight: 500 }}>
                        {label}
                      </td>
                      <td style={{
                        padding: "9px 0", textAlign: "right",
                        fontSize: 14, fontWeight: 600, color: T.navy,
                      }}>
                        {count}
                      </td>
                      <td style={{
                        padding: "9px 0", textAlign: "right",
                        fontSize: 11, color: T.textMuted,
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
