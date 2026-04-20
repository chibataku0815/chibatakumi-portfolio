/**
 * @file POST /api/film-lab/waitlist — Filmtone Signature Pack waitlist signup.
 * @description Stores email in Vercel KV. Deduplicated by lowercase email.
 * @limitations Requires KV_REST_API_URL and KV_REST_API_TOKEN envs. No PII in response.
 */

import { NextResponse, type NextRequest } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";

const WAITLIST_SET_KEY = "filmtone:signature:waitlist:emails";
const WAITLIST_META_PREFIX = "filmtone:signature:waitlist:meta:";

function isValidEmail(raw: string): boolean {
  if (raw.length < 5 || raw.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "bad_json" }, { status: 400 });
  }

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email.trim().toLowerCase()
      : "";
  const locale =
    typeof body === "object" &&
    body !== null &&
    "locale" in body &&
    typeof (body as { locale: unknown }).locale === "string"
      ? (body as { locale: string }).locale.trim().slice(0, 8)
      : "en";

  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, code: "invalid_email" }, { status: 400 });
  }

  try {
    const added = await kv.sadd(WAITLIST_SET_KEY, email);
    if (added === 0) {
      return NextResponse.json({ ok: true, code: "duplicate" });
    }
    await kv.set(
      `${WAITLIST_META_PREFIX}${email}`,
      { locale, signedUpAt: new Date().toISOString() },
      { ex: 60 * 60 * 24 * 365 * 2 },
    );
    const total = await kv.scard(WAITLIST_SET_KEY);
    return NextResponse.json({ ok: true, total });
  } catch {
    return NextResponse.json({ ok: false, code: "storage_failed" }, { status: 503 });
  }
}
