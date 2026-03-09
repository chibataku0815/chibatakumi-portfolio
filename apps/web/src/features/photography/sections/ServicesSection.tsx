"use client";

import { useEffect, useRef } from "react";
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
  const servicesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!servicesRef.current) return;

    const cards = servicesRef.current.querySelectorAll(".service-card");
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: servicesRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="px-6 py-24">
      <div ref={servicesRef} className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
        {SERVICE_KEYS.map((key, i) => (
          <div
            key={key}
            className="service-card rounded-2xl border border-[var(--text-base-20)] bg-[var(--bg-darker)] p-8 transition-all duration-300 hover:border-[var(--accent-amber1)]/40"
          >
            <div className="mb-4 inline-flex rounded-xl bg-[var(--accent-amber1)]/10 p-3 text-[var(--accent-amber1)]">
              {SERVICE_ICONS[i]}
            </div>
            <h3 className="mb-2 text-lg font-semibold text-[var(--text-base)]">
              {t(`${key}.title`)}
            </h3>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              {t(`${key}.description`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
