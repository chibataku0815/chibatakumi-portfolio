/**
 * Filmtone 動的 OGP 画像（軸 D 拡張）
 *
 * 概要: 共有クエリ `?v=1&p=` を解釈し、ルック要約＋ヒーロー写真を焼いた 1200×630 の PNG を返す。
 * 仕様: `next/og` の ImageResponse（Satori）。`ja` ロケール時は Noto Sans JP（@fontsource）を同梱読み込み。
 * 制限: 実際のグレード結果ピクセルは描画しない（静的ヒーロー画像のみ）。フォント読み込み失敗時は英字のみにフォールバック。
 *
 * Wave 2 D5.1: `/film-lab/og` から carry → Lane B で `/filmtone/og` へ canonical 移動。
 * 2026-04-27 (Satellite Isolation 後続): public asset も `public/film-lab/` → `public/filmtone/` に移動済。
 *   ヒーロー画像は `/images/film-lab/default.jpg` のまま (こちらは redirect rule の対象外で別ヒエラルキー)。
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { findMatchingPreset, type PresetName } from "film-lab-core";
import { ImageResponse } from "next/og";
import { decodeSharedParamP } from "@/features/interactive/film-lab/params-codec";
import type { Params } from "@/features/interactive/film-lab/types";

export const runtime = "nodejs";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/** CDN・クローラ向け。URL ごとにキャッシュしつつ再検証可能にする */
const CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

const NOTO_FILES = {
  w400: "noto-sans-jp-japanese-400-normal.woff",
  w700: "noto-sans-jp-japanese-700-normal.woff",
} as const;

/** Preset characteristic colors for the OG palette visualization */
const OG_PRESET_PALETTE = [
  { label: "Cinematic", color: "#b87a3a" },
  { label: "Portra", color: "#c9a08e" },
  { label: "Gold 200", color: "#b89a4a" },
  { label: "Pro 400H", color: "#7a98aa" },
  { label: "Ektar", color: "#b85a3e" },
  { label: "Superia", color: "#6a906a" },
  { label: "CineStill", color: "#c48a42" },
  { label: "B&W", color: "#888" },
] as const;

/**
 * Node の Buffer を Satori が受け取る ArrayBuffer に変換する（共有バッファを切り離す）。
 * @param buf - readFile の結果
 */
function bufferToArrayBuffer(buf: Buffer): ArrayBuffer {
  const copy = new Uint8Array(buf.length);
  copy.set(buf);
  return copy.buffer;
}

/**
 * @fontsource/noto-sans-jp の WOFF を読み込む。パス解決に失敗したら null。
 * @param weightKey - 400 または 700 に対応するファイルキー
 */
async function loadNotoSansJpWoff(weightKey: keyof typeof NOTO_FILES): Promise<ArrayBuffer | null> {
  const fileName = NOTO_FILES[weightKey];
  const fontPath = path.join(
    process.cwd(),
    "node_modules",
    "@fontsource",
    "noto-sans-jp",
    "files",
    fileName,
  );
  try {
    const buf = await readFile(fontPath);
    return bufferToArrayBuffer(buf);
  } catch (err) {
    console.error(
      `[filmtone/og] loadNotoSansJpWoff: フォント読み込み失敗 fileName=${fileName} fontPath=${fontPath}`,
      err,
    );
    return null;
  }
}

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
 * @param locale - `ja` のとき日本語サブコピーと Noto フォントを試みる。
 * @param heroImageUrl - ヒーロー画像の絶対 URL（同一オリジン推奨）
 */
