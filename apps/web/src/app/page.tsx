import { HeroText } from "@/features/hero/components";

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative">
        <HeroText />
      </section>

      {/* Content Section */}
      <section className="min-h-screen bg-[#0a0a0a] px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-3xl font-semibold tracking-[-0.02em] text-white">
            Selected Works
          </h2>
          <p className="text-lg leading-relaxed text-white/50">
            Projects and experiments in creative development, interactive design,
            and visual experiences.
          </p>

          {/* Placeholder cards for scroll testing */}
          <div className="mt-16 grid gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-video w-full rounded-2xl bg-white/5 p-8"
              >
                <div className="h-4 w-32 rounded bg-white/10" />
                <div className="mt-4 h-3 w-48 rounded bg-white/5" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer spacer */}
      <section className="h-[50vh] bg-[#050505]" />
    </main>
  );
}
