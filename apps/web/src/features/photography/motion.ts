"use client";

export const PHOTOGRAPHY_MOTION = {
  ease: {
    reveal: "expo.out",
    settle: "power3.out",
    drift: "sine.inOut",
    handoff: "power2.out",
  },
  duration: {
    xs: 0.36,
    sm: 0.6,
    md: 0.88,
    lg: 1.12,
  },
  stagger: {
    tight: 0.05,
    regular: 0.09,
    loose: 0.14,
  },
  offset: {
    tight: 18,
    regular: 34,
    loose: 56,
  },
  scale: {
    panel: 0.972,
    card: 0.985,
  },
  rotation: {
    subtle: 3.5,
    panel: 6,
  },
  scroll: {
    entry: "top 82%",
    reveal: "top 76%",
    focus: "top 68%",
  },
} as const;

export function getPhotographyMotionPreferences() {
  if (typeof window === "undefined") {
    return {
      finePointer: true,
      reducedMotion: false,
    };
  }

  return {
    finePointer: window.matchMedia("(pointer: fine)").matches,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
}
