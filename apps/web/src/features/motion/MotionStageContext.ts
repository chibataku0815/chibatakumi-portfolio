// React context for MotionStage. Kept in its own file so server components
// that import the type don't pull in the client-only Provider.

"use client";

import { createContext, useContext } from "react";
import type { MotionStage } from "@chibatakumi/motion-core/participant";

export type MotionStageStatus =
  | { kind: "pending" }
  | { kind: "ready"; stage: MotionStage }
  | { kind: "unsupported"; reason: string }
  | { kind: "error"; error: unknown };

export const MotionStageContext = createContext<MotionStageStatus>({
  kind: "pending",
});

export function useMotionStage(): MotionStageStatus {
  return useContext(MotionStageContext);
}
