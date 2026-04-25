"use client";

// Wave 2 D2.8 — placeholder. motion-grid was wired through MotionStage's
// participant API which has been retired in favor of motion-dot's wholesale
// transplant. Wave 3 will rebuild motion-grid on top of the original
// motion-dot-new-webgpu pattern (its own canvas + own loop) — until then
// this route surfaces an explicit pending state per
// `feedback_no_fallback_bug_hotbed.md`.
export default function ExperimentsGridClient() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center">
      <div className="max-w-md px-6 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--text-base-60)]">
          experiments / grid
        </p>
        <p className="mt-4 text-[15px] leading-[1.6] text-[var(--text-base)]">
          Restoring after motion-dot transplant. Wave 3 will rebuild this
          surface on the original codebase pattern.
        </p>
      </div>
    </main>
  );
}
