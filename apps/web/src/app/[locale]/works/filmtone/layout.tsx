import type { ReactNode } from "react";

/**
 * @file `/works/filmtone` 配下のレイアウト。
 * @description Wave 2 D3.3 — `data-theme="dark"` wrapper を付与し、Filmtone の dark glass tokens を活性化する。
 *   旧 `/film-lab/*` から carry されたコンテンツは、Wave 1 で `[data-theme="dark"]` 配下に gated 済みのトークンを利用する。
 *   `.film-lab-lp-root` クラスは globals.css L1460 の liquid glass / typography スコープを保つために維持。
 * @param root0 - 子要素
 * @param root0.children - ページコンテンツ
 */
export default function FilmtoneRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div data-theme="dark" className="film-lab-lp-root">
      {children}
    </div>
  );
}
