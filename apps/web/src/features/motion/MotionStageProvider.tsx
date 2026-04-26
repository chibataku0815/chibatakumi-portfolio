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
//
// Stream C (renewal-2026 Wave 3): split into outer MotionStageProvider
// (wraps MotionStageVisibilityProvider) and inner MotionStageMount (reads
// hidden flag, gates / restarts the WebGPU loop when experiment routes
// mount their own WebGPU surface).

import { useEffect, useRef, useState } from "react";
import { mountMotionDotApp, type MountHandle } from "@chibatakumi/motion-dot";
import { MotionStageContext, type MotionStageStatus } from "./MotionStageContext";
import {
  MotionStageVisibilityProvider,
  useMotionStageHidden,
} from "./MotionStageVisibility";

interface MotionStageProviderProps {
  readonly children: React.ReactNode;
  readonly canvasClassName?: string;
}

const DEFAULT_CANVAS_CLASS =
  "fixed inset-0 -z-10 pointer-events-none w-screen h-screen";

// Inner component — lives inside MotionStageVisibilityProvider so it can
// read `useMotionStageHidden()`.  Restarts the WebGPU loop when `hidden`
// toggles false→true→false (e.g. user navigates into /experiments/grid,
// then back to the home route).
function MotionStageMount({
  canvasClassName,
  children,
}: {
  canvasClassName: string;
  children: React.ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<MountHandle | null>(null);
  const [status, setStatus] = useState<MotionStageStatus>({ kind: "pending" });
  const hidden = useMotionStageHidden();

  useEffect(() => {
    // When a sub-route hides the global dot, stop the running loop.
    if (hidden) {
      const mount = mountRef.current;
      if (mount) {
        mount.stop();
        mountRef.current = null;
      }
      // Keep status so consumers know the last known state.
      return;
    }

    // hidden === false — (re)start the dot loop.
    let cancelled = false;
    const publishStatus = (nextStatus: MotionStageStatus) => {
      queueMicrotask(() => {
        if (!cancelled) {
          setStatus(nextStatus);
        }
      });
    };

    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    if (typeof navigator === "undefined" || !("gpu" in navigator)) {
      publishStatus({
        kind: "unsupported",
        reason: "WebGPU is not available in this browser.",
      });
      return () => {
        cancelled = true;
      };
    }

    publishStatus({ kind: "pending" });

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
  }, [hidden]); // re-runs whenever hidden changes

  return (
    <MotionStageContext.Provider value={status}>
      <canvas
        id="canvas"
        ref={canvasRef}
        className={canvasClassName}
        aria-hidden="true"
      />
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: "var(--z-motion-hud, 20)" }}
      />
      {children}
    </MotionStageContext.Provider>
  );
}

export function MotionStageProvider({
  children,
  canvasClassName = DEFAULT_CANVAS_CLASS,
}: MotionStageProviderProps): React.ReactElement {
  return (
    <MotionStageVisibilityProvider>
      <MotionStageMount canvasClassName={canvasClassName}>
        {children}
      </MotionStageMount>
    </MotionStageVisibilityProvider>
  );
}
