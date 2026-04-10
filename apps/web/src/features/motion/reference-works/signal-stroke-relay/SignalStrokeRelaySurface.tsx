"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { useReducedMotion } from "motion/react";
import { signalStrokeRelayFixtures } from "./fixtures";
import {
  evaluateSignalStrokeRelayFrame,
  getSignalStrokeRelayPayoffFrame,
  resolveMatchCutAnchorPoint,
} from "./signal-stroke-relay.evaluator";
import { signalStrokeRelayConfig } from "./signal-stroke-relay.config";
import {
  ensureSignalStrokeRelayStudio,
  getSignalStrokeRelayAuthoringDefaults,
  hideSignalStrokeRelayStudio,
  showSignalStrokeRelayStudio,
  subscribeSignalStrokeRelayAuthoring,
  subscribeSignalStrokeRelaySequencePosition,
  syncSignalStrokeRelaySequencePosition,
  waitForSignalStrokeRelayProjectReady,
} from "./theatre-sheet";
import {
  measureSvgPaths,
  pointAtPath,
  trimStrokeStyles,
  type SvgMetricMap,
} from "./svg-metrics";

type PathRefMap = MutableRefObject<Record<string, SVGPathElement | null>>;

type SignalStrokeRelaySurfaceProps = {
  autoPlay?: boolean;
  captureMode?: boolean;
  frameOverride?: number | null;
};

function createPathRefSetter(pathRefs: PathRefMap, pathId: string) {
  return (node: SVGPathElement | null) => {
    pathRefs.current[pathId] = node;
  };
}

