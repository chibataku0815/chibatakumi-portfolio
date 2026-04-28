"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { portfolioData } from "@/shared/data/portfolio";
import { LiquidGlassSurface } from "@/features/liquid-glass";
import { BrandMark } from "./BrandMark";
import { BrandWordmark } from "./BrandWordmark";
import { LanguageSwitcher } from "./LanguageSwitcher";

// Nav — Apple Liquid Glass nav chrome.
//
// The visible glass material on the chips + panel is rendered by the WebGPU
// front overlay canvas (`LiquidGlassFrontChrome`). Each chip / the panel is
// registered as a `LiquidGlassSurface`; the front canvas reads each rect per
// frame and paints the lensing/refraction material that samples motion-dot's
// substrate.
//
// When the menu opens, the close-overlay (scrim) gets a CSS
// `backdrop-filter: blur(...)` so the page content behind the sheet is
// genuinely blurred — Apple's iOS 26 sheet behaviour. The blur is scoped to
// the scrim only; it never touches the panel material itself (the panel
// material is the WebGPU Liquid Glass surface).
//
// Layout (per iOS 26 / macOS Tahoe Liquid Glass design audit):
//   - Brand chip:  48 × 48 px, top:24, left:32, capsule.
//   - Menu chip:   48 × 48 px, top:24, right:32, capsule, icon-only.
//   - Sheet panel: width min(420px, 100vw - 24px), top:12, right:12, bottom:12,
//                  20px corner radius all four sides.
//   - Modal scrim: full-viewport, backdrop-blur-md + black/30 tint.

