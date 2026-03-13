"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  PHOTOGRAPHY_MOTION,
  getPhotographyMotionPreferences,
} from "../motion";

gsap.registerPlugin(ScrollTrigger);

export function TestimonialSection() {
  const t = useTranslations("photography.testimonial");
  const sectionRef = useRef<HTMLElement>(null);
  const caseCards = [
    { title: t("focusTitle"), body: t("focusBody") },
    { title: t("deliverablesTitle"), body: t("deliverablesBody") },
    { title: t("approachTitle"), body: t("approachBody") },
  ];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const { reducedMotion } = getPhotographyMotionPreferences();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".case-copy",
        { opacity: 0, y: PHOTOGRAPHY_MOTION.offset.regular },
        {
          opacity: 1,
          y: 0,
          duration: PHOTOGRAPHY_MOTION.duration.lg,
          stagger: PHOTOGRAPHY_MOTION.stagger.tight,
          ease: PHOTOGRAPHY_MOTION.ease.reveal,
          scrollTrigger: {
            trigger: section,
            start: PHOTOGRAPHY_MOTION.scroll.entry,
            once: true,
          },
        }
      );

      gsap.fromTo(
        ".case-card",
        {
          opacity: 0,
          y: PHOTOGRAPHY_MOTION.offset.regular,
          x: reducedMotion ? 0 : 10,
          scale: PHOTOGRAPHY_MOTION.scale.card,
        },
        {
          opacity: 1,
          y: 0,
          x: 0,
          scale: 1,
          duration: reducedMotion
            ? PHOTOGRAPHY_MOTION.duration.sm
            : PHOTOGRAPHY_MOTION.duration.md,
          stagger: PHOTOGRAPHY_MOTION.stagger.regular,
          ease: PHOTOGRAPHY_MOTION.ease.reveal,
          scrollTrigger: {
            trigger: section,
            start: PHOTOGRAPHY_MOTION.scroll.reveal,
            once: true,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="px-6 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl rounded-[2.2rem] border border-[var(--text-base-20)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--slate-2)_90%,transparent),color-mix(in_srgb,var(--slate-1)_78%,transparent))] p-6 shadow-[var(--shadow-elev-2)] sm:p-8 lg:p-10">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div>
            <div className="case-copy flex items-center gap-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-amber1)]">
                {t("label")}
              </p>
              <span className="h-px flex-1 bg-[var(--text-base-20)]" />
            </div>
            <h2 className="case-copy mt-4 max-w-xl text-[clamp(2rem,4.6vw,4.2rem)] font-semibold leading-[0.96] tracking-[var(--tracking-tighter)] text-[var(--text-base)]">
              {t("title")}
            </h2>
            <p className="case-copy mt-5 max-w-xl text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
              {t("intro")}
            </p>

            <div className="case-copy photography-panel mt-8 rounded-[1.55rem] border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_68%,transparent)] p-5">
              <span className="photography-panel-edge" />
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-40)]">
                  {t("overviewLabel")}
                </p>
                <span className="photography-hover-meta rounded-full border border-[var(--text-base-20)] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--text-base-40)]">
                  {t("event")}
                </span>
              </div>
              <dl className="mt-5 grid gap-4 border-t border-[var(--text-base-20)] pt-5 text-sm">
                <div className="grid grid-cols-[7rem_1fr] gap-3">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-40)]">
                    {t("eventLabel")}
                  </dt>
                  <dd className="text-[var(--text-base)]">{t("event")}</dd>
                </div>
                <div className="grid grid-cols-[7rem_1fr] gap-3">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-40)]">
                    {t("dateLabel")}
                  </dt>
                  <dd className="text-[var(--text-base)]">{t("date")}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="case-card photography-panel rounded-[1.6rem] border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_72%,transparent)] p-6 md:col-span-2">
              <span className="photography-panel-edge" />
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-40)]">
                {caseCards[0].title}
              </p>
              <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-[var(--text-base)] sm:text-base">
                {caseCards[0].body}
              </p>
            </div>
            {caseCards.slice(1).map((card) => (
              <div
                key={card.title}
                className="case-card photography-panel rounded-[1.6rem] border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_72%,transparent)] p-6"
              >
                <span className="photography-panel-edge" />
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-40)]">
                  {card.title}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-[var(--text-base)] sm:text-base">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
