/**
 * ExportDialog — 내보내기 설정 대화상자
 * 포맷, 해상도, 프레임레이트, 비트레이트 설정
 */
"use client";

import { useState } from "react";
import { useProjectStore } from "@/stores/projectStore";

interface ExportSettings {
  format: "mp4" | "webm" | "gif";
  resolution: string;
  frameRate: number;
  quality: "high" | "medium" | "low";
  audioCodec: "aac" | "opus" | "none";
}

const PRESETS: Record<string, Partial<ExportSettings>> = {
  "YouTube 1080p": { format: "mp4", resolution: "1920x1080", frameRate: 30, quality: "high" },
  "YouTube 4K": { format: "mp4", resolution: "3840x2160", frameRate: 30, quality: "high" },
  "Instagram Reel": { format: "mp4", resolution: "1080x1920", frameRate: 30, quality: "medium" },
  "TikTok": { format: "mp4", resolution: "1080x1920", frameRate: 30, quality: "medium" },
  "Twitter": { format: "mp4", resolution: "1280x720", frameRate: 30, quality: "medium" },
  "GIF": { format: "gif", resolution: "480x270", frameRate: 15, quality: "low", audioCodec: "none" },
  "WebM VP9": { format: "webm", resolution: "1920x1080", frameRate: 30, quality: "high" },
};

interface ExportDialogProps {
  onClose: () => void;
}

export default function ExportDialog({ onClose }: ExportDialogProps) {
  const seq = useProjectStore((s) => s.getActiveSequence());
  const [settings, setSettings] = useState<ExportSettings>({
    format: "mp4",
    resolution: `${seq?.resolution.width ?? 1920}x${seq?.resolution.height ?? 1080}`,
    frameRate: seq?.frameRate ?? 30,
    quality: "high",
    audioCodec: "aac",
  });
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = async () => {
    setExporting(true);
    // FFmpeg.wasm 기반 인코딩은 별도 단계에서 구현
    // 현재는 진행률 시뮬레이션
    for (let i = 0; i <= 100; i += 2) {
      await new Promise((r) => setTimeout(r, 50));
      setProgress(i);
    }
    setExporting(false);
    alert("내보내기 완료! (FFmpeg.wasm 통합은 프로덕션에서 구현)");
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={onClose} />
      <div style={{
        position: "relative", background: "var(--bg-secondary)",
        border: "1px solid var(--border-primary)",
        width: 480, maxHeight: "80vh", overflow: "auto",
        boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
      }}>
        {/* 헤더 */}
        <div style={{
          padding: "14px 20px", background: "var(--bg-tertiary)",
          borderBottom: "1px solid var(--border-primary)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-bright)" }}>Export Media</span>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "var(--text-muted)",
            cursor: "pointer", fontSize: 16,
          }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {/* 프리셋 */}
          <label style={labelStyle}>Preset</label>
          <select
            className="input"
            style={{ width: "100%", marginBottom: 16 }}
            onChange={(e) => {
              const preset = PRESETS[e.target.value];
              if (preset) setSettings((s) => ({ ...s, ...preset }));
            }}
          >
            <option value="">Custom</option>
            {Object.keys(PRESETS).map((k) => <option key={k} value={k}>{k}</option>)}
          </select>

          {/* 포맷 */}
          <label style={labelStyle}>Format</label>
          <select className="input" style={{ width: "100%", marginBottom: 12 }}
            value={settings.format}
            onChange={(e) => setSettings((s) => ({ ...s, format: e.target.value as any }))}>
            <option value="mp4">MP4 (H.264)</option>
            <option value="webm">WebM (VP9)</option>
            <option value="gif">GIF</option>
          </select>

          {/* 해상도 */}
          <label style={labelStyle}>Resolution</label>
          <select className="input" style={{ width: "100%", marginBottom: 12 }}
            value={settings.resolution}
            onChange={(e) => setSettings((s) => ({ ...s, resolution: e.target.value }))}>
            <option value="3840x2160">4K (3840×2160)</option>
            <option value="1920x1080">1080p (1920×1080)</option>
            <option value="1280x720">720p (1280×720)</option>
            <option value="854x480">480p (854×480)</option>
            <option value="1080x1920">9:16 Vertical (1080×1920)</option>
            <option value="1080x1080">1:1 Square (1080×1080)</option>
          </select>

          {/* 프레임레이트 */}
          <label style={labelStyle}>Frame Rate</label>
          <select className="input" style={{ width: "100%", marginBottom: 12 }}
            value={settings.frameRate}
            onChange={(e) => setSettings((s) => ({ ...s, frameRate: Number(e.target.value) }))}>
            {[24, 25, 30, 60].map((f) => <option key={f} value={f}>{f} fps</option>)}
          </select>

          {/* 품질 */}
          <label style={labelStyle}>Quality</label>
          <select className="input" style={{ width: "100%", marginBottom: 12 }}
            value={settings.quality}
            onChange={(e) => setSettings((s) => ({ ...s, quality: e.target.value as any }))}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* 오디오 */}
          {settings.format !== "gif" && (
            <>
              <label style={labelStyle}>Audio Codec</label>
              <select className="input" style={{ width: "100%", marginBottom: 16 }}
                value={settings.audioCodec}
                onChange={(e) => setSettings((s) => ({ ...s, audioCodec: e.target.value as any }))}>
                <option value="aac">AAC</option>
                <option value="opus">Opus</option>
                <option value="none">No Audio</option>
              </select>
            </>
          )}

          {/* 진행률 */}
          {exporting && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                height: 6, background: "var(--bg-primary)", borderRadius: 3, overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", width: `${progress}%`,
                  background: "var(--accent)",
                  transition: "width 0.1s",
                }} />
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, textAlign: "center" }}>
                Rendering... {progress}%
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn" onClick={onClose} disabled={exporting}>Cancel</button>
            <button className="btn btn-primary" onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting..." : "Export"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", marginBottom: 4, fontSize: 10, fontWeight: 600,
  color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" as const,
};
