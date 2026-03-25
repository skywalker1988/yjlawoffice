/**
 * 미디어 메타데이터 파싱 — 비디오/오디오/이미지 파일 분석
 */

export interface MediaMeta {
  type: "video" | "audio" | "image";
  duration: number;
  width?: number;
  height?: number;
  frameRate?: number;
  thumbnailUrl?: string;
}

/** 파일 확장자 → 미디어 유형 */
export function getMediaType(filename: string): "video" | "audio" | "image" | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return "video";
  if (["mp3", "wav", "aac", "ogg", "flac", "m4a"].includes(ext)) return "audio";
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"].includes(ext)) return "image";
  return null;
}

/** 비디오/오디오 파일 메타데이터 추출 */
export function probeMedia(file: File): Promise<MediaMeta> {
  return new Promise((resolve, reject) => {
    const type = getMediaType(file.name);
    if (!type) return reject(new Error("Unsupported file type"));

    if (type === "image") {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        resolve({
          type: "image",
          duration: 5 * 30, // 이미지는 기본 5초 (150프레임 @30fps)
          width: img.naturalWidth,
          height: img.naturalHeight,
          thumbnailUrl: url,
        });
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
      return;
    }

    const el = document.createElement(type === "video" ? "video" : "audio");
    const url = URL.createObjectURL(file);
    el.preload = "metadata";

    el.onloadedmetadata = () => {
      const meta: MediaMeta = {
        type,
        duration: el.duration,
        ...(type === "video" && {
          width: (el as HTMLVideoElement).videoWidth,
          height: (el as HTMLVideoElement).videoHeight,
          frameRate: 30, // 브라우저에서 정확한 fps 감지 불가, 기본값 사용
        }),
      };

      // 비디오 썸네일 생성
      if (type === "video") {
        const video = el as HTMLVideoElement;
        video.currentTime = Math.min(1, video.duration / 4);
        video.onseeked = () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            meta.thumbnailUrl = canvas.toDataURL("image/jpeg", 0.6);
          }
          URL.revokeObjectURL(url);
          resolve(meta);
        };
      } else {
        URL.revokeObjectURL(url);
        resolve(meta);
      }
    };

    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load media"));
    };

    el.src = url;
  });
}

/** 파일 크기 포맷 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** 초 → 타임코드 문자열 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
