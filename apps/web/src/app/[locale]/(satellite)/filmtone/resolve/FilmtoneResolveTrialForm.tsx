"use client";

/**
 * @file `Filmtone for DaVinci Resolve` の 14 日 trial 請求フォーム（client island）。
 * @description 本番 Worker（`POST /trial`）へ `{ email, turnstileToken }` を送る。Cloudflare Turnstile を
 *   explicit render で描画し、action は Worker が要求する `filmtone_trial` に固定する。成功時は「メールを確認して」
 *   の確認表示に切り替える（既発行アドレスの再請求も同じ `{ ok: true }` を返す設計なので、再請求をエラー扱いしない）。
 * @limitations site key はデプロイ環境で埋め込む前提。空のときは widget を描画せず「一時的に利用不可」を表示する
 *   （空 sitekey で `turnstile.render` を呼ぶと例外になるため）。ホストは chibatakumi.studio 前提（Worker の
 *   ALLOWED_ORIGIN と一致）。
 */

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** Turnstile 429（rate limited）を UI 上で区別するための HTTP ステータス */
const HTTP_RATE_LIMITED = 429;
/** Turnstile の explicit render script（自前で `turnstile.render` を呼ぶ） */
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type SubmitStatus = "idle" | "submitting" | "success" | "error";
type ErrorKind = "rate_limited" | "generic" | "missing_token";

type TurnstileRenderOptions = {
  sitekey: string;
  action?: string;
  theme?: "auto" | "light" | "dark";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export type FilmtoneResolveTrialFormProps = {
  /** Cloudflare Turnstile の site key（`NEXT_PUBLIC_*` 由来・空なら widget 非表示） */
  siteKey: string;
  /** trial 請求 endpoint（Worker の `/trial`） */
  endpoint: string;
  /** Turnstile の action（Worker が要求する固定値 `filmtone_trial`） */
  action: string;
};

/**
 * trial 請求フォーム本体。
 *
 * @param root0 - props
 * @param root0.siteKey - Turnstile site key
 * @param root0.endpoint - trial 請求 endpoint
 * @param root0.action - Turnstile action（`filmtone_trial`）
 */
export function FilmtoneResolveTrialForm({
  siteKey,
  endpoint,
  action,
}: FilmtoneResolveTrialFormProps) {
  const t = useTranslations("filmtone-resolve.trialForm");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorKind, setErrorKind] = useState<ErrorKind>("generic");
  const [scriptReady, setScriptReady] = useState(false);
  const [token, setToken] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  const hasSiteKey = siteKey.length > 0;

  useEffect(() => {
    if (!scriptReady || !hasSiteKey) return;
    const turnstile = window.turnstile;
    if (!turnstile || !containerRef.current || widgetIdRef.current) return;

    widgetIdRef.current = turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      theme: "dark",
      callback: (nextToken: string) => setToken(nextToken),
      "expired-callback": () => setToken(""),
      "error-callback": () => setToken(""),
    });

    return () => {
      const api = window.turnstile;
      if (api && widgetIdRef.current) {
        try {
          api.remove(widgetIdRef.current);
        } catch {
          // widget already gone (fast unmount / StrictMode) — safe to ignore
        }
      }
      widgetIdRef.current = null;
    };
  }, [scriptReady, hasSiteKey, siteKey, action]);

  const resetWidget = useCallback(() => {
    const api = window.turnstile;
    if (api && widgetIdRef.current) {
      try {
        api.reset(widgetIdRef.current);
      } catch {
        // ignore — token will simply stay empty until re-solved
      }
    }
    setToken("");
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status === "submitting") return;

      const trimmedEmail = email.trim();
      if (trimmedEmail.length === 0) return;
      if (token.length === 0) {
        setStatus("error");
        setErrorKind("missing_token");
        return;
      }

      setStatus("submitting");
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail, turnstileToken: token }),
        });

        if (res.ok) {
          setStatus("success");
          return;
        }

        setStatus("error");
        setErrorKind(res.status === HTTP_RATE_LIMITED ? "rate_limited" : "generic");
        resetWidget();
      } catch {
        setStatus("error");
        setErrorKind("generic");
        resetWidget();
      }
    },
    [status, email, token, endpoint, resetWidget],
  );

  if (!hasSiteKey) {
    return (
      <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4 text-sm leading-relaxed text-white/70">
        {t("turnstileUnavailable")}
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/[0.06] px-5 py-5">
        <p className="text-sm font-medium text-white">{t("successTitle")}</p>
        <p className="mt-2 text-sm leading-relaxed text-white/70">{t("successBody")}</p>
      </div>
    );
  }

  const errorMessage =
    status === "error"
      ? errorKind === "rate_limited"
        ? t("errorRateLimited")
        : errorKind === "missing_token"
          ? t("errorMissingToken")
          : t("errorGeneric")
      : null;

  return (
    <>
      <Script
        src={TURNSTILE_SCRIPT_SRC}
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            {t("emailLabel")}
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("emailPlaceholder")}
            className="w-full rounded-xl border border-white/12 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/30"
          />
        </label>

        <div ref={containerRef} className="min-h-[65px]" />

        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? t("submitting") : t("cta")}
        </button>

        {errorMessage ? (
          <p className="text-sm leading-relaxed text-amber-200/85">{errorMessage}</p>
        ) : null}

        <p className="text-xs leading-relaxed text-white/45">
          {t("privacyPrefix")}{" "}
          <Link
            href="/filmtone/resolve/trial-privacy"
            className="underline decoration-white/25 underline-offset-4 transition-colors hover:text-white/75"
          >
            {t("privacyLink")}
          </Link>
        </p>
      </form>
    </>
  );
}
