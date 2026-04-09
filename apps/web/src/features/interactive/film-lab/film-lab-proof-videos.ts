/**
 * @file Film Lab LP の仮 proof 動画設定です。
 * @description LP の proof セクションで使う短い mp4 clip の場所をまとめます。
 *   元の長い graded export から切り出した短尺版を `public/film-lab/proof/` に置き、
 *   LP 側はそこだけを参照します。
 * @limitations いまは仮の clip 名です。公開前に asset 名や正式ソースを整理する前提です。
 */

/**
 * @description LP の proof セクションで使う動画 ID です。
 */
export type FilmLabProofVideoId =
  | "gradedLookA"
  | "gradedLookB"
  | "compareNightStreet"
  | "compareDaylightWalk"
  | "compareDarkInterior";

/**
 * @description proof 動画 1 本ぶんの設定です。
 * @property {FilmLabProofVideoId} id - LP と設定ファイルで共有する固定 ID。
 * @property {string} publicPath - `apps/web/public` 配下から配信する mp4 の URL です。
 */
interface FilmLabProofVideoDefinition {
  id: FilmLabProofVideoId;
  publicPath: string;
}

/**
 * @description 現在 LP に仮差し込みする proof 動画の一覧です。
 */
const filmLabProofVideoDefinitions: readonly FilmLabProofVideoDefinition[] = [
  {
    id: "gradedLookA",
    publicPath: "/film-lab/proof/graded-look-a.mp4",
  },
  {
    id: "gradedLookB",
    publicPath: "/film-lab/proof/graded-look-b.mp4",
  },
  {
    id: "compareNightStreet",
    publicPath: "/film-lab/proof/compare-night-street.mp4",
  },
  {
    id: "compareDaylightWalk",
    publicPath: "/film-lab/proof/compare-daylight-walk.mp4",
  },
  {
    id: "compareDarkInterior",
    publicPath: "/film-lab/proof/compare-dark-interior.mp4",
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
 * @description クライアント側で使う proof 動画 URL を返します。
 * @param {FilmLabProofVideoId} videoId - LP 側で参照する固定 ID。
 * @returns {string} `public` から配信する mp4 の URL。未定義なら空文字。
 */
export function filmLabBuildProofVideoUrl(videoId: FilmLabProofVideoId): string {
  const matchedVideo = filmLabGetProofVideoDefinition(videoId);
  return matchedVideo?.publicPath ?? "";
}
