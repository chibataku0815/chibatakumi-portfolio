import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { cleanshotReferenceTotalFrames } from "./cleanshotReferenceTimeline";

/**
 * CleanShot 参照 mp4 を Remotion 上でそのまま再生するコンポジションです。
 *
 * 重要:
 * - **ThreeRanking や #8 study とは無関係**です（名前・用途の混同禁止）。
 * - 中身は `OffthreadVideo` による参照ファイルの再生のみです（コードによるモーション再構築ではありません）。
 *
 * 主な仕様:
 * - ソース: `public/reference/cleanshot-reference.mp4`
 *   （未配置の場合は README のとおり `three-ranking-cleanshot-ref.mp4` から複製してください）
 *
 * @returns {React.ReactElement} 黒背景の上に参照 mp4 を敷いた要素です。
 */
export function CleanShotReferencePlayback(): React.ReactElement {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={staticFile("reference/cleanshot-reference.mp4")}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "fill",
        }}
      />
    </AbsoluteFill>
  );
}

/**
 * Root の `durationInFrames` 用。`cleanshotReferenceTimeline` と同じ値です。
 *
 * @deprecated Root からは `cleanshotReferenceTotalFrames` を直接 import しても構いません。
 */
export const cleanshotReferenceDurationInFrames = cleanshotReferenceTotalFrames;
