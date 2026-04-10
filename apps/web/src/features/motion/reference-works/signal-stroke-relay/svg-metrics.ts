import type { TrimWindowState } from "./trim-window";

export type SvgPoint = {
  x: number;
  y: number;
};

export type SvgPathMetric = {
  id: string;
  length: number;
};

export type SvgMetricMap = Record<string, SvgPathMetric>;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function measureSvgPaths(
  paths: Record<string, SVGPathElement | null>,
): SvgMetricMap {
  return Object.entries(paths).reduce<SvgMetricMap>((accumulator, [id, element]) => {
    if (!element) {
      return accumulator;
    }

    accumulator[id] = {
      id,
      length: element.getTotalLength(),
    };
    return accumulator;
  }, {});
}

export function pointAtPath(
  path: SVGPathElement | null,
  metric: SvgPathMetric | undefined,
  progress: number,
): SvgPoint | null {
  if (!path || !metric || metric.length <= 0) {
    return null;
  }

  const point = path.getPointAtLength(metric.length * clamp01(progress));
  return {
    x: point.x,
    y: point.y,
  };
}

export function trimStrokeStyles(
  metric: SvgPathMetric | undefined,
  trim: TrimWindowState,
) {
  if (!metric || metric.length <= 0 || !trim.visible) {
    return {
      strokeDasharray: "0 9999",
      strokeDashoffset: 0,
      opacity: 0,
    };
  }

  const visibleLength = Math.max(0, (trim.end - trim.start) * metric.length);
  const hiddenLength = Math.max(metric.length - visibleLength, 0.001);

  return {
    strokeDasharray: `${visibleLength} ${hiddenLength}`,
    strokeDashoffset: -trim.start * metric.length,
    opacity: 1,
  };
}
