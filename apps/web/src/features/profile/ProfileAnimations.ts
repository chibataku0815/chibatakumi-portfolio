import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Profile Page アニメーション設定
 * 「地層」と「結晶構造」のビジュアルコンセプト
 */
export const ANIMATION_CONFIG = {
  strengths: {
    ghost: {
      initialY: 60,
      initialBlur: 10,
      initialScale: 1.08,
      finalOpacity: 0.15,
      parallaxY: 80,
      duration: 1.0,
      ease: "expo.out",
    },
    rail: {
      duration: 0.9,
      ease: "expo.out",
    },
    title: {
      initialX: "-110%",
      duration: 0.85,
      ease: "expo.out",
    },
    description: {
      charStagger: 0.006,
      charBlur: 3,
      duration: 0.5,
      ease: "power2.out",
    },
    keywords: {
      initialY: 16,
      stagger: 0.06,
      duration: 0.35,
      ease: "power3.out",
    },
    connector: {
      duration: 0.8,
      ease: "power2.inOut",
    },
  },

  timeline: {
    ghost: {
      initialY: 80,
      initialBlur: 12,
      initialScale: 1.1,
      parallaxY: 100,
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
    meta: {
      initialY: 24,
      stagger: 0.1,
      duration: 0.5,
      ease: "power3.out",
    },
    description: {
      charStagger: 0.005,
      duration: 0.5,
      ease: "power2.out",
    },
    achievements: {
      initialClipPath: "inset(0 100% 0 0)",
      stagger: 0.12,
      duration: 0.6,
      ease: "power2.out",
    },
    techStack: {
      initialY: 14,
      stagger: 0.05,
      duration: 0.35,
      ease: "power3.out",
    },
    depth: {
      duration: 1.5,
    },
  },

  parallax: {
    ghost: {
      speed: 0.7,
      scaleRange: 0.12,
    },
    content: {
      speed: 0.08,
    },
    gridLines: {
      speed: 1.3,
    },
  },
} as const;

/**
 * 深さに応じた Ghost opacity を計算
 * 深いほど濃い
 */
export function getGhostOpacity(depth: number, total: number): number {
  return 0.12 + (depth / total) * 0.08;
}

/**
 * Strength セクションのエントリーアニメーション
 */
export function setupStrengthEntry(
  el: HTMLElement,
  index: number,
  total: number
): gsap.core.Timeline {
  const config = ANIMATION_CONFIG.strengths;

  const ghost = el.querySelector<HTMLElement>(".ghost");
  const rail = el.querySelector<HTMLElement>(".rail");
  const bandText = el.querySelector<HTMLElement>(".band-text");
  const description = el.querySelector<HTMLElement>(".description");
  const keywords = el.querySelectorAll<HTMLElement>(".keyword");
  const gridLines = el.querySelector<HTMLElement>(".grid-lines");
  const connector = el.querySelector<HTMLElement>(".connector-line");

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: el,
      start: "top 70%",
      end: "top 20%",
      once: true,
    },
  });

  // Layer 1: Atmosphere (3拍子)
  if (gridLines) {
    gsap.set(gridLines, { opacity: 0 });
    tl.to(gridLines, { opacity: 0.06, duration: 1.2, ease: "power1.out" }, 0);
  }

  if (ghost) {
    gsap.set(ghost, {
      y: config.ghost.initialY,
      opacity: 0,
      scale: config.ghost.initialScale,
      filter: `blur(${config.ghost.initialBlur}px)`,
    });
    tl.to(
      ghost,
      {
        y: 0,
        opacity: config.ghost.finalOpacity,
        scale: 1,
        filter: "blur(0px)",
        duration: 1.5,
        ease: "expo.out",
        clearProps: "filter",
      },
      0.3
    );
  }

  // Layer 2: Structure (2拍子)
  if (rail) {
    gsap.set(rail, { clipPath: "inset(0 0 100% 0)" });
    tl.to(
      rail,
      {
        clipPath: "inset(0 0 0% 0)",
        duration: 0.9,
        ease: "power3.out",
      },
      0.4
    );
  }

  if (bandText) {
    gsap.set(bandText, { x: config.title.initialX, opacity: 0 });
    tl.to(
      bandText,
      {
        x: "0%",
        opacity: 1,
        duration: 0.85,
        ease: "expo.out",
      },
      0.8
    );
  }

  // Layer 3: Details (4拍子)
  if (description) {
    const text = description.textContent || "";
    description.innerHTML = text
      .split("")
      .map((char) =>
        char === " "
          ? " "
          : `<span class="char" style="opacity:0;filter:blur(${config.description.charBlur}px);display:inline-block">${char}</span>`
      )
      .join("");

    const chars = description.querySelectorAll(".char");
    tl.to(
      chars,
      {
        opacity: 1,
        filter: "blur(0px)",
        stagger: 0.004,
        duration: 0.5,
        ease: "power2.out",
        clearProps: "filter",
      },
      1.3
    );
  }

  if (keywords.length > 0) {
    gsap.set(keywords, { y: config.keywords.initialY, opacity: 0, scale: 0.95 });
    tl.to(
      keywords,
      {
        y: 0,
        opacity: 1,
        scale: 1,
        stagger: 0.05,
        duration: 0.3,
        ease: "power2.out",
      },
      1.6
    );
  }

  if (connector && index < total - 1) {
    gsap.set(connector, { scaleY: 0, transformOrigin: "top center", opacity: 0 });
    tl.to(
      connector,
      {
        scaleY: 1,
        opacity: 1,
        duration: 1.0,
        ease: "power3.inOut",
      },
      1.8
    );
  }

  return tl;
}

/**
 * Timeline セクションのエントリーアニメーション
 */
