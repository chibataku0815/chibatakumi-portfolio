"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const socialIcons = {
  github: GithubIcon,
  x: XIcon,
  instagram: InstagramIcon,
} as const;

export function HomeHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const frameTopRef = useRef<HTMLDivElement>(null);
  const frameSideRef = useRef<HTMLDivElement>(null);
  const titleCapRef = useRef<HTMLDivElement>(null);
  const socialRailRef = useRef<HTMLDivElement>(null);

  const { domains, socialLinks } = portfolioData.hero;
  const { wordmark } = portfolioData.branding;
  const [activeDomainId, setActiveDomainId] = useState(domains[0]?.id ?? "");

  const activeDomain = useMemo(
    () => domains.find((domain) => domain.id === activeDomainId) ?? domains[0],
    [activeDomainId, domains]
  );

  const maskRefs = useMemo(
    () => [frameTopRef, frameSideRef, titleCapRef, socialRailRef],
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
        "[data-home-reveal='title']",
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 1.0,
          ease: "power3.out",
          delay: 0.1,
        }
      );

      gsap.fromTo(
        "[data-home-reveal='domain']",
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.06,
          ease: "power3.out",
          delay: 0.4,
        }
      );

      gsap.fromTo(
        "[data-home-reveal='social']",
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.05,
          ease: "power3.out",
          delay: 0.65,
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
      <HomeHeroLightLayer
        maskSet={maskSet}
        accentColor={activeDomain?.accent}
        shaderPreset={activeDomain?.shaderPreset}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-[5] transition-opacity duration-500"
        style={{ background: activeDomain?.glow, opacity: activeDomain ? 1 : 0 }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 -z-[4] bg-[linear-gradient(180deg,rgba(6,7,9,0)_0%,rgba(6,7,9,0.15)_45%,rgba(6,7,9,0.5)_80%,rgba(6,7,9,0.72)_100%)]" />
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

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-var(--nav-height)-1.75rem)] w-full max-w-7xl flex-col justify-end px-5 pb-10 sm:px-8 sm:pb-14 lg:px-12 lg:pb-16">
        <div className="frame-surface relative inline-flex max-w-[min(100%,52rem)] flex-col pt-5">
          <div
            ref={titleCapRef}
            className="frame-line-secondary absolute right-0 top-0 h-px w-[42%]"
          />
          <h1
            ref={titleRef}
            data-home-reveal="title"
            className="relative z-10"
            style={{ filter: "drop-shadow(0 2px 28px rgba(0,0,0,0.45)) drop-shadow(0 0 80px rgba(0,0,0,0.25))" }}
          >
            <svg
              viewBox={wordmark.viewBox}
              fill="none"
              aria-label={wordmark.ariaLabel}
              role="img"
              className="h-auto w-full max-w-[52rem]"
            >
              <g fill="var(--text-base)">
                {wordmark.primaryPaths.map((d, i) => (
                  <path key={`hp-${i}`} d={d} />
                ))}
              </g>
              <g fill="color-mix(in srgb, var(--text-base) 78%, var(--accent-amber1))">
                {wordmark.secondaryPaths.map((d, i) => (
                  <path key={`hs-${i}`} d={d} />
                ))}
              </g>
            </svg>
          </h1>
        </div>

        {/* Domain labels — typography only, interactive for shader */}
        <div className="mt-6 flex items-center gap-4 sm:gap-6">
          {domains.map((domain) => {
            const isActive = domain.id === activeDomain?.id;
            return (
              <button
                key={domain.id}
                type="button"
                data-home-reveal="domain"
                onMouseEnter={() => setActiveDomainId(domain.id)}
                onFocus={() => setActiveDomainId(domain.id)}
                className={`font-mono text-[11px] uppercase tracking-[0.28em] transition-all duration-300 sm:text-[12px] ${
                  isActive
                    ? "text-[var(--accent-amber1)]"
                    : "text-[var(--text-base-50)] hover:text-[var(--text-base-80)]"
                }`}
                style={{ textShadow: "0 1px 12px rgba(0,0,0,0.4)" }}
              >
                {domain.label}
              </button>
            );
          })}
        </div>

        {/* Social links */}
        <div className="frame-surface relative mt-8 flex items-center gap-4 pt-5">
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
                className="text-[var(--text-base-50)] transition-colors duration-300 hover:text-[var(--accent-amber1)]"
              >
                {IconComponent && <IconComponent className="h-[18px] w-[18px]" />}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HomeHero;
