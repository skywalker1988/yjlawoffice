/**
 * 메시지 발송 탭 — 채널 선택, 수신자 선택, 메시지 작성 및 발송
 * SMS 바이트 계산 로직 포함
 */
import { useState, useEffect } from "react";
import { api } from "../../../utils/api";
import { showToast } from "../../../utils/showToast";
import { ChannelSelector, RecipientPanel, MessageComposer } from "./SendPanels";

export default function SendTab() {
  const [channel, setChannel] = useState("sms");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const [recipientSource, setRecipientSource] = useState("clients");
  const [recipientList, setRecipientList] = useState([]);
  const [recipientLoading, setRecipientLoading] = useState(true);
  const [selectedClients, setSelectedClients] = useState(new Set());
  const [clientFilter, setClientFilter] = useState("");

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  /** 템플릿 목록 로드 */
  useEffect(() => {
    const url = channel === "both"
      ? "/messages/templates"
      : `/messages/templates?channel=${channel}`;
    api.get(url)
      .then((json) => setTemplates(json.data ?? []))
      .catch(() => setTemplates([]));
  }, [channel]);

  /** 수신자 목록 로드 */
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

  /** 템플릿 선택 시 내용 채우기 */
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    if (!templateId) return;
    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      setContent(tpl.content);
      if (tpl.subject) setSubject(tpl.subject);
    }
  };

  /** 채널 변경 시 상태 초기화 */
  const handleChannelChange = (ch) => {
    setChannel(ch);
    setSelectedTemplate("");
    setContent("");
    setSubject("");
  };

  /** 필터링된 수신자 (채널별 연락처 존재 여부 + 검색) */
  const filteredClients = recipientList.filter((c) => {
    if (channel === "sms" && !c.phone) return false;
    if (channel === "email" && !c.email) return false;
    if (channel === "both" && (!c.phone || !c.email)) return false;
    if (!clientFilter) return true;
    const query = clientFilter.toLowerCase();
    return (c.name || "").toLowerCase().includes(query)
      || (c.phone || "").includes(query)
      || (c.email || "").toLowerCase().includes(query);
  });

  /** 고객 선택 토글 */
  const toggleClient = (id) => {
    setSelectedClients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  /** 전체 선택/해제 */
  const toggleAll = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredClients.map((c) => c.id)));
    }
  };

  const channelLabel = channel === "sms" ? "문자" : channel === "email" ? "이메일" : "문자+이메일";

  /** 발송 처리 */
  const handleSend = async () => {
    if (selectedClients.size === 0) return showToast("수신자를 선택해주세요");
    if (!content.trim()) return showToast("메시지 내용을 입력해주세요");
    if ((channel === "email" || channel === "both") && !subject.trim()) {
      return showToast("이메일 제목을 입력해주세요");
    }

    const count = selectedClients.size;
    if (!confirm(`${count}명에게 ${channelLabel}를 발송하시겠습니까?`)) return;

    const selectedList = recipientList.filter((c) => selectedClients.has(c.id));

    setSending(true);
    setResult(null);
    try {
      if (channel === "both") {
        const [smsRes, emailRes] = await Promise.all([
          api.post("/messages/send", {
            channel: "sms",
            recipients: selectedList.map((c) => ({
              name: c.name, contact: c.phone, consultationId: c.id, category: c.category,
            })),
            templateId: selectedTemplate || undefined, content,
          }),
          api.post("/messages/send", {
            channel: "email",
            recipients: selectedList.map((c) => ({
              name: c.name, contact: c.email, consultationId: c.id, category: c.category,
            })),
            templateId: selectedTemplate || undefined, subject, content,
          }),
        ]);
        setResult({
          total: (smsRes.data?.total || 0) + (emailRes.data?.total || 0),
          sent: (smsRes.data?.sent || 0) + (emailRes.data?.sent || 0),
          failed: (smsRes.data?.failed || 0) + (emailRes.data?.failed || 0),
          results: [...(smsRes.data?.results || []), ...(emailRes.data?.results || [])],
        });
      } else {
        const recipients = selectedList.map((c) => ({
          name: c.name,
          contact: channel === "sms" ? c.phone : c.email,
          consultationId: c.id, category: c.category,
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
      showToast("발송 실패: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <ChannelSelector channel={channel} onChange={handleChannelChange} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <RecipientPanel
          channel={channel}
          recipientSource={recipientSource}
          onSourceChange={setRecipientSource}
          filteredClients={filteredClients}
          selectedClients={selectedClients}
          clientFilter={clientFilter}
          onFilterChange={setClientFilter}
          onToggleClient={toggleClient}
          onToggleAll={toggleAll}
          loading={recipientLoading}
        />

        <MessageComposer
          channel={channel}
          templates={templates}
          selectedTemplate={selectedTemplate}
          onTemplateSelect={handleTemplateSelect}
          subject={subject}
          onSubjectChange={setSubject}
          content={content}
          onContentChange={setContent}
          selectedCount={selectedClients.size}
          channelLabel={channelLabel}
          sending={sending}
          onSend={handleSend}
          result={result}
        />
      </div>
    </div>
  );
}
