"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import gsap from "gsap";
import Logo from "./Logo";

interface PageTransitionProps {
  children: React.ReactNode;
}

const BLOCK_COUNT = 20;

export function PageTransition({ children }: PageTransitionProps) {
  const router = useRouter();
  const pathname = usePathname();

  const overlayRef = useRef<HTMLDivElement>(null);
  const logoOverlayRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<SVGSVGElement>(null);
  const blocksRef = useRef<HTMLDivElement[]>([]);
  const isTransitioning = useRef(false);
  const pathLengthRef = useRef(0);
  const revealTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Anchor click handler - only intercept links with data-transition attribute
  const onAnchorClick = useCallback(
    (e: MouseEvent) => {
      if (isTransitioning.current) {
        e.preventDefault();
        return;
      }

      const target = e.currentTarget as HTMLAnchorElement;

      // Allow modifier keys and external links
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey ||
        e.button !== 0 ||
        target.target === "_blank"
      ) {
        return;
      }

      const href = target.href;
      const url = new URL(href);

      // Only intercept same-origin internal links
      if (url.origin !== window.location.origin) return;

      const targetPath = url.pathname;
      if (targetPath !== pathname) {
        e.preventDefault();
        handleRouteChange(targetPath);
      }
    },
    [pathname]
  );

  const handleRouteChange = useCallback((url: string) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    coverPage(url);
  }, []);

  const coverPage = (url: string) => {
    if (overlayRef.current) {
      overlayRef.current.style.pointerEvents = "auto";
    }
    if (logoOverlayRef.current) {
      logoOverlayRef.current.style.pointerEvents = "auto";
    }

    const tl = gsap.timeline({
      onComplete: () => router.push(url),
    });

    // Stage 1: Blocks cover (scaleX 0 -> 1, left origin)
    tl.to(blocksRef.current, {
      scaleX: 1,
      duration: 0.4,
      stagger: 0.02,
      ease: "power2.out",
      transformOrigin: "left",
    });

    // Stage 2: Logo overlay fade in
    tl.set(logoOverlayRef.current, { opacity: 1 }, "-=0.2");

    // Stage 3: Logo stroke draw
    const path = logoRef.current?.querySelector("path");
    if (path) {
      tl.set(
        path,
        {
          strokeDashoffset: pathLengthRef.current,
          fill: "transparent",
        },
        "-=0.25"
      );

      tl.to(
        path,
        {
          strokeDashoffset: 0,
          duration: 1.2,
          ease: "power2.inOut",
        },
        "-=0.3"
      );

      // Stage 4: Fill transition
      tl.to(
        path,
        {
          fill: "var(--logo-fill)",
          duration: 0.5,
          ease: "power2.out",
        },
        "-=0.3"
      );
    }

    // Stage 5: Logo fade out
    tl.to(logoOverlayRef.current, {
      opacity: 0,
      duration: 0.25,
      ease: "power2.out",
    });
  };

  const revealPage = useCallback(() => {
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
    }

    // Reset blocks to covered state with right origin for reveal
    gsap.set(blocksRef.current, { scaleX: 1, transformOrigin: "right" });

    // Animate blocks reveal (scaleX 1 -> 0, right origin)
    gsap.to(blocksRef.current, {
      scaleX: 0,
      duration: 0.4,
      stagger: 0.02,
      ease: "power2.out",
      transformOrigin: "right",
      onComplete: () => {
        isTransitioning.current = false;
        if (overlayRef.current) {
          overlayRef.current.style.pointerEvents = "none";
        }
        if (logoOverlayRef.current) {
          logoOverlayRef.current.style.pointerEvents = "none";
        }
      },
    });

    // Safety timeout
    revealTimeoutRef.current = setTimeout(() => {
      if (blocksRef.current.length > 0) {
        const firstBlock = blocksRef.current[0];
        const scaleX = firstBlock
          ? Number(gsap.getProperty(firstBlock, "scaleX"))
          : 0;
        if (firstBlock && scaleX > 0) {
          gsap.to(blocksRef.current, {
            scaleX: 0,
            duration: 0.2,
            ease: "power2.out",
            transformOrigin: "right",
            onComplete: () => {
              isTransitioning.current = false;
              if (overlayRef.current) {
                overlayRef.current.style.pointerEvents = "none";
              }
              if (logoOverlayRef.current) {
                logoOverlayRef.current.style.pointerEvents = "none";
              }
            },
          });
        }
      }
    }, 1000);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Create blocks dynamically
      if (!overlayRef.current) return;
      overlayRef.current.innerHTML = "";
      blocksRef.current = [];

      for (let i = 0; i < BLOCK_COUNT; i++) {
        const block = document.createElement("div");
        block.className = "transition-block";
        overlayRef.current.appendChild(block);
        blocksRef.current.push(block);
      }

      // Initialize blocks (hidden)
      gsap.set(blocksRef.current, { scaleX: 0, transformOrigin: "left" });

      // Initialize logo stroke
      if (logoRef.current) {
        const path = logoRef.current.querySelector("path");
        if (path) {
          pathLengthRef.current = path.getTotalLength();
          gsap.set(path, {
            strokeDasharray: pathLengthRef.current,
            strokeDashoffset: pathLengthRef.current,
            fill: "transparent",
          });
        }
      }

      // Initial reveal on page load
      revealPage();

      // Attach anchor listeners - only to links with data-transition attribute
      const links = document.querySelectorAll<HTMLAnchorElement>(
        'a[data-transition="true"]'
      );
      links.forEach((link) => {
        link.addEventListener("click", onAnchorClick as EventListener);
      });

      return () => {
        links.forEach((link) => {
          link.removeEventListener("click", onAnchorClick as EventListener);
        });
      };
    });

    return () => {
      ctx.revert();
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, [pathname, onAnchorClick, revealPage]);

  return (
    <>
      {/* Block Overlay */}
      <div ref={overlayRef} className="transition-overlay" />

      {/* Logo Overlay */}
      <div ref={logoOverlayRef} className="logo-overlay">
        <div className="logo-container">
          <Logo ref={logoRef} />
        </div>
      </div>

      {children}
    </>
  );
}

export default PageTransition;
