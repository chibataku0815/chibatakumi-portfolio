/**
 * #24 Motion Technique Reel
 *
 * Orchestrates all 8 motion techniques into a single showcase composition.
 * Uses <Sequence> to time each technique segment with lower-third labels
 * and interstitial transitions.
 */
import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { config, totalFrames, segmentStarts } from "./config";

// Import all 8 technique compositions
import { EasingShowcase } from "../23-easing-showcase/Composition";
import { SlamIn } from "../16-slam-in/Composition";
import { Stagger } from "../22-stagger/Composition";
import { KineticTypography } from "../18-kinetic-typography/Composition";
import { ScalePulse } from "../19-scale-pulse/Composition";
import { TypeAsTexture } from "../20-type-as-texture/Composition";
import { CroppedTypography } from "../21-cropped-typography/Composition";
import { AccentBurst } from "../17-accent-burst/Composition";

import { COLORS } from "../../lib/colors";

// ---------------------------------------------------------------------------
// Title Card
// ---------------------------------------------------------------------------
const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = Math.min(1, frame / 20);
  const exitOpacity = frame > 55 ? Math.max(0, 1 - (frame - 55) / 15) : 1;
  const alpha = opacity * exitOpacity;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bgDeep,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: alpha,
      }}
    >
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 900,
          fontSize: 120,
          color: COLORS.warmWhite,
          letterSpacing: "0.05em",
          lineHeight: 1.1,
          textAlign: "center",
        }}
      >
        {config.title.line1}
        <br />
        {config.title.line2}
      </div>
      <div
        style={{
          fontFamily: '"Courier New", monospace',
          fontWeight: 600,
          fontSize: 18,
          color: COLORS.amber,
          marginTop: 30,
          opacity: 0.7,
          letterSpacing: "0.1em",
        }}
      >
        {config.title.subtitle}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// End Card
// ---------------------------------------------------------------------------
const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = Math.min(1, frame / 20);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bgDeep,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 900,
          fontSize: 80,
          color: COLORS.warmWhite,
          letterSpacing: "0.03em",
        }}
      >
        {config.endCard.line1}
      </div>
      <div
        style={{
          fontFamily: '"Courier New", monospace',
          fontWeight: 400,
          fontSize: 16,
          color: COLORS.textMuted,
          marginTop: 24,
          opacity: 0.6,
        }}
      >
        {config.endCard.subtitle}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Lower-Third Label Overlay
// ---------------------------------------------------------------------------
const LowerThird: React.FC<{
  num: string;
  name: string;
  formal: string;
}> = ({ num, name, formal }) => {
  const frame = useCurrentFrame();
  const fadeIn = Math.min(1, frame / config.labelFadeFrames);
  const fadeOut = frame > 40 ? Math.max(0, 1 - (frame - 40) / 10) : 1;
  const alpha = fadeIn * fadeOut;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "flex-start",
        padding: "0 0 60px 60px",
        opacity: alpha,
      }}
    >
      <div
        style={{
          fontFamily: '"Courier New", monospace',
          fontWeight: 600,
          fontSize: 18,
          color: COLORS.warmWhite,
          opacity: 0.6,
        }}
      >
        {num}
      </div>
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
          fontSize: 28,
          color: COLORS.warmWhite,
          marginTop: 4,
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontFamily: '"Courier New", monospace',
          fontWeight: 400,
          fontSize: 14,
          color: COLORS.warmWhite,
          opacity: 0.4,
          marginTop: 4,
        }}
      >
        {formal}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Technique component mapping
// ---------------------------------------------------------------------------
const TECHNIQUE_MAP: Record<string, React.FC> = {
  easing: EasingShowcase,
  slam: SlamIn,
  stagger: Stagger,
  kinetic: KineticTypography,
  pulse: ScalePulse,
  texture: TypeAsTexture,
  cropped: CroppedTypography,
  burst: AccentBurst,
};

// ---------------------------------------------------------------------------
// Main Composition
// ---------------------------------------------------------------------------
export const MotionTechniqueReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDeep }}>
      {config.segments.map((segment) => {
        const start = segmentStarts[segment.id];

        if (segment.id === "title") {
          return (
            <Sequence
              key={segment.id}
              from={start}
              durationInFrames={segment.frames}
            >
              <TitleCard />
            </Sequence>
          );
        }

        if (segment.id === "end") {
          return (
            <Sequence
              key={segment.id}
              from={start}
              durationInFrames={segment.frames}
            >
              <EndCard />
            </Sequence>
          );
        }

        const TechniqueComponent = TECHNIQUE_MAP[segment.id];
        const term = config.terminology[segment.id as keyof typeof config.terminology];

        return (
          <Sequence
            key={segment.id}
            from={start}
            durationInFrames={segment.frames}
          >
            <AbsoluteFill>
              {TechniqueComponent && <TechniqueComponent />}
              {term && (
                <LowerThird
                  num={term.num}
                  name={segment.label}
                  formal={term.formal}
                />
              )}
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export { totalFrames };
