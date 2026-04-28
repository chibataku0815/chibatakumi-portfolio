"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";

interface AnimatedHeadingProps {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
  style?: CSSProperties;
  delay?: number;
}

/**
 * AnimatedHeading - Award-Worthy Text Animation
 *
 * Motion Design: 600ms、cubic-bezier(0.22, 1, 0.36, 1) - 自信ある登場
 * Simplified version without text splitting for better performance
 */
export function AnimatedHeading({
  children,
  as: Tag = "h1",
  className = "",
  style,
  delay = 0.4,
}: AnimatedHeadingProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!headingRef.current) return;

    const heading = headingRef.current;

    // Initial state
    gsap.set(heading, {
      opacity: 0,
      y: 24,
      filter: "blur(8px)",
    });

    // Animate to final state
    gsap.to(heading, {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.6, // Motion Design: 600ms
      ease: "cubic-bezier(0.22, 1, 0.36, 1)", // 自信ある登場
      delay,
      clearProps: "filter",
    });
  }, [delay]);

  return (
    <Tag ref={headingRef} className={className} style={style}>
      {children}
    </Tag>
  );
}

export default AnimatedHeading;
