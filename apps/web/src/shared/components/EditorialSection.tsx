"use client";

import { type ReactNode } from "react";
import { LiquidGlassSurface } from "@/features/liquid-glass/LiquidGlassProvider";

/** Visual tone — affects typography utilities. */
export type EditorialSectionTone = "hero" | "form" | "prose";

/** IntersectionObserver attribute — controls motion-dot dim during scroll. */
export type EditorialSectionReadability = "focus" | "reading" | "immersive";

export interface EditorialSectionProps {
  /** Anchor id for the section element. */
  id: string;
  /** Set true for hero/feature cards to use WebGPU Liquid Glass material. */
  glass?: boolean;
  /** IntersectionObserver attribute — controls motion-dot dim during scroll. */
  readability?: EditorialSectionReadability;
  /** Visual tone — affects typography utilities. */
  tone?: EditorialSectionTone;
  /** Forwarded to LiquidGlassSurface intensity (0..1). */
  intensity?: number;
  /** Additional class names appended to the outer section. */
  className?: string;
  /** Section body content. */
  children: ReactNode;
}

function joinClass(...parts: ReadonlyArray<string | undefined | false>): string {
  return parts.filter((p): p is string => Boolean(p)).join(" ");
}

export function EditorialSection({
  id,
  glass,
  readability,
  tone,
  intensity,
  className,
  children,
}: EditorialSectionProps): React.ReactElement {
  const sectionClass = joinClass(
    tone === "prose" ? "editorial-prose" : undefined,
    className,
  );

  return (
    <section
      id={id}
      data-readability={readability ?? "focus"}
      className={sectionClass || undefined}
    >
      {glass ? (
        <LiquidGlassSurface
          surfaceId={`editorial.${id}`}
          kind="panel"
          intensity={intensity ?? 0.72}
        >
          {children}
        </LiquidGlassSurface>
      ) : (
        <div className="editorial-surface-flat">{children}</div>
      )}
    </section>
  );
}
