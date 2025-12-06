import { HeroText } from "@/features/hero/components";
import { HorizontalWorks, SpotlightGallery } from "@/features/works";

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative">
        <HeroText />
      </section>

      {/* Horizontal Works Section */}
      <HorizontalWorks />

      {/* Spotlight Gallery */}
      <SpotlightGallery />

      {/* Footer spacer */}
      <section className="h-[50vh] bg-[var(--bg-darker)]" />
    </main>
  );
}
