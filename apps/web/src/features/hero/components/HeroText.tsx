"use client";

import { portfolioData } from "@/shared/data/portfolio";
import { splitText } from "@/shared/utils/splitText";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Premium Hero Text Animation - Asymmetric Layout
 *
 * Design principles:
 * - Diagonal composition: top-right (title) → center-left (tagline) → bottom-right (scroll)
 * - Interactive title: mouse-following parallax + glitch on hover
 * - Typewriter tagline: step-by-step reveal with cursor
 * - Duration: 0.6-0.8s (luxury feel)
 * - Easing: power2.out (smooth, professional)
 */
export function HeroText() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const titleCharsRef = useRef<HTMLSpanElement[]>([]);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number | undefined>(undefined);
  const [revealedLines, setRevealedLines] = useState<number>(0);
  const [currentCharIndex, setCurrentCharIndex] = useState<number>(0);
  const [showCursor, setShowCursor] = useState(true);
  const [canHover, setCanHover] = useState(false);

  const { scrollText, tagline, subTagline } = portfolioData.hero;
  const baseTaglineLines =
    typeof tagline === "string"
      ? tagline.split("\n").filter(Boolean)
      : tagline.lines;

  // Include subTagline in the typewriter sequence (memoized to prevent infinite re-renders)
  const allLines = useMemo(
    () => (subTagline ? [...baseTaglineLines, subTagline] : baseTaglineLines),
    [baseTaglineLines, subTagline]
  );

  useEffect(() => {
    setCanHover(window.matchMedia("(pointer: fine)").matches);
  }, []);

  // Mouse tracking for title parallax
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }, []);

  // Animate title chars based on mouse position
  const animateTitleChars = useCallback(() => {
    if (!titleCharsRef.current.length) return;

    titleCharsRef.current.forEach((char, i) => {
      if (!char) return;
      const rect = char.getBoundingClientRect();
      const charCenterX = rect.left + rect.width / 2;
      const charCenterY = rect.top + rect.height / 2;

      const mouseX = mouseRef.current.x * window.innerWidth;
      const mouseY = mouseRef.current.y * window.innerHeight;

      const distX = (mouseX - charCenterX) / window.innerWidth;
      const distY = (mouseY - charCenterY) / window.innerHeight;
      const dist = Math.sqrt(distX * distX + distY * distY);

      // Parallax intensity based on distance (closer = stronger)
      const intensity = Math.max(0, 1 - dist * 2) * 8;
      const offsetX = distX * intensity;
      const offsetY = distY * intensity;

      gsap.to(char, {
        x: offsetX,
        y: offsetY,
        duration: 0.4,
        ease: "power2.out",
      });
    });

    rafRef.current = requestAnimationFrame(animateTitleChars);
  }, []);

  // Typewriter effect for taglines (infinite loop)
  useEffect(() => {
    // All lines complete - pause then restart
    if (revealedLines >= allLines.length) {
      const timeout = setTimeout(() => {
        setRevealedLines(0);
        setCurrentCharIndex(0);
      }, 3000); // 3 second pause before restarting
      return () => clearTimeout(timeout);
    }

    const currentLine = allLines[revealedLines];
    if (currentCharIndex < currentLine.length) {
      // Typing characters
      const timeout = setTimeout(() => {
        setCurrentCharIndex((prev) => prev + 1);
      }, 55 + Math.random() * 35); // Variable speed for natural feel
      return () => clearTimeout(timeout);
    } else {
      // Line complete, move to next after pause
      const timeout = setTimeout(() => {
        setRevealedLines((prev) => prev + 1);
        setCurrentCharIndex(0);
      }, 600); // Pause between lines
      return () => clearTimeout(timeout);
    }
  }, [revealedLines, currentCharIndex, allLines]);

  // Cursor blink effect
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !titleRef.current || !taglineRef.current) return;

    // Add mouse move listener
    window.addEventListener("mousemove", handleMouseMove);

    // Wait for fonts to load (critical for accurate layout)
    document.fonts.ready.then(() => {
      const ctx = gsap.context(() => {
        // === TITLE: Premium blur-to-sharp reveal ===
        const titleSplit = splitText(titleRef.current!, "chars");

        // Store refs to chars for mouse interaction
        titleCharsRef.current = titleSplit.chars as HTMLSpanElement[];

        // Initial state: invisible, slightly below, blurred
        gsap.set(titleSplit.chars, {
          opacity: 0,
          y: 16,
          filter: "blur(8px)",
        });

        // Premium timeline
        const masterTl = gsap.timeline({
          defaults: {
            ease: "power2.out",
          },
        });

        // Stage 1: Title chars reveal (blur-to-sharp + fade + micro-y)
        masterTl.to(titleSplit.chars, {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.7,
          stagger: {
            each: 0.035,
            from: "start",
          },
          clearProps: "filter",
          onComplete: () => {
            // Start mouse tracking animation after reveal
            rafRef.current = requestAnimationFrame(animateTitleChars);
            // Start typewriter effect
            setRevealedLines(0);
            setCurrentCharIndex(0);
          },
        });

        // Stage 2: Scroll indicator fade-in (tagline now handled by typewriter)
        gsap.set(scrollIndicatorRef.current, {
          opacity: 0,
          y: 8,
        });

        masterTl.to(scrollIndicatorRef.current, {
          opacity: 0.6,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          delay: 0.8, // Wait for typewriter to start
        });

        // Subtle pulse animation (after reveal completes)
        masterTl.to(scrollIndicatorRef.current, {
          y: 6,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        // === SCROLL PARALLAX: Enhanced "sinking" effect ===
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.8,
          onUpdate: (self) => {
            const progress = self.progress;

            // Title: enhanced "sinking" parallax
            gsap.set(titleRef.current, {
              y: -progress * 120,
              opacity: 1 - progress * 1.2,
              scale: 1 - progress * 0.05,
            });

            // Tagline: fade with blur
            gsap.set(taglineRef.current, {
              y: -progress * 80,
              opacity: 1 - progress * 1.8,
              filter: `blur(${progress * 3}px)`,
            });

            // Scroll indicator: quick fade with y movement
            gsap.set(scrollIndicatorRef.current, {
              opacity: Math.max(0, 0.6 - progress * 4),
              y: -progress * 40,
            });
          },
        });

        // Cleanup
        return () => {
          titleSplit.revert();
        };
      }, containerRef);

      return () => {
        ctx.revert();
        ScrollTrigger.getAll().forEach((st) => st.kill());
        window.removeEventListener("mousemove", handleMouseMove);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    });
  }, [handleMouseMove, animateTitleChars]);

  // Glitch effect on hover
  const handleTitleMouseEnter = () => {
    if (!canHover) return;
    titleCharsRef.current.forEach((char, i) => {
      if (!char) return;
      // Random glitch offset
      const glitchX = (Math.random() - 0.5) * 4;
      const glitchY = (Math.random() - 0.5) * 2;

      gsap.to(char, {
        textShadow: `
          ${glitchX}px ${glitchY}px 0 rgba(255, 100, 50, 0.8),
          ${-glitchX}px ${-glitchY}px 0 rgba(50, 200, 255, 0.8)
        `,
        duration: 0.1,
        delay: i * 0.02,
      });
    });
  };

  const handleTitleMouseLeave = () => {
    if (!canHover) return;
    titleCharsRef.current.forEach((char) => {
      if (!char) return;
      gsap.to(char, {
        textShadow: "none",
        x: 0,
        y: 0,
        duration: 0.4,
        ease: "power2.out",
      });
    });
  };

  // Get displayed text for typewriter effect
  const getDisplayedText = (lineIndex: number) => {
    if (lineIndex < revealedLines) {
      return allLines[lineIndex]; // Fully revealed
    } else if (lineIndex === revealedLines) {
      return allLines[lineIndex].slice(0, currentCharIndex); // Currently typing
    }
    return ""; // Not yet revealed
  };

  const isCurrentLine = (lineIndex: number) => lineIndex === revealedLines;
  const isAllComplete = revealedLines >= allLines.length;

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-[calc(100svh-2rem)] flex-col justify-center px-0 pb-28 pt-[calc(var(--nav-height)+3.5rem)] sm:min-h-[85vh] sm:pb-32 sm:pt-[calc(var(--nav-height)+4.5rem)]"
    >
      {/* Title - Right aligned with hover interaction */}
      <div className="flex w-full flex-col items-start px-5 sm:items-end sm:pr-10 sm:pl-8 md:pr-16 lg:pr-24">
        <h1
          ref={titleRef}
          onMouseEnter={handleTitleMouseEnter}
          onMouseLeave={handleTitleMouseLeave}
          className="text-balance max-w-[5.5ch] cursor-default text-left text-[clamp(3.4rem,18vw,12rem)] font-semibold leading-[0.88] tracking-[var(--tracking-tighter)] text-[var(--text-base)] transition-colors duration-300 sm:text-right"
        >
          <span className="block">Takumi</span>
          <span className="block">Chiba</span>
        </h1>
      </div>

      {/* Tagline - Left aligned with typewriter effect (infinite loop) */}
      <div
        ref={taglineRef}
        className="mt-10 flex w-full flex-col items-start px-5 sm:mt-14 sm:pl-8 md:pl-16 lg:pl-24"
      >
        {allLines.map((line, index) => {
          const isSubTagline = subTagline && index === allLines.length - 1;
          return (
            <p
              key={`${line}-${index}`}
              className={`tagline-line ${
                index > 0 ? (isSubTagline ? "mt-4" : "mt-2") : ""
              } ${
                isSubTagline
                  ? "max-w-[28ch] text-[clamp(0.95rem,3.8vw,1.15rem)] font-medium tracking-[0.02em] text-[var(--text-base-70)]"
                  : "text-[clamp(1rem,4.6vw,1.45rem)] font-normal tracking-[0.03em] text-[var(--text-base-80)]"
              } text-balance`}
              style={{
                minHeight: isSubTagline ? "1.3em" : "1.5em", // Prevent layout shift
              }}
            >
              <span className="inline-block min-w-[1ch]">
                {getDisplayedText(index)}
              </span>
              {/* Cursor - shows on current line or blinks at end when complete */}
              {(isCurrentLine(index) || (isAllComplete && index === allLines.length - 1)) && (
                <span
                  className={`inline-block w-[2px] h-[1.2em] ml-[2px] align-middle bg-[var(--accent-amber1)] transition-opacity duration-100 ${
                    showCursor ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export default HeroText;
