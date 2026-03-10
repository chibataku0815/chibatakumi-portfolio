"use client";

import { AnimatedHeading } from "@/shared/components";
import {
  FluidGradientBackground,
  fluidConfigMonochrome,
} from "@/features/fluid-gradient";
import { ReactNode, useCallback, useEffect, useState } from "react";

const BASE_BG = "#0b0b0b";

export interface Strength {
  id: string;
  title: string;
  description: string;
  keywords: string[];
}

export interface Experience {
  id: string;
  period: string;
  type: string;
  role: string;
  description: string;
  achievements: string[];
  techStack: string[];
  teamSize?: string;
}

interface StrengthSectionProps {
  strength: Strength;
  index: number;
  total: number;
  setRef: (el: HTMLElement | null, index: number) => void;
  onHoverStart?: (id: string, title: string) => void;
  onHoverEnd?: () => void;
}

interface TimelineSectionProps {
  exp: Experience;
  index: number;
  total: number;
  setRef: (el: HTMLElement | null, index: number) => void;
  onHoverStart?: (id: string, title: string) => void;
  onHoverEnd?: () => void;
}

interface ProfileBackgroundProps {
  accentColor?: string | null;
}

export function ProfileIntro() {
  return (
    <section className="relative z-10 flex min-h-[40vh] items-end px-4 pb-12 sm:min-h-[50vh] sm:px-6 sm:pb-16 md:min-h-[60vh] md:px-10 md:pb-20">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-6 md:gap-8 md:grid-cols-[1.2fr,1fr]">
          <div>
            <AnimatedHeading
              as="h1"
              className="text-balance mb-4 max-w-[7ch] text-[var(--type-display-hero)] font-[200] leading-[0.85] tracking-[var(--tracking-ultra-tight)] text-[var(--text-base)]"
            >
              Profile
            </AnimatedHeading>
          </div>
          <div className="flex items-end">
            <p className="max-w-md text-[clamp(1rem,1.4vw,1.3rem)] leading-relaxed text-[var(--text-base-70)]">
              デザイン・コード・映像を一人で統合し、
              <span className="text-[var(--text-base)]">意図通りのアウトプット</span>
              を作る。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProfileBackground({ accentColor }: ProfileBackgroundProps) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-[5]">
      <FluidGradientBackground
        className="h-full w-full"
        config={{
          ...fluidConfigMonochrome,
          brushStrength: 0.25,
          distortionAmount: 0.12,
          colorIntensity: 0.35,
          softness: 0.85,
        }}
        fadeIn={true}
        accentColor={accentColor}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: BASE_BG,
          mixBlendMode: "multiply",
          opacity: 0.93,
        }}
      />
    </div>
  );
}

