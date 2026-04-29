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
    slug: "portfolio-renewal-2026",
    kind: "case-study",
    href: "/journal/portfolio-renewal-2026",
    publishedAt: "2026-04-29",
    priority: 1,
    tags: ["WebGPU", "Shader", "Light Substrate", "Editorial"],
    status: "published",
    evidenceLevel: "production",
    related: ["journal-typography-wordmark-system"],
  },
  {
    slug: "mobile-safari-touch-controller",
    kind: "engineering-note",
    href: "/journal/mobile-safari-touch-controller",
    publishedAt: "2026-04-29",
    priority: 2,
    tags: ["iOS Safari", "Visual Viewport", "Layout"],
    status: "published",
    evidenceLevel: "rnd",
  },
  {
    slug: "journal-typography-wordmark-system",
    kind: "study",
    href: "/journal/journal-typography-wordmark-system",
    publishedAt: "2026-04-29",
    priority: 3,
    tags: ["Typography", "Wordmark", "SVG", "Pipeline"],
    status: "published",
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
    status: "published",
    evidenceLevel: "rnd",
  },
  {
    slug: "staged-emphasis-payoff",
    kind: "motion-study",
    href: "/journal/motion-studies/staged-emphasis-payoff",
    publishedAt: "2026-04-29",
    priority: 2,
    tags: ["Pacing", "Emphasis", "Family"],
    status: "published",
    evidenceLevel: "rnd",
  },
  {
    slug: "boiling-poster-aperture",
    kind: "motion-study",
    href: "/journal/motion-studies/boiling-poster-aperture",
    publishedAt: "2026-04-29",
    priority: 3,
    tags: ["Boil Field", "Displacement", "Reveal"],
    status: "published",
    evidenceLevel: "rnd",
  },
  {
    slug: "temporal-echo-residue",
    kind: "motion-study",
    href: "/journal/motion-studies/temporal-echo-residue",
    publishedAt: "2026-04-29",
    priority: 4,
    tags: ["Echo", "Decay", "Residue"],
    status: "published",
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
