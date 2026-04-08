import type { PremiumMotionProfile } from "./premium-motion";

type PrimitiveStudyValue = string | number | boolean | null | undefined;

export type StudyValue =
  | PrimitiveStudyValue
  | readonly PrimitiveStudyValue[]
  | PremiumMotionProfile;

export type ComparisonAxisCategory =
  | "timing"
  | "spatial"
  | "structure"
  | "control"
  | "editorial"
  | "metadata";

export interface MotionStudyVariantCore<VariantId extends string = string> {
  id: VariantId;
  name: string;
  note: string;
  motion?: PremiumMotionProfile;
  chromeDelayFrames?: number;
  contentDelayFrames?: number;
  detailDelayFrames?: number;
  railDelayFrames?: number;
  gapFrames?: number;
  cutFrame?: number;
  revealStaggerFrames?: number;
}

export type MotionStudyVariantDefinition<
  VariantId extends string = string,
  Extra extends object = {},
> = MotionStudyVariantCore<VariantId> & Extra;

export interface MotionStudyComparisonAxis<
  Variant extends MotionStudyVariantCore = MotionStudyVariantCore,
> {
  id: string;
  label: string;
  description: string;
  category?: ComparisonAxisCategory;
  getValue: (variant: Variant) => StudyValue;
}

export interface StrongestVariantShortlistEntry<VariantId extends string = string> {
  variantId: VariantId;
  reason: string;
  confidence?: "tentative" | "strong";
}

export interface MotionStudyDefinitionRecord<
  StudyId extends string = string,
  Variant extends MotionStudyVariantCore = MotionStudyVariantCore,
> {
  id: StudyId;
  title: string;
  question: string;
  observation: string;
  inference: string;
  variants: readonly Variant[];
  axes?: readonly MotionStudyComparisonAxis<Variant>[];
  shortlist?: readonly StrongestVariantShortlistEntry<Variant["id"]>[];
}

export interface StudyEvidenceMeta {
  kind: "observed" | "inference";
  label: "Observed" | "Inference";
  text: string;
}

export interface VariantComparisonLabel<VariantId extends string = string> {
  variantId: VariantId;
  shortLabel: string;
  fullLabel: string;
  panelLabel: string;
}

export interface StudyComparisonLabels<VariantId extends string = string> {
  studyLabel: string;
  questionLabel: string;
  evidenceLabels: readonly StudyEvidenceMeta[];
  variantLabels: readonly VariantComparisonLabel<VariantId>[];
  pairLabels: readonly string[];
}

export interface MotionStudyAxisSummary<VariantId extends string = string> {
  id: string;
  label: string;
  description: string;
  category: ComparisonAxisCategory;
  distinctValueCount: number;
  variantValues: readonly {
    variantId: VariantId;
    value: StudyValue;
    label: string;
  }[];
}

export interface VariantMatrixCell {
  axisId: string;
  axisLabel: string;
  category: ComparisonAxisCategory;
  value: StudyValue;
  label: string;
}

export interface VariantMatrixRow<VariantId extends string = string> {
  variantId: VariantId;
  variantLabel: string;
  note: string;
  cells: readonly VariantMatrixCell[];
}

export interface VariantMatrix<StudyId extends string = string, VariantId extends string = string> {
  studyId: StudyId;
  studyTitle: string;
  axes: readonly {
    id: string;
    label: string;
    description: string;
    category: ComparisonAxisCategory;
  }[];
  rows: readonly VariantMatrixRow<VariantId>[];
}

export interface RepresentativeFrameMarker {
  id: string;
  frame: number;
  label: string;
  reason: string;
}

export interface RepresentativeFramePlan<VariantId extends string = string> {
  variantId: VariantId;
  variantLabel: string;
  recommendedHeroFrame: number;
  estimatedStudyWindow: number;
  frames: readonly number[];
  markers: readonly RepresentativeFrameMarker[];
}

