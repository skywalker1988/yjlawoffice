/**
 * InspectorPanel — 클립 속성 인스펙터 + 모션 이펙트 + 키프레임
 */
"use client";

import { useState, useCallback } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { usePlaybackStore } from "@/stores/playbackStore";
import type { Clip, Effect, EffectParameter, Keyframe } from "@/types";

/** 기본 모션 이펙트 템플릿 */
const DEFAULT_MOTION: Effect = {
  id: "fx-motion",
  type: "motion",
  name: "Motion",
  category: "Transform",
  enabled: true,
  order: 0,
  parameters: [
    { name: "Position X", type: "number", value: 960, min: -1920, max: 3840, step: 1, keyframes: [] },
    { name: "Position Y", type: "number", value: 540, min: -1080, max: 2160, step: 1, keyframes: [] },
    { name: "Scale", type: "number", value: 100, min: 0, max: 400, step: 0.1, keyframes: [] },
    { name: "Rotation", type: "number", value: 0, min: -360, max: 360, step: 0.1, keyframes: [] },
    { name: "Opacity", type: "number", value: 100, min: 0, max: 100, step: 1, keyframes: [] },
  ],
};

/** 색보정 이펙트 템플릿 */
const COLOR_CORRECTION: Effect = {
  id: "fx-color",
  type: "color-correction",
  name: "Color Correction",
  category: "Color",
  enabled: true,
  order: 1,
  parameters: [
    { name: "Brightness", type: "number", value: 100, min: 0, max: 200, step: 1, keyframes: [] },
    { name: "Contrast", type: "number", value: 100, min: 0, max: 200, step: 1, keyframes: [] },
    { name: "Saturation", type: "number", value: 100, min: 0, max: 200, step: 1, keyframes: [] },
    { name: "Hue Rotate", type: "number", value: 0, min: -180, max: 180, step: 1, keyframes: [] },
  ],
};

export default function InspectorPanel() {
  const { selectedClipIds, updateClip, getActiveSequence } = useProjectStore();
  const currentFrame = usePlaybackStore((s) => s.currentFrame);
  const seq = getActiveSequence();

  if (!seq || selectedClipIds.length === 0) {
    return (
      <div style={{
        height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--text-muted)", fontSize: 11,
      }}>
        클립을 선택하면 속성이 표시됩니다
      </div>
    );
  }

  // 선택된 첫 번째 클립 찾기
  let selectedClip: Clip | null = null;
  for (const track of seq.tracks) {
    const found = track.clips.find((c) => c.id === selectedClipIds[0]);
    if (found) { selectedClip = found; break; }
  }
  if (!selectedClip) return null;

  // 이펙트가 없으면 기본 모션 추가
  const effects = selectedClip.effects.length > 0
    ? selectedClip.effects
    : [DEFAULT_MOTION, COLOR_CORRECTION];

  const handleParamChange = (effectIdx: number, paramIdx: number, value: number) => {
    const newEffects = [...effects];
    newEffects[effectIdx] = {
      ...newEffects[effectIdx],
      parameters: newEffects[effectIdx].parameters.map((p, i) =>
        i === paramIdx ? { ...p, value } : p
      ),
    };
    updateClip(selectedClip!.id, { effects: newEffects });
  };

  const toggleKeyframe = (effectIdx: number, paramIdx: number) => {
    const newEffects = [...effects];
    const param = newEffects[effectIdx].parameters[paramIdx];
    const existingIdx = param.keyframes.findIndex((k) => k.frame === currentFrame);

    const newKeyframes = [...param.keyframes];
    if (existingIdx >= 0) {
      newKeyframes.splice(existingIdx, 1);
    } else {
      newKeyframes.push({
        frame: currentFrame,
        value: param.value as number,
        interpolation: "linear",
      });
      newKeyframes.sort((a, b) => a.frame - b.frame);
    }

    newEffects[effectIdx] = {
      ...newEffects[effectIdx],
      parameters: newEffects[effectIdx].parameters.map((p, i) =>
        i === paramIdx ? { ...p, keyframes: newKeyframes } : p
      ),
    };
    updateClip(selectedClip!.id, { effects: newEffects });
  };

  return (
    <div style={{ padding: 4, fontSize: 11, overflow: "auto", height: "100%" }}>
      {/* 클립 정보 */}
      <SectionHeader title="CLIP INFO" />
      <InfoRow label="Speed" value={`${selectedClip.speed}x`} />
      <InfoRow label="Start" value={`F${selectedClip.startFrame}`} />
      <InfoRow label="End" value={`F${selectedClip.endFrame}`} />
      <InfoRow label="Duration" value={`${selectedClip.endFrame - selectedClip.startFrame}f`} />

      {/* 이펙트 파라미터 */}
      {effects.map((fx, fxIdx) => (
        <div key={fx.id} style={{ marginTop: 12 }}>
          <SectionHeader title={fx.name.toUpperCase()} />
          {fx.parameters.map((param, pIdx) => (
            <div key={param.name} style={{
              display: "flex", alignItems: "center", gap: 4,
              marginBottom: 6,
            }}>
              {/* 키프레임 토글 */}
              <button
                style={{
                  width: 14, height: 14, fontSize: 8,
                  background: "none", border: "none", cursor: "pointer",
                  color: param.keyframes.length > 0 ? "var(--accent)" : "var(--text-muted)",
                }}
                onClick={() => toggleKeyframe(fxIdx, pIdx)}
                title="Toggle Keyframe"
              >
                ◆
              </button>

              {/* 파라미터명 */}
              <span style={{
                width: 70, color: "var(--text-secondary)", fontSize: 10,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {param.name}
              </span>

              {/* 슬라이더 */}
              <input
                type="range"
                min={param.min ?? 0}
                max={param.max ?? 100}
                step={param.step ?? 1}
                value={param.value as number}
                onChange={(e) => handleParamChange(fxIdx, pIdx, Number(e.target.value))}
                style={{ flex: 1, accentColor: "var(--accent)", height: 4 }}
              />

              {/* 수치 */}
              <span className="timecode" style={{
                fontSize: 9, minWidth: 36, textAlign: "right",
                color: "var(--text-primary)",
              }}>
                {typeof param.value === "number" ? (param.step && param.step < 1 ? (param.value as number).toFixed(1) : param.value) : param.value}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, color: "var(--text-muted)",
      letterSpacing: "0.15em", textTransform: "uppercase",
      marginBottom: 8, paddingBottom: 4,
      borderBottom: "1px solid var(--border-primary)",
    }}>
      {title}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      padding: "2px 0", fontSize: 10,
    }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <span className="timecode" style={{ color: "var(--text-primary)", fontSize: 9 }}>{value}</span>
    </div>
  );
}
