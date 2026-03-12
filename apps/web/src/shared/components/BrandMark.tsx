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
      fill="currentColor"
      className={className}
    >
      {logo.primaryPaths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export default BrandMark;
