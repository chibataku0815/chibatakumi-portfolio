import React from "react";
import {
  getNeonFlicker,
  getStrokeDash,
  resolveFlowingStroke,
  type FlowingStrokeSpec,
} from "./flowing-neon";
import {
  parseSvgStrokeDocument,
  type ParsedSvgStrokeDocument,
  type ParsedSvgStrokeLayer,
} from "./svg-stroke-parser";

export type FlowingGroupedStrokeSpec<Group extends string = string> =
  FlowingStrokeSpec & { group: Group };

export interface SvgLayerSelector {
  id?: string;
  idPrefix?: string;
  idPattern?: RegExp;
  stroke?: string;
  fill?: string;
  paint?: string;
}

export interface FlowingNeonLayerOverride<Group extends string = string>
  extends Partial<FlowingStrokeSpec> {
  group?: Group;
  skip?: boolean;
}

const normalizePaintValue = (value: string | null | undefined) =>
  value?.trim().toLowerCase();

const matchesPaint = (actual: string | undefined, expected: string) =>
  normalizePaintValue(actual) === normalizePaintValue(expected);

export const matchesSvgLayerSelector = (
  layer: ParsedSvgStrokeLayer,
  selector: SvgLayerSelector,
) => {
  if (selector.id && layer.id !== selector.id) {
    return false;
  }

  if (selector.idPrefix && !layer.id.startsWith(selector.idPrefix)) {
    return false;
  }

  if (selector.idPattern && !selector.idPattern.test(layer.id)) {
    return false;
  }

  if (selector.stroke && !matchesPaint(layer.stroke, selector.stroke)) {
    return false;
  }

  if (selector.fill && !matchesPaint(layer.fill, selector.fill)) {
    return false;
  }

  if (
    selector.paint &&
    !matchesPaint(layer.stroke, selector.paint) &&
    !matchesPaint(layer.fill, selector.paint)
  ) {
    return false;
  }

  return true;
};

export const matchesAnySvgLayerSelector = (
  layer: ParsedSvgStrokeLayer,
  selectors: readonly SvgLayerSelector[],
) => selectors.some((selector) => matchesSvgLayerSelector(layer, selector));

export const buildFlowingNeonSpecsFromSvg = <Group extends string>({
  svgMarkup,
  defaultStrokeWidth = 12,
  includeFilledShapes = false,
  mapLayer,
}: {
  svgMarkup: string;
  defaultStrokeWidth?: number;
  includeFilledShapes?: boolean;
  mapLayer: (
    layer: ParsedSvgStrokeLayer,
    index: number,
    document: ParsedSvgStrokeDocument,
  ) => FlowingNeonLayerOverride<Group>;
}) => {
  const document = parseSvgStrokeDocument(svgMarkup, {
    defaultStrokeWidth,
    includeFilledShapes,
  });

  const specs = document.layers.flatMap((layer, index) => {
    const override = mapLayer(layer, index, document);
    if (override.skip || !override.group || !override.timing || !override.segmentWindows) {
      return [];
    }

    const baseColor = override.color ?? layer.stroke ?? layer.fill;
    if (!baseColor) {
      return [];
    }

    const strokeWidth =
      override.strokeWidth ?? layer.strokeWidth ?? defaultStrokeWidth;

    return [
      {
        id: override.id ?? layer.id,
        d: override.d ?? layer.d,
        transform: override.transform ?? layer.transform,
        color: baseColor,
        highlightColor: override.highlightColor,
        strokeWidth,
        segmentWindows: override.segmentWindows,
        timing: override.timing,
        opacity: override.opacity ?? layer.opacity,
        coreOpacity: override.coreOpacity,
        glowOpacity: override.glowOpacity,
        glowScale: override.glowScale,
        strokeLinecap: override.strokeLinecap ?? layer.strokeLinecap ?? "round",
        strokeLinejoin:
          override.strokeLinejoin ?? layer.strokeLinejoin ?? "round",
        group: override.group,
      } satisfies FlowingGroupedStrokeSpec<Group>,
    ];
  });

  return {
    viewBox: document.viewBox,
    specs,
  };
};

export const sharedSvgStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  overflow: "visible",
};

export const FlowingNeonLayer: React.FC<{
  frame: number;
  seed: number;
  spec: FlowingStrokeSpec;
}> = ({ frame, seed, spec }) => {
  const resolved = resolveFlowingStroke({ frame, spec });

  if (!resolved) {
    return null;
  }

  const flicker = getNeonFlicker({ frame, seed });
  const glowScale = spec.glowScale ?? 2.2;
  const strokeLinecap = spec.strokeLinecap ?? "round";
  const strokeLinejoin = spec.strokeLinejoin ?? "round";

  return (
    <g transform={spec.transform} opacity={resolved.opacity * flicker}>
      {resolved.windows.map((window, index) => {
        const dash = getStrokeDash(window);
        const key = `${spec.id}-${index}`;
        const highlight = spec.highlightColor ?? spec.color;

        return (
          <g key={key}>
            <path
              d={spec.d}
              fill="none"
              stroke={spec.color}
              strokeWidth={spec.strokeWidth * glowScale}
              strokeLinecap={strokeLinecap}
              strokeLinejoin={strokeLinejoin}
              pathLength={dash.pathLength}
              strokeDasharray={dash.strokeDasharray}
              strokeDashoffset={dash.strokeDashoffset}
              opacity={resolved.glowOpacity}
              style={{
                filter: `blur(${spec.strokeWidth * 0.95}px)`,
                mixBlendMode: "screen",
              }}
            />
            <path
              d={spec.d}
              fill="none"
              stroke={spec.color}
              strokeWidth={spec.strokeWidth * 1.52}
              strokeLinecap={strokeLinecap}
              strokeLinejoin={strokeLinejoin}
              pathLength={dash.pathLength}
              strokeDasharray={dash.strokeDasharray}
              strokeDashoffset={dash.strokeDashoffset}
              opacity={Math.min(1, resolved.glowOpacity * 1.25)}
              style={{
                filter: `blur(${spec.strokeWidth * 0.36}px)`,
                mixBlendMode: "screen",
              }}
            />
            <path
              d={spec.d}
              fill="none"
              stroke={spec.color}
              strokeWidth={spec.strokeWidth}
              strokeLinecap={strokeLinecap}
              strokeLinejoin={strokeLinejoin}
              pathLength={dash.pathLength}
              strokeDasharray={dash.strokeDasharray}
              strokeDashoffset={dash.strokeDashoffset}
              opacity={resolved.coreOpacity}
            />
            <path
              d={spec.d}
              fill="none"
              stroke={highlight}
              strokeWidth={Math.max(2, spec.strokeWidth * 0.34)}
              strokeLinecap={strokeLinecap}
              strokeLinejoin={strokeLinejoin}
              pathLength={dash.pathLength}
              strokeDasharray={dash.strokeDasharray}
              strokeDashoffset={dash.strokeDashoffset}
              opacity={0.94}
            />
          </g>
        );
      })}
    </g>
  );
};
