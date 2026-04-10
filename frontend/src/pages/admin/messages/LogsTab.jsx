/**
 * 발송 이력 탭 — 메시지 발송 로그 조회, 필터링, 페이지네이션, 삭제
 */
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/api";
import {
  EmptyState, Pagination,
  COLORS, fieldStyle, badgeStyle, thStyle, tdStyle,
} from "../../../components/admin";
import { formatDateTime } from "../../../utils/formatters";
import { showToast } from "../../../utils/showToast";
import {
  CHANNEL_COLORS, LOG_STATUS_LABELS, LOG_STATUS_COLORS,
} from "./messageConstants";

export default function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0 });
  const [filterChannel, setFilterChannel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (filterChannel) params.set("channel", filterChannel);
    if (filterStatus) params.set("status", filterStatus);

    api.get(`/messages/logs?${params}`)
      .then((json) => {
        setLogs(json.data ?? []);
        setMeta(json.meta ?? { total: 0, totalPages: 0 });
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [page, filterChannel, filterStatus]);

  useEffect(load, [load]);

  /** 필터 변경 시 페이지 리셋 */
  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  const removeLog = async (id) => {
    if (!confirm("이 발송 이력을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/messages/logs/${id}`);
      load();
    } catch (err) {
      showToast("삭제 실패: " + err.message);
    }
  };

  return (
    <div>
      {/* 필터 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <select style={{ ...fieldStyle, width: 140 }} value={filterChannel} onChange={handleFilterChange(setFilterChannel)}>
          <option value="">전체 채널</option>
          <option value="sms">SMS</option>
          <option value="email">이메일</option>
        </select>
        <select style={{ ...fieldStyle, width: 140 }} value={filterStatus} onChange={handleFilterChange(setFilterStatus)}>
          <option value="">전체 상태</option>
          <option value="sent">성공</option>
          <option value="failed">실패</option>
          <option value="pending">대기</option>
        </select>
        <span style={{ fontSize: 13, color: COLORS.muted, alignSelf: "center" }}>총 {meta.total}건</span>
      </div>

      {/* 테이블 */}
      {loading ? (
        <EmptyState icon="⏳" message="불러오는 중..." />
      ) : logs.length === 0 ? (
        <EmptyState icon="📨" message="발송 이력이 없습니다" />
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${COLORS.border}`, textAlign: "left" }}>
              <th style={thStyle}>발송 일시</th>
              <th style={thStyle}>채널</th>
              <th style={thStyle}>수신자</th>
              <th style={thStyle}>내용</th>
              <th style={thStyle}>상태</th>
              <th style={{ ...thStyle, width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <LogRow key={log.id} log={log} onRemove={removeLog} />
            ))}
          </tbody>
        </table>
      )}

      {/* 페이지네이션 */}
      <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
    </div>
  );
}

/** 발송 이력 테이블 행 */
function LogRow({ log, onRemove }) {
  return (
    <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
      <td style={{ ...tdStyle, color: COLORS.textMuted, whiteSpace: "nowrap" }}>
        {formatDateTime(log.sentAt || log.createdAt)}
      </td>
      <td style={tdStyle}>
        <span style={badgeStyle(CHANNEL_COLORS[log.channel] || COLORS.muted)}>
          {log.channel === "sms" ? "SMS" : "이메일"}
        </span>
      </td>
      <td style={tdStyle}>
        <div style={{ fontWeight: 500 }}>{log.recipientName || "-"}</div>
        <div style={{ fontSize: 11, color: COLORS.muted }}>{log.recipientContact}</div>
      </td>
      <td style={{ ...tdStyle, color: COLORS.textSecondary, maxWidth: 300 }}>
        {log.subject && (
          <div style={{ fontSize: 11, fontWeight: 600, color: "#444", marginBottom: 2 }}>
            {log.subject}
          </div>
        )}
        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {log.content.length > 50 ? log.content.slice(0, 50) + "..." : log.content}
        </div>
      </td>
      <td style={tdStyle}>
        <span style={badgeStyle(LOG_STATUS_COLORS[log.status] || COLORS.muted)}>
          {LOG_STATUS_LABELS[log.status] || log.status}
        </span>
        {log.errorMessage && (
          <div style={{ fontSize: 10, color: COLORS.danger, marginTop: 2 }}>{log.errorMessage}</div>
        )}
      </td>
      <td style={tdStyle}>
        <button onClick={() => onRemove(log.id)}
          style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 14 }}
          title="삭제">✕</button>
      </td>
    </tr>
  );
}
