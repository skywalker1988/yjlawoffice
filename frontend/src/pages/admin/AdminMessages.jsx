/**
 * 관리자 메시지 발송 — SMS/이메일 템플릿 관리, 발송, 이력 조회
 * - 상담 고객 연락처에서 수신자 선택
 * - 플레이스홀더: {name}, {date}, {category}
 */
import { useState, useEffect, useCallback } from "react";
import { api } from "../../utils/api";

/** 상담 분야 한국어 라벨 */
const CATEGORY_LABELS = {
  general: "일반", civil: "민사", criminal: "형사", family: "가사",
  admin: "행정", tax: "조세", realestate: "부동산", corporate: "기업법무", other: "기타",
};

/** 상담 상태 라벨 */
const STATUS_LABELS = { pending: "대기", confirmed: "확인", completed: "완료", cancelled: "취소" };

const EMPTY_TEMPLATE = { name: "", channel: "sms", subject: "", content: "", isActive: true, sortOrder: 0 };

/** SMS 바이트 수 계산 (한글 2바이트, 영문/숫자 1바이트) */
function getByteLength(str) {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    len += str.charCodeAt(i) > 127 ? 2 : 1;
  }
  return len;
}

/* ──────── 공통 스타일 ──────── */
const fieldStyle = {
  width: "100%", padding: "10px 14px", fontSize: 14,
  border: "1px solid #d0d0d0", borderRadius: 4, background: "#fff",
  fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};
const labelStyle = { fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4, display: "block" };
const btnStyle = (bg = "#1a1a2e") => ({
  padding: "8px 20px", fontSize: 13, fontWeight: 500,
  color: "#fff", background: bg, border: "none", borderRadius: 4, cursor: "pointer",
});
const tabStyle = (active) => ({
  padding: "10px 24px", fontSize: 14, fontWeight: active ? 600 : 400,
  color: active ? "#b08d57" : "#666", background: "none", border: "none",
  borderBottom: active ? "2px solid #b08d57" : "2px solid transparent",
  cursor: "pointer", transition: "all 0.2s",
});
const badgeStyle = (color) => ({
  display: "inline-block", padding: "2px 10px", fontSize: 11, fontWeight: 600,
  borderRadius: 12, color: "#fff", background: color,
});

export default function AdminMessages() {
  const [activeTab, setActiveTab] = useState("templates");

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1a1a1a", marginBottom: 8 }}>메시지 발송</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
        상담 고객에게 SMS 문자 또는 이메일을 발송하고 이력을 관리합니다.
      </p>

      {/* 탭 바 */}
      <div style={{ borderBottom: "1px solid #e0e0e0", marginBottom: 24, display: "flex", gap: 4 }}>
        <button style={tabStyle(activeTab === "templates")} onClick={() => setActiveTab("templates")}>템플릿 관리</button>
        <button style={tabStyle(activeTab === "send")} onClick={() => setActiveTab("send")}>메시지 발송</button>
        <button style={tabStyle(activeTab === "logs")} onClick={() => setActiveTab("logs")}>발송 이력</button>
      </div>

      {activeTab === "templates" && <TemplatesTab />}
      {activeTab === "send" && <SendTab />}
      {activeTab === "logs" && <LogsTab />}
    </div>
  );
}

/* ================================================================
   탭 1: 템플릿 관리
   ================================================================ */
