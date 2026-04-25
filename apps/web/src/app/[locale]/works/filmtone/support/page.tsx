import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  filmLabCanonicalBaseUrl,
  filmLabIosMinimumVersion,
  filmLabIosOperatorName,
  filmLabIosOutputCodec,
  filmLabIosOutputContainer,
  filmLabIosOutputFrameRate,
  filmLabIosOutputLongEdgePx,
  filmLabIosPreservesSourceAudio,
  filmLabIosSourceDurationCapSeconds,
  filmLabIosSourceFileSizeCapGiB,
  filmLabIosSourceLongEdgeCapPx,
  filmLabIosSupportedDeviceFamily,
  filmLabIosSupportedInputCodecs,
  filmLabIosSupportEmail,
  filmLabIosUnsupportedVideoCodecs,
} from "@/features/interactive/film-lab/ios-release-info";

const contactFlowKeys = ["sendEmail", "includeContext", "replyByEmail"] as const;
const reportDetailKeys = ["device", "iosVersion", "sourceRoute", "mediaInfo", "reproSteps"] as const;
const deviceCardKeys = ["deviceFamily", "os", "importRoutes"] as const;
const inputCodecKeys = ["h264", "hevc", "prores"] as const;
const outputDetailKeys = ["container", "frameSize", "audio"] as const;
const unsupportedItemKeys = [
  "dnxhr",
  "overLength",
  "overResolution",
  "overSize",
  "ipad",
  "nonMedia",
] as const;

function LegalCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <div className="mt-1 text-sm leading-relaxed text-white/85">{children}</div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "film-lab.supportPage.metadata" });
  const isJa = locale === "ja";
  const canonicalUrl = isJa
    ? `${filmLabCanonicalBaseUrl}/works/filmtone/support`
    : `${filmLabCanonicalBaseUrl}/en/works/filmtone/support`;

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
        ja: `${filmLabCanonicalBaseUrl}/works/filmtone/support`,
        en: `${filmLabCanonicalBaseUrl}/en/works/filmtone/support`,
      },
    },
  };
}

export default async function FilmtoneSupportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "film-lab.supportPage" });
  const maxDurationMinutes = Math.round(filmLabIosSourceDurationCapSeconds / 60);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-16 sm:px-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
        {t("eyebrow")}
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{t("heroTitle")}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">{t("heroBody")}</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <LegalCard label={t("facts.operatorLabel")}>
          {t("facts.operatorValue", { operatorName: filmLabIosOperatorName })}
        </LegalCard>
        <LegalCard label={t("facts.contactLabel")}>
          <a
            href={`mailto:${filmLabIosSupportEmail}`}
            className="underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
          >
            {filmLabIosSupportEmail}
          </a>
          <p className="mt-2 text-xs text-white/55">{t("facts.contactCaption")}</p>
        </LegalCard>
        <LegalCard label={t("facts.devicesLabel")}>
          {t("facts.devicesValue", {
            deviceFamily: filmLabIosSupportedDeviceFamily,
            minIos: filmLabIosMinimumVersion,
          })}
        </LegalCard>
        <LegalCard label={t("facts.codecsLabel")}>
          {t("facts.codecsValue", {
            inputCodecs: filmLabIosSupportedInputCodecs.join(", "),
            outputCodec: filmLabIosOutputCodec,
            outputContainer: filmLabIosOutputContainer,
          })}
        </LegalCard>
      </div>

      <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
              {t("contact.eyebrow")}
            </p>
            <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
              {t("contact.title")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">{t("contact.body")}</p>

            <ol className="mt-6 grid gap-3 md:grid-cols-3">
              {contactFlowKeys.map((key, index) => (
                <li
                  key={key}
                  className="rounded-2xl border border-white/8 bg-black/20 p-4"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/14 bg-white/8 text-xs font-semibold text-white/85">
                    {index + 1}
                  </div>
                  <p className="mt-4 text-sm font-medium text-white">
                    {t(`contact.flow.${key}.title`)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    {t(`contact.flow.${key}.body`)}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              {t("contact.emailLabel")}
            </p>
            <a
              href={`mailto:${filmLabIosSupportEmail}`}
              className="mt-2 inline-block text-base font-medium text-white underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/80"
            >
              {filmLabIosSupportEmail}
            </a>
            <p className="mt-3 text-sm leading-relaxed text-white/60">{t("contact.emailHint")}</p>

            <div className="mt-6 border-t border-white/8 pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                {t("contact.detailsTitle")}
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/70">
                {reportDetailKeys.map((key) => (
                  <li key={key} className="flex gap-2">
                    <span className="mt-[0.45rem] h-1.5 w-1.5 rounded-full bg-white/35" />
                    <span>{t(`contact.details.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("devices.eyebrow")}
        </p>
        <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">{t("devices.title")}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">{t("devices.body")}</p>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {deviceCardKeys.map((key) => (
            <div
              key={key}
              className="rounded-2xl border border-white/8 bg-black/20 p-5"
            >
              <p className="text-sm font-medium text-white">{t(`devices.cards.${key}.title`)}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {t(`devices.cards.${key}.body`, {
                  deviceFamily: filmLabIosSupportedDeviceFamily,
                  minIos: filmLabIosMinimumVersion,
                })}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("media.eyebrow")}
        </p>
        <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">{t("media.title")}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">{t("media.body")}</p>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
            <p className="text-sm font-medium text-white">{t("media.inputTitle")}</p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/70">
              {inputCodecKeys.map((key, index) => (
                <li key={key} className="flex gap-2">
                  <span className="mt-[0.45rem] h-1.5 w-1.5 rounded-full bg-white/35" />
                  <span>
                    {t(`media.inputItems.${key}`, {
                      codec: filmLabIosSupportedInputCodecs[index],
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
            <p className="text-sm font-medium text-white">{t("media.outputTitle")}</p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/70">
              {outputDetailKeys.map((key) => (
                <li key={key} className="flex gap-2">
                  <span className="mt-[0.45rem] h-1.5 w-1.5 rounded-full bg-white/35" />
                  <span>
                    {t(`media.outputItems.${key}`, {
                      outputCodec: filmLabIosOutputCodec,
                      outputContainer: filmLabIosOutputContainer,
                      outputLongEdgePx: filmLabIosOutputLongEdgePx,
                      outputFrameRate: filmLabIosOutputFrameRate,
                      audioPolicy: filmLabIosPreservesSourceAudio
                        ? t("media.audioPreserved")
                        : t("media.audioRemoved"),
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
          {t("unsupported.eyebrow")}
        </p>
        <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
          {t("unsupported.title")}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">
          {t("unsupported.body")}
        </p>

        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {unsupportedItemKeys.map((key) => (
            <li
              key={key}
              className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm leading-relaxed text-white/70"
            >
              {t(`unsupported.items.${key}`, {
                unsupportedCodec: filmLabIosUnsupportedVideoCodecs[0],
                maxDurationMinutes,
                sourceLongEdgeCapPx: filmLabIosSourceLongEdgeCapPx,
                sourceFileSizeCapGiB: filmLabIosSourceFileSizeCapGiB,
              })}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
        <Link
          href="/works/filmtone/privacy"
          className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm text-white transition-colors hover:bg-white/14"
        >
          {t("footer.privacyCta")}
        </Link>
        <Link
          href="/works/filmtone"
          className="text-sm text-white/60 transition-colors hover:text-white"
        >
          {t("footer.backToFilmLab")}
        </Link>
      </div>
    </main>
  );
}
