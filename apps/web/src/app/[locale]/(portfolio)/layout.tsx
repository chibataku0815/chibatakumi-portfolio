import { PageTransition } from "@/shared/transitions";
import { Nav } from "@/shared/components";
import { MotionStageProvider } from "@/features/motion";
import {
  LiquidGlassFrontChrome,
  LiquidGlassProvider,
} from "@/features/liquid-glass";
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
        Layer contract for portfolio routes:
          --motion-hud-top   : top inset for motion-dot HUD/film/audio chips.
          --z-motion-hud     : motion-dot HUD/control chips (lowest of the
                               persistent overlays).
          --z-motion-hud-panel: motion-dot audio settings panel — above the
                               HUD chips but still below the nav.
          --z-nav-front-glass: front overlay canvas painted by
                               `LiquidGlassFrontChrome` (the visible Liquid
                               Glass material for brand pill / menu pill /
                               open menu panel).
          --z-nav-hit        : transparent <Link>/<button> hit & a11y layer,
                               above the front glass so icons stay crisp.
          --z-nav-panel-scrim: full-viewport CSS backdrop-filter scrim.
          --z-nav-panel-content: open menu DOM contents (BrandWordmark, links,
                                 LanguageSwitcher) rendered above the canvas.
      */}
      <style>
        {`:root { --rail-x: 18px; --rail-y: 12px; --rail-height: 60px; --motion-hud-top: calc(var(--rail-y) + var(--rail-height) + 18px); --z-motion-hud: 20; --z-motion-hud-panel: 30; --z-nav-panel-scrim: 1090; --z-nav-front-glass: 1200; --z-nav-hit: 1210; --z-nav-panel-content: 1300; --z-nav-visual: var(--z-nav-front-glass); --z-nav-panel: var(--z-nav-panel-content); } @media (max-width: 720px) { :root { --rail-x: 10px; --rail-y: 8px; --rail-height: 56px; } }`}
      </style>
      <MotionStageProvider>
        {/*
          AudioBusProvider sits inside MotionStageProvider so motion
          participants (Wave 2 D5.4) can subscribe to the shared audio bus.
          LiquidGlassProvider sits inside MotionStageProvider so it can read
          the motion-dot MountHandle via useMotionStage(); it plugs a back
          ComposePass for `kind: "rail"` surfaces and exposes a frame-state
          getter that `LiquidGlassFrontChrome` consumes for `kind: "nav"` /
          `"panel"` surfaces in the front overlay canvas.
        */}
        <LiquidGlassProvider>
          <AudioBusProvider>
            <PageTransition>
              <Nav />
              {children}
            </PageTransition>
            <SoundToggleControl />
          </AudioBusProvider>
          <LiquidGlassFrontChrome />
        </LiquidGlassProvider>
      </MotionStageProvider>
    </div>
  );
}
