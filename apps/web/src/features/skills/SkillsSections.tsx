"use client";

import { AnimatedHeading } from "@/shared/components";
import {
  FluidGradientBackground,
  fluidConfigMonochrome,
} from "@/features/fluid-gradient";
import type { WorkItem } from "@/shared/data/portfolio";
import { ReactNode, useCallback, useEffect, useState } from "react";

const BASE_BG = "#0b0b0b";

// 構図パターン: A=右重心, B=左重心, C=中央緊張
type LayoutPattern = "A" | "B" | "C";

function getLayoutPattern(index: number): LayoutPattern {
  const patterns: LayoutPattern[] = ["A", "B", "C"];
  return patterns[index % 3];
}

interface SkillSectionProps {
  skill: WorkItem;
  index: number;
  setRef: (el: HTMLElement | null, index: number) => void;
  onHoverStart?: (skillId: string) => void;
  onHoverEnd?: () => void;
}

interface SkillsBackgroundProps {
  accentColor?: string | null;
}

export function SkillsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-x-hidden text-[var(--text-base)]">
      {children}
    </main>
  );
}

export function SkillsBackground({ accentColor }: SkillsBackgroundProps) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-[5]">
      <FluidGradientBackground
        className="h-full w-full"
        config={fluidConfigMonochrome}
        fadeIn={true}
        accentColor={accentColor}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: BASE_BG,
          mixBlendMode: "multiply",
          opacity: 0.9,
        }}
      />
    </div>
  );
}

