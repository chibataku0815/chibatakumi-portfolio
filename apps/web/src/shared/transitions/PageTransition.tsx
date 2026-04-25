"use client";

// PageTransition — Renewal 2026 Stream 4-D thin orchestrator.
//
// Replaces the legacy 260-line GSAP block-reveal. The new model uses the
// persistent MotionStage canvas as the visual continuity vehicle: on path
// change we ask the stage to cross-blend (500ms canon) into the participant
// registered for the route. There is no DOM curtain / logo stroke — the
// stage canvas itself carries the transition.
//
// Mapping rules (best-effort):
//   `/`  + `/works/*` + `/about` + `/craft` + `/journal`  →  "dot"
// If no participant is registered for the resolved name, setActive will
// throw. We swallow that as a no-op (per `feedback_no_fallback_bug_hotbed.md`
// the stage refuses silent fallback at render time, but route-side we just
// skip the blend — the page still mounts and the active participant, if any,
// stays on screen).

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useMotionStage } from "@/features/motion";

interface PageTransitionProps {
  children: React.ReactNode;
}

const DEFAULT_HOME_PARTICIPANT = "dot";
const ROUTE_BLEND_MS = 500;

function routeKeyToParticipantName(pathname: string): string {
  // Strip leading locale prefix (e.g. "/en/works" → "/works"). next-intl
  // routes always start with the locale segment for non-default locales.
  const stripped = pathname.replace(/^\/(?:en|ja)(?=\/|$)/, "") || "/";
  if (stripped === "/") return DEFAULT_HOME_PARTICIPANT;
  if (stripped.startsWith("/works")) return DEFAULT_HOME_PARTICIPANT;
  if (stripped.startsWith("/about")) return DEFAULT_HOME_PARTICIPANT;
  if (stripped.startsWith("/craft")) return DEFAULT_HOME_PARTICIPANT;
  if (stripped.startsWith("/journal")) return DEFAULT_HOME_PARTICIPANT;
  // /experiments/* paths register their own participants via
  // useExperimentParticipant; we leave them alone.
  return "";
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const status = useMotionStage();

  useEffect(() => {
    if (status.kind !== "ready") return;
    const name = routeKeyToParticipantName(pathname);
    if (!name) return;
    try {
      status.stage.setActive(name, ROUTE_BLEND_MS);
    } catch {
      // No participant registered for this route yet — ambient hero / works
      // pages may still be hydrating. Skipping is safe; the next render
      // tick or the next nav will pick it up.
    }
  }, [pathname, status]);

  return <>{children}</>;
}

export default PageTransition;
