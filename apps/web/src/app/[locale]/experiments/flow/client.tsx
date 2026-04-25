"use client";

import { createFlowParticipant } from "@chibatakumi/motion-flow/participant";
import { useExperimentParticipant } from "@/features/motion/useExperimentParticipant";

export default function ExperimentsFlowClient() {
  useExperimentParticipant({
    factory: () =>
      createFlowParticipant({
        autoCycle: true,
      }),
    blendMs: 500,
  });

  return (
    <main className="relative min-h-screen w-full">
      <header className="fixed top-6 left-6 z-10 text-white/80 text-xs tracking-widest uppercase mix-blend-difference">
        experiments / flow
      </header>
    </main>
  );
}
