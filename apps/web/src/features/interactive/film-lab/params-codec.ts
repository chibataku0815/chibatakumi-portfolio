import { PRESETS } from "./preset-data";
import { PARAM_KEYS, type Params } from "./types";

function encodeBase64(value: string): string {
  if (typeof window === "undefined") {
    return Buffer.from(value, "utf8").toString("base64");
  }

  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return window.btoa(binary);
}

function decodeBase64(value: string): string {
  if (typeof window === "undefined") {
    return Buffer.from(value, "base64").toString("utf8");
  }

  const binary = window.atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function coerceParams(value: unknown): Params | null {
  if (!value || typeof value !== "object") return null;

  const candidate = value as Record<string, unknown>;
  const params: Params = { ...PRESETS.reset };
  let found = false;

  for (const key of PARAM_KEYS) {
    const nextValue = candidate[key];
    if (nextValue === undefined) continue;
    if (typeof nextValue !== "number" || !Number.isFinite(nextValue)) return null;
    params[key] = nextValue;
    found = true;
  }

  return found ? params : null;
}

export function encodeParams(params: Params): string {
  return encodeBase64(JSON.stringify(params));
}

export function decodeParams(encoded: string): Params | null {
  if (!encoded) return null;

  try {
    const parsed = JSON.parse(decodeBase64(encoded));
    return coerceParams(parsed);
  } catch {
    return null;
  }
}

export function paramsToClipboardJson(params: Params): string {
  return JSON.stringify(params, null, 2);
}

/**
 * URL クエリの v / p から Params を復元する（v=1 が現在の JSON base64 スキーマ）。
 * p はすでにデコード済みの文字列でもよい（decodeURIComponent が二重にならないよう try）。
 */
export function decodeSharedParamP(version: string | undefined, encoded: string): Params | null {
  const v = version?.trim() || "1";
  if (v !== "1") return null;
  const trimmed = encoded.trim();
  if (!trimmed) return null;
  try {
    return decodeParams(decodeURIComponent(trimmed));
  } catch {
    return decodeParams(trimmed);
  }
}
