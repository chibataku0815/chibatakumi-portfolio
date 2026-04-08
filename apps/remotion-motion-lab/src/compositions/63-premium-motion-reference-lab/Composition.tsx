import React, { type CSSProperties } from "react";
import { AbsoluteFill, Sequence, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { motionLabConfig, motionLabOverviewFrames } from "./config";
import {
  getMotionStudy,
  motionStudyOrder,
  type MotionStudyId,
  type MotionStudyVariant,
} from "./studies";
import {
  buildComparisonLabels,
  createContactSheetPlan,
  createStudyPanelMeta,
  getRepresentativeFrameSet,
  summarizeVariantAxes,
} from "../../lib/motion-study-tools";
import {
  getPremiumLongSettleState,
  mix,
} from "../../lib/premium-motion";
import {
  createPremiumContinuitySwapShot,
  createPremiumLayeredPanelReveal,
  createPremiumResultRevealShot,
  createPremiumSearchEntryShot,
  createPremiumSendIconBeat,
  createPremiumWeatherPullbackShot,
} from "../../lib/premium-shot-recipes";

const { fontFamily } = loadFont();

const pageStyle: CSSProperties = {
  fontFamily,
  background:
    "linear-gradient(180deg, #090d14 0%, #0f1621 38%, #0d1017 100%)",
  color: "#f3f5f7",
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(232, 236, 240, 0.62)",
};

const titleStyle: CSSProperties = {
  fontSize: 38,
  lineHeight: 1.05,
  fontWeight: 700,
  letterSpacing: "-0.04em",
  marginTop: 10,
};

const subheadStyle: CSSProperties = {
  fontSize: 17,
  lineHeight: 1.45,
  color: "rgba(232, 236, 240, 0.76)",
};

const metaCardStyle: CSSProperties = {
  borderRadius: 22,
  padding: "16px 18px",
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const metaCardLabelStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "rgba(232,236,240,0.52)",
};

const viewportGradient =
  "linear-gradient(135deg, #f6f8fb 0%, #eef2f7 48%, #edf4fb 100%)";

const thinBorder = "1px solid rgba(13, 19, 27, 0.08)";

const makePillStyle = (opacity: number): CSSProperties => ({
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.04em",
  color: `rgba(16, 21, 29, ${0.82 * opacity})`,
  background: `rgba(245, 248, 251, ${0.92 * opacity})`,
  border: `1px solid rgba(16, 21, 29, ${0.08 * opacity})`,
});

const PreviewStage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        height: 334,
        borderRadius: 24,
        background: viewportGradient,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.8), 0 18px 40px rgba(0,0,0,0.08)",
      }}
    >
      {children}
    </div>
  );
};

const GradientField: React.FC<{
  progress: number;
  shiftY?: number;
  scaleFrom?: number;
  scaleTo?: number;
}> = ({ progress, shiftY = 0, scaleFrom = 1, scaleTo = 1.04 }) => {
  const y = mix(0, shiftY, progress);
  const scale = mix(scaleFrom, scaleTo, progress);

  return (
    <div
      style={{
        position: "absolute",
        inset: -24,
        transform: `translateY(${y}px) scale(${scale})`,
        background:
          "linear-gradient(135deg, rgba(236,241,248,0.92) 0%, rgba(224,236,247,0.96) 48%, rgba(244,233,229,0.82) 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -30,
          bottom: -20,
          width: 180,
          height: 180,
          borderRadius: "50%",
          filter: "blur(18px)",
          background: "rgba(255, 205, 183, 0.55)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 12,
          top: -26,
          width: 220,
          height: 220,
          borderRadius: "50%",
          filter: "blur(22px)",
          background: "rgba(169, 210, 255, 0.50)",
        }}
      />
    </div>
  );
};

const TrafficDots: React.FC = () => {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {["#f06d66", "#f8bd5e", "#5bc35b"].map((color) => (
        <div
          key={color}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
          }}
        />
      ))}
    </div>
  );
};

