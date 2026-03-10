import { HomeHero } from "@/features/hero/components";
import { SectionScrollManager } from "@/features/scroll-manager";

export default function Home() {
  return (
    <main>
      <SectionScrollManager />
      <HomeHero />
    </main>
  );
}
