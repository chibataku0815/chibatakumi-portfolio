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

const SERVICE_KEYS = [
  "eventPhotography",
  "highlightVideos",
  "sameDayDelivery",
] as const;

const SERVICE_ICONS = [
  <svg
    key="camera"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
    />
  </svg>,
  <svg
    key="video"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m15.75 10.5 4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
    />
  </svg>,
  <svg
    key="bolt"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
    />
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
        index,
      })),
    []
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const { finePointer, reducedMotion } = getPhotographyMotionPreferences();
    const cleanup: Array<() => void> = [];

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".services-copy",
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
        ".service-panel",
        {
          opacity: 0,
          y: PHOTOGRAPHY_MOTION.offset.regular,
          rotateX: reducedMotion ? 0 : PHOTOGRAPHY_MOTION.rotation.panel,
          scale: PHOTOGRAPHY_MOTION.scale.card,
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          scale: 1,
          duration: reducedMotion
            ? PHOTOGRAPHY_MOTION.duration.sm
            : PHOTOGRAPHY_MOTION.duration.lg,
          stagger: { each: PHOTOGRAPHY_MOTION.stagger.regular, from: "start" },
          ease: PHOTOGRAPHY_MOTION.ease.reveal,
          scrollTrigger: {
            trigger: section,
            start: PHOTOGRAPHY_MOTION.scroll.reveal,
            once: true,
          },
        }
      );

      gsap.fromTo(
        ".service-icon",
        { opacity: 0, scale: 0.64 },
        {
          opacity: 1,
          scale: 1,
          duration: PHOTOGRAPHY_MOTION.duration.sm,
          stagger: PHOTOGRAPHY_MOTION.stagger.regular,
          ease: "back.out(1.4)",
          scrollTrigger: {
            trigger: section,
            start: PHOTOGRAPHY_MOTION.scroll.focus,
            once: true,
          },
        }
      );

      if (finePointer && !reducedMotion) {
        gsap.utils.toArray<HTMLElement>(".service-panel").forEach((card) => {
          const inner = card.querySelector<HTMLElement>(".service-inner");
          if (!inner) return;

          const rotateX = gsap.quickTo(card, "rotateX", {
            duration: PHOTOGRAPHY_MOTION.duration.sm,
            ease: PHOTOGRAPHY_MOTION.ease.drift,
          });
          const rotateY = gsap.quickTo(card, "rotateY", {
            duration: PHOTOGRAPHY_MOTION.duration.sm,
            ease: PHOTOGRAPHY_MOTION.ease.drift,
          });
          const x = gsap.quickTo(inner, "x", {
            duration: PHOTOGRAPHY_MOTION.duration.sm,
            ease: PHOTOGRAPHY_MOTION.ease.drift,
          });
          const y = gsap.quickTo(inner, "y", {
            duration: PHOTOGRAPHY_MOTION.duration.sm,
            ease: PHOTOGRAPHY_MOTION.ease.drift,
          });

          const handleMove = (event: MouseEvent) => {
            const bounds = card.getBoundingClientRect();
            const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
            const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;
            rotateX(offsetY * -5);
            rotateY(offsetX * 7);
            x(offsetX * 10);
            y(offsetY * 10);
          };

          const handleLeave = () => {
            rotateX(0);
            rotateY(0);
            x(0);
            y(0);
          };

          card.addEventListener("mousemove", handleMove);
          card.addEventListener("mouseleave", handleLeave);
          cleanup.push(() => {
            card.removeEventListener("mousemove", handleMove);
            card.removeEventListener("mouseleave", handleLeave);
          });
        });
      }
    }, section);

    return () => {
      cleanup.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="px-6 py-24 sm:py-28"
      style={{ perspective: "1200px" }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.76fr)_minmax(0,1.24fr)] lg:items-end">
          <div>
            <p className="services-copy mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-amber1)]">
              {t("label")}
            </p>
            <h2 className="services-copy max-w-xl text-[clamp(2rem,4.8vw,4rem)] font-semibold leading-[0.96] tracking-[var(--tracking-tighter)] text-[var(--text-base)]">
              {t("title")}
            </h2>
          </div>
          <p className="services-copy max-w-2xl text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
            {t("intro")}
          </p>
        </div>

        <div className="mt-12 grid gap-4 xl:grid-cols-3">
          {cards.map(({ key, icon, index }) => (
            <article
              key={key}
              className="service-panel photography-panel group relative overflow-hidden rounded-[1.8rem] border border-[var(--text-base-20)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--slate-2)_88%,transparent),color-mix(in_srgb,var(--slate-1)_72%,transparent))] p-6"
            >
              <span className="photography-panel-edge" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--heat-subtle),transparent_30%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="service-inner relative z-10">
                <div className="flex items-center justify-between gap-4">
                  <div className="service-icon inline-flex rounded-2xl border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-3)_72%,transparent)] p-3 text-[var(--accent-amber1)] shadow-[var(--shadow-elev-1)]">
                    {icon}
                  </div>
                  <span className="photography-hover-meta rounded-full border border-[var(--text-base-20)] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--text-base-40)]">
                    {t("cardLabel", { index: String(index + 1).padStart(2, "0") })}
                  </span>
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
