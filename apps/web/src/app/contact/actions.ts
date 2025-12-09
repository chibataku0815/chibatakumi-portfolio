"use server";

// =============================================================================
// Contact Form Server Action
// Slack Webhook Integration
// =============================================================================

export interface ContactFormState {
  success: boolean;
  error?: string;
  fieldErrors?: {
    name?: string;
    email?: string;
    company?: string;
    inquiryType?: string;
    message?: string;
  };
}

interface ContactFormData {
  name: string;
  email: string;
  company: string;
  inquiryType: string;
  message: string;
}

// Simple email validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate form data
function validateFormData(data: ContactFormData): ContactFormState["fieldErrors"] {
  const errors: ContactFormState["fieldErrors"] = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = "お名前を入力してください";
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.email = "有効なメールアドレスを入力してください";
  }

  if (!data.inquiryType) {
    errors.inquiryType = "ご相談内容を選択してください";
  }

  if (!data.message || data.message.trim().length < 10) {
    errors.message = "メッセージを10文字以上で入力してください";
  }

  return Object.keys(errors).length > 0 ? errors : undefined;
}

// Format message for Slack
function formatSlackMessage(data: ContactFormData): object {
  const inquiryLabels: Record<string, string> = {
    project: "新規プロジェクト",
    consultation: "技術相談",
    collaboration: "コラボレーション",
    other: "その他",
  };

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
          {
            type: "mrkdwn",
            text: `*お名前*\n${data.name}`,
          },
          {
            type: "mrkdwn",
            text: `*メールアドレス*\n${data.email}`,
          },
        ],
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*会社名/所属*\n${data.company || "-"}`,
          },
          {
            type: "mrkdwn",
            text: `*ご相談内容*\n${inquiryLabels[data.inquiryType] || data.inquiryType}`,
          },
        ],
      },
      {
        type: "divider",
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*メッセージ*\n${data.message}`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Sent at ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`,
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
  // Extract form data
  const data: ContactFormData = {
    name: formData.get("name") as string || "",
    email: formData.get("email") as string || "",
    company: formData.get("company") as string || "",
    inquiryType: formData.get("inquiryType") as string || "",
    message: formData.get("message") as string || "",
  };

  // Validate
  const fieldErrors = validateFormData(data);
  if (fieldErrors) {
    return { success: false, fieldErrors };
  }

  // Send to Slack
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error("SLACK_WEBHOOK_URL is not configured");
    // In development, just log and succeed
    if (process.env.NODE_ENV === "development") {
      console.log("Contact form submission (dev mode):", data);
      return { success: true };
    }
    return { success: false, error: "送信設定が構成されていません" };
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
    return { success: false, error: "送信に失敗しました。しばらくしてから再度お試しください。" };
  }
}
