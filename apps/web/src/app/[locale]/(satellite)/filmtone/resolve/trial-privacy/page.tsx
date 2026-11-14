import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { filmtoneResolveCanonicalBaseUrl } from "@/features/interactive/film-lab/resolve-plugin-info";
import {
  ResolveLegalFooter,
  ResolveLegalHeader,
  ResolveLegalMain,
  ResolveLegalReferences,
  ResolveLegalSection,
} from "../resolve-legal-ui";

/**
 * @file `Filmtone for DaVinci Resolve` の trial プライバシー通知（`/filmtone/resolve/trial-privacy`）。
 * @description filmtone repo の `docs/filmtone/davinci-plugin/monetization/trial-privacy.md` を忠実に翻訳・構造化。
 *   14 日 trial 請求時のみメールアドレス等を処理する（Cloudflare Workers/KV/Turnstile・Resend）。既存 `/filmtone/privacy`
 *   はアプリの no-collection 通知で内容が矛盾するため、この通知は独立ページにする。
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "filmtone-resolve.trialPrivacy.metadata" });
  const isJa = locale === "ja";
  const canonicalUrl = isJa
    ? `${filmtoneResolveCanonicalBaseUrl}/filmtone/resolve/trial-privacy`
    : `${filmtoneResolveCanonicalBaseUrl}/en/filmtone/resolve/trial-privacy`;

  return {
    title: t("title"),
    description: t("description"),
    icons: {
      icon: [{ url: "/brand/film-lab-symbol.svg", type: "image/svg+xml", sizes: "any" }],
      apple: [{ url: "/brand/film-lab-apple-touch.png", sizes: "180x180", type: "image/png" }],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        ja: `${filmtoneResolveCanonicalBaseUrl}/filmtone/resolve/trial-privacy`,
        en: `${filmtoneResolveCanonicalBaseUrl}/en/filmtone/resolve/trial-privacy`,
      },
    },
  };
}

export default async function FilmtoneResolveTrialPrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "filmtone-resolve.trialPrivacy" });
  const infoItems = t.raw("info.items") as string[];
  const retentionItems = t.raw("retention.items") as string[];
  const providerItems = t.raw("providers.items") as string[];
  const references = t.raw("references.items") as string[];

  return (
    <ResolveLegalMain>
      <ResolveLegalHeader eyebrow={t("eyebrow")} title={t("title")} note={t("controllerNote")} />

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-sm leading-relaxed text-white/70">{t("intro")}</p>
      </section>

      <ResolveLegalSection heading={t("info.heading")} bullets={infoItems} />
      <ResolveLegalSection heading={t("purposes.heading")} paragraphs={[t("purposes.body")]} />
      <ResolveLegalSection heading={t("retention.heading")} bullets={retentionItems} />

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-white sm:text-xl">{t("providers.heading")}</h2>
        <ul className="mt-3 space-y-2">
          {providerItems.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-relaxed text-white/70">
              <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-white/35" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-white/70">{t("providers.note")}</p>
      </section>

      <ResolveLegalSection heading={t("requests.heading")} paragraphs={[t("requests.body")]} />

      <ResolveLegalReferences label={t("references.label")} references={references} />

      <ResolveLegalFooter backLabel={t("backCta")} />
    </ResolveLegalMain>
  );
}
