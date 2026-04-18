/**
 * @fileoverview Filmtone Web — 動画を現在のグレードで書き出す PoC（H.264 MP4 優先・VP9/VP8 WebM フォールバック）。
 *
 * @overview プレビューと同じ `Viewport` 設定をオフスクリーンに複製し、1 フレームずつ
 *   `HTMLVideoElement` にシーク → `VideoTexture` で描画 → `VideoFrame` → `VideoEncoder` → mux。
 *   合成の Y 反転（`setExportFlipY`）は readPixels 向け。`VideoFrame(canvas)` は画面と同じ向きのためオフ。
 * @limitations 映像のみ（音声なし）。H.264 は Safari で bitrate 上限などブラウザ差が大きいため、
 *   広い `avc1` 候補と software encoder・VP9/VP8 へ順にフォールバックする。
 */

import * as THREE from "three";
import {
  Muxer as Mp4Muxer,
  ArrayBufferTarget as Mp4ArrayBufferTarget,
} from "mp4-muxer";
import {
  Muxer as WebmMuxer,
  ArrayBufferTarget as WebmArrayBufferTarget,
} from "webm-muxer";
import { Viewport } from "film-lab-renderer";

/**
 * @description Web 動画書き出しで使うエラー種別（UI でメッセージを分けるときの code）。
 */
export class WebFilmLabExportError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NO_METADATA"
      | "TOO_LONG"
      | "NO_WEBCODECS"
      | "ENCODER_CONFIG"
      | "ENCODE"
      | "SEEK"
      | "UNKNOWN",
  ) {
    super(message);
    this.name = "WebFilmLabExportError";
  }
}

export type FilmLabWebVideoExportProgress = {
  phase: "prepare" | "encode" | "finalize";
  frameIndex: number;
  frameCount: number;
};

export type FilmLabWebVideoExportOptions = {
  sourceVideo: HTMLVideoElement;
  /** いま画面に載っているグレードの正本（LUT / params を複製する） */
  sourceViewport: Viewport;
  /** @default 90 */
  maxDurationSec?: number;
  /** @default 30 */
  targetFps?: number;
  /** 長辺の上限（ピクセル）。@default 1920 */
  maxLongEdge?: number;
  /** @default 5_000_000 */
  videoBitrate?: number;
  onProgress?: (p: FilmLabWebVideoExportProgress) => void;
  /** 生成物のファイル名（拡張子 .mp4 を含めてもよい） */
  fileBaseName?: string;
};

/**
 * @description 動画を指定時刻へシークし、`seeked` まで待つ。
 * @param video シーク対象
 * @param timeSec 秒（0〜duration）
 * @param timeoutMs 待ち上限
 */
function seekVideo(
  video: HTMLVideoElement,
  timeSec: number,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const clamped = Math.max(0, Math.min(timeSec, Math.max(0, video.duration - 1e-4)));
    const tol = 1 / 60;
    if (Math.abs(video.currentTime - clamped) <= tol) {
      requestAnimationFrame(() => resolve());
      return;
    }

    const timer = window.setTimeout(() => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      reject(
        new WebFilmLabExportError(
          `seekVideo: timeout after ${timeoutMs}ms (target ${clamped.toFixed(4)}s)`,
          "SEEK",
        ),
      );
    }, timeoutMs);

    const onSeeked = () => {
      window.clearTimeout(timer);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      resolve();
    };

    const onError = () => {
      window.clearTimeout(timer);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      reject(
        new WebFilmLabExportError("seekVideo: HTMLVideoElement error", "SEEK"),
      );
    };

    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });
    try {
      video.currentTime = clamped;
    } catch (err) {
      window.clearTimeout(timer);
      const msg = err instanceof Error ? err.message : String(err);
      reject(
        new WebFilmLabExportError(
          `seekVideo: assign currentTime failed (${msg})`,
          "SEEK",
        ),
      );
    }
  });
}

/** Safari 等で無効になりやすい過大 bitrate の上限（Chrome はより高くても可） */
const WEB_EXPORT_MAX_AVC_BITRATE = 10_000_000;

