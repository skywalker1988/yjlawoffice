/**
 * 타임코드 유틸리티 — 프레임 ↔ 타임코드 변환
 */

/** 프레임 → HH:MM:SS:FF 타임코드 */
export function framesToTimecode(frame: number, fps: number = 30): string {
  const totalSeconds = Math.floor(frame / fps);
  const f = frame % fps;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
}

/** 프레임 → MM:SS 짧은 표시 */
export function framesToShort(frame: number, fps: number = 30): string {
  const totalSeconds = Math.floor(frame / fps);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

/** 초 → 프레임 */
export function secondsToFrames(seconds: number, fps: number = 30): number {
  return Math.round(seconds * fps);
}

/** 프레임 → 초 */
export function framesToSeconds(frames: number, fps: number = 30): number {
  return frames / fps;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
