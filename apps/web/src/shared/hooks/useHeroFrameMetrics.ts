"use client";

import { useEffect, useState, type RefObject } from "react";
import type { HeroMaskRect, HeroMaskSet } from "@/shared/types/hero-frame";

interface UseHeroFrameMetricsOptions {
  anchorRef: RefObject<HTMLElement | null>;
  maskRefs: Array<RefObject<HTMLElement | null>>;
  enabled?: boolean;
}

const EMPTY_MASK_SET: HeroMaskSet = {
  maskRects: [],
  anchorRect: null,
  interactionEnabled: false,
  coarsePointer: false,
};

function toViewportRect(element: HTMLElement): HeroMaskRect {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left / window.innerWidth,
    y: 1 - rect.bottom / window.innerHeight,
    width: rect.width / window.innerWidth,
    height: rect.height / window.innerHeight,
  };
}

export function useHeroFrameMetrics({
  anchorRef,
  maskRefs,
  enabled = true,
}: UseHeroFrameMetricsOptions): HeroMaskSet {
  const [maskSet, setMaskSet] = useState<HeroMaskSet>(EMPTY_MASK_SET);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let frameId = 0;
    const pointerFineQuery = window.matchMedia("(pointer: fine)");
    const pointerCoarseQuery = window.matchMedia("(pointer: coarse)");

    const measure = () => {
      frameId = 0;
      const maskRects = maskRefs.flatMap((ref) =>
        ref.current ? [toViewportRect(ref.current)] : []
      );
      const anchorRect = anchorRef.current ? toViewportRect(anchorRef.current) : null;

      setMaskSet({
        maskRects,
        anchorRect,
        interactionEnabled: pointerFineQuery.matches && !pointerCoarseQuery.matches,
        coarsePointer: pointerCoarseQuery.matches,
      });
    };

    const scheduleMeasure = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      frameId = requestAnimationFrame(measure);
    };

    const resizeObserver = new ResizeObserver(() => {
      scheduleMeasure();
    });

    for (const ref of [anchorRef, ...maskRefs]) {
      if (ref.current) {
        resizeObserver.observe(ref.current);
      }
    }

    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("scroll", scheduleMeasure, { passive: true });
    pointerFineQuery.addEventListener("change", scheduleMeasure);
    pointerCoarseQuery.addEventListener("change", scheduleMeasure);

    scheduleMeasure();
    document.fonts?.ready.then(() => {
      scheduleMeasure();
    });

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("scroll", scheduleMeasure);
      pointerFineQuery.removeEventListener("change", scheduleMeasure);
      pointerCoarseQuery.removeEventListener("change", scheduleMeasure);
    };
  }, [anchorRef, enabled, maskRefs]);

  return enabled ? maskSet : EMPTY_MASK_SET;
}

export default useHeroFrameMetrics;
