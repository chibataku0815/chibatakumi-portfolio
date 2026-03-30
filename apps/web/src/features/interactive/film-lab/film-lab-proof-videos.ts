/**
 * @file Film Lab LP の仮 proof 動画設定です。
 * @description ローカル保存の mp4 を route handler 経由で配信するために、
 *   動画 ID と元ファイルの絶対パスをまとめます。
 * @limitations いまはローカル環境向けの暫定設定です。公開前には `public` 配下や正式な配信先へ置き換える前提です。
 */

/**
 * @description LP の proof セクションで使う動画 ID です。
 */
export type FilmLabProofVideoId = "gradedLookA" | "gradedLookB";

/**
 * @description proof 動画 1 本ぶんの設定です。
 * @property {FilmLabProofVideoId} id - クライアントと route で共有する固定 ID。
 * @property {string} sourcePath - ローカル環境で読みに行く元ファイルの絶対パス。
 * @property {number} previewStartSeconds - LP 上で見せ始める代表フレーム位置です。
 */
interface FilmLabProofVideoDefinition {
  id: FilmLabProofVideoId;
  sourcePath: string;
  previewStartSeconds: number;
}

/**
 * @description 現在 LP に仮差し込みする proof 動画の一覧です。
 */
const filmLabProofVideoDefinitions: readonly FilmLabProofVideoDefinition[] = [
  {
    id: "gradedLookA",
    sourcePath: "/Users/chibatakumi/Pictures/test-outputs/1769692582094-graded.mp4",
    previewStartSeconds: 10,
  },
  {
    id: "gradedLookB",
    sourcePath: "/Users/chibatakumi/Pictures/test-outputs/dji_mimo_0_0_0_1769687084723-graded.mp4",
    previewStartSeconds: 5,
  },
] as const;

/**
 * @description 動画 ID から設定を引きます。存在しない ID は `null` を返します。
 * @param {string} videoId - URL などから受け取った動画 ID。
 * @returns {FilmLabProofVideoDefinition | null} 見つかった設定、または `null`。
 */
export function filmLabGetProofVideoDefinition(videoId: string): FilmLabProofVideoDefinition | null {
  const matchedVideo =
    filmLabProofVideoDefinitions.find((videoDefinition) => videoDefinition.id === videoId) ?? null;
  return matchedVideo;
}

/**
 * @description クライアント側で使う proof 動画 URL を作ります。
 * @param {FilmLabProofVideoId} videoId - LP 側で参照する固定 ID。
 * @returns {string} route handler の URL。
 */
export function filmLabBuildProofVideoUrl(videoId: FilmLabProofVideoId): string {
  return `/api/film-lab/proof-videos/${videoId}`;
}

/**
 * @description proof 動画の見せ始め位置を返します。
 * @param {FilmLabProofVideoId} videoId - LP 側で参照する固定 ID。
 * @returns {number} 秒数。未定義時は 0。
 */
export function filmLabGetProofVideoPreviewStartSeconds(videoId: FilmLabProofVideoId): number {
  const matchedVideo = filmLabGetProofVideoDefinition(videoId);
  return matchedVideo?.previewStartSeconds ?? 0;
}
