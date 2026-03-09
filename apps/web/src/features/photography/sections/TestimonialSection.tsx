"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// =============================================================================
// Component
// =============================================================================

export function TestimonialSection() {
  const t = useTranslations("photography.testimonial");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const items = section.querySelectorAll(".testimonial-entry");
      gsap.fromTo(
        items,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.12,
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

  const stats = [
    { value: t("stats.attendeesValue"), label: t("stats.attendeesLabel") },
    { value: t("stats.coverageValue"), label: t("stats.coverageLabel") },
    { value: t("stats.deliveryValue"), label: t("stats.deliveryLabel") },
  ];

  return (
    <section ref={sectionRef} className="px-6 py-24">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        {/* Featured Badge */}
        <div className="testimonial-entry mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--accent-amber1)]/30 px-5 py-2 text-sm text-[var(--accent-amber1)]">
          <span>&#10022;</span>
          <span>
            {t("badge")} — {t("event")}
          </span>
        </div>

        {/* Event Description */}
        <p className="testimonial-entry mx-auto mb-12 max-w-xl text-lg leading-relaxed text-[var(--text-muted)]">
          {t("description")}
        </p>

        {/* Stats Row */}
        <div className="testimonial-entry mb-16 grid w-full max-w-lg grid-cols-3">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center gap-1 px-4${
                i < stats.length - 1 ? " border-r border-[var(--text-base-20)]" : ""
              }`}
            >
              <span className="text-3xl font-bold text-[var(--text-base)]">
                {stat.value}
              </span>
              <span className="text-sm text-[var(--text-muted)]">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="testimonial-entry mx-auto max-w-xl">
          <span className="block text-4xl leading-none text-[var(--accent-amber1)]">
            &ldquo;
          </span>
          <p className="mt-2 text-lg leading-relaxed text-[var(--text-muted)] italic">
            {t("quote")}
          </p>
          <p className="mt-4 text-sm text-[var(--text-base-40)]">
            {t("quoteAuthor")} &middot; {t("quoteRole")}
          </p>
        </div>
      </div>
    </section>
  );
}