const LeftRail: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 20,
        top: 70,
        width: 28,
        display: "flex",
        flexDirection: "column",
        gap: 11,
        opacity: progress,
        transform: `translateY(${mix(10, 0, progress)}px)`,
      }}
    >
      {[18, 16, 16, 16].map((size, index) => (
        <div
          key={index}
          style={{
            width: size,
            height: size,
            borderRadius: index === 0 ? 8 : 999,
            background: index === 0 ? "#0f141c" : "rgba(15,20,28,0.18)",
          }}
        />
      ))}
    </div>
  );
};

const SearchPane: React.FC<{ progress: number }> = ({ progress }) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: progress,
        transform: `translateY(${mix(18, 0, progress)}px)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 78,
          left: 0,
          width: "100%",
          textAlign: "center",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: "#0e141c",
        }}
      >
        Search Lab
      </div>
      <div
        style={{
          position: "absolute",
          left: 82,
          right: 82,
          top: 130,
          height: 54,
          borderRadius: 15,
          background: "#f2f4f7",
          border: "1px solid rgba(15,20,28,0.06)",
          display: "flex",
          alignItems: "center",
          padding: "0 18px",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: "1.5px solid rgba(15,20,28,0.34)",
          }}
        />
        <div
          style={{
            fontSize: 13,
            color: "rgba(15,20,28,0.42)",
            letterSpacing: "-0.01em",
          }}
        >
          When does premium motion stop feeling premium?
        </div>
        <div
          style={{
            marginLeft: "auto",
            width: 20,
            height: 20,
            borderRadius: 7,
            background: "#0f141c",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 112,
          right: 112,
          top: 212,
          display: "flex",
          gap: 10,
          justifyContent: "center",
        }}
      >
        <div style={makePillStyle(progress)}>restrained</div>
        <div style={makePillStyle(progress)}>costly stop</div>
        <div style={makePillStyle(progress)}>cut continuity</div>
      </div>
    </div>
  );
};

const ResultPane: React.FC<{
  progress: number;
  scale?: number;
  compact?: boolean;
  floatingQuery?: boolean;
}> = ({ progress, scale = 1, compact = false, floatingQuery = false }) => {
  const rows = compact ? 4 : 5;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: progress,
        transform: `translateY(${mix(16, 0, progress)}px) scale(${scale})`,
        transformOrigin: "center top",
      }}
    >
      {floatingQuery ? (
        <div
          style={{
            position: "absolute",
            right: 64,
            top: 68,
            ...makePillStyle(progress),
            background: `rgba(15,20,28,${0.88 * progress})`,
            color: `rgba(255,255,255,${0.92 * progress})`,
          }}
        >
          will it be warm?
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          top: compact ? 86 : 78,
          left: 76,
          right: 76,
        }}
      >
        <div
          style={{
            fontSize: compact ? 22 : 20,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "#0e141c",
          }}
        >
          Mild weekend weather, controlled reveal
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "rgba(15,20,28,0.48)",
          }}
        >
          Reference lab summary / layered timing / continuity check
        </div>
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: compact ? "1fr" : "repeat(2, 1fr)",
            gap: 10,
          }}
        >
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              style={{
                height: compact ? 34 : 48,
                borderRadius: 14,
                background:
                  index === 0
                    ? "rgba(243, 246, 249, 1)"
                    : "rgba(247, 249, 251, 0.92)",
                border: "1px solid rgba(15,20,28,0.05)",
              }}
            />
          ))}
        </div>
        <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: compact ? "64px 1fr 110px" : "80px 1fr 130px",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  height: 10,
                  borderRadius: 999,
                  background: "rgba(15,20,28,0.12)",
                }}
              />
              <div
                style={{
                  height: 10,
                  borderRadius: 999,
                  background: "rgba(15,20,28,0.08)",
                }}
              />
              <div
                style={{
                  height: 10,
                  borderRadius: 999,
                  background: "rgba(15,20,28,0.08)",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const BrowserWindow: React.FC<{
  shellScale: number;
  shellY?: number;
  shellX?: number;
  shellOpacity?: number;
  chromeProgress: number;
  railProgress?: number;
  searchProgress?: number;
  detailProgress?: number;
  detailScale?: number;
  floatingQuery?: boolean;
  compactDetail?: boolean;
}> = ({
  shellScale,
  shellY = 0,
  shellX = 0,
  shellOpacity = 1,
  chromeProgress,
  railProgress = 0,
  searchProgress = 0,
  detailProgress = 0,
  detailScale = 1,
  floatingQuery = false,
  compactDetail = false,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 548,
        height: 306,
        borderRadius: 24,
        transform: `translate(-50%, -50%) translate(${shellX}px, ${shellY}px) scale(${shellScale})`,
        transformOrigin: "center center",
        background: "rgba(255,255,255,0.98)",
        boxShadow:
          "0 34px 70px rgba(21, 29, 40, 0.16), inset 0 1px 0 rgba(255,255,255,0.8)",
        border: thinBorder,
        opacity: shellOpacity,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: 40,
          background: "rgba(251, 252, 253, 0.98)",
          borderBottom: "1px solid rgba(15,20,28,0.05)",
          opacity: chromeProgress,
          transform: `translateY(${mix(-8, 0, chromeProgress)}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 14,
            top: 16,
          }}
        >
          <TrafficDots />
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 10,
            transform: "translateX(-50%)",
            width: 180,
            height: 18,
            borderRadius: 999,
            background: "rgba(15,20,28,0.06)",
          }}
        />
      </div>
      <LeftRail progress={railProgress} />
      <SearchPane progress={searchProgress} />
      <ResultPane
        progress={detailProgress}
        scale={detailScale}
        compact={compactDetail}
        floatingQuery={floatingQuery}
      />
    </div>
  );
};