export function SkillsIntro() {
  return (
    <section className="relative z-10 flex min-h-[50vh] items-end px-4 pb-16 sm:min-h-[60vh] sm:px-6 sm:pb-20 md:min-h-[70vh] md:px-10 md:pb-24">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-6 md:gap-8 md:grid-cols-[1fr,1.618fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-[var(--stroke-subtle)] bg-[var(--surface-2)] px-4 py-2 text-[11px] font-mono uppercase tracking-[0.24em] text-[var(--text-muted)] shadow-[var(--shadow-elev-1)]">
              Hybrid Skillset
            </div>
            <AnimatedHeading
              as="h1"
              className="text-balance max-w-[7ch] text-[var(--type-display-hero)] font-[200] leading-[0.9] tracking-[var(--tracking-ultra-tight)] text-[var(--text-base)]"
            >
              Skills
            </AnimatedHeading>
          </div>
          <div className="flex flex-col justify-end">
            <p className="max-w-xl text-[clamp(1.1rem,1.5vw,1.4rem)] leading-relaxed text-[var(--text-base-80)]">
              Code. Design. Lens. Motion. Brew.
              <br />
              <span className="text-[var(--text-base-60)]">
                One mind. Complete output.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SkillSection({ skill, index, setRef, onHoverStart, onHoverEnd }: SkillSectionProps) {
  const pattern = getLayoutPattern(index);

  // モバイル判定（pointer: coarse では無効化）
  const [canHover, setCanHover] = useState(true);
  useEffect(() => {
    setCanHover(window.matchMedia("(pointer: fine)").matches);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (canHover && onHoverStart) {
      onHoverStart(skill.id);
    }
  }, [canHover, onHoverStart, skill.id]);

  const handleMouseLeave = useCallback(() => {
    if (canHover && onHoverEnd) {
      onHoverEnd();
    }
  }, [canHover, onHoverEnd]);

  return (
    <section
      ref={(el) => setRef(el, index)}
      className="skill-section relative isolate min-h-[80vh] overflow-visible px-4 py-16 sm:min-h-screen sm:px-6 sm:py-20 md:px-10 md:py-24"
      data-pattern={pattern}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Grid Lines (背景レイヤー) */}
      <div
        className="grid-lines pointer-events-none absolute inset-0 -z-[6] mix-blend-soft-light"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "100px 100px",
          opacity: 0,
          willChange: "transform, opacity",
        }}
      />

      {/* Ghost Text - フルワード、モバイルではみ出し防止 */}
      <div
        className="ghost pointer-events-none absolute -z-2 hidden select-none whitespace-nowrap font-black uppercase leading-none tracking-[-0.06em] md:block"
        style={{
          fontSize: "clamp(8rem, 20vw, 18rem)",
          color: "rgba(255,255,255,0.12)",
          mixBlendMode: "overlay",
          willChange: "transform, opacity",
          ...(pattern === "A"
            ? { right: "0%", top: "10%" }
            : pattern === "B"
              ? { left: "0%", top: "15%" }
              : { left: "50%", top: "5%", transform: "translateX(-50%)" }),
        }}
      >
        {skill.meta.split(" ")[0].toUpperCase()}
      </div>

      {/* Content Grid */}
      <div className="mx-auto max-w-7xl">
        {pattern === "A" && <PatternA skill={skill} />}
        {pattern === "B" && <PatternB skill={skill} />}
        {pattern === "C" && <PatternC skill={skill} />}
      </div>

      {/* Rail */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center sm:w-16">
        <div className="rail absolute inset-y-24 right-0 w-px bg-white/20" />
        <div className="-rotate-90 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--text-base-40)]">
          {`Skill ${String(index + 1).padStart(2, "0")}`}
        </div>
      </div>
    </section>
  );
}

// Pattern A: 右重心（黄金比）
function PatternA({ skill }: { skill: WorkItem }) {
  return (
    <div className="grid min-h-[50vh] items-center gap-6 md:min-h-[70vh] md:gap-12 md:grid-cols-[1.618fr,1fr]">
      {/* Left: Content */}
      <div className="skill-content flex flex-col gap-8">
        <div className="space-y-4">
          {/* Meta line */}
          <div className="accent-element flex items-center gap-4 text-[var(--text-base-60)]">
            <span className="font-mono text-xs uppercase tracking-[0.2em]">
              {skill.meta}
            </span>
            <span className="h-px w-16 ui-hairline" />
            <span className="text-xs">Since 2011</span>
          </div>

          {/* Title */}
          <div className="relative">
            <h2
              className="text-balance relative inline-block max-w-[10ch] text-[var(--type-display-xl)] font-[800] leading-[0.96] tracking-[var(--tracking-ultra-tight)] text-[var(--text-base)]"
              style={{
                padding: "0.3em 0.5em",
              }}
            >
              {skill.title}
            </h2>
          </div>
        </div>

        {/* Description */}
        <p className="description max-w-lg text-[clamp(1rem,1.3vw,1.2rem)] leading-relaxed text-[var(--text-base-80)]">
          {skill.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-3">
          {skill.tags?.map((tag) => (
            <span
              key={`${skill.id}-${tag}`}
              className="tag rounded-full border border-[var(--stroke-subtle)] bg-[var(--surface-3)] px-4 py-2 text-[13px] font-medium text-[var(--text-base-70)] shadow-[var(--shadow-elev-1)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--stroke-strong)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Right: Image */}
      {skill.media?.type === "image" && (
        <div className="skill-image relative aspect-[4/5] overflow-hidden rounded-[var(--radius-panel)] border border-[var(--stroke-subtle)] shadow-[var(--shadow-elev-2)]">
          <img
            src={skill.media.src}
            alt={skill.media.alt ?? skill.title}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute bottom-4 left-4 rounded bg-black/70 px-3 py-1 text-xs font-mono uppercase tracking-wider text-white/80">
            {skill.role}
          </div>
        </div>
      )}
    </div>
  );
}

// Pattern B: 左重心（黄金比）
function PatternB({ skill }: { skill: WorkItem }) {
  return (
    <div className="grid min-h-[50vh] items-center gap-6 md:min-h-[70vh] md:gap-12 md:grid-cols-[1fr,1.618fr]">
      {/* Left: Image */}
      {skill.media?.type === "image" && (
        <div className="skill-image relative aspect-[4/5] overflow-hidden rounded-[var(--radius-panel)] border border-[var(--stroke-subtle)] shadow-[var(--shadow-elev-2)]">
          <img
            src={skill.media.src}
            alt={skill.media.alt ?? skill.title}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute bottom-4 right-4 rounded bg-black/70 px-3 py-1 text-xs font-mono uppercase tracking-wider text-white/80">
            {skill.role}
          </div>
        </div>
      )}

      {/* Right: Content */}
      <div className="skill-content flex flex-col gap-8">
        <div className="space-y-4">
          {/* Meta line */}
          <div className="accent-element flex items-center justify-end gap-4 text-[var(--text-base-60)]">
            <span className="text-xs">Since 2011</span>
            <span className="h-px w-16 ui-hairline" />
            <span className="font-mono text-xs uppercase tracking-[0.2em]">
              {skill.meta}
            </span>
          </div>

          {/* Title */}
          <div className="relative text-right">
            <h2
              className="text-balance relative inline-block max-w-[10ch] text-[var(--type-display-xl)] font-[800] leading-[0.96] tracking-[var(--tracking-ultra-tight)] text-[var(--text-base)]"
              style={{
                padding: "0.3em 0.5em",
              }}
            >
              {skill.title}
            </h2>
          </div>
        </div>

        {/* Description */}
        <p className="description max-w-lg text-right text-[clamp(1rem,1.3vw,1.2rem)] leading-relaxed text-[var(--text-base-80)] md:ml-auto">
          {skill.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap justify-end gap-3">
          {skill.tags?.map((tag) => (
            <span
              key={`${skill.id}-${tag}`}
              className="tag rounded-full border border-[var(--stroke-subtle)] bg-[var(--surface-3)] px-4 py-2 text-[13px] font-medium text-[var(--text-base-70)] shadow-[var(--shadow-elev-1)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--stroke-strong)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Pattern C: 中央緊張
function PatternC({ skill }: { skill: WorkItem }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 md:min-h-[70vh] md:gap-12">
      {/* Title (Center) */}
      <div className="relative text-center">
        <h2
          className="text-balance relative inline-block max-w-[10ch] text-[var(--type-display-xl)] font-[800] leading-[0.96] tracking-[var(--tracking-ultra-tight)] text-[var(--text-base)]"
          style={{
            padding: "0.3em 0.6em",
          }}
        >
          {skill.title}
        </h2>
      </div>

      {/* Content Grid */}
      <div className="grid w-full max-w-5xl gap-6 md:gap-8 md:grid-cols-[1fr,1.618fr]">
        {/* Left: Image */}
        {skill.media?.type === "image" && (
          <div className="skill-image relative aspect-square overflow-hidden rounded-[var(--radius-panel)] border border-[var(--stroke-subtle)] shadow-[var(--shadow-elev-2)]">
            <img
              src={skill.media.src}
              alt={skill.media.alt ?? skill.title}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        )}

        {/* Right: Description + Tags */}
        <div className="skill-content flex flex-col justify-center gap-6">
          {/* Meta */}
          <div className="accent-element flex items-center gap-4 text-[var(--text-base-60)]">
            <span className="font-mono text-xs uppercase tracking-[0.2em]">
              {skill.meta}
            </span>
            <span className="h-px flex-1 ui-hairline" />
          </div>

          {/* Description */}
          <p className="description text-[clamp(1rem,1.3vw,1.2rem)] leading-relaxed text-[var(--text-base-80)]">
            {skill.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-3">
            {skill.tags?.map((tag) => (
              <span
                key={`${skill.id}-${tag}`}
                className="tag rounded-full border border-[var(--stroke-subtle)] bg-[var(--surface-3)] px-4 py-2 text-[13px] font-medium text-[var(--text-base-70)] shadow-[var(--shadow-elev-1)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--stroke-strong)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
