/**
 * Launch Integration Prototype の時間軸定義です。
 *
 * 概要:
 * - launch-video prototype の beat を、Remotion 用の frame 数へ変換してまとめます
 * - audio preview と本体 composition が同じ時間軸を見るための正本です
 *
 * 主な仕様:
 * - 30fps 前提で Hook / Showcase / Scope / Detail / Browser / Production / Close を固定します
 * - 各 beat の長さと開始 frame を `as const` で保持します
 * - 52s / 1560f / ~40 visual states を目標とします
 *
 * 制限事項:
 * - final delivery の fps 変更まではここで吸収しません
 * - beat の増減がある場合は、このファイルを先に更新します
 */
export const launchBeatFrames = {
  hook: 150,
  showcase: 270,
  scope: 180,
  detail: 180,
  browser: 210,
  production: 270,
  close: 210,
} as const;

/**
 * beat 名の union です。
 */
export type LaunchBeatId = keyof typeof launchBeatFrames;

/**
 * beat の表示順です。
 */
export const launchBeatOrder: readonly LaunchBeatId[] = [
  "hook",
  "showcase",
  "scope",
  "detail",
  "browser",
  "production",
  "close",
] as const;

/**
 * 各 beat の開始 frame です。
 */
export const launchBeatOffsets: Record<LaunchBeatId, number> = {
  hook: 0,
  showcase: launchBeatFrames.hook,
  scope: launchBeatFrames.hook + launchBeatFrames.showcase,
  detail:
    launchBeatFrames.hook + launchBeatFrames.showcase + launchBeatFrames.scope,
  browser:
    launchBeatFrames.hook +
    launchBeatFrames.showcase +
    launchBeatFrames.scope +
    launchBeatFrames.detail,
  production:
    launchBeatFrames.hook +
    launchBeatFrames.showcase +
    launchBeatFrames.scope +
    launchBeatFrames.detail +
    launchBeatFrames.browser,
  close:
    launchBeatFrames.hook +
    launchBeatFrames.showcase +
    launchBeatFrames.scope +
    launchBeatFrames.detail +
    launchBeatFrames.browser +
    launchBeatFrames.production,
};

/**
 * prototype 全体のフレーム数です。
 */
export const launchIntegrationPrototypeDurationInFrames =
  launchBeatFrames.hook +
  launchBeatFrames.showcase +
  launchBeatFrames.scope +
  launchBeatFrames.detail +
  launchBeatFrames.browser +
  launchBeatFrames.production +
  launchBeatFrames.close;

/**
 * beat の開始と終了を返します。
 *
 * @param {LaunchBeatId} beatId 調べたい beat 名です。
 * @returns {{startFrame: number; endFrame: number}} 区間です。
 */
export function getLaunchBeatWindow(beatId: LaunchBeatId): {
  startFrame: number;
  endFrame: number;
} {
  const startFrame = launchBeatOffsets[beatId];
  const endFrame = startFrame + launchBeatFrames[beatId];

  return {
    startFrame,
    endFrame,
  };
}

/**
 * 現在 frame がどの beat にいるかを返します。
 *
 * @param {number} frame 現在の frame です。
 * @returns {LaunchBeatId} 一致した beat 名です。
 */
export function getLaunchBeatIdForFrame(frame: number): LaunchBeatId {
  for (const beatId of launchBeatOrder) {
    const { startFrame, endFrame } = getLaunchBeatWindow(beatId);

    if (frame >= startFrame && frame < endFrame) {
      return beatId;
    }
  }

  return "close";
}
