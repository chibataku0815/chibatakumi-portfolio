"use client";

// AmbientHomeHero — Renewal 2026 Wave 2 D2.8 (wholesale transplant).
//
// The persistent motion-dot mount lives in MotionStageProvider (root layout)
// and runs with the original boot defaults — full HUD, keyboard cluster,
// film toggle button, audio settings panel, file picker, etc. all live.
//
// On home we only request the auto-cycle through 4 curated scenes (Orbit /
// River Flow / Firefly Sync / Molecular). Everything else stays at the
// original's behavior — user can press arrow keys to override the cycle,
// hit `F` to toggle film, `A` for the audio panel, `M` to load a file, etc.

import { useMotionDotMount } from "@/features/motion/useMotionDotMount";
import { portfolioData } from "@/shared/data/portfolio";
import type { DotSceneName } from "@chibatakumi/motion-dot";

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
