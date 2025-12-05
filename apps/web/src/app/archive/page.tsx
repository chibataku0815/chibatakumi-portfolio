import { AnimatedHeading } from "@/shared/components";

const archiveItems = [
  { year: "2024", title: "Kinetic Brand System", category: "Motion" },
  { year: "2024", title: "Data Sculpture", category: "Installation" },
  { year: "2023", title: "Generative Poster Series", category: "Interactive" },
  { year: "2023", title: "Sound Reactive Visuals", category: "Motion" },
  { year: "2022", title: "Wayfinding Experience", category: "Installation" },
  { year: "2022", title: "Editorial Animations", category: "Motion" },
];

export default function ArchivePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      {/* Header */}
      <section className="px-6 pb-12">
        <div className="mx-auto max-w-4xl">
          <AnimatedHeading
            as="h1"
            className="text-[clamp(2.5rem,8vw,5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--text-base)]"
          >
            Archive
          </AnimatedHeading>
        </div>
      </section>

      {/* Key Visual */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl">
          <div className="aspect-[21/9] w-full bg-gradient-to-r from-white/5 via-white/[0.03] to-white/5 rounded-lg" />
        </div>
      </section>

      {/* List */}
      <section className="px-6">
        <div className="mx-auto max-w-4xl">
          <ul className="divide-y divide-white/10">
            {archiveItems.map((item, index) => (
              <li
                key={index}
                className="flex items-center justify-between py-5 transition-colors hover:bg-white/[0.02] -mx-4 px-4 cursor-pointer"
              >
                <div className="flex items-center gap-8">
                  <span className="font-mono text-sm text-white/40 w-12">
                    {item.year}
                  </span>
                  <span className="font-semibold text-[var(--text-base)]">
                    {item.title}
                  </span>
                </div>
                <span className="font-mono text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">
                  {item.category}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
