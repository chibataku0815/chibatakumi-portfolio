"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { splitText } from "@/shared/utils/splitText";
import { portfolioData } from "@/shared/data/portfolio";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
}

const WORKS = portfolioData.works.items;
const TITLE_GHOST_OPACITY = "0.04";
const DESC_GHOST_OPACITY = "0.03";
const SCROLL_DISTANCE_FACTOR = 2.2;
const NAV_SCROLL_OFFSET = 5; // 少し進めてセクション開始直後の状態にするためのオフセット
const OPACITY_VISIBLE_THRESHOLD = 0.5;

/**
 * Animation tuning knobs to avoid scattered magic numbers.
 */
const ANIMATION = {
  entry: {
    offsetY: 60,
    blur: 8,
    start: "top 80%",
    end: "top 20%",
    scrub: 0.8,
  },
  title: {
    duration: 0.25,
    stagger: 0.025,
  },
  desc: {
    duration: 0.4,
    stagger: 0.004,
  },
  progressLine: {
    durationIn: 0.15,
    durationOut: 0.15,
  },
  panelFade: {
    scale: 0.95,
    opacity: 0.3,
    blur: 4,
    duration: 0.12,
  },
  slide: {
    duration: 0.2,
  },
  nextPanel: {
    setupScale: 1.05,
    setupOpacity: 0,
    setupBlur: 4,
    duration: 0.15,
  },
} as const;

interface PanelData {
  panelContent: HTMLDivElement;
  titleChars: HTMLSpanElement[];
  descChars: HTMLSpanElement[];
  progressFill: HTMLDivElement;
  progressText: HTMLSpanElement;
  titleSplit: ReturnType<typeof splitText>;
  descSplit: ReturnType<typeof splitText>;
  wasCompleted: boolean;
  totalDescChars: number;
}

const setGhostOpacity = (elements: HTMLElement[], opacity: string) => {
  for (const char of elements) {
    char.style.opacity = opacity;
  }
};

const warnMissingRefs = (indices: number[]) => {
  if (!indices.length) return;
  if (process.env.NODE_ENV !== "development") return;
  console.warn(
    `[HorizontalWorks] Missing DOM refs at indices: ${indices.join(", ")}`
  );
};

const revertSplits = (panelData: PanelData[]) => {
  for (const data of panelData) {
    data.titleSplit.revert();
    data.descSplit.revert();
  }
};