const VariantPanel: React.FC<{
  studyId: MotionStudyId;
  variant: MotionStudyVariant;
  localFrame: number;
  panelLabel: string;
  captureFrames: readonly number[];
  shortlisted?: boolean;
}> = ({ studyId, variant, localFrame, panelLabel, captureFrames, shortlisted = false }) => {
  const content = renderStudyPreview(studyId, variant, localFrame);

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        borderRadius: 28,
        padding: 18,
        background: "rgba(255,255,255,0.055)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <div style={labelStyle}>Variant {variant.id}</div>
          <div
            style={{
              marginTop: 6,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            {variant.name}
          </div>
        </div>
        {shortlisted ? (
          <div
            style={{
              ...makePillStyle(1),
              background: "rgba(255,255,255,0.14)",
              color: "#ffffff",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            shortlist
          </div>
        ) : null}
      </div>
      <PreviewStage>{content}</PreviewStage>
      <div
        style={{
          marginTop: 14,
          fontSize: 13,
          color: "rgba(232,236,240,0.74)",
          lineHeight: 1.4,
        }}
      >
        {variant.note}
      </div>
      <div
        style={{
          marginTop: 12,
          fontSize: 11,
          lineHeight: 1.5,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "rgba(232,236,240,0.5)",
        }}
      >
        {panelLabel} / capture {captureFrames.join(" / ")}f
      </div>
    </div>
  );
};

const PushInPreview = ({
  localFrame,
  variant,
}: {
  localFrame: number;
  variant: MotionStudyVariant;
}) => {
  const state = createPremiumSearchEntryShot(localFrame, {
    startFrame: 20,
    motion: variant.motion,
    scaleFrom: variant.scaleFrom ?? 1,
    scaleTo: variant.scaleTo ?? 1.12,
    backgroundScaleFrom: variant.backgroundScaleFrom,
    backgroundScaleTo: variant.backgroundScaleTo,
    backgroundShift: variant.backgroundShift,
    chromeDelayFrames: variant.chromeDelayFrames,
    contentDelayFrames: variant.contentDelayFrames,
  });

  return (
    <>
      <GradientField
        progress={state.background.progress}
        shiftY={state.background.shiftY}
        scaleFrom={1}
        scaleTo={state.background.scale}
      />
      <BrowserWindow
        shellScale={state.shell.scale}
        chromeProgress={state.chrome.progress}
        searchProgress={state.content.progress}
      />
    </>
  );
};

const PullBackPreview = ({
  localFrame,
  variant,
}: {
  localFrame: number;
  variant: MotionStudyVariant;
}) => {
  const state = createPremiumWeatherPullbackShot(localFrame, {
    startFrame: 22,
    motion: variant.motion,
    scaleFrom: variant.scaleFrom ?? 1.24,
    scaleTo: variant.scaleTo ?? 1,
    detailScaleFrom: variant.detailScaleFrom,
    detailScaleTo: variant.detailScaleTo,
    backgroundScaleFrom: variant.backgroundScaleFrom,
    backgroundScaleTo: variant.backgroundScaleTo,
    backgroundShift: variant.backgroundShift,
    railDelayFrames: variant.railDelayFrames,
    contentDelayFrames: variant.contentDelayFrames,
  });

  return (
    <>
      <GradientField
        progress={state.background.progress}
        shiftY={state.background.shiftY}
        scaleFrom={1}
        scaleTo={state.background.scale}
      />
      <BrowserWindow
        shellScale={state.shell.scale}
        chromeProgress={state.chrome.progress}
        railProgress={state.chrome.railProgress}
        detailProgress={1}
        detailScale={state.detail.scale}
        floatingQuery
        compactDetail
      />
    </>
  );
};

const LongSettlePreview = ({
  localFrame,
  variant,
}: {
  localFrame: number;
  variant: MotionStudyVariant;
}) => {
  const state = getPremiumLongSettleState(localFrame, {
    startFrame: 26,
    motion: variant.motion,
    scaleFrom: variant.scaleFrom ?? 0.96,
    scaleTo: variant.scaleTo ?? 1,
    yFrom: variant.yFrom ?? 42,
    yTo: variant.yTo ?? 0,
  });

  return (
    <>
      <GradientField progress={0.36} shiftY={-10} scaleFrom={1} scaleTo={1.02} />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 288,
          height: 182,
          transform: `translate(-50%, -50%) translateY(${state.translateY}px) scale(${state.scale})`,
          borderRadius: 26,
          background: "rgba(255,255,255,0.98)",
          border: thinBorder,
          boxShadow:
            "0 28px 56px rgba(15,20,28,0.14), inset 0 1px 0 rgba(255,255,255,0.84)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 24,
            right: 24,
            top: 24,
            height: 10,
            borderRadius: 999,
            background: "rgba(15,20,28,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 24,
            right: 72,
            top: 52,
            height: 34,
            borderRadius: 14,
            background: "#f4f6f8",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 24,
            top: 104,
            fontSize: 27,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "#0d131b",
          }}
        >
          High-end stop
        </div>
        <div
          style={{
            position: "absolute",
            left: 24,
            right: 24,
            bottom: 24,
            height: 10,
            borderRadius: 999,
            background: "rgba(15,20,28,0.08)",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 320,
          height: 210,
          transform: "translate(-50%, -50%)",
          borderRadius: 28,
          border: "1px dashed rgba(15,20,28,0.16)",
        }}
      />
    </>
  );
};

const SnapInPreview = ({
  localFrame,
  variant,
}: {
  localFrame: number;
  variant: MotionStudyVariant;
}) => {
  const state = createPremiumSendIconBeat(localFrame, {
    startFrame: 32,
    snapMotion: variant.motion,
    scaleFrom: variant.scaleFrom ?? 0.9,
    scaleTo: variant.scaleTo ?? 1,
    yFrom: variant.yFrom ?? 18,
    yTo: variant.yTo ?? 0,
  });

  return (
    <>
      <GradientField progress={0.42} shiftY={-8} scaleFrom={1} scaleTo={1.02} />
      <div
        style={{
          position: "absolute",
          left: 78,
          right: 78,
          bottom: 70,
          height: 52,
          borderRadius: 16,
          background: "rgba(255,255,255,0.94)",
          border: thinBorder,
          display: "flex",
          alignItems: "center",
          paddingLeft: 18,
          color: "rgba(15,20,28,0.42)",
          fontSize: 13,
        }}
      >
        ask follow-up
      </div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "46%",
          width: 110,
          height: 110,
          borderRadius: "50%",
          transform: `translate(-50%, -50%) translateY(${state.shell.translateY ?? 0}px) scale(${state.shell.scale})`,
          background: "#0f141c",
          boxShadow: "0 24px 44px rgba(15,20,28,0.24)",
          opacity: state.shell.opacity,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 28,
            height: 28,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 12,
              top: 3,
              width: 4,
              height: 20,
              borderRadius: 999,
              background: "#ffffff",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 5,
              top: 8,
              width: 18,
              height: 18,
              borderLeft: "4px solid #ffffff",
              borderBottom: "4px solid #ffffff",
              transform: "rotate(135deg)",
              borderBottomLeftRadius: 2,
            }}
          />
        </div>
      </div>
    </>
  );
};

