"use server";

import { getTranslations } from "next-intl/server";

// =============================================================================
// Contact Form Server Action
// Slack Webhook Integration
// Renewal 2026 reset (parent plan §4.1 / §5.4): minimal, localized contact
// channel.
// - Inquiry-type radio and company field were removed because they read as a
//   service-funnel and made false promises about offerings that belong to the
//   /photography and /filmtone satellite LPs.
// - Locale is forwarded from the client via a hidden form field so error
//   strings render in the visitor's language.
// =============================================================================

const SUPPORTED_LOCALES = ["ja", "en"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

function resolveLocale(raw: FormDataEntryValue | null): SupportedLocale {
  return SUPPORTED_LOCALES.includes(raw as SupportedLocale)
    ? (raw as SupportedLocale)
    : "ja";
}

export interface ContactFormState {
  success: boolean;
  error?: string;
  fieldErrors?: {
    name?: string;
    email?: string;
    message?: string;
  };
}

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateFormData(
  data: ContactFormData,
  errorStrings: { name: string; email: string; message: string }
): ContactFormState["fieldErrors"] {
  const errors: ContactFormState["fieldErrors"] = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = errorStrings.name;
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.email = errorStrings.email;
  }

  if (!data.message || data.message.trim().length < 10) {
    errors.message = errorStrings.message;
  }

  return Object.keys(errors).length > 0 ? errors : undefined;
}

function formatSlackMessage(data: ContactFormData, locale: SupportedLocale): object {
  return {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "New Contact Form Submission",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Name*\n${data.name}` },
          { type: "mrkdwn", text: `*Email*\n${data.email}` },
        ],
      },
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Message*\n${data.message}`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Locale: ${locale} — Sent at ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`,
          },
        ],
      },
    ],
  };
}

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const locale = resolveLocale(formData.get("locale"));
  const t = await getTranslations({ locale, namespace: "contact.form.errors" });

  const data: ContactFormData = {
    name: (formData.get("name") as string) || "",
    email: (formData.get("email") as string) || "",
    message: (formData.get("message") as string) || "",
  };

  const fieldErrors = validateFormData(data, {
    name: t("name"),
    email: t("email"),
    message: t("message"),
  });
  if (fieldErrors) {
    return { success: false, fieldErrors };
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("SLACK_WEBHOOK_URL is not configured");
    if (process.env.NODE_ENV === "development") {
      console.log("Contact form submission (dev mode):", { ...data, locale });
      return { success: true };
    }
    return { success: false, error: t("config") };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formatSlackMessage(data, locale)),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send to Slack:", error);
    return { success: false, error: t("send") };
  }
}
