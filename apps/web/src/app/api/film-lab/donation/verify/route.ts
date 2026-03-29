/**
 * @file Checkout Session を Stripe API で検証し、支払済みなら支援者 Cookie を発行する。
 * @description Thanks ページが `session_id` クエリ付きで開いたあと、クライアントが POST する。
 * @limitations `FILM_LAB_DONATION_SIGNING_SECRET` と `STRIPE_SECRET_KEY` が必須。PII はレスポンスに含めない。
 */

import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import {
  FILM_LAB_SUPPORTER_COOKIE_NAME,
  filmLabSignSupporterCookie,
} from "@/features/interactive/film-lab/film-lab-donation-cookie-signing";
import { filmLabStripeSecretKey } from "@/features/interactive/film-lab/film-lab-donation-stripe-server";

export const runtime = "nodejs";

/**
 * @description POST ボディ `{ sessionId: string }` を受け取り、`cs_` セッションが `paid` なら Cookie をセットする。
 */
export async function POST(req: NextRequest) {
  const signingSecret = process.env.FILM_LAB_DONATION_SIGNING_SECRET?.trim() ?? "";
  const stripeSecret = filmLabStripeSecretKey();
  if (!signingSecret || !stripeSecret) {
    return NextResponse.json({ ok: false as const, code: "not_configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false as const, code: "bad_json" }, { status: 400 });
  }

  const sessionId =
    typeof body === "object" &&
    body !== null &&
    "sessionId" in body &&
    typeof (body as { sessionId: unknown }).sessionId === "string"
      ? (body as { sessionId: string }).sessionId.trim()
      : "";

  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ ok: false as const, code: "invalid_session" }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecret, { typescript: true });

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ ok: false as const, code: "stripe_retrieve_failed" }, { status: 502 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ ok: false as const, code: "not_paid" }, { status: 402 });
  }

  const piRaw = session.payment_intent;
  const piId =
    typeof piRaw === "string"
      ? piRaw
      : piRaw &&
          typeof piRaw === "object" &&
          "id" in piRaw &&
          typeof (piRaw as { id: unknown }).id === "string"
        ? (piRaw as { id: string }).id
        : "";

  if (!piId.startsWith("pi_")) {
    return NextResponse.json({ ok: false as const, code: "no_payment_intent" }, { status: 422 });
  }

  const token = filmLabSignSupporterCookie(piId, signingSecret);
  const res = NextResponse.json({ ok: true as const });
  res.cookies.set(FILM_LAB_SUPPORTER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return res;
}
