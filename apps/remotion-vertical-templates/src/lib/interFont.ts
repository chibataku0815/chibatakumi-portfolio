/**
 * @fileoverview Inter（400/600/700/800）を Remotion のレンダー前に読み込む。
 * 読み込み失敗時も continueRender して黒画面で止まらないようにする。
 */
import { loadFont } from "@remotion/google-fonts/Inter";
import { continueRender, delayRender } from "remotion";
import { useEffect, useRef } from "react";

/** Google Fonts から取得する Inter の設定（サブセットは latin のみで軽量化） */
export const interFont = loadFont("normal", {
  weights: ["400", "600", "700", "800"],
  subsets: ["latin"],
});

/**
 * Inter の @font-face 注入が終わるまで delayRender で待ち、終わったら continueRender する。
 * 各コンポジションのルートで1回だけ呼ぶ想定。
 */
export function useInterFontReady(): void {
  const handleRef = useRef<number | null>(null);

  if (handleRef.current === null) {
    handleRef.current = delayRender("Inter font");
  }

  useEffect(() => {
    const handle = handleRef.current;
    if (handle === null) {
      return;
    }
    interFont
      .waitUntilDone()
      .then(() => {
        continueRender(handle);
      })
      .catch((error: unknown) => {
        console.error("useInterFontReady: interFont.waitUntilDone failed", {
          error: String(error),
        });
        continueRender(handle);
      });
  }, []);
}
