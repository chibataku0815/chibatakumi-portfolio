"use client";

// Experiment route helper — registers a participant with the stage on mount,
// activates it, and disposes on unmount. Routes pass a factory rather than an
// instance so the participant is constructed only when MotionStage is ready
// (the factory may need GPU device / format which the participant doesn't
// receive until init, but participant construction itself is allowed to be
// lazy here).

import { useEffect } from "react";
import type { MotionParticipant } from "@chibatakumi/motion-core/participant";
import { useMotionStage } from "./MotionStageContext";

export interface UseExperimentParticipantOptions {
  /** Stable participant factory. Called once when the stage becomes ready. */
  readonly factory: () => MotionParticipant<string>;
  /** Cross-blend duration in ms. Default 500 (canon). 0 = instant swap. */
  readonly blendMs?: number;
}

export function useExperimentParticipant(
  options: UseExperimentParticipantOptions,
): { ready: boolean } {
  const status = useMotionStage();
  const ready = status.kind === "ready";

  useEffect(() => {
    if (status.kind !== "ready") return;
    const stage = status.stage;
    const participant = options.factory();
    try {
      stage.register(participant);
    } catch {
      // Stage forbids re-register; if HMR re-runs this effect, we silently
      // skip. Real route-driven swaps go through `setActive`.
    }
    stage.setActive(participant.name, options.blendMs ?? 500);
    return () => {
      // Note: stage.dispose tears all participants down at unmount of
      // MotionStageProvider. We don't dispose individuals here because
      // the same stage may switch back to this participant on re-navigation.
    };
    // factory + blendMs are intentionally NOT in deps — the route owns the
    // stable identity. Re-runs would cause double-register errors.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.kind]);

  return { ready };
}
