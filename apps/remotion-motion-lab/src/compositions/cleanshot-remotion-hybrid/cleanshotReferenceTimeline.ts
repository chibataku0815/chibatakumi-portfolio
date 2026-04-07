/**
 * CleanShot 参照 mp4 のメタデータ（SSOT）です。
 *
 * 概要:
 * - ffprobe（format.duration / streams の r_frame_rate・width・height）に合わせます。
 * - ThreeRanking など別コンポとは無関係です。
 *
 * 制限事項:
 * - 参照ファイルを差し替えたら ffprobe で取り直し、このファイルを更新してください。
 */

/** 参照 mp4 の尺（秒）— ffprobe format.duration です。 */
export const cleanshotReferenceDurationSec = 33.416667;

/** 参照 mp4 のフレームレート（r_frame_rate 50/1）です。 */
export const cleanshotReferenceFps = 50;

/**
 * 参照 mp4 に対応する composition の durationInFrames です。
 *
 * @remarks durationSec × fps を四捨五入します。
 */
export const cleanshotReferenceTotalFrames = Math.round(
  cleanshotReferenceDurationSec * cleanshotReferenceFps,
);

/** 参照 mp4 の幅（ピクセル）— ffprobe streams[0].width です。 */
export const cleanshotReferenceWidthPx = 2832;

/** 参照 mp4 の高さ（ピクセル）— ffprobe streams[0].height です。 */
export const cleanshotReferenceHeightPx = 1548;
