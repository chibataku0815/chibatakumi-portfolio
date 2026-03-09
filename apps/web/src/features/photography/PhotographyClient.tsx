"use client";

import { useRef } from "react";
import { HeroSection } from "./sections/HeroSection";
import GallerySection, { GALLERY_IMAGES } from "./sections/GallerySection";
import ServicesSection from "./sections/ServicesSection";
import { TestimonialSection } from "./sections/TestimonialSection";
import AboutSection from "./sections/AboutSection";
import { CTAFormSection } from "./sections/CTAFormSection";
import LightboxDialog, { type LightboxHandle } from "./sections/LightboxDialog";

// =============================================================================
// Photography LP — Integrated Client Component
// Section Order: Hero → Gallery → Services → Testimonial → About → CTAForm
// =============================================================================

export default function PhotographyClient() {
  const lightboxRef = useRef<LightboxHandle>(null);

  return (
    <main className="min-h-screen">
      <HeroSection />
      <GallerySection onImageClick={(i) => lightboxRef.current?.open(i)} />
      <ServicesSection />
      <TestimonialSection />
      <AboutSection />
      <CTAFormSection />
      <LightboxDialog ref={lightboxRef} images={GALLERY_IMAGES} />
    </main>
  );
}
