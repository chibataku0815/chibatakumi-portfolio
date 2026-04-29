import type { MetadataRoute } from "next";
import {
  publishedJournalEntries,
  publishedMotionStudyEntries,
} from "@/shared/data/journal";

const BASE_URL = "https://www.chibatakumi.studio";

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
 * Journal — first wave: index plus three editorial articles plus the motion-studies
 * hub and four motion-study children. Routes are derived from the journal data
 * registry, so `status: "published"` entries are the only ones that surface.
 * Held / drafted entries do not appear until they pass the public quality gate
 * and are flipped to `published` in the registry.
 */
type StaticPage = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const staticPages: readonly StaticPage[] = [
  { path: "", changeFrequency: "monthly", priority: 1 },
  { path: "/experiments", changeFrequency: "monthly", priority: 0.9 },
  { path: "/experiments/dot", changeFrequency: "monthly", priority: 0.8 },
  { path: "/experiments/grid", changeFrequency: "monthly", priority: 0.8 },
  { path: "/experiments/flow", changeFrequency: "monthly", priority: 0.8 },
  { path: "/photography", changeFrequency: "monthly", priority: 0.8 },
  { path: "/filmtone", changeFrequency: "monthly", priority: 0.8 },
  { path: "/filmtone/download", changeFrequency: "monthly", priority: 0.7 },
  { path: "/filmtone/release-notes", changeFrequency: "monthly", priority: 0.6 },
  { path: "/filmtone/roadmap", changeFrequency: "monthly", priority: 0.6 },
  { path: "/filmtone/signature", changeFrequency: "monthly", priority: 0.6 },
  { path: "/filmtone/support", changeFrequency: "yearly", priority: 0.5 },
  { path: "/filmtone/privacy", changeFrequency: "yearly", priority: 0.4 },
  { path: "/journal", changeFrequency: "monthly", priority: 0.7 },
  { path: "/journal/motion-studies", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.6 },
];

const journalArticlePages: readonly StaticPage[] = publishedJournalEntries.map(
  (entry) => ({
    path: entry.href,
    changeFrequency: "monthly" as const,
    priority: entry.kind === "case-study" ? 0.7 : 0.6,
  }),
);

const motionStudyPages: readonly StaticPage[] = publishedMotionStudyEntries.map(
  (entry) => ({
    path: entry.href,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }),
);

const pages: readonly StaticPage[] = [
  ...staticPages,
  ...journalArticlePages,
  ...motionStudyPages,
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
