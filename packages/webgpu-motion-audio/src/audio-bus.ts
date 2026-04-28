// ── Audio Bus — Frequency-band analysis for WebGPU motion modulation ──
// Demo mode: sin-based simulation (no audio file needed)
// Live mode: Web Audio API AnalyserNode + FFT
// Smoothing: frame-rate independent, asymmetric attack/release
//
// Ported verbatim from motion-dot-new-webgpu (dot's richer implementation —
// MediaStream input + source node caching) and lifted into a shared substrate
// with a constructor config so each app can tune its silent-time aesthetic
// without re-implementing the DSP.

import type { AudioBands, OnsetBands } from "./types";
import { generateAmbientOnsets, generateBeatOnsets } from "./demo-generators";

export type { AudioBands, OnsetBands } from "./types";

/**
 * Canon intensity envelope constants (phrase-level musical response).
 * Individual apps may override via {@link AudioBusConfig} — see
 * `.claude/plans/motion-flowline-webgpu-users-chibatakumi-fuzzy-wadler.md` §D.1.
 */
export const CANON_INTENSITY_ATTACK_TAU = 1.5;
export const CANON_INTENSITY_RELEASE_TAU = 3.0;

export interface AudioBusConfig {
  /**
   * Silent-time aesthetic. `"ambient"` (default) keeps onsets quiet —
   * suitable for grid's architectural stillness. `"beat"` injects a
   * 120 BPM kick/snare/hat synthetic pattern — suitable for dot's
   * particle choreography.
   */
  readonly demoStyle?: "ambient" | "beat";

  /** Intensity attack tau in seconds. Canon: 1.5. */
  readonly intensityAttackTau?: number;

  /** Intensity release tau in seconds. Canon: 3.0. */
  readonly intensityReleaseTau?: number;
}

interface ConnectMediaStreamOptions {
  readonly monitor?: boolean;
}

/** RMS within a bin range — better dynamic range than mean */
function rmsRange(data: Uint8Array<ArrayBuffer>, from: number, to: number): number {
  let sum = 0;
  const end = Math.min(to, data.length);
  for (let i = from; i < end; i++) {
    const v = data[i] / 255;
    sum += v * v;
  }
  return Math.sqrt(sum / ((end - from) || 1));
}

/** RMS across all bins */
function rms(data: Uint8Array<ArrayBuffer>): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = data[i] / 255;
    sum += v * v;
  }
  return Math.sqrt(sum / (data.length || 1));
}

export class AudioBus {
  private _mode: "demo" | "live" = "demo";
  private readonly demoStyle: "ambient" | "beat";
  private analyser: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;
  private audioElementSourceNode: MediaElementAudioSourceNode | null = null;
  private streamSourceNode: MediaStreamAudioSourceNode | null = null;
  private activeSourceNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private frequencyData: Uint8Array<ArrayBuffer> | null = null;
  private currentInputStream: MediaStream | null = null;
  private audioElementOutputGain = 1;
  private demoTime = 0;

  // Jitter-removal smoothing (fast, just removes FFT noise).
  // Aesthetic shaping is done externally via asymSmooth in each app.
  private readonly attackTau = 0.02;   // 20ms — pass transients through
  private readonly releaseTau = 0.05;  // 50ms — pass decay through

  // Musical-phrase envelope (constructor-configurable; canon 1.5/3.0).
  // Mutable (not readonly) to support the Commit 5 dev-only `[`/`]` live A/B
  // toggle in grid — destroying + re-creating the bus would sever an active
  // audio connection mid-phrase, killing the diagnostic signal.
  private intensityAttackTau: number;
  private intensityReleaseTau: number;

  private readonly _bands: AudioBands = { bass: 0, mid: 0, treble: 0, energy: 0 };
  private readonly _onsets: OnsetBands = { bassOnset: 0, midOnset: 0, trebleOnset: 0, globalOnset: 0 };
  private _intensity = 0;

  // ── Onset detection state ──
  private prevFreqData: Float32Array | null = null;
  private fluxHistory: Float32Array[] = [];
  private fluxHistoryIndex = 0;
  private readonly FLUX_WINDOW = 20;       // ~333ms at 60fps
  private readonly FLUX_MULTIPLIER = 1.5;  // Bello et al. (2005)
  private readonly ONSET_DECAY_TAU = 0.04; // 40ms exponential decay

  constructor(config: AudioBusConfig = {}) {
    this.demoStyle = config.demoStyle ?? "ambient";
    this.intensityAttackTau = config.intensityAttackTau ?? CANON_INTENSITY_ATTACK_TAU;
    this.intensityReleaseTau = config.intensityReleaseTau ?? CANON_INTENSITY_RELEASE_TAU;
  }

  get bands(): Readonly<AudioBands> { return this._bands; }
  get onsets(): Readonly<OnsetBands> { return this._onsets; }
  get intensity(): number { return this._intensity; }
  get mode(): "demo" | "live" { return this._mode; }
  get intensityTau(): { readonly attack: number; readonly release: number } {
    return { attack: this.intensityAttackTau, release: this.intensityReleaseTau };
  }

