import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  config,
  rightPanelWidth,
  singleRingLoopFrames,
  stackLoopFrames,
} from "./config";
import { type RingEasing } from "../../lib/ae-tips/ring-progress";
import {
  peakWindow,
  titleHandoff,
} from "../../lib/ae-tips/ring-title-timing";

const panelStyle = (width: number): React.CSSProperties => ({
  width,
  height: config.panelHeight,
  background: "#101010",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: config.panelRadius,
  overflow: "hidden",
  position: "relative",
});

const mix = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;

const formatPx = (value: number) => `${Math.round(value)}px`;

const getRingState = ({
  frame,
  easing,
  layerIndex = 0,
  staggerFrames = 0,
}: {
  frame: number;
  easing: RingEasing;
  layerIndex?: number;
  staggerFrames?: number;
}) =>
  peakWindow({
    frame,
    layerIndex,
    startFrame: 0,
    durationFrames: config.burstDurationFrames,
    staggerFrames,
    easing,
    startDiameter: config.ringStartDiameter,
    endDiameter: config.ringEndDiameter,
    startStrokeWidth: config.strokeStartWidth,
    endStrokeWidth: config.strokeEndWidth,
    opacityDecay: config.ringOpacityDecay,
    alphaStart: 1,
    alphaEnd: 0.16,
    layerAlphaFloor: 0.14,
  });

const RingGlyph: React.FC<{
  centerX: number;
  centerY: number;
  frame: number;
  easing: RingEasing;
  layerIndex?: number;
  staggerFrames?: number;
  stroke?: string;
  fitRadius?: number;
}> = ({
  centerX,
  centerY,
  frame,
  easing,
  layerIndex = 0,
  staggerFrames = 0,
  stroke,
  fitRadius,
}) => {
  const ring = getRingState({ frame, easing, layerIndex, staggerFrames });
  if (!ring) {
    return null;
  }

  const radius = Math.max(0.5, ring.diameter / 2);
  const strokeColor = stroke ?? config.ringColor;
  const totalRadius = radius + ring.strokeWidth / 2;
  const scale = fitRadius ? Math.min(1, fitRadius / totalRadius) : 1;
  const displayRadius = radius * scale;
  const displayStrokeWidth = ring.strokeWidth * scale;

  return (
    <>
      <circle
        cx={centerX}
        cy={centerY}
        r={displayRadius}
        fill="none"
        stroke={config.ringHighlightColor}
        strokeWidth={displayStrokeWidth * 1.35}
        opacity={ring.alpha * 0.85}
      />
      <circle
        cx={centerX}
        cy={centerY}
        r={displayRadius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={displayStrokeWidth}
        opacity={ring.alpha}
      />
    </>
  );
};

const SingleRingStudy: React.FC<{
  title: string;
  subtitle: string;
  frame: number;
  easing: RingEasing;
}> = ({ title, subtitle, frame, easing }) => {
  const ring = getRingState({ frame, easing });
  const width = config.leftPanelWidth;
  const rowHeight = 304;
  const centerX = (width - 48) / 2;
  const centerY = 166;

  return (
    <div
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "24px 24px 0",
        height: rowHeight,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 16,
          fontFamily: '"Courier New", monospace',
        }}
      >
        <div>
          <div style={{ color: config.textColor, fontSize: 18, fontWeight: 700 }}>
            {title}
          </div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
            {subtitle}
          </div>
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.56)",
            fontSize: 13,
            display: "flex",
            gap: 16,
          }}
        >
          <span>size {ring ? formatPx(ring.diameter) : "0px"}</span>
          <span>stroke {ring ? formatPx(ring.strokeWidth) : "0px"}</span>
        </div>
      </div>

      <svg width={width - 48} height={212} viewBox={`0 0 ${width - 48} 212`}>
        <circle
          cx={centerX}
          cy={centerY}
          r={92}
          fill="none"
          stroke={config.dimGuideColor}
          strokeWidth={1}
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={168}
          fill="none"
          stroke={config.dimGuideColor}
          strokeWidth={1}
        />
        <line
          x1={centerX}
          y1={20}
          x2={centerX}
          y2={200}
          stroke={config.guideColor}
          strokeWidth={1}
          strokeDasharray="8 10"
        />
        <line
          x1={48}
          y1={centerY}
          x2={width - 96}
          y2={centerY}
          stroke={config.guideColor}
          strokeWidth={1}
          strokeDasharray="8 10"
        />
        <RingGlyph
          centerX={centerX}
          centerY={centerY}
          frame={frame}
          easing={easing}
          fitRadius={86}
        />
        <circle cx={centerX} cy={centerY} r={4} fill={config.accentColor} />
      </svg>
    </div>
  );
};

const getTitleState = (frame: number) =>
  titleHandoff({
    frame,
    startFrame: config.titleScaleDelayFrames,
    durationFrames: config.titleScaleDurationFrames,
    startScale: 0.72,
    endScale: 1,
    opacityRampFraction: 0.7,
    scaleOvershoot: 1.35,
  });

