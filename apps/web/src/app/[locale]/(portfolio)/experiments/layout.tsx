// Experiments layout — the persistent MotionStage lives in the root
// [locale] layout, so all routes (home, works, experiments) share the same
// canvas. This layout adds the unsupported-banner sibling for the three
// lab pages.
//
// Audio / mic surface (Package 7 corrective, 2026-04-26):
//   • /experiments/dot drives its visual from motion-dot's *internal*
//     AudioBus (packages/motion-dot/src/main.ts) — distinct from the
//     apps/web GlobalAudioController. The honest mic-input surface for
//     dot is motion-dot's built-in Audio Panel (top-right film/audio
//     buttons, "I" key, listed in the hotkey legend as "I Panel"),
//     because that flow calls getUserMedia inside motion-dot and feeds
//     motion-dot's own analyser.
//   • /experiments/grid and /experiments/flow are ambient-only — neither
//     motion-grid nor motion-flow consumes microphone input today.
//   • apps/web's MicInputGate operates the GlobalAudioController bus,
//     which no experiments-route visual currently reads from. Mounting
//     it here would advertise "drive the motion with your voice" while
//     the click has no visible effect, so the experiments-wide mount is
//     intentionally removed. The component remains exported from
//     @/features/audio for any future route that grows a
//     GlobalAudioController-bound visualization.

import { MotionUnsupportedBanner } from "@/features/motion";

/**
 * Experiments shell — light substrate に統合 (Wave 4-3)。
 *
 * Wave 4-1 で `data-theme="dark"` を撤去、Wave 4-3 で「背景ダーク」概念を廃止し
 * `.dark` ラッパーも外した。motion-dot canvas (light substrate) の上に最小 UI を
 * 重ねる構成のため、`.dark` で Radix dark scale を強制すると alias が逆向きに
 * 解決されてしまう (text が light、bg が dark)。
 *
 * 各 client (dot/grid/flow) は token chain (`--text-base` 等) を介して :root の
 * light scale を参照するので、shell 側に追加 class は不要。
 */
export default function ExperimentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full">
      {children}
      <MotionUnsupportedBanner />
    </div>
  );
}
