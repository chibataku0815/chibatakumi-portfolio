import { AnimatedHeading } from "@/shared/components";
import { portfolioData } from "@/shared/data/portfolio";

export default function ContactPage() {
  const contact = portfolioData.pages.contact;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="max-w-xl text-center">
        <AnimatedHeading
          as="h1"
          className="mb-8 text-[clamp(2.5rem,8vw,4rem)] font-semibold tracking-[-0.02em] text-[var(--text-base)]"
        >
          {contact.title}
        </AnimatedHeading>

        <div className="mb-12 space-y-4">
          {contact.description.split("\n").map((paragraph, i) => (
            <p
              key={i}
              className="text-lg leading-relaxed text-[var(--text-muted)]"
            >
              {paragraph}
            </p>
          ))}
        </div>

        <a
          href={`mailto:${contact.email}`}
          className="amber-border-glow relative inline-flex items-center gap-2 rounded-full border border-[var(--text-base-20)] px-8 py-4 text-base font-medium text-[var(--text-base)] transition-all duration-300 hover:border-[var(--accent-amber1)]/50 hover:text-[var(--accent-amber1)]"
        >
          {contact.cta}
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </a>

        {contact.responseNote && (
          <p className="mt-6 text-sm text-[var(--text-base-40)]">
            {contact.responseNote}
          </p>
        )}
      </div>
    </main>
  );
}
