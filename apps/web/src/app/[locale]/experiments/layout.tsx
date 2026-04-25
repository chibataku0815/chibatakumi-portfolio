// Experiments layout — the persistent MotionStage now lives in the root
// [locale] layout, so all routes (home, works, experiments) share the same
// canvas. This layout adds:
//   • the unsupported-banner sibling for the 3 lab pages, and
//   • the mic-input opt-in gate (Wave 2 D5.5) — only the experiments
//     surface offers mic input; the rest of the portfolio uses the
//     ambient default-track source via the root SoundToggleControl.
//
// MicInputGate is anchored top-left so it never collides with the
// bottom-right SoundToggleControl mounted in the root [locale] layout.

import { MotionUnsupportedBanner } from "@/features/motion";
import { MicInputGate } from "@/features/audio";

export default function ExperimentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full">
      {children}
      <MotionUnsupportedBanner />
      <MicInputGate className="fixed top-4 left-4 z-50" />
    </div>
  );
}
