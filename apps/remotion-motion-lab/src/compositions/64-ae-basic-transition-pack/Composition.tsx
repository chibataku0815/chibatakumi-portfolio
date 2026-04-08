import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import {
  config,
  defaultVariantProps,
  easingPresets,
  transitionStudies,
  type AEBasicTransitionVariantProps,
  type TransitionStudy,
} from "./config";
import { TransitionBand } from "./lib/TransitionBand";
import {
  getPhaseProgress,
  getTransitionTiming,
} from "./lib/transition-progress";

const AlphaPreviewPlate: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, rgba(26,18,18,1) 0%, rgba(49,28,22,1) 100%)",
        color: "#f6f4ef",
        fontFamily:
          'Inter, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 18%, rgba(255,255,255,0.14), transparent 32%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.12,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)",
          backgroundSize: "128px 128px",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 52,
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 32,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: config.chromeInsetX,
          top: 96,
          width: 360,
          padding: "18px 20px",
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(0,0,0,0.2)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.62)",
            marginBottom: 10,
          }}
        >
          Transition Preview
        </div>
        <div
          style={{
            fontSize: 20,
            lineHeight: 1.35,
            fontWeight: 600,
            color: "#fff5eb",
            marginBottom: 8,
          }}
        >
          AE-like color wipe enters, holds, then clears back to transparency.
        </div>
        <div
          style={{
            fontSize: 15,
            lineHeight: 1.45,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          The background stays fixed so the wipe itself is the only animated subject.
        </div>
      </div>
    </AbsoluteFill>
  );
};

const TransitionChrome: React.FC<{
  transition: TransitionStudy;
  index: number;
  easingLabel?: string;
  easingNote?: string;
}> = ({ transition, index, easingLabel, easingNote }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: config.chromeInsetX,
        top: config.chromeInsetY,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        color: "#fff8ef",
        fontFamily:
          'Inter, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
        textShadow: "0 8px 30px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{
          fontSize: config.labelFontSize,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.78)",
        }}
      >
        {String(index + 1).padStart(2, "0")} / 05 BASIC AE TRANSITIONS
      </div>
      <div
        style={{
          fontSize: config.titleFontSize,
          lineHeight: 0.95,
          fontWeight: 700,
          letterSpacing: "-0.04em",
          maxWidth: 860,
        }}
      >
        {transition.title}
      </div>
      <div
        style={{
          fontSize: config.subtitleFontSize,
          lineHeight: 1.35,
          color: "rgba(255,255,255,0.8)",
          maxWidth: 920,
        }}
      >
        {transition.subtitle}
      </div>
      <div
        style={{
          fontSize: 18,
          lineHeight: 1.35,
          color: "rgba(255,255,255,0.62)",
        }}
      >
        {transition.note}
      </div>
      {typeof easingLabel === "string" ? (
        <div
          style={{
            marginTop: 10,
            display: "inline-flex",
            flexDirection: "column",
            gap: 4,
            maxWidth: 540,
            padding: "12px 16px",
            borderRadius: 18,
            background: "rgba(0,0,0,0.24)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.66)",
            }}
          >
            Easing
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#fff4e8",
            }}
          >
            {easingLabel}
          </div>
          {typeof easingNote === "string" ? (
            <div
              style={{
                fontSize: 15,
                lineHeight: 1.35,
                color: "rgba(255,255,255,0.72)",
              }}
            >
              {easingNote}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

const TransitionSegment: React.FC<{
  transition: TransitionStudy;
  index: number;
  easingId?: AEBasicTransitionVariantProps["easingId"];
  showEasingBadge?: boolean;
}> = ({
  transition,
  index,
  easingId = config.defaultEasingId,
  showEasingBadge = false,
}) => {
  const frame = useCurrentFrame();
  const { exitStartFrame } = getTransitionTiming(transition);
  const easingPreset = easingPresets.find((preset) => preset.id === easingId);
  const exitProgress = getPhaseProgress(
    frame,
    exitStartFrame,
    config.exitDurationFrames,
    easingId,
  );

  return (
    <AbsoluteFill style={{ background: "#020304", overflow: "hidden" }}>
      <AlphaPreviewPlate />
      <AbsoluteFill>
        {transition.colors.map((color, layerIndex) => {
          const outerProgress = getPhaseProgress(
            frame,
            config.entryStartFrame + transition.layerDelayFrames * layerIndex,
            config.entryDurationFrames,
            easingId,
          );
          const innerProgress = Math.min(exitProgress, outerProgress);

          return (
            <TransitionBand
              key={`${transition.id}-${color}`}
              kind={transition.kind}
              outerProgress={outerProgress}
              innerProgress={innerProgress}
              color={color}
            />
          );
        })}
      </AbsoluteFill>
      <TransitionChrome
        transition={transition}
        index={index}
        easingLabel={showEasingBadge ? easingPreset?.label : undefined}
        easingNote={showEasingBadge ? easingPreset?.note : undefined}
      />
      <div
        style={{
          position: "absolute",
          right: config.chromeInsetX,
          bottom: 72,
          padding: "18px 22px",
          borderRadius: 24,
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "#fff7ed",
          fontSize: 17,
          lineHeight: 1.45,
          fontFamily:
            'Inter, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
          textAlign: "right",
          boxShadow: "0 24px 60px rgba(0,0,0,0.24)",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 4 }}>AE recipe</div>
        <div style={{ color: "rgba(255,255,255,0.75)" }}>
          25f wipe
          <br />
          8f layer offset
          <br />
          same-shape alpha-inverted exit matte
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const AEBasicTransitionPack: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#020304" }}>
      {transitionStudies.map((transition, index) => (
        <Sequence
          key={transition.id}
          from={index * config.segmentFrames}
          durationInFrames={config.segmentFrames}
        >
          <TransitionSegment
            transition={transition}
            index={index}
            easingId={config.defaultEasingId}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const getTransitionById = (transitionId: string) =>
  transitionStudies.find((transition) => transition.id === transitionId) ??
  transitionStudies[0];

export const AEBasicTransitionVariant: React.FC<
  Partial<AEBasicTransitionVariantProps>
> = ({
  transitionId = defaultVariantProps.transitionId,
  easingId = defaultVariantProps.easingId,
}) => {
  const transition = getTransitionById(transitionId);

  return (
    <AbsoluteFill style={{ background: "#020304" }}>
      <TransitionSegment
        transition={transition}
        index={transitionStudies.findIndex((item) => item.id === transition.id)}
        easingId={easingId}
        showEasingBadge
      />
    </AbsoluteFill>
  );
};
