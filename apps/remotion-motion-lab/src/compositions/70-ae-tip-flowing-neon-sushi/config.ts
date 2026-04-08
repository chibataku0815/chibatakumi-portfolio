import type { FlowingStrokeTiming } from "./lib/flowing-neon";
import {
  buildFlowingNeonSpecsFromSvg,
  matchesAnySvgLayerSelector,
  type SvgLayerSelector,
} from "./lib/flowing-neon-svg";
import {
  denseStrokeSegments,
  frameSvgSource,
  frameStrokeSegments,
  heroSvgSource,
  openStrokeSegments,
} from "./lib/path-data";
import type { SvgMarkupSource } from "../../lib/use-svg-markup";

type StrokeGroup = "frame" | "hero";

export interface NeonSushiStrokeSpec {
  id: string;
  d: string;
  color: string;
  highlightColor?: string;
  strokeWidth: number;
  segmentWindows: typeof openStrokeSegments;
  timing: FlowingStrokeTiming;
  transform?: string;
  opacity?: number;
  coreOpacity?: number;
  glowOpacity?: number;
  glowScale?: number;
  strokeLinecap?: "butt" | "round" | "square";
  strokeLinejoin?: "miter" | "round" | "bevel";
  group: StrokeGroup;
}

const createTiming = (
  overrides: Partial<FlowingStrokeTiming>,
): FlowingStrokeTiming => ({
  trimStartFrame: 8,
  drawDurationFrames: 20,
  eraseDelayFrames: 112,
  eraseDurationFrames: 28,
  motionStartFrame: 18,
  motionRampFrames: 24,
  loopSpeed: 0.0036,
  phase: 0,
  ...overrides,
});

export const config = {
  id: "AETipFlowingNeonSushi",
  label: "AE TIP 70",
  title: "Flowing Neon Sushi",
  fps: 30,
  width: 1920,
  height: 1080,
  totalFrames: 180,
  heroTransform: "translate(228 382) skewX(-12)",
  colors: {
    background: "#040404",
    backgroundLift: "rgba(255,255,255,0.06)",
    white: "#f7f7f2",
    whiteHighlight: "#ffffff",
    salmon: "#ff533d",
    salmonHighlight: "#ffb49e",
    wasabi: "#74ff42",
    wasabiHighlight: "#d3ffbc",
    grain: "rgba(255,255,255,0.045)",
  },
  heroGlowScale: 2.3,
  frameGlowScale: 2.6,
  sources: {
    hero: heroSvgSource,
    frame: frameSvgSource,
  } satisfies Record<"hero" | "frame", SvgMarkupSource>,
} as const;

const heroTiming = createTiming({});
const delayedHeroTiming = (phase: number, trimOffset = 0) =>
  createTiming({
    phase,
    trimStartFrame: heroTiming.trimStartFrame + trimOffset,
    motionStartFrame: heroTiming.motionStartFrame + trimOffset,
  });

const frameTimingBase = createTiming({
  trimStartFrame: 0,
  drawDurationFrames: 22,
  eraseDelayFrames: 122,
  eraseDurationFrames: 24,
  motionStartFrame: 10,
  motionRampFrames: 22,
  loopSpeed: 0.003,
});

const letterPhases = [0.01, 0.24, 0.1, 0.36, 0.54];

const letterSelectors = [
  { idPrefix: "word-" },
] satisfies readonly SvgLayerSelector[];

const riceSelectors = [
  { idPrefix: "rice-" },
] satisfies readonly SvgLayerSelector[];

const garnishSelectors = [
  { idPrefix: "garnish-" },
] satisfies readonly SvgLayerSelector[];

const buildHeroStrokes = (svgMarkup: string) =>
  buildFlowingNeonSpecsFromSvg({
    svgMarkup,
    defaultStrokeWidth: 12,
    mapLayer: (layer, index) => {
      const isLetter = matchesAnySvgLayerSelector(layer, letterSelectors);
      const isRice = matchesAnySvgLayerSelector(layer, riceSelectors);
      const isGarnish = matchesAnySvgLayerSelector(layer, garnishSelectors);
      const phase = isLetter
        ? letterPhases[index] ?? 0
        : isGarnish
          ? 0.18 + index * 0.05
          : 0.08 + index * 0.035;

      return {
        group: "hero" as const,
        color: isGarnish
          ? config.colors.wasabi
          : isRice
            ? config.colors.salmon
            : layer.stroke ?? config.colors.white,
        highlightColor: isGarnish
          ? config.colors.wasabiHighlight
          : isRice
            ? config.colors.salmonHighlight
            : config.colors.whiteHighlight,
        strokeWidth:
          isRice ? 12 : isGarnish ? 11 : layer.strokeWidth ?? 18,
        segmentWindows: isRice ? denseStrokeSegments : openStrokeSegments,
        timing: delayedHeroTiming(
          phase,
          isGarnish ? -2 : isRice ? 2 : 0,
        ),
        glowScale: isRice ? 1.9 : isGarnish ? 1.8 : config.heroGlowScale,
        glowOpacity: isRice ? 0.26 : 0.22,
        coreOpacity: isRice ? 0.96 : 1,
      };
    },
  }).specs;

const buildFrameStrokes = (svgMarkup: string) =>
  buildFlowingNeonSpecsFromSvg({
    svgMarkup,
    defaultStrokeWidth: 12,
    mapLayer: (_layer, index) => ({
      group: "frame" as const,
      color: config.colors.white,
      highlightColor: config.colors.whiteHighlight,
      strokeWidth: 12,
      segmentWindows: frameStrokeSegments,
      timing: {
        ...frameTimingBase,
        phase: 0.06 + index * 0.17,
        trimStartFrame:
          frameTimingBase.trimStartFrame + (index % 2 === 0 ? 0 : 4),
        motionStartFrame: frameTimingBase.motionStartFrame + index * 2,
      },
      glowScale: config.frameGlowScale,
      glowOpacity: 0.24,
    }),
  }).specs;

export const buildNeonSushiStrokes = ({
  heroSvgMarkup,
  frameSvgMarkup,
}: {
  heroSvgMarkup: string;
  frameSvgMarkup: string;
}): NeonSushiStrokeSpec[] => [
  ...buildHeroStrokes(heroSvgMarkup),
  ...buildFrameStrokes(frameSvgMarkup),
];
