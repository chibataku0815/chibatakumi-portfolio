"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import gsap from "gsap";

// =============================================================================
// Types
// =============================================================================

export interface LightboxHandle {
  open: (index: number) => void;
}

interface LightboxDialogProps {
  images: Array<{ src: string; alt: string }>;
}

// =============================================================================
// Component
// =============================================================================

const LightboxDialog = forwardRef<LightboxHandle, LightboxDialogProps>(
  function LightboxDialog({ images }, ref) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const updateImage = useCallback(
      (index: number) => {
        if (!imgRef.current || !images[index]) return;
        imgRef.current.src = images[index].src;
        imgRef.current.alt = images[index].alt;
        setCurrentIndex(index);
      },
      [images]
    );

    const closeLightbox = useCallback(() => {
      if (!dialogRef.current) return;
      gsap.to(dialogRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => dialogRef.current?.close(),
      });
    }, []);

    const goNext = useCallback(() => {
      const next = (currentIndex + 1) % images.length;
      updateImage(next);
    }, [currentIndex, images.length, updateImage]);

    const goPrev = useCallback(() => {
      const prev = (currentIndex - 1 + images.length) % images.length;
      updateImage(prev);
    }, [currentIndex, images.length, updateImage]);

    // Keyboard navigation
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!dialogRef.current?.open) return;
        switch (e.key) {
          case "ArrowRight":
            goNext();
            break;
          case "ArrowLeft":
            goPrev();
            break;
          case "Escape":
            e.preventDefault();
            closeLightbox();
            break;
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [goNext, goPrev, closeLightbox]);

    // Expose open method via ref
    useImperativeHandle(ref, () => ({
      open(index: number) {
        if (!dialogRef.current) return;
        updateImage(index);
        dialogRef.current.showModal();
        gsap.fromTo(
          dialogRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: "power2.out" }
        );
      },
    }));

    return (
      <dialog
        ref={dialogRef}
        onClick={closeLightbox}
        className="fixed inset-0 z-[100] m-0 h-full max-h-full w-full max-w-full bg-black/90 p-4 backdrop:bg-transparent md:p-12"
      >
        <div className="flex h-full items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src=""
            alt=""
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Navigation: Previous */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-base-40)] transition-colors hover:text-[var(--text-base)]"
          aria-label="Previous image"
        >
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Navigation: Next */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-base-40)] transition-colors hover:text-[var(--text-base)]"
          aria-label="Next image"
        >
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Close button */}
        <button
          type="button"
          onClick={closeLightbox}
          className="absolute right-6 top-6 text-[var(--text-base-40)] transition-colors hover:text-[var(--text-base)]"
          aria-label="Close"
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image counter */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-xs text-[var(--text-base-40)]">
          {currentIndex + 1} / {images.length}
        </div>
      </dialog>
    );
  }
);

export default LightboxDialog;
