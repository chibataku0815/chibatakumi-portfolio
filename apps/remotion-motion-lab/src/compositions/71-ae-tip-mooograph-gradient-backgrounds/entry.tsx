import React from "react";
import { Composition, registerRoot } from "remotion";
import { AETipMooographGradientBackgrounds } from "./Composition";
import { config } from "./config";

const MooooGraphGradientBackgroundsEntry: React.FC = () => {
  return (
    <Composition
      id={config.id}
      component={AETipMooographGradientBackgrounds}
      width={config.width}
      height={config.height}
      fps={config.fps}
      durationInFrames={config.totalFrames}
    />
  );
};

registerRoot(MooooGraphGradientBackgroundsEntry);
