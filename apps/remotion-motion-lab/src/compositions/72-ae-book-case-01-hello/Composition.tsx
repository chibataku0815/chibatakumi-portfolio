import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import {
  config,
  hello2Config,
  hello3Config,
  hello4Config,
  type HelloBubbleSpec,
  type HelloSpriteBubbleSpec,
  type Hello2HeroSpec,
  type Hello3SpriteBubbleSpec,
  type Hello3HeroSpec,
  type Hello4SpriteBubbleSpec,
  type Hello4HeroSpec,
} from "./config";
import { helloCrowdWaveLocal } from "./lib/hello-crowd-wave-local";
import { helloHeroSplitRevealLocal } from "./lib/hello-hero-split-reveal-local";
import { helloRowPopLocal } from "./lib/hello-row-pop-local";

const bubblePath =
  "M50 18 L193 0 L318 20 L342 74 L320 132 H118 L80 182 L84 132 H24 L0 78 L20 28 Z";

const SpeechBubble: React.FC<{ spec: HelloBubbleSpec }> = ({ spec }) => {
  const frame = useCurrentFrame();
  const scale = helloRowPopLocal({
    frame,
    startFrame: spec.startFrame,
    seedScale: config.seedScale,
    peakScale: config.peakScale,
    growFrames: config.growFrames,
    settleFrames: config.settleFrames,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: spec.centerX,
        top: spec.centerY,
        width: config.bubbleWidth,
        height: config.bubbleHeight,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: "50% 50%",
      }}
    >
      <svg
        viewBox="0 0 342 182"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
      >
        <path d={bubblePath} fill={config.bubbleFill} />
        <text
          x="171"
          y="79"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={config.textColor}
          style={{
            fontFamily: config.fontFamily,
            fontSize: `${config.textSize}px`,
            fontWeight: 900,
            letterSpacing: `${config.textLetterSpacingEm}em`,
          }}
        >
          Hello
        </text>
      </svg>
    </div>
  );
};

const SpriteBubble: React.FC<{
  src: string;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  scale: number;
  layer: number;
}> = ({ src, centerX, centerY, width, height, scale, layer }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: centerX,
        top: centerY,
        width,
        height,
        zIndex: layer,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: "50% 50%",
      }}
    >
      <Img
        src={staticFile(src)}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
};

const hello2LowerCrowd = hello2Config.crowd
  .filter((bubble) => bubble.layer < hello2Config.hero.layer)
  .sort((a, b) => a.layer - b.layer);

const hello2UpperCrowd = hello2Config.crowd
  .filter((bubble) => bubble.layer >= hello2Config.hero.layer)
  .sort((a, b) => a.layer - b.layer);

const hello3LowerCrowd = hello3Config.crowd
  .filter((bubble) => bubble.layer < hello3Config.hero.layer)
  .sort((a, b) => a.layer - b.layer);

const hello3UpperCrowd = hello3Config.crowd
  .filter((bubble) => bubble.layer >= hello3Config.hero.layer)
  .sort((a, b) => a.layer - b.layer);

const hello4LowerCrowd = hello4Config.crowd
  .filter((bubble) => bubble.layer < hello4Config.hero.layer)
  .sort((a, b) => a.layer - b.layer);

const hello4UpperCrowd = hello4Config.crowd
  .filter((bubble) => bubble.layer >= hello4Config.hero.layer)
  .sort((a, b) => a.layer - b.layer);

interface CrowdWaveBubbleProps {
  spec: HelloSpriteBubbleSpec | Hello3SpriteBubbleSpec | Hello4SpriteBubbleSpec;
  seedScale: number;
  peakScale: number;
  growFrames: number;
  settleFrames: number;
}

const CrowdWaveBubble: React.FC<CrowdWaveBubbleProps> = ({
  spec,
  seedScale,
  peakScale,
  growFrames,
  settleFrames,
}) => {
  const frame = useCurrentFrame();

  if (frame < spec.startFrame) {
    return null;
  }

  const scale = helloCrowdWaveLocal({
    frame,
    startFrame: spec.startFrame,
    seedScale,
    peakScale,
    growFrames,
    settleFrames,
  });

  return <SpriteBubble {...spec} scale={scale} />;
};

const Hello2HeroBubble: React.FC<{ spec: Hello2HeroSpec }> = ({ spec }) => {
  const frame = useCurrentFrame();

  if (frame < spec.startFrame) {
    return null;
  }

  const scale = helloRowPopLocal({
    frame,
    startFrame: spec.startFrame,
    seedScale: hello2Config.heroSeedScale,
    peakScale: hello2Config.heroPeakScale,
    growFrames: hello2Config.heroGrowFrames,
    settleFrames: hello2Config.heroSettleFrames,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: spec.centerX,
        top: spec.centerY,
        width: spec.width,
        height: spec.height,
        zIndex: spec.layer,
        transform: `translate(-50%, -50%) scale(${scale})`,
        transformOrigin: "50% 50%",
      }}
    >
      <svg
        viewBox="0 0 342 182"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
      >
        <path d={bubblePath} fill={config.bubbleFill} />
        <text
          x="171"
          y="79"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={config.textColor}
          style={{
            fontFamily: config.fontFamily,
            fontSize: `${spec.textSize}px`,
            fontWeight: 900,
            letterSpacing: `${config.textLetterSpacingEm}em`,
          }}
        >
          Hello
        </text>
      </svg>
    </div>
  );
};

