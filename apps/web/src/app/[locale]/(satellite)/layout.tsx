import { AudioBusProvider } from "@/features/audio";

/**
 * Satellite shell — Renewal 2026 Satellite Isolation Plan §3.3.
 *
 * 適用範囲: `/filmtone`, `/photography`
 * 設計目的: 将来の独立ドメイン化 (filmtone.com 等) を見据えた物理隔離。
 *
 * 提供する surface:
 *  - `data-theme="dark"` + `.dark` wrapper:
 *    - `data-theme="dark"` は globals.css の Filmtone 専用 alias (`--accent-amber1`, `--fl-bg-*` 等) を活性化
 *    - `.dark` は Radix Colors の生パレット (`--amber-9`, `--slate-1..12` 等) を活性化
 *    - 両方必要: globals.css の alias は Radix の生 token を `var(--amber-9)` 経由で参照するため、
 *      Radix が要求する `.dark` クラスが無いと alias が undefined チェーンになる (例: トグル active 状態の amber bg)
 *  - `<AudioBusProvider>` (Filmtone audio surfaces 用に維持)
 *
 * 意図的に提供しない:
 *  - `<Nav />` ── プラン §5.5 「satellite に global navigation 不可」
 *  - `<MotionStageProvider>` / `<LiquidGlassProvider>` ── motion-dot bleed-through 防止
 *  - `<PageTransition>` ── satellite 内部遷移は LP 自身の motion grammar に任せる
 *  - `<SoundToggleControl>` ── Filmtone 自体の audio panel と二重化を避ける
 *
 * 注意 (Photography):
 *  - 現状 `/photography` は light editorial design を前提とする (rich LP 復元は別 stream)。
 *  - 本 layout の `data-theme="dark"` は Photography の design language とは反するが、
 *    Photography page 側でさらに内側に `data-theme="light"` wrapper を被せて反転可能。
 *    rich LP 復元 stream で Photography 専用の inner layout を置く方針。
 */
export default function SatelliteRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-theme="dark" className="dark min-h-dvh bg-[var(--bg-primary)]">
      <AudioBusProvider>{children}</AudioBusProvider>
    </div>
  );
}
