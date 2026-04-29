/**
 * @file Film Lab Desktop の公開導線で使う固定情報。
 * @description Web の案内カードと固定ダウンロード URL ルートで、同じ公開条件を参照できるようにします。
 * @limitations 実際の配布ファイル URL はデプロイ環境変数で渡します。未設定のときは案内ページだけを表示します。
 */

/** Desktop 配布・不具合の窓口（Web の Film Lab カード・ダウンロード案内と同期すること） */
export const filmLabDesktopSupportEmail = "chiba@fores-tone.co.jp";
export const filmLabDesktopPublicVersion = "1.0.3";
export const filmLabDesktopMinimumMacos = "11.0";
export const filmLabDesktopArchitecture = "Apple Silicon (arm64)";
export const filmLabDesktopDownloadRoute = "/filmtone/download";

/**
 * 公開 DMG の固定リンク先を環境変数から読みます。
 *
 * @returns {string} 配布ファイル URL。未設定なら空文字。
 */
export function filmLabReadDesktopDownloadUrl() {
  return (
    process.env.FILM_LAB_DESKTOP_DOWNLOAD_URL?.trim() ||
    process.env.NEXT_PUBLIC_FILM_LAB_DESKTOP_DOWNLOAD_URL?.trim() ||
    ""
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
