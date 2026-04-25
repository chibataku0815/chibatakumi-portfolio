"use client";

// MotionStageProvider — Renewal 2026 Stream 4-A.
//
// Mounts a single persistent <canvas> at the layout root, boots a MotionStage
// once on the client, and shares it via context. Route changes call
// `stage.setRouteKey()` so participants that key state on the URL can react
// without remounting (the canvas survives layout boundaries).
//
// SSR boundary: this component is "use client". The locale layout still
// renders SSR markup; the canvas only mounts after hydration and WebGPU
// adapter negotiation completes.
//
// Unsupported browsers: per plan §5.4 / `feedback_no_fallback_bug_hotbed.md`,
// we DO NOT render a fallback motion. Instead we surface a `kind: "unsupported"`
// status that consumers (or a sibling banner) can use to show the explicit
// "WebGPU required" message in craft idiom.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createMotionStage } from "@chibatakumi/motion-core/stage";
import type { MotionStage } from "@chibatakumi/motion-core/participant";
import { MotionStageContext, type MotionStageStatus } from "./MotionStageContext";

interface MotionStageProviderProps {
  readonly children: React.ReactNode;
  /** Initial route key passed to participants. Defaults to window.location.pathname. */
  readonly initialRouteKey?: string;
  /** Position the canvas. Default: fixed full-viewport behind page content. */
  readonly canvasClassName?: string;
}

const DEFAULT_CANVAS_CLASS =
  "fixed inset-0 -z-10 pointer-events-none w-screen h-screen";

export function MotionStageProvider({
  children,
  initialRouteKey,
  canvasClassName = DEFAULT_CANVAS_CLASS,
}: MotionStageProviderProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<MotionStage | null>(null);
  const [status, setStatus] = useState<MotionStageStatus>({ kind: "pending" });

  // Boot once on mount.
  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (typeof navigator === "undefined" || !("gpu" in navigator)) {
      setStatus({
        kind: "unsupported",
        reason: "WebGPU is not available in this browser.",
      });
      return;
    }

    (async () => {
      try {
        const stage = await createMotionStage({
          canvas,
          initialRouteKey:
            initialRouteKey ??
            (typeof window !== "undefined" ? window.location.pathname : "/"),
          // demoStyle "beat" preserves dot's 120 BPM silent-time aesthetic
          // (original motion-dot-new-webgpu/src/main.ts:302). The shared
          // substrate default is "ambient" for grid's use case, but dot is
          // the dominant participant on home + /experiments/dot, so we
          // override to "beat" globally. Grid/flow keep working — they
          // consume the same AudioBus state regardless of demo envelope.
          demoStyle: "beat",
        });
        if (cancelled) {
          stage.dispose();
          return;
        }
        stageRef.current = stage as MotionStage;
        setStatus({ kind: "ready", stage });
      } catch (err) {
        if (!cancelled) {
          setStatus({ kind: "error", error: err });
        }
      }
    })();

    return () => {
      cancelled = true;
      const stage = stageRef.current;
      if (stage) {
        stage.dispose();
        stageRef.current = null;
      }
    };
  }, [initialRouteKey]);

  // Resize observer — keeps the offscreen pool sized to the canvas backing store.
  useEffect(() => {
    if (status.kind !== "ready") return;
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      // The stage's frame loop calls resizeCanvas every frame; nothing to
      // do here. The observer exists so future stages can listen if needed.
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [status.kind]);

  // Route key sync — best-effort: we listen to popstate + Next.js router
  // events via a path watcher driven by window.location every animation frame
  // (cheap; ~0.5 µs per check). Avoids a full router subscription that would
  // require this component to live below the App Router boundary differently.
  const router = useRouter();
  useEffect(() => {
    if (status.kind !== "ready") return;
    let lastPath =
      typeof window !== "undefined" ? window.location.pathname : "/";
    let raf = 0;
    const tick = () => {
      const current =
        typeof window !== "undefined" ? window.location.pathname : "/";
      if (current !== lastPath) {
        lastPath = current;
        const stageWithRoute = status.stage as MotionStage & {
          setRouteKey?: (k: string) => void;
        };
        stageWithRoute.setRouteKey?.(current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status, router]);

  return (
    <MotionStageContext.Provider value={status}>
      <canvas
        ref={canvasRef}
        className={canvasClassName}
        aria-hidden="true"
      />
      {children}
    </MotionStageContext.Provider>
  );
}
