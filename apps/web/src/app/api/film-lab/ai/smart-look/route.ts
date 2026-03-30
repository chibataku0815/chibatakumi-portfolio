/**
 * @file Film Lab スマートルック BFF（課金者 + 同意済みのみ）。
 * @description 画像 base64 を受け、mock または OpenAI Vision でデルタ JSON を返す。`includeRasterCorrection` 時は sharp でデルタを PNG に焼き込み `correctedImagePngBase64` を付与。API キーはサーバーのみ。
 * @limitations 画像本文・Base64 はログに出さない。KV 未設定時は日次上限なし（本番では Vercel KV を推奨）。
 */

import { createHmac } from "crypto";
import { kv } from "@vercel/kv";
import { NextResponse, type NextRequest } from "next/server";
import {
  FILM_LAB_SUPPORTER_COOKIE_NAME,
  filmLabVerifySupporterCookieValue,
} from "@/features/interactive/film-lab/film-lab-donation-cookie-signing";
import type { Params } from "film-lab-core";
import {
  FILM_LAB_SMART_LOOK_ERROR_CODES,
  computeSmartLookPresetBaseline,
  extractSmartLookDeltaFromAssistantJson,
  filmLabSmartLookRequestSchema,
  isFilmLabPresetIdForSmartLook,
  parseAndClampSmartLookDelta,
  parseJsonObjectFromAssistantText,
  type FilmLabSmartLookDelta,
} from "film-lab-smart-look";
import { buildCorrectedPngBase64FromSmartLookDelta } from "./apply-raster-correction";

export const runtime = "nodejs";

/**
 * @description Vite レンダラ（例: 127.0.0.1:5173）から Next BFF（:3000）へ `fetch` するための CORS。
 * 本番の公開オリジンは含めない（ローカル hostname のみ）。
 */
function filmLabSmartLookCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin");
  if (origin == null || origin.length === 0) {
    return {};
  }
  let hostname: string;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return {};
  }
  const allowed =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1";
  if (!allowed) {
    return {};
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

/** @description JSON レスポンスにスマートルック用 CORS ヘッダを付与する */
function applySmartLookCors(request: NextRequest, response: NextResponse): NextResponse {
  const cors = filmLabSmartLookCorsHeaders(request);
  for (const [key, value] of Object.entries(cors)) {
    response.headers.set(key, value);
  }
  return response;
}

function smartLookJson(
  request: NextRequest,
  body: unknown,
  init?: ResponseInit,
): NextResponse {
  return applySmartLookCors(request, NextResponse.json(body, init));
}

/** @description ブラウザの cross-origin POST 前プリフライト */
export async function OPTIONS(request: NextRequest) {
  return applySmartLookCors(request, new NextResponse(null, { status: 204 }));
}

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
 * @description Chat Completions 互換 API（既定: OpenAI、または OpenRouter 等）で Vision デルタを生成する。
 * @remarks エンドポイント・キー・モデルは環境変数で差し替え。OpenRouter 例: base `https://openrouter.ai/api/v1`、model `openai/gpt-4o-mini`、Referer/X-Title は任意。
 */
/**
 * @description LLM へ送るスマートルック文脈。`referenceStyle` は **2 枚目の参照画**を主スタイル目標とし、`presetId` は土台・境界の文脈。
 */
type SmartLookOpenAiContext =
  | { semantics: "legacy" }
  | { semantics: "presetBaseline"; baselineGrade: Params; currentGrade: Params }
  | { semantics: "referenceStyle"; baselineGrade: Params; currentGrade: Params };

async function smartLookFromOpenAi(
  imageBase64: string,
  mimeType: string,
  presetId: string,
  ctx: SmartLookOpenAiContext,
  reference: { base64: string; mimeType: string } | null,
): Promise<
  | { ok: true; delta: FilmLabSmartLookDelta; model: string }
  | {
      ok: false;
      code:
        | typeof FILM_LAB_SMART_LOOK_ERROR_CODES.providerError
        | typeof FILM_LAB_SMART_LOOK_ERROR_CODES.smartLookInvalidResponse;
    }
> {
  const apiKey =
    process.env.FILM_LAB_SMART_LOOK_OPENAI_COMPAT_API_KEY?.trim() ??
    process.env.OPENAI_API_KEY?.trim() ??
    "";
  if (!apiKey) {
    console.warn(
      "[FilmLab smart-look] missing API key: set OPENAI_API_KEY or FILM_LAB_SMART_LOOK_OPENAI_COMPAT_API_KEY when provider=openai",
    );
    return { ok: false, code: FILM_LAB_SMART_LOOK_ERROR_CODES.providerError };
  }

  const baseRaw =
    process.env.FILM_LAB_SMART_LOOK_OPENAI_COMPAT_BASE?.trim() || "https://api.openai.com/v1";
  const base = baseRaw.replace(/\/$/, "");
  const completionsUrl = `${base}/chat/completions`;

  const chatModel =
    process.env.FILM_LAB_SMART_LOOK_CHAT_MODEL?.trim() || "gpt-4o-mini";

  const jsonModeOff =
    process.env.FILM_LAB_SMART_LOOK_CHAT_JSON_MODE?.trim().toLowerCase() === "false";

  const sourceDataUrl = `data:${mimeType};base64,${imageBase64}`;
  const systemPromptLegacy = [
    "You are a color grading assistant for a film-look web app.",
    "Output ONLY valid JSON with shape: {\"delta\":{...}}.",
    "delta may include optional keys: exposure, temperature, tint, saturation, highlights, shadows, fade.",
    "Each value is a SMALL number ADDED to the user's current grade (typical magnitude under 0.15).",
    `The user selected preset: ${presetId}. Respect that film intent; do not suggest HDR or plastic skin.`,
    "If unsure, return {} or very small exposure/temperature tweaks.",
  ].join(" ");

  const systemPromptPresetBaseline = [
    "You are a color grading assistant for a film-look desktop-first app.",
    "Output ONLY valid JSON with shape: {\"delta\":{...}}.",
    "delta may include optional keys: exposure, temperature, tint, saturation, highlights, shadows, fade.",
    "Each value is a SMALL number that will be ADDED to the **preset baseline grade** JSON in the user message (not stacked on the user's current numeric grade on the client). Typical magnitude under 0.15 per key.",
    "The first attached image is the user's current preview (already graded); trust the IMAGE as the primary signal. The JSON grades are supporting hints only.",
    `The user selected preset: ${presetId}. Match that film intent; do not suggest HDR or plastic skin.`,
    "If unsure, return {} or very small exposure/temperature tweaks.",
  ].join(" ");

  const systemPromptReferenceStyle = [
    "You are a color grading assistant for a film-look desktop-first app.",
    "Output ONLY valid JSON with shape: {\"delta\":{...}}.",
    "delta may include optional keys: exposure, temperature, tint, saturation, highlights, shadows, fade.",
    "Two images follow in order: (1) SOURCE = photo to adjust. (2) REFERENCE = target **style** (color mood, contrast, balance).",
    "Suggest SMALL deltas (typical under 0.15 per key). They will be ADDED to the **preset baseline** JSON in the user message.",
    `Preset id ${presetId} is the app's **foundation / film intent context**; the REFERENCE image is the **primary style target**. Do not copy irrelevant subject detail from the reference.`,
    "No HDR or plastic skin. If unsure, return {} or minimal tweaks.",
    "Trust the two images; JSON numbers are secondary hints.",
  ].join(" ");

  const systemPrompt =
    ctx.semantics === "referenceStyle"
      ? systemPromptReferenceStyle
      : ctx.semantics === "presetBaseline"
        ? systemPromptPresetBaseline
        : systemPromptLegacy;

  const userTextPreamble =
    ctx.semantics === "referenceStyle" || ctx.semantics === "presetBaseline"
      ? [
          "Preset baseline grade (client adds `delta` to these numbers, then clamps):",
          JSON.stringify(ctx.baselineGrade),
          "",
          "Current client grade JSON (reference; first image should match this look):",
          JSON.stringify(ctx.currentGrade),
          "",
          ctx.semantics === "referenceStyle"
            ? "Move the SOURCE (first image) look toward the REFERENCE (second image) style using delta only. Wrap numbers inside key delta."
            : "Suggest delta JSON only. Wrap numbers inside key delta.",
        ].join("\n")
      : "Suggest delta JSON only. Wrap numbers inside key delta.";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  const referer = process.env.FILM_LAB_SMART_LOOK_HTTP_REFERER?.trim();
  const appTitle = process.env.FILM_LAB_SMART_LOOK_APP_TITLE?.trim();
  if (referer) headers["HTTP-Referer"] = referer;
  if (appTitle) headers["X-Title"] = appTitle;

  const userImageParts: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string; detail: "low" } }
  > = [
    { type: "text", text: userTextPreamble },
    { type: "image_url", image_url: { url: sourceDataUrl, detail: "low" } },
  ];
  if (reference != null) {
    userImageParts.push({
      type: "image_url",
      image_url: {
        url: `data:${reference.mimeType};base64,${reference.base64}`,
        detail: "low",
      },
    });
  }

  const bodyPayload: Record<string, unknown> = {
    model: chatModel,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: userImageParts,
      },
    ],
    max_tokens: 256,
    temperature: 0.2,
  };
  if (!jsonModeOff) {
    bodyPayload.response_format = { type: "json_object" };
  }

  let res: Response;
  try {
    res = await fetch(completionsUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(bodyPayload),
    });
  } catch (e) {
    console.error("[FilmLab smart-look] LLM fetch failed", {
      presetId,
      message: e instanceof Error ? e.message : String(e),
    });
    return { ok: false, code: FILM_LAB_SMART_LOOK_ERROR_CODES.providerError };
  }

  if (!res.ok) {
    const errSnippet = await res.text().catch(() => "");
    console.warn(
      `[FilmLab smart-look] LLM HTTP ${res.status} (presetId=${presetId}) len=${errSnippet.length}`,
    );
    return { ok: false, code: FILM_LAB_SMART_LOOK_ERROR_CODES.providerError };
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    model?: string;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) {
    console.warn(`[FilmLab smart-look] empty LLM content (presetId=${presetId})`);
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

  const reportedModel = typeof json.model === "string" && json.model.length > 0 ? json.model : chatModel;
  return { ok: true, delta, model: reportedModel };
}

