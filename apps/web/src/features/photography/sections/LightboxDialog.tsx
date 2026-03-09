"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import type { GalleryImage } from "./GallerySection";

export interface LightboxHandle {
  open: (index: number) => void;
}

interface LightboxDialogProps {
  images: GalleryImage[];
}

const LightboxDialog = forwardRef<LightboxHandle, LightboxDialogProps>(
  function LightboxDialog({ images }, ref) {
    const t = useTranslations("photography.gallery");
    const dialogRef = useRef<HTMLDialogElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const updateImage = useCallback(
      (index: number) => {
        if (!imgRef.current || !images[index]) return;
        imgRef.current.src = images[index].src;
        imgRef.current.alt = t(`images.${images[index].altKey}`);
        setCurrentIndex(index);
      },
      [images, t]
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
        className="fixed inset-0 z-[100] m-0 h-full max-h-full w-full max-w-full bg-black/92 p-4 backdrop:bg-transparent md:p-12"
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-center">
          <div
            className="relative w-full overflow-hidden rounded-[2rem] border border-[var(--text-base-20)] bg-[color-mix(in_srgb,var(--slate-2)_86%,transparent)] p-3 sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/10] max-h-[78vh] overflow-hidden rounded-[1.4rem] bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src=""
                alt=""
                className="h-full w-full object-contain"
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 px-2">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--accent-amber1)]">
                  {t("sheetLabel")}
                </p>
                <p className="mt-1 text-sm text-[var(--text-base-60)]">
                  {t(`labels.${images[currentIndex]?.labelKey}`)}
                </p>
              </div>
              <div className="font-mono text-xs text-[var(--text-base-40)]">
                {currentIndex + 1} / {images.length}
              </div>
            </div>
          </div>
        </div>

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
      </dialog>
    );
  }
);

export default LightboxDialog;