/**
 * @description 推奨ビットレートから、試す値のリストを作る（重複除去・下限付き）。
 */
function bitrateCandidates(requested: number): number[] {
  const capped = Math.min(Math.max(1, requested), WEB_EXPORT_MAX_AVC_BITRATE);
  const raw = [
    capped,
    Math.min(capped, 8_000_000),
    Math.min(capped, 6_000_000),
    5_000_000,
    3_000_000,
    2_000_000,
    1_000_000,
    800_000,
    500_000,
  ];
  const set = new Set<number>();
  for (const b of raw) {
    const v = Math.floor(b);
    if (v >= 200_000) set.add(v);
  }
  return [...set];
}

/**
 * @description 一般的な avc1 文字列を幅広に試す（環境差が大きいため列挙を厚くする）。
 */
const AVC1_CODEC_CANDIDATES: string[] = [
  "avc1.42001f",
  "avc1.42001F",
  "avc1.42001e",
  "avc1.42001E",
  "avc1.42E01E",
  "avc1.42e01e",
  "avc1.42E01f",
  "avc1.420028",
  "avc1.420020",
  "avc1.4d001e",
  "avc1.4D001E",
  "avc1.4d001f",
  "avc1.4D001F",
  "avc1.4d0020",
  "avc1.4D0020",
  "avc1.64001e",
  "avc1.64001E",
  "avc1.64001f",
  "avc1.640020",
  "avc1.640028",
  "avc1.640032",
];

const VP9_CODEC_CANDIDATES = [
  "vp09.00.10.08",
  "vp09.00.20.08",
  "vp09.00.30.08",
  "vp09.00.41.08",
];

type HardwareAccelTrial = VideoEncoderConfig["hardwareAcceleration"];

/**
 * @description isConfigSupported を投げずに試す（Safari が不正組み合わせで reject することがある）。
 */
async function probeEncoderConfig(
  trial: VideoEncoderConfig,
): Promise<VideoEncoderConfig | null> {
  try {
    const r = await VideoEncoder.isConfigSupported(trial);
    if (r.supported && r.config) {
      return r.config;
    }
  } catch {
    /* ブラウザが特定のフィールドの組み合わせを例外にする */
  }
  return null;
}

/**
 * @description H.264 (AVC) の利用可能な設定を探す。
 */
async function resolveAvcEncoderConfig(args: {
  width: number;
  height: number;
  fps: number;
  bitrate: number;
}): Promise<VideoEncoderConfig | null> {
  const bitrates = bitrateCandidates(args.bitrate);
  const framerateTrials: (number | undefined)[] = [args.fps, undefined];
  const hwTrials: HardwareAccelTrial[] = [
    undefined,
    "prefer-hardware",
    "prefer-software",
  ];

  for (const codec of AVC1_CODEC_CANDIDATES) {
    for (const bitrate of bitrates) {
      for (const fr of framerateTrials) {
        for (const hardwareAcceleration of hwTrials) {
          const trial: VideoEncoderConfig = {
            codec,
            width: args.width,
            height: args.height,
            bitrate,
            ...(fr !== undefined ? { framerate: fr } : {}),
            ...(hardwareAcceleration !== undefined
              ? { hardwareAcceleration }
              : {}),
          };
          const ok = await probeEncoderConfig(trial);
          if (ok) return ok;
        }
      }
    }
  }
  return null;
}

/**
 * @description VP9（WebM 用）のエンコーダ設定を探す。
 */
async function resolveVp9EncoderConfig(args: {
  width: number;
  height: number;
  fps: number;
  bitrate: number;
}): Promise<VideoEncoderConfig | null> {
  const bitrates = bitrateCandidates(args.bitrate);
  const framerateTrials: (number | undefined)[] = [args.fps, undefined];
  const hwTrials: HardwareAccelTrial[] = [
    undefined,
    "prefer-hardware",
    "prefer-software",
  ];

  for (const codec of VP9_CODEC_CANDIDATES) {
    for (const bitrate of bitrates) {
      for (const fr of framerateTrials) {
        for (const hardwareAcceleration of hwTrials) {
          const trial: VideoEncoderConfig = {
            codec,
            width: args.width,
            height: args.height,
            bitrate,
            ...(fr !== undefined ? { framerate: fr } : {}),
            ...(hardwareAcceleration !== undefined
              ? { hardwareAcceleration }
              : {}),
          };
          const ok = await probeEncoderConfig(trial);
          if (ok) return ok;
        }
      }
    }
  }
  return null;
}

