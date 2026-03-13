"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { useHeroFrameMetrics } from "@/shared/hooks/useHeroFrameMetrics";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PhotographyHeroLightLayer } from "../components/PhotographyHeroLightLayer";
import {
  PHOTOGRAPHY_MOTION,
  getPhotographyMotionPreferences,
} from "../motion";

gsap.registerPlugin(ScrollTrigger);

interface HeroSectionProps {
  videoSrc?: string;
  fallbackImage?: string;
}

export function HeroSection({
  videoSrc = "/photography/hero-video.mp4",
  fallbackImage = "/photography/cafe-cursor-01.jpg",
}: HeroSectionProps) {
  const t = useTranslations("photography.hero");
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const frameTopRef = useRef<HTMLDivElement>(null);
  const frameSideRef = useRef<HTMLDivElement>(null);
  const accentRailRef = useRef<HTMLDivElement>(null);
  const ctaRailRef = useRef<HTMLDivElement>(null);
  const proofPanelRef = useRef<HTMLDivElement>(null);
  const sidePanelRef = useRef<HTMLDivElement>(null);

  const proofItems = useMemo(
    () => ["sameDay", "gallery", "bilingual", "coverage"] as const,
    []
  );
  const microChips = useMemo(() => ["sequence", "afterglow"] as const, []);

  const maskRefs = useMemo(
    () => [
      frameTopRef,
      frameSideRef,
      accentRailRef,
      ctaRailRef,
      proofPanelRef,
      sidePanelRef,
    ],
    []
  );

  const maskSet = useHeroFrameMetrics({
    anchorRef: headingRef,
    maskRefs,
  });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const { reducedMotion } = getPhotographyMotionPreferences();

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: {
          ease: PHOTOGRAPHY_MOTION.ease.reveal,
        },
      });

      tl.fromTo(
        ".hero-kicker",
        { opacity: 0, y: PHOTOGRAPHY_MOTION.offset.tight },
        {
          opacity: 1,
          y: 0,
          duration: reducedMotion
            ? PHOTOGRAPHY_MOTION.duration.xs
            : PHOTOGRAPHY_MOTION.duration.sm,
        }
      )
        .fromTo(
          ".hero-headline-line",
          {
            opacity: 0,
            yPercent: reducedMotion ? 18 : 110,
          },
          {
            opacity: 1,
            yPercent: 0,
            duration: reducedMotion
              ? PHOTOGRAPHY_MOTION.duration.sm
              : PHOTOGRAPHY_MOTION.duration.lg,
            stagger: reducedMotion
              ? PHOTOGRAPHY_MOTION.stagger.tight
              : PHOTOGRAPHY_MOTION.stagger.regular,
          },
          "-=0.08"
        )
        .fromTo(
          ".hero-subtext",
          { opacity: 0, y: PHOTOGRAPHY_MOTION.offset.regular },
          {
            opacity: 1,
            y: 0,
            duration: PHOTOGRAPHY_MOTION.duration.md,
          },
          "-=0.5"
        )
        .fromTo(
          ".hero-chip",
          { opacity: 0, y: PHOTOGRAPHY_MOTION.offset.tight },
          {
            opacity: 1,
            y: 0,
            duration: PHOTOGRAPHY_MOTION.duration.sm,
            stagger: PHOTOGRAPHY_MOTION.stagger.tight,
          },
          "-=0.42"
        )
        .fromTo(
          ".hero-cta-row",
          { opacity: 0, y: PHOTOGRAPHY_MOTION.offset.tight },
          {
            opacity: 1,
            y: 0,
            duration: PHOTOGRAPHY_MOTION.duration.sm,
          },
          "-=0.36"
        )
        .fromTo(
          ".hero-proof-shell",
          {
            opacity: 0,
            y: PHOTOGRAPHY_MOTION.offset.regular,
            scale: PHOTOGRAPHY_MOTION.scale.panel,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: reducedMotion
              ? PHOTOGRAPHY_MOTION.duration.sm
              : PHOTOGRAPHY_MOTION.duration.lg,
          },
          "-=0.2"
        )
        .fromTo(
          ".hero-proof-item",
          {
            opacity: 0,
            y: PHOTOGRAPHY_MOTION.offset.tight,
            filter: reducedMotion ? "blur(0px)" : "blur(12px)",
          },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: PHOTOGRAPHY_MOTION.duration.sm,
            stagger: PHOTOGRAPHY_MOTION.stagger.tight,
          },
          "-=0.68"
        )
        .fromTo(
          ".hero-side-shell",
          {
            opacity: 0,
            y: PHOTOGRAPHY_MOTION.offset.regular,
            x: reducedMotion ? 0 : 14,
            scale: PHOTOGRAPHY_MOTION.scale.panel,
          },
          {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            duration: PHOTOGRAPHY_MOTION.duration.lg,
          },
          "-=0.62"
        )
        .fromTo(
          ".hero-side-row",
          {
            opacity: 0,
            x: reducedMotion ? 0 : 18,
          },
          {
            opacity: 1,
            x: 0,
            duration: PHOTOGRAPHY_MOTION.duration.sm,
            stagger: PHOTOGRAPHY_MOTION.stagger.tight,
          },
          "-=0.74"
        );

      if (!reducedMotion) {
        gsap.to(".hero-float", {
          yPercent: -8,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 0.8,
          },
        });

        gsap.to(".hero-ambient-drift", {
          yPercent: -14,
          xPercent: 4,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        });
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-screen items-end overflow-hidden px-5 pb-8 pt-[calc(var(--nav-height)+3.5rem)] sm:px-6 sm:pb-12 sm:pt-32"
    >
      <PhotographyHeroLightLayer
        src={videoSrc}
        fallbackImage={fallbackImage}
        maskSet={maskSet}
      />
      <div className="hero-ambient-drift photography-ambient-orb right-[8%] top-[18%] h-48 w-48 opacity-75 sm:h-64 sm:w-64" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_24%,rgba(255,196,61,0.18),transparent_26%),linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.56)_38%,rgba(0,0,0,0.88))]" />
      <div className="absolute inset-0 opacity-[0.08] mix-blend-screen [background-image:var(--noise-texture)]" />
      <div className="pointer-events-none absolute inset-x-4 inset-y-5 sm:inset-x-6 sm:inset-y-6 lg:inset-x-8">
        <div
          ref={frameTopRef}
          className="frame-line-primary photography-line-breathe absolute left-[2%] right-[18%] top-[5%] h-px"
        />
        <div
          ref={frameSideRef}
          className="frame-line-primary absolute left-[2%] top-[5%] bottom-[16%] w-px"
        />
        <div
          ref={accentRailRef}
          className="frame-line-secondary photography-line-breathe absolute right-[8%] top-[22%] h-[16%] w-px"
        />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.72fr)] lg:items-end">
        <div className="max-w-4xl">
          <p className="hero-kicker mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-amber1)]">
            {t("label")}
          </p>

          <h1
            ref={headingRef}
            className="text-[clamp(2.9rem,10.2vw,8.4rem)] font-semibold leading-[0.95] tracking-[var(--tracking-tighter)] text-[var(--text-base)] [word-break:auto-phrase] sm:leading-[0.9] sm:tracking-[var(--tracking-ultra-tight)]"
          >
            <span className="hero-headline-line block overflow-hidden">
              <span className="block">{t("title")}</span>
            </span>
            <span className="hero-headline-line block overflow-hidden">
              <span className="block text-[color-mix(in_srgb,var(--text-base)_76%,var(--accent-amber1))]">
                {t("titleAccent")}
              </span>
            </span>
          </h1>

          <p className="hero-subtext mt-6 max-w-2xl text-[15px] leading-relaxed text-[var(--text-base-80)] sm:text-lg">
            {t("subtext")}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {microChips.map((chip) => (
              <span
                key={chip}
                className="hero-chip photography-hover-meta inline-flex items-center gap-2 rounded-full border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_62%,transparent)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-base-50)] shadow-[var(--shadow-elev-1)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-amber1)]" />
                {t(`microChips.${chip}`)}
              </span>
            ))}
          </div>

          <div className="hero-cta-row frame-surface relative mt-10 flex flex-wrap items-center gap-4 pt-5">
            <div
              ref={ctaRailRef}
              className="frame-line-secondary photography-line-breathe absolute left-0 top-0 h-px w-[46%]"
            />
            <a
              href="#inquiry"
              className="group inline-flex items-center gap-3 rounded-full border border-[var(--frame-line-secondary)] bg-[var(--surface-glass-dark)] px-7 py-3 text-sm font-medium text-[var(--text-base)] shadow-[var(--shadow-frame-panel)] transition-all duration-300 hover:border-[var(--accent-amber2)] hover:text-[var(--accent-amber1)]"
            >
              {t("ctaBook")}
              <svg
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </a>
            <a
              href="#gallery"
              className="inline-flex items-center gap-3 rounded-full border border-[var(--frame-line-primary)] bg-[var(--surface-glass-dark)] px-6 py-3 text-sm text-[var(--text-base-60)] shadow-[var(--shadow-frame-glass)] transition-colors duration-300 hover:border-[var(--stroke-strong)] hover:text-[var(--text-base)]"
            >
              {t("ctaPortfolio")}
            </a>
          </div>

          <div
            ref={proofPanelRef}
            className="hero-proof-shell photography-panel frame-panel-editorial relative mt-16 rounded-[1.6rem] border border-[var(--frame-line-primary)] px-4 py-5 sm:px-5"
          >
            <span className="photography-panel-edge" />
            <div className="frame-line-primary photography-line-breathe absolute inset-x-5 top-0 h-px" />
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--text-base-40)]">
                {t("proofLabel")}
              </p>
              <p className="photography-hover-meta rounded-full border border-[var(--text-base-20)] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--text-base-40)]">
                {t("proofMeta")}
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {proofItems.map((item) => (
                <div
                  key={item}
                  className="hero-proof-item photography-panel relative rounded-[1.35rem] border border-[var(--frame-line-primary)] bg-[var(--surface-glass-dark)] px-4 py-4 shadow-[var(--shadow-frame-glass)] backdrop-blur-sm"
                >
                  <span className="photography-panel-edge" />
                  <div className="photography-hover-lift">
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-base-40)]">
                      {t(`proofItems.${item}.title`)}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-base)]">
                      {t(`proofItems.${item}.value`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-float lg:pb-5">
          <div
            ref={sidePanelRef}
            className="hero-side-shell photography-panel frame-panel-editorial relative overflow-hidden rounded-[2rem] border border-[var(--frame-line-primary)] p-6 backdrop-blur-sm"
          >
            <span className="photography-panel-edge" />
            <div className="frame-line-secondary photography-line-breathe absolute inset-x-8 top-0 h-px opacity-80" />
            <div className="flex items-center justify-between gap-4">
              <p className="hero-side-row font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--accent-amber1)]">
                {t("sideKicker")}
              </p>
              <span className="hero-side-row photography-hover-meta rounded-full border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_72%,transparent)] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--text-base-40)]">
                {t("sideNote")}
              </span>
            </div>
            <h2 className="hero-side-row text-balance mt-4 max-w-[12ch] text-3xl font-semibold tracking-[var(--tracking-tight)] text-[var(--text-base)]">
              {t("sideTitle")}
            </h2>
            <p className="hero-side-row mt-4 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
              {t("sideBody")}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="hero-side-row border-t border-[var(--text-base-20)] pt-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-base-40)]">
                  {t("sideMeta.whenLabel")}
                </p>
                <p className="mt-2 text-sm text-[var(--text-base)]">
                  {t("sideMeta.whenValue")}
                </p>
              </div>
              <div className="hero-side-row border-t border-[var(--text-base-20)] pt-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-base-40)]">
                  {t("sideMeta.whereLabel")}
                </p>
                <p className="mt-2 text-sm text-[var(--text-base)]">
                  {t("sideMeta.whereValue")}
                </p>
              </div>
              <div className="hero-side-row border-t border-[var(--text-base-20)] pt-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-base-40)]">
                  {t("sideMeta.roleLabel")}
                </p>
                <p className="mt-2 text-sm text-[var(--text-base)]">
                  {t("sideMeta.roleValue")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 md:block">
        <a
          href="#gallery"
          className="inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--text-base-40)] transition-colors hover:text-[var(--text-base)]"
        >
          <span>{t("scrollLabel")}</span>
          <span className="inline-flex h-8 w-5 items-start justify-center rounded-full border border-[var(--text-base-20)] p-1">
            <span className="animate-scroll-dot h-1.5 w-1.5 rounded-full bg-[var(--accent-amber1)]" />
          </span>
        </a>
      </div>
    </section>
  );
}
