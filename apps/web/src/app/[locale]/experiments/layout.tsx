// Experiments layout — wraps the 3 lab pages with the persistent
// MotionStage. The provider mounts a single canvas behind the page;
// each experiment activates a participant via setActive on mount.

import { MotionStageProvider, MotionUnsupportedBanner } from "@/features/motion";

export default function ExperimentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MotionStageProvider>
      <div className="relative min-h-screen w-full">
        {children}
        <MotionUnsupportedBanner />
      </div>
    </MotionStageProvider>
  );
}