function TemplatesTab() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_TEMPLATE);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/messages/templates")
      .then((json) => setTemplates(json.data ?? []))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const openNew = () => { setEditing("new"); setForm({ ...EMPTY_TEMPLATE }); };
  const openEdit = (t) => {
    setEditing(t.id);
    setForm({
      name: t.name, channel: t.channel, subject: t.subject || "",
      content: t.content, isActive: !!t.isActive, sortOrder: t.sortOrder ?? 0,
    });
  };

  const save = async () => {
    if (!form.name.trim()) return alert("템플릿 이름을 입력해주세요");
    if (!form.content.trim()) return alert("메시지 내용을 입력해주세요");
    try {
      if (editing === "new") {
        await api.post("/messages/templates", form);
      } else {
        await api.patch(`/messages/templates/${editing}`, form);
      }
      setEditing(null);
      load();
    } catch (err) {
      alert("저장 실패: " + err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("이 템플릿을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/messages/templates/${id}`);
      load();
    } catch (err) {
      alert("삭제 실패: " + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 14, color: "#666" }}>{templates.length}개 템플릿</span>
        <button onClick={openNew} style={btnStyle()}>+ 새 템플릿</button>
      </div>

      {/* 편집 폼 */}
      {editing && (
        <div style={{ marginBottom: 28, padding: 24, background: "#f9f9f8", border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#1a1a1a" }}>
            {editing === "new" ? "새 템플릿 등록" : "템플릿 수정"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>템플릿 이름 *</label>
              <input style={fieldStyle} value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="예: 상담 확인 안내" />
            </div>
            <div>
              <label style={labelStyle}>채널 *</label>
              <select style={fieldStyle} value={form.channel}
                onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                <option value="sms">SMS 문자</option>
                <option value="email">이메일</option>
              </select>
            </div>
          </div>

          {form.channel === "email" && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>이메일 제목</label>
              <input style={fieldStyle} value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="예: [윤정 법률사무소] 상담 일정 안내" />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              메시지 내용 *
              <span style={{ fontWeight: 400, color: "#999", marginLeft: 8 }}>
                플레이스홀더: {"{name}"} {"{date}"} {"{category}"}
              </span>
            </label>
            <textarea style={{ ...fieldStyle, minHeight: 120, resize: "vertical" }}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="안녕하세요 {name}님, 윤정 법률사무소입니다..." />
            {form.channel === "sms" && (
              <div style={{ fontSize: 11, color: getByteLength(form.content) > 90 ? "#e74c3c" : "#999", marginTop: 4 }}>
                {getByteLength(form.content)} / 90 바이트
                {getByteLength(form.content) > 90 ? " (LMS로 발송됩니다)" : " (SMS)"}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              활성화
            </label>
            <div style={{ flex: 1 }} />
            <button onClick={() => setEditing(null)} style={btnStyle("#999")}>취소</button>
            <button onClick={save} style={btnStyle()}>저장</button>
          </div>
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999" }}>불러오는 중...</div>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999" }}>등록된 템플릿이 없습니다</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {templates.map((t) => (
            <div key={t.id} style={{
              padding: "14px 20px", background: "#fff", border: "1px solid #e8e8e8", borderRadius: 6,
              display: "flex", alignItems: "center", gap: 16,
              opacity: t.isActive ? 1 : 0.5,
            }}>
              <span style={badgeStyle(t.channel === "sms" ? "#3498db" : "#9b59b6")}>
                {t.channel === "sms" ? "SMS" : "이메일"}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                  {t.content.length > 60 ? t.content.slice(0, 60) + "..." : t.content}
                </div>
              </div>
              <button onClick={() => openEdit(t)} style={{ ...btnStyle("#555"), padding: "5px 14px" }}>수정</button>
              <button onClick={() => remove(t.id)} style={{ ...btnStyle("#c0392b"), padding: "5px 14px" }}>삭제</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   탭 2: 메시지 발송
   ================================================================ */
function SendTab() {
  const [channel, setChannel] = useState("sms");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  // 수신자 소스: "clients"(고객DB) 또는 "consultations"(상담신청)
  const [recipientSource, setRecipientSource] = useState("clients");
  const [recipientList, setRecipientList] = useState([]);
  const [recipientLoading, setRecipientLoading] = useState(true);
  const [selectedClients, setSelectedClients] = useState(new Set());
  const [clientFilter, setClientFilter] = useState("");

  // 발송 상태
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  // 템플릿 목록 로드 (동시 발송이면 전체 템플릿)
  useEffect(() => {
    const url = channel === "both"
      ? "/messages/templates"
      : `/messages/templates?channel=${channel}`;
    api.get(url)
      .then((json) => setTemplates(json.data ?? []))
      .catch(() => setTemplates([]));
  }, [channel]);

  // 수신자 목록 로드 (소스에 따라 고객DB 또는 상담신청)
  useEffect(() => {
    setRecipientLoading(true);
    setSelectedClients(new Set());
    const url = recipientSource === "clients"
      ? "/clients?limit=100&active=true"
      : "/consultations?limit=100";
    api.get(url)
      .then((json) => setRecipientList(json.data ?? []))
      .catch(() => setRecipientList([]))
      .finally(() => setRecipientLoading(false));
  }, [recipientSource]);

  // 템플릿 선택 시 내용 채우기
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    if (!templateId) return;
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      setContent(tpl.content);
      if (tpl.subject) setSubject(tpl.subject);
    }
  };

  // 채널 변경 시 상태 초기화
  const handleChannelChange = (ch) => {
    setChannel(ch);
    setSelectedTemplate("");
    setContent("");
    setSubject("");
  };

  // 고객 선택 토글
  const toggleClient = (id) => {
    setSelectedClients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // 전체 선택/해제
  const toggleAll = () => {
    const filtered = filteredClients;
    if (selectedClients.size === filtered.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filtered.map((c) => c.id)));
    }
  };

  // 필터링된 수신자 (채널별 연락처 존재 여부 + 검색)
  const filteredClients = recipientList.filter((c) => {
    if (channel === "sms" && !c.phone) return false;
    if (channel === "email" && !c.email) return false;
    if (channel === "both" && (!c.phone || !c.email)) return false;
    if (!clientFilter) return true;
    const q = clientFilter.toLowerCase();
    return (c.name || "").toLowerCase().includes(q)
      || (c.phone || "").includes(q)
      || (c.email || "").toLowerCase().includes(q);
  });

  /** 채널 라벨 */
  const channelLabel = channel === "sms" ? "문자" : channel === "email" ? "이메일" : "문자+이메일";

  // 발송
  const handleSend = async () => {
    if (selectedClients.size === 0) return alert("수신자를 선택해주세요");
    if (!content.trim()) return alert("메시지 내용을 입력해주세요");
    if ((channel === "email" || channel === "both") && !subject.trim()) {
      return alert("이메일 제목을 입력해주세요");
    }

    const count = selectedClients.size;
    if (!confirm(`${count}명에게 ${channelLabel}를 발송하시겠습니까?`)) return;

    const selectedList = recipientList.filter((c) => selectedClients.has(c.id));

    setSending(true);
    setResult(null);
    try {
      if (channel === "both") {
        // SMS + 이메일 동시 발송: 각각 API 호출 후 결과 합산
        const smsRecipients = selectedList.map((c) => ({
          name: c.name, contact: c.phone, consultationId: c.id, category: c.category,
        }));
        const emailRecipients = selectedList.map((c) => ({
          name: c.name, contact: c.email, consultationId: c.id, category: c.category,
        }));

        const [smsRes, emailRes] = await Promise.all([
          api.post("/messages/send", {
            channel: "sms", recipients: smsRecipients,
            templateId: selectedTemplate || undefined, content,
          }),
          api.post("/messages/send", {
            channel: "email", recipients: emailRecipients,
            templateId: selectedTemplate || undefined, subject, content,
          }),
        ]);

        // 결과 합산
        const combined = {
          total: (smsRes.data?.total || 0) + (emailRes.data?.total || 0),
          sent: (smsRes.data?.sent || 0) + (emailRes.data?.sent || 0),
          failed: (smsRes.data?.failed || 0) + (emailRes.data?.failed || 0),
          results: [...(smsRes.data?.results || []), ...(emailRes.data?.results || [])],
        };
        setResult(combined);
      } else {
        const recipients = selectedList.map((c) => ({
          name: c.name,
          contact: channel === "sms" ? c.phone : c.email,
          consultationId: c.id,
          category: c.category,
        }));
        const res = await api.post("/messages/send", {
          channel, recipients,
          templateId: selectedTemplate || undefined,
          subject: channel === "email" ? subject : undefined,
          content,
        });
        setResult(res.data);
      }
      setSelectedClients(new Set());
    } catch (err) {
      alert("발송 실패: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {/* 채널 선택 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button onClick={() => handleChannelChange("sms")}
          style={{ ...btnStyle(channel === "sms" ? "#3498db" : "#ccc"), transition: "all 0.2s" }}>
          SMS 문자
        </button>
        <button onClick={() => handleChannelChange("email")}
          style={{ ...btnStyle(channel === "email" ? "#9b59b6" : "#ccc"), transition: "all 0.2s" }}>
          이메일
        </button>
        <button onClick={() => handleChannelChange("both")}
          style={{ ...btnStyle(channel === "both" ? "#e67e22" : "#ccc"), transition: "all 0.2s" }}>
          동시 발송 (SMS+이메일)
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* 왼쪽: 수신자 선택 */}
        <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 8, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#1a1a1a" }}>
            수신자 선택 <span style={{ fontSize: 12, fontWeight: 400, color: "#999" }}>
              ({selectedClients.size}명 선택)
            </span>
          </h3>

          {/* 수신자 소스 선택 */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <button onClick={() => setRecipientSource("clients")}
              style={{
                padding: "5px 14px", fontSize: 12, fontWeight: recipientSource === "clients" ? 600 : 400,
                color: recipientSource === "clients" ? "#fff" : "#666",
                background: recipientSource === "clients" ? "#b08d57" : "#f0f0f0",
                border: "none", borderRadius: 4, cursor: "pointer",
              }}>
              고객 DB
            </button>
            <button onClick={() => setRecipientSource("consultations")}
              style={{
                padding: "5px 14px", fontSize: 12, fontWeight: recipientSource === "consultations" ? 600 : 400,
                color: recipientSource === "consultations" ? "#fff" : "#666",
                background: recipientSource === "consultations" ? "#b08d57" : "#f0f0f0",
                border: "none", borderRadius: 4, cursor: "pointer",
              }}>
              상담 신청
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input style={{ ...fieldStyle, flex: 1 }} value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              placeholder="이름, 전화번호, 이메일 검색..." />
            <button onClick={toggleAll} style={{ ...btnStyle("#666"), whiteSpace: "nowrap", padding: "8px 14px" }}>
              전체 {selectedClients.size === filteredClients.length ? "해제" : "선택"}
            </button>
          </div>

          <div style={{ maxHeight: 360, overflowY: "auto", border: "1px solid #eee", borderRadius: 4 }}>
            {recipientLoading ? (
              <div style={{ padding: 20, textAlign: "center", color: "#999" }}>불러오는 중...</div>
            ) : filteredClients.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "#999" }}>
                {channel === "both" ? "전화번호와 이메일 모두 있는 고객이 없습니다"
                  : channel === "email" ? "이메일 주소가 있는 고객이 없습니다"
                  : "해당하는 고객이 없습니다"}
              </div>
            ) : filteredClients.map((c) => (
              <label key={c.id} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
                borderBottom: "1px solid #f0f0f0", cursor: "pointer",
                background: selectedClients.has(c.id) ? "#f0f4ff" : "transparent",
              }}>
                <input type="checkbox" checked={selectedClients.has(c.id)}
                  onChange={() => toggleClient(c.id)} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</span>
                  <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>
                    {channel === "both" ? `${c.phone} / ${c.email}` : channel === "sms" ? c.phone : c.email}
                  </span>
                </div>
                {recipientSource === "consultations" ? (
                  <span style={badgeStyle(
                    c.status === "pending" ? "#f39c12" :
                    c.status === "confirmed" ? "#27ae60" :
                    c.status === "completed" ? "#3498db" : "#999"
                  )}>
                    {STATUS_LABELS[c.status] || c.status}
                  </span>
                ) : (
                  c.source && (
                    <span style={badgeStyle(c.source === "consultation" ? "#3498db" : "#95a5a6")}>
                      {c.source === "consultation" ? "상담" : "직접"}
                    </span>
                  )
                )}
                {c.category && (
                  <span style={{ fontSize: 11, color: "#aaa" }}>
                    {CATEGORY_LABELS[c.category] || c.category}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* 오른쪽: 메시지 작성 */}
        <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 8, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#1a1a1a" }}>메시지 작성</h3>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>템플릿 선택</label>
            <select style={fieldStyle} value={selectedTemplate}
              onChange={(e) => handleTemplateSelect(e.target.value)}>
              <option value="">직접 입력</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {(channel === "email" || channel === "both") && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>이메일 제목 *</label>
              <input style={fieldStyle} value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="[윤정 법률사무소] 상담 일정 안내" />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              내용 *
              <span style={{ fontWeight: 400, color: "#999", marginLeft: 8 }}>
                {"{name}"} {"{date}"} {"{category}"} 사용 가능
              </span>
            </label>
            <textarea style={{ ...fieldStyle, minHeight: 180, resize: "vertical" }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="안녕하세요 {name}님, 윤정 법률사무소입니다..." />
            {(channel === "sms" || channel === "both") && (
              <div style={{ fontSize: 11, color: getByteLength(content) > 90 ? "#e74c3c" : "#999", marginTop: 4 }}>
                {getByteLength(content)} / 90 바이트
                {getByteLength(content) > 90 ? " (LMS로 발송)" : " (SMS)"}
              </div>
            )}
          </div>

          {/* 미리보기 */}
          {content && (
            <div style={{
              marginBottom: 16, padding: 12, background: "#f9f9f8",
              border: "1px solid #e0e0e0", borderRadius: 6,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#999", marginBottom: 6 }}>미리보기</div>
              <div style={{ fontSize: 13, color: "#333", whiteSpace: "pre-wrap" }}>
                {content
                  .replace(/\{name\}/g, "홍길동")
                  .replace(/\{date\}/g, new Date().toLocaleDateString("ko-KR"))
                  .replace(/\{category\}/g, "민사")}
              </div>
            </div>
          )}

          <button onClick={handleSend} disabled={sending}
            style={{ ...btnStyle(sending ? "#999" : "#27ae60"), width: "100%", padding: "12px 0", fontSize: 15 }}>
            {sending ? "발송 중..." : `${selectedClients.size}명에게 ${channelLabel} 발송`}
          </button>

          {/* 발송 결과 */}
          {result && (
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 6,
              background: result.failed > 0 ? "#fef0e7" : "#e8f8ef",
              border: `1px solid ${result.failed > 0 ? "#f5c6a8" : "#a3d9b1"}`,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                발송 완료: 총 {result.total}건 | 성공 {result.sent}건 | 실패 {result.failed}건
              </div>
              {result.results?.filter((r) => !r.success).map((r, i) => (
                <div key={i} style={{ fontSize: 12, color: "#c0392b", marginTop: 4 }}>
                  {r.recipientContact}: {r.error}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   탭 3: 발송 이력
   ================================================================ */
function LogsTab() {
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

  // 필터 변경 시 페이지 리셋
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
      alert("삭제 실패: " + err.message);
    }
  };

  /** 날짜시간 포맷 (YYYY-MM-DD HH:mm) */
  const formatDate = (d) => {
    if (!d) return "-";
    return d.replace("T", " ").slice(0, 16);
  };

  return (
    <div>
      {/* 필터 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <select style={{ ...fieldStyle, width: 140 }} value={filterChannel}
          onChange={handleFilterChange(setFilterChannel)}>
          <option value="">전체 채널</option>
          <option value="sms">SMS</option>
          <option value="email">이메일</option>
        </select>
        <select style={{ ...fieldStyle, width: 140 }} value={filterStatus}
          onChange={handleFilterChange(setFilterStatus)}>
          <option value="">전체 상태</option>
          <option value="sent">성공</option>
          <option value="failed">실패</option>
          <option value="pending">대기</option>
        </select>
        <span style={{ fontSize: 13, color: "#999", alignSelf: "center" }}>총 {meta.total}건</span>
      </div>

      {/* 테이블 */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999" }}>불러오는 중...</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#999" }}>발송 이력이 없습니다</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e0e0e0", textAlign: "left" }}>
              <th style={{ padding: "10px 8px", fontWeight: 600, color: "#555" }}>발송 일시</th>
              <th style={{ padding: "10px 8px", fontWeight: 600, color: "#555" }}>채널</th>
              <th style={{ padding: "10px 8px", fontWeight: 600, color: "#555" }}>수신자</th>
              <th style={{ padding: "10px 8px", fontWeight: 600, color: "#555" }}>내용</th>
              <th style={{ padding: "10px 8px", fontWeight: 600, color: "#555" }}>상태</th>
              <th style={{ padding: "10px 8px", fontWeight: 600, color: "#555", width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={{ padding: "10px 8px", color: "#666", whiteSpace: "nowrap" }}>
                  {formatDate(log.sentAt || log.createdAt)}
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <span style={badgeStyle(log.channel === "sms" ? "#3498db" : "#9b59b6")}>
                    {log.channel === "sms" ? "SMS" : "이메일"}
                  </span>
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <div style={{ fontWeight: 500 }}>{log.recipientName || "-"}</div>
                  <div style={{ fontSize: 11, color: "#999" }}>{log.recipientContact}</div>
                </td>
                <td style={{ padding: "10px 8px", color: "#555", maxWidth: 300 }}>
                  {log.subject && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#444", marginBottom: 2 }}>
                      {log.subject}
                    </div>
                  )}
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.content.length > 50 ? log.content.slice(0, 50) + "..." : log.content}
                  </div>
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <span style={badgeStyle(
                    log.status === "sent" ? "#27ae60" :
                    log.status === "failed" ? "#c0392b" : "#f39c12"
                  )}>
                    {log.status === "sent" ? "성공" : log.status === "failed" ? "실패" : "대기"}
                  </span>
                  {log.errorMessage && (
                    <div style={{ fontSize: 10, color: "#c0392b", marginTop: 2 }}>{log.errorMessage}</div>
                  )}
                </td>
                <td style={{ padding: "10px 8px" }}>
                  <button onClick={() => removeLog(log.id)}
                    style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 14 }}
                    title="삭제">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 페이지네이션 */}
      {meta.totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
            style={{ ...btnStyle(page <= 1 ? "#ddd" : "#666"), padding: "6px 14px" }}>이전</button>
          <span style={{ alignSelf: "center", fontSize: 13, color: "#666" }}>
            {page} / {meta.totalPages}
          </span>
          <button onClick={() => setPage(Math.min(meta.totalPages, page + 1))} disabled={page >= meta.totalPages}
            style={{ ...btnStyle(page >= meta.totalPages ? "#ddd" : "#666"), padding: "6px 14px" }}>다음</button>
        </div>
      )}
    </div>
  );
}
