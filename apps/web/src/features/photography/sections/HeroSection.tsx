"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { VideoHeroBackground } from "../components/VideoHeroBackground";

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

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Text stagger fade-in
      gsap.fromTo(
        ".hero-entry",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          delay: 0.3,
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden"
    >
      {/* Three.js Video Shader Background */}
      <VideoHeroBackground src={videoSrc} fallbackImage={fallbackImage} />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <p className="hero-entry mb-4 font-mono text-xs uppercase tracking-[0.2em] text-white/60">
          {t("label")}
        </p>

        <h1 className="hero-entry mb-6 text-[clamp(2.5rem,8vw,5rem)] font-semibold leading-tight tracking-[-0.02em] text-white">
          {t("title")}
          <br />
          <span className="text-[var(--accent-amber1)]">{t("titleAccent")}</span>
        </h1>

        <p className="hero-entry mx-auto max-w-xl text-lg leading-relaxed text-white/70">
          {t("subtext")}
        </p>

        <div className="hero-entry mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/contact"
            data-transition="true"
            className="group inline-flex items-center gap-2 rounded-full border border-[var(--accent-amber1)] px-8 py-3 text-sm font-medium text-[var(--accent-amber1)] transition-all duration-300 hover:bg-[var(--accent-amber1)] hover:text-[var(--bg-dark)]"
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
          </Link>
          <a
            href="#gallery"
            className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
          >
            {t("ctaPortfolio")}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