export function SignalStrokeRelaySurface({
  autoPlay = true,
  captureMode = false,
  frameOverride = null,
}: SignalStrokeRelaySurfaceProps) {
  const isDev = process.env.NODE_ENV !== "production";
  const prefersReducedMotion = useReducedMotion();
  const shouldReduceMotion = Boolean(prefersReducedMotion);
  const clipId = useId();
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({
    lead: null,
    icon: null,
    underline: null,
  });
  const titleRef = useRef<SVGTextElement | null>(null);
  const syncLockRef = useRef(false);
  const authoringRef = useRef(getSignalStrokeRelayAuthoringDefaults());
  const playbackBaseFrameRef = useRef(0);
  const playbackStartTimeRef = useRef<number | null>(null);

  const [authoring, setAuthoring] = useState(getSignalStrokeRelayAuthoringDefaults);
  const [frame, setFrame] = useState(0);
  const [isPaused, setIsPaused] = useState(
    Boolean(prefersReducedMotion) || frameOverride !== null || !autoPlay,
  );
  const [isTheatreReady, setIsTheatreReady] = useState(false);
  const [isStudioLoaded, setIsStudioLoaded] = useState(false);
  const [isStudioVisible, setIsStudioVisible] = useState(false);
  const [metrics, setMetrics] = useState<SvgMetricMap>({});
  const [titleWidth, setTitleWidth] = useState<number>(
    signalStrokeRelayFixtures.titleWidth,
  );

  authoringRef.current = authoring;

  useEffect(() => {
    const updateMeasurements = () => {
      setMetrics(measureSvgPaths(pathRefs.current));

      if (titleRef.current) {
        const bounds = titleRef.current.getBBox();
        setTitleWidth(Math.max(bounds.width, signalStrokeRelayFixtures.titleWidth));
      }
    };

    updateMeasurements();
    const rafId = requestAnimationFrame(updateMeasurements);
    return () => cancelAnimationFrame(rafId);
  }, [authoring.title.trackingEm]);

  useEffect(() => {
    let mounted = true;

    const unsubscribeAuthoring = subscribeSignalStrokeRelayAuthoring((next) => {
      if (!mounted) {
        return;
      }
      setAuthoring(next);
    });

    const unsubscribeSequence = subscribeSignalStrokeRelaySequencePosition((seconds) => {
      if (!mounted || syncLockRef.current || shouldReduceMotion || !isPaused) {
        return;
      }

      const nextFrame =
        (seconds * signalStrokeRelayConfig.fps) %
        Math.max(authoringRef.current.global.durationFrames, 1);
      playbackBaseFrameRef.current = nextFrame;
      playbackStartTimeRef.current = null;
      setIsPaused(true);
      setFrame(nextFrame);
    });

    waitForSignalStrokeRelayProjectReady().then(() => {
      if (mounted) {
        setIsTheatreReady(true);
      }
    });

    return () => {
      mounted = false;
      unsubscribeAuthoring();
      unsubscribeSequence();
    };
  }, [isPaused, shouldReduceMotion]);

  useEffect(() => {
    return () => {
      void hideSignalStrokeRelayStudio();
    };
  }, []);

  useEffect(() => {
    if (frameOverride === null) {
      return;
    }

    playbackBaseFrameRef.current = frameOverride;
    playbackStartTimeRef.current = null;
    setFrame(frameOverride);
    setIsPaused(true);
  }, [frameOverride]);

  useEffect(() => {
    if (!shouldReduceMotion) {
      return;
    }

    const payoffFrame = getSignalStrokeRelayPayoffFrame(authoring);
    playbackBaseFrameRef.current = payoffFrame;
    playbackStartTimeRef.current = null;
    setFrame(payoffFrame);
    setIsPaused(true);
  }, [authoring, shouldReduceMotion]);

  useEffect(() => {
    if (frameOverride !== null || shouldReduceMotion || isPaused) {
      return;
    }

    let rafId = 0;
    playbackBaseFrameRef.current = frame;
    playbackStartTimeRef.current = null;

    const loop = (timestamp: number) => {
      if (playbackStartTimeRef.current === null) {
        playbackStartTimeRef.current = timestamp;
      }

      const elapsedFrames =
        ((timestamp - playbackStartTimeRef.current) / (1000 / signalStrokeRelayConfig.fps)) *
        authoring.global.playbackRate;
      const durationFrames = Math.max(authoring.global.durationFrames, 1);
      const nextFrame = (playbackBaseFrameRef.current + elapsedFrames) % durationFrames;

      setFrame(nextFrame);
      syncLockRef.current = true;
      syncSignalStrokeRelaySequencePosition(nextFrame / signalStrokeRelayConfig.fps);
      syncLockRef.current = false;

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [
    authoring.global.durationFrames,
    authoring.global.playbackRate,
    frame,
    frameOverride,
    isPaused,
    shouldReduceMotion,
  ]);

  const frameState = evaluateSignalStrokeRelayFrame({
    frame,
    authoring,
    titleWidth,
  });

  const leadStyles = trimStrokeStyles(metrics.lead, frameState.leadTrim);
  const iconStyles = trimStrokeStyles(metrics.icon, frameState.iconTrim);
  const underlineStyles = trimStrokeStyles(metrics.underline, frameState.underlineTrim);

  const leadHeadPoint =
    pointAtPath(pathRefs.current.lead, metrics.lead, frameState.leadHeadT) ??
    signalStrokeRelayFixtures.anchors["lead-exit"];
  const batonPoint = resolveMatchCutAnchorPoint(frameState.baton);
  const iconCenter = signalStrokeRelayFixtures.anchors["icon-center"];
  const pathRefSetter = (pathId: "lead" | "icon" | "underline") =>
    createPathRefSetter(pathRefs, pathId);

  const handleTogglePlayback = () => {
    if (captureMode || frameOverride !== null || shouldReduceMotion) {
      return;
    }

    playbackBaseFrameRef.current = frame;
    playbackStartTimeRef.current = null;
    setIsPaused((current) => !current);
  };

  const handleToggleStudio = () => {
    if (!isDev) {
      return;
    }

    if (!isStudioLoaded || !isStudioVisible) {
      void showSignalStrokeRelayStudio().then((studio) => {
        setIsStudioLoaded(Boolean(studio));
        setIsStudioVisible(Boolean(studio && !studio.ui.isHidden));
      });
      return;
    }

    void hideSignalStrokeRelayStudio().then(() => {
      setIsStudioVisible(false);
    });
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
              Signal Stroke Relay
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
            <span>{Math.round(frame).toString().padStart(3, "0")}f</span>
            <span className="h-1 w-1 rounded-full bg-white/25" />
            <span>{isTheatreReady ? "Theatre Ready" : "Theatre Loading"}</span>
            <span className="h-1 w-1 rounded-full bg-white/25" />
            <span>
              {isStudioVisible
                ? "Studio On"
                : isDev
                  ? isStudioLoaded
                    ? "Studio Hidden"
                    : "Studio Idle"
                  : "Studio Off"}
            </span>
            {isDev ? (
              <button
                type="button"
                onClick={handleToggleStudio}
                className="ml-2 rounded-full border border-white/15 px-3 py-1 text-[10px] tracking-[0.2em] text-white transition hover:border-white/35 hover:text-white"
              >
                {isStudioVisible
                  ? "HIDE STUDIO"
                  : isStudioLoaded
                    ? "SHOW STUDIO"
                    : "LOAD STUDIO"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleTogglePlayback}
              disabled={frameOverride !== null || shouldReduceMotion}
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
        className={`relative bg-[radial-gradient(circle_at_top,#1a1a1a_0%,#090909_60%)] ${
          captureMode ? "px-2 py-2 sm:px-3 sm:py-3" : "px-4 py-5 sm:px-6 sm:py-6"
        }`}
      >
        <svg
          viewBox={`0 0 ${signalStrokeRelayConfig.viewBoxWidth} ${signalStrokeRelayConfig.viewBoxHeight}`}
          className="h-auto w-full"
          role="img"
          aria-label="Signal Stroke Relay reference work viewport"
        >
          <defs>
            <linearGradient id={`${clipId}-signal-accent`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={signalStrokeRelayConfig.palette.accentSoft} />
              <stop offset="42%" stopColor={signalStrokeRelayConfig.palette.accent} />
              <stop offset="100%" stopColor={signalStrokeRelayConfig.palette.accentHighlight} />
            </linearGradient>
            <clipPath id={`${clipId}-title-mask`}>
              <rect
                x={signalStrokeRelayFixtures.titlePosition.x - 6}
                y={signalStrokeRelayFixtures.titlePosition.y - 52}
                width={frameState.titleMaskWidth}
                height={92}
                rx={16}
              />
            </clipPath>
          </defs>

          <rect
            x="0"
            y="0"
            width={signalStrokeRelayConfig.viewBoxWidth}
            height={signalStrokeRelayConfig.viewBoxHeight}
            fill={signalStrokeRelayConfig.palette.background}
          />

          {Array.from({ length: 12 }).map((_, index) => (
            <line
              key={`grid-x-${index}`}
              x1={96 + index * 104}
              y1={68}
              x2={96 + index * 104}
              y2={460}
              stroke={signalStrokeRelayConfig.palette.grid}
              strokeWidth="1"
            />
          ))}
          {Array.from({ length: 6 }).map((_, index) => (
            <line
              key={`grid-y-${index}`}
              x1={96}
              y1={92 + index * 72}
              x2={1310}
              y2={92 + index * 72}
              stroke={signalStrokeRelayConfig.palette.grid}
              strokeWidth="1"
            />
          ))}

          {signalStrokeRelayFixtures.guideLines.map((guide, index) => (
            <line
              key={`guide-${index}`}
              {...guide}
              stroke={signalStrokeRelayConfig.palette.textMuted}
              strokeWidth="1"
              strokeDasharray="6 12"
              opacity="0.28"
            />
          ))}

          <text
            x="108"
            y="92"
            fill={signalStrokeRelayConfig.palette.textMuted}
            className="font-mono"
            style={{ fontSize: 14, letterSpacing: "0.18em", textTransform: "uppercase" }}
          >
            {signalStrokeRelayFixtures.eyebrow}
          </text>

          <text
            x="108"
            y="126"
            fill={signalStrokeRelayConfig.palette.text}
            className="font-sans"
            style={{ fontSize: 28, letterSpacing: "0.08em", fontWeight: 600 }}
          >
            {signalStrokeRelayFixtures.subtitle}
          </text>

          <g opacity={frameState.sceneOpacity}>
            <path
              ref={pathRefSetter("lead")}
              d={signalStrokeRelayFixtures.paths.lead}
              fill="none"
              stroke={`url(#${clipId}-signal-accent)`}
              strokeWidth={authoring.signal.strokeWidth + authoring.signal.accentWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={leadStyles.strokeDasharray}
              strokeDashoffset={leadStyles.strokeDashoffset}
              opacity={leadStyles.opacity * 0.38}
            />
            <path
              d={signalStrokeRelayFixtures.paths.lead}
              fill="none"
              stroke={signalStrokeRelayConfig.palette.accent}
              strokeWidth={authoring.signal.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={leadStyles.strokeDasharray}
              strokeDashoffset={leadStyles.strokeDashoffset}
              opacity={leadStyles.opacity}
            />

            <path
              ref={pathRefSetter("icon")}
              d={signalStrokeRelayFixtures.paths.icon}
              fill="none"
              stroke={signalStrokeRelayConfig.palette.anchor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={iconStyles.strokeDasharray}
              strokeDashoffset={iconStyles.strokeDashoffset}
              opacity={iconStyles.opacity * frameState.iconOpacity}
              transform={`translate(${iconCenter.x} ${iconCenter.y - frameState.iconTranslateY}) scale(${frameState.iconScale}) translate(${-iconCenter.x} ${-iconCenter.y})`}
            />

            <circle
              cx={leadHeadPoint.x}
              cy={leadHeadPoint.y}
              r="5"
              fill={signalStrokeRelayConfig.palette.anchor}
              opacity={frameState.leadTrim.visible ? 1 : 0}
            />

            <g opacity={frameState.baton.continuityWeight * frameState.sceneOpacity}>
              <circle
                cx={batonPoint.x}
                cy={batonPoint.y}
                r="7"
                fill={signalStrokeRelayConfig.palette.anchor}
              />
              <rect
                x={batonPoint.x - 18}
                y={batonPoint.y - 2}
                width="36"
                height="4"
                rx="2"
                fill={signalStrokeRelayConfig.palette.anchor}
                opacity="0.55"
              />
            </g>

            <g clipPath={`url(#${clipId}-title-mask)`}>
              <text
                ref={titleRef}
                x={signalStrokeRelayFixtures.titlePosition.x}
                y={signalStrokeRelayFixtures.titlePosition.y - frameState.titleTranslateY}
                fill={signalStrokeRelayConfig.palette.text}
                className="font-sans"
                style={{
                  fontSize: 74,
                  fontWeight: 700,
                  letterSpacing: `${frameState.titleTrackingEm}em`,
                  textTransform: "uppercase",
                  opacity: frameState.titleOpacity,
                }}
              >
                {signalStrokeRelayFixtures.title}
              </text>
            </g>

            <path
              ref={pathRefSetter("underline")}
              d={signalStrokeRelayFixtures.paths.underline}
              fill="none"
              stroke={signalStrokeRelayConfig.palette.underline}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={underlineStyles.strokeDasharray}
              strokeDashoffset={underlineStyles.strokeDashoffset}
              opacity={underlineStyles.opacity * frameState.underlineOpacity}
              transform={`translate(${frameState.underlineTranslateX} 0)`}
            />
          </g>

          {!captureMode ? (
            <>
              <text
                x="108"
                y="430"
                fill={signalStrokeRelayConfig.palette.textMuted}
                className="font-mono"
                style={{ fontSize: 13, letterSpacing: "0.16em", textTransform: "uppercase" }}
              >
                Trim paths prove draw-window control. Stagger and offset stay subordinate.
              </text>

              <text
                x="108"
                y="458"
                fill={signalStrokeRelayConfig.palette.textMuted}
                className="font-mono"
                style={{ fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase" }}
              >
                Match-cut continuity hands the baton from lead exit to title start.
              </text>
            </>
          ) : null}
        </svg>
      </div>
    </div>
  );
}
