"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motifLoopBackgroundConfig } from "./motif-loop-background.config";
import { createMotifLoopBackgroundScene } from "./motif-loop-background-scene";
import {
  evaluateMotifLoopBackgroundFrame,
  getMotifLoopBackgroundSafeFrame,
} from "./motif-loop-background.evaluator";

type MotifLoopBackgroundSurfaceProps = {
  autoPlay?: boolean;
  captureMode?: boolean;
  frameOverride?: number | null;
};

function subscribeReducedMotion(onStoreChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }

  const mediaQueryList = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handleChange = () => {
    onStoreChange();
  };

  mediaQueryList.addEventListener("change", handleChange);

  return () => {
    mediaQueryList.removeEventListener("change", handleChange);
  };
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function MotifLoopBackgroundSurface({
  autoPlay = true,
  captureMode = false,
  frameOverride = null,
}: MotifLoopBackgroundSurfaceProps) {
  const reducedMotionPreference = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => null,
  );
  const motionPreferenceResolved = reducedMotionPreference !== null;
  const shouldReduceMotion = reducedMotionPreference === true;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef(0);
  const baseFrameRef = useRef(0);
  const playbackStartTimeRef = useRef<number | null>(null);

  const [frame, setFrame] = useState(0);
  const [isManuallyPaused, setIsManuallyPaused] = useState(!autoPlay);
  const [isReady, setIsReady] = useState(false);
  const [rendererLabel, setRendererLabel] = useState("Pixi init");
  const [sceneError, setSceneError] = useState<string | null>(null);
  const isPaused =
    frameOverride !== null ||
    !motionPreferenceResolved ||
    shouldReduceMotion ||
    isManuallyPaused;

  useEffect(() => {
    if (!motionPreferenceResolved) {
      return;
    }

    let mounted = true;
    let rafId = 0;
    let sceneDestroy: (() => void) | null = null;

    const renderFrame = (nextFrame: number) => {
      const boundedFrame = Math.max(
        0,
        Math.min(motifLoopBackgroundConfig.durationFrames - 1, nextFrame),
      );

      frameRef.current = boundedFrame;
      setFrame(boundedFrame);
    };

    const start = async () => {
      if (!hostRef.current) {
        return;
      }

      setSceneError(null);
      setRendererLabel("Pixi init");
      setIsReady(false);

      try {
        const scene = await createMotifLoopBackgroundScene({
          host: hostRef.current,
        });

        if (!mounted) {
          scene.destroy();
          return;
        }

        sceneDestroy = scene.destroy;
        setIsReady(true);
        setRendererLabel("Pixi ready");

        const paint = (nextFrame: number) => {
          scene.update(evaluateMotifLoopBackgroundFrame(nextFrame));
          renderFrame(nextFrame);
        };

        const staticFrame =
          frameOverride ??
          (shouldReduceMotion ? getMotifLoopBackgroundSafeFrame() : 0);

        paint(staticFrame);
        baseFrameRef.current = staticFrame;

        const loop = (timestamp: number) => {
          if (!mounted || frameOverride !== null || shouldReduceMotion || isPaused) {
            return;
          }

          if (playbackStartTimeRef.current === null) {
            playbackStartTimeRef.current = timestamp;
          }

          const elapsedFrames =
            (timestamp - playbackStartTimeRef.current) /
            (1000 / motifLoopBackgroundConfig.fps);
          const nextFrame =
            (baseFrameRef.current + elapsedFrames) %
            motifLoopBackgroundConfig.durationFrames;

          paint(nextFrame);
          rafId = requestAnimationFrame(loop);
        };

        if (frameOverride === null && !shouldReduceMotion && !isPaused) {
          rafId = requestAnimationFrame(loop);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unknown PixiJS initialization error.";
        const detailedMessage =
          "Motif Loop Background failed to initialize PixiJS scene: " + message;

        if (!mounted) {
          return;
        }

        setSceneError(detailedMessage);
        setRendererLabel("Pixi failed");
      }
    };

    void start();

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
      sceneDestroy?.();
    };
  }, [frameOverride, isPaused, motionPreferenceResolved, shouldReduceMotion]);

  const handleTogglePlayback = () => {
    if (
      frameOverride !== null ||
      !motionPreferenceResolved ||
      shouldReduceMotion ||
      sceneError
    ) {
      return;
    }

    baseFrameRef.current = frameRef.current;
    playbackStartTimeRef.current = null;
    setIsManuallyPaused((current) => !current);
  };

  return (
    <div
      className={`relative overflow-hidden bg-[rgba(255,255,255,0.025)] ${
        captureMode
          ? "rounded-[20px] border border-white/8"
          : "rounded-[28px] border border-white/10"
      }`}
    >
      {!captureMode ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/45">
              Background Motion Proof
            </p>
            <h2 className="mt-1 text-sm font-medium tracking-[0.16em] text-[var(--text-base)]">
              Motif Loop Background
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
            <span>{Math.round(frame).toString().padStart(3, "0")}f</span>
            <span className="h-1 w-1 rounded-full bg-white/25" />
            <span>{rendererLabel}</span>
            <span className="h-1 w-1 rounded-full bg-white/25" />
            <span>{isReady ? "Clamp Stable" : "Surface Loading"}</span>
            <button
              type="button"
              onClick={handleTogglePlayback}
              disabled={
                frameOverride !== null ||
                !motionPreferenceResolved ||
                shouldReduceMotion ||
                !isReady ||
                Boolean(sceneError)
              }
              className="rounded-full border border-white/15 px-3 py-1 text-[10px] tracking-[0.2em] text-white transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {frameOverride !== null
                ? "LOCKED"
                : !motionPreferenceResolved
                  ? "SYNC"
                : shouldReduceMotion
                  ? "STATIC"
                  : isPaused
                    ? "PLAY"
                    : "PAUSE"}
            </button>
          </div>
        </div>
      ) : null}

      <div
        className={`bg-[radial-gradient(circle_at_top,#181312_0%,#09090a_64%)] ${
          captureMode ? "px-2 py-2 sm:px-3 sm:py-3" : "px-4 py-5 sm:px-6 sm:py-6"
        }`}
      >
        <div className="mx-auto max-w-[1240px]">
          <div className="relative mx-auto aspect-[1440/960] max-w-[1100px] overflow-hidden rounded-[24px] border border-white/10 bg-black/30">
            <div ref={hostRef} className="absolute inset-0" />
            {sceneError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/85 px-6 text-center">
                <p className="max-w-xl text-sm leading-relaxed text-[var(--text-muted)]">
                  {sceneError}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
