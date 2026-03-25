/**
 * 비디오 에디터 핵심 타입 정의
 * Adobe Premiere Pro 데이터 모델 기반
 */

export interface Project {
  id: string;
  name: string;
  sequences: Sequence[];
  mediaBin: MediaItem[];
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSettings {
  defaultSequenceWidth: number;
  defaultSequenceHeight: number;
  defaultFrameRate: number;
  autoSaveInterval: number;
}

export interface Sequence {
  id: string;
  name: string;
  resolution: { width: number; height: number };
  frameRate: number;
  tracks: Track[];
  markers: Marker[];
  duration: number;
}

export interface Track {
  id: string;
  type: "video" | "audio";
  name: string;
  clips: Clip[];
  locked: boolean;
  muted: boolean;
  solo: boolean;
  visible: boolean;
  height: number;
  color: string;
}

export interface Clip {
  id: string;
  mediaId: string;
  trackId: string;
  startFrame: number;
  endFrame: number;
  sourceInFrame: number;
  sourceOutFrame: number;
  speed: number;
  reversed: boolean;
  disabled: boolean;
  effects: Effect[];
  transitions: { in?: Transition; out?: Transition };
  label: string;
}

export interface MediaItem {
  id: string;
  name: string;
  type: "video" | "audio" | "image";
  file: File | null;
  url: string;
  duration: number;
  width?: number;
  height?: number;
  frameRate?: number;
  thumbnailUrl?: string;
  fileSize: number;
  codec?: string;
  folder?: string;
}

export interface Marker {
  id: string;
  frame: number;
  name: string;
  color: string;
  comment?: string;
}

export interface Effect {
  id: string;
  type: string;
  name: string;
  category: string;
  enabled: boolean;
  order: number;
  parameters: EffectParameter[];
}

export interface EffectParameter {
  name: string;
  type: "number" | "color" | "boolean" | "select";
  value: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  keyframes: Keyframe[];
}

export interface Keyframe {
  frame: number;
  value: number;
  interpolation: "linear" | "ease-in" | "ease-out" | "ease-in-out" | "bezier";
  bezierHandles?: { inX: number; inY: number; outX: number; outY: number };
}

export interface Transition {
  id: string;
  type: string;
  duration: number;
  alignment: "center" | "start" | "end";
}

export type Tool =
  | "selection"
  | "track-select"
  | "razor"
  | "slip"
  | "slide"
  | "rolling"
  | "ripple"
  | "hand"
  | "zoom"
  | "type";

export type PanelId =
  | "media-browser"
  | "source-monitor"
  | "program-monitor"
  | "timeline"
  | "effects"
  | "inspector";
