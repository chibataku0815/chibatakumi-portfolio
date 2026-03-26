/**
 * @fileoverview BlurText — word-by-word blur/reveal animation
 *
 * Observes .section elements for is-active class changes.
 * When a section becomes active, plays a GSAP timeline that
 * reveals title/text words sequentially with blur + opacity + y.
 * When deactivated, reverses the timeline.
 */

import gsap from "gsap";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const TITLE = {
  fromBlur: 10,
  toOpacity: 1.0,
  fromY: 40,
  duration: 0.6,
  stagger: 0.12,
  ease: "power2.out",
} as const;

const TEXT = {
  fromBlur: 6,
  toOpacity: 0.55,
  fromY: 20,
  duration: 0.5,
  stagger: 0.06,
  ease: "power2.out",
  delay: 0.25,
} as const;

const BADGE = {
  toOpacity: 0.5,
  fromY: 10,
  duration: 0.4,
  ease: "power2.out",
} as const;

// ---------------------------------------------------------------------------
// Word Splitting
// ---------------------------------------------------------------------------

interface SplitWordResult {
  words: HTMLSpanElement[];
  revert: () => void;
}

function splitIntoWords(element: HTMLElement): SplitWordResult {
  const originalHTML = element.innerHTML;
  const text = element.textContent || "";

  element.innerHTML = "";
  element.setAttribute("aria-label", text);

  const words: HTMLSpanElement[] = [];
  const wordArray = text.split(/\s+/).filter(Boolean);

  wordArray.forEach((word, index) => {
    const span = document.createElement("span");
    span.className = "blur-word";
    span.textContent = word;
    span.setAttribute("aria-hidden", "true");
    element.appendChild(span);

    if (index < wordArray.length - 1) {
      element.appendChild(document.createTextNode("\u00A0"));
    }
    words.push(span);
  });

  return {
    words,
    revert: () => {
      element.innerHTML = originalHTML;
      element.removeAttribute("aria-label");
    },
  };
}

// ---------------------------------------------------------------------------
// Per-Section Timeline
// ---------------------------------------------------------------------------

interface SectionAnimData {
  timeline: gsap.core.Timeline;
  titleSplit: SplitWordResult;
  textSplit: SplitWordResult;
}

function createSectionTimeline(section: HTMLElement): SectionAnimData | null {
  const titleEl = section.querySelector<HTMLElement>(".section__title");
  const textEl = section.querySelector<HTMLElement>(".section__text");
  const badgeEl = section.querySelector<HTMLElement>(".section-badge");

  if (!titleEl || !textEl) return null;

  // Parent elements become visible containers; word spans control visibility
  gsap.set(titleEl, { opacity: 1 });
  gsap.set(textEl, { opacity: 1 });

  const titleSplit = splitIntoWords(titleEl);
  const textSplit = splitIntoWords(textEl);

  // Set initial hidden state
  gsap.set(titleSplit.words, {
    filter: `blur(${TITLE.fromBlur}px)`,
    opacity: 0,
    y: TITLE.fromY,
  });
  gsap.set(textSplit.words, {
    filter: `blur(${TEXT.fromBlur}px)`,
    opacity: 0,
    y: TEXT.fromY,
  });
  if (badgeEl) {
    gsap.set(badgeEl, { opacity: 0, y: BADGE.fromY });
  }

  // Build timeline (paused)
  const tl = gsap.timeline({ paused: true });

  // Badge enters first
  if (badgeEl) {
    tl.to(badgeEl, {
      opacity: BADGE.toOpacity,
      y: 0,
      duration: BADGE.duration,
      ease: BADGE.ease,
    }, 0);
  }

  // Title words enter with stagger
  tl.to(titleSplit.words, {
    filter: "blur(0px)",
    opacity: TITLE.toOpacity,
    y: 0,
    duration: TITLE.duration,
    stagger: TITLE.stagger,
    ease: TITLE.ease,
  }, 0.1);

  // Body text words enter after title starts
  tl.to(textSplit.words, {
    filter: "blur(0px)",
    opacity: TEXT.toOpacity,
    y: 0,
    duration: TEXT.duration,
    stagger: TEXT.stagger,
    ease: TEXT.ease,
  }, TEXT.delay);

  return { timeline: tl, titleSplit, textSplit };
}

// ---------------------------------------------------------------------------
// MutationObserver
// ---------------------------------------------------------------------------

function observeSectionActivation(
  section: HTMLElement,
  animData: SectionAnimData,
): MutationObserver {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        if (section.classList.contains("is-active")) {
          animData.timeline.play();
        } else {
          animData.timeline.reverse();
        }
      }
    }
  });

  observer.observe(section, { attributes: true, attributeFilter: ["class"] });
  return observer;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

interface BlurTextInstance {
  destroy: () => void;
}

export function initBlurText(): BlurTextInstance {
  // Respect reduced motion preference
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const sections = document.querySelectorAll<HTMLElement>(".section");
    sections.forEach((section) => {
      const titleEl = section.querySelector<HTMLElement>(".section__title");
      const textEl = section.querySelector<HTMLElement>(".section__text");
      const badgeEl = section.querySelector<HTMLElement>(".section-badge");
      if (titleEl) gsap.set(titleEl, { opacity: 1 });
      if (textEl) gsap.set(textEl, { opacity: 0.55 });
      if (badgeEl) gsap.set(badgeEl, { opacity: 0.5 });
    });
    return { destroy: () => {} };
  }

  const sections = document.querySelectorAll<HTMLElement>(".section");
  const observers: MutationObserver[] = [];
  const animDataList: SectionAnimData[] = [];

  sections.forEach((section) => {
    const animData = createSectionTimeline(section);
    if (!animData) return;

    animDataList.push(animData);
    observers.push(observeSectionActivation(section, animData));

    // If section is already active (first frame), play immediately
    if (section.classList.contains("is-active")) {
      animData.timeline.play();
    }
  });

  return {
    destroy: () => {
      observers.forEach((o) => o.disconnect());
      animDataList.forEach((d) => {
        d.timeline.kill();
        d.titleSplit.revert();
        d.textSplit.revert();
      });
    },
  };
}
