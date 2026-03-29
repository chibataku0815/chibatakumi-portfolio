This is a Next.js 16 portfolio app managed with Bun.

## Getting Started

Install dependencies with Bun:

```bash
bun install
```

Run the development server **from `apps/web`** (Next.js loads `.env.local` from this directory — the same folder as `next.config.ts`):

```bash
cd apps/web
bun run dev
```

If you open the **monorepo root** (`chibatakumi-portfolio/`) in the terminal, use the root script so `cwd` is `apps/web`:

```bash
# from repository root
bun run dev
# or
bun run dev:web
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Film Lab — optional donation env (local)

Put variables in **`apps/web/.env.local`** (not the monorepo root). After changing `NEXT_PUBLIC_*`, restart `next dev`.

Minimal example:

```env
NEXT_PUBLIC_FILM_LAB_DONATION_UI=true
NEXT_PUBLIC_FILM_LAB_STRIPE_SUPPORT_URL=https://buy.stripe.com/5kQbJ1gWV7iwcnjbKkbII03
```

Optional server-runtime keys (same file; picked up by `film-lab/page.tsx`):

```env
FILM_LAB_STRIPE_SUPPORT_URL=https://buy.stripe.com/5kQbJ1gWV7iwcnjbKkbII03
```

Diagnose cwd / `.env.local` presence:

```bash
cd apps/web
bun run dev:context
```

See also `life` repo: `docs/guides/2026-04-01-film-lab-donation-env-debug-and-dev-handoff-full.md`.

Build for production:

```bash
bun run build
```

## Dependency Management

- The source of truth for dependencies is `bun.lock`.
- Do not regenerate `package-lock.json` in `apps/web`.
- When adding or updating packages, use `bun add`, `bun add -d`, or `bun install`.
- Vercel should install and build this app with Bun (`bun install`, `bun run build`).

## Notes

- Tailwind CSS v4 is configured through `postcss.config.mjs` and `src/app/globals.css`.
- If Vercel has custom install or build commands configured, keep them aligned with Bun.
