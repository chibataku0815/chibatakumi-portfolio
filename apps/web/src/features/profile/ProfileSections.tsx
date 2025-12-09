"use client";

import { AnimatedHeading } from "@/shared/components";
import {
  FluidGradientBackground,
  fluidConfigMonochrome,
} from "@/features/fluid-gradient";
import { ReactNode } from "react";

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
}

interface TimelineSectionProps {
  exp: Experience;
  index: number;
  total: number;
  setRef: (el: HTMLElement | null, index: number) => void;
}

export function ProfileIntro() {
  return (
    <section className="relative z-10 flex min-h-[60vh] items-end px-6 pb-20 sm:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-8 md:grid-cols-[1.2fr,1fr]">
          <div>
            <AnimatedHeading
              as="h1"
              className="mb-4 text-[var(--type-display-hero)] font-[200] leading-[0.85] tracking-[var(--tracking-ultra-tight)] text-[var(--text-base)]"
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

export function ProfileBackground() {
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
}: StrengthSectionProps) {
  // 非対称配置: 偶数は左寄り、奇数は右寄り
  const isEven = index % 2 === 0;

  return (
    <section
      ref={(el) => setRef(el, index)}
      className="strength-section relative isolate min-h-[60vh] overflow-visible px-6 py-20 sm:px-10"
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

      {/* Ghost STR */}
      <div
        className="ghost pointer-events-none absolute -z-2 select-none whitespace-nowrap font-black uppercase leading-none tracking-[-0.08em]"
        style={{
          fontSize: "clamp(8rem, 18vw, 14rem)",
          color: "rgba(255,255,255,0.15)",
          mixBlendMode: "overlay",
          willChange: "transform, opacity",
          ...(isEven
            ? { right: "-10%", top: "15%" }
            : { left: "-10%", top: "20%" }),
        }}
      >
        STR
      </div>

      {/* Rail */}
      <div
        className={`pointer-events-none absolute inset-y-0 flex w-10 items-center justify-center sm:w-12 ${isEven ? "left-0" : "right-0"}`}
      >
        <div
          className={`rail absolute inset-y-20 w-px bg-white/25 ${isEven ? "right-0" : "left-0"}`}
          style={{ clipPath: "inset(0 0 100% 0)" }}
        />
        <div className="-rotate-90 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.36em] text-[var(--text-base-40)]">
          Strength {String(index + 1).padStart(2, "0")}
        </div>
      </div>

      {/* Content */}
      <div
        className={`profile-content mx-auto max-w-5xl ${isEven ? "pr-16 md:pr-0" : "pl-16 md:pl-0"}`}
      >
        <div
          className={`grid gap-10 md:grid-cols-[1fr,1.5fr] ${isEven ? "" : "md:grid-cols-[1.5fr,1fr]"}`}
        >
          {/* Title側 */}
          <div className={`space-y-6 ${isEven ? "" : "md:order-2"}`}>
            {/* Meta */}
            <div className="flex items-center gap-3 text-[var(--text-base-50)]">
              <span className="font-mono text-[10px] uppercase tracking-[0.24em]">
                Core Strength
              </span>
              <span className="h-px w-10 bg-[var(--accent-amber1)]" />
            </div>

            {/* Title */}
            <div className="relative">
              <div
                className="band-wrapper overflow-hidden"
                style={{ display: "inline-block" }}
              >
                <div
                  className="band-text text-[clamp(2.2rem,5vw,3.4rem)] font-semibold leading-[1] tracking-[-0.02em] text-black"
                  style={{
                    backgroundColor: BAND_BG,
                    display: "inline-block",
                    padding: "0.25em 0.45em",
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
                  className="keyword rounded border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] uppercase tracking-[0.1em] text-[var(--text-base-60)] transition-all duration-200 hover:border-white/20 hover:bg-white/10"
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
}: TimelineSectionProps) {
  const depth = index;
  const isDeepest = index === total - 1;

  return (
    <section
      ref={(el) => setRef(el, index)}
      className="timeline-section relative isolate min-h-[70vh] overflow-visible px-6 py-20 sm:px-10"
      data-depth={depth}
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

      {/* Ghost Year */}
      <div
        className="ghost-year pointer-events-none absolute -z-8 select-none whitespace-nowrap font-black uppercase leading-none tracking-[-0.06em]"
        style={{
          fontSize: "clamp(10rem, 22vw, 18rem)",
          color: `rgba(255,255,255,${0.12 + (depth / total) * 0.08})`,
          mixBlendMode: "overlay",
          willChange: "transform, opacity",
          right: "-12%",
          top: "12%",
        }}
      >
        {exp.period.split(" - ")[0]}
      </div>

      {/* Rail */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-16 items-center justify-center sm:w-20">
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
      <div className="profile-content mx-auto ml-20 max-w-5xl sm:ml-24">
        <div className="grid gap-10 md:grid-cols-[1.3fr,1fr]">
          {/* Left: Main info */}
          <div className="space-y-6">
            {/* Meta items */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="meta-item text-[15px] italic tracking-wide text-[var(--text-base-60)]">
                {exp.period}
              </span>
              <span className="meta-item inline-block bg-white/10 px-3 py-1 text-[24px] font-semibold leading-none text-[var(--text-base)]">
                {exp.type}
              </span>
              {exp.teamSize && (
                <span className="meta-item rounded border border-white/12 bg-white/5 px-2.5 py-1 text-xs text-[var(--text-base-60)]">
                  {exp.teamSize}
                </span>
              )}
            </div>

            {/* Title */}
            <div className="relative">
              <div
                className="band inline-block text-[clamp(2rem,5vw,3.2rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-black"
                style={{
                  backgroundColor: BAND_BG,
                  padding: "0.22em 0.4em",
                  boxShadow: "10px 10px 0 rgba(0,0,0,0.5)",
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
                  <span className="mt-1.5 h-0.5 w-5 flex-shrink-0 bg-[var(--accent-amber1)]/70" />
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>

            {/* Tech Stack */}
            <div className="flex flex-wrap gap-2">
              {exp.techStack.map((tech) => (
                <span
                  key={tech}
                  className="tag rounded border border-white/12 bg-white/6 px-3 py-1.5 text-[12px] text-[var(--text-base-70)] transition-all duration-200 hover:border-white/20 hover:bg-white/10"
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
