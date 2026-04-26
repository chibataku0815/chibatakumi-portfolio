import { PageTransition } from "@/shared/transitions";
import { Nav } from "@/shared/components";
import { MotionStageProvider } from "@/features/motion";
import { LiquidGlassProvider } from "@/features/liquid-glass";
import { AudioBusProvider, SoundToggleControl } from "@/features/audio";

/**
 * Portfolio shell — Renewal 2026 Satellite Isolation Plan §3.2.
 *
 * 適用範囲: `/`, `/about`, `/contact`, `/craft`, `/experiments`, `/journal`, `/works`
 * 提供する surface:
 *  - `<Nav />` (renewal global navigation)
 *  - `<MotionStageProvider>` (motion-dot canvas のホスト)
 *  - `<LiquidGlassProvider>` (motion-dot のレンダリングループに ComposePass を差し込む)
 *  - `<AudioBusProvider>` + `<SoundToggleControl>`
 *  - `<PageTransition>` (route 遷移オーバーレイ)
 *  - `data-theme="light"` wrapper (light は default だが、route group 物理境界として明示)
 *
 * ⚠️ 外側 wrapper に `background-color` / `min-height` を付けない:
 *    MotionStageProvider の canvas は `fixed inset-0 -z-10` で背面配置される
 *    (`features/motion/MotionStageProvider.tsx:27,87`)。bg を付けると canvas が
 *    完全に隠れて motion-dot が表示されなくなる。詳細は plan §3.2 警告を参照。
 *
 * 範囲外: `/filmtone`, `/photography` — 別 route group `(satellite)/layout.tsx` が独自 shell を提供。
 */
export default function PortfolioRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-theme="light">
      {/*
        --motion-hud-top: top inset for motion-dot's HUD/film/audio overlays.
        Gate 1 nav rail: shift below the global nav so HUD/keyboard/audio
        chrome never bleeds through the rail band (anti-target).
        Fallback `64px` matches `--nav-height` in non-portfolio shells.
      */}
      <style>{`:root { --motion-hud-top: calc(var(--nav-height, 64px) + 16px); }`}</style>
      <MotionStageProvider>
        {/*
          AudioBusProvider sits inside MotionStageProvider so motion
          participants (Wave 2 D5.4) can subscribe to the shared audio
          bus. LiquidGlassProvider sits inside MotionStageProvider so it
          can read the motion-dot MountHandle via useMotionStage(). The
          provider mounts no canvas; it plugs a ComposePass into
          motion-dot's existing render loop.
        */}
        <LiquidGlassProvider>
          <AudioBusProvider>
            <PageTransition>
              <Nav />
              {children}
            </PageTransition>
            <SoundToggleControl />
          </AudioBusProvider>
        </LiquidGlassProvider>
      </MotionStageProvider>
    </div>
  );
}
