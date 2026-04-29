/**
 * Journal registry — curation policy.
 *
 * Selection rationale, audience, and what is intentionally excluded live in
 * `docs/journal/curation-rationale.md`. Wave 2+ candidates and reserved slugs
 * live in `docs/journal/wave-2-backlog.md`. Japanese prose style lives in
 * `docs/journal/ja-writing-style.md`. Read those before editing entries.
 *
 * Kind:
 *   case-study       — large decision records; logic must be reproducible.
 *   engineering-note — reusable plumbing; portable to other implementations.
 *   study            — in-progress R&D, with explicit unfinished-ness.
 *   motion-study     — single motion primitive per article.
 *
 * EvidenceLevel:
 *   production   — currently shipping in the site; readers can view-source it.
 *   rnd          — exists in source tree but not finished.
 *   experimental — not in tree (idea proto, sample). Not published in waves.
 *
 * Status:
 *   published — appears in sitemap and index.
 *   draft     — in registry but excluded from publishedJournalEntries.
 *   hold      — wave 2+ slug reservation. Same exclusion behavior as draft.
 */

export type JournalKind =
  | "case-study"
  | "engineering-note"
  | "study"
  | "motion-study";

export type JournalStatus = "published" | "draft" | "hold";

export type JournalEvidenceLevel = "production" | "rnd" | "experimental";

export interface JournalEntry {
  readonly slug: string;
  readonly kind: JournalKind;
  readonly href: string;
  readonly publishedAt: string;
  readonly priority: number;
  readonly tags: readonly string[];
  readonly status: JournalStatus;
  readonly evidenceLevel: JournalEvidenceLevel;
  readonly related?: readonly string[];
  readonly demoHref?: string;
}

export const journalEntries: readonly JournalEntry[] = [
  {
    slug: "filmtone-motion-180-shutter-baseline",
    kind: "case-study",
    href: "/journal/filmtone-motion-180-shutter-baseline",
    publishedAt: "2026-04-29",
    priority: 1,
    tags: ["Filmtone", "Motion Blur", "Shutter Angle", "Color Science"],
    status: "draft",
    evidenceLevel: "production",
    related: ["filmtone-cross-platform-color-parity"],
  },
  {
    slug: "filmtone-dual-lut-pipeline",
    kind: "case-study",
    href: "/journal/filmtone-dual-lut-pipeline",
    publishedAt: "2026-04-29",
    priority: 2,
    tags: ["Filmtone", "LUT", "Color Pipeline", "Architecture"],
    status: "draft",
    evidenceLevel: "production",
    related: ["filmtone-cross-platform-color-parity"],
  },
  {
    slug: "filmtone-cross-platform-color-parity",
    kind: "engineering-note",
    href: "/journal/filmtone-cross-platform-color-parity",
    publishedAt: "2026-04-29",
    priority: 3,
    tags: ["Filmtone", "WebGL", "WebGPU", "Swift", "Cross-platform"],
    status: "draft",
    evidenceLevel: "production",
    related: ["filmtone-motion-180-shutter-baseline", "filmtone-dual-lut-pipeline"],
  },
  {
    slug: "filmtone-capacitor-native-bridge",
    kind: "engineering-note",
    href: "/journal/filmtone-capacitor-native-bridge",
    publishedAt: "2026-04-29",
    priority: 4,
    tags: ["Filmtone", "Capacitor", "iOS", "Native Plugin"],
    status: "draft",
    evidenceLevel: "production",
  },
  {
    slug: "filmtone-app-store-v12-shipping",
    kind: "case-study",
    href: "/journal/filmtone-app-store-v12-shipping",
    publishedAt: "2026-04-29",
    priority: 5,
    tags: ["Filmtone", "iOS", "App Store", "Fastlane", "Release Engineering"],
    status: "draft",
    evidenceLevel: "production",
  },
  {
    slug: "portfolio-renewal-2026",
    kind: "case-study",
    href: "/journal/portfolio-renewal-2026",
    publishedAt: "2026-04-29",
    priority: 90,
    tags: ["WebGPU", "Shader", "Light Substrate", "Editorial"],
    status: "hold",
    evidenceLevel: "production",
    related: ["journal-typography-wordmark-system"],
  },
  {
    slug: "mobile-safari-touch-controller",
    kind: "engineering-note",
    href: "/journal/mobile-safari-touch-controller",
    publishedAt: "2026-04-29",
    priority: 91,
    tags: ["iOS Safari", "Visual Viewport", "Layout"],
    status: "hold",
    evidenceLevel: "rnd",
  },
  {
    slug: "journal-typography-wordmark-system",
    kind: "study",
    href: "/journal/journal-typography-wordmark-system",
    publishedAt: "2026-04-29",
    priority: 92,
    tags: ["Typography", "Wordmark", "SVG", "Pipeline"],
    status: "hold",
    evidenceLevel: "rnd",
    related: ["portfolio-renewal-2026"],
  },
];

export const motionStudyEntries: readonly JournalEntry[] = [
  {
    slug: "signal-stroke-relay",
    kind: "motion-study",
    href: "/journal/motion-studies/signal-stroke-relay",
    publishedAt: "2026-04-29",
    priority: 1,
    tags: ["Theatre", "Cascade", "Choreography"],
    status: "hold",
    evidenceLevel: "rnd",
  },
  {
    slug: "staged-emphasis-payoff",
    kind: "motion-study",
    href: "/journal/motion-studies/staged-emphasis-payoff",
    publishedAt: "2026-04-29",
    priority: 2,
    tags: ["Pacing", "Emphasis", "Family"],
    status: "hold",
    evidenceLevel: "rnd",
  },
  {
    slug: "boiling-poster-aperture",
    kind: "motion-study",
    href: "/journal/motion-studies/boiling-poster-aperture",
    publishedAt: "2026-04-29",
    priority: 3,
    tags: ["Boil Field", "Displacement", "Reveal"],
    status: "hold",
    evidenceLevel: "rnd",
  },
  {
    slug: "temporal-echo-residue",
    kind: "motion-study",
    href: "/journal/motion-studies/temporal-echo-residue",
    publishedAt: "2026-04-29",
    priority: 4,
    tags: ["Echo", "Decay", "Residue"],
    status: "hold",
    evidenceLevel: "rnd",
  },
];

const byPriority = (a: JournalEntry, b: JournalEntry) =>
  a.priority - b.priority;

export const publishedJournalEntries: readonly JournalEntry[] = [
  ...journalEntries,
]
  .filter((entry) => entry.status === "published")
  .sort(byPriority);

export const publishedMotionStudyEntries: readonly JournalEntry[] = [
  ...motionStudyEntries,
]
  .filter((entry) => entry.status === "published")
  .sort(byPriority);

export function getJournalEntryBySlug(
  slug: string,
): JournalEntry | undefined {
  return journalEntries.find((entry) => entry.slug === slug);
}

export function getMotionStudyBySlug(
  slug: string,
): JournalEntry | undefined {
  return motionStudyEntries.find((entry) => entry.slug === slug);
}

export function getJournalEntriesByKind(
  kind: JournalKind,
): readonly JournalEntry[] {
  return publishedJournalEntries.filter((entry) => entry.kind === kind);
}
