import { getProject, onChange, types } from "@theatre/core";
import {
  signalStrokeRelayConfig,
  signalStrokeRelayDefaultAuthoring,
  type SignalStrokeRelayAuthoring,
} from "./signal-stroke-relay.config";

type SignalStrokeRelaySheetObject = {
  value: unknown;
  onValuesChange(callback: (values: unknown) => void): () => void;
};

type SignalStrokeRelayTheatreStore = {
  project: ReturnType<typeof getProject>;
  sheet: ReturnType<ReturnType<typeof getProject>["sheet"]>;
  objects: {
    global: SignalStrokeRelaySheetObject;
    signal: SignalStrokeRelaySheetObject;
    icon: SignalStrokeRelaySheetObject;
    title: SignalStrokeRelaySheetObject;
    underline: SignalStrokeRelaySheetObject;
  };
};

let theatreStore: SignalStrokeRelayTheatreStore | null = null;
let studioPromise: Promise<any | null> | null = null;

function createSignalStrokeRelayTheatreStore(): SignalStrokeRelayTheatreStore {
  const project = getProject("Signal Stroke Relay");
  const sheet = project.sheet("Reference Work");
  const range = types.number;

  return {
    project,
    sheet,
    objects: {
      global: sheet.object(
        "Global",
        {
          durationFrames: range(signalStrokeRelayDefaultAuthoring.global.durationFrames, {
            range: [90, 210],
            label: "Duration",
          }),
          baseFrame: range(signalStrokeRelayDefaultAuthoring.global.baseFrame, {
            range: [0, 32],
            label: "Base frame",
          }),
          relayStepFrames: range(signalStrokeRelayDefaultAuthoring.global.relayStepFrames, {
            range: [4, 24],
            label: "Relay step",
          }),
          exitFrames: range(signalStrokeRelayDefaultAuthoring.global.exitFrames, {
            range: [8, 40],
            label: "Exit",
          }),
          playbackRate: range(signalStrokeRelayDefaultAuthoring.global.playbackRate, {
            range: [0.5, 1.5],
            nudgeMultiplier: 0.05,
            label: "Playback",
          }),
        },
        { reconfigure: true },
      ),
      signal: sheet.object(
        "Signal",
        {
          drawFrames: range(signalStrokeRelayDefaultAuthoring.signal.drawFrames, {
            range: [8, 60],
            label: "Draw",
          }),
          holdFrames: range(signalStrokeRelayDefaultAuthoring.signal.holdFrames, {
            range: [0, 36],
            label: "Hold",
          }),
          eraseFrames: range(signalStrokeRelayDefaultAuthoring.signal.eraseFrames, {
            range: [4, 36],
            label: "Erase",
          }),
          strokeWidth: range(signalStrokeRelayDefaultAuthoring.signal.strokeWidth, {
            range: [2, 12],
            nudgeMultiplier: 0.25,
            label: "Stroke",
          }),
          accentWidth: range(signalStrokeRelayDefaultAuthoring.signal.accentWidth, {
            range: [0, 6],
            nudgeMultiplier: 0.1,
            label: "Accent",
          }),
        },
        { reconfigure: true },
      ),
      icon: sheet.object(
        "Icon",
        {
          offsetFrames: range(signalStrokeRelayDefaultAuthoring.icon.offsetFrames, {
            range: [-12, 24],
            label: "Offset",
          }),
          drawFrames: range(signalStrokeRelayDefaultAuthoring.icon.drawFrames, {
            range: [6, 28],
            label: "Draw",
          }),
          settleFrames: range(signalStrokeRelayDefaultAuthoring.icon.settleFrames, {
            range: [8, 32],
            label: "Settle",
          }),
          scaleFrom: range(signalStrokeRelayDefaultAuthoring.icon.scaleFrom, {
            range: [0.45, 1.25],
            nudgeMultiplier: 0.01,
            label: "Scale from",
          }),
          liftPx: range(signalStrokeRelayDefaultAuthoring.icon.liftPx, {
            range: [0, 64],
            label: "Lift",
          }),
        },
        { reconfigure: true },
      ),
      title: sheet.object(
        "Title",
        {
          offsetFrames: range(signalStrokeRelayDefaultAuthoring.title.offsetFrames, {
            range: [-12, 24],
            label: "Offset",
          }),
          durationFrames: range(signalStrokeRelayDefaultAuthoring.title.durationFrames, {
            range: [8, 40],
            label: "Duration",
          }),
          liftPx: range(signalStrokeRelayDefaultAuthoring.title.liftPx, {
            range: [0, 64],
            label: "Lift",
          }),
          trackingEm: range(signalStrokeRelayDefaultAuthoring.title.trackingEm, {
            range: [0, 0.45],
            nudgeMultiplier: 0.01,
            label: "Tracking",
          }),
          maskSlackPx: range(signalStrokeRelayDefaultAuthoring.title.maskSlackPx, {
            range: [0, 96],
            label: "Mask slack",
          }),
        },
        { reconfigure: true },
      ),
      underline: sheet.object(
        "Underline",
        {
          offsetFrames: range(signalStrokeRelayDefaultAuthoring.underline.offsetFrames, {
            range: [-12, 24],
            label: "Offset",
          }),
          drawFrames: range(signalStrokeRelayDefaultAuthoring.underline.drawFrames, {
            range: [8, 30],
            label: "Draw",
          }),
          slidePx: range(signalStrokeRelayDefaultAuthoring.underline.slidePx, {
            range: [0, 56],
            label: "Slide",
          }),
        },
        { reconfigure: true },
      ),
    },
  };
}

