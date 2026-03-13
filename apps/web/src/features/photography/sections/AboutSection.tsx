"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  PHOTOGRAPHY_MOTION,
  getPhotographyMotionPreferences,
} from "../motion";

gsap.registerPlugin(ScrollTrigger);

export default function AboutSection() {
  const t = useTranslations("photography.about");
  const sectionRef = useRef<HTMLElement>(null);

  const points = useMemo(
    () => ["community", "bilingual", "delivery"] as const,
    []
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const { reducedMotion } = getPhotographyMotionPreferences();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".about-copy",
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
        ".about-rail-line",
        {
          clipPath: "inset(0 0 100% 0)",
          opacity: 0.4,
        },
        {
          clipPath: "inset(0 0 0% 0)",
          opacity: 1,
          duration: reducedMotion
            ? PHOTOGRAPHY_MOTION.duration.sm
            : PHOTOGRAPHY_MOTION.duration.lg,
          ease: PHOTOGRAPHY_MOTION.ease.handoff,
          scrollTrigger: {
            trigger: section,
            start: PHOTOGRAPHY_MOTION.scroll.reveal,
            once: true,
          },
        }
      );

      gsap.fromTo(
        ".about-point",
        {
          opacity: 0,
          y: PHOTOGRAPHY_MOTION.offset.regular,
          rotateX: reducedMotion ? 0 : PHOTOGRAPHY_MOTION.rotation.panel,
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: PHOTOGRAPHY_MOTION.duration.md,
          stagger: PHOTOGRAPHY_MOTION.stagger.regular,
          ease: PHOTOGRAPHY_MOTION.ease.reveal,
          scrollTrigger: {
            trigger: ".about-points",
            start: PHOTOGRAPHY_MOTION.scroll.reveal,
            once: true,
          },
        }
      );

      if (!reducedMotion) {
        gsap.to(".about-ghost", {
          yPercent: -8,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8,
          },
        });
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden px-6 py-24 sm:py-28">
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-16 items-center justify-center md:flex">
        <div className="about-rail-line absolute inset-y-16 left-8 w-px bg-white/20" />
        <div className="-rotate-90 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.34em] text-[var(--text-base-40)]">
          {t("railLabel")}
        </div>
      </div>

      <div className="about-ghost pointer-events-none absolute right-[4%] top-[12%] hidden select-none whitespace-nowrap text-[clamp(5rem,14vw,11rem)] font-black uppercase leading-none tracking-[-0.08em] text-white/[0.05] md:block">
        {t("ghostWord")}
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
        <div>
          <p className="about-copy mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-amber1)]">
            {t("label")}
          </p>
          <h2 className="about-copy max-w-xl text-[clamp(2rem,4.5vw,4rem)] font-semibold leading-[0.96] tracking-[var(--tracking-tighter)] text-[var(--text-base)]">
            {t("title")}
            <br />
            <span className="text-[var(--text-base-60)]">{t("titleSub")}</span>
          </h2>
        </div>

        <div>
          <p className="about-copy max-w-2xl text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
            {t("body")}
          </p>

          <div
            className="about-points mt-10 grid gap-4 md:grid-cols-3"
            style={{ perspective: "1000px" }}
          >
            {points.map((point, index) => (
              <article
                key={point}
                className="about-point photography-panel rounded-[1.5rem] border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_72%,transparent)] p-5"
              >
                <span className="photography-panel-edge" />
                <div className="flex items-center justify-between gap-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-40)]">
                    0{index + 1}
                  </p>
                  <span className="photography-hover-meta rounded-full border border-[var(--text-base-20)] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--text-base-40)]">
                    {t("pointMeta")}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-[var(--text-base)]">
                  {t(`points.${point}Title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {t(`points.${point}Body`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
