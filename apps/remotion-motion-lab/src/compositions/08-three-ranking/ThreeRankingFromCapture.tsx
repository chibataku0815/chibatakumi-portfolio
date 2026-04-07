import React from "react";
import { ThreeRanking } from "./ThreeRanking";

/**
 * #8 ThreeRanking の「コード正本」と同じタイミングで書き出すラッパーです。
 *
 * 概要:
 * - 以前はキャプチャ mp4 の全尺（例: 50fps×約 1670 コマ）に論理 0..209 を線形マップしていました。
 * - その結果、本来 30fps×210（約 7 秒）のモーションが約 30 秒に引き伸ばされ、**キャプチャと無関係に見える**出力になっていました。
 * - 参照 mp4 のそのまま再生は `CleanShotReferencePlayback`（別コンポ）を使います。
 *
 * @returns {React.ReactElement} 通常の `ThreeRanking` と同一です。
 */
export function ThreeRankingFromCapture(): React.ReactElement {
  return <ThreeRanking />;
}
