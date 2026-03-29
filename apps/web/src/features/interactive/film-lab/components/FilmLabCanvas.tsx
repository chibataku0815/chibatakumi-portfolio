"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import * as THREE from "three";
import { isWebGL2Supported, getOptimalPixelRatio } from "@/shared/gl";
import { Viewport } from "../core/Viewport";
import { MediaLoader, MediaLoadError } from "../core/MediaLoader";
import { parseCube } from "../core/cube-parser";
import { filmlabVertexShader } from "../shader/filmlab.vert";
import { filmlabFragmentShader } from "../shader/filmlab.frag";
import { PRESETS, halationHueToHex, type PresetName } from "../preset-data";
import type { Params } from "../types";

interface FilmLabCanvasProps {
  preset: PresetName;
  className?: string;
  fullScreen?: boolean;
  onViewportReady?: (viewport: Viewport | null) => void;
  /**
   * URL 共有で復元した grade。指定時はプリセット prop による上書きを止め、
   * デフォルト画像読み込み後の setParams もこの値に合わせる（ControlPanel と競合しないようにする）。
   */
  initialGradeParams?: Params | null;
  /**
   * 比較モード中のみ渡す。プレビュー上に「左/右」ラベル・編集中チップ・境界ドラッグのヒントを重ねる。
   * pointer-events-none でスプリット操作と干渉しない。
   */
  compareHud?: { activeSlot: "A" | "B" } | null;
  /** ドロップ／ファイル選択で .cube が適用できたとき（寄付ナッジ用） */
  onCubeLutLoaded?: () => void;
}

/** ファイルピッカー用: HEIC を選びにくくしつつ、一般的な形式はそのまま選べる */
const FILM_LAB_FILE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif,video/mp4,video/webm,.mp4,.webm,.cube,application/octet-stream";

/** キャンバス左上ツールバー: 44px 級タップ／sm でコンパクト／pointer: coarse ではタブレットでも高さ維持 */
const FILM_LAB_TOOLBAR_BUTTON_CLASS =
  "rounded bg-black/50 px-3 py-2 text-xs flex items-center min-h-[44px] text-white/50 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white/80 sm:min-h-0 sm:px-2.5 sm:py-1 sm:text-[11px] [@media(pointer:coarse)]:min-h-[44px] [@media(pointer:coarse)]:py-2";

type MediaOverlayState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string };

