/**
 * AdminDashboard — 미국 정부 스타일 관리자 대시보드
 * 공식 문서풍 통계 카드 + 구조화된 데이터 테이블
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { getTypeLabel, getTypeColor, ALL_DOCUMENT_TYPES } from "../../utils/document-types";
import { api } from "../../utils/api";

/** 정부 스타일 색상 */
const GOV = {
  navy: "#0b1a2e",
  navyLight: "#1a2f4e",
  gold: "#c9a961",
  goldBg: "rgba(201,169,97,0.08)",
  text: "#1b2a4a",
  textSec: "#5a6a85",
  textMuted: "#8e99ab",
  border: "#dce1e8",
  cardBg: "#ffffff",
  sectionBg: "#f7f8fa",
};

/** 정부 스타일 섹션 헤더 */
function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{
        fontSize: 13, fontWeight: 700, color: GOV.navy,
        letterSpacing: "0.08em", textTransform: "uppercase",
        fontFamily: "'Georgia', serif",
        paddingBottom: 8,
        borderBottom: `2px solid ${GOV.navy}`,
        display: "inline-block",
      }}>
        {title}
      </h3>
      {subtitle && (
        <p style={{ fontSize: 11, color: GOV.textMuted, marginTop: 6 }}>{subtitle}</p>
      )}
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
      <div style={{ padding: 80, textAlign: "center", color: GOV.textMuted }}>
        <div className="spinner" style={{ margin: "0 auto 16px" }} />
        데이터 로딩 중...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 80, textAlign: "center" }}>
        <div style={{
          display: "inline-block", padding: "20px 40px",
          border: `2px solid ${GOV.border}`, borderRadius: 4,
          color: "#b91c1c", fontSize: 13, fontWeight: 500,
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
    { label: "전체 문서", value: data.totalDocuments ?? 0, accent: GOV.navy },
    { label: "금주 신규", value: data.thisWeek ?? 0, accent: "#1a6b3c" },
    { label: "열람 중", value: statusMap.reading ?? 0, accent: "#b45309" },
    { label: "완독 처리", value: statusMap.completed ?? 0, accent: "#6b21a8" },
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
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: GOV.navy,
          fontFamily: "'Georgia', serif",
          letterSpacing: "0.03em",
        }}>
          관리 대시보드
        </h1>
        <div style={{
          width: 48, height: 3, background: GOV.gold,
          marginTop: 8, borderRadius: 1,
        }} />
        <p style={{ fontSize: 12, color: GOV.textMuted, marginTop: 10 }}>
          시스템 현황 및 주요 지표 요약
        </p>
      </div>

      {/* 통계 카드 — 4열 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5" style={{ marginBottom: 36 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: GOV.cardBg,
            border: `1px solid ${GOV.border}`,
            borderTop: `3px solid ${s.accent}`,
            borderRadius: 2,
            padding: "20px 24px",
          }}>
            <p style={{
              fontSize: 9, fontWeight: 700, color: GOV.textMuted,
              letterSpacing: "0.15em", textTransform: "uppercase",
              marginBottom: 8,
            }}>
              {s.label}
            </p>
            <p style={{
              fontSize: 36, fontWeight: 300, color: s.accent,
              fontFamily: "'Georgia', serif", lineHeight: 1,
            }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 문서 유형 분포 */}
        <div style={{
          background: GOV.cardBg, border: `1px solid ${GOV.border}`,
          borderRadius: 2, padding: "24px 28px",
        }}>
          <SectionHeader title="문서 유형 분포" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ALL_DOCUMENT_TYPES.map((type) => {
              const count = typeMap[type] || 0;
              const pct = (count / maxCount) * 100;
              return (
                <div key={type} className="flex items-center gap-3">
                  <span style={{
                    width: 56, fontSize: 11, color: GOV.text,
                    fontWeight: 500, letterSpacing: "0.02em",
                  }}>
                    {getTypeLabel(type)}
                  </span>
                  <div style={{
                    flex: 1, height: 18, background: "#eef0f4",
                    borderRadius: 1, overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${pct}%`, height: "100%",
                      background: getTypeColor(type),
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                  <span style={{
                    width: 28, fontSize: 11, color: GOV.textMuted,
                    textAlign: "right", fontFamily: "'Georgia', serif",
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
          background: GOV.cardBg, border: `1px solid ${GOV.border}`,
          borderRadius: 2, padding: "24px 28px",
        }}>
          <SectionHeader title="최근 등록 문서" />
          {data.recentDocuments?.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${GOV.navy}` }}>
                  <th style={{ textAlign: "left", padding: "6px 0", fontSize: 9, fontWeight: 700, color: GOV.textMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>유형</th>
                  <th style={{ textAlign: "left", padding: "6px 0", fontSize: 9, fontWeight: 700, color: GOV.textMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>제목</th>
                  <th style={{ textAlign: "right", padding: "6px 0", fontSize: 9, fontWeight: 700, color: GOV.textMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>날짜</th>
                </tr>
              </thead>
              <tbody>
                {data.recentDocuments.slice(0, 6).map((doc, i) => (
                  <tr key={doc.id} style={{
                    borderBottom: `1px solid ${GOV.border}`,
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
                        fontSize: 12.5, color: GOV.text,
                        textDecoration: "none", fontWeight: 500,
                      }}>
                        {doc.title}
                      </Link>
                    </td>
                    <td style={{
                      padding: "8px 0", textAlign: "right",
                      fontSize: 11, color: GOV.textMuted,
                      fontFamily: "'Georgia', serif",
                    }}>
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString("ko-KR") : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: 12, color: GOV.textMuted, padding: "20px 0" }}>등록된 문서가 없습니다.</p>
          )}
        </div>

        {/* 인기 태그 */}
        <div style={{
          background: GOV.cardBg, border: `1px solid ${GOV.border}`,
          borderRadius: 2, padding: "24px 28px",
        }}>
          <SectionHeader title="주요 태그" />
          {data.topTags?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.topTags.map((tag, i) => (
                <span key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "5px 12px", borderRadius: 2, fontSize: 11.5,
                  fontWeight: 500, letterSpacing: "0.02em",
                  background: tag.color ? `${tag.color}15` : GOV.goldBg,
                  color: tag.color || GOV.navy,
                  border: `1px solid ${tag.color ? `${tag.color}30` : GOV.border}`,
                }}>
                  {tag.name || tag}
                  {tag._count?.documents != null && (
                    <span style={{
                      fontSize: 10, opacity: 0.6,
                      fontFamily: "'Georgia', serif",
                    }}>
                      ({tag._count.documents})
                    </span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: GOV.textMuted, padding: "20px 0" }}>태그가 없습니다.</p>
          )}
        </div>

        {/* 상태별 분포 */}
        <div style={{
          background: GOV.cardBg, border: `1px solid ${GOV.border}`,
          borderRadius: 2, padding: "24px 28px",
        }}>
          <SectionHeader title="처리 현황" />
          {data.byStatus && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${GOV.navy}` }}>
                  <th style={{ textAlign: "left", padding: "6px 0", fontSize: 9, fontWeight: 700, color: GOV.textMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>상태</th>
                  <th style={{ textAlign: "right", padding: "6px 0", fontSize: 9, fontWeight: 700, color: GOV.textMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>건수</th>
                  <th style={{ textAlign: "right", padding: "6px 0", fontSize: 9, fontWeight: 700, color: GOV.textMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>비율</th>
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
                      borderBottom: `1px solid ${GOV.border}`,
                      background: i % 2 === 0 ? "transparent" : "#fafbfc",
                    }}>
                      <td style={{ padding: "9px 0", fontSize: 12.5, color: GOV.text, fontWeight: 500 }}>
                        {label}
                      </td>
                      <td style={{
                        padding: "9px 0", textAlign: "right",
                        fontSize: 14, fontWeight: 600, color: GOV.navy,
                        fontFamily: "'Georgia', serif",
                      }}>
                        {count}
                      </td>
                      <td style={{
                        padding: "9px 0", textAlign: "right",
                        fontSize: 11, color: GOV.textMuted,
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
