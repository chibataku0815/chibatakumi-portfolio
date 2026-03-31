/**
 * Bridge: re-exports MediaLoader from the shared renderer package.
 * Web consumers continue importing from this path; canonical source is film-lab-renderer.
 */
export {
  MediaLoader,
  MediaLoadError,
  isLikelyHeicFile,
  isFilmLabMediaDebugEnabled,
  type LoadResult,
  type LoadFileOptions,
} from "film-lab-renderer";
