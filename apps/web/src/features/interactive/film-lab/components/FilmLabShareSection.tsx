"use client";

/**
 * Film Lab — ルック共有 UI（URL コピー・X intent）
 *
 * 概要: アクティブスロットの Params をクエリ `v=1&p=` 付き URL にして共有する。
 * 仕様: `feature-flags` でパネル全体のマウントを止められる（既定は非表示）。
 * 制限: メディア本体は共有されない。pathname が無いときはボタンを出さない。
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { buildFilmLabPostToXUrl, buildFilmLabShareUrl } from "../share-utils";
import type { Params } from "../types";

interface FilmLabShareSectionProps {
  /** `usePathname()` の値。空のときは共有 URL を組み立てられない */
  pathname: string | null;
  /** 共有に使うグレード（アクティブスロット） */
  params: Params;
}

/**
 * セクション見出し（ControlPanel 内の SectionHeader と同じ見た目）
 * @param title - 見出し文言
 */
function ShareSectionHeader({ title }: { title: string }) {
  return (
    <h3 className="mb-2 mt-3 text-[10px] font-medium uppercase tracking-[0.15em] text-white/40 first:mt-0">
      {title}
    </h3>
  );
}

/**
 * 共有ボタン群。親の ControlPanel から `params` を受け取る。
 */
export function FilmLabShareSection({ pathname, params }: FilmLabShareSectionProps) {
  const tShare = useTranslations("film-lab.share");
  const [linkCopied, setLinkCopied] = useState(false);
  const copyFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copyFeedbackTimeoutRef.current) clearTimeout(copyFeedbackTimeoutRef.current);
    },
    [],
  );

  const handleCopyShareLink = useCallback(async () => {
    if (typeof window === "undefined" || !pathname) return;
    const url = buildFilmLabShareUrl(window.location.origin, pathname, params);
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      if (copyFeedbackTimeoutRef.current) clearTimeout(copyFeedbackTimeoutRef.current);
      copyFeedbackTimeoutRef.current = setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("FilmLabShareSection.handleCopyShareLink: clipboard write failed", {
        pathname,
        err,
      });
    }
  }, [pathname, params]);

  const handlePostToX = useCallback(() => {
    if (typeof window === "undefined" || !pathname) return;
    const pageUrl = buildFilmLabShareUrl(window.location.origin, pathname, params);
    const text = tShare("postText");
    window.open(buildFilmLabPostToXUrl(pageUrl, text), "_blank", "noopener,noreferrer");
  }, [pathname, params, tShare]);

  if (!pathname) {
    return null;
  }

  return (
    <div className="mt-3 border-t border-white/[0.06] pt-3">
      <ShareSectionHeader title={tShare("sectionTitle")} />
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => void handleCopyShareLink()}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-[11px] font-medium text-white/80 transition-colors hover:bg-white/10 sm:min-h-0 sm:flex-1 sm:py-2"
        >
          {linkCopied ? tShare("copied") : tShare("copyLink")}
        </button>
        <button
          type="button"
          onClick={handlePostToX}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center text-[11px] font-medium text-white/80 transition-colors hover:bg-white/10 sm:min-h-0 sm:flex-1 sm:py-2"
        >
          {tShare("postToX")}
        </button>
      </div>
    </div>
  );
}
