"use client";

// ── SoundToggleControl — Wave 2 D5.4 ──
//
// React wrapper that wires the visual-only `SoundToggle` (design-system,
// landed in Wave 1 D3.4) to the GlobalAudioController exposed via
// AudioBusProvider (Wave 1 D5.3).
//
// Behaviour (plan §2.3 + §5.5):
//   • Renders nothing until AudioBusProvider has mounted on the client
//     (`useAudioBus()` returns `null` during SSR / pre-mount). This avoids
//     hydration mismatches and keeps the SSR-rendered tree pure.
//   • Click flow obeys browser autoplay policy:
//       1. `ensureContext()` — resumes / creates the AudioContext via
//          `controller.toggle()` (the only public entry point, since
//          `AudioBus.ensureAudioContext` is private).
//       2. Toggles the wrapper-level mute flag, persisted to localStorage
//          under `portfolio-audio:mute` (key already provisioned by
//          GlobalAudioController in Wave 1).
//   • Visual state derivation:
//       - `muted`   → user has explicitly muted
//       - `playing` → controller enabled AND source actually plays
//                     (sourceKind !== "input" || inputStatus === "connected")
//       - `silent`  → otherwise (idle, blocked, or pre-gesture)
//   • No automatic source switching on first click — the controller's
//     `default_track` source is the seed. App-level
//     `selectSource("file" | "input")` is not driven from this control.
//     The earlier experiments-wide MicInputGate mount was removed in
//     Package 7 (corrective) because no current experiments visual reads
//     from the GlobalAudioController bus; `/experiments/dot` uses
//     motion-dot's internal Audio Panel (own AudioBus) for mic input.
//   • This control does not invoke `getUserMedia` itself. If a future
//     GlobalAudioController-bound visual route mounts MicInputGate, the
//     mic permission surface will live there.
//
// Layout (plan §5.5):
//   Mounted by the root `[locale]/layout.tsx` and rendered as a fixed
//   bottom-right glyph on every route (new IA + experiments + Filmtone).
//   The `fixed` positioning lives here (not in the design-system component)
//   so the bare `SoundToggle` glyph stays portable / story-able.
//
// Reference: feedback_no_fallback_bug_hotbed.md — we surface decline state
// explicitly (visual `silent`) rather than silently retrying.

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { SoundToggle, type SoundState } from "@chibatakumi/design-system";
import { useAudioBus } from "./AudioBusProvider";

export interface SoundToggleControlProps {
  /** Optional override — defaults to fixed bottom-right via inline style. */
  readonly className?: string;
}

export function SoundToggleControl({ className }: SoundToggleControlProps) {
  const audio = useAudioBus();
  const t = useTranslations("audio.toggle");
  const controlClassName = ["sound-toggle-control", className].filter(Boolean).join(" ");

  const state: SoundState = useMemo(() => {
    if (!audio) return "silent";
    if (audio.mute) return "muted";
    const { controller } = audio;
    if (!controller.enabled) return "silent";
    if (controller.sourceKind === "input" && controller.inputStatus !== "connected") {
      return "silent";
    }
    return "playing";
  }, [audio]);

  // Pre-mount: SSR + first paint. Render the disabled glyph so layout is
  // stable and there is no hydration shift when the provider mounts.
  if (!audio) {
    return (
      <SoundToggle
        state="silent"
        aria-label={t("ariaSilent")}
        onClick={() => {
          // No-op until provider mounts.
        }}
        className={controlClassName}
        style={fixedBottomRightStyle}
        disabled
      />
    );
  }

  const ariaLabel =
    state === "muted"
      ? t("ariaMuted")
      : state === "playing"
        ? t("ariaPlaying")
        : t("ariaSilent");

  return (
    <SoundToggle
      state={state}
      aria-label={ariaLabel}
      onClick={async () => {
        // Browser autoplay policy: must run inside the user-gesture stack.
        // `ensureContext` is a no-op when already enabled.
        try {
          await audio.ensureContext();
        } catch {
          // AudioContext.resume() can reject in restricted environments
          // (eg. iframes without allow="autoplay"). Surface as silent —
          // we deliberately do NOT silently retry (feedback_no_fallback_bug_hotbed).
          audio.setMute(true);
          return;
        }
        audio.setMute(!audio.mute);
      }}
      className={controlClassName}
      style={fixedBottomRightStyle}
    />
  );
}

// Fixed bottom-right anchor. Kept inline (not in globals.css) so the
// design-system glyph remains portable and the Agent γ scope (globals.css)
// is untouched. z-index is high enough to clear page content but below
// modal overlays (which use 100+).
const fixedBottomRightStyle: React.CSSProperties = {
  position: "fixed",
  right: "max(16px, var(--safe-right, 0px))",
  bottom: "calc(var(--safe-bottom, 0px) + 16px)",
  width: 44,
  height: 44,
  zIndex: 50,
};
