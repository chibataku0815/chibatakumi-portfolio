"use server";

// =============================================================================
// Photography Inquiry Server Action
// Slack Webhook Integration
// =============================================================================

export interface PhotographyFormState {
  success: boolean;
  error?: string;
  fieldErrors?: {
    name?: string;
    email?: string;
    eventType?: string;
  };
}

interface PhotographyFormData {
  name: string;
  email: string;
  eventType: string;
  eventDate: string;
  attendees: string;
  details: string;
  source: string;
  locale: string;
  pagePath: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const ERROR_MESSAGES = {
  en: {
    name: "Please enter your name",
    email: "Please enter a valid email address",
    eventType: "Please select an event type",
    submitConfig: "Submission configuration is not set up.",
    submitFailed: "Failed to send. Please try again later.",
  },
  ja: {
    name: "お名前を入力してください",
    email: "有効なメールアドレスを入力してください",
    eventType: "イベントの種類を選択してください",
    submitConfig: "送信設定が構成されていません。",
    submitFailed: "送信に失敗しました。しばらくしてから再度お試しください。",
  },
} as const;

function validateFormData(
  data: PhotographyFormData
): PhotographyFormState["fieldErrors"] {
  const msgs = ERROR_MESSAGES[data.locale === "ja" ? "ja" : "en"];
  const errors: PhotographyFormState["fieldErrors"] = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = msgs.name;
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.email = msgs.email;
  }

  if (!data.eventType) {
    errors.eventType = msgs.eventType;
  }

  return Object.keys(errors).length > 0 ? errors : undefined;
}

function formatSlackMessage(data: PhotographyFormData): object {
  const blocks: object[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "📸 New Photography Inquiry",
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Name*\n${data.name}`,
        },
        {
          type: "mrkdwn",
          text: `*Email*\n${data.email}`,
        },
      ],
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Event Type*\n${data.eventType}`,
        },
        {
          type: "mrkdwn",
          text: `*Event Date*\n${data.eventDate || "Not specified"}`,
        },
      ],
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Estimated Attendees*\n${data.attendees || "Not specified"}`,
        },
        {
          type: "mrkdwn",
          text: `*Locale*\n${data.locale}`,
        },
        {
          type: "mrkdwn",
          text: `*Page*\n${data.pagePath || "/photography"}`,
        },
      ],
    },
  ];

  if (
    data.utmSource ||
    data.utmMedium ||
    data.utmCampaign ||
    data.utmContent ||
    data.utmTerm
  ) {
    blocks.push(
      { type: "divider" },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*UTM Source*\n${data.utmSource || "-"}`,
          },
          {
            type: "mrkdwn",
            text: `*UTM Medium*\n${data.utmMedium || "-"}`,
          },
          {
            type: "mrkdwn",
            text: `*UTM Campaign*\n${data.utmCampaign || "-"}`,
          },
          {
            type: "mrkdwn",
            text: `*UTM Content*\n${data.utmContent || "-"}`,
          },
          {
            type: "mrkdwn",
            text: `*UTM Term*\n${data.utmTerm || "-"}`,
          },
        ],
      }
    );
  }

  if (data.details) {
    blocks.push(
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Additional Details*\n${data.details}`,
        },
      }
    );
  }

  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Source: Photography LP | ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`,
      },
    ],
  });

  return { blocks };
}

export async function submitPhotographyInquiry(
  _prevState: PhotographyFormState,
  formData: FormData
): Promise<PhotographyFormState> {
  const data: PhotographyFormData = {
    name: (formData.get("name") as string) || "",
    email: (formData.get("email") as string) || "",
    eventType: (formData.get("eventType") as string) || "",
    eventDate: (formData.get("eventDate") as string) || "",
    attendees: (formData.get("attendees") as string) || "",
    details: (formData.get("details") as string) || "",
    source: (formData.get("source") as string) || "photography",
    locale: (formData.get("locale") as string) || "ja",
    pagePath: (formData.get("pagePath") as string) || "",
    utmSource: (formData.get("utmSource") as string) || "",
    utmMedium: (formData.get("utmMedium") as string) || "",
    utmCampaign: (formData.get("utmCampaign") as string) || "",
    utmContent: (formData.get("utmContent") as string) || "",
    utmTerm: (formData.get("utmTerm") as string) || "",
  };

  const msgs = ERROR_MESSAGES[data.locale === "ja" ? "ja" : "en"];
  const fieldErrors = validateFormData(data);
  if (fieldErrors) {
    return { success: false, fieldErrors };
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("SLACK_WEBHOOK_URL is not configured");
    if (process.env.NODE_ENV === "development") {
      console.log("Photography inquiry (dev mode):", data);
      return { success: true };
    }
    return { success: false, error: msgs.submitConfig };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formatSlackMessage(data)),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send to Slack:", error);
    return {
      success: false,
      error: msgs.submitFailed,
    };
  }
}
