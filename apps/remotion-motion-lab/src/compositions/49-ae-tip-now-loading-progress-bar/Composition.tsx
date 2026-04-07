import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { config, loopFrames, rightPanelWidth } from "./config";
import {
  getBlinkOpacity,
  getLoopFrame,
  getSegmentedProgress,
} from "./lib/loading-progress";

const panelStyle = (width: number): React.CSSProperties => ({
  width,
  height: config.panelHeight,
  background: config.panelBackground,
  border: `1px solid ${config.panelEdge}`,
  borderRadius: config.panelRadius,
  overflow: "hidden",
  position: "relative",
  boxShadow: "0 18px 60px rgba(0,0,0,0.24)",
});

const cardStyle: React.CSSProperties = {
  border: `1px solid ${config.guideColor}`,
  borderRadius: 20,
  padding: 18,
  background: "rgba(255,255,255,0.02)",
};

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const LoadingLabel: React.FC<{
  opacity: number;
  size?: number;
}> = ({ opacity, size = config.labelFontSize }) => {
  return (
    <div
      style={{
        color: config.labelColor,
        fontSize: size,
        fontWeight: 600,
        letterSpacing: `${config.labelLetterSpacingEm}em`,
        textTransform: "none",
        opacity,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {config.labelText}
    </div>
  );
};

const MeterTrack: React.FC<{
  progress: number;
  origin: "left" | "center";
  width?: number;
  height?: number;
}> = ({
  progress,
  origin,
  width = config.trackWidth,
  height = config.trackHeight,
}) => {
  const innerWidth = Math.max(0, width - config.fillInset * 2);
  const innerHeight = Math.max(0, height - config.fillInset * 2);
  const clamped = Math.max(0, Math.min(1, progress));
  const fillStyle: React.CSSProperties =
    origin === "left"
      ? {
          width: innerWidth * clamped,
          transformOrigin: "left center",
        }
      : {
          width: innerWidth,
          transform: `scaleX(${clamped})`,
          transformOrigin: "center center",
        };

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
        borderRadius: config.trackRadius,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: config.fillInset,
          top: config.fillInset,
          width: innerWidth,
          height: innerHeight,
          borderRadius: Math.max(2, config.trackRadius - config.fillInset / 2),
          background: config.fillColor,
          ...fillStyle,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxSizing: "border-box",
          border: `${config.trackStrokeWidth}px solid ${config.trackColor}`,
          borderRadius: config.trackRadius,
        }}
      />
    </div>
  );
};

const StudyCard: React.FC<{
  title: string;
  subtitle: string;
  valueLabel: string;
  progress: number;
  origin: "left" | "center";
}> = ({ title, subtitle, valueLabel, progress, origin }) => {
  return (
    <div style={cardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 14,
        }}
      >
        <div>
          <div
            style={{
              color: config.textColor,
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {title}
          </div>
          <div style={{ color: config.mutedTextColor, fontSize: 12 }}>
            {subtitle}
          </div>
        </div>
        <div
          style={{
            color: config.accentColor,
            fontSize: 14,
            fontWeight: 700,
            fontFamily: '"Courier New", monospace',
          }}
        >
          {valueLabel}
        </div>
      </div>
      <MeterTrack progress={progress} origin={origin} width={220} height={32} />
    </div>
  );
};

const StudyRow: React.FC<{
  title: string;
  subtitle: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => {
  return (
    <div
      style={{
        borderTop: `1px solid ${config.guideColor}`,
        padding: "24px 24px 0",
        height: 304,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 16,
          gap: 16,
        }}
      >
        <div>
          <div style={{ color: config.textColor, fontSize: 18, fontWeight: 700 }}>
            {title}
          </div>
          <div style={{ color: config.mutedTextColor, fontSize: 13 }}>
            {subtitle}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const LeftPanel: React.FC<{
  originProgress: number;
  linearProgress: number;
  stagedProgress: number;
}> = ({ originProgress, linearProgress, stagedProgress }) => {
  return (
    <div style={panelStyle(config.leftPanelWidth)}>
      <div style={{ padding: "22px 24px 18px" }}>
        <div
          style={{
            color: config.accentColor,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          AE Tip 05
        </div>
        <div
          style={{
            color: config.textColor,
            fontSize: 30,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Now Loading Progress Bar
        </div>
        <div style={{ color: config.mutedTextColor, fontSize: 14, lineHeight: 1.5 }}>
          Left-anchored fill growth, stepped timing, and looped opacity blink are
          treated as separate reusable timing primitives.
        </div>
      </div>

      <StudyRow
        title="Origin study"
        subtitle="The same progress looks wrong if the fill scales from center."
      >
        <StudyCard
          title="Center-origin scale"
          subtitle="Incorrect for a loader"
          valueLabel={formatPercent(originProgress)}
          progress={originProgress}
          origin="center"
        />
        <StudyCard
          title="Left-anchored fill"
          subtitle="Matches AE anchor-left setup"
          valueLabel={formatPercent(originProgress)}
          progress={originProgress}
          origin="left"
        />
      </StudyRow>

      <StudyRow
        title="Timing study"
        subtitle="Holds and speed changes read more like a game loading pass."
      >
        <StudyCard
          title="Linear fill"
          subtitle="Constant velocity"
          valueLabel={formatPercent(linearProgress)}
          progress={linearProgress}
          origin="left"
        />
        <StudyCard
          title="Segmented fill"
          subtitle="AE-like holds + faster sweeps"
          valueLabel={formatPercent(stagedProgress)}
          progress={stagedProgress}
          origin="left"
        />
      </StudyRow>
    </div>
  );
};

const RightPanel: React.FC<{
  progress: number;
  labelOpacity: number;
}> = ({ progress, labelOpacity }) => {
  return (
    <div style={panelStyle(rightPanelWidth)}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 42%, rgba(134,227,255,0.09), transparent 44%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "100% 36px",
          opacity: 0.28,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 24,
          left: 28,
          color: config.mutedTextColor,
          fontSize: 12,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        Stage output
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateY(${config.layoutOffsetY}px)`,
        }}
      >
        <LoadingLabel opacity={labelOpacity} />
        <div style={{ height: config.labelToBarGap }} />
        <MeterTrack progress={progress} origin="left" />
      </div>
    </div>
  );
};

export const AETipNowLoadingProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const loopFrame = getLoopFrame(frame, loopFrames);

  const originProgress = getSegmentedProgress({
    frame: Math.min(loopFrame, config.fillDurationFrames),
    stops: config.fillStops,
  });
  const linearProgress = getSegmentedProgress({
    frame: Math.min(loopFrame, config.fillDurationFrames),
    stops: config.linearFillStops,
  });
  const stagedProgress = getSegmentedProgress({
    frame: Math.min(loopFrame, config.fillDurationFrames),
    stops: config.fillStops,
  });
  const labelOpacity = getBlinkOpacity({
    frame,
    stepFrames: config.labelBlinkStepFrames,
    pattern: config.labelBlinkPattern,
    high: config.labelOpacityHigh,
    low: config.labelOpacityLow,
  });

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
            "linear-gradient(180deg, rgba(255,255,255,0.02), transparent 18%), radial-gradient(circle at top, rgba(134,227,255,0.08), transparent 42%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: config.panelTop,
          left: config.panelInsetX,
          display: "flex",
          gap: config.panelGap,
        }}
      >
        <LeftPanel
          originProgress={originProgress}
          linearProgress={linearProgress}
          stagedProgress={stagedProgress}
        />
        <RightPanel progress={stagedProgress} labelOpacity={labelOpacity} />
      </div>
    </AbsoluteFill>
  );
};
