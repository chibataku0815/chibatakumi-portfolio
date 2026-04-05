/**
 * Template Reproduction Test — Iteration 10
 * 14 scenes, retimed with SA + SB added from 60fps ref analysis.
 * 300f / 10s / 30fps / 1920x1080
 */
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import {
  CanvasScene,
  P,
  drawS1, drawS2, drawS3, drawS4, drawS5, drawS6,
  drawS7, drawSA, drawS8, drawSB, drawS9, drawS10, drawS11, drawS12,
} from "./CanvasScene";

const Flash: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: P.white }} />
);

export const TemplateReproTest: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: P.black }}>
    {/* S1: DON'T WATCH — static 18% hold (ref: 0.0-0.70s) */}
    <Sequence from={0} durationInFrames={21}>
      <CanvasScene draw={drawS1} />
    </Sequence>

    {/* S2: DON'T BLINK / WATCH CLOSELY (ref: 0.72-1.67s) */}
    <Sequence from={21} durationInFrames={29}>
      <CanvasScene draw={drawS2} />
    </Sequence>

    {/* S3: "5" with labels (ref: 1.67-2.17s) */}
    <Sequence from={50} durationInFrames={15}>
      <CanvasScene draw={drawS3} />
    </Sequence>

    {/* S4: "5" frame-filling (ref: 2.17-2.67s) */}
    <Sequence from={65} durationInFrames={15}>
      <CanvasScene draw={drawS4} />
    </Sequence>

    {/* S5: "4" symmetric (ref: 2.67-3.33s) */}
    <Sequence from={80} durationInFrames={20}>
      <CanvasScene draw={drawS5} />
    </Sequence>

    {/* S6: Scattered "3"s (ref: 3.33-3.83s) */}
    <Sequence from={100} durationInFrames={15}>
      <CanvasScene draw={drawS6} />
    </Sequence>

    {/* S7: "2" massive overlapping on orange (ref: 3.83-4.08s) */}
    <Sequence from={115} durationInFrames={7}>
      <CanvasScene draw={drawS7} />
    </Sequence>

    {/* SA: "2" extreme closeup on white — diagonal strokes (ref: 4.08-4.33s) */}
    <Sequence from={122} durationInFrames={8}>
      <CanvasScene draw={drawSA} />
    </Sequence>

    {/* S8: Scattered "1"s rotated (ref: 4.33-4.83s) */}
    <Sequence from={130} durationInFrames={15}>
      <CanvasScene draw={drawS8} />
    </Sequence>

    {/* SB: "CLEARED" letter assembly (ref: 4.83-5.67s) */}
    <Sequence from={145} durationInFrames={25}>
      <CanvasScene draw={drawSB} />
    </Sequence>

    {/* Flash white */}
    <Sequence from={170} durationInFrames={2}>
      <Flash />
    </Sequence>

    {/* S9: CLEARED FOR LAUNCH (ref: 5.75-6.33s) */}
    <Sequence from={172} durationInFrames={18}>
      <CanvasScene draw={drawS9} />
    </Sequence>

    {/* S10: LAUNCH wall (ref: 6.33-7.50s) */}
    <Sequence from={190} durationInFrames={35}>
      <CanvasScene draw={drawS10} />
    </Sequence>

    {/* S11: MEET THE NEW STANDARD (ref: 7.50-8.83s) */}
    <Sequence from={225} durationInFrames={40}>
      <CanvasScene draw={drawS11} />
    </Sequence>

    {/* S12: RAW POWER (ref: 8.83-10.0s) */}
    <Sequence from={265} durationInFrames={35}>
      <CanvasScene draw={drawS12} />
    </Sequence>
  </AbsoluteFill>
);
