import { portfolioData } from "@/shared/data/portfolio";
import { AnimatedHeading } from "@/shared/components";

const profile = portfolioData.pages.profile;

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] px-6 py-24 md:px-12 lg:px-24">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <header className="mb-20 text-center">
          <AnimatedHeading
            as="h1"
            className="mb-6 text-[clamp(2rem,5vw,3.5rem)] font-semibold tracking-[-0.02em] text-[var(--text-base)]"
          >
            {profile.header.title}
          </AnimatedHeading>
          <p className="text-lg leading-relaxed text-[var(--text-muted)]">
            {profile.header.subtitle}
          </p>
        </header>

        {/* Strengths Section */}
        <section className="mb-24">
          <h2 className="mb-12 text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-amber1)]/60">
            Core Strengths
          </h2>
          <div className="space-y-12">
            {profile.strengths.map((strength, index) => (
              <div
                key={strength.id}
                className="group border-l border-[var(--text-base-20)] pl-6 transition-all duration-300 hover:border-[var(--accent-amber1)]/50"
              >
                <div className="mb-2 flex items-baseline gap-4">
                  <span className="text-sm font-medium text-[var(--text-base-40)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-xl font-semibold text-[var(--text-base)]">
                    {strength.title}
                  </h3>
                </div>
                <p className="mb-4 leading-relaxed text-[var(--text-muted)]">
                  {strength.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {strength.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-[var(--bg-overlay-10)] px-3 py-1 text-xs text-[var(--text-base-60)]"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Experience Timeline */}
        <section className="mb-24">
          <h2 className="mb-12 text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-amber1)]/60">
            Experience
          </h2>
          <div className="space-y-12">
            {profile.experience.map((exp) => (
              <article
                key={exp.id}
                className="group relative border-l border-[var(--text-base-20)] pl-6 transition-all duration-300 hover:border-[var(--accent-amber1)]/50"
              >
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-[var(--accent-amber1)]">
                    {exp.period}
                  </span>
                  <span className="rounded-full bg-[var(--bg-overlay-10)] px-3 py-1 text-xs text-[var(--text-base-60)]">
                    {exp.type}
                  </span>
                  {exp.teamSize && (
                    <span className="text-xs text-[var(--text-base-40)]">
                      {exp.teamSize}
                    </span>
                  )}
                </div>

                <h3 className="mb-2 text-lg font-semibold text-[var(--text-base)]">
                  {exp.role}
                </h3>

                <p className="mb-4 leading-relaxed text-[var(--text-muted)]">
                  {exp.description}
                </p>

                <ul className="mb-4 space-y-1">
                  {exp.achievements.map((achievement, i) => (
                    <li
                      key={`${exp.id}-achievement-${i}`}
                      className="flex items-start gap-2 text-sm text-[var(--text-base-60)]"
                    >
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-[var(--accent-amber1)]/60" />
                      {achievement}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-2">
                  {exp.techStack.map((tech) => (
                    <span
                      key={`${exp.id}-${tech}`}
                      className="rounded bg-[var(--bg-overlay-5)] px-2 py-0.5 text-xs font-medium text-[var(--text-base-40)]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-24">
          <h2 className="mb-12 text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-amber1)]/60">
            Tech Stack
          </h2>
          <div className="grid gap-12 md:grid-cols-2">
            {profile.techStack.map((category) => (
              <div key={category.category}>
                <h3 className="mb-4 text-sm font-semibold text-[var(--text-base)]">
                  {category.category}
                </h3>
                <ul className="space-y-2">
                  {category.items.map((item) => (
                    <li
                      key={item.name}
                      className="flex items-center justify-between"
                    >
                      <span
                        className={`text-sm ${
                          item.level === "primary"
                            ? "text-[var(--text-base)]"
                            : "text-[var(--text-base-60)]"
                        }`}
                      >
                        {item.name}
                      </span>
                      {item.context && (
                        <span className="text-xs text-[var(--text-base-40)]">
                          {item.context}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="mb-4 text-2xl font-semibold text-[var(--text-base)]">
            {profile.cta.headline}
          </h2>
          <p className="mb-8 text-[var(--text-muted)]">{profile.cta.subtext}</p>
          <a
            href="/contact"
            data-transition="true"
            className="amber-border-glow relative inline-flex items-center gap-2 rounded-full border border-[var(--text-base-20)] px-8 py-4 text-base font-medium text-[var(--text-base)] transition-all duration-300 hover:border-[var(--accent-amber1)]/50 hover:text-[var(--accent-amber1)]"
          >
            {profile.cta.buttonLabel}
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
        </section>
      </div>
    </main>
  );
}
