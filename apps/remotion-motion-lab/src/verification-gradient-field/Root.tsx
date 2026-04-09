import React from "react";
import { Composition } from "remotion";
import { AETipOverlayGradientBackground } from "../compositions/46-ae-tip-overlay-gradient-background/Composition";
import { config as config46 } from "../compositions/46-ae-tip-overlay-gradient-background/config";
import { OverlayRingTitleMinimal } from "../compositions/48-overlay-ring-title-minimal/Composition";
import { config as config48 } from "../compositions/48-overlay-ring-title-minimal/config";
import { OverlayRingTitleAccentBurst } from "../compositions/50-overlay-ring-title-accent-burst/Composition";
import { config as config50 } from "../compositions/50-overlay-ring-title-accent-burst/config";
import { OverlayRingTitleGradientLed } from "../compositions/53-overlay-ring-title-gradient-led/Composition";
import { config as config53 } from "../compositions/53-overlay-ring-title-gradient-led/config";
import { LoadingInterstitialMinimal } from "../compositions/51-loading-interstitial-minimal/Composition";
import { config as config51 } from "../compositions/51-loading-interstitial-minimal/config";

export const GradientFieldVerificationRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GradientFieldVerify46"
        component={AETipOverlayGradientBackground}
        width={config46.width}
        height={config46.height}
        fps={config46.fps}
        durationInFrames={config46.totalFrames}
      />
      <Composition
        id="GradientFieldVerify48"
        component={OverlayRingTitleMinimal}
        width={config48.width}
        height={config48.height}
        fps={config48.fps}
        durationInFrames={config48.durationFrames}
      />
      <Composition
        id="GradientFieldVerify50"
        component={OverlayRingTitleAccentBurst}
        width={config50.width}
        height={config50.height}
        fps={config50.fps}
        durationInFrames={config50.durationFrames}
      />
      <Composition
        id="GradientFieldVerify51"
        component={LoadingInterstitialMinimal}
        width={config51.width}
        height={config51.height}
        fps={config51.fps}
        durationInFrames={config51.durationFrames}
      />
      <Composition
        id="GradientFieldVerify53"
        component={OverlayRingTitleGradientLed}
        width={config53.width}
        height={config53.height}
        fps={config53.fps}
        durationInFrames={config53.durationFrames}
      />
    </>
  );
};
