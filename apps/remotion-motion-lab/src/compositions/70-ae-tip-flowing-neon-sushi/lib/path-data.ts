import type { FlowingSegmentWindow } from "./flowing-neon";
import type { SvgMarkupSource } from "../../../lib/use-svg-markup";

export const heroSvgSource: SvgMarkupSource = {
  type: "static-file",
  src: "reference/flowing-neon-sushi-hero.svg",
};

export const frameSvgSource: SvgMarkupSource = {
  type: "static-file",
  src: "reference/flowing-neon-sushi-frame.svg",
};

export const openStrokeSegments: FlowingSegmentWindow[] = [
  { start: 0.02, length: 0.24 },
  { start: 0.31, length: 0.18 },
  { start: 0.56, length: 0.18 },
  { start: 0.79, length: 0.15 },
];

export const denseStrokeSegments: FlowingSegmentWindow[] = [
  { start: 0.03, length: 0.3 },
  { start: 0.42, length: 0.22 },
  { start: 0.74, length: 0.14 },
];

export const frameStrokeSegments: FlowingSegmentWindow[] = [
  { start: 0.02, length: 0.38 },
  { start: 0.48, length: 0.28 },
  { start: 0.84, length: 0.1 },
];
