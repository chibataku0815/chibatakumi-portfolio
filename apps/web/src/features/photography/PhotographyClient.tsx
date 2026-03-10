"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HeroSection } from "./sections/HeroSection";
import GallerySection, { GALLERY_IMAGES } from "./sections/GallerySection";
import ServicesSection from "./sections/ServicesSection";
import { TestimonialSection } from "./sections/TestimonialSection";
import AboutSection from "./sections/AboutSection";
import { CTAFormSection } from "./sections/CTAFormSection";
import LightboxDialog, { type LightboxHandle } from "./sections/LightboxDialog";

gsap.registerPlugin(ScrollTrigger);

// =============================================================================
// Photography LP — Integrated Client Component
// Section Order: Hero → Gallery → Services → Testimonial → About → CTAForm
// =============================================================================

export default function PhotographyClient() {
  const lightboxRef = useRef<LightboxHandle>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const ctx = gsap.context(() => {
      // Section divider line-draw animation
      gsap.fromTo(
        ".section-divider",
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".section-divider",
            start: "top 80%",
            once: true,
          },
        }
      );
    }, main);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={mainRef} className="min-h-screen">
      <HeroSection />
      <GallerySection onImageClick={(i) => lightboxRef.current?.open(i)} />

      {/* Gallery → Services breathing divider */}
      <div className="flex justify-center py-16">
        <div className="section-divider h-px w-28 origin-center bg-[var(--text-base-20)] [background-image:var(--section-divider-strong)]" />
      </div>

      <ServicesSection />
      <TestimonialSection />
      <AboutSection />
      <CTAFormSection />
      <LightboxDialog ref={lightboxRef} images={GALLERY_IMAGES} />
    </main>
  );
}
