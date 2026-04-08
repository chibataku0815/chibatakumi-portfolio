import { backOut } from "./canvas-easing";

export type CurveName =
  | "quadOut"
  | "cubicOut"
  | "quintOut"
  | "expoOut"
  | "backOut";

export type PremiumMotionProfile =
  | {
      mode: "flat";
      curve: CurveName;
      durationFrames: number;
    }
  | {
      mode: "two-stage";
      launchCurve: CurveName;
      settleCurve: CurveName;
      launchFrames: number;
      settleFrames: number;
      launchPortion: number;
    }
  | {
      mode: "back-control";
      durationFrames: number;
    };

export const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));

export const mix = (from: number, to: number, progress: number): number =>
  from + (to - from) * progress;

export const quadOut = (t: number): number => 1 - (1 - t) * (1 - t);
export const cubicOut = (t: number): number => 1 - Math.pow(1 - t, 3);
export const quintOut = (t: number): number => 1 - Math.pow(1 - t, 5);
export const expoOut = (t: number): number =>
  t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

export const curveMap: Record<CurveName, (t: number) => number> = {
  quadOut,
  cubicOut,
  quintOut,
  expoOut,
  backOut,
};

export const createFlatProfile = (
  curve: Exclude<CurveName, "backOut"> | "backOut",
  durationFrames: number,
): PremiumMotionProfile => ({
  mode: "flat",
  curve,
  durationFrames,
});

export const createFastLaunchLongSettle = ({
  launchCurve = "expoOut",
  settleCurve = "cubicOut",
  launchFrames,
  settleFrames,
  launchPortion,
}: {
  launchCurve?: Exclude<CurveName, "backOut">;
  settleCurve?: Exclude<CurveName, "backOut">;
  launchFrames: number;
  settleFrames: number;
  launchPortion: number;
}): PremiumMotionProfile => ({
  mode: "two-stage",
  launchCurve,
  settleCurve,
  launchFrames,
  settleFrames,
  launchPortion,
});

export const createBackControlProfile = (
  durationFrames: number,
): PremiumMotionProfile => ({
  mode: "back-control",
  durationFrames,
});

export const resolvePremiumMotionProgress = (
  localFrame: number,
  profile: PremiumMotionProfile,
): number => {
  if (localFrame <= 0) return 0;

  if (profile.mode === "flat") {
    const raw = clamp01(localFrame / profile.durationFrames);
    return curveMap[profile.curve](raw);
  }

  if (profile.mode === "back-control") {
    const raw = clamp01(localFrame / profile.durationFrames);
    return backOut(raw);
  }

  const launchEnd = profile.launchFrames;
  const settleEnd = profile.launchFrames + profile.settleFrames;
  if (localFrame < launchEnd) {
    const raw = clamp01(localFrame / profile.launchFrames);
    return curveMap[profile.launchCurve](raw) * profile.launchPortion;
  }

  if (localFrame < settleEnd) {
    const raw = clamp01((localFrame - profile.launchFrames) / profile.settleFrames);
    return (
      profile.launchPortion +
      curveMap[profile.settleCurve](raw) * (1 - profile.launchPortion)
    );
  }

  return 1;
};

export const resolvePremiumClampedProgress = (
  localFrame: number,
  profile: PremiumMotionProfile,
): number => clamp01(resolvePremiumMotionProgress(localFrame, profile));

export const resolveDelayedProgress = (
  localFrame: number,
  delayFrames: number,
  profile: PremiumMotionProfile,
): number => resolvePremiumClampedProgress(localFrame - delayFrames, profile);
