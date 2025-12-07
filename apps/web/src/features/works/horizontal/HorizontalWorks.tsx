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

interface PanelData {
  panel: HTMLDivElement;
  panelContent: HTMLDivElement;
  titleChars: HTMLSpanElement[];
  descChars: HTMLSpanElement[];
  progressFill: HTMLDivElement;
  progressText: HTMLSpanElement;
  titleSplit: ReturnType<typeof splitText>;
  descSplit: ReturnType<typeof splitText>;
  wasCompleted: boolean;
}

export function HorizontalWorks() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const descRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const progressFillRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressTextRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const globalProgressRef = useRef<HTMLDivElement>(null);
  const transitionLineRef = useRef<HTMLDivElement>(null);

  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);
  const entryTriggerRef = useRef<ScrollTrigger | null>(null);
  const panelDataRef = useRef<PanelData[]>([]);

  const [activeSection, setActiveSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<Set<number>>(
    new Set()
  );

  const resetSectionState = useCallback((index: number) => {
    const data = panelDataRef.current[index];
    if (!data) return;

    // Reset title chars to ghost
    data.titleChars.forEach((char) => {
      char.style.opacity = "0.04";
    });

    // Reset desc chars to ghost
    data.descChars.forEach((char) => {
      char.style.opacity = "0.03";
    });

    // Reset progress
    data.progressFill.style.width = "0%";
    data.progressFill.classList.remove("active", "completed");
    data.progressText.textContent = "0%";
    data.wasCompleted = false;

    // Reset panel content
    gsap.set(data.panelContent, {
      scale: 1,
      opacity: 1,
      filter: "blur(0px)",
    });
  }, []);

  const navigateToSection = useCallback(
    (index: number) => {
      const st = scrollTriggerRef.current;
      if (!st || index < 0 || index >= WORKS.length) return;

      const scrollStart = st.start;
      const scrollEnd = st.end;
      const scrollRange = scrollEnd - scrollStart;

      const sectionProgress = index / WORKS.length;
      const targetScroll = scrollStart + scrollRange * sectionProgress + 5;

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

  const initAnimations = useCallback(() => {
    if (!wrapperRef.current || !containerRef.current) return;

    // Cleanup previous
    if (scrollTriggerRef.current) {
      scrollTriggerRef.current.kill();
    }
    if (entryTriggerRef.current) {
      entryTriggerRef.current.kill();
    }
    panelDataRef.current.forEach((data) => {
      data.titleSplit.revert();
      data.descSplit.revert();
    });
    panelDataRef.current = [];

    const totalPanels = WORKS.length;
    const scrollDistance = window.innerHeight * totalPanels * 2.2;
    const transitionLine = transitionLineRef.current;

    // Prepare panel data
    const panelData: PanelData[] = [];

    for (let i = 0; i < totalPanels; i++) {
      const panel = panelRefs.current[i];
      const panelContent = contentRefs.current[i];
      const title = titleRefs.current[i];
      const desc = descRefs.current[i];
      const progressFill = progressFillRefs.current[i];
      const progressText = progressTextRefs.current[i];

      if (!panel || !panelContent || !title || !desc || !progressFill || !progressText)
        continue;

      const titleSplit = splitText(title, "chars");
      const descSplit = splitText(desc, "chars");

      // Set ghost state
      titleSplit.chars.forEach((char) => {
        char.style.opacity = "0.04";
      });
      descSplit.chars.forEach((char) => {
        char.style.opacity = "0.03";
      });

      panelData.push({
        panel,
        panelContent,
        titleChars: titleSplit.chars,
        descChars: descSplit.chars,
        progressFill,
        progressText,
        titleSplit,
        descSplit,
        wasCompleted: false,
      });
    }

    panelDataRef.current = panelData;

    // === Entry Animation: First panel "rise from depth" ===
    const firstPanelContent = contentRefs.current[0];
    if (firstPanelContent) {
      // Initial state: below, blurred
      gsap.set(firstPanelContent, {
        y: 60,
        opacity: 0,
        filter: "blur(8px)",
      });

      // Entry trigger: Works section entry
      entryTriggerRef.current = ScrollTrigger.create({
        trigger: wrapperRef.current,
        start: "top 80%",
        end: "top 20%",
        scrub: 0.8,
        onUpdate: (self) => {
          const progress = self.progress;
          gsap.set(firstPanelContent, {
            y: 60 * (1 - progress),
            opacity: progress,
            filter: `blur(${8 * (1 - progress)}px)`,
          });
        },
      });
    }

    // Build timeline
    const mainTimeline = gsap.timeline();

    panelData.forEach((data, i) => {
      const isLastPanel = i === totalPanels - 1;
      const nextData = panelData[i + 1];

      // Phase 1: Title reveal
      mainTimeline.to(
        data.titleChars,
        {
          opacity: 1,
          duration: 0.25,
          stagger: 0.025,
          ease: "power2.out",
          onStart: () => {
            data.progressFill.classList.add("active");
            setActiveSection(i);
          },
        },
        i === 0 ? 0 : ">"
      );

      // Phase 2: Description reveal
      mainTimeline.to(
        data.descChars,
        {
          opacity: 1,
          duration: 0.4,
          stagger: 0.004,
          ease: "power1.out",
          onUpdate: function () {
            const completedChars = data.descChars.filter(
              (c) => parseFloat(c.style.opacity) > 0.5
            ).length;
            const progress = Math.round(
              (completedChars / data.descChars.length) * 100
            );
            data.progressFill.style.width = progress + "%";
            data.progressText.textContent = progress + "%";
          },
          onComplete: () => {
            data.progressFill.classList.add("completed");
            data.wasCompleted = true;
            setCompletedSections((prev) => new Set([...prev, i]));
          },
        },
        "<0.12"
      );

      // Phase 3: Transition (except last panel)
      if (!isLastPanel && nextData) {
        // Current panel fade out
        mainTimeline.to(
          data.panelContent,
          {
            scale: 0.95,
            opacity: 0.3,
            filter: "blur(4px)",
            duration: 0.12,
            ease: "power2.in",
          },
          ">"
        );

        // Transition line
        if (transitionLine) {
          mainTimeline.to(
            transitionLine,
            {
              width: "100%",
              opacity: 1,
              duration: 0.15,
              ease: "power2.inOut",
            },
            "<0.03"
          );
        }

        // Horizontal movement
        mainTimeline.to(
          containerRef.current,
          {
            x: () => -(window.innerWidth * (i + 1)),
            duration: 0.2,
            ease: "power3.inOut",
          },
          "<0.03"
        );

        // Line fade out
        if (transitionLine) {
          mainTimeline.to(
            transitionLine,
            {
              width: "0%",
              left: "100%",
              opacity: 0,
              duration: 0.15,
              ease: "power2.out",
              onComplete: () => {
                gsap.set(transitionLine, { left: "0%" });
              },
            },
            ">-0.08"
          );
        }

        // Next panel setup and fade in
        mainTimeline.set(
          nextData.panelContent,
          {
            scale: 1.05,
            opacity: 0,
            filter: "blur(4px)",
          },
          "<-0.1"
        );

        mainTimeline.to(
          nextData.panelContent,
          {
            scale: 1,
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.15,
            ease: "power2.out",
          },
          ">-0.08"
        );
      }
    });

    // Create ScrollTrigger
    scrollTriggerRef.current = ScrollTrigger.create({
      id: 'horizontal-works',
      trigger: wrapperRef.current,
      start: "top top",
      end: () => "+=" + scrollDistance,
      scrub: 1,
      pin: true,
      anticipatePin: 1,
      animation: mainTimeline,
      onUpdate: (self) => {
        // Update global progress
        if (globalProgressRef.current) {
          globalProgressRef.current.style.width = self.progress * 100 + "%";
        }
      },
    });
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      document.fonts.ready.then(() => {
        initAnimations();
      });
    }, wrapperRef);

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
      if (entryTriggerRef.current) {
        entryTriggerRef.current.kill();
      }
      panelDataRef.current.forEach((data) => {
        data.titleSplit.revert();
        data.descSplit.revert();
      });
    };
  }, [initAnimations]);

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
            ref={(el) => {
              panelRefs.current[index] = el;
            }}
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
              className="horizontal-content relative z-10 flex max-w-4xl flex-col items-start gap-4 text-left"
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
        {WORKS.map((_, index) => (
          <button
            key={index}
            onClick={() => navigateToSection(index)}
            className={`section-dot relative h-2.5 w-2.5 rounded-full transition-all duration-300 ${
              activeSection === index
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
