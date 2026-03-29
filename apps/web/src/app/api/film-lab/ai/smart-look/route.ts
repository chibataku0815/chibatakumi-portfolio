/**
 * @file Film Lab スマートルック BFF（課金者 + 同意済みのみ）。
 * @description 画像 base64 を受け、mock または OpenAI Vision でデルタ JSON を返す。API キーはサーバーのみ。
 * @limitations 日次レート制限は未実装（マスター P5）。画像はレスポンス後に保持しない。
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  FILM_LAB_SUPPORTER_COOKIE_NAME,
  filmLabVerifySupporterCookieValue,
} from "@/features/interactive/film-lab/film-lab-donation-cookie-signing";
import {
  filmLabSmartLookRequestSchema,
  isFilmLabPresetIdForSmartLook,
  parseAndClampSmartLookDelta,
  type FilmLabSmartLookDelta,
} from "@/features/interactive/film-lab/film-lab-smart-look";

export const runtime = "nodejs";

const MOCK_DELTA: FilmLabSmartLookDelta = {
  exposure: 0.06,
  temperature: -0.03,
  saturation: 0.04,
};

/**
 * @description OpenAI Chat Completions（Vision）でデルタを生成。失敗時は null。
 */
async function smartLookFromOpenAi(
  imageBase64: string,
  mimeType: string,
  presetId: string,
): Promise<FilmLabSmartLookDelta | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const dataUrl = `data:${mimeType};base64,${imageBase64}`;
  const systemPrompt = [
    "You are a color grading assistant for a film-look web app.",
    "Output ONLY valid JSON with shape: {\"delta\":{...}}.",
    "delta may include optional keys: exposure, temperature, tint, saturation, highlights, shadows, fade.",
    "Each value is a SMALL number ADDED to the user's current grade (typical magnitude under 0.15).",
    `The user selected preset: ${presetId}. Respect that film intent; do not suggest HDR or plastic skin.`,
    "If unsure, return {} or very small exposure/temperature tweaks.",
  ].join(" ");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Suggest delta JSON only. Wrap numbers inside key delta.",
            },
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "low" },
            },
          ],
        },
      ],
      max_tokens: 256,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    return null;
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const deltaRaw = (parsed as { delta?: unknown }).delta;
  return parseAndClampSmartLookDelta(deltaRaw ?? parsed);
}

/**
 * @description POST JSON ボディでスマートルックを要求。
 */
export async function POST(req: NextRequest) {
  const signSecret = process.env.FILM_LAB_DONATION_SIGNING_SECRET?.trim() ?? "";
  if (!signSecret) {
    return NextResponse.json({ ok: false as const, code: "not_configured" }, { status: 503 });
  }

  const cookieToken = req.cookies.get(FILM_LAB_SUPPORTER_COOKIE_NAME)?.value;
  const verified =
    cookieToken != null && filmLabVerifySupporterCookieValue(cookieToken, signSecret) !== null;
  if (!verified) {
    return NextResponse.json({ ok: false as const, code: "forbidden_not_supporter" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false as const, code: "bad_json" }, { status: 400 });
  }

  const parsed = filmLabSmartLookRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false as const, code: "invalid_body" }, { status: 400 });
  }

  const { presetId, imageBase64, mimeType, consentAcknowledged } = parsed.data;
  if (!consentAcknowledged) {
    return NextResponse.json({ ok: false as const, code: "consent_required" }, { status: 400 });
  }

  if (!isFilmLabPresetIdForSmartLook(presetId)) {
    return NextResponse.json({ ok: false as const, code: "invalid_preset" }, { status: 400 });
  }

  const provider = process.env.FILM_LAB_SMART_LOOK_PROVIDER?.trim().toLowerCase() ?? "mock";

  let delta: FilmLabSmartLookDelta;
  let model: string;

  if (provider === "openai") {
    const fromAi = await smartLookFromOpenAi(imageBase64, mimeType, presetId);
    if (fromAi == null || Object.keys(fromAi).length === 0) {
      delta = parseAndClampSmartLookDelta(MOCK_DELTA) ?? MOCK_DELTA;
      model = "openai_fallback_mock";
    } else {
      delta = fromAi;
      model = "gpt-4o-mini";
    }
  } else {
    const clamped = parseAndClampSmartLookDelta(MOCK_DELTA);
    delta = clamped ?? MOCK_DELTA;
    model = "mock";
  }

  return NextResponse.json({
    ok: true as const,
    delta,
    model,
    presetId,
  });
}
