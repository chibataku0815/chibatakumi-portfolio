"use client";

import { Canvas } from "@react-three/fiber";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useFont } from "@/features/hero/lib/use-font";
import {
  type BackgroundType,
  CANDIDATES,
  PALETTES,
  type PaletteKey,
} from "./candidates";
import Scene, { type DisplayMode } from "./Scene";

export default function WordmarkExperimentClient() {
  const searchParams = useSearchParams();

  // ─── ?font= ──────────────────────────────────────────────────────────────
  const initialIdx = useMemo(() => {
    const q = searchParams?.get("font")?.toLowerCase();
    if (!q) return 0;
    const idx = CANDIDATES.findIndex((c) => c.label.toLowerCase() === q);
    return idx >= 0 ? idx : 0;
  }, [searchParams]);

  const [activeIdx, setActiveIdx] = useState(initialIdx);
  useEffect(() => {
    setActiveIdx(initialIdx);
  }, [initialIdx]);

  const active = CANDIDATES[activeIdx]!;

  // ─── ?mode= ──────────────────────────────────────────────────────────────
  const initialMode = useMemo<DisplayMode>(() => {
    const q = searchParams?.get("mode");
    if (q === "solid" || q === "wireframe" || q === "both") return q;
    return "solid";
  }, [searchParams]);

  const [displayMode, setDisplayMode] = useState<DisplayMode>(initialMode);
  useEffect(() => {
    setDisplayMode(initialMode);
  }, [initialMode]);

  // ─── ?frame= ─────────────────────────────────────────────────────────────
  const initialFrame = useMemo<boolean>(() => {
    const q = searchParams?.get("frame");
    return q === "on";
  }, [searchParams]);

  const [frameVisible, setFrameVisible] = useState<boolean>(initialFrame);
  useEffect(() => {
    setFrameVisible(initialFrame);
  }, [initialFrame]);

  // ─── ?palette= ───────────────────────────────────────────────────────────
  const initialPalette = useMemo<PaletteKey>(() => {
    const q = searchParams?.get("palette");
    if (q === "mono" || q === "warm" || q === "raw") return q;
    return active.palette ?? "raw";
  }, [searchParams, active.palette]);

  const [paletteKey, setPaletteKey] = useState<PaletteKey>(initialPalette);
  useEffect(() => {
    setPaletteKey(initialPalette);
  }, [initialPalette]);

  // ─── ?bg= ────────────────────────────────────────────────────────────────
  const initialBackground = useMemo<BackgroundType>(() => {
    const q = searchParams?.get("bg");
    if (
      q === "flat" ||
      q === "vignette" ||
      q === "grain" ||
      q === "editorial"
    ) {
      return q;
    }
    return active.background ?? "flat";
  }, [searchParams, active.background]);

  const [backgroundType, setBackgroundType] =
    useState<BackgroundType>(initialBackground);
  useEffect(() => {
    setBackgroundType(initialBackground);
  }, [initialBackground]);

  const { font, status, error } = useFont(active.url);

  return (
    <div
      aria-label="Wordmark geometry test"
      className="fixed inset-0 z-50 bg-[#0e0e0e]"
    >
      {status === "loaded" && font && (
        <Canvas
          frameloop="demand"
          gl={{ antialias: true, alpha: false }}
          className="absolute inset-0"
        >
          <Scene
            font={font}
            fontSize={active.fontSize}
            tracking={active.tracking}
            displayMode={displayMode}
            frameVisible={frameVisible}
            palette={PALETTES[paletteKey]}
            kerningOverrides={active.kerningOverrides}
            backgroundType={backgroundType}
          />
        </Canvas>
      )}

      {status === "loading" && (
        <div className="absolute inset-0 grid place-items-center font-mono text-[11px] uppercase tracking-[0.1em] text-[#555]">
          Loading {active.label}…
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 grid place-items-center px-12">
          <div className="max-w-[640px] border border-[#3a1f1f] bg-[#1a0e0e] p-6 font-mono text-[11px] leading-relaxed text-[#c89090]">
            <div className="mb-3 text-[10px] uppercase tracking-[0.16em] text-[#b85050]">
              {active.label} not found
            </div>
            <div className="mb-3 text-[#9a8080]">
              {error?.message ?? "unknown error"}
            </div>
            <div className="text-[#7a6868]">{active.acquireHint}</div>
          </div>
        </div>
      )}

      {/* Top-left caption — active font + brand reference */}
      <div className="pointer-events-none absolute left-6 top-6 z-10 font-mono text-[10px] uppercase leading-[1.6] tracking-[0.08em] text-[#4a4a4a]">
        <div className="text-[#888]">Font candidate</div>
        <div className="text-[#aaa]">{active.fullName}</div>
        <div className="mt-1 text-[#5a5a5a]">{active.brandReference}</div>
        <div className="mt-1 text-[#3a3a3a]">
          tracking {active.tracking > 0 ? "+" : ""}
          {active.tracking.toFixed(2)}em · size {active.fontSize}
        </div>
        <div className="mt-1 text-[#3a3a3a]">
          mode {displayMode} · frame {frameVisible ? "on" : "off"} · palette {paletteKey} · bg {backgroundType}
        </div>
      </div>

      {/* Bottom-left controls — stacked rows, bottom-most first */}
      <div className="absolute bottom-6 left-6 z-10 flex flex-col-reverse gap-3">
        {/* Row 1 (bottom-most): font toggle — UNCHANGED */}
        <div className="flex flex-wrap gap-1.5">
          {CANDIDATES.map((c, i) => (
            <button
              key={c.url}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`border px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors ${
                i === activeIdx
                  ? "border-[#d8d8d8] text-white"
                  : "border-[#2a2a2a] text-[#6a6a6a] hover:border-[#555] hover:text-[#c8c8c8]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Row 2: palette toggle */}
        <div className="flex flex-wrap gap-1.5">
          {(["mono", "warm", "raw"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPaletteKey(key)}
              className={`border px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors ${
                key === paletteKey
                  ? "border-[#d8d8d8] text-white"
                  : "border-[#2a2a2a] text-[#6a6a6a] hover:border-[#555] hover:text-[#c8c8c8]"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Row 3: display mode toggle */}
        <div className="flex flex-wrap gap-1.5">
          {(["solid", "wireframe", "both"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setDisplayMode(mode)}
              className={`border px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors ${
                mode === displayMode
                  ? "border-[#d8d8d8] text-white"
                  : "border-[#2a2a2a] text-[#6a6a6a] hover:border-[#555] hover:text-[#c8c8c8]"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Row 4: frame toggle */}
        <div className="flex flex-wrap gap-1.5">
          {([false, true] as const).map((val) => (
            <button
              key={val ? "on" : "off"}
              type="button"
              onClick={() => setFrameVisible(val)}
              className={`border px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors ${
                val === frameVisible
                  ? "border-[#d8d8d8] text-white"
                  : "border-[#2a2a2a] text-[#6a6a6a] hover:border-[#555] hover:text-[#c8c8c8]"
              }`}
            >
              frame {val ? "on" : "off"}
            </button>
          ))}
        </div>

        {/* Row 5 (top-most): background toggle (Tier 2 Lever 8) */}
        <div className="flex flex-wrap gap-1.5">
          {(["flat", "vignette", "grain", "editorial"] as const).map((bg) => (
            <button
              key={bg}
              type="button"
              onClick={() => setBackgroundType(bg)}
              className={`border px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors ${
                bg === backgroundType
                  ? "border-[#d8d8d8] text-white"
                  : "border-[#2a2a2a] text-[#6a6a6a] hover:border-[#555] hover:text-[#c8c8c8]"
              }`}
            >
              bg {bg}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
