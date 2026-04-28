// Flowline HUD composition. Wraps webgpu-motion-ui atoms into the 4 panels
// main.ts needs: text overlay (top-left), scene selector (top-right),
// audio meter (below selector), keymap help (bottom-right, toggled by `?`).

import {
  createAudioMeter,
  createHudOverlay,
  createKeymapHud,
  createSceneSelector,
  updateAudioMeter,
  updateHudOverlay,
  updateKeymapHud,
  updateSceneSelector,
  type AudioMeter,
  type AudioMeterFieldKey,
  type AudioMeterReading,
  type HudOverlay,
  type KeymapEntry,
  type KeymapHud,
  type SceneSelector,
  type SceneSelectorItem,
} from "webgpu-motion-ui";

export type FlowlineHudState = {
  readonly sceneName: string;
  readonly autoEnabled: boolean;
  readonly filmEnabled: boolean;
  readonly audioEnabled: boolean;
  readonly audioSourceLabel: string;
  readonly onsetActivity: number;
};

export type FlowlineHud = {
  readonly overlay: HudOverlay;
  readonly selector: SceneSelector;
  readonly meter: AudioMeter;
  readonly keymap: KeymapHud;
};

export type CreateFlowlineHudOptions = {
  readonly scenes: readonly SceneSelectorItem[];
  readonly onPickScene: (id: string) => void;
  readonly onAuto: () => void;
  readonly keymapEntries: readonly KeymapEntry[];
  /** Parent element to append HUD atoms into. Defaults to document.body if omitted. */
  readonly parent?: ParentNode;
};

const METER_FIELDS: readonly AudioMeterFieldKey[] = [
  "bass",
  "energy",
  "trebleOnset",
  "intensity",
];

export function createFlowlineHud(options: CreateFlowlineHudOptions): FlowlineHud {
  const overlay = createHudOverlay({
    parent: options.parent,
    position: { top: "16px", left: "16px" },
  });
  const selector = createSceneSelector({
    parent: options.parent,
    items: options.scenes,
    onPick: options.onPickScene,
    onAuto: options.onAuto,
  });
  const meter = createAudioMeter({
    parent: options.parent,
    fields: METER_FIELDS,
    position: { top: "52px", right: "16px" },
  });
  const keymap = createKeymapHud({
    parent: options.parent,
    entries: options.keymapEntries,
    title: "Keys (? toggle)",
  });
  return { overlay, selector, meter, keymap };
}

export function updateFlowlineHud(
  hud: FlowlineHud,
  state: FlowlineHudState,
  activeSceneId: string,
): void {
  const beat = state.onsetActivity > 0.3 ? "●" : "○";
  const filmLabel = state.filmEnabled ? "Film ON" : "Raw";
  const audioLabel = state.audioEnabled
    ? `${beat} ${state.audioSourceLabel}`
    : "off";
  updateHudOverlay(hud.overlay, [
    { label: "SCENE", value: state.sceneName },
    { label: "POST",  value: filmLabel },
    { label: "AUDIO", value: audioLabel },
  ]);
  updateSceneSelector(hud.selector, {
    activeId: activeSceneId,
    autoEnabled: state.autoEnabled,
  });
}

export function updateFlowlineHudAudio(
  hud: FlowlineHud,
  reading: AudioMeterReading,
): void {
  updateAudioMeter(hud.meter, reading);
}

export function setFlowlineHudKeymapVisible(hud: FlowlineHud, visible: boolean): void {
  updateKeymapHud(hud.keymap, { visible });
}