export interface RepresentativeFrameSet<
  StudyId extends string = string,
  VariantId extends string = string,
> {
  studyId: StudyId;
  unionFrames: readonly number[];
  variants: readonly RepresentativeFramePlan<VariantId>[];
}

export interface ContactSheetFrame<StudyId extends string = string, VariantId extends string = string> {
  studyId: StudyId;
  variantId: VariantId;
  frame: number;
  panelLabel: string;
  outputStem: string;
}

export interface ContactSheetPlan<StudyId extends string = string, VariantId extends string = string> {
  studyId: StudyId;
  title: string;
  columns: number;
  rows: number;
  frames: readonly ContactSheetFrame<StudyId, VariantId>[];
}

interface NormalizedAxis<Variant extends MotionStudyVariantCore = MotionStudyVariantCore> {
  id: string;
  label: string;
  description: string;
  category: ComparisonAxisCategory;
  getValue: (variant: Variant) => StudyValue;
}

const STUDY_VARIANT_META_KEYS = new Set(["id", "name", "note"]);

const timingKeys = ["delay", "gap", "stagger", "cut", "duration", "launch", "settle"];
const spatialKeys = ["scale", "shift", "offset", "x", "y"];

const uniqueSortedNumbers = (values: readonly number[]): number[] =>
  [...new Set(values)].sort((left, right) => left - right);

const clampFrame = (frame: number): number => Math.max(0, Math.round(frame));

const toTitleCase = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getAxisCategory = (axisId: string): ComparisonAxisCategory => {
  const normalized = axisId.toLowerCase();
  if (normalized === "motion" || normalized.includes("curve")) {
    return "control";
  }

  if (timingKeys.some((token) => normalized.includes(token))) {
    return normalized.includes("cut") || normalized.includes("gap")
      ? "editorial"
      : "timing";
  }

  if (spatialKeys.some((token) => normalized.includes(token))) {
    return "spatial";
  }

  return "metadata";
};

const getMotionDuration = (motion?: PremiumMotionProfile): number => {
  if (!motion) {
    return 0;
  }

  if (motion.mode === "flat" || motion.mode === "back-control") {
    return motion.durationFrames;
  }

  return motion.launchFrames + motion.settleFrames;
};

const formatPrimitiveValue = (value: PrimitiveStudyValue): string => {
  if (value === undefined) {
    return "none";
  }

  if (value === null) {
    return "null";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? `${value}` : value.toFixed(2);
  }

  if (typeof value === "boolean") {
    return value ? "yes" : "no";
  }

  return value;
};

export const describeMotionProfile = (motion?: PremiumMotionProfile): string => {
  if (!motion) {
    return "none";
  }

  if (motion.mode === "flat") {
    return `flat ${motion.curve} / ${motion.durationFrames}f`;
  }

  if (motion.mode === "back-control") {
    return `back-control / ${motion.durationFrames}f`;
  }

  return [
    `two-stage ${motion.launchCurve} -> ${motion.settleCurve}`,
    `${motion.launchFrames}f + ${motion.settleFrames}f`,
    `${Math.round(motion.launchPortion * 100)}% launch`,
  ].join(" / ");
};

export const formatStudyValue = (value: StudyValue): string => {
  if (Array.isArray(value)) {
    return value.map((entry) => formatPrimitiveValue(entry)).join(", ");
  }

  if (value && typeof value === "object" && "mode" in value) {
    return describeMotionProfile(value);
  }

  return formatPrimitiveValue(value as PrimitiveStudyValue);
};

export const buildObservedInferenceLabels = (
  observation: string,
  inference: string,
): readonly StudyEvidenceMeta[] => [
  {
    kind: "observed",
    label: "Observed",
    text: observation,
  },
  {
    kind: "inference",
    label: "Inference",
    text: inference,
  },
];

