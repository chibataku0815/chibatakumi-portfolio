"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { portfolioData } from "@/shared/data/portfolio";
import { useHeroFrameMetrics } from "@/shared/hooks/useHeroFrameMetrics";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HomeHeroLightLayer } from "./HomeHeroLightLayer";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function HomeHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const selectorPanelRef = useRef<HTMLDivElement>(null);
  const frameTopRef = useRef<HTMLDivElement>(null);
  const frameSideRef = useRef<HTMLDivElement>(null);
  const titleCapRef = useRef<HTMLDivElement>(null);
  const ctaRailRef = useRef<HTMLDivElement>(null);
  const selectorRailRef = useRef<HTMLDivElement>(null);

  const { title, eyebrow, description, primaryCta, secondaryCta, domains } = portfolioData.hero;
  const [activeDomainId, setActiveDomainId] = useState(domains[0]?.id ?? "");

  const activeDomain = useMemo(
    () => domains.find((domain) => domain.id === activeDomainId) ?? domains[0],
    [activeDomainId, domains]
  );

  const maskRefs = useMemo(
    () => [frameTopRef, frameSideRef, titleCapRef, ctaRailRef, selectorPanelRef, selectorRailRef],
    []
  );

  const maskSet = useHeroFrameMetrics({
    anchorRef: titleRef,
    maskRefs,
  });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-home-reveal='eyebrow'], [data-home-reveal='title'], [data-home-reveal='copy'], [data-home-reveal='cta']",
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.12,
        }
      );

      gsap.fromTo(
        "[data-home-reveal='selector']",
        { opacity: 0, x: 36, y: 18 },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          delay: 0.28,
        }
      );

      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom top",
        scrub: 0.8,
        onUpdate: (self) => {
          const progress = self.progress;

          if (titleRef.current) {
            gsap.set(titleRef.current, {
              y: -progress * 40,
              scale: 1 - progress * 0.025,
            });
          }

          if (selectorPanelRef.current) {
            gsap.set(selectorPanelRef.current, {
              y: -progress * 24,
            });
          }
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative isolate min-h-screen overflow-hidden px-0 pt-[calc(var(--nav-height)+1.75rem)] sm:pt-[calc(var(--nav-height)+2.4rem)]"
    >
      <HomeHeroLightLayer maskSet={maskSet} />
      <div
        className="pointer-events-none absolute inset-0 -z-[5] transition-opacity duration-500"
        style={{ background: activeDomain?.glow, opacity: activeDomain ? 1 : 0 }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 -z-[4] bg-[linear-gradient(180deg,rgba(6,7,9,0.12),rgba(6,7,9,0.52)_34%,rgba(6,7,9,0.92)_84%)]" />
      <div className="pointer-events-none absolute inset-0 -z-[3] opacity-[0.08] mix-blend-screen [background-image:var(--noise-texture)]" />

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

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-var(--nav-height)-1.75rem)] w-full max-w-7xl gap-8 px-5 pb-8 sm:px-8 sm:pb-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(21rem,0.84fr)] lg:items-end lg:gap-12 lg:px-12 lg:pb-12">
        <div className="flex min-h-[calc(100svh-var(--nav-height)-4.5rem)] flex-col justify-end py-4 sm:py-8">
          <p
            data-home-reveal="eyebrow"
            className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--accent-amber1)]"
          >
            {eyebrow}
          </p>

          <div className="frame-surface relative mt-4 inline-flex max-w-[min(100%,44rem)] flex-col pt-5">
            <div
              ref={titleCapRef}
              className="frame-line-secondary absolute right-0 top-0 h-px w-[42%]"
            />
            <h1
              ref={titleRef}
              data-home-reveal="title"
              className="text-balance relative z-10 max-w-[10ch] text-[clamp(3.6rem,14vw,9.8rem)] font-semibold leading-[0.9] tracking-[var(--tracking-ultra-tight)] text-[var(--text-base)]"
            >
              <span className="block">{title.split(" ")[0]}</span>
              <span className="block text-[color-mix(in_srgb,var(--text-base)_78%,var(--accent-amber1))]">
                {title.split(" ").slice(1).join(" ")}
              </span>
            </h1>
          </div>

          <p
            data-home-reveal="copy"
            className="mt-6 max-w-[36rem] text-pretty text-[15px] leading-relaxed text-[var(--text-base-80)] sm:text-[1.05rem]"
          >
            {description}
          </p>

          <div
            data-home-reveal="cta"
            className="frame-surface relative mt-8 flex flex-wrap items-center gap-3 pt-5"
          >
            <div
              ref={ctaRailRef}
              className="frame-line-secondary absolute left-0 top-0 h-px w-[44%]"
            />
            <Link
              href={primaryCta.href}
              data-transition="true"
              className="group inline-flex items-center gap-3 rounded-full border border-[var(--frame-line-secondary)] bg-[var(--surface-glass-dark)] px-6 py-3 text-sm font-medium text-[var(--text-base)] shadow-[var(--shadow-frame-panel)] transition-all duration-300 hover:border-[var(--accent-amber2)] hover:text-[var(--accent-amber1)]"
            >
              {primaryCta.label}
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
            </Link>
            <Link
              href={secondaryCta.href}
              data-transition="true"
              className="inline-flex items-center gap-3 rounded-full border border-[var(--frame-line-primary)] bg-[var(--surface-glass-dark)] px-6 py-3 text-sm text-[var(--text-base-70)] shadow-[var(--shadow-frame-glass)] transition-colors duration-300 hover:border-[var(--stroke-strong)] hover:text-[var(--text-base)]"
            >
              {secondaryCta.label}
            </Link>
          </div>
        </div>

        <div
          ref={selectorPanelRef}
          data-home-reveal="selector"
          className="frame-panel-editorial relative overflow-hidden rounded-[2rem] border border-[var(--frame-line-primary)] p-5 shadow-[var(--shadow-frame-panel)] backdrop-blur-sm sm:p-6 lg:mb-6"
        >
          <div
            ref={selectorRailRef}
            className="frame-line-secondary absolute inset-x-6 top-0 h-px opacity-85"
          />
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--accent-amber1)]">
              Domains
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-base-40)]">
              Select a lens
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            {domains.map((domain, index) => {
              const isActive = domain.id === activeDomain?.id;

              return (
                <Link
                  key={domain.id}
                  href={domain.href}
                  data-transition="true"
                  onMouseEnter={() => setActiveDomainId(domain.id)}
                  onFocus={() => setActiveDomainId(domain.id)}
                  className={`group rounded-[1.45rem] border px-4 py-4 transition-all duration-300 sm:px-5 ${
                    isActive
                      ? "bg-[var(--surface-glass-dark)] text-[var(--text-base)] shadow-[var(--shadow-frame-panel)]"
                      : "border-[var(--frame-line-primary)] bg-[color-mix(in_srgb,var(--surface-2)_72%,transparent)] text-[var(--text-base-70)] shadow-[var(--shadow-frame-glass)] hover:border-[var(--stroke-strong)] hover:text-[var(--text-base)]"
                  }`}
                  style={isActive ? { borderColor: domain.accent } : undefined}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p
                        className="font-mono text-[10px] uppercase tracking-[0.26em]"
                        style={isActive ? { color: domain.accent } : undefined}
                      >
                        {domain.label}
                      </p>
                      <h2 className="mt-2 text-balance text-[1.1rem] font-medium leading-[1.1] tracking-[var(--tracking-tight)] text-inherit">
                        {domain.title}
                      </h2>
                      <p className="mt-3 text-sm leading-relaxed text-[var(--text-base-60)] group-hover:text-[var(--text-base-70)]">
                        {domain.description}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-base-40)]">
                      0{index + 1}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 rounded-[1.4rem] border border-[var(--frame-line-primary)] bg-[color-mix(in_srgb,var(--surface-1)_78%,transparent)] p-4 sm:p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[var(--text-base-40)]">
              Selected Proof
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-base)]">
              {activeDomain?.proof}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeHero;
