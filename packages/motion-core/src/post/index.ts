// Re-export shim for webgpu-motion-post.
// Resolves via root workspaces glob; will be backed by
// vendor/webgpu-motion-libs/packages/webgpu-motion-post once Phase A submodule lands.

export {
  motionFilmDefaults,
  motionFilmPassthroughDefaults,
  createFilmPostPass,
  createPassthroughFilmPostPass,
} from "webgpu-motion-post";

export type {
  MotionFilmPostConfig,
  MotionFilmPostPass,
} from "webgpu-motion-post";
