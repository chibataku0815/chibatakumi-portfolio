"use client";

import { Link } from "@/i18n/navigation";
import type { ProfilePageContent, ProfileTechCategory } from "@/shared/data/portfolio";
import { AnimatedHeading } from "@/shared/components";
import {
  FluidGradientBackground,
  fluidConfigMonochrome,
} from "@/features/fluid-gradient";
import { ReactNode, useCallback, useState } from "react";

const BASE_BG = "#0b0b0b";

function getCanHover() {
  return typeof window === "undefined"
    ? true
    : window.matchMedia("(pointer: fine)").matches;
}

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

export function ProfileIntro({ header }: { header: ProfilePageContent["header"] }) {
  return (
    <section className="relative z-10 flex min-h-[40vh] items-end px-4 pb-12 sm:min-h-[50vh] sm:px-6 sm:pb-16 md:min-h-[60vh] md:px-10 md:pb-20">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-6 md:gap-8 md:grid-cols-[1.2fr,1fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full border border-[var(--stroke-subtle)] bg-[var(--surface-2)] px-4 py-2 text-[11px] font-mono uppercase tracking-[0.24em] text-[var(--text-base-50)] shadow-[var(--shadow-elev-1)]">
              Profile
            </div>
            <AnimatedHeading
              as="h1"
              className="mb-4 max-w-[4.5ch] text-[clamp(2.2rem,4.4vw,4.25rem)] font-medium leading-[0.94] tracking-[var(--tracking-tight)] text-[var(--text-base)]"
            >
              {header.title}
            </AnimatedHeading>
          </div>
          <div className="flex items-end">
            <p className="max-w-md text-[clamp(1rem,1.4vw,1.3rem)] leading-relaxed text-[var(--text-base-70)]">
              {header.subtitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProfileSectionLead({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative z-10 px-6 pb-10 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-base-40)]">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-[clamp(1.8rem,4vw,2.8rem)] font-semibold tracking-[-0.02em] text-[var(--text-base)]">
          {title}
        </h2>
        <p className="mt-3 max-w-3xl text-[clamp(0.95rem,1.2vw,1.05rem)] leading-relaxed text-[var(--text-base-60)]">
          {description}
        </p>
      </div>
    </div>
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

  const [canHover] = useState(getCanHover);

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

  const [canHover] = useState(getCanHover);

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
  return (
    <main className="relative min-h-screen overflow-x-hidden pt-[calc(var(--nav-height)+1.5rem)] text-[var(--text-base)] sm:pt-[calc(var(--nav-height)+1.75rem)]">
      {children}
    </main>
  );
}

export function TechStackSection({
  categories,
}: {
  categories: ProfileTechCategory[];
}) {
  return (
    <section className="relative z-10 px-4 py-8 sm:px-6 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
        {categories.map((category) => (
          <article
            key={category.category}
            className="rounded-[var(--radius-panel)] border border-[var(--stroke-subtle)] bg-[var(--surface-2)] p-5 shadow-[var(--shadow-elev-2)] sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between gap-4 border-b border-[var(--stroke-subtle)] pb-4">
              <h3 className="text-lg font-semibold text-[var(--text-base)]">
                {category.category}
              </h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-base-40)]">
                {String(category.items.length).padStart(2, "0")} items
              </span>
            </div>

            <ul className="space-y-3">
              {category.items.map((item) => (
                <li
                  key={`${category.category}-${item.name}`}
                  className="flex items-start justify-between gap-4 border-b border-[var(--stroke-subtle)]/60 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-base)]">{item.name}</p>
                    {item.context ? (
                      <p className="mt-1 text-xs leading-relaxed text-[var(--text-base-50)]">
                        {item.context}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em] ${
                      item.level === "primary"
                        ? "border-[var(--stroke-strong)] bg-[var(--surface-1)] text-[var(--text-base)]"
                        : "border-[var(--stroke-subtle)] bg-[var(--surface-3)] text-[var(--text-base-50)]"
                    }`}
                  >
                    {item.level}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ProfileCtaSection({
  cta,
}: {
  cta: ProfilePageContent["cta"];
}) {
  return (
    <section className="relative z-10 px-4 py-8 sm:px-6 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 rounded-[var(--radius-panel)] border border-[var(--stroke-strong)] bg-[var(--surface-1)] p-6 shadow-[var(--shadow-elev-2)] md:grid-cols-[1.4fr,1fr] md:p-8">
        <div className="space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-base-40)]">
            Contact
          </p>
          <h2 className="text-balance max-w-[14ch] text-[clamp(1.8rem,4vw,3rem)] font-semibold leading-[1.02] tracking-[var(--tracking-tight)] text-[var(--text-base)]">
            {cta.headline}
          </h2>
          <p className="max-w-xl whitespace-pre-line text-[clamp(1rem,1.2vw,1.1rem)] leading-relaxed text-[var(--text-base-70)]">
            {cta.subtext}
          </p>
        </div>

        <div className="flex items-center justify-start md:justify-end">
          <Link
            href="/contact"
            data-transition="true"
            className="inline-flex min-w-[13rem] items-center justify-between rounded-full border border-[var(--stroke-strong)] bg-[var(--surface-2)] px-5 py-4 text-[var(--text-base)] shadow-[var(--shadow-elev-1)] transition-transform duration-200 hover:-translate-y-1"
          >
            <span className="text-base font-medium">{cta.buttonLabel}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-base-40)]">
              /contact
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
