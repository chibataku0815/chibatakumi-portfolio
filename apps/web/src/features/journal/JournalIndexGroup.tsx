import Link from "next/link";
import type { ReactNode } from "react";

interface JournalIndexGroupProps {
  label: string;
  count?: number;
  children: ReactNode;
  link?: { href: string; label: string };
}

export function JournalIndexGroup({
  label,
  count,
  children,
  link,
}: JournalIndexGroupProps) {
  return (
    <section className="mt-24 first:mt-0">
      <header className="flex items-baseline justify-between gap-6 border-b border-[var(--text-base-30)] pb-4">
        <h2 className="font-sans font-medium text-[10px] uppercase tracking-[0.22em] text-[var(--text-base)]">
          {label}
        </h2>
        <div className="flex items-baseline gap-5 font-sans text-[10px] tracking-[0.18em] text-[var(--text-base-60)]">
          {link ? (
            <Link
              href={link.href}
              className="uppercase transition-colors duration-200 hover:text-[var(--text-base)]"
            >
              {link.label} →
            </Link>
          ) : null}
          {typeof count === "number" ? (
            <span className="tabular-nums">
              {String(count).padStart(2, "0")}
            </span>
          ) : null}
        </div>
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}
