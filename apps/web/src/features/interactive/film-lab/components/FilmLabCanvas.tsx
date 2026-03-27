"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import * as THREE from "three";
import { isWebGL2Supported, getOptimalPixelRatio } from "@/shared/gl";
import { Viewport } from "../core/Viewport";
import { MediaLoader } from "../core/MediaLoader";
import { parseCube } from "../core/cube-parser";
import { filmlabVertexShader } from "../shader/filmlab.vert";
import { filmlabFragmentShader } from "../shader/filmlab.frag";

export const PRESETS = {
  reset: {
    exposure: 0,
    contrast: 1,
    saturation: 1,
    temperature: 0,
    rgbShift: 0,
    grainIntensity: 0,
    vignette: 0,
  },
  cinematic: {
    exposure: 0.1,
    contrast: 1.3,
    saturation: 0.85,
    temperature: -0.15,
    rgbShift: 0.002,
    grainIntensity: 0.08,
    vignette: 0.4,
  },
  portra: {
    exposure: 0.2,
    contrast: 1.1,
    saturation: 0.9,
    temperature: 0.1,
    rgbShift: 0,
    grainIntensity: 0.12,
    vignette: 0.2,
  },
  bw: {
    exposure: 0.1,
    contrast: 1.4,
    saturation: 0,
    temperature: 0,
    rgbShift: 0,
    grainIntensity: 0.15,
    vignette: 0.5,
  },
} as const;

export type PresetName = keyof typeof PRESETS;

interface FilmLabCanvasProps {
  preset: PresetName;
  className?: string;
}

export function FilmLabCanvas({ preset, className }: FilmLabCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<Viewport | null>(null);
  const mediaLoaderRef = useRef<MediaLoader | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [supported, setSupported] = useState(true);

  // Apply preset when it changes
  useEffect(() => {
    viewportRef.current?.setParams(PRESETS[preset]);
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
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(getOptimalPixelRatio(1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    // === Viewport ===
    const viewport = new Viewport({
      vertexShader: filmlabVertexShader,
      fragmentShader: filmlabFragmentShader,
      width,
      height,
    });
    scene.add(viewport.mesh);
    viewportRef.current = viewport;

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
      renderer.render(scene, camera);
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
    };
  }, []);

  // === Drag & Drop ===
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file || !viewportRef.current || !mediaLoaderRef.current) return;

    if (file.name.endsWith(".cube")) {
      const text = await file.text();
      const lut = parseCube(text);
      viewportRef.current.setLUT(lut.data, lut.size);
      return;
    }

    const result = await mediaLoaderRef.current.loadFile(file);
    viewportRef.current.setTexture(result.texture);
    viewportRef.current.setImageResolution(result.width, result.height);
  }, []);

  // === Split drag ===
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.buttons !== 1) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    viewportRef.current?.setSplitPosition(Math.max(0, Math.min(1, x)));
  }, []);

  if (!supported) {
    return (
      <div
        className={`relative flex aspect-[16/9] w-full items-center justify-center rounded-lg bg-[#0a0a0a] ${className ?? ""}`}
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
      className={`relative aspect-[16/9] w-full cursor-col-resize overflow-hidden rounded-lg bg-[#0a0a0a] ${className ?? ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onPointerMove={handlePointerMove}
    >
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
