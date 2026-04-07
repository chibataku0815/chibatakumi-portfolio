/**
 * Composition #41 — Recraft SVG Motion Test
 *
 * Tests Recraft API-generated SVG animation capabilities in Remotion.
 * 8 scenes, each testing a specific SVG animation technique.
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { config } from "./config";
import { SvgImgTest } from "./scenes/SvgImgTest";
import { SvgInlineTest } from "./scenes/SvgInlineTest";
import { SvgTransformTest } from "./scenes/SvgTransformTest";
import { SvgOpacityTest } from "./scenes/SvgOpacityTest";
import { SvgClipReveal } from "./scenes/SvgClipReveal";
import { SvgStrokeDrawTest } from "./scenes/SvgStrokeDrawTest";
import { SvgFilterTest } from "./scenes/SvgFilterTest";
import { ScaleCompareTest } from "./scenes/ScaleCompareTest";

export const RecraftSvgMotion: React.FC = () => {
  const s = config.scenes;

  return (
    <AbsoluteFill style={{ backgroundColor: config.palette.bg }}>
      <SvgImgTest startFrame={s.imgLoad.start} duration={s.imgLoad.duration} />
      <SvgInlineTest
        startFrame={s.inlineSvg.start}
        duration={s.inlineSvg.duration}
      />
      <SvgTransformTest
        startFrame={s.transform.start}
        duration={s.transform.duration}
      />
      <SvgOpacityTest
        startFrame={s.opacity.start}
        duration={s.opacity.duration}
      />
      <SvgClipReveal
        startFrame={s.clipReveal.start}
        duration={s.clipReveal.duration}
      />
      <SvgStrokeDrawTest
        startFrame={s.strokeDraw.start}
        duration={s.strokeDraw.duration}
      />
      <SvgFilterTest
        startFrame={s.svgFilter.start}
        duration={s.svgFilter.duration}
      />
      <ScaleCompareTest
        startFrame={s.scaleCompare.start}
        duration={s.scaleCompare.duration}
      />
    </AbsoluteFill>
  );
};
