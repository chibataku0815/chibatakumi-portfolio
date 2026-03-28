/**
 * Film Lab の「ルック付き URL」用ヘルパー。
 * クエリ v でスキーマ版、p で base64(JSON) の Params を運ぶ（軸 D）。
 */
import { encodeParams } from "./params-codec";
import type { Params } from "./types";

/** 現在の共有パラメータ形式（ハンドオフの v=1 と一致） */
export const FILM_LAB_SHARE_VERSION = "1";

/**
 * クエリ文字列を組み立てる（先頭の ? は付けない）。
 * p は URL に載せるので encodeURIComponent 済み。
 */
export function buildFilmLabShareQuery(params: Params): string {
  const p = encodeURIComponent(encodeParams(params));
  return `v=${FILM_LAB_SHARE_VERSION}&p=${p}`;
}

/**
 * 共有用の絶対 URL（クリップボード・X 投稿用）。
 */
export function buildFilmLabShareUrl(origin: string, pathname: string, params: Params): string {
  const q = buildFilmLabShareQuery(params);
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${origin.replace(/\/$/, "")}${path}?${q}`;
}

/**
 * X（Twitter）の投稿用 intent URL。
 */
export function buildFilmLabPostToXUrl(pageUrl: string, text: string): string {
  const u = new URL("https://twitter.com/intent/tweet");
  u.searchParams.set("url", pageUrl);
  u.searchParams.set("text", text);
  return u.toString();
}
