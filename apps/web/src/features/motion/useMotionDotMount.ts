"use client";

// useMotionDotMount — Wave 2 D2.8 (wholesale transplant).
//
// Reconfigures the live motion-dot mount that lives in MotionStageProvider.
// Routes call this hook with the configuration they need (HUD, input, scene
// cycle, initial scene). The single mount survives navigation; this hook
// only flips runtime state via mount.configure().
//
// On unmount the route does NOT stop the mount — the next route may want it
// alive (e.g. /experiments/dot → /about returns to home ambient).

import { useEffect } from "react";
import type { MountOptions } from "@chibatakumi/motion-dot";
import { useMotionStage } from "./MotionStageContext";

type ConfigurableOptions = Partial<
  Omit<MountOptions, "canvas" | "hostOverlay" | "onError" | "onReady">
>;

export function useMotionDotMount(config: ConfigurableOptions): { ready: boolean } {
  const status = useMotionStage();
  const ready = status.kind === "ready";

  useEffect(() => {
    if (status.kind !== "ready") return;
    status.mount.configure(config);
    // config is intentionally NOT in deps — the route owns its stable
    // configuration. If a route needs runtime-changing config (e.g. an
    // interactive scene picker), it should call status.mount.configure
    // imperatively from an event handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.kind]);

  return { ready };
}