const ContinuityPreview = ({
  localFrame,
  variant,
}: {
  localFrame: number;
  variant: MotionStudyVariant;
}) => {
  const cutFrame = variant.cutFrame ?? 56;
  const state = createPremiumContinuitySwapShot(localFrame, {
    startFrame: 18,
    motion: variant.motion,
    cutFrame,
    scaleFrom: variant.scaleFrom ?? 1,
    scaleTo: variant.scaleTo ?? 1.08,
    backgroundScaleFrom: variant.backgroundScaleFrom,
    backgroundScaleTo: variant.backgroundScaleTo,
    detailDelayFrames: variant.detailDelayFrames,
    cutOnly: variant.id === "A",
    instantDetailAfterCut: variant.id === "B",
  });

  return (
    <>
      <GradientField
        progress={state.background.progress}
        shiftY={state.background.shiftY}
        scaleFrom={1}
        scaleTo={state.background.scale}
      />
      <BrowserWindow
        shellScale={state.shell.scale}
        chromeProgress={1}
        searchProgress={state.content.searchProgress}
        detailProgress={state.detail.progress}
        detailScale={state.detail.scale}
      />
      <div
        style={{
          position: "absolute",
          left: 16,
          top: 16,
          ...makePillStyle(1),
          background: "rgba(15,20,28,0.88)",
          color: "#ffffff",
        }}
      >
        cut @ {cutFrame}f
      </div>
    </>
  );
};

