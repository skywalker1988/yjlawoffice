/** AdminDashboard — 관리자 대시보드 통계 페이지 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { getTypeLabel, getTypeColor, TYPE_CONFIG, ALL_DOCUMENT_TYPES } from "../../utils/document-types";
import { api } from "../../utils/api";

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
      <div style={{ padding: 40, textAlign: "center", color: "#999" }}>
        불러오는 중...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#c44" }}>
        대시보드 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  const statusMap = {};
  if (Array.isArray(data.byStatus)) {
    data.byStatus.forEach((s) => { statusMap[s.status] = s.count; });
  }

  const stats = [
    { label: "전체 문서", value: data.totalDocuments ?? 0, color: "#3498db" },
    { label: "이번주 추가", value: data.thisWeek ?? 0, color: "#2ecc71" },
    { label: "읽는 중", value: statusMap.reading ?? 0, color: "#e67e22" },
    { label: "완독", value: statusMap.completed ?? 0, color: "#9b59b6" },
  ];

  // Type distribution
  const typeMap = {};
  if (Array.isArray(data.byType)) {
    data.byType.forEach((t) => { typeMap[t.documentType] = t.count; });
  }
  const typeDistribution = typeMap;
  const maxCount = Math.max(1, ...Object.values(typeDistribution).map(Number).filter(Boolean), 1);

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>
        Second Brain 대시보드
      </h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 32 }}>
        {stats.map((s, i) => (
          <Card key={i}>
            <CardContent className="text-center">
              <p style={{ fontSize: 32, fontWeight: 300, color: s.color }}>
                {s.value}
              </p>
              <p style={{ fontSize: 13, color: "#999", marginTop: 4 }}>
                {s.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>문서 유형 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ALL_DOCUMENT_TYPES.map((type) => {
                const count = typeDistribution[type] || 0;
                const pct = (count / maxCount) * 100;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span
                      style={{
                        width: 60,
                        fontSize: 12,
                        color: getTypeColor(type),
                        fontWeight: 500,
                      }}
                    >
                      {getTypeLabel(type)}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 20,
                        background: "rgba(0,0,0,0.03)",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: getTypeColor(type),
                          borderRadius: 4,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                    <span style={{ width: 30, fontSize: 12, color: "#999", textAlign: "right" }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle>최근 문서</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentDocuments?.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {data.recentDocuments.slice(0, 5).map((doc) => (
                  <Link
                    key={doc.id}
                    to={`/vault/${doc.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 0",
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <Badge
                      style={{
                        backgroundColor: getTypeColor(doc.documentType),
                        color: "#fff",
                        fontSize: 9,
                      }}
                    >
                      {getTypeLabel(doc.documentType)}
                    </Badge>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {doc.title}
                    </span>
                    <span style={{ fontSize: 11, color: "#ccc", flexShrink: 0 }}>
                      {doc.createdAt
                        ? new Date(doc.createdAt).toLocaleDateString("ko-KR")
                        : ""}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "#999" }}>문서가 없습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* Top Tags */}
        <Card>
          <CardHeader>
            <CardTitle>인기 태그</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topTags?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.topTags.map((tag, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    style={{
                      backgroundColor: tag.color || undefined,
                      color: tag.color ? "#fff" : undefined,
                    }}
                  >
                    {tag.name || tag}
                    {tag._count?.documents != null && (
                      <span style={{ marginLeft: 4, opacity: 0.7 }}>
                        ({tag._count.documents})
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "#999" }}>태그가 없습니다.</p>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>상태별 분포</CardTitle>
          </CardHeader>
          <CardContent>
            {data.byStatus && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries({
                  inbox: "수신함",
                  reading: "읽는 중",
                  completed: "완독",
                  archived: "보관",
                  reference: "참고",
                }).map(([key, label]) => {
                  const count = data.byStatus[key] || 0;
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span style={{ fontSize: 13, color: "#666" }}>{label}</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
