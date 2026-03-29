/**
 * @file Film Lab スマートルック BFF（課金者 + 同意済みのみ）。
 * @description 画像 base64 を受け、mock または OpenAI Vision でデルタ JSON を返す。API キーはサーバーのみ。
 * @limitations 画像本文・Base64 はログに出さない。KV 未設定時は日次上限なし（本番では Vercel KV を推奨）。
 */

import { createHmac } from "crypto";
import { kv } from "@vercel/kv";
import { NextResponse, type NextRequest } from "next/server";
import {
  FILM_LAB_SUPPORTER_COOKIE_NAME,
  filmLabVerifySupporterCookieValue,
} from "@/features/interactive/film-lab/film-lab-donation-cookie-signing";
import {
  FILM_LAB_SMART_LOOK_ERROR_CODES,
  extractSmartLookDeltaFromAssistantJson,
  filmLabSmartLookRequestSchema,
  isFilmLabPresetIdForSmartLook,
  parseAndClampSmartLookDelta,
  parseJsonObjectFromAssistantText,
  type FilmLabSmartLookDelta,
} from "@/features/interactive/film-lab/film-lab-smart-look";

export const runtime = "nodejs";

const MOCK_DELTA: FilmLabSmartLookDelta = {
  exposure: 0.06,
  temperature: -0.03,
  saturation: 0.04,
};

/** @description 日次上限超過（429 を返すための識別用）。 */
class SmartLookRateLimitedError extends Error {
  constructor() {
    super("rate_limit_exceeded");
    this.name = "SmartLookRateLimitedError";
  }
}

/**
 * @description Vercel KV の REST 資格情報が揃っているときだけ true。
 */
function isKvRateLimitConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL?.trim() && process.env.KV_REST_API_TOKEN?.trim());
}

/**
 * @description 1 支援者あたりの 1 日あたり成功回数の上限（UTC 暦日）。環境変数で上書き可。
 */
function getSmartLookDailyLimit(): number {
  const raw = process.env.FILM_LAB_SMART_LOOK_RL_PER_DAY?.trim();
  if (!raw) return 50;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 10_000) : 50;
}

/**
 * @description レート制限用 KV キー。`pi` 平文はキーに載せず HMAC で短縮ハッシュする。
 */
function buildSmartLookRateLimitKey(signingSecret: string, paymentIntentId: string): string {
  const ymd = new Date().toISOString().slice(0, 10);
  const idHash = createHmac("sha256", signingSecret)
    .update(`smartlook_rl:${paymentIntentId}`)
    .digest("hex")
    .slice(0, 40);
  return `smartlook:rl:${idHash}:${ymd}`;
}

/**
 * @description 本日分の利用回数が上限未満か確認する。KV 障害時は失敗を握りつぶして通す（fail-open）。
 */
async function assertUnderSmartLookDailyLimit(
  signingSecret: string,
  paymentIntentId: string,
): Promise<void> {
  if (!isKvRateLimitConfigured()) return;
  try {
    const limit = getSmartLookDailyLimit();
    const key = buildSmartLookRateLimitKey(signingSecret, paymentIntentId);
    const used = (await kv.get<number>(key)) ?? 0;
    if (used >= limit) {
      throw new SmartLookRateLimitedError();
    }
  } catch (e) {
    if (e instanceof SmartLookRateLimitedError) throw e;
    console.error("[FilmLab smart-look] KV rate-limit check failed (fail-open)", e);
  }
}

/**
 * @description 成功レスポンスを返す直前に 1 加算する。KV 障害時はログのみ。
 */
async function recordSuccessfulSmartLookUsage(
  signingSecret: string,
  paymentIntentId: string,
): Promise<void> {
  if (!isKvRateLimitConfigured()) return;
  try {
    const key = buildSmartLookRateLimitKey(signingSecret, paymentIntentId);
    await kv.incr(key);
  } catch (e) {
    console.error("[FilmLab smart-look] KV incr failed (usage not counted)", e);
  }
}

/**
 * @description OpenAI Chat Completions（Vision）でデルタを生成。フェンス付き JSON や説明文混じりに耐える。
 */
async function smartLookFromOpenAi(
  imageBase64: string,
  mimeType: string,
  presetId: string,
): Promise<
  | { ok: true; delta: FilmLabSmartLookDelta; model: string }
  | {
      ok: false;
      code:
        | typeof FILM_LAB_SMART_LOOK_ERROR_CODES.providerError
        | typeof FILM_LAB_SMART_LOOK_ERROR_CODES.smartLookInvalidResponse;
    }
> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[FilmLab smart-look] OPENAI_API_KEY missing while provider=openai");
    return { ok: false, code: FILM_LAB_SMART_LOOK_ERROR_CODES.providerError };
  }

  const dataUrl = `data:${mimeType};base64,${imageBase64}`;
  const systemPrompt = [
    "You are a color grading assistant for a film-look web app.",
    "Output ONLY valid JSON with shape: {\"delta\":{...}}.",
    "delta may include optional keys: exposure, temperature, tint, saturation, highlights, shadows, fade.",
    "Each value is a SMALL number ADDED to the user's current grade (typical magnitude under 0.15).",
    `The user selected preset: ${presetId}. Respect that film intent; do not suggest HDR or plastic skin.`,
    "If unsure, return {} or very small exposure/temperature tweaks.",
  ].join(" ");

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
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
  } catch (e) {
    console.error("[FilmLab smart-look] OpenAI fetch failed", e);
    return { ok: false, code: FILM_LAB_SMART_LOOK_ERROR_CODES.providerError };
  }

  if (!res.ok) {
    console.warn(`[FilmLab smart-look] OpenAI HTTP ${res.status} (presetId=${presetId})`);
    return { ok: false, code: FILM_LAB_SMART_LOOK_ERROR_CODES.providerError };
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) {
    console.warn(`[FilmLab smart-look] empty OpenAI content (presetId=${presetId})`);
    return { ok: false, code: FILM_LAB_SMART_LOOK_ERROR_CODES.providerError };
  }

  const parsedWrapper = parseJsonObjectFromAssistantText(text);
  if (!parsedWrapper.ok) {
    console.warn(
      `[FilmLab smart-look] assistant text is not JSON object, len=${text.length} (presetId=${presetId})`,
    );
    return { ok: false, code: FILM_LAB_SMART_LOOK_ERROR_CODES.smartLookInvalidResponse };
  }

  const delta = extractSmartLookDeltaFromAssistantJson(parsedWrapper.value);
  if (delta == null) {
    console.warn(`[FilmLab smart-look] invalid delta after clamp (presetId=${presetId})`);
    return { ok: false, code: FILM_LAB_SMART_LOOK_ERROR_CODES.smartLookInvalidResponse };
  }

  return { ok: true, delta, model: "gpt-4o-mini" };
}

/**
 * @description POST JSON ボディでスマートルックを要求。
 */
export async function POST(req: NextRequest) {
  const signSecret = process.env.FILM_LAB_DONATION_SIGNING_SECRET?.trim() ?? "";
  if (!signSecret) {
    return NextResponse.json(
      { ok: false as const, code: FILM_LAB_SMART_LOOK_ERROR_CODES.notConfigured },
      { status: 503 },
    );
  }

  const cookieToken = req.cookies.get(FILM_LAB_SUPPORTER_COOKIE_NAME)?.value;
  const verifiedPayload =
    cookieToken != null ? filmLabVerifySupporterCookieValue(cookieToken, signSecret) : null;
  if (verifiedPayload == null) {
    return NextResponse.json(
      { ok: false as const, code: FILM_LAB_SMART_LOOK_ERROR_CODES.forbiddenNotSupporter },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false as const, code: FILM_LAB_SMART_LOOK_ERROR_CODES.badJson },
      { status: 400 },
    );
  }

  const parsed = filmLabSmartLookRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false as const, code: FILM_LAB_SMART_LOOK_ERROR_CODES.invalidBody },
      { status: 400 },
    );
  }

  const { presetId, imageBase64, mimeType, consentAcknowledged } = parsed.data;
  if (!consentAcknowledged) {
    return NextResponse.json(
      { ok: false as const, code: FILM_LAB_SMART_LOOK_ERROR_CODES.consentRequired },
      { status: 400 },
    );
  }

  if (!isFilmLabPresetIdForSmartLook(presetId)) {
    return NextResponse.json(
      { ok: false as const, code: FILM_LAB_SMART_LOOK_ERROR_CODES.invalidPreset },
      { status: 400 },
    );
  }

  try {
    await assertUnderSmartLookDailyLimit(signSecret, verifiedPayload.pi);
  } catch (e) {
    if (e instanceof SmartLookRateLimitedError) {
      return NextResponse.json(
        { ok: false as const, code: FILM_LAB_SMART_LOOK_ERROR_CODES.rateLimitExceeded },
        { status: 429 },
      );
    }
    throw e;
  }

  const provider = process.env.FILM_LAB_SMART_LOOK_PROVIDER?.trim().toLowerCase() ?? "mock";

  let delta: FilmLabSmartLookDelta;
  let model: string;

  if (provider === "openai") {
    const fromAi = await smartLookFromOpenAi(imageBase64, mimeType, presetId);
    if (!fromAi.ok) {
      const status =
        fromAi.code === FILM_LAB_SMART_LOOK_ERROR_CODES.smartLookInvalidResponse ? 422 : 502;
      return NextResponse.json({ ok: false as const, code: fromAi.code }, { status });
    }
    delta = fromAi.delta;
    model = fromAi.model;
  } else {
    const clamped = parseAndClampSmartLookDelta(MOCK_DELTA);
    delta = clamped ?? MOCK_DELTA;
    model = "mock";
  }

  await recordSuccessfulSmartLookUsage(signSecret, verifiedPayload.pi);

  return NextResponse.json({
    ok: true as const,
    delta,
    model,
    presetId,
  });
}
