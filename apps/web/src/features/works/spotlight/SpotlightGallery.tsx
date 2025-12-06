"use client";

import { useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { splitText } from "@/shared/utils/splitText";
import { portfolioData } from "@/shared/data/portfolio";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// === DATA ===
const { images: IMAGES, coverImage: COVER_IMAGE, introText: INTRO_TEXT, outroText: OUTRO_TEXT } = portfolioData.spotlight;

const SCATTER_DIRECTIONS = [
  { x: 1.3, y: 0.7 },
  { x: -1.5, y: 1.0 },
  { x: 1.1, y: -1.3 },
  { x: -1.7, y: -0.8 },
  { x: 0.8, y: 1.5 },
  { x: -1.0, y: -1.4 },
  { x: 1.6, y: 0.3 },
  { x: -0.7, y: 1.7 },
  { x: 1.2, y: -1.6 },
  { x: -1.4, y: 0.9 },
  { x: 1.8, y: -0.5 },
  { x: -1.1, y: -1.8 },
  { x: 0.9, y: 1.8 },
  { x: -1.9, y: 0.4 },
  { x: 1.0, y: -1.9 },
  { x: -0.8, y: 1.9 },
  { x: 1.7, y: -1.0 },
  { x: -1.3, y: -1.2 },
  { x: 0.7, y: 2.0 },
  { x: 1.25, y: -0.2 },
];

export function SpotlightGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const coverRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLHeadingElement>(null);
  const outroRef = useRef<HTMLHeadingElement>(null);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const introSplitRef = useRef<ReturnType<typeof splitText> | null>(null);
  const outroSplitRef = useRef<ReturnType<typeof splitText> | null>(null);

  const initAnimations = useCallback(() => {
    if (!sectionRef.current) return;

    // Cleanup previous
    if (scrollTriggerRef.current) {
      scrollTriggerRef.current.kill();
    }
    if (introSplitRef.current) {
      introSplitRef.current.revert();
    }
    if (outroSplitRef.current) {
      outroSplitRef.current.revert();
    }

    const images = imageRefs.current.filter(Boolean) as HTMLDivElement[];
    const coverImg = coverRef.current;
    const introHeader = introRef.current;
    const outroHeader = outroRef.current;

    if (!coverImg || !introHeader || !outroHeader) return;

    // Split text
    introSplitRef.current = splitText(introHeader, "words");
    outroSplitRef.current = splitText(outroHeader, "words");

    gsap.set(introSplitRef.current.words, { opacity: 1 });
    gsap.set(outroSplitRef.current.words, { opacity: 0 });
    gsap.set(outroHeader, { opacity: 1 });

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isMobile = screenWidth < 1000;
    const scatterMultiplier = isMobile ? 2.5 : 0.5;

    // Initial positions (all behind camera)
    const startPositions = images.map(() => ({
      x: 0,
      y: 0,
      z: -1000,
      scale: 0,
    }));

    // End positions (scattered)
    const endPositions = SCATTER_DIRECTIONS.map((dir) => ({
      x: dir.x * screenWidth * scatterMultiplier,
      y: dir.y * screenHeight * scatterMultiplier,
      z: 2000,
      scale: 1,
    }));

    // Set initial states
    images.forEach((img, index) => {
      gsap.set(img, startPositions[index]);
    });

    gsap.set(coverImg, {
      z: -1000,
      scale: 0,
      x: 0,
      y: 0,
    });

    scrollTriggerRef.current = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: `+=${window.innerHeight * 15}px`,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        const scaleMultiplier = isMobile ? 4 : 2;

        // Animate images
        images.forEach((img, index) => {
          const staggerDelay = index * 0.03;
          const imageProgress = Math.max(0, (progress - staggerDelay) * 4);

          const start = startPositions[index];
          const end = endPositions[index];

          const zValue = gsap.utils.interpolate(start.z, end.z, imageProgress);
          const scaleValue = gsap.utils.interpolate(
            start.scale,
            end.scale,
            imageProgress * scaleMultiplier
          );
          const xValue = gsap.utils.interpolate(start.x, end.x, imageProgress);
          const yValue = gsap.utils.interpolate(start.y, end.y, imageProgress);

          gsap.set(img, {
            z: zValue,
            scale: scaleValue,
            x: xValue,
            y: yValue,
          });
        });

        // Cover image: appears at 0.7 progress
        const coverProgress = Math.max(0, (progress - 0.7) * 4);
        const coverZValue = -1000 + 1000 * coverProgress;
        const coverScaleValue = Math.min(1, coverProgress * 2);

        gsap.set(coverImg, {
          z: coverZValue,
          scale: coverScaleValue,
          x: 0,
          y: 0,
        });

        // Intro text fade out (0.6 - 0.75)
        if (introSplitRef.current && introSplitRef.current.words.length > 0) {
          const words = introSplitRef.current.words;
          if (progress >= 0.6 && progress <= 0.75) {
            const introFadeProgress = (progress - 0.6) / 0.15;
            const totalWords = words.length;

            words.forEach((word, index) => {
              const wordFadeProgress = index / totalWords;
              const fadeRange = 0.1;

              if (introFadeProgress >= wordFadeProgress + fadeRange) {
                gsap.set(word, { opacity: 0 });
              } else if (introFadeProgress <= wordFadeProgress) {
                gsap.set(word, { opacity: 1 });
              } else {
                const wordOpacity =
                  1 - (introFadeProgress - wordFadeProgress) / fadeRange;
                gsap.set(word, { opacity: wordOpacity });
              }
            });
          } else if (progress < 0.6) {
            gsap.set(words, { opacity: 1 });
          } else if (progress > 0.75) {
            gsap.set(words, { opacity: 0 });
          }
        }

        // Outro text fade in (0.8 - 0.95)
        if (outroSplitRef.current && outroSplitRef.current.words.length > 0) {
          const words = outroSplitRef.current.words;
          if (progress >= 0.8 && progress <= 0.95) {
            const outroRevealProgress = (progress - 0.8) / 0.15;
            const totalWords = words.length;

            words.forEach((word, index) => {
              const wordRevealProgress = index / totalWords;
              const fadeRange = 0.1;

              if (outroRevealProgress >= wordRevealProgress + fadeRange) {
                gsap.set(word, { opacity: 1 });
              } else if (outroRevealProgress <= wordRevealProgress) {
                gsap.set(word, { opacity: 0 });
              } else {
                const wordOpacity =
                  (outroRevealProgress - wordRevealProgress) / fadeRange;
                gsap.set(word, { opacity: wordOpacity });
              }
            });
          } else if (progress < 0.8) {
            gsap.set(words, { opacity: 0 });
          } else if (progress > 0.95) {
            gsap.set(words, { opacity: 1 });
          }
        }
      },
    });
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      document.fonts.ready.then(() => {
        initAnimations();
      });
    }, sectionRef);

    const handleResize = () => {
      initAnimations();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      ctx.revert();
      window.removeEventListener("resize", handleResize);
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
      }
      ScrollTrigger.getAll().forEach((st) => {
        if (st.vars.trigger === sectionRef.current) {
          st.kill();
        }
      });
    };
  }, [initAnimations]);

  return (
    <section
      ref={sectionRef}
      className="spotlight-section relative h-screen w-full overflow-hidden bg-[var(--bg-darker)]"
    >
      {/* 3D Container */}
      <div className="spotlight-perspective absolute inset-0 flex items-center justify-center">
        {/* Images Layer */}
        <div className="spotlight-3d-layer absolute inset-0">
          {IMAGES.map((image, index) => (
            <div
              key={index}
              ref={(el) => {
                imageRefs.current[index] = el;
              }}
              className="spotlight-img absolute left-1/2 top-1/2 h-48 w-72 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg bg-white/5 md:h-64 md:w-96"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 288px, 384px"
              />
            </div>
          ))}

          {/* Cover Image */}
          <div
            ref={coverRef}
            className="spotlight-cover absolute left-1/2 top-1/2 h-72 w-[28rem] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-white/10 md:h-96 md:w-[36rem]"
          >
            <Image
              src={COVER_IMAGE.src}
              alt={COVER_IMAGE.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 448px, 576px"
              priority
            />
          </div>
        </div>

        {/* Text Layer */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6">
          {/* Intro Header */}
          <h1
            ref={introRef}
            className="spotlight-intro-header text-center text-[clamp(1.5rem,5vw,3rem)] font-semibold leading-tight tracking-[-0.02em] text-[var(--text-base)]"
          >
            {INTRO_TEXT}
          </h1>

          {/* Outro Header */}
          <h1
            ref={outroRef}
            className="spotlight-outro-header absolute text-center text-[clamp(1.5rem,5vw,3rem)] font-semibold leading-tight tracking-[-0.02em] text-[var(--text-base)]"
          >
            {OUTRO_TEXT}
          </h1>
        </div>
      </div>
    </section>
  );
}

export default SpotlightGallery;