const EditorialGapPreview = ({
  localFrame,
  variant,
}: {
  localFrame: number;
  variant: MotionStudyVariant;
}) => {
  const gapFrames = variant.gapFrames ?? 0;
  const state = createPremiumResultRevealShot(localFrame, {
    exitStart: 36,
    gapFrames,
    revealStaggerFrames: variant.revealStaggerFrames,
  });

  return (
    <>
      <GradientField
        progress={state.background.progress}
        shiftY={state.background.shiftY}
        scaleFrom={1}
        scaleTo={state.background.scale}
      />
      <BrowserWindow
        shellScale={state.shell.scale}
        shellY={state.shell.translateY}
        shellOpacity={state.shell.opacity}
        chromeProgress={state.chrome.progress}
        railProgress={state.chrome.railProgress}
        searchProgress={state.content.searchProgress}
        detailProgress={state.detail.progress}
        detailScale={state.detail.scale}
      />
      {gapFrames > 0 ? (
        <div
          style={{
            position: "absolute",
            right: 18,
            top: 18,
            ...makePillStyle(1),
            background: "rgba(255,255,255,0.88)",
          }}
        >
          hold gap {gapFrames}f
        </div>
      ) : null}
    </>
  );
};

const LayeredRevealPreview = ({
  localFrame,
  variant,
}: {
  localFrame: number;
  variant: MotionStudyVariant;
}) => {
  const state = createPremiumLayeredPanelReveal(localFrame, {
    startFrame: 24,
    motion: variant.motion,
    chromeDelayFrames: variant.chromeDelayFrames,
    railDelayFrames: variant.railDelayFrames,
    contentDelayFrames: variant.contentDelayFrames,
  });

  return (
    <>
      <GradientField
        progress={state.background.progress}
        shiftY={state.background.shiftY}
        scaleFrom={1}
        scaleTo={state.background.scale}
      />
      <BrowserWindow
        shellScale={state.shell.scale}
        shellY={state.shell.translateY}
        shellOpacity={state.shell.opacity}
        chromeProgress={state.chrome.progress}
        railProgress={state.chrome.railProgress}
        detailProgress={state.detail.progress}
        detailScale={state.detail.scale}
      />
    </>
  );
};

