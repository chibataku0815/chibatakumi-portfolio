"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { stagedEmphasisPayoffFixtures } from "./fixtures";
import { StagedEmphasisPayoffSurface } from "./StagedEmphasisPayoffSurface";

type Props = {
  autoPlay?: boolean;
  captureMode?: boolean;
  frameOverride?: number | null;
};

export function StagedEmphasisPayoffReferenceWork({
  autoPlay = true,
  captureMode = false,
  frameOverride = null,
}: Props) {
  if (captureMode) {
    return (
      <main className="min-h-screen px-2 py-2 sm:px-3 sm:py-3">
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

  return <DetailPage autoPlay={autoPlay} frameOverride={frameOverride} />;
}

function DetailPage({
  autoPlay,
  frameOverride,
}: {
  autoPlay: boolean;
  frameOverride: number | null;
}) {
  const t = useTranslations("journal.motionStudies");
  const tEntry = useTranslations("journal.motionStudies.entries.stagedEmphasisPayoff");

  return (
    <main className="relative min-h-screen text-[var(--text-base)]">
      <article>
        <header
          data-readability="focus"
          className="px-6 pt-32 pb-20 sm:px-12 sm:pt-32 sm:pb-24 lg:px-20"
        >
          <div className="mx-auto max-w-6xl">
            <Link
              href="/journal#staged-emphasis-payoff"
              data-transition="true"
              className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--text-base-50)] transition-colors hover:text-[var(--text-base)]"
            >
              {t("backLabel")}
            </Link>
            <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--text-base-60)]">
              {tEntry("context")}
            </p>
            <h1 className="mt-8 text-[clamp(2.5rem,8vw,5.5rem)] font-medium leading-[0.96] tracking-[-0.04em] text-[var(--text-base)]">
              {tEntry("title")}
            </h1>
            <p className="mt-8 max-w-[44ch] text-[1.125rem] leading-[1.7] text-[var(--text-muted)]">
              {tEntry("heroProse")}
            </p>
          </div>
        </header>

        <section
          data-readability="reading"
          className="px-6 pb-32 sm:px-12 lg:px-20"
        >
          <div className="mx-auto grid max-w-6xl gap-y-12 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-x-20">
            <div>
              <StagedEmphasisPayoffSurface
                autoPlay={autoPlay}
                frameOverride={frameOverride}
              />
            </div>
            <aside className="space-y-10 lg:sticky lg:top-32 lg:self-start">
              <SidebarSection label="Runtime">
                <p className="text-sm leading-relaxed text-[var(--text-base-80)]">
                  {stagedEmphasisPayoffFixtures.runtimeLabel}
                </p>
              </SidebarSection>

              <SidebarSection label="Stack">
                <ul className="space-y-1.5 font-mono text-[12px] tracking-[0.06em] text-[var(--text-base-80)]">
                  {stagedEmphasisPayoffFixtures.techniqueFamily.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </SidebarSection>

              <SidebarSection label="Extraction">
                <ul className="space-y-1.5 font-mono text-[12px] tracking-[0.06em] text-[var(--text-base-80)]">
                  {stagedEmphasisPayoffFixtures.extractionTargets.map((target) => (
                    <li key={target}>{target}</li>
                  ))}
                </ul>
              </SidebarSection>

              <SidebarSection label="Subject">
                <p className="text-sm leading-relaxed text-[var(--text-base-80)]">
                  {stagedEmphasisPayoffFixtures.phrase}
                </p>
              </SidebarSection>

              <SidebarSection label="Non-Goals">
                <ul className="space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {stagedEmphasisPayoffFixtures.nonGoals.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </SidebarSection>
            </aside>
          </div>
        </section>
      </article>
    </main>
  );
}

function SidebarSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--text-base-50)]">
        {label}
      </p>
      <div className="mt-3">{children}</div>
    </section>
  );
}
