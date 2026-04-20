/**
 * @file Dev-only PoC: AI scene-pick BFF route.
 * @description Accepts sampled frame thumbnails from the Desktop renderer and
 * returns a constrained JSON decision for which frame best represents the clip.
 * Shares env convention with smart-look (`FILM_LAB_SMART_LOOK_*`) so the same
 * OpenRouter/OpenAI-compatible key works for both. Only enabled when
 * `NODE_ENV === "development"` AND `FILM_LAB_SMART_LOOK_ALLOW_DESKTOP_DEV=true`.
 * @limitations Image payloads and base64 are never logged. No rate-limit or
 * supporter-cookie auth — this must not be deployed.
 */

import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

type ScenePickFrameInput = {
  index: number;
  timeSec: number;
  jpegDataUrl: string;
};

type ScenePickRequestBody = {
  sourcePath: string;
  trimStartSec: number;
  trimEndSec: number;
  frames: ScenePickFrameInput[];
};

type ScenePickDecision = {
  bestFrameIndex: number | null;
  family: "mist" | "glow" | "cross" | "lens" | null;
  recipe:
    | "warmIndoor"
    | "nightCity"
    | "skinCloseUp"
    | "nightSpot"
    | "productEdge"
    | "coverStillMatch"
    | null;
  confidence: "low" | "medium" | "high";
  manualFallback: boolean;
  reason: string;
};

const SCENE_PICK_ERRORS = {
  notConfigured: "not_configured",
  forbidden: "forbidden",
  badJson: "bad_json",
  invalidBody: "invalid_body",
  providerError: "provider_error",
  invalidResponse: "invalid_response",
} as const;

const VALID_FAMILY = new Set(["mist", "glow", "cross", "lens"]);
const VALID_RECIPE = new Set([
  "warmIndoor",
  "nightCity",
  "skinCloseUp",
  "nightSpot",
  "productEdge",
  "coverStillMatch",
]);
const VALID_CONFIDENCE = new Set(["low", "medium", "high"]);

function scenePickCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin");
  if (!origin) return {};
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
  if (!allowed) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function applyCors(request: NextRequest, response: NextResponse): NextResponse {
  const headers = scenePickCorsHeaders(request);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

function scenePickJson(
  request: NextRequest,
  body: unknown,
  init?: ResponseInit,
): NextResponse {
  return applyCors(request, NextResponse.json(body, init));
}

export async function OPTIONS(request: NextRequest) {
  return applyCors(request, new NextResponse(null, { status: 204 }));
}

function validateRequestBody(raw: unknown):
  | { ok: true; body: ScenePickRequestBody }
  | { ok: false } {
  if (raw == null || typeof raw !== "object") return { ok: false };
  const record = raw as Record<string, unknown>;
  if (typeof record.sourcePath !== "string") return { ok: false };
  if (typeof record.trimStartSec !== "number") return { ok: false };
  if (typeof record.trimEndSec !== "number") return { ok: false };
  if (!Array.isArray(record.frames) || record.frames.length === 0) {
    return { ok: false };
  }
  const frames: ScenePickFrameInput[] = [];
  for (const frame of record.frames) {
    if (frame == null || typeof frame !== "object") return { ok: false };
    const f = frame as Record<string, unknown>;
    if (typeof f.index !== "number") return { ok: false };
    if (typeof f.timeSec !== "number") return { ok: false };
    if (typeof f.jpegDataUrl !== "string") return { ok: false };
    if (!f.jpegDataUrl.startsWith("data:image/")) return { ok: false };
    frames.push({
      index: f.index,
      timeSec: f.timeSec,
      jpegDataUrl: f.jpegDataUrl,
    });
  }
  if (frames.length > 16) return { ok: false };
  return {
    ok: true,
    body: {
      sourcePath: record.sourcePath,
      trimStartSec: record.trimStartSec,
      trimEndSec: record.trimEndSec,
      frames,
    },
  };
}

function normalizeDecision(raw: unknown): ScenePickDecision | null {
  if (raw == null || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;

  const bestFrameIndex =
    typeof record.bestFrameIndex === "number" &&
    Number.isFinite(record.bestFrameIndex)
      ? Math.round(record.bestFrameIndex)
      : typeof record.best_frame_index === "number" &&
          Number.isFinite(record.best_frame_index)
        ? Math.round(record.best_frame_index as number)
        : null;

  const familyRaw =
    typeof record.family === "string" ? record.family : null;
  const family =
    familyRaw != null && VALID_FAMILY.has(familyRaw)
      ? (familyRaw as ScenePickDecision["family"])
      : null;

  const recipeRaw =
    typeof record.recipe === "string" ? record.recipe : null;
  const recipe =
    recipeRaw != null && VALID_RECIPE.has(recipeRaw)
      ? (recipeRaw as ScenePickDecision["recipe"])
      : null;

  const confidenceRaw =
    typeof record.confidence === "string" ? record.confidence : "low";
  const confidence =
    VALID_CONFIDENCE.has(confidenceRaw)
      ? (confidenceRaw as ScenePickDecision["confidence"])
      : "low";

  const manualFallback = record.manualFallback === true || record.manual_fallback === true;

  const reasonRaw = typeof record.reason === "string" ? record.reason : "";
  const reason = reasonRaw.trim().slice(0, 500);

  return {
    bestFrameIndex,
    family,
    recipe,
    confidence,
    manualFallback,
    reason,
  };
}

function mockDecision(frameCount: number): ScenePickDecision {
  const bestFrameIndex = Math.max(0, Math.min(frameCount - 1, Math.floor(frameCount / 2)));
  return {
    bestFrameIndex,
    family: "glow",
    recipe: "warmIndoor",
    confidence: "medium",
    manualFallback: false,
    reason: "[mock] centered frame chosen; no LLM called.",
  };
}

async function decideViaLlm(
  body: ScenePickRequestBody,
): Promise<
  | { ok: true; decision: ScenePickDecision; model: string }
  | { ok: false; code: string }
> {
  const apiKey =
    process.env.FILM_LAB_SMART_LOOK_OPENAI_COMPAT_API_KEY?.trim() ??
    process.env.OPENAI_API_KEY?.trim() ??
    "";
  if (!apiKey) {
    console.warn(
      "[FilmLab scene-pick] missing API key (FILM_LAB_SMART_LOOK_OPENAI_COMPAT_API_KEY or OPENAI_API_KEY)",
    );
    return { ok: false, code: SCENE_PICK_ERRORS.providerError };
  }

  const baseRaw =
    process.env.FILM_LAB_SMART_LOOK_OPENAI_COMPAT_BASE?.trim() ||
    "https://api.openai.com/v1";
  const base = baseRaw.replace(/\/$/, "");
  const completionsUrl = `${base}/chat/completions`;

  const chatModel =
    process.env.FILM_LAB_SMART_LOOK_CHAT_MODEL?.trim() || "gpt-4o-mini";
  const jsonModeOff =
    process.env.FILM_LAB_SMART_LOOK_CHAT_JSON_MODE?.trim().toLowerCase() === "false";

  const systemPrompt = [
    "You are picking ONE representative frame for a video clip's color grade.",
    "You will receive N thumbnails with their frame index and timestamp.",
    "Return STRICT JSON: {\"bestFrameIndex\":int|null,\"family\":\"mist\"|\"glow\"|\"cross\"|\"lens\"|null,\"recipe\":\"warmIndoor\"|\"nightCity\"|\"skinCloseUp\"|\"nightSpot\"|\"productEdge\"|\"coverStillMatch\"|null,\"confidence\":\"low\"|\"medium\"|\"high\",\"manualFallback\":bool,\"reason\":string}.",
    "Vocabulary is closed; invent nothing. If the clip is mixed, shot changes are heavy, or no single frame represents the whole clip, set manualFallback:true, confidence:low, family:null, recipe:null.",
    "Mapping hints: glow+warmIndoor = warm practical lights indoor; glow+nightCity = city night bloom; mist+skinCloseUp = daylight portrait; cross+nightSpot = sharp point lights at night; lens+productEdge = product/detail; lens+coverStillMatch = cover-style stills. If none fit, manualFallback:true.",
    "Write `reason` in Japanese, under 120 chars, focusing on what in the chosen frame drove the decision.",
  ].join(" ");

  const userText = [
    `Clip: ${body.sourcePath}`,
    `Trim: ${body.trimStartSec.toFixed(3)}s → ${body.trimEndSec.toFixed(3)}s`,
    `Frames follow in order with their index and timestamp.`,
    "Return JSON only.",
  ].join("\n");

  const imageParts: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string; detail: "low" } }
  > = [{ type: "text", text: userText }];

  for (const frame of body.frames) {
    imageParts.push({
      type: "text",
      text: `frame index=${frame.index} t=${frame.timeSec.toFixed(3)}s`,
    });
    imageParts.push({
      type: "image_url",
      image_url: { url: frame.jpegDataUrl, detail: "low" },
    });
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  const referer = process.env.FILM_LAB_SMART_LOOK_HTTP_REFERER?.trim();
  const appTitle = process.env.FILM_LAB_SMART_LOOK_APP_TITLE?.trim();
  if (referer) headers["HTTP-Referer"] = referer;
  if (appTitle) headers["X-Title"] = appTitle;

  const bodyPayload: Record<string, unknown> = {
    model: chatModel,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: imageParts },
    ],
    max_tokens: 2000,
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
    console.error("[FilmLab scene-pick] LLM fetch failed", {
      message: e instanceof Error ? e.message : String(e),
    });
    return { ok: false, code: SCENE_PICK_ERRORS.providerError };
  }

  if (!res.ok) {
    const errSnippet = await res.text().catch(() => "");
    console.warn(
      `[FilmLab scene-pick] LLM HTTP ${res.status} len=${errSnippet.length}`,
    );
    return { ok: false, code: SCENE_PICK_ERRORS.providerError };
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    model?: string;
  };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) {
    console.warn("[FilmLab scene-pick] empty LLM content");
    return { ok: false, code: SCENE_PICK_ERRORS.providerError };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.warn(
        `[FilmLab scene-pick] no JSON object in LLM content len=${text.length}`,
        text.slice(0, 2000),
      );
      return { ok: false, code: SCENE_PICK_ERRORS.invalidResponse };
    }
    try {
      parsed = JSON.parse(match[0]) as unknown;
    } catch {
      console.warn(
        "[FilmLab scene-pick] secondary JSON.parse failed",
        match[0].slice(0, 500),
      );
      return { ok: false, code: SCENE_PICK_ERRORS.invalidResponse };
    }
  }

  const decision = normalizeDecision(parsed);
  if (!decision) {
    console.warn(
      "[FilmLab scene-pick] normalizeDecision rejected",
      JSON.stringify(parsed).slice(0, 500),
    );
    return { ok: false, code: SCENE_PICK_ERRORS.invalidResponse };
  }

  const boundedIndex =
    decision.bestFrameIndex != null &&
    decision.bestFrameIndex >= 0 &&
    decision.bestFrameIndex < body.frames.length
      ? decision.bestFrameIndex
      : null;

  const reportedModel =
    typeof json.model === "string" && json.model.length > 0
      ? json.model
      : chatModel;

  return {
    ok: true,
    decision: { ...decision, bestFrameIndex: boundedIndex },
    model: reportedModel,
  };
}