const inferAxes = <Variant extends MotionStudyVariantCore>(
  variants: readonly Variant[],
): NormalizedAxis<Variant>[] => {
  if (variants.length === 0) {
    return [];
  }

  const seenKeys = new Set<string>();
  for (const variant of variants) {
    for (const key of Object.keys(variant)) {
      if (!STUDY_VARIANT_META_KEYS.has(key)) {
        seenKeys.add(key);
      }
    }
  }

  return [...seenKeys]
    .map((key) => {
      const values = variants.map((variant) =>
        formatStudyValue((variant as unknown as Record<string, StudyValue>)[key]),
      );

      if (new Set(values).size <= 1) {
        return null;
      }

      return {
        id: key,
        label: toTitleCase(key),
        description: `Variation in ${toTitleCase(key).toLowerCase()}.`,
        category: getAxisCategory(key),
        getValue: (variant: Variant) =>
          (variant as unknown as Record<string, StudyValue>)[key],
      } satisfies NormalizedAxis<Variant>;
    })
    .filter((axis): axis is NormalizedAxis<Variant> => axis !== null);
};

const normalizeAxes = <
  StudyId extends string,
  Variant extends MotionStudyVariantCore,
>(
  study: MotionStudyDefinitionRecord<StudyId, Variant>,
  axes?: readonly MotionStudyComparisonAxis<Variant>[],
): NormalizedAxis<Variant>[] => {
  const sourceAxes = axes ?? study.axes;
  if (!sourceAxes || sourceAxes.length === 0) {
    return inferAxes(study.variants);
  }

  return sourceAxes.map((axis) => ({
    id: axis.id,
    label: axis.label,
    description: axis.description,
    category: axis.category ?? getAxisCategory(axis.id),
    getValue: axis.getValue,
  }));
};

const buildPairLabels = <VariantId extends string>(
  variants: readonly { id: VariantId }[],
): string[] => {
  const labels: string[] = [];
  for (let index = 0; index < variants.length; index += 1) {
    for (let compareIndex = index + 1; compareIndex < variants.length; compareIndex += 1) {
      labels.push(`${variants[index].id} vs ${variants[compareIndex].id}`);
    }
  }

  return labels;
};

export const buildComparisonLabels = <
  StudyId extends string,
  Variant extends MotionStudyVariantCore,
>(
  study: MotionStudyDefinitionRecord<StudyId, Variant>,
): StudyComparisonLabels<Variant["id"]> => ({
  studyLabel: study.title,
  questionLabel: `Question: ${study.question}`,
  evidenceLabels: buildObservedInferenceLabels(study.observation, study.inference),
  variantLabels: study.variants.map((variant) => ({
    variantId: variant.id,
    shortLabel: `Variant ${variant.id}`,
    fullLabel: `Variant ${variant.id}: ${variant.name}`,
    panelLabel: `${study.title} / Variant ${variant.id}`,
  })),
  pairLabels: buildPairLabels(study.variants),
});

export const summarizeVariantAxes = <
  StudyId extends string,
  Variant extends MotionStudyVariantCore,
>(
  study: MotionStudyDefinitionRecord<StudyId, Variant>,
  axes?: readonly MotionStudyComparisonAxis<Variant>[],
): MotionStudyAxisSummary<Variant["id"]>[] =>
  normalizeAxes(study, axes).map((axis) => {
    const variantValues = study.variants.map((variant) => {
      const value = axis.getValue(variant);
      return {
        variantId: variant.id,
        value,
        label: formatStudyValue(value),
      };
    });

    return {
      id: axis.id,
      label: axis.label,
      description: axis.description,
      category: axis.category,
      distinctValueCount: new Set(variantValues.map((entry) => entry.label)).size,
      variantValues,
    };
  });

export const createVariantMatrix = <
  StudyId extends string,
  Variant extends MotionStudyVariantCore,
