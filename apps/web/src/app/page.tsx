import {
  FluidGradientBackground,
  fluidConfigMonochrome,
} from "@/features/fluid-gradient";
import { HeroText } from "@/features/hero/components";
import { SectionScrollManager } from "@/features/scroll-manager";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      {/* Section Scroll Snap Manager */}
      <SectionScrollManager />

      {/* Hero Section - uses HeroShaderBackground from layout.tsx */}
      <section className="relative min-h-screen">
        <HeroText />

        <div className="absolute bottom-16 left-0 right-0 flex justify-center">
          <Link
            href="/skills"
            data-transition="true"
            className="amber-border-glow inline-flex items-center gap-2 rounded-full border border-[var(--text-base-20)] px-6 py-3 text-sm font-medium uppercase tracking-[0.12em] text-[var(--text-base)] transition-all duration-300 hover:border-[var(--accent-amber1)]/60 hover:text-[var(--accent-amber1)]"
          >
            View Skills
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
          </Link>
        </div>
      </section>
    </main>
  );
}