export function setupTimelineEntry(
  el: HTMLElement,
  index: number,
  total: number
): gsap.core.Timeline {
  const config = ANIMATION_CONFIG.timeline;
  const depth = index;

  const ghost = el.querySelector<HTMLElement>(".ghost-year");
  const rail = el.querySelector<HTMLElement>(".rail");
  const bandText = el.querySelector<HTMLElement>(".band");
  const metaItems = el.querySelectorAll<HTMLElement>(".meta-item");
  const description = el.querySelector<HTMLElement>(".description");
  const achievements = el.querySelectorAll<HTMLElement>(".achievement-item");
  const techStack = el.querySelectorAll<HTMLElement>(".tag");
  const gridLines = el.querySelector<HTMLElement>(".grid-lines");
  const depthIndicator = el.querySelector<HTMLElement>(".depth-indicator");

  const ghostOpacity = getGhostOpacity(depth, total);

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: el,
      start: "top 70%",
      end: "top 20%",
      once: true,
    },
  });

  // Grid Lines
  if (gridLines) {
    gsap.set(gridLines, { opacity: 0 });
    tl.to(gridLines, { opacity: 0.08, duration: 0.7, ease: "power1.out" });
  }

  // Depth Indicator
  if (depthIndicator) {
    gsap.set(depthIndicator, { scaleX: 0, transformOrigin: "left center" });
    tl.to(
      depthIndicator,
      {
        scaleX: 1,
        duration: 0.8,
        ease: "power2.out",
      },
      0.1
    );
  }

  // Ghost Year
  if (ghost) {
    gsap.set(ghost, {
      y: config.ghost.initialY,
      opacity: 0,
      scale: config.ghost.initialScale,
      filter: `blur(${config.ghost.initialBlur}px)`,
    });
    tl.to(
      ghost,
      {
        y: 0,
        opacity: ghostOpacity,
        scale: 1,
        filter: "blur(0px)",
        duration: config.ghost.duration,
        ease: config.ghost.ease,
        clearProps: "filter",
      },
      0.2
    );
  }

  // Rail
  if (rail) {
    const railWidth = 2 + depth * 1;
    gsap.set(rail, { clipPath: "inset(0 0 100% 0)", width: railWidth });
    tl.to(
      rail,
      {
        clipPath: "inset(0 0 0% 0)",
        duration: config.rail.duration,
        ease: config.rail.ease,
      },
      0.4
    );
  }

  // Meta items
  if (metaItems.length > 0) {
    gsap.set(metaItems, { y: config.meta.initialY, opacity: 0 });
    tl.to(
      metaItems,
      {
        y: 0,
        opacity: 1,
        stagger: config.meta.stagger,
        duration: config.meta.duration,
        ease: config.meta.ease,
      },
      0.6
    );
  }

  // Title
  if (bandText) {
    gsap.set(bandText, { x: config.title.initialX, opacity: 0 });
    tl.to(
      bandText,
      {
        x: "0%",
        opacity: 1,
        duration: config.title.duration,
        ease: config.title.ease,
      },
      0.8
    );
  }

  // Description
  if (description) {
    const text = description.textContent || "";
    description.innerHTML = text
      .split("")
      .map((char) =>
        char === " "
          ? " "
          : `<span class="char" style="opacity:0;filter:blur(3px);display:inline-block">${char}</span>`
      )
      .join("");

    const chars = description.querySelectorAll(".char");
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
      1.1
    );
  }

  // Achievements (左からワイプ)
  if (achievements.length > 0) {
    gsap.set(achievements, {
      clipPath: config.achievements.initialClipPath,
      opacity: 0,
    });
    tl.to(
      achievements,
      {
        clipPath: "inset(0 0% 0 0)",
        opacity: 1,
        stagger: config.achievements.stagger,
        duration: config.achievements.duration,
        ease: config.achievements.ease,
      },
      1.4
    );
  }

  // Tech Stack
  if (techStack.length > 0) {
    gsap.set(techStack, { y: config.techStack.initialY, opacity: 0 });
    tl.to(
      techStack,
      {
        y: 0,
        opacity: 1,
        stagger: config.techStack.stagger,
        duration: config.techStack.duration,
        ease: config.techStack.ease,
      },
      1.7
    );
  }

  // Origin Glow (最深層)
  if (index === total - 1) {
    const glowEl = el.querySelector<HTMLElement>(".origin-glow");
    if (glowEl) {
      gsap.set(glowEl, { opacity: 0, scale: 0.8 });
      tl.to(
        glowEl,
        {
          opacity: 1,
          scale: 1,
          duration: config.depth.duration,
          ease: "power2.out",
        },
        2.0
      );
    }
  }

  return tl;
}

/**
 * Parallax設定
 */
export function setupProfileParallax(el: HTMLElement): ScrollTrigger {
  const config = ANIMATION_CONFIG.parallax;

  const ghost = el.querySelector<HTMLElement>(".ghost, .ghost-year");
  const content = el.querySelector<HTMLElement>(".profile-content");
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
        const y = centered * config.ghost.speed * 140;
        const scale = 1 - Math.abs(centered) * config.ghost.scaleRange;
        const baseOpacity = parseFloat(ghost.style.opacity) || 0.15;
        const opacity = baseOpacity - Math.abs(centered) * 0.05;

        ghost.style.transform = `translateY(${y}px) scale(${scale})`;
        ghost.style.opacity = String(Math.max(0.05, opacity));
      }

      if (content) {
        const y = centered * config.content.speed * 50;
        content.style.transform = `translateY(${y}px)`;
      }

      if (gridLines) {
        const y = progress * config.gridLines.speed * 60;
        gridLines.style.transform = `translateY(${y}px)`;
      }
    },
  });
}
