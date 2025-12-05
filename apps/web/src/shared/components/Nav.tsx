"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLink {
  href: string;
  label: string;
}

const navLinks: NavLink[] = [
  { href: "/", label: "Index" },
  { href: "/motion", label: "Motion" },
  { href: "/interactive", label: "Interactive" },
  { href: "/installation", label: "Installation" },
  { href: "/archive", label: "Archive" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 z-50 flex w-full items-center justify-between px-6 py-5 md:px-8">
      {/* Logo/Brand */}
      <div>
        <Link
          href="/"
          data-transition="true"
          className="font-semibold text-[var(--text-base)] tracking-tight text-lg hover:opacity-80 transition-opacity"
        >
          TC
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex gap-4 md:gap-6">
        {navLinks.map(({ href, label }) => {
          const isCurrent = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              data-transition="true"
              aria-current={isCurrent ? "page" : undefined}
              className={`
                font-mono text-xs uppercase tracking-[0.12em]
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
      </div>
    </nav>
  );
}

export default Nav;
