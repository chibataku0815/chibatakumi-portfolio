"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SERVICE_KEYS = ["eventPhotography", "highlightVideos", "sameDayDelivery"] as const;

const SERVICE_ICONS = [
  <svg key="camera" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
  </svg>,
  <svg key="video" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
  </svg>,
  <svg key="bolt" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>,
];

export default function ServicesSection() {
  const t = useTranslations("photography.services");
  const sectionRef = useRef<HTMLElement>(null);

  const cards = useMemo(
    () =>
      SERVICE_KEYS.map((key, index) => ({
        key,
        icon: SERVICE_ICONS[index],
      })),
    []
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Card-settle with 3D tilt
      gsap.fromTo(
        ".service-panel",
        { opacity: 0, y: 50, rotateX: 8 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.8,
          stagger: { each: 0.15, from: "start" },
          ease: "expo.out",
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            once: true,
          },
        }
      );

      // Icon pop with bounce ease — delayed after cards
      gsap.fromTo(
        ".service-icon",
        { opacity: 0, scale: 0.5 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.2,
          ease: "back.out(1.56)",
          scrollTrigger: {
            trigger: section,
            start: "top 65%",
            once: true,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="px-6 py-24 sm:py-28" style={{ perspective: "1000px" }}>
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.76fr)_minmax(0,1.24fr)] lg:items-end">
          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-amber1)]">
              {t("label")}
            </p>
            <h2 className="max-w-xl text-[clamp(2rem,4.8vw,4rem)] font-semibold leading-[0.96] tracking-[var(--tracking-tighter)] text-[var(--text-base)]">
              {t("title")}
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
            {t("intro")}
          </p>
        </div>

        <div className="mt-12 grid gap-4 xl:grid-cols-3">
          {cards.map(({ key, icon }) => (
            <article
              key={key}
              className="service-panel group relative overflow-hidden rounded-[1.8rem] border border-[var(--text-base-20)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--slate-2)_88%,transparent),color-mix(in_srgb,var(--slate-1)_72%,transparent))] p-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--heat-subtle),transparent_28%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative z-10">
                <div className="service-icon inline-flex rounded-2xl border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-3)_72%,transparent)] p-3 text-[var(--accent-amber1)]">
                  {icon}
                </div>

                <h3 className="mt-6 text-2xl font-semibold tracking-[var(--tracking-tight)] text-[var(--text-base)]">
                  {t(`${key}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                  {t(`${key}.description`)}
                </p>

                <dl className="mt-8 grid gap-4 border-t border-[var(--text-base-20)] pt-5 text-sm">
                  <div className="grid grid-cols-[7rem_1fr] gap-3">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-40)]">
                      {t(`${key}.deliverableLabel`)}
                    </dt>
                    <dd className="text-[var(--text-base)]">
                      {t(`${key}.deliverableValue`)}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[7rem_1fr] gap-3">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-40)]">
                      {t(`${key}.timingLabel`)}
                    </dt>
                    <dd className="text-[var(--text-base)]">
                      {t(`${key}.timingValue`)}
                    </dd>
                  </div>
                  <div className="grid grid-cols-[7rem_1fr] gap-3">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-40)]">
                      {t(`${key}.focusLabel`)}
                    </dt>
                    <dd className="text-[var(--text-base)]">
                      {t(`${key}.focusValue`)}
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
