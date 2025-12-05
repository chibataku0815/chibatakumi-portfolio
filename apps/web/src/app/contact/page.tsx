import { AnimatedHeading } from "@/shared/components";

export default function ContactPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-dark)] px-6 py-24">
      <div className="max-w-xl text-center">
        <AnimatedHeading
          as="h1"
          className="mb-6 text-[clamp(2.5rem,8vw,5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--text-base)]"
        >
          Let&apos;s Talk
        </AnimatedHeading>

        <p className="mb-10 text-lg leading-relaxed text-[var(--text-muted)]">
          Interested in collaboration or have a project in mind? I&apos;d love
          to hear from you.
        </p>

        <a
          href="mailto:hello@takumichiba.com"
          className="inline-block font-mono text-sm uppercase tracking-[0.15em] text-[var(--bg-dark)] bg-[var(--text-base)] px-8 py-4 transition-all duration-300 hover:bg-[var(--accent-amber1)] hover:text-[var(--bg-darker)]"
        >
          Get in Touch
        </a>
      </div>
    </main>
  );
}
