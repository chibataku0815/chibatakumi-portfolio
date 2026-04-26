import type { ReactNode } from "react";

/**
 * @file `/filmtone` 配下の内側 layout（Renewal 2026 Satellite Isolation Plan §3.4 で簡素化）。
 * @description
 *   - `data-theme="dark"` は親 `(satellite)/layout.tsx` が body 背景まで含めて提供するため、
 *     ここでは付け直さない (重複 wrapper 排除)。
 *   - `.film-lab-lp-root` クラスのみ維持: globals.css L1460 の Filmtone 固有
 *     liquid glass / typography scope を保つため。
 *   - 旧 `/film-lab/*` および `/works/filmtone/*` から carry されたコンテンツが
 *     `[data-theme="dark"]` 配下に gated 済みのトークンを利用する点は変わらず
 *     (親 `(satellite)` shell が data-theme="dark" を継承させる)。
 * @param root0 - 子要素
 * @param root0.children - ページコンテンツ
 */
export default function FilmtoneRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="film-lab-lp-root">{children}</div>;
}
