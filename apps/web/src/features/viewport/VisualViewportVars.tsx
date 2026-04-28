"use client";

import { useEffect } from "react";

const ROOT_VARS = [
  "--vvh",
  "--vvw",
  "--vv-offset-top",
  "--vv-offset-left",
] as const;

function roundViewportPx(value: number): number {
  return Math.round(value);
}

export function VisualViewportVars(): null {
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;
    const lastValues = new Map<(typeof ROOT_VARS)[number], string>();

    const write = () => {
      raf = 0;
      const viewport = window.visualViewport;
      const nextValues: Record<(typeof ROOT_VARS)[number], string> = {
        "--vvh": `${roundViewportPx(viewport?.height ?? window.innerHeight)}px`,
        "--vvw": `${roundViewportPx(viewport?.width ?? window.innerWidth)}px`,
        "--vv-offset-top": `${roundViewportPx(viewport?.offsetTop ?? 0)}px`,
        "--vv-offset-left": `${roundViewportPx(viewport?.offsetLeft ?? 0)}px`,
      };

      for (const name of ROOT_VARS) {
        const nextValue = nextValues[name];
        if (lastValues.get(name) === nextValue) continue;
        root.style.setProperty(name, nextValue);
        lastValues.set(name, nextValue);
      }
    };

    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(write);
    };

    write();

    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", schedule, { passive: true });
    viewport?.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("orientationchange", schedule);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      for (const name of ROOT_VARS) {
        root.style.removeProperty(name);
      }
    };
  }, []);

  return null;
}
