"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { anchoredProgressResolveFixtures } from "./fixtures";
import {
  anchoredFill,
  blinkChannel,
  progressStateMachine,
  resolveState,
} from "./anchored-progress-resolve.logic";

type AnchoredProgressResolveSurfaceProps = {
  autoPlay?: boolean;
  captureMode?: boolean;
  frameOverride?: number | null;
};

const phaseToneMap = {
  loading: {
    label: "Loading",
    detail: "fill advances from a locked origin",
  },
  waiting: {
    label: "Waiting",
    detail: "anchor holds while channels keep breathing",
  },
  resolve: {
    label: "Resolve",
    detail: "same anchor completes and snaps into confirmation",
  },
} as const;

export function AnchoredProgressResolveSurface({
  autoPlay = true,
  captureMode = false,
  frameOverride = null,
}: AnchoredProgressResolveSurfaceProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = Boolean(prefersReducedMotion);
  const [animatedFrame, setAnimatedFrame] = useState(0);
  const [isManuallyPaused, setIsManuallyPaused] = useState(!autoPlay);
  const playbackBaseFrameRef = useRef(0);
  const playbackStartTimeRef = useRef<number | null>(null);
  const animatedFrameRef = useRef(0);
  const forcedFrame =
    frameOverride ?? (shouldReduceMotion ? anchoredProgressResolveFixtures.totalFrames - 1 : null);
  const frame = forcedFrame ?? animatedFrame;
  const isPaused = forcedFrame !== null || isManuallyPaused;

  useEffect(() => {
    animatedFrameRef.current = animatedFrame;
  }, [animatedFrame]);

  useEffect(() => {
    if (frameOverride !== null || shouldReduceMotion || isPaused) {
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
        (1000 / anchoredProgressResolveFixtures.fps);
      const nextFrame =
        (playbackBaseFrameRef.current + elapsedFrames) %
        anchoredProgressResolveFixtures.totalFrames;

      setAnimatedFrame(nextFrame);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [frameOverride, isPaused, shouldReduceMotion]);

  const state = useMemo(() => progressStateMachine(frame), [frame]);
  const fillState = useMemo(
    () => anchoredFill(state.anchoredProgress),
    [state.anchoredProgress],
  );
  const blinkState = useMemo(() => blinkChannel(state), [state]);
  const resolveVisuals = useMemo(() => resolveState(state), [state]);

  const {
    viewport,
    rail,
    checkpointXs,
    laneYs,
  } = anchoredProgressResolveFixtures;
  const phaseTone = phaseToneMap[state.phase];
  const progressPercent = Math.round(state.anchoredProgress * 100);

  const handleTogglePlayback = () => {
    if (captureMode || frameOverride !== null || shouldReduceMotion) {
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
              UI-state motion proof
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {phaseTone.label}: {phaseTone.detail}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-base)]">
              {progressPercent}%
            </div>
            <button
              type="button"
              onClick={handleTogglePlayback}
              disabled={frameOverride !== null || shouldReduceMotion}
              className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-base)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPaused ? "Play" : "Pause"}
            </button>
          </div>
        </div>
      ) : null}

      <div className={captureMode ? "p-2" : "p-4 sm:p-6"}>
        <div className="relative overflow-hidden rounded-[24px] border border-white/8 bg-[#0f1014]">
          <svg
            viewBox={`0 0 ${viewport.width} ${viewport.height}`}
            className="block h-auto w-full"
            aria-label="Anchored Progress Resolve reference work viewport"
            role="img"
          >
            <defs>
              <linearGradient id="anchored-progress-fill" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f2e8cf" />
                <stop offset="60%" stopColor="#f4b860" />
                <stop offset="100%" stopColor="#ff7c58" />
              </linearGradient>
              <radialGradient id="anchored-progress-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffd37a" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#ffd37a" stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect x="0" y="0" width={viewport.width} height={viewport.height} fill="#0f1014" />
            <rect x="0" y="0" width={viewport.width} height="188" fill="rgba(255,255,255,0.02)" />

            <text
              x="120"
              y="116"
              fill="rgba(244,240,230,0.6)"
              fontSize="16"
              letterSpacing="5.2"
              style={{ textTransform: "uppercase" }}
            >
              ANCHORED PROGRESS / STATE TRANSITION
            </text>
            <text
              x="120"
              y="188"
              fill="#f5f1e8"
              fontSize="72"
              fontWeight="600"
              letterSpacing="-2.8"
            >
              {phaseTone.label}
            </text>
            <text
              x="120"
              y="228"
              fill="rgba(245,241,232,0.62)"
              fontSize="24"
            >
              {phaseTone.detail}
            </text>

            {laneYs.map((laneY, index) => (
              <g key={laneY}>
                <line
                  x1={rail.x}
                  y1={laneY}
                  x2={fillState.headX}
                  y2={laneY}
                  stroke={`rgba(255,198,118,${blinkState.laneOpacity[index]})`}
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1={fillState.headX + 10}
                  y1={laneY}
                  x2={rail.x + rail.width}
                  y2={laneY}
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            ))}

            <rect
              x={rail.x}
              y={rail.y}
              width={rail.width}
              height={rail.height}
              rx={rail.radius}
              fill="rgba(255,255,255,0.09)"
            />
            <rect
              x={rail.x}
              y={rail.y}
              width={fillState.width}
              height={rail.height}
              rx={rail.radius}
              fill="url(#anchored-progress-fill)"
            />
            <rect
              x={rail.x}
              y={rail.y + rail.height + 16}
              width={fillState.width}
              height="3"
              rx="1.5"
              fill="rgba(255,190,104,0.9)"
            />

            {checkpointXs.map((checkpointX, index) => (
              <g key={checkpointX}>
                <line
                  x1={checkpointX}
                  y1={rail.y - 24}
                  x2={checkpointX}
                  y2={rail.y + 48}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="2"
                />
                <circle
                  cx={checkpointX}
                  cy={rail.y + rail.height / 2}
                  r="9"
                  fill="#111218"
                  stroke={`rgba(255,208,132,${blinkState.nodeOpacity[index]})`}
                  strokeWidth="3"
                />
              </g>
            ))}

            <circle
              cx={fillState.glowX}
              cy={rail.y + rail.height / 2}
              r={blinkState.pulseRadius}
              fill="url(#anchored-progress-glow)"
              opacity={0.85}
            />
            <circle
              cx={fillState.headX}
              cy={rail.y + rail.height / 2}
              r="14"
              fill="#0f1014"
              stroke="#ffe2ac"
              strokeWidth="4"
            />
            <circle
              cx={rail.x}
              cy={rail.y + rail.height / 2}
              r="20"
              fill="#0f1014"
              stroke="#f7f0dc"
              strokeWidth="4"
            />
            <circle
              cx={rail.x}
              cy={rail.y + rail.height / 2}
              r="6"
              fill="#f7f0dc"
            />

            <circle
              cx={rail.x + rail.width}
              cy={rail.y + rail.height / 2}
              r={36 * resolveVisuals.ringScale}
              fill="none"
              stroke={`rgba(190,255,209,${resolveVisuals.ringOpacity})`}
              strokeWidth="4"
            />
            <circle
              cx={rail.x + rail.width}
              cy={rail.y + rail.height / 2}
              r="20"
              fill={`rgba(145,255,187,${0.12 + resolveVisuals.flashOpacity})`}
              stroke="rgba(196,255,214,0.4)"
              strokeWidth="2"
            />
            <polyline
              points={`${rail.x + rail.width - 14},${rail.y + 9} ${rail.x + rail.width - 2},${rail.y + 21} ${rail.x + rail.width + 18},${rail.y - 3}`}
              fill="none"
              stroke={`rgba(231,255,238,${resolveVisuals.checkOpacity})`}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              transform={`translate(0 0) scale(${resolveVisuals.checkScale})`}
              style={{
                transformOrigin: `${rail.x + rail.width}px ${rail.y + rail.height / 2}px`,
              }}
            />

            <g transform={`translate(120 ${470 + resolveVisuals.labelShift})`}>
              <text
                x="0"
                y="0"
                fill="rgba(245,241,232,0.46)"
                fontSize="18"
                letterSpacing="4.4"
              >
                FIXED ANCHOR
              </text>
              <text
                x="0"
                y="52"
                fill="#f5f1e8"
                fontSize="42"
                fontWeight="600"
              >
                one origin, one rail, one completion event
              </text>
              <text
                x="0"
                y="94"
                fill="rgba(245,241,232,0.62)"
                fontSize="22"
              >
                progress never re-roots during loading, waiting, or resolve
              </text>
            </g>

            <g transform="translate(950 504)">
              <rect
                x="0"
                y="0"
                width="220"
                height="120"
                rx="22"
                fill="rgba(255,255,255,0.04)"
                stroke="rgba(255,255,255,0.08)"
              />
              <text
                x="24"
                y="38"
                fill="rgba(245,241,232,0.52)"
                fontSize="16"
                letterSpacing="3.2"
              >
                STATE
              </text>
              <text
                x="24"
                y="76"
                fill="#f5f1e8"
                fontSize="30"
                fontWeight="600"
              >
                {state.phase.toUpperCase()}
              </text>
              <text
                x="24"
                y="104"
                fill="rgba(245,241,232,0.62)"
                fontSize="16"
              >
                frame {Math.floor(state.frame).toString().padStart(3, "0")}
              </text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
