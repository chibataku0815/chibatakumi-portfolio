import { HeroText } from "@/features/hero/components";
import { HorizontalWorks, SpotlightGallery } from "@/features/works";
import {
  FluidGradientBackground,
  fluidConfigMonochrome,
} from "@/features/fluid-gradient";

export default function Home() {
  return (
    <main>
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

          {/* Spotlight Gallery */}
          <SpotlightGallery />

          {/* Footer spacer */}
          <section className="h-[50vh]" />
        </div>
      </div>
    </main>
  );
}
