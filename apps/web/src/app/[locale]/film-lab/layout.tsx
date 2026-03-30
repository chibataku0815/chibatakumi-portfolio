import type { ReactNode } from "react";

/**
 * @file `/film-lab` 配下のレイアウト。
 * @description LP のガラス・タイポ用スコープ（`.film-lab-lp-root`）だけを包む。フォントはルートの Geist / Noto を継承し、別ストックは載せない。
 * @param root0 - 子要素
 * @param root0.children - ページコンテンツ
 */
export default function FilmLabRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="film-lab-lp-root">{children}</div>;
}
