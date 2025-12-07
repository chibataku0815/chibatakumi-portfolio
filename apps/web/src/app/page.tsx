import {
  FluidGradientBackground,
  fluidConfigMonochrome,
} from "@/features/fluid-gradient";
import { HeroText } from "@/features/hero/components";
import { SectionScrollManager } from "@/features/scroll-manager";
import { HorizontalWorks } from "@/features/works";

export default function Home() {
  return (
    <main>
      {/* Section Scroll Snap Manager */}
      <SectionScrollManager />

      {/* Hero Section - uses HeroShaderBackground from layout.tsx */}
      <section className="relative min-h-screen">
        <HeroText />
      </section>

      {/* Works Sections with Fluid Gradient Background */}
      <div className="relative">
        {/* Sticky container for Fluid Background - starts after Hero */}
        <div className="sticky top-0 h-screen w-full -z-[5]">
          <FluidGradientBackground
            className="absolute inset-0"
            config={fluidConfigMonochrome}
          />
        </div>

        {/* Content overlays the sticky background */}
        <div className="relative -mt-[100vh]">
          {/* Horizontal Works Section */}
          <HorizontalWorks />
        </div>
      </div>
    </main>
  );
}
