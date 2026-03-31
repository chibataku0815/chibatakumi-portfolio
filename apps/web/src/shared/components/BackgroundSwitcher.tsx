"use client";

import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

/**
 * 背景設定: パスごとに使用する背景タイプを定義
 * - "fluid": FluidGradientBackground (流体インタラクション)
 * - "hero": HeroShaderBackground (画像ベースシェーダー)
 */
const backgroundConfig: Record<string, "fluid" | "hero"> = {
  "/": "fluid",
  "/interactive": "fluid",
  "/motion": "hero",
  "/installation": "hero",
  "/archive": "hero",
  "/contact": "hero",
};

interface BackgroundSwitcherProps {
  /** FluidGradientBackground — accepts className */
  FluidBackground: ComponentType<{ className?: string }>;
  /** HeroShaderBackground — no props required */
  HeroBackground: ComponentType;
}

/**
 * BackgroundSwitcher
 * パスに応じて適切な背景コンポーネントを表示
 * 重複を防ぎ、1つのWebGLコンテキストのみをアクティブにする
 *
 * Background components are injected via props so that shared/ does not
 * depend on feature modules directly.
 */
export function BackgroundSwitcher({
  FluidBackground,
  HeroBackground,
}: BackgroundSwitcherProps) {
  const pathname = usePathname();

  // パスに対応する背景タイプを取得（デフォルトは "hero"）
  const backgroundType = backgroundConfig[pathname] ?? "hero";

  return (
    <>
      {backgroundType === "fluid" && (
        <FluidBackground className="fixed inset-0 -z-10" />
      )}
      {backgroundType === "hero" && <HeroBackground />}
    </>
  );
}

export default BackgroundSwitcher;
