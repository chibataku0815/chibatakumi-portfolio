"use client";

/// <reference types="@webgpu/types" />

// LiquidGlassFrontChrome — front overlay canvas for global nav chrome.
//
// This canvas owns no GPU pipelines of its own: the rendering is driven by
// the SAME `LiquidGlassComposePass` that handles the back motion-dot path
// (see `compose-factory.ts`). Both targets share motion-dot's GPUDevice and
// motion-dot's substrate texture, so the front overlay's lensing actually
// refracts what motion-dot is drawing — no procedural fake substrate.
//
// Concretely:
//   1. We configure this canvas's GPUCanvasContext with motion-dot's device
//      and `alphaMode:"premultiplied"`.
//   2. We register a `getCurrentTarget()` callback with the provider. The
//      compose pass invokes it inside motion-dot's frame encoder to acquire
//      the front canvas's current swap-chain view.
//   3. The compose pass clears this canvas with `(0,0,0,0)` and runs the
//      alpha-aware `fsCompositeAlpha` pipeline scissored per `kind:"nav"`,
//      `"panel"`, or `"control"` surface.
//
// HTML cannot be sampled (project anti-targets forbid html2canvas /
// getDisplayMedia / captureStream / drawImage). Sampling motion-dot's own
// offscreen GPU texture is NOT DOM sampling — it's internal GPU RT access
// over a shared device.

import { useEffect, useRef } from "react";
import { useMotionStage } from "@/features/motion";
import {
  useLiquidGlassRegisterFrontCanvas,
  type FrontCanvasRegistration,
} from "./LiquidGlassProvider";

const DPR_CAP = 2;

export function LiquidGlassFrontChrome(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const motionStage = useMotionStage();
  const registerFrontCanvas = useLiquidGlassRegisterFrontCanvas();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (motionStage.kind !== "ready") return;

    const { device, format } = motionStage.mount.gpu;
    const context = canvas.getContext("webgpu");
    if (!context) return;
    const gpuContext = context;
    gpuContext.configure({
      device,
      format,
      alphaMode: "premultiplied",
    });

    const registration: FrontCanvasRegistration = {
      getCurrentTarget: () => {
        const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
        const cssWidth = Math.max(1, window.innerWidth);
        const cssHeight = Math.max(1, window.innerHeight);
        const targetWidth = Math.max(1, Math.round(cssWidth * dpr));
        const targetHeight = Math.max(1, Math.round(cssHeight * dpr));
        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
        }
        try {
          const view = gpuContext.getCurrentTexture().createView();
          return {
            swapView: view,
            width: canvas.width,
            height: canvas.height,
            dpr,
          };
        } catch {
          return null;
        }
      },
    };

    const unregister = registerFrontCanvas(registration);

    return () => {
      unregister();
      try {
        gpuContext.unconfigure();
      } catch {
        // best-effort cleanup
      }
    };
  }, [motionStage, registerFrontCanvas]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-screen w-screen"
      style={{ zIndex: "var(--z-nav-front-glass, 1200)" }}
    />
  );
}
