/**
 * Film Lab 動的 OGP 画像（軸 D 拡張）
 *
 * 概要: 共有クエリ `?v=1&p=` を解釈し、ルックの要約テキストを焼いた 1200×630 の PNG を返す。
 * 仕様: `next/og` の ImageResponse（Satori）を使用。解読できない場合は汎用カードを返す。
 * 制限: カード上の文言は主に英字（フォント同梱を避ける）。実画像のサムネは描画しない（テキストのみ）。
 */

import { ImageResponse } from "next/og";
import { decodeSharedParamP } from "@/features/interactive/film-lab/params-codec";
import { findMatchingPreset, type PresetName } from "@/features/interactive/film-lab/preset-data";
import type { Params } from "@/features/interactive/film-lab/types";

export const runtime = "nodejs";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/**
 * OGP 上でプリセット名を短く読みやすくする（messages と完全一致は不要）。
 * @param name - プリセット ID
 */
function formatPresetLabel(name: PresetName): string {
  switch (name) {
    case "gold200":
      return "Gold 200";
    case "pro400h":
      return "Pro 400H";
    case "bw":
      return "B&W";
    default:
      return name.charAt(0).toUpperCase() + name.slice(1);
  }
}

/**
 * 数値の主要 3 つを 1 行に要約する（クローラ向けの「ルックの痕跡」）。
 * @param p - デコード済み Params
 */
function summarizeGradeLine(p: Params): string {
  const exp = p.exposure;
  const expStr = `${exp >= 0 ? "+" : ""}${exp.toFixed(2)}`;
  return `Exposure ${expStr} · Contrast ${p.contrast.toFixed(2)} · Saturation ${p.saturation.toFixed(2)}`;
}

/**
 * 動的またはフォールバックの OG カードを ImageResponse で生成する。
 * @param decoded - 共有パラメータ。null なら汎用カード。
 */
function buildOgImageResponse(decoded: Params | null): ImageResponse {
  const matched = decoded ? findMatchingPreset(decoded) : null;
  const headline = decoded
    ? matched
      ? `Preset · ${formatPresetLabel(matched)}`
      : "Custom grade"
    : null;
  /** 日本語はデフォルトフォントで欠けることがあるため、OG カードは英字に統一（CJK フォント同梱は別タスク） */
  const sub = decoded
    ? summarizeGradeLine(decoded)
    : "Decide your look in seconds";
  const brand = "chibatakumi.studio · Film Lab";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(145deg, #0a0a0a 0%, #1a1510 45%, #2a1810 100%)",
          color: "#f5f0e8",
          fontSize: 42,
          fontWeight: 600,
          letterSpacing: "-0.02em",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 56, fontWeight: 700 }}>Film Lab</div>
          {headline ? (
            <div style={{ fontSize: 38, color: "rgba(245,240,232,0.88)" }}>{headline}</div>
          ) : null}
          <div style={{ fontSize: 28, color: "rgba(245,240,232,0.55)", fontWeight: 500 }}>{sub}</div>
        </div>
        <div style={{ fontSize: 22, color: "rgba(245,240,232,0.4)", fontWeight: 500 }}>{brand}</div>
      </div>
    ),
    { width: OG_WIDTH, height: OG_HEIGHT },
  );
}

/**
 * GET /[locale]/film-lab/og?v=1&p=...
 * クエリ p が有効なときはルック要約、無効時は汎用カード。
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ locale: string }> },
): Promise<ImageResponse> {
  await context.params;
  const url = new URL(request.url);
  const v = url.searchParams.get("v") ?? undefined;
  const p = url.searchParams.get("p") ?? "";
  const decoded = p.trim() ? decodeSharedParamP(v, p) : null;

  return buildOgImageResponse(decoded);
}
