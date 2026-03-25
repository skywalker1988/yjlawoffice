/**
 * PanelShell — 패널 공용 쉘 (헤더 탭 + 컨텐츠 영역)
 */
"use client";

import { ReactNode, useState } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface PanelShellProps {
  tabs: Tab[];
  defaultTab?: string;
  actions?: ReactNode;
}

export default function PanelShell({ tabs, defaultTab, actions }: PanelShellProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id);
  const current = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <div className="panel" style={{ height: "100%", width: "100%" }}>
      <div className="panel-header">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`panel-header-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        {actions && (
          <>
            <div style={{ flex: 1 }} />
            {actions}
          </>
        )}
      </div>
      <div className="panel-content">{current?.content}</div>
    </div>
  );
}
