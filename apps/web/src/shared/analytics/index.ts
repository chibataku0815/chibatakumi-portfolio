"use client";

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackPageView(path: string) {
  if (window.gtag && GA_MEASUREMENT_ID) {
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  }

  if (window.fbq && META_PIXEL_ID) {
    window.fbq("track", "PageView");
  }
}

/**
 * @description Film Lab の任意寄付ナッジ用イベント（GA4）。イベント名は life 側仕様と一致させる。
 * @param {string} name - impression / dismiss / cta_click / thanks / ack
 * @param {object} details - surface・locale ほか、Stripe 段階別なら `stripeTierUsd` を付与する（PII・session_id は送らない）
 */
export function trackFilmLabDonationEvent(
  name:
    | "donation_nudge_impression"
    | "donation_nudge_dismiss"
    | "donation_nudge_cta_click"
    | "donation_thanks_page_view"
    | "donation_supporter_ack"
    | "donation_checkout_session_verified",
  details: {
    surface?: "footer" | "preset_save_modal" | "lut_banner";
    locale: string;
    variant?: string;
    provider?: "stripe" | "bmc" | null;
    /** Stripe の金額段階（3 / 9 / 25）。複数ティア無しのクリックでは省略可 */
    stripeTierUsd?: string;
    method?: string;
    /** 支援者向けの弱いナッジ UI を計測するとき `supporter` */
    nudge_mode?: "default" | "supporter";
  },
) {
  if (!window.gtag || !GA_MEASUREMENT_ID) return;

  const payload: Record<string, string | undefined> = {
    variant: details.variant ?? "v1",
    locale: details.locale,
  };
  if (details.surface != null) payload.surface = details.surface;
  if (details.provider != null) {
    payload.provider = details.provider;
  }
  if (details.stripeTierUsd != null && details.stripeTierUsd.length > 0) {
    payload.stripe_tier_usd = details.stripeTierUsd;
  }
  if (details.method) payload.method = details.method;
  if (details.nudge_mode != null) payload.nudge_mode = details.nudge_mode;

  window.gtag("event", name, payload);
}

/**
 * @description Film Lab スマートルック（非 PII）。GA4 に送るイベント名は snake_case。
 */
export function trackFilmLabSmartLookEvent(
  name: "film_lab_smart_look_request" | "film_lab_smart_look_consent",
  details: {
    locale: string;
    ok?: boolean;
    provider?: string;
    latency_bucket?: string;
    preset_id?: string;
    version?: number;
  },
) {
  if (!window.gtag || !GA_MEASUREMENT_ID) return;
  const payload: Record<string, string | number | boolean | undefined> = {
    locale: details.locale,
  };
  if (details.ok !== undefined) payload.ok = details.ok;
  if (details.provider != null) payload.provider = details.provider;
  if (details.latency_bucket != null) payload.latency_bucket = details.latency_bucket;
  if (details.preset_id != null) payload.preset_id = details.preset_id;
  if (details.version !== undefined) payload.consent_version = details.version;
  window.gtag("event", name, payload);
}

export function trackPhotographyLead(details: {
  locale: string;
  eventType: string;
}) {
  const payload = {
    content_name: "photography_inquiry",
    content_category: "lead",
    status: "submitted",
    locale: details.locale,
    event_type: details.eventType || "unknown",
  };

  if (window.gtag && GA_MEASUREMENT_ID) {
    window.gtag("event", "generate_lead", payload);
  }

  if (window.fbq && META_PIXEL_ID) {
    window.fbq("track", "Contact", payload);
  }
}
