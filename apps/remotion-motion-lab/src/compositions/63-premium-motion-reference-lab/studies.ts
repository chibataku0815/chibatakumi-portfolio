import {
  createBackControlProfile,
  createFastLaunchLongSettle,
  createFlatProfile,
  type PremiumMotionProfile as MotionProfile,
} from "../../lib/premium-motion";
import type {
  MotionStudyComparisonAxis,
  MotionStudyDefinitionRecord as StudyDefinitionRecord,
  StrongestVariantShortlistEntry,
  MotionStudyVariantDefinition as StudyVariantDefinition,
} from "../../lib/motion-study-tools";
import { createStrongestVariantShortlist } from "../../lib/motion-study-tools";

export type MotionStudyId =
  | "push-in-lab"
  | "pull-back-lab"
  | "long-settle-lab"
  | "snap-in-lab"
  | "continuity-lab"
  | "editorial-gap-lab"
  | "layered-reveal-lab";

export type MotionStudyVariant = StudyVariantDefinition<
  "A" | "B" | "C",
  {
  motion: MotionProfile;
  scaleFrom?: number;
  scaleTo?: number;
  detailScaleFrom?: number;
  detailScaleTo?: number;
  yFrom?: number;
  yTo?: number;
  xFrom?: number;
  xTo?: number;
  backgroundShift?: number;
  backgroundScaleFrom?: number;
  backgroundScaleTo?: number;
  chromeDelayFrames?: number;
  contentDelayFrames?: number;
  detailDelayFrames?: number;
  railDelayFrames?: number;
  gapFrames?: number;
  cutFrame?: number;
  revealStaggerFrames?: number;
  }
>;

export type MotionStudyDefinition = StudyDefinitionRecord<
  MotionStudyId,
  MotionStudyVariant
>;

type MotionStudyAxis = MotionStudyComparisonAxis<MotionStudyVariant>;
type MotionStudyShortlist = StrongestVariantShortlistEntry<
  MotionStudyVariant["id"]
>;

const formatNumber = (value: number): string => value.toFixed(2);

const formatRange = (from: number, to: number): string =>
  `${formatNumber(from)} -> ${formatNumber(to)}`;

const createAxis = (
  id: string,
  label: string,
  description: string,
  category: MotionStudyAxis["category"],
  getValue: MotionStudyAxis["getValue"],
): MotionStudyAxis => ({
  id,
  label,
  description,
  category,
  getValue,
});

const createShortlist = (
  entries: readonly MotionStudyShortlist[],
): readonly MotionStudyShortlist[] => createStrongestVariantShortlist(entries);

export const motionStudyOrder: MotionStudyId[] = [
  "push-in-lab",
  "pull-back-lab",
  "long-settle-lab",
  "snap-in-lab",
  "continuity-lab",
  "editorial-gap-lab",
  "layered-reveal-lab",
];

