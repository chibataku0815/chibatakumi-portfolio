import type { MetadataRoute } from "next";

const BASE_URL = "https://www.chibatakumi.studio";

const pages = [
  { path: "", changeFrequency: "monthly" as const, priority: 1 },
  { path: "/skills", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/photography", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/profile", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/contact", changeFrequency: "yearly" as const, priority: 0.6 },
  { path: "/journal", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/works", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/interactive", changeFrequency: "monthly" as const, priority: 0.8 },
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
