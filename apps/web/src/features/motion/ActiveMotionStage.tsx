"use client";

// ActiveMotionStage — route-aware motion stage selector.
//
// On the home / portfolio routes, the global motion-dot mount registers itself
// as the active stage. On `/experiments/grid` and `/experiments/flow` the
// route's local mount stops motion-dot (via `useHideMotionStageOnMount`) and
// registers its own MountHandle here. LiquidGlassProvider and
// LiquidGlassFrontChrome read from this context so the Apple Liquid Glass
// compose pass follows whichever stage is currently driving the substrate.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ComposePass } from "@chibatakumi/motion-core/compose";

export interface ActiveStageHandle {
  readonly device: GPUDevice;
  readonly queue: GPUQueue;
  readonly format: GPUTextureFormat;
  readonly setComposePass: (pass: ComposePass | null) => void;
  readonly onBeforeFrame: (cb: () => void) => () => void;
}

interface ActiveMotionStageContextValue {
  readonly stage: ActiveStageHandle | null;
  readonly setActiveStage: (handle: ActiveStageHandle | null) => void;
}

const ActiveMotionStageContext =
  createContext<ActiveMotionStageContextValue | null>(null);

export function ActiveMotionStageProvider({
  children,
}: {
  readonly children: ReactNode;
}): React.ReactElement {
  const [stage, setStage] = useState<ActiveStageHandle | null>(null);
  const setActiveStage = useCallback(
    (handle: ActiveStageHandle | null) => {
      setStage(handle);
    },
    [],
  );
  const value = useMemo(
    () => ({ stage, setActiveStage }),
    [stage, setActiveStage],
  );
  return (
    <ActiveMotionStageContext.Provider value={value}>
      {children}
    </ActiveMotionStageContext.Provider>
  );
}

export function useActiveMotionStage(): ActiveStageHandle | null {
  const ctx = useContext(ActiveMotionStageContext);
  if (!ctx) {
    throw new Error(
      "useActiveMotionStage must be used inside <ActiveMotionStageProvider>",
    );
  }
  return ctx.stage;
}

export function useRegisterActiveMotionStage(): (
  handle: ActiveStageHandle | null,
) => void {
  const ctx = useContext(ActiveMotionStageContext);
  if (!ctx) {
    throw new Error(
      "useRegisterActiveMotionStage must be used inside <ActiveMotionStageProvider>",
    );
  }
  return ctx.setActiveStage;
}
