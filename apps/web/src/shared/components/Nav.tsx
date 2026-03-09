"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { portfolioData } from "@/shared/data/portfolio";
import { BrandWordmark } from "./BrandWordmark";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Nav() {
  const pathname = usePathname();
  const { navBrand } = portfolioData.branding;
  const { links } = portfolioData.navigation;

  return (
    <nav className="fixed top-0 left-0 z-50 flex w-full items-center justify-between px-6 py-5 md:px-8">
      {/* Logo/Brand */}
      <div>
        <Link
          href="/"
          data-transition="true"
          aria-label={navBrand}
          className="transition-opacity hover:opacity-80"
        >
          <BrandWordmark compact />
        </Link>
      </div>

      {/* Navigation Links + Language Switcher */}
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
        {links.map(({ href, label }) => {
          const isCurrent = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              data-transition="true"
              aria-current={isCurrent ? "page" : undefined}
              className={`
                font-mono text-[10px] sm:text-xs uppercase tracking-[0.08em] sm:tracking-[0.12em]
                transition-opacity duration-200
                ${
                  isCurrent
                    ? "text-[var(--text-base)] opacity-40 pointer-events-none"
                    : "text-[var(--text-muted)] hover:text-[var(--text-base)] hover:opacity-100"
                }
              `}
            >
              {label}
            </Link>
          );
        })}
        <LanguageSwitcher />
      </div>
    </nav>
  );
}

export default Nav;
