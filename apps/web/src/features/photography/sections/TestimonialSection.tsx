"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

    const ctx = gsap.context(() => {
      // Case entries stagger reveal
      gsap.fromTo(
        ".case-entry",
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
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
      <div className="mx-auto max-w-7xl rounded-[2.2rem] border border-[var(--text-base-20)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--slate-2)_90%,transparent),color-mix(in_srgb,var(--slate-1)_78%,transparent))] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div>
            <p className="case-entry mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-amber1)]">
              {t("label")}
            </p>
            <h2 className="case-entry max-w-xl text-[clamp(2rem,4.6vw,4.2rem)] font-semibold leading-[0.96] tracking-[var(--tracking-tighter)] text-[var(--text-base)]">
              {t("title")}
            </h2>
            <p className="case-entry mt-5 max-w-xl text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
              {t("intro")}
            </p>

            <dl className="case-entry mt-10 grid gap-4 border-t border-[var(--text-base-20)] pt-6 text-sm">
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

          <div className="grid gap-4">
            {caseCards.map((card) => (
              <div
                key={card.title}
                className="case-entry rounded-[1.6rem] border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_72%,transparent)] p-6"
              >
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
