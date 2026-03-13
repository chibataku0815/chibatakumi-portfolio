"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  PHOTOGRAPHY_MOTION,
  getPhotographyMotionPreferences,
} from "../motion";

gsap.registerPlugin(ScrollTrigger);

export interface GalleryImage {
  src: string;
  altKey: string;
  labelKey: string;
  captionKey: string;
  featured?: boolean;
}

export const GALLERY_IMAGES: GalleryImage[] = [
  {
    src: "/photography/cafe-cursor-01.jpg",
    altKey: "01",
    labelKey: "01",
    captionKey: "01",
    featured: true,
  },
  {
    src: "/photography/cafe-cursor-02.jpg",
    altKey: "02",
    labelKey: "02",
    captionKey: "02",
  },
  {
    src: "/photography/cafe-cursor-03.jpg",
    altKey: "03",
    labelKey: "03",
    captionKey: "03",
  },
  {
    src: "/photography/cafe-cursor-05.jpg",
    altKey: "05",
    labelKey: "05",
    captionKey: "05",
  },
  {
    src: "/photography/cafe-cursor-06.jpg",
    altKey: "06",
    labelKey: "06",
    captionKey: "06",
    featured: true,
  },
  {
    src: "/photography/cafe-cursor-07.jpg",
    altKey: "07",
    labelKey: "07",
    captionKey: "07",
  },
  {
    src: "/photography/cafe-cursor-08.jpg",
    altKey: "08",
    labelKey: "08",
    captionKey: "08",
  },
  {
    src: "/photography/cafe-cursor-09.jpg",
    altKey: "09",
    labelKey: "09",
    captionKey: "09",
  },
  {
    src: "/photography/cafe-cursor-10.jpg",
    altKey: "10",
    labelKey: "10",
    captionKey: "10",
  },
  {
    src: "/photography/cafe-cursor-11.jpg",
    altKey: "11",
    labelKey: "11",
    captionKey: "11",
    featured: true,
  },
  {
    src: "/photography/cafe-cursor-12.jpg",
    altKey: "12",
    labelKey: "12",
    captionKey: "12",
  },
];

interface GallerySectionProps {
  onImageClick: (index: number) => void;
}

