"use client";

import type { DotSceneName } from "@chibatakumi/motion-dot";
import { useMotionDotSceneCycle } from "@/features/motion";

const EXPERIMENTS_CYCLE = [
  "Orbit",
  "River Flow",
  "Firefly Sync",
  "Molecular",
  "Flock",
] as const satisfies ReadonlyArray<DotSceneName>;

export function ExperimentsSceneCycle(): null {
  useMotionDotSceneCycle({ scenes: EXPERIMENTS_CYCLE, intervalSec: 6 });
  return null;
}
