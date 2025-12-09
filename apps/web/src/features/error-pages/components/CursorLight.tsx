"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * CursorLight - Award-Worthy 404 Experience
 *
 * Art Direction: "迷い込んだ暗闇の中で、微かな光が道を示す"
 * Motion Design: 600ms、power2.out（優雅な追従）
 *
 * Excellence Framework Level 5:
 * - カーソルライトが「希望」「道標」のメタファー
 * - 他の404ページにはない独自性
 * - Pitch Black & Fire の世界観維持
 */
export function CursorLight() {
  const lightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lightRef.current) return;

    const light = lightRef.current;

    // Initialize position at center
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    gsap.set(light, { x: centerX, y: centerY });

    const handlePointerMove = (e: PointerEvent) => {
      gsap.to(light, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.6, // Motion Design: 600ms
        ease: "power2.out",
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return (
    <div
      ref={lightRef}
      className="pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 z-0"
      style={{
        width: "min(800px, 80vw)",
        height: "min(800px, 80vw)",
        background:
          "radial-gradient(circle, rgba(255, 191, 73, 0.18) 0%, rgba(255, 191, 73, 0.08) 30%, transparent 70%)",
        filter: "blur(80px)",
        mixBlendMode: "screen",
      }}
      aria-hidden="true"
    />
  );
}

export default CursorLight;
