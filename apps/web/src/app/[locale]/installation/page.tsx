import { AnimatedHeading } from "@/shared/components";
import { portfolioData } from "@/shared/data/portfolio";

export default function InstallationPage() {
  const { label, title, description, meta } = portfolioData.pages.installation;

  return (
    <main className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      <section className="px-6">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2 lg:gap-16 items-start">
          {/* Visual Column */}
          <div className="aspect-[4/5] w-full bg-gradient-to-br from-white/5 to-white/[0.02] rounded-lg" />

          {/* Text Column */}
          <div className="flex flex-col gap-6 lg:py-8">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-base-60)]">
              {label}
            </span>

            <AnimatedHeading
              as="h1"
              className="text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--text-base)]"
            >
              {title}
            </AnimatedHeading>

            <AnimatedHeading
              as="h2"
              className="text-lg leading-relaxed text-[var(--text-muted)]"
              delay={0.5}
            >
              {description}
            </AnimatedHeading>

            <div className="mt-4 space-y-4 border-t border-white/10 pt-6">
              {meta.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{item.label}</span>
                  <span className="text-[var(--text-base)]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
