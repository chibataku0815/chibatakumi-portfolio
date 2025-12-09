"use client";

import gsap from "gsap";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

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
    <>
      {/* Global CSS for animations */}
      <style>{`
        @keyframes glowButtonRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes glowButtonRotateReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes glowButtonPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.03); }
        }
        @keyframes glowButtonShimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>

      <div className="relative" style={{ padding: "40px" }}>
        <Link
          ref={buttonRef}
          href={href}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`group relative inline-flex items-center gap-2 will-change-transform ${className}`}
          {...props}
        >
        {/* Orbiting text ring - constantly rotating */}
        <span
          className="pointer-events-none absolute"
          style={{
            width: "180px",
            height: "180px",
            left: "50%",
            top: "50%",
            marginLeft: "-90px",
            marginTop: "-90px",
            animation: "glowButtonRotateReverse 15s linear infinite",
          }}
        >
          <svg
            viewBox="0 0 180 180"
            className="h-full w-full"
          >
            <defs>
              <path
                id="glowButtonTextPath"
                d="M 90, 90 m -70, 0 a 70,70 0 1,1 140,0 a 70,70 0 1,1 -140,0"
                fill="none"
              />
            </defs>
            <text
              fill="rgba(255, 255, 255, 0.5)"
              fontSize="10"
              fontFamily="var(--font-geist-sans), system-ui, sans-serif"
              letterSpacing="0.15em"
            >
              <textPath href="#glowButtonTextPath" startOffset="0%">
                {orbitText}
              </textPath>
            </text>
          </svg>
        </span>

        {/* Constant breathing pulse glow - always visible, always animating */}
        <span
          className="pointer-events-none absolute inset-[-8px] rounded-full"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(245, 158, 11, 0.25) 0%, transparent 70%)",
            animation: "glowButtonPulse 2.5s ease-in-out infinite",
          }}
        />

        {/* Animated border container */}
        <span className="absolute inset-0 rounded-full overflow-hidden">
          {/* Flowing light effect - rotating gradient (ALWAYS RUNNING) */}
          <span
            className="absolute inset-[-2px] rounded-full"
            style={{
              background: `conic-gradient(
                from 0deg,
                transparent 0%,
                transparent 15%,
                rgba(245, 158, 11, 0.4) 20%,
                rgba(245, 158, 11, 1) 25%,
                rgba(245, 158, 11, 0.4) 30%,
                transparent 35%,
                transparent 100%
              )`,
              opacity: isHovered ? 1 : 0.7,
              animation: "glowButtonRotate 3s linear infinite",
              transition: "opacity 0.3s ease",
            }}
          />
          {/* Inner mask to create border effect */}
          <span className="absolute inset-[1.5px] rounded-full bg-[var(--bg-dark)]" />
        </span>

        {/* Shimmer effect on border - constant subtle animation */}
        <span
          className="pointer-events-none absolute inset-0 rounded-full border border-[var(--accent-amber1)]"
          style={{
            animation: "glowButtonShimmer 2s ease-in-out infinite",
          }}
        />

        {/* Enhanced glow effect on hover */}
        <span
          className="pointer-events-none absolute inset-[-4px] rounded-full transition-opacity duration-300"
          style={{
            boxShadow:
              "0 0 25px rgba(245, 158, 11, 0.4), 0 0 50px rgba(245, 158, 11, 0.2)",
            opacity: isHovered ? 1 : 0,
          }}
        />

        {/* Button content */}
        <span className="relative z-10 flex items-center gap-2 px-6 py-3">
          {children}
        </span>
        </Link>
      </div>
    </>
  );
}

export default GlowButton;
