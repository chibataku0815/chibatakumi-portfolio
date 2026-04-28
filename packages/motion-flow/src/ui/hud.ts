// Flowline HUD composition. Wraps webgpu-motion-ui atoms into the 4 panels
// main.ts needs: text overlay (top-left), scene selector (top-right),
// audio meter (below selector), keymap help (bottom-right, toggled by `?`).
//
// Each atom's `.element` is also stamped with `data-liquid-glass-control` so
// LiquidGlassProvider's MutationObserver registers it as an Apple Liquid
// Glass surface and the front-chrome compose pass refracts the motion-flow
// substrate through it. Vendor-internal background colors (white pills, dark
// keymap panel) are neutralized post-creation. The SceneSelector child
// buttons are re-styled inside an `updateSceneSelector` wrapper because the
// vendor updater rewrites button colors on every state tick.

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

// ── Apple Liquid Glass surface marker (parallel to motion-dot/hud.ts) ────────
interface ControlSurfaceOptions {
  readonly radius?: number;
  readonly intensity?: number;
  readonly brightness?: number;
  readonly tint?: string;
}

function markLiquidGlassControl(
  el: HTMLElement,
  id: string,
  opts?: ControlSurfaceOptions,
): void {
  el.dataset.liquidGlassControl = id;
  if (opts?.radius !== undefined) el.dataset.liquidGlassRadius = String(opts.radius);
  if (opts?.intensity !== undefined) el.dataset.liquidGlassIntensity = String(opts.intensity);
  if (opts?.brightness !== undefined) el.dataset.liquidGlassBrightness = String(opts.brightness);
  if (opts?.tint) el.dataset.liquidGlassTint = opts.tint;
}

const FONT_STACK =
  'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

// Dark-on-glass — motion-flow's substrate is paletteGpuColor("paper") = #d1d1d1,
// so the glass refracts a near-white field. White text vanishes; dark ink
// with a light text-shadow emboss is the legible choice. Active state stays
// dark (inverse-style highlight, matching the original chip affordance).
const INK_ON_GLASS = "rgba(26,26,26,0.92)";
const INK_ON_GLASS_MUTED = "rgba(26,26,26,0.66)";
const INK_ON_GLASS_ACTIVE = "rgba(255,255,255,0.98)";
const BG_ACTIVE_OVERLAY = "rgba(26,26,26,0.86)";
const TEXT_SHADOW = "0 1px 0 rgba(255,255,255,0.55)";

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
    // Push below the Nav rail (brand at top:24, 48×48 → bottom 72) with 24px gap.
    position: { top: "96px", left: "24px" },
  });
  Object.assign(overlay.element.style, {
    padding: "10px 18px",
    borderRadius: "14px",
    fontFamily: FONT_STACK,
    fontWeight: "500",
    color: INK_ON_GLASS,
    textShadow: TEXT_SHADOW,
    background: "transparent",
  } satisfies Partial<CSSStyleDeclaration>);
  markLiquidGlassControl(overlay.element, "control.flow.overlay", {
    radius: 14,
    intensity: 0.55,
    brightness: 0.78,
  });

  const selector = createSceneSelector({
    parent: options.parent,
    items: options.scenes,
    onPick: options.onPickScene,
    onAuto: options.onAuto,
  });
  Object.assign(selector.element.style, {
    padding: "8px 10px",
    gap: "4px",
    borderRadius: "18px",
    background: "transparent",
  } satisfies Partial<CSSStyleDeclaration>);
  // Vendor places SceneSelector at top:16/right:16. The Nav menu pill is at
  // top:24, right:32, 48×48 (bottom 72). Push the selector down past it
  // (top:96 = 72 + 24 gap) so the long button row never collides with the
  // hamburger.
  selector.element.style.top = "96px";
  selector.element.style.right = "24px";
  markLiquidGlassControl(selector.element, "control.flow.scenes", {
    radius: 18,
    intensity: 0.75,
    brightness: 0.74,
  });
  // Initial button styling — overridden again on every updateSceneSelector tick.
  styleSceneSelectorButtons(selector.element, null, true);

  const meter = createAudioMeter({
    parent: options.parent,
    fields: METER_FIELDS,
    position: { top: "0px", right: "24px" },
  });
  Object.assign(meter.element.style, {
    padding: "12px 16px",
    borderRadius: "16px",
    background: "transparent",
    border: "none",
    color: INK_ON_GLASS,
    textShadow: TEXT_SHADOW,
    fontFamily: FONT_STACK,
  } satisfies Partial<CSSStyleDeclaration>);
  // Selector is at top:96 with ~46px content; meter slots beneath with 16px gap.
  meter.element.style.top = "160px";
  markLiquidGlassControl(meter.element, "control.flow.audio", {
    radius: 16,
    intensity: 0.70,
    brightness: 0.76,
  });

  const keymap = createKeymapHud({
    parent: options.parent,
    entries: options.keymapEntries,
    title: "Keys (? toggle)",
  });
  Object.assign(keymap.element.style, {
    padding: "14px 18px",
    borderRadius: "20px",
    background: "transparent",
    border: "none",
    color: INK_ON_GLASS,
    textShadow: TEXT_SHADOW,
    fontFamily: FONT_STACK,
  } satisfies Partial<CSSStyleDeclaration>);
  // Vendor anchors keymap at right:16/bottom:16; lift to 24/24 for parity.
  keymap.element.style.right = "24px";
  keymap.element.style.bottom = "24px";
  markLiquidGlassControl(keymap.element, "control.flow.keymap", {
    radius: 20,
    intensity: 0.80,
    brightness: 0.74,
  });

  return { overlay, selector, meter, keymap };
}

// Re-styles SceneSelector buttons to white-on-glass after each vendor update.
// The vendor `updateSceneSelector` writes background/color/borderColor onto
// every button, so our flat overrides survive only by being re-applied each
// tick. `activeId === null` means selector is in pre-update initial state.
function styleSceneSelectorButtons(
  element: HTMLDivElement,
  activeId: string | null,
  autoEnabled: boolean,
): void {
  const buttons = element.querySelectorAll<HTMLButtonElement>("button");
  buttons.forEach((btn) => {
    const id = btn.dataset.chipId ?? "";
    const isAuto = id === "__auto__";
    const isActive = isAuto
      ? autoEnabled
      : !autoEnabled && id === activeId;
    Object.assign(btn.style, {
      fontFamily: FONT_STACK,
      padding: "8px 14px",
      borderRadius: "12px",
      boxShadow: "none",
      border: "none",
      background: isActive ? BG_ACTIVE_OVERLAY : "transparent",
      color: isActive ? INK_ON_GLASS_ACTIVE : INK_ON_GLASS_MUTED,
      textShadow: isActive ? "none" : TEXT_SHADOW,
    } satisfies Partial<CSSStyleDeclaration>);
  });
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
  // Re-apply our glass overrides — vendor updateSceneSelector clobbered them.
  styleSceneSelectorButtons(hud.selector.element, activeSceneId, state.autoEnabled);
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
