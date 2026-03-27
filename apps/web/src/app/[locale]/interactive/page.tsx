import { AnimatedHeading } from "@/shared/components";
import { portfolioData } from "@/shared/data/portfolio";
import { DistortionShowcase } from "@/features/interactive/distortion-hover";
import { FilmLabShowcase } from "@/features/interactive/film-lab";

export default function InteractivePage() {
  const { label, title } = portfolioData.pages.interactive;

  return (
    <main className="relative min-h-screen pt-32 pb-24">
      {/* Hero */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl">
          <span className="mb-4 block font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-base-60)]">
            {label}
          </span>
          <AnimatedHeading
            as="h1"
            className="text-[clamp(2.5rem,8vw,5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--text-base)]"
          >
            {title}
          </AnimatedHeading>
        </div>
      </section>

      {/* Featured Demo: Distortion Hover */}
      <DistortionShowcase />

      {/* Featured Demo: Film Lab */}
      <FilmLabShowcase />
    </main>
  );
}
