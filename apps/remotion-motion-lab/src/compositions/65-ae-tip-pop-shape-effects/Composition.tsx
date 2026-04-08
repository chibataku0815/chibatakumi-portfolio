import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import {
  cubicIn,
  backOut,
  expoOut,
  quadIn,
  quintOut,
} from "../../lib/canvas-easing";
import {
  createBackControlProfile,
  createFlatProfile,
} from "../../lib/premium-motion-primitives";
import {
  config,
  effectOneConfig,
  effectThreeConfig,
  effectTwoConfig,
  sceneOffsets,
} from "./config";
import {
  ExpandingOutline,
  getSceneFrame,
  RadialTrimBurst,
  StaggeredSpokeChain,
} from "./lib/primitives";

const SceneChrome: React.FC<{
  index: number;
  title: string;
  note: string;
}> = ({ index, title, note }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        top: 56,
        color: config.chromeTitleColor,
        fontFamily: '"Inter", "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 15,
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: config.chromeLabelColor,
          marginBottom: 12,
          fontWeight: 700,
        }}
      >
        {String(index).padStart(2, "0")} AE POP SHAPE EFFECT
      </div>
      <div
        style={{
          fontSize: 68,
          lineHeight: 0.94,
          letterSpacing: "-0.05em",
          fontWeight: 700,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div
        style={{
          maxWidth: 860,
          fontSize: 24,
          lineHeight: 1.35,
          color: "rgba(255,255,255,0.74)",
        }}
      >
        {note}
      </div>
    </div>
  );
};

