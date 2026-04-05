/**
 * Filmtone Countdown — Sequence definition
 *
 * 5→4→3→2→1 countdown + letter assembly + finale
 * All timing from config.ts
 */
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { timing, starts } from "./config";
import {
  CanvasScene,
  drawS5Label, drawS5Fill, drawS4, drawS3,
  drawS2Orange, drawS2Closeup, drawS1,
  drawAssembly, drawFinale,
} from "./CanvasScenes";

export const FilmtoneCountdown: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000000" }}>
    <Sequence from={starts.s5_label} durationInFrames={timing.s5_label}>
      <CanvasScene draw={drawS5Label} />
    </Sequence>

    <Sequence from={starts.s5_fill} durationInFrames={timing.s5_fill}>
      <CanvasScene draw={drawS5Fill} />
    </Sequence>

    <Sequence from={starts.s4} durationInFrames={timing.s4}>
      <CanvasScene draw={drawS4} />
    </Sequence>

    <Sequence from={starts.s3} durationInFrames={timing.s3}>
      <CanvasScene draw={drawS3} />
    </Sequence>

    <Sequence from={starts.s2_orange} durationInFrames={timing.s2_orange}>
      <CanvasScene draw={drawS2Orange} />
    </Sequence>

    <Sequence from={starts.s2_closeup} durationInFrames={timing.s2_closeup}>
      <CanvasScene draw={drawS2Closeup} />
    </Sequence>

    <Sequence from={starts.s1} durationInFrames={timing.s1}>
      <CanvasScene draw={drawS1} />
    </Sequence>

    <Sequence from={starts.assembly} durationInFrames={timing.assembly}>
      <CanvasScene draw={drawAssembly} />
    </Sequence>

    <Sequence from={starts.finale} durationInFrames={timing.finale}>
      <CanvasScene draw={drawFinale} />
    </Sequence>
  </AbsoluteFill>
);