/**
 * @description POST JSON ボディでスマートルックを要求。
 */
export async function POST(req: NextRequest) {
  const signSecret = process.env.FILM_LAB_DONATION_SIGNING_SECRET?.trim() ?? "";
  if (!signSecret) {
    return smartLookJson(
      req,
      { ok: false as const, code: FILM_LAB_SMART_LOOK_ERROR_CODES.notConfigured },
      { status: 503 },
    );
  }

  const cookieToken = req.cookies.get(FILM_LAB_SUPPORTER_COOKIE_NAME)?.value;
  let verifiedPayload =
    cookieToken != null ? filmLabVerifySupporterCookieValue(cookieToken, signSecret) : null;

  const desktopDevBypass =
    process.env.NODE_ENV === "development" &&
    process.env.FILM_LAB_SMART_LOOK_ALLOW_DESKTOP_DEV?.trim().toLowerCase() === "true";
  if (verifiedPayload == null && desktopDevBypass) {
    verifiedPayload = {
      pi: "pi_desktop_dev",
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
  }

  if (verifiedPayload == null) {
    return smartLookJson(
      req,
      { ok: false as const, code: FILM_LAB_SMART_LOOK_ERROR_CODES.forbiddenNotSupporter },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return smartLookJson(
      req,
      { ok: false as const, code: FILM_LAB_SMART_LOOK_ERROR_CODES.badJson },
      { status: 400 },
    );
  }

  const parsed = filmLabSmartLookRequestSchema.safeParse(body);
  if (!parsed.success) {
    return smartLookJson(
      req,
      { ok: false as const, code: FILM_LAB_SMART_LOOK_ERROR_CODES.invalidBody },
      { status: 400 },
    );
  }

  const {
    presetId,
    imageBase64,
    mimeType,
    consentAcknowledged,
    includeRasterCorrection,
    currentGrade,
    basePreset: requestSlotBasePreset,
    intensity: requestSlotIntensity,
    referenceImageBase64,
    referenceMimeType,
  } = parsed.data;
  /**
   * @description `filmLabParamsSchema` は `ZodRawShape` 経由のため、型推論上は `Record<string, unknown>`
   *   も混ざることがあります。ここは `safeParse` 後で runtime 検証済みなので、BFF 内では `Params`
   *   として扱って問題ありません。
   */
  const normalizedCurrentGrade = currentGrade as Params | undefined;
  if (!consentAcknowledged) {
    return smartLookJson(
      req,
      { ok: false as const, code: FILM_LAB_SMART_LOOK_ERROR_CODES.consentRequired },
      { status: 400 },
    );
  }

  if (!isFilmLabPresetIdForSmartLook(presetId)) {
    return smartLookJson(
      req,
      { ok: false as const, code: FILM_LAB_SMART_LOOK_ERROR_CODES.invalidPreset },
      { status: 400 },
    );
  }

  /** @description クライアントと同じ式で baseline を再計算（プロンプトと適用規則の一致用）。 */
  const smartLookBaseline = computeSmartLookPresetBaseline({
    targetPresetId: presetId,
    slotBasePreset: requestSlotBasePreset ?? null,
    slotIntensity: requestSlotIntensity ?? 1,
  });

  const referencePayload =
    referenceImageBase64 != null && referenceMimeType != null
      ? { base64: referenceImageBase64, mimeType: referenceMimeType }
      : null;

  try {
    await assertUnderSmartLookDailyLimit(signSecret, verifiedPayload.pi);
  } catch (e) {
    if (e instanceof SmartLookRateLimitedError) {
      return smartLookJson(
        req,
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
    let openAiCtx: SmartLookOpenAiContext;
    if (referencePayload != null) {
      /**
       * @description `normalizedCurrentGrade` は Zod 推論上 `Record<string, unknown>` が混ざるため、`??` の結果が
       *   `Params` とみなされない。runtime は `safeParse` 済みなので `Params` に固定する。
       */
      const gradeForPrompt: Params = (normalizedCurrentGrade ??
        smartLookBaseline) as Params;
      openAiCtx = {
        semantics: "referenceStyle",
        baselineGrade: smartLookBaseline,
        currentGrade: gradeForPrompt,
      };
    } else if (normalizedCurrentGrade != null) {
      openAiCtx = {
        semantics: "presetBaseline",
        baselineGrade: smartLookBaseline,
        currentGrade: normalizedCurrentGrade,
      };
    } else {
      openAiCtx = { semantics: "legacy" };
    }
    const fromAi = await smartLookFromOpenAi(
      imageBase64,
      mimeType,
      presetId,
      openAiCtx,
      referencePayload,
    );
    if (!fromAi.ok) {
      const status =
        fromAi.code === FILM_LAB_SMART_LOOK_ERROR_CODES.smartLookInvalidResponse ? 422 : 502;
      return smartLookJson(req, { ok: false as const, code: fromAi.code }, { status });
    }
    delta = fromAi.delta;
    model = fromAi.model;
  } else {
    const clamped = parseAndClampSmartLookDelta(MOCK_DELTA);
    delta = clamped ?? MOCK_DELTA;
    model = "mock";
  }

  await recordSuccessfulSmartLookUsage(signSecret, verifiedPayload.pi);

  let correctedImagePngBase64: string | undefined;
  if (includeRasterCorrection === true) {
    const raster = await buildCorrectedPngBase64FromSmartLookDelta(imageBase64, delta);
    if (raster.ok) {
      correctedImagePngBase64 = raster.base64;
    } else {
      console.error(
        "[FilmLab smart-look] raster correction failed (delta-only response)",
        raster.message,
      );
    }
  }

  return smartLookJson(req, {
    ok: true as const,
    delta,
    model,
    presetId,
    ...(correctedImagePngBase64 != null ? { correctedImagePngBase64 } : {}),
  });
}
