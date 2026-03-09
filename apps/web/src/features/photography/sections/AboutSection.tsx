"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

    const ctx = gsap.context(() => {
      // Text block: scroll-driven opacity reveal
      gsap.fromTo(
        ".about-text-block",
        { opacity: 0.3 },
        {
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 70%",
            end: "center center",
            scrub: 0.5,
          },
        }
      );

      // Point cards: card-settle stagger with 3D tilt
      gsap.fromTo(
        ".about-point",
        { opacity: 0, y: 36, rotateX: 6 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "cubic-bezier(0.22, 1, 0.36, 1)",
          scrollTrigger: {
            trigger: ".about-points",
            start: "top 80%",
            once: true,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="px-6 py-24 sm:py-28">
      <div className="about-text-block mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
        <div>
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-amber1)]">
            {t("label")}
          </p>
          <h2 className="max-w-xl text-[clamp(2rem,4.5vw,4rem)] font-semibold leading-[0.96] tracking-[var(--tracking-tighter)] text-[var(--text-base)]">
            {t("title")}
            <br />
            <span className="text-[var(--text-base-60)]">{t("titleSub")}</span>
          </h2>
        </div>

        <div>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--text-muted)] sm:text-lg">
            {t("body")}
          </p>

          <div className="about-points mt-10 grid gap-4 md:grid-cols-3" style={{ perspective: "800px" }}>
            {points.map((point, index) => (
              <article
                key={point}
                className="about-point rounded-[1.5rem] border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_72%,transparent)] p-5"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-40)]">
                  0{index + 1}
                </p>
                <h3 className="mt-3 text-base font-semibold text-[var(--text-base)]">
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
