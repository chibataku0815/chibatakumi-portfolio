// Experiments layout — the persistent MotionStage now lives in the root
// [locale] layout, so all routes (home, works, experiments) share the same
// canvas. This layout only adds the unsupported-banner sibling for the
// 3 lab pages.

import { MotionUnsupportedBanner } from "@/features/motion";

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
