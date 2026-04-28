"use client";

import { useEffect } from "react";
import type { DotSceneName } from "@chibatakumi/motion-dot";
import { useMotionStage } from "./MotionStageContext";

interface SceneCycleConfig {
  readonly scenes: readonly DotSceneName[];
  readonly intervalSec: number;
}

/**
 * Drives a route-scoped ambient scene cycle on the persistent motion-dot
 * mount. Single concern: name-by-name rotation through `scenes` at
 * `intervalSec`. The hook does NOT touch HUD visibility, keyboard input,
 * audio, film toggle, or gallery — those stay at motion-dot's boot
 * defaults. When the consuming component unmounts, the cycle clears and
 * the mount is left on whatever scene it last advanced to (the user can
 * then drive it manually via the keyboard cluster).
 */
export function useMotionDotSceneCycle(config: SceneCycleConfig): void {
  const status = useMotionStage();
  const { scenes, intervalSec } = config;

  useEffect(() => {
    if (status.kind !== "ready") return;
    if (scenes.length === 0) return;

    const { mount } = status;
    let cursor = 0;
    mount.setActiveScene(scenes[cursor]);

    const handle = window.setInterval(() => {
      cursor = (cursor + 1) % scenes.length;
      mount.setActiveScene(scenes[cursor]);
    }, Math.max(0.5, intervalSec) * 1000);

    return () => {
      window.clearInterval(handle);
    };
  }, [status, scenes, intervalSec]);
}
