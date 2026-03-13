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
import {
  PHOTOGRAPHY_MOTION,
  getPhotographyMotionPreferences,
} from "./motion";

gsap.registerPlugin(ScrollTrigger);

function SectionHandoff() {
  return (
    <div className="photography-handoff flex justify-center py-10 sm:py-14">
      <div className="section-handoff-core photography-handoff-core photography-line-breathe">
        <span className="section-handoff-dot photography-handoff-dot" />
      </div>
    </div>
  );
}

export default function PhotographyClient() {
  const lightboxRef = useRef<LightboxHandle>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const { reducedMotion } = getPhotographyMotionPreferences();

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".photography-handoff").forEach((handoff) => {
        const core = handoff.querySelector(".section-handoff-core");
        const dot = handoff.querySelector(".section-handoff-dot");
        if (!core || !dot) return;

        gsap.fromTo(
          core,
          {
            opacity: 0,
            scaleX: 0.38,
          },
          {
            opacity: 1,
            scaleX: 1,
            duration: reducedMotion
              ? PHOTOGRAPHY_MOTION.duration.xs
              : PHOTOGRAPHY_MOTION.duration.lg,
            ease: PHOTOGRAPHY_MOTION.ease.handoff,
            scrollTrigger: {
              trigger: handoff,
              start: PHOTOGRAPHY_MOTION.scroll.entry,
              once: true,
            },
          }
        );

        gsap.fromTo(
          dot,
          {
            opacity: 0,
            scale: 0.5,
          },
          {
            opacity: 1,
            scale: 1,
            duration: reducedMotion
              ? PHOTOGRAPHY_MOTION.duration.xs
              : PHOTOGRAPHY_MOTION.duration.sm,
            ease: PHOTOGRAPHY_MOTION.ease.reveal,
            delay: reducedMotion ? 0 : 0.08,
            scrollTrigger: {
              trigger: handoff,
              start: PHOTOGRAPHY_MOTION.scroll.reveal,
              once: true,
            },
          }
        );
      });

      if (!reducedMotion) {
        gsap.utils.toArray<HTMLElement>(".section-atmosphere").forEach((orb, index) => {
          gsap.to(orb, {
            yPercent: index % 2 === 0 ? -14 : 12,
            xPercent: index % 2 === 0 ? 6 : -4,
            ease: "none",
            scrollTrigger: {
              trigger: main,
              start: "top top",
              end: "bottom bottom",
              scrub: 1,
            },
          });
        });
      }
    }, main);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={mainRef} className="min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="photography-grain-layer" />
        <div className="photography-ambient-orb section-atmosphere left-[4%] top-[24rem] h-52 w-52 opacity-70" />
        <div className="photography-ambient-orb section-atmosphere right-[7%] top-[74rem] h-64 w-64 opacity-60" />
        <div className="photography-ambient-orb section-atmosphere left-[12%] top-[162rem] h-72 w-72 opacity-55" />
        <div className="photography-ambient-orb section-atmosphere right-[10%] top-[248rem] h-60 w-60 opacity-55" />
      </div>

      <HeroSection />
      <SectionHandoff />
      <GallerySection onImageClick={(i) => lightboxRef.current?.open(i)} />
      <SectionHandoff />
      <ServicesSection />
      <TestimonialSection />
      <AboutSection />
      <SectionHandoff />
      <CTAFormSection />
      <LightboxDialog ref={lightboxRef} images={GALLERY_IMAGES} />
    </main>
  );
}
