"use client";

import { StagedEmphasisPayoffSurface } from "./StagedEmphasisPayoffSurface";
import { stagedEmphasisPayoffFixtures } from "./fixtures";

type StagedEmphasisPayoffReferenceWorkProps = {
  autoPlay?: boolean;
  captureMode?: boolean;
  frameOverride?: number | null;
};

export function StagedEmphasisPayoffReferenceWork({
  autoPlay = true,
  captureMode = false,
  frameOverride = null,
}: StagedEmphasisPayoffReferenceWorkProps) {
  if (captureMode) {
    return (
      <main className="min-h-screen bg-[#ecebe6] px-2 py-2 text-black sm:px-3 sm:py-3">
        <div className="mx-auto max-w-7xl">
          <StagedEmphasisPayoffSurface
            autoPlay={autoPlay}
            captureMode
            frameOverride={frameOverride}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#ecebe6] px-4 py-24 text-black sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-black/55">
            {stagedEmphasisPayoffFixtures.eyebrow}
          </p>
          <h1 className="mt-4 text-[clamp(2.5rem,7vw,5.5rem)] font-semibold leading-[0.94] tracking-[-0.05em] text-black">
            {stagedEmphasisPayoffFixtures.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-black/60 sm:text-lg">
            `SVG + DOM` を main home に固定した first-source benchmark pass。
            2 秒の station title build / payoff hold / delayed disappearance を
            grapheme 単位で狭く再現して、family helper の contract だけを確認する。
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <StagedEmphasisPayoffSurface
            autoPlay={autoPlay}
            frameOverride={frameOverride}
          />

          <aside className="rounded-[28px] border border-black/10 bg-black/[0.025] p-6">
            <div className="space-y-6">
              <section>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/50">
                  Runtime
                </p>
                <p className="mt-3 text-sm leading-relaxed text-black/60">
                  {stagedEmphasisPayoffFixtures.runtimeLabel}
                </p>
              </section>

              <section>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/50">
                  Technique Family
                </p>
                <ul className="mt-3 space-y-2 text-sm text-black">
                  {stagedEmphasisPayoffFixtures.techniqueFamily.map((item) => (
                    <li
                      key={item}
                      className="border-l border-black/15 pl-3 font-mono text-[12px] tracking-[0.12em]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/50">
                  Extraction Targets
                </p>
                <ul className="mt-3 space-y-2 text-sm text-black">
                  {stagedEmphasisPayoffFixtures.extractionTargets.map((target) => (
                    <li
                      key={target}
                      className="border-l border-black/15 pl-3 font-mono text-[12px] tracking-[0.12em]"
                    >
                      {target}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/50">
                  Phrase
                </p>
                <p className="mt-3 text-sm leading-relaxed text-black/60">
                  {stagedEmphasisPayoffFixtures.phrase}
                </p>
              </section>

              <section>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/50">
                  Benchmark
                </p>
                <p className="mt-3 text-xs leading-relaxed text-black/55">
                  {stagedEmphasisPayoffFixtures.benchmarkLabel}
                </p>
              </section>

              <section>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-black/50">
                  Non-Goals
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-black/60">
                  {stagedEmphasisPayoffFixtures.nonGoals.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
