"use client";

// /experiments/grid — Renewal 2026 Motion Works (Package 4).
// Mounts motion-grid's standalone WebGPU app on a route-owned canvas. The
// global MotionStageProvider (motion-dot) sits at z=-10 in the layout and is
// visually covered by this opaque canvas at z=0. Per
// `feedback_no_fallback_bug_hotbed.md`, when WebGPU is unavailable we render
// an explicit unsupported message — no silent fallback, no quiet degradation.

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  mountMotionGridApp,
  type MountGridHandle,
} from "@chibatakumi/motion-grid";

type Status =
  | { kind: "pending" }
  | { kind: "ready" }
  | { kind: "unsupported" }
  | { kind: "error"; message: string };

export default function ExperimentsGridClient() {
  const t = useTranslations("experiments.unsupported");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mountRef = useRef<MountGridHandle | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "pending" });

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (typeof navigator === "undefined" || !("gpu" in navigator)) {
      setStatus({ kind: "unsupported" });
      return;
    }

    (async () => {
      try {
        const handle = await mountMotionGridApp({
          canvas,
          onError: (err) => {
            console.error("[motion-grid] mount error:", err);
          },
        });
        if (cancelled) {
          handle.stop();
          return;
        }
        mountRef.current = handle;
        setStatus({ kind: "ready" });
      } catch (err) {
        console.error("[motion-grid] mount failed:", err);
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
      const handle = mountRef.current;
      if (handle) {
        handle.stop();
        mountRef.current = null;
      }
    };
  }, []);

  return (
    <main className="relative min-h-screen w-full bg-[var(--bg-dark)]">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 h-screen w-screen"
        aria-hidden="true"
      />
      <header className="fixed top-6 left-6 z-10 font-mono text-[11px] uppercase tracking-[0.32em] text-white/80 mix-blend-difference">
        experiments / grid
      </header>
      {status.kind !== "ready" && status.kind !== "pending" ? (
        <div
          role="alert"
          className="fixed inset-x-0 bottom-0 z-20 mx-auto m-6 max-w-2xl rounded-xl border border-amber-300/30 bg-black/70 p-4 text-sm leading-relaxed text-amber-100 backdrop-blur-md"
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