>(
  study: MotionStudyDefinitionRecord<StudyId, Variant>,
  axes?: readonly MotionStudyComparisonAxis<Variant>[],
): VariantMatrix<StudyId, Variant["id"]> => {
  const normalizedAxes = normalizeAxes(study, axes);

  return {
    studyId: study.id,
    studyTitle: study.title,
    axes: normalizedAxes.map((axis) => ({
      id: axis.id,
      label: axis.label,
      description: axis.description,
      category: axis.category,
    })),
    rows: study.variants.map((variant) => ({
      variantId: variant.id,
      variantLabel: `Variant ${variant.id}: ${variant.name}`,
      note: variant.note,
      cells: normalizedAxes.map((axis) => {
        const value = axis.getValue(variant);
        return {
          axisId: axis.id,
          axisLabel: axis.label,
          category: axis.category,
          value,
          label: formatStudyValue(value),
        };
      }),
    })),
  };
};

const estimateStudyWindow = (
  variant: MotionStudyVariantCore,
  recoveryFrames: number,
): number => {
  const motionFrames = getMotionDuration(variant.motion);
  const delayFrames = Math.max(
    variant.chromeDelayFrames ?? 0,
    variant.contentDelayFrames ?? 0,
    variant.detailDelayFrames ?? 0,
    variant.railDelayFrames ?? 0,
  );
  const editorialFrames = (variant.gapFrames ?? 0) + (variant.revealStaggerFrames ?? 0);
  const cutWindow =
    variant.cutFrame !== undefined
      ? variant.cutFrame + Math.max(variant.detailDelayFrames ?? 0, recoveryFrames)
      : 0;

  return Math.max(
    12,
    motionFrames + delayFrames + editorialFrames,
    cutWindow,
  );
};

export const selectDefaultCaptureFrames = (
  variant: MotionStudyVariantCore,
  options?: {
    preEventPadding?: number;
    recoveryFrames?: number;
    maxFrames?: number;
  },
): number[] => {
  const preEventPadding = options?.preEventPadding ?? 4;
  const recoveryFrames = options?.recoveryFrames ?? 12;
  const maxFrames = options?.maxFrames ?? 4;
  const motionFrames = getMotionDuration(variant.motion);
  const maxDelay = Math.max(
    variant.chromeDelayFrames ?? 0,
    variant.contentDelayFrames ?? 0,
    variant.detailDelayFrames ?? 0,
    variant.railDelayFrames ?? 0,
  );
  const studyWindow = estimateStudyWindow(variant, recoveryFrames);

  const candidateFrames = [
    0,
    motionFrames > 0 ? Math.round(motionFrames * 0.25) : 0,
    motionFrames > 0 ? Math.round(motionFrames * 0.5) : 0,
    motionFrames,
    motionFrames + maxDelay,
    motionFrames + maxDelay + (variant.gapFrames ?? 0),
    motionFrames +
      maxDelay +
      (variant.gapFrames ?? 0) +
      (variant.revealStaggerFrames ?? 0) +
      recoveryFrames / 2,
    variant.cutFrame !== undefined ? variant.cutFrame - preEventPadding : 0,
    variant.cutFrame ?? 0,
    variant.cutFrame !== undefined
      ? variant.cutFrame + Math.max(variant.detailDelayFrames ?? 0, recoveryFrames / 2)
      : 0,
    studyWindow,
  ]
    .map(clampFrame)
    .filter((frame) => frame <= studyWindow);

  const uniqueFrames = uniqueSortedNumbers(candidateFrames);
  if (uniqueFrames.length <= maxFrames) {
    return uniqueFrames;
  }

  const pivotCandidates = [
    uniqueFrames[0],
    uniqueFrames[Math.floor(uniqueFrames.length / 3)],
    uniqueFrames[Math.floor((uniqueFrames.length * 2) / 3)],
    uniqueFrames[uniqueFrames.length - 1],
  ];

  return uniqueSortedNumbers(pivotCandidates).slice(0, maxFrames);
};