/**
 * @description VP8（WebM 用）のエンコーダ設定を探す。
 */
async function resolveVp8EncoderConfig(args: {
  width: number;
  height: number;
  fps: number;
  bitrate: number;
}): Promise<VideoEncoderConfig | null> {
  const bitrates = bitrateCandidates(args.bitrate);
  const framerateTrials: (number | undefined)[] = [args.fps, undefined];
  const hwTrials: HardwareAccelTrial[] = [
    undefined,
    "prefer-hardware",
    "prefer-software",
  ];

  for (const bitrate of bitrates) {
    for (const fr of framerateTrials) {
      for (const hardwareAcceleration of hwTrials) {
        const trial: VideoEncoderConfig = {
          codec: "vp8",
          width: args.width,
          height: args.height,
          bitrate,
          ...(fr !== undefined ? { framerate: fr } : {}),
          ...(hardwareAcceleration !== undefined
            ? { hardwareAcceleration }
            : {}),
        };
        const ok = await probeEncoderConfig(trial);
        if (ok) return ok;
      }
    }
  }
  return null;
}

/** 最終的に採用したコンテナと WebM の Matroska codec 識別子 */
type ExportEncoderPick =
  | { format: "mp4"; config: VideoEncoderConfig }
  | {
      format: "webm";
      config: VideoEncoderConfig;
      webmMatroskaCodec: "V_VP9" | "V_VP8";
    };

/**
 * @description MP4 (AVC) → WebM (VP9) → WebM (VP8) の順でエンコーダを決める。
 */
async function resolveExportEncoder(args: {
  width: number;
  height: number;
  fps: number;
  bitrate: number;
}): Promise<ExportEncoderPick> {
  const avc = await resolveAvcEncoderConfig(args);
  if (avc) {
    return { format: "mp4", config: avc };
  }

  const vp9 = await resolveVp9EncoderConfig(args);
  if (vp9) {
    return { format: "webm", config: vp9, webmMatroskaCodec: "V_VP9" };
  }

  const vp8 = await resolveVp8EncoderConfig(args);
  if (vp8) {
    return { format: "webm", config: vp8, webmMatroskaCodec: "V_VP8" };
  }

  throw new WebFilmLabExportError(
    "No supported video encoder (tried H.264 / VP9 / VP8). Update the browser or try Chrome / Edge / Safari 17.2+.",
    "ENCODER_CONFIG",
  );
}

/**
 * @description Blob をダウンロードリンクで保存する。
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
  }, 4_000);
}

/**
 * @description エクスポート解像度（縦横偶数・長辺制限）。
 *   H.264 4:2:0 の `VideoEncoder` は **16 の倍数**が安全。8 だけ揃えると 1920×1080 のように
 *   高さが 16 で割り切れない出力になり、`isConfigSupported` は true でも `encode` で
 *   「VideoEncoder is not configured」等の失敗になるブラウザがある（Chrome 系の既知のすり抜け）。
 */
function computeExportSize(
  srcW: number,
  srcH: number,
  maxLongEdge: number,
): { width: number; height: number } {
  const iw = Math.max(1, Math.floor(srcW));
  const ih = Math.max(1, Math.floor(srcH));
  const long = Math.max(iw, ih);
  let w = iw;
  let h = ih;
  if (long > maxLongEdge) {
    const s = maxLongEdge / long;
    w = Math.max(2, Math.round(iw * s));
    h = Math.max(2, Math.round(ih * s));
  }
  w -= w % 2;
  h -= h % 2;
  w = Math.max(16, (w >> 4) << 4);
  h = Math.max(16, (h >> 4) << 4);
  return { width: w, height: h };
}

/**
 * @description Web 上でグレード済み動画を書き出す（MP4 優先、不可なら WebM）。
 * @param opts.sourceVideo プレビューと同一の `<video>`（Texture の正本）
 * @param opts.sourceViewport 現在の LUT / params の取り出し元
 */
