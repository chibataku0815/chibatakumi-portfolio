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
import Image from "next/image";
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

  const { branding } = portfolioData;
  const descriptorLockup = branding.descriptorLockup;

  return (
    <section
      id="home-hero"
      data-readability="immersive"
      className="relative isolate flex min-h-[100svh] w-full flex-col items-start justify-end overflow-hidden px-6 pb-44 pt-32 sm:px-10 sm:pb-36 lg:px-16 lg:pb-40"
    >
      <div className="w-full max-w-[min(86rem,calc(100vw-3rem))] sm:max-w-[min(86rem,calc(100vw-5rem))] lg:max-w-[min(86rem,calc(100vw-8rem))]">
        <h1 className="leading-none">
          <span className="sr-only">{descriptorLockup.ariaLabel}</span>
          <Image
            src={descriptorLockup.lightSrc}
            alt=""
            aria-hidden="true"
            width={descriptorLockup.width}
            height={Math.round(descriptorLockup.height)}
            priority
            unoptimized
            sizes="(max-width: 640px) calc(100vw - 3rem), (max-width: 1024px) calc(100vw - 5rem), min(86rem, calc(100vw - 8rem))"
            className="block h-auto w-full max-w-[86rem]"
            style={{
              aspectRatio: `${descriptorLockup.width} / ${descriptorLockup.height}`,
              filter:
                "drop-shadow(0 2px 28px rgba(0,0,0,0.42)) drop-shadow(0 0 72px rgba(0,0,0,0.28))",
            }}
          />
        </h1>
      </div>
    </section>
  );
}

export default AmbientHomeHero;
