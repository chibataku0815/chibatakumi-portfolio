import { HeroText } from "@/features/hero/components";
import { SectionScrollManager } from "@/features/scroll-manager";
import { GlowButton } from "@/shared/components";

export default function Home() {
  return (
    <main>
      {/* Section Scroll Snap Manager */}
      <SectionScrollManager />

      {/* Hero Section - uses HeroShaderBackground from layout.tsx */}
      <section className="relative min-h-screen overflow-hidden">
        <HeroText />

        <div className="absolute bottom-8 left-0 right-0 flex justify-center overflow-visible sm:bottom-16">
          <GlowButton
            href="/skills"
            data-transition="true"
            orbitText="VIEW SKILLS • EXPLORE WORK • DISCOVER MORE • VIEW SKILLS • EXPLORE WORK • DISCOVER MORE • "
            className="text-sm font-medium uppercase tracking-[0.12em] text-[var(--text-base)] transition-colors duration-300 hover:text-[var(--accent-amber1)]"
          >
            View Skills
            <svg
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
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
          </GlowButton>
        </div>
      </section>
    </main>
  );
}
