"use client";

import { createDotParticipant } from "@chibatakumi/motion-dot";
import { useExperimentParticipant } from "@/features/motion/useExperimentParticipant";

// Phase A+2 polish: showcase route runs in multi-scene gallery mode
// (composite-25d, 2×2 grid) — visually richer, the showcase peak.
// Single-scene cycle remains the home / works default.
//
// Migration path back to cycle mode (if gallery wiring needs to be
// disabled in an emergency): swap `enableGalleryMode: true` →
// `enableSceneCycle: true` and drop `panelCount`.
//
// HUD overlay is deferred (see motion-dot index.ts JSDoc) — keep
// `enableInput: true` so ArrowLeft/Right/Space/n/p/r drive panel base
// shifts (gallery) or scene handoffs (cycle).
export default function ExperimentsDotClient() {
  useExperimentParticipant({
    factory: () =>
      createDotParticipant({
        enableGalleryMode: true,
        panelCount: 4,
        enableInput: true,
      }),
    blendMs: 500,
  });

  return (
    <main className="relative min-h-screen w-full">
      <header className="fixed top-6 left-6 z-10 text-white/80 text-xs tracking-widest uppercase mix-blend-difference">
        experiments / dot
      </header>
    </main>
  );
}
