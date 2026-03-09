import { HeroShaderBackground } from "@/features/hero/components";
import { PageTransition } from "@/shared/transitions";
import { Nav } from "@/shared/components";
import { portfolioData } from "@/shared/data/portfolio";
import { routing } from "@/i18n/routing";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale, getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fontVariables } from "../fonts";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isJa = locale === "ja";
  const baseUrl = portfolioData.site.siteUrl;

  return {
    title: {
      default: portfolioData.site.title,
      template: `%s | ${portfolioData.site.author.name}`,
    },
    description: portfolioData.site.description,
    metadataBase: new URL(baseUrl),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      title: portfolioData.site.title,
      description: portfolioData.site.description,
      url: baseUrl,
      siteName: portfolioData.site.author.name,
      locale: isJa ? "ja_JP" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: portfolioData.site.title,
      description: portfolioData.site.description,
    },
    alternates: {
      canonical: baseUrl,
      languages: {
        ja: baseUrl,
        en: `${baseUrl}/en`,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`dark ${fontVariables}`}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <HeroShaderBackground />
          <PageTransition>
            <Nav />
            {children}
          </PageTransition>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
