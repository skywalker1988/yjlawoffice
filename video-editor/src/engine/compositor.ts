/**
 * Compositor — Canvas 기반 비디오 컴포지터
 * 현재 프레임에 해당하는 클립들을 합성하여 Canvas에 렌더링
 */
import type { Sequence, Clip, MediaItem } from "@/types";
import { framesToSeconds } from "@/utils/timeCode";

export class Compositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private videoCache: Map<string, HTMLVideoElement> = new Map();
  private imageCache: Map<string, HTMLImageElement> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
  }

  /** 미디어 프리로드 */
  preloadMedia(mediaItems: MediaItem[]): void {
    for (const item of mediaItems) {
      if (item.type === "video" && !this.videoCache.has(item.id)) {
        const video = document.createElement("video");
        video.src = item.url;
        video.preload = "auto";
        video.muted = true;
        video.playsInline = true;
        this.videoCache.set(item.id, video);
      } else if (item.type === "image" && !this.imageCache.has(item.id)) {
        const img = new Image();
        img.src = item.url;
        this.imageCache.set(item.id, img);
      }
    }
  }

  /** 현재 프레임에서 활성 클립 찾기 */
  getActiveClips(sequence: Sequence, frame: number): { clip: Clip; trackIndex: number }[] {
    const result: { clip: Clip; trackIndex: number }[] = [];
    const videoTracks = sequence.tracks.filter((t) => t.type === "video");

    // 아래 트랙부터 (V1이 먼저, V3이 위에)
    for (let i = videoTracks.length - 1; i >= 0; i--) {
      const track = videoTracks[i];
      if (!track.visible || track.muted) continue;
      for (const clip of track.clips) {
        if (clip.disabled) continue;
        if (frame >= clip.startFrame && frame < clip.endFrame) {
          result.push({ clip, trackIndex: i });
        }
      }
    }
    return result;
  }

  /** 프레임 렌더링 */
  async renderFrame(
    sequence: Sequence,
    frame: number,
    mediaItems: MediaItem[]
  ): Promise<void> {
    const { width, height } = sequence.resolution;
    this.canvas.width = width;
    this.canvas.height = height;

    // 배경 검정
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, width, height);

    const activeClips = this.getActiveClips(sequence, frame);

    for (const { clip } of activeClips) {
      const media = mediaItems.find((m) => m.id === clip.mediaId);
      if (!media) continue;

      const clipLocalFrame = frame - clip.startFrame;
      const sourceFrame = clip.sourceInFrame + clipLocalFrame * clip.speed;
      const sourceTime = framesToSeconds(sourceFrame, sequence.frameRate);

      if (media.type === "video") {
        const video = this.videoCache.get(media.id);
        if (!video) continue;

        // 비디오 시간 이동
        if (Math.abs(video.currentTime - sourceTime) > 0.05) {
          video.currentTime = sourceTime;
        }

        try {
          this.ctx.drawImage(video, 0, 0, width, height);
        } catch {
          // 아직 로딩 중
        }
      } else if (media.type === "image") {
        const img = this.imageCache.get(media.id);
        if (!img || !img.complete) continue;
        this.ctx.drawImage(img, 0, 0, width, height);
      }
    }
  }

  /** 비디오 seek (외부에서 호출) */
  seekVideo(mediaId: string, time: number): void {
    const video = this.videoCache.get(mediaId);
    if (video) video.currentTime = time;
  }

  destroy(): void {
    this.videoCache.forEach((v) => { v.pause(); v.src = ""; });
    this.videoCache.clear();
    this.imageCache.clear();
  }
}
