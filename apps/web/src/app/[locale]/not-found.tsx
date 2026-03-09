"use client";

import { useEffect, useRef } from "react";
import { HeroShaderBackground } from "@/features/hero/components";
import { CursorLight } from "@/features/error-pages/components";
import { AnimatedHeading } from "@/shared/components";
import { Link } from "@/i18n/navigation";
import gsap from "gsap";

/**
 * 404 Not Found Page
 * Award-Worthy implementation with Pitch Black & Fire aesthetic
 * Features:
 * - Hero shader background
 * - Cursor-following Amber light source
 * - Ghost typography with GSAP animations
 * - Poetic error messaging
 */
export default function NotFound() {
  const descRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // Animate sub message and CTA with stagger
    const tl = gsap.timeline({ delay: 0.8 });

    if (descRef.current) {
      gsap.set(descRef.current, {
        opacity: 0,
        y: 12,
        filter: "blur(4px)",
      });

      tl.to(descRef.current, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.8,
        ease: "power2.out",
        clearProps: "filter",
      });
    }

    if (ctaRef.current) {
      gsap.set(ctaRef.current, {
        opacity: 0,
        y: 12,
        filter: "blur(4px)",
      });

      tl.to(
        ctaRef.current,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "power2.out",
          clearProps: "filter",
        },
        "-=0.4"
      );
    }
  }, []);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Background: Hero Shader */}
      <HeroShaderBackground />

      {/* Cursor-following Light Source */}
      <CursorLight />

      {/* Ghost 404 Typography (Background Layer) */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        aria-hidden="true"
      >
        <h2
          className="text-[clamp(8rem,30vw,28rem)] font-bold leading-none tracking-tighter"
          style={{
            color: "var(--text-base)",
            opacity: "var(--ghost-medium)",
          }}
        >
          404
        </h2>
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-2xl">
        {/* Main Message */}
        <AnimatedHeading
          as="h1"
          className="text-[clamp(2.5rem,8vw,5rem)] font-semibold leading-tight tracking-tighter"
          delay={0.4}
        >
          Lost in the Abyss
        </AnimatedHeading>

        {/* Sub Message */}
        <p
          ref={descRef}
          className="text-lg md:text-xl font-light leading-relaxed tracking-wide max-w-md"
          style={{ color: "var(--text-base-60)" }}
        >
          The page you&apos;re looking for has dissolved into the darkness.
        </p>

        {/* CTA Button with Amber Glow */}
        <Link
          ref={ctaRef}
          href="/"
          data-transition="true"
          className="group mt-6 inline-flex items-center gap-3 rounded-full border px-8 py-4 text-sm font-medium uppercase tracking-[0.12em] transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            borderColor: "var(--text-base-20)",
            color: "var(--text-base)",
            boxShadow: "0 0 0 rgba(255, 197, 61, 0)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-amber1)";
            e.currentTarget.style.color = "var(--accent-amber1)";
            e.currentTarget.style.boxShadow =
              "0 0 24px rgba(255, 197, 61, 0.4), 0 0 48px rgba(255, 197, 61, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--text-base-20)";
            e.currentTarget.style.color = "var(--text-base)";
            e.currentTarget.style.boxShadow = "0 0 0 rgba(255, 197, 61, 0)";
          }}
        >
          <svg
            className="h-4 w-4 transition-transform duration-500 group-hover:-translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Find Your Way Home
        </Link>
      </div>
    </main>
  );
}
