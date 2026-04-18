"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { stagedEmphasisPayoffFixtures } from "./fixtures";
import {
  emphasisTrack,
  textDelayedStack,
} from "./staged-emphasis-family";

type StagedEmphasisPayoffSurfaceProps = {
  autoPlay?: boolean;
  captureMode?: boolean;
  frameOverride?: number | null;
};

function toViewportPercent(value: number, total: number) {
  return `${(value / total) * 100}%`;
}

function mix(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

function clampFrame(frame: number) {
  return Math.min(
    Math.max(0, Math.round(frame)),
    stagedEmphasisPayoffFixtures.totalFrames - 1,
  );
}

export function StagedEmphasisPayoffSurface({
  autoPlay = true,
  captureMode = false,
  frameOverride = null,
}: StagedEmphasisPayoffSurfaceProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = Boolean(prefersReducedMotion);
  const [animatedFrame, setAnimatedFrame] = useState(0);
  const [isManuallyPaused, setIsManuallyPaused] = useState(!autoPlay);
  const playbackBaseFrameRef = useRef(0);
  const playbackStartTimeRef = useRef<number | null>(null);
  const animatedFrameRef = useRef(0);
  const clampedFrameOverride =
    frameOverride === null ? null : clampFrame(frameOverride);
  const forcedFrame =
    clampedFrameOverride ??
    (shouldReduceMotion ? stagedEmphasisPayoffFixtures.reducedMotionFrame : null);
  const frame = forcedFrame ?? animatedFrame;
  const isPaused = forcedFrame !== null || isManuallyPaused;

  useEffect(() => {
    animatedFrameRef.current = animatedFrame;
  }, [animatedFrame]);

  useEffect(() => {
    if (clampedFrameOverride !== null || shouldReduceMotion || isPaused) {
      return;
    }

    let rafId = 0;
    playbackBaseFrameRef.current = animatedFrameRef.current;
    playbackStartTimeRef.current = null;

    const loop = (timestamp: number) => {
      if (playbackStartTimeRef.current === null) {
        playbackStartTimeRef.current = timestamp;
      }

      const elapsedFrames =
        (timestamp - playbackStartTimeRef.current) /
        (1000 / stagedEmphasisPayoffFixtures.fps);
      const nextFrame =
        (playbackBaseFrameRef.current + elapsedFrames) %
        stagedEmphasisPayoffFixtures.totalFrames;

      setAnimatedFrame(nextFrame);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [clampedFrameOverride, isPaused, shouldReduceMotion]);

  const progress = frame / (stagedEmphasisPayoffFixtures.totalFrames - 1);
  const unitStates = useMemo(
    () =>
      textDelayedStack(
        progress,
        stagedEmphasisPayoffFixtures.units,
        stagedEmphasisPayoffFixtures.stackTiming,
      ),
    [progress],
  );
  const emphasis = useMemo(
    () => emphasisTrack(progress, stagedEmphasisPayoffFixtures.emphasisTiming),
    [progress],
  );
  const frameLabel = `${Math.round(frame)
    .toString()
    .padStart(3, "0")} / ${stagedEmphasisPayoffFixtures.totalFrames}`;

  const handleTogglePlayback = () => {
    if (captureMode || clampedFrameOverride !== null || shouldReduceMotion) {
      return;
    }

    playbackBaseFrameRef.current = animatedFrameRef.current;
    playbackStartTimeRef.current = null;
    setIsManuallyPaused((current) => !current);
  };

  return (
    <div
      className={`relative overflow-hidden bg-[#f4f4f0] ${
        captureMode
          ? "rounded-[20px] border border-black/8"
          : "rounded-[28px] border border-black/10 shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
      }`}
    >
      {!captureMode ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/8 px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/55">
              First-source benchmark runtime pass
            </p>
            <p className="mt-1 text-sm text-black/55">
              Grapheme entry, short payoff hold, and delayed disappearance
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-black/75">
              {frameLabel}
            </div>
            <button
              type="button"
              onClick={handleTogglePlayback}
              disabled={clampedFrameOverride !== null || shouldReduceMotion}
              className="rounded-full border border-black/12 bg-black/[0.03] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-black/75 transition hover:bg-black/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPaused ? "Play" : "Pause"}
            </button>
          </div>
        </div>
      ) : null}

      <div className={captureMode ? "p-2" : "p-4 sm:p-6"}>
        <div className="relative overflow-hidden rounded-[24px] border border-black/8 bg-[#f5f4ef]">
          <div className="relative aspect-[2/1]">
            <svg
              viewBox={`0 0 ${stagedEmphasisPayoffFixtures.viewport.width} ${stagedEmphasisPayoffFixtures.viewport.height}`}
              className="absolute inset-0 h-full w-full"
              aria-label="Staged Emphasis Payoff reference work viewport"
              role="img"
            >
              <rect
                x="0"
                y="0"
                width={stagedEmphasisPayoffFixtures.viewport.width}
                height={stagedEmphasisPayoffFixtures.viewport.height}
                fill="#f5f4ef"
              />
            </svg>

            <div
              className="absolute"
              style={{
                left: toViewportPercent(
                  stagedEmphasisPayoffFixtures.lineBox.x,
                  stagedEmphasisPayoffFixtures.viewport.width,
                ),
                top: toViewportPercent(
                  stagedEmphasisPayoffFixtures.lineBox.y,
                  stagedEmphasisPayoffFixtures.viewport.height,
                ),
                width: toViewportPercent(
                  stagedEmphasisPayoffFixtures.lineBox.width,
                  stagedEmphasisPayoffFixtures.viewport.width,
                ),
                height: toViewportPercent(
                  stagedEmphasisPayoffFixtures.lineBox.height,
                  stagedEmphasisPayoffFixtures.viewport.height,
                ),
              }}
            >
              <div className="flex h-full items-center justify-center overflow-visible">
                <div
                  className="flex items-center justify-center whitespace-nowrap"
                  style={{
                    fontFamily: "var(--font-geist-sans), sans-serif",
                    fontSize: "clamp(4.2rem, 9vw, 6.9rem)",
                    fontWeight: 800,
                    letterSpacing: "-0.095em",
                    lineHeight: 0.92,
                    transform: `scaleX(${mix(
                      0.82,
                      0.88,
                      emphasis.handoffAmount,
                    )})`,
                    transformOrigin: "center center",
                  }}
                >
                  {stagedEmphasisPayoffFixtures.units.map((unit, index) => {
                    const state = unitStates[index];
                    const isFocusUnit =
                      !unit.isGap &&
                      stagedEmphasisPayoffFixtures.focusClusterIndices.some(
                        (clusterIndex) => clusterIndex === unit.clusterIndex,
                      );
                    const focusAmount = isFocusUnit
                      ? emphasis.emphasisAmount * (1 - emphasis.releaseAmount * 0.72)
                      : 0;
                    const payoffLift = emphasis.payoffAmount * 0.02;
                    const grayTone = mix(
                      0,
                      150,
                      focusAmount * 0.68 + state.release * 0.74,
                    );

                    if (unit.isGap) {
                      return (
                        <span
                          key={unit.id}
                          aria-hidden="true"
                          className="inline-block"
                          style={{
                            width: "0.32em",
                            opacity: state.opacity,
                          }}
                        >
                          &nbsp;
                        </span>
                      );
                    }

                    return (
                      <span
                        key={unit.id}
                        className="inline-block"
                        style={{
                          color: `rgb(${grayTone}, ${grayTone}, ${grayTone})`,
                          filter: `blur(${state.blur}px)`,
                          opacity: state.opacity,
                          transform: `translate3d(${state.translateX}px, ${
                            state.translateY - focusAmount * 6
                          }px, 0) scale(${state.scale + focusAmount * 0.025 + payoffLift})`,
                          transformOrigin: "center bottom",
                        }}
                      >
                        {unit.text}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