const renderStudyPreview = (
  studyId: MotionStudyId,
  variant: MotionStudyVariant,
  localFrame: number,
): React.ReactNode => {
  switch (studyId) {
    case "push-in-lab":
      return <PushInPreview localFrame={localFrame} variant={variant} />;
    case "pull-back-lab":
      return <PullBackPreview localFrame={localFrame} variant={variant} />;
    case "long-settle-lab":
      return <LongSettlePreview localFrame={localFrame} variant={variant} />;
    case "snap-in-lab":
      return <SnapInPreview localFrame={localFrame} variant={variant} />;
    case "continuity-lab":
      return <ContinuityPreview localFrame={localFrame} variant={variant} />;
    case "editorial-gap-lab":
      return <EditorialGapPreview localFrame={localFrame} variant={variant} />;
    case "layered-reveal-lab":
      return <LayeredRevealPreview localFrame={localFrame} variant={variant} />;
    default:
      return null;
  }
};

const MotionStudyScene: React.FC<{ studyId: MotionStudyId }> = ({ studyId }) => {
  const frame = useCurrentFrame();
  const study = getMotionStudy(studyId);
  const panelMeta = createStudyPanelMeta(study);
  const axisSummary = summarizeVariantAxes(study).slice(0, 2);
  const frameSet = getRepresentativeFrameSet(study, { maxFramesPerVariant: 4 });
  const comparisonLabels = buildComparisonLabels(study);
  const contactSheetPlan = createContactSheetPlan(study);
  const leadingVariant = study.shortlist?.[0];

  return (
    <AbsoluteFill style={pageStyle}>
      <div
        style={{
          padding: "56px 62px 42px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 32 }}>
          <div>
            <div style={labelStyle}>Premium Motion Reference Lab</div>
            <div style={titleStyle}>{study.title}</div>
            <div style={{ ...subheadStyle, marginTop: 12 }}>{study.question}</div>
          </div>
          <div
            style={{
              display: "grid",
              gap: 12,
            }}
          >
            <div style={metaCardStyle}>
              <div style={metaCardLabelStyle}>Evidence</div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: "rgba(232,236,240,0.84)",
                }}
              >
                {panelMeta.evidence.map((entry) => (
                  <div key={entry.kind} style={{ marginTop: entry.kind === "observed" ? 0 : 10 }}>
                    <span style={{ color: "rgba(255,255,255,0.55)" }}>
                      {entry.label}:
                    </span>{" "}
                    {entry.text}
                  </div>
                ))}
              </div>
            </div>
            <div style={metaCardStyle}>
              <div style={metaCardLabelStyle}>Comparison Plan</div>
              <div
                style={{
                  marginTop: 8,
                  display: "grid",
                  gap: 8,
                  fontSize: 13,
                  lineHeight: 1.45,
                  color: "rgba(232,236,240,0.8)",
                }}
              >
                {axisSummary.map((axis) => (
                  <div key={axis.id}>
                    <span style={{ color: "rgba(255,255,255,0.55)" }}>{axis.label}:</span>{" "}
                    {axis.variantValues.map((entry) => `${entry.variantId} ${entry.label}`).join(" / ")}
                  </div>
                ))}
                <div>
                  <span style={{ color: "rgba(255,255,255,0.55)" }}>Representative frames:</span>{" "}
                  {frameSet.unionFrames.join(" / ")}f
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 18, marginTop: 34, flex: 1 }}>
          {study.variants.map((variant, index) => (
            <VariantPanel
              key={variant.id}
              studyId={studyId}
              variant={variant}
              localFrame={frame}
              panelLabel={panelMeta.variants[index]?.panelLabel ?? `Variant ${variant.id}`}
              captureFrames={frameSet.variants[index]?.frames ?? []}
              shortlisted={leadingVariant?.variantId === variant.id}
            />
          ))}
        </div>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "space-between",
            gap: 24,
            fontSize: 12,
            color: "rgba(232,236,240,0.54)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          <div>
            {leadingVariant
              ? `Lead candidate: ${leadingVariant.variantId} / ${leadingVariant.reason}`
              : "Decision use: compare restraint, stop quality, and continuity support"}
          </div>
          <div>
            {comparisonLabels.pairLabels.join(" / ")} / sheet {contactSheetPlan.columns}x
            {contactSheetPlan.rows}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const OverviewIntro: React.FC = () => {
  const studies = motionStudyOrder.map((studyId) => getMotionStudy(studyId));
  const totalVariants = studies.reduce((sum, study) => sum + study.variants.length, 0);
  const totalComparisons = studies.reduce(
    (sum, study) => sum + buildComparisonLabels(study).pairLabels.length,
    0,
  );
  const totalPanels = studies.reduce(
    (sum, study) => sum + createContactSheetPlan(study).frames.length,
    0,
  );
  const shortlistLabels = studies
    .map((study) => {
      const topVariant = study.shortlist?.[0];
      return topVariant ? `${study.id} ${topVariant.variantId}` : null;
    })
    .filter((label): label is string => label !== null);

  return (
    <AbsoluteFill style={pageStyle}>
      <div
        style={{
          padding: "74px 72px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: "100%",
        }}
      >
        <div>
          <div style={labelStyle}>Remotion Motion Research</div>
          <div
            style={{
              fontSize: 72,
              lineHeight: 0.94,
              fontWeight: 700,
              letterSpacing: "-0.06em",
              maxWidth: 980,
              marginTop: 16,
            }}
          >
            Premium easing and transition reference lab
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 40,
            fontSize: 18,
            lineHeight: 1.5,
            color: "rgba(232,236,240,0.76)",
          }}
        >
          <div>
            Evidence input: observed launch motion from the provided reference captures,
            reduced into reusable studies instead of a one-off recreation.
          </div>
          <div>
            {studies.length} studies / {totalVariants} variants / {totalComparisons} pairwise
            comparisons / {totalPanels} hero capture panels.
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 18,
            marginTop: 26,
          }}
        >
          <div style={metaCardStyle}>
            <div style={metaCardLabelStyle}>Study Set</div>
            <div style={{ marginTop: 10, fontSize: 15, lineHeight: 1.55 }}>
              {motionStudyOrder.join(" / ")}
            </div>
          </div>
          <div style={metaCardStyle}>
            <div style={metaCardLabelStyle}>Current Leaders</div>
            <div style={{ marginTop: 10, fontSize: 15, lineHeight: 1.55 }}>
              {shortlistLabels.join(" / ")}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const PremiumMotionReferenceLabOverview: React.FC = () => {
  return (
    <>
      <Sequence from={0} durationInFrames={motionLabConfig.overviewIntroFrames}>
        <OverviewIntro />
      </Sequence>
      {motionStudyOrder.map((studyId, index) => (
        <Sequence
          key={studyId}
          from={
            motionLabConfig.overviewIntroFrames +
            index * motionLabConfig.studyDurationInFrames
          }
          durationInFrames={motionLabConfig.studyDurationInFrames}
        >
          <MotionStudyScene studyId={studyId} />
        </Sequence>
      ))}
      <Sequence
        from={motionLabOverviewFrames - motionLabConfig.overviewOutroFrames}
        durationInFrames={motionLabConfig.overviewOutroFrames}
      >
        <AbsoluteFill
          style={{
            ...pageStyle,
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            letterSpacing: "-0.03em",
            color: "rgba(243,245,247,0.84)",
          }}
        >
          Reusable study tooling now drives labels, shortlist metadata, and capture
          planning for every reference study.
        </AbsoluteFill>
      </Sequence>
    </>
  );
};

export const PremiumMotionReferenceStudy: React.FC<{
  studyId: MotionStudyId;
}> = ({ studyId }) => {
  return <MotionStudyScene studyId={studyId} />;
};