export function Nav() {
  const pathname = usePathname();
  const { navBrand } = portfolioData.branding;
  const { links } = portfolioData.navigation;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [previousPathname, setPreviousPathname] = useState(pathname);
  if (previousPathname !== pathname) {
    setPreviousPathname(pathname);
    if (isMenuOpen) setIsMenuOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    if (isMenuOpen) {
      document.documentElement.setAttribute("data-nav-menu-open", "");
    } else {
      document.documentElement.removeAttribute("data-nav-menu-open");
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.removeAttribute("data-nav-menu-open");
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  return (
    <>
      {/*
        Surface measurement layer — invisible divs whose getBoundingClientRect
        the front overlay canvas reads each frame. pointer-events-none so they
        never intercept clicks; the hit layer below owns interaction.
      */}
      <div aria-hidden="true" className="pointer-events-none">
        <LiquidGlassSurface
          surfaceId="nav.brand"
          kind="nav"
          radius={24}
          intensity={1.0}
          brightness={0.7}
          className="fixed left-[var(--nav-chip-left)] top-[var(--nav-chip-top)] h-12 w-12"
        />
        {!isMenuOpen && (
          <LiquidGlassSurface
            surfaceId="nav.menu"
            kind="nav"
            radius={24}
            intensity={1.0}
            brightness={0.7}
            className="fixed right-[var(--nav-chip-right)] top-[var(--nav-chip-top)] h-12 w-12"
          />
        )}
      </div>

      {/* Hit / a11y layer — transparent Link + button matching the chip rects. */}
      <nav
        aria-label="Global"
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: "var(--z-nav-hit, 1010)" }}
      >
        <Link
          href="/"
          data-transition="true"
          aria-label={navBrand}
          className={`fixed left-[var(--nav-chip-left)] top-[var(--nav-chip-top)] grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-transparent text-[rgba(248,250,255,0.92)] outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${
            isMenuOpen ? "pointer-events-none" : "pointer-events-auto"
          }`}
        >
          <BrandMark size={22} />
          <span className="sr-only">{navBrand}</span>
        </Link>

        {!isMenuOpen && (
          <button
            type="button"
            aria-expanded={false}
            aria-controls="global-menu-sheet"
            aria-label="Open global menu"
            className="pointer-events-auto fixed right-[var(--nav-chip-right)] top-[var(--nav-chip-top)] inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-transparent text-[rgba(248,250,255,0.92)] outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            onClick={() => setIsMenuOpen(true)}
          >
            <span aria-hidden="true" className="relative inline-block h-3 w-4">
              <span className="absolute left-0 right-0 top-0 h-px bg-current" />
              <span className="absolute left-0 right-0 top-1.5 h-px bg-current" />
              <span className="absolute left-0 right-0 top-3 h-px bg-current" />
            </span>
            <span className="sr-only">Menu</span>
          </button>
        )}
      </nav>

      {/*
        Open menu — Sheet pattern with WebGPU Liquid Glass material on the
        panel itself, and CSS backdrop-filter blur on the scrim behind the
        panel. The scrim's CSS blur is what gives the "page pushed back +
        blurred" sensation; the panel's material is procedural Liquid Glass
        rendered by the front canvas.
      */}
      {isMenuOpen && (
        <>
          {/*
            Scrim — blurs + dims the full viewport behind the sheet. The
            WebGPU front canvas sits above this layer, so the panel material
            remains crisp while the page/motion substrate is blurred.
          */}
          <button
            type="button"
            aria-label="Close global menu"
            className="fixed inset-0 cursor-pointer bg-black/30 backdrop-blur-lg"
            style={{ zIndex: "var(--z-nav-panel-scrim, 1090)" }}
            onClick={() => setIsMenuOpen(false)}
          />
          <LiquidGlassSurface
            surfaceId="nav.panel"
            kind="panel"
            radius={20}
            intensity={1.05}
            brightness={0.7}
            id="global-menu-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="global-menu-title"
            className="fixed flex flex-col overflow-y-auto overscroll-contain px-7 py-7 text-[rgba(248,250,255,0.92)] sm:px-8"
            style={{
              top: "var(--nav-panel-top)",
              right: "var(--nav-panel-right)",
              bottom: "var(--nav-panel-bottom)",
              width: "var(--nav-panel-width)",
              maxHeight: "var(--nav-panel-max-height)",
              zIndex: "var(--z-nav-panel-content, 1300)",
            }}
          >
            <div className="flex items-center justify-between gap-5 pb-5">
              <Link
                href="/"
                data-transition="true"
                aria-label={navBrand}
                className="inline-flex min-h-11 min-w-0 cursor-pointer items-center transition-opacity hover:opacity-85"
                onClick={() => setIsMenuOpen(false)}
              >
                <BrandWordmark compact />
              </Link>
              <button
                type="button"
                aria-label="Close global menu"
                className="relative h-11 w-11 shrink-0 cursor-pointer rounded-full text-current transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="sr-only">Close</span>
                <span className="absolute left-1/2 top-1/2 h-px w-5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-current" />
                <span className="absolute left-1/2 top-1/2 h-px w-5 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-current" />
              </button>
            </div>

            <div className="flex flex-1 flex-col justify-between gap-10 pt-6">
              <div>
                <p
                  id="global-menu-title"
                  className="mb-5 font-mono text-[10px] uppercase tracking-[0.28em] text-[rgba(248,250,255,0.55)]"
                >
                  Global Menu
                </p>
                <div className="flex flex-col gap-1">
                  {links.map(({ href, label }, index) => {
                    const isCurrent =
                      href === "/" ? pathname === href : pathname.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        data-transition="true"
                        aria-current={isCurrent ? "page" : undefined}
                        className={`group flex min-h-11 cursor-pointer items-center justify-between rounded-2xl px-3 py-3 text-left transition-opacity hover:opacity-85 ${
                          isCurrent
                            ? "text-[rgba(255,248,222,1)]"
                            : "text-[rgba(248,250,255,0.92)]"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="text-[clamp(1.35rem,4vw,2rem)] font-medium leading-none tracking-normal">
                          {label}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[rgba(248,250,255,0.4)]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between gap-5 pt-5">
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[rgba(248,250,255,0.5)]">
                  Locale
                </span>
                <LanguageSwitcher />
              </div>
            </div>
          </LiquidGlassSurface>
        </>
      )}
    </>
  );
}

export default Nav;
