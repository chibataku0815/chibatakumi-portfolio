import { portfolioData } from "@/shared/data/portfolio";

interface BrandMarkProps {
  className?: string;
  size?: number;
}

export function BrandMark({ className, size = 20 }: BrandMarkProps) {
  const { logo } = portfolioData.branding;

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox={logo.viewBox}
      fill="none"
      className={className}
    >
      <path
        d={logo.path}
        stroke="currentColor"
        strokeWidth={logo.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default BrandMark;
