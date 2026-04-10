"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";
import { temporalEchoResidueConfig } from "./temporal-echo-residue.config";
import {
  evaluateTemporalEchoResidueFrame,
  getTemporalEchoResidueReducedMotionFrame,
} from "./temporal-echo-residue.evaluator";
import { createTemporalEchoResidueScene } from "./temporal-echo-residue-scene";

type TemporalEchoResidueSurfaceProps = {
  autoPlay?: boolean;
  captureMode?: boolean;
  frameOverride?: number | null;
};

export function TemporalEchoResidueSurface({
  autoPlay = true,
  captureMode = false,
  frameOverride = null,
}: TemporalEchoResidueSurfaceProps) {
  const prefersReducedMotion = useReducedMotion();
  const hasMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const shouldReduceMotion = hasMounted && Boolean(prefersReducedMotion);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef(0);
  const baseFrameRef = useRef(0);
  const playbackStartTimeRef = useRef<number | null>(null);

  const [frame, setFrame] = useState(0);
  const [isPaused, setIsPaused] = useState(
    frameOverride !== null || !autoPlay,
  );
  const [isReady, setIsReady] = useState(false);
  const [rendererLabel, setRendererLabel] = useState("Pixi init");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let rafId = 0;
    let sceneDestroy: (() => void) | null = null;

    const renderFrame = (nextFrame: number) => {
      const boundedFrame = Math.max(
        0,
        Math.min(temporalEchoResidueConfig.durationFrames - 1, nextFrame),
      );

      frameRef.current = boundedFrame;
      setFrame(boundedFrame);
    };

    const start = async () => {
      if (!hostRef.current) {
        return;
      }

      setErrorMessage(null);
      setIsReady(false);

      try {
        const scene = await createTemporalEchoResidueScene({
          host: hostRef.current,
        });

        if (!mounted) {
          scene.destroy();
          return;
        }

        sceneDestroy = scene.destroy;
        setRendererLabel(scene.rendererName);
        setIsReady(true);

        const paint = (nextFrame: number) => {
          scene.update(evaluateTemporalEchoResidueFrame(nextFrame));
          renderFrame(nextFrame);
        };

        const staticFrame =
          frameOverride ??
          (shouldReduceMotion ? getTemporalEchoResidueReducedMotionFrame() : 0);

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
            (1000 / temporalEchoResidueConfig.fps);
          const nextFrame =
            (baseFrameRef.current + elapsedFrames) %
            temporalEchoResidueConfig.durationFrames;

          paint(nextFrame);
          rafId = requestAnimationFrame(loop);
        };

        if (frameOverride === null && !shouldReduceMotion && !isPaused) {
          rafId = requestAnimationFrame(loop);
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        const detail =
          error instanceof Error ? error.message : "Unknown initialization failure.";

        setRendererLabel("Pixi failed");
        setErrorMessage(
          `Temporal Echo Residue scene failed to initialize: ${detail}`,
        );
      }
    };

    void start();

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
      sceneDestroy?.();
    };
  }, [frameOverride, isPaused, shouldReduceMotion]);

  const handleTogglePlayback = () => {
    if (frameOverride !== null || shouldReduceMotion || errorMessage) {
      return;
    }

    baseFrameRef.current = frameRef.current;
    playbackStartTimeRef.current = null;
    setIsPaused((current) => !current);
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
              Internal Reference Route
            </p>
            <h2 className="mt-1 text-sm font-medium tracking-[0.16em] text-[var(--text-base)]">
              Temporal Echo Residue
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
            <span>{Math.round(frame).toString().padStart(3, "0")}f</span>
            <span className="h-1 w-1 rounded-full bg-white/25" />
            <span>{rendererLabel}</span>
            <span className="h-1 w-1 rounded-full bg-white/25" />
            <span>{isReady ? "Surface Ready" : "Surface Loading"}</span>
            <button
              type="button"
              onClick={handleTogglePlayback}
              disabled={
                frameOverride !== null ||
                shouldReduceMotion ||
                !isReady ||
                errorMessage !== null
              }
              className="rounded-full border border-white/15 px-3 py-1 text-[10px] tracking-[0.2em] text-white transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {frameOverride !== null
                ? "LOCKED"
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
        className={`bg-[radial-gradient(circle_at_top,rgba(19,30,46,0.7)_0%,#08090d_62%)] ${
          captureMode ? "px-2 py-2 sm:px-3 sm:py-3" : "px-4 py-5 sm:px-6 sm:py-6"
        }`}
      >
        <div className="mx-auto max-w-[1120px]">
          <div className="relative mx-auto aspect-[4/3] max-w-[960px] overflow-hidden rounded-[24px] border border-white/10 bg-black/30">
            <div ref={hostRef} className="absolute inset-0" />

            {errorMessage ? (
              <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-relaxed text-red-100">
                {errorMessage}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
