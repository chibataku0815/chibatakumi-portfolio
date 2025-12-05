"use client";

import { forwardRef } from "react";

interface LogoProps {
  className?: string;
}

/**
 * Abstract monoline logo for page transition
 * Uses stroke animation (strokeDasharray/strokeDashoffset)
 */
const Logo = forwardRef<SVGSVGElement, LogoProps>(({ className }, ref) => {
  return (
    <svg
      ref={ref}
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      className={className}
    >
      {/* Abstract "TC" monoline mark */}
      <path
        d="M16 20 L64 20 M40 20 L40 60 M20 60 L60 60 M20 40 L35 40"
        fill="none"
        stroke="var(--text-base)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

Logo.displayName = "Logo";

export default Logo;
