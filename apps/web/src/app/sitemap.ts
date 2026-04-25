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
 * Wave 1 IA migration (D5.7) — sitemap reflects the new information
 * architecture. Old routes (/photography, /interactive, /installation,
 * /motion, /motion/reference-works/*, /skills, /profile, /archive) are
 * removed; they 301-redirect via `next.config.ts#redirects()`.
 *
 * `/film-lab/*` entries are deliberately preserved — Wave 2 (D5.1) will
 * migrate Filmtone surfaces and update this sitemap accordingly.
 */
const pages = [
  { path: "", changeFrequency: "monthly" as const, priority: 1 },
  // New IA core
  { path: "/works", changeFrequency: "monthly" as const, priority: 0.9 },
  {
    path: "/works/photography",
    changeFrequency: "weekly" as const,
    priority: 0.9,
  },
  {
    path: "/works/commercial",
    changeFrequency: "monthly" as const,
    priority: 0.7,
  },
  {
    path: "/works/installation",
    changeFrequency: "monthly" as const,
    priority: 0.7,
  },
  { path: "/craft", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/journal", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly" as const, priority: 0.6 },
  // Motion studies (static reference works)
  ...motionStudySlugs.map((slug) => ({
    path: `/journal/motion-studies/${slug}`,
    changeFrequency: "yearly" as const,
    priority: 0.5,
  })),
  // Filmtone (Wave 2 will migrate these)
  { path: "/film-lab", changeFrequency: "monthly" as const, priority: 0.8 },
  {
    path: "/film-lab/download",
    changeFrequency: "monthly" as const,
    priority: 0.7,
  },
  {
    path: "/film-lab/release-notes",
    changeFrequency: "monthly" as const,
    priority: 0.5,
  },
  {
    path: "/film-lab/roadmap",
    changeFrequency: "monthly" as const,
    priority: 0.5,
  },
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
