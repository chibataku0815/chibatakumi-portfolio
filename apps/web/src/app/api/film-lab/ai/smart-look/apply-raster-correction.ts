/**
 * @file スマートルック用 — サーバー側でデルタをラスタ（PNG）に焼き込む MVP 処理。
 * @description OpenAI／mock が返した数値デルタを、sharp で画像に近似適用し base64 PNG を返す。本番の「生成・修復」モデルではなく、**ピクセルが変わる**最初の一歩として使う。
 * @limitations Film Lab シェーダーと完全一致しない（近似）。recomb を連鎖させると色が強めに出る場合あり。失敗時は呼び出し側がデルタのみにフォールバックする。
 */

import sharp from "sharp";
import type { FilmLabSmartLookDelta } from "film-lab-smart-look";

/** @description 返却 PNG の長辺上限（メモリ・レスポンス肥大防止）。 */
const MAX_RASTER_LONG_EDGE = 2048;

/** @description 1 段目でまだ大きいときの再圧縮用長辺。 */
const FALLBACK_RASTER_LONG_EDGE = 1536;

/**
 * @description Base64 画像とデルタから、補正済み PNG の base64（data URL プレフィックスなし）を生成する。
 * @param imageBase64 - リクエスト本文の `imageBase64`（プレフィックスなし）
 * @param delta - 検証・クリップ済みのスマートルックデルタ
 * @returns 成功時は PNG base64。sharp 失敗時は `ok: false`（メッセージはログ用・クライアントには返さない）
 */
export async function buildCorrectedPngBase64FromSmartLookDelta(
  imageBase64: string,
  delta: FilmLabSmartLookDelta,
): Promise<{ ok: true; base64: string } | { ok: false; message: string }> {
  try {
    const inputBuffer = Buffer.from(imageBase64, "base64");
    let pipeline = sharp(inputBuffer, { failOn: "truncated" }).rotate();

    const exposure = delta.exposure ?? 0;
    const brightness = Math.min(1.45, Math.max(0.55, 1 + exposure * 0.14));
    const satDelta = delta.saturation ?? 0;
    const saturation = Math.min(1.9, Math.max(0.05, 1 + satDelta * 0.55));
    pipeline = pipeline.modulate({ brightness, saturation });

    const temperature = delta.temperature ?? 0;
    if (Math.abs(temperature) > 1e-8) {
      const k = temperature * 0.1;
      pipeline = pipeline.recomb([
        [1 + k, 0, 0],
        [0, 1, 0],
        [0, 0, 1 - k * 0.45],
      ]);
    }

    const tint = delta.tint ?? 0;
    if (Math.abs(tint) > 1e-8) {
      const gShift = 1 - tint * 0.08;
      pipeline = pipeline.recomb([
        [1, 0, 0],
        [0, gShift, 0],
        [0, 0, 1 + tint * 0.06],
      ]);
    }

    const highlights = delta.highlights ?? 0;
    const shadows = delta.shadows ?? 0;
    if (Math.abs(highlights) > 1e-8 || Math.abs(shadows) > 1e-8) {
      const gamma = 1 / (1 + highlights * 0.12 - shadows * 0.1);
      const g = Math.min(1.3, Math.max(0.75, gamma));
      pipeline = pipeline.gamma(g);
    }

    const fade = delta.fade ?? 0;
    if (Math.abs(fade) > 1e-8) {
      pipeline = pipeline.linear(1, fade * 0.15);
    }

    let outBuf = await pipeline
      .resize({
        width: MAX_RASTER_LONG_EDGE,
        height: MAX_RASTER_LONG_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png({ compressionLevel: 6 })
      .toBuffer();

    if (outBuf.length > 2_400_000) {
      outBuf = await sharp(outBuf)
        .resize({
          width: FALLBACK_RASTER_LONG_EDGE,
          height: FALLBACK_RASTER_LONG_EDGE,
          fit: "inside",
          withoutEnlargement: true,
        })
        .png({ compressionLevel: 9 })
        .toBuffer();
    }

    return { ok: true, base64: outBuf.toString("base64") };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, message };
  }
}
