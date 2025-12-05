import { HeroText } from "@/features/hero/components";
import { SpotlightGallery, HorizontalWorks } from "@/features/works";

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative">
        <HeroText />
      </section>

      {/* Spotlight Gallery Section */}
      <SpotlightGallery />

      {/* Transition Spacer */}
      <section className="relative bg-[var(--bg-darker)] px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-lg leading-relaxed text-[var(--text-muted)]">
            Scroll to explore featured works
          </p>
        </div>
      </section>

      {/* Horizontal Works Section */}
      <HorizontalWorks />

      {/* Footer spacer */}
      <section className="h-[50vh] bg-[var(--bg-darker)]" />
    </main>
  );
}
