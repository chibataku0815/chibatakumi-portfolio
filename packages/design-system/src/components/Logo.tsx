// Logo — renewal 2026 dot vocabulary.
//
// Dot-cluster logo: 3 dots arranged in a triangular layout derived from the
// HEX_GRID token (top vertex + two base vertices, equilateral). Stroke-based
// rendering with `currentColor` so consumers can theme by setting `color` on
// any ancestor.
//
// Reference: plan §2.3 (D3.4).

import type { SVGProps } from "react";

import { HEX_GRID } from "../tokens";

export type LogoVariant = "monoline" | "dot-cluster";

export interface LogoProps extends Omit<SVGProps<SVGSVGElement>, "viewBox"> {
  /** Pixel size (width === height). Default 24. */
  readonly size?: number;
  /** Default `dot-cluster`. `monoline` draws the same triangle as a stroked path. */
  readonly variant?: LogoVariant;
  /** Optional accessible label. */
  readonly title?: string;
}

const VIEWBOX = 24;
// Triangular layout — equilateral with apex at top. Coordinates are tuned
// against HEX_GRID.sizes.M (= 9) so the cluster reads as a hex-row sample.
const APEX = { x: 12, y: 5 };
const LEFT = { x: 5, y: 17 };
const RIGHT = { x: 19, y: 17 };
const DOT_RADIUS = HEX_GRID.sizes.S * 0.4; // 5 * 0.4 = 2

/**
 * @param size — width/height in CSS pixels.
 * @param variant — `dot-cluster` (default) renders 3 filled dots; `monoline`
 *   strokes a triangle through the same vertices.
 */
export function Logo({
  size = 24,
  variant = "dot-cluster",
  title,
  ...rest
}: LogoProps) {
  const ariaProps = title
    ? { role: "img" as const, "aria-label": title }
    : { "aria-hidden": true as const };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...ariaProps}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {variant === "monoline" ? (
        <path
          d={`M ${APEX.x} ${APEX.y} L ${RIGHT.x} ${RIGHT.y} L ${LEFT.x} ${LEFT.y} Z`}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <g fill="currentColor">
          <circle cx={APEX.x} cy={APEX.y} r={DOT_RADIUS} />
          <circle cx={LEFT.x} cy={LEFT.y} r={DOT_RADIUS} />
          <circle cx={RIGHT.x} cy={RIGHT.y} r={DOT_RADIUS} />
        </g>
      )}
    </svg>
  );
}

export default Logo;