const BaseStage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AbsoluteFill
      style={{
        background: config.background,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${config.centerGlowColor} 0%, rgba(0,0,0,0) 42%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 20% 18%, ${config.backgroundAccentA} 0%, rgba(0,0,0,0) 28%), radial-gradient(circle at 80% 78%, ${config.backgroundAccentB} 0%, rgba(0,0,0,0) 26%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.5,
          backgroundImage: `linear-gradient(${config.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${config.gridColor} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          width: 1,
          height: "100%",
          background: config.guideColor,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "50%",
          width: "100%",
          height: 1,
          background: config.guideColor,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

const cardWidth = 548;
const cardHeight = 520;
const cardGap = 28;
const cardTop = 280;
const rowLeft = Math.round((config.width - (cardWidth * 3 + cardGap * 2)) / 2);
const cardInnerWidth = cardWidth - 56;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const sampleProgress = (
  localFrame: number,
  startFrame: number,
  durationFrames: number,
  easing: (t: number) => number,
) => easing(clamp01((localFrame - startFrame) / Math.max(1, durationFrames)));

const ComparisonCard: React.FC<{
  left: number;
  label: string;
  note: string;
  progress: number;
  progressLabel: string;
  accentColor: string;
  children: React.ReactNode;
}> = ({ left, label, note, progress, progressLabel, accentColor, children }) => {
  const dotLeft = 28 + cardInnerWidth * clamp01(progress);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top: cardTop,
        width: cardWidth,
        height: cardHeight,
        borderRadius: 28,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.045), rgba(0,0,0,0) 42%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 28,
          top: 24,
          right: 28,
          color: config.chromeTitleColor,
          fontFamily: '"Inter", "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 16,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: "rgba(255,255,255,0.82)",
            marginBottom: 8,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 18,
            lineHeight: 1.35,
            color: "rgba(255,255,255,0.62)",
          }}
        >
          {note}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          inset: "112px 0 0 0",
        }}
      >
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          left: 28,
          right: 28,
          bottom: 26,
          color: "rgba(255,255,255,0.56)",
          fontFamily: '"JetBrains Mono", "SFMono-Regular", monospace',
          fontSize: 13,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        <div style={{ marginBottom: 10 }}>{progressLabel}</div>
        <div
          style={{
            position: "relative",
            height: 12,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 5,
              width: "100%",
              height: 2,
              background: "rgba(255,255,255,0.14)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 5,
              width: `${clamp01(progress) * 100}%`,
              height: 2,
              background: accentColor,
              boxShadow: `0 0 16px ${accentColor}`,
            }}
          />
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              key={index}
              style={{
                position: "absolute",
                left: `${(index / 8) * 100}%`,
                top: 1,
                width: 1,
                height: 10,
                background: "rgba(255,255,255,0.16)",
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: dotLeft - 6,
              top: 0,
              width: 12,
              height: 12,
              borderRadius: 999,
              background: accentColor,
              boxShadow: `0 0 20px ${accentColor}`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

const EffectOneScene: React.FC<{ frame: number }> = ({ frame }) => {
  const scene = getSceneFrame(frame, sceneOffsets[0], config.sceneDurationFrames);
  if (!scene.visible) {
    return null;
  }

  const linearHead = sampleProgress(
    scene.localFrame,
    effectOneConfig.startFrame,
    effectOneConfig.drawDurationFrames,
    (t) => t,
  );
  const expoHead = sampleProgress(
    scene.localFrame,
    effectOneConfig.startFrame,
    effectOneConfig.drawDurationFrames,
    expoOut,
  );
  const quintHead = sampleProgress(
    scene.localFrame,
    effectOneConfig.startFrame,
    effectOneConfig.drawDurationFrames,
    quintOut,
  );

  return (
    <BaseStage>
      <SceneChrome
        index={1}
        title="Trim Paths + Repeater"
        note="同じ burst を easing 違いで並べて、draw / erase の速度差がどう見えるかをそのまま比較する。"
      />
      <ComparisonCard
        left={rowLeft}
        label="Linear / Linear"
        note="一定速度で描いて一定速度で消す。"
        progress={linearHead}
        progressLabel="Draw Head Position"
        accentColor="#ffd36a"
      >
        <RadialTrimBurst
          frame={scene.localFrame - effectOneConfig.startFrame}
          centerX={cardWidth / 2}
          centerY={cardHeight / 2 + 10}
          lineLength={effectOneConfig.lineLength}
          strokeWidth={effectOneConfig.strokeWidth}
          spokeCount={effectOneConfig.spokeCount}
          rotationOffsetDeg={effectOneConfig.baseRotationDeg}
          drawDurationFrames={effectOneConfig.drawDurationFrames}
          eraseDelayFrames={effectOneConfig.eraseDelayFrames}
          eraseDurationFrames={effectOneConfig.eraseDurationFrames}
          stroke={effectOneConfig.primaryColor}
          glow={effectOneConfig.glowColor}
          drawEase={(t) => t}
          eraseEase={(t) => t}
        />
      </ComparisonCard>
      <ComparisonCard
        left={rowLeft + cardWidth + cardGap}
        label="Expo Out / Cubic In"
        note="AE っぽい punch と trailing erase。"
        progress={expoHead}
        progressLabel="Draw Head Position"
        accentColor="#ff8b5e"
      >
        <RadialTrimBurst
          frame={scene.localFrame - effectOneConfig.startFrame}
          centerX={cardWidth / 2}
          centerY={cardHeight / 2 + 10}
          lineLength={effectOneConfig.lineLength}
          strokeWidth={effectOneConfig.strokeWidth}
          spokeCount={effectOneConfig.spokeCount}
          rotationOffsetDeg={effectOneConfig.baseRotationDeg}
          drawDurationFrames={effectOneConfig.drawDurationFrames}
          eraseDelayFrames={effectOneConfig.eraseDelayFrames}
          eraseDurationFrames={effectOneConfig.eraseDurationFrames}
          stroke={effectOneConfig.primaryColor}
          glow={effectOneConfig.glowColor}
          drawEase={expoOut}
          eraseEase={cubicIn}
        />
      </ComparisonCard>
      <ComparisonCard
        left={rowLeft + (cardWidth + cardGap) * 2}
        label="Quint Out / Quad In"
        note="最初は少し粘って、そのあと一気に進む。"
        progress={quintHead}
        progressLabel="Draw Head Position"
        accentColor="#5de0d1"
      >
        <RadialTrimBurst
          frame={scene.localFrame - effectOneConfig.startFrame}
          centerX={cardWidth / 2}
          centerY={cardHeight / 2 + 10}
          lineLength={effectOneConfig.lineLength}
          strokeWidth={effectOneConfig.strokeWidth}
          spokeCount={effectOneConfig.spokeCount}
          rotationOffsetDeg={effectOneConfig.baseRotationDeg}
          drawDurationFrames={effectOneConfig.drawDurationFrames}
          eraseDelayFrames={effectOneConfig.eraseDelayFrames}
          eraseDurationFrames={effectOneConfig.eraseDurationFrames}
          stroke={effectOneConfig.primaryColor}
          glow={effectOneConfig.glowColor}
          drawEase={quintOut}
          eraseEase={quadIn}
        />
      </ComparisonCard>
    </BaseStage>
  );
};

const EffectTwoScene: React.FC<{ frame: number }> = ({ frame }) => {
  const scene = getSceneFrame(frame, sceneOffsets[1], config.sceneDurationFrames);
  if (!scene.visible) {
    return null;
  }

  const linearScale = sampleProgress(
    scene.localFrame,
    effectTwoConfig.squareStartFrame,
    effectTwoConfig.scaleDurationFrames,
    (t) => t,
  );
  const backScale = sampleProgress(
    scene.localFrame,
    effectTwoConfig.squareStartFrame,
    effectTwoConfig.scaleDurationFrames,
    quintOut,
  );
  const backScaleHeavy = sampleProgress(
    scene.localFrame,
    effectTwoConfig.squareStartFrame,
    effectTwoConfig.scaleDurationFrames,
    backOut,
  );

  return (
    <BaseStage>
      <SceneChrome
        index={2}
        title="Scale + Stroke Shrink"
        note="同じ diamond outline を easing 別に比較して、膨らみ方と線幅の抜け方の差を見せる。"
      />
      <ComparisonCard
        left={rowLeft}
        label="Linear / Linear"
        note="機械的に拡大し、機械的に細くなる。"
        progress={linearScale}
        progressLabel="Outline Scale Progress"
        accentColor="#fff3e4"
      >
        <RadialTrimBurst
          frame={scene.localFrame - effectTwoConfig.burstStartFrame}
          centerX={cardWidth / 2}
          centerY={cardHeight / 2 + 10}
          lineLength={effectOneConfig.lineLength}
          strokeWidth={effectOneConfig.strokeWidth}
          spokeCount={2}
          rotationOffsetDeg={45}
          drawDurationFrames={effectOneConfig.drawDurationFrames}
          eraseDelayFrames={effectOneConfig.eraseDelayFrames}
          eraseDurationFrames={effectOneConfig.eraseDurationFrames}
          stroke={effectTwoConfig.burstColor}
          glow="rgba(82,217,199,0.18)"
          drawEase={(t) => t}
          eraseEase={(t) => t}
        />
        <ExpandingOutline
          frame={scene.localFrame - effectTwoConfig.squareStartFrame}
          centerX={cardWidth / 2}
          centerY={cardHeight / 2 + 10}
          sideLength={effectTwoConfig.squareSide}
          rotationDeg={effectTwoConfig.squareRotationDeg}
          strokeStartWidth={effectTwoConfig.strokeStartWidth}
          strokeEndWidth={effectTwoConfig.strokeEndWidth}
          durationFrames={effectTwoConfig.scaleDurationFrames}
          stroke={effectTwoConfig.squareColor}
          scaleProfile={createFlatProfile("quadOut", effectTwoConfig.scaleDurationFrames)}
          strokeProfile={createFlatProfile("quadOut", effectTwoConfig.scaleDurationFrames)}
        />
      </ComparisonCard>
      <ComparisonCard
        left={rowLeft + cardWidth + cardGap}
        label="Back Out / Quint Out"
        note="一瞬で立ち上がり、外側で気持ちよく settle。"
        progress={backScale}
        progressLabel="Outline Scale Progress"
        accentColor="#52d9c7"
      >
        <RadialTrimBurst
          frame={scene.localFrame - effectTwoConfig.burstStartFrame}
          centerX={cardWidth / 2}
          centerY={cardHeight / 2 + 10}
          lineLength={effectOneConfig.lineLength}
          strokeWidth={effectOneConfig.strokeWidth}
          spokeCount={2}
          rotationOffsetDeg={45}
          drawDurationFrames={effectOneConfig.drawDurationFrames}
          eraseDelayFrames={effectOneConfig.eraseDelayFrames}
          eraseDurationFrames={effectOneConfig.eraseDurationFrames}
          stroke={effectTwoConfig.burstColor}
          glow="rgba(82,217,199,0.18)"
          drawEase={expoOut}
          eraseEase={cubicIn}
        />
        <ExpandingOutline
          frame={scene.localFrame - effectTwoConfig.squareStartFrame}
          centerX={cardWidth / 2}
          centerY={cardHeight / 2 + 10}
          sideLength={effectTwoConfig.squareSide}
          rotationDeg={effectTwoConfig.squareRotationDeg}
          strokeStartWidth={effectTwoConfig.strokeStartWidth}
          strokeEndWidth={effectTwoConfig.strokeEndWidth}
          durationFrames={effectTwoConfig.scaleDurationFrames}
          stroke={effectTwoConfig.squareColor}
          scaleProfile={createBackControlProfile(effectTwoConfig.scaleDurationFrames)}
          strokeProfile={createFlatProfile("quintOut", effectTwoConfig.scaleDurationFrames)}
        />
      </ComparisonCard>
      <ComparisonCard
        left={rowLeft + (cardWidth + cardGap) * 2}
        label="Back Out / Cubic Out"
        note="オーバーシュートがあるので差が最も見えやすい。"
        progress={backScaleHeavy}
        progressLabel="Outline Scale Progress"
        accentColor="#ff9e78"
      >
        <RadialTrimBurst
          frame={scene.localFrame - effectTwoConfig.burstStartFrame}
          centerX={cardWidth / 2}
          centerY={cardHeight / 2 + 10}
          lineLength={effectOneConfig.lineLength}
          strokeWidth={effectOneConfig.strokeWidth}
          spokeCount={2}
          rotationOffsetDeg={45}
          drawDurationFrames={effectOneConfig.drawDurationFrames}
          eraseDelayFrames={effectOneConfig.eraseDelayFrames}
          eraseDurationFrames={effectOneConfig.eraseDurationFrames}
          stroke={effectTwoConfig.burstColor}
          glow="rgba(82,217,199,0.18)"
          drawEase={quintOut}
          eraseEase={quadIn}
        />
        <ExpandingOutline
          frame={scene.localFrame - effectTwoConfig.squareStartFrame}
          centerX={cardWidth / 2}
          centerY={cardHeight / 2 + 10}
          sideLength={effectTwoConfig.squareSide}
          rotationDeg={effectTwoConfig.squareRotationDeg}
          strokeStartWidth={effectTwoConfig.strokeStartWidth}
          strokeEndWidth={effectTwoConfig.strokeEndWidth}
          durationFrames={effectTwoConfig.scaleDurationFrames}
          stroke={effectTwoConfig.squareColor}
          scaleProfile={createFlatProfile("backOut", effectTwoConfig.scaleDurationFrames)}
          strokeProfile={createFlatProfile("cubicOut", effectTwoConfig.scaleDurationFrames)}
        />
      </ComparisonCard>
    </BaseStage>
  );
};

const EffectThreeScene: React.FC<{ frame: number }> = ({ frame }) => {
  const scene = getSceneFrame(frame, sceneOffsets[2], config.sceneDurationFrames);
  if (!scene.visible) {
    return null;
  }

  const linearChain = sampleProgress(
    scene.localFrame,
    effectThreeConfig.startFrame,
    effectThreeConfig.drawDurationFrames,
    (t) => t,
  );
  const quintChain = sampleProgress(
    scene.localFrame,
    effectThreeConfig.startFrame,
    effectThreeConfig.drawDurationFrames,
    quintOut,
  );
  const expoChain = sampleProgress(
    scene.localFrame,
    effectThreeConfig.startFrame,
    effectThreeConfig.drawDurationFrames,
    expoOut,
  );

  return (
    <BaseStage>
      <SceneChrome
        index={3}
        title="Parented Rotation Chain"
        note="同じ 5 レイヤー鎖を easing 別に出して、順送りの立ち上がり方と収束の癖を比べる。"
      />
      <ComparisonCard
        left={rowLeft}
        label="Linear / Linear"
        note="順番に出るが、勢いはほぼ均一。"
        progress={linearChain}
        progressLabel="Lead Layer Progress"
        accentColor="#ffd36a"
      >
        <StaggeredSpokeChain
          frame={scene.localFrame - effectThreeConfig.startFrame}
          centerX={cardWidth / 2}
          centerY={cardHeight / 2 + 10}
          lineLength={effectThreeConfig.lineLength}
          strokeWidth={effectThreeConfig.strokeWidth}
          startRotationDeg={effectThreeConfig.baseRotationDeg}
          rotationStepDeg={effectThreeConfig.rotationStepDeg}
          layerCount={effectThreeConfig.layerCount}
          layerStaggerFrames={effectThreeConfig.layerStaggerFrames}
          drawDurationFrames={effectThreeConfig.drawDurationFrames}
          eraseDelayFrames={effectThreeConfig.eraseDelayFrames}
          eraseDurationFrames={effectThreeConfig.eraseDurationFrames}
          colors={effectThreeConfig.colors}
          drawEase={(t) => t}
          eraseEase={(t) => t}
        />
      </ComparisonCard>
      <ComparisonCard
        left={rowLeft + cardWidth + cardGap}
        label="Quint Out / Cubic In"
        note="滑らかに広がり、後ろだけきれいに消える。"
        progress={quintChain}
        progressLabel="Lead Layer Progress"
        accentColor="#ff6a55"
      >
        <StaggeredSpokeChain
          frame={scene.localFrame - effectThreeConfig.startFrame}
          centerX={cardWidth / 2}
          centerY={cardHeight / 2 + 10}
          lineLength={effectThreeConfig.lineLength}
          strokeWidth={effectThreeConfig.strokeWidth}
          startRotationDeg={effectThreeConfig.baseRotationDeg}
          rotationStepDeg={effectThreeConfig.rotationStepDeg}
          layerCount={effectThreeConfig.layerCount}
          layerStaggerFrames={effectThreeConfig.layerStaggerFrames}
          drawDurationFrames={effectThreeConfig.drawDurationFrames}
          eraseDelayFrames={effectThreeConfig.eraseDelayFrames}
          eraseDurationFrames={effectThreeConfig.eraseDurationFrames}
          colors={effectThreeConfig.colors}
          drawEase={quintOut}
          eraseEase={cubicIn}
        />
      </ComparisonCard>
      <ComparisonCard
        left={rowLeft + (cardWidth + cardGap) * 2}
        label="Expo Out / Quad In"
        note="最初に一気に立ち上がる punch が最も強い。"
        progress={expoChain}
        progressLabel="Lead Layer Progress"
        accentColor="#5de0d1"
      >
        <StaggeredSpokeChain
          frame={scene.localFrame - effectThreeConfig.startFrame}
          centerX={cardWidth / 2}
          centerY={cardHeight / 2 + 10}
          lineLength={effectThreeConfig.lineLength}
          strokeWidth={effectThreeConfig.strokeWidth}
          startRotationDeg={effectThreeConfig.baseRotationDeg}
          rotationStepDeg={effectThreeConfig.rotationStepDeg}
          layerCount={effectThreeConfig.layerCount}
          layerStaggerFrames={effectThreeConfig.layerStaggerFrames}
          drawDurationFrames={effectThreeConfig.drawDurationFrames}
          eraseDelayFrames={effectThreeConfig.eraseDelayFrames}
          eraseDurationFrames={effectThreeConfig.eraseDurationFrames}
          colors={effectThreeConfig.colors}
          drawEase={expoOut}
          eraseEase={quadIn}
        />
      </ComparisonCard>
    </BaseStage>
  );
};

export const AETipPopShapeEffects: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Sequence from={sceneOffsets[0]} durationInFrames={config.sceneDurationFrames}>
        <EffectOneScene frame={frame} />
      </Sequence>
      <Sequence from={sceneOffsets[1]} durationInFrames={config.sceneDurationFrames}>
        <EffectTwoScene frame={frame} />
      </Sequence>
      <Sequence from={sceneOffsets[2]} durationInFrames={config.sceneDurationFrames}>
        <EffectThreeScene frame={frame} />
      </Sequence>
    </AbsoluteFill>
  );
};
