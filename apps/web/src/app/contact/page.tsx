import { AnimatedHeading } from "@/shared/components";
import { portfolioData } from "@/shared/data/portfolio";

export default function ContactPage() {
  const { title, description, email, ctaText } = portfolioData.pages.contact;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-dark)] px-6 py-24">
      <div className="max-w-xl text-center">
        <AnimatedHeading
          as="h1"
          className="mb-6 text-[clamp(2.5rem,8vw,5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--text-base)]"
        >
          {title}
        </AnimatedHeading>

        <p className="mb-10 text-lg leading-relaxed text-[var(--text-muted)]">
          {description}
        </p>

        <a
          href={`mailto:${email}`}
          className="inline-block font-mono text-sm uppercase tracking-[0.15em] text-[var(--bg-dark)] bg-[var(--text-base)] px-8 py-4 transition-all duration-300 hover:bg-[var(--accent-amber1)] hover:text-[var(--bg-darker)]"
        >
          {ctaText}
        </a>
      </div>
    </main>
  );
}
