"use client";

import { createContext, useContext } from "react";
import type { MountHandle } from "@chibatakumi/motion-dot";

export type MotionStageStatus =
  | { kind: "pending" }
  | { kind: "ready"; mount: MountHandle }
  | { kind: "unsupported"; reason: string }
  | { kind: "error"; error: unknown };

export const MotionStageContext = createContext<MotionStageStatus>({
  kind: "pending",
});

export function useMotionStage(): MotionStageStatus {
  return useContext(MotionStageContext);
}