const Hello3HeroBubble: React.FC<{ spec: Hello3HeroSpec }> = ({ spec }) => {
  const frame = useCurrentFrame();

  if (frame < spec.startFrame) {
    return null;
  }

  const scale = helloRowPopLocal({
    frame,
    startFrame: spec.startFrame,
    seedScale: hello3Config.heroSeedScale,
    peakScale: hello3Config.heroPeakScale,
    growFrames: hello3Config.heroGrowFrames,
    settleFrames: hello3Config.heroSettleFrames,
  });

  return <SpriteBubble {...spec} scale={scale} />;
};

const Hello4HeroBubble: React.FC<{ spec: Hello4HeroSpec }> = ({ spec }) => {
  const frame = useCurrentFrame();

  if (frame < spec.startFrame) {
    return null;
  }

  const { plateScale, textReveal } = helloHeroSplitRevealLocal({
    frame,
    startFrame: spec.startFrame,
    seedScale: hello4Config.heroSeedScale,
    peakScale: hello4Config.heroPeakScale,
    growFrames: hello4Config.heroGrowFrames,
    settleFrames: hello4Config.heroSettleFrames,
    textStartFrame: spec.textStartFrame,
    textRevealFrames: spec.textRevealFrames,
  });

  const hiddenRight = Math.max(0, 100 - textReveal * 100);

  return (
    <div
      style={{
        position: "absolute",
        left: spec.centerX,
        top: spec.centerY,
        width: spec.width,
        height: spec.height,
        zIndex: spec.layer,
        transform: `translate(-50%, -50%) scale(${plateScale})`,
        transformOrigin: "50% 50%",
      }}
    >
      <Img
        src={staticFile(spec.plateSrc)}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 62,
          top: 70,
          width: 360,
          height: 150,
          clipPath: `inset(0 ${hiddenRight}% 0 0)`,
          opacity: textReveal <= 0 ? 0 : 1,
        }}
      >
        <svg
          viewBox="0 0 360 150"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            overflow: "visible",
          }}
        >
          <text
            x="180"
            y="76"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={config.textColor}
            style={{
              fontFamily: config.fontFamily,
              fontSize: "118px",
              fontWeight: 900,
              letterSpacing: `${config.textLetterSpacingEm}em`,
            }}
          >
            Hello
          </text>
        </svg>
      </div>
    </div>
  );
};

export const AEBookCase01HelloHello1: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        background: config.background,
        overflow: "hidden",
      }}
    >
      {frame < 1
        ? null
        : config.bubbles.map((bubble) => (
            <SpeechBubble key={bubble.key} spec={bubble} />
          ))}
    </AbsoluteFill>
  );
};

export const AEBookCase01HelloHello2: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: hello2Config.background,
        overflow: "hidden",
      }}
    >
      {hello2LowerCrowd.map((bubble) => (
        <CrowdWaveBubble
          key={bubble.key}
          spec={bubble}
          seedScale={hello2Config.crowdSeedScale}
          peakScale={hello2Config.crowdPeakScale}
          growFrames={hello2Config.crowdGrowFrames}
          settleFrames={hello2Config.crowdSettleFrames}
        />
      ))}
      <Hello2HeroBubble spec={hello2Config.hero} />
      {hello2UpperCrowd.map((bubble) => (
        <CrowdWaveBubble
          key={bubble.key}
          spec={bubble}
          seedScale={hello2Config.crowdSeedScale}
          peakScale={hello2Config.crowdPeakScale}
          growFrames={hello2Config.crowdGrowFrames}
          settleFrames={hello2Config.crowdSettleFrames}
        />
      ))}
    </AbsoluteFill>
  );
};

export const AEBookCase01HelloHello3: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: hello3Config.background,
        overflow: "hidden",
      }}
    >
      {hello3LowerCrowd.map((bubble) => (
        <CrowdWaveBubble
          key={bubble.key}
          spec={bubble}
          seedScale={hello3Config.crowdSeedScale}
          peakScale={hello3Config.crowdPeakScale}
          growFrames={hello3Config.crowdGrowFrames}
          settleFrames={hello3Config.crowdSettleFrames}
        />
      ))}
      <Hello3HeroBubble spec={hello3Config.hero} />
      {hello3UpperCrowd.map((bubble) => (
        <CrowdWaveBubble
          key={bubble.key}
          spec={bubble}
          seedScale={hello3Config.crowdSeedScale}
          peakScale={hello3Config.crowdPeakScale}
          growFrames={hello3Config.crowdGrowFrames}
          settleFrames={hello3Config.crowdSettleFrames}
        />
      ))}
    </AbsoluteFill>
  );
};

export const AEBookCase01HelloHello4: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: hello4Config.background,
        overflow: "hidden",
      }}
    >
      {hello4LowerCrowd.map((bubble) => (
        <CrowdWaveBubble
          key={bubble.key}
          spec={bubble}
          seedScale={hello4Config.crowdSeedScale}
          peakScale={hello4Config.crowdPeakScale}
          growFrames={hello4Config.crowdGrowFrames}
          settleFrames={hello4Config.crowdSettleFrames}
        />
      ))}
      <Hello4HeroBubble spec={hello4Config.hero} />
      {hello4UpperCrowd.map((bubble) => (
        <CrowdWaveBubble
          key={bubble.key}
          spec={bubble}
          seedScale={hello4Config.crowdSeedScale}
          peakScale={hello4Config.crowdPeakScale}
          growFrames={hello4Config.crowdGrowFrames}
          settleFrames={hello4Config.crowdSettleFrames}
        />
      ))}
    </AbsoluteFill>
  );
};
