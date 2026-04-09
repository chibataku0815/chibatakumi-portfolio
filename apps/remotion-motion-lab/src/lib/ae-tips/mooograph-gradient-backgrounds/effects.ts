export const mooographPassIds = {
  gradientField: "GradientFieldPass",
  flowDisplace: "FlowDisplacePass",
  vaporComposite: "VaporCompositePass",
  smokeGrade: "SmokeGradePass",
  surfacePrecomp: "SurfacePrecompPass",
  surfaceTransform: "SurfaceTransformPass",
  directionalSmear: "DirectionalSmearPass",
  radialWarp: "RadialWarpPass",
  edgeExtend: "EdgeExtendPass",
  surfaceShade: "SurfaceShadePass",
  composite: "CompositePass",
} as const;

export const mooographPassMeta = {
  [mooographPassIds.gradientField]: {
    label: "Gradient Field",
    purpose: "Build the moving four-point color field.",
  },
  [mooographPassIds.flowDisplace]: {
    label: "Flow Displace",
    purpose: "Advect the source image through turbulence fields.",
  },
  [mooographPassIds.vaporComposite]: {
    label: "Vapor Composite",
    purpose: "Synthesize plume density and internal fibers from the displaced source.",
  },
  [mooographPassIds.smokeGrade]: {
    label: "Smoke Grade",
    purpose: "Push highlights and final tone for the vapor recipe.",
  },
  [mooographPassIds.surfacePrecomp]: {
    label: "Surface Precomp",
    purpose: "Generate hidden ribbon geometry as packed tint and thickness fields.",
  },
  [mooographPassIds.surfaceTransform]: {
    label: "Surface Transform",
    purpose: "Scale and travel the hidden sheet before smear and warp.",
  },
  [mooographPassIds.directionalSmear]: {
    label: "Directional Smear",
    purpose: "Fuse the hidden geometry into a continuous sheet.",
  },
  [mooographPassIds.radialWarp]: {
    label: "Radial Warp",
    purpose: "Curve the packed sheet into a broader liquid silhouette.",
  },
  [mooographPassIds.edgeExtend]: {
    label: "Edge Extend",
    purpose: "Preserve sheet continuity after displace and repeat.",
  },
  [mooographPassIds.surfaceShade]: {
    label: "Surface Shade",
    purpose: "Refract the background through the packed sheet and light the surface.",
  },
  [mooographPassIds.composite]: {
    label: "Composite",
    purpose: "Composite the refracted surface with shadowing over the gradient field.",
  },
} as const;

export const basicEffectPipeline = [
  mooographPassIds.gradientField,
  mooographPassIds.flowDisplace,
] as const;

export const smokeEffectPipeline = [
  mooographPassIds.gradientField,
  mooographPassIds.flowDisplace,
  mooographPassIds.flowDisplace,
  mooographPassIds.vaporComposite,
  mooographPassIds.smokeGrade,
] as const;

export const marbleEffectPipeline = [
  mooographPassIds.gradientField,
  mooographPassIds.surfacePrecomp,
  mooographPassIds.surfaceTransform,
  mooographPassIds.directionalSmear,
  mooographPassIds.radialWarp,
  mooographPassIds.flowDisplace,
  mooographPassIds.edgeExtend,
  mooographPassIds.surfaceShade,
  mooographPassIds.composite,
] as const;

export const mooographEffectPipelines = {
  basic: basicEffectPipeline,
  smoke: smokeEffectPipeline,
  marble: marbleEffectPipeline,
} as const;
