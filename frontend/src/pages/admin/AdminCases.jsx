/** 관리자 사건 관리 — 사건 CRUD, 상태 관리, 메시지 스레드, 문서 목록 */
import { useState, useEffect, useCallback } from "react";
import { api } from "../../utils/api";
import { formatDate } from "../../utils/formatters";
import useCrudForm from "../../hooks/useCrudForm";
import {
  PageHeader, EditPanel, FormField, EmptyState, ErrorBanner,
  COLORS, fieldStyle, labelStyle, btnStyle, outlineBtnStyle,
} from "../../components/admin";
import { showToast } from "../../utils/showToast";

/* ── 사건 상태 옵션 (도메인 고유) ── */
const STATUS_OPTIONS = [
  { value: "접수", label: "접수", color: "#1976d2", bg: "#e3f2fd" },
  { value: "진행", label: "진행", color: COLORS.accent, bg: "#fff8e1" },
  { value: "완료", label: "완료", color: "#2e7d32", bg: "#e8f5e9" },
];

const EMPTY_FORM = {
  title: "", description: "", clientId: "", lawyerId: "", status: "접수",
};

/** 상태 배지 */
function StatusBadge({ status }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];
  return (
    <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 8, background: opt.bg, color: opt.color, fontWeight: 500 }}>
      {opt.label}
    </span>
  );
}

/** 사건 목록 행 */
function CaseRow({ caseItem, onDetail, onEdit, onRemove }) {
  return (
    <div
      className="flex items-center gap-4"
      style={{ padding: "14px 20px", background: "#fff", border: `1px solid ${COLORS.borderLight}`, borderRadius: 6 }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{caseItem.title}</span>
          <StatusBadge status={caseItem.status} />
        </div>
        <p style={{ fontSize: 12, color: COLORS.textSecondary }}>
          {caseItem.clientName && <span>{caseItem.clientName}</span>}
          {caseItem.lawyerName && <span style={{ color: COLORS.textMuted }}> &middot; {caseItem.lawyerName}</span>}
          {caseItem.createdAt && <span style={{ color: COLORS.textMuted }}> &middot; {formatDate(caseItem.createdAt)}</span>}
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onDetail(caseItem)} style={outlineBtnStyle()}>상세</button>
        <button onClick={() => onEdit(caseItem)} style={outlineBtnStyle()}>수정</button>
        <button onClick={() => onRemove(caseItem.id)} style={outlineBtnStyle(COLORS.danger)}>삭제</button>
      </div>
    </div>
  );
}

/** 메시지 버블 */
function MessageBubble({ message }) {
  const isLawyer = message.senderType === "lawyer";
  return (
    <div style={{ marginBottom: 10, display: "flex", justifyContent: isLawyer ? "flex-end" : "flex-start" }}>
      <div style={{
        maxWidth: "70%", padding: "8px 14px", borderRadius: 12, fontSize: 13, lineHeight: 1.5,
        background: isLawyer ? COLORS.accent : "#f0f0f0",
        color: isLawyer ? "#fff" : COLORS.text,
      }}>
        {message.content}
        <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6 }}>
          {message.createdAt ? new Date(message.createdAt).toLocaleString("ko-KR") : ""}
        </div>
      </div>
    </div>
  );
}

