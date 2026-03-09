import { portfolioData } from "@/shared/data/portfolio";
import { BrandMark } from "./BrandMark";

interface BrandWordmarkProps {
  compact?: boolean;
}

export function BrandWordmark({ compact = false }: BrandWordmarkProps) {
  const { wordmark } = portfolioData.branding;

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap text-[var(--text-base)] ${
        compact ? "gap-2" : "gap-2.5"
      }`}
    >
      <BrandMark
        size={compact ? 18 : 22}
        className="shrink-0 text-[var(--text-base)]"
      />
      <span className="inline-flex items-baseline gap-1.5 leading-none">
        <span
          style={{ fontFamily: "var(--font-family-sans)" }}
          className={`uppercase font-light tracking-[0.18em] ${
            compact ? "text-[11px] sm:text-[12px]" : "text-[12px] sm:text-[13px]"
          }`}
        >
          {wordmark.firstName}
        </span>
        <span
          style={{ fontFamily: "var(--font-family-sans)" }}
          className={`uppercase font-medium tracking-[0.16em] text-[var(--text-base-80)] ${
            compact ? "text-[11px] sm:text-[12px]" : "text-[12px] sm:text-[13px]"
          }`}
        >
          {wordmark.lastName}
        </span>
      </span>
    </span>
  );
}

export default BrandWordmark;