  /**
   * Live-mutate the intensity envelope tau. Intended for the dev-only `[`/`]`
   * A/B toggle on grid (Commit 5). Preserves the active AudioContext and any
   * attached source so comparison stays continuous.
   */
  setIntensityTau(attack: number, release: number): void {
    this.intensityAttackTau = attack;
    this.intensityReleaseTau = release;
  }

  private resetReactiveState(): void {
    this._bands.bass = 0;
    this._bands.mid = 0;
    this._bands.treble = 0;
    this._bands.energy = 0;
    this._onsets.bassOnset = 0;
    this._onsets.midOnset = 0;
    this._onsets.trebleOnset = 0;
    this._onsets.globalOnset = 0;
    this._intensity = 0;
    this.prevFreqData = null;
    this.fluxHistory = [];
    this.fluxHistoryIndex = 0;
  }

  private async ensureAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    return this.audioContext;
  }

  private ensureAnalyser(): AnalyserNode {
    if (!this.audioContext) {
      throw new Error("AudioContext is not available");
    }

    if (!this.analyser) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0;
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    }

    return this.analyser;
  }

  private ensureGainNode(): GainNode {
    if (!this.audioContext) {
      throw new Error("AudioContext is not available");
    }

    if (!this.gainNode) {
      this.gainNode = this.audioContext.createGain();
    }

    return this.gainNode;
  }

  /** Frame-rate independent exponential smoothing */
  private smooth(current: number, target: number, dt: number): number {
    const tau = target > current ? this.attackTau : this.releaseTau;
    const alpha = 1 - Math.exp(-dt / tau);
    return current + (target - current) * alpha;
  }

  /** Slow envelope for musical phrasing over multiple seconds */
  private smoothIntensity(dt: number): void {
    const tau = this._bands.energy > this._intensity
      ? this.intensityAttackTau
      : this.intensityReleaseTau;
    const alpha = 1 - Math.exp(-dt / tau);
    this._intensity += (this._bands.energy - this._intensity) * alpha;
  }

  /** Half-wave rectified spectral flux for a bin range */
  private spectralFlux(current: Uint8Array<ArrayBuffer>, prev: Float32Array, from: number, to: number): number {
    let flux = 0;
    const end = Math.min(to, current.length);
    for (let i = from; i < end; i++) {
      const diff = (current[i] / 255) - prev[i];
      if (diff > 0) flux += diff;
    }
    return flux / ((end - from) || 1);
  }

  /** Running mean of flux history for a given band index */
  private adaptiveThreshold(bandIdx: number): number {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < this.fluxHistory.length; i++) {
      sum += this.fluxHistory[i][bandIdx];
      count++;
    }
    if (count === 0) return 0.01;
    return (sum / count) * this.FLUX_MULTIPLIER;
  }

  /** Compute onset impulses from spectral flux (live mode) */
  private updateOnsetsLive(dt: number): void {
    if (!this.frequencyData) return;

    if (!this.prevFreqData) {
      this.prevFreqData = new Float32Array(this.frequencyData.length);
      for (let i = 0; i < this.frequencyData.length; i++) {
        this.prevFreqData[i] = this.frequencyData[i] / 255;
      }
      return;
    }

    const bassFlux = this.spectralFlux(this.frequencyData, this.prevFreqData, 1, 5);
    const midFlux = this.spectralFlux(this.frequencyData, this.prevFreqData, 5, 46);
    const trebleFlux = this.spectralFlux(this.frequencyData, this.prevFreqData, 46, 140);

    if (this.fluxHistory.length < this.FLUX_WINDOW) {
      this.fluxHistory.push(new Float32Array(3));
    }

    const slot = this.fluxHistory[this.fluxHistoryIndex];
    slot[0] = bassFlux;
    slot[1] = midFlux;
    slot[2] = trebleFlux;
    this.fluxHistoryIndex = (this.fluxHistoryIndex + 1) % this.FLUX_WINDOW;

    const bassThresh = this.adaptiveThreshold(0);
    const midThresh = this.adaptiveThreshold(1);
    const trebleThresh = this.adaptiveThreshold(2);

    const decay = Math.exp(-dt / this.ONSET_DECAY_TAU);
    this._onsets.bassOnset = bassFlux > bassThresh
      ? Math.min((bassFlux - bassThresh) / (bassThresh || 0.01), 1)
      : this._onsets.bassOnset * decay;
    this._onsets.midOnset = midFlux > midThresh
      ? Math.min((midFlux - midThresh) / (midThresh || 0.01), 1)
      : this._onsets.midOnset * decay;
    this._onsets.trebleOnset = trebleFlux > trebleThresh
      ? Math.min((trebleFlux - trebleThresh) / (trebleThresh || 0.01), 1)
      : this._onsets.trebleOnset * decay;
    this._onsets.globalOnset = Math.max(this._onsets.bassOnset, this._onsets.midOnset, this._onsets.trebleOnset);

    for (let i = 0; i < this.frequencyData.length; i++) {
      this.prevFreqData[i] = this.frequencyData[i] / 255;
    }
  }

  private updateDemo(dt: number): void {
    this.demoTime += dt;
    const t = this.demoTime;

    const rawBass = 0.5 + 0.5 * Math.sin(t * 0.8);
    const rawMid = 0.5 + 0.5 * Math.sin(t * 1.5 + 1.0);
    const rawTreble = 0.5 + 0.5 * Math.sin(t * 3.0 + 2.0);
    const rawEnergy = (rawBass + rawMid + rawTreble) / 3;

    this._bands.bass = this.smooth(this._bands.bass, rawBass, dt);
    this._bands.mid = this.smooth(this._bands.mid, rawMid, dt);
    this._bands.treble = this.smooth(this._bands.treble, rawTreble, dt);
    this._bands.energy = this.smooth(this._bands.energy, rawEnergy, dt);
    this.smoothIntensity(dt);

    if (this.demoStyle === "beat") {
      generateBeatOnsets(this._onsets, this.demoTime, dt);
    } else {
      generateAmbientOnsets(this._onsets, dt);
    }
  }

  private updateLive(dt: number): void {
    if (!this.analyser || !this.frequencyData) return;

    this.analyser.getByteFrequencyData(this.frequencyData);

    const rawBass = rmsRange(this.frequencyData, 1, 5);
    const rawMid = rmsRange(this.frequencyData, 5, 46);
    const rawTreble = rmsRange(this.frequencyData, 46, 140);
    const rawEnergy = rms(this.frequencyData);

    this._bands.bass = this.smooth(this._bands.bass, rawBass, dt);
    this._bands.mid = this.smooth(this._bands.mid, rawMid, dt);
    this._bands.treble = this.smooth(this._bands.treble, rawTreble, dt);
    this._bands.energy = this.smooth(this._bands.energy, rawEnergy, dt);
    this.smoothIntensity(dt);

    this.updateOnsetsLive(dt);
  }

  private disconnectActiveSource(): void {
    this.activeSourceNode?.disconnect();
    this.activeSourceNode = null;
    this.gainNode?.disconnect();
  }

  private stopInputStream(): void {
    this.streamSourceNode?.disconnect();
    this.streamSourceNode = null;

    if (this.currentInputStream) {
      for (const track of this.currentInputStream.getTracks()) {
        track.stop();
      }
      this.currentInputStream = null;
    }
  }

  private connectSource(
    source: AudioNode,
    options: Readonly<{ monitor: boolean; gain?: number }>,
  ): void {
    const analyser = this.ensureAnalyser();
    this.disconnectActiveSource();
    source.connect(analyser);

    if (options.monitor) {
      const gain = this.ensureGainNode();
      gain.gain.value = options.gain ?? 1;
      source.connect(gain);
      gain.connect(this.audioContext!.destination);
    }

    this.activeSourceNode = source;
    this.resetReactiveState();
  }

  update(dt: number): void {
    if (dt <= 0) return;

    if (this._mode === "demo") {
      this.updateDemo(dt);
    } else {
      this.updateLive(dt);
    }
  }

  async connectAudioElement(audio: HTMLAudioElement): Promise<void> {
    const context = await this.ensureAudioContext();

    if (!this.audioElementSourceNode) {
      this.audioElementSourceNode = context.createMediaElementSource(audio);
    }

    this.stopInputStream();
    const outputGain = audio.volume !== 1 ? audio.volume : this.audioElementOutputGain;
    this.audioElementOutputGain = outputGain;
    audio.volume = 1.0;
    this.connectSource(this.audioElementSourceNode, {
      monitor: true,
      gain: outputGain,
    });
  }

  async connectMediaStream(
    stream: MediaStream,
    options: ConnectMediaStreamOptions = {},
  ): Promise<void> {
    const context = await this.ensureAudioContext();
    this.stopInputStream();
    this.currentInputStream = stream;
    this.streamSourceNode = context.createMediaStreamSource(stream);
    this.connectSource(this.streamSourceNode, {
      monitor: options.monitor ?? false,
    });
  }

  disconnectCurrentSource(): void {
    this.disconnectActiveSource();
    this.stopInputStream();
    this.setMode("demo");
    this.resetReactiveState();
  }

  setMode(mode: "demo" | "live"): void {
    this._mode = mode;
    if (mode === "demo") {
      this.demoTime = 0;
    }
  }

  debugState(): string {
    const ctx = this.audioContext?.state ?? "none";
    const hasAnalyser = !!this.analyser;
    const hasData = !!this.frequencyData;
    const dataSum = this.frequencyData ? this.frequencyData.reduce((a, b) => a + b, 0) : -1;
    return `${ctx}|an:${hasAnalyser}|fd:${hasData}|sum:${dataSum}`;
  }

  destroy(): void {
    this.disconnectActiveSource();
    this.stopInputStream();
    if (this.audioElementSourceNode) { this.audioElementSourceNode.disconnect(); this.audioElementSourceNode = null; }
    if (this.analyser) { this.analyser.disconnect(); this.analyser = null; }
    if (this.gainNode) { this.gainNode.disconnect(); this.gainNode = null; }
    if (this.audioContext) { this.audioContext.close(); this.audioContext = null; }
    this.frequencyData = null;
    this.resetReactiveState();
  }
}
