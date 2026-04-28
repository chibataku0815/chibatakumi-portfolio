"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { portfolioData } from "@/shared/data/portfolio";
import { useHeroFrameMetrics } from "@/shared/hooks/useHeroFrameMetrics";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HomeHeroLightLayer } from "./HomeHeroLightLayer";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function ArrowOutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path
        d="M5.833 14.167L14.167 5.833M7.5 5.833h6.667V12.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const socialIcons = {
  github: GithubIcon,
  x: XIcon,
  instagram: InstagramIcon,
} as const;

export function HomeHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const ctaGroupRef = useRef<HTMLDivElement>(null);
  const domainRailRef = useRef<HTMLDivElement>(null);
  const frameTopRef = useRef<HTMLDivElement>(null);
  const frameSideRef = useRef<HTMLDivElement>(null);
  const titleCapRef = useRef<HTMLDivElement>(null);
  const socialRailRef = useRef<HTMLDivElement>(null);
  const proofPanelRef = useRef<HTMLDivElement>(null);
  const proofLineRef = useRef<HTMLDivElement>(null);
  const proofLabelRef = useRef<HTMLParagraphElement>(null);
  const proofTitleRef = useRef<HTMLHeadingElement>(null);
  const proofBodyRef = useRef<HTMLParagraphElement>(null);
  const proofFootRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  const { site, hero, branding } = portfolioData;
  const { domains, primaryCta, secondaryCta, socialLinks, scrollText } = hero;
  const [activeDomainId, setActiveDomainId] = useState(domains[0]?.id ?? "");
  const [reducedMotion, setReducedMotion] = useState(false);

  const activeDomain = useMemo(
    () => domains.find((domain) => domain.id === activeDomainId) ?? domains[0],
    [activeDomainId, domains]
  );

  const activeIndex = useMemo(
    () => Math.max(domains.findIndex((domain) => domain.id === activeDomainId), 0),
    [activeDomainId, domains]
  );

  const maskRefs = useMemo(
    () => [
      frameTopRef,
      frameSideRef,
      titleCapRef,
      socialRailRef,
      domainRailRef,
      proofLineRef,
    ],
    []
  );

  const maskSet = useHeroFrameMetrics({
    anchorRef: titleRef,
    maskRefs,
  });

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPreference = () => {
      setReducedMotion(query.matches);
    };

    applyMotionPreference();
    query.addEventListener("change", applyMotionPreference);

    return () => {
      query.removeEventListener("change", applyMotionPreference);
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const lineTargets = [
        { element: frameTopRef.current, axis: "x" as const, origin: "left center" },
        { element: frameSideRef.current, axis: "y" as const, origin: "center top" },
        { element: titleCapRef.current, axis: "x" as const, origin: "right center" },
        { element: socialRailRef.current, axis: "x" as const, origin: "left center" },
        { element: domainRailRef.current, axis: "x" as const, origin: "left center" },
        { element: proofLineRef.current, axis: "x" as const, origin: "left center" },
      ].filter(
        (
          target
        ): target is {
          element: HTMLDivElement;
          axis: "x" | "y";
          origin: string;
        } => Boolean(target.element)
      );

      const setVisible = () => {
        const immediateTargets = [
          eyebrowRef.current,
          titleRef.current,
          descriptionRef.current,
          ctaGroupRef.current,
          proofPanelRef.current,
          scrollHintRef.current,
        ].filter(
          (
            target
          ): target is HTMLParagraphElement | HTMLHeadingElement | HTMLDivElement => target !== null
        );

        gsap.set(immediateTargets, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          clearProps: "transform",
        });
        gsap.set("[data-home-reveal='domain']", { autoAlpha: 1, x: 0, y: 0 });
        gsap.set("[data-home-reveal='social']", { autoAlpha: 1, x: 0, y: 0 });

        for (const target of lineTargets) {
          gsap.set(target.element, {
            transformOrigin: target.origin,
            scaleX: 1,
            scaleY: 1,
          });
        }
      };

      if (reducedMotion) {
        setVisible();
        return;
      }

      for (const target of lineTargets) {
        gsap.set(target.element, {
          transformOrigin: target.origin,
          scaleX: target.axis === "x" ? 0 : 1,
          scaleY: target.axis === "y" ? 0 : 1,
        });
      }

      const tl = gsap.timeline({
        defaults: {
          ease: "power3.out",
        },
      });

      tl.fromTo(
        eyebrowRef.current,
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.6 }
      )
        .to(frameTopRef.current, { scaleX: 1, duration: 0.82 }, "<")
        .to(frameSideRef.current, { scaleY: 1, duration: 0.96 }, "<+0.08")
        .fromTo(
          titleRef.current,
          { autoAlpha: 0, y: 28, scale: 0.985, filter: "blur(10px)" },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 1.08,
            clearProps: "filter",
          },
          "-=0.42"
        )
        .to(titleCapRef.current, { scaleX: 1, duration: 0.72 }, "<+0.06")
        .fromTo(
          descriptionRef.current,
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.7 },
          "-=0.56"
        )
        .fromTo(
          ctaGroupRef.current,
          { autoAlpha: 0, y: 18 },
          { autoAlpha: 1, y: 0, duration: 0.72 },
          "-=0.48"
        )
        .fromTo(
          "[data-home-reveal='domain']",
          { autoAlpha: 0, y: 12 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.56,
            stagger: 0.08,
          },
          "-=0.34"
        )
        .to(domainRailRef.current, { scaleX: 1, duration: 0.74 }, "<+0.06")
        .fromTo(
          proofPanelRef.current,
          { autoAlpha: 0, x: 18, y: 24 },
          { autoAlpha: 1, x: 0, y: 0, duration: 0.84 },
          "-=0.56"
        )
        .to(proofLineRef.current, { scaleX: 1, duration: 0.78 }, "<+0.08")
        .fromTo(
          "[data-home-reveal='social']",
          { autoAlpha: 0, y: 10 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.52,
            stagger: 0.06,
          },
          "-=0.38"
        )
        .to(socialRailRef.current, { scaleX: 1, duration: 0.7 }, "<+0.02")
        .fromTo(
          scrollHintRef.current,
          { autoAlpha: 0, y: 8 },
          { autoAlpha: 1, y: 0, duration: 0.56 },
          "-=0.16"
        );

      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom top",
        scrub: 0.9,
        onUpdate: (self) => {
          const progress = self.progress;

          if (titleRef.current) {
            gsap.set(titleRef.current, {
              y: -progress * 52,
              scale: 1 - progress * 0.034,
            });
          }

          if (proofPanelRef.current) {
            gsap.set(proofPanelRef.current, {
              y: -progress * 18,
            });
          }

          if (domainRailRef.current) {
            gsap.set(domainRailRef.current, {
              x: progress * 18,
            });
          }
        },
      });
    }, section);

    return () => ctx.revert();
  }, [reducedMotion]);

  useEffect(() => {
    const targets = [
      proofLabelRef.current,
      proofTitleRef.current,
      proofBodyRef.current,
      proofFootRef.current,
    ].filter(
      (
        target
      ): target is HTMLParagraphElement | HTMLHeadingElement | HTMLDivElement => target !== null
    );

    if (targets.length === 0) return;

    gsap.killTweensOf(targets);

    if (reducedMotion) {
      gsap.set(targets, {
        autoAlpha: 1,
        y: 0,
        clearProps: "transform",
      });
      return;
    }

    gsap.fromTo(
      targets,
      { autoAlpha: 0, y: 12 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.045,
        overwrite: "auto",
      }
    );
  }, [activeDomainId, reducedMotion]);

  if (!activeDomain) {
    return null;
  }

  const proofTitle = activeDomain.title ?? activeDomain.proof;
  const proofBody = activeDomain.description ?? site.description;
  const descriptorLockup = branding.descriptorLockup;

  return (
    <section
      ref={sectionRef}
      className="relative isolate min-h-screen overflow-hidden px-0 pt-[calc(var(--nav-height)+1.75rem)] sm:pt-[calc(var(--nav-height)+2.4rem)]"
    >
      <HomeHeroLightLayer
        maskSet={maskSet}
        accentColor={activeDomain.accent}
        shaderPreset={activeDomain.shaderPreset}
        reducedMotion={reducedMotion}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-[5] transition-opacity duration-500"
        style={{ background: activeDomain.glow, opacity: activeDomain ? 1 : 0 }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 -z-[4] bg-[linear-gradient(180deg,rgba(6,7,9,0.02)_0%,rgba(6,7,9,0.16)_46%,rgba(6,7,9,0.46)_78%,rgba(6,7,9,0.78)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-[3] opacity-[0.08] mix-blend-screen [background-image:var(--noise-texture)]" />
      <div
        className="home-hero-ambient-orb pointer-events-none absolute -left-[8%] top-[14%] -z-[2] h-[15rem] w-[15rem] rounded-full"
        aria-hidden="true"
      />
      <div
        className="home-hero-ambient-orb pointer-events-none absolute bottom-[16%] right-[10%] -z-[2] h-[18rem] w-[18rem] rounded-full"
        data-orb="secondary"
        aria-hidden="true"
      />

      <div className="pointer-events-none absolute inset-x-4 inset-y-5 z-0 sm:inset-x-6 sm:inset-y-6 md:inset-x-8 md:inset-y-8">
        <div
          ref={frameTopRef}
          className="frame-line-primary absolute left-[3%] right-[16%] top-[6%] h-px"
        />
        <div
          ref={frameSideRef}
          className="frame-line-primary absolute bottom-[10%] left-[3%] top-[6%] w-px"
        />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-var(--nav-height)-1.75rem)] w-full max-w-7xl gap-10 px-5 pb-10 sm:px-8 sm:pb-14 lg:grid-cols-[minmax(0,1.16fr)_minmax(20rem,0.84fr)] lg:px-12 lg:pb-16">
        <div className="flex min-h-full flex-col justify-end">
          <p
            ref={eyebrowRef}
            className="ui-pill inline-flex w-fit items-center gap-3 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--text-base-60)] sm:text-[11px]"
          >
            <span className="block h-2 w-2 rounded-full bg-[var(--accent-amber1)] shadow-[0_0_18px_rgba(255,182,77,0.45)]" />
            {hero.eyebrow}
          </p>

          <div className="frame-surface relative mt-5 inline-flex w-[min(100%,54rem)] flex-col pt-6">
            <div
              ref={titleCapRef}
              className="frame-line-secondary absolute right-0 top-0 h-px w-[42%]"
            />
            <h1
              ref={titleRef}
              className="relative z-10"
              style={{
                filter:
                  "drop-shadow(0 2px 28px rgba(0,0,0,0.45)) drop-shadow(0 0 80px rgba(0,0,0,0.25))",
              }}
            >
              <span className="sr-only">{descriptorLockup.ariaLabel}</span>
              <Image
                src={descriptorLockup.lightSrc}
                alt=""
                aria-hidden="true"
                width={descriptorLockup.width}
                height={Math.round(descriptorLockup.height)}
                priority
                unoptimized
                sizes="(max-width: 768px) calc(100vw - 2.5rem), 54rem"
                className="block h-auto w-full max-w-[54rem]"
                style={{
                  aspectRatio: `${descriptorLockup.width} / ${descriptorLockup.height}`,
                }}
              />
            </h1>
          </div>

          <p
            ref={descriptionRef}
            className="mt-6 max-w-[38rem] text-pretty text-[0.98rem] leading-7 text-[var(--text-base-70)] sm:text-[1.06rem] sm:leading-8"
          >
            {hero.description}
          </p>

          <div ref={ctaGroupRef} className="mt-8 flex flex-wrap gap-3">
            <Link href={primaryCta.href} className="home-hero-cta-primary">
              <span>{primaryCta.label}</span>
              <ArrowOutIcon className="h-4 w-4" />
            </Link>
            {secondaryCta ? (
              <Link href={secondaryCta.href} className="home-hero-cta-secondary">
                <span>{secondaryCta.label}</span>
              </Link>
            ) : null}
          </div>

          <div className="mt-8 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="frame-surface relative max-w-[38rem] pt-5">
              <div
                ref={domainRailRef}
                className="frame-line-secondary absolute left-0 top-0 h-px w-[48%]"
              />
              <div className="flex flex-wrap gap-3" aria-label="Creative domains">
                {domains.map((domain) => {
                  const isActive = domain.id === activeDomain.id;

                  return (
                    <button
                      key={domain.id}
                      type="button"
                      aria-pressed={isActive}
                      data-home-reveal="domain"
                      data-active={isActive ? "true" : "false"}
                      onMouseEnter={() => setActiveDomainId(domain.id)}
                      onFocus={() => setActiveDomainId(domain.id)}
                      className="home-hero-domain-button"
                    >
                      <span className="block font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--text-base-40)]">
                        0{domains.findIndex((item) => item.id === domain.id) + 1}
                      </span>
                      <span className="mt-2 block text-left text-[0.98rem] font-medium text-[var(--text-base-90)]">
                        {domain.label}
                      </span>
                      <span className="mt-2 block text-left text-sm leading-6 text-[var(--text-base-60)]">
                        {domain.proof}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="frame-surface relative flex items-center gap-4 pt-5">
              <div
                ref={socialRailRef}
                className="frame-line-secondary absolute left-0 top-0 h-px w-[28%]"
              />
              {(socialLinks ?? []).map((link) => {
                const IconComponent = socialIcons[link.icon as keyof typeof socialIcons];
                return (
                  <a
                    key={link.icon}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-home-reveal="social"
                    aria-label={link.label}
                    className="home-hero-social-link"
                  >
                    {IconComponent ? <IconComponent className="h-[18px] w-[18px]" /> : null}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="flex min-h-full flex-col justify-end">
          <div
            ref={proofPanelRef}
            className="home-hero-proof-panel frame-surface relative w-full max-w-[28rem] self-end overflow-hidden"
          >
            <div
              ref={proofLineRef}
              className="frame-line-primary absolute left-0 top-0 h-px w-[56%]"
            />
            <p
              ref={proofLabelRef}
              className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--text-base-40)]"
            >
              Active lane
            </p>
            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--text-base-40)]">
                  {`0${activeIndex + 1} / 0${domains.length}`}
                </p>
                <h2
                  ref={proofTitleRef}
                  className="mt-2 text-balance text-[1.35rem] font-medium leading-[1.2] text-[var(--text-base)] sm:text-[1.58rem]"
                >
                  {proofTitle}
                </h2>
              </div>
              <span className="rounded-full border border-[var(--stroke-heat)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--accent-amber1)]">
                {activeDomain.label}
              </span>
            </div>

            <p
              ref={proofBodyRef}
              className="mt-4 text-pretty text-[0.96rem] leading-7 text-[var(--text-base-70)]"
            >
              {proofBody}
            </p>

            <div ref={proofFootRef} className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="rounded-[1.2rem] border border-[var(--stroke-subtle)] bg-[color-mix(in_srgb,var(--slate-2)_72%,transparent)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--text-base-40)]">
                  Proof
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-base-80)]">
                  {activeDomain.proof}
                </p>
              </div>

              <Link href={activeDomain.href} className="home-hero-cta-secondary h-fit">
                <span>{`Open ${activeDomain.label}`}</span>
                <ArrowOutIcon className="h-4 w-4" />
              </Link>
            </div>

            <div
              ref={scrollHintRef}
              className="mt-7 flex items-center justify-between border-t border-[var(--stroke-subtle)] pt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--text-base-40)]"
            >
              <span>{scrollText}</span>
              <span className="flex items-center gap-3">
                <span>{hero.title}</span>
                <span className="inline-flex h-6 w-3 items-start justify-center rounded-full border border-[var(--stroke-strong)] p-[2px]">
                  <span className="animate-scroll-dot h-[6px] w-[6px] rounded-full bg-[var(--accent-amber1)]" />
                </span>
              </span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default HomeHero;
