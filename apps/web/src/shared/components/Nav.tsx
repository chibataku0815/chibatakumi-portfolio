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
      <nav className="fixed left-0 top-0 z-50 w-full px-4 pt-4 sm:px-6 md:px-8">
        <div className="mx-auto flex h-[var(--nav-height)] max-w-7xl items-center justify-between rounded-full border border-[var(--stroke-subtle)] bg-[var(--surface-1)] px-4 shadow-[var(--shadow-elev-1)] backdrop-blur-xl sm:px-5">
          <Link
            href="/"
            data-transition="true"
            aria-label={navBrand}
            className="min-w-0 transition-opacity hover:opacity-80"
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
                  className={`rounded-full px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] transition-colors duration-200 ${
                    isCurrent
                      ? "pointer-events-none border border-[var(--stroke-strong)] bg-[var(--surface-2)] text-[var(--text-base)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-base)]"
                  }`}
                >
                  {label}
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--stroke-subtle)] bg-[var(--surface-2)] text-[var(--text-base)] shadow-[var(--shadow-elev-1)]"
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
        className={`fixed inset-0 z-40 md:hidden ${isMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!isMenuOpen}
      >
        <div
          className={`absolute inset-0 bg-black/65 backdrop-blur-md transition-opacity duration-300 ${isMenuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsMenuOpen(false)}
        />
        <div
          id="mobile-nav-panel"
          className={`absolute inset-x-4 top-[calc(var(--nav-height)+1.5rem)] rounded-[var(--radius-panel)] border border-[var(--stroke-strong)] bg-[var(--surface-1)] p-5 shadow-[var(--shadow-elev-3)] transition-all duration-300 ${isMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"}`}
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
