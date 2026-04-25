"use client";

// PageTransition — Wave 2 D2.8 (wholesale transplant).
//
// In the wholesale-transplant model, motion-dot is no longer a swappable
// MotionStage participant; it's the singleton mount. PageTransition
// therefore has no participant to setActive on path change — the mount
// stays alive across navigations and reconfigures via useMotionDotMount.
//
// We keep this thin pass-through so that future participants (motion-grid,
// motion-flow when they're rebuilt on top of the original codebase pattern
// in Wave 3) can re-introduce a route-driven blend without disturbing the
// JSX tree at apps/web/src/app/[locale]/layout.tsx.

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return <>{children}</>;
}

export default PageTransition;
