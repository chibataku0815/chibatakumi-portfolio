/**
 * @file Stripe Webhook 受け口（Film Lab 寄付・将来拡張用）。
 * @description 署名検証後に 200 を返す。DB 未接続のため決済記録は行わない（Phase 2 最小・運用監視・将来 Neon 等へのフック）。
 * @limitations `FILM_LAB_STRIPE_WEBHOOK_SECRET` 未設定時は 503。
 */

import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { filmLabStripeSecretKey } from "@/features/interactive/film-lab/film-lab-donation-stripe-server";

export const runtime = "nodejs";

/**
 * @description Stripe からのイベントを検証する。未対応イベントも受領済みとして 200。
 */
export async function POST(req: NextRequest) {
  const whSecret = process.env.FILM_LAB_STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  const stripeSecret = filmLabStripeSecretKey();
  if (!whSecret || !stripeSecret) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ ok: false, error: "missing_signature" }, { status: 400 });
  }

  const raw = await req.text();
  const stripe = new Stripe(stripeSecret, { typescript: true });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: "bad_signature", detail: msg }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      break;
    case "charge.refunded":
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
