import { AnimatedHeading } from "@/shared/components";
import { portfolioData } from "@/shared/data/portfolio";

const works = portfolioData.works.items;

export default function WorksPage() {
  return (
    <main className="relative min-h-screen bg-[var(--bg-base)] text-[var(--text-base)]">
      {/* Intro */}
      <section className="relative z-10 flex min-h-[60vh] items-center justify-center px-6 py-24">
        <div className="max-w-4xl text-center">
          <AnimatedHeading
            as="h1"
            className="mb-4 text-[clamp(2.5rem,8vw,4.5rem)] font-semibold tracking-[-0.03em] text-[var(--text-base)]"
          >
            Works / Case Studies
          </AnimatedHeading>
          <p className="text-lg leading-relaxed text-[var(--text-muted)]">
            Integrated creative outputs across enterprise systems, SaaS, and visual identity.
            Poster-like presentations for quick reading; rolesと技術はタグで明示しています。
          </p>
        </div>
      </section>

      {/* Works Poster Sections */}
      <div className="relative z-10 flex flex-col">
        {works.map((work, idx) => (
          <section
            key={work.id}
            className="relative isolate flex min-h-screen items-center px-8 py-16 sm:px-10 md:px-16 lg:px-24 overflow-hidden"
            style={{
              background: work.background ?? "#0b0b0b",
            }}
          >
            {/* Side rail */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-24 md:w-28 border-r border-[var(--text-base-10)]/30">
              <div className="absolute left-1/2 top-6 -translate-x-1/2 text-[var(--text-base)]/60 text-[10px] tracking-[0.4em] uppercase">
                Gallery
              </div>
              <div className="absolute left-1/2 top-16 h-24 w-[1px] -translate-x-1/2 bg-[var(--text-base-20)]/50" />
              <div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[11px] font-semibold uppercase tracking-[0.32em]"
                style={{ color: work.accent ?? "var(--accent-amber1)" }}
              >
                {String(idx + 1).padStart(2, "0")}
              </div>
              <div className="absolute bottom-0 left-1/2 h-24 w-[1px] -translate-x-1/2 bg-[var(--text-base-20)]/50" />
            </div>

            {/* Overlay lines */}
            <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-40">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.06)_0,rgba(255,255,255,0.06)_1px,transparent_1px,transparent_120px)]" />
              <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.04)_1px,transparent_1px,transparent_140px)]" />
            </div>

            <div className="relative z-10 flex flex-col gap-6 max-w-5xl">
              <div className="flex items-center gap-3 text-[var(--accent-amber1)]/80">
                <span className="text-[11px] font-semibold uppercase tracking-[0.3em]">
                  {work.meta}
                </span>
                <span className="text-xs text-[var(--text-base-50)]">{work.id}</span>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-[clamp(2.75rem,10vw,6rem)] font-semibold leading-[0.9] tracking-[-0.04em] text-[var(--text-base)]">
                  {work.title}
                </div>
                <div
                  className="text-[clamp(3.75rem,16vw,10rem)] font-black uppercase leading-[0.88] tracking-[-0.08em] text-transparent"
                  style={{
                    WebkitTextStroke: "1.4px rgba(255,255,255,0.16)",
                  }}
                >
                  {work.title}
                </div>
              </div>

              <p className="text-lg leading-relaxed text-[var(--text-base-70)] max-w-3xl">
                {work.description}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-base-60)]">
                {work.role && (
                  <span className="rounded-full border border-[var(--text-base-20)] px-3 py-1 text-xs font-medium text-[var(--text-base-80)]">
                    {work.role}
                  </span>
                )}
                {work.tags?.map((tag) => (
                  <span
                    key={`${work.id}-${tag}`}
                    className="rounded-full bg-[var(--bg-overlay-10)] px-3 py-1 text-xs text-[var(--text-base-60)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
