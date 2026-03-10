import { portfolioData } from "@/shared/data/portfolio";
import { BrandMark } from "./BrandMark";

interface BrandWordmarkProps {
  compact?: boolean;
}

export function BrandWordmark({ compact = false }: BrandWordmarkProps) {
  const { wordmark } = portfolioData.branding;
  const [firstName, ...rest] = wordmark.full.split(" ");
  const lastName = rest.join(" ");

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
      <span className="inline-flex min-w-0 items-baseline gap-1.5 leading-none whitespace-nowrap">
        <span
          style={{ fontFamily: "var(--font-family-sans)" }}
          className={`uppercase font-light ${
            compact
              ? "text-[10px] tracking-[0.14em] sm:text-[11px]"
              : "text-[12px] tracking-[0.16em] sm:text-[13px]"
          }`}
        >
          {firstName}
        </span>
        <span
          style={{ fontFamily: "var(--font-family-sans)" }}
          className={`uppercase font-medium text-[var(--text-base-80)] ${
            compact
              ? "text-[10px] tracking-[0.13em] sm:text-[11px]"
              : "text-[12px] tracking-[0.15em] sm:text-[13px]"
          }`}
        >
          {lastName}
        </span>
      </span>
    </span>
  );
}

export default BrandWordmark;
