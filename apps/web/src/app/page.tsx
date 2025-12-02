export default function Home() {
  return (
    <div className="relative">
      <section className="relative flex h-[78vh] min-h-[600px] w-full flex-col items-center justify-end overflow-hidden">
        <div className="pointer-events-none z-10 mb-24 flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold tracking-tight text-text-base sm:text-5xl md:text-6xl">
            Takumi Chiba
          </h1>
          <p className="mt-2 text-lg font-normal text-text-muted sm:text-xl">
            Creative Developer
          </p>
        </div>

        <div className="pointer-events-none absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-text-muted">
            Scroll
          </span>
          <div className="h-8 w-px bg-gradient-to-b from-text-muted to-transparent" />
        </div>
      </section>

      <section className="section-content">
        <div className="section-content__inner">
          <h2 className="mb-8 text-2xl font-semibold text-text-base">
            Selected Works
          </h2>
          <p className="text-text-muted">
            Projects and experiments in creative development, interactive design,
            and visual experiences.
          </p>
        </div>
      </section>
    </div>
  );
}
