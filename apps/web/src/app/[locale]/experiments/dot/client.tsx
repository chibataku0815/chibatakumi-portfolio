"use client";

import { useMotionDotMount } from "@/features/motion/useMotionDotMount";

// Wave 2 D2.8 (wholesale transplant) — focused / experiments surface for the
// transplanted motion-dot-new-webgpu. The MotionStageProvider already boots
// the app with the original defaults (HUD / keyboard / film toggle / audio
// settings panel / file picker all active). This route only ensures the
// auto-cycle is OFF so the user can navigate the 16-scene library manually
// (← → / Space / 0 / R / F / A / D / I / M etc., per input/keyboard.ts).
export default function ExperimentsDotClient() {
  useMotionDotMount({
    sceneCycle: false,
  });

  return (
    <main className="relative min-h-screen w-full">
      <header className="fixed top-6 left-6 z-10 text-white/80 text-xs tracking-widest uppercase mix-blend-difference">
        experiments / dot
      </header>
    </main>
  );
}
