"use client";

// /experiments/flow — Renewal 2026 Motion Works (Package 4).
// Three live WebGPU surfaces — dot, grid, flow.
// Mounts motion-flow's standalone WebGPU app on a route-owned canvas.
// Suspends the global MotionStage (motion-dot) loop while mounted so two
// WebGPU contexts do not contend for the GPU.
// Per `feedback_no_fallback_bug_hotbed.md`, when WebGPU is unavailable we
// render an explicit unsupported message — no silent fallback.

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  mountMotionFlowApp,
  type MountFlowHandle,
} from "@chibatakumi/motion-flow";
import { useHideMotionStageOnMount } from "@/features/motion/MotionStageVisibility";
import { useRegisterActiveMotionStage } from "@/features/motion";

type Status =
  | { kind: "pending" }
  | { kind: "ready" }
  | { kind: "unsupported" }
  | { kind: "error"; message: string };

export default function ExperimentsFlowClient() {
  useHideMotionStageOnMount();
  const t = useTranslations("experiments.unsupported");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const mountRef = useRef<MountFlowHandle | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "pending" });
  const setActiveStage = useRegisterActiveMotionStage();

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    if (typeof navigator === "undefined" || !("gpu" in navigator)) {
      setStatus({ kind: "unsupported" });
      return;
    }

    (async () => {
      try {
        const handle = await mountMotionFlowApp({
          canvas,
          hostOverlay: overlay,
          onError: (err) => {
            console.error("[motion-flow] mount error:", err);
          },
        });
        if (cancelled) {
          handle.stop();
          return;
        }
        mountRef.current = handle;
        setStatus({ kind: "ready" });
        // Register this mount as the active motion stage so the LiquidGlass
        // compose pass refracts the motion-flow substrate while we're on
        // this route.
        setActiveStage({
          device: handle.gpu.device,
          queue: handle.gpu.queue,
          format: handle.gpu.format,
          setComposePass: handle.setComposePass,
          onBeforeFrame: handle.onBeforeFrame,
        });
      } catch (err) {
        if (!cancelled) {
          setStatus({
            kind: "error",
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      setActiveStage(null);
      mountRef.current?.stop();
      mountRef.current = null;
    };
  }, [setActiveStage]);

  return (
    <main className="relative min-h-screen w-full">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 h-screen w-screen"
        aria-hidden="true"
      />
      {/* hostOverlay for HUD/keyboard/cluster injected by motion-flow mount.
          z-index must sit ABOVE LiquidGlassFrontChrome (--z-nav-front-glass:
          1200) so the HUD chips remain interactive and chip text isn't
          covered by the front-glass canvas. Mirrors --z-motion-hud-content
          (1210) used by MotionStageProvider for motion-dot HUDs. */}
      <div
        ref={overlayRef}
        className="fixed inset-0 pointer-events-none [&>*]:pointer-events-auto"
        style={{ zIndex: "var(--z-motion-hud-content, 1210)" }}
        aria-hidden="true"
      />
      <header className="fixed top-6 left-6 z-20 font-sans font-medium text-[10px] uppercase tracking-[0.18em] text-[var(--text-base-60)] mix-blend-difference">
        experiments / flow
      </header>
      {status.kind !== "ready" && status.kind !== "pending" ? (
        <div
          role="alert"
          className="fixed inset-x-0 bottom-0 z-30 mx-auto m-6 max-w-2xl rounded-xl border border-amber-300/30 bg-black/70 p-4 text-sm leading-relaxed text-amber-100 backdrop-blur-md"
        >
          <p className="mb-1 font-medium">{t("headline")}</p>
          <p className="text-amber-100/80">
            {status.kind === "unsupported"
              ? t("reasonUnavailable")
              : t("reasonInitFailed", { message: status.message })}{" "}
            {t("browserHint")}
          </p>
        </div>
      ) : null}
    </main>
  );
}