function getSignalStrokeRelayTheatreStore() {
  if (!theatreStore) {
    theatreStore = createSignalStrokeRelayTheatreStore();
  }

  return theatreStore;
}

function readAuthoringValues(
  store: SignalStrokeRelayTheatreStore,
): SignalStrokeRelayAuthoring {
  return {
    global: store.objects.global.value as SignalStrokeRelayAuthoring["global"],
    signal: store.objects.signal.value as SignalStrokeRelayAuthoring["signal"],
    icon: store.objects.icon.value as SignalStrokeRelayAuthoring["icon"],
    title: store.objects.title.value as SignalStrokeRelayAuthoring["title"],
    underline: store.objects.underline.value as SignalStrokeRelayAuthoring["underline"],
  };
}

export function getSignalStrokeRelayAuthoringDefaults() {
  return signalStrokeRelayDefaultAuthoring;
}

export function subscribeSignalStrokeRelayAuthoring(
  callback: (values: SignalStrokeRelayAuthoring) => void,
) {
  const store = getSignalStrokeRelayTheatreStore();
  callback(readAuthoringValues(store));

  const unsubs = [
    store.objects.global.onValuesChange(() => callback(readAuthoringValues(store))),
    store.objects.signal.onValuesChange(() => callback(readAuthoringValues(store))),
    store.objects.icon.onValuesChange(() => callback(readAuthoringValues(store))),
    store.objects.title.onValuesChange(() => callback(readAuthoringValues(store))),
    store.objects.underline.onValuesChange(() => callback(readAuthoringValues(store))),
  ];

  return () => {
    unsubs.forEach((unsubscribe) => unsubscribe());
  };
}

export function subscribeSignalStrokeRelaySequencePosition(
  callback: (positionSeconds: number) => void,
) {
  const { sheet } = getSignalStrokeRelayTheatreStore();
  return onChange(sheet.sequence.pointer.position, callback);
}

export async function ensureSignalStrokeRelayStudio() {
  if (typeof window === "undefined" || process.env.NODE_ENV === "production") {
    return null;
  }

  if (!studioPromise) {
    studioPromise = import("@theatre/studio")
      .then(async ({ default: studio }) => {
        studio.initialize({ persistenceKey: "signal-stroke-relay" });
        studio.ui.hide();
        const { project, sheet } = getSignalStrokeRelayTheatreStore();
        await project.ready;
        studio.transaction(({ set }) => {
          set(
            sheet.sequence.pointer.length,
            signalStrokeRelayDefaultAuthoring.global.durationFrames /
              signalStrokeRelayConfig.fps,
          );
        });
        studio.ui.hide();
        return studio;
      })
      .catch(() => null);
  }

  return studioPromise;
}

export async function showSignalStrokeRelayStudio() {
  const studio = await ensureSignalStrokeRelayStudio();
  studio?.ui.restore();
  return studio;
}

export async function hideSignalStrokeRelayStudio() {
  const studio = await studioPromise;
  studio?.ui.hide();
}

export function syncSignalStrokeRelaySequencePosition(seconds: number) {
  const { sheet } = getSignalStrokeRelayTheatreStore();
  sheet.sequence.position = seconds;
}

export async function waitForSignalStrokeRelayProjectReady() {
  const { project } = getSignalStrokeRelayTheatreStore();
  await project.ready;
}
