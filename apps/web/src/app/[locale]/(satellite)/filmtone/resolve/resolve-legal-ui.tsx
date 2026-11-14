import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { filmtoneResolveSupportEmail } from "@/features/interactive/film-lab/resolve-plugin-info";

/**
 * @file `Filmtone for DaVinci Resolve` の法務サブページ（EULA / 返金 / trial プライバシー）共通 UI。
 * @description 3 ページで共通する外枠・見出し・本文ブロック・フッターを 1 か所に集約し、体裁の齟齬を防ぐ。
 *   route ファイル（page/layout/route）ではないため Next.js のルートにはならず、単なる colocated モジュール。
 */

/** 法務ページの外枠（本文が読みやすい幅に絞る） */
export function ResolveLegalMain({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-16 sm:px-6">{children}</main>
  );
}

/** 法務ページのヘッダ（eyebrow・タイトル・発効/運営者の但し書き） */
export function ResolveLegalHeader({
  eyebrow,
  title,
  note,
}: {
  eyebrow: string;
  title: string;
  note: string;
}) {
  return (
    <header>
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
        {eyebrow}
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
      <p className="mt-3 text-xs leading-relaxed text-white/45">{note}</p>
    </header>
  );
}

/** 見出し＋段落（複数可）＋任意の箇条書きからなる法務セクション */
export function ResolveLegalSection({
  heading,
  paragraphs,
  bullets,
}: {
  heading: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
}) {
  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-white sm:text-xl">{heading}</h2>
      {paragraphs?.map((paragraph) => (
        <p key={paragraph} className="mt-3 text-sm leading-relaxed text-white/70">
          {paragraph}
        </p>
      ))}
      {bullets && bullets.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2 text-sm leading-relaxed text-white/70">
              <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-white/35" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** 参考リンク（外部の各社ポリシー等）を並べる小ブロック */
export function ResolveLegalReferences({
  label,
  references,
}: {
  label: string;
  references: readonly string[];
}) {
  if (references.length === 0) return null;
  return (
    <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{label}</p>
      <ul className="mt-2 space-y-1">
        {references.map((href) => (
          <li key={href}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="break-all text-xs text-white/55 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/80"
            >
              {href}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 法務ページ共通のフッタ（プロダクトページへ戻る＋サポート窓口） */
export function ResolveLegalFooter({ backLabel }: { backLabel: string }) {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
      <Link
        href="/filmtone/resolve"
        className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm text-white transition-colors hover:bg-white/14"
      >
        {backLabel}
      </Link>
      <a
        href={`mailto:${filmtoneResolveSupportEmail}`}
        className="text-sm text-white/60 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
      >
        {filmtoneResolveSupportEmail}
      </a>
    </div>
  );
}
