import {
  FluidGradientBackground,
  fluidConfigMonochrome,
} from "@/features/fluid-gradient";
import { HorizontalWorks } from "@/features/works";

export default function WorksPage() {
  return (
    <main>
      {/* Background */}
      <div className="relative">
        <div className="sticky top-0 h-screen w-full -z-[5]">
          <FluidGradientBackground
            className="absolute inset-0"
            config={fluidConfigMonochrome}
            fadeIn={true}
          />
        </div>

        {/* Works */}
        <div className="relative -mt-[100vh]">
          <HorizontalWorks />
        </div>
      </div>
    </main>
  );
}
