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
    (shouldReduceMotion
      ? stagedEmphasisPayoffFixtures.totalFrames - 1
      : null);
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
      textDelayedStack(progress, stagedEmphasisPayoffFixtures.units.length),
    [progress],
  );
  const emphasis = useMemo(() => emphasisTrack(progress), [progress]);
  const unitCount = stagedEmphasisPayoffFixtures.units.length;
  const unitWidth =
    stagedEmphasisPayoffFixtures.lineBox.width / unitCount;
  const emphasisX =
    stagedEmphasisPayoffFixtures.lineBox.x +
    unitWidth * stagedEmphasisPayoffFixtures.emphasisIndex;
  const payoffX =
    stagedEmphasisPayoffFixtures.lineBox.x +
    unitWidth * stagedEmphasisPayoffFixtures.payoffIndex;
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
      className={`relative overflow-hidden bg-[linear-gradient(180deg,rgba(248,246,241,0.05),rgba(248,246,241,0.02))] ${
        captureMode
          ? "rounded-[20px] border border-white/8"
          : "rounded-[28px] border border-white/10"
      }`}
    >
      {!captureMode ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-base-60)]">
              Text animator core proof
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Delayed word stack with one emphasis handoff and a single payoff
              settle
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-base)]">
              {frameLabel}
            </div>
            <button
              type="button"
              onClick={handleTogglePlayback}
              disabled={clampedFrameOverride !== null || shouldReduceMotion}
              className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-base)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPaused ? "Play" : "Pause"}
            </button>
          </div>
        </div>
      ) : null}

      <div className={captureMode ? "p-2" : "p-4 sm:p-6"}>
        <div className="relative overflow-hidden rounded-[24px] border border-white/8 bg-[#0f1014]">
          <div className="relative aspect-video">
            <svg
              viewBox={`0 0 ${stagedEmphasisPayoffFixtures.viewport.width} ${stagedEmphasisPayoffFixtures.viewport.height}`}
              className="absolute inset-0 h-full w-full"
              aria-label="Staged Emphasis Payoff reference work viewport"
              role="img"
            >
              <defs>
                <linearGradient
                  id="staged-emphasis-payoff-track"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="rgba(245,241,232,0)" />
                  <stop offset="50%" stopColor="#f6bf67" />
                  <stop offset="100%" stopColor="#ff7c58" />
                </linearGradient>
                <radialGradient
                  id="staged-emphasis-payoff-glow"
                  cx="50%"
                  cy="50%"
                  r="50%"
                >
                  <stop offset="0%" stopColor="#ffd48a" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#ffd48a" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect
                x="0"
                y="0"
                width={stagedEmphasisPayoffFixtures.viewport.width}
                height={stagedEmphasisPayoffFixtures.viewport.height}
                fill="#0f1014"
              />
              <rect
                x="0"
                y="0"
                width={stagedEmphasisPayoffFixtures.viewport.width}
                height="200"
                fill="rgba(255,255,255,0.025)"
              />

              <text
                x="112"
                y="112"
                fill="rgba(244,240,230,0.58)"
                fontSize="16"
                letterSpacing="5.2"
                style={{ textTransform: "uppercase" }}
              >
                TEXT DELAY / EMPHASIS HANDOFF / PAYOFF SETTLE
              </text>

              <line
                x1={stagedEmphasisPayoffFixtures.lineBox.x}
                y1="486"
                x2={
                  stagedEmphasisPayoffFixtures.lineBox.x +
                  stagedEmphasisPayoffFixtures.lineBox.width
                }
                y2="486"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="2"
              />
              <line
                x1={stagedEmphasisPayoffFixtures.lineBox.x}
                y1="514"
                x2={
                  stagedEmphasisPayoffFixtures.lineBox.x +
                  stagedEmphasisPayoffFixtures.lineBox.width
                }
                y2="514"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="2"
              />

              {stagedEmphasisPayoffFixtures.units.map((unit) => {
                const x =
                  stagedEmphasisPayoffFixtures.lineBox.x +
                  unitWidth * unit.index;

                return (
                  <line
                    key={unit.id}
                    x1={x}
                    y1="236"
                    x2={x}
                    y2="544"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="2"
                  />
                );
              })}

              <rect
                x={emphasisX + 18}
                y="470"
                width={unitWidth - 36}
                height="32"
                rx="16"
                fill="url(#staged-emphasis-payoff-glow)"
                opacity={0.12 + emphasis.emphasisAmount * 0.68}
              />
              <rect
                x={emphasisX + 24}
                y="484"
                width={(unitWidth - 48) * emphasis.emphasisAmount}
                height="4"
                rx="2"
                fill="url(#staged-emphasis-payoff-track)"
                opacity={0.25 + emphasis.emphasisAmount * 0.75}
              />
              <rect
                x={stagedEmphasisPayoffFixtures.lineBox.x}
                y="510"
                width={
                  stagedEmphasisPayoffFixtures.lineBox.width *
                  emphasis.payoffAmount
                }
                height="6"
                rx="3"
                fill="url(#staged-emphasis-payoff-track)"
                opacity={0.2 + emphasis.payoffAmount * 0.8}
              />
              <circle
                cx={payoffX + unitWidth / 2}
                cy="488"
                r={mix(6, 18, emphasis.handoffAmount)}
                fill="url(#staged-emphasis-payoff-glow)"
                opacity={0.16 + emphasis.handoffAmount * 0.5}
              />

              <text
                x="112"
                y="620"
                fill="rgba(245,241,232,0.44)"
                fontSize="18"
              >
                single phrase / one emphasis event / one payoff frame
              </text>
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
              <div
                className="grid h-full items-center"
                style={{
                  gridTemplateColumns: `repeat(${unitCount}, minmax(0, 1fr))`,
                }}
              >
                {stagedEmphasisPayoffFixtures.units.map((unit, index) => {
                  const state = unitStates[index];
                  const isEmphasisUnit =
                    index === stagedEmphasisPayoffFixtures.emphasisIndex;
                  const isPayoffUnit =
                    index === stagedEmphasisPayoffFixtures.payoffIndex;
                  const emphasisAmount = isEmphasisUnit
                    ? emphasis.emphasisAmount
                    : 0;
                  const payoffAmount = isPayoffUnit ? emphasis.handoffAmount : 0;

                  return (
                    <div
                      key={unit.id}
                      className="flex justify-center overflow-visible px-2 text-center"
                    >
                      <span
                        className="font-sans text-[clamp(2rem,4.7vw,4.7rem)] font-semibold tracking-[-0.06em] text-white"
                        style={{
                          color: isEmphasisUnit
                            ? `rgba(255, ${mix(
                                241,
                                215,
                                emphasisAmount,
                              )}, ${mix(232, 170, emphasisAmount)}, 1)`
                            : "rgba(245,241,232,0.96)",
                          filter: `blur(${state.blur}px)`,
                          opacity: Math.min(
                            1,
                            state.opacity + payoffAmount * 0.08,
                          ),
                          textShadow:
                            emphasisAmount > 0
                              ? `0 0 ${mix(
                                  6,
                                  28,
                                  emphasis.pulseAmount,
                                )}px rgba(255,198,118,0.45)`
                              : payoffAmount > 0
                                ? `0 0 ${mix(
                                    4,
                                    16,
                                    payoffAmount,
                                  )}px rgba(255,255,255,0.22)`
                                : "none",
                          transform: `translateY(${state.translateY}px) scale(${mix(
                            0.94,
                            1 + emphasisAmount * 0.08 + payoffAmount * 0.05,
                            state.reveal,
                          )})`,
                        }}
                      >
                        {unit.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
