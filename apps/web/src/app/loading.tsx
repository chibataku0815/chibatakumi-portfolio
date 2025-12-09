import { LoadingOriginGlow } from "@/features/loading/components";

/**
 * Global Loading UI - Award-Worthy Loading Experience
 *
 * Excellence Framework Level 5:
 * - ローディング自体が体験（Active Theory 参照）
 * - Pitch Black & Fire の世界観維持
 * - Origin Glow の脈動が「生命」を感じさせる
 *
 * Art Direction: "地層の最深部で脈動する原初の熱が、徐々に目覚める"
 * Motion Design: 1.5秒周期の呼吸、控えめな脈動
 *
 * Used by Next.js App Router:
 * - Automatically shown during Suspense boundaries
 * - Displayed during page transitions
 *
 * @example
 * Automatically used by Next.js - no manual import needed
 */
export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]"
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
    >
      {/* Origin Glow WebGL Background */}
      <LoadingOriginGlow />

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Dot Indicator - Motion Design: stagger with 0.2s delay */}
        <div className="flex gap-2" aria-hidden="true">
          <div
            className="h-2 w-2 rounded-full bg-[#ffbf49] animate-pulse"
            style={{ animationDelay: "0s", animationDuration: "1.5s" }}
          />
          <div
            className="h-2 w-2 rounded-full bg-[#ffbf49] animate-pulse"
            style={{ animationDelay: "0.2s", animationDuration: "1.5s" }}
          />
          <div
            className="h-2 w-2 rounded-full bg-[#ffbf49] animate-pulse"
            style={{ animationDelay: "0.4s", animationDuration: "1.5s" }}
          />
        </div>

        {/* Loading Text - Art Direction: 控えめ、静謐 */}
        <p className="text-xs tracking-[0.2em] uppercase text-white/30">
          Loading
        </p>
      </div>
    </div>
  );
}
