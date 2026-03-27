/**
 * scroll-progress --- GSAP ScrollTrigger wrapper
 *
 * Native scroll + ScrollTrigger scrub for smooth tracking.
 * Returns progress (0-1) via callback.
 *
 * Copied from 02-atmos/src/utils/scroll-progress.ts (no modifications needed).
 *
 * ### Why scrub: 1 for product viewer
 * - Product viewers need slightly tighter response than atmospheric scenes
 * - 02-atmos uses 1.5 for "floating" feel; product viewer uses 1.0 for precision
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface ScrollProgressOptions {
  /** Scroll target trigger element (CSS selector or element) */
  trigger: string | Element;
  /** Scrub delay (seconds). Larger = smoother but slower */
  scrub?: number;
  /** Callback on progress update */
  onUpdate: (progress: number) => void;
}

/**
 * Set up ScrollTrigger and return scroll progress
 *
 * @returns ScrollTrigger instance (for dispose)
 */
export function setupScrollProgress(
  options: ScrollProgressOptions,
): ScrollTrigger {
  const { trigger, scrub = 1, onUpdate } = options;

  const st = ScrollTrigger.create({
    trigger,
    start: "top top",
    end: "bottom bottom",
    scrub,
    onUpdate: (self) => {
      onUpdate(self.progress);
    },
  });

  return st;
}

/** Clean up all ScrollTrigger instances */
export function killAllScrollTriggers(): void {
  ScrollTrigger.getAll().forEach((st) => st.kill());
}
