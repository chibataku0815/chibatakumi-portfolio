// @chibatakumi/motion-core — Renewal 2026 Phase 1 / Stream 1.
//
// The root entry intentionally re-exports ONLY the MotionParticipant /
// MotionStage types. Consumers that need shell / audio / post / art symbols
// MUST use the explicit subpaths (`@chibatakumi/motion-core/{shell,audio,post,art}`)
// to keep tree-shaking boundaries clear and avoid pulling the entire WGSL
// bundle into Next.js client chunks for routes that only need the type
// surface (e.g. SSR boundaries, server-side audio wiring tests).

export * from "./participant";

export const MOTION_CORE_VERSION = "0.1.0-phase-b";