export default function GallerySection({ onImageClick }: GallerySectionProps) {
  const t = useTranslations("photography.gallery");
  const sectionRef = useRef<HTMLElement>(null);
  const featuredImages = GALLERY_IMAGES.filter((image) => image.featured);
  const contactSheetImages = GALLERY_IMAGES.filter((image) => !image.featured);
  const thirdFeaturedIndex = GALLERY_IMAGES.findIndex(
    (image) => image.src === featuredImages[2]?.src
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const { finePointer, reducedMotion } = getPhotographyMotionPreferences();
    const cleanup: Array<() => void> = [];

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".gallery-copy-block",
        { opacity: 0, y: PHOTOGRAPHY_MOTION.offset.regular },
        {
          opacity: 1,
          y: 0,
          duration: reducedMotion
            ? PHOTOGRAPHY_MOTION.duration.sm
            : PHOTOGRAPHY_MOTION.duration.lg,
          stagger: PHOTOGRAPHY_MOTION.stagger.tight,
          ease: PHOTOGRAPHY_MOTION.ease.reveal,
          scrollTrigger: {
            trigger: section,
            start: PHOTOGRAPHY_MOTION.scroll.entry,
            once: true,
          },
        }
      );

      gsap.fromTo(
        ".gallery-featured-card",
        {
          opacity: 0,
          y: PHOTOGRAPHY_MOTION.offset.loose,
          scale: PHOTOGRAPHY_MOTION.scale.panel,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: reducedMotion
            ? PHOTOGRAPHY_MOTION.duration.sm
            : PHOTOGRAPHY_MOTION.duration.lg,
          stagger: PHOTOGRAPHY_MOTION.stagger.regular,
          ease: PHOTOGRAPHY_MOTION.ease.reveal,
          scrollTrigger: {
            trigger: section,
            start: PHOTOGRAPHY_MOTION.scroll.reveal,
            once: true,
          },
        }
      );

      gsap.fromTo(
        ".gallery-sheet-item",
        {
          opacity: 0,
          y: PHOTOGRAPHY_MOTION.offset.regular,
          filter: reducedMotion ? "blur(0px)" : "blur(10px)",
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: PHOTOGRAPHY_MOTION.duration.md,
          stagger: PHOTOGRAPHY_MOTION.stagger.tight,
          ease: PHOTOGRAPHY_MOTION.ease.reveal,
          scrollTrigger: {
            trigger: ".gallery-sheet",
            start: PHOTOGRAPHY_MOTION.scroll.entry,
            once: true,
          },
        }
      );

      if (!reducedMotion) {
        gsap.to(".gallery-copy-drift", {
          yPercent: -8,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.9,
          },
        });

        gsap.utils
          .toArray<HTMLElement>(".gallery-drift-card")
          .forEach((card, index) => {
            gsap.to(card, {
              yPercent: index % 2 === 0 ? -5 : -3,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: 0.7,
              },
            });
          });
      }

      if (finePointer && !reducedMotion) {
        gsap.utils
          .toArray<HTMLElement>(".gallery-featured-card")
          .forEach((card) => {
            const driftLayer = card.querySelector<HTMLElement>(".gallery-drift-layer");
            const meta = card.querySelector<HTMLElement>(".gallery-meta-stack");
            if (!driftLayer || !meta) return;

            const driftX = gsap.quickTo(driftLayer, "x", {
              duration: PHOTOGRAPHY_MOTION.duration.md,
              ease: PHOTOGRAPHY_MOTION.ease.drift,
            });
            const driftY = gsap.quickTo(driftLayer, "y", {
              duration: PHOTOGRAPHY_MOTION.duration.md,
              ease: PHOTOGRAPHY_MOTION.ease.drift,
            });
            const metaX = gsap.quickTo(meta, "x", {
              duration: PHOTOGRAPHY_MOTION.duration.sm,
              ease: PHOTOGRAPHY_MOTION.ease.drift,
            });
            const metaY = gsap.quickTo(meta, "y", {
              duration: PHOTOGRAPHY_MOTION.duration.sm,
              ease: PHOTOGRAPHY_MOTION.ease.drift,
            });

            const handleMove = (event: MouseEvent) => {
              const bounds = card.getBoundingClientRect();
              const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5;
              const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5;
              driftX(offsetX * 18);
              driftY(offsetY * 18);
              metaX(offsetX * -8);
              metaY(offsetY * -8);
            };

            const handleLeave = () => {
              driftX(0);
              driftY(0);
              metaX(0);
              metaY(0);
            };

            card.addEventListener("mousemove", handleMove);
            card.addEventListener("mouseleave", handleLeave);
            cleanup.push(() => {
              card.removeEventListener("mousemove", handleMove);
              card.removeEventListener("mouseleave", handleLeave);
            });
          });
      }
    }, section);

    return () => {
      cleanup.forEach((fn) => fn());
      ctx.revert();
    };
  }, []);

  return (
    <section
      id="gallery"
      ref={sectionRef}
      className="relative overflow-hidden px-6 py-24 sm:py-28"
    >
      <div className="photography-ambient-orb left-[58%] top-[12%] h-52 w-52 opacity-55" />
      <div className="pointer-events-none absolute inset-x-0 top-16 h-px bg-gradient-to-r from-transparent via-[var(--text-base-20)] to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10">
        <div className="gallery-copy-drift lg:sticky lg:top-24 lg:self-start">
          <p className="gallery-copy-block mb-4 font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-amber1)]">
            {t("label")}
          </p>
          <h2 className="gallery-copy-block max-w-xl text-[clamp(2.2rem,5vw,4.8rem)] font-semibold leading-[0.95] tracking-[var(--tracking-tighter)] text-[var(--text-base)]">
            {t("title")}
          </h2>
          <p className="gallery-copy-block mt-4 max-w-lg text-sm leading-relaxed text-[var(--text-base-60)] sm:text-base">
            {t("subtitle")}
          </p>
          <p className="gallery-copy-block mt-8 max-w-md text-sm leading-relaxed text-[var(--text-muted)] sm:text-[15px]">
            {t("intro")}
          </p>
          <div className="gallery-copy-block photography-panel mt-10 rounded-[1.75rem] border border-[var(--text-base-20)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--slate-2)_82%,transparent),color-mix(in_srgb,var(--slate-2)_58%,transparent))] p-6">
            <span className="photography-panel-edge" />
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-base-40)]">
                {t("sheetLabel")}
              </span>
              <span className="photography-hover-meta rounded-full border border-[var(--text-base-20)] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--text-base-40)]">
                {t("sheetMeta")}
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
              {t("sheetNote")}
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--accent-amber1)]">
              {t("frameLabel", { index: String(GALLERY_IMAGES.length).padStart(2, "0") })}
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
                    className="gallery-featured-card gallery-drift-card photography-panel group relative overflow-hidden rounded-[1.8rem] border border-[var(--text-base-20)] bg-[var(--bg-darker)] text-left"
                  >
                    <span className="photography-panel-edge" />
                    <div className="gallery-drift-layer relative aspect-[4/5] overflow-hidden">
                      <Image
                        src={image.src}
                        alt={t(`images.${image.altKey}`)}
                        fill
                        sizes="(max-width: 1024px) 100vw, 44vw"
                        className="photography-media-scale object-cover"
                      />
                      <div className="photography-media-overlay absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.64))]" />
                    </div>
                    <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <span className="gallery-meta-stack photography-hover-meta inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-white/70 backdrop-blur-sm">
                          {t("frameLabel", {
                            index: String(index + 1).padStart(2, "0"),
                          })}
                        </span>
                        <span className="photography-hover-meta inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--accent-amber1)] backdrop-blur-sm">
                          {t("featuredMeta")}
                        </span>
                      </div>
                      <div className="photography-hover-lift">
                        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--accent-amber1)]">
                          {t("featuredLabel")}
                        </p>
                        <p className="mt-2 text-lg font-medium text-[var(--text-base)]">
                          {t(`labels.${image.labelKey}`)}
                        </p>
                        <p className="mt-2 max-w-[26ch] text-sm leading-relaxed text-white/72">
                          {t(`captions.${image.captionKey}`)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onImageClick(thirdFeaturedIndex)}
              className="gallery-featured-card gallery-drift-card photography-panel group relative overflow-hidden rounded-[1.8rem] border border-[var(--text-base-20)] bg-[var(--bg-darker)] text-left"
            >
              <span className="photography-panel-edge" />
              <div className="gallery-drift-layer relative h-full min-h-[22rem] overflow-hidden">
                <Image
                  src={featuredImages[2].src}
                  alt={t(`images.${featuredImages[2].altKey}`)}
                  fill
                  sizes="(max-width: 1024px) 100vw, 28vw"
                  className="photography-media-scale object-cover"
                />
                <div className="photography-media-overlay absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.7))]" />
              </div>
              <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="gallery-meta-stack photography-hover-meta inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-white/70 backdrop-blur-sm">
                    {t("frameLabel", {
                      index: String(thirdFeaturedIndex + 1).padStart(2, "0"),
                    })}
                  </span>
                  <span className="photography-hover-meta inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--accent-amber1)] backdrop-blur-sm">
                    {t("featuredMeta")}
                  </span>
                </div>
                <div className="photography-hover-lift">
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--accent-amber1)]">
                    {t("featuredLabel")}
                  </p>
                  <p className="mt-2 text-lg font-medium text-[var(--text-base)]">
                    {t(`labels.${featuredImages[2].labelKey}`)}
                  </p>
                  <p className="mt-2 max-w-[26ch] text-sm leading-relaxed text-white/72">
                    {t(`captions.${featuredImages[2].captionKey}`)}
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
                  className="gallery-sheet-item photography-panel group relative overflow-hidden rounded-[1.4rem] border border-[var(--text-base-20)] bg-[var(--bg-darker)] text-left"
                >
                  <span className="photography-panel-edge" />
                  <div className="relative aspect-[1.18] overflow-hidden">
                    <Image
                      src={image.src}
                      alt={t(`images.${image.altKey}`)}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 24vw"
                      className="photography-media-scale object-cover"
                    />
                    <div className="photography-media-overlay absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.58))]" />
                  </div>
                  <div className="absolute inset-0 flex flex-col justify-between p-4">
                    <div className="flex justify-between gap-3">
                      <span className="photography-hover-meta inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/18 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-white/65 backdrop-blur-sm">
                        {t("frameLabel", {
                          index: String(index + 1).padStart(2, "0"),
                        })}
                      </span>
                      <span className="translate-y-2 text-xs text-[var(--accent-amber1)] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        &#8599;
                      </span>
                    </div>
                    <div className="photography-hover-lift">
                      <p className="text-sm text-[var(--text-base)]">
                        {t(`labels.${image.labelKey}`)}
                      </p>
                      <p className="mt-2 max-w-[26ch] text-xs leading-relaxed text-white/68 sm:text-sm">
                        {t(`captions.${image.captionKey}`)}
                      </p>
                    </div>
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
