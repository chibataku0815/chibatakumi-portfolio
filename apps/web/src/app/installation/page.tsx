import { AnimatedHeading } from "@/shared/components";

export default function InstallationPage() {
  return (
    <main className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      <section className="px-6">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2 lg:gap-16 items-start">
          {/* Visual Column */}
          <div className="aspect-[4/5] w-full bg-gradient-to-br from-white/5 to-white/[0.02] rounded-lg" />

          {/* Text Column */}
          <div className="flex flex-col gap-6 lg:py-8">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-amber1)]/60">
              Installation
            </span>

            <AnimatedHeading
              as="h1"
              className="text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--text-base)]"
            >
              Physical Digital
            </AnimatedHeading>

            <AnimatedHeading
              as="h2"
              className="text-lg leading-relaxed text-[var(--text-muted)]"
              delay={0.5}
              splitType="words"
            >
              Bridging the gap between screen and space. These works explore how
              digital systems can inhabit physical environments, creating
              experiences that engage the body as much as the eye.
            </AnimatedHeading>

            <div className="mt-4 space-y-4 border-t border-white/10 pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Medium</span>
                <span className="text-[var(--text-base)]">
                  Projection, Sensors, Custom Software
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">Context</span>
                <span className="text-[var(--text-base)]">
                  Galleries, Public Spaces
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
