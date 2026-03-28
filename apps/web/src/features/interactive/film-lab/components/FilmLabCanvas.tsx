"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import * as THREE from "three";
import { isWebGL2Supported, getOptimalPixelRatio } from "@/shared/gl";
import { Viewport } from "../core/Viewport";
import { MediaLoader } from "../core/MediaLoader";
import { parseCube } from "../core/cube-parser";
import { filmlabVertexShader } from "../shader/filmlab.vert";
import { filmlabFragmentShader } from "../shader/filmlab.frag";
import { PRESETS, halationHueToHex, type PresetName } from "../preset-data";

interface FilmLabCanvasProps {
  preset: PresetName;
  className?: string;
  fullScreen?: boolean;
  onViewportReady?: (viewport: Viewport | null) => void;
}

export function FilmLabCanvas({ preset, className, fullScreen, onViewportReady }: FilmLabCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const mediaLoaderRef = useRef<MediaLoader | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSplitDragging, setIsSplitDragging] = useState(false);
  const [supported, setSupported] = useState(true);

  // Apply preset when it changes
  useEffect(() => {
    const p = PRESETS[preset];
    viewportRef.current?.setParams({
      ...p,
      halationColor: halationHueToHex(p.halationHue),
    });
  }, [preset]);

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
        viewport.setParams(PRESETS.cinematic);
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

  // === Drag & Drop ===
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file || !viewportRef.current || !mediaLoaderRef.current) return;

    try {
      if (file.name.endsWith(".cube")) {
        const text = await file.text();
        const lut = parseCube(text);
        viewportRef.current.setLUT(lut.data, lut.size);
        return;
      }

      const result = await mediaLoaderRef.current.loadFile(file);
      viewportRef.current.setTexture(result.texture);
      viewportRef.current.setImageResolution(result.width, result.height);
    } catch (err) {
      console.error("Drop file load failed:", err);
    }
  }, []);

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
    input.accept = "image/*,video/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !viewportRef.current || !mediaLoaderRef.current) return;

      try {
        const result = await mediaLoaderRef.current.loadFile(file);
        viewportRef.current.setTexture(result.texture);
        viewportRef.current.setImageResolution(result.width, result.height);
      } catch (err) {
        console.error("File load failed:", err);
      }
    };
    input.click();
  }, []);

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
    >
      {/* Toolbar */}
      <div className="absolute left-3 top-3 z-10 flex gap-1.5">
        <button
          onClick={handleFileClick}
          className="rounded bg-black/50 px-3 py-2 text-xs min-h-[44px] flex items-center sm:px-2.5 sm:py-1 sm:text-[11px] sm:min-h-0 text-white/50 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white/80"
        >
          Open
        </button>
        <button
          onClick={handleDownload}
          className="rounded bg-black/50 px-3 py-2 text-xs min-h-[44px] flex items-center sm:px-2.5 sm:py-1 sm:text-[11px] sm:min-h-0 text-white/50 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white/80"
        >
          Save PNG
        </button>
      </div>

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-white/30 bg-black/60">
          <span className="text-sm text-white/70">
            Drop image, video, or .cube LUT
          </span>
        </div>
      )}
    </div>
  );
}
