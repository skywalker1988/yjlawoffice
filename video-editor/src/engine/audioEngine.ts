/**
 * AudioEngine — Web Audio API 기반 오디오 재생 엔진
 * 트랙별 볼륨, 팬, 뮤트, 솔로 지원
 */

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sources: Map<string, { element: HTMLAudioElement; source: MediaElementAudioSourceNode; gain: GainNode; pan: StereoPannerNode }> = new Map();

  init(): void {
    if (this.audioContext) return;
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
  }

  /** 오디오 소스 등록 */
  addSource(id: string, url: string): void {
    if (!this.audioContext || !this.masterGain || this.sources.has(id)) return;

    const element = new Audio(url);
    element.crossOrigin = "anonymous";
    element.preload = "auto";

    const source = this.audioContext.createMediaElementSource(element);
    const gain = this.audioContext.createGain();
    const pan = this.audioContext.createStereoPanner();

    source.connect(gain);
    gain.connect(pan);
    pan.connect(this.masterGain);

    this.sources.set(id, { element, source, gain, pan });
  }

  /** 볼륨 설정 (0~1) */
  setVolume(id: string, volume: number): void {
    const s = this.sources.get(id);
    if (s) s.gain.gain.value = volume;
  }

  /** 팬 설정 (-1 ~ 1) */
  setPan(id: string, pan: number): void {
    const s = this.sources.get(id);
    if (s) s.pan.pan.value = pan;
  }

  /** 마스터 볼륨 */
  setMasterVolume(volume: number): void {
    if (this.masterGain) this.masterGain.gain.value = volume;
  }

  /** 재생 시작 */
  play(id: string, time: number = 0): void {
    const s = this.sources.get(id);
    if (!s) return;
    s.element.currentTime = time;
    s.element.play().catch(() => {});
  }

  /** 일시정지 */
  pause(id: string): void {
    const s = this.sources.get(id);
    if (s) s.element.pause();
  }

  /** 모든 소스 정지 */
  pauseAll(): void {
    this.sources.forEach((s) => s.element.pause());
  }

  /** seek */
  seek(id: string, time: number): void {
    const s = this.sources.get(id);
    if (s) s.element.currentTime = time;
  }

  destroy(): void {
    this.sources.forEach((s) => {
      s.element.pause();
      s.element.src = "";
    });
    this.sources.clear();
    this.audioContext?.close();
    this.audioContext = null;
  }
}
