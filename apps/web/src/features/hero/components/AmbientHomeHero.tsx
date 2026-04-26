"use client";

// AmbientHomeHero — Wave 2 D2.8 (wholesale transplant).
//
// The persistent motion-dot mount lives in MotionStageProvider (root layout)
// and runs the original motion-dot-new-webgpu app verbatim — full HUD,
// keyboard cluster (← → / 0 / H / R / F / T / A / D / I / M / W / Space),
// film toggle button, audio settings panel, file picker, etc. all live.
//
// On Home we additionally request a curated 4-scene ambient cycle so the
// hero feels like a moving postcard rather than a static start scene. The
// cycle uses the narrow `useMotionDotSceneCycle` surface — name-by-name
// rotation only, no HUD/keyboard/audio reconfiguration.

import type { DotSceneName } from "@chibatakumi/motion-dot";
import { useMotionDotSceneCycle } from "@/features/motion";
import { portfolioData } from "@/shared/data/portfolio";

const HOME_AMBIENT_CYCLE = [
  "Orbit",
  "River Flow",
  "Firefly Sync",
  "Molecular",
] as const satisfies ReadonlyArray<DotSceneName>;

export function AmbientHomeHero(): React.ReactElement {
  useMotionDotSceneCycle({
    scenes: HOME_AMBIENT_CYCLE,
    intervalSec: 5.5,
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
