import type {
  FlowingSegmentWindow,
  FlowingStrokeTiming,
} from "./lib/flowing-neon";
import {
  buildFlowingNeonSpecsFromSvg,
  matchesAnySvgLayerSelector,
  type SvgLayerSelector,
} from "./lib/flowing-neon-svg";
import type { SvgMarkupSource } from "../../lib/use-svg-markup";

const waveSvgSource: SvgMarkupSource = {
  type: "static-file",
  src: "recraft/mooograph/5f-wave.svg",
};

const createTiming = (
  overrides: Partial<FlowingStrokeTiming>,
): FlowingStrokeTiming => ({
  trimStartFrame: 0,
  drawDurationFrames: 22,
  eraseDelayFrames: 126,
  eraseDurationFrames: 26,
  motionStartFrame: 8,
  motionRampFrames: 24,
  loopSpeed: 0.0028,
  phase: 0,
  ...overrides,
});

const longWaveSegments: FlowingSegmentWindow[] = [
  { start: 0.03, length: 0.36 },
  { start: 0.47, length: 0.26 },
  { start: 0.82, length: 0.11 },
];

const denseWaveSegments: FlowingSegmentWindow[] = [
  { start: 0.05, length: 0.28 },
  { start: 0.39, length: 0.2 },
  { start: 0.68, length: 0.14 },
  { start: 0.86, length: 0.08 },
];

const brightBlueSelectors = [
  { fill: "rgb(88,123,249)" },
] satisfies readonly SvgLayerSelector[];

const mediumBlueSelectors = [
  { fill: "rgb(72,98,194)" },
  { fill: "rgb(49,76,153)" },
] satisfies readonly SvgLayerSelector[];

const darkInkSelectors = [
  { fill: "rgb(30,29,29)" },
  { fill: "rgb(41,47,86)" },
  { fill: "rgb(33,34,46)" },
] satisfies readonly SvgLayerSelector[];

export const flowingNeonWaveConfig = {
  id: "AETipFlowingNeonWave",
  label: "AE TIP 70B",
  title: "Flowing Neon Wave",
  fps: 30,
  width: 1920,
  height: 1080,
  totalFrames: 180,
  source: waveSvgSource,
  colors: {
    background: "#020617",
    electric: "#8ab4ff",
    electricHighlight: "#f5f9ff",
    medium: "#5f82ff",
    mediumHighlight: "#d9e5ff",
    ink: "#3146b8",
    inkHighlight: "#a8baff",
  },
} as const;

export const buildFlowingNeonWaveSpecs = (svgMarkup: string) =>
  buildFlowingNeonSpecsFromSvg({
    svgMarkup,
    includeFilledShapes: true,
    defaultStrokeWidth: 12,
    mapLayer: (layer, index) => {
      const isBright = matchesAnySvgLayerSelector(layer, brightBlueSelectors);
      const isMedium = matchesAnySvgLayerSelector(layer, mediumBlueSelectors);
      const isInk = matchesAnySvgLayerSelector(layer, darkInkSelectors);

      return {
        group: "wave" as const,
        color: isBright
          ? flowingNeonWaveConfig.colors.electric
          : isMedium
            ? flowingNeonWaveConfig.colors.medium
            : flowingNeonWaveConfig.colors.ink,
        highlightColor: isBright
          ? flowingNeonWaveConfig.colors.electricHighlight
          : isMedium
            ? flowingNeonWaveConfig.colors.mediumHighlight
            : flowingNeonWaveConfig.colors.inkHighlight,
        strokeWidth: isBright ? 13 : isMedium ? 11 : 9,
        segmentWindows: isBright ? longWaveSegments : denseWaveSegments,
        timing: createTiming({
          phase: 0.04 + index * 0.083,
          trimStartFrame: isInk ? 6 : isMedium ? 3 : 0,
          motionStartFrame: 8 + index,
          loopSpeed: isInk ? 0.0022 : isMedium ? 0.0026 : 0.003,
        }),
        glowScale: isBright ? 2.6 : isMedium ? 2.15 : 1.85,
        glowOpacity: isBright ? 0.28 : isMedium ? 0.24 : 0.18,
        coreOpacity: isInk ? 0.88 : 0.96,
        opacity: isInk ? 0.82 : 1,
      };
    },
  });
