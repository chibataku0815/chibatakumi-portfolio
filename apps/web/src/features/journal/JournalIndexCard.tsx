import Link from "next/link";

interface JournalIndexCardProps {
  href: string;
  eyebrow: string;
  title: string;
  summary: string;
  tags: readonly string[];
  variant?: "default" | "flagship";
}

export function JournalIndexCard({
  href,
  eyebrow,
  title,
  summary,
  tags,
  variant = "default",
}: JournalIndexCardProps) {
  const isFlagship = variant === "flagship";

  return (
    <Link
      href={href}
      className="group block border-t border-[var(--text-base-20)] py-8 transition-[border-color] duration-300 hover:border-[var(--text-base)] focus-visible:outline-none focus-visible:border-[var(--text-base)]"
    >
      <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-[var(--text-base-60)]">
        {eyebrow}
      </p>
      <h3
        className={
          isFlagship
            ? "mt-5 text-[clamp(2rem,5vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.03em] text-[var(--text-base)]"
            : "mt-4 text-[clamp(1.4rem,2.6vw,1.85rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--text-base)]"
        }
        style={{ fontFamily: "var(--font-family-display)" }}
      >
        {title}
      </h3>
      <p
        className={
          isFlagship
            ? "mt-6 max-w-[44ch] text-[1.05rem] leading-[1.75] text-[var(--text-muted)]"
            : "mt-4 max-w-[44ch] text-[0.95rem] leading-[1.75] text-[var(--text-base-80)]"
        }
      >
        {summary}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 font-sans text-[10px] uppercase tracking-[0.18em] text-[var(--text-base-60)]">
        {tags.length ? (
          <span>{tags.join(" · ")}</span>
        ) : null}
        <span
          aria-hidden="true"
          className="ml-auto inline-flex items-center gap-2 text-[var(--text-base-70)] transition-[color,transform] duration-300 group-hover:text-[var(--text-base)] group-hover:translate-x-1"
        >
          Read
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
