import { PageTransition } from "@/shared/transitions";
import { Nav } from "@/shared/components";
import { portfolioData } from "@/shared/data/portfolio";
import { routing } from "@/i18n/routing";
import { AnalyticsPageTracker } from "@/shared/analytics/AnalyticsPageTracker";
import { MotionStageProvider } from "@/features/motion";
import { AudioBusProvider, SoundToggleControl } from "@/features/audio";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale, getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
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
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? {
          verification: {
            google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
          },
        }
      : {}),
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
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  return (
    <html lang={locale} className={fontVariables} data-theme="light">
      <body className="antialiased">
        {metaPixelId ? (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', ${JSON.stringify(metaPixelId)});
              `}
            </Script>
            <noscript>
              <img
                alt=""
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
              />
            </noscript>
          </>
        ) : null}
        {gaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', ${JSON.stringify(gaMeasurementId)}, {
                  send_page_view: false
                });
              `}
            </Script>
          </>
        ) : null}
        <MotionStageProvider>
          {/*
            AudioBusProvider sits inside MotionStageProvider so motion
            participants (Wave 2 D5.4) can subscribe to the shared audio
            bus, and inside NextIntlClientProvider so audio surfaces
            (SoundToggleControl, MicInputGate) can read translated
            aria-labels and helper text. — Wave 2 Agent β (D5.4).
          */}
          <NextIntlClientProvider messages={messages}>
            <AudioBusProvider>
              <Suspense fallback={null}>
                <AnalyticsPageTracker />
              </Suspense>
              <PageTransition>
                <Nav />
                {children}
              </PageTransition>
              <SoundToggleControl />
            </AudioBusProvider>
          </NextIntlClientProvider>
        </MotionStageProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
