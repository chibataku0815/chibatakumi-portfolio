"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// =============================================================================
// Gallery Images — Cafe Cursor Tokyo (2026-03-05)
// =============================================================================

interface GalleryImage {
  src: string;
  alt: string;
  altKey: string;
  featured?: boolean;
}

const GALLERY_IMAGES: GalleryImage[] = [
  { src: "/photography/cafe-cursor-01.jpg", alt: "Cafe Cursor Tokyo — vintage car and workspace atmosphere", altKey: "01", featured: true },
  { src: "/photography/cafe-cursor-02.jpg", alt: "Cafe Cursor Tokyo — laptop and branded coffee by the window", altKey: "02" },
  { src: "/photography/cafe-cursor-03.jpg", alt: "Cafe Cursor Tokyo — welcome card detail", altKey: "03" },
  { src: "/photography/cafe-cursor-04.jpg", alt: "Cafe Cursor Tokyo — coding by the vintage Porsche", altKey: "04" },
  { src: "/photography/cafe-cursor-05.jpg", alt: "Cafe Cursor Tokyo — Cursor logo on window silhouette", altKey: "05" },
  { src: "/photography/cafe-cursor-06.jpg", alt: "Cafe Cursor Tokyo — engineers coding together", altKey: "06", featured: true },
  { src: "/photography/cafe-cursor-07.jpg", alt: "Cafe Cursor Tokyo — branded tote bag in natural light", altKey: "07" },
  { src: "/photography/cafe-cursor-08.jpg", alt: "Cafe Cursor Tokyo — engineering culture laptop stickers", altKey: "08" },
  { src: "/photography/cafe-cursor-09.jpg", alt: "Cafe Cursor Tokyo — Cursor brand stickers detail", altKey: "09" },
  { src: "/photography/cafe-cursor-10.jpg", alt: "Cafe Cursor Tokyo — swag preparation behind the scenes", altKey: "10" },
  { src: "/photography/cafe-cursor-11.jpg", alt: "Cafe Cursor Tokyo — venue space with classic car", altKey: "11", featured: true },
  { src: "/photography/cafe-cursor-12.jpg", alt: "Cafe Cursor Tokyo — warm filament lights and silhouettes", altKey: "12" },
];

// =============================================================================
// Component
// =============================================================================

interface GallerySectionProps {
  onImageClick: (index: number) => void;
}

export { GALLERY_IMAGES };

export default function GallerySection({ onImageClick }: GallerySectionProps) {
  const t = useTranslations("photography.gallery");
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!galleryRef.current) return;

    const items = galleryRef.current.querySelectorAll(".gallery-item");
    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: galleryRef.current,
            start: "top 80%",
            once: true,
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <section id="gallery" className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-base-40)]">
            {t("label")}
          </p>
          <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-semibold tracking-tight text-[var(--text-base)]">
            {t("title")}
          </h2>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            {t("subtitle")}
          </p>
        </div>

        <div
          ref={galleryRef}
          className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4"
        >
          {GALLERY_IMAGES.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => onImageClick(i)}
              className={`gallery-item group relative overflow-hidden rounded-lg ${
                img.featured ? "col-span-2 row-span-2" : ""
              }`}
            >
              <div className={`relative ${img.featured ? "aspect-[4/3]" : "aspect-square"}`}>
                <Image
                  src={img.src}
                  alt={t(`images.${img.altKey}`)}
                  fill
                  sizes={img.featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/20" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
