"use client";

import { useMotionStage } from "./MotionStageContext";

/**
 * Sibling banner that surfaces the unsupported / error state from the
 * MotionStageProvider. Renders nothing while the stage boots or runs
 * normally. Per plan §5.4: explicit, craft-idiom message — no silent
 * fallback rendering.
 */
export function MotionUnsupportedBanner(): React.ReactElement | null {
  const status = useMotionStage();

  if (status.kind === "pending" || status.kind === "ready") {
    return null;
  }

  const message =
    status.kind === "unsupported"
      ? status.reason
      : "WebGPU initialization failed.";

  return (
    <div
      role="alert"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-2xl m-6 p-4 rounded-xl border border-amber-300/30 bg-black/70 text-amber-100 text-sm leading-relaxed backdrop-blur-md"
    >
      <p className="mb-1 font-medium">
        This site renders a live WebGPU experience.
      </p>
      <p className="text-amber-100/80">
        {message} Please open in Chrome / Edge / Arc on macOS, Windows, or
        Android (latest). iOS Safari does not yet support WebGPU.
      </p>
    </div>
  );
}
