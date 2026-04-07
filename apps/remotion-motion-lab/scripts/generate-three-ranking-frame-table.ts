/**
 * ThreeRanking（composition #8）の Phase 2 用フレーム表を生成します。
 *
 * 概要:
 * - `ThreeRanking.tsx` の `getCameraFocusIndex` と同じ定数・式で 0..duration-1 を列挙します
 * - overlay の `filmtoneFadeIn`（title / panel）も同じ式で数値化します
 *
 * 主な仕様:
 * - SSOT は Remotion の composition フレーム index（Root.tsx の fps / durationInFrames）
 *
 * 制限事項:
 * - `CameraRig` の毎フレーム lerp（0.22）は含みません。論理 focus と実カメラ位置は数フレーム遅れうるため、still では実描画を正とします
 *
 * 実行: `bun run scripts/generate-three-ranking-frame-table.ts`
 */
import { Easing, interpolate } from "remotion";

const introFrames = 18;
const segmentFrames = 8;
const moveFrames = 5;
const rankedLength = 20;
const fps = 30;
const durationInFrames = 210;

/**
 * @param frame composition フレーム index
 * @returns カメラフォーカス用の連続 index（実装と同一）
 */
function getCameraFocusIndex(frame: number): number {
  const localFrame = Math.max(0, frame - introFrames);
  const segmentIndex = Math.min(
    rankedLength - 1,
    Math.floor(localFrame / segmentFrames),
  );
  const segmentFrame = localFrame % segmentFrames;
  const moveProgress = segmentFrame >= moveFrames ? 1 : segmentFrame / moveFrames;
  const easedProgress = Easing.inOut(Easing.cubic)(moveProgress);
  return Math.min(rankedLength - 1, segmentIndex + easedProgress);
}

/**
 * @param frame composition フレーム index
 * @returns overlay で強調される塔の index（実装と同一）
 */
function getNearestIndex(frame: number): number {
  const focusIndex = getCameraFocusIndex(frame);
  return Math.min(
    rankedLength - 1,
    Math.max(0, Math.round(focusIndex)),
  );
}

/**
 * @param frame composition フレーム index
 * @returns title ブロック不透明度 0..1
 */
function titleOpacity(frame: number): number {
  return interpolate(frame, [0, 0 + fps * 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

/**
 * @param frame composition フレーム index
 * @returns パネル不透明度 0..1
 */
function panelOpacity(frame: number): number {
  return interpolate(frame, [14, 14 + fps * 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

function main(): void {
  const lines: string[] = [];
  lines.push("| frame | localFrame | segmentIndex | segmentFrame | phase | moveT | easedT | focusIndex | nearestTowerIndex | titleOpacity | panelOpacity | stillFile |");
  lines.push("|------:|-----------:|-------------:|-------------:|:------|------:|-------:|-----------:|------------------:|-------------:|-------------:|:----------|");

  for (let frame = 0; frame < durationInFrames; frame += 1) {
    const localFrame = Math.max(0, frame - introFrames);
    const segmentIndex = Math.min(
      rankedLength - 1,
      Math.floor(localFrame / segmentFrames),
    );
    const segmentFrame = localFrame % segmentFrames;
    const moveProgress = segmentFrame >= moveFrames ? 1 : segmentFrame / moveFrames;
    const easedProgress = Easing.inOut(Easing.cubic)(moveProgress);
    const focusIndex = getCameraFocusIndex(frame);
    const nearest = getNearestIndex(frame);
    const phase = segmentFrame < moveFrames ? "move" : "pause";
    const stillFile = `frame_${String(frame).padStart(4, "0")}.png`;

    lines.push(
      `| ${frame} | ${localFrame} | ${segmentIndex} | ${segmentFrame} | ${phase} | ${moveProgress.toFixed(4)} | ${easedProgress.toFixed(6)} | ${focusIndex.toFixed(6)} | ${nearest} | ${titleOpacity(frame).toFixed(4)} | ${panelOpacity(frame).toFixed(4)} | \`${stillFile}\` |`,
    );
  }

  process.stdout.write(lines.join("\n") + "\n");
}

main();