export function HorizontalWorks() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const descRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const progressFillRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressTextRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const globalProgressRef = useRef<HTMLDivElement>(null);
  const transitionLineRef = useRef<HTMLDivElement>(null);
  const resizeRafRef = useRef<number | null>(null);
  const lastSizeRef = useRef<{ width: number; height: number } | null>(null);

  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const entryTriggerRef = useRef<ScrollTrigger | null>(null);
  const panelDataRef = useRef<PanelData[]>([]);

  const [activeSection, setActiveSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<number>>(
    new Set()
  );

  const resetPanelVisualState = useCallback((panelData: PanelData) => {
    setGhostOpacity(panelData.titleChars, TITLE_GHOST_OPACITY);
    setGhostOpacity(panelData.descChars, DESC_GHOST_OPACITY);

    panelData.progressFill.style.width = "0%";
    panelData.progressFill.classList.remove("active", "completed");
    panelData.progressText.textContent = "0%";
    panelData.wasCompleted = false;

    gsap.set(panelData.panelContent, {
      scale: 1,
      opacity: 1,
      filter: "blur(0px)",
    });
  }, []);

  const resetSectionState = useCallback(
    (index: number) => {
      const data = panelDataRef.current[index];
      if (!data) return;

      resetPanelVisualState(data);
    },
    [resetPanelVisualState]
  );

  /**
   * Collect panel data from DOM refs; skips panels missing refs and warns in dev.
   */
  const buildPanelData = useCallback((): PanelData[] => {
    const panelData: PanelData[] = [];
    const missingRefIndices: number[] = [];

    for (const [index] of WORKS.entries()) {
      const panelContent = contentRefs.current[index];
      const title = titleRefs.current[index];
      const desc = descRefs.current[index];
      const progressFill = progressFillRefs.current[index];
      const progressText = progressTextRefs.current[index];

      if (
        !panelContent ||
        !title ||
        !desc ||
        !progressFill ||
        !progressText
      ) {
        missingRefIndices.push(index);
        continue;
      }

      const titleSplit = splitText(title, "chars");
      const descSplit = splitText(desc, "chars");

      const data: PanelData = {
        panelContent,
        titleChars: titleSplit.chars,
        descChars: descSplit.chars,
        progressFill,
        progressText,
        titleSplit,
        descSplit,
        wasCompleted: false,
        totalDescChars: descSplit.chars.length,
      };

      resetPanelVisualState(data);
      panelData.push(data);
    }

    warnMissingRefs(missingRefIndices);
    return panelData;
  }, [resetPanelVisualState]);

  const cleanupAnimations = useCallback(() => {
    if (scrollTriggerRef.current) {
      scrollTriggerRef.current.kill();
      scrollTriggerRef.current = null;
    }

    if (entryTriggerRef.current) {
      entryTriggerRef.current.kill();
      entryTriggerRef.current = null;
    }

    revertSplits(panelDataRef.current);
    panelDataRef.current = [];

    if (globalProgressRef.current) {
      globalProgressRef.current.style.width = "0%";
    }
  }, []);

  const navigateToSection = useCallback(
    (index: number) => {
      const st = scrollTriggerRef.current;
      if (!st || index < 0 || index >= WORKS.length) return;

      const scrollStart = st.start;
      const scrollEnd = st.end;
      const scrollRange = scrollEnd - scrollStart;

      const sectionProgress = index / WORKS.length;
      const targetScroll =
        scrollStart + scrollRange * sectionProgress + NAV_SCROLL_OFFSET;

      // Reset target section
      resetSectionState(index);

      gsap.to(window, {
        scrollTo: targetScroll,
        duration: 0.6,
        ease: "power2.inOut",
      });
    },
    [resetSectionState]
  );

  const createEntryTrigger = useCallback(
    (firstPanelContent: HTMLDivElement | null | undefined) => {
      if (!wrapperRef.current || !firstPanelContent) {
        warnMissingRefs([0]);
        return null;
      }

      gsap.set(firstPanelContent, {
        y: ANIMATION.entry.offsetY,
        opacity: 0,
        filter: `blur(${ANIMATION.entry.blur}px)`,
      });

      return ScrollTrigger.create({
        trigger: wrapperRef.current,
        start: ANIMATION.entry.start,
        end: ANIMATION.entry.end,
        scrub: ANIMATION.entry.scrub,
        onUpdate: (self) => {
          const progress = self.progress;
          gsap.set(firstPanelContent, {
            y: ANIMATION.entry.offsetY * (1 - progress),
            opacity: progress,
            filter: `blur(${ANIMATION.entry.blur * (1 - progress)}px)`,
          });
        },
      });
    },
    []
  );

  /**
   * Assemble the master GSAP timeline for all panels.
   */
  const createMainTimeline = useCallback(
    (panelData: PanelData[], transitionLine: HTMLDivElement | null) => {
      const timeline = gsap.timeline();

      for (const [index, data] of panelData.entries()) {
        const isLastPanel = index === panelData.length - 1;
        const nextData = panelData[index + 1];

        timeline.to(
          data.titleChars,
          {
            opacity: 1,
            duration: ANIMATION.title.duration,
            stagger: ANIMATION.title.stagger,
            ease: "power2.out",
            onStart: () => {
              data.progressFill.classList.add("active");
              setActiveSection(index);
            },
          },
          index === 0 ? 0 : ">"
        );

        timeline.to(
          data.descChars,
          {
            opacity: 1,
            duration: ANIMATION.desc.duration,
            stagger: ANIMATION.desc.stagger,
            ease: "power1.out",
            onUpdate: () => {
              let completedChars = 0;
              for (const char of data.descChars) {
                if (parseFloat(char.style.opacity) > OPACITY_VISIBLE_THRESHOLD) {
                  completedChars += 1;
                }
              }
              const progress = Math.round(
                (completedChars / data.totalDescChars) * 100
              );
              data.progressFill.style.width = progress + "%";
              data.progressText.textContent = progress + "%";
            },
            onComplete: () => {
              if (data.wasCompleted) return;

              data.wasCompleted = true;
              data.progressFill.classList.add("completed");
              setCompletedSections((prev) => {
                if (prev.has(index)) return prev;
                const next = new Set(prev);
                next.add(index);
                return next;
              });
            },
          },
          "<0.12"
        );

        if (!isLastPanel && nextData) {
          timeline.to(
            data.panelContent,
            {
              scale: ANIMATION.panelFade.scale,
              opacity: ANIMATION.panelFade.opacity,
              filter: `blur(${ANIMATION.panelFade.blur}px)`,
              duration: ANIMATION.panelFade.duration,
              ease: "power2.in",
            },
            ">"
          );

          if (transitionLine) {
            timeline.to(
              transitionLine,
              {
                width: "100%",
                opacity: 1,
                duration: ANIMATION.progressLine.durationIn,
                ease: "power2.inOut",
              },
              "<0.03"
            );
          }

          timeline.to(
            containerRef.current,
            {
              x: () => -(window.innerWidth * (index + 1)),
              duration: ANIMATION.slide.duration,
              ease: "power3.inOut",
            },
            "<0.03"
          );

          if (transitionLine) {
            timeline.to(
              transitionLine,
              {
                width: "0%",
                left: "100%",
                opacity: 0,
                duration: ANIMATION.progressLine.durationOut,
                ease: "power2.out",
                onComplete: () => {
                  gsap.set(transitionLine, { left: "0%" });
                },
              },
              ">-0.08"
            );
          }

          timeline.set(
            nextData.panelContent,
            {
              scale: ANIMATION.nextPanel.setupScale,
              opacity: ANIMATION.nextPanel.setupOpacity,
              filter: `blur(${ANIMATION.nextPanel.setupBlur}px)`,
            },
            "<-0.1"
          );

          timeline.to(
            nextData.panelContent,
            {
              scale: 1,
              opacity: 1,
              filter: "blur(0px)",
              duration: ANIMATION.nextPanel.duration,
              ease: "power2.out",
            },
            ">-0.08"
          );
        }
      });

      return timeline;
    },
    [setActiveSection, setCompletedSections]
  );

  const initAnimations = useCallback(() => {
    if (!wrapperRef.current || !containerRef.current) return;

    cleanupAnimations();

    const panelData = buildPanelData();
    if (!panelData.length) return;

    lastSizeRef.current = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    panelDataRef.current = panelData;
    setActiveSection(0);
    setCompletedSections(new Set());

    const entryTrigger = createEntryTrigger(panelData[0]?.panelContent);
    if (entryTrigger) {
      entryTriggerRef.current = entryTrigger;
    }

    const transitionLine = transitionLineRef.current;
    const mainTimeline = createMainTimeline(panelData, transitionLine);

    scrollTriggerRef.current = ScrollTrigger.create({
      id: "horizontal-works",
      trigger: wrapperRef.current,
      start: "top top",
      end: () =>
        "+=" + window.innerHeight * panelData.length * SCROLL_DISTANCE_FACTOR,
      scrub: 1,
      pin: true,
      anticipatePin: 1,
      animation: mainTimeline,
      onUpdate: (self) => {
        if (globalProgressRef.current) {
          globalProgressRef.current.style.width = self.progress * 100 + "%";
        }
      },
    });
  }, [
    buildPanelData,
    cleanupAnimations,
    createEntryTrigger,
    createMainTimeline,
  ]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      document.fonts.ready.then(() => {
        initAnimations();
      });
    }, wrapperRef);

    const handleResize = () => {
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
      }
      resizeRafRef.current = window.requestAnimationFrame(() => {
        resizeRafRef.current = null;
        const width = window.innerWidth;
        const height = window.innerHeight;
        const lastSize = lastSizeRef.current;
        if (lastSize && lastSize.width === width && lastSize.height === height) {
          return;
        }
        lastSizeRef.current = { width, height };
        initAnimations();
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (resizeRafRef.current !== null) {
        cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = null;
      }
      window.removeEventListener("resize", handleResize);
      cleanupAnimations();
      ctx.revert();
    };
  }, [cleanupAnimations, initAnimations]);

  const isNavReady = Boolean(scrollTriggerRef.current);

  return (
    <div
      ref={wrapperRef}
      className="horizontal-wrapper relative overflow-hidden"
    >
      {/* Horizontal Container */}
      <div
        ref={containerRef}
        className="horizontal-container flex h-screen w-fit"
      >
        {WORKS.map((work, index) => (
          <div
            key={work.id}
            className="horizontal-panel relative flex h-screen w-screen flex-shrink-0 flex-col items-center justify-center px-6"
            style={
              work.media?.type === "gradient"
                ? { backgroundImage: work.media.value }
                : work.media?.type === "image"
                  ? { backgroundImage: `url(${work.media.src})`, backgroundSize: "cover", backgroundPosition: "center" }
                  : undefined
            }
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.05),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(255,191,73,0.12),transparent_40%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55),rgba(0,0,0,0.85))]" />

            {/* Panel Number */}
            <span className="absolute left-8 top-8 text-sm font-medium tracking-wide text-[var(--text-base-40)]">
              {work.id}
            </span>

            {/* Panel Content */}
            <div
              ref={(el) => {
                contentRefs.current[index] = el;
              }}
              className="horizontal-content relative z-10 flex max-w-5xl flex-col items-start gap-4 text-left"
            >
              <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--accent-amber1)]/70">
                {work.meta}
              </span>

              <h2
                ref={(el) => {
                  titleRefs.current[index] = el;
                }}
                className="horizontal-title break-words text-[clamp(2.5rem,7vw,5rem)] font-semibold leading-[1.0] tracking-[-0.03em] text-[var(--text-base)]"
              >
                {work.title}
              </h2>

              <p
                ref={(el) => {
                  descRefs.current[index] = el;
                }}
                className="horizontal-desc text-xl leading-relaxed text-[var(--text-base-70)]"
              >
                {work.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-base-60)]">
                {work.role && (
                  <span className="rounded-full bg-[var(--bg-overlay-10)] px-3 py-1 text-xs font-medium text-[var(--text-base-70)]">
                    {work.role}
                  </span>
                )}
                {work.tags?.slice(0, 5).map((tag) => (
                  <span
                    key={`${work.id}-${tag}`}
                    className="rounded-full bg-[var(--bg-overlay-5)] px-3 py-1 text-xs text-[var(--text-base-60)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Hidden progress elements to satisfy animation logic */}
              <div className="mt-6 hidden w-48 items-center gap-3">
                <div className="progress-track relative h-[2px] flex-1 overflow-hidden rounded-full bg-[var(--bg-overlay-10)]">
                  <div
                    ref={(el) => {
                      progressFillRefs.current[index] = el;
                    }}
                    className="progress-fill absolute left-0 top-0 h-full w-0 rounded-full bg-[var(--text-base)] transition-shadow duration-300"
                  >
                    <div className="progress-head absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-[var(--text-base)] opacity-0" />
                  </div>
                </div>
                <span
                  ref={(el) => {
                    progressTextRefs.current[index] = el;
                  }}
                  className="progress-text w-10 text-right text-xs font-medium tabular-nums text-[var(--text-base-40)]"
                >
                  0%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transition Line Overlay */}
      <div className="transition-overlay pointer-events-none fixed inset-0 z-50">
        <div
          ref={transitionLineRef}
          className="transition-line absolute left-0 top-1/2 h-[1px] w-0 -translate-y-1/2 bg-[var(--text-base)] opacity-0"
        />
      </div>

      {/* Dot Navigation */}
      <div className="section-indicators fixed right-8 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-3">
        {WORKS.map((work, index) => (
          <button
            key={work.id}
            onClick={() => navigateToSection(index)}
            disabled={!isNavReady}
            aria-disabled={!isNavReady}
            className={`section-dot relative h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              !isNavReady
                ? "cursor-not-allowed opacity-60"
                : activeSection === index
                  ? "scale-125 bg-[var(--text-base)] shadow-[var(--shadow-glow-md)]"
                  : completedSections.has(index)
                    ? "bg-[var(--text-base)]"
                    : "bg-[var(--bg-overlay-20)] hover:bg-[var(--bg-overlay-40)]"
            }`}
            aria-label={`Go to section ${index + 1}`}
          >
            {activeSection === index && (
              <span className="absolute inset-0 animate-ping rounded-full border border-white/40" />
            )}
            {completedSections.has(index) && activeSection !== index && (
              <span className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="h-1.5 w-1.5 text-[var(--bg-darker)]"
                  fill="currentColor"
                  viewBox="0 0 12 12"
                >
                  <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Global Progress Bar */}
      <div className="global-progress fixed bottom-0 left-0 z-40 h-[2px] w-full bg-transparent">
        <div ref={globalProgressRef} className="global-progress-fill h-full w-0 bg-transparent" />
      </div>
    </div>
  );
}

export default HorizontalWorks;
