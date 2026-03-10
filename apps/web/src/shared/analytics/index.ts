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
