import type { MetadataRoute } from "next";

const BASE_URL = "https://www.chibatakumi.studio";

const motionStudySlugs = [
  "anchored-progress-resolve",
  "boiling-poster-aperture",
  "motif-loop-background",
  "signal-stroke-relay",
  "staged-emphasis-payoff",
  "temporal-echo-residue",
] as const;

/**
 * Renewal 2026 reset (parent plan §2.1, §3.1, §7.1) — sitemap publishes only
 * canonical IA surfaces whose content ledger is closed. Hollow / placeholder
 * routes are intentionally excluded until the package that owns them lands
 * real content; that package will re-register the route here.
 *
 * Package 4 (Motion Works) re-added `/experiments/grid` and
 * `/experiments/flow` after their destination clients were rebuilt on
 * standalone mount entries (motion-grid `mountMotionGridApp` / motion-flow
 * `mountMotionFlowApp`); the routes are no longer placeholders.
 *
 * Package 5 (Satellite Canonical Routes) landed `/photography` and `/filmtone`
 * as canonical wrapper routes, along with selected Filmtone child routes whose
 * content ledger is closed. Post-action confirmation routes (`/filmtone/download/complete`,
 * `/filmtone/support/thanks`) and the OG image route (`/filmtone/og`) are excluded
 * per sitemap convention: confirmation pages are not indexable entry points, and
 * OG routes are metadata image handlers, not public pages.
 *
 * Excluded with reason:
 * - `/works/*`, `/about`, `/craft` — legacy surfaces that 301-redirect via
 *   `next.config.ts` and must never appear here.
 *
 * `/journal` is a real index (Core Content package, parent plan §7.2) and the
 * `/journal/motion-studies/*` routes remain registered as first-class
 * destinations.
 */
const pages = [
  { path: "", changeFrequency: "monthly" as const, priority: 1 },
  { path: "/experiments", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/experiments/dot", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/experiments/grid", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/experiments/flow", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/photography", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/filmtone", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/filmtone/download", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/filmtone/release-notes", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/filmtone/roadmap", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/filmtone/signature", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/filmtone/support", changeFrequency: "yearly" as const, priority: 0.5 },
  { path: "/filmtone/privacy", changeFrequency: "yearly" as const, priority: 0.4 },
  { path: "/journal", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/contact", changeFrequency: "yearly" as const, priority: 0.6 },
  ...motionStudySlugs.map((slug) => ({
    path: `/journal/motion-studies/${slug}`,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  })),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((page) => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
    alternates: {
      languages: {
        ja: `${BASE_URL}${page.path}`,
        en: `${BASE_URL}/en${page.path}`,
      },
    },
  }));
}
