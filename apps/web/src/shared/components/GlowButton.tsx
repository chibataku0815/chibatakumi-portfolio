"use client";

import gsap from "gsap";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * GlowButton - Level 5 CTA with flowing light effect
 *
 * Features:
 * - Subtle flowing light along the border (GSAP-animated rotation)
 * - Magnetic hover effect
 * - Breathing glow animation
 * - Pitch Black & Fire aesthetic
 */

interface GlowButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  "data-transition"?: string;
}

export function GlowButton({
  href,
  children,
  className = "",
  ...props
}: GlowButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);
  const boundingRef = useRef<DOMRect | null>(null);
  const rotationRef = useRef<gsap.core.Tween | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Initialize rotation animation
  useEffect(() => {
    if (!glowRef.current) return;

    // Continuous rotation animation
    rotationRef.current = gsap.to(glowRef.current, {
      rotation: 360,
      duration: 4,
      repeat: -1,
      ease: "none",
    });

    return () => {
      rotationRef.current?.kill();
    };
  }, []);

  // Magnetic hover effect
  const handleMouseEnter = useCallback(() => {
    if (!buttonRef.current) return;
    boundingRef.current = buttonRef.current.getBoundingClientRect();
    setIsHovered(true);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!buttonRef.current || !boundingRef.current) return;

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
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!buttonRef.current) return;
    setIsHovered(false);

    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.3)",
    });
  }, []);

  return (
    <Link
      ref={buttonRef}
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative inline-flex items-center gap-2 will-change-transform ${className}`}
      {...props}
    >
      {/* Animated border container */}
      <span className="absolute inset-0 rounded-full overflow-hidden">
        {/* Flowing light effect - rotating gradient */}
        <span
          ref={glowRef}
          className={`absolute inset-[-2px] rounded-full transition-opacity duration-500 ${
            isHovered ? "opacity-80" : "opacity-40"
          }`}
          style={{
            background: `conic-gradient(
              from 0deg,
              transparent 0%,
              transparent 25%,
              rgba(245, 158, 11, 0.6) 30%,
              rgba(245, 158, 11, 0.8) 35%,
              rgba(245, 158, 11, 0.6) 40%,
              transparent 45%,
              transparent 100%
            )`,
          }}
        />
        {/* Inner mask to create border effect */}
        <span className="absolute inset-[1px] rounded-full bg-[var(--bg-dark)]" />
      </span>

      {/* Subtle static border */}
      <span
        className={`absolute inset-0 rounded-full border transition-all duration-300 ${
          isHovered
            ? "border-[var(--accent-amber1)]/40"
            : "border-[var(--text-base-20)]"
        }`}
      />

      {/* Glow effect on hover */}
      <span
        className={`absolute inset-0 rounded-full transition-all duration-500 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
        style={{
          boxShadow:
            "0 0 20px rgba(245, 158, 11, 0.2), 0 0 40px rgba(245, 158, 11, 0.1)",
        }}
      />

      {/* Button content */}
      <span className="relative z-10 flex items-center gap-2 px-6 py-3">
        {children}
      </span>
    </Link>
  );
}

export default GlowButton;