export function StrengthSection({
  strength,
  index,
  total,
  setRef,
  onHoverStart,
  onHoverEnd,
}: StrengthSectionProps) {
  // 非対称配置: 偶数は左寄り、奇数は右寄り
  const isEven = index % 2 === 0;

  // モバイル判定
  const [canHover, setCanHover] = useState(true);
  useEffect(() => {
    setCanHover(window.matchMedia("(pointer: fine)").matches);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (canHover && onHoverStart) {
      onHoverStart(strength.id, strength.title);
    }
  }, [canHover, onHoverStart, strength.id, strength.title]);

  const handleMouseLeave = useCallback(() => {
    if (canHover && onHoverEnd) {
      onHoverEnd();
    }
  }, [canHover, onHoverEnd]);

  return (
    <section
      ref={(el) => setRef(el, index)}
      className="strength-section relative isolate min-h-[40vh] overflow-visible px-4 py-12 sm:min-h-[50vh] sm:px-6 sm:py-16 md:min-h-[60vh] md:px-10 md:py-20"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Grid Lines */}
      <div
        className="grid-lines pointer-events-none absolute inset-0 -z-4 mix-blend-soft-light"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          opacity: 0,
          willChange: "transform, opacity",
        }}
      />

      {/* Ghost STR - モバイルで非表示 */}
      <div
        className="ghost pointer-events-none absolute -z-2 hidden select-none whitespace-nowrap font-black uppercase leading-none tracking-[-0.08em] md:block"
        style={{
          fontSize: "clamp(6rem, 15vw, 12rem)",
          color: "rgba(255,255,255,0.12)",
          mixBlendMode: "overlay",
          willChange: "transform, opacity",
          ...(isEven
            ? { right: "0%", top: "15%" }
            : { left: "0%", top: "20%" }),
        }}
      >
        STR
      </div>

      {/* Rail - モバイルでは常に左側 */}
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center sm:w-12 ${isEven ? "md:left-0" : "md:left-auto md:right-0"}`}
      >
        <div
          className={`rail absolute inset-y-20 w-px bg-white/25 right-0 ${isEven ? "" : "md:left-0 md:right-auto"}`}
          style={{ clipPath: "inset(0 0 100% 0)" }}
        />
        <div className="-rotate-90 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.36em] text-[var(--text-base-40)]">
          Strength {String(index + 1).padStart(2, "0")}
        </div>
      </div>

      {/* Content - モバイルでは常に左マージン */}
      <div
        className={`profile-content mx-auto max-w-5xl pl-12 sm:pl-14 ${isEven ? "md:pl-0 md:pr-0" : "md:pl-0 md:pr-0"}`}
      >
        <div
          className={`grid gap-6 md:gap-10 md:grid-cols-[1fr,1.5fr] ${isEven ? "" : "md:grid-cols-[1.5fr,1fr]"}`}
        >
          {/* Title側 */}
          <div className={`space-y-6 ${isEven ? "" : "md:order-2"}`}>
            {/* Meta */}
            <div className="flex items-center gap-3 text-[var(--text-base-50)]">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em]">
                Core Strength
              </span>
              <span className="h-px w-10 ui-hairline" />
            </div>

            {/* Title */}
            <div className="relative">
              <div
                className="band-wrapper overflow-hidden"
                style={{ display: "inline-block" }}
              >
                <div
                  className="text-balance band-text max-w-[12ch] text-[clamp(1.5rem,4vw,3.4rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--text-base)]"
                  style={{
                    display: "inline-block",
                    padding: "0.2em 0.3em",
                  }}
                >
                  {strength.title}
                </div>
              </div>
            </div>
          </div>

          {/* Description側 */}
          <div className={`space-y-6 ${isEven ? "" : "md:order-1"}`}>
            <p
              className={`description text-[clamp(1rem,1.4vw,1.2rem)] leading-relaxed text-[var(--text-base-80)] ${isEven ? "" : "md:text-right"}`}
            >
              {strength.description}
            </p>

            {/* Keywords */}
            <div className={`flex flex-wrap gap-2 ${isEven ? "" : "md:justify-end"}`}>
              {strength.keywords.map((keyword) => (
                <span
                  key={`${strength.id}-${keyword}`}
                  className="keyword rounded border border-[var(--stroke-subtle)] bg-[var(--surface-3)] px-3 py-1.5 text-[12px] uppercase tracking-[0.1em] text-[var(--text-base-60)] shadow-[var(--shadow-elev-1)] transition-all duration-200 hover:border-[var(--stroke-strong)]"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Connector Line */}
      {index < total - 1 && (
        <div
          className="connector-line absolute bottom-0 left-1/2 h-24 w-px -translate-x-1/2 bg-gradient-to-b from-white/20 to-transparent"
          style={{ transformOrigin: "top center" }}
        />
      )}
    </section>
  );
}

export function TimelineSection({
  exp,
  index,
  total,
  setRef,
  onHoverStart,
  onHoverEnd,
}: TimelineSectionProps) {
  const depth = index;
  const isDeepest = index === total - 1;

  // モバイル判定
  const [canHover, setCanHover] = useState(true);
  useEffect(() => {
    setCanHover(window.matchMedia("(pointer: fine)").matches);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (canHover && onHoverStart) {
      onHoverStart(exp.id, exp.role);
    }
  }, [canHover, onHoverStart, exp.id, exp.role]);

  const handleMouseLeave = useCallback(() => {
    if (canHover && onHoverEnd) {
      onHoverEnd();
    }
  }, [canHover, onHoverEnd]);

  return (
    <section
      ref={(el) => setRef(el, index)}
      className="timeline-section relative isolate min-h-[50vh] overflow-visible px-4 py-12 sm:min-h-[60vh] sm:px-6 sm:py-16 md:min-h-[70vh] md:px-10 md:py-20"
      data-depth={depth}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Grid Lines */}
      <div
        className="grid-lines pointer-events-none absolute inset-0 -z-9 mix-blend-soft-light"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "100px 100px",
          opacity: 0,
          willChange: "transform, opacity",
        }}
      />

      {/* Depth Indicator */}
      <div
        className="depth-indicator absolute left-0 top-8 h-px w-full"
        style={{
          background: `linear-gradient(90deg, var(--accent-amber1) ${(depth + 1) * 15}%, transparent ${(depth + 1) * 15}%)`,
        }}
      />

      {/* Ghost Year - モバイルで非表示 */}
      <div
        className="ghost-year pointer-events-none absolute -z-8 hidden select-none whitespace-nowrap font-black uppercase leading-none tracking-[-0.06em] md:block"
        style={{
          fontSize: "clamp(8rem, 18vw, 14rem)",
          color: `rgba(255,255,255,${0.10 + (depth / total) * 0.06})`,
          mixBlendMode: "overlay",
          willChange: "transform, opacity",
          right: "0%",
          top: "12%",
        }}
      >
        {exp.period.split(" - ")[0]}
      </div>

      {/* Rail */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center sm:w-16 md:w-20">
        <div
          className="rail absolute inset-y-16 right-0 bg-white/25"
          style={{
            width: `${2 + depth * 1}px`,
            clipPath: "inset(0 0 100% 0)",
          }}
        />
        <div className="-rotate-90 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--text-base-50)]">
          {exp.period.split(" - ")[0]}
        </div>
      </div>

      {/* Content */}
      <div className="profile-content mx-auto ml-14 max-w-5xl sm:ml-20 md:ml-24">
        <div className="grid gap-6 md:gap-10 md:grid-cols-[1.3fr,1fr]">
          {/* Left: Main info */}
          <div className="space-y-6">
            {/* Meta items */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="meta-item text-[15px] italic tracking-wide text-[var(--text-base-60)]">
                {exp.period}
              </span>
                <span className="meta-item inline-block border border-[var(--stroke-subtle)] bg-[var(--surface-2)] px-3 py-1 text-[24px] font-semibold leading-none text-[var(--text-base)] shadow-[var(--shadow-elev-1)]">
                {exp.type}
              </span>
              {exp.teamSize && (
                <span className="meta-item rounded border border-[var(--stroke-subtle)] bg-[var(--surface-3)] px-2.5 py-1 text-xs text-[var(--text-base-60)] shadow-[var(--shadow-elev-1)]">
                  {exp.teamSize}
                </span>
              )}
            </div>

            {/* Title */}
            <div className="relative">
              <div
                className="text-balance band inline-block max-w-[12ch] text-[clamp(2rem,5vw,3.2rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-[var(--text-base)]"
                style={{
                  padding: "0.22em 0.4em",
                }}
              >
                {exp.role}
              </div>
            </div>

            {/* Description */}
            <p className="description max-w-lg text-[clamp(0.95rem,1.3vw,1.15rem)] leading-relaxed text-[var(--text-base-80)]">
              {exp.description}
            </p>
          </div>

          {/* Right: Achievements + Tech */}
          <div className="space-y-6">
            {/* Achievements */}
            <ul className="space-y-3">
              {exp.achievements.map((achievement, i) => (
                <li
                  key={i}
                  className="achievement-item flex items-start gap-3 text-sm text-[var(--text-base-70)]"
                  style={{ transformOrigin: "left center" }}
                >
                  <span className="mt-1.5 h-0.5 w-5 flex-shrink-0 ui-hairline" />
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>

            {/* Tech Stack */}
            <div className="flex flex-wrap gap-2">
              {exp.techStack.map((tech) => (
                <span
                  key={tech}
                  className="tag rounded border border-[var(--stroke-subtle)] bg-[var(--surface-3)] px-3 py-1.5 text-[12px] text-[var(--text-base-70)] shadow-[var(--shadow-elev-1)] transition-all duration-200 hover:border-[var(--stroke-strong)]"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Origin Glow */}
      {isDeepest && (
        <div
          className="origin-glow pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2"
          style={{
            width: "200px",
            height: "200px",
            background:
              "radial-gradient(circle, var(--accent-amber1) 0%, transparent 70%)",
            opacity: 0,
            filter: "blur(60px)",
          }}
        />
      )}
    </section>
  );
}

export function ProfileLayout({ children }: { children: ReactNode }) {
  return <main className="relative min-h-screen text-[var(--text-base)]">{children}</main>;
}
