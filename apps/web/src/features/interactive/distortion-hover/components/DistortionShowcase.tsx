/**
 * @module DistortionShowcase
 *
 * ディストーションエフェクトのデモセクション。
 * DistortionScene を dynamic import し、技術タグと説明文を添えてページに表示する。
 *
 * ## Dynamic Import + ssr: false パターン
 *
 * WebGL（Three.js / R3F）はブラウザの WebGL API に依存するため、
 * Node.js 上で実行される SSR（Server-Side Rendering）では動作しない。
 * Next.js の `dynamic()` に `{ ssr: false }` を渡すことで、
 * そのコンポーネントをクライアントサイドでのみ読み込むようにする。
 *
 * ```ts
 * // ssr: false がないと、ビルド時に "window is not defined" 等のエラーが発生する
 * const DistortionScene = dynamic(
 *   () => import("./DistortionScene").then(m => ({ default: m.DistortionScene })),
 *   { ssr: false }
 * );
 * ```
 *
 * ### .then(m => ({ default: m.DistortionScene })) の意味
 *
 * Next.js の `dynamic()` は **default export** を期待する。
 * しかし DistortionScene は named export（`export function DistortionScene`）なので、
 * `.then()` で `{ default: ... }` にリネームして渡す必要がある。
 *
 * もし DistortionScene が `export default` だった場合は `.then()` は不要:
 * ```ts
 * const DistortionScene = dynamic(() => import("./DistortionScene"), { ssr: false });
 * ```
 *
 * ## "use client" ディレクティブ
 *
 * Next.js App Router では、デフォルトで全コンポーネントが Server Component になる。
 * `useTranslations` や `useState` 等の React hooks を使うコンポーネントは
 * `"use client"` を宣言して Client Component にする必要がある。
 *
 * ## next-intl の useTranslations
 *
 * `useTranslations("interactive.demo")` は、ロケールファイル（例: messages/ja.json）の
 * `interactive.demo` ネームスペースからテキストを取得する。
 * `t("title")` で `interactive.demo.title` の値を返す。
 * これにより多言語対応を JSON ファイルの差し替えだけで実現できる。
 */
"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

/**
 * DistortionScene を dynamic import（クライアントのみ読み込み）。
 *
 * WebGL コンポーネントは SSR 不可のため `ssr: false` が必須。
 * これにより、サーバーレンダリング時はこのコンポーネントがスキップされ、
 * クライアントでのハイドレーション時にはじめて読み込まれる。
 *
 * @see {@link https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading}
 */
const DistortionScene = dynamic(
  () => import("./DistortionScene").then((m) => ({ default: m.DistortionScene })),
  { ssr: false }
);

/** 技術スタックのタグ一覧。このデモで使用している技術を視覚的に表示する */
const TAGS = ["Three.js", "GLSL", "GSAP", "R3F", "TypeScript"];

/**
 * DistortionShowcase — ディストーションデモのページセクション。
 *
 * WebGL デモ本体、タイトル、説明文、クレジット、技術タグを
 * レスポンシブなレイアウトで表示する。
 *
 * @remarks
 * テキストは next-intl の `useTranslations` で多言語対応している。
 * 対応するメッセージファイルに `interactive.demo.title` 等のキーが必要。
 *
 * @example
 * ```tsx
 * // ページコンポーネントでの使用
 * import { DistortionShowcase } from "@/features/interactive/distortion-hover";
 * export default function InteractivePage() {
 *   return <DistortionShowcase />;
 * }
 * ```
 */
export function DistortionShowcase() {
  const t = useTranslations("interactive.demo");

  return (
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-5xl">
        {/* WebGL デモ本体（dynamic import により初回はコードスプリットされる） */}
        <DistortionScene />

        {/* 説明文と技術タグ */}
        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text-base)]">
              {t("title")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {t("description")}
            </p>
            <p className="mt-2 text-xs text-[var(--text-base-40)]">
              {t("credit")}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 md:pt-1">
            {TAGS.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--text-base-60)] bg-white/5 px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
