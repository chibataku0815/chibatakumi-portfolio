"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

export function LanguageSwitcher() {
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
      className={`flex items-center gap-1 border-l border-[var(--text-base-20)] pl-4 sm:pl-6 ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => switchLocale("en")}
        disabled={isPending}
        className={`font-mono text-[10px] sm:text-xs uppercase tracking-[0.08em] sm:tracking-[0.12em] transition-opacity duration-200 ${
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
        className={`font-mono text-[10px] sm:text-xs uppercase tracking-[0.08em] sm:tracking-[0.12em] transition-opacity duration-200 ${
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