export const getRepresentativeFrameSet = <
  StudyId extends string,
  Variant extends MotionStudyVariantCore,
>(
  study: MotionStudyDefinitionRecord<StudyId, Variant>,
  options?: {
    preEventPadding?: number;
    recoveryFrames?: number;
    maxFramesPerVariant?: number;
  },
): RepresentativeFrameSet<StudyId, Variant["id"]> => {
  const variants = study.variants.map((variant) => {
    const frames = selectDefaultCaptureFrames(variant, {
      preEventPadding: options?.preEventPadding,
      recoveryFrames: options?.recoveryFrames,
      maxFrames: options?.maxFramesPerVariant,
    });
    const estimatedStudyWindow = estimateStudyWindow(
      variant,
      options?.recoveryFrames ?? 12,
    );
    const markers: RepresentativeFrameMarker[] = frames.map((frame, index) => ({
      id: `${variant.id}-${index + 1}`,
      frame,
      label: `Frame ${frame}`,
      reason:
        index === 0
          ? "Opening state."
          : index === frames.length - 1
            ? "Settled or post-transition state."
            : "Comparison checkpoint.",
    }));

    return {
      variantId: variant.id,
      variantLabel: `Variant ${variant.id}: ${variant.name}`,
      recommendedHeroFrame: frames[Math.floor(frames.length / 2)] ?? 0,
      estimatedStudyWindow,
      frames,
      markers,
    };
  });

  return {
    studyId: study.id,
    unionFrames: uniqueSortedNumbers(
      variants.flatMap((variant) => variant.frames.map((frame) => frame)),
    ),
    variants,
  };
};

export const createContactSheetPlan = <
  StudyId extends string,
  Variant extends MotionStudyVariantCore,
>(
  study: MotionStudyDefinitionRecord<StudyId, Variant>,
  options?: {
    columns?: number;
    frameOffset?: number;
    outputPrefix?: string;
  },
): ContactSheetPlan<StudyId, Variant["id"]> => {
  const frameOffset = options?.frameOffset ?? 0;
  const outputPrefix = options?.outputPrefix ?? study.id;
  const columns = options?.columns ?? study.variants.length;
  const representativeFrames = getRepresentativeFrameSet(study, {
    maxFramesPerVariant: 1,
  });

  const frames = representativeFrames.variants.map((variantPlan) => {
    const frame = variantPlan.recommendedHeroFrame + frameOffset;
    return {
      studyId: study.id,
      variantId: variantPlan.variantId,
      frame,
      panelLabel: `${study.title} / Variant ${variantPlan.variantId}`,
      outputStem: `${outputPrefix}-${variantPlan.variantId.toLowerCase()}-${frame}`,
    };
  });

  return {
    studyId: study.id,
    title: study.title,
    columns,
    rows: Math.ceil(frames.length / columns),
    frames,
  };
};

export const createStudyPanelMeta = <
  StudyId extends string,
  Variant extends MotionStudyVariantCore,
>(
  study: MotionStudyDefinitionRecord<StudyId, Variant>,
): {
  studyId: StudyId;
  title: string;
  question: string;
  evidence: readonly StudyEvidenceMeta[];
  variants: readonly {
    variantId: Variant["id"];
    panelLabel: string;
    name: string;
    note: string;
  }[];
} => {
  const labels = buildComparisonLabels(study);

  return {
    studyId: study.id,
    title: study.title,
    question: study.question,
    evidence: labels.evidenceLabels,
    variants: study.variants.map((variant, index) => ({
      variantId: variant.id,
      panelLabel: labels.variantLabels[index]?.panelLabel ?? `Variant ${variant.id}`,
      name: variant.name,
      note: variant.note,
    })),
  };
};

export const createStrongestVariantShortlist = <
  VariantId extends string,
>(
  entries: readonly StrongestVariantShortlistEntry<VariantId>[],
): readonly StrongestVariantShortlistEntry<VariantId>[] => [...entries];
