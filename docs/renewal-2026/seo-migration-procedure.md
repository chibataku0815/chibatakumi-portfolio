# SEO Migration Procedure — Wave 1 IA Renewal (2026-04-25)

> Operational runbook for the URL change introduced by `feat/renewal-2026-phase2-motion-dot` Wave 1.
> Pair with: [`MASTER-HANDOFF-2026-04-25.md`](./MASTER-HANDOFF-2026-04-25.md) and the renewal plan §6.1.

## 1. Why this migration

Wave 1 collapses the legacy 8-section IA into **6 verbs**: `Works / Craft / About / Journal / Experiments / Contact` (plus the standalone `Film Lab` cluster, deferred to Wave 2). The change:

- consolidates `interactive` + `installation` into `Works/*` so visitors stop landing on a dangling section,
- promotes the photography surface from a top-level peer to a typed sub-category of `Works`,
- repositions narrative-only surfaces (`profile` → `about`, `archive` → `journal`, `skills` → `craft`) so the wording matches reader intent,
- moves frame-perfect motion studies from `/motion/reference-works/*` to `/journal/motion-studies/*`, where they belong as documented studies rather than experiment harnesses.

Active experiment surfaces stay at `/experiments/*` (Stream 4-D gallery), unchanged.

Reference: renewal plan §6.1 in `.claude/plans/sequential-thinking-gemini-web-search-f-agile-cocke.md`.

## 2. Old → new path table

| Old path | New path | Redirect type |
|---|---|---|
| `/photography` | `/works/photography` | 301 |
| `/interactive` | `/works` | 301 |
| `/installation` | `/works/installation` | 301 |
| `/motion/reference-works/:slug` | `/journal/motion-studies/:slug` | 301 (dynamic) |
| `/motion` | `/experiments` | 301 |
| `/skills` | `/craft` | 301 |
| `/profile` | `/about` | 301 |
| `/archive` | `/journal` | 301 |

Each row is registered twice in `apps/web/next.config.ts#redirects()` — once as the bare form (`/old`) and once as a locale-prefixed form (`/(en|ja)/old`) — for **18 total entries**. `localePrefix: "as-needed"` means Japanese (default locale) URLs are unprefixed in the wild, while English URLs always carry `/en/`.

`film-lab/*` is deliberately **out of scope**. Wave 2 (D5.1) will migrate the Filmtone surfaces and append redirects there.

## 3. Search Console retirement procedure

Run within 24 hours of the Wave 1 production deploy.

1. **Submit the updated sitemap.**
   - Console → `Sitemaps` → resubmit `https://www.chibatakumi.studio/sitemap.xml`.
   - Verify the report shows the new URLs (`/works/*`, `/craft`, `/about`, `/journal`, `/journal/motion-studies/*`) and no longer lists the retired ones.
2. **Request removal of the retired URLs.**
   - Console → `Removals` → `New Request` → `Temporarily remove URL`.
   - Submit each retired path with the **"Remove this URL only"** option (the redirect handles the long-tail crawl):
     - `/photography`, `/interactive`, `/installation`, `/motion`, `/motion/reference-works/*` (use the **"Remove all URLs with this prefix"** variant for this one), `/skills`, `/profile`, `/archive`.
   - Repeat for the `https://www.chibatakumi.studio/en/...` mirrors.
3. **Use the URL Inspection tool** on 2-3 representative new URLs (`/works/photography`, `/journal/motion-studies/anchored-progress-resolve`, `/craft`) and click `Request Indexing` to seed crawler discovery.
4. **Monitor for 4 weeks.** Track:
   - Coverage report → number of "Page with redirect" entries should plateau and decline as Google consolidates signals.
   - Performance report → confirm impressions migrate from old to new URLs (group by Page).
   - Crawl stats → make sure no crawl spike on retired URLs after week 2 (would indicate redirect leakage).

If after 4 weeks impressions have not migrated, escalate: re-check the `Location` header (must be a clean `301`, not a `302` or meta-refresh) and ensure the destination URL is reachable and rendering meaningful content.

## 4. `<link rel="canonical">` guarantees in the new routes

Every new IA route exports a `metadata` block with `alternates.canonical` set to a locale-aware absolute URL pulled from `portfolioData.site.siteUrl` (`https://www.chibatakumi.studio`):

```ts
alternates: {
  canonical: isJa
    ? `${BASE_URL}/works/photography`
    : `${BASE_URL}/en/works/photography`,
  languages: {
    ja: `${BASE_URL}/works/photography`,
    en: `${BASE_URL}/en/works/photography`,
  },
},
```

Routes covered (D5.7 acceptance):

- `/[locale]/works/photography`
- `/[locale]/works/commercial`
- `/[locale]/works/installation`
- `/[locale]/craft`
- `/[locale]/about`
- `/[locale]/journal`
- `/[locale]/journal/motion-studies/{6 static slugs}` *(canonical inherited via parent route metadata; per-slug overrides land in Wave 2 once each study has its own description)*

`hreflang` pairs (`ja` ↔ `en`) ride on the `languages` map, so Search Console picks up the locale alternates without extra HTML.

## 5. Rollback plan

If indexing collapses or a redirect loop is observed:

1. Revert `apps/web/next.config.ts#redirects()` to the previous commit (Wave 1 only added the function — removing it is non-destructive).
2. Re-deploy. The new IA pages stay live but old paths become 404 — accept the temporary regression, then re-test the redirect rules in a preview branch.
3. **Do not** restore the deleted route directories from `git revert` without first checking that `[locale]/works/{photography,commercial,installation}` still resolve — duplicate routes would produce a Next.js routing conflict.

## 6. Open items for Wave 2 (D5.1)

- Filmtone path redirects (8 entries): `/film-lab` and the 7 child paths land in Wave 2 once the marketing rename completes.
- Per-motion-study `metadata` overrides (title + description per slug) — currently the static page exports default metadata only.
- Sitemap entries for any new Wave 2 surfaces (Filmtone product hub re-shuffle).
