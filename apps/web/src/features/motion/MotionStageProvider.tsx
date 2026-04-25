"use client";

// MotionStageProvider — Renewal 2026 Wave 2 D2.8 (wholesale transplant).
//
// Mounts a single persistent <canvas> + an HTML overlay container at the
// layout root, then boots the transplanted motion-dot-new-webgpu app via
// `mountMotionDotApp`. The MountHandle is shared via context so consumer
// routes can reconfigure the live mount (scene cycle, HUD visibility,
// keyboard input) without remounting.
//
// SSR boundary: this component is "use client". The locale layout still
// renders SSR markup; the canvas only mounts after hydration.
//
// Unsupported browsers: per `feedback_no_fallback_bug_hotbed.md`, we DO NOT
// render a fallback. We surface a `kind: "unsupported"` status.

import { useEffect, useRef, useState } from "react";
import { mountMotionDotApp, type MountHandle } from "@chibatakumi/motion-dot";
import { MotionStageContext, type MotionStageStatus } from "./MotionStageContext";

interface MotionStageProviderProps {
  readonly children: React.ReactNode;
  /** Position the canvas. Default: fixed full-viewport behind page content. */
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
          // Layout-level safe defaults; consumer routes call mount.configure()
          // to enable HUD / input / scene cycle as needed.
          hudVisible: false,
          inputEnabled: false,
          audioEnabled: false,
        });
        if (cancelled) {
          mount.stop();
          return;
        }
        mountRef.current = mount;
        setStatus({ kind: "ready", mount });
      } catch (err) {
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
      <div
        ref={overlayRef}
        aria-hidden="true"
        className="motion-dot-overlay"
      />
      {children}
    </MotionStageContext.Provider>
  );
}
