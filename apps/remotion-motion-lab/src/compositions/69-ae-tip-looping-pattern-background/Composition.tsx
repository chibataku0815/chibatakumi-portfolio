import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { config, sceneFrames, scenes } from "./config";
import {
  createPaperSpecks,
  createPatternTiles,
  getMotifTransform,
  type PatternMethod,
} from "./lib/patterns";
import { OrangeMotif } from "./lib/orange-motif";

export type AETipLoopingPatternBackgroundProps = {
  mode?: "showcase" | PatternMethod;
  showLabel?: boolean;
};

const LabelCard: React.FC<{
  title: string;
  note: string;
  localFrame: number;
}> = ({ title, note, localFrame }) => {
  const opacity = interpolate(localFrame, [0, 8, 74, 88], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(localFrame, [0, 8], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 48,
        bottom: 42,
        width: 410,
        padding: "18px 22px",
        borderRadius: 26,
        background: config.cardBackground,
        border: `1px solid ${config.cardBorder}`,
        boxShadow: config.cardShadow,
        backdropFilter: "blur(14px)",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          fontFamily:
            '"Avenir Next", "Hiragino Sans", "Noto Sans JP", sans-serif',
          fontSize: 13,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: config.labelColor,
          marginBottom: 8,
        }}
      >
        AE LOOPING PATTERN BACKGROUND
      </div>
      <div
        style={{
          fontFamily:
            '"Avenir Next", "Hiragino Sans", "Noto Sans JP", sans-serif',
          fontSize: 38,
          lineHeight: 1,
          letterSpacing: "-0.05em",
          fontWeight: 700,
          color: config.titleColor,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily:
            '"Avenir Next", "Hiragino Sans", "Noto Sans JP", sans-serif',
          fontSize: 17,
          lineHeight: 1.35,
          color: config.noteColor,
        }}
      >
        {note}
      </div>
    </div>
  );
};

const PaperTexture: React.FC<{ background: string }> = ({ background }) => {
  const paperSpecks = createPaperSpecks({
    width: config.width,
    height: config.height,
    count: config.paperSpeckCount,
    seed: 41,
    minSize: 0.8,
    maxSize: 3.2,
    minOpacity: 0.08,
    maxOpacity: 0.28,
    blurRange: [0, 1.2],
  });
  const bloomClouds = createPaperSpecks({
    width: config.width,
    height: config.height,
    count: config.bloomCloudCount,
    seed: 83,
    minSize: 120,
    maxSize: 240,
    minOpacity: 0.08,
    maxOpacity: 0.18,
    blurRange: [24, 42],
  });

  return (
    <AbsoluteFill
      style={{
        background,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 18%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 24%), radial-gradient(circle at 74% 62%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 22%), radial-gradient(circle at 56% 34%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 28%)",
        }}
      />
      {bloomClouds.map((cloud) => (
        <div
          key={cloud.key}
          style={{
            position: "absolute",
            left: cloud.x,
            top: cloud.y,
            width: cloud.size,
            height: cloud.size * 0.75,
            marginLeft: -cloud.size / 2,
            marginTop: -(cloud.size * 0.75) / 2,
            borderRadius: 999,
            opacity: cloud.opacity,
            background: "rgba(255,255,255,0.8)",
            filter: `blur(${cloud.blur}px)`,
          }}
        />
      ))}
      {paperSpecks.map((speck) => (
        <div
          key={speck.key}
          style={{
            position: "absolute",
            left: speck.x,
            top: speck.y,
            width: speck.size,
            height: speck.size,
            borderRadius: 999,
            background: "rgba(255,255,255,0.92)",
            opacity: speck.opacity,
            filter: `blur(${speck.blur}px)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const PatternScene: React.FC<{
  sceneIndex: number;
  localFrame: number;
  showLabel: boolean;
}> = ({ sceneIndex, localFrame, showLabel }) => {
  const scene = scenes[sceneIndex];
  const tiles = createPatternTiles({
    width: config.width,
    height: config.height,
    spec: scene.layout,
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <PaperTexture background={scene.background} />
      {tiles.map((tile) => {
        const motion = getMotifTransform({
          frame: localFrame,
          fps: config.fps,
          seed: tile.seed,
          variant: scene.motionVariant,
        });

        return (
          <OrangeMotif
            key={tile.key}
            left={tile.x + motion.offsetX}
            top={tile.y + motion.offsetY}
            size={config.motifBaseSize}
            scale={tile.baseScale * motion.scale}
            rotationDeg={tile.baseRotationDeg + motion.rotationDeg}
            mirrorX={tile.mirrorX}
            mirrorY={tile.mirrorY}
            seed={tile.seed}
          />
        );
      })}
      {showLabel ? (
        <LabelCard
          title={scene.title}
          note={scene.note}
          localFrame={localFrame}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const AETipLoopingPatternBackground: React.FC<
  AETipLoopingPatternBackgroundProps
> = ({ mode = "showcase", showLabel = true }) => {
  const frame = useCurrentFrame();

  if (mode !== "showcase") {
    const sceneIndex = scenes.findIndex((scene) => scene.method === mode);
    const resolvedIndex = sceneIndex === -1 ? 0 : sceneIndex;

    return (
      <PatternScene
        sceneIndex={resolvedIndex}
        localFrame={frame}
        showLabel={showLabel}
      />
    );
  }

  const sceneIndex = Math.min(
    scenes.length - 1,
    Math.floor(frame / sceneFrames),
  );
  const localFrame = frame - sceneIndex * sceneFrames;

  return (
    <PatternScene
      sceneIndex={sceneIndex}
      localFrame={localFrame}
      showLabel={showLabel}
    />
  );
};
