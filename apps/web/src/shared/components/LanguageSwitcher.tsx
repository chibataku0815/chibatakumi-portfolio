"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchLocale(newLocale: "en" | "ja") {
    if (newLocale === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border border-[var(--stroke-subtle)] bg-[var(--surface-2)] ${
        compact ? "px-2.5 py-1.5" : "px-3 py-2 sm:px-4"
      } ${isPending ? "opacity-50" : ""}`}
    >
      <button
        type="button"
        onClick={() => switchLocale("en")}
        disabled={isPending}
        className={`font-mono uppercase transition-opacity duration-200 ${
          compact
            ? "text-[10px] tracking-[0.14em]"
            : "text-[10px] sm:text-xs tracking-[0.08em] sm:tracking-[0.12em]"
        } ${
          locale === "en"
            ? "text-[var(--text-base)] opacity-100"
            : "text-[var(--text-muted)] hover:text-[var(--text-base)] opacity-60 hover:opacity-100"
        }`}
      >
        EN
      </button>
      <span className="text-[var(--text-base-20)] text-[10px]">|</span>
      <button
        type="button"
        onClick={() => switchLocale("ja")}
        disabled={isPending}
        className={`font-mono uppercase transition-opacity duration-200 ${
          compact
            ? "text-[10px] tracking-[0.14em]"
            : "text-[10px] sm:text-xs tracking-[0.08em] sm:tracking-[0.12em]"
        } ${
          locale === "ja"
            ? "text-[var(--text-base)] opacity-100"
            : "text-[var(--text-muted)] hover:text-[var(--text-base)] opacity-60 hover:opacity-100"
        }`}
      >
        JA
      </button>
    </div>
  );
}
