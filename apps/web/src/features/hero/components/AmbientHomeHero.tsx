"use client";

// AmbientHomeHero — Renewal 2026 Stream 4-B home surface.
//
// Replaces the legacy GSAP-driven HomeHero. The persistent MotionStage canvas
// (mounted in [locale]/layout.tsx via MotionStageProvider) carries the visual
// — this component only registers the dot participant on mount and renders
// minimal text overlay (name + role) above the canvas.
//
// No BGM, no scroll-triggered timelines, no mask scaffolding. Per
// `feedback_no_fallback_bug_hotbed.md`, when WebGPU is unavailable we let the
// MotionUnsupportedBanner sibling (rendered from the layout tree on
// experiments routes; for home we rely on the silent-canvas state) speak —
// we do NOT render a fallback motion here.

import { useExperimentParticipant } from "@/features/motion/useExperimentParticipant";
import { createDotParticipant } from "@chibatakumi/motion-dot";
import { portfolioData } from "@/shared/data/portfolio";

// Carry over Phase A+1 polish (commit e1e52b7a) to the site-wide ambient
// background. Instead of single-scene "river", the home surface auto-cycles
// through a curated low-intensity ambient subset using the same KineticHandoff
// machinery as /experiments/dot, but with a tighter scene list to keep the
// background calm (NOT the full 16-scene showcase, which lives at
// /experiments/dot).
//
// Cycle order is plan §4.4 anchored — Scene 1 ("orbit", Hero idle) leads,
// then "river" (scroll ambient loop), then "firefly" / "molecular" for soft
// light + slow molecular drift. Each scene plays ~5.5s, blends ~1.75s + ~1.25s
// settle (KineticHandoff canon). Total cycle ≈ 33s, intentionally slow so the
// hero never feels like a slideshow.
const HOME_AMBIENT_CYCLE = ["orbit", "river", "firefly", "molecular"] as const;

const dotFactory = () =>
  createDotParticipant({
    initialScene: "orbit",
    enableSceneCycle: true,
    cycleScenes: HOME_AMBIENT_CYCLE,
  });

export function AmbientHomeHero(): React.ReactElement {
  // blendMs=500 is canon (STAGE_DEFAULT_BLEND_MS). Hook is intentionally
  // pure — registration + setActive happen exactly once when the stage
  // becomes ready.
  useExperimentParticipant({ factory: dotFactory, blendMs: 500 });

  const { site } = portfolioData;

  return (
    <section className="relative isolate flex min-h-[100svh] w-full flex-col items-start justify-end px-6 pb-16 sm:px-10 sm:pb-20 lg:px-16 lg:pb-24">
      {/* The MotionStage canvas sits at z=-10 (fixed inset-0), so this
          overlay just needs to live above it in normal flow. */}
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