const MultiRingStage: React.FC<{ frame: number }> = ({ frame }) => {
  const width = rightPanelWidth;
  const height = config.panelHeight;
  const centerX = width / 2;
  const centerY = height / 2 + 36;
  const title = getTitleState(frame);

  return (
    <div style={{ position: "relative", width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <radialGradient id="ring-stage-glow" cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor="rgba(255,139,94,0.14)" />
            <stop offset="38%" stopColor="rgba(255,139,94,0.06)" />
            <stop offset="100%" stopColor="rgba(255,139,94,0)" />
          </radialGradient>
        </defs>

        <rect width={width} height={height} fill="url(#ring-stage-glow)" />

        <circle
          cx={centerX}
          cy={centerY}
          r={110}
          fill="none"
          stroke={config.dimGuideColor}
          strokeWidth={1}
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={220}
          fill="none"
          stroke={config.dimGuideColor}
          strokeWidth={1}
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={318}
          fill="none"
          stroke={config.dimGuideColor}
          strokeWidth={1}
        />
        <line
          x1={centerX}
          y1={60}
          x2={centerX}
          y2={height - 58}
          stroke={config.guideColor}
          strokeWidth={1}
          strokeDasharray="8 12"
        />
        <line
          x1={72}
          y1={centerY}
          x2={width - 72}
          y2={centerY}
          stroke={config.guideColor}
          strokeWidth={1}
          strokeDasharray="8 12"
        />

        {Array.from({ length: config.ringCount }).map((_, index) => (
          <RingGlyph
            key={index}
            centerX={centerX}
            centerY={centerY}
            frame={frame}
            easing="ae-like"
            layerIndex={index}
            staggerFrames={config.ringStaggerFrames}
          />
        ))}

        <circle cx={centerX} cy={centerY} r={4} fill={config.accentSoftColor} />
      </svg>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: centerY - 34,
          display: "flex",
          justifyContent: "center",
          transform: `scale(${title.scale})`,
          transformOrigin: "50% 50%",
          opacity: title.opacity,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            color: config.titleColor,
            fontSize: 74,
            fontWeight: 900,
            letterSpacing: `${config.titleLetterSpacingEm}em`,
            paddingLeft: `${config.titleLetterSpacingEm}em`,
            textTransform: "uppercase",
            textShadow: "0 0 22px rgba(255,139,94,0.16)",
          }}
        >
          {config.titleText}
        </div>
      </div>
    </div>
  );
};

export const AETipExpandingRingReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const singleLoopFrame =
    ((frame % singleRingLoopFrames) + singleRingLoopFrames) % singleRingLoopFrames;
  const stackLoopFrame =
    ((frame % stackLoopFrames) + stackLoopFrames) % stackLoopFrames;

  return (
    <AbsoluteFill
      style={{
        background: config.background,
        color: config.textColor,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 20%, rgba(255,139,94,0.14), transparent 30%), radial-gradient(circle at 50% 68%, rgba(255,255,255,0.04), transparent 44%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: config.panelInsetX,
          right: config.panelInsetX,
          top: 52,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              color: config.accentColor,
              fontFamily: '"Courier New", monospace',
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            AE TIP 04
          </div>
          <div style={{ fontSize: 54, fontWeight: 900, lineHeight: 1.02 }}>
            Expanding Ring Reveal
          </div>
          <div
            style={{
              marginTop: 12,
              color: "rgba(255,255,255,0.68)",
              fontFamily: '"Courier New", monospace',
              fontSize: 20,
            }}
          >
            Size up, stroke down, explosive first hit.
          </div>
        </div>

        <div
          style={{
            fontFamily: '"Courier New", monospace',
            fontSize: 16,
            color: "rgba(255,255,255,0.56)",
            textAlign: "right",
            lineHeight: 1.6,
          }}
        >
          <div>burst={config.burstDurationFrames}f</div>
          <div>rings={config.ringCount}</div>
          <div>stagger={config.ringStaggerFrames}f</div>
          <div>size {config.ringStartDiameter} - {config.ringEndDiameter}</div>
          <div>stroke {config.strokeStartWidth} - {config.strokeEndWidth}</div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: config.panelInsetX,
          top: config.panelTop,
          display: "flex",
          gap: config.panelGap,
        }}
      >
        <div style={panelStyle(config.leftPanelWidth)}>
          <div
            style={{
              padding: "20px 24px",
              fontFamily: '"Courier New", monospace',
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div>
              <div style={{ color: config.labelColor, fontSize: 18, fontWeight: 700 }}>
                single ring timing study
              </div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
                same diameter/stroke path, different easing
              </div>
            </div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
              frame {singleLoopFrame + 1}/{singleRingLoopFrames}
            </div>
          </div>

          <SingleRingStudy
            title="linear"
            subtitle="uniform expansion, less explosive"
            frame={singleLoopFrame}
            easing="linear"
          />
          <SingleRingStudy
            title="ae-like ease"
            subtitle="fast start, aggressive decay of stroke width"
            frame={singleLoopFrame}
            easing="ae-like"
          />
        </div>

        <div style={panelStyle(rightPanelWidth)}>
          <div
            style={{
              padding: "20px 24px",
              fontFamily: '"Courier New", monospace',
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div>
              <div style={{ color: config.labelColor, fontSize: 18, fontWeight: 700 }}>
                ring stack + title reveal
              </div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
                duplicated rings with delayed center text scale-in
              </div>
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: 13,
                textAlign: "right",
              }}
            >
              <div>loop {stackLoopFrames}f</div>
              <div>delay {config.titleScaleDelayFrames}f</div>
            </div>
          </div>
          <MultiRingStage frame={stackLoopFrame} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
