"use client";

import gsap from "gsap";
import { Link } from "@/i18n/navigation";
import { useCallback, useRef, type ReactNode } from "react";

interface MagneticButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
  strength?: number;
  "data-transition"?: string;
}

/**
 * MagneticButton - Award-worthy magnetic hover effect
 *
 * The button is attracted to the cursor position, creating
 * a fluid, organic interaction that feels premium and engaging.
 */
export function MagneticButton({
  href,
  children,
  className = "",
  strength = 0.4,
  ...props
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const boundingRef = useRef<DOMRect | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (!buttonRef.current) return;
    boundingRef.current = buttonRef.current.getBoundingClientRect();
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!buttonRef.current || !boundingRef.current) return;

      const { clientX, clientY } = e;
      const { left, top, width, height } = boundingRef.current;

      // Calculate center of button
      const centerX = left + width / 2;
      const centerY = top + height / 2;

      // Calculate distance from center
      const distX = clientX - centerX;
      const distY = clientY - centerY;

      // Apply magnetic effect
      gsap.to(buttonRef.current, {
        x: distX * strength,
        y: distY * strength,
        duration: 0.3,
        ease: "power2.out",
      });

      // Scale up slightly for feedback
      gsap.to(buttonRef.current, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out",
      });
    },
    [strength]
  );

  const handleMouseLeave = useCallback(() => {
    if (!buttonRef.current) return;

    // Reset position and scale
    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      scale: 1,
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
      className={`inline-block will-change-transform ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

export default MagneticButton;
