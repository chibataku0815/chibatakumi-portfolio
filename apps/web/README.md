This is a Next.js 16 portfolio app managed with Bun.

## Getting Started

Install dependencies with Bun:

```bash
bun install
```

Run the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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
