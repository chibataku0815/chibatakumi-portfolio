"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface MotionStageVisibilityValue {
  hidden: boolean;
  setHidden: (next: boolean) => void;
}

const MotionStageVisibilityContext =
  createContext<MotionStageVisibilityValue | null>(null);

export function MotionStageVisibilityProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [hidden, setHidden] = useState(false);
  return (
    <MotionStageVisibilityContext.Provider value={{ hidden, setHidden }}>
      {children}
    </MotionStageVisibilityContext.Provider>
  );
}

/** Hide the global motion-dot canvas while this component is mounted. */
export function useHideMotionStageOnMount(): void {
  const ctx = useContext(MotionStageVisibilityContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.setHidden(true);
    return () => ctx.setHidden(false);
  }, [ctx]);
}

export function useMotionStageHidden(): boolean {
  return useContext(MotionStageVisibilityContext)?.hidden ?? false;
}
