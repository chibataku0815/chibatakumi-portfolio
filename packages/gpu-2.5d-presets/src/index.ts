// ── Types ──────────────────────────────────────────────
export type {
  Vec2,
  Vec3,
  Quad,
  PerspectiveCorners,
  CameraState,
  OrbitalCameraState,
  ProjectionResult,
  BoxDimensions,
  BoxPose,
  BoxFace,
  Layer,
  Viewport,
  CompositionConfig,
} from './types.js';

// ── Camera ─────────────────────────────────────────────
export type { EasingFn, CreateCameraConfig, CreateOrbitalCameraConfig } from './camera.js';
export {
  createCamera,
  createOrbitalCamera,
  mixCamera,
  mixOrbitalCamera,
  dolly,
  pan,
  truck,
  orbit,
} from './camera.js';

// ── Projection ─────────────────────────────────────────
export {
  projectPoint,
  projectPointWithCamera,
  projectPointOrbital,
  normalizedToViewport,
  viewportToNormalized,
  sortByDepth,
} from './projection.js';

// ── Box Rig ────────────────────────────────────────────
export type { Rect, FaceId, FacePayload, BoxDescriptor, BoxRig, VisibleFace } from './box-rig.js';
export {
  DEFAULT_FOCAL_LENGTH,
  VISIBILITY_EPSILON,
  FACE_ORDER,
  buildBoxRig,
  resolveBoxRigFaces,
  compileBoxRigFaceToPlaneInput,
} from './box-rig.js';

// ── Perspective Warp ───────────────────────────────────
export type {
  PlaneChild,
  CenteredGeometry,
  BaseTransform,
  ResolvedChild,
  PerspectivePlaneGroupConfig,
} from './perspective-warp.js';
export {
  sampleQuad,
  interpolateQuad,
  translateQuad,
  buildPerspectiveCorners,
  resolveChildQuad,
  buildPerspectivePlaneGroup,
} from './perspective-warp.js';

// ── Layer Management ───────────────────────────────────
export type { CompositionLayer, ResolvedLayer } from './layer.js';
export {
  createLayer,
  sortLayersByDepth,
  resolveLayersWithCamera,
} from './layer.js';

// ── Compositor (WebGPU) ────────────────────────────────
export type { CompositorConfig, CompositorLayer, Compositor, RimConfig } from './compositor.js';
export { createCompositor } from './compositor.js';

// ── Presets ───────────────────────────────────────────────
export type {
  PresetLayerBlueprint,
  CameraKeyframe,
  PresetAnimation,
  ScenePreset,
  ScenePresetConfig,
} from './presets.js';
export {
  SCENE_PRESET_DEFAULTS,
  SCENE_PRESETS,
  findPreset,
  buildPresetCamera,
  buildPresetLayers,
  evaluatePresetAnimation,
} from './presets.js';
