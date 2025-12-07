"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { splitText } from "@/shared/utils/splitText";
import { portfolioData } from "@/shared/data/portfolio";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Premium Hero Text Animation - Asymmetric Layout
 *
 * Design principles:
 * - Diagonal composition: top-right (title) → center-left (tagline) → bottom-right (scroll)
 * - Only animate opacity + transform (GPU accelerated)
 * - Micro movements with blur-to-sharp for focus perception
 * - Duration: 0.6-0.8s (luxury feel)
 * - Easing: power2.out (smooth, professional)
 */
export function HeroText() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  const { scrollText, tagline, subTagline } = portfolioData.hero;
  const taglineLines =
    typeof tagline === "string"
      ? tagline.split("\n").filter(Boolean)
      : tagline.lines;

  useEffect(() => {
    if (!containerRef.current || !titleRef.current || !taglineRef.current) return;

    // Wait for fonts to load (critical for accurate layout)
    document.fonts.ready.then(() => {
      const ctx = gsap.context(() => {
        // === TITLE: Premium blur-to-sharp reveal ===
        const titleSplit = splitText(titleRef.current!, "chars");

        // Initial state: invisible, slightly below, blurred
        gsap.set(titleSplit.chars, {
          opacity: 0,
          y: 16,
          filter: "blur(8px)",
        });

        // Premium timeline
        const masterTl = gsap.timeline({
          defaults: {
            ease: "power2.out",
          },
        });

        // Stage 1: Title chars reveal (blur-to-sharp + fade + micro-y)
        masterTl.to(titleSplit.chars, {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.7,
          stagger: {
            each: 0.035,
            from: "start",
          },
          clearProps: "filter",
        });

        // Stage 2: Tagline lines reveal (staggered from left)
        const taglineLines = taglineRef.current?.querySelectorAll('.tagline-line');
        if (taglineLines) {
          gsap.set(taglineLines, {
            opacity: 0,
            x: -20,
          });

          masterTl.to(taglineLines, {
            opacity: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.15,
            ease: "power2.out",
          }, "-=0.2");
        }

        // Stage 3: Scroll indicator fade-in
        gsap.set(scrollIndicatorRef.current, {
          opacity: 0,
          y: 8,
        });

        masterTl.to(scrollIndicatorRef.current, {
          opacity: 0.6,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
        }, "-=0.2");

        // Subtle pulse animation (after reveal completes)
        masterTl.to(scrollIndicatorRef.current, {
          y: 6,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        // === SCROLL PARALLAX: Enhanced "sinking" effect ===
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
          onUpdate: (self) => {
            const progress = self.progress;

            // Title: enhanced "sinking" parallax
            gsap.set(titleRef.current, {
              y: -progress * 120,
              opacity: 1 - progress * 1.2,
              scale: 1 - progress * 0.05,
            });

            // Tagline lines: staggered sinking with blur
            const taglineLines = taglineRef.current?.querySelectorAll('.tagline-line');
            if (taglineLines) {
              taglineLines.forEach((line, i) => {
                gsap.set(line, {
                  y: -progress * (60 + i * 15),
                  opacity: 1 - progress * 1.8,
                  filter: `blur(${progress * 3}px)`,
                });
              });
            }

            // Scroll indicator: quick fade with y movement
            gsap.set(scrollIndicatorRef.current, {
              opacity: Math.max(0, 0.6 - progress * 4),
              y: -progress * 40,
            });
          },
        });

        // Cleanup
        return () => {
          titleSplit.revert();
        };
      }, containerRef);

      return () => {
        ctx.revert();
        ScrollTrigger.getAll().forEach((st) => st.kill());
      };
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-[85vh] min-h-[700px] flex-col justify-center px-0"
    >
      {/* Title - Right aligned */}
      <div className="flex w-full flex-col items-end pr-8 md:pr-16 lg:pr-24">
        <h1
          ref={titleRef}
          className="text-right text-[clamp(4rem,15vw,12rem)] font-semibold leading-[0.9] tracking-[-0.04em] text-[var(--text-base)]"
        >
          <span className="block">Takumi</span>
          <span className="block">Chiba</span>
        </h1>
      </div>

      {/* Tagline - Left aligned, 3 lines */}
      <div
        ref={taglineRef}
        className="mt-16 flex w-full flex-col items-start pl-8 md:pl-16 lg:pl-24"
      >
        {taglineLines.map((line, index) => (
          <p
            key={line}
            className={`tagline-line ${
              index > 0 ? "mt-2" : ""
            } text-[clamp(1.125rem,2.5vw,1.5rem)] font-normal tracking-[0.05em] text-[var(--text-base-60)]`}
          >
            {line}
          </p>
        ))}
        {subTagline && (
          <p className="mt-4 text-[clamp(0.95rem,2vw,1.15rem)] font-medium tracking-[0.04em] text-[var(--text-base-60)]">
            {subTagline}
          </p>
        )}
      </div>

      {/* Scroll Indicator - Bottom right */}
      <div
        ref={scrollIndicatorRef}
        className="absolute bottom-10 right-8 flex flex-col items-center gap-3 md:right-16 lg:right-24"
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--text-base-40)]">
          {scrollText}
        </span>
        <svg
          width="16"
          height="24"
          viewBox="0 0 16 24"
          fill="none"
          className="text-[var(--text-base-30)]"
        >
          <rect
            x="1"
            y="1"
            width="14"
            height="22"
            rx="7"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle
            cx="8"
            cy="8"
            r="2"
            fill="currentColor"
            className="animate-scroll-dot"
          />
        </svg>
      </div>
    </div>
  );
}

export default HeroText;
