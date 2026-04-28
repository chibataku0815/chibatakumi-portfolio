// SoundToggle — visual-only audio state glyph. The actual audio controller
// (Wave 2 Agent E) wires the onClick callback to the WebGPU audio bus.
//
// Glyph: a 5-bar dot-pattern wave that animates per state.
//   - `silent`  → flat dots, dim
//   - `playing` → bars at full height, accent color
//   - `muted`   → bars present but with strikethrough
//
// Reference: plan §2.3 (D3.4).

import type { ButtonHTMLAttributes } from "react";

export type SoundState = "silent" | "playing" | "muted";

export interface SoundToggleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  readonly state: SoundState;
  readonly onClick: () => void;
  /** Required — the toggle must be reachable for AT users. */
  readonly "aria-label": string;
}

const BARS = 5;
const VIEWBOX = 24;

function barHeight(state: SoundState, idx: number): number {
  if (state === "silent") return 2;
  // Playing: parabolic envelope highest in the middle.
  // Muted: same shape as playing but rendered at 50% alpha + strike.
  const center = (BARS - 1) / 2;
  const distance = Math.abs(idx - center);
  const peak = 14;
  const min = 4;
  return Math.max(min, peak - distance * 3);
}

export function SoundToggle({
  state,
  onClick,
  className,
  style,
  ...rest
}: SoundToggleProps) {
  const accent = state === "playing" ? "currentColor" : "currentColor";
  const opacity = state === "silent" ? 0.4 : state === "muted" ? 0.5 : 1;

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 28,
        height: 28,
        background: "transparent",
        border: 0,
        cursor: "pointer",
        color: "currentColor",
        opacity,
        ...style,
      }}
      data-state={state}
      {...rest}
    >
      <svg
        width={20}
        height={20}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        fill="none"
        aria-hidden
      >
        <g fill={accent}>
          {Array.from({ length: BARS }, (_, i) => {
            const h = barHeight(state, i);
            const cx = 4 + i * 4;
            const cy = VIEWBOX / 2;
            return (
              <rect
                key={i}
                x={cx - 1}
                y={cy - h / 2}
                width={2}
                height={h}
                rx={1}
              />
            );
          })}
        </g>
        {state === "muted" ? (
          <line
            x1={3}
            y1={3}
            x2={21}
            y2={21}
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        ) : null}
      </svg>
    </button>
  );
}

export default SoundToggle;
