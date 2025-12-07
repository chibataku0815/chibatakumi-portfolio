import { AnimatedHeading } from "@/shared/components";
import { portfolioData } from "@/shared/data/portfolio";
import {
  FluidGradientBackground,
  fluidConfigMonochrome,
} from "@/features/fluid-gradient";

const works = portfolioData.works.items;
const BASE_BG = "#0b0b0b";
const BAND_BG = "#f2f2f2";

export default function WorksPage() {
  return (
    <main className="relative min-h-screen text-[var(--text-base)]">
      {/* Three.js background with color overlay to keep tone consistent */}
      <div className="pointer-events-none fixed inset-0 -z-[5]">
        <FluidGradientBackground
          className="h-full w-full"
          config={fluidConfigMonochrome}
          fadeIn={true}
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: BASE_BG, mixBlendMode: "multiply", opacity: 0.82 }}
        />
      </div>

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
            className="relative isolate flex min-h-screen items-center px-8 py-16 sm:px-12 md:px-16 lg:px-20 overflow-hidden"
            style={{ backgroundColor: "transparent" }}
          >
            {/* Photo layer */}
            {work.media?.type === "image" && (
              <div
                className="absolute inset-0 -z-10 bg-cover bg-center opacity-55"
                style={{
                  backgroundImage: `url(${work.media.src})`,
                }}
              />
            )}
            <div className="absolute inset-0 -z-5 bg-[linear-gradient(180deg,rgba(0,0,0,0.55),rgba(0,0,0,0.85))]" />

            {/* Side rail */}
            <div className="pointer-events-none absolute inset-y-0 left-0 flex w-16 items-center justify-center border-r border-white/10 sm:w-20 md:w-24">
              <div className="-rotate-90 text-[11px] font-semibold uppercase tracking-[0.36em] text-[var(--text-base-60)]">
                Gallery
              </div>
            </div>

            <div className="relative z-10 ml-[5rem] flex w-full flex-col gap-10 sm:ml-[6rem] md:ml-[7rem]">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-2 text-[var(--text-base-80)]">
                  <span className="text-[17px] italic tracking-[0.08em] text-[var(--text-base-70)]">
                    (since_2011) 2025
                  </span>
                  <span className="inline-block bg-black/12 px-3 py-1 text-[34px] font-semibold leading-none tracking-tight text-black">
                    Case Study
                  </span>
                </div>
                <div className="bg-[var(--text-base)] text-[var(--bg-base)] px-3 py-1 text-sm font-semibold">
                  {String(idx + 1).padStart(2, "0")}
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div
                  className="text-[clamp(2.6rem,8vw,4.2rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-black"
                  style={{
                    backgroundColor: BAND_BG,
                    display: "inline-block",
                    padding: "0.28em 0.6em",
                  }}
                >
                  {work.title}
                </div>
                <p className="text-[22px] leading-relaxed text-[var(--text-base-80)] max-w-5xl">
                  {work.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-base-80)]">
                {work.role && (
                  <span className="border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium">
                    {work.role}
                  </span>
                )}
                {work.tags?.map((tag) => (
                  <span
                    key={`${work.id}-${tag}`}
                    className="border border-white/15 bg-white/08 px-4 py-2 text-xs"
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
