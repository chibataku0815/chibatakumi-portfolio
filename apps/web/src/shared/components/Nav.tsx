"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { portfolioData } from "@/shared/data/portfolio";
import { BrandWordmark } from "./BrandWordmark";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Nav() {
  const pathname = usePathname();
  const { navBrand } = portfolioData.branding;
  const { links } = portfolioData.navigation;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        data-theme="dark"
        className="fixed left-0 top-0 z-50 w-full"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 border-b border-white/[0.07]"
          style={{
            background: "rgba(12, 12, 14, 0.72)",
            backdropFilter: "blur(24px) saturate(160%)",
            WebkitBackdropFilter: "blur(24px) saturate(160%)",
          }}
        />
        <div className="relative mx-auto flex h-[var(--nav-height)] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link
            href="/"
            data-transition="true"
            aria-label={navBrand}
            className="min-w-0 text-white transition-opacity hover:opacity-80"
          >
            <BrandWordmark compact />
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            {links.map(({ href, label }) => {
              const isCurrent = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  data-transition="true"
                  aria-current={isCurrent ? "page" : undefined}
                  className={`relative px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] transition-colors duration-200 ${
                    isCurrent
                      ? "pointer-events-none text-white"
                      : "text-white/55 hover:text-white/90"
                  }`}
                >
                  {label}
                  {isCurrent && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-1 left-3 right-3 h-px bg-white/60"
                    />
                  )}
                </Link>
              );
            })}
            <LanguageSwitcher />
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher compact />
            <button
              type="button"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav-panel"
              aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] bg-black/40 text-white backdrop-blur-md"
            >
              <span className="sr-only">Menu</span>
              <span className="flex flex-col gap-1.5">
                <span
                  className={`block h-px w-4 bg-current transition-transform duration-200 ${isMenuOpen ? "translate-y-[7px] rotate-45" : ""}`}
                />
                <span
                  className={`block h-px w-4 bg-current transition-opacity duration-200 ${isMenuOpen ? "opacity-0" : "opacity-100"}`}
                />
                <span
                  className={`block h-px w-4 bg-current transition-transform duration-200 ${isMenuOpen ? "-translate-y-[7px] -rotate-45" : ""}`}
                />
              </span>
            </button>
          </div>
        </div>
      </nav>

      <div
        data-theme="dark"
        className={`fixed inset-0 z-40 md:hidden ${isMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!isMenuOpen}
      >
        <div
          className={`absolute inset-0 bg-black/65 backdrop-blur-md transition-opacity duration-300 ${isMenuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsMenuOpen(false)}
        />
        <div
          id="mobile-nav-panel"
          className={`absolute inset-x-4 top-[calc(var(--nav-height)+1.5rem)] rounded-[var(--radius-panel)] border border-[var(--stroke-strong)] bg-[#111113]/90 p-5 shadow-[var(--shadow-elev-3)] backdrop-blur-xl transition-all duration-300 ${isMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"}`}
        >
          <div className="mb-5 flex items-center justify-between border-b border-[var(--stroke-subtle)] pb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--text-base-50)]">
              Navigation
            </p>
            <span className="h-px w-12 bg-[var(--hairline-gradient)]" />
          </div>
          <div className="flex flex-col gap-2">
            {links.map(({ href, label }) => {
              const isCurrent = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  data-transition="true"
                  aria-current={isCurrent ? "page" : undefined}
                  className={`group flex items-center justify-between rounded-[1.25rem] border px-4 py-4 text-left transition-all duration-200 ${
                    isCurrent
                      ? "border-[var(--stroke-strong)] bg-[var(--surface-2)] text-[var(--text-base)] shadow-[var(--shadow-elev-1)]"
                      : "border-[var(--stroke-subtle)] bg-[var(--surface-3)] text-[var(--text-base-80)]"
                  }`}
                >
                  <span className="text-balance text-[clamp(1.1rem,4.8vw,1.4rem)] font-medium leading-[1.05] tracking-[var(--tracking-tight)]">
                    {label}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-base-40)]">
                    0{links.findIndex((item) => item.href === href) + 1}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default Nav;
