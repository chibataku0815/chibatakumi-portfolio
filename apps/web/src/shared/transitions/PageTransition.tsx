"use client";

// PageTransition — Wave 2 D2.8 (wholesale transplant).
//
// In the wholesale-transplant model, motion-dot is no longer a swappable
// MotionStage participant; it's the singleton mount. PageTransition
// therefore has no participant to setActive on path change — the mount
// stays alive across navigations and is reconfigured by the
// MotionStageProvider-driven hooks (e.g. useMotionDotSceneCycle on
// Home).
//
// We keep this thin pass-through so that future participants can
// re-introduce a route-driven blend without disturbing the JSX tree at
// apps/web/src/app/[locale]/layout.tsx.

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return <>{children}</>;
}

export default PageTransition;
