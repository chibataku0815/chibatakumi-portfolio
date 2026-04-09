import React from "react";
import { Composition } from "remotion";
import { AETipExpandingRingReveal } from "../compositions/47-ae-tip-expanding-ring-reveal/Composition";
import { config as config47 } from "../compositions/47-ae-tip-expanding-ring-reveal/config";
import { OverlayRingTitleMinimal } from "../compositions/48-overlay-ring-title-minimal/Composition";
import { config as config48 } from "../compositions/48-overlay-ring-title-minimal/config";
import { OverlayRingTitleAccentBurst } from "../compositions/50-overlay-ring-title-accent-burst/Composition";
import { config as config50 } from "../compositions/50-overlay-ring-title-accent-burst/config";
import { OverlayRingTitleGradientLed } from "../compositions/53-overlay-ring-title-gradient-led/Composition";
import { config as config53 } from "../compositions/53-overlay-ring-title-gradient-led/config";

export const RingTitleVerificationRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="RingTitleVerify47"
        component={AETipExpandingRingReveal}
        width={config47.width}
        height={config47.height}
        fps={config47.fps}
        durationInFrames={config47.totalFrames}
      />
      <Composition
        id="RingTitleVerify48"
        component={OverlayRingTitleMinimal}
        width={config48.width}
        height={config48.height}
        fps={config48.fps}
        durationInFrames={config48.durationFrames}
      />
      <Composition
        id="RingTitleVerify50"
        component={OverlayRingTitleAccentBurst}
        width={config50.width}
        height={config50.height}
        fps={config50.fps}
        durationInFrames={config50.durationFrames}
      />
      <Composition
        id="RingTitleVerify53"
        component={OverlayRingTitleGradientLed}
        width={config53.width}
        height={config53.height}
        fps={config53.fps}
        durationInFrames={config53.durationFrames}
      />
    </>
  );
};
