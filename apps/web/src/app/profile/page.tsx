import { AnimatedHeading } from "@/shared/components";
import { portfolioData } from "@/shared/data/portfolio";
import {
  FluidGradientBackground,
  fluidConfigMonochrome,
} from "@/features/fluid-gradient";

const profile = portfolioData.pages.profile;
const BASE_BG = "#0b0b0b";
const BAND_BG = "#f2f2f2";

export default function ProfilePage() {
  const strengths = profile.strengths;
  const experiences = profile.experience;

  return (
    <main className="relative min-h-screen text-[var(--text-base)]">
      {/* Worksと同様のFluid背景 + 黒乗算 */}
      <div className="pointer-events-none fixed inset-0 -z-[5]">
        <FluidGradientBackground
          className="h-full w-full"
          config={fluidConfigMonochrome}
          fadeIn={true}
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: BASE_BG, mixBlendMode: "multiply", opacity: 0.9 }}
        />
      </div>

      {/* Intro */}
      <section className="relative z-10 flex min-h-[60vh] items-center justify-center px-6 py-24">
        <div className="max-w-4xl text-center">
          <AnimatedHeading
            as="h1"
            className="mb-4 text-[clamp(2.5rem,8vw,4.5rem)] font-semibold tracking-[-0.03em] text-[var(--text-base)]"
          >
            Experience & Skills
          </AnimatedHeading>
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-[var(--text-muted)]">
            デザイン・コード・映像を一人で統合し、意図通りのアウトプットを作る。
          </p>
        </div>
      </section>

      {/* Strengths - Monotone poster, no photo */}
      <div className="relative z-10 flex flex-col">
        {strengths.map((strength, idx) => (
          <section
            key={strength.id}
            className="relative isolate flex min-h-[70vh] items-center px-8 py-16 sm:px-12 md:px-16 lg:px-20 overflow-hidden"
          >
            <div className="absolute inset-0 -z-5 bg-[linear-gradient(180deg,rgba(0,0,0,0.66),rgba(0,0,0,0.9))]" />
            <div className="pointer-events-none absolute inset-0 -z-4 opacity-[0.1] mix-blend-soft-light" style={{ backgroundImage: "linear-gradient(90deg,rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(0deg,rgba(255,255,255,0.12) 1px, transparent 1px)", backgroundSize: "120px 120px" }} />
            <div className="pointer-events-none absolute inset-6 -z-3 border border-white/8" />
            <div className="pointer-events-none absolute right-[-12%] top-[18%] -z-2 text-[clamp(5rem,14vw,11rem)] font-black uppercase leading-none tracking-[-0.08em] text-white/6">
              STR
            </div>

            <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center border-r border-white/12 sm:w-16 md:w-20">
              <div className="-rotate-90 text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--text-base-50)]">
                Profile
              </div>
            </div>

            <div className="relative z-10 ml-[4.2rem] flex w-full flex-col gap-10 sm:ml-[5.5rem] md:ml-[6.5rem]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[var(--text-base-70)]">
                  <span className="font-mono text-xs uppercase tracking-[0.22em]">
                    since_2011
                  </span>
                  <span className="h-px w-12 bg-[var(--text-base-30)]" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                    Strength
                  </span>
                </div>
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-base-60)]">
                  {String(idx + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="flex flex-col gap-6">
                <div className="relative inline-block">
                  <div className="absolute -left-5 top-1/2 h-[1px] w-10 bg-[var(--text-base-20)]" />
                  <div
                    className="text-[clamp(2.4rem,7vw,3.8rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-black"
                    style={{
                      backgroundColor: BAND_BG,
                      display: "inline-block",
                      padding: "0.24em 0.54em",
                      boxShadow: "0 0 0 rgba(0,0,0,0)",
                    }}
                  >
                    {strength.title}
                  </div>
                </div>
                <p className="text-[20px] leading-relaxed text-[var(--text-base-80)] max-w-4xl">
                  {strength.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-base-80)]">
                {strength.keywords.map((tag) => (
                  <span
                    key={`${strength.id}-${tag}`}
                    className="border border-white/14 bg-white/8 px-3 py-1 uppercase tracking-[0.12em]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Experience as Posters (monotone, no photo) */}
      <div className="relative z-10 flex flex-col">
        {experiences.map((exp, idx) => (
          <section
            key={exp.id}
            className="relative isolate flex min-h-[80vh] items-center px-8 py-16 sm:px-12 md:px-16 lg:px-20 overflow-hidden"
          >
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.04),transparent_32%),linear-gradient(185deg,rgba(0,0,0,0.75),rgba(0,0,0,0.95))]" />
            <div className="pointer-events-none absolute inset-0 -z-9 opacity-[0.1] mix-blend-soft-light" style={{ backgroundImage: "linear-gradient(90deg,rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(0deg,rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "120px 120px" }} />
            <div className="pointer-events-none absolute right-[-14%] top-[20%] -z-8 text-[clamp(5rem,14vw,11rem)] font-black uppercase leading-none tracking-[-0.08em] text-white/7">
              {exp.period.split(" - ")[0]}
            </div>

            <div className="pointer-events-none absolute inset-y-0 left-0 flex w-20 items-center justify-center border-r border-white/12 sm:w-22 md:w-24">
              <div className="-rotate-90 text-[12px] font-semibold uppercase tracking-[0.32em] text-[var(--text-base-60)]">
                Timeline
              </div>
            </div>

            <div className="relative z-10 ml-[5.2rem] flex w-full flex-col gap-12 sm:ml-[6.4rem] md:ml-[7.6rem]">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-2 text-[var(--text-base-80)]">
                  <span className="text-[17px] italic tracking-[0.08em] text-[var(--text-base-70)]">
                    {exp.period}
                  </span>
                  <span className="inline-block bg-black/16 px-3 py-1 text-[28px] font-semibold leading-none tracking-tight text-black">
                    {exp.type}
                  </span>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-base-70)]">
                    <span className="font-mono uppercase tracking-[0.2em] text-[var(--accent-amber1)]">
                      Role
                    </span>
                    {exp.teamSize && (
                      <span className="border border-white/15 bg-white/8 px-3 py-1 text-[var(--text-base-70)]">
                        {exp.teamSize}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[32px] font-black uppercase tracking-[-0.04em] text-white/14">
                    {exp.period.split(" - ")[0]}
                  </span>
                  <div className="bg-[var(--text-base)] text-[var(--bg-base)] px-3 py-1 text-sm font-semibold shadow-[14px_14px_0_rgba(0,0,0,0.65)]">
                    {String(idx + 1).padStart(2, "0")}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div
                  className="text-[clamp(2.2rem,7vw,3.6rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-black"
                  style={{
                    backgroundColor: BAND_BG,
                    display: "inline-block",
                    padding: "0.24em 0.5em",
                    boxShadow: "18px 18px 0 rgba(0,0,0,0.9)",
                  }}
                >
                  {exp.role}
                </div>
                <div className="grid gap-4 md:grid-cols-[1.2fr,0.8fr] md:items-start">
                  <p className="text-[20px] leading-relaxed text-[var(--text-base-80)]">
                    {exp.description}
                  </p>
                  <ul className="space-y-2 text-sm text-[var(--text-base-70)]">
                    {exp.achievements.map((achievement, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-2 h-1 w-6 flex-shrink-0 bg-[var(--accent-amber1)]/80" />
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-[var(--text-base-80)]">
                {exp.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="border border-white/15 bg-white/10 px-3 py-1"
                  >
                    {tech}
                  </span>
                ))}
                {exp.teamSize && (
                  <span className="border border-white/15 bg-white/6 px-3 py-1 text-[var(--text-base-60)]">
                    {exp.teamSize}
                  </span>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