async function buildOgImageResponse(
  decoded: Params | null,
  locale: string,
  heroImageUrl: string,
): Promise<ImageResponse> {
  const isJa = locale === "ja";
  const matched = decoded ? findMatchingPreset(decoded) : null;
  const headline = decoded
    ? matched
      ? `Preset · ${formatPresetLabel(matched)}`
      : "Custom grade"
    : null;
  const sub = decoded
    ? summarizeGradeLine(decoded)
    : isJa
      ? "ブラウザでルックを試す"
      : "Decide your look in seconds";
  const brand = "chibatakumi.studio · Filmtone";

  const fonts: {
    name: string;
    data: ArrayBuffer;
    weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
    style: "normal" | "italic";
  }[] = [];

  if (isJa) {
    const [d400, d700] = await Promise.all([
      loadNotoSansJpWoff("w400"),
      loadNotoSansJpWoff("w700"),
    ]);
    if (d400) {
      fonts.push({ name: "Noto Sans JP", data: d400, weight: 400, style: "normal" });
    }
    if (d700) {
      fonts.push({ name: "Noto Sans JP", data: d700, weight: 700, style: "normal" });
    }
  }

  const subJaBroken = isJa && fonts.length === 0;
  const subFinal = subJaBroken ? "Decide your look in seconds" : sub;

  const fontFamily = isJa && fonts.length > 0 ? "Noto Sans JP" : "system-ui, sans-serif";

  const ogOptions = {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    headers: { "Cache-Control": CACHE_CONTROL },
    ...(fonts.length > 0 ? { fonts } : {}),
  };

  // Default card: clean layout with preset palette (Product Hunt, generic sharing)
  if (!decoded) {
    return new ImageResponse(
      (
        <div
          style={{
            width: OG_WIDTH,
            height: OG_HEIGHT,
            display: "flex",
            background:
              "linear-gradient(145deg, #0a0a0a 0%, #1a1510 45%, #221a12 100%)",
            padding: "48px 64px",
            color: "#f5f0e8",
            fontFamily,
          }}
        >
          {/* Left column: text */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flex: 1,
            }}
          >
            {/* Brand badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: "#151515",
                  border: "1.5px solid rgba(234,230,221,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    border: "1.5px solid rgba(234,230,221,0.5)",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 14,
                  color: "rgba(245,240,232,0.45)",
                  letterSpacing: "0.1em",
                  fontWeight: 500,
                }}
              >
                macOS + Browser
              </span>
            </div>

            {/* Title */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: 72,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                Filmtone
              </div>
              <div
                style={{
                  fontSize: 26,
                  color: "rgba(245,240,232,0.7)",
                  fontWeight: 500,
                  marginTop: 16,
                  lineHeight: 1.35,
                  maxWidth: 500,
                }}
              >
                {subFinal}
              </div>
            </div>

            {/* Footer */}
            <div style={{ fontSize: 14, color: "rgba(245,240,232,0.3)" }}>
              {brand}
            </div>
          </div>

          {/* Right column: preset palette */}
          <div
            style={{
              width: 380,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              {OG_PRESET_PALETTE.slice(0, 4).map(({ label, color }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 14,
                      background: color,
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      color: "rgba(245,240,232,0.35)",
                      fontWeight: 500,
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {OG_PRESET_PALETTE.slice(4).map(({ label, color }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 14,
                      background: color,
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      color: "rgba(245,240,232,0.35)",
                      fontWeight: 500,
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <span
              style={{
                fontSize: 13,
                color: "rgba(245,240,232,0.4)",
                marginTop: 8,
              }}
            >
              {isJa
                ? "9 プリセット · バッチ書き出し"
                : "9 presets · Batch export"}
            </span>
          </div>
        </div>
      ),
      ogOptions,
    );
  }

  // Preset card (shared look): hero image background with grade summary
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: OG_WIDTH,
          height: OG_HEIGHT,
          display: "flex",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          src={heroImageUrl}
          width={OG_WIDTH}
          height={OG_HEIGHT}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: OG_WIDTH,
            height: OG_HEIGHT,
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: OG_WIDTH,
            height: OG_HEIGHT,
            background:
              "linear-gradient(145deg, rgba(10,10,10,0.92) 0%, rgba(26,21,16,0.88) 45%, rgba(42,24,16,0.85) 100%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 64,
            color: "#f5f0e8",
            fontFamily,
            letterSpacing: "-0.02em",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 56, fontWeight: 700 }}>Filmtone</div>
            {headline ? (
              <div
                style={{
                  fontSize: 38,
                  color: "rgba(245,240,232,0.88)",
                  fontWeight: 600,
                }}
              >
                {headline}
              </div>
            ) : null}
            <div
              style={{
                fontSize: 28,
                color: "rgba(245,240,232,0.55)",
                fontWeight: 500,
              }}
            >
              {subFinal}
            </div>
          </div>
          <div
            style={{
              fontSize: 22,
              color: "rgba(245,240,232,0.4)",
              fontWeight: 500,
            }}
          >
            {brand}
          </div>
        </div>
      </div>
    ),
    ogOptions,
  );
}

/**
 * GET /[locale]/filmtone/og?v=1&p=...
 * クエリ p が有効なときはルック要約、無効時は汎用カード。
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ locale: string }> },
): Promise<ImageResponse> {
  const { locale } = await context.params;
  const url = new URL(request.url);
  const v = url.searchParams.get("v") ?? undefined;
  const p = url.searchParams.get("p") ?? "";
  const decoded = p.trim() ? decodeSharedParamP(v, p) : null;

  const origin = url.origin;
  const heroImageUrl = `${origin}/images/film-lab/default.jpg`;

  return buildOgImageResponse(decoded, locale, heroImageUrl);
}
