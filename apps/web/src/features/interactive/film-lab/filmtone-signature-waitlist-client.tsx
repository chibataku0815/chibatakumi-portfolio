"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

type SubmitState = "idle" | "submitting" | "success" | "duplicate" | "error";

export function FilmtoneSignatureWaitlistClient({ locale }: { locale: string }) {
  const t = useTranslations("filmtone-signature");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "submitting") return;
    setState("submitting");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), locale }),
      });
      const body = (await res.json()) as { ok: boolean; code?: string };
      if (body.ok) {
        setState(body.code === "duplicate" ? "duplicate" : "success");
      } else if (body.code === "duplicate") {
        setState("duplicate");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 px-6 py-16 md:py-24">
      <div className="mx-auto max-w-2xl">
        <header className="mb-12">
          <p className="text-sm uppercase tracking-[0.2em] text-amber-400/80 mb-4">
            {t("eyebrow")}
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            {t("headline")}
          </h1>
          <p className="text-lg text-neutral-300 leading-relaxed">
            {t("subheadline")}
          </p>
        </header>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 md:p-8 mb-10">
          <h2 className="text-sm uppercase tracking-[0.15em] text-neutral-400 mb-4">
            {t("waitlistTitle")}
          </h2>
          <p className="text-neutral-200 mb-6">{t("waitlistBenefit")}</p>

          {state === "success" || state === "duplicate" ? (
            <p className="text-emerald-400" role="status">
              {state === "duplicate" ? t("alreadyOnList") : t("thanks")}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-lg bg-neutral-950 border border-neutral-700 px-4 py-3 text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-amber-400/60"
                disabled={state === "submitting"}
                aria-label={t("emailPlaceholder")}
              />
              <button
                type="submit"
                disabled={state === "submitting"}
                className="rounded-lg bg-amber-400 text-neutral-950 px-5 py-3 font-medium hover:bg-amber-300 disabled:opacity-60 transition"
              >
                {state === "submitting" ? t("submitting") : t("cta")}
              </button>
            </form>
          )}
          {state === "error" && (
            <p className="text-rose-400 text-sm mt-3" role="alert">
              {t("error")}
            </p>
          )}

          <p className="text-xs text-neutral-500 mt-4">{t("scopeLine")}</p>
        </section>

        <section className="space-y-8 text-neutral-200">
          <div>
            <h3 className="text-sm uppercase tracking-[0.15em] text-neutral-400 mb-3">
              {t("whatItIsTitle")}
            </h3>
            <ul className="space-y-2 list-disc list-inside text-neutral-300">
              <li>{t("whatItIsItem1")}</li>
              <li>{t("whatItIsItem2")}</li>
              <li>{t("whatItIsItem3")}</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm uppercase tracking-[0.15em] text-neutral-400 mb-3">
              {t("pricingTitle")}
            </h3>
            <p className="text-neutral-300">{t("pricingBody")}</p>
            <p className="text-neutral-500 text-sm mt-2">{t("buyOnceLine")}</p>
          </div>
        </section>

        <footer className="mt-16 pt-8 border-t border-neutral-800 text-xs text-neutral-500">
          <p>{t("refundLine")}</p>
        </footer>
      </div>
    </main>
  );
}
