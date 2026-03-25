/**
 * 메인 에디터 페이지 — Adobe Premiere Pro 스타일 패널 레이아웃
 * react-resizable-panels로 리사이즈 가능한 스플릿 구현
 */
"use client";

import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import MenuBar from "@/components/layout/MenuBar";
import Toolbar from "@/components/layout/Toolbar";
import PanelShell from "@/components/layout/PanelShell";
import MediaBrowserPanel from "@/components/media-browser/MediaBrowserPanel";
import SourceMonitor from "@/components/monitors/SourceMonitor";
import ProgramMonitor from "@/components/monitors/ProgramMonitor";
import EffectsPanel from "@/components/effects/EffectsPanel";
import InspectorPanel from "@/components/effects/InspectorPanel";
import TimelinePanel from "@/components/timeline/TimelinePanel";
import ExportDialog from "@/components/export/ExportDialog";
import { useKeyboardShortcuts } from "@/utils/shortcuts";
import { useState } from "react";

export default function EditorPage() {
  useKeyboardShortcuts();
  const [showExport, setShowExport] = useState(false);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* 상단 메뉴바 */}
      <MenuBar />

      {/* 메인 작업 영역: 툴바 + 패널 */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* 좌측 도구 모음 */}
        <Toolbar />

        {/* 패널 레이아웃 */}
        <PanelGroup orientation="vertical" style={{ flex: 1 }}>
          {/* ── 상단 영역: 미디어 + 소스 모니터 + 프로그램 모니터 ── */}
          <Panel defaultSize={55} minSize={30}>
            <PanelGroup orientation="horizontal">
              {/* 좌측: 미디어 브라우저 */}
              <Panel defaultSize={22} minSize={15} maxSize={35}>
                <PanelShell
                  tabs={[
                    { id: "media", label: "Media", content: <MediaBrowserPanel /> },
                    { id: "effects", label: "Effects", content: <EffectsPanel /> },
                  ]}
                />
              </Panel>

              <PanelResizeHandle />

              {/* 중앙: 소스 모니터 */}
              <Panel defaultSize={38} minSize={20}>
                <PanelShell
                  tabs={[
                    { id: "source", label: "Source", content: <SourceMonitor /> },
                  ]}
                />
              </Panel>

              <PanelResizeHandle />

              {/* 우측: 프로그램 모니터 */}
              <Panel defaultSize={40} minSize={25}>
                <PanelShell
                  tabs={[
                    { id: "program", label: "Program", content: <ProgramMonitor /> },
                  ]}
                />
              </Panel>
            </PanelGroup>
          </Panel>

          <PanelResizeHandle />

          {/* ── 하단 영역: 인스펙터 + 타임라인 ── */}
          <Panel defaultSize={45} minSize={20}>
            <PanelGroup orientation="horizontal">
              {/* 좌측: 인스펙터/키프레임 */}
              <Panel defaultSize={22} minSize={15} maxSize={35}>
                <PanelShell
                  tabs={[
                    { id: "inspector", label: "Inspector", content: <InspectorPanel /> },
                    { id: "keyframes", label: "Keyframes", content: <div style={{ padding: 8, color: "var(--text-muted)", fontSize: 11 }}>키프레임 에디터 (6단계)</div> },
                    { id: "mixer", label: "Audio Mixer", content: <div style={{ padding: 8, color: "var(--text-muted)", fontSize: 11 }}>오디오 믹서 (8단계)</div> },
                  ]}
                />
              </Panel>

              <PanelResizeHandle />

              {/* 우측: 타임라인 */}
              <Panel defaultSize={78} minSize={40}>
                <div className="panel" style={{ height: "100%" }}>
                  <TimelinePanel />
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {showExport && <ExportDialog onClose={() => setShowExport(false)} />}
    </div>
  );
}
