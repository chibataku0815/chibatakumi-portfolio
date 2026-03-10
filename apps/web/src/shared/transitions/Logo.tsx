"use client";

import { forwardRef } from "react";
import { portfolioData } from "@/shared/data/portfolio";

interface LogoProps {
  className?: string;
}

/**
 * Abstract monoline logo for page transition
 * Uses stroke animation (strokeDasharray/strokeDashoffset)
 * Path data from portfolioData.branding.logo (replaceable)
 */
const Logo = forwardRef<SVGSVGElement, LogoProps>(({ className }, ref) => {
  const { viewBox, width, height, path, strokeWidth } = portfolioData.branding.logo;

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
      className={className}
    >
      <path
        d={path}
        fill="none"
        stroke="var(--logo-stroke)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

Logo.displayName = "Logo";

export default Logo;
