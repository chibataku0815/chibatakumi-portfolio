// NavRail — vertical side-rail navigation primitive. Each item is rendered as
// a row with a leading dot indicator that fills when active.
//
// Reference: plan §2.3 (D3.4).

import type { HTMLAttributes } from "react";

export interface NavRailItem {
  readonly label: string;
  readonly href: string;
  readonly active?: boolean;
}

export interface NavRailProps extends HTMLAttributes<HTMLElement> {
  readonly items: readonly NavRailItem[];
  /** Optional aria label. Default "Primary". */
  readonly "aria-label"?: string;
}

const DOT_SIZE = 6;

export function NavRail({
  items,
  className,
  style,
  "aria-label": ariaLabel = "Primary",
  ...rest
}: NavRailProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.875rem",
        color: "currentColor",
        ...style,
      }}
      {...rest}
    >
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.625rem",
            color: "inherit",
            textDecoration: "none",
            fontSize: "0.875rem",
            letterSpacing: "0.02em",
            opacity: item.active ? 1 : 0.7,
          }}
        >
          <span
            aria-hidden
            style={{
              width: DOT_SIZE,
              height: DOT_SIZE,
              borderRadius: "999px",
              background: item.active ? "currentColor" : "transparent",
              border: item.active
                ? "1px solid currentColor"
                : "1px solid color-mix(in srgb, currentColor 40%, transparent)",
              flex: "0 0 auto",
            }}
          />
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}

export default NavRail;
