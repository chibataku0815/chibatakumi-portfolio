"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { splitText } from "@/shared/utils/splitText";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Premium Hero Text Animation
 *
 * Design principles:
 * - Only animate opacity + transform (GPU accelerated)
 * - Micro Y-movements (12px, not 60px)
 * - Blur-to-sharp for focus perception
 * - No gimmicky 3D effects (rotateX/Y)
 * - No letter-spacing animation (causes jank)
 * - Duration: 0.6-0.8s (not rushed, not lazy)
 * - Easing: power2.out (smooth, professional)
 */
export function HeroText() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !titleRef.current || !subtitleRef.current) return;

    // Wait for fonts to load (critical for accurate layout)
    document.fonts.ready.then(() => {
      const ctx = gsap.context(() => {
        // === TITLE: Premium blur-to-sharp reveal ===
        const titleSplit = splitText(titleRef.current!, "chars");

        // Initial state: invisible, slightly below, blurred
        gsap.set(titleSplit.chars, {
          opacity: 0,
          y: 16,                    // Micro-movement (not 60px)
          filter: "blur(8px)",      // Blur for focus perception
        });

        // Premium timeline
        const masterTl = gsap.timeline({
          defaults: {
            ease: "power2.out",     // Smooth, professional easing
          },
        });

        // Stage 1: Title chars reveal (blur-to-sharp + fade + micro-y)
        masterTl.to(titleSplit.chars, {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.7,            // 700ms (luxury feel)
          stagger: {
            each: 0.035,            // 35ms between chars
            from: "start",
          },
          clearProps: "filter",     // Clean up blur after animation
        });

        // Stage 2: Subtitle fade-in (overlapping start)
        gsap.set(subtitleRef.current, {
          opacity: 0,
          y: 12,
        });

        masterTl.to(subtitleRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
        }, "-=0.3");                 // Start 300ms before title ends

        // Stage 3: Scroll indicator fade-in
        gsap.set(scrollIndicatorRef.current, {
          opacity: 0,
          y: 8,
        });

        masterTl.to(scrollIndicatorRef.current, {
          opacity: 0.6,             // Subtle, not full opacity
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

        // === SCROLL PARALLAX: Minimal, purposeful ===
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.8,               // Smoother scrub
          onUpdate: (self) => {
            const progress = self.progress;

            // Title: subtle parallax + fade
            gsap.set(titleRef.current, {
              y: -progress * 80,     // Reduced parallax
              opacity: 1 - progress * 1.5,
            });

            // Subtitle: slightly less parallax
            gsap.set(subtitleRef.current, {
              y: -progress * 50,
              opacity: 1 - progress * 2,
            });

            // Scroll indicator: fade out quickly
            gsap.set(scrollIndicatorRef.current, {
              opacity: Math.max(0, 0.6 - progress * 3),
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
      className="relative flex min-h-[80vh] min-h-[600px] flex-col items-center justify-center text-center px-6"
    >
      <h1
        ref={titleRef}
        className="text-[clamp(2.75rem,10vw,7rem)] font-semibold leading-[1.0] tracking-[-0.03em] text-white"
      >
        Takumi Chiba
      </h1>

      {/* Subtitle */}
      <p
        ref={subtitleRef}
        className="mt-5 text-[clamp(1rem,2vw,1.25rem)] font-normal tracking-[0.02em] text-white/50"
      >
        Software Engineer
      </p>

      {/* Scroll Indicator */}
      <div
        ref={scrollIndicatorRef}
        className="absolute bottom-10 flex flex-col items-center gap-3"
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
          Scroll
        </span>
        <svg
          width="16"
          height="24"
          viewBox="0 0 16 24"
          fill="none"
          className="text-white/30"
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
