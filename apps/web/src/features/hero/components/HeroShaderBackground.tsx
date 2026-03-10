"use client";

import { heroShaderConfig } from "../shader/config";

const cfg = heroShaderConfig;

export function HeroShaderBackground() {
  return (
    <div
      className="hero-shader-bg fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      style={{ background: cfg.fallbackColor }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(255,171,77,0.16),transparent_22%),radial-gradient(circle_at_24%_72%,rgba(114,164,255,0.08),transparent_26%),linear-gradient(140deg,rgba(8,8,10,0.96),rgba(14,14,16,0.84)_48%,rgba(28,18,12,0.82))]" />
      <div className="absolute inset-0 opacity-[0.08] mix-blend-screen [background-image:var(--noise-texture)]" />
      <div className="absolute inset-x-[10%] top-[18%] h-px bg-[var(--hairline-gradient)] opacity-40" />
      <div className="absolute bottom-[14%] right-[10%] h-[28%] w-px bg-[linear-gradient(180deg,transparent,var(--frame-line-secondary),transparent)] opacity-30" />
    </div>
  );
}

export default HeroShaderBackground;
