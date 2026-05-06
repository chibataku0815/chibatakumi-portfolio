"use client";

import gsap from "gsap";
import { Link } from "@/i18n/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * GlowButton - Level 5 CTA with constantly animated flowing light effect
 *
 * Features:
 * - Orbiting text ring around the button
 * - Constantly flowing light along the border (CSS animation - always running)
 * - Breathing pulse animation (always visible)
 * - Magnetic hover effect
 * - Pitch Black & Fire aesthetic
 */

interface GlowButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  "data-transition"?: string;
  orbitText?: string;
}

export function GlowButton({
  href,
  children,
  className = "",
  orbitText = "EXPLORE • DISCOVER • CREATE • INSPIRE • ",
  ...props
}: GlowButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const boundingRef = useRef<DOMRect | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [canHover, setCanHover] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia("(pointer: fine)").matches
  );

  useEffect(() => {
    const pointerFineQuery = window.matchMedia("(pointer: fine)");
    const updateCanHover = () => setCanHover(pointerFineQuery.matches);
    pointerFineQuery.addEventListener("change", updateCanHover);
    return () => {
      pointerFineQuery.removeEventListener("change", updateCanHover);
    };
  }, []);

  // Magnetic hover effect
  const handleMouseEnter = useCallback(() => {
    if (!canHover || !buttonRef.current) return;
    if (!buttonRef.current) return;
    boundingRef.current = buttonRef.current.getBoundingClientRect();
    setIsHovered(true);
  }, [canHover]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canHover || !buttonRef.current || !boundingRef.current) return;

    const { clientX, clientY } = e;
    const { left, top, width, height } = boundingRef.current;

    const centerX = left + width / 2;
    const centerY = top + height / 2;

    const distX = clientX - centerX;
    const distY = clientY - centerY;

    gsap.to(buttonRef.current, {
      x: distX * 0.25,
      y: distY * 0.25,
      duration: 0.3,
      ease: "power2.out",
    });
  }, [canHover]);

  const handleMouseLeave = useCallback(() => {
    if (!canHover || !buttonRef.current) return;
    if (!buttonRef.current) return;
    setIsHovered(false);

    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.3)",
    });
  }, [canHover]);

  return (
    <>
      {/* Global CSS for animations */}
      <style>{`
        @keyframes glowButtonPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(1.02); }
        }
        @keyframes glowButtonLine {
          0%, 100% { opacity: 0.35; transform: scaleX(0.6); }
          50% { opacity: 0.8; transform: scaleX(1); }
        }
      `}</style>

      <div className="relative px-4 py-5 sm:px-6 sm:py-8">
        <Link
          ref={buttonRef}
          href={href}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`group relative inline-flex items-center gap-2 overflow-hidden rounded-[var(--radius-pill)] border border-[var(--stroke-heat)] bg-[var(--surface-1)] text-left will-change-transform ${className}`}
          {...props}
        >
          <span
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: "var(--shadow-elev-2)",
            }}
          />
          <span
            className="pointer-events-none absolute inset-x-5 top-0 h-px"
            style={{
              background: "var(--section-divider-strong)",
              animation: "glowButtonLine 2.8s ease-in-out infinite",
            }}
          />
          <span
            className="pointer-events-none absolute inset-[-10px] rounded-full"
            style={{
              background:
                "radial-gradient(circle at center, color-mix(in srgb, var(--accent-amber1) 18%, transparent) 0%, transparent 70%)",
              animation: "glowButtonPulse 2.8s ease-in-out infinite",
              opacity: canHover && isHovered ? 0.9 : 0.55,
              transition: "opacity 0.25s ease",
            }}
          />
          <span className="pointer-events-none absolute inset-[1px] rounded-[var(--radius-pill)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--slate-2)_92%,transparent),color-mix(in_srgb,var(--slate-1)_82%,transparent))]" />

          <span className="relative z-10 flex items-center gap-2 px-6 py-3.5 sm:px-7">
            <span className="hidden pr-2 font-mono text-[9px] uppercase tracking-[0.26em] text-[var(--text-base-40)] sm:inline-block">
              {orbitText.slice(0, 12)}
            </span>
            <span className="text-balance">{children}</span>
          </span>
        </Link>
      </div>
    </>
  );
}

export default GlowButton;