export async function runFilmLabWebVideoExport(
  opts: FilmLabWebVideoExportOptions,
): Promise<void> {
  if (typeof VideoEncoder !== "function" || typeof VideoFrame !== "function") {
    throw new WebFilmLabExportError(
      "VideoEncoder / VideoFrame are not available (use a recent Chromium-based browser)",
      "NO_WEBCODECS",
    );
  }

  const maxDurationSec = opts.maxDurationSec ?? 90;
  const fps = opts.targetFps ?? 30;
  const maxLongEdge = opts.maxLongEdge ?? 1920;
  const bitrate = opts.videoBitrate ?? 5_000_000;

  const video = opts.sourceVideo;
  const liveVp = opts.sourceViewport;

  /**
   * @description React の `pauseVideoPreview` より先にエンコードが走ると再生が残るため、
   *   ここで即 `pause`（終了時にだけ元の再生状態へ戻す）。
   */
  const resumePlaybackAfterExport = !video.paused && !video.ended;
  video.pause();

  try {
    if (!Number.isFinite(video.duration) || video.duration <= 0) {
      throw new WebFilmLabExportError(
        "Video metadata is not ready (duration unknown)",
        "NO_METADATA",
      );
    }

    const exportDuration = Math.min(video.duration, maxDurationSec);
    if (exportDuration <= 0) {
      throw new WebFilmLabExportError("Video duration is zero", "NO_METADATA");
    }

    const frameCount = Math.max(1, Math.floor(exportDuration * fps));
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (vw <= 0 || vh <= 0) {
      throw new WebFilmLabExportError(
        "Video width/height invalid (wait for loadeddata)",
        "NO_METADATA",
      );
    }

    const { width: outW, height: outH } = computeExportSize(vw, vh, maxLongEdge);

    opts.onProgress?.({
      phase: "prepare",
      frameIndex: 0,
      frameCount,
    });

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(outW, outH, false);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const viewport = await Viewport.create(canvas, {
      prefer: "webgl",
      width: outW,
      height: outH,
    });
    scene.add(viewport.mesh);

    viewport.setComparePair(false, {}, {});
    viewport.setSplitPosition(-1);
    viewport.setParams(liveVp.getParams());
    /** プレビューと同じ（デフォルト false）。true にすると canvas→VideoFrame で上下逆になる */
    viewport.setExportFlipY(false);

    const l1 = liveVp.getLUT1Snapshot();
    if (l1) {
      viewport.setLUT1(l1.data, l1.size);
      viewport.setLUT1Intensity(l1.intensity);
    } else {
      viewport.clearLUT1();
    }

    const l2 = liveVp.getLUT2Snapshot();
    if (l2) {
      viewport.setLUT2(l2.data, l2.size);
      viewport.setLUT2Intensity(l2.intensity);
    } else {
      viewport.clearLUT2();
    }

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    viewport.setTexture(videoTexture);
    viewport.setImageResolution(vw, vh);
    viewport.setResolution(outW, outH);

    // Reset motion blur accumulation so export starts from a clean state
    viewport.resetMotionBlurHistory();

    /** @description `resolveExportEncoder` 失敗時も GPU 資源を必ず解放する */
    let encoder: VideoEncoder | null = null;
    /**
     * @description `error` コールバックから代入する。`let` + null チェックだと TS がループ以降を常に null と狭め、
     *   `encode` 中の非同期エラーを参照できないため box に入れる。
     */
    const encoderErrorBox: { current: Error | null } = { current: null };
    /** @description コールバックで `current` が更新されるため、プロパティ直読みだと TS が誤狭めしないよう関数経由で読む */
    const peekEncoderError = (): Error | null => encoderErrorBox.current;

    try {
      const exportPick = await resolveExportEncoder({
        width: outW,
        height: outH,
        fps,
        bitrate,
      });

      const muxer: Mp4Muxer<Mp4ArrayBufferTarget> | WebmMuxer<WebmArrayBufferTarget> =
        exportPick.format === "mp4"
          ? new Mp4Muxer({
              target: new Mp4ArrayBufferTarget(),
              fastStart: "in-memory",
              firstTimestampBehavior: "offset",
              video: {
                codec: "avc",
                width: outW,
                height: outH,
                frameRate: fps,
              },
            })
          : new WebmMuxer({
              target: new WebmArrayBufferTarget(),
              firstTimestampBehavior: "offset",
              video: {
                codec: exportPick.webmMatroskaCodec,
                width: outW,
                height: outH,
                frameRate: fps,
              },
            });

      encoder = new VideoEncoder({
        output: (chunk, meta) => {
          muxer.addVideoChunk(chunk, meta);
        },
        error: (err) => {
          encoderErrorBox.current =
            err instanceof Error ? err : new Error(String(err));
          console.error("FilmLabWebVideoExport: VideoEncoder error", err);
        },
      });

      const frameDurationUs = Math.round(1_000_000 / fps);
      const keyframeEvery = Math.max(1, fps * 2);

      encoder.configure(exportPick.config);
      if (encoder.state !== "configured") {
        throw new WebFilmLabExportError(
          `VideoEncoder が構成できませんでした (state=${encoder.state} codec=${exportPick.config.codec})`,
          "ENCODER_CONFIG",
        );
      }
      await new Promise<void>((r) => queueMicrotask(r));
      const errAfterConfigure = peekEncoderError();
      if (errAfterConfigure) {
        throw new WebFilmLabExportError(
          errAfterConfigure.message,
          "ENCODER_CONFIG",
        );
      }

      for (let i = 0; i < frameCount; i++) {
        if (i % 8 === 0) {
          await new Promise<void>((r) => window.setTimeout(r, 0));
        }
        const errBeforeFrame = peekEncoderError();
        if (errBeforeFrame) {
          throw new WebFilmLabExportError(
            errBeforeFrame.message,
            "ENCODE",
          );
        }

        const t = Math.min((i + 0.5) / fps, exportDuration - 1e-6);
        await seekVideo(video, t, 20_000);
        videoTexture.needsUpdate = true;
        await new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        );

        viewport.setTime(i / fps);
        viewport.render(renderer, scene, camera);

        const timestampUs = i * frameDurationUs;
        let vf: VideoFrame;
        try {
          vf = new VideoFrame(canvas, {
            timestamp: timestampUs,
            duration: frameDurationUs,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          throw new WebFilmLabExportError(
            `VideoFrame construction failed at frame ${i}: ${msg}`,
            "ENCODE",
          );
        }

        try {
          encoder.encode(vf, { keyFrame: i % keyframeEvery === 0 });
        } finally {
          vf.close();
        }

        opts.onProgress?.({
          phase: "encode",
          frameIndex: i + 1,
          frameCount,
        });
      }

      opts.onProgress?.({
        phase: "finalize",
        frameIndex: frameCount,
        frameCount,
      });

      await encoder.flush();
      muxer.finalize();
      const buffer = muxer.target.buffer;
      const mime =
        exportPick.format === "mp4" ? "video/mp4" : "video/webm";
      const ext = exportPick.format === "mp4" ? "mp4" : "webm";
      const blob = new Blob([buffer], { type: mime });
      const base =
        opts.fileBaseName?.replace(/\.(mp4|webm)$/i, "") ??
        `filmtone-web-export-${Date.now()}`;
      triggerDownload(blob, `${base}.${ext}`);
    } catch (err) {
      if (err instanceof WebFilmLabExportError) {
        throw err;
      }
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("VideoEncoder") || msg.includes("configure")) {
        throw new WebFilmLabExportError(msg, "ENCODER_CONFIG");
      }
      throw new WebFilmLabExportError(msg, "UNKNOWN");
    } finally {
      if (encoder) {
        try {
          encoder.close();
        } catch {
          /* ignore */
        }
      }
      videoTexture.dispose();
      viewport.dispose();
      renderer.dispose();
    }
  } finally {
    if (resumePlaybackAfterExport) {
      void video.play().catch(() => {
        /* ユーザーがタブ非表示などで自動再生が弾かれた場合 */
      });
    }
  }
}
