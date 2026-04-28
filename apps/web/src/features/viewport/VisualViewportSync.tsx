"use client";

import { useEffect } from "react";

const ROOT_STYLE_KEYS = [
  "--vvh",
  "--vvw",
  "--vv-offset-top",
  "--vv-offset-left",
] as const;

function setRootViewportVars(): void {
  const root = document.documentElement;
  const viewport = window.visualViewport;
  const height = viewport?.height ?? window.innerHeight;
  const width = viewport?.width ?? window.innerWidth;
  const offsetTop = viewport?.offsetTop ?? 0;
  const offsetLeft = viewport?.offsetLeft ?? 0;

  root.style.setProperty("--vvh", `${Math.round(height * 100) / 100}px`);
  root.style.setProperty("--vvw", `${Math.round(width * 100) / 100}px`);
  root.style.setProperty("--vv-offset-top", `${Math.round(offsetTop * 100) / 100}px`);
  root.style.setProperty("--vv-offset-left", `${Math.round(offsetLeft * 100) / 100}px`);
}

export function VisualViewportSync(): null {
  useEffect(() => {
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(setRootViewportVars);
    };

    setRootViewportVars();
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("orientationchange", schedule, { passive: true });
    window.visualViewport?.addEventListener("resize", schedule, { passive: true });
    window.visualViewport?.addEventListener("scroll", schedule, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
      const root = document.documentElement;
      for (const key of ROOT_STYLE_KEYS) {
        root.style.removeProperty(key);
      }
    };
  }, []);

  return null;
}