/** 사건 상세 패널 — 상태 변경, 문서, 메시지 스레드 */
function CaseDetailPanel({ caseItem, onClose, onStatusChange, onReload }) {
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  /** 메시지/문서 불러오기 */
  useEffect(() => {
    if (!caseItem) return;
    Promise.all([
      api.get(`/cases/${caseItem.id}/messages`).catch(() => ({ data: [] })),
      api.get(`/cases/${caseItem.id}/documents`).catch(() => ({ data: [] })),
    ]).then(([msgRes, docRes]) => {
      setMessages(msgRes.data ?? []);
      setDocuments(docRes.data ?? []);
    });
  }, [caseItem]);

  /** 상태 변경 */
  const updateStatus = async (newStatus) => {
    try {
      await api.patch(`/cases/${caseItem.id}`, { status: newStatus });
      onStatusChange(newStatus);
      onReload();
    } catch (err) {
      showToast("상태 변경 실패: " + err.message);
    }
  };

  /** 메시지 전송 */
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await api.post(`/cases/${caseItem.id}/messages`, { content: newMessage, senderType: "lawyer" });
      setNewMessage("");
      const res = await api.get(`/cases/${caseItem.id}/messages`);
      setMessages(res.data ?? []);
    } catch (err) {
      showToast("전송 실패: " + err.message);
    }
  };

  return (
    <div style={{ marginBottom: 32, padding: 28, background: COLORS.bgForm, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginBottom: 6 }}>{caseItem.title}</h3>
          <StatusBadge status={caseItem.status} />
        </div>
        <button onClick={onClose} style={btnStyle(COLORS.muted)}>닫기</button>
      </div>

      {/* 상태 변경 버튼 */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>상태 변경</label>
        <div style={{ display: "flex", gap: 8 }}>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => updateStatus(s.value)}
              style={{
                padding: "6px 16px", fontSize: 12, borderRadius: 4, cursor: "pointer",
                border: `1px solid ${caseItem.status === s.value ? s.color : "#ddd"}`,
                background: caseItem.status === s.value ? s.bg : "#fff",
                color: s.color, fontWeight: caseItem.status === s.value ? 600 : 400,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 관련 서류 */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>관련 서류 ({documents.length})</label>
        {documents.length === 0 ? (
          <p style={{ fontSize: 13, color: COLORS.textMuted }}>등록된 서류가 없습니다</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} style={{ padding: "8px 12px", background: "#fff", border: `1px solid ${COLORS.borderLight}`, borderRadius: 4, fontSize: 13 }}>
                {doc.title || doc.filename}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 메시지 스레드 */}
      <div>
        <label style={labelStyle}>메시지 ({messages.length})</label>
        <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 12, padding: 12, background: "#fff", border: `1px solid ${COLORS.borderLight}`, borderRadius: 6 }}>
          {messages.length === 0 ? (
            <p style={{ fontSize: 13, color: COLORS.textMuted, textAlign: "center", padding: 20 }}>메시지가 없습니다</p>
          ) : (
            messages.map((m, i) => <MessageBubble key={m.id || i} message={m} />)
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            style={{ ...fieldStyle, flex: 1 }}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지 입력..."
            onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
          />
          <button onClick={sendMessage} style={btnStyle(COLORS.accent)}>전송</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCases() {
  const crud = useCrudForm("/cases", EMPTY_FORM, {
    validate: (form) => !form.title.trim() ? "사건명을 입력해주세요" : null,
  });

  const [clients, setClients] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [detailCase, setDetailCase] = useState(null);

  useEffect(() => {
    api.get("/clients").then((j) => setClients(j.data ?? [])).catch(() => {});
    api.get("/lawyers").then((j) => setLawyers(j.data ?? [])).catch(() => {});
  }, []);

  /** 사건 상세 열기 (편집 패널 닫기) */
  const openDetail = useCallback((c) => {
    crud.cancelEdit();
    setDetailCase(c);
  }, [crud]);

  /** 편집 열기 (상세 패널 닫기) */
  const openEditCase = (c) => {
    setDetailCase(null);
    crud.openEdit(c);
  };

  const openNewCase = () => {
    setDetailCase(null);
    crud.openNew();
  };

  /* 의뢰인/변호사 select 옵션 */
  const clientOptions = [{ value: "", label: "선택해주세요" }, ...clients.map((c) => ({ value: c.id, label: c.name }))];
  const lawyerOptions = [{ value: "", label: "선택해주세요" }, ...lawyers.map((l) => ({ value: l.id, label: l.name }))];

  return (
    <div>
      <ErrorBanner message={crud.error} onDismiss={crud.clearError} />
      <PageHeader title="사건 관리" onAdd={openNewCase} addLabel="+ 사건 등록" />

      {/* ── 편집 폼 ── */}
      {crud.isEditing && (
        <EditPanel isNew={crud.isNew} entityName="사건" onSave={crud.save} onCancel={crud.cancelEdit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
            <FormField label="사건명" required value={crud.form.title} onChange={(v) => crud.setField("title", v)} placeholder="손해배상 청구 사건" />
            <FormField label="상태" type="select" value={crud.form.status} onChange={(v) => crud.setField("status", v)} options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))} />
            <FormField label="의뢰인" type="select" value={crud.form.clientId} onChange={(v) => crud.setField("clientId", v)} options={clientOptions} />
            <FormField label="담당 변호사" type="select" value={crud.form.lawyerId} onChange={(v) => crud.setField("lawyerId", v)} options={lawyerOptions} />
          </div>
          <FormField label="사건 설명" type="textarea" value={crud.form.description} onChange={(v) => crud.setField("description", v)} placeholder="사건 개요를 입력하세요" />
        </EditPanel>
      )}

      {/* ── 사건 상세 ── */}
      {detailCase && (
        <CaseDetailPanel
          caseItem={detailCase}
          onClose={() => setDetailCase(null)}
          onStatusChange={(newStatus) => setDetailCase((prev) => prev ? { ...prev, status: newStatus } : prev)}
          onReload={crud.load}
        />
      )}

      {/* ── 사건 목록 ── */}
      {crud.loading ? (
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>로딩 중...</p>
      ) : crud.items.length === 0 ? (
        <EmptyState icon="&#x2696;&#xFE0F;" message="등록된 사건이 없습니다" />
      ) : (
        <div className="space-y-3">
          {crud.items.map((c) => (
            <CaseRow key={c.id} caseItem={c} onDetail={openDetail} onEdit={openEditCase} onRemove={crud.remove} />
          ))}
        </div>
      )}
    </div>
  );
}
