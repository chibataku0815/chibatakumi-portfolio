"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface GalleryImage {
  src: string;
  altKey: string;
  labelKey: string;
  featured?: boolean;
}

export const GALLERY_IMAGES: GalleryImage[] = [
  { src: "/photography/cafe-cursor-01.jpg", altKey: "01", labelKey: "01", featured: true },
  { src: "/photography/cafe-cursor-02.jpg", altKey: "02", labelKey: "02" },
  { src: "/photography/cafe-cursor-03.jpg", altKey: "03", labelKey: "03" },
  { src: "/photography/cafe-cursor-05.jpg", altKey: "05", labelKey: "05" },
  { src: "/photography/cafe-cursor-06.jpg", altKey: "06", labelKey: "06", featured: true },
  { src: "/photography/cafe-cursor-07.jpg", altKey: "07", labelKey: "07" },
  { src: "/photography/cafe-cursor-08.jpg", altKey: "08", labelKey: "08" },
  { src: "/photography/cafe-cursor-09.jpg", altKey: "09", labelKey: "09" },
  { src: "/photography/cafe-cursor-10.jpg", altKey: "10", labelKey: "10" },
  { src: "/photography/cafe-cursor-11.jpg", altKey: "11", labelKey: "11", featured: true },
  { src: "/photography/cafe-cursor-12.jpg", altKey: "12", labelKey: "12" },
];

interface GallerySectionProps {
  onImageClick: (index: number) => void;
}

export default function GallerySection({ onImageClick }: GallerySectionProps) {
  const t = useTranslations("photography.gallery");
  const sectionRef = useRef<HTMLElement>(null);
  const featuredImages = GALLERY_IMAGES.filter((image) => image.featured);
  const contactSheetImages = GALLERY_IMAGES.filter((image) => !image.featured);
  const thirdFeaturedIndex = GALLERY_IMAGES.findIndex((image) => image.src === featuredImages[2]?.src);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".gallery-featured",
        { opacity: 0, y: 70, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 78%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        ".gallery-sheet-item",
        { opacity: 0, y: 44 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.05,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".gallery-sheet",
            start: "top 82%",
            once: true,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="gallery"
      ref={sectionRef}
      className="relative overflow-hidden px-6 py-24 sm:py-28"
    >
      <div className="pointer-events-none absolute inset-x-0 top-16 h-px bg-gradient-to-r from-transparent via-[var(--text-base-20)] to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-amber1)]">
            {t("label")}
          </p>
          <h2 className="max-w-xl text-[clamp(2.2rem,5vw,4.8rem)] font-semibold leading-[0.95] tracking-[var(--tracking-tighter)] text-[var(--text-base)]">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-[var(--text-base-60)] sm:text-base">
            {t("subtitle")}
          </p>
          <p className="mt-8 max-w-md text-sm leading-relaxed text-[var(--text-muted)] sm:text-[15px]">
            {t("intro")}
          </p>
          <div className="mt-10 rounded-[1.75rem] border border-[var(--text-base-20)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--slate-2)_82%,transparent),color-mix(in_srgb,var(--slate-2)_58%,transparent))] p-6">
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-base-40)]">
                {t("sheetLabel")}
              </span>
              <span className="text-xs text-[var(--text-base-40)]">{GALLERY_IMAGES.length}</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
              {t("sheetNote")}
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="grid gap-4">
              {featuredImages.slice(0, 2).map((image) => {
                const index = GALLERY_IMAGES.findIndex((item) => item.src === image.src);
                return (
                  <button
                    key={image.src}
                    type="button"
                    onClick={() => onImageClick(index)}
                    className="gallery-featured group relative overflow-hidden rounded-[1.8rem] border border-[var(--text-base-20)] bg-[var(--bg-darker)] text-left"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <Image
                        src={image.src}
                        alt={t(`images.${image.altKey}`)}
                        fill
                        sizes="(max-width: 1024px) 100vw, 44vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.52))]" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--accent-amber1)]">
                        {t("featuredLabel")}
                      </p>
                      <p className="mt-2 text-lg font-medium text-[var(--text-base)]">
                        {t(`labels.${image.labelKey}`)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onImageClick(thirdFeaturedIndex)}
              className="gallery-featured group relative overflow-hidden rounded-[1.8rem] border border-[var(--text-base-20)] bg-[var(--bg-darker)] text-left"
            >
              <div className="relative h-full min-h-[22rem] overflow-hidden">
                <Image
                  src={featuredImages[2].src}
                  alt={t(`images.${featuredImages[2].altKey}`)}
                  fill
                  sizes="(max-width: 1024px) 100vw, 28vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.68))]" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--accent-amber1)]">
                    {t("featuredLabel")}
                  </p>
                  <p className="mt-2 text-lg font-medium text-[var(--text-base)]">
                    {t(`labels.${featuredImages[2].labelKey}`)}
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="gallery-sheet grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {contactSheetImages.map((image) => {
              const index = GALLERY_IMAGES.findIndex((item) => item.src === image.src);
              return (
                <button
                  key={image.src}
                  type="button"
                  onClick={() => onImageClick(index)}
                  className="gallery-sheet-item group relative overflow-hidden rounded-[1.4rem] border border-[var(--text-base-20)] bg-[var(--bg-darker)] text-left"
                >
                  <div className="relative aspect-[1.18] overflow-hidden">
                    <Image
                      src={image.src}
                      alt={t(`images.${image.altKey}`)}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 24vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.48))]" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--text-base-40)]">
                        {index + 1}
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-base)]">
                        {t(`labels.${image.labelKey}`)}
                      </p>
                    </div>
                    <span className="translate-y-2 text-xs text-[var(--accent-amber1)] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      &#8599;
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
