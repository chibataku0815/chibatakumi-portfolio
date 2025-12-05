"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { splitText } from "@/shared/utils/splitText";

interface AnimatedHeadingProps {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
  delay?: number;
  splitType?: "chars" | "words";
}

/**
 * Client component for animated headings using splitText
 * Use this to wrap headings in server components to enable GSAP animations
 */
export function AnimatedHeading({
  children,
  as: Tag = "h1",
  className = "",
  delay = 0.3,
  splitType = "chars",
}: AnimatedHeadingProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!headingRef.current) return;

    const ctx = gsap.context(() => {
      document.fonts.ready.then(() => {
        if (!headingRef.current) return;

        const split = splitText(headingRef.current, splitType);
        const elements = splitType === "chars" ? split.chars : split.words;

        gsap.set(elements, {
          opacity: 0,
          y: 16,
          filter: "blur(4px)",
        });

        gsap.to(elements, {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.6,
          stagger: splitType === "chars" ? 0.03 : 0.05,
          ease: "power2.out",
          delay,
          clearProps: "filter",
        });

        return () => {
          split.revert();
        };
      });
    });

    return () => ctx.revert();
  }, [delay, splitType]);

  return (
    <Tag ref={headingRef} className={className}>
      {children}
    </Tag>
  );
}

export default AnimatedHeading;