export async function POST(request: NextRequest) {
  const desktopDevBypass =
    process.env.NODE_ENV === "development" &&
    process.env.FILM_LAB_SMART_LOOK_ALLOW_DESKTOP_DEV?.trim().toLowerCase() ===
      "true";

  if (!desktopDevBypass) {
    return scenePickJson(
      request,
      { ok: false as const, code: SCENE_PICK_ERRORS.forbidden },
      { status: 403 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return scenePickJson(
      request,
      { ok: false as const, code: SCENE_PICK_ERRORS.badJson },
      { status: 400 },
    );
  }

  const validated = validateRequestBody(raw);
  if (!validated.ok) {
    return scenePickJson(
      request,
      { ok: false as const, code: SCENE_PICK_ERRORS.invalidBody },
      { status: 400 },
    );
  }

  const provider =
    process.env.FILM_LAB_SMART_LOOK_PROVIDER?.trim().toLowerCase() ?? "mock";

  if (provider === "openai") {
    const result = await decideViaLlm(validated.body);
    if (!result.ok) {
      const status =
        result.code === SCENE_PICK_ERRORS.invalidResponse ? 422 : 502;
      return scenePickJson(
        request,
        { ok: false as const, code: result.code },
        { status },
      );
    }
    return scenePickJson(request, {
      ok: true as const,
      pick: result.decision,
      model: result.model,
    });
  }

  return scenePickJson(request, {
    ok: true as const,
    pick: mockDecision(validated.body.frames.length),
    model: "mock",
  });
}
