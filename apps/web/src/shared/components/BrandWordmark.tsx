import { portfolioData } from "@/shared/data/portfolio";
import { BrandMark } from "./BrandMark";

interface BrandWordmarkProps {
  compact?: boolean;
}

export function BrandWordmark({ compact = false }: BrandWordmarkProps) {
  const { wordmark } = portfolioData.branding;
  const height = compact ? 14 : 18;
  const aspectRatio = wordmark.width / wordmark.height;
  const width = Math.round(height * aspectRatio);

  return (
    <span
      className={`inline-flex max-w-full items-center whitespace-nowrap text-[var(--text-base)] ${
        compact ? "gap-2" : "gap-2.5"
      }`}
    >
      <BrandMark
        size={compact ? 18 : 22}
        className="shrink-0 text-[var(--text-base)]"
      />
      <svg
        viewBox={wordmark.viewBox}
        width={width}
        height={height}
        fill="none"
        aria-label={wordmark.ariaLabel}
        role="img"
        className="shrink-0"
      >
        <g fill="var(--text-base)">
          {wordmark.primaryPaths.map((d, i) => (
            <path key={`p-${i}`} d={d} />
          ))}
        </g>
        <g fill="var(--text-base)">
          {wordmark.secondaryPaths.map((d, i) => (
            <path key={`s-${i}`} d={d} />
          ))}
        </g>
      </svg>
    </span>
  );
}

export default BrandWordmark;
