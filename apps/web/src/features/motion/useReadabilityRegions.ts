/**
 * useReadabilityRegions
 * ---------------------
 * Observes `[data-readability]` sections via IntersectionObserver, picks the
 * visible-area-weighted dominant section, and lerps a scalar in [0, 1] toward
 * the matching CSS-defined target. The smoothed scalar is published to:
 *   1) `document.documentElement.style["--motion-dot-readability"]` (CSS consumers)
 *   2) a module-level ref consumed by `LiquidGlassProvider` via `getReadability()`
 *
 * Stream A (LiquidGlassProvider) reads `getReadability()` every frame.
 */

import { useEffect } from "react";

// Module-level singleton state — survives Strict Mode double mount.
let currentReadability = 1;
let targetReadability = 1;
let mounted = false;
let observer: IntersectionObserver | null = null;
let mutationObserver: MutationObserver | null = null;
let rafId: number | null = null;
let observed: Set<Element> = new Set();
let prefersReducedMotion = false;

const FALLBACK: { focus: number; reading: number; immersive: number } = {
  focus: 0.55,
  reading: 0.35,
  immersive: 1,
};
let targets = { ...FALLBACK };

export function getReadability(): number {
  return Number.isFinite(currentReadability) ? currentReadability : 1;
}

function readTargets(): void {
  const cs = getComputedStyle(document.documentElement);
  const parse = (name: string, fallback: number): number => {
    const raw = cs.getPropertyValue(name).trim();
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : fallback;
  };
  targets = {
    focus: parse("--motion-dot-readability-focus", FALLBACK.focus),
    reading: parse("--motion-dot-readability-reading", FALLBACK.reading),
    immersive: parse("--motion-dot-readability-default", FALLBACK.immersive),
  };
}

function mapValue(attr: string | null): number {
  if (attr === "focus") return targets.focus;
  if (attr === "reading") return targets.reading;
  if (attr === "immersive") return targets.immersive;
  return 1;
}

function recomputeDominant(): void {
  let bestScore = 0;
  let bestEl: Element | null = null;
  for (const el of observed) {
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 0;
    if (rect.bottom <= 0 || rect.top >= vh || vh === 0) continue;
    const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
    const score = visible; // visible-area-weighted (height already factored in)
    if (score > bestScore) {
      bestScore = score;
      bestEl = el;
    }
  }
  if (!bestEl) {
    targetReadability = 1;
    return;
  }
  targetReadability = mapValue(bestEl.getAttribute("data-readability")) || 1;
}

function refreshObserved(): void {
  if (!observer) return;
  observer.disconnect();
  observed = new Set(document.querySelectorAll("[data-readability]"));
  for (const el of observed) observer.observe(el);
  recomputeDominant();
}

function tick(): void {
  if (prefersReducedMotion) {
    currentReadability = targetReadability;
  } else {
    currentReadability += (targetReadability - currentReadability) * 0.12;
    if (Math.abs(targetReadability - currentReadability) < 0.001) {
      currentReadability = targetReadability;
    }
  }
  document.documentElement.style.setProperty(
    "--motion-dot-readability",
    String(currentReadability),
  );
  rafId = requestAnimationFrame(tick);
}

function initObservers(): void {
  readTargets();
  prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  observer = new IntersectionObserver(() => recomputeDominant(), {
    threshold: [0, 0.25, 0.5, 0.75, 1],
  });
  observed = new Set(document.querySelectorAll("[data-readability]"));
  for (const el of observed) observer.observe(el);
  mutationObserver = new MutationObserver(refreshObserved);
  mutationObserver.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-readability"],
  });
  recomputeDominant();
  rafId = requestAnimationFrame(tick);
}

function teardownObservers(): void {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
  observer?.disconnect();
  observer = null;
  mutationObserver?.disconnect();
  mutationObserver = null;
  observed = new Set();
}

export function useReadabilityRegions(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mounted) return;
    mounted = true;
    initObservers();
    return () => {
      mounted = false;
      teardownObservers();
    };
  }, []);
}
