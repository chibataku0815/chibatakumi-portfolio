"use client";

import { useTranslations } from "next-intl";

export default function AboutSection() {
  const t = useTranslations("photography.about");

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-base-40)]">
          {t("label")}
        </p>
        <h2 className="mb-6 text-[clamp(1.5rem,3vw,2.5rem)] font-semibold text-[var(--text-base)]">
          {t("title")}
          <br />
          <span className="text-[var(--text-muted)]">{t("titleSub")}</span>
        </h2>
        <p className="mx-auto max-w-xl text-base leading-relaxed text-[var(--text-muted)]">
          {t("body")}
        </p>
      </div>
    </section>
  );
}
