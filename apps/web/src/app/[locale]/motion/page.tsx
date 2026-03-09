import { AnimatedHeading } from "@/shared/components";
import { portfolioData } from "@/shared/data/portfolio";

export default function MotionPage() {
  const { label, title, showcases } = portfolioData.pages.motion;

  return (
    <main className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      {/* Hero */}
      <section className="px-6 pb-24">
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

      {/* Showcases */}
      <section className="px-6">
        <div className="mx-auto max-w-4xl space-y-16">
          {showcases.map((item) => (
            <article
              key={item.id}
              className="group border-t border-white/10 pt-8"
            >
              <div className="mb-4 flex items-baseline justify-between">
                <span className="font-mono text-sm text-white/30">
                  {item.id}
                </span>
                <div className="flex gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)] bg-white/5 px-2 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <h2 className="mb-3 text-2xl font-semibold tracking-tight text-[var(--text-base)]">
                {item.title}
              </h2>
              <p className="text-base leading-relaxed text-[var(--text-muted)]">
                {item.description}
              </p>
              {/* Placeholder visual */}
              <div className="mt-6 aspect-video w-full bg-gradient-to-br from-white/5 to-white/[0.02] rounded-lg" />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
