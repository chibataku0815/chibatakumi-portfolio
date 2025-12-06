import { AnimatedHeading } from "@/shared/components";
import { portfolioData } from "@/shared/data/portfolio";

export default function ArchivePage() {
  const { title, items } = portfolioData.pages.archive;

  // Group items by year
  const groupedByYear = items.reduce(
    (acc, item) => {
      if (!acc[item.year]) {
        acc[item.year] = [];
      }
      acc[item.year].push(item);
      return acc;
    },
    {} as Record<string, typeof items>
  );

  const sortedYears = Object.keys(groupedByYear).sort((a, b) => b.localeCompare(a));

  return (
    <main className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      {/* Header */}
      <section className="px-6 pb-12">
        <div className="mx-auto max-w-4xl">
          <AnimatedHeading
            as="h1"
            className="text-[clamp(2.5rem,8vw,5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--text-base)]"
          >
            {title}
          </AnimatedHeading>
        </div>
      </section>

      {/* List */}
      <section className="px-6">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-8">
            {sortedYears.map((year) => (
              <div key={year}>
                <div className="flex items-center gap-3 text-sm uppercase tracking-[0.15em] text-[var(--text-muted)]">
                  <span className="font-mono text-white/60">{year}</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <ul className="mt-4 space-y-3">
                  {groupedByYear[year].map((item) => (
                    <li
                      key={item.title}
                      className="flex items-center justify-between rounded-md px-3 py-3 transition-colors hover:bg-white/[0.02]"
                    >
                      <span className="font-semibold text-[var(--text-base)]">
                        {item.title}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                        {item.category}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
