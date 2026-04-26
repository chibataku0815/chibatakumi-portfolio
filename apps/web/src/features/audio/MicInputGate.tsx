"use client";

// ── MicInputGate — Wave 2 D5.5 ──
//
// Status (Package 7 corrective, 2026-04-26): no JSX mount in apps/web.
// The experiments-wide mount was removed because no current experiments
// visual reads from the GlobalAudioController bus this gate drives.
// `/experiments/dot` exposes mic input via motion-dot's internal Audio
// Panel instead. This component is preserved (exported from
// @/features/audio) for any future GlobalAudioController-bound visual
// route that grows a mic-driven analyser.
//
// Behaviour (when mounted): renders a permission-gated button that,
// on click:
//
//   1. Calls `audio.ensureContext()` first — without an AudioContext the
//      mic stream cannot be wired into the analyser graph. This must run
//      inside the user gesture (autoplay policy).
//   2. Calls `audio.setSource("input")`. The vendored AudioController
//      handles the actual `getUserMedia({ audio: true })` request, the
//      device enumeration, and the MediaStreamAudioSourceNode wiring; on
//      failure it sets `inputStatus = "blocked" | "error" | "disconnected"`
//      and notifies subscribers — we read those values and reflect them
//      in the UI.
//   3. While `inputStatus === "connected"`, the button switches to "Mic
//      On" and clicking again calls `audio.setSource("default_track")` to
//      revert the AudioBus to the silent / default source.
//
// Permission decline policy (feedback_no_fallback_bug_hotbed.md):
//   • Decline / blocked → explicit "Mic blocked" UI; we do NOT silently
//     fall back to file source. The visitor can still hear the default
//     track if they enable audio via the Sound icon.
//   • The explicit "blocked" surface lets the visitor recover via the
//     browser's site-permission UI; we don't auto-retry.
//
// SSR safety:
//   • `useAudioBus()` returns `null` until the provider mounts — render a
//     disabled button so the layout is stable across hydration.
//   • `controller.inputSupported` is `false` on browsers without
//     `navigator.mediaDevices.getUserMedia`; the button shows the
//     unsupported state and is disabled.
//
// Visual placement is delegated to the parent layout via `className` —
// MicInputGate stays positioning-agnostic so any future route layout can
// place it without colliding with the bottom-right SoundToggleControl.
//
// Reference: plan §2.3 (D5.5), feedback_design_quality_priority.md
// (typography + restrained palette — single button, no decoration).

import { useTranslations } from "next-intl";
import { useAudioBus } from "./AudioBusProvider";

export interface MicInputGateProps {
  /** Optional positioning class — parent layout owns the anchor. */
  readonly className?: string;
}

type MicMode = "idle" | "requesting" | "connected" | "blocked" | "unsupported" | "preMount";

export function MicInputGate({ className }: MicInputGateProps) {
  const audio = useAudioBus();
  const t = useTranslations("audio.mic");

  const mode = derive(audio);

  const labelKey: Record<MicMode, string> = {
    preMount: "loading",
    unsupported: "unsupported",
    requesting: "requesting",
    connected: "on",
    blocked: "blocked",
    idle: "enable",
  };

  const helperKey: Record<MicMode, string | null> = {
    preMount: null,
    unsupported: "helperUnsupported",
    requesting: null,
    connected: "helperOn",
    blocked: "helperBlocked",
    idle: "helperEnable",
  };

  const disabled =
    mode === "preMount" ||
    mode === "unsupported" ||
    mode === "requesting" ||
    !audio;

  const onClick = async () => {
    if (!audio) return;
    if (mode === "connected") {
      // Revert to the default track source — keeps the AudioBus warm but
      // detaches the mic stream so the OS mic indicator clears.
      await audio.setSource("default_track");
      return;
    }
    if (mode === "blocked" || mode === "idle") {
      try {
        await audio.ensureContext();
      } catch {
        return;
      }
      // selectSource("input") internally requests getUserMedia and updates
      // `controller.inputStatus`. State change fires through the listener
      // wired in AudioBusProvider, re-rendering this component.
      await audio.setSource("input");
    }
  };

  return (
    <div className={className} data-mic-mode={mode}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={mode === "connected"}
        style={buttonStyle(mode)}
      >
        {t(labelKey[mode])}
      </button>
      {helperKey[mode] ? (
        <p style={helperStyle}>{t(helperKey[mode]!)}</p>
      ) : null}
    </div>
  );
}

function derive(audio: ReturnType<typeof useAudioBus>): MicMode {
  if (!audio) return "preMount";
  const { controller } = audio;
  if (!controller.inputSupported) return "unsupported";
  if (controller.sourceKind === "input") {
    if (controller.inputStatus === "requesting") return "requesting";
    if (controller.inputStatus === "connected") return "connected";
    if (controller.inputStatus === "blocked") return "blocked";
    if (controller.inputStatus === "error") return "blocked";
  }
  return "idle";
}

function buttonStyle(mode: MicMode): React.CSSProperties {
  return {
    appearance: "none",
    border: "1px solid currentColor",
    background: mode === "connected" ? "currentColor" : "transparent",
    color: mode === "connected" ? "var(--background, #fff)" : "currentColor",
    padding: "0.5rem 0.875rem",
    fontSize: "0.75rem",
    letterSpacing: "0.04em",
    fontFamily: "inherit",
    cursor: mode === "preMount" || mode === "unsupported" || mode === "requesting" ? "default" : "pointer",
    opacity: mode === "preMount" || mode === "unsupported" ? 0.4 : 1,
    transition: "background 200ms ease, color 200ms ease, opacity 200ms ease",
  };
}

const helperStyle: React.CSSProperties = {
  margin: "0.375rem 0 0",
  fontSize: "0.625rem",
  letterSpacing: "0.02em",
  opacity: 0.6,
  maxWidth: "16rem",
  lineHeight: 1.4,
};
