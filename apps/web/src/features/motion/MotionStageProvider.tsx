"use client";

// MotionStageProvider — Wave 2 D2.8 (wholesale transplant).
//
// Mounts a single persistent <canvas> + an HTML overlay container at the
// layout root, then boots the verbatim-transplanted motion-dot-new-webgpu
// app via `mountMotionDotApp`. The mount runs continuously across route
// navigations (canvas survives layout boundaries). All UI affordances —
// HUD overlay, keyboard cluster, film toggle, audio settings panel, file
// picker — come from motion-dot itself, exactly as in the original Vite
// app.
//
// Per `feedback_no_fallback_bug_hotbed.md`, when WebGPU is unavailable we
// surface `kind: "unsupported"` and let the MotionUnsupportedBanner sibling
// speak. No silent fallback motion.

import { useEffect, useRef, useState } from "react";
import { mountMotionDotApp, type MountHandle } from "@chibatakumi/motion-dot";
import { MotionStageContext, type MotionStageStatus } from "./MotionStageContext";

interface MotionStageProviderProps {
  readonly children: React.ReactNode;
  readonly canvasClassName?: string;
}

const DEFAULT_CANVAS_CLASS =
  "fixed inset-0 -z-10 pointer-events-none w-screen h-screen";

export function MotionStageProvider({
  children,
  canvasClassName = DEFAULT_CANVAS_CLASS,
}: MotionStageProviderProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<MountHandle | null>(null);
  const [status, setStatus] = useState<MotionStageStatus>({ kind: "pending" });

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    if (typeof navigator === "undefined" || !("gpu" in navigator)) {
      setStatus({
        kind: "unsupported",
        reason: "WebGPU is not available in this browser.",
      });
      return;
    }

    (async () => {
      try {
        const mount = await mountMotionDotApp({
          canvas,
          hostOverlay: overlay,
          onError: (err) => {
            console.error("[motion-dot] mount error:", err);
          },
        });
        if (cancelled) {
          mount.stop();
          return;
        }
        mountRef.current = mount;
        setStatus({ kind: "ready", mount });
      } catch (err) {
        console.error("[motion-dot] mount failed:", err);
        if (!cancelled) {
          setStatus({ kind: "error", error: err });
        }
      }
    })();

    return () => {
      cancelled = true;
      const mount = mountRef.current;
      if (mount) {
        mount.stop();
        mountRef.current = null;
      }
    };
  }, []);

  return (
    <MotionStageContext.Provider value={status}>
      <canvas
        id="canvas"
        ref={canvasRef}
        className={canvasClassName}
        aria-hidden="true"
      />
      <div ref={overlayRef} aria-hidden="true" />
      {children}
    </MotionStageContext.Provider>
  );
}