export function FilmLabCanvas({
  preset,
  className,
  fullScreen,
  onViewportReady,
  initialGradeParams = null,
  onCubeLutLoaded,
  compareHud = null,
}: FilmLabCanvasProps) {
  const tFilmLab = useTranslations("film-lab");
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const mediaLoaderRef = useRef<MediaLoader | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSplitDragging, setIsSplitDragging] = useState(false);
  const [supported, setSupported] = useState(true);
  const [mediaOverlay, setMediaOverlay] = useState<MediaOverlayState>({ kind: "idle" });

  // Apply preset when it changes（URL 共有で initialGradeParams があるときは ControlPanel 側を正とする）
  useEffect(() => {
    if (initialGradeParams) return;
    const p = PRESETS[preset];
    viewportRef.current?.setParams({
      ...p,
      halationColor: halationHueToHex(p.halationHue),
    });
  }, [preset, initialGradeParams]);

  // Three.js setup (FluidGradientBackground pattern)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!isWebGL2Supported()) {
      setSupported(false);
      return;
    }

    // === Three.js Setup ===
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    let width = container.clientWidth;
    let height = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(getOptimalPixelRatio(1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;
    cameraRef.current = camera;

    // === Viewport ===
    const viewport = new Viewport({
      vertexShader: filmlabVertexShader,
      fragmentShader: filmlabFragmentShader,
      width,
      height,
    });
    scene.add(viewport.mesh);
    viewportRef.current = viewport;
    onViewportReady?.(viewport);

    // === Default image ===
    const mediaLoader = new MediaLoader();
    mediaLoaderRef.current = mediaLoader;

    mediaLoader
      .loadURL("/images/film-lab/default.jpg")
      .then((result) => {
        viewport.setTexture(result.texture);
        viewport.setImageResolution(result.width, result.height);
        const source = initialGradeParams ?? PRESETS.cinematic;
        viewport.setParams({
          ...source,
          halationColor: halationHueToHex(source.halationHue),
        });
      })
      .catch(() => {
        // No default image — waiting for drop
      });

    // === Resize ===
    const handleResize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      renderer.setSize(width, height);
      viewport.setResolution(width, height);
    };
    window.addEventListener("resize", handleResize);

    // === Render Loop ===
    const clock = new THREE.Clock();
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      viewport.setTime(clock.getElapsedTime());
      viewport.render(renderer, scene, camera);
    };
    animate();

    // === Cleanup ===
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      viewport.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      viewportRef.current = null;
      mediaLoaderRef.current = null;
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      onViewportReady?.(null);
    };
  }, []);

  const getMaxTextureSize = useCallback((): number => {
    return rendererRef.current?.capabilities.maxTextureSize ?? 8192;
  }, []);

  /**
   * Open / ドロップ共通の読み込み。ローディング・HEIC・デコード失敗・動画失敗を画面に出す。
   */
  const loadUserMediaFile = useCallback(
    async (file: File) => {
      if (!viewportRef.current || !mediaLoaderRef.current) return;

      setMediaOverlay({ kind: "loading" });

      try {
        if (file.name.toLowerCase().endsWith(".cube")) {
          const text = await file.text();
          const lut = parseCube(text);
          viewportRef.current.setLUT(lut.data, lut.size);
          setMediaOverlay({ kind: "idle" });
          onCubeLutLoaded?.();
          return;
        }

        const maxTex = getMaxTextureSize();
        const result = await mediaLoaderRef.current.loadFile(file, {
          maxTextureSize: maxTex,
        });
        viewportRef.current.setTexture(result.texture);
        viewportRef.current.setImageResolution(result.width, result.height);
        setMediaOverlay({ kind: "idle" });
      } catch (err) {
        const message =
          err instanceof MediaLoadError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Could not load this file.";
        setMediaOverlay({ kind: "error", message });
        console.error("FilmLabCanvas.loadUserMediaFile failed", {
          fileName: file.name,
          fileType: file.type,
          err,
        });
      }
    },
    [getMaxTextureSize, onCubeLutLoaded],
  );

  // === Drag & Drop ===
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      await loadUserMediaFile(file);
    },
    [loadUserMediaFile],
  );

  // === Download ===
  const handleDownload = useCallback(() => {
    const viewport = viewportRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!viewport || !renderer || !scene || !camera) return;

    // Split を画面外に追い出して全面エフェクト適用（After のみ）
    viewport.setSplitPosition(-1.0);
    viewport.render(renderer, scene, camera);

    const url = renderer.domElement.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `film-lab-${Date.now()}.png`;
    a.click();

    // Split を 0.5 に戻す
    viewport.setSplitPosition(0.5);
  }, []);

  // === File picker ===
  const handleFileClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = FILM_LAB_FILE_ACCEPT;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      void loadUserMediaFile(file);
    };
    input.click();
  }, [loadUserMediaFile]);

  // === Split drag ===
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsSplitDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    viewportRef.current?.setSplitPosition(Math.max(0, Math.min(1, x)));
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsSplitDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isSplitDragging) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    viewportRef.current?.setSplitPosition(Math.max(0, Math.min(1, x)));
  }, [isSplitDragging]);

  /** OS やブラウザが pointer capture を奪ったときも Split ドラッグ状態を確実に終える */
  const handleLostPointerCapture = useCallback(() => {
    setIsSplitDragging(false);
  }, []);

  if (!supported) {
    return (
      <div
        className={`relative flex ${fullScreen ? "h-full" : "aspect-[4/3] sm:aspect-[16/9]"} w-full items-center justify-center rounded-lg bg-[#0a0a0a] ${className ?? ""}`}
      >
        <span className="text-sm text-[var(--text-muted)]">
          WebGL2 is required for Film Lab
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-testid="film-lab-viewport"
      className={`relative ${fullScreen ? "h-full" : "aspect-[4/3] sm:aspect-[16/9]"} w-full touch-none cursor-col-resize overflow-hidden rounded-lg bg-[#0a0a0a] ${className ?? ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={handleLostPointerCapture}
    >
      {/* Toolbar: stop pointer propagation so split-drag on the canvas does not steal taps from Open/Save */}
      <div
        className="absolute left-3 top-3 z-10 flex gap-1.5"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onPointerCancel={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          data-testid="film-lab-open"
          onClick={handleFileClick}
          className={FILM_LAB_TOOLBAR_BUTTON_CLASS}
        >
          {tFilmLab("toolbar.open")}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className={FILM_LAB_TOOLBAR_BUTTON_CLASS}
        >
          {tFilmLab("toolbar.savePng")}
        </button>
      </div>

      {/* 比較モード: 編集中がどちらか + 左右ラベル + 境界操作のヒント */}
      {compareHud != null && (
        <>
          <div className="pointer-events-none absolute left-0 right-0 top-16 z-[6] flex justify-center px-3 sm:top-[4.5rem]">
            <span className="rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white/80 ring-1 ring-white/15 backdrop-blur-sm">
              {tFilmLab("compare.dragSplitHint")}
            </span>
          </div>
          <div className="pointer-events-none absolute bottom-10 left-0 right-0 z-[6] flex justify-center px-3 sm:bottom-11">
            <span className="rounded-full bg-[var(--accent-amber1)]/95 px-3 py-1 text-[10px] font-semibold text-black shadow-lg ring-1 ring-black/20 backdrop-blur-sm">
              {compareHud.activeSlot === "A"
                ? tFilmLab("compare.editingLeftChip")
                : tFilmLab("compare.editingRightChip")}
            </span>
          </div>
          <div
            className="pointer-events-none absolute bottom-2 left-0 right-0 z-[5] flex justify-between gap-2 px-3 sm:bottom-3"
            aria-hidden
          >
            <span
              className={`max-w-[42%] truncate text-[9px] font-medium sm:text-[10px] ${
                compareHud.activeSlot === "A" ? "text-[var(--accent-amber1)]" : "text-white/40"
              }`}
            >
              {tFilmLab("compare.canvasLeft")}
            </span>
            <span
              className={`max-w-[42%] truncate text-right text-[9px] font-medium sm:text-[10px] ${
                compareHud.activeSlot === "B" ? "text-[var(--accent-amber1)]" : "text-white/40"
              }`}
            >
              {tFilmLab("compare.canvasRight")}
            </span>
          </div>
        </>
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-white/30 bg-black/60">
          <span className="text-sm text-white/70">
            Drop image, video, or .cube LUT
          </span>
        </div>
      )}

      {/* 読み込み中 / 失敗メッセージ（iPhone Safari で無反応に見えないようにする） */}
      {mediaOverlay.kind === "loading" && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-black/55 backdrop-blur-[2px]">
          <span className="rounded-lg bg-black/70 px-4 py-3 text-sm text-white/90">
            Loading media…
          </span>
        </div>
      )}
      {mediaOverlay.kind === "error" && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-black/70 p-4 backdrop-blur-sm"
          role="alert"
        >
          <div className="max-w-sm rounded-xl border border-white/15 bg-[#141414] p-4 shadow-xl">
            <p className="text-sm leading-relaxed text-white/85">{mediaOverlay.message}</p>
            <button
              type="button"
              onClick={() => setMediaOverlay({ kind: "idle" })}
              className="mt-4 w-full rounded-lg bg-white/10 py-2.5 text-xs font-medium text-white/90 transition-colors hover:bg-white/15"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