export const motionStudies: Record<MotionStudyId, MotionStudyDefinition> = {
  "push-in-lab": {
    id: "push-in-lab",
    title: "Push-In Lab",
    question: "Which entry family feels premium instead of loud?",
    observation:
      "Reference push-ins appear to reach most of their travel early, then coast into a quiet stop.",
    inference:
      "Test flat ease-out against two-stage arrivals with small layer offsets.",
    axes: [
      createAxis(
        "motion",
        "Motion Profile",
        "Entry velocity distribution and settle behavior.",
        "control",
        (variant) => variant.motion,
      ),
      createAxis(
        "scaleTravel",
        "Scale Travel",
        "How far the shell pushes in before settling.",
        "spatial",
        (variant) => formatRange(variant.scaleFrom ?? 1, variant.scaleTo ?? 1.12),
      ),
      createAxis(
        "layerDelays",
        "Layer Delays",
        "Chrome and content separation during arrival.",
        "timing",
        (variant) =>
          `chrome +${variant.chromeDelayFrames ?? 0}f / content +${variant.contentDelayFrames ?? 0}f`,
      ),
    ],
    shortlist: createShortlist([
      {
        variantId: "B",
        reason:
          "Rapid arrival plus a longer settle retains decisiveness without turning loud.",
        confidence: "strong",
      },
    ]),
    variants: [
      {
        id: "A",
        name: "Rapid 78% then coast",
        note: "1.00 -> 1.12, chrome +2f, content +4f",
        motion: createFastLaunchLongSettle({
          launchFrames: 12,
          settleFrames: 18,
          launchPortion: 0.78,
        }),
        scaleFrom: 1,
        scaleTo: 1.12,
        backgroundScaleFrom: 1,
        backgroundScaleTo: 1.05,
        backgroundShift: -18,
        chromeDelayFrames: 2,
        contentDelayFrames: 4,
      },
      {
        id: "B",
        name: "Rapid 86% with long settle",
        note: "1.00 -> 1.15, chrome +1f, content +4f",
        motion: createFastLaunchLongSettle({
          launchFrames: 10,
          settleFrames: 24,
          launchPortion: 0.86,
          settleCurve: "quintOut",
        }),
        scaleFrom: 1,
        scaleTo: 1.15,
        backgroundScaleFrom: 1,
        backgroundScaleTo: 1.06,
        backgroundShift: -22,
        chromeDelayFrames: 1,
        contentDelayFrames: 4,
      },
      {
        id: "C",
        name: "Single ease-out control",
        note: "1.00 -> 1.15, flatter one-pass arrival",
        motion: createFlatProfile("cubicOut", 28),
        scaleFrom: 1,
        scaleTo: 1.15,
        backgroundScaleFrom: 1,
        backgroundScaleTo: 1.05,
        backgroundShift: -16,
        chromeDelayFrames: 0,
        contentDelayFrames: 2,
      },
    ],
  },
  "pull-back-lab": {
    id: "pull-back-lab",
    title: "Pull-Back Lab",
    question: "How should close detail retreat without feeling camera-y or soft?",
    observation:
      "The reference pull-back keeps continuity while revealing more chrome and context near the end.",
    inference:
      "Test braking quality and layer separation during the retreat.",
    axes: [
      createAxis(
        "motion",
        "Brake Profile",
        "Retreat velocity and braking character.",
        "control",
        (variant) => variant.motion,
      ),
      createAxis(
        "retreatScale",
        "Retreat Scale",
        "How much the shell retreats before landing.",
        "spatial",
        (variant) => formatRange(variant.scaleFrom ?? 1.24, variant.scaleTo ?? 1),
      ),
      createAxis(
        "separation",
        "Shell / Content Separation",
        "Whether detail or chrome keeps moving after the shell brakes.",
        "timing",
        (variant) =>
          `rail +${variant.railDelayFrames ?? 0}f / content +${variant.contentDelayFrames ?? 0}f`,
      ),
    ],
    shortlist: createShortlist([
      {
        variantId: "C",
        reason:
          "Separated shell and content timing keeps the retreat from flattening into a single zoom.",
        confidence: "strong",
      },
    ]),
    variants: [
      {
        id: "A",
        name: "Single retreat",
        note: "1.24 -> 1.00 with uniform ease-out",
        motion: createFlatProfile("cubicOut", 34),
        scaleFrom: 1.24,
        scaleTo: 1,
        backgroundScaleFrom: 1.08,
        backgroundScaleTo: 1,
        backgroundShift: 20,
        railDelayFrames: 0,
        contentDelayFrames: 0,
      },
      {
        id: "B",
        name: "Decisive retreat / soft brake",
        note: "1.22 -> 1.00, context arrives late",
        motion: createFastLaunchLongSettle({
          launchFrames: 12,
          settleFrames: 20,
          launchPortion: 0.76,
        }),
        scaleFrom: 1.22,
        scaleTo: 1,
        backgroundScaleFrom: 1.06,
        backgroundScaleTo: 1,
        backgroundShift: 18,
        railDelayFrames: 3,
        contentDelayFrames: 2,
      },
      {
        id: "C",
        name: "Separated shell and content",
        note: "Parent brakes early, content coasts 3f longer",
        motion: createFastLaunchLongSettle({
          launchFrames: 10,
          settleFrames: 24,
          launchPortion: 0.82,
          settleCurve: "quintOut",
        }),
        scaleFrom: 1.2,
        scaleTo: 1,
        detailScaleFrom: 1.03,
        detailScaleTo: 0.95,
        backgroundScaleFrom: 1.05,
        backgroundScaleTo: 1,
        backgroundShift: 16,
        railDelayFrames: 4,
        contentDelayFrames: 4,
      },
    ],
  },
  "long-settle-lab": {
    id: "long-settle-lab",
    title: "Long-Settle Lab",
    question: "Which stop behavior feels controlled instead of springy?",
    observation:
      "Stops in the reference read cushioned, with little or no visible bounce.",
    inference:
      "Compare long settle, short settle, and a micro-back control.",
    axes: [
      createAxis(
        "motion",
        "Stop Profile",
        "Settle length versus back-control behavior.",
        "control",
        (variant) => variant.motion,
      ),
      createAxis(
        "entryScale",
        "Entry Scale",
        "How compressed the object is before it settles.",
        "spatial",
        (variant) => formatRange(variant.scaleFrom ?? 0.96, variant.scaleTo ?? 1),
      ),
      createAxis(
        "verticalTravel",
        "Vertical Travel",
        "How much vertical movement feeds the stop.",
        "spatial",
        (variant) => `${variant.yFrom ?? 42}px -> ${variant.yTo ?? 0}px`,
      ),
    ],
    shortlist: createShortlist([
      {
        variantId: "A",
        reason:
          "Long settle reads controlled and expensive; the back-control version turns playful too quickly.",
        confidence: "strong",
      },
    ]),
    variants: [
      {
        id: "A",
        name: "Long settle",
        note: "0.96 -> 1.00, 8f launch + 24f settle",
        motion: createFastLaunchLongSettle({
          launchFrames: 8,
          settleFrames: 24,
          launchPortion: 0.82,
          settleCurve: "quintOut",
        }),
        scaleFrom: 0.96,
        scaleTo: 1,
        yFrom: 42,
        yTo: 0,
      },
      {
        id: "B",
        name: "Short settle",
        note: "0.96 -> 1.00, 10f launch + 14f settle",
        motion: createFastLaunchLongSettle({
          launchFrames: 10,
          settleFrames: 14,
          launchPortion: 0.9,
        }),
        scaleFrom: 0.96,
        scaleTo: 1,
        yFrom: 42,
        yTo: 0,
      },
      {
        id: "C",
        name: "Micro-back control",
        note: "Back-out control for 'too playful' comparison",
        motion: createBackControlProfile(22),
        scaleFrom: 0.95,
        scaleTo: 1,
        yFrom: 44,
        yTo: 0,
      },
    ],
  },
  "snap-in-lab": {
    id: "snap-in-lab",
    title: "Snap-In Lab",
    question: "How aggressive can a snap be before it turns toy-like?",
    observation:
      "Large send-icon states in the reference feel assertive but do not visibly bounce.",
    inference:
      "Test hard ease-out, two-stage snap, and back-out as a negative control.",
    axes: [
      createAxis(
        "motion",
        "Snap Profile",
        "Assertion profile from one-pass snap to negative-control bounce.",
        "control",
        (variant) => variant.motion,
      ),
      createAxis(
        "snapScale",
        "Snap Scale",
        "How much scale compression precedes the snap.",
        "spatial",
        (variant) => formatRange(variant.scaleFrom ?? 0.9, variant.scaleTo ?? 1),
      ),
      createAxis(
        "snapLift",
        "Snap Lift",
        "Vertical distance covered before the snap lands.",
        "spatial",
        (variant) => `${variant.yFrom ?? 18}px -> ${variant.yTo ?? 0}px`,
      ),
    ],
    shortlist: createShortlist([
      {
        variantId: "A",
        reason:
          "Hard ease-out gives authority without visible bounce, which keeps the snap restrained.",
        confidence: "strong",
      },
    ]),
    variants: [
      {
        id: "A",
        name: "Hard ease-out snap",
        note: "12f, no settle tail",
        motion: createFlatProfile("quintOut", 12),
        scaleFrom: 0.9,
        scaleTo: 1,
        yFrom: 18,
        yTo: 0,
      },
      {
        id: "B",
        name: "Two-stage snap",
        note: "8f to 96%, then 10f settle",
        motion: createFastLaunchLongSettle({
          launchFrames: 8,
          settleFrames: 10,
          launchPortion: 0.96,
        }),
        scaleFrom: 0.88,
        scaleTo: 1,
        yFrom: 22,
        yTo: 0,
      },
      {
        id: "C",
        name: "Back-out control",
        note: "Intentional negative control",
        motion: createBackControlProfile(16),
        scaleFrom: 0.86,
        scaleTo: 1,
        yFrom: 24,
        yTo: 0,
      },
    ],
  },
  "continuity-lab": {
    id: "continuity-lab",
    title: "Continuity Lab",
    question: "Which cut support makes hard swaps feel deliberate instead of abrupt?",
    observation:
      "Several reference changes read like hard cuts supported by shared motion rather than dissolves.",
    inference:
      "Compare no support, parent continuity, and parent-plus-child continuity.",
    axes: [
      createAxis(
        "cutSupport",
        "Cut Support",
        "Whether continuity motion surrounds the hard swap.",
        "editorial",
        (variant) =>
          variant.id === "A"
            ? "No continuity support"
            : variant.id === "B"
              ? "Parent continuity"
              : "Parent continuity + child lag",
      ),
      createAxis(
        "cutFrame",
        "Cut Frame",
        "Frame where the state swap occurs.",
        "editorial",
        (variant) => `${variant.cutFrame ?? 56}f`,
      ),
      createAxis(
        "detailLag",
        "Post-Cut Detail Lag",
        "How long the child layer trails after the cut.",
        "timing",
        (variant) => `${variant.detailDelayFrames ?? 0}f`,
      ),
    ],
    shortlist: createShortlist([
      {
        variantId: "C",
        reason:
          "Parent continuity plus a slight child lag makes the swap feel intentional instead of abrupt.",
        confidence: "strong",
      },
    ]),
    variants: [
      {
        id: "A",
        name: "Cut only",
        note: "State swap with no supporting motion",
        motion: createFlatProfile("cubicOut", 1),
        cutFrame: 56,
      },
      {
        id: "B",
        name: "Parent continuity",
        note: "Hard cut while shell keeps moving",
        motion: createFastLaunchLongSettle({
          launchFrames: 18,
          settleFrames: 24,
          launchPortion: 0.82,
        }),
        cutFrame: 56,
        scaleFrom: 1,
        scaleTo: 1.09,
        backgroundScaleFrom: 1,
        backgroundScaleTo: 1.05,
      },
      {
        id: "C",
        name: "Parent + child lag",
        note: "Hard cut plus 3f detail lag",
        motion: createFastLaunchLongSettle({
          launchFrames: 16,
          settleFrames: 26,
          launchPortion: 0.86,
          settleCurve: "quintOut",
        }),
        cutFrame: 56,
        scaleFrom: 1,
        scaleTo: 1.1,
        backgroundScaleFrom: 1,
        backgroundScaleTo: 1.06,
        detailDelayFrames: 3,
      },
    ],
  },
  "editorial-gap-lab": {
    id: "editorial-gap-lab",
    title: "Editorial Gap Lab",
    question: "How much empty hold improves reveal authority?",
    observation:
      "The reference often lets states breathe rather than instantly replacing every outgoing element.",
    inference:
      "Test no gap, a short hold, and a wider hold before the incoming reveal.",
    axes: [
      createAxis(
        "gapFrames",
        "Gap Length",
        "Empty hold between outgoing and incoming states.",
        "editorial",
        (variant) => `${variant.gapFrames ?? 0}f`,
      ),
      createAxis(
        "revealStaggerFrames",
        "Reveal Stagger",
        "How much the incoming reveal cascades after the gap.",
        "timing",
        (variant) => `${variant.revealStaggerFrames ?? 0}f`,
      ),
    ],
    shortlist: createShortlist([
      {
        variantId: "B",
        reason:
          "A 4-frame gap creates editorial breath without making the reveal feel stalled.",
        confidence: "strong",
      },
    ]),
    variants: [
      {
        id: "A",
        name: "No gap",
        note: "Immediate handoff",
        motion: createFlatProfile("cubicOut", 20),
        gapFrames: 0,
        revealStaggerFrames: 0,
      },
      {
        id: "B",
        name: "4f gap",
        note: "Short editorial breath",
        motion: createFlatProfile("cubicOut", 20),
        gapFrames: 4,
        revealStaggerFrames: 2,
      },
      {
        id: "C",
        name: "8f gap",
        note: "Longer hold before reveal",
        motion: createFlatProfile("cubicOut", 20),
        gapFrames: 8,
        revealStaggerFrames: 3,
      },
    ],
  },
  "layered-reveal-lab": {
    id: "layered-reveal-lab",
    title: "Layered Reveal Lab",
    question: "Does chrome/content separation add restraint or just delay?",
    observation:
      "The reference rarely reveals every layer in lockstep; chrome and content often offset subtly.",
    inference:
      "Compare group reveal with two levels of layer staggering.",
    axes: [
      createAxis(
        "chromeDelayFrames",
        "Chrome Delay",
        "How far chrome leads the reveal.",
        "timing",
        (variant) => `${variant.chromeDelayFrames ?? 0}f`,
      ),
      createAxis(
        "contentDelayFrames",
        "Content Delay",
        "How far content trails the chrome.",
        "timing",
        (variant) => `${variant.contentDelayFrames ?? 0}f`,
      ),
      createAxis(
        "layerSeparation",
        "Layer Separation",
        "Combined reveal offset across chrome, rail, and content.",
        "structure",
        (variant) =>
          `chrome +${variant.chromeDelayFrames ?? 0}f / rail +${variant.railDelayFrames ?? 0}f / content +${variant.contentDelayFrames ?? 0}f`,
      ),
    ],
    shortlist: createShortlist([
      {
        variantId: "B",
        reason:
          "Visible layering without obvious drag gives the strongest chrome/content separation.",
        confidence: "strong",
      },
    ]),
    variants: [
      {
        id: "A",
        name: "Group reveal",
        note: "All layers together",
        motion: createFlatProfile("cubicOut", 22),
        chromeDelayFrames: 0,
        contentDelayFrames: 0,
        railDelayFrames: 0,
      },
      {
        id: "B",
        name: "Layered 3f / 6f",
        note: "Chrome leads, content follows",
        motion: createFlatProfile("cubicOut", 22),
        chromeDelayFrames: 2,
        contentDelayFrames: 6,
        railDelayFrames: 0,
      },
      {
        id: "C",
        name: "Layered 5f / 10f",
        note: "Deeper separation for restraint test",
        motion: createFlatProfile("cubicOut", 22),
        chromeDelayFrames: 4,
        contentDelayFrames: 10,
        railDelayFrames: 0,
      },
    ],
  },
};

export const getMotionStudy = (studyId: MotionStudyId): MotionStudyDefinition =>
  motionStudies[studyId];
