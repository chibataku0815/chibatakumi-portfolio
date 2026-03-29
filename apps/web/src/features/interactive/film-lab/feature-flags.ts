/**
 * Film Lab の機能フラグ（ビルド時に `NEXT_PUBLIC_*` が埋め込まれる）。
 *
 * 概要: 一般向け表示と開発者向け表示を切り替える。
 * 制限: クライアント・サーバー双方から import 可能な定数のみ置く。
 */

/**
 * 「共有」ブロック（ルック URL コピー・X 投稿）を表示するか。
 * 既定は **false**（非表示）。長いクエリ付き URL は一般ユーザーには分かりにくいため。
 * `.env.local` に `NEXT_PUBLIC_FILM_LAB_SHARE_UI=true` と書くと表示される。
 */
export const filmLabShareUiEnabled =
  typeof process.env.NEXT_PUBLIC_FILM_LAB_SHARE_UI === "string" &&
  process.env.NEXT_PUBLIC_FILM_LAB_SHARE_UI.trim().toLowerCase() === "true";

/**
 * スマートルック（課金者向けクラウド補正）UI を表示するか。
 * 既定 false（製品上はペンディング想定で非表示。再有効化手順: life #35）。
 * `NEXT_PUBLIC_FILM_LAB_SMART_LOOK_UI=true` で有効（サーバー検証済み支援者と組み合わせる）。
 */
export const filmLabSmartLookUiEnabled =
  typeof process.env.NEXT_PUBLIC_FILM_LAB_SMART_LOOK_UI === "string" &&
  process.env.NEXT_PUBLIC_FILM_LAB_SMART_LOOK_UI.trim().toLowerCase() === "true";

/**
 * スマートルックで **補正済み PNG を BFF から受け取りキャンバスに載せる**（画像レベル MVP）か。
 * 既定 false（Web）。Desktop は Vite の `define` で `NEXT_PUBLIC_FILM_LAB_SMART_LOOK_RASTER=true` を埋め込む想定。
 */
export const filmLabSmartLookRasterCorrectionEnabled =
  typeof process.env.NEXT_PUBLIC_FILM_LAB_SMART_LOOK_RASTER === "string" &&
  process.env.NEXT_PUBLIC_FILM_LAB_SMART_LOOK_RASTER.trim().toLowerCase() === "true";
