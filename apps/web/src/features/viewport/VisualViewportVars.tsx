"use client";

import { useEffect } from "react";

const ROOT_VARS = [
  "--vvh",
  "--vvw",
  "--vv-offset-top",
  "--vv-offset-left",
] as const;

export function VisualViewportVars(): null {
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;

    const write = () => {
      raf = 0;
      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const width = viewport?.width ?? window.innerWidth;
      const offsetTop = viewport?.offsetTop ?? 0;
      const offsetLeft = viewport?.offsetLeft ?? 0;

      root.style.setProperty("--vvh", `${height}px`);
      root.style.setProperty("--vvw", `${width}px`);
      root.style.setProperty("--vv-offset-top", `${offsetTop}px`);
      root.style.setProperty("--vv-offset-left", `${offsetLeft}px`);
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
