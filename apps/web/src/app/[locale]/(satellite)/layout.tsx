import { AudioBusProvider } from "@/features/audio";

/**
 * Satellite shell — Renewal 2026 Satellite Isolation Plan §3.3.
 *
 * 適用範囲: `/filmtone`, `/photography`
 * 設計目的: 将来の独立ドメイン化 (filmtone.com 等) を見据えた物理隔離。
 *
 * 提供する surface:
 *  - `.dark` wrapper:
 *    - `.dark` は Radix Colors の dark scale (`--slate-1..12`, `--amber-9..11`) を活性化
 *    - Wave 4-1 で `data-theme="dark"` を撤去、Wave 4-3 で site 全体を light substrate に
 *      再統合した後も Filmtone は dark editor identity を保つため `.dark` を維持
 *    - `bg-[var(--slate-1)]` で .dark scope の slate-1 (≈ #111113) を背景に取り、
 *      `--bg-primary` (現在は light の #D2D2D2) には依存しない
 *  - `<AudioBusProvider>` (Filmtone audio surfaces 用に維持)
 *
 * 意図的に提供しない:
 *  - `<Nav />` ── プラン §5.5 「satellite に global navigation 不可」
 *  - `<MotionStageProvider>` / `<LiquidGlassProvider>` ── motion-dot bleed-through 防止
 *  - `<PageTransition>` ── satellite 内部遷移は LP 自身の motion grammar に任せる
 *  - `<SoundToggleControl>` ── Filmtone 自体の audio panel と二重化を避ける
 */
export default function SatelliteRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-dvh bg-[var(--slate-1)]">
      <AudioBusProvider>{children}</AudioBusProvider>
    </div>
  );
}
