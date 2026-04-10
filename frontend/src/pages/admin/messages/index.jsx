/**
 * 관리자 메시지 발송 — 탭 오케스트레이터
 * 템플릿 관리, 메시지 발송, 발송 이력 3개 탭을 관리
 */
import { useState } from "react";
import { PageHeader, COLORS } from "../../../components/admin";
import { tabStyle } from "./messageConstants";
import TemplatesTab from "./TemplatesTab";
import SendTab from "./SendTab";
import LogsTab from "./LogsTab";

/** 탭 정의 */
const TABS = [
  { key: "templates", label: "템플릿 관리" },
  { key: "send", label: "메시지 발송" },
  { key: "logs", label: "발송 이력" },
];

export default function AdminMessages() {
  const [activeTab, setActiveTab] = useState("templates");

  return (
    <div>
      <PageHeader
        title="메시지 발송"
        subtitle="상담 고객에게 SMS 문자 또는 이메일을 발송하고 이력을 관리합니다."
      />

      {/* 탭 바 */}
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, marginBottom: 24, display: "flex", gap: 4 }}>
        {TABS.map((tab) => (
          <button key={tab.key} style={tabStyle(activeTab === tab.key)} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "templates" && <TemplatesTab />}
      {activeTab === "send" && <SendTab />}
      {activeTab === "logs" && <LogsTab />}
    </div>
  );
}
