import { AnimatedHeading } from "@/shared/components";
import { portfolioData } from "@/shared/data/portfolio";
import {
  FluidGradientBackground,
  fluidConfigMonochrome,
} from "@/features/fluid-gradient";

const BASE_BG = "#0b0b0b";
const BAND_BG = "#f2f2f2";

export default function SkillsPage() {
  const skills = portfolioData.skills.items;

  return (
    <main className="relative min-h-screen text-[var(--text-base)]">
      {/* Three.js fluid background */}
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
      <section className="relative z-10 px-6 pt-32 pb-16 sm:px-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.24em] text-[var(--text-muted)]">
            Hybrid Skillset
            <span className="h-px w-12 bg-[var(--accent-amber1)]" />
          </div>
          <AnimatedHeading
            as="h1"
            className="text-[clamp(2.4rem,7vw,4.6rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-[var(--text-base)]"
          >
            Skills / One creator, multiple layers.
          </AnimatedHeading>
          <p className="max-w-3xl text-lg leading-relaxed text-[var(--text-muted)]">
            Works / Case Study に散らばっていた写真・映像・コード・モーションの役割を一本化。
            プロフィールのスキルセットを重ね、企画から実装まで単一視点で完結する「マルチスキル」を提示します。
          </p>
          <div className="flex flex-wrap gap-3 text-xs font-mono uppercase tracking-[0.16em] text-[var(--text-base-70)]">
            {["Photo", "Film", "Code", "Interaction", "Motion", "Sound", "Identity"].map((item) => (
              <span key={item} className="rounded-full bg-white/5 px-3 py-2">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Skill Sections */}
      <div className="relative z-10 flex flex-col gap-16 px-6 pb-24 sm:px-10">
        {skills.map((skill, idx) => (
          <section
            key={skill.id}
            className="relative isolate flex min-h-[78vh] items-center overflow-hidden rounded-[32px] border border-white/12 bg-white/[0.02] shadow-[0_30px_140px_rgba(0,0,0,0.55)] sm:min-h-[82vh]"
          >
            {/* Photo layer */}
            {skill.media?.type === "image" && (
              <div
                className="absolute inset-0 -z-20 bg-cover bg-center opacity-70"
                style={{ backgroundImage: `url(${skill.media.src})` }}
              />
            )}
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(0,0,0,0.85),rgba(0,0,0,0.95))]" />
            <div
              className="absolute inset-0 -z-[8] mix-blend-screen opacity-35"
              style={{ background: skill.accent ?? "var(--accent-amber1)" }}
            />
            <div className="pointer-events-none absolute inset-0 -z-[6] opacity-[0.12] mix-blend-soft-light" style={{ backgroundImage: "linear-gradient(90deg,rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(0deg,rgba(255,255,255,0.12) 1px, transparent 1px)", backgroundSize: "140px 140px" }} />

            {/* Side rail */}
            <div className="pointer-events-none absolute inset-y-0 left-0 flex w-14 items-center justify-center border-r border-white/10 sm:w-16 md:w-20">
              <div className="-rotate-90 text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--text-base-60)]">
                Skillset Posters
              </div>
            </div>

            <div className="relative z-10 ml-[4.5rem] flex w-full flex-col gap-10 px-5 py-10 sm:ml-[5.5rem] sm:px-10 md:ml-[6.5rem] md:py-12 lg:py-16">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center gap-3 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em]"
                    style={{ backgroundColor: BAND_BG, color: "#0b0b0b" }}
                  >
                    {skill.meta}
                    <span className="text-[10px] text-[#0f0f0f]/70">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </span>
                  <span
                    className="h-px w-14"
                    style={{ backgroundColor: skill.accent ?? "var(--accent-amber1)" }}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-base-60)]">
                    since_2011 — ongoing
                  </span>
                </div>
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-base-70)]">
                  Photo × Code × Motion
                </span>
              </div>

              <div className="grid gap-8 md:grid-cols-[1.05fr,1.4fr] md:items-start">
                <div className="space-y-4">
                  <h2
                    className="inline-block text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-black"
                    style={{
                      backgroundColor: BAND_BG,
                      padding: "0.32em 0.5em",
                      boxShadow: "12px 12px 0 #0b0b0b",
                    }}
                  >
                    {skill.title}
                  </h2>
                  <p className="max-w-3xl text-lg leading-relaxed text-[var(--text-base-80)]">
                    {skill.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-base-80)]">
                    <span className="rounded-full border border-white/22 bg-white/12 px-4 py-2 font-semibold">
                      {skill.role}
                    </span>
                    <span className="rounded-full border border-white/12 bg-white/6 px-3 py-2 font-mono uppercase tracking-[0.16em] text-[var(--text-base-70)]">
                      Profile Integration
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 text-sm text-[var(--text-base-70)]">
                    <span className="inline-block h-[1px] w-6 bg-white/30" />
                    <span className="font-mono uppercase tracking-[0.18em]">
                      Roles / Tags
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {skill.tags?.map((tag) => (
                      <span
                        key={`${skill.id}-${tag}`}
                        className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-[12px] font-medium text-[var(--text-base-80)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                    Worksのポスター感を活かしつつ、Profileで定義したロール/タグを重ねたマルチスキルの断面。撮影・実装・運用を一つのレイヤーで握ります。
                  </p>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
