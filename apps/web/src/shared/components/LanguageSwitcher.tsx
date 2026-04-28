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
      className={`inline-flex items-center gap-3 px-0 py-0 ${isPending ? "opacity-50" : ""}`}
    >
      <button
        type="button"
        onClick={() => switchLocale("en")}
        disabled={isPending}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center border-b font-mono uppercase transition-opacity duration-200 ${
          compact
            ? "text-[10px] tracking-[0.14em]"
            : "text-[10px] sm:text-xs tracking-[0.08em] sm:tracking-[0.12em]"
        } ${
          locale === "en"
            ? "border-[var(--text-base)] text-[var(--text-base)] opacity-100"
            : "border-transparent text-[var(--text-muted)] opacity-60 hover:text-[var(--text-base)] hover:opacity-100"
        }`}
      >
        EN
      </button>
      <span className="text-[var(--text-base-20)] text-[10px]">|</span>
      <button
        type="button"
        onClick={() => switchLocale("ja")}
        disabled={isPending}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center border-b font-mono uppercase transition-opacity duration-200 ${
          compact
            ? "text-[10px] tracking-[0.14em]"
            : "text-[10px] sm:text-xs tracking-[0.08em] sm:tracking-[0.12em]"
        } ${
          locale === "ja"
            ? "border-[var(--text-base)] text-[var(--text-base)] opacity-100"
            : "border-transparent text-[var(--text-muted)] opacity-60 hover:text-[var(--text-base)] hover:opacity-100"
        }`}
      >
        JA
      </button>
    </div>
  );
}
