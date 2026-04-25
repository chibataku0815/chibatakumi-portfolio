"use client";

// AmbientHomeHero — Renewal 2026 Wave 2 D2.8 (wholesale transplant).
//
// The persistent motion-dot mount lives in MotionStageProvider (root layout).
// This component just reconfigures the live mount with a curated 4-scene
// ambient cycle and renders minimal text overlay above the canvas.
//
// Per `feedback_no_fallback_bug_hotbed.md`, when WebGPU is unavailable we
// let the silent canvas / MotionUnsupportedBanner sibling speak — we do
// NOT render a fallback motion here.

import { useMotionDotMount } from "@/features/motion/useMotionDotMount";
import { portfolioData } from "@/shared/data/portfolio";
import type { DotSceneName } from "@chibatakumi/motion-dot";

// Curated low-intensity ambient subset (NOT the full 16-scene showcase
// which lives at /experiments/dot). Names are Title Case to match the
// transplanted entries array (motion-dot main.ts:260-279).
const HOME_AMBIENT_CYCLE = [
  "Orbit",
  "River Flow",
  "Firefly Sync",
  "Molecular",
] as const satisfies ReadonlyArray<DotSceneName>;

export function AmbientHomeHero(): React.ReactElement {
  useMotionDotMount({
    initialScene: "Orbit",
    sceneCycle: { scenes: HOME_AMBIENT_CYCLE, intervalSec: 5.5 },
    hudVisible: false,
    inputEnabled: false,
    audioEnabled: false,
  });

  const { site } = portfolioData;

  return (
    <section className="relative isolate flex min-h-[100svh] w-full flex-col items-start justify-end px-6 pb-16 sm:px-10 sm:pb-20 lg:px-16 lg:pb-24">
      <div className="max-w-3xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--text-base-60)] sm:text-[11px]">
          {site.author.role}
        </p>
        <h1 className="mt-4 text-balance text-[clamp(2.4rem,6vw,4.6rem)] font-medium leading-[1.04] text-[var(--text-base)]">
          {site.author.name}
        </h1>
      </div>
    </section>
  );
}

export default AmbientHomeHero;
