import { resolveSignalStrokeRelayAnchor, type SignalStrokeRelayAnchorId } from "./fixtures";
import { matchCutAnchor, type MatchCutAnchorState } from "./match-cut-anchor";
import { offsetGate, type OffsetGateState } from "./offset-gate";
import {
  signalStrokeRelayConfig,
  type SignalStrokeRelayAuthoring,
} from "./signal-stroke-relay.config";
import { staggerChain } from "./stagger-chain";
import { trimWindow, type TrimWindowState } from "./trim-window";

export type SignalStrokeRelayFrameState = {
  frame: number;
  leadTrim: TrimWindowState;
  iconTrim: TrimWindowState;
  underlineTrim: TrimWindowState;
  iconGate: OffsetGateState;
  titleGate: OffsetGateState;
  underlineGate: OffsetGateState;
  baton: MatchCutAnchorState;
  leadHeadT: number;
  iconOpacity: number;
  iconScale: number;
  iconTranslateY: number;
  titleOpacity: number;
  titleTranslateY: number;
  titleMaskWidth: number;
  titleTrackingEm: number;
  underlineOpacity: number;
  underlineTranslateX: number;
  sceneOpacity: number;
  payoffFrame: number;
  stageStarts: {
    lead: number;
    icon: number;
    title: number;
    underline: number;
    exit: number;
  };
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

export function resolveMatchCutAnchorPoint(state: MatchCutAnchorState) {
  const source = resolveSignalStrokeRelayAnchor(state.sourceId as SignalStrokeRelayAnchorId);
  const target = resolveSignalStrokeRelayAnchor(state.targetId as SignalStrokeRelayAnchorId);

  return {
    x: lerp(source.x, target.x, state.anchorT),
    y: lerp(source.y, target.y, state.anchorT),
  };
}

export function getSignalStrokeRelayPayoffFrame(authoring: SignalStrokeRelayAuthoring) {
  const lead = staggerChain({
    index: 0,
    count: signalStrokeRelayConfig.stageCount,
    stepFrames: authoring.global.relayStepFrames,
    baseFrame: authoring.global.baseFrame,
    fps: signalStrokeRelayConfig.fps,
  });
  const underline =
    staggerChain({
      index: 3,
      count: signalStrokeRelayConfig.stageCount,
      stepFrames: authoring.global.relayStepFrames,
      baseFrame: authoring.global.baseFrame,
      fps: signalStrokeRelayConfig.fps,
    }) + authoring.underline.offsetFrames;

  return Math.min(
    authoring.global.durationFrames - 1,
    Math.round(
      Math.max(
        underline + authoring.underline.drawFrames + 6,
        lead + authoring.signal.drawFrames + authoring.signal.holdFrames,
      ),
    ),
  );
}

export function evaluateSignalStrokeRelayFrame({
  frame,
  authoring,
  titleWidth,
}: {
  frame: number;
  authoring: SignalStrokeRelayAuthoring;
  titleWidth: number;
}): SignalStrokeRelayFrameState {
  const leadStart = staggerChain({
    index: 0,
    count: signalStrokeRelayConfig.stageCount,
    stepFrames: authoring.global.relayStepFrames,
    baseFrame: authoring.global.baseFrame,
    fps: signalStrokeRelayConfig.fps,
  });

  const iconStart =
    staggerChain({
      index: 1,
      count: signalStrokeRelayConfig.stageCount,
      stepFrames: authoring.global.relayStepFrames,
      baseFrame: authoring.global.baseFrame,
      fps: signalStrokeRelayConfig.fps,
    }) + authoring.icon.offsetFrames;

  const titleStart =
    staggerChain({
      index: 2,
      count: signalStrokeRelayConfig.stageCount,
      stepFrames: authoring.global.relayStepFrames,
      baseFrame: authoring.global.baseFrame,
      fps: signalStrokeRelayConfig.fps,
    }) + authoring.title.offsetFrames;

  const underlineStart =
    staggerChain({
      index: 3,
      count: signalStrokeRelayConfig.stageCount,
      stepFrames: authoring.global.relayStepFrames,
      baseFrame: authoring.global.baseFrame,
      fps: signalStrokeRelayConfig.fps,
    }) + authoring.underline.offsetFrames;

  const payoffFrame = getSignalStrokeRelayPayoffFrame(authoring);
  const exitStart = Math.max(
    underlineStart + authoring.underline.drawFrames + 8,
    authoring.global.durationFrames - authoring.global.exitFrames,
  );

  const leadTrim = trimWindow({
    frame,
    startFrame: leadStart,
    drawDurationFrames: authoring.signal.drawFrames,
    holdFrames: Math.max(
      exitStart - leadStart - authoring.signal.drawFrames,
      authoring.signal.holdFrames,
    ),
    eraseDurationFrames: authoring.signal.eraseFrames,
    easing: signalStrokeRelayConfig.editorialEase,
  });

  const iconTrim = trimWindow({
    frame,
    startFrame: iconStart,
    drawDurationFrames: authoring.icon.drawFrames,
    holdFrames: Math.max(
      exitStart - iconStart - authoring.icon.drawFrames,
      6,
    ),
    eraseDurationFrames: Math.max(authoring.signal.eraseFrames - 4, 4),
    easing: signalStrokeRelayConfig.editorialEase,
  });

  const underlineTrim = trimWindow({
    frame,
    startFrame: underlineStart,
    drawDurationFrames: authoring.underline.drawFrames,
    holdFrames: Math.max(
      exitStart - underlineStart - authoring.underline.drawFrames,
      4,
    ),
    eraseDurationFrames: Math.max(authoring.signal.eraseFrames - 6, 4),
    easing: signalStrokeRelayConfig.editorialEase,
  });

  const iconGate = offsetGate({
    frame,
    openFrame: iconStart,
    durationFrames: authoring.icon.settleFrames,
    closeFrame: exitStart,
    easing: signalStrokeRelayConfig.editorialEase,
  });

  const titleGate = offsetGate({
    frame,
    openFrame: titleStart,
    durationFrames: authoring.title.durationFrames,
    closeFrame: exitStart,
    easing: signalStrokeRelayConfig.editorialEase,
  });

  const underlineGate = offsetGate({
    frame,
    openFrame: underlineStart,
    durationFrames: authoring.underline.drawFrames,
    closeFrame: exitStart,
    easing: signalStrokeRelayConfig.editorialEase,
  });

  const matchStart = Math.max(
    iconStart + Math.floor(authoring.icon.drawFrames * 0.4),
    leadStart + authoring.signal.drawFrames - Math.floor(authoring.global.relayStepFrames * 0.35),
  );
  const matchDuration = Math.max(titleStart - matchStart + 10, 10);

  const baton = matchCutAnchor({
    frame,
    startFrame: matchStart,
    durationFrames: matchDuration,
    sourceId: "lead-exit",
    targetId: "title-start",
    easing: signalStrokeRelayConfig.editorialEase,
  });

  const exitProgress = clamp01(
    (frame - exitStart) / Math.max(authoring.global.durationFrames - exitStart, 1),
  );
  const sceneOpacity = 1 - signalStrokeRelayConfig.editorialEase(exitProgress);

  const iconScale = lerp(
    authoring.icon.scaleFrom,
    1,
    iconGate.progress,
  );
  const iconTranslateY = (1 - iconGate.progress) * authoring.icon.liftPx;
  const titleTranslateY = (1 - titleGate.progress) * authoring.title.liftPx;
  const titleMaskWidth = Math.min(
    titleWidth + authoring.title.maskSlackPx,
    titleWidth * titleGate.progress + authoring.title.maskSlackPx,
  );

  return {
    frame,
    leadTrim,
    iconTrim,
    underlineTrim,
    iconGate,
    titleGate,
    underlineGate,
    baton,
    leadHeadT: leadTrim.visible ? leadTrim.end : 1,
    iconOpacity: iconGate.progress * sceneOpacity,
    iconScale,
    iconTranslateY,
    titleOpacity: titleGate.progress * sceneOpacity,
    titleTranslateY,
    titleMaskWidth,
    titleTrackingEm:
      authoring.title.trackingEm + (1 - titleGate.progress) * 0.08,
    underlineOpacity: underlineGate.progress * sceneOpacity,
    underlineTranslateX: (1 - underlineGate.progress) * authoring.underline.slidePx,
    sceneOpacity,
    payoffFrame,
    stageStarts: {
      lead: leadStart,
      icon: iconStart,
      title: titleStart,
      underline: underlineStart,
      exit: exitStart,
    },
  };
}
