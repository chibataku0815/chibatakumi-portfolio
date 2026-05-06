import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * アニメーション設定
 * 「静かな確信」を表現するためのパラメータ
 */
export const ANIMATION_CONFIG = {
  entry: {
    ghost: {
      initialY: 80,
      initialBlur: 12,
      initialScale: 1.1,
      finalOpacity: 0.15,
      duration: 1.2,
      ease: "expo.out",
    },
    rail: {
      duration: 1.0,
      ease: "expo.out",
    },
    title: {
      initialX: "-120%",
      duration: 0.9,
      ease: "expo.out",
    },
    description: {
      charStagger: 0.008,
      charBlur: 4,
      duration: 0.6,
      ease: "power2.out",
    },
    tags: {
      initialY: 20,
      stagger: 0.08,
      duration: 0.4,
      ease: "power3.out",
    },
    image: {
      clipDuration: 1.0,
      ease: "expo.out",
    },
  },
  parallax: {
    ghost: { speed: 0.6, scaleRange: 0.1, opacityRange: 0.07 },
    content: { speed: 0.1 },
    accent: { speed: 0.3 },
    background: { speed: 1.2 },
  },
} as const;

/**
 * セクションの初期状態を設定（非表示）
 */
export function setInitialState(el: HTMLElement): void {
  const config = ANIMATION_CONFIG.entry;

  const ghost = el.querySelector<HTMLElement>(".ghost");
  const rail = el.querySelector<HTMLElement>(".rail");
  const titleBand = el.querySelector<HTMLElement>(".title-band");
  const titleShadow = el.querySelector<HTMLElement>(".title-shadow");
  const description = el.querySelector<HTMLElement>(".description");
  const tags = el.querySelectorAll<HTMLElement>(".tag");
  const image = el.querySelector<HTMLElement>(".skill-image");
  const gridLines = el.querySelector<HTMLElement>(".grid-lines");

  if (gridLines) gsap.set(gridLines, { opacity: 0 });
  if (ghost) {
    gsap.set(ghost, {
      y: config.ghost.initialY,
      opacity: 0,
      scale: config.ghost.initialScale,
      filter: `blur(${config.ghost.initialBlur}px)`,
    });
  }
  if (rail) gsap.set(rail, { clipPath: "inset(0 0 100% 0)" });
  if (titleBand) gsap.set(titleBand, { x: config.title.initialX, opacity: 0 });
  if (titleShadow) gsap.set(titleShadow, { opacity: 0, x: -10, y: -10 });
  if (description) gsap.set(description, { opacity: 0 });
  if (tags.length > 0) gsap.set(tags, { y: config.tags.initialY, opacity: 0 });
  if (image) gsap.set(image, { clipPath: "circle(0% at 50% 50%)" });
}

/**
 * セクションのエントリーアニメーションを設定
 */
export function setupSectionEntry(el: HTMLElement): gsap.core.Timeline {
  const config = ANIMATION_CONFIG.entry;

  const ghost = el.querySelector<HTMLElement>(".ghost");
  const rail = el.querySelector<HTMLElement>(".rail");
  const titleBand = el.querySelector<HTMLElement>(".title-band");
  const titleShadow = el.querySelector<HTMLElement>(".title-shadow");
  const description = el.querySelector<HTMLElement>(".description");
  const tags = el.querySelectorAll<HTMLElement>(".tag");
  const image = el.querySelector<HTMLElement>(".skill-image");
  const gridLines = el.querySelector<HTMLElement>(".grid-lines");

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: el,
      start: "top 80%",
      once: true,
    },
  });

  // T+0.0s: Grid Lines
  if (gridLines) {
    tl.to(gridLines, { opacity: 0.08, duration: 0.8, ease: "power1.out" }, 0);
  }

  // T+0.3s: Ghost
  if (ghost) {
    tl.to(
      ghost,
      {
        y: 0,
        opacity: config.ghost.finalOpacity,
        scale: 1,
        filter: "blur(0px)",
        duration: config.ghost.duration,
        ease: config.ghost.ease,
        clearProps: "filter",
      },
      0.3
    );
  }

  // T+0.6s: Rail
  if (rail) {
    tl.to(
      rail,
      {
        clipPath: "inset(0 0 0% 0)",
        duration: config.rail.duration,
        ease: config.rail.ease,
      },
      0.6
    );
  }

  // T+0.9s: Title
  if (titleBand) {
    tl.to(
      titleBand,
      {
        x: "0%",
        opacity: 1,
        duration: config.title.duration,
        ease: config.title.ease,
      },
      0.9
    );

    if (titleShadow) {
      tl.to(
        titleShadow,
        { opacity: 1, x: 0, y: 0, duration: 0.4, ease: "power2.out" },
        1.2
      );
    }
  }

  // T+1.2s: Description - 文字単位でタイプライター的reveal
  if (description) {
    const text = description.textContent || "";
    description.setAttribute("data-original-text", text);

    description.innerHTML = text
      .split("")
      .map((char) =>
        char === " "
          ? " "
          : `<span class="char" style="opacity:0;filter:blur(${config.description.charBlur}px);display:inline-block">${char}</span>`
      )
      .join("");

    const chars = description.querySelectorAll<HTMLElement>(".char");

    if (chars.length > 0) {
      tl.to(
        chars,
        {
          opacity: 1,
          filter: "blur(0px)",
          stagger: config.description.charStagger,
          duration: config.description.duration,
          ease: config.description.ease,
          clearProps: "filter",
        },
        1.2
      );
    }
  }

  // T+1.6s: Tags
  if (tags.length > 0) {
    tl.to(
      tags,
      {
        y: 0,
        opacity: 1,
        stagger: config.tags.stagger,
        duration: config.tags.duration,
        ease: config.tags.ease,
      },
      1.6
    );
  }

  // T+2.0s: Image
  if (image) {
    tl.to(
      image,
      {
        clipPath: "circle(100% at 50% 50%)",
        duration: config.image.clipDuration,
        ease: config.image.ease,
      },
      2.0
    );
  }

  return tl;
}

/**
 * Multi-layer Parallax
 */
export function setupParallax(el: HTMLElement): ScrollTrigger {
  const config = ANIMATION_CONFIG.parallax;

  const ghost = el.querySelector<HTMLElement>(".ghost");
  const content = el.querySelector<HTMLElement>(".skill-content");
  const accents = el.querySelectorAll<HTMLElement>(".accent-element");
  const gridLines = el.querySelector<HTMLElement>(".grid-lines");

  return ScrollTrigger.create({
    trigger: el,
    start: "top bottom",
    end: "bottom top",
    scrub: 1.2,
    onUpdate: (self) => {
      const progress = self.progress;
      const centered = progress - 0.5;

      if (ghost) {
        const y = centered * config.ghost.speed * 120;
        const scale = 1 - Math.abs(centered) * config.ghost.scaleRange * 1.5;
        const baseOpacity = 0.15;
        const opacity = baseOpacity - Math.abs(centered) * config.ghost.opacityRange * 1.2;

        ghost.style.transform = `translateY(${y}px) scale(${scale})`;
        ghost.style.opacity = String(Math.max(0.04, opacity));
      }

      if (content) {
        const y = centered * config.content.speed * 50;
        content.style.transform = `translateY(${y}px)`;
      }

      for (const accent of accents) {
        const y = centered * config.accent.speed * 60;
        accent.style.transform = `translateY(${y}px)`;
      }

      if (gridLines) {
        const y = progress * config.background.speed * 50;
        gridLines.style.transform = `translateY(${y}px)`;
      }
    },
  });
}
