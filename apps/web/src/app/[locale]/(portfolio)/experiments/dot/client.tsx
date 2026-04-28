"use client";

// Wave 2 D2.8 (wholesale transplant) — focused / experiments surface.
// The motion-dot mount lives in the root MotionStageProvider; this route
// just adds a minimal page header above the canvas. All interaction goes
// through motion-dot's own HUD overlay + keyboard cluster.
export default function ExperimentsDotClient() {
  return (
    <main className="relative min-h-screen w-full">
      <header className="fixed top-6 left-6 z-10 font-sans font-medium text-[10px] uppercase tracking-[0.18em] text-[var(--text-base-60)] mix-blend-difference">
        experiments / dot
      </header>
    </main>
  );
}
