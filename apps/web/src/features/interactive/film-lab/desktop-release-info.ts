/**
 * @file Film Lab Desktop の公開導線で使う固定情報。
 * @description Web の案内カードと固定ダウンロード URL ルートで、同じ公開条件を参照できるようにします。
 * @limitations デプロイ環境変数がある場合はそちらを優先し、未設定なら現行公開 DMG の固定 URL を使います。
 */

/** Desktop 配布・不具合の窓口（Web の Film Lab カード・ダウンロード案内と同期すること） */
export const filmLabDesktopSupportEmail = "chiba@fores-tone.co.jp";
export const filmLabDesktopPublicVersion = "1.6";
export const filmLabDesktopMinimumMacos = "26.0";
export const filmLabDesktopArchitecture = "Universal (arm64 + x86_64)";
export const filmLabDesktopDownloadRoute = "/filmtone/download";
export const filmLabDesktopDownloadUrl =
  "https://ehi6m41cp33jiopb.public.blob.vercel-storage.com/filmtone/desktop/Filmtone-1.6.dmg";

/**
 * 公開 DMG の固定リンク先を読みます。
 *
 * @returns {string} 配布ファイル URL。環境変数があれば優先し、なければ現行公開 DMG を返します。
 */
export function filmLabReadDesktopDownloadUrl() {
  return (
    process.env.FILM_LAB_DESKTOP_DOWNLOAD_URL?.trim() ||
    process.env.NEXT_PUBLIC_FILM_LAB_DESKTOP_DOWNLOAD_URL?.trim() ||
    filmLabDesktopDownloadUrl
  );
}

/**
 * 配布 URL から公開アーティファクト名だけを取り出します。
 *
 * @returns {string} `filmtone-1.0.1-arm64.dmg` のような basename。取れないときは `"unknown"`。
 */
export function filmLabResolveDesktopDownloadArtifactName(downloadUrl: string) {
  const trimmed = downloadUrl.trim();
  if (trimmed.length === 0) return "unknown";

  try {
    const url = new URL(trimmed);
    const pathname = url.pathname.replace(/\/+$/, "");
    const basename = pathname.split("/").pop()?.trim() ?? "";
    return basename.length > 0 && basename.includes(".") ? basename : "unknown";
  } catch {
    return "unknown";
  }
}
