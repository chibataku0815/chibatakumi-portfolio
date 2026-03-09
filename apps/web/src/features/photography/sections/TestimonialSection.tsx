"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function TestimonialSection() {
  const t = useTranslations("photography.testimonial");
  const sectionRef = useRef<HTMLElement>(null);

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

      // Stats counter ignition
      const statEls = section.querySelectorAll(".stat-value");
      statEls.forEach((el, i) => {
        const text = (el as HTMLElement).textContent || "";
        const numericMatch = text.match(/(\d+)/);
        if (!numericMatch) return;

        const target = parseInt(numericMatch[1]);
        const suffix = text.replace(/\d+/, "");
        const prefix = text.substring(0, text.indexOf(numericMatch[1]));
        const obj = { val: 0 };

        gsap.to(obj, {
          val: target,
          duration: 1.6,
          ease: "power2.out",
          delay: 0.5 + i * 0.15,
          onUpdate: () => {
            (el as HTMLElement).textContent = prefix + Math.floor(obj.val) + suffix;
          },
          onComplete: () => {
            gsap.fromTo(
              el,
              { scale: 1 },
              {
                scale: 1.12,
                duration: 0.15,
                ease: "power2.out",
                yoyo: true,
                repeat: 1,
              }
            );
          },
          scrollTrigger: {
            trigger: section,
            start: "top 70%",
            once: true,
          },
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const stats = [
    { value: t("stats.attendeesValue"), label: t("stats.attendeesLabel") },
    { value: t("stats.coverageValue"), label: t("stats.coverageLabel") },
    { value: t("stats.deliveryValue"), label: t("stats.deliveryLabel") },
  ];

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

            <div className="case-entry mt-10 inline-flex items-center gap-3 rounded-full border border-[var(--accent-amber1)]/30 px-5 py-2 text-sm text-[var(--accent-amber1)]">
              <span>&#10022;</span>
              <span>
                {t("badge")} / {t("event")}
              </span>
            </div>

            <dl className="case-entry mt-10 grid gap-4 border-t border-[var(--text-base-20)] pt-6 text-sm">
              <div className="grid grid-cols-[7rem_1fr] gap-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-40)]">
                  {t("eventLabel")}
                </dt>
                <dd className="text-[var(--text-base)]">
                  {t("event")} {t("organizer")}
                </dd>
              </div>
              <div className="grid grid-cols-[7rem_1fr] gap-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-40)]">
                  {t("dateLabel")}
                </dt>
                <dd className="text-[var(--text-base)]">{t("date")}</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-8">
            <div className="case-entry rounded-[1.6rem] border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_72%,transparent)] p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-40)]">
                {t("caseTitle")}
              </p>
              <p className="mt-4 text-base leading-relaxed text-[var(--text-base)]">
                {t("description")}
              </p>
            </div>

            <div className="case-entry grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[1.4rem] border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_72%,transparent)] p-5"
                >
                  <p className="stat-value inline-block text-3xl font-semibold tracking-[var(--tracking-tight)] text-[var(--accent-amber1)]">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="case-entry grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="rounded-[1.6rem] border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_72%,transparent)] p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-40)]">
                  {t("outcomeTitle")}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
                  {t("outcomeBody")}
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-[var(--text-base-20)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--slate-3)_70%,transparent),color-mix(in_srgb,var(--slate-2)_76%,transparent))] p-6">
                <span className="block text-5xl leading-none text-[var(--accent-amber1)]">
                  &ldquo;
                </span>
                <p className="mt-3 text-lg leading-relaxed text-[var(--text-base)] italic">
                  {t("quote")}
                </p>
                <p className="mt-4 text-sm text-[var(--text-base-40)]">
                  {t("quoteAuthor")} · {t("quoteRole")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
