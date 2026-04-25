// Wordmark — Logo + brand text composite. Designed to sit in the top-left
// of the navigation rail (NavRail) and as the page-transition wordmark.
//
// Reference: plan §2.3 (D3.4).

import type { HTMLAttributes } from "react";

import { Logo, type LogoVariant } from "./Logo";

export interface WordmarkProps extends HTMLAttributes<HTMLSpanElement> {
  /** Wordmark text. Default "chibatakumi". */
  readonly text?: string;
  /** Glyph size. Default 22. */
  readonly logoSize?: number;
  /** Logo variant. Default `dot-cluster`. */
  readonly logoVariant?: LogoVariant;
  /** Compact spacing for nav rails. Default false. */
  readonly compact?: boolean;
}

/**
 * Composes Logo + brand text. Both glyph and text inherit `currentColor`.
 */
export function Wordmark({
  text = "chibatakumi",
  logoSize = 22,
  logoVariant = "dot-cluster",
  compact = false,
  className,
  ...rest
}: WordmarkProps) {
  const gap = compact ? "0.5rem" : "0.625rem";
  return (
    <span
      {...rest}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap,
        whiteSpace: "nowrap",
        ...rest.style,
      }}
    >
      <Logo size={compact ? 18 : logoSize} variant={logoVariant} title={text} />
      <span
        style={{
          fontWeight: 500,
          letterSpacing: "-0.01em",
          fontSize: compact ? "0.8125rem" : "0.9375rem",
        }}
      >
        {text}
      </span>
    </span>
  );
}

export default Wordmark;
