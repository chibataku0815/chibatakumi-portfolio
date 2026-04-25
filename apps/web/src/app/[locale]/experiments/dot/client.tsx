"use client";

import { useMotionDotMount } from "@/features/motion/useMotionDotMount";

// Wave 2 D2.8 (wholesale transplant) — full original motion-dot experience.
// HUD overlay + keyboard cluster + all 16 scenes (15 lib + Fluid GPU compute)
// + KineticHandoff transitions. Audio defaults off; user toggles via the HUD
// audio settings panel (key A or the on-canvas pill).
export default function ExperimentsDotClient() {
  useMotionDotMount({
    initialScene: "Orbit",
    sceneCycle: false,
    hudVisible: true,
    inputEnabled: true,
    audioEnabled: false,
  });

  return (
    <main className="relative min-h-screen w-full">
      <header className="fixed top-6 left-6 z-10 text-white/80 text-xs tracking-widest uppercase mix-blend-difference">
        experiments / dot
      </header>
    </main>
  );
}
