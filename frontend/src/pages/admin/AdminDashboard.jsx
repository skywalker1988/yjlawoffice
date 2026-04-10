/**
 * AdminDashboard — 관리자 대시보드
 * 데이터 로딩 및 하위 컴포넌트 조합 (통계 카드, 차트, 최근 문서)
 */
import { useState, useEffect } from "react";
import { PageHeader, EmptyState, COLORS } from "../../components/admin";
import { api } from "../../utils/api";
import DashboardStatCards from "./DashboardStatCards";
import DashboardRecentDocs from "./DashboardRecentDocs";
import { TypeDistributionChart, StatusDistributionTable } from "./DashboardCharts";

/* ── 로딩 스피너 ── */
function LoadingSpinner() {
  return (
    <div style={{ padding: 100, textAlign: "center", color: COLORS.textMuted, fontSize: 13 }}>
      <div style={{
        width: 32, height: 32, border: `2px solid ${COLORS.border}`,
        borderTopColor: COLORS.primary, borderRadius: "50%",
        margin: "0 auto 16px",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      데이터를 불러오는 중...
    </div>
  );
}

/* ── 데이터를 통계 배열로 변환 ── */
function buildStatCards(data, statusMap) {
  return [
    { label: "전체 문서", value: data.totalDocuments ?? 0 },
    { label: "금주 신규", value: data.thisWeek ?? 0, accent: true },
    { label: "열람 중", value: statusMap.reading ?? 0 },
    { label: "완독 처리", value: statusMap.completed ?? 0 },
  ];
}

/* ── byStatus / byType 배열을 맵 객체로 변환 ── */
function arrayToMap(arr, keyField) {
  const map = {};
  if (Array.isArray(arr)) {
    arr.forEach((item) => { map[item[keyField]] = item.count; });
  }
  return map;
}

/* ── 메인 대시보드 컴포넌트 ── */
export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard")
      .then((json) => setData(json.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  if (!data) {
    return (
      <EmptyState icon="⚠️" message="대시보드 데이터를 불러올 수 없습니다" />
    );
  }

  const statusMap = arrayToMap(data.byStatus, "status");
  const typeMap = arrayToMap(data.byType, "documentType");
  const stats = buildStatCards(data, statusMap);

  return (
    <div>
      <PageHeader title="관리 대시보드" subtitle="ADMINISTRATION" />

      {/* 통계 카드 — 4열 */}
      <DashboardStatCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TypeDistributionChart typeMap={typeMap} />
        <DashboardRecentDocs documents={data.recentDocuments} />
        <StatusDistributionTable statusMap={statusMap} totalDocuments={data.totalDocuments} />
      </div>
    </div>
  );
}
