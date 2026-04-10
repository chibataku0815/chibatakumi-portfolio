"use client";

import { AnchoredProgressResolveSurface } from "./AnchoredProgressResolveSurface";
import { anchoredProgressResolveFixtures } from "./fixtures";

type AnchoredProgressResolveReferenceWorkProps = {
  autoPlay?: boolean;
  captureMode?: boolean;
  frameOverride?: number | null;
};

export function AnchoredProgressResolveReferenceWork({
  autoPlay = true,
  captureMode = false,
  frameOverride = null,
}: AnchoredProgressResolveReferenceWorkProps) {
  if (captureMode) {
    return (
      <main className="min-h-screen bg-[var(--bg-dark)] px-2 py-2 text-[var(--text-base)] sm:px-3 sm:py-3">
        <div className="mx-auto max-w-7xl">
          <AnchoredProgressResolveSurface
            autoPlay={autoPlay}
            captureMode
            frameOverride={frameOverride}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-dark)] px-4 py-24 text-[var(--text-base)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-base-60)]">
            {anchoredProgressResolveFixtures.eyebrow}
          </p>
          <h1 className="mt-4 text-[clamp(2.5rem,7vw,5.5rem)] font-semibold leading-[0.94] tracking-[-0.05em] text-[var(--text-base)]">
            {anchoredProgressResolveFixtures.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
            `SVG + DOM` に main home を固定した narrow proof。loading, waiting,
            resolve の 3-state だけに絞り、anchored progress behavior の grammar
            を primitive shapes だけで検証する。
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <AnchoredProgressResolveSurface
            autoPlay={autoPlay}
            frameOverride={frameOverride}
          />

          <aside className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="space-y-6">
              <section>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-60)]">
                  Runtime
                </p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                  {anchoredProgressResolveFixtures.runtimeLabel}
                </p>
              </section>

              <section>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-60)]">
                  Technique Family
                </p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--text-base)]">
                  {anchoredProgressResolveFixtures.techniqueFamily.map((item) => (
                    <li
                      key={item}
                      className="border-l border-white/15 pl-3 font-mono text-[12px] tracking-[0.12em]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-60)]">
                  Extraction Targets
                </p>
                <ul className="mt-3 space-y-2 text-sm text-[var(--text-base)]">
                  {anchoredProgressResolveFixtures.extractionTargets.map((target) => (
                    <li
                      key={target}
                      className="border-l border-white/15 pl-3 font-mono text-[12px] tracking-[0.12em]"
                    >
                      {target}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-60)]">
                  Non-Goals
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {anchoredProgressResolveFixtures.nonGoals.map((item) => (
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
