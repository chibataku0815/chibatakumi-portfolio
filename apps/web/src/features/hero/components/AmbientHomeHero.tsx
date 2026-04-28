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

  const { site, branding } = portfolioData;
  const wordmark = branding.wordmarkItalic;

  return (
    <section
      id="home-hero"
      data-readability="immersive"
      className="relative isolate flex min-h-[var(--vvh,100dvh)] w-full flex-col items-start justify-end px-6 pb-[calc(var(--mobile-bottom-reserve)+24px)] sm:px-10 sm:pb-20 lg:px-16 lg:pb-24"
    >
      <div className="max-w-[min(56rem,calc(100vw-3rem))]">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-base-60)] sm:text-[12px]">
          {site.author.role}
        </p>
        <h1 className="mt-5 leading-none sm:mt-6">
          <svg
            viewBox={wordmark.viewBox}
            fill="none"
            aria-label={wordmark.ariaLabel}
            role="img"
            className="block h-auto w-full max-w-[min(100%,92vw)]"
          >
            <g fill="var(--text-base)">
              {wordmark.primaryPaths.map((d, i) => (
                <path key={`hp-${i}`} d={d} />
              ))}
            </g>
            <g fill="var(--text-base-60)">
              {wordmark.secondaryPaths.map((d, i) => (
                <path key={`hs-${i}`} d={d} />
              ))}
            </g>
          </svg>
        </h1>
      </div>
    </section>
  );
}

export default AmbientHomeHero;
