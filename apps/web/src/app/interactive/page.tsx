import { AnimatedHeading } from "@/shared/components";

const cards = [
  {
    title: "WebGL Experiences",
    description:
      "GPU-accelerated visuals with Three.js and custom GLSL shaders for immersive web experiences.",
    tags: ["Three.js", "GLSL", "WebGL"],
  },
  {
    title: "Data Visualization",
    description:
      "Interactive charts and graphs that reveal patterns in complex data through exploration.",
    tags: ["D3.js", "Canvas", "SVG"],
  },
  {
    title: "Generative Art",
    description:
      "Algorithm-driven visuals that evolve with user interaction and procedural logic.",
    tags: ["Noise", "Procedural", "Real-time"],
  },
];

export default function InteractivePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-dark)] pt-32 pb-24">
      {/* Hero */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl">
          <span className="mb-4 block font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent-amber1)]/60">
            Interactive
          </span>
          <AnimatedHeading
            as="h1"
            className="text-[clamp(2.5rem,8vw,5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--text-base)]"
          >
            Beyond Static
          </AnimatedHeading>
        </div>
      </section>

      {/* Cards Grid */}
      <section className="px-6">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
          {cards.map((card, index) => (
            <article
              key={index}
              className="flex flex-col gap-4 rounded-lg bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.04]"
            >
              {/* Visual placeholder */}
              <div className="aspect-square w-full bg-gradient-to-br from-white/5 to-transparent rounded-md" />

              <div className="flex flex-wrap gap-1.5">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--accent-amber1)]/60 bg-[var(--accent-amber1)]/10 px-1.5 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <h2 className="text-lg font-semibold tracking-tight text-[var(--text-base)]">
                {card.title}
              </h2>
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                {card.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
