"use client";

import { usePathname } from "next/navigation";
import { HeroShaderBackground } from "@/features/hero/components";
import { FluidGradientBackground } from "@/features/fluid-gradient";

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

/**
 * BackgroundSwitcher
 * パスに応じて適切な背景コンポーネントを表示
 * 重複を防ぎ、1つのWebGLコンテキストのみをアクティブにする
 */
export function BackgroundSwitcher() {
  const pathname = usePathname();

  // パスに対応する背景タイプを取得（デフォルトは "hero"）
  const backgroundType = backgroundConfig[pathname] ?? "hero";

  return (
    <>
      {backgroundType === "fluid" && (
        <FluidGradientBackground className="fixed inset-0 -z-10" />
      )}
      {backgroundType === "hero" && <HeroShaderBackground />}
    </>
  );
}

export default BackgroundSwitcher;
